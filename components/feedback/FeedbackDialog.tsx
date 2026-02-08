"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ScreenshotUpload } from "./ScreenshotUpload";
import { Bug, Lightbulb, HelpCircle, Heart } from "lucide-react";

const CATEGORIES = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "question", label: "Question", icon: HelpCircle },
  { value: "praise", label: "Praise", icon: Heart },
] as const;

// Map path segments to friendly names
const PAGE_NAMES: Record<string, string> = {
  artists: "Artists",
  tours: "Tours",
  organizations: "Organizations",
  settings: "Settings",
  diagnostics: "Diagnostics",
  invite: "Invite Artist",
};

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  const isUUID = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  // Check if path ends with a UUID (indicates detail/edit page)
  const isDetailPage =
    segments.length > 0 && isUUID(segments[segments.length - 1]);

  // Filter out UUID-like segments
  const filtered = segments.filter((segment) => !isUUID(segment));

  // If only admin or artist root, it's the dashboard
  if (
    filtered.length === 1 &&
    (filtered[0] === "admin" || filtered[0] === "artist")
  ) {
    return "Dashboard";
  }

  // Get page segments (skip admin/artist prefix)
  const pageSegments = filtered.filter((s) => s !== "admin" && s !== "artist");

  if (pageSegments.length === 0) {
    return "Dashboard";
  }

  const lastSegment = pageSegments[pageSegments.length - 1];
  const secondLastSegment =
    pageSegments.length >= 2 ? pageSegments[pageSegments.length - 2] : null;

  // Special case: "Add [Thing]" for new pages
  if (lastSegment === "new" && secondLastSegment) {
    const parentName =
      PAGE_NAMES[secondLastSegment] ||
      secondLastSegment.charAt(0).toUpperCase() + secondLastSegment.slice(1);
    return `Add ${parentName.replace(/s$/, "")}`;
  }

  // Special case: org profile page (/admin/organizations/org/[uuid])
  // After UUID filtering, segments are ["organizations", "org"]
  if (lastSegment === "org" && secondLastSegment === "organizations") {
    return "Organization Profile";
  }

  // Special case: country-level org page (/admin/organizations/[countryCode])
  // Country codes are 2 uppercase letters
  if (
    secondLastSegment === "organizations" &&
    /^[A-Z]{2}$/i.test(lastSegment)
  ) {
    return `${lastSegment.toUpperCase()} Organizations`;
  }

  // Get friendly name for the last segment
  let pageName =
    PAGE_NAMES[lastSegment] ||
    lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

  // Singularize if this is a detail page (e.g., /tours/[uuid] → "Tour")
  if (isDetailPage && pageName.endsWith("s")) {
    pageName = pageName.replace(/s$/, "");
  }

  return pageName;
}

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const pathname = usePathname();
  const [pageContext, setPageContext] = useState("");
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Set initial page context when dialog opens
  useEffect(() => {
    if (open) {
      setPageContext(getPageTitle(pathname));
    }
  }, [open, pathname]);

  function resetForm() {
    setCategory("");
    setMessage("");
    setScreenshotUrl(null);
    setError("");
    // Don't reset pageContext - it will be set fresh when dialog opens
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!message.trim() || message.trim().length < 10) {
      setError("Please provide at least 10 characters of feedback.");
      return;
    }

    setSubmitting(true);

    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_url: window.location.href,
          page_path: pathname,
          page_context: pageContext.trim() || null,
          category: category || null,
          message: message.trim(),
          screenshot_url: screenshotUrl,
          browser_info: browserInfo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Feedback sent! Thanks for helping us improve.");
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Thanks for being a pilot tester! Your feedback shapes the future of
            AMPLIFY.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pageContext">Page</Label>
            <Input
              id="pageContext"
              value={pageContext}
              onChange={(e) => setPageContext(e.target.value)}
              disabled={submitting}
              placeholder="Which page or feature is this about?"
            />
            <p className="text-xs text-muted-foreground">
              Edit if your feedback is about something specific
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Your feedback <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Tell us what's on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitting}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Screenshot</Label>
            <ScreenshotUpload
              screenshotUrl={screenshotUrl}
              onScreenshotChange={setScreenshotUrl}
              disabled={submitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
