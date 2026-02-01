/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCountryFromRequest, routeRequest } from "../router-logic";

// Configurable mock state
const mockState = {
  artist: null as unknown,
  artistError: null as unknown,
  tours: [] as unknown[],
  toursError: null as unknown,
  orgOverride: null as unknown,
};

// Helper to reset mock state
function resetMockState() {
  mockState.artist = null;
  mockState.artistError = null;
  mockState.tours = [];
  mockState.toursError = null;
  mockState.orgOverride = null;
}

// Mock Supabase with configurable responses
jest.mock("../supabase", () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) => {
      if (table === "router_config") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { value: "https://www.musicdeclares.net/amplify" },
            error: null,
          }),
        };
      }
      if (table === "artists") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(() =>
            Promise.resolve({
              data: mockState.artist,
              error: mockState.artistError,
            }),
          ),
        };
      }
      if (table === "tours") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() =>
            Promise.resolve({
              data: mockState.tours,
              error: mockState.toursError,
            }),
          ),
        };
      }
      if (table === "router_org_overrides") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockImplementation(() =>
              Promise.resolve({ data: mockState.orgOverride, error: null }),
            ),
        };
      }
      if (table === "router_analytics") {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  },
}));

// Test fixtures
const createArtist = (overrides = {}) => ({
  id: "11111111-1111-1111-1111-111111111111",
  slug: "radiohead",
  name: "Radiohead",
  enabled: true,
  ...overrides,
});

const createOrg = (overrides = {}) => ({
  id: "00000000-0000-0000-0000-000000000001",
  org_name: "Test Climate Org US",
  country_code: "US",
  website: "https://example.com",
  approval_status: "approved",
  ...overrides,
});

const createTourCountryConfig = (overrides = {}) => ({
  id: "cccc1111-1111-1111-1111-111111111111",
  tour_id: "aaaa1111-1111-1111-1111-111111111111",
  country_code: "US",
  org_id: "00000000-0000-0000-0000-000000000001",
  enabled: true,
  org: createOrg(),
  ...overrides,
});

const createTour = (overrides = {}) => ({
  id: "aaaa1111-1111-1111-1111-111111111111",
  artist_id: "11111111-1111-1111-1111-111111111111",
  name: "Radiohead World Tour 2026",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  pre_tour_window_days: 7,
  post_tour_window_days: 3,
  enabled: true,
  tour_country_configs: [
    createTourCountryConfig(),
    createTourCountryConfig({
      id: "dddd2222-2222-2222-2222-222222222222",
      country_code: "GB",
      org_id: "00000000-0000-0000-0000-000000000002",
      org: createOrg({
        id: "00000000-0000-0000-0000-000000000002",
        org_name: "Test Climate Org UK",
        country_code: "GB",
        website: "https://example.co.uk",
      }),
    }),
  ],
  ...overrides,
});

