"use client";

import { useState, useMemo, useEffect } from "react";
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
import { EVENTS } from "@/app/lib/analytics-events";
import {
  getDirectoryContent,
  localeNames,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/app/lib/directory-content";

interface OrgsClientProps {
  organizations: DirectoryOrganization[];
  error?: string;
  initialLocale?: Locale;
}

export function OrgsClient({
  organizations,
  error,
  initialLocale = "en",
}: OrgsClientProps) {
  // Initialize with server-detected locale, then check localStorage
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved && (saved === "en" || saved === "fr")) {
      setLocale(saved);
    }
    setMounted(true);
  }, []);

  function handleLocaleChange(newLocale: Locale) {
    setLocale(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }

  const content = getDirectoryContent(locale);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                className="self-start"
                src="/logo.png"
                alt=""
                width={500}
                height={396}
                priority
                style={{ width: 100, height: "auto" }}
              />
              <div>
                <h1 className="text-2xl font-bold mb-3 text-foreground">
                  {content.header.title}{" "}
                  <span className="whitespace-nowrap">
                    {content.header.titleSuffix}
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  {content.header.subtitle}
                </p>
              </div>
            </div>

            {/* Language Switcher */}
            {mounted && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Globe className="size-4 text-muted-foreground" />
                {(Object.keys(localeNames) as Locale[]).map((loc, i) => (
                  <span key={loc} className="flex items-center">
                    {i > 0 && (
                      <span className="text-muted-foreground mx-1">|</span>
                    )}
                    <button
                      onClick={() => handleLocaleChange(loc)}
                      className={`hover:underline ${
                        locale === loc
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }`}
                      data-umami-event={EVENTS.DIRECTORY_SWITCH_LANG}
                      data-umami-event-lang={loc}
                    >
                      {localeNames[loc]}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Program Information - Collapsible using CSS grid pattern */}
      <div className="border-b border-gray-200 bg-mde-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            aria-expanded={aboutOpen}
            className="w-full py-4 flex items-center justify-between"
          >
            <span className="font-semibold text-lg text-mde-body">
              {content.about.heading}
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
                <p className="mb-4">{content.about.intro}</p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-bold mb-2">
                      {content.about.mission.heading}
                    </h3>
                    <p className="text-sm">{content.about.mission.text}</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">
                      {content.about.howItWorks.heading}
                    </h3>
                    <ol className="text-sm">
                      {content.about.howItWorks.steps.map(
                        (step: string, i: number) => (
                          <li key={i}>{step}</li>
                        )
                      )}
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
                  placeholder={content.search.placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300"
                  data-umami-event={EVENTS.DIRECTORY_SEARCH}
                />
              </div>

              {/* Country Filter */}
              <div className="md:col-span-4">
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder={content.filters.selectCountry} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {content.filters.allCountries}
                    </SelectItem>
                    {availableCountries.map((country) => (
                      <SelectItem
                        key={country}
                        value={country}
                        data-umami-event={EVENTS.DIRECTORY_FILTER_COUNTRY}
                        data-umami-event-country={country}
                      >
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              {content.search.resultsCount(
                filteredOrganizations.length,
                organizations.length
              )}
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
              {content.empty.error.title}
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {content.empty.error.description}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {content.empty.error.retry}
            </Button>
          </div>
        )}

        {/* Empty state — no orgs in database */}
        {!error && organizations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <Globe className="size-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {content.empty.noData.title}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {content.empty.noData.description}
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
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="size-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {content.empty.noResults.title}
                </h3>
                <p className="text-muted-foreground">
                  {content.empty.noResults.description}
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
              {content.footer.partOf}{" "}
              <a
                href="https://www.musicdeclares.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {content.footer.mde}
              </a>{" "}
              {content.footer.initiative}
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
