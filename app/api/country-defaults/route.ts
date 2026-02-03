import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

interface CountryDefault {
  id: string
  country_code: string
  org_id: string
  effective_from: string | null
  effective_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface OrgPublic {
  id: string
  org_name: string
  country_code: string
  website: string | null
}

export async function GET() {
  try {
    // Fetch country defaults
    const { data: defaults, error: defaultsError } = await supabaseAdmin
      .from('router_country_defaults')
      .select('*')
      .order('country_code', { ascending: true })
      .order('effective_from', { ascending: true, nullsFirst: true }) as {
        data: CountryDefault[] | null
        error: unknown
      }

    if (defaultsError) {
      throw defaultsError
    }

    // Fetch org data separately for the referenced orgs
    const orgIds = [...new Set(defaults?.map(d => d.org_id) || [])]

    let orgsMap: Record<string, OrgPublic> = {}

    if (orgIds.length > 0) {
      const { data: orgs, error: orgsError } = await supabaseAdmin
        .from('org_public_view')
        .select('id, org_name, country_code, website')
        .in('id', orgIds) as {
          data: OrgPublic[] | null
          error: unknown
        }

      if (orgsError) {
        console.warn('Error fetching org data:', orgsError)
      } else if (orgs) {
        orgsMap = Object.fromEntries(orgs.map(o => [o.id, o]))
      }
    }

    // Merge org data into defaults
    const defaultsWithOrg = defaults?.map(d => ({
      ...d,
      org: orgsMap[d.org_id] || null
    }))

    return NextResponse.json({ defaults: defaultsWithOrg })
  } catch (error) {
    console.error('Error fetching country defaults:', error)
    return NextResponse.json(
      { error: 'Failed to fetch country defaults' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { country_code, org_id, effective_from, effective_to, notes } = body

    if (!country_code || !org_id) {
      return NextResponse.json(
        { error: 'Country code and organization are required' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: countryDefault, error } = await (supabaseAdmin.from('router_country_defaults') as any)
      .insert({
        country_code,
        org_id,
        effective_from: effective_from || null,
        effective_to: effective_to || null,
        notes: notes || null,
      })
      .select('*')
      .single() as { data: CountryDefault | null; error: { message?: string; code?: string } | null }

    // Fetch org data separately from org_public_view
    let org: OrgPublic | null = null
    if (countryDefault) {
      const { data: orgData } = await supabaseAdmin
        .from('org_public_view')
        .select('id, org_name, country_code, website')
        .eq('id', countryDefault.org_id)
        .single() as { data: OrgPublic | null; error: unknown }
      org = orgData
    }

    const countryDefaultWithOrg = countryDefault ? { ...countryDefault, org } : null

    if (error) {
      // Handle specific constraint errors
      if (error.message?.includes('Organization operates in')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message?.includes('Date range conflicts')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A permanent recommendation already exists for this country' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ countryDefault: countryDefaultWithOrg }, { status: 201 })
  } catch (error) {
    console.error('Error creating country default:', error)
    return NextResponse.json(
      { error: 'Failed to create country default' },
      { status: 500 }
    )
  }
}
