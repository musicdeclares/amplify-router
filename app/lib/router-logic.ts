import { supabaseAdmin } from "./supabase";
import {
  RouterRequest,
  RouterResult,
  FallbackReason,
  TourWithOverrides,
  Artist,
  OrgPublicView,
} from "@/app/types/router";
import { Database } from "@/app/types/database";

type RouterOrgOverride =
  Database["public"]["Tables"]["router_org_overrides"]["Row"];
type RouterAnalyticsInsert =
  Database["public"]["Tables"]["router_analytics"]["Insert"];
type CountryDefault =
  Database["public"]["Tables"]["router_country_defaults"]["Row"];

interface CountryDefaultWithOrg extends CountryDefault {
  org: OrgPublicView | null;
}

const DEFAULT_FALLBACK_URL = "https://musicdeclares.net/amplify";

export async function routeRequest(
  request: RouterRequest,
): Promise<RouterResult> {
  const { artistHandle, countryCode } = request;

  try {
    // Step 1: Find the artist
    const { data: artist, error: artistError } = (await supabaseAdmin
      .from("router_artists")
      .select("*")
      .eq("handle", artistHandle)
      .eq("enabled", true)
      .single()) as { data: Artist | null; error: unknown };

    if (artistError || !artist) {
      return createFallbackResult(
        request,
        "artist_not_found",
        `${DEFAULT_FALLBACK_URL}?ref=artist_not_found`,
      );
    }

    // Step 2: Find active tour (considering pre/post windows)
    // Use UTC date string (YYYY-MM-DD) for consistent comparisons across timezones
    const todayStr = new Date().toISOString().split("T")[0];

    // Note: We join org_public_view (not org) to match production access patterns.
    // The view only exposes approved orgs and hides sensitive fields.
    // Fetch all enabled tours for this artist, then filter by effective window in JS
    const { data: tours, error: toursError } = (await supabaseAdmin
      .from("router_tours")
      .select(
        `
        *,
        router_tour_overrides (
          *,
          org:org_public_view (*)
        )
      `,
      )
      .eq("artist_id", artist.id)
      .eq("enabled", true)
      .order("start_date", { ascending: false })) as {
      data: TourWithOverrides[] | null;
      error: unknown;
    };

    if (toursError) {
      throw new Error(`Database error: ${(toursError as Error).message}`);
    }

    // Filter tours by effective window (start_date - pre_window to end_date + post_window)
    const activeToursWithWindows = (tours || []).filter((tour) => {
      // Parse tour dates and calculate effective window
      const startDate = new Date(tour.start_date + "T00:00:00Z");
      const endDate = new Date(tour.end_date + "T00:00:00Z");

      // Calculate effective window
      const effectiveStart = new Date(startDate);
      effectiveStart.setUTCDate(
        effectiveStart.getUTCDate() - (tour.pre_tour_window_days || 0),
      );

      const effectiveEnd = new Date(endDate);
      effectiveEnd.setUTCDate(
        effectiveEnd.getUTCDate() + (tour.post_tour_window_days || 0),
      );

      // Convert to date strings for comparison (avoids timezone issues)
      const effectiveStartStr = effectiveStart.toISOString().split("T")[0];
      const effectiveEndStr = effectiveEnd.toISOString().split("T")[0];

      // Check if today falls within the effective window
      return todayStr >= effectiveStartStr && todayStr <= effectiveEndStr;
    });

    if (activeToursWithWindows.length === 0) {
      return createFallbackResult(
        request,
        "no_tour",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.handle}&ref=no_tour`,
        undefined,
        artist.id,
      );
    }

    // Use the most recent active tour
    const activeTour = activeToursWithWindows[0] as TourWithOverrides;

    // Step 3: Check country configuration
    if (!countryCode) {
      return createFallbackResult(
        request,
        "no_country",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.handle}&ref=no_country`,
        activeTour.id,
        artist.id,
      );
    }

    // Step 4: Check for artist-selected org override
    const artistOverride = activeTour.router_tour_overrides.find(
      (override) =>
        override.country_code.toLowerCase() === countryCode.toLowerCase() &&
        override.enabled,
    );

    let selectedOrg: OrgPublicView | null = null;
    let overrideOrgFallthrough = false;
    let attemptedOverrideOrgId: string | undefined;

    if (artistOverride) {
      if (artistOverride.org) {
        // Artist-selected org is valid and in org_public_view
        selectedOrg = artistOverride.org;
      } else if (artistOverride.org_id) {
        // Artist selected an org, but it's not in org_public_view (not approved or removed)
        // Fall through to MDE recommendation instead of stranding the fan
        overrideOrgFallthrough = true;
        attemptedOverrideOrgId = artistOverride.org_id;
      }
    }

    // Step 5: If no artist selection, check MDE country defaults
    if (!selectedOrg) {
      const mdeRecommendation = await getMDERecommendation(countryCode);

      if (mdeRecommendation?.org) {
        selectedOrg = mdeRecommendation.org;
      } else if (mdeRecommendation && !mdeRecommendation.org) {
        // MDE has a recommendation but org is not in org_public_view
        return createFallbackResult(
          request,
          "org_not_found",
          `${DEFAULT_FALLBACK_URL}?artist=${artist.handle}&country=${countryCode}&ref=org_not_found`,
          activeTour.id,
          artist.id,
          overrideOrgFallthrough,
          attemptedOverrideOrgId,
        );
      }
    }

    // Step 6: No org found for this country
    if (!selectedOrg) {
      return createFallbackResult(
        request,
        "org_not_specified",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.handle}&country=${countryCode}&ref=org_not_specified`,
        activeTour.id,
        artist.id,
        overrideOrgFallthrough,
        attemptedOverrideOrgId,
      );
    }

    // Step 7: Check router_org_overrides table for router-specific controls
    const { data: orgOverride } = (await supabaseAdmin
      .from("router_org_overrides")
      .select("enabled")
      .eq("org_id", selectedOrg.id)
      .single()) as {
      data: Pick<RouterOrgOverride, "enabled"> | null;
      error: unknown;
    };

    // If override exists and is disabled, route to fallback
    if (orgOverride && !orgOverride.enabled) {
      return createFallbackResult(
        request,
        "org_paused",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.handle}&country=${countryCode}&ref=org_paused`,
        activeTour.id,
        artist.id,
        overrideOrgFallthrough,
        attemptedOverrideOrgId,
      );
    }

    if (!selectedOrg.website) {
      return createFallbackResult(
        request,
        "org_no_website",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.handle}&country=${countryCode}&ref=org_no_website`,
        activeTour.id,
        artist.id,
        overrideOrgFallthrough,
        attemptedOverrideOrgId,
      );
    }

    // Step 8: Success! Route to organization
    const result: RouterResult = {
      success: true,
      destinationUrl: selectedOrg.website,
      orgId: selectedOrg.id,
      tourId: activeTour.id,
      analytics: {
        artist_handle: artistHandle,
        country_code: countryCode,
        org_id: selectedOrg.id,
        tour_id: activeTour.id,
        destination_url: selectedOrg.website,
        override_org_fallthrough: overrideOrgFallthrough,
        attempted_override_org_id: attemptedOverrideOrgId,
      },
    };

    // Log analytics
    await logAnalytics(result.analytics);

    return result;
  } catch (error) {
    console.error("Router error:", error);
    return createFallbackResult(
      request,
      "error",
      `${DEFAULT_FALLBACK_URL}?ref=error`,
    );
  }
}

async function getMDERecommendation(
  countryCode: string,
): Promise<CountryDefaultWithOrg | null> {
  const today = new Date().toISOString().split("T")[0];

  // First check for date-specific recommendation (has effective_from set)
  const { data: dateSpecific } = (await supabaseAdmin
    .from("router_country_defaults")
    .select(
      `
      *,
      org:org_public_view (*)
    `,
    )
    .eq("country_code", countryCode.toUpperCase())
    .not("effective_from", "is", null)
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
    .limit(1)
    .single()) as { data: CountryDefaultWithOrg | null; error: unknown };

  if (dateSpecific) {
    return dateSpecific;
  }

  // Fall back to permanent recommendation (effective_from is null)
  const { data: permanent } = (await supabaseAdmin
    .from("router_country_defaults")
    .select(
      `
      *,
      org:org_public_view (*)
    `,
    )
    .eq("country_code", countryCode.toUpperCase())
    .is("effective_from", null)
    .limit(1)
    .single()) as { data: CountryDefaultWithOrg | null; error: unknown };

  return permanent;
}

function createFallbackResult(
  request: RouterRequest,
  reason: FallbackReason,
  fallbackUrl: string,
  tourId?: string,
  _artistId?: string,
  overrideOrgFallthrough?: boolean,
  attemptedOverrideOrgId?: string,
): RouterResult {
  const result: RouterResult = {
    success: false,
    destinationUrl: fallbackUrl,
    fallbackReason: reason,
    tourId,
    analytics: {
      artist_handle: request.artistHandle,
      country_code: request.countryCode,
      tour_id: tourId,
      destination_url: fallbackUrl,
      override_org_fallthrough: overrideOrgFallthrough,
      attempted_override_org_id: attemptedOverrideOrgId,
    },
  };

  // Log analytics (fire and forget)
  logAnalytics(result.analytics).catch(console.error);

  return result;
}

async function logAnalytics(
  analytics: RouterResult["analytics"],
): Promise<void> {
  try {
    const insertData: RouterAnalyticsInsert = {
      artist_handle: analytics.artist_handle,
      country_code: analytics.country_code,
      org_id: analytics.org_id,
      tour_id: analytics.tour_id,
      destination_url: analytics.destination_url,
      override_org_fallthrough: analytics.override_org_fallthrough,
      attempted_override_org_id: analytics.attempted_override_org_id,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("router_analytics") as any).insert(insertData);
  } catch (error) {
    console.error("Analytics logging error:", error);
    // Don't throw - analytics failures shouldn't break routing
  }
}

export function getCountryFromRequest(request: Request): string | undefined {
  // Try Vercel's geo headers first
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry && vercelCountry !== "unknown") {
    return vercelCountry;
  }

  // Try Cloudflare headers
  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") {
    return cfCountry;
  }

  // No reliable country detection available
  return undefined;
}
