// Add "fr" here when French translations are ready
export type Locale = "en";

export const directoryContent = {
  en: {
    meta: {
      title: "Climate Org Directory | MDE AMPLIFY",
      description:
        "Explore vetted climate action organizations partnering with Music Declares Emergency. Find grassroots groups making a difference in your country.",
      ogDescription:
        "Explore vetted climate action organizations partnering with Music Declares Emergency.",
    },
    header: {
      title: "MDE AMPLIFY",
      titleSuffix: "Climate Org Directory",
      subtitle:
        "Connecting music lovers with climate action organizations worldwide",
    },
    about: {
      heading: "About the AMPLIFY Program",
      intro:
        "AMPLIFY empowers artists with easy-to-use tools to move their fans to take meaningful climate actions through high-impact, vetted partners. Collective action through volunteering is one of the most powerful ways to address the climate and ecological emergency.",
      mission: {
        heading: "Our Mission",
        text: "To make it easy for artists to plug into the climate movement by filling the volunteer pipeline for effective grassroots partner programs with carefully curated calls to action. AMPLIFY recommends partner organizations by country and suggests approaches to activate fans.",
      },
      howItWorks: {
        heading: "How It Works",
        steps: [
          "Music Declares Emergency (MDE) provides a call-to-action link with a toolkit that includes QR codes for live performances, sample social posts and clear messaging to activate fans to take action through our climate partners.",
          "Artists share the link with fans at shows, on social media, through email, or over SMS.",
          "MDE shares results with artists regularly and collaborates for continuous improvement for maximum impact.",
        ],
      },
    },
    search: {
      placeholder: "Search organizations...",
      resultsCount: (showing: number, total: number) =>
        `Showing ${showing} of ${total} organizations`,
    },
    filters: {
      selectCountry: "Select Country",
      allCountries: "All Countries",
    },
    card: {
      fansCanLabel: "FANS CAN",
    },
    empty: {
      noResults: {
        title: "No organizations found",
        description: "Try adjusting your search or filters",
      },
      noData: {
        title: "No organizations available yet",
        description:
          "We're still building our network of climate action organizations. Check back soon!",
      },
      error: {
        title: "Something went wrong",
        description: "We couldn't load the organizations. Please try again.",
        retry: "Try again",
      },
    },
    footer: {
      partOf: "Part of the",
      mde: "Music Declares Emergency",
      initiative: "initiative",
      tagline: "No music on a dead planet.",
    },
  },
  // When adding French, copy the `en` object and translate all strings:
  // fr: { ... },
} as const;

export function getDirectoryContent(locale: Locale = "en") {
  return directoryContent[locale] || directoryContent.en;
}
