import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/app/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Use anon client for auth (public operation)
    const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const { data: authData, error: authError } =
      await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      // Replace Supabase's technical error with a user-friendly message
      const friendlyMessage =
        authError?.message === "Invalid login credentials"
          ? "Incorrect email or password"
          : authError?.message || "Unable to sign in";
      return NextResponse.json({ error: friendlyMessage }, { status: 401 });
    }

    // Use service role client to bypass RLS for router_users lookup
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Fetch user role from router_users table
    const { data: routerUser, error: userError } = (await supabaseAdmin
      .from("router_users")
      .select("role, artist_id, enabled")
      .eq("id", authData.user.id)
      .single()) as {
      data: { role: string; artist_id: string | null; enabled: boolean } | null;
      error: unknown;
    };

    if (userError || !routerUser) {
      // Log details for debugging (visible in server logs only)
      console.error(
        `User authenticated but not in router_users table. ` +
          `To add: INSERT INTO router_users (id, email, role, enabled) VALUES ('${authData.user.id}', '${authData.user.email}', 'admin', true);`,
      );
      return NextResponse.json(
        {
          error:
            "Your account is not authorized to access the admin system. Please contact an administrator.",
        },
        { status: 403 },
      );
    }

    if (!routerUser.enabled) {
      await supabaseAuth.auth.signOut();
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 403 },
      );
    }

    // Create response with session cookies
    const response = NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: routerUser.role,
        artistId: routerUser.artist_id,
      },
    });

    // Set auth cookies
    if (authData.session) {
      response.cookies.set("sb-access-token", authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });
      response.cookies.set("sb-refresh-token", authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
