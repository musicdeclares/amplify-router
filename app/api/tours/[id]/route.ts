import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { Database } from "@/app/types/database";

type TourUpdate = Database["public"]["Tables"]["router_tours"]["Update"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { data: tour, error } = await supabaseAdmin
      .from("router_tours")
      .select(
        `
        *,
        router_artists!inner (id, handle, name),
        router_tour_overrides (
          id,
          country_code,
          org_id,
          enabled,
          org:org_public_view (id, org_name, country_code, website)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Tour not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ tour });
  } catch (error) {
    console.error("Error fetching tour:", error);
    return NextResponse.json(
      { error: "Failed to fetch tour" },
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

    // Validate dates if provided
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);

      if (endDate < startDate) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 },
        );
      }
    }

    const updates: TourUpdate = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.start_date !== undefined) updates.start_date = body.start_date;
    if (body.end_date !== undefined) updates.end_date = body.end_date;
    if (body.pre_tour_window_days !== undefined)
      updates.pre_tour_window_days = body.pre_tour_window_days;
    if (body.post_tour_window_days !== undefined)
      updates.post_tour_window_days = body.post_tour_window_days;
    if (body.enabled !== undefined) updates.enabled = body.enabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tour, error } = await (supabaseAdmin.from("router_tours") as any)
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        router_artists!inner (id, handle, name),
        router_tour_overrides (
          id,
          country_code,
          org_id,
          enabled
        )
      `,
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Tour not found" }, { status: 404 });
      }
      if (error.message?.includes("overlap")) {
        return NextResponse.json(
          {
            error:
              "Tour dates overlap with an existing active tour for this artist",
          },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({ tour });
  } catch (error) {
    console.error("Error updating tour:", error);
    return NextResponse.json(
      { error: "Failed to update tour" },
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
    // Tour overrides are deleted automatically via ON DELETE CASCADE.
    // Analytics rows have tour_id set to NULL via ON DELETE SET NULL.
    const { error } = await supabaseAdmin
      .from("router_tours")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tour:", error);
    return NextResponse.json(
      { error: "Failed to delete tour" },
      { status: 500 },
    );
  }
}
