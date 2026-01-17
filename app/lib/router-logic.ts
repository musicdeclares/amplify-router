import { supabaseAdmin } from './supabase'
import { RouterRequest, RouterResult, ReasonCode, TourWithConfigs, Artist, Tour, RouterConfig } from '@/app/types/router'

const DEFAULT_FALLBACK_URL = 'https://musicdeclares.net/amplify'

// Cache for fallback URL (refreshed periodically)
let cachedFallbackUrl: string | null = null
let fallbackUrlCacheTime = 0
const CACHE_TTL_MS = 60000 // 1 minute

async function getFallbackUrl(): Promise<string> {
  const now = Date.now()
  if (cachedFallbackUrl && now - fallbackUrlCacheTime < CACHE_TTL_MS) {
    return cachedFallbackUrl
  }

  try {
    const { data } = await supabaseAdmin
      .from('router_config')
      .select('value')
      .eq('key', 'fallback_url')
      .single() as { data: RouterConfig | null; error: unknown }

    if (data?.value) {
      cachedFallbackUrl = data.value
      fallbackUrlCacheTime = now
      return data.value
    }
  } catch {
    // Fall through to default
  }

  return DEFAULT_FALLBACK_URL
}

export async function routeRequest(request: RouterRequest): Promise<RouterResult> {
  const { artistSlug, countryCode } = request
  const fallbackUrl = await getFallbackUrl()

  try {
    // Step 1: Find the artist
    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artists')
      .select('*')
      .eq('slug', artistSlug)
      .eq('enabled', true)
      .single() as { data: Artist | null; error: unknown }

    if (artistError || !artist) {
      return createFallbackResult(
        request,
        'artist_not_found',
        `${fallbackUrl}?ref=unknown_artist`,
        fallbackUrl
      )
    }

    // Step 2: Find active tour (considering pre/post windows)
    const now = new Date()

    const { data: tours, error: toursError } = await supabaseAdmin
      .from('tours')
      .select(`
        *,
        tour_country_configs (
          *,
          org (*)
        )
      `)
      .eq('artist_id', artist.id)
      .eq('enabled', true)
      .order('start_date', { ascending: false }) as { data: TourWithConfigs[] | null; error: { message: string } | null }

    if (toursError) {
      throw new Error(`Database error: ${toursError.message}`)
    }

    // Filter tours by active window (start_date - pre_window to end_date + post_window)
    const activeTours = (tours || []).filter((tour: Tour) => {
      const startDate = new Date(tour.start_date)
      const endDate = new Date(tour.end_date)

      // Calculate active window
      const activeStart = new Date(startDate)
      activeStart.setDate(activeStart.getDate() - (tour.pre_tour_window_days || 0))

      const activeEnd = new Date(endDate)
      activeEnd.setDate(activeEnd.getDate() + (tour.post_tour_window_days || 0))

      return now >= activeStart && now <= activeEnd
    })

    if (activeTours.length === 0) {
      return createFallbackResult(
        request,
        'no_active_tour',
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&ref=no_tour`,
        fallbackUrl,
        undefined,
        artist.id
      )
    }

    // Use the most recent active tour
    const activeTour = activeTours[0] as TourWithConfigs

    // Step 3: Check country configuration
    if (!countryCode) {
      return createFallbackResult(
        request,
        'country_not_configured',
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&ref=no_country`,
        fallbackUrl,
        activeTour.id,
        artist.id
      )
    }

    const countryConfig = activeTour.tour_country_configs.find(
      config => config.country_code.toLowerCase() === countryCode.toLowerCase() && config.enabled
    )

    if (!countryConfig) {
      return createFallbackResult(
        request,
        'country_not_configured',
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=country_not_supported`,
        fallbackUrl,
        activeTour.id,
        artist.id
      )
    }

    // Step 4: Check organization status
    const organization = countryConfig.org

    // Check router_org_overrides table for router-specific controls
    const { data: orgOverride } = await supabaseAdmin
      .from('router_org_overrides')
      .select('enabled')
      .eq('org_id', organization.id)
      .single() as { data: { enabled: boolean } | null; error: unknown }

    // If override exists and is disabled, route to fallback
    if (orgOverride && !orgOverride.enabled) {
      return createFallbackResult(
        request,
        'org_paused',
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=org_paused`,
        fallbackUrl,
        activeTour.id,
        artist.id
      )
    }

    if (organization.approval_status !== 'approved') {
      return createFallbackResult(
        request,
        'org_not_approved',
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=org_not_approved`,
        fallbackUrl,
        activeTour.id,
        artist.id
      )
    }

    if (!organization.website) {
      return createFallbackResult(
        request,
        'org_not_approved',
        `${fallbackUrl}?artist=${encodeURIComponent(artist.name)}&country=${countryCode}&ref=no_org_website`,
        fallbackUrl,
        activeTour.id,
        artist.id
      )
    }

    // Step 5: Success! Route to organization
    const result: RouterResult = {
      success: true,
      destinationUrl: organization.website,
      orgId: organization.id,
      tourId: activeTour.id,
      reasonCode: 'success',
      analytics: {
        artist_slug: artistSlug,
        country_code: countryCode,
        org_id: organization.id,
        tour_id: activeTour.id,
        reason_code: 'success',
        destination_url: organization.website
      }
    }

    // Log analytics (fire and forget)
    logAnalytics(result.analytics).catch(console.error)

    return result

  } catch (error) {
    console.error('Router error:', error)
    const fallbackUrl = await getFallbackUrl()
    return createFallbackResult(
      request,
      'artist_not_found', // Generic fallback for unexpected errors
      `${fallbackUrl}?ref=error`,
      fallbackUrl
    )
  }
}

function createFallbackResult(
  request: RouterRequest,
  reasonCode: ReasonCode,
  destinationUrl: string,
  _fallbackUrl: string,
  tourId?: string,
  _artistId?: string
): RouterResult {
  const result: RouterResult = {
    success: false,
    destinationUrl,
    reasonCode,
    tourId,
    analytics: {
      artist_slug: request.artistSlug,
      country_code: request.countryCode,
      tour_id: tourId,
      reason_code: reasonCode,
      destination_url: destinationUrl
    }
  }

  // Log analytics (fire and forget)
  logAnalytics(result.analytics).catch(console.error)

  return result
}

async function logAnalytics(analytics: RouterResult['analytics']): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('router_analytics') as any).insert(analytics)
  } catch (error) {
    console.error('Analytics logging error:', error)
    // Don't throw - analytics failures shouldn't break routing
  }
}

export function getCountryFromRequest(request: Request): string | undefined {
  // Try Vercel's geo headers first
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  if (vercelCountry && vercelCountry !== 'unknown') {
    return vercelCountry
  }

  // Try Cloudflare headers
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry && cfCountry !== 'XX') {
    return cfCountry
  }

  // No reliable country detection available
  return undefined
}
