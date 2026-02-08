import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content/help");

export type DocAudience = "admin" | "artist" | "org" | "public";

export interface DocFrontmatter {
  title: string;
  description?: string;
  audience: DocAudience;
  order?: number; // For sorting in navigation
  related?: string[]; // Slugs of related docs for cross-linking
}

export interface Doc {
  slug: string;
  frontmatter: DocFrontmatter;
  content: string;
}

/**
 * Recursively get all markdown files from a directory
 */
function getMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath, baseDir));
    } else if (entry.name.endsWith(".md")) {
      // Create slug from relative path (e.g., "admin/getting-started")
      const relativePath = path.relative(baseDir, fullPath);
      const slug = relativePath.replace(/\.md$/, "").replace(/\\/g, "/");
      files.push(slug);
    }
  }

  return files;
}

/**
 * Get all available docs (for navigation/listing)
 */
export function getAllDocs(): Omit<Doc, "content">[] {
  const slugs = getMarkdownFiles(CONTENT_DIR);

  return slugs
    .map((slug) => {
      const filePath = path.join(CONTENT_DIR, `${slug}.md`);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      return {
        slug,
        frontmatter: data as DocFrontmatter,
      };
    })
    .sort((a, b) => {
      // Sort by audience first (admin before artist), then by order
      const audienceOrder: Record<DocAudience, number> = {
        admin: 1,
        artist: 2,
        org: 3,
        public: 4,
      };
      const audienceDiff =
        audienceOrder[a.frontmatter.audience] -
        audienceOrder[b.frontmatter.audience];
      if (audienceDiff !== 0) return audienceDiff;
      return (a.frontmatter.order ?? 99) - (b.frontmatter.order ?? 99);
    });
}

/**
 * Get docs filtered by audience
 */
export function getDocsByAudience(
  audience: DocAudience
): Omit<Doc, "content">[] {
  return getAllDocs().filter(
    (doc) =>
      doc.frontmatter.audience === audience ||
      doc.frontmatter.audience === "public"
  );
}

/**
 * Get a single doc by slug (supports nested paths like "admin/getting-started")
 */
export function getDocBySlug(slug: string): Doc | null {
  // Normalize slug (handle both array from catch-all and string)
  const normalizedSlug = Array.isArray(slug) ? slug.join("/") : slug;
  const filePath = path.join(CONTENT_DIR, `${normalizedSlug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug: normalizedSlug,
    frontmatter: data as DocFrontmatter,
    content,
  };
}

/**
 * Check if a doc exists (supports nested paths)
 */
export function docExists(slug: string): boolean {
  const normalizedSlug = Array.isArray(slug) ? slug.join("/") : slug;
  const filePath = path.join(CONTENT_DIR, `${normalizedSlug}.md`);
  return fs.existsSync(filePath);
}

export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

/**
 * Extract headings from markdown content for table of contents
 */
export function extractHeadings(content: string): TocHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Generate a slug/id from heading text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Get related docs for a given doc (based on frontmatter.related)
 */
export function getRelatedDocs(doc: Doc): Omit<Doc, "content">[] {
  const relatedSlugs = doc.frontmatter.related ?? [];
  if (relatedSlugs.length === 0) return [];

  return relatedSlugs
    .map((slug) => {
      const relatedDoc = getDocBySlug(slug);
      if (!relatedDoc) return null;
      return {
        slug: relatedDoc.slug,
        frontmatter: relatedDoc.frontmatter,
      };
    })
    .filter((d): d is Omit<Doc, "content"> => d !== null);
}
