import { createClient } from "@supabase/supabase-js";

const ORIGIN = "https://nurserypakistan.pk";
const STATIC_PATHS = [
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

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const slugify = (name) => {
  const slug = String(name || "product")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || "product";
};

const lastmod = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const isSaleActive = (product, now = new Date()) => {
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

// Keep this plain-JavaScript predicate in sync with
// isSaleListingProduct() in src/lib/productSale.ts.
const isSaleListingProduct = (product, now = new Date()) =>
  product.category?.toLowerCase() === "sale" || isSaleActive(product, now);

export default async function handler(_request, response) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).send("Sitemap is not configured.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const results = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, updated_at, sale_percentage, sale_start_at, sale_end_at")
      .eq("is_visible", true),
    supabase
      .from("blogs")
      .select("slug, published_at, updated_at")
      .eq("is_published", true),
    supabase.from("workshops").select("slug, updated_at").eq("is_active", true),
    supabase.from("completed_projects").select("slug, updated_at"),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return response.status(503).send("Sitemap data is temporarily unavailable.");
  }

  const [products = [], blogs = [], workshops = [], projects = []] =
    results.map((result) => result.data || []);
  const entries = STATIC_PATHS.map((pathname) => ({ pathname }));
  if (products.some((product) => isSaleListingProduct(product))) {
    entries.push({ pathname: "/category/sale" });
  }
  products.forEach((product) =>
    entries.push({
      pathname: `/product/${slugify(product.name)}--${product.id}`,
      modified: lastmod(product.updated_at),
    }),
  );
  blogs.forEach((blog) =>
    entries.push({
      pathname: `/blog/${encodeURIComponent(blog.slug)}`,
      modified: lastmod(blog.published_at || blog.updated_at),
    }),
  );
  workshops.forEach((workshop) =>
    entries.push({
      pathname: `/workshop/${encodeURIComponent(workshop.slug)}`,
      modified: lastmod(workshop.updated_at),
    }),
  );
  projects.forEach((project) =>
    entries.push({
      pathname: `/project/${encodeURIComponent(project.slug)}`,
      modified: lastmod(project.updated_at),
    }),
  );

  const unique = new Map(
    entries.map((entry) => [new URL(entry.pathname, ORIGIN).href, entry]),
  );
  const nodes = [...unique.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([url, entry]) =>
        `  <url>\n    <loc>${escapeXml(url)}</loc>${
          entry.modified ? `\n    <lastmod>${escapeXml(entry.modified)}</lastmod>` : ""
        }\n  </url>`,
    )
    .join("\n");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${nodes}\n</urlset>\n`;

  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return response.status(200).send(xml);
}
