import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { Database } from '@/app/types/database'

type TourUpdate = Database['public']['Tables']['tours']['Update']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { data: tour, error } = await supabaseAdmin
      .from('tours')
      .select(`
        *,
        artists!inner (id, slug, name),
        tour_country_configs (
          *,
          org (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tour not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ tour })
  } catch (error) {
    console.error('Error fetching tour:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tour' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    // Validate dates if provided
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date)
      const endDate = new Date(body.end_date)

      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const updates: TourUpdate = {
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      pre_tour_window_days: body.pre_tour_window_days,
      post_tour_window_days: body.post_tour_window_days,
      enabled: body.enabled
    }
    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof TourUpdate] === undefined) {
        delete updates[key as keyof TourUpdate]
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tour, error } = await (supabaseAdmin.from('tours') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tour not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ tour })
  } catch (error) {
    console.error('Error updating tour:', error)
    return NextResponse.json(
      { error: 'Failed to update tour' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { error } = await supabaseAdmin
      .from('tours')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tour:', error)
    return NextResponse.json(
      { error: 'Failed to delete tour' },
      { status: 500 }
    )
  }
}