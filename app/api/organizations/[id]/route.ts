import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: organization, error } = await (supabaseAdmin.from('org') as any)
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Fetch router override if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: override } = await (supabaseAdmin.from('router_org_overrides') as any)
      .select('enabled, reason')
      .eq('org_id', params.id)
      .single()

    return NextResponse.json({
      organization: {
        ...organization,
        router_enabled: override?.enabled ?? true,
        router_pause_reason: override?.reason ?? null
      }
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { enabled, reason } = await request.json()

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled boolean is required' },
        { status: 400 }
      )
    }

    // Upsert router_org_override
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: override, error } = await (supabaseAdmin.from('router_org_overrides') as any)
      .upsert({
        org_id: params.id,
        enabled,
        reason: reason || null
      }, { onConflict: 'org_id' })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Fetch the org to return complete data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: organization } = await (supabaseAdmin.from('org') as any)
      .select('*')
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      organization: {
        ...organization,
        router_enabled: override?.enabled,
        router_pause_reason: override?.reason
      }
    })
  } catch (error) {
    console.error('Error updating organization router status:', error)
    return NextResponse.json(
      { error: 'Failed to update organization router status' },
      { status: 500 }
    )
  }
}
