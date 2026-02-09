export type Locale = "en" | "fr";

/** Available locales with display names */
export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

/** localStorage key for persisted locale preference */
export const LOCALE_STORAGE_KEY = "mde-amplify-locale";

/**
 * Detect locale from Accept-Language header.
 * Returns 'fr' if French is preferred, otherwise 'en'.
 */
export function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return "en";

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  const preferred = languages[0]?.code;
  return preferred === "fr" ? "fr" : "en";
}

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
      defaultCtaText: "Get involved",
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
  fr: {
    meta: {
      title: "Répertoire des organisations | MDE AMPLIFY",
      description:
        "Découvrez les organisations climatiques vérifiées partenaires de Music Declares Emergency. Trouvez des groupes locaux qui font la différence dans votre pays.",
      ogDescription:
        "Découvrez les organisations climatiques vérifiées partenaires de Music Declares Emergency.",
    },
    header: {
      title: "MDE AMPLIFY",
      titleSuffix: "Répertoire des organisations",
      subtitle:
        "Connecter les fans de musique aux organisations climatiques du monde entier",
    },
    about: {
      heading: "À propos du programme AMPLIFY",
      intro:
        "AMPLIFY donne aux artistes des outils simples pour inciter leurs fans à agir concrètement pour le climat via des partenaires vérifiés à fort impact. L'action collective par le bénévolat est l'un des moyens les plus puissants pour faire face à l'urgence climatique et écologique.",
      mission: {
        heading: "Notre mission",
        text: "Faciliter l'engagement des artistes dans le mouvement climatique en alimentant le réseau de bénévoles des programmes partenaires efficaces avec des appels à l'action soigneusement sélectionnés. AMPLIFY recommande des organisations partenaires par pays et suggère des approches pour mobiliser les fans.",
      },
      howItWorks: {
        heading: "Comment ça marche",
        steps: [
          "Music Declares Emergency (MDE) fournit un lien d'action avec une boîte à outils comprenant des codes QR pour les concerts, des exemples de publications et des messages clairs pour inciter les fans à agir via nos partenaires climatiques.",
          "Les artistes partagent le lien avec leurs fans lors des concerts, sur les réseaux sociaux, par email ou par SMS.",
          "MDE partage régulièrement les résultats avec les artistes et collabore pour une amélioration continue et un impact maximal.",
        ],
      },
    },
    search: {
      placeholder: "Rechercher des organisations...",
      resultsCount: (showing: number, total: number) =>
        `Affichage de ${showing} sur ${total} organisations`,
    },
    filters: {
      selectCountry: "Choisir un pays",
      allCountries: "Tous les pays",
    },
    card: {
      fansCanLabel: "LES FANS PEUVENT",
      defaultCtaText: "S'impliquer",
    },
    empty: {
      noResults: {
        title: "Aucune organisation trouvée",
        description: "Essayez de modifier votre recherche ou vos filtres",
      },
      noData: {
        title: "Aucune organisation disponible pour l'instant",
        description:
          "Nous construisons encore notre réseau d'organisations climatiques. Revenez bientôt !",
      },
      error: {
        title: "Une erreur s'est produite",
        description:
          "Nous n'avons pas pu charger les organisations. Veuillez réessayer.",
        retry: "Réessayer",
      },
    },
    footer: {
      partOf: "Une initiative de",
      mde: "Music Declares Emergency",
      initiative: "",
      tagline: "Pas de musique sur une planète morte.",
    },
  },
};

export function getDirectoryContent(locale: Locale = "en") {
  return directoryContent[locale] || directoryContent.en;
}