describe("Router Logic", () => {
  beforeEach(() => {
    resetMockState();
  });

  describe("getCountryFromRequest", () => {
    it("should extract country from Vercel headers", () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === "x-vercel-ip-country") return "US";
            return null;
          }),
        },
      } as any;

      expect(getCountryFromRequest(mockRequest)).toBe("US");
    });

    it("should fall back to Cloudflare headers", () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === "x-vercel-ip-country") return "unknown";
            if (header === "cf-ipcountry") return "GB";
            return null;
          }),
        },
      } as any;

      expect(getCountryFromRequest(mockRequest)).toBe("GB");
    });

    it("should return undefined when no country headers available", () => {
      const mockRequest = {
        headers: { get: jest.fn(() => null) },
      } as unknown as Request;

      expect(getCountryFromRequest(mockRequest)).toBeUndefined();
    });

    it("should ignore Cloudflare XX (unknown) country", () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === "x-vercel-ip-country") return null;
            if (header === "cf-ipcountry") return "XX";
            return null;
          }),
        },
      } as any;

      expect(getCountryFromRequest(mockRequest)).toBeUndefined();
    });
  });

  describe("routeRequest - Success Cases", () => {
    it("should route to org URL when artist, tour, and country match", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://example.com");
      expect(result.fallbackReason).toBeUndefined();
      expect(result.orgId).toBe("00000000-0000-0000-0000-000000000001");
      expect(result.tourId).toBe("aaaa1111-1111-1111-1111-111111111111");
    });

    it("should route to correct org based on country", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "GB",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://example.co.uk");
      expect(result.orgId).toBe("00000000-0000-0000-0000-000000000002");
    });

    it("should match country code case-insensitively", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "us", // lowercase
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://example.com");
    });
  });

  describe("routeRequest - Artist Failures", () => {
    it("should fallback when artist not found", async () => {
      mockState.artist = null;
      mockState.artistError = { code: "PGRST116" };

      const result = await routeRequest({
        artistSlug: "unknown-artist",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("artist_not_found");
      expect(result.destinationUrl).toContain("ref=artist_not_found");
    });

    it("should fallback when artist is disabled", async () => {
      // When artist.enabled = false, the query returns no match
      mockState.artist = null;
      mockState.artistError = { code: "PGRST116" };

      const result = await routeRequest({
        artistSlug: "disabled-artist",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("artist_not_found");
    });
  });

  describe("routeRequest - Tour Failures", () => {
    it("should fallback when no active tour exists", async () => {
      mockState.artist = createArtist();
      mockState.tours = []; // No tours

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
      expect(result.destinationUrl).toContain("no_tour");
    });

    it("should fallback when tour dates are in the past", async () => {
      mockState.artist = createArtist();
      // Database filters out past tours, so we simulate by returning empty array
      // (date filtering happens in DB via .lte/.gte constraints)
      mockState.tours = [];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
    });

    it("should fallback when tour dates are in the future", async () => {
      mockState.artist = createArtist();
      // Database filters out future tours, so we simulate by returning empty array
      // (date filtering happens in DB via .lte/.gte constraints)
      mockState.tours = [];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
    });

    it("should fallback when tour is disabled", async () => {
      // Disabled tours are filtered by the query, so empty result
      mockState.artist = createArtist();
      mockState.tours = [];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
    });
  });

  describe("routeRequest - Country Failures", () => {
    it("should fallback when country not configured for tour", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "DE", // Not configured
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("country_not_supported");
      expect(result.destinationUrl).toContain("ref=country_not_supported");
    });

    it("should fallback when no country provided", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_country");
      expect(result.destinationUrl).toContain("ref=no_country");
    });

    it("should fallback when tour country config is disabled", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          tour_country_configs: [
            createTourCountryConfig({ enabled: false }), // US disabled
          ],
        }),
      ];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("country_not_supported");
    });
  });

  describe("routeRequest - Organization Failures", () => {
    it("should fallback when org is paused via override", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];
      mockState.orgOverride = { enabled: false };

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("org_paused");
      expect(result.destinationUrl).toContain("org_paused");
    });

    it("should fallback when org is not in view (not approved)", async () => {
      // When using org_public_view, unapproved orgs return null in the join
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          tour_country_configs: [
            createTourCountryConfig({
              org: null, // Simulates org not being in org_public_view
            }),
          ],
        }),
      ];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("org_not_found");
    });

    it("should fallback when org has no website", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          tour_country_configs: [
            createTourCountryConfig({
              org: createOrg({ website: null }),
            }),
          ],
        }),
      ];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("org_no_website");
      expect(result.destinationUrl).toContain("ref=org_no_website");
    });

    it("should succeed when org override exists but is enabled", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];
      mockState.orgOverride = { enabled: true };

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://example.com");
    });
  });

  describe("routeRequest - Analytics", () => {
    it("should include analytics data on success", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistSlug: "radiohead",
        countryCode: "US",
      });

      expect(result.analytics).toBeDefined();
      expect(result.analytics?.artist_slug).toBe("radiohead");
      expect(result.analytics?.country_code).toBe("US");
      expect(result.analytics?.org_id).toBe(
        "00000000-0000-0000-0000-000000000001",
      );
      expect(result.analytics?.tour_id).toBe(
        "aaaa1111-1111-1111-1111-111111111111",
      );
      // No ref= param on success - destination is the org website
      expect(result.analytics?.destination_url).toBe("https://example.com");
    });

    it("should include analytics data on fallback", async () => {
      mockState.artist = null;
      mockState.artistError = { code: "PGRST116" };

      const result = await routeRequest({
        artistSlug: "unknown",
        countryCode: "US",
      });

      expect(result.analytics).toBeDefined();
      expect(result.analytics?.artist_slug).toBe("unknown");
      // fallback_ref is derived from destination_url ref= param (generated column in DB)
      expect(result.analytics?.destination_url).toContain(
        "ref=artist_not_found",
      );
    });
  });
});
