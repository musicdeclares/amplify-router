import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { getApiUser, canAccessArtist } from "@/app/lib/api-auth";
import type { RouterAnalytics } from "@/app/types/router";

interface FallbackEvent {
  id: string;
  timestamp: string;
  country_code: string | null;
  fallback_ref: string;
  tour_id: string | null;
  destination_url: string;
}

interface ArtistAnalyticsResponse {
  totalRoutes: number;
  successfulRoutes: number;
  fallbackRoutes: number;
  topCountries: Array<{ country_code: string; count: number }>;
  fallbackReasons: Array<{ reason: string; count: number }>;
  recentFallbacks: FallbackEvent[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const { artistId } = await params;

  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canAccessArtist(user, artistId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get artist handle
    const { data: artist, error: artistError } = (await supabaseAdmin
      .from("router_artists")
      .select("handle")
      .eq("id", artistId)
      .single()) as { data: { handle: string } | null; error: unknown };

    if (artistError || !artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch analytics for this artist
    const { data: analytics, error } = await supabaseAdmin
      .from("router_analytics")
      .select("*")
      .eq("artist_handle", artist.handle)
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (analytics || []) as RouterAnalytics[];

    // Compute aggregations
    const totalRoutes = rows.length;
    const fallbackRows = rows.filter(
      (r) => r.fallback_ref !== null && r.fallback_ref !== "",
    );
    const fallbackRoutes = fallbackRows.length;
    const successfulRoutes = totalRoutes - fallbackRoutes;

    // Top countries
    const countryMap = new Map<string, number>();
    for (const row of rows) {
      const key = row.country_code || "Unknown";
      countryMap.set(key, (countryMap.get(key) || 0) + 1);
    }
    const topCountries = Array.from(countryMap.entries())
      .map(([country_code, count]) => ({ country_code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Fallback reasons
    const reasonMap = new Map<string, number>();
    for (const row of fallbackRows) {
      const reason = row.fallback_ref || "unknown";
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    }
    const fallbackReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // Recent fallback events (limit to 50 most recent)
    const recentFallbacks: FallbackEvent[] = fallbackRows
      .slice(0, 50)
      .map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        country_code: r.country_code,
        fallback_ref: r.fallback_ref || "unknown",
        tour_id: r.tour_id,
        destination_url: r.destination_url,
      }));

    const response: ArtistAnalyticsResponse = {
      totalRoutes,
      successfulRoutes,
      fallbackRoutes,
      topCountries,
      fallbackReasons,
      recentFallbacks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching artist analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
