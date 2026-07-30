import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

const CANONICAL_ORIGIN = "https://nurserypakistan.pk";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fileEnv = loadEnv("production", projectRoot, "");
const env = { ...fileEnv, ...process.env };

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Sitemap generation requires VITE_SUPABASE_URL and either " +
      "VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_ANON_KEY, or " +
      "the server-only SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const usingServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
console.log(
  `Generating sitemap with ${usingServiceRole ? "server-only service role" : "public anon/publishable"} credentials.`,
);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const staticPaths = [
  "/",
  "/about",
  "/blogs",
  "/category/fertilizers-soil",
  "/category/indoor-plants",
  "/category/outdoor-plants",
  "/category/pots-accessories",
  "/flower-workshop",
  "/guide",
  "/landscaping-services",
  "/products",
  "/projects",
  "/workshops",
];

// These routes intentionally serve different search intent:
// /flower-workshop explains the evergreen experience, while /workshops lists
// current bookable workshop dates.

const assertRows = (label, data) => {
  if (!Array.isArray(data)) {
    throw new Error(`Malformed Supabase response for ${label}: expected an array.`);
  }
  return data;
};

const runQuery = async (label, query) => {
  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load ${label} for sitemap: ${error.message}`);
  }
  return assertRows(label, data);
};

const [products, blogs, workshops, projects] = await Promise.all([
  runQuery(
    "visible products",
    supabase
      .from("products")
      .select("id, updated_at, sale_percentage, sale_start_at, sale_end_at")
      .eq("is_visible", true),
  ),
  runQuery(
    "published blogs",
    supabase
      .from("blogs")
      .select("slug, published_at, updated_at")
      .eq("is_published", true),
  ),
  runQuery(
    "active workshops",
    supabase
      .from("workshops")
      .select("slug, updated_at")
      .eq("is_active", true),
  ),
  runQuery(
    "completed projects",
    supabase.from("completed_projects").select("slug, updated_at"),
  ),
]);

const isActiveSale = (product, now = new Date()) => {
  const percentage = Number(product.sale_percentage ?? 0);
  if (!Number.isFinite(percentage) || percentage <= 0) return false;

  if (product.sale_start_at) {
    const start = new Date(product.sale_start_at);
    if (!Number.isNaN(start.getTime()) && start > now) return false;
  }

  if (product.sale_end_at) {
    const end = new Date(product.sale_end_at);
    if (!Number.isNaN(end.getTime()) && end < now) return false;
  }

  return true;
};

const toLastModified = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const safeSegment = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.includes("/") || trimmed === "." || trimmed === "..") return null;
  return encodeURIComponent(trimmed);
};

const entries = staticPaths.map((pathname) => ({ pathname }));

if (products.some((product) => isActiveSale(product))) {
  entries.push({ pathname: "/category/sale" });
}

for (const product of products) {
  const id = safeSegment(product.id);
  if (!id) continue;
  entries.push({
    pathname: `/product/${id}`,
    lastmod: toLastModified(product.updated_at),
  });
}

for (const blog of blogs) {
  const slug = safeSegment(blog.slug);
  if (!slug) continue;
  entries.push({
    pathname: `/blog/${slug}`,
    lastmod: toLastModified(blog.published_at || blog.updated_at),
  });
}

for (const workshop of workshops) {
  const slug = safeSegment(workshop.slug);
  if (!slug) continue;
  entries.push({
    pathname: `/workshop/${slug}`,
    lastmod: toLastModified(workshop.updated_at),
  });
}

for (const project of projects) {
  const slug = safeSegment(project.slug);
  if (!slug) continue;
  entries.push({
    pathname: `/project/${slug}`,
    lastmod: toLastModified(project.updated_at),
  });
}

const deduplicated = new Map();
for (const entry of entries) {
  const url = new URL(entry.pathname, CANONICAL_ORIGIN).href;
  const existing = deduplicated.get(url);
  deduplicated.set(url, {
    url,
    lastmod: entry.lastmod || existing?.lastmod,
  });
}

const sitemapEntries = [...deduplicated.values()].sort((a, b) => {
  if (a.url === `${CANONICAL_ORIGIN}/`) return -1;
  if (b.url === `${CANONICAL_ORIGIN}/`) return 1;
  return a.url.localeCompare(b.url);
});

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const urlNodes = sitemapEntries
  .map(({ url, lastmod }) => {
    const lastmodNode = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";
    return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmodNode}\n  </url>`;
  })
  .join("\n");

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  `${urlNodes}\n` +
  "</urlset>\n";

if (!xml.includes("<urlset") || !xml.includes("<loc>")) {
  throw new Error("Generated sitemap XML is malformed.");
}

const outputPath = path.join(projectRoot, "public", "sitemap.xml");
await writeFile(outputPath, xml, "utf8");

console.log(
  `Sitemap written to ${path.relative(projectRoot, outputPath)} with ${sitemapEntries.length} URLs ` +
    `(${products.length} products, ${blogs.length} blogs, ${workshops.length} workshops, ${projects.length} projects).`,
);
