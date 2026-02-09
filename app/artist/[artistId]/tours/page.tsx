"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TourTable, TourWithArtist } from "@/components/tours/TourTable";
import { EVENTS, SOURCES } from "@/app/lib/analytics-events";

export default function ArtistToursPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = use(params);
  const [tours, setTours] = useState<TourWithArtist[]>([]);
  const [artistHandle, setArtistHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tours and artist data in parallel
        const [toursRes, artistRes] = await Promise.all([
          fetch(`/api/tours?artist_id=${artistId}`),
          fetch(`/api/artists/${artistId}`),
        ]);

        if (toursRes.ok) {
          const toursData = await toursRes.json();
          setTours(toursData.tours || []);
        }

        if (artistRes.ok) {
          const artistData = await artistRes.json();
          setArtistHandle(artistData.artist?.handle || null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load tours");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [artistId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tours</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tour dates and fan routing
          </p>
        </div>
        <Button asChild>
          <Link
            href={`/artist/${artistId}/tours/new`}
            data-umami-event={EVENTS.ARTIST_CREATE_TOUR}
            data-umami-event-artist={artistHandle || undefined}
            data-umami-event-source={SOURCES.TOURS_LIST}
          >
            Add Tour
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : tours.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No tours created yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first tour to start routing fans to climate action organizations.
          </p>
          <Button variant="link" asChild>
            <Link
              href={`/artist/${artistId}/tours/new`}
              data-umami-event={EVENTS.ARTIST_CREATE_TOUR}
              data-umami-event-artist={artistHandle || undefined}
              data-umami-event-source={SOURCES.TOURS_EMPTY_STATE}
            >
              Add Tour
            </Link>
          </Button>
        </div>
      ) : (
        <TourTable
          tours={tours}
          showCountriesColumn
          defaultHideCompleted
          basePath={`/artist/${artistId}/tours`}
        />
      )}
    </div>
  );
}
