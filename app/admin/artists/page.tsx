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
import { Artist, Invite } from "@/app/types/router";
import { EVENTS, SOURCES } from "@/app/lib/analytics-events";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, Mail, Clock, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ArtistWithTourCount extends Artist {
  tour_count: number;
}

type SortField = "name" | "handle" | "status" | "tours";
type SortDirection = "asc" | "desc";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistWithTourCount[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [invitesOpen, setInvitesOpen] = useState(false);

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

      const [artistsRes, invitesRes] = await Promise.all([
        fetch(`/api/artists?${params}`),
        fetch("/api/invites"),
      ]);

      if (artistsRes.ok) {
        const data = await artistsRes.json();
        setArtists(data.artists || []);
      } else {
        throw new Error("Failed to fetch artists");
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvites(data.invites || []);
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
        // Active (account_active) first when asc
        return direction * ((a.account_active ? 0 : 1) - (b.account_active ? 0 : 1));
      case "tours":
        return direction * (a.tour_count - b.tour_count);
      default:
        return 0;
    }
  });


  // Pending invites
  const pendingInvites = invites.filter((i) => i.status === "pending");

  async function handleExtendInvite(inviteId: string) {
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend" }),
      });
      if (!res.ok) throw new Error("Failed to extend invite");
      toast.success("Invite extended by 7 days");
      fetchArtists();
    } catch (error) {
      console.error("Error extending invite:", error);
      toast.error("Failed to extend invite");
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke invite");
      toast.success("Invite revoked");
      fetchArtists();
    } catch (error) {
      console.error("Error revoking invite:", error);
      toast.error("Failed to revoke invite");
    }
  }

  function formatExpiry(expiresAt: string) {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artists</h1>
          <p className="text-muted-foreground mt-1">
            Manage artists and their AMPLIFY links
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/artists/invite">
            <Button variant="outline">Invite Artist</Button>
          </Link>
          <Link href="/admin/artists/new">
            <Button>Add Artist</Button>
          </Link>
        </div>
      </div>


      {pendingInvites.length > 0 && (
        <div className="border rounded-lg">
          <button
            type="button"
            onClick={() => setInvitesOpen((o) => !o)}
            className="flex items-center gap-2 w-full p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${invitesOpen ? "rotate-90" : ""}`}
            />
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              Pending Invites ({pendingInvites.length})
            </span>
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${invitesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>
                          <div className="font-medium">{invite.suggested_name}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {invite.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {invite.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatExpiry(invite.expires_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/artists/invite/${invite.id}`}>
                                  View invite
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleExtendInvite(invite.id)}
                                data-umami-event={EVENTS.ADMIN_EXTEND_INVITE}
                                data-umami-event-artist={invite.suggested_name}
                                data-umami-event-invite={invite.id}
                                data-umami-event-source={SOURCES.ARTISTS_LIST}
                              >
                                Extend 7 days
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRevokeInvite(invite.id)}
                                className="text-destructive"
                                data-umami-event={EVENTS.ADMIN_REVOKE_INVITE}
                                data-umami-event-artist={invite.suggested_name}
                                data-umami-event-invite={invite.id}
                                data-umami-event-source={SOURCES.ARTISTS_LIST}
                              >
                                Revoke invite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <TableHead className="w-25"></TableHead>
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
                    {artist.account_active ? (
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-secondary-foreground"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
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
