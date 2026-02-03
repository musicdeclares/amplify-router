import { FallbackReason } from "@/app/types/router";

interface ReasonInfo {
  label: string;
  recoveryStep: string;
}

export const FALLBACK_REASONS: Record<FallbackReason, ReasonInfo> = {
  artist_not_found: {
    label: "Artist not found",
    recoveryStep:
      "Check artist handle spelling. [Create artist](/admin/artists) if missing.",
  },
  no_tour: {
    label: "No active tour",
    recoveryStep:
      "[Check tour dates](/admin/tours): tour may have ended or not started yet.",
  },
  no_country: {
    label: "Country not detected",
    recoveryStep:
      "No admin action needed: fan's IP didn't resolve to a country.",
  },
  org_not_found: {
    label: "Org not found",
    recoveryStep: "Org isn't approved in MDEDB. Check org approval status.",
  },
  org_not_specified: {
    label: "No org for country",
    recoveryStep:
      "No org configured for this country. [Add a country default](/admin/organizations) or tour override.",
  },
  org_paused: {
    label: "Org paused",
    recoveryStep:
      "Org was manually paused. [Review org overrides](/admin/organizations) to re-enable.",
  },
  org_no_website: {
    label: "Org has no website",
    recoveryStep:
      "Org record is missing a website URL. Update org details in MDEDB.",
  },
  error: {
    label: "System error",
    recoveryStep: "Unexpected error: check server function logs for details.",
  },
};

/**
 * Parse markdown-style links in a string into segments.
 * e.g. "Check [tour dates](/admin/tours) here" =>
 *   [{ text: "Check " }, { text: "tour dates", href: "/admin/tours" }, { text: " here" }]
 */
export interface TextSegment {
  text: string;
  href?: string;
}

export function parseRecoveryStep(step: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(step)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: step.slice(lastIndex, match.index) });
    }
    segments.push({ text: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < step.length) {
    segments.push({ text: step.slice(lastIndex) });
  }

  return segments;
}

export function formatPercent(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

export function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}
