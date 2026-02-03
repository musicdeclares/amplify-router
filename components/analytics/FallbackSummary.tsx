"use client";

import Link from "next/link";
import {
  FALLBACK_REASONS,
  formatPercent,
  parseRecoveryStep,
} from "@/app/lib/analytics-utils";
import type { FallbackReason } from "@/app/types/router";

interface ReasonEntry {
  reason: string;
  count: number;
}

interface FallbackSummaryProps {
  reasons: ReasonEntry[];
  totalFallbacks: number;
}

function RecoveryText({ step }: { step: string }) {
  const segments = parseRecoveryStep(step);
  return (
    <p className="text-xs text-muted-foreground">
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

export function FallbackSummary({
  reasons,
  totalFallbacks,
}: FallbackSummaryProps) {
  if (reasons.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No fallback events in this period.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reasons.map(({ reason, count }) => {
        const info = FALLBACK_REASONS[reason as FallbackReason];
        const pct = totalFallbacks > 0 ? (count / totalFallbacks) * 100 : 0;

        return (
          <div key={reason} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{info?.label || reason}</span>
              <span className="text-muted-foreground">
                {count} ({formatPercent(count, totalFallbacks)})
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-destructive/70"
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            {info?.recoveryStep && <RecoveryText step={info.recoveryStep} />}
          </div>
        );
      })}
    </div>
  );
}
