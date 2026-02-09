import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import {
  getDocBySlug,
  getAllDocs,
  extractHeadings,
  getRelatedDocs,
} from "@/app/lib/content";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({ slug: doc.slug.split("/") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocBySlug(slug.join("/"));

  if (!doc) {
    return { title: "Not Found" };
  }

  return {
    title: `${doc.frontmatter.title} | AMPLIFY Help`,
    description: doc.frontmatter.description,
  };
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const doc = getDocBySlug(slugPath);

  if (!doc) {
    notFound();
  }

  // Check access based on user role
  const headerList = await headers();
  const userRole = headerList.get("x-user-role") as "admin" | "artist" | null;
  const audience = doc.frontmatter.audience;

  // Check if user can access this doc
  const canAccess =
    audience === "public" ||
    userRole === "admin" ||
    (userRole === "artist" && audience === "artist");

  if (!canAccess) {
    notFound();
  }

  // Check how many docs are visible to this user (for showing back link)
  const allDocs = getAllDocs();
  const visibleDocsCount = allDocs.filter((d) => {
    const docAudience = d.frontmatter.audience;
    return (
      docAudience === "public" ||
      userRole === "admin" ||
      (userRole === "artist" && docAudience === "artist")
    );
  }).length;

  const headings = extractHeadings(doc.content);
  const relatedDocs = getRelatedDocs(doc);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-6">
          <Link href="/help" className="inline-flex items-center gap-2">
            <Image
              src="/logo.png"
              alt=""
              width={500}
              height={396}
              className="w-8 h-auto"
            />
            <span className="font-semibold text-lg">AMPLIFY Help</span>
          </Link>
        </header>

        {/* Breadcrumb - only show if there are multiple docs visible */}
        {visibleDocsCount > 1 && (
          <nav className="mb-8">
            <Link
              href="/help"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; All guides
            </Link>
          </nav>
        )}

        <div className="grid gap-12 lg:grid-cols-[1fr_200px]">
          {/* Main content */}
          <article>
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {doc.frontmatter.title}
              </h1>
              {doc.frontmatter.description && (
                <p className="text-lg text-muted-foreground">
                  {doc.frontmatter.description}
                </p>
              )}
            </header>

            <MarkdownRenderer content={doc.content} />

            {/* Related articles */}
            {relatedDocs.length > 0 && (
              <aside className="mt-12 pt-8 border-t">
                <h2 className="text-sm font-semibold mb-4">Related articles</h2>
                <ul className="space-y-2">
                  {relatedDocs.map((related) => (
                    <li key={related.slug}>
                      <Link
                        href={`/help/${related.slug}`}
                        className="text-sm text-muted-foreground hover:text-foreground underline"
                      >
                        {related.frontmatter.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </article>

          {/* Sidebar table of contents */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <nav className="sticky top-8">
                <h2 className="text-sm font-semibold mb-3">On this page</h2>
                <ul className="space-y-2 text-sm">
                  {headings.map((heading) => (
                    <li
                      key={heading.id}
                      className={heading.level === 3 ? "pl-3" : ""}
                    >
                      <a
                        href={`#${heading.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>

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
