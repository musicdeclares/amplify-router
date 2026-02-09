import { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { FallbackPageClient } from "./fallback-client";
import { detectLocaleFromHeader } from "@/app/lib/fallback-content";

export const metadata: Metadata = {
  title: "Take Climate Action | MDE AMPLIFY",
  description:
    "Join the climate movement with Music Declares Emergency and our global partners.",
};

export default async function FallbackPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const detectedLocale = detectLocaleFromHeader(acceptLanguage);

  return (
    <Suspense>
      <FallbackPageClient initialLocale={detectedLocale} />
    </Suspense>
  );
}
