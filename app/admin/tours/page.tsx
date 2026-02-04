"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TourTable, TourWithArtist } from "@/components/tours/TourTable";

export default function ToursPage() {
  const [tours, setTours] = useState<TourWithArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [hasArtists, setHasArtists] = useState(true);

  useEffect(() => {
    fetchTours();
  }, [search]);

  useEffect(() => {
    fetch("/api/artists?limit=1")
      .then((res) => res.json())
      .then((data) => setHasArtists((data.artists?.length ?? 0) > 0))
      .catch(() => {});
  }, []);

  async function fetchTours() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/tours?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setTours(data.tours || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Failed to load tours");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tours</h1>
          <p className="text-muted-foreground mt-1">
            Configure tour dates and organization routing
          </p>
        </div>
        <Link href="/admin/tours/new">
          <Button>Add Tour</Button>
        </Link>
      </div>

      {tours.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {total} tour{total !== 1 ? "s" : ""} total
          </div>
          <Input
            placeholder="Search tours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : tours.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search
              ? "No tours match your search."
              : !hasArtists
                ? "No artists yet."
                : "No tours created yet."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Try changing your search criteria."
              : !hasArtists
                ? "Create an artist before adding tours."
                : "Add your first tour to start setting up redirects."}
          </p>
          {!search && (
            <Link href={hasArtists ? "/admin/tours/new" : "/admin/artists/new"}>
              <Button variant="link">
                {hasArtists ? "Add Tour" : "Create Artist"}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <TourTable
          tours={tours}
          showArtistColumn
          showCountriesColumn
          defaultHideCompleted
        />
      )}
    </div>
  );
}
