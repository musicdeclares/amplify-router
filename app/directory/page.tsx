import { Metadata } from "next";
import { getOrganizations } from "@/app/lib/organization-directory";
import { OrgsClient } from "./orgs-client";

export const metadata: Metadata = {
  title: "Climate Org Directory | MDE AMPLIFY",
  description:
    "Explore vetted climate action organizations partnering with Music Declares Emergency. Find grassroots groups making a difference in your country.",
  openGraph: {
    title: "Climate Org Directory | MDE AMPLIFY",
    description:
      "Explore vetted climate action organizations partnering with Music Declares Emergency.",
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
