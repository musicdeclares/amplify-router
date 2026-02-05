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
}

export interface Doc {
  slug: string;
  frontmatter: DocFrontmatter;
  content: string;
}

/**
 * Get all available docs (for navigation/listing)
 */
export function getAllDocs(): Omit<Doc, "content">[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const filePath = path.join(CONTENT_DIR, filename);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      return {
        slug,
        frontmatter: data as DocFrontmatter,
      };
    })
    .sort((a, b) => (a.frontmatter.order ?? 99) - (b.frontmatter.order ?? 99));
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
 * Get a single doc by slug
 */
export function getDocBySlug(slug: string): Doc | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    frontmatter: data as DocFrontmatter,
    content,
  };
}

/**
 * Check if a doc exists
 */
export function docExists(slug: string): boolean {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
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
