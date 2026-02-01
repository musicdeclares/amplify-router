import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { Database } from '@/app/types/database'

type Organization = Database["public"]["Tables"]["org"]["Row"]
type RouterOrgOverride = Database["public"]["Tables"]["router_org_overrides"]["Row"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { data: organization, error } = await supabaseAdmin
      .from('org')
      .select('*')
      .eq('id', id)
      .single() as { data: Organization | null; error: { code?: string; message?: string } | null }

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
    const { data: override } = await supabaseAdmin
      .from('router_org_overrides')
      .select('enabled, reason')
      .eq('org_id', id)
      .single() as { data: Pick<RouterOrgOverride, 'enabled' | 'reason'> | null; error: unknown }

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { enabled, reason } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled field (boolean) is required' },
        { status: 400 }
      )
    }

    // Upsert router_org_override
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: override, error } = await (supabaseAdmin.from('router_org_overrides') as any)
      .upsert({
        org_id: id,
        enabled,
        reason: reason || null
      }, { onConflict: 'org_id' })
      .select()
      .single() as { data: RouterOrgOverride | null; error: unknown }

    if (error) {
      throw error
    }

    // Fetch the org to return complete data
    const { data: organization } = await supabaseAdmin
      .from('org')
      .select('*')
      .eq('id', id)
      .single() as { data: Organization | null; error: unknown }

    return NextResponse.json({
      organization: {
        ...organization,
        router_enabled: override?.enabled,
        router_pause_reason: override?.reason
      }
    })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}