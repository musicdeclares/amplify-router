"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PauseOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
  initialReason?: string;
  onPause?: (orgId: string, reason: string | null) => Promise<void>;
  onSuccess?: () => void;
  isPausing?: boolean;
}

export function PauseOrgDialog({
  open,
  onOpenChange,
  orgId,
  orgName,
  initialReason = "",
  onPause,
  onSuccess,
  isPausing: externalIsPausing,
}: PauseOrgDialogProps) {
  const [reason, setReason] = useState(initialReason);
  const [internalPausing, setInternalPausing] = useState(false);

  const isPausing = externalIsPausing ?? internalPausing;

  // Reset reason when dialog opens with new initial value
  useEffect(() => {
    if (open) {
      setReason(initialReason);
    }
  }, [open, initialReason]);

  async function handlePause() {
    if (onPause) {
      // Use custom pause handler
      await onPause(orgId, reason || null);
      return;
    }

    // Default behavior using org-profiles API
    setInternalPausing(true);
    try {
      const res = await fetch(`/api/org-profiles/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false, reason: reason || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to pause");
      }

      toast.success("Organization paused from routing");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error pausing org:", error);
      toast.error("Failed to pause organization");
    } finally {
      setInternalPausing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause Organization</DialogTitle>
          <DialogDescription>
            Pausing will prevent the router from directing fans to {orgName}.
            They will see a fallback page instead.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pauseReason">Reason (optional)</Label>
            <Input
              id="pauseReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Capacity exceeded, Partnership on hold"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handlePause}
            disabled={isPausing}
          >
            {isPausing ? "Pausing..." : "Pause"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
