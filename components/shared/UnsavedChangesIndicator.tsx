"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface UnsavedChangesIndicatorProps {
  hasUnsavedChanges: boolean;
  savedAt: number | null;
}

export function UnsavedChangesIndicator({
  hasUnsavedChanges,
  savedAt,
}: UnsavedChangesIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" briefly after save, then fade out
  useEffect(() => {
    if (!savedAt) return;

    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  if (hasUnsavedChanges) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
        <span className="size-2 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  }

  if (showSaved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-mde-green animate-fade-out">
        <Check className="size-3.5" />
        Saved
      </span>
    );
  }

  return null;
}
