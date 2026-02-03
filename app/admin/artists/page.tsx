"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Artist } from "@/app/types/router";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface ArtistWithTourCount extends Artist {
  tour_count: number;
}

type SortField = "name" | "handle" | "status" | "tours";
type SortDirection = "asc" | "desc";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistWithTourCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/artists?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArtists(data.artists || []);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Failed to load artists");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "tours" ? "desc" : "asc");
    }
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  }

  const sortedArtists = [...artists].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "handle":
        return direction * a.handle.localeCompare(b.handle);
      case "status":
        // Active (enabled) first when asc
        return direction * ((a.enabled ? 0 : 1) - (b.enabled ? 0 : 1));
      case "tours":
        return direction * (a.tour_count - b.tour_count);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artists</h1>
          <p className="text-muted-foreground mt-1">
            Manage artists and their AMPLIFY links
          </p>
        </div>
        <Link href="/admin/artists/new">
          <Button>Add Artist</Button>
        </Link>
      </div>

      {artists.length > 0 && (
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by name or handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          {debouncedSearch ? (
            <>
              <p className="text-muted-foreground">
                No artists found matching &ldquo;{debouncedSearch}&rdquo;
              </p>
              <Button variant="link" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                No artists registered yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first artist to start setting up tours.
              </p>
              <Link href="/admin/artists/new">
                <Button variant="link">Add Artist</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Name
                    {getSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button
                    onClick={() => handleSort("handle")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Handle
                    {getSortIcon("handle")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Status
                    {getSortIcon("status")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("tours")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Tours
                    {getSortIcon("tours")}
                  </button>
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedArtists.map((artist) => (
                <TableRow key={artist.id}>
                  <TableCell className="font-medium">
                    {artist.name}
                    {/* Show handle on mobile under name */}
                    <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                      /{artist.handle}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {artist.handle}
                    </code>
                  </TableCell>
                  <TableCell>
                    {artist.enabled ? (
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-secondary-foreground"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{artist.tour_count}</TableCell>
                  <TableCell>
                    <Link href={`/admin/artists/${artist.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
