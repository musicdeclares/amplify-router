import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser, isAdmin, isStaff, canAccessArtist } from "@/app/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artist_id");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabaseAdmin
      .from("router_tours")
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
        { count: "exact" },
      )
      .order("start_date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Artists can only see their own tours
    if (!isStaff(user)) {
      if (user.artistId) {
        query = query.eq("artist_id", user.artistId);
      } else {
        // No artist_id and not admin - return empty
        return NextResponse.json({ tours: [], total: 0 });
      }
    } else if (artistId) {
      // Admin filtering by specific artist
      query = query.eq("artist_id", artistId);
    }

    if (search) {
      // Search both tour name and artist name
      query = query.or(`name.ilike.%${search}%,router_artists.name.ilike.%${search}%`);
    }

    const { data: tours, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ tours, total: count });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { error: "Failed to fetch tours" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      artist_id,
      name,
      start_date,
      end_date,
      pre_tour_window_days = 0,
      post_tour_window_days = 0,
      enabled = true,
    } = await request.json();

    if (!artist_id || !name || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Artist ID, name, start_date, and end_date are required" },
        { status: 400 },
      );
    }

    // Artists can only create tours for themselves
    if (!canAccessArtist(user, artist_id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tour, error } = await (supabaseAdmin.from("router_tours") as any)
      .insert({
        artist_id,
        name,
        start_date,
        end_date,
        pre_tour_window_days,
        post_tour_window_days,
        enabled,
      })
      .select(
        `
        *,
        router_artists (id, handle, name)
      `,
      )
      .single();

    if (error) {
      // Handle overlapping tour error
      if (error.message?.includes("overlap")) {
        const overlapMessage = isAdmin(user)
          ? "This artist already has a tour scheduled during these dates. Try different dates, or check their"
          : "You already have a tour scheduled during these dates. Try different dates, or edit your";
        const toursUrl = isAdmin(user)
          ? `/admin/artists/${artist_id}/tours`
          : `/artist/${artist_id}/tours`;
        return NextResponse.json(
          {
            error: overlapMessage,
            linkText: "existing tours.",
            linkUrl: toursUrl,
          },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({ tour }, { status: 201 });
  } catch (error) {
    console.error("Error creating tour:", error);
    return NextResponse.json(
      { error: "Failed to create tour" },
      { status: 500 },
    );
  }
}
