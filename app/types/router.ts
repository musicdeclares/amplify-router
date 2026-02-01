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
  fallbackReason?: string;
  analytics: {
    artist_slug: string;
    country_code?: string;
    org_id?: string;
    tour_id?: string;
    fallback_reason?: string;
    destination_url: string;
  };
}

export type FallbackReason =
  | "artist_not_found"
  | "no_active_tour"
  | "country_not_configured"
  | "org_not_approved"
  | "org_paused"
  | "org_no_website";

export interface TourWithConfigs extends Tour {
  // org can be null if the org is not in org_public_view (not approved)
  tour_country_configs: (TourCountryConfig & { org: Organization | null })[];
}

export interface ArtistWithTours extends Artist {
  tours: TourWithConfigs[];
}
