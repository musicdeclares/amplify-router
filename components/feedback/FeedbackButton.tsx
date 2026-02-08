"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const PULSE_SHOWN_KEY = "feedback-pulse-shown";

interface FeedbackButtonProps {
  onClick: () => void;
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Show pulse animation on first visit
    const hasSeenPulse = localStorage.getItem(PULSE_SHOWN_KEY);
    if (!hasSeenPulse) {
      setShowPulse(true);
      // Mark as seen after a short delay
      const timer = setTimeout(() => {
        localStorage.setItem(PULSE_SHOWN_KEY, "true");
        setShowPulse(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90",
        showPulse && "animate-pulse"
      )}
      aria-label="Send feedback"
    >
      <MessageSquarePlus className="h-5 w-5" />
    </Button>
  );
}
