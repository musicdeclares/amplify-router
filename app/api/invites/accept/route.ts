import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/app/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Validate token and return invite details for form pre-population
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required", code: "missing_token" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

    const { data: invite, error } = (await supabaseAdmin
      .from("router_invites")
      .select("id, email, suggested_name, role, status, expires_at")
      .eq("token", token)
      .single()) as {
      data: {
        id: string;
        email: string;
        suggested_name: string;
        role: string;
        status: string;
        expires_at: string;
      } | null;
      error: { code?: string } | null;
    };

    if (error || !invite) {
      return NextResponse.json(
        {
          error: "This invite link isn't valid. Please ask your contact at Music Declares Emergency for a new one.",
          code: "not_found",
        },
        { status: 404 },
      );
    }

    // Check status
    if (invite.status === "accepted") {
      return NextResponse.json(
        {
          error: "This invite has already been used. If you already have an account, you can sign in.",
          code: "already_accepted",
        },
        { status: 409 },
      );
    }

    if (invite.status === "revoked") {
      return NextResponse.json(
        {
          error: "This invite is no longer active. Please contact Music Declares Emergency for assistance.",
          code: "revoked",
        },
        { status: 410 },
      );
    }

    // Check expiry
    const isExpired = new Date(invite.expires_at) < new Date();
    if (isExpired || invite.status === "expired") {
      return NextResponse.json(
        {
          error: "This invite has expired. Please ask your contact at Music Declares Emergency to send a new one.",
          code: "expired",
        },
        { status: 410 },
      );
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        suggested_name: invite.suggested_name,
        role: invite.role,
      },
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", code: "error" },
      { status: 500 },
    );
  }
}

// POST - Accept invite (creates user, artist, signs in)
export async function POST(request: NextRequest) {
  try {
    const { token, handle, name, password } = await request.json();

    if (!token || !handle || !name || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate handle format
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)) {
      return NextResponse.json(
        {
          error: 'Handle must be lowercase letters, numbers, and hyphens only (e.g., "artist-name")',
          code: "invalid_handle",
        },
        { status: 400 },
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters", code: "weak_password" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // 1. Validate token
    const { data: invite, error: inviteError } = (await supabaseAdmin
      .from("router_invites")
      .select("id, email, role, status, expires_at")
      .eq("token", token)
      .single()) as {
      data: {
        id: string;
        email: string;
        role: string;
        status: string;
        expires_at: string;
      } | null;
      error: { code?: string } | null;
    };

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid invite token", code: "not_found" },
        { status: 404 },
      );
    }

    if (invite.status === "accepted") {
      return NextResponse.json(
        { error: "This invite has already been used", code: "already_accepted" },
        { status: 409 },
      );
    }

    if (invite.status === "revoked") {
      return NextResponse.json(
        { error: "This invite has been revoked", code: "revoked" },
        { status: 410 },
      );
    }

    const isExpired = new Date(invite.expires_at) < new Date();
    if (isExpired) {
      return NextResponse.json(
        { error: "This invite has expired", code: "expired" },
        { status: 410 },
      );
    }

    // 2. Check handle uniqueness
    const { data: existingArtist } = (await supabaseAdmin
      .from("router_artists")
      .select("id")
      .eq("handle", handle)
      .single()) as { data: { id: string } | null };

    if (existingArtist) {
      return NextResponse.json(
        { error: "That handle is already in use. Please choose a different one.", code: "handle_taken" },
        { status: 409 },
      );
    }

    // 3. Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true, // Skip email verification
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      if (authError?.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead.", code: "email_exists" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 },
      );
    }

    const userId = authData.user.id;

    // 4. Create artist record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artist, error: artistError } = await (supabaseAdmin.from("router_artists") as any)
      .insert({
        handle,
        name: name.trim(),
        link_active: true,
        account_active: true,
      })
      .select()
      .single();

    if (artistError) {
      // Clean up: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.error("Error creating artist:", artistError);
      return NextResponse.json(
        { error: "Failed to create artist profile" },
        { status: 500 },
      );
    }

    // 5. Create router_users record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: userError } = await (supabaseAdmin.from("router_users") as any)
      .insert({
        id: userId,
        email: invite.email,
        role: "artist",
        artist_id: artist.id,
        enabled: true,
      });

    if (userError) {
      // Clean up
      await supabaseAdmin.from("router_artists").delete().eq("id", artist.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.error("Error creating router_user:", userError);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 },
      );
    }

    // 6. Update invite status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("router_invites") as any)
      .update({
        status: "accepted",
        artist_id: artist.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    // 7. Sign in the user and set cookies
    const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey);
    const { data: sessionData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: invite.email,
      password,
    });

    if (signInError || !sessionData.session) {
      // User was created but couldn't sign in - they can sign in manually
      console.error("Error signing in after account creation:", signInError);
      return NextResponse.json({
        artist_id: artist.id,
        redirect: `/artist/${artist.id}`,
        message: "Account created. Please sign in.",
      });
    }

    // Create response with session cookies
    const response = NextResponse.json({
      artist_id: artist.id,
      redirect: `/artist/${artist.id}`,
    });

    // Set auth cookies
    response.cookies.set("sb-access-token", sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
