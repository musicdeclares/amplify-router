import {
  FALLBACK_REASONS,
  formatPercent,
  getDefaultDateRange,
  parseRecoveryStep,
} from "../analytics-utils";
import type { FallbackReason } from "@/app/types/router";

describe("FALLBACK_REASONS", () => {
  const allReasons: FallbackReason[] = [
    "artist_not_found",
    "no_tour",
    "no_country",
    "org_not_found",
    "org_not_specified",
    "org_paused",
    "org_no_website",
    "error",
  ];

  it("covers every FallbackReason type", () => {
    for (const reason of allReasons) {
      expect(FALLBACK_REASONS[reason]).toBeDefined();
    }
  });

  it("has no extra keys beyond FallbackReason types", () => {
    const keys = Object.keys(FALLBACK_REASONS);
    expect(keys.sort()).toEqual([...allReasons].sort());
  });

  it("each entry has a non-empty label and recoveryStep", () => {
    for (const reason of allReasons) {
      const info = FALLBACK_REASONS[reason];
      expect(info.label).toBeTruthy();
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.recoveryStep).toBeTruthy();
      expect(info.recoveryStep.length).toBeGreaterThan(0);
    }
  });
});

describe("formatPercent", () => {
  it("returns correct percentage for normal values", () => {
    expect(formatPercent(25, 100)).toBe("25%");
    expect(formatPercent(1, 3)).toBe("33%");
    expect(formatPercent(2, 3)).toBe("67%");
  });

  it("returns '0%' when total is zero", () => {
    expect(formatPercent(0, 0)).toBe("0%");
    expect(formatPercent(5, 0)).toBe("0%");
  });

  it("returns '100%' when n equals total", () => {
    expect(formatPercent(50, 50)).toBe("100%");
  });

  it("rounds correctly", () => {
    expect(formatPercent(1, 6)).toBe("17%");
    expect(formatPercent(5, 6)).toBe("83%");
  });
});

describe("parseRecoveryStep", () => {
  it("returns plain text with no links", () => {
    const result = parseRecoveryStep("No admin action needed.");
    expect(result).toEqual([{ text: "No admin action needed." }]);
  });

  it("parses a single markdown link", () => {
    const result = parseRecoveryStep("[Check tours](/admin/tours) for details.");
    expect(result).toEqual([
      { text: "Check tours", href: "/admin/tours" },
      { text: " for details." },
    ]);
  });

  it("parses multiple markdown links", () => {
    const result = parseRecoveryStep(
      "See [artists](/admin/artists) or [tours](/admin/tours).",
    );
    expect(result).toEqual([
      { text: "See " },
      { text: "artists", href: "/admin/artists" },
      { text: " or " },
      { text: "tours", href: "/admin/tours" },
      { text: "." },
    ]);
  });

  it("handles link at the start of the string", () => {
    const result = parseRecoveryStep("[Create artist](/admin/artists) if missing.");
    expect(result).toEqual([
      { text: "Create artist", href: "/admin/artists" },
      { text: " if missing." },
    ]);
  });
});

describe("getDefaultDateRange", () => {
  it("returns valid ISO date strings", () => {
    const { start, end } = getDefaultDateRange();
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("end is today", () => {
    const { end } = getDefaultDateRange();
    const today = new Date().toISOString().split("T")[0];
    expect(end).toBe(today);
  });

  it("start is 7 days before end", () => {
    const { start, end } = getDefaultDateRange();
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });
});
