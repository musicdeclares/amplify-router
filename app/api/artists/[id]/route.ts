import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { Database } from "@/app/types/database";
import { getApiUser, isAdmin, canAccessArtist } from "@/app/lib/api-auth";

type ArtistUpdate = Database["public"]["Tables"]["router_artists"]["Update"];

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

    // Check access
    if (!canAccessArtist(user, id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: artist, error } = await supabaseAdmin
      .from("router_artists")
      .select(
        `
        *,
        router_tours (
          id,
          name,
          start_date,
          end_date,
          enabled
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return NextResponse.json(
          { error: "Artist not found" },
          { status: 404 },
        );
      }
      throw error;
    }

    // If the requesting user is an artist accessing their own record, include their email
    let userEmail: string | null = null;
    if (!isAdmin(user) && user.artistId === id) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
        user.id,
      );
      userEmail = authUser?.user?.email ?? null;
    }

    return NextResponse.json({ artist, userEmail });
  } catch (error) {
    console.error("Error fetching artist:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist" },
      { status: 500 },
    );
  }
}

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

    // Check access
    if (!canAccessArtist(user, id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const updates: ArtistUpdate = {};

    // Only include fields that are provided (handle is immutable, so we skip it)
    if (body.name !== undefined) updates.name = body.name;

    // Artists and admins can toggle link_active (pause/resume)
    if (body.link_active !== undefined) {
      updates.link_active = body.link_active;
    }

    // Handle link inactive reason
    if (body.link_inactive_reason !== undefined) {
      updates.link_inactive_reason = body.link_inactive_reason;
    }

    // Only admins can set account_active and account_inactive_reason
    if (body.account_active !== undefined) {
      if (!isAdmin(user)) {
        return NextResponse.json(
          { error: "Only admins can deactivate accounts" },
          { status: 403 },
        );
      }
      updates.account_active = body.account_active;
    }

    if (body.account_inactive_reason !== undefined) {
      if (!isAdmin(user)) {
        return NextResponse.json(
          { error: "Only admins can set account inactive reason" },
          { status: 403 },
        );
      }
      updates.account_inactive_reason = body.account_inactive_reason;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artist, error } = await (
      supabaseAdmin.from("router_artists") as any
    )
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Artist not found" },
          { status: 404 },
        );
      }
      // Handle handle update attempt (blocked by trigger)
      if (error.message?.includes("handle cannot be modified")) {
        return NextResponse.json(
          { error: "Artist handle cannot be changed after creation" },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({ artist });
  } catch (error) {
    console.error("Error updating artist:", error);
    return NextResponse.json(
      { error: "Failed to update artist" },
      { status: 500 },
    );
  }
}

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

    // Only admins can delete artists
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Check if artist has tours
    const { data: tours } = await supabaseAdmin
      .from("router_tours")
      .select("id")
      .eq("artist_id", id)
      .limit(1);

    if (tours && tours.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete artist with existing tours. Delete tours first.",
        },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("router_artists")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting artist:", error);
    return NextResponse.json(
      { error: "Failed to delete artist" },
      { status: 500 },
    );
  }
}
