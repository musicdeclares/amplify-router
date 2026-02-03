import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Routes that don't require authentication
const publicRoutes = [
  '/admin/login',
  '/admin/reset-password',
  '/admin/forgot-password',
]

// Routes that require admin role
const adminOnlyRoutes = [
  '/admin/recommended',
  '/admin/organizations',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for non-admin routes
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/artist')) {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for session cookie
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })

  // Get access token from cookie
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  if (!accessToken || !refreshToken) {
    // Redirect to login
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Set the session
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError || !session) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Fetch user role using service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: routerUser, error: userError } = await supabaseAdmin
      .from('router_users')
      .select('role, artist_id, enabled')
      .eq('id', session.user.id)
      .single()

    if (userError || !routerUser) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('error', 'not_authorized')
      return NextResponse.redirect(loginUrl)
    }

    if (!routerUser.enabled) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('error', 'account_disabled')
      return NextResponse.redirect(loginUrl)
    }

    // Check admin-only routes
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      if (routerUser.role !== 'admin') {
        // Redirect non-admins to dashboard
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }

    // Check artist routes - must be the correct artist or an admin
    if (pathname.startsWith('/artist/')) {
      const artistPathMatch = pathname.match(/^\/artist\/([^/]+)/)
      if (artistPathMatch) {
        const requestedArtistId = artistPathMatch[1]
        if (routerUser.role !== 'admin' && routerUser.artist_id !== requestedArtistId) {
          return NextResponse.redirect(new URL('/artist/dashboard', request.url))
        }
      }
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-role', routerUser.role)
    if (routerUser.artist_id) {
      response.headers.set('x-user-artist-id', routerUser.artist_id)
    }

    return response
  } catch {
    // On any error, redirect to login
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/artist/:path*',
  ],
}
