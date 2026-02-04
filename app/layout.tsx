import type { Metadata } from "next";
import { Karla } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const karla = Karla({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-karla",
});

export const metadata: Metadata = {
  title: "AMPLIFY Router",
  description: "Climate action routing for musical artists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={karla.variable}>
      <body className={karla.className}>
        {children}
        <Toaster />
        <Script
          defer
          src="https://mde-umami.vercel.app/script.js"
          data-website-id="7f33de9e-1430-4678-ac78-13d7462c6744"
          data-domains="amplify-router.vercel.app"
        />
      </body>
    </html>
  );
}
