"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Copy, Mail, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Invite } from "@/app/types/router";
import { EVENTS, SOURCES } from "@/app/lib/analytics-events";

export default function ViewInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchInvite();
  }, [id]);

  async function fetchInvite() {
    try {
      const res = await fetch(`/api/invites/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Invite not found");
        } else {
          setError("Failed to load invite");
        }
        return;
      }
      const data = await res.json();
      setInvite(data.invite);
    } catch (err) {
      console.error("Error fetching invite:", err);
      setError("Failed to load invite");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtend() {
    try {
      const res = await fetch(`/api/invites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend" }),
      });
      if (!res.ok) throw new Error("Failed to extend invite");
      toast.success("Invite extended by 7 days");
      fetchInvite();
    } catch (err) {
      console.error("Error extending invite:", err);
      toast.error("Failed to extend invite");
    }
  }

  async function handleRevoke() {
    if (!confirm("Are you sure you want to revoke this invite?")) return;
    try {
      const res = await fetch(`/api/invites/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke invite");
      toast.success("Invite revoked");
      fetchInvite();
    } catch (err) {
      console.error("Error revoking invite:", err);
      toast.error("Failed to revoke invite");
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  }

  function getInviteUrl() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    return `${siteUrl}/invite/${invite?.token}`;
  }

  function getEmailSubject() {
    return `You're invited to join AMPLIFY`;
  }

  function getEmailBody() {
    if (!invite) return "";
    const inviteUrl = getInviteUrl();
    return `Hi, ${invite.suggested_name}:

You're invited to set up your AMPLIFY link with Music Declares Emergency.

AMPLIFY gives you a single, evergreen link that directs your fans to vetted climate action organizations based on their location and your tour schedule. It works across all your channels: social bios, stage visuals, posters, and more.

To get started, click the link below and follow the instructions to create your account:

${inviteUrl}

This link will expire in 7 days. If you have any questions, just reply to this email.

Best,
Music Declares Emergency`;
  }

  function getMailtoLink() {
    if (!invite) return "";
    const subject = encodeURIComponent(getEmailSubject());
    const body = encodeURIComponent(getEmailBody());
    return `mailto:${invite.email}?subject=${subject}&body=${body}`;
  }

  function formatExpiry(expiresAt: string) {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const dateStr = expiry.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (diffDays < 0) return `Expired on ${dateStr}`;
    if (diffDays === 0) return `Expires today (${dateStr})`;
    if (diffDays === 1) return `Expires tomorrow (${dateStr})`;
    return `Expires in ${diffDays} days (${dateStr})`;
  }

  function getStatusBadge() {
    if (!invite) return null;
    switch (invite.status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-secondary text-secondary-foreground">Accepted</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return null;
    }
  }

  const isActive = invite?.status === "pending";
  const isExpired = invite?.status === "expired" ||
    (invite && new Date(invite.expires_at) < new Date());

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <Link
            href="/admin/artists"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Artists
          </Link>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <Link
            href="/admin/artists"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Artists
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Invite not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/artists"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Artists
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Invite for {invite.suggested_name}</CardTitle>
              <CardDescription>{invite.email}</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status alerts */}
          {invite.status === "accepted" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invite has been accepted. The artist has created their account.
              </AlertDescription>
            </Alert>
          )}
          {invite.status === "revoked" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invite has been revoked and can no longer be used.
              </AlertDescription>
            </Alert>
          )}
          {isExpired && invite.status === "pending" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invite has expired. Extend it to allow the artist to accept.
              </AlertDescription>
            </Alert>
          )}

          {/* Invite Link */}
          <div className="space-y-2">
            <Label>Invite Link</Label>
            <div className="flex gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                {getInviteUrl()}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(getInviteUrl(), "link")}
                data-umami-event={EVENTS.ADMIN_COPY_INVITE}
                data-umami-event-artist={invite.suggested_name}
                data-umami-event-invite={invite.id}
                data-umami-event-field="link"
                data-umami-event-source={SOURCES.INVITE_PAGE}
              >
                {copiedField === "link" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatExpiry(invite.expires_at)}
            </p>
          </div>

          {/* Send via Email - only show for pending invites */}
          {isActive && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <a
                  href={getMailtoLink()}
                  data-umami-event={EVENTS.ADMIN_EMAIL_INVITE}
                  data-umami-event-artist={invite.suggested_name}
                  data-umami-event-invite={invite.id}
                  data-umami-event-source={SOURCES.INVITE_PAGE}
                >
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    {isExpired ? "Send via Email" : "Resend via Email"}
                  </Button>
                </a>
                <span className="text-sm text-muted-foreground">
                  Opens your email client
                </span>
              </div>

              <div className="border-t pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Or copy the email content manually:
                </p>

                {/* Subject */}
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                      {getEmailSubject()}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(getEmailSubject(), "subject")}
                      data-umami-event={EVENTS.ADMIN_COPY_INVITE}
                      data-umami-event-artist={invite.suggested_name}
                      data-umami-event-invite={invite.id}
                      data-umami-event-field="subject"
                      data-umami-event-source={SOURCES.INVITE_PAGE}
                    >
                      {copiedField === "subject" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <Label>Body</Label>
                  <div className="flex gap-2">
                    <pre className="flex-1 bg-muted px-3 py-2 rounded text-sm whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                      {getEmailBody()}
                    </pre>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => copyToClipboard(getEmailBody(), "body")}
                      data-umami-event={EVENTS.ADMIN_COPY_INVITE}
                      data-umami-event-artist={invite.suggested_name}
                      data-umami-event-invite={invite.id}
                      data-umami-event-field="body"
                      data-umami-event-source={SOURCES.INVITE_PAGE}
                    >
                      {copiedField === "body" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            {isActive && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExtend}
                  data-umami-event={EVENTS.ADMIN_EXTEND_INVITE}
                  data-umami-event-artist={invite.suggested_name}
                  data-umami-event-invite={invite.id}
                  data-umami-event-source={SOURCES.INVITE_PAGE}
                >
                  Extend 7 Days
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevoke}
                  data-umami-event={EVENTS.ADMIN_REVOKE_INVITE}
                  data-umami-event-artist={invite.suggested_name}
                  data-umami-event-invite={invite.id}
                  data-umami-event-source={SOURCES.INVITE_PAGE}
                >
                  Revoke Invite
                </Button>
              </>
            )}
            <Button variant="ghost" asChild>
              <Link href="/admin/artists">Back to Artists</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
