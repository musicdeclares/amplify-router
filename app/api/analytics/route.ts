import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistSlug = searchParams.get('artist_slug')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = parseInt(searchParams.get('offset') || '0')
    const groupBy = searchParams.get('group_by') // 'country', 'org', 'reason_code'

    if (groupBy) {
      return getAnalyticsSummary(
        artistSlug,
        startDate,
        endDate,
        groupBy as 'country' | 'org' | 'reason_code'
      )
    }

    // Build query step by step
    let query = supabaseAdmin
      .from('router_analytics')
      .select('*')

    if (artistSlug) {
      query = query.eq('artist_slug', artistSlug)
    }

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }

    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    const { data: analytics, error } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

async function getAnalyticsSummary(
  artistSlug: string | null,
  startDate: string | null,
  endDate: string | null,
  groupBy: 'country' | 'org' | 'reason_code'
) {
  try {
    // Build query with filters
    let query = supabaseAdmin.from('router_analytics').select('*')

    if (artistSlug) {
      query = query.eq('artist_slug', artistSlug)
    }

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }

    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    let selectField: string
    switch (groupBy) {
      case 'country':
        selectField = 'country_code'
        break
      case 'org':
        selectField = 'org_id'
        break
      case 'reason_code':
        selectField = 'reason_code'
        break
      default:
        throw new Error('Invalid group_by parameter')
    }

    const { data: analytics, error } = await query

    if (error) {
      throw error
    }

    // Group and count manually
    const grouped = (analytics || []).reduce((acc, record) => {
      const key = (record as Record<string, unknown>)[selectField] as string || 'null'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const summary = Object.entries(grouped)
      .map(([key, count]) => ({ [selectField]: key, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      summary,
      total_requests: analytics?.length || 0,
      grouped_by: groupBy
    })
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    )
  }
}