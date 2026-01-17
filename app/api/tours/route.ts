import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artist_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('tours')
      .select(`
        *,
        artists!inner (id, slug, name),
        tour_country_configs (
          *,
          org (*)
        )
      `)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (artistId) {
      query = query.eq('artist_id', artistId)
    }

    const { data: tours, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ tours })
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tours' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      artist_id,
      name,
      start_date,
      end_date,
      pre_tour_window_days = 0,
      post_tour_window_days = 0,
      enabled = true
    } = await request.json()

    if (!artist_id || !name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Artist ID, name, start_date, and end_date are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tour, error } = await (supabaseAdmin.from('tours') as any)
      .insert({
        artist_id,
        name,
        start_date,
        end_date,
        pre_tour_window_days,
        post_tour_window_days,
        enabled
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ tour }, { status: 201 })
  } catch (error) {
    console.error('Error creating tour:', error)
    return NextResponse.json(
      { error: 'Failed to create tour' },
      { status: 500 }
    )
  }
}