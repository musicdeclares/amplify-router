import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { Database } from "@/app/types/database";

type ArtistUpdate = Database["public"]["Tables"]["router_artists"]["Update"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
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

    return NextResponse.json({ artist });
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
    const body = await request.json();
    const updates: ArtistUpdate = {};

    // Only include fields that are provided (handle is immutable, so we skip it)
    if (body.name !== undefined) updates.name = body.name;
    if (body.enabled !== undefined) updates.enabled = body.enabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artist, error } = await (supabaseAdmin.from("router_artists") as any)
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
