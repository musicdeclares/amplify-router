import { Metadata } from "next";
import { headers } from "next/headers";
import { getOrganizations } from "@/app/lib/organization-directory";
import { OrgsClient } from "./orgs-client";
import {
  getDirectoryContent,
  detectLocaleFromHeader,
} from "@/app/lib/directory-content";

// TODO: Generate metadata dynamically based on detected locale
const content = getDirectoryContent("en");

export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  openGraph: {
    title: content.meta.title,
    description: content.meta.ogDescription,
    type: "website",
  },
};

export default async function OrgsPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const detectedLocale = detectLocaleFromHeader(acceptLanguage);

  let organizations: Awaited<ReturnType<typeof getOrganizations>> = [];
  let error: string | undefined;

  try {
    organizations = await getOrganizations();
  } catch (e) {
    console.error("Failed to fetch organizations:", e);
    error = "Failed to load organizations";
  }

  return (
    <OrgsClient
      organizations={organizations}
      error={error}
      initialLocale={detectedLocale}
    />
  );
}
