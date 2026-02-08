import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser, isStaff } from "@/app/lib/api-auth";

// GET - list all invites (admin only)
export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    }

    const { data: invites, error } = (await supabaseAdmin
      .from("router_invites")
      .select(`
        *,
        router_artists (id, handle, name),
        created_by_user:router_users!router_invites_created_by_fkey (email)
      `)
      .order("created_at", { ascending: false })) as {
      data: Array<{
        id: string;
        token: string;
        role: string;
        email: string;
        suggested_name: string;
        artist_id: string | null;
        status: string;
        expires_at: string;
        accepted_at: string | null;
        created_by: string | null;
        created_at: string;
        updated_at: string;
        router_artists: { id: string; handle: string; name: string } | null;
        created_by_user: { email: string } | null;
      }> | null;
      error: { message: string } | null;
    };

    if (error) {
      throw error;
    }

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 },
    );
  }
}

// POST - create a new invite (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    }

    const { email, suggested_name, role = "artist" } = await request.json();

    if (!email || !suggested_name) {
      return NextResponse.json(
        { error: "Email and suggested name are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate role
    if (!["artist", "org"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'artist' or 'org'" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in Supabase Auth
    const { data: existingUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error checking existing users:", authError);
      return NextResponse.json(
        { error: "Failed to validate email" },
        { status: 500 },
      );
    }

    const emailExists = existingUsers.users.some(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Check for existing pending invite for this email
    const { data: existingInvite } = (await supabaseAdmin
      .from("router_invites")
      .select("id, status")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .single()) as { data: { id: string; status: string } | null };

    if (existingInvite) {
      return NextResponse.json(
        { error: "A pending invite already exists for this email" },
        { status: 409 },
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invite, error } = await (supabaseAdmin.from("router_invites") as any)
      .insert({
        token,
        role,
        email: normalizedEmail,
        suggested_name: suggested_name.trim(),
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Generate the invite URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${siteUrl}/invite/${token}`;

    return NextResponse.json(
      { invite: { ...invite, invite_url: inviteUrl } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 },
    );
  }
}
