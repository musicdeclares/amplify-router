"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Tour, Artist } from "@/app/types/router";
import { getTourStatus, formatDateRange } from "@/app/lib/tour-utils";

export interface TourWithArtist extends Tour {
  router_artists: Pick<Artist, "id" | "handle" | "name">;
  router_tour_overrides?: Array<{
    id: string;
    country_code: string;
  }>;
}

type SortField = "dates" | "name" | "artist" | "countries" | "status";
type SortDirection = "asc" | "desc";

interface TourTableProps {
  tours: TourWithArtist[];
  showArtistColumn?: boolean;
  showCountriesColumn?: boolean;
  defaultHideCompleted?: boolean;
  basePath?: string; // Custom base path for tour links (default: /admin/tours)
}

export function TourTable({
  tours,
  showArtistColumn = false,
  showCountriesColumn = false,
  defaultHideCompleted = false,
  basePath = "/admin/tours",
}: TourTableProps) {
  const [sortField, setSortField] = useState<SortField>("dates");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showCompleted, setShowCompleted] = useState(!defaultHideCompleted);

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

  return (
    <div>
      {completedCount > 0 && (
        <div className="mb-4 flex items-center gap-2">
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
            Show completed ({completedCount})
          </Label>
        </div>
      )}

      {sortedTours.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No upcoming or active tours.</p>
          {!showCompleted && completedCount > 0 && (
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
              {showArtistColumn && (
                <TableHead>
                  <button
                    onClick={() => handleSort("artist")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Artist
                    {getSortIcon("artist")}
                  </button>
                </TableHead>
              )}
              <TableHead className="hidden sm:table-cell">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Tour Name
                  {getSortIcon("name")}
                </button>
              </TableHead>
              {showCountriesColumn && (
                <TableHead className="hidden sm:table-cell">
                  <button
                    onClick={() => handleSort("countries")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Countries
                    {getSortIcon("countries")}
                  </button>
                </TableHead>
              )}
              <TableHead className="hidden sm:table-cell">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Status
                  {getSortIcon("status")}
                </button>
              </TableHead>
              <TableHead className="w-15"></TableHead>
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
                    {/* Mobile: show tour name under dates */}
                    <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                      {tour.name}
                    </span>
                    {/* Mobile: show artist link under dates (if artist column enabled) */}
                    {showArtistColumn && (
                      <span className="block sm:hidden text-xs mt-0.5">
                        <Link
                          href={`/admin/artists/${tour.router_artists.id}`}
                          className="text-[--color-link] hover:text-[--color-link-hover] underline"
                        >
                          {tour.router_artists.name}
                        </Link>
                      </span>
                    )}
                    {/* Mobile: show status badge under dates */}
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
                  {showArtistColumn && (
                    <TableCell className="hidden sm:table-cell">
                      <Link
                        href={`/admin/artists/${tour.router_artists.id}`}
                        className="text-[--color-link] hover:text-[--color-link-hover] underline"
                      >
                        {tour.router_artists.name}
                      </Link>
                    </TableCell>
                  )}
                  <TableCell className="font-medium hidden sm:table-cell">
                    {tour.name}
                  </TableCell>
                  {showCountriesColumn && (
                    <TableCell className="hidden sm:table-cell">
                      {countryCount > 0 ? (
                        <span className="text-sm">{countryCount}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          None
                        </span>
                      )}
                    </TableCell>
                  )}
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
                  <TableCell className="w-15">
                    <Link href={`${basePath}/${tour.id}`}>
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
