"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { getCountryLabel, getCountryFlag } from "@/app/lib/countries";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  Calendar,
  ExternalLink,
  Pause,
  Play,
  AlertTriangle,
  MoreVertical,
  Trash2,
  UserPen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrgPublicView } from "@/app/types/router";
import { PauseOrgDialog } from "@/components/shared/PauseOrgDialog";
import { EVENTS } from "@/app/lib/analytics-events";

interface Organization extends OrgPublicView {
  router_enabled: boolean;
  router_pause_reason: string | null;
  has_profile: boolean;
}

interface CountryDefault {
  id: string;
  country_code: string;
  org_id: string;
  effective_from: string | null;
  effective_to: string | null;
  notes: string | null;
  org: OrgPublicView | null;
}

export default function CountryDetailPage({
  params,
}: {
  params: Promise<{ countryCode: string }>;
}) {
  const { countryCode } = use(params);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [recommendations, setRecommendations] = useState<CountryDefault[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [dateSpecificDialogOpen, setDateSpecificDialogOpen] = useState(false);
  const [dateSpecificOrg, setDateSpecificOrg] = useState<Organization | null>(
    null,
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateNotes, setDateNotes] = useState("");

  const [removeRecTarget, setRemoveRecTarget] = useState<CountryDefault | null>(
    null,
  );
  const [updating, setUpdating] = useState(false);

  const countryName = getCountryLabel(countryCode);
  const permanentRec = recommendations.find((r) => r.effective_from === null);
  const dateSpecificRecs = recommendations.filter(
    (r) => r.effective_from !== null,
  );

  useEffect(() => {
    fetchData();
  }, [countryCode]);

  async function fetchData() {
    setLoading(true);
    try {
      const [orgsRes, defaultsRes] = await Promise.all([
        fetch(`/api/organizations?public=true&country=${countryCode}`),
        fetch("/api/country-defaults"),
      ]);

      if (!orgsRes.ok || !defaultsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const orgsData = await orgsRes.json();
      const defaultsData = await defaultsRes.json();

      setOrgs(orgsData.organizations || []);

      // Filter defaults to this country
      const countryDefaults = (defaultsData.defaults || []).filter(
        (d: CountryDefault) => d.country_code === countryCode.toUpperCase(),
      );
      setRecommendations(countryDefaults);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function setAsRecommendation(org: Organization) {
    setUpdating(true);
    try {
      // Check if there's an existing permanent recommendation
      if (permanentRec) {
        // Update existing
        const res = await fetch(`/api/country-defaults/${permanentRec.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country_code: countryCode.toUpperCase(),
            org_id: org.id,
            effective_from: null,
            effective_to: null,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        // Add new
        const res = await fetch("/api/country-defaults", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country_code: countryCode.toUpperCase(),
            org_id: org.id,
            effective_from: null,
            effective_to: null,
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
      }

      toast.success(
        `${org.org_name} is now the recommended org for ${countryName}`,
      );
      await fetchData();
    } catch (error) {
      console.error("Error setting recommendation:", error);
      toast.error("Failed to set recommendation");
    } finally {
      setUpdating(false);
    }
  }

  async function removeRecommendation() {
    if (!removeRecTarget) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/country-defaults/${removeRecTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Recommendation removed");
      await fetchData();
    } catch (error) {
      console.error("Error removing recommendation:", error);
      toast.error("Failed to remove recommendation");
    } finally {
      setUpdating(false);
      setRemoveRecTarget(null);
    }
  }

  function openDateSpecificDialog(org: Organization) {
    setDateSpecificOrg(org);
    setDateFrom("");
    setDateTo("");
    setDateNotes("");
    setDateSpecificDialogOpen(true);
  }

  async function handleDateSpecificSave() {
    if (!dateSpecificOrg || !dateFrom) {
      toast.error("Start date is required");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/country-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_code: countryCode.toUpperCase(),
          org_id: dateSpecificOrg.id,
          effective_from: dateFrom,
          effective_to: dateTo || null,
          notes: dateNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create");
      }

      toast.success("Date-specific recommendation added");
      setDateSpecificDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error adding date-specific recommendation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add recommendation",
      );
    } finally {
      setUpdating(false);
    }
  }

  function openPauseDialog(org: Organization) {
    setSelectedOrg(org);
    setPauseDialogOpen(true);
  }

  async function handleToggleStatus(org: Organization, enable: boolean) {
    if (!enable) {
      openPauseDialog(org);
      return;
    }
    await updateOrgStatus(org.id, true, null);
  }

  async function handlePauseFromDialog(orgId: string, reason: string | null) {
    await updateOrgStatus(orgId, false, reason);
    setPauseDialogOpen(false);
  }

  async function updateOrgStatus(
    orgId: string,
    enabled: boolean,
    reason: string | null,
  ) {
    setUpdating(true);
    try {
      const res = await fetch(
        "/api/organizations?action=bulk_update_router_status",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_ids: [orgId],
            enabled,
            reason,
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to update");

      toast.success(enabled ? "Organization resumed" : "Organization paused");
      await fetchData();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/organizations"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Countries
        </Link>
        <h1 className="text-2xl font-bold">
          <span className="mr-2">{getCountryFlag(countryCode)}</span>
          {countryName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {orgs.length} approved{" "}
          {orgs.length === 1 ? "organization" : "organizations"}
        </p>
      </div>

      {/* Recommendation Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recommendation Status</CardTitle>
          <CardDescription>
            Which organization fans from {countryName} are directed to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permanent Recommendation */}
          {permanentRec ? (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium">
                    {permanentRec.org?.org_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permanent recommendation
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoveRecTarget(permanentRec)}
                disabled={updating}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Alert
              variant="destructive"
              className="border-destructive/50 bg-destructive/10"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No permanent recommendation set. Fans from {countryName} will
                see the fallback page.
              </AlertDescription>
            </Alert>
          )}

          {/* Date-specific Recommendations */}
          {dateSpecificRecs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Date-specific overrides:
              </p>
              {dateSpecificRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {rec.org?.org_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rec.effective_from}{" "}
                        {rec.effective_to
                          ? `→ ${rec.effective_to}`
                          : "(ongoing)"}
                        {rec.notes && ` · ${rec.notes}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoveRecTarget(rec)}
                    disabled={updating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Organizations in {countryName}
          </CardTitle>
          <CardDescription>
            Approved partner organizations operating in this country
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No approved organizations in {countryName}.
            </p>
          ) : (
            <div className="space-y-3">
              {orgs.map((org) => {
                const isPermanentRec = permanentRec?.org_id === org.id;
                const isDateSpecificRec = dateSpecificRecs.some(
                  (r) => r.org_id === org.id,
                );

                return (
                  <div
                    key={org.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{org.org_name}</h3>
                        {isPermanentRec && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1 text-amber-600" />
                            Recommended
                          </Badge>
                        )}
                        {isDateSpecificRec && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Date-specific
                          </Badge>
                        )}
                        {org.has_profile && (
                          <Badge className="text-xs" variant="outline">
                            Profile customized
                          </Badge>
                        )}
                        {!org.router_enabled && (
                          <Badge variant="destructive" className="text-xs">
                            Paused
                          </Badge>
                        )}
                      </div>

                      {org.website && (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[--color-link] hover:text-[--color-link-hover] underline inline-flex items-center gap-1 mt-1"
                        >
                          <span className="truncate max-w-62.5">
                            {org.website}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      )}

                      {!org.router_enabled && org.router_pause_reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Paused: {org.router_pause_reason}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={updating}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/organizations/org/${org.id}`}>
                            <UserPen className="h-4 w-4 mr-2" />
                            Edit profile
                          </Link>
                        </DropdownMenuItem>
                        {!isPermanentRec && (
                          <DropdownMenuItem
                            onClick={() => setAsRecommendation(org)}
                            data-umami-event={EVENTS.ADMIN_SET_COUNTRY_DEFAULT}
                            data-umami-event-org={org.org_name}
                            data-umami-event-country={countryCode}
                          >
                            <Star className="h-4 w-4 mr-2 text-amber-600" />
                            Set as recommended
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => openDateSpecificDialog(org)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Add date-specific...
                        </DropdownMenuItem>
                        {org.router_enabled ? (
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(org, false)}
                            className="text-destructive"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause routing
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(org, true)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Activate routing
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pause Dialog */}
      {selectedOrg && (
        <PauseOrgDialog
          open={pauseDialogOpen}
          onOpenChange={setPauseDialogOpen}
          orgId={selectedOrg.id}
          orgName={selectedOrg.org_name}
          initialReason={selectedOrg.router_pause_reason || ""}
          onPause={handlePauseFromDialog}
          isPausing={updating}
        />
      )}

      {/* Date-specific Dialog */}
      <Dialog
        open={dateSpecificDialogOpen}
        onOpenChange={setDateSpecificDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Date-Specific Recommendation</DialogTitle>
            <DialogDescription>
              This will override the permanent recommendation during the
              specified dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input value={dateSpecificOrg?.org_name || ""} disabled />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Start Date</Label>
                <DateInput
                  id="dateFrom"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">End Date (optional)</Label>
                <DateInput
                  id="dateTo"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Election season 2026"
                value={dateNotes}
                onChange={(e) => setDateNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDateSpecificDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDateSpecificSave}
              disabled={updating}
              data-umami-event={EVENTS.ADMIN_ADD_DATE_SPECIFIC_REC}
              data-umami-event-org={dateSpecificOrg?.org_name}
              data-umami-event-country={countryCode}
            >
              {updating ? "Saving..." : "Add Recommendation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!removeRecTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveRecTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Recommendation</DialogTitle>
            <DialogDescription>
              Remove {removeRecTarget?.org?.org_name || "this organization"} as{" "}
              {removeRecTarget?.effective_from
                ? "a date-specific"
                : "the permanent"}{" "}
              recommendation?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveRecTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={removeRecommendation}
              disabled={updating}
              data-umami-event={EVENTS.ADMIN_REMOVE_COUNTRY_DEFAULT}
              data-umami-event-org={removeRecTarget?.org?.org_name}
              data-umami-event-country={countryCode}
              data-umami-event-type={removeRecTarget?.effective_from ? "date-specific" : "permanent"}
            >
              {updating ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
