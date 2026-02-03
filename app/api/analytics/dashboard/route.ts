import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import type { RouterAnalytics } from "@/app/types/router";

interface DailyCount {
  date: string;
  total: number;
  fallbacks: number;
}

interface ReasonEntry {
  reason: string;
  count: number;
}

interface RecentFallback extends RouterAnalytics {
  tour_name?: string;
  org_name?: string;
}

interface DashboardResponse {
  totalRoutes: number;
  successfulRoutes: number;
  fallbackRoutes: number;
  dailyCounts: DailyCount[];
  topCountries: Array<{ country_code: string; count: number }>;
  topArtists: Array<{ artist_handle: string; count: number }>;
  fallbackReasons: ReasonEntry[];
  recentFallbacks: RecentFallback[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Fetch all analytics rows for the date range
    let query = supabaseAdmin
      .from("router_analytics")
      .select("*")
      .order("timestamp", { ascending: false });

    if (startDate) {
      query = query.gte("timestamp", `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte("timestamp", `${endDate}T23:59:59`);
    }

    const { data: analytics, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (analytics || []) as RouterAnalytics[];

    // Compute aggregations in JS
    const totalRoutes = rows.length;
    const fallbackRows = rows.filter(
      (r) => r.fallback_ref !== null && r.fallback_ref !== "",
    );
    const fallbackRoutes = fallbackRows.length;
    const successfulRoutes = totalRoutes - fallbackRoutes;

    // Daily counts
    const dailyMap = new Map<string, { total: number; fallbacks: number }>();
    for (const row of rows) {
      const date = row.timestamp.split("T")[0];
      const entry = dailyMap.get(date) || { total: 0, fallbacks: 0 };
      entry.total++;
      if (row.fallback_ref) {
        entry.fallbacks++;
      }
      dailyMap.set(date, entry);
    }
    const dailyCounts: DailyCount[] = Array.from(dailyMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

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

    // Top artists
    const artistMap = new Map<string, number>();
    for (const row of rows) {
      artistMap.set(
        row.artist_handle,
        (artistMap.get(row.artist_handle) || 0) + 1,
      );
    }
    const topArtists = Array.from(artistMap.entries())
      .map(([artist_handle, count]) => ({ artist_handle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Fallback reasons
    const reasonMap = new Map<string, number>();
    for (const row of fallbackRows) {
      const reason = row.fallback_ref || "unknown";
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    }
    const fallbackReasons: ReasonEntry[] = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // Recent fallbacks (last 50) with joined tour name and org name
    const recentFallbackRows = fallbackRows.slice(0, 50);

    // Collect unique tour IDs and attempted org IDs for batch lookup
    const tourIds = [
      ...new Set(
        recentFallbackRows
          .map((r) => r.tour_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const orgIds = [
      ...new Set(
        recentFallbackRows
          .map((r) => r.attempted_override_org_id)
          .filter((id): id is string => id !== null),
      ),
    ];

    // Batch fetch tour names
    const tourNameMap = new Map<string, string>();
    if (tourIds.length > 0) {
      const { data: tours } = (await supabaseAdmin
        .from("router_tours")
        .select("*")
        .in("id", tourIds)) as {
        data: Array<{ id: string; name: string }> | null;
      };
      for (const tour of tours || []) {
        tourNameMap.set(tour.id, tour.name);
      }
    }

    // Batch fetch org names from org_public_view
    const orgNameMap = new Map<string, string>();
    if (orgIds.length > 0) {
      const { data: orgs } = (await supabaseAdmin
        .from("org_public_view")
        .select("*")
        .in("id", orgIds)) as {
        data: Array<{ id: string; org_name: string }> | null;
      };
      for (const org of orgs || []) {
        orgNameMap.set(org.id, org.org_name);
      }
    }

    const recentFallbacks: RecentFallback[] = recentFallbackRows.map((row) => ({
      ...row,
      tour_name: row.tour_id ? tourNameMap.get(row.tour_id) : undefined,
      org_name: row.attempted_override_org_id
        ? orgNameMap.get(row.attempted_override_org_id)
        : undefined,
    }));

    const response: DashboardResponse = {
      totalRoutes,
      successfulRoutes,
      fallbackRoutes,
      dailyCounts,
      topCountries,
      topArtists,
      fallbackReasons,
      recentFallbacks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard analytics" },
      { status: 500 },
    );
  }
}
