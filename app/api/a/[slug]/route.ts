import { NextRequest, NextResponse } from 'next/server'
import { routeRequest, getCountryFromRequest } from '@/app/lib/router-logic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  if (!slug) {
    return NextResponse.redirect('https://musicdeclares.net/amplify?ref=no_slug', 302)
  }

  try {
    const countryCode = getCountryFromRequest(request)

    const result = await routeRequest({
      artistSlug: slug,
      countryCode
    })

    // Return 302 redirect to the resolved destination
    return NextResponse.redirect(result.destinationUrl, 302)

  } catch (error) {
    console.error('Router API error:', error)

    // Fallback to default AMPLIFY page on any error
    return NextResponse.redirect('https://musicdeclares.net/amplify?ref=api_error', 302)
  }
}

export const runtime = 'edge'
