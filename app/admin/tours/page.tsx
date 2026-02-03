"use client";

import { useState, useEffect } from "react";
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
import { Tour, Artist } from "@/app/types/router";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TourWithArtist extends Tour {
  router_artists: Pick<Artist, "id" | "handle" | "name">;
  router_tour_overrides?: Array<{
    id: string;
    country_code: string;
  }>;
}

type SortField = "dates" | "name" | "artist" | "countries" | "status";
type SortDirection = "asc" | "desc";

export default function ToursPage() {
  const [tours, setTours] = useState<TourWithArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<SortField>("dates");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchTours();
  }, [search]);

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

  function getTourStatus(tour: TourWithArtist) {
    if (!tour.enabled)
      return { label: "Disabled", variant: "outline" as const, order: 3 };

    const today = new Date().toISOString().split("T")[0];
    if (tour.end_date < today)
      return { label: "Completed", variant: "outline" as const, order: 2 };
    if (tour.start_date > today)
      return { label: "Upcoming", variant: "outline" as const, order: 1 };
    return { label: "Active", variant: "secondary" as const, order: 0 };
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  // Filter out completed tours unless showCompleted is true
  const filteredTours = showCompleted
    ? tours
    : tours.filter((tour) => getTourStatus(tour).label !== "Completed");

  const sortedTours = [...filteredTours].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "dates":
        return direction * a.start_date.localeCompare(b.start_date);
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "artist":
        return (
          direction * a.router_artists.name.localeCompare(b.router_artists.name)
        );
      case "countries":
        return (
          direction *
          ((a.router_tour_overrides?.length || 0) -
            (b.router_tour_overrides?.length || 0))
        );
      case "status":
        return direction * (getTourStatus(a).order - getTourStatus(b).order);
      default:
        return 0;
    }
  });

  const completedCount = tours.filter(
    (tour) => getTourStatus(tour).label === "Completed",
  ).length;

  function formatDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    const shortOpts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    const yearOpts: Intl.DateTimeFormatOptions = { year: "2-digit" };

    const startShort = start.toLocaleDateString("en-US", shortOpts);
    const endShort = end.toLocaleDateString("en-US", shortOpts);
    const startYear = start.toLocaleDateString("en-US", yearOpts);
    const endYear = end.toLocaleDateString("en-US", yearOpts);

    // Compact format: "Jan 3 – Mar 4 '26" or "Aug '26 – Feb '27"
    if (startYear === endYear) {
      return `${startShort} – ${endShort} '${startYear}`;
    }
    return `${startShort} '${startYear} – ${endShort} '${endYear}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tours</h1>
          <p className="text-muted-foreground">
            Manage tour configurations and country routing
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                setShowCompleted(checked === true)
              }
            />
            <Label
              htmlFor="show-completed"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show completed {completedCount > 0 && `(${completedCount})`}
            </Label>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : sortedTours.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search
              ? "No tours match your search."
              : tours.length === 0
                ? "No tours created yet."
                : "No upcoming or active tours."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Try changing your search criteria."
              : tours.length === 0
                ? "Add your first tour to start setting up redirects."
                : "Show completed to see past tours."}
          </p>
          {!search && tours.length === 0 && (
            <Link href="/admin/tours/new">
              <Button variant="link">Add Tour</Button>
            </Link>
          )}
          {!search && tours.length > 0 && !showCompleted && (
            <Button variant="link" onClick={() => setShowCompleted(true)}>
              Show completed tours
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort("dates")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Dates
                  {getSortIcon("dates")}
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Tour Name
                  {getSortIcon("name")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("artist")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Artist
                  {getSortIcon("artist")}
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <button
                  onClick={() => handleSort("countries")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Countries
                  {getSortIcon("countries")}
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Status
                  {getSortIcon("status")}
                </button>
              </TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTours.map((tour) => {
              const status = getTourStatus(tour);
              const countryCount = tour.router_tour_overrides?.length || 0;

              return (
                <TableRow key={tour.id}>
                  <TableCell className="text-sm">
                    <span className="whitespace-nowrap">
                      {formatDateRange(tour.start_date, tour.end_date)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium hidden sm:table-cell">
                    {tour.name}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/artists/${tour.router_artists.id}`}
                      className="text-[--color-link] hover:text-[--color-link-hover] underline"
                    >
                      {tour.router_artists.name}
                    </Link>
                    {/* Show tour name and status on mobile under artist */}
                    <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                      {tour.name}
                    </span>
                    <span className="sm:hidden mt-1 inline-block">
                      <Badge
                        variant={status.variant}
                        className={
                          status.label === "Active"
                            ? "bg-secondary text-xs"
                            : "text-xs"
                        }
                      >
                        {status.label}
                      </Badge>
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {countryCount > 0 ? (
                      <span className="text-sm">{countryCount}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={status.variant}
                      className={
                        status.label === "Active" ? "bg-secondary" : ""
                      }
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[60px]">
                    <Link href={`/admin/tours/${tour.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
