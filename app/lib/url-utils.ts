/**
 * Extract the primary (registerable) domain from a URL or hostname.
 * e.g., "https://action.climatechangemakers.org/path" → "climatechangemakers.org"
 *       "https://www.example.co.uk" → "example.co.uk"
 *
 * Uses a simple heuristic: strips known multi-part TLDs (.co.uk, .org.au, etc.)
 * then takes the last two segments. This covers common cases without requiring
 * a full public suffix list.
 */
const MULTI_PART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "co.nz",
  "org.nz",
  "co.za",
  "org.au",
  "com.au",
  "co.in",
  "org.in",
  "co.jp",
  "or.jp",
  "com.br",
  "org.br",
  "co.kr",
  "or.kr",
  "com.mx",
  "org.mx",
  "co.il",
  "org.il",
  "com.ar",
  "com.co",
]);

export function getPrimaryDomain(urlOrHostname: string): string | null {
  try {
    // If it looks like a URL, parse it. Otherwise treat as hostname.
    const hostname = urlOrHostname.includes("://")
      ? new URL(urlOrHostname).hostname
      : urlOrHostname;

    const parts = hostname.toLowerCase().split(".");
    if (parts.length < 2) return null;

    // Check for multi-part TLD
    const lastTwo = parts.slice(-2).join(".");
    if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join(".");
    }

    return lastTwo;
  } catch {
    return null;
  }
}

/**
 * Check whether two URLs share the same primary domain.
 */
export function isSamePrimaryDomain(url1: string, url2: string): boolean {
  const d1 = getPrimaryDomain(url1);
  const d2 = getPrimaryDomain(url2);
  if (!d1 || !d2) return false;
  return d1 === d2;
}

/**
 * Remove all utm_* query parameters from a URL string.
 * Returns { url, stripped } where stripped is true if any were removed.
 */
export function stripUtmParams(url: string): {
  url: string;
  stripped: boolean;
} {
  try {
    const parsed = new URL(url);
    const keysToDelete: string[] = [];
    for (const key of parsed.searchParams.keys()) {
      if (key.toLowerCase().startsWith("utm_")) {
        keysToDelete.push(key);
      }
    }
    if (keysToDelete.length === 0) {
      return { url, stripped: false };
    }
    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }
    return { url: parsed.toString(), stripped: true };
  } catch {
    return { url, stripped: false };
  }
}

/**
 * Append AMPLIFY UTM parameters to a destination URL.
 * Preserves any existing non-UTM query parameters.
 */
export function appendUtmParams(
  destinationUrl: string,
  artistHandle: string,
): string {
  try {
    const parsed = new URL(destinationUrl);
    parsed.searchParams.set("utm_source", "mde_amplify_rtr");
    parsed.searchParams.set("utm_medium", "referral");
    parsed.searchParams.set("utm_campaign", artistHandle);
    return parsed.toString();
  } catch {
    // If URL parsing fails, return as-is rather than breaking the redirect
    return destinationUrl;
  }
}
