import { supabaseAdmin } from "./supabase";
import {
  RouterRequest,
  RouterResult,
  FallbackReason,
  TourWithConfigs,
} from "@/app/types/router";

const DEFAULT_FALLBACK_URL = "https://musicdeclares.net/amplify";

export async function routeRequest(
  request: RouterRequest,
): Promise<RouterResult> {
  const { artistSlug, countryCode, userAgent, ipAddress } = request;

  try {
    // Step 1: Find the artist
    const { data: artist, error: artistError } = await supabaseAdmin
      .from("artists")
      .select("*")
      .eq("slug", artistSlug)
      .eq("active", true)
      .single();

    if (artistError || !artist) {
      return createFallbackResult(
        request,
        "artist_not_found",
        `${DEFAULT_FALLBACK_URL}?ref=unknown_artist`,
      );
    }

    // Step 2: Find active tour (considering pre/post windows)
    const now = new Date();

    // Note: We join org_public_view (not org) to match production access patterns.
    // The view only exposes approved orgs and hides sensitive fields.
    const { data: tours, error: toursError } = await supabaseAdmin
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
      .eq("active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("start_date", { ascending: false });

    if (toursError) {
      throw new Error(`Database error: ${toursError.message}`);
    }

    if (!tours || tours.length === 0) {
      return createFallbackResult(
        request,
        "no_active_tour",
        `${DEFAULT_FALLBACK_URL}?artist=${encodeURIComponent(artist.name)}&ref=no_tour`,
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
        "country_not_configured",
        `${DEFAULT_FALLBACK_URL}?artist=${encodeURIComponent(artist.name)}&ref=no_country`,
        activeTour.id,
        artist.id,
      );
    }

    const countryConfig = activeTour.tour_country_configs.find(
      (config) =>
        config.country_code.toLowerCase() === countryCode.toLowerCase() &&
        config.active,
    );

    if (!countryConfig) {
      return createFallbackResult(
        request,
        "country_not_configured",
        `${DEFAULT_FALLBACK_URL}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=country_not_supported`,
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
        "org_not_approved",
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=org_not_approved`,
        fallbackUrl,
        activeTour.id,
        artist.id,
      );
    }

    // Check router_org_overrides table for router-specific controls
    const { data: orgOverride } = await supabaseAdmin
      .from("router_org_overrides")
      .select("enabled")
      .eq("org_id", organization.id)
      .single();

    // If override exists and is disabled, route to fallback
    if (orgOverride && !orgOverride.enabled) {
      return createFallbackResult(
        request,
        "org_paused",
        `${DEFAULT_FALLBACK_URL}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=org_paused`,
        activeTour.id,
        artist.id,
      );
    }

    if (!organization.website) {
      return createFallbackResult(
        request,
        "org_no_website",
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=no_org_website`,
        fallbackUrl,
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
        user_agent: userAgent,
        ip_address: ipAddress,
      },
    };

    // Log analytics
    await logAnalytics(result.analytics);

    return result;
  } catch (error) {
    console.error("Router error:", error);
    return createFallbackResult(
      request,
      "artist_not_found", // Generic fallback for unexpected errors
      `${DEFAULT_FALLBACK_URL}?ref=error`,
    );
  }
}

function createFallbackResult(
  request: RouterRequest,
  reason: FallbackReason,
  fallbackUrl: string,
  tourId?: string,
  artistId?: string,
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
      fallback_reason: reason,
      destination_url: fallbackUrl,
      user_agent: request.userAgent,
      ip_address: request.ipAddress,
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
    await supabaseAdmin.from("router_analytics").insert(analytics);
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

export function getClientIP(request: Request): string | undefined {
  // Try various headers for client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  return undefined;
}
