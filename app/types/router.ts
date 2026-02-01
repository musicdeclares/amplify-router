import { Database } from "./database";

export type Artist = Database["public"]["Tables"]["artists"]["Row"];
export type Tour = Database["public"]["Tables"]["tours"]["Row"];
export type TourCountryConfig =
  Database["public"]["Tables"]["tour_country_configs"]["Row"];
export type Organization = Database["public"]["Tables"]["org"]["Row"];
export type RouterAnalytics =
  Database["public"]["Tables"]["router_analytics"]["Row"];

export interface RouterRequest {
  artistSlug: string;
  countryCode?: string;
}

export interface RouterResult {
  success: boolean;
  destinationUrl: string;
  orgId?: string;
  tourId?: string;
  fallbackReason?: FallbackReason;
  analytics: {
    artist_slug: string;
    country_code?: string;
    org_id?: string;
    tour_id?: string;
    destination_url: string;
    // fallback info is derived from destination_url ref= param via generated column
  };
}

// These values are used as ref= query params in destination URLs
// and extracted into fallback_ref column for analytics
export type FallbackReason =
  | "artist_not_found"
  | "no_tour"
  | "no_country"
  | "country_not_supported"
  | "org_not_found"
  | "org_paused"
  | "org_no_website"
  | "error";

export interface TourWithConfigs extends Tour {
  // org can be null if the org is not in org_public_view (not approved)
  tour_country_configs: (TourCountryConfig & { org: Organization | null })[];
}

export interface ArtistWithTours extends Artist {
  tours: TourWithConfigs[];
}
