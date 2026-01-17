import { Database } from './database'

export type Artist = Database['public']['Tables']['artists']['Row']
export type Tour = Database['public']['Tables']['tours']['Row']
export type TourCountryConfig = Database['public']['Tables']['tour_country_configs']['Row']
export type Organization = Database['public']['Tables']['org']['Row']
export type RouterAnalytics = Database['public']['Tables']['router_analytics']['Row']
export type RouterOrgOverride = Database['public']['Tables']['router_org_overrides']['Row']
export type RouterConfig = Database['public']['Tables']['router_config']['Row']

export interface RouterRequest {
  artistSlug: string
  countryCode?: string
}

export interface RouterResult {
  success: boolean
  destinationUrl: string
  orgId?: string
  tourId?: string
  reasonCode?: ReasonCode
  analytics: {
    artist_slug: string
    country_code?: string
    org_id?: string
    tour_id?: string
    reason_code?: string
    destination_url: string
  }
}

// Reason codes for analytics - "success" for successful routing, others for fallback paths
export type ReasonCode =
  | 'success'
  | 'artist_not_found'
  | 'no_active_tour'
  | 'country_not_configured'
  | 'org_not_approved'
  | 'org_paused'

export interface TourWithConfigs extends Tour {
  tour_country_configs: (TourCountryConfig & { org: Organization })[]
}

export interface ArtistWithTours extends Artist {
  tours: TourWithConfigs[]
}
