"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCountryLabel, getCountryFlag } from "@/app/lib/countries";
import { toast } from "sonner";
import { AlertTriangle, ChevronRight, Check } from "lucide-react";

interface CountryData {
  country_code: string;
  org_count: number;
  permanent_recommendation: {
    id: string;
    org_id: string;
    org_name: string;
  } | null;
  date_specific_count: number;
  has_paused_orgs: boolean;
}

export default function OrganizationsPage() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountryData();
  }, []);

  async function fetchCountryData() {
    setLoading(true);
    try {
      // Fetch all orgs grouped by country
      const [orgsRes, defaultsRes] = await Promise.all([
        fetch("/api/organizations?public=true"),
        fetch("/api/country-defaults"),
      ]);

      if (!orgsRes.ok || !defaultsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const orgsData = await orgsRes.json();
      const defaultsData = await defaultsRes.json();

      const orgs = orgsData.organizations || [];
      const defaults = defaultsData.defaults || [];

      // Group orgs by country
      const countryMap = new Map<
        string,
        {
          orgs: typeof orgs;
          permanent: (typeof defaults)[0] | null;
          dateSpecific: typeof defaults;
        }
      >();

      // Initialize with org data
      for (const org of orgs) {
        if (!countryMap.has(org.country_code)) {
          countryMap.set(org.country_code, {
            orgs: [],
            permanent: null,
            dateSpecific: [],
          });
        }
        countryMap.get(org.country_code)!.orgs.push(org);
      }

      // Add recommendation data
      for (const def of defaults) {
        const countryData = countryMap.get(def.country_code);
        if (countryData) {
          if (def.effective_from === null) {
            countryData.permanent = def;
          } else {
            countryData.dateSpecific.push(def);
          }
        }
      }

      // Convert to array and sort
      const countryList: CountryData[] = Array.from(countryMap.entries())
        .map(([country_code, data]) => ({
          country_code,
          org_count: data.orgs.length,
          permanent_recommendation: data.permanent
            ? {
                id: data.permanent.id,
                org_id: data.permanent.org_id,
                org_name: data.permanent.org?.org_name || "Unknown",
              }
            : null,
          date_specific_count: data.dateSpecific.length,
          has_paused_orgs: data.orgs.some(
            (o: { router_enabled: boolean }) => !o.router_enabled,
          ),
        }))
        .sort((a, b) =>
          getCountryLabel(a.country_code).localeCompare(
            getCountryLabel(b.country_code),
          ),
        );

      setCountries(countryList);
    } catch (error) {
      console.error("Error fetching country data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const countriesNeedingAttention = countries.filter(
    (c) => !c.permanent_recommendation,
  );
  const totalOrgs = countries.reduce((sum, c) => sum + c.org_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizations by Country</h1>
        <p className="text-muted-foreground mt-1">
          Manage recommendations for {countries.length}{" "}
          {countries.length === 1 ? "country" : "countries"} with {totalOrgs}{" "}
          approved {totalOrgs === 1 ? "organization" : "organizations"}
        </p>
      </div>

      {countriesNeedingAttention.length > 0 && (
        <Alert
          variant="destructive"
          className="border-destructive/50 bg-destructive/10"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>
              {countriesNeedingAttention.length}{" "}
              {countriesNeedingAttention.length === 1
                ? "country needs"
                : "countries need"}{" "}
              a recommendation.
            </strong>{" "}
            Fans from countries without a recommended org will see the fallback
            page.
          </AlertDescription>
        </Alert>
      )}

      {countries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No approved organizations found.</p>
              <p className="text-sm mt-1">
                Organizations are managed in the MDEDB system.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {countries.map((country) => (
            <Link
              key={country.country_code}
              href={`/admin/organizations/${country.country_code}`}
            >
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">
                          <span className="mr-2">
                            {getCountryFlag(country.country_code)}
                          </span>
                          {getCountryLabel(country.country_code)}
                        </h3>
                        {!country.permanent_recommendation && (
                          <Badge variant="destructive" className="text-xs">
                            Needs recommendation
                          </Badge>
                        )}
                        {country.has_paused_orgs && (
                          <Badge variant="outline" className="text-xs">
                            Has paused orgs
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 text-sm text-muted-foreground">
                        {country.permanent_recommendation ? (
                          <div className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-secondary shrink-0" />
                            <div className="truncate">
                              {country.permanent_recommendation.org_name}
                            </div>
                            {country.date_specific_count > 0 && (
                              <span className="text-xs shrink-0">
                                (+{country.date_specific_count} date-specific)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No recommendation set
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {country.org_count} approved{" "}
                        {country.org_count === 1 ? "org" : "orgs"}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
