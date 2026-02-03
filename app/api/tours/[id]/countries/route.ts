import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// GET tour overrides (artist-selected orgs per country)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { data: overrides, error } = await supabaseAdmin
      .from('router_tour_overrides')
      .select(`
        *,
        org:org_public_view (id, org_name, country_code, website)
      `)
      .eq('tour_id', id)
      .order('country_code')

    if (error) {
      throw error
    }

    return NextResponse.json({ overrides })
  } catch (error) {
    console.error('Error fetching tour overrides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tour overrides' },
      { status: 500 }
    )
  }
}

// POST - add a country to tour (creates override with optional org)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { country_code, org_id, enabled = true } = await request.json()

    if (!country_code) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      )
    }

    // org_id is optional - if not provided, the tour will use MDE recommended org

     
    const insertData: Record<string, unknown> = {
      tour_id: id,
      country_code: country_code.toUpperCase(),
      enabled,
    }

    if (org_id) {
      insertData.org_id = org_id
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: override, error } = await (supabaseAdmin.from('router_tour_overrides') as any)
      .insert(insertData)
      .select(`
        *,
        org:org_public_view (id, org_name, country_code, website)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This country is already configured for this tour' },
          { status: 409 }
        )
      }
      if (error.message?.includes('Organization operates in')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({ override }, { status: 201 })
  } catch (error) {
    console.error('Error creating tour override:', error)
    return NextResponse.json(
      { error: 'Failed to add country to tour' },
      { status: 500 }
    )
  }
}

// PUT - update multiple overrides at once
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { overrides } = await request.json()

    if (!Array.isArray(overrides)) {
      return NextResponse.json(
        { error: 'Overrides must be an array' },
        { status: 400 }
      )
    }

    const results = []

    for (const override of overrides) {
      const { override_id, country_code, org_id, enabled } = override

      if (override_id) {
        // Update existing override
        const updates: Record<string, unknown> = {}
        if (org_id !== undefined) updates.org_id = org_id
        if (enabled !== undefined) updates.enabled = enabled

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from('router_tour_overrides') as any)
          .update(updates)
          .eq('id', override_id)
          .select(`
            *,
            org:org_public_view (id, org_name, country_code, website)
          `)
          .single()

        if (error) throw error
        results.push(data)
      } else if (country_code) {
        // Create new override
         
        const insertData: Record<string, unknown> = {
          tour_id: id,
          country_code: country_code.toUpperCase(),
          enabled: enabled ?? true,
        }
        if (org_id) insertData.org_id = org_id

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin.from('router_tour_overrides') as any)
          .insert(insertData)
          .select(`
            *,
            org:org_public_view (id, org_name, country_code, website)
          `)
          .single()

        if (error) throw error
        results.push(data)
      }
    }

    return NextResponse.json({ overrides: results })
  } catch (error) {
    console.error('Error updating tour overrides:', error)
    return NextResponse.json(
      { error: 'Failed to update tour overrides' },
      { status: 500 }
    )
  }
}

// DELETE - remove a specific country override
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { searchParams } = new URL(request.url)
    const overrideId = searchParams.get('override_id')
    const countryCode = searchParams.get('country_code')

    if (!overrideId && !countryCode) {
      return NextResponse.json(
        { error: 'Either override_id or country_code is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin.from('router_tour_overrides').delete().eq('tour_id', id)

    if (overrideId) {
      query = query.eq('id', overrideId)
    } else if (countryCode) {
      query = query.eq('country_code', countryCode.toUpperCase())
    }

    const { error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tour override:', error)
    return NextResponse.json(
      { error: 'Failed to remove country from tour' },
      { status: 500 }
    )
  }
}
