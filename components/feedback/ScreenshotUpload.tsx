"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

interface ScreenshotUploadProps {
  screenshotUrl: string | null;
  onScreenshotChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ScreenshotUpload({
  screenshotUrl,
  onScreenshotChange,
  disabled,
}: ScreenshotUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Use JPG, PNG, or WebP.");
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 2MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/feedback/screenshot", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onScreenshotChange(data.screenshot_url);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload screenshot"
      );
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove() {
    onScreenshotChange(null);
  }

  return (
    <div className="space-y-2">
      {screenshotUrl ? (
        <div className="relative inline-block">
          <img
            src={screenshotUrl}
            alt="Screenshot"
            className="max-h-32 rounded border object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Add screenshot
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
      )}
    </div>
  );
}
