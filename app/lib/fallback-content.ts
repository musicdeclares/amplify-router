/**
 * Fallback page content with i18n support.
 * English only for now; French coming soon for pilot artist.
 */

export type Locale = "en" | "fr";
export type FallbackReason =
  | "artist_not_found"
  | "no_tour"
  | "no_country"
  | "org_not_found"
  | "org_not_specified"
  | "org_paused"
  | "org_no_website"
  | "error";

interface FallbackMessages {
  artist_not_found: string;
  no_tour: string;
  no_tour_generic: string;
  no_country: string;
  org_not_found: string;
  org_not_specified: string;
  org_paused: string;
  org_no_website: string;
  error: string;
  default: string;
}

interface CtaContent {
  heading: string;
  description: string;
  buttonText: string;
  url: string;
}

interface LocaleContent {
  title: string;
  subtitle: string;
  messages: FallbackMessages;
  encouragement: string;
  cta: {
    primary: CtaContent;
    secondary: CtaContent;
  };
  footer: {
    mdeLink: string;
    tagline: string;
  };
}

export const fallbackContent: Record<Locale, LocaleContent> = {
  en: {
    title: "Take Climate Action",
    subtitle: "Join the movement to address the climate emergency",
    messages: {
      artist_not_found: "We couldn't find that artist's AMPLIFY page.",
      no_tour: "{artist} doesn't have an active tour right now.",
      no_tour_generic: "This artist doesn't have an active tour right now.",
      no_country: "We couldn't determine your location.",
      org_not_found:
        "We're still finding a climate action organization in your area.",
      org_not_specified:
        "We're still finding a climate action organization in your area.",
      org_paused:
        "The climate action organization in your area is currently unavailable.",
      org_no_website:
        "The climate action organization in your area is currently unavailable.",
      error: "Something went wrong on our end.",
      default: "Welcome to MDE AMPLIFY",
    },
    encouragement: "But you can still take action for climate!",
    cta: {
      primary: {
        heading: "Join the Climate Reality Project",
        description:
          "A global movement training everyday people to become powerful advocates for climate solutions.",
        buttonText: "Take Action",
        url: "https://www.climaterealityproject.org/act",
      },
      secondary: {
        heading: "Browse Climate Organizations",
        description:
          "Find vetted climate action organizations in your country.",
        buttonText: "View Directory",
        url: "/directory",
      },
    },
    footer: {
      mdeLink: "Music Declares Emergency",
      tagline: "No music on a dead planet.",
    },
  },
  // French translations will be added here when ready
  fr: {
    title: "Take Climate Action",
    subtitle: "Join the movement to address the climate emergency",
    messages: {
      artist_not_found: "We couldn't find that artist's AMPLIFY page.",
      no_tour: "{artist} doesn't have an active tour right now.",
      no_tour_generic: "This artist doesn't have an active tour right now.",
      no_country: "We couldn't determine your location.",
      org_not_found:
        "We're still finding a climate action organization in your area.",
      org_not_specified:
        "We're still finding a climate action organization in your area.",
      org_paused:
        "The climate action organization in your area is currently unavailable.",
      org_no_website:
        "The climate action organization in your area is currently unavailable.",
      error: "Something went wrong on our end.",
      default: "Welcome to MDE AMPLIFY",
    },
    encouragement: "But you can still take action for climate!",
    cta: {
      primary: {
        heading: "Join the Climate Reality Project",
        description:
          "A global movement training everyday people to become powerful advocates for climate solutions.",
        buttonText: "Take Action",
        url: "https://www.climaterealityproject.org/act",
      },
      secondary: {
        heading: "Browse Climate Organizations",
        description:
          "Find vetted climate action organizations in your country.",
        buttonText: "View Directory",
        url: "/directory",
      },
    },
    footer: {
      mdeLink: "Music Declares Emergency",
      tagline: "No music on a dead planet.",
    },
  },
};

/**
 * Get the contextual message for a fallback reason.
 * Uses artist display name when available for personalized messages.
 */
export function getMessage(
  reason: FallbackReason | null,
  artistName: string | null,
  locale: Locale = "en",
): string {
  const content = fallbackContent[locale];

  if (!reason) {
    return content.messages.default;
  }

  if (reason === "no_tour" && artistName) {
    return content.messages.no_tour.replace("{artist}", artistName);
  }

  if (reason === "no_tour") {
    return content.messages.no_tour_generic;
  }

  return content.messages[reason] || content.messages.default;
}

/**
 * Check if a reason indicates a fallback (error state) vs. landing page.
 */
export function isFallbackReason(reason: string | null): reason is FallbackReason {
  if (!reason) return false;
  const validReasons: FallbackReason[] = [
    "artist_not_found",
    "no_tour",
    "no_country",
    "org_not_found",
    "org_not_specified",
    "org_paused",
    "org_no_website",
    "error",
  ];
  return validReasons.includes(reason as FallbackReason);
}
