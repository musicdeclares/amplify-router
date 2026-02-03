import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .update({
        country_code,
        org_id,
        effective_from: effective_from || null,
        effective_to: effective_to || null,
        notes: notes || null,
      })
      .eq('id', id)
      .select(`
        *,
        org:org_public_view (id, org_name, country_code, website)
      `)
      .single()

    if (error) {
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
      throw error
    }

    return NextResponse.json({ countryDefault })
  } catch (error) {
    console.error('Error updating country default:', error)
    return NextResponse.json(
      { error: 'Failed to update country default' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('router_country_defaults')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting country default:', error)
    return NextResponse.json(
      { error: 'Failed to delete country default' },
      { status: 500 }
    )
  }
}
