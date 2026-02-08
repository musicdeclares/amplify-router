// Documented in: content/help/artist/troubleshooting.md#understanding-fallback-diagnostics
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getCountryLabel } from "@/app/lib/countries";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink } from "lucide-react";

interface FallbackEvent {
  id: string;
  timestamp: string;
  country_code: string | null;
  fallback_ref: string;
  tour_id: string | null;
  destination_url: string;
}

interface FallbackReason {
  reason: string;
  count: number;
}

// Categorize fallback reasons
const ACTIONABLE_REASONS: Record<
  string,
  { label: string; description: string; action: string }
> = {
  no_tour: {
    label: "No active tour",
    description: "Fan visited during a time when no tour is scheduled.",
    action: "Add a tour covering this date",
  },
  org_not_specified: {
    label: "Country not configured",
    description: "Fan visited from a country not set up for the tour.",
    action: "Add this country to your tour",
  },
};

const NON_ACTIONABLE_REASONS: Record<
  string,
  { label: string; description: string }
> = {
  org_paused: {
    label: "Organization paused",
    description:
      "The organization for this country is temporarily paused by MDE.",
  },
  org_no_website: {
    label: "Organization website missing",
    description: "The organization doesn't have a website configured.",
  },
  org_not_found: {
    label: "Organization not found",
    description: "No approved organization is available for this country.",
  },
  no_country: {
    label: "Country not detected",
    description: "Fan's country couldn't be determined from their connection.",
  },
  artist_not_found: {
    label: "Artist not found",
    description: "The artist handle in the URL doesn't exist.",
  },
};

function getFallbackInfo(reason: string) {
  if (ACTIONABLE_REASONS[reason]) {
    return { ...ACTIONABLE_REASONS[reason], actionable: true };
  }
  if (NON_ACTIONABLE_REASONS[reason]) {
    return { ...NON_ACTIONABLE_REASONS[reason], actionable: false };
  }
  return {
    label: reason,
    description: "Unknown fallback reason.",
    actionable: false,
  };
}

export default function DiagnosticsPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = use(params);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");
  const [fallbackReasons, setFallbackReasons] = useState<FallbackReason[]>([]);
  const [recentFallbacks, setRecentFallbacks] = useState<FallbackEvent[]>([]);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [fallbackRoutes, setFallbackRoutes] = useState(0);

  useEffect(() => {
    fetchDiagnostics();
  }, [artistId, days]);

  async function fetchDiagnostics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/artist/${artistId}?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFallbackReasons(data.fallbackReasons || []);
      setRecentFallbacks(data.recentFallbacks || []);
      setTotalRoutes(data.totalRoutes || 0);
      setFallbackRoutes(data.fallbackRoutes || 0);
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
      toast.error("Failed to load diagnostics");
    } finally {
      setLoading(false);
    }
  }

  function copyDiagnosticDetails(event: FallbackEvent) {
    const details = `AMPLIFY Router Fallback Report
---
Timestamp: ${new Date(event.timestamp).toLocaleString()}
Fallback Reason: ${getFallbackInfo(event.fallback_ref).label}
Country: ${event.country_code ? getCountryLabel(event.country_code) : "Unknown"}
Tour ID: ${event.tour_id || "None"}
Event ID: ${event.id}

Please share this with your MDE contact for assistance.`;

    navigator.clipboard.writeText(details);
    toast.success("Details copied to clipboard");
  }

  const actionableReasons = fallbackReasons.filter(
    (r) => ACTIONABLE_REASONS[r.reason],
  );
  const nonActionableReasons = fallbackReasons.filter(
    (r) => NON_ACTIONABLE_REASONS[r.reason] || !ACTIONABLE_REASONS[r.reason],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fallback Diagnostics</h1>
          <p className="text-muted-foreground mt-1">
            Understand why some fans see the fallback page instead of being
            routed to an organization
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {totalRoutes === 0 ? (
            <p className="text-muted-foreground">
              No routing events in the last {days} days.
            </p>
          ) : fallbackRoutes === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>
                All {totalRoutes} routes were successful — no fallbacks!
              </span>
            </div>
          ) : (
            <p>
              <span className="font-medium">{fallbackRoutes}</span> of{" "}
              <span className="font-medium">{totalRoutes}</span> routes (
              {((fallbackRoutes / totalRoutes) * 100).toFixed(1)}%) resulted in
              a fallback.
            </p>
          )}
        </CardContent>
      </Card>

      {fallbackRoutes > 0 && (
        <>
          {/* Actionable Issues */}
          {actionableReasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Issues You Can Fix
                </CardTitle>
                <CardDescription>
                  These fallbacks can be resolved by updating your tour
                  configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {actionableReasons.map((r) => {
                  const info = getFallbackInfo(r.reason);
                  return (
                    <div
                      key={r.reason}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{info.label}</span>
                          <Badge variant="secondary">{r.count} events</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {info.description}
                        </p>
                      </div>
                      <Link href={`/artist/${artistId}/tours`}>
                        <Button size="sm" variant="outline">
                          {"action" in info ? info.action : "View Tours"}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Non-Actionable Issues */}
          {nonActionableReasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Issues Requiring MDE Assistance
                </CardTitle>
                <CardDescription>
                  These fallbacks require help from Music Declares Emergency to
                  resolve
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {nonActionableReasons.map((r) => {
                  const info = getFallbackInfo(r.reason);
                  return (
                    <div
                      key={r.reason}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{info.label}</span>
                          <Badge variant="outline">{r.count} events</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Recent Fallback Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Recent Fallback Events
              </CardTitle>
              <CardDescription>
                Individual fallback events with details for troubleshooting with
                your MDE rep
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentFallbacks.length === 0 ? (
                <p className="text-muted-foreground">
                  No recent fallback events.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentFallbacks.slice(0, 20).map((event) => {
                    const info = getFallbackInfo(event.fallback_ref);
                    return (
                      <div
                        key={event.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg text-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{info.label}</span>
                            {event.country_code && (
                              <Badge variant="outline">
                                {getCountryLabel(event.country_code)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {info.actionable && (
                            <Link href={`/artist/${artistId}/tours`}>
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyDiagnosticDetails(event)}
                            title="Copy details for reporting"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {recentFallbacks.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Showing 20 of {recentFallbacks.length} events
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
