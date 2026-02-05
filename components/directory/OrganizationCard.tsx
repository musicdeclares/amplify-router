"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Target, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/components/directory/ImageWithFallback";
import type { DirectoryOrganization } from "@/app/types/router";

function appendUtmParams(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", "mde_amplify_dir");
    parsed.searchParams.set("utm_medium", "referral");
    return parsed.toString();
  } catch {
    return url;
  }
}

interface OrganizationCardProps {
  organization: DirectoryOrganization;
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Card className="overflow-hidden border-gray-200 bg-white">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {organization.imageUrl ? (
          <ImageWithFallback
            src={organization.imageUrl}
            alt={organization.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MDE AMPLIFY"
              className="w-20 h-auto object-contain opacity-60"
            />
          </div>
        )}
      </div>
      <div className="p-6">
        {organization.website ? (
          <a
            href={organization.website}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-xl mb-2 hover:underline inline-block text-foreground"
          >
            {organization.name}
          </a>
        ) : (
          <span className="font-bold text-xl mb-2 inline-block text-foreground">
            {organization.name}
          </span>
        )}

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <MapPin className="size-4" />
          <span>{organization.country}</span>
        </div>

        {organization.mission && (
          <div className="flex items-start gap-2 mb-3">
            <Target className="size-4 mt-0.5 flex-shrink-0 text-mde-green" />
            <p className="text-sm text-muted-foreground line-clamp-3">
              {organization.mission}
            </p>
          </div>
        )}

        {organization.fanActions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              FANS CAN
            </p>
            <div className="flex flex-wrap gap-2">
              {organization.fanActions.map((action, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs border-gray-300 text-muted-foreground"
                >
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {organization.ctaUrl && (
          <Button
            asChild
            className="w-full font-semibold bg-mde-yellow text-mde-body hover:bg-mde-yellow/90 hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <a
              href={appendUtmParams(organization.ctaUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              {organization.ctaText}
              <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
