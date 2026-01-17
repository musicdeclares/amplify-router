import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: configs, error } = await supabaseAdmin
      .from('tour_country_configs')
      .select(`
        *,
        org (*)
      `)
      .eq('tour_id', params.id)
      .order('country_code')

    if (error) {
      throw error
    }

    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Error fetching tour country configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tour country configs' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { country_code, org_id, enabled = true, priority = 10 } = await request.json()

    if (!country_code || !org_id) {
      return NextResponse.json(
        { error: 'Country code and organization ID are required' },
        { status: 400 }
      )
    }

    // Validate country code format (2 characters)
    if (!/^[A-Z]{2}$/i.test(country_code)) {
      return NextResponse.json(
        { error: 'Invalid country code format. Use 2-letter ISO codes (e.g., US, GB)' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: config, error } = await (supabaseAdmin.from('tour_country_configs') as any)
      .insert({
        tour_id: params.id,
        country_code: country_code.toUpperCase(),
        org_id,
        enabled,
        priority
      })
      .select(`
        *,
        org (*)
      `)
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Country already configured for this tour' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ config }, { status: 201 })
  } catch (error) {
    console.error('Error creating tour country config:', error)
    return NextResponse.json(
      { error: 'Failed to create tour country config' },
      { status: 500 }
    )
  }
}