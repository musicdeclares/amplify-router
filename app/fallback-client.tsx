"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Search } from "lucide-react";
import {
  fallbackContent,
  getMessage,
  isFallbackReason,
  type FallbackReason,
} from "@/app/lib/fallback-content";

export function FallbackPageClient() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const artistName = searchParams.get("name");

  const reason = isFallbackReason(refParam)
    ? (refParam as FallbackReason)
    : null;
  const isLandingPage = !reason;
  const content = fallbackContent.en;
  const message = getMessage(reason, artistName);

  // Add UTM params to external CTA
  const primaryCtaUrl = `${content.cta.primary.url}?utm_source=mde_amplify_rtr&utm_medium=referral`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3">
            <Image
              className="self-start"
              src="/logo.png"
              alt="MDE AMPLIFY logo"
              width={500}
              height={396}
              priority
              style={{ width: 80, height: "auto" }}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                MDE AMPLIFY
              </h1>
              <p className="text-muted-foreground">
                Connecting music lovers with climate action
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Contextual Message */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {content.title}
            </h2>
            <p className="text-xl text-muted-foreground mb-6">{message}</p>
            {!isLandingPage && (
              <p className="text-lg text-foreground font-medium">
                {content.encouragement}
              </p>
            )}
          </div>

          {/* CTA Cards */}
          <div className="space-y-6">
            {/* Primary CTA - Climate Reality Project */}
            <Card className="border-2 border-mde-yellow bg-mde-yellow/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="grow">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {content.cta.primary.heading}
                    </h3>
                    <p className="text-muted-foreground">
                      {content.cta.primary.description}
                    </p>
                  </div>
                  <Button asChild size="lg" className="shrink-0">
                    <a
                      href={primaryCtaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content.cta.primary.buttonText}
                      <ExternalLink className="ml-2 size-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Secondary CTA - Browse Directory */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="grow">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {content.cta.secondary.heading}
                    </h3>
                    <p className="text-muted-foreground">
                      {content.cta.secondary.description}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="shrink-0"
                  >
                    <Link href={content.cta.secondary.url}>
                      {content.cta.secondary.buttonText}
                      <Search className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              Part of the{" "}
              <a
                href="https://www.musicdeclares.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {content.footer.mdeLink}
              </a>{" "}
              initiative
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {content.footer.tagline}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
