"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Tour, Artist, TourOverride, CountryDefault } from "@/app/types/router";
import { getCountryLabel, COUNTRY_OPTIONS } from "@/app/lib/countries";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "@/app/lib/hooks/use-unsaved-changes";
import { UnsavedChangesIndicator } from "@/components/shared/UnsavedChangesIndicator";

interface OrgInfo {
  id: string;
  org_name: string;
  country_code: string;
  website: string | null;
}

interface TourOverrideWithOrg extends TourOverride {
  org: OrgInfo | null;
}

interface TourWithDetails extends Tour {
  router_artists: Pick<Artist, "id" | "handle" | "name">;
  router_tour_overrides: TourOverrideWithOrg[];
}

interface CountryDefaultWithOrg extends CountryDefault {
  org: OrgInfo | null;
}

export default function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tour, setTour] = useState<TourWithDetails | null>(null);
  const [countryDefaults, setCountryDefaults] = useState<
    CountryDefaultWithOrg[]
  >([]);
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [removeCountryTarget, setRemoveCountryTarget] = useState<{
    overrideId: string;
    countryCode: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [errorLink, setErrorLink] = useState<{
    text: string;
    url: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preTourDays, setPreTourDays] = useState(0);
  const [postTourDays, setPostTourDays] = useState(0);
  const [enabled, setEnabled] = useState(true);

  // Unsaved changes tracking
  const initialValues = useMemo(
    () => ({
      name: tour?.name ?? "",
      startDate: tour?.start_date ?? "",
      endDate: tour?.end_date ?? "",
      preTourDays: tour?.pre_tour_window_days ?? 0,
      postTourDays: tour?.post_tour_window_days ?? 0,
      enabled: tour?.enabled ?? true,
    }),
    [
      tour?.name,
      tour?.start_date,
      tour?.end_date,
      tour?.pre_tour_window_days,
      tour?.post_tour_window_days,
      tour?.enabled,
    ],
  );
  const currentValues = useMemo(
    () => ({ name, startDate, endDate, preTourDays, postTourDays, enabled }),
    [name, startDate, endDate, preTourDays, postTourDays, enabled],
  );
  const { hasUnsavedChanges, savedAt, markSaved } = useUnsavedChanges(
    initialValues,
    currentValues,
  );

  // Country add state
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [addingCountry, setAddingCountry] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [tourRes, defaultsRes, orgsRes] = await Promise.all([
        fetch(`/api/tours/${id}`),
        fetch("/api/country-defaults"),
        fetch("/api/organizations?public=true"),
      ]);

      if (!tourRes.ok) {
        if (tourRes.status === 404) {
          router.push("/admin/tours");
          return;
        }
        throw new Error("Failed to fetch tour");
      }

      const tourData = await tourRes.json();
      const defaultsData = await defaultsRes.json();
      const orgsData = await orgsRes.json();

      setTour(tourData.tour);
      setCountryDefaults(defaultsData.defaults || []);
      setOrgs(orgsData.organizations || []);

      // Set form values
      setName(tourData.tour.name);
      setStartDate(tourData.tour.start_date);
      setEndDate(tourData.tour.end_date);
      setPreTourDays(tourData.tour.pre_tour_window_days || 0);
      setPostTourDays(tourData.tour.post_tour_window_days || 0);
      setEnabled(tourData.tour.enabled);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load tour");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError("");
    setErrorLink(null);

    if (!name.trim()) {
      setError("Tour name is required");
      return;
    }

    if (!startDate || !endDate) {
      setError("Start and end dates are required");
      return;
    }

    if (endDate < startDate) {
      setError("End date must be after start date");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/tours/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          pre_tour_window_days: preTourDays,
          post_tour_window_days: postTourDays,
          enabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update tour");
        if (data.linkText && data.linkUrl) {
          setErrorLink({ text: data.linkText, url: data.linkUrl });
        }
        setSaving(false);
        return;
      }

      setTour(data.tour);
      markSaved();
      toast.success("Tour updated");
    } catch (error) {
      console.error("Error updating tour:", error);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await fetch(`/api/tours/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        setDeleting(false);
        return;
      }

      toast.success("Tour deleted");
      router.push("/admin/tours");
    } catch (error) {
      console.error("Error deleting tour:", error);
      toast.error("Failed to delete tour");
      setDeleting(false);
    }
  }

  async function handleAddCountry(countryCode: string) {
    setAddingCountry(true);
    setCountryOpen(false);

    try {
      const res = await fetch(`/api/tours/${id}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country_code: countryCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add country");
        return;
      }

      // Refresh tour data
      await fetchData();
      toast.success(`Added ${getCountryLabel(countryCode)}`);
    } catch (error) {
      console.error("Error adding country:", error);
      toast.error("Failed to add country");
    } finally {
      setAddingCountry(false);
    }
  }

  async function handleRemoveCountry() {
    if (!removeCountryTarget) return;
    const { overrideId, countryCode } = removeCountryTarget;

    try {
      const res = await fetch(
        `/api/tours/${id}/countries?override_id=${overrideId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove country");
        return;
      }

      await fetchData();
      toast.success(`Removed ${getCountryLabel(countryCode)}`);
    } catch (error) {
      console.error("Error removing country:", error);
      toast.error("Failed to remove country");
    } finally {
      setRemoveCountryTarget(null);
    }
  }

  async function handleOrgChange(overrideId: string, orgId: string | null) {
    try {
      const res = await fetch(`/api/tours/${id}/countries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overrides: [{ override_id: overrideId, org_id: orgId }],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
        return;
      }

      await fetchData();
      toast.success("Updated");
    } catch (error) {
      console.error("Error updating org:", error);
      toast.error("Failed to update");
    }
  }

  function getMDERecommendation(
    countryCode: string,
  ): CountryDefaultWithOrg | null {
    const today = new Date().toISOString().split("T")[0];

    // First check for date-specific recommendation
    const dateSpecific = countryDefaults.find(
      (d) =>
        d.country_code === countryCode &&
        d.effective_from !== null &&
        d.effective_from <= today &&
        (d.effective_to === null || d.effective_to >= today),
    );
    if (dateSpecific) return dateSpecific;

    // Fall back to permanent recommendation
    return (
      countryDefaults.find(
        (d) => d.country_code === countryCode && d.effective_from === null,
      ) || null
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!tour) {
    return null;
  }

  const overrides = [...(tour.router_tour_overrides || [])].sort((a, b) =>
    getCountryLabel(a.country_code).localeCompare(
      getCountryLabel(b.country_code),
    ),
  );
  const configuredCountryCodes = new Set(overrides.map((o) => o.country_code));
  const availableCountries = COUNTRY_OPTIONS.filter(
    (c) => !configuredCountryCodes.has(c.value),
  );

  const today = new Date().toISOString().split("T")[0];
  const isActive = tour.start_date <= today && tour.end_date >= today;
  const isPast = tour.end_date < today;
  const isFuture = tour.start_date > today;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href="/admin/tours"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Tours
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Tour Details — left column */}
        <Card className="xl:col-start-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tour Details</CardTitle>
                <CardDescription>Update tour information</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!tour.enabled ? (
                  <Badge variant="outline">Inactive</Badge>
                ) : isPast ? (
                  <Badge variant="outline">Completed</Badge>
                ) : isFuture ? (
                  <Badge variant="outline">Upcoming</Badge>
                ) : isActive ? (
                  <Badge variant="secondary" className="bg-secondary">
                    Active
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
                {errorLink && (
                  <>
                    {" "}
                    <Link
                      href={errorLink.url}
                      className="underline hover:text-destructive/80"
                    >
                      {errorLink.text}
                    </Link>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Artist</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm">{tour.router_artists.name}</span>
                <Link
                  href={`/admin/artists/${tour.router_artists.id}`}
                  className="text-xs text-[--color-link] hover:text-[--color-link-hover] underline"
                >
                  View artist
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Tour Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <DateInput
                  id="start_date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <DateInput
                  id="end_date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pre_tour_days">Pre-tour Window (days)</Label>
                <Input
                  id="pre_tour_days"
                  type="number"
                  min="0"
                  value={preTourDays}
                  onChange={(e) =>
                    setPreTourDays(parseInt(e.target.value) || 0)
                  }
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post_tour_days">Post-tour Window (days)</Label>
                <Input
                  id="post_tour_days"
                  type="number"
                  min="0"
                  value={postTourDays}
                  onChange={(e) =>
                    setPostTourDays(parseInt(e.target.value) || 0)
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enabled">Status</Label>
              <Select
                value={enabled ? "enabled" : "disabled"}
                onValueChange={(v) => setEnabled(v === "enabled")}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Active</SelectItem>
                  <SelectItem value="disabled">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <UnsavedChangesIndicator
                hasUnsavedChanges={hasUnsavedChanges}
                savedAt={savedAt}
              />
            </div>
          </CardContent>
        </Card>

        {/* Country Routing — right column on desktop, immediately after Tour Details on mobile */}
        <Card className="xl:col-start-2 xl:row-start-1">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>
                  Fan Routing by Country
                  {overrides.length > 0 && (
                    <span className="text-muted-foreground font-normal ml-1.5">
                      ({overrides.length})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Which organization fans are directed to in each country
                </CardDescription>
              </div>
              <Popover
                open={countryOpen}
                onOpenChange={(open) => {
                  setCountryOpen(open);
                  if (!open) setCountrySearch("");
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    disabled={addingCountry || availableCountries.length === 0}
                  >
                    {addingCountry ? "Adding..." : "Add Country"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-75 p-0" align="end">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search countries..."
                      value={countrySearch}
                      onValueChange={setCountrySearch}
                    />
                    <CommandList>
                      <CommandEmpty>No countries found.</CommandEmpty>
                      <CommandGroup>
                        {(() => {
                          const s = countrySearch.toLowerCase().trim();
                          if (!s) {
                            return availableCountries.map((country) => (
                              <CommandItem
                                key={country.value}
                                onSelect={() => handleAddCountry(country.value)}
                              >
                                {country.label}
                                <span className="ml-2 text-muted-foreground text-xs">
                                  {country.value}
                                </span>
                              </CommandItem>
                            ));
                          }
                          const scored = availableCountries
                            .map((country) => {
                              let score = 0;
                              if (country.value.toLowerCase() === s) score = 3;
                              else if (
                                country.label.toLowerCase().startsWith(s)
                              )
                                score = 2;
                              else if (
                                country.label.toLowerCase().includes(s) ||
                                country.value.toLowerCase().includes(s)
                              )
                                score = 1;
                              return { country, score };
                            })
                            .filter((item) => item.score > 0)
                            .sort((a, b) => b.score - a.score);
                          return scored.map(({ country }) => (
                            <CommandItem
                              key={country.value}
                              onSelect={() => handleAddCountry(country.value)}
                            >
                              {country.label}
                              <span className="ml-2 text-muted-foreground text-xs">
                                {country.value}
                              </span>
                            </CommandItem>
                          ));
                        })()}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {overrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No countries configured yet.</p>
                <p className="text-sm mt-1">
                  Add countries where fans will be routed to climate action
                  orgs.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Leave on &ldquo;Use MDE recommended&rdquo; to let MDE control
                  routing, or select an org to set it yourself.
                </p>

                {/* Mobile card layout */}
                <div className="space-y-4 sm:hidden">
                  {overrides.map((override) => {
                    const recommendation = getMDERecommendation(
                      override.country_code,
                    );
                    const countryOrgs = orgs.filter(
                      (o) => o.country_code === override.country_code,
                    );
                    const hasNoOrgs = countryOrgs.length === 0;

                    return (
                      <div
                        key={override.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {getCountryLabel(override.country_code)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRemoveCountryTarget({
                                overrideId: override.id,
                                countryCode: override.country_code,
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          {hasNoOrgs ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">
                                No orgs in this country
                              </span>
                            </div>
                          ) : (
                            <Select
                              value={override.org_id || "none"}
                              onValueChange={(v) =>
                                handleOrgChange(
                                  override.id,
                                  v === "none" ? null : v,
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue>
                                  {override.org?.org_name ??
                                    (recommendation?.org
                                      ? `Use MDE recommended (${recommendation.org.org_name})`
                                      : "Use MDE recommended (none set)")}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent
                                className="max-w-[calc(100vw-3rem)]"
                                position="popper"
                                side="bottom"
                                align="start"
                              >
                                <SelectItem value="none">
                                  <span
                                    className={cn(
                                      recommendation?.org
                                        ? ""
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {recommendation?.org
                                      ? `Use MDE recommended (${recommendation.org.org_name})`
                                      : "Use MDE recommended (none set)"}
                                  </span>
                                </SelectItem>
                                {countryOrgs.map((org) => (
                                  <SelectItem
                                    key={org.id}
                                    value={org.id}
                                    className="truncate"
                                  >
                                    {org.org_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table layout */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="w-12.5"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overrides.map((override) => {
                        const recommendation = getMDERecommendation(
                          override.country_code,
                        );
                        const countryOrgs = orgs.filter(
                          (o) => o.country_code === override.country_code,
                        );
                        const hasNoOrgs = countryOrgs.length === 0;

                        return (
                          <TableRow key={override.id}>
                            <TableCell className="font-medium">
                              {getCountryLabel(override.country_code)}
                            </TableCell>
                            <TableCell>
                              {hasNoOrgs ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm">
                                    No orgs in this country
                                  </span>
                                </div>
                              ) : (
                                <Select
                                  value={override.org_id || "none"}
                                  onValueChange={(v) =>
                                    handleOrgChange(
                                      override.id,
                                      v === "none" ? null : v,
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue>
                                      {override.org?.org_name ??
                                        (recommendation?.org
                                          ? `Use MDE recommended (${recommendation.org.org_name})`
                                          : "Use MDE recommended (none set)")}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent
                                    position="popper"
                                    side="bottom"
                                    align="start"
                                  >
                                    <SelectItem value="none">
                                      <span
                                        className={cn(
                                          recommendation?.org
                                            ? ""
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {recommendation?.org
                                          ? `Use MDE recommended (${recommendation.org.org_name})`
                                          : "Use MDE recommended (none set)"}
                                      </span>
                                    </SelectItem>
                                    {countryOrgs.map((org) => (
                                      <SelectItem key={org.id} value={org.id}>
                                        {org.org_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setRemoveCountryTarget({
                                    overrideId: override.id,
                                    countryCode: override.country_code,
                                  })
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone — left column on desktop, after Country Routing on mobile */}
        <Card className="border-destructive/50 xl:col-start-1">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this tour and all its country configurations.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleting}
            >
              Delete Tour
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground xl:col-start-1">
          Added {new Date(tour.created_at).toLocaleDateString()} · Last updated{" "}
          {new Date(tour.updated_at).toLocaleDateString()}
        </p>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tour</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tour and all its country
              configurations? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!removeCountryTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveCountryTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Country</DialogTitle>
            <DialogDescription>
              Remove{" "}
              {removeCountryTarget
                ? getCountryLabel(removeCountryTarget.countryCode)
                : ""}{" "}
              from this tour?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveCountryTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveCountry}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
