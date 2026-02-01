import { supabaseAdmin } from "./supabase";
import {
  RouterRequest,
  RouterResult,
  FallbackReason,
  TourWithConfigs,
  Artist,
} from "@/app/types/router";
import { Database } from "@/app/types/database";

type RouterOrgOverride =
  Database["public"]["Tables"]["router_org_overrides"]["Row"];
type RouterAnalyticsInsert =
  Database["public"]["Tables"]["router_analytics"]["Insert"];

const DEFAULT_FALLBACK_URL = "https://musicdeclares.net/amplify";

export async function routeRequest(
  request: RouterRequest,
): Promise<RouterResult> {
  const { artistSlug, countryCode } = request;

  try {
    // Step 1: Find the artist
    const { data: artist, error: artistError } = (await supabaseAdmin
      .from("artists")
      .select("*")
      .eq("slug", artistSlug)
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
    // Use ISO date string (YYYY-MM-DD) for DATE column comparison
    const today = new Date().toISOString().split("T")[0];

    // Note: We join org_public_view (not org) to match production access patterns.
    // The view only exposes approved orgs and hides sensitive fields.
    const { data: tours, error: toursError } = (await supabaseAdmin
      .from("tours")
      .select(
        `
        *,
        tour_country_configs (
          *,
          org:org_public_view (*)
        )
      `,
      )
      .eq("artist_id", artist.id)
      .eq("enabled", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("start_date", { ascending: false })) as {
      data: TourWithConfigs[] | null;
      error: unknown;
    };

    if (toursError) {
      throw new Error(`Database error: ${(toursError as Error).message}`);
    }

    if (!tours || tours.length === 0) {
      return createFallbackResult(
        request,
        "no_tour",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.slug}&ref=no_tour`,
        undefined,
        artist.id,
      );
    }

    // Use the most recent active tour
    const activeTour = tours[0] as TourWithConfigs;

    // Step 3: Check country configuration
    if (!countryCode) {
      return createFallbackResult(
        request,
        "no_country",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.slug}&ref=no_country`,
        activeTour.id,
        artist.id,
      );
    }

    const countryConfig = activeTour.tour_country_configs.find(
      (config) =>
        config.country_code.toLowerCase() === countryCode.toLowerCase() &&
        config.enabled,
    );

    if (!countryConfig) {
      return createFallbackResult(
        request,
        "country_not_supported",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.slug}&country=${countryCode}&ref=country_not_supported`,
        activeTour.id,
        artist.id,
      );
    }

    // Step 4: Check organization status
    // Note: We query org_public_view which only returns approved orgs.
    // If the org isn't approved, it won't be in the view and will be null.
    const organization = countryConfig.org;

    if (!organization) {
      // Org not in view = not approved or doesn't exist
      return createFallbackResult(
        request,
        "org_not_found",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.slug}&country=${countryCode}&ref=org_not_found`,
        activeTour.id,
        artist.id,
      );
    }

    // Check router_org_overrides table for router-specific controls
    const { data: orgOverride } = (await supabaseAdmin
      .from("router_org_overrides")
      .select("enabled")
      .eq("org_id", organization.id)
      .single()) as {
      data: Pick<RouterOrgOverride, "enabled"> | null;
      error: unknown;
    };

    // If override exists and is disabled, route to fallback
    if (orgOverride && !orgOverride.enabled) {
      return createFallbackResult(
        request,
        "org_paused",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.slug}&country=${countryCode}&ref=org_paused`,
        activeTour.id,
        artist.id,
      );
    }

    if (!organization.website) {
      return createFallbackResult(
        request,
        "org_no_website",
        `${DEFAULT_FALLBACK_URL}?artist=${artist.slug}&country=${countryCode}&ref=org_no_website`,
        activeTour.id,
        artist.id,
      );
    }

    // Step 5: Success! Route to organization
    const result: RouterResult = {
      success: true,
      destinationUrl: organization.website,
      orgId: organization.id,
      tourId: activeTour.id,
      analytics: {
        artist_slug: artistSlug,
        country_code: countryCode,
        org_id: organization.id,
        tour_id: activeTour.id,
        destination_url: organization.website,
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

function createFallbackResult(
  request: RouterRequest,
  reason: FallbackReason,
  fallbackUrl: string,
  tourId?: string,
  _artistId?: string,
): RouterResult {
  const result: RouterResult = {
    success: false,
    destinationUrl: fallbackUrl,
    fallbackReason: reason,
    tourId,
    analytics: {
      artist_slug: request.artistSlug,
      country_code: request.countryCode,
      tour_id: tourId,
      destination_url: fallbackUrl,
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
      artist_slug: analytics.artist_slug,
      country_code: analytics.country_code,
      org_id: analytics.org_id,
      tour_id: analytics.tour_id,
      destination_url: analytics.destination_url,
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
