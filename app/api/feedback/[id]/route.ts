import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser, isAdmin, isStaff } from "@/app/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only staff (admin or staff) can view individual feedback
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    }

    const { id } = await params;

    const { data: feedback, error } = await supabaseAdmin
      .from("router_feedback")
      .select(
        `
        *,
        router_users!user_id (email, role),
        router_artists!artist_id (name, handle),
        related:router_feedback!related_to (id, message, created_at)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins (developers) can update feedback status/priority
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "status",
      "priority",
      "assigned_to",
      "related_to",
      "admin_notes",
      "resolution_notes",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Validate status
    const validStatuses = [
      "new",
      "triaging",
      "in_progress",
      "completed",
      "blocked",
      "wont_fix",
    ];
    if (updates.status && !validStatuses.includes(updates.status as string)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high", "critical"];
    if (
      updates.priority &&
      updates.priority !== null &&
      !validPriorities.includes(updates.priority as string)
    ) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedback, error } = await (supabaseAdmin.from("router_feedback") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
