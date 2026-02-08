import {
  getMessage,
  isFallbackReason,
  fallbackContent,
  type FallbackReason,
} from "../fallback-content";

describe("fallback-content", () => {
  describe("getMessage", () => {
    it("returns default message when no reason provided", () => {
      const message = getMessage(null, null);
      expect(message).toBe(fallbackContent.en.messages.default);
    });

    it("returns artist-specific message for no_tour with artist name", () => {
      const message = getMessage("no_tour", "Coldplay");
      expect(message).toBe("Coldplay doesn't have an active tour right now.");
    });

    it("returns generic message for no_tour without artist name", () => {
      const message = getMessage("no_tour", null);
      expect(message).toBe(fallbackContent.en.messages.no_tour_generic);
    });

    it("returns correct message for each fallback reason", () => {
      const reasons: FallbackReason[] = [
        "artist_not_found",
        "no_country",
        "org_not_found",
        "org_not_specified",
        "org_paused",
        "org_no_website",
        "error",
      ];

      for (const reason of reasons) {
        const message = getMessage(reason, null);
        expect(message).toBe(fallbackContent.en.messages[reason]);
      }
    });

    it("handles artist name with special characters", () => {
      const message = getMessage("no_tour", "Björk");
      expect(message).toBe("Björk doesn't have an active tour right now.");
    });
  });

  describe("isFallbackReason", () => {
    it("returns true for valid fallback reasons", () => {
      const validReasons = [
        "artist_not_found",
        "no_tour",
        "no_country",
        "org_not_found",
        "org_not_specified",
        "org_paused",
        "org_no_website",
        "error",
      ];

      for (const reason of validReasons) {
        expect(isFallbackReason(reason)).toBe(true);
      }
    });

    it("returns false for null", () => {
      expect(isFallbackReason(null)).toBe(false);
    });

    it("returns false for invalid strings", () => {
      expect(isFallbackReason("invalid")).toBe(false);
      expect(isFallbackReason("landing")).toBe(false);
      expect(isFallbackReason("")).toBe(false);
    });
  });

  describe("fallbackContent structure", () => {
    it("has all required fields for English locale", () => {
      const en = fallbackContent.en;

      expect(en.title).toBeDefined();
      expect(en.subtitle).toBeDefined();
      expect(en.encouragement).toBeDefined();
      expect(en.messages).toBeDefined();
      expect(en.cta.primary).toBeDefined();
      expect(en.cta.secondary).toBeDefined();
      expect(en.footer).toBeDefined();
    });

    it("has valid CTA URLs", () => {
      const { primary, secondary } = fallbackContent.en.cta;

      expect(primary.url).toMatch(/^https:\/\//);
      expect(secondary.url).toBe("/directory");
    });
  });
});
