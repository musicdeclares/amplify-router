import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Routes that don't require authentication
const publicRoutes = [
  "/login",
  "/reset-password",
  "/forgot-password",
];

// Routes that allow unauthenticated access but should set user headers if authenticated
const optionalAuthRoutes = ["/help"];

// Public API routes that don't require authentication
const publicApiRoutes = [
  "/api/a/",
  "/api/invites/accept",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/organizations",
  "/api/org-profiles",
];

// Routes that require staff role (admin or staff)
const adminOnlyRoutes = ["/admin/recommended", "/admin/organizations"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-protected routes (except help which has optional auth)
  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/artist") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/help") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/forgot-password") &&
    !pathname.startsWith("/reset-password")
  ) {
    return NextResponse.next();
  }

  // Check if this is an optional auth route
  const isOptionalAuth = optionalAuthRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  // Get access token from cookie
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    // For optional auth routes, allow access without authentication
    if (isOptionalAuth) {
      return NextResponse.next();
    }
    // For API routes, return 401 JSON response
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to login for page routes
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Set the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session) {
      // For optional auth routes, allow access without valid session
      if (isOptionalAuth) {
        return NextResponse.next();
      }
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Fetch user role using service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: routerUser, error: userError } = await supabaseAdmin
      .from("router_users")
      .select("role, artist_id, enabled")
      .eq("id", session.user.id)
      .single();

    if (userError || !routerUser) {
      // For optional auth routes, allow access without router_user
      if (isOptionalAuth) {
        return NextResponse.next();
      }
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(loginUrl);
    }

    if (!routerUser.enabled) {
      // For optional auth routes, allow access even if disabled
      if (isOptionalAuth) {
        return NextResponse.next();
      }
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: "Account deactivated" },
          { status: 403 },
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "account_deactivated");
      return NextResponse.redirect(loginUrl);
    }

    // Check admin-only routes (admin and staff can access)
    if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (routerUser.role !== "admin" && routerUser.role !== "staff") {
        if (pathname.startsWith("/api")) {
          return NextResponse.json(
            { error: "Staff access required" },
            { status: 403 },
          );
        }
        // Redirect non-staff to dashboard
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    // Check artist routes
    if (pathname.startsWith("/artist/")) {
      const artistPathMatch = pathname.match(/^\/artist\/([^/]+)(.*)/);
      if (artistPathMatch) {
        const requestedArtistId = artistPathMatch[1];
        const restOfPath = artistPathMatch[2] || "";
        const isStaff = routerUser.role === "admin" || routerUser.role === "staff";

        if (isStaff) {
          // Redirect staff to admin artist view
          return NextResponse.redirect(
            new URL(`/admin/artists/${requestedArtistId}${restOfPath}`, request.url),
          );
        }

        if (routerUser.artist_id !== requestedArtistId) {
          // Redirect artists to their own page
          if (routerUser.artist_id) {
            return NextResponse.redirect(
              new URL(`/artist/${routerUser.artist_id}`, request.url),
            );
          }
          // No artist_id, redirect to login
          return NextResponse.redirect(new URL("/login", request.url));
        }
      }
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set("x-user-id", session.user.id);
    response.headers.set("x-user-role", routerUser.role);
    if (routerUser.artist_id) {
      response.headers.set("x-user-artist-id", routerUser.artist_id);
    }

    return response;
  } catch {
    // On any error, redirect to login
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/artist/:path*",
    "/api/:path*",
    "/help/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
  ],
};
