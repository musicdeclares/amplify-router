import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser, isAdmin, isStaff } from "@/app/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabaseAdmin
      .from("router_artists")
      .select("*, router_tours(id)", { count: "exact" })
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    // Artists can only see their own artist record
    if (!isStaff(user)) {
      if (user.artistId) {
        query = query.eq("id", user.artistId);
      } else {
        return NextResponse.json({ artists: [], total: 0 });
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`);
    }

    const {
      data: artists,
      error,
      count,
    } = (await query) as {
      data: Array<{
        id: string;
        handle: string;
        name: string;
        link_active: boolean;
        link_inactive_reason: string | null;
        account_active: boolean;
        account_inactive_reason: string | null;
        created_at: string;
        updated_at: string;
        router_tours: { id: string }[];
      }> | null;
      error: unknown;
      count: number | null;
    };

    if (error) {
      throw error;
    }

    // Add tour count to each artist
    const artistsWithTourCount = artists?.map((artist) => ({
      ...artist,
      tour_count: artist.router_tours?.length || 0,
      router_tours: undefined, // Remove the nested tours array
    }));

    return NextResponse.json({ artists: artistsWithTourCount, total: count });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return NextResponse.json(
      { error: "Failed to fetch artists" },
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

    // Only staff (admin or staff) can create artists
    if (!isStaff(user)) {
      return NextResponse.json(
        { error: "Staff access required" },
        { status: 403 },
      );
    }

    const {
      handle,
      name,
      link_active = true,
      account_active = true,
    } = await request.json();

    if (!handle || !name) {
      return NextResponse.json(
        { error: "Handle and name are required" },
        { status: 400 },
      );
    }

    // Validate handle format
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)) {
      return NextResponse.json(
        {
          error:
            'Handle must be lowercase alphanumeric with hyphens only (e.g., "artist-name")',
        },
        { status: 400 },
      );
    }

    const { data: artist, error } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabaseAdmin.from("router_artists") as any
    )
      .insert({ handle, name, link_active, account_active })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "An artist with this handle already exists" },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ artist }, { status: 201 });
  } catch (error) {
    console.error("Error creating artist:", error);
    return NextResponse.json(
      { error: "Failed to create artist" },
      { status: 500 },
    );
  }
}
