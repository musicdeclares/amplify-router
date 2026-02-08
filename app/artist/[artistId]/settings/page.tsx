// Documented in: content/help/artist/getting-started.md#account-settings
"use client";

import { useState, useEffect, use } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Ban, HelpCircle } from "lucide-react";
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Account Settings
          <a href="/help/artist/getting-started#account-settings" className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-5 w-5" />
          </a>
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and account.{" "}
          <a href="/help/artist/getting-started#account-settings" className="underline hover:no-underline">
            Learn more
          </a>
        </p>
      </div>

      {/* Account deactivated banner */}
      {!artist.account_active && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>Account deactivated</AlertTitle>
          <AlertDescription>
            Your AMPLIFY account has been deactivated. Please contact Music
            Declares Emergency for assistance.
          </AlertDescription>
        </Alert>
      )}

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
                href="/forgot-password"
                className="font-medium underline underline-offset-4 hover:text-foreground"
              >
                Reset your password
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
