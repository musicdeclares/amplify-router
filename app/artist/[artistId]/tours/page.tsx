"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TourTable, TourWithArtist } from "@/components/tours/TourTable";

export default function ArtistToursPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = use(params);
  const [tours, setTours] = useState<TourWithArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTours() {
      try {
        const res = await fetch(`/api/tours?artist_id=${artistId}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setTours(data.tours || []);
      } catch (error) {
        console.error("Error fetching tours:", error);
        toast.error("Failed to load tours");
      } finally {
        setLoading(false);
      }
    }

    fetchTours();
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
        <Link href={`/artist/${artistId}/tours/new`}>
          <Button>Add Tour</Button>
        </Link>
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
          <Link href={`/artist/${artistId}/tours/new`}>
            <Button variant="link">Add Tour</Button>
          </Link>
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
