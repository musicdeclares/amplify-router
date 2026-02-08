import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser, isStaff } from "@/app/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { page_url, page_path, page_context, category, message, screenshot_url, browser_info } =
      await request.json();

    if (!page_url || !page_path) {
      return NextResponse.json(
        { error: "Page URL and path are required" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    const validCategories = ["bug", "suggestion", "question", "praise"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedback, error } = await (supabaseAdmin.from("router_feedback") as any)
      .insert({
        user_id: user.id,
        artist_id: user.artistId || null,
        page_url,
        page_path,
        page_context: page_context || null,
        category: category || null,
        message: message.trim(),
        screenshot_url: screenshot_url || null,
        browser_info: browser_info || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only staff (admin or staff) can list all feedback
    if (!isStaff(user)) {
      return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabaseAdmin
      .from("router_feedback")
      .select(
        `
        *,
        router_users!user_id (email, role),
        router_artists!artist_id (name, handle)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data: feedback, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ feedback, total: count });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
