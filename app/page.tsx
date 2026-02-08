import { Metadata } from "next";
import { Suspense } from "react";
import { FallbackPageClient } from "./fallback-client";

export const metadata: Metadata = {
  title: "Take Climate Action | MDE AMPLIFY",
  description:
    "Join the climate movement with Music Declares Emergency and our global partners.",
};

export default function FallbackPage() {
  return (
    <Suspense>
      <FallbackPageClient />
    </Suspense>
  );
}
