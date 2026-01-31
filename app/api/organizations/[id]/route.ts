import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
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

<<<<<<< Updated upstream
    return NextResponse.json({ organization })
=======
    // Fetch router override if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: override } = await (supabaseAdmin.from('router_org_overrides') as any)
      .select('enabled, reason')
      .eq('org_id', id)
      .single()

    return NextResponse.json({
      organization: {
        ...organization,
        router_enabled: override?.enabled ?? true,
        router_pause_reason: override?.reason ?? null
      }
    })
>>>>>>> Stashed changes
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
    const updates = await request.json()
    delete updates.id
    delete updates.created_at

    // Only allow router-specific updates for now
    // (prevents accidentally modifying MDEDB data)
    const allowedFields = ['router_active']
    const routerUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(routerUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided. Only router_active can be updated.' },
        { status: 400 }
      )
    }

<<<<<<< Updated upstream
    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .update(routerUpdates)
      .eq('id', params.id)
=======
    // Upsert router_org_override
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: override, error } = await (supabaseAdmin.from('router_org_overrides') as any)
      .upsert({
        org_id: id,
        enabled,
        reason: reason || null
      }, { onConflict: 'org_id' })
>>>>>>> Stashed changes
      .select()
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

<<<<<<< Updated upstream
    return NextResponse.json({ organization })
=======
    // Fetch the org to return complete data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: organization } = await (supabaseAdmin.from('org') as any)
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json({
      organization: {
        ...organization,
        router_enabled: override?.enabled,
        router_pause_reason: override?.reason
      }
    })
>>>>>>> Stashed changes
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}