import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabaseAdmin
      .from("router_artists")
      .select("*, router_tours(id)", { count: "exact" })
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

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
        enabled: boolean;
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
    const { handle, name, enabled = true } = await request.json();

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artist, error } = await (supabaseAdmin.from("router_artists") as any)
      .insert({ handle, name, enabled })
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
