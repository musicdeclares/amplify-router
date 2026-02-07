"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { OrganizationCard } from "@/components/directory/OrganizationCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, AlertCircle, Globe } from "lucide-react";
import type { DirectoryOrganization } from "@/app/types/router";

interface OrgsClientProps {
  organizations: DirectoryOrganization[];
  error?: string;
}

export function OrgsClient({ organizations, error }: OrgsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [aboutOpen, setAboutOpen] = useState(false);

  // Get unique countries from fetched data
  const availableCountries = useMemo(() => {
    return Array.from(new Set(organizations.map((o) => o.country))).sort();
  }, [organizations]);

  // Filter organizations
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        org.name.toLowerCase().includes(term) ||
        org.mission.toLowerCase().includes(term) ||
        org.fanActions.some((action) => action.toLowerCase().includes(term));

      const matchesCountry =
        selectedCountry === "all" || org.country === selectedCountry;

      return matchesSearch && matchesCountry;
    });
  }, [organizations, searchTerm, selectedCountry]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3">
            <Image
              className="self-start"
              src="/logo.png"
              alt="MDE AMPLIFY logo"
              width={500}
              height={396}
              priority
              style={{ width: 100, height: "auto" }}
            />
            <div>
              <h1 className="text-2xl font-bold mb-3 text-foreground">
                MDE AMPLIFY{" "}
                <span className="whitespace-nowrap">Climate Org</span> Directory
              </h1>
              <p className="text-lg text-muted-foreground">
                Connecting music lovers with climate action organizations
                worldwide
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Program Information - Collapsible using CSS grid pattern */}
      <div className="border-b border-gray-200 bg-mde-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            className="w-full py-4 flex items-center justify-between"
          >
            <span className="font-semibold text-lg text-mde-body">
              About the AMPLIFY Program
            </span>
            <ChevronRight
              className={`size-5 text-mde-body transition-transform duration-200 ${aboutOpen ? "rotate-90" : ""}`}
            />
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${aboutOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="pb-6 prose max-w-none text-mde-body">
                <p className="mb-4">
                  AMPLIFY empowers artists with easy-to-use tools to move their
                  fans to take meaningful climate actions through high-impact,
                  vetted partners. Collective action through volunteering is one
                  of the most powerful ways to address the climate and
                  ecological emergency.
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-bold mb-2">Our Mission</h3>
                    <p className="text-sm">
                      To make it easy for artists to plug into the climate
                      movement by filling the volunteer pipeline for effective
                      grassroots partner programs with carefully curated calls
                      to action. AMPLIFY recommends partner organizations by
                      country and suggests approaches to activate fans.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">How It Works</h3>
                    <ol className="text-sm">
                      <li>
                        Music Declares Emergency (MDE) provides a call-to-action
                        link with a toolkit that includes QR codes for live
                        performances, sample social posts and clear messaging to
                        activate fans to take action through our climate
                        partners.
                      </li>
                      <li>
                        Artists share the link with fans at shows, on social
                        media, through email, or over SMS.
                      </li>
                      <li>
                        MDE shares results with artists regularly and
                        collaborates for continuous improvement for maximum
                        impact.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters — only show when data exists */}
      {!error && organizations.length > 0 && (
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search */}
              <div className="md:col-span-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300"
                />
              </div>

              {/* Country Filter */}
              <div className="md:col-span-4">
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredOrganizations.length} of {organizations.length}{" "}
              organizations
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="size-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Something went wrong
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              We couldn&apos;t load the organizations. Please try again.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        )}

        {/* Empty state — no orgs in database */}
        {!error && organizations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <Globe className="size-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              No organizations available yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              We&apos;re still building our network of climate action
              organizations. Check back soon!
            </p>
          </div>
        )}

        {/* Organizations grid */}
        {!error && organizations.length > 0 && (
          <>
            {filteredOrganizations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrganizations.map((organization) => (
                  <OrganizationCard
                    key={organization.id}
                    organization={organization}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="size-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  No organizations found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              Part of the{" "}
              <a
                href="https://www.musicdeclares.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Music Declares Emergency
              </a>{" "}
              initiative
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No music on a dead planet.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
