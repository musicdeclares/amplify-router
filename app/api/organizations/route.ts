import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Always use org_public_view - router only sees approved orgs
    let query = supabaseAdmin
      .from('org_public_view')
      .select('*')
      .order('org_name')
      .range(offset, offset + limit - 1)

    if (country) {
      query = query.eq('country_code', country.toUpperCase())
    }

    const { data: organizations, error } = await query as {
      data: Array<{ id: string; [key: string]: unknown }> | null
      error: unknown
    }

    if (error) {
      throw error
    }

    // Fetch router overrides and profile status
    const orgIds = organizations?.map(org => org.id) || []
    const { data: overrides } = await supabaseAdmin
      .from('router_org_overrides')
      .select('org_id, enabled, reason')
      .in('org_id', orgIds) as {
        data: Array<{ org_id: string; enabled: boolean; reason: string | null }> | null
        error: unknown
      }

    const { data: profiles } = await supabaseAdmin
      .from('router_org_profiles')
      .select('org_id, cta_url')
      .in('org_id', orgIds) as {
        data: Array<{ org_id: string; cta_url: string | null }> | null
        error: unknown
      }

    const profilesByOrgId = new Map(profiles?.map(p => [p.org_id, p]) || [])

    // Merge override data and profile status with organizations
    const orgsWithOverrides = organizations?.map(org => {
      const override = overrides?.find(o => o.org_id === org.id)
      const profile = profilesByOrgId.get(org.id)
      return {
        ...org,
        router_enabled: override?.enabled ?? true, // Default to enabled if no override
        router_pause_reason: override?.reason ?? null,
        has_profile: !!profile,
        cta_url: profile?.cta_url ?? null
      }
    })

    return NextResponse.json({ organizations: orgsWithOverrides })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const { org_ids, enabled, reason } = await request.json()

    if (action === 'bulk_update_router_status') {
      if (!Array.isArray(org_ids) || typeof enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'org_ids array and enabled boolean are required' },
          { status: 400 }
        )
      }

      // Upsert router_org_overrides for each org
      const overrides = org_ids.map((org_id: string) => ({
        org_id,
        enabled,
        reason: reason || null
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseAdmin.from('router_org_overrides') as any)
        .upsert(overrides, { onConflict: 'org_id' })
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({
        overrides: data,
        updated_count: data?.length || 0
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error bulk updating organizations:', error)
    return NextResponse.json(
      { error: 'Failed to update organizations' },
      { status: 500 }
    )
  }
}
