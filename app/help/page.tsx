import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { getAllDocs, DocAudience } from "@/app/lib/content";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Help Center | AMPLIFY",
  description: "Documentation and guides for using AMPLIFY.",
};

const audienceLabels: Record<DocAudience, string> = {
  admin: "Admin",
  staff: "Staff",
  artist: "Artist",
  org: "Organization",
  public: "General",
};

const audienceColors: Record<DocAudience, string> = {
  admin: "bg-mde-red/10 text-mde-red border-mde-red/20",
  staff: "bg-mde-orange/10 text-mde-orange border-mde-orange/20",
  artist: "bg-mde-green/10 text-green-800 border-mde-green/20",
  org: "bg-mde-yellow/10 text-mde-body border-mde-yellow/20",
  public: "bg-muted text-muted-foreground border-muted",
};

export default async function HelpIndexPage() {
  const headerList = await headers();
  const userRole = headerList.get("x-user-role") as
    | "admin"
    | "staff"
    | "artist"
    | null;

  // Filter docs based on user role
  const allDocs = getAllDocs();
  const isStaff = userRole === "admin" || userRole === "staff";
  const docs = allDocs.filter((doc) => {
    const audience = doc.frontmatter.audience;
    // Public docs visible to everyone
    if (audience === "public") return true;
    // Staff (admin and staff) see all docs
    if (isStaff) return true;
    // Artists see artist + public docs
    if (userRole === "artist" && audience === "artist") return true;
    // Unauthenticated users only see public docs
    return false;
  });

  // Check if all docs have the same audience (to customize title and hide badges)
  const audiences = new Set(docs.map((doc) => doc.frontmatter.audience));
  const singleAudience = audiences.size === 1 ? [...audiences][0] : null;
  const showBadges = !singleAudience;
  const pageTitle = singleAudience
    ? `${audienceLabels[singleAudience]} Help Center`
    : "Help Center";

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <Image
            src="/logo.png"
            alt="AMPLIFY"
            width={500}
            height={396}
            className="w-16 h-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {pageTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Guides and documentation for using AMPLIFY
          </p>
        </header>

        {/* Documentation list */}
        {docs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Documentation coming soon.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {docs.map((doc) => (
              <Link key={doc.slug} href={`/help/${doc.slug}`}>
                <Card className="h-full hover:border-foreground/20 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">
                        {doc.frontmatter.title}
                      </CardTitle>
                      {showBadges && (
                        <Badge
                          variant="outline"
                          className={audienceColors[doc.frontmatter.audience]}
                        >
                          {audienceLabels[doc.frontmatter.audience]}
                        </Badge>
                      )}
                    </div>
                    {doc.frontmatter.description && (
                      <CardDescription>
                        {doc.frontmatter.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Part of the{" "}
            <a
              href="https://www.musicdeclares.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Music Declares Emergency
            </a>{" "}
            initiative
          </p>
        </footer>
      </div>
    </main>
  );
}
