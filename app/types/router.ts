import { Database } from "./database";

// Type exports for renamed tables
export type Artist = Database["public"]["Tables"]["router_artists"]["Row"];
export type Tour = Database["public"]["Tables"]["router_tours"]["Row"];
export type TourOverride =
  Database["public"]["Tables"]["router_tour_overrides"]["Row"];
export type CountryDefault =
  Database["public"]["Tables"]["router_country_defaults"]["Row"];
export type RouterUser = Database["public"]["Tables"]["router_users"]["Row"];
export type Organization = Database["public"]["Tables"]["org"]["Row"];
export type RouterAnalytics =
  Database["public"]["Tables"]["router_analytics"]["Row"];
export type RouterOrgOverride =
  Database["public"]["Tables"]["router_org_overrides"]["Row"];
export type OrgProfile =
  Database["public"]["Tables"]["router_org_profiles"]["Row"];
export type Invite = Database["public"]["Tables"]["router_invites"]["Row"];

// View types
export type OrgPublicView =
  Database["public"]["Views"]["org_public_view"]["Row"];

export interface RouterRequest {
  artistHandle: string;
  countryCode?: string;
}

export interface RouterResult {
  success: boolean;
  destinationUrl: string;
  orgId?: string;
  tourId?: string;
  fallbackReason?: FallbackReason;
  analytics: {
    artist_handle: string;
    country_code?: string;
    org_id?: string;
    tour_id?: string;
    destination_url: string;
    override_org_fallthrough?: boolean;
    attempted_override_org_id?: string;
  };
}

// These values are used as ref= query params in destination URLs
// and extracted into fallback_ref column for analytics
export type FallbackReason =
  | "artist_not_found"
  | "no_tour"
  | "no_country"
  | "org_not_found"
  | "org_paused"
  | "org_no_website"
  | "org_not_specified" // No MDE recommendation or artist override for this country
  | "error";

export interface TourWithOverrides extends Tour {
  // org can be null if the org is not in org_public_view (not approved)
  router_tour_overrides: (TourOverride & { org: OrgPublicView | null })[];
}

export interface ArtistWithTours extends Artist {
  router_tours: TourWithOverrides[];
}

// Organization directory types
export interface DirectoryOrganization {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  mission: string;
  fanActions: string[];
  website: string;
  ctaUrl: string;
  ctaText: string;
  imageUrl: string;
}
