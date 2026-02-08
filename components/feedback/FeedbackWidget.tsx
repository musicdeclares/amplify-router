"use client";

import { useState } from "react";
import { FeedbackButton } from "./FeedbackButton";
import { FeedbackDialog } from "./FeedbackDialog";

interface FeedbackWidgetProps {
  artistId?: string;
}

export function FeedbackWidget({ artistId }: FeedbackWidgetProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <FeedbackButton onClick={() => setDialogOpen(true)} />
      <FeedbackDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
