"use client";

import { useState, useEffect, use, useMemo } from "react";
import { QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Artist, Tour } from "@/app/types/router";
import { TourTable, TourWithArtist } from "@/components/tours/TourTable";
import { QrCodeDialog } from "@/components/shared/QrCodeDialog";

interface ArtistWithTours extends Artist {
  router_tours: Tour[];
}

export default function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [artist, setArtist] = useState<ArtistWithTours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    fetchArtist();
  }, [id]);

  async function fetchArtist() {
    setLoading(true);
    try {
      const res = await fetch(`/api/artists/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/admin/artists");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setArtist(data.artist);
      setName(data.artist.name);
      setEnabled(data.artist.enabled);
    } catch (error) {
      console.error("Error fetching artist:", error);
      toast.error("Failed to load artist");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), enabled }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }

      setArtist((prev) => (prev ? { ...prev, ...data.artist } : null));
      toast.success("Artist updated");
    } catch (error) {
      console.error("Error updating artist:", error);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  const toursWithArtist: TourWithArtist[] = useMemo(() => {
    if (!artist) return [];
    return (artist.router_tours || []).map((tour) => ({
      ...tour,
      router_artists: { id: artist.id, handle: artist.handle, name: artist.name },
    }));
  }, [artist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  const tours = artist.router_tours || [];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href="/admin/artists"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Artists
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Artist Details */}
          <Card>
            <CardHeader>
              <CardTitle>Artist Details</CardTitle>
              <CardDescription>Update artist information</CardDescription>
            </CardHeader>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Handle</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                    {artist.handle}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/a/${artist.handle}`,
                      );
                      toast.success("Link copied");
                    }}
                  >
                    Copy Full Link
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Handle cannot be changed after creation.
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Inactive artists will redirect to the fallback page.
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tours */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tours</CardTitle>
                  <CardDescription>
                    Tours associated with this artist
                  </CardDescription>
                </div>
                <Link href={`/admin/tours/new?artist=${id}`}>
                  <Button size="sm">Add Tour</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tours.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tours added yet.</p>
                  <Link href={`/admin/tours/new?artist=${id}`}>
                    <Button variant="link">Add Tour</Button>
                  </Link>
                </div>
              ) : (
                <TourTable tours={toursWithArtist} />
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground">Added:</span>
                <br />
                {new Date(artist.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Last updated:</span>
                <br />
                {new Date(artist.updated_at).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Total tours:</span>
                <br />
                {tours.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a QR code for this artist&apos;s AMPLIFY link.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setQrDialogOpen(true)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <QrCodeDialog
        artistHandle={artist.handle}
        artistName={artist.name}
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
      />
    </div>
  );
}
