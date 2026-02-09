"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { TrendChart } from "@/components/analytics/TrendChart";
import { FallbackSummary } from "@/components/analytics/FallbackSummary";
import { FallbackTable } from "@/components/analytics/FallbackTable";
import { getDefaultDateRange, formatPercent } from "@/app/lib/analytics-utils";
import { getCountryLabel } from "@/app/lib/countries";
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

interface DashboardData {
  totalRoutes: number;
  successfulRoutes: number;
  fallbackRoutes: number;
  dailyCounts: DailyCount[];
  topCountries: Array<{ country_code: string; count: number }>;
  topArtists: Array<{ artist_handle: string; count: number }>;
  fallbackReasons: ReasonEntry[];
  recentFallbacks: RecentFallback[];
}

function QuickLinks({ compact }: { compact?: boolean }) {
  const links = [
    {
      href: "/admin/artists",
      label: "Artists",
      description: "Manage artist profiles and their AMPLIFY links",
      icon: "🎤",
    },
    {
      href: "/admin/tours",
      label: "Tours",
      description: "Configure tour dates and organization routing",
      icon: "🏟️",
    },
    {
      href: "/admin/organizations",
      label: "Organizations",
      description: "Manage org recommendations by country",
      icon: "🤲",
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="focus-card block rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-4 flex items-center gap-3">
              <span className="text-xl shrink-0">{link.icon}</span>
              <span className="font-medium text-md">{link.label}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="focus-card block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-2xl shrink-0">{link.icon}</span>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {link.label}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {link.description}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <span className="text-sm font-medium text-mde-body">
              See all {link.label.toLowerCase()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [data, setData] = useState<DashboardData | null>(null);
  const [hasAnyData, setHasAnyData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbacksOpen, setFallbacksOpen] = useState(false);

  const fetchData = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ start_date: start, end_date: end });
      const res = await fetch(`/api/analytics/dashboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: DashboardData = await res.json();
      setData(json);
      return json;
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: check if any data exists at all, then load filtered data
  useEffect(() => {
    async function init() {
      // Check for any data across all time
      const allTimeRes = await fetch("/api/analytics/dashboard");
      if (allTimeRes.ok) {
        const allTime: DashboardData = await allTimeRes.json();
        setHasAnyData(allTime.totalRoutes > 0);
      } else {
        setHasAnyData(false);
      }
      // Fetch filtered data
      await fetchData(startDate, endDate);
    }
    init();
  }, []);

  const handleDateChange = (newStart: string, newEnd: string) => {
    // Swap if end date is before start date
    if (newEnd < newStart) {
      setStartDate(newEnd);
      setEndDate(newStart);
      fetchData(newEnd, newStart);
    } else {
      setStartDate(newStart);
      setEndDate(newEnd);
      fetchData(newStart, newEnd);
    }
  };

  // Loading state
  if (hasAnyData === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  // No data at all — show Quick Links prominently
  if (!hasAnyData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8 space-y-6">
          <QuickLinks />
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm">
                No routing data yet. Routes are logged automatically when fans
                visit artist links.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Data exists — full dashboard
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <DateInput
                value={startDate}
                onChange={(e) => handleDateChange(e.target.value, endDate)}
              />
              <span className="text-muted-foreground hidden sm:inline">–</span>
              <span className="text-muted-foreground text-xs sm:hidden ml-3">
                to
              </span>
              <DateInput
                value={endDate}
                onChange={(e) => handleDateChange(startDate, e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8 space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : data ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Routes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-3xl font-bold ${data.totalRoutes === 0 ? "text-muted-foreground" : ""}`}
                  >
                    {data.totalRoutes.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Successful Routes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-3xl font-bold ${data.successfulRoutes === 0 ? "text-muted-foreground" : "text-green-600"}`}
                  >
                    {data.successfulRoutes.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Fallback Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-3xl font-bold ${data.fallbackRoutes === 0 ? "text-muted-foreground" : "text-red-600"}`}
                  >
                    {formatPercent(data.fallbackRoutes, data.totalRoutes)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trend chart */}
            <Card>
              <CardHeader>
                <CardTitle>Routes Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart dailyCounts={data.dailyCounts} />
              </CardContent>
            </Card>

            {/* Top countries and artists */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topCountries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No data for this period.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.topCountries.map((entry, i) => (
                        <div
                          key={entry.country_code}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            <span className="text-muted-foreground mr-2">
                              {i + 1}.
                            </span>
                            {getCountryLabel(entry.country_code)} (
                            {entry.country_code})
                          </span>
                          <span className="font-medium">
                            {entry.count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Artists</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topArtists.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No data for this period.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.topArtists.map((entry, i) => (
                        <div
                          key={entry.artist_handle}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            <span className="text-muted-foreground mr-2">
                              {i + 1}.
                            </span>
                            {entry.artist_handle}
                          </span>
                          <span className="font-medium">
                            {entry.count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fallback diagnostics */}
            <Card>
              <CardHeader>
                <CardTitle>Fallback Diagnostics</CardTitle>
                <CardDescription>
                  Reason breakdown{data.recentFallbacks.length > 0 ? " and recent fallback events" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Reason Breakdown</h3>
                  <FallbackSummary
                    reasons={data.fallbackReasons}
                    totalFallbacks={data.fallbackRoutes}
                  />
                </div>
                {data.recentFallbacks.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setFallbacksOpen((o) => !o)}
                      className="flex items-center gap-1.5 text-sm font-medium cursor-pointer select-none hover:text-foreground/80"
                      aria-expanded={fallbacksOpen}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${fallbacksOpen ? "rotate-90" : ""}`}
                      />
                      Recent Fallback Events ({data.recentFallbacks.length})
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-200 ease-out ${fallbacksOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-3">
                          <FallbackTable fallbacks={data.recentFallbacks} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links at bottom when data exists */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Quick Links
              </h2>
              <QuickLinks compact />
            </div>
          </>
        ) : (
          <p className="text-red-600">Failed to load dashboard data.</p>
        )}
      </main>
    </div>
  );
}
