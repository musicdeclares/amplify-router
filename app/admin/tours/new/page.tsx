// Documented in: content/help/admin/tours.md#adding-a-tour
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Artist } from "@/app/types/router";
import { Check, ChevronsUpDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENTS, SOURCES } from "@/app/lib/analytics-events";

export default function NewTourPage() {
  return (
    <Suspense>
      <NewTourForm />
    </Suspense>
  );
}

function NewTourForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedArtistId = searchParams.get("artist");

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  // Form state
  const [artistId, setArtistId] = useState(preselectedArtistId || "");
  const [artistOpen, setArtistOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preTourDays, setPreTourDays] = useState(0);
  const [postTourDays, setPostTourDays] = useState(0);
  const [error, setError] = useState("");
  const [errorLink, setErrorLink] = useState<{
    text: string;
    url: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  async function fetchArtists() {
    try {
      const res = await fetch("/api/artists?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArtists(data.artists || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Failed to load artists");
    } finally {
      setLoadingArtists(false);
    }
  }

  const selectedArtist = artists.find((a) => a.id === artistId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorLink(null);

    if (!artistId) {
      setError("Please select an artist");
      return;
    }

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
      router.push(`/admin/tours/${data.tour.id}`);
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
          href="/admin/tours"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Tours
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Add Tour
            <Link
              href="/help/admin/tours#adding-a-tour"
              className="text-muted-foreground hover:text-foreground"
              data-umami-event={EVENTS.NAV_HELP}
              data-umami-event-topic="adding-a-tour"
              data-umami-event-source={SOURCES.ADMIN_TOUR_FORM}
            >
              <HelpCircle className="h-4 w-4" />
            </Link>
          </CardTitle>
          <CardDescription>
            Set up a new tour with dates and routing configuration.{" "}
            <Link
              href="/help/admin/tours#adding-a-tour"
              className="underline hover:no-underline"
              data-umami-event={EVENTS.NAV_HELP}
              data-umami-event-topic="adding-a-tour"
              data-umami-event-source={SOURCES.ADMIN_TOUR_FORM}
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
              <Popover open={artistOpen} onOpenChange={setArtistOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={artistOpen}
                    className="w-full justify-between"
                    disabled={saving || loadingArtists}
                  >
                    {selectedArtist ? selectedArtist.name : "Select artist..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search artists..." />
                    <CommandList>
                      <CommandEmpty>No artist found.</CommandEmpty>
                      <CommandGroup>
                        {artists.map((artist) => (
                          <CommandItem
                            key={artist.id}
                            value={`${artist.name} ${artist.handle}`}
                            onSelect={() => {
                              setArtistId(artist.id);
                              setArtistOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                artistId === artist.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span>{artist.name}</span>
                            <span className="ml-2 text-muted-foreground text-sm">
                              /{artist.handle}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

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
              <Button
                type="submit"
                disabled={saving}
                data-umami-event={EVENTS.ADMIN_CREATE_TOUR}
              >
                {saving ? "Adding..." : "Add Tour"}
              </Button>
              <Link href="/admin/tours">
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
