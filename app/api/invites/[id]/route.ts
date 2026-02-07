import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser, isAdmin } from "@/app/lib/api-auth";

// GET - get a single invite (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { data: invite, error } = (await supabaseAdmin
      .from("router_invites")
      .select(`
        *,
        router_artists (id, handle, name),
        created_by_user:router_users!router_invites_created_by_fkey (email)
      `)
      .eq("id", id)
      .single()) as {
      data: {
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
      } | null;
      error: { code?: string; message: string } | null;
    };

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 },
    );
  }
}

// PUT - extend invite expiry (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { extend_days = 7 } = body;

    // Get current invite
    const { data: currentInvite, error: fetchError } = (await supabaseAdmin
      .from("router_invites")
      .select("expires_at, status")
      .eq("id", id)
      .single()) as {
      data: { expires_at: string; status: string } | null;
      error: { code?: string; message: string } | null;
    };

    if (fetchError || !currentInvite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (currentInvite.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending invites can be extended" },
        { status: 400 },
      );
    }

    // Extend from the later of: current expiry or now
    const baseDate = new Date(
      Math.max(new Date(currentInvite.expires_at).getTime(), Date.now()),
    );
    baseDate.setDate(baseDate.getDate() + extend_days);

    // Also reset status to pending if it was expired
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invite, error } = await (supabaseAdmin.from("router_invites") as any)
      .update({
        expires_at: baseDate.toISOString(),
        status: "pending",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Error extending invite:", error);
    return NextResponse.json(
      { error: "Failed to extend invite" },
      { status: 500 },
    );
  }
}

// DELETE - revoke invite (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get current invite to check status
    const { data: currentInvite, error: fetchError } = (await supabaseAdmin
      .from("router_invites")
      .select("status")
      .eq("id", id)
      .single()) as {
      data: { status: string } | null;
      error: { code?: string; message: string } | null;
    };

    if (fetchError || !currentInvite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (currentInvite.status === "accepted") {
      return NextResponse.json(
        { error: "Cannot revoke an already accepted invite" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from("router_invites") as any)
      .update({ status: "revoked" })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 },
    );
  }
}
