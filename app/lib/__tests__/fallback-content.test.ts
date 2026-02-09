import {
  getMessage,
  isFallbackReason,
  fallbackContent,
  detectLocaleFromHeader,
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

    it("has all required fields for French locale", () => {
      const fr = fallbackContent.fr;

      expect(fr.title).toBeDefined();
      expect(fr.subtitle).toBeDefined();
      expect(fr.encouragement).toBeDefined();
      expect(fr.messages).toBeDefined();
      expect(fr.cta.primary).toBeDefined();
      expect(fr.cta.secondary).toBeDefined();
      expect(fr.footer).toBeDefined();
    });

    it("has valid CTA URLs", () => {
      const { primary, secondary } = fallbackContent.en.cta;

      expect(primary.url).toMatch(/^https:\/\//);
      expect(secondary.url).toBe("/directory");
    });

    it("French translations are different from English", () => {
      expect(fallbackContent.fr.title).not.toBe(fallbackContent.en.title);
      expect(fallbackContent.fr.encouragement).not.toBe(
        fallbackContent.en.encouragement
      );
      expect(fallbackContent.fr.cta.primary.buttonText).not.toBe(
        fallbackContent.en.cta.primary.buttonText
      );
    });
  });

  describe("detectLocaleFromHeader", () => {
    it("returns 'en' for null header", () => {
      expect(detectLocaleFromHeader(null)).toBe("en");
    });

    it("returns 'en' for empty header", () => {
      expect(detectLocaleFromHeader("")).toBe("en");
    });

    it("returns 'fr' when French is primary language", () => {
      expect(detectLocaleFromHeader("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
      expect(detectLocaleFromHeader("fr")).toBe("fr");
      expect(detectLocaleFromHeader("fr-CA")).toBe("fr");
    });

    it("returns 'en' when English is primary language", () => {
      expect(detectLocaleFromHeader("en-US,en;q=0.9,fr;q=0.8")).toBe("en");
      expect(detectLocaleFromHeader("en")).toBe("en");
      expect(detectLocaleFromHeader("en-GB")).toBe("en");
    });

    it("returns 'en' for unsupported primary languages", () => {
      expect(detectLocaleFromHeader("de-DE,de;q=0.9,en;q=0.8")).toBe("en");
      expect(detectLocaleFromHeader("es,en;q=0.9")).toBe("en");
    });

    it("respects q-values for priority", () => {
      // French has higher priority
      expect(detectLocaleFromHeader("en;q=0.8,fr;q=0.9")).toBe("fr");
      // English has higher priority
      expect(detectLocaleFromHeader("fr;q=0.8,en;q=0.9")).toBe("en");
    });
  });

  describe("getMessage with locale", () => {
    it("returns French message for French locale", () => {
      const message = getMessage(null, null, "fr");
      expect(message).toBe(fallbackContent.fr.messages.default);
    });

    it("returns French artist-specific message", () => {
      const message = getMessage("no_tour", "Stromae", "fr");
      expect(message).toBe("Stromae n'a pas de tournée active en ce moment.");
    });
  });
});
