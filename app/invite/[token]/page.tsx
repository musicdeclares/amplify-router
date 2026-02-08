"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function handleify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

interface InviteData {
  email: string;
  suggested_name: string;
  role: string;
}

interface ErrorState {
  message: string;
  code: string;
}

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [pageError, setPageError] = useState<ErrorState | null>(null);
  const [formError, setFormError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/invites/accept?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setPageError({ message: data.error, code: data.code });
          setLoading(false);
          return;
        }

        setInvite(data.invite);
        setName(data.invite.suggested_name);
        setHandle(handleify(data.invite.suggested_name));
      } catch (error) {
        console.error("Error validating invite:", error);
        setPageError({
          message: "An unexpected error occurred. Please try again.",
          code: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  function handleNameChange(value: string) {
    setName(value);
    if (!handleEdited) {
      setHandle(handleify(value));
    }
  }

  function handleHandleChange(value: string) {
    setHandleEdited(true);
    setHandle(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }

    if (!handle.trim()) {
      setFormError("Handle is required");
      return;
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)) {
      setFormError(
        'Handle must be lowercase letters, numbers, and hyphens only (e.g., "artist-name")',
      );
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          handle,
          name: name.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "handle_taken") {
          setFormError(data.error);
        } else {
          setFormError(data.error || "Failed to create account");
        }
        setSubmitting(false);
        return;
      }

      // Redirect to artist dashboard
      router.push(data.redirect || `/artist/${data.artist_id}`);
      router.refresh();
    } catch (error) {
      console.error("Error accepting invite:", error);
      setFormError("An unexpected error occurred");
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Validating invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center text-2xl font-bold">
              <Image
                src="/logo.png"
                alt="AMPLIFY"
                width={500}
                height={396}
                className="w-10 h-auto"
              />
              <span>AMPLIFY Router</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{pageError.message}</p>
            {pageError.code === "already_accepted" && (
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link
              href="https://www.musicdeclares.net/"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Visit musicdeclares.net
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center text-2xl font-bold">
            <Image
              src="/logo.png"
              alt="AMPLIFY"
              width={500}
              height={396}
              className="w-10 h-auto"
            />
            <span>AMPLIFY Router</span>
          </CardTitle>
          <CardDescription>
            Complete your account setup to get your AMPLIFY link
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={invite.email} disabled />
              <p className="text-xs text-muted-foreground">
                This is the email address your invite was sent to
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Artist Name</Label>
              <Input
                id="name"
                placeholder="e.g., Radiohead"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-mono">
                  /a/
                </span>
                <Input
                  id="handle"
                  placeholder="radiohead"
                  value={handle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  disabled={submitting}
                  className="font-mono rounded-l-none"
                />
              </div>
              {handle && (
                <p className="text-xs text-muted-foreground">
                  Your link: {siteUrl}/a/{handle}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Create Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
