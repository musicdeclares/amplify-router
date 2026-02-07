"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function ArtistNewTourPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = use(params);
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preTourDays, setPreTourDays] = useState(0);
  const [postTourDays, setPostTourDays] = useState(0);
  const [error, setError] = useState("");
  const [errorLink, setErrorLink] = useState<{ text: string; url: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist_id: artistId,
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          pre_tour_window_days: preTourDays,
          post_tour_window_days: postTourDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create tour");
        if (data.linkText && data.linkUrl) {
          setErrorLink({ text: data.linkText, url: data.linkUrl });
        }
        setSaving(false);
        return;
      }

      toast.success("Tour created");
      router.push(`/artist/${artistId}/tours/${data.tour.id}`);
    } catch (error) {
      console.error("Error creating tour:", error);
      setError("An unexpected error occurred");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/artist/${artistId}/tours`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Tours
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Tour</CardTitle>
          <CardDescription>
            Set up a new tour with dates and routing configuration.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
                {errorLink && (
                  <>
                    {" "}
                    <Link
                      href={errorLink.url}
                      className="underline hover:no-underline"
                    >
                      {errorLink.text}
                    </Link>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Tour Name</Label>
              <Input
                id="name"
                placeholder="e.g., European Tour 2026"
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
                <p className="text-xs text-muted-foreground">
                  Days before tour start to activate routing
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Days after tour end to keep routing active
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add Tour"}
              </Button>
              <Link href={`/artist/${artistId}/tours`}>
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
