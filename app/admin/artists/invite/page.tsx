// Documented in: content/help/admin/artists.md#inviting-an-artist
"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface CreatedInvite {
  id: string;
  token: string;
  email: string;
  suggested_name: string;
  invite_url: string;
  expires_at: string;
}

export default function InviteArtistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(
    null,
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!name.trim()) {
      setError("Artist name is required");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          suggested_name: name.trim(),
          role: "artist",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create invite");
        setSending(false);
        return;
      }

      setCreatedInvite(data.invite);
      toast.success("Invite created");
    } catch (error) {
      console.error("Error creating invite:", error);
      setError("An unexpected error occurred");
    } finally {
      setSending(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  }

  function getEmailSubject() {
    return `You're invited to join AMPLIFY`;
  }

  function getEmailBody() {
    if (!createdInvite) return "";
    return `Hi, ${createdInvite.suggested_name}:

You're invited to set up your AMPLIFY link with Music Declares Emergency.

AMPLIFY gives you a single, evergreen link that directs your fans to vetted climate action organizations based on their location and your tour schedule. It works across all your channels: social bios, stage visuals, posters, and more.

To get started, click the link below and follow the instructions to create your account:

${createdInvite.invite_url}

This link will expire in 7 days. If you have any questions, just reply to this email.

Best,
Music Declares Emergency`;
  }

  function getMailtoLink() {
    if (!createdInvite) return "";
    const subject = encodeURIComponent(getEmailSubject());
    const body = encodeURIComponent(getEmailBody());
    return `mailto:${createdInvite.email}?subject=${subject}&body=${body}`;
  }

  // Show success state with invite details
  if (createdInvite) {
    const expiryDate = new Date(createdInvite.expires_at).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" },
    );

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
            <CardTitle>Invite Created</CardTitle>
            <CardDescription>
              Send this invite to {createdInvite.suggested_name} at{" "}
              {createdInvite.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invite Link */}
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                  {createdInvite.invite_url}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(createdInvite.invite_url, "link")
                  }
                >
                  {copiedField === "link" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Expires {expiryDate}
              </p>
            </div>

            {/* Send via Email */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <a href={getMailtoLink()}>
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    Send via Email
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
                      onClick={() =>
                        copyToClipboard(getEmailSubject(), "subject")
                      }
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

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedInvite(null);
                  setEmail("");
                  setName("");
                }}
              >
                Create Another Invite
              </Button>
              <Link href="/admin/artists">
                <Button variant="ghost">Done</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show form to create invite
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
          <CardTitle>Invite Artist</CardTitle>
          <CardDescription>
            Send an invite link so an artist can set up their own account and
            choose their handle.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Artist Name</Label>
              <Input
                id="name"
                placeholder="e.g., Radiohead"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={sending}
              />
              <p className="text-sm text-muted-foreground">
                This will be suggested to them, but they can change it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="artist@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={sending}>
                {sending ? "Creating..." : "Create Invite"}
              </Button>
              <Link href="/admin/artists">
                <Button type="button" variant="outline" disabled={sending}>
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
