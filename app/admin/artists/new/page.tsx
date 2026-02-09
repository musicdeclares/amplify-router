// Documented in: content/help/admin/artists.md#adding-an-artist-directly
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
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
import { toast } from "sonner";
import { EVENTS, SOURCES } from "@/app/lib/analytics-events";

function handleify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export default function NewArtistPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    // Auto-generate handle from name unless user has manually edited it
    if (!handleEdited) {
      setHandle(handleify(value));
    }
  }

  function handleHandleChange(value: string) {
    setHandleEdited(true);
    // Only allow valid handle characters
    setHandle(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!handle.trim()) {
      setError("Handle is required");
      return;
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)) {
      setError(
        'Handle must be lowercase letters, numbers, and hyphens only (e.g., "artist-name")',
      );
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), handle }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create artist");
        setSaving(false);
        return;
      }

      toast.success("Artist created");
      router.push(`/admin/artists/${data.artist.id}`);
    } catch (error) {
      console.error("Error creating artist:", error);
      setError("An unexpected error occurred");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/artists"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Artists
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Add Artist
            <Link
              href="/help/admin/artists#adding-an-artist-directly"
              className="text-muted-foreground hover:text-foreground"
              aria-hidden="true"
              tabIndex={-1}
            >
              <HelpCircle className="h-4 w-4" />
            </Link>
          </CardTitle>
          <CardDescription>
            Create an artist account directly. The artist won&apos;t receive an
            invite or set their own password.{" "}
            <Link
              href="/help/admin/artists#adding-an-artist-directly"
              className="underline hover:no-underline"
              data-umami-event={EVENTS.NAV_HELP}
              data-umami-event-topic="adding-an-artist"
              data-umami-event-source={SOURCES.ARTIST_FORM}
            >
              Learn more
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Artist Name</Label>
              <Input
                id="name"
                placeholder="e.g., Radiohead"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-mono">
                  /a/
                </span>
                <Input
                  id="handle"
                  placeholder="radiohead"
                  value={handle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  disabled={saving}
                  className="font-mono rounded-l-none"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Handle cannot be changed after creation.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving}
                data-umami-event={EVENTS.ADMIN_CREATE_ARTIST}
              >
                {saving ? "Adding..." : "Add Artist"}
              </Button>
              <Button type="button" variant="outline" disabled={saving} asChild>
                <Link href="/admin/artists">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
