"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Tracks whether form values have changed from their initial state.
 * Registers a beforeunload handler to warn when navigating away with unsaved changes.
 */
export function useUnsavedChanges(
  initialValues: Record<string, unknown>,
  currentValues: Record<string, unknown>,
) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // Track the "saved" baseline - starts as initialValues, updates on save
  const savedBaseline = useRef<Record<string, unknown> | null>(null);

  const hasUnsavedChanges = Object.keys(currentValues).some((key) => {
    // Compare against saved baseline if we've saved, otherwise against initial values
    const baseline = savedBaseline.current ?? initialValues;
    const initial = baseline[key];
    const current = currentValues[key];

    // Deep compare arrays
    if (Array.isArray(initial) && Array.isArray(current)) {
      return JSON.stringify(initial) !== JSON.stringify(current);
    }

    return initial !== current;
  });

  // Navigation warnings when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Browser navigation (tab close, refresh, external URL)
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    // Client-side navigation (Next.js <Link> clicks)
    // Capture phase fires before React/Next.js event delegation,
    // so stopPropagation prevents the router from processing the click.
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip links that don't trigger client-side navigation
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (href.startsWith("#")) return;
      if (/^https?:\/\/|^mailto:/i.test(href)) return;

      // Internal link — confirm before allowing
      if (!window.confirm("You have unsaved changes. Leave this page?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("click", handleClick, true);
    };
  }, [hasUnsavedChanges]);

  const markSaved = useCallback(() => {
    savedBaseline.current = { ...currentValues };
    setSavedAt(Date.now());
  }, [currentValues]);

  return { hasUnsavedChanges, savedAt, markSaved };
}
