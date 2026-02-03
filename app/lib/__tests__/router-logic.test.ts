/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCountryFromRequest, routeRequest } from "../router-logic";

// Configurable mock state
const mockState = {
  artist: null as unknown,
  artistError: null as unknown,
  tours: [] as unknown[],
  toursError: null as unknown,
  orgOverride: null as unknown,
  countryDefault: null as unknown,
  countryDefaultError: null as unknown,
};

// Helper to reset mock state
function resetMockState() {
  mockState.artist = null;
  mockState.artistError = null;
  mockState.tours = [];
  mockState.toursError = null;
  mockState.orgOverride = null;
  mockState.countryDefault = null;
  mockState.countryDefaultError = null;
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
      if (table === "router_artists") {
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
      if (table === "router_tours") {
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
      if (table === "router_country_defaults") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(() =>
            Promise.resolve({
              data: mockState.countryDefault,
              error: mockState.countryDefaultError,
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
  handle: "radiohead",
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

const createTourOverride = (overrides = {}) => ({
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
  router_tour_overrides: [
    createTourOverride(),
    createTourOverride({
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

const createCountryDefault = (overrides = {}) => ({
  id: "eeee1111-1111-1111-1111-111111111111",
  country_code: "US",
  org_id: "00000000-0000-0000-0000-000000000001",
  effective_from: null,
  effective_to: null,
  org: createOrg(),
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
    it("should route to artist-selected org when configured", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistHandle: "radiohead",
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
        artistHandle: "radiohead",
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
        artistHandle: "radiohead",
        countryCode: "us", // lowercase
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://example.com");
    });

    it("should route to MDE default when no artist override configured", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          router_tour_overrides: [], // No artist overrides
        }),
      ];
      mockState.countryDefault = createCountryDefault({
        country_code: "US",
        org: createOrg({
          org_name: "MDE Default Org",
          website: "https://mde-default.org",
        }),
      });

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://mde-default.org");
    });

    it("should fall through to MDE default when artist-selected org not in view", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          router_tour_overrides: [
            createTourOverride({
              org_id: "00000000-0000-0000-0000-000000000099",
              org: null, // Org not in org_public_view
            }),
          ],
        }),
      ];
      mockState.countryDefault = createCountryDefault({
        org: createOrg({
          org_name: "MDE Fallback Org",
          website: "https://mde-fallback.org",
        }),
      });

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://mde-fallback.org");
      expect(result.analytics.override_org_fallthrough).toBe(true);
      expect(result.analytics.attempted_override_org_id).toBe(
        "00000000-0000-0000-0000-000000000099",
      );
    });
  });

  describe("routeRequest - Artist Failures", () => {
    it("should fallback when artist not found", async () => {
      mockState.artist = null;
      mockState.artistError = { code: "PGRST116" };

      const result = await routeRequest({
        artistHandle: "unknown-artist",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("artist_not_found");
      expect(result.destinationUrl).toContain("ref=artist_not_found");
    });

    it("should fallback when artist is inactive", async () => {
      // When artist.enabled = false, the query returns no match
      mockState.artist = null;
      mockState.artistError = { code: "PGRST116" };

      const result = await routeRequest({
        artistHandle: "inactive-artist",
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
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
      expect(result.destinationUrl).toContain("no_tour");
    });

    it("should fallback when tour dates are in the past (outside post-window)", async () => {
      mockState.artist = createArtist();
      // Tour ended 30 days ago with only 3-day post-window
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const endDate = new Date(pastDate);
      const startDate = new Date(pastDate);
      startDate.setDate(startDate.getDate() - 60);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          post_tour_window_days: 3, // Not enough to reach today
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
    });

    it("should fallback when tour dates are in the future (outside pre-window)", async () => {
      mockState.artist = createArtist();
      // Tour starts 30 days from now with only 7-day pre-window
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const startDate = new Date(futureDate);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 60);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pre_tour_window_days: 7, // Not enough to reach today
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
    });

    it("should fallback when tour is inactive", async () => {
      // Inactive tours are filtered by the query, so empty result
      mockState.artist = createArtist();
      mockState.tours = [];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_tour");
    });
  });

  describe("routeRequest - Pre/Post Tour Windows", () => {
    it("should route successfully during pre-tour window", async () => {
      mockState.artist = createArtist();
      // Tour starts 5 days from now with 7-day pre-window (today is within window)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pre_tour_window_days: 7,
          post_tour_window_days: 0,
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://example.com");
    });

    it("should route successfully during post-tour window", async () => {
      mockState.artist = createArtist();
      // Tour ended 2 days ago with 5-day post-window (today is within window)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 2);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pre_tour_window_days: 0,
          post_tour_window_days: 5,
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://example.com");
    });

    it("should route successfully on the exact pre-window boundary", async () => {
      mockState.artist = createArtist();
      // Tour starts exactly 7 days from now with 7-day pre-window
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pre_tour_window_days: 7,
          post_tour_window_days: 0,
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
    });

    it("should route successfully on the exact post-window boundary", async () => {
      mockState.artist = createArtist();
      // Tour ended exactly 5 days ago with 5-day post-window
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 5);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pre_tour_window_days: 0,
          post_tour_window_days: 5,
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
    });

    it("should route successfully with zero window days during active tour", async () => {
      mockState.artist = createArtist();
      // Tour is currently active (no pre/post windows needed)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pre_tour_window_days: 0,
          post_tour_window_days: 0,
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
    });

    it("should handle null window days as zero", async () => {
      mockState.artist = createArtist();
      // Tour is currently active with null window values
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);

      mockState.tours = [
        createTour({
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          pre_tour_window_days: null,
          post_tour_window_days: null,
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("routeRequest - Country Failures", () => {
    it("should fallback with org_not_specified when no config for country", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];
      mockState.countryDefault = null; // No MDE default either

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "DE", // Not configured
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("org_not_specified");
      expect(result.destinationUrl).toContain("ref=org_not_specified");
    });

    it("should fallback when no country provided", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("no_country");
      expect(result.destinationUrl).toContain("ref=no_country");
    });

    it("should fallback when tour country override is inactive", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          router_tour_overrides: [
            createTourOverride({ enabled: false }), // US inactive
          ],
        }),
      ];
      mockState.countryDefault = null; // No MDE default

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("org_not_specified");
    });

    it("should route to MDE default when override inactive but default exists", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          router_tour_overrides: [
            createTourOverride({ enabled: false }), // US inactive
          ],
        }),
      ];
      mockState.countryDefault = createCountryDefault({
        org: createOrg({
          org_name: "MDE Default Org",
          website: "https://mde-default.org",
        }),
      });

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.destinationUrl).toBe("https://mde-default.org");
    });
  });

  describe("routeRequest - Organization Failures", () => {
    it("should fallback when org is paused via override", async () => {
      mockState.artist = createArtist();
      mockState.tours = [createTour()];
      mockState.orgOverride = { enabled: false };

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("org_paused");
      expect(result.destinationUrl).toContain("org_paused");
    });

    it("should fallback with org_not_found when MDE default org not in view", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          router_tour_overrides: [], // No artist overrides
        }),
      ];
      mockState.countryDefault = createCountryDefault({
        org: null, // MDE default org not in org_public_view
      });

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(false);
      expect(result.fallbackReason).toBe("org_not_found");
    });

    it("should fallback when org has no website", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          router_tour_overrides: [
            createTourOverride({
              org: createOrg({ website: null }),
            }),
          ],
        }),
      ];

      const result = await routeRequest({
        artistHandle: "radiohead",
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
        artistHandle: "radiohead",
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
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.analytics).toBeDefined();
      expect(result.analytics?.artist_handle).toBe("radiohead");
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
        artistHandle: "unknown",
        countryCode: "US",
      });

      expect(result.analytics).toBeDefined();
      expect(result.analytics?.artist_handle).toBe("unknown");
      // fallback_ref is derived from destination_url ref= param (generated column in DB)
      expect(result.analytics?.destination_url).toContain(
        "ref=artist_not_found",
      );
    });

    it("should track override org fallthrough in analytics", async () => {
      mockState.artist = createArtist();
      mockState.tours = [
        createTour({
          router_tour_overrides: [
            createTourOverride({
              org_id: "failed-org-id",
              org: null, // Org not in view
            }),
          ],
        }),
      ];
      mockState.countryDefault = createCountryDefault({
        org: createOrg({ website: "https://fallback.org" }),
      });

      const result = await routeRequest({
        artistHandle: "radiohead",
        countryCode: "US",
      });

      expect(result.success).toBe(true);
      expect(result.analytics?.override_org_fallthrough).toBe(true);
      expect(result.analytics?.attempted_override_org_id).toBe("failed-org-id");
    });
  });
});
