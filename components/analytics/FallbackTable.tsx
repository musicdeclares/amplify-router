"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FALLBACK_REASONS, parseRecoveryStep } from "@/app/lib/analytics-utils";
import { getCountryLabel } from "@/app/lib/countries";
import type { FallbackReason, RouterAnalytics } from "@/app/types/router";

interface RecentFallback extends RouterAnalytics {
  tour_name?: string;
  org_name?: string;
}

interface FallbackTableProps {
  fallbacks: RecentFallback[];
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RecoveryText({ step }: { step: string }) {
  const segments = parseRecoveryStep(step);
  return (
    <p className="text-xs text-muted-foreground mt-0.5">
      {segments.map((seg, i) =>
        seg.href ? (
          <Link
            key={i}
            href={seg.href}
            className="underline hover:text-foreground"
          >
            {seg.text}
          </Link>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  );
}

function formatCountry(code: string | null): string {
  if (!code) return "—";
  return `${getCountryLabel(code)} (${code})`;
}

export function FallbackTable({ fallbacks }: FallbackTableProps) {
  if (fallbacks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No fallback events in this period.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden sm:table-cell">Time</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead className="hidden sm:table-cell">Country</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="hidden sm:table-cell">Tour</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fallbacks.map((row) => {
          const reason = row.fallback_ref as FallbackReason | null;
          const info = reason ? FALLBACK_REASONS[reason] : null;
          const tourLabel =
            row.tour_name || (row.tour_id ? row.tour_id.slice(0, 8) : null);

          return (
            <TableRow key={row.id}>
              <TableCell className="hidden sm:table-cell whitespace-nowrap text-sm">
                {formatTimestamp(row.timestamp)}
              </TableCell>
              <TableCell>
                <span className="font-medium">{row.artist_handle}</span>
                {/* Mobile-only sub-lines for time, country, tour */}
                <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                  {formatTimestamp(row.timestamp)}
                </span>
                {row.country_code && (
                  <span className="block sm:hidden text-xs text-muted-foreground">
                    {formatCountry(row.country_code)}
                  </span>
                )}
                {tourLabel && (
                  <span className="block sm:hidden text-xs text-muted-foreground">
                    {tourLabel}
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {formatCountry(row.country_code)}
              </TableCell>
              <TableCell>
                <div>
                  <span className="font-medium text-sm">
                    {info?.label || reason || "Unknown"}
                  </span>
                  {row.override_org_fallthrough && (
                    <Badge variant="destructive" className="text-xs ml-1.5">
                      Org override fallthrough
                    </Badge>
                  )}
                  {row.org_name && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (tried: {row.org_name})
                    </span>
                  )}
                  <span className="hidden sm:block">
                    {info?.recoveryStep && (
                      <RecoveryText step={info.recoveryStep} />
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">
                {tourLabel || "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
