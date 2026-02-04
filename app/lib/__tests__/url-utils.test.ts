import {
  getPrimaryDomain,
  isSamePrimaryDomain,
  stripUtmParams,
  appendUtmParams,
} from "../url-utils";

describe("getPrimaryDomain", () => {
  it("should extract domain from a full URL", () => {
    expect(getPrimaryDomain("https://www.example.com/path")).toBe(
      "example.com",
    );
  });

  it("should extract domain from a bare hostname", () => {
    expect(getPrimaryDomain("example.com")).toBe("example.com");
  });

  it("should strip www prefix", () => {
    expect(getPrimaryDomain("https://www.climatechangemakers.org")).toBe(
      "climatechangemakers.org",
    );
  });

  it("should strip subdomains", () => {
    expect(
      getPrimaryDomain("https://action.climatechangemakers.org/path"),
    ).toBe("climatechangemakers.org");
  });

  it("should handle multi-part TLDs", () => {
    expect(getPrimaryDomain("https://www.example.co.uk")).toBe(
      "example.co.uk",
    );
    expect(getPrimaryDomain("https://sub.example.org.au")).toBe(
      "example.org.au",
    );
    expect(getPrimaryDomain("https://example.com.br")).toBe("example.com.br");
  });

  it("should return null for single-part hostnames", () => {
    expect(getPrimaryDomain("localhost")).toBeNull();
  });

  it("should return null for invalid URLs", () => {
    expect(getPrimaryDomain("not a url at all")).toBeNull();
  });

  it("should be case-insensitive", () => {
    expect(getPrimaryDomain("https://WWW.Example.COM")).toBe("example.com");
  });
});

describe("isSamePrimaryDomain", () => {
  it("should match same domain with different subdomains", () => {
    expect(
      isSamePrimaryDomain(
        "https://action.example.org",
        "https://www.example.org",
      ),
    ).toBe(true);
  });

  it("should match same domain with and without www", () => {
    expect(
      isSamePrimaryDomain("https://www.example.com", "https://example.com"),
    ).toBe(true);
  });

  it("should not match different domains", () => {
    expect(
      isSamePrimaryDomain("https://example.com", "https://other.com"),
    ).toBe(false);
  });

  it("should handle multi-part TLDs correctly", () => {
    expect(
      isSamePrimaryDomain(
        "https://sub.example.co.uk",
        "https://example.co.uk",
      ),
    ).toBe(true);
  });

  it("should return false when either URL is invalid", () => {
    expect(isSamePrimaryDomain("not-a-url", "https://example.com")).toBe(
      false,
    );
  });
});

describe("stripUtmParams", () => {
  it("should strip utm_* parameters from URL", () => {
    const result = stripUtmParams(
      "https://example.com/page?utm_source=test&utm_medium=web&keep=yes",
    );
    expect(result.stripped).toBe(true);
    expect(result.url).toBe("https://example.com/page?keep=yes");
  });

  it("should return original URL if no utm params", () => {
    const url = "https://example.com/page?ref=hello";
    const result = stripUtmParams(url);
    expect(result.stripped).toBe(false);
    expect(result.url).toBe(url);
  });

  it("should handle URLs with only utm params", () => {
    const result = stripUtmParams(
      "https://example.com/?utm_source=test&utm_campaign=abc",
    );
    expect(result.stripped).toBe(true);
    expect(result.url).toBe("https://example.com/");
  });

  it("should be case-insensitive for utm prefix", () => {
    const result = stripUtmParams(
      "https://example.com/?UTM_SOURCE=test&utm_Medium=web",
    );
    expect(result.stripped).toBe(true);
  });

  it("should return original string for invalid URLs", () => {
    const result = stripUtmParams("not a url");
    expect(result.stripped).toBe(false);
    expect(result.url).toBe("not a url");
  });
});

describe("appendUtmParams", () => {
  it("should append utm params to a clean URL", () => {
    const result = appendUtmParams("https://example.com", "radiohead");
    expect(result).toBe(
      "https://example.com/?utm_source=mde_amplify_rtr&utm_medium=referral&utm_campaign=radiohead",
    );
  });

  it("should preserve existing non-utm query params", () => {
    const result = appendUtmParams(
      "https://example.com/page?ref=hello",
      "radiohead",
    );
    const parsed = new URL(result);
    expect(parsed.searchParams.get("ref")).toBe("hello");
    expect(parsed.searchParams.get("utm_source")).toBe("mde_amplify_rtr");
    expect(parsed.searchParams.get("utm_medium")).toBe("referral");
    expect(parsed.searchParams.get("utm_campaign")).toBe("radiohead");
  });

  it("should use artist handle as utm_campaign", () => {
    const result = appendUtmParams("https://example.com", "tame-impala");
    expect(result).toContain("utm_campaign=tame-impala");
  });

  it("should return URL as-is if parsing fails", () => {
    const result = appendUtmParams("not a url", "radiohead");
    expect(result).toBe("not a url");
  });
});
