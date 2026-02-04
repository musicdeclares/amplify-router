"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, MapPin, Target } from "lucide-react";
import { OrgPublicView, OrgProfile } from "@/app/types/router";
import {
  FanActionsInput,
  FanActionsInputHandle,
} from "@/components/shared/FanActionsInput";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { getCountryLabel, getCountryFlag } from "@/app/lib/countries";
import { isSamePrimaryDomain } from "@/app/lib/url-utils";
import { getTourStatus, formatDateRange } from "@/app/lib/tour-utils";

const MAX_MISSION_LENGTH = 80;
const MAX_CTA_TEXT_LENGTH = 35;

interface LinkedTour {
  id: string;
  country_code: string;
  enabled: boolean;
  tour: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    enabled: boolean;
    router_artists: { id: string; handle: string; name: string };
  };
}

interface CountryDefault {
  id: string;
  country_code: string;
  effective_from: string | null;
  effective_to: string | null;
  notes: string | null;
}

interface ImplicitTour {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  router_artists: { id: string; handle: string; name: string };
}

export default function OrgProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orgId } = use(params);
  const [org, setOrg] = useState<OrgPublicView | null>(null);
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Routing activity
  const [linkedTours, setLinkedTours] = useState<LinkedTour[]>([]);
  const [countryDefaults, setCountryDefaults] = useState<CountryDefault[]>([]);
  const [implicitTours, setImplicitTours] = useState<
    Record<string, ImplicitTour[]>
  >({});

  // Form state
  const [orgName, setOrgName] = useState("");
  const [mission, setMission] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [fanActions, setFanActions] = useState<string[]>([]);

  const fanActionsRef = useRef<FanActionsInputHandle>(null);

  // Reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Check if CTA URL domain matches org website
  const ctaDomainMismatch = useMemo(() => {
    const trimmed = ctaUrl.trim();
    if (!trimmed || !org?.website) return false;
    try {
      new URL(trimmed);
    } catch {
      return false; // Don't show domain warning for invalid URLs
    }
    return !isSamePrimaryDomain(trimmed, org.website);
  }, [ctaUrl, org?.website]);

  // Resolved preview values (same fallback logic as org directory)
  const preview = useMemo(() => {
    if (!org) return null;
    return {
      name: orgName.trim() || org.org_name,
      country: getCountryLabel(org.country_code),
      mission: mission.trim() || org.mission_statement || "",
      fanActions,
      ctaUrl: ctaUrl.trim() || org.website || "",
      ctaText: ctaText.trim() || "Get involved",
      imageUrl: profile?.image_url || org.banner || org.logo || "",
    };
  }, [org, orgName, mission, ctaUrl, ctaText, fanActions, profile?.image_url]);

  useEffect(() => {
    fetchProfile();
  }, [orgId]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch(`/api/org-profiles/${orgId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Organization not found");
          return;
        }
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      setOrg(data.org);
      setProfile(data.profile);
      setLinkedTours(data.linkedTours || []);
      setCountryDefaults(data.countryDefaults || []);
      setImplicitTours(data.implicitTours || {});

      // Populate form from existing profile
      if (data.profile) {
        setOrgName(data.profile.org_name || "");
        setMission(data.profile.mission || "");
        setCtaUrl(data.profile.cta_url || "");
        setCtaText(data.profile.cta_text || "");
        setFanActions(data.profile.fan_actions || []);
      } else {
        setOrgName("");
        setMission("");
        setCtaUrl("");
        setCtaText("");
        setFanActions([]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    // Commit any text still sitting in the fan actions input.
    // flush() returns the up-to-date array synchronously (state update is async).
    const resolvedFanActions = fanActionsRef.current?.flush() ?? fanActions;

    // Validate cta_url if provided
    if (ctaUrl.trim()) {
      try {
        new URL(ctaUrl.trim());
      } catch {
        toast.error("Invalid CTA URL format. Must be a full URL.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/org-profiles/${orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: orgName.trim() || null,
          mission: mission.trim() || null,
          cta_url: ctaUrl.trim() || null,
          cta_text: ctaText.trim() || null,
          fan_actions:
            resolvedFanActions.length > 0 ? resolvedFanActions : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setProfile(data.profile);

      // Sync form state if the API cleaned the cta_url (e.g., stripped UTM params)
      if (data.profile?.cta_url !== (ctaUrl.trim() || null)) {
        setCtaUrl(data.profile?.cta_url || "");
      }

      // Show warnings as individual toasts, then success
      const warnings: string[] = data.warnings || [];
      for (const warning of warnings) {
        toast.warning(warning);
      }
      toast.success("Profile saved");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch(`/api/org-profiles/${orgId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to reset");
      }

      setProfile(null);
      setOrgName("");
      setMission("");
      setCtaUrl("");
      setCtaText("");
      setFanActions([]);
      setResetDialogOpen(false);
      toast.success("Profile reset to MDEDB defaults");
    } catch (error) {
      console.error("Error resetting profile:", error);
      toast.error("Failed to reset profile");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href={`/admin/organizations/${org.country_code}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {getCountryFlag(org.country_code)}{" "}
          {getCountryLabel(org.country_code)}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{org.org_name}</h1>
        {profile && <Badge variant="outline">Profile customized</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Form + Danger Zone */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fan-Facing Profile</CardTitle>
              <CardDescription>
                Customize how this organization appears to fans. Empty fields
                fall back to MDEDB data. Changes are reflected in the preview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={`Defaults to "${org.org_name}"`}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  {orgName.trim() ? (
                    <>Overrides &quot;{org.org_name}&quot;</>
                  ) : (
                    "Customize organization name"
                  )}
                </p>
              </div>

              {/* Mission */}
              <div className="space-y-2">
                <Label htmlFor="mission">Mission</Label>
                <Input
                  id="mission"
                  value={mission}
                  onChange={(e) =>
                    setMission(e.target.value.slice(0, MAX_MISSION_LENGTH))
                  }
                  placeholder={
                    org.mission_statement
                      ? `Defaults to "${org.mission_statement}"`
                      : "No default value"
                  }
                  disabled={saving}
                />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground min-w-0">
                    {mission.trim() ? (
                      org.mission_statement ? (
                        <>Overrides &quot;{org.mission_statement}&quot;</>
                      ) : (
                        "Custom mission"
                      )
                    ) : org.mission_statement ? (
                      "Customize mission"
                    ) : (
                      "Set organization mission"
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {mission.length}/{MAX_MISSION_LENGTH}
                  </span>
                </div>
              </div>

              {/* CTA URL */}
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">Call-to-Action URL</Label>
                <Input
                  id="ctaUrl"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder={
                    org.website
                      ? `Defaults to "${org.website}"`
                      : "No default value"
                  }
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  {ctaUrl.trim() ? (
                    org.website ? (
                      <>
                        Overrides{" "}
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          {org.website}
                        </a>
                      </>
                    ) : (
                      "Custom CTA URL"
                    )
                  ) : org.website ? (
                    <>Customize CTA URL</>
                  ) : (
                    "Set CTA URL"
                  )}
                </p>
                {ctaDomainMismatch && (
                  <p className="text-xs text-amber-600">
                    Domain does not match organization&apos;s website. CTA links
                    should point to the organization&apos;s own site for
                    reliable analytics.
                  </p>
                )}
              </div>

              {/* CTA Button Text */}
              <div className="space-y-2">
                <Label htmlFor="ctaText">Call-to-Action Button Text</Label>
                <Input
                  id="ctaText"
                  value={ctaText}
                  onChange={(e) =>
                    setCtaText(e.target.value.slice(0, MAX_CTA_TEXT_LENGTH))
                  }
                  placeholder={'Defaults to "Get involved"'}
                  disabled={saving}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {ctaText.trim() ? (
                      <>Overrides &quot;Get involved&quot;</>
                    ) : (
                      "Customize button text"
                    )}
                  </p>
                  {ctaText && (
                    <span className="text-xs text-muted-foreground">
                      {ctaText.length}/{MAX_CTA_TEXT_LENGTH}
                    </span>
                  )}
                </div>
              </div>

              {/* Fan Actions */}
              <div className="space-y-2">
                <Label>Fan Actions</Label>
                <FanActionsInput
                  ref={fanActionsRef}
                  value={fanActions}
                  onChange={setFanActions}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Short labels for what fans can do. Separate with commas. Max 2
                  actions.
                </p>
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Organization Image</Label>
                <ImageUpload
                  orgId={orgId}
                  currentImageUrl={profile?.image_url || null}
                  onImageChange={(url) => {
                    setProfile((prev) =>
                      prev
                        ? { ...prev, image_url: url }
                        : url
                          ? {
                              id: "",
                              org_id: orgId,
                              org_name: null,
                              mission: null,
                              cta_url: null,
                              cta_text: null,
                              fan_actions: null,
                              image_url: url,
                              created_at: "",
                              updated_at: "",
                            }
                          : null,
                    );
                  }}
                  disabled={saving}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Reset all profile overrides. The organization will revert to its
                MDEDB data for fan-facing display, and routing will use the
                org&apos;s website URL.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setResetDialogOpen(true)}
                disabled={!profile}
              >
                Reset Profile
              </Button>
              {!profile && (
                <p className="text-xs text-muted-foreground mt-2">
                  No profile to reset.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Live preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Fan Preview
            </p>
            {preview && (
              <div className="max-w-sm">
                {/* Card mimicking the org directory OrganizationCard */}
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                  {/* Image area */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {preview.imageUrl ? (
                      <img
                        src={preview.imageUrl}
                        alt={preview.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-300">
                        <svg
                          className="size-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="m3 16 5-5 4 4 4-4 5 5" />
                          <circle cx="15" cy="9" r="2" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <span
                      className="font-bold text-xl mb-2 inline-block"
                      style={{ color: "#212529" }}
                    >
                      {preview.name}
                    </span>

                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                      <MapPin className="size-4" />
                      <span>{preview.country}</span>
                    </div>

                    {preview.mission && (
                      <div className="flex items-start gap-2 mb-3">
                        <Target
                          className="size-4 mt-0.5 shrink-0"
                          style={{ color: "#a6cb65" }}
                        />
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {preview.mission}
                        </p>
                      </div>
                    )}

                    {preview.fanActions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          FANS CAN
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {preview.fanActions.map((action, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-0.5 text-xs font-semibold text-gray-700"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {preview.ctaUrl && (
                      <a
                        href={preview.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-md px-4 py-2 text-center font-semibold text-sm no-underline hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: "#f7ee7e",
                          color: "#212529",
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {preview.ctaText}
                          <ExternalLink className="size-4" />
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Routing Activity */}
            {(() => {
              const activeLinkedTours = linkedTours.filter(
                (lt) =>
                  lt.tour &&
                  lt.enabled &&
                  ["Active", "Upcoming"].includes(getTourStatus(lt.tour).label),
              );
              const hasDefaults = countryDefaults.length > 0;
              const hasActivity = activeLinkedTours.length > 0 || hasDefaults;

              // Collect all implicit tours across country defaults
              const allImplicit = countryDefaults.flatMap(
                (cd) => implicitTours[cd.country_code] || [],
              );

              const countryDisplay = org
                ? `${getCountryFlag(org.country_code)} ${getCountryLabel(org.country_code)}`
                : "";

              // Tour card component reused for both sections
              const tourCard = (
                tour: {
                  id: string;
                  name: string;
                  start_date: string;
                  end_date: string;
                  router_artists: {
                    id: string;
                    name: string;
                  };
                },
                key: string,
              ) => (
                <div
                  key={key}
                  className="text-sm border rounded-md p-3 space-y-1"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Artist
                    </span>
                    <Link
                      href={`/admin/artists/${tour.router_artists.id}`}
                      className="text-[--color-link] hover:text-[--color-link-hover] underline"
                    >
                      {tour.router_artists.name}
                    </Link>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-muted-foreground">Tour</span>
                    <Link
                      href={`/admin/tours/${tour.id}`}
                      className="text-[--color-link] hover:text-[--color-link-hover] underline"
                    >
                      {tour.name}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateRange(tour.start_date, tour.end_date)}
                  </p>
                </div>
              );

              return (
                <div className="space-y-3 mt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Routing Activity
                  </p>

                  {!hasActivity && (
                    <p className="text-sm text-muted-foreground">
                      No active tours currently route to this organization.
                    </p>
                  )}

                  {activeLinkedTours.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Direct overrides in {countryDisplay}
                      </p>
                      {activeLinkedTours.map((lt) =>
                        tourCard(lt.tour, `override-${lt.id}`),
                      )}
                    </div>
                  )}

                  {hasDefaults && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Default for {countryDisplay}
                        {countryDefaults.some((cd) => cd.effective_from) && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (
                            {countryDefaults
                              .filter((cd) => cd.effective_from)
                              .map(
                                (cd) =>
                                  `${cd.effective_from}${cd.effective_to ? ` – ${cd.effective_to}` : " – ongoing"}`,
                              )
                              .join(", ")}
                            )
                          </span>
                        )}
                      </p>
                      {allImplicit.length > 0 ? (
                        allImplicit.map((t) => tourCard(t, `implicit-${t.id}`))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No active tours routing via this default
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Profile</DialogTitle>
            <DialogDescription>
              This will remove all fan-facing profile overrides for{" "}
              {org.org_name}. The organization will revert to using its MDEDB
              data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? "Resetting..." : "Reset Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
