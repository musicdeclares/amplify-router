import { Metadata } from "next";
import { getOrganizations } from "@/app/lib/organization-directory";
import { OrgsClient } from "./orgs-client";
import { getDirectoryContent } from "@/app/lib/directory-content";

// TODO: When adding i18n, generate metadata dynamically based on locale
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
  let organizations: Awaited<ReturnType<typeof getOrganizations>> = [];
  let error: string | undefined;

  try {
    organizations = await getOrganizations();
  } catch (e) {
    console.error("Failed to fetch organizations:", e);
    error = "Failed to load organizations";
  }

  return <OrgsClient organizations={organizations} error={error} />;
}
