"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sun, Moon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EVENTS } from "@/app/lib/analytics-events";

const LOGO_PATH = "/logo.png";

interface QrCodeDialogProps {
  artistHandle: string;
  artistName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function qrOptions(
  url: string,
  dotColor: string,
  bgColor: string,
  size: number,
  type: "canvas" | "svg",
) {
  return {
    type,
    width: size,
    height: size,
    data: url,
    image: LOGO_PATH,
    qrOptions: {
      errorCorrectionLevel: "H" as const,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.35,
      margin: 8,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      type: "rounded" as const,
      color: dotColor,
    },
    cornersSquareOptions: {
      type: "extra-rounded" as const,
      color: dotColor,
    },
    cornersDotOptions: {
      type: "dot" as const,
      color: dotColor,
    },
    backgroundOptions: {
      color: bgColor,
    },
  };
}

export function QrCodeDialog({
  artistHandle,
  artistName,
  open,
  onOpenChange,
}: QrCodeDialogProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [solidBg, setSolidBg] = useState(false);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const qrRef = useRef<{
    update: (opts: Record<string, unknown>) => void;
  } | null>(null);

  const dotColor = darkMode ? "#ffffff" : "#000000";
  const bgColor = solidBg ? (darkMode ? "#000000" : "#ffffff") : "transparent";
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/a/${artistHandle}`
      : "";

  // Callback ref: fires when the container div mounts/unmounts in the DOM
  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);

  // Generate QR code once the container is in the DOM
  useEffect(() => {
    if (!containerEl || !url) return;

    let cancelled = false;

    import("qr-code-styling").then((mod) => {
      if (cancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCodeStyling = (mod as any).default ?? mod;

      containerEl.innerHTML = "";

      const qr = new QRCodeStyling(
        qrOptions(url, dotColor, bgColor, 400, "canvas"),
      );
      qr.append(containerEl);
      qrRef.current = qr;
    });

    return () => {
      cancelled = true;
      qrRef.current = null;
    };
  }, [containerEl, url]);

  // Update QR code when colors change (without recreating)
  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.update(qrOptions(url, dotColor, bgColor, 400, "canvas"));
  }, [dotColor, bgColor, url]);

  const downloadFile = useCallback(
    async (extension: "svg" | "png") => {
      if (!url) return;

      const mod = await import("qr-code-styling");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCodeStyling = (mod as any).default ?? mod;

      const size = extension === "png" ? 1024 : 400;

      const qr = new QRCodeStyling(
        qrOptions(
          url,
          dotColor,
          bgColor,
          size,
          extension === "png" ? "canvas" : "svg",
        ),
      );

      const variant = darkMode
        ? solidBg ? "light-on-dark-bg" : "light-on-transparent"
        : solidBg ? "dark-on-light-bg" : "dark-on-transparent";

      await qr.download({
        name: `amplify-${artistHandle}-qr-${variant}`,
        extension,
      });
    },
    [url, dotColor, bgColor, artistHandle],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate QR Code</DialogTitle>
          <DialogDescription>
            {artistName}&apos;s AMPLIFY link
          </DialogDescription>
        </DialogHeader>

        {/* QR Preview */}
        <div className="flex justify-center">
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
                linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
                linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
              `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          >
            <div ref={containerRefCallback} className="w-100 h-100" />
          </div>
        </div>

        {/* URL display */}
        <p className="text-sm text-muted-foreground text-center truncate">
          {url}
        </p>

        {/* Controls */}
        <div className="space-y-4">
          {/* Light/Dark mode toggle */}
          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={!darkMode ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setDarkMode(false)}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={darkMode ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setDarkMode(true)}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>

          {/* Solid background checkbox */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="solid-bg"
              checked={solidBg}
              onCheckedChange={(checked) => setSolidBg(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="solid-bg" className="cursor-pointer">
                Add solid background
              </Label>
              {!solidBg && (
                <p className="text-xs text-muted-foreground">
                  Place on a contrasting surface for reliable scanning.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => downloadFile("svg")}
            data-umami-event={EVENTS.KIT_DOWNLOAD_QR}
            data-umami-event-artist={artistHandle}
            data-umami-event-format="svg"
            data-umami-event-mode={darkMode ? "dark" : "light"}
            data-umami-event-background={solidBg ? "solid" : "transparent"}
          >
            <Download className="h-4 w-4 mr-2" />
            Download SVG
          </Button>
          <Button
            onClick={() => downloadFile("png")}
            data-umami-event={EVENTS.KIT_DOWNLOAD_QR}
            data-umami-event-artist={artistHandle}
            data-umami-event-format="png"
            data-umami-event-mode={darkMode ? "dark" : "light"}
            data-umami-event-background={solidBg ? "solid" : "transparent"}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
