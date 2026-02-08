"use client";

import { useState, use, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, HelpCircle, ExternalLink, QrCode } from "lucide-react";

export default function ArtistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [artistHandle, setArtistHandle] = useState<string | null>(null);

  // Fetch artist handle for starter kit link
  useEffect(() => {
    async function fetchArtist() {
      try {
        const res = await fetch(`/api/artists/${artistId}`);
        if (res.ok) {
          const data = await res.json();
          setArtistHandle(data.artist.handle);
        }
      } catch (error) {
        console.error("Error fetching artist:", error);
      }
    }
    fetchArtist();
  }, [artistId]);

  const navigation = [
    { name: "Dashboard", href: `/artist/${artistId}` },
    { name: "Tours", href: `/artist/${artistId}/tours` },
    { name: "Diagnostics", href: `/artist/${artistId}/diagnostics` },
    { name: "Settings", href: `/artist/${artistId}/settings` },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-background border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href={`/artist/${artistId}`}
                className="shrink-0 flex items-center gap-2 text-xl font-bold"
              >
                <Image
                  src="/logo.png"
                  alt="AMPLIFY"
                  width={500}
                  height={396}
                  className="w-10 h-auto"
                />
                <span>AMPLIFY</span>
              </Link>
              {/* Desktop navigation */}
              <div className="hidden sm:ml-8 sm:flex">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== `/artist/${artistId}` &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {artistHandle && (
                <Link
                  href={`/kit/${artistHandle}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  title="Starter Kit"
                >
                  <QrCode className="h-5 w-5" />
                </Link>
              )}
              <Link
                href="/help"
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
                title="Help"
              >
                <HelpCircle className="h-5 w-5" />
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:inline-flex"
              >
                Sign out
              </Button>
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/artist/${artistId}` &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              {artistHandle && (
                <Link
                  href={`/kit/${artistHandle}`}
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1 px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Starter Kit
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <Link
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Help
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
