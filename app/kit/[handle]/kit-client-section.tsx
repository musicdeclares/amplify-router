"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QrCodeDialog } from "@/components/shared/QrCodeDialog";
import { EVENTS } from "@/app/lib/analytics-events";

function getSampleCaptions(artistName: string, url: string) {
  return [
    {
      label: "Tour announcement",
      text: `Join me in taking climate action! I'm partnering with @musicdeclares to direct fans to local grassroots climate organizations. Tap the link to find yours: ${url} #AMPLIFY #NoMusicOnADeadPlanet`,
    },
    {
      label: "General post",
      text: `Want to take climate action? I've teamed up with @musicdeclares to make it easy. This link connects you with vetted climate orgs in your area: ${url} #AMPLIFY`,
    },
    {
      label: "Short (stories/bio)",
      text: `Climate action, wherever you are: ${url}`,
    },
  ];
}

interface KitClientSectionProps {
  amplifyUrl: string;
  artistHandle: string;
  artistName: string;
}

export function KitClientSection({
  amplifyUrl,
  artistHandle,
  artistName,
}: KitClientSectionProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [printQrEl, setPrintQrEl] = useState<HTMLDivElement | null>(null);

  const captions = getSampleCaptions(artistName, amplifyUrl);

  const printQrRef = useCallback((node: HTMLDivElement | null) => {
    setPrintQrEl(node);
  }, []);

  // Render a static QR code for print (hidden on screen)
  useEffect(() => {
    if (!printQrEl) return;

    let cancelled = false;

    import("qr-code-styling").then((mod) => {
      if (cancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCodeStyling = (mod as any).default ?? mod;

      printQrEl.innerHTML = "";

      const qr = new QRCodeStyling({
        type: "canvas",
        width: 600,
        height: 600,
        data: amplifyUrl,
        image: "/logo.png",
        qrOptions: { errorCorrectionLevel: "H" as const },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.35,
          margin: 8,
          crossOrigin: "anonymous",
        },
        dotsOptions: { type: "rounded" as const, color: "#000000" },
        cornersSquareOptions: {
          type: "extra-rounded" as const,
          color: "#000000",
        },
        cornersDotOptions: { type: "dot" as const, color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
      });

      qr.append(printQrEl);
    });

    return () => {
      cancelled = true;
    };
  }, [printQrEl, amplifyUrl]);

  function handleCopy() {
    navigator.clipboard.writeText(amplifyUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyCaption(index: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCaption(index);
    toast.success("Caption copied");
    setTimeout(() => setCopiedCaption(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Link display */}
      <div className="flex items-center gap-2 bg-muted rounded-lg p-4 print:p-2">
        <code className="flex-1 text-sm sm:text-base font-mono break-all print:text-xs">
          {amplifyUrl}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 print:hidden"
          data-umami-event={EVENTS.KIT_COPY_LINK}
          data-umami-event-artist={artistHandle}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">
            {copied ? "Copied" : "Copy"}
          </span>
        </Button>
      </div>

      {/* QR code button (screen only) */}
      <Button
        variant="outline"
        className="w-full print:hidden"
        onClick={() => setQrOpen(true)}
        data-umami-event={EVENTS.KIT_OPEN_QR_DIALOG}
        data-umami-event-artist={artistHandle}
      >
        <QrCode className="h-4 w-4 mr-2" />
        Download QR Code
      </Button>

      {/* Static QR code (print only) — rendered at 600px, displayed at 200px for sharp print */}
      <div className="hidden print:flex print:justify-center print:py-2 [&_canvas]:w-50 [&_canvas]:h-50">
        <div ref={printQrRef} />
      </div>

      <QrCodeDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        artistHandle={artistHandle}
        artistName={artistName}
      />

      {/* Sample captions */}
      <div className="space-y-3 pt-6 print:hidden">
        <h2 className="text-xl font-semibold">Sample captions</h2>
        <p className="text-sm text-muted-foreground">
          Ready-to-use text for social media posts. Copy and customize as
          needed.
        </p>
        <div className="space-y-3">
          {captions.map((caption, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {caption.label}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyCaption(index, caption.text)}
                  className="shrink-0"
                  data-umami-event={EVENTS.KIT_COPY_CAPTION}
                  data-umami-event-artist={artistHandle}
                  data-umami-event-caption={caption.label}
                >
                  {copiedCaption === index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {copiedCaption === index ? "Copied" : "Copy"}
                  </span>
                </Button>
              </div>
              <p className="text-sm leading-relaxed">{caption.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
