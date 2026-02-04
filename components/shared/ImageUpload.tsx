"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

interface ImageUploadProps {
  orgId: string;
  currentImageUrl: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ImageUpload({
  orgId,
  currentImageUrl,
  onImageChange,
  disabled,
  placeholder = "No image uploaded",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
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

      const res = await fetch(`/api/org-profiles/${orgId}/image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onImageChange(data.image_url);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    if (!confirm("Remove this image?")) return;

    setRemoving(true);
    try {
      const res = await fetch(`/api/org-profiles/${orgId}/image`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      onImageChange(null);
      toast.success("Image removed");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove image",
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-3">
      {currentImageUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt="Organization"
            className="w-full rounded-lg border object-cover aspect-video"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center aspect-video rounded-lg border border-dashed bg-muted/50">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{placeholder}</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || removing}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : currentImageUrl ? "Replace" : "Upload"}
        </Button>
        {currentImageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || uploading || removing}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {removing ? "Removing..." : "Remove"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        JPG, PNG, or WebP. Max 2MB.
      </p>
    </div>
  );
}
