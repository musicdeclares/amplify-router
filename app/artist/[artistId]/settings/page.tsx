"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { Play, Pause, Ban } from "lucide-react";
import { Artist } from "@/app/types/router";

export default function ArtistSettingsPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = use(params);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  // Pause dialog state
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchArtist();
  }, [artistId]);

  async function fetchArtist() {
    try {
      const res = await fetch(`/api/artists/${artistId}`);
      if (res.ok) {
        const data = await res.json();
        setArtist(data.artist);
        setName(data.artist.name);
        if (data.userEmail) {
          setUserEmail(data.userEmail);
        }
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }

    setSaving(true);
    setNameError("");

    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }

      const data = await res.json();
      setArtist(data.artist);
      toast.success("Name updated");
    } catch (error) {
      console.error("Error saving name:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!artist) return;

    // If currently active, show confirmation dialog
    if (artist.link_active) {
      setPauseDialogOpen(true);
      return;
    }

    // If currently paused, resume immediately
    setUpdating(true);
    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link_active: true,
          link_inactive_reason: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to resume");
        return;
      }

      setArtist({ ...artist, link_active: true, link_inactive_reason: null });
      toast.success("Your AMPLIFY link has resumed");
    } catch (error) {
      console.error("Error reactivating:", error);
      toast.error("Failed to resume");
    } finally {
      setUpdating(false);
    }
  }

  async function handleConfirmPause() {
    if (!artist) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link_active: false,
          link_inactive_reason: pauseReason.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to pause");
        return;
      }

      setArtist({
        ...artist,
        link_active: false,
        link_inactive_reason: pauseReason.trim() || null,
      });
      setPauseDialogOpen(false);
      setPauseReason("");
      toast.success("Your AMPLIFY link has been paused");
    } catch (error) {
      console.error("Error pausing:", error);
      toast.error("Failed to pause");
    } finally {
      setUpdating(false);
    }
  }

  const hasNameChanges = artist && name.trim() !== artist.name;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Artist not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and link status
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Handle</Label>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-3 py-2 rounded text-sm">
                {artist.handle}
              </code>
              <span className="text-sm text-muted-foreground">
                (cannot be changed)
              </span>
            </div>
          </div>

          <Button onClick={handleSaveName} disabled={saving || !hasNameChanges}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your login credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Contact MDE if you need to change your email address.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <p className="text-sm text-muted-foreground">
              <a
                href="/admin/forgot-password"
                className="font-medium underline underline-offset-4 hover:text-foreground"
              >
                Reset your password
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Link Status */}
      <Card>
        <CardHeader>
          <CardTitle>Link Status</CardTitle>
          <CardDescription>
            Control whether your AMPLIFY link routes fans to organizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!artist.account_active ? (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-full bg-destructive/10 text-destructive">
                <Ban className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Account deactivated</p>
                <p className="text-sm text-muted-foreground">
                  Your AMPLIFY account has been deactivated. Please contact
                  Music Declares Emergency for assistance.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-1.5 rounded-full ${artist.link_active ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}
                  >
                    {artist.link_active ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {artist.link_active ? "Link is active" : "Link is paused"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {artist.link_active
                        ? "Fans are being routed to climate action organizations"
                        : "Fans see a fallback page when visiting your link"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={artist.link_active}
                  onCheckedChange={handleToggleActive}
                  disabled={updating}
                />
              </div>

              {!artist.link_active && artist.link_inactive_reason && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <span className="font-medium">Reason:</span>{" "}
                  {artist.link_inactive_reason}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pause Confirmation Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause your AMPLIFY link?</DialogTitle>
            <DialogDescription>
              When paused, fans visiting your link will see a fallback page
              instead of being routed to climate action organizations. You can
              resume your link at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pause-reason">Reason (optional)</Label>
            <Textarea
              id="pause-reason"
              placeholder="e.g., Taking a break from touring"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This helps MDE understand why links are paused. Only visible to
              MDE admins.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPauseDialogOpen(false);
                setPauseReason("");
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmPause}
              disabled={updating}
            >
              {updating ? "Pausing..." : "Pause Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
