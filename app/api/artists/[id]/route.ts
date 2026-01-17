import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { Database } from '@/app/types/database'

type ArtistUpdate = Database['public']['Tables']['artists']['Update']

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: artist, error } = await supabaseAdmin
      .from('artists')
      .select(`
        *,
        tours (
          *,
          tour_country_configs (
            *,
            org (*)
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Artist not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ artist })
  } catch (error) {
    console.error('Error fetching artist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updates: ArtistUpdate = {
      slug: body.slug,
      name: body.name,
      enabled: body.enabled
    }
    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof ArtistUpdate] === undefined) {
        delete updates[key as keyof ArtistUpdate]
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artist, error } = await (supabaseAdmin.from('artists') as any)
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Artist not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ artist })
  } catch (error) {
    console.error('Error updating artist:', error)
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('artists')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting artist:', error)
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500 }
    )
  }
}