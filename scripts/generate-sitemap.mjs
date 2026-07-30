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

const staticSeo = {
  "/": [
    "Buy Plants Online in Pakistan | The Nursery Pakistan",
    "Shop indoor and outdoor plants, pots, fertilizers and garden accessories online from The Nursery Pakistan, with practical plant-care guidance.",
    "Buy plants and garden supplies online in Pakistan",
  ],
  "/about": [
    "About The Nursery Pakistan | Plants & Garden Care",
    "Learn about The Nursery Pakistan, our passion for quality plants, reliable gardening supplies and practical support for plant lovers.",
    "About The Nursery Pakistan",
  ],
  "/blogs": [
    "Plant Care Blog Pakistan | The Nursery Pakistan",
    "Read practical plant-care advice, seasonal gardening tips and workshop updates created for plant lovers in Pakistan.",
    "Plant care advice for Pakistan",
  ],
  "/flower-workshop": [
    "Hands-On Flower Arrangement Workshop | The Nursery Pakistan",
    "Learn flower arrangement, bouquet styling and bloom-care techniques through The Nursery Pakistan's hands-on workshop experience.",
    "Hands-on flower arrangement workshop",
  ],
  "/guide": [
    "Plant Care Guide for Pakistan | The Nursery Pakistan",
    "Use our practical Pakistan plant-care guide for watering, feeding, common plant problems and care tips for popular indoor plants.",
    "Plant care guide for Pakistan",
  ],
  "/landscaping-services": [
    "Landscaping Services in Kasur | The Nursery Pakistan",
    "Explore residential and commercial landscaping services in Kasur, including garden planning, planting and completed project inspiration.",
    "Landscaping services in Kasur",
  ],
  "/products": [
    "Buy Plants, Pots & Garden Supplies Online in Pakistan",
    "Browse plants, pots, fertilizers, soil and garden accessories available online from The Nursery Pakistan.",
    "Plants and garden supplies",
  ],
  "/projects": [
    "Completed Landscaping Projects | The Nursery Pakistan",
    "Explore completed garden and landscaping projects by The Nursery Pakistan for ideas, design inspiration and proof of our work.",
    "Completed landscaping projects",
  ],
  "/workshops": [
    "Current & Upcoming Flower Workshops | The Nursery Pakistan",
    "View current and upcoming hands-on flower workshops, available dates and booking information from The Nursery Pakistan.",
    "Current and upcoming flower workshops",
  ],
  "/category/indoor-plants": [
    "Indoor Plants Online in Pakistan | The Nursery Pakistan",
    "Shop indoor plants for Pakistani homes, including easy-care and air-purifying varieties with practical care guidance.",
    "Indoor plants",
  ],
  "/category/outdoor-plants": [
    "Outdoor Plants Online in Pakistan | The Nursery Pakistan",
    "Explore outdoor plants suited to Pakistan's climate for gardens, balconies and attractive green spaces.",
    "Outdoor plants",
  ],
  "/category/pots-accessories": [
    "Pots & Accessories Online in Pakistan | The Nursery Pakistan",
    "Shop plant pots, planters and useful garden accessories for indoor and outdoor planting.",
    "Pots and garden accessories",
  ],
  "/category/fertilizers-soil": [
    "Fertilizers & Soil Online in Pakistan | The Nursery Pakistan",
    "Find fertilizers, soil mixes and plant nutrition products for healthier plant growth in Pakistani conditions.",
    "Fertilizers and soil",
  ],
  "/category/sale": [
    "Sale Online in Pakistan | The Nursery Pakistan",
    "Browse current offers on visible plants and garden supplies from The Nursery Pakistan.",
    "Plants and garden supplies on sale",
  ],
};

const staticStructuredData = {
  "/guide": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ["How often should indoor plants be watered in Pakistan?", "Check the soil instead of following a fixed calendar. Water when the top layer feels dry, and reduce watering during cooler months or when the soil stays wet longer."],
      ["How can I protect plants during Pakistan's summer?", "Keep sensitive plants away from harsh afternoon sun, water deeply when the soil needs it, improve airflow, and use mulch for outdoor pots to slow moisture loss."],
      ["Why do plant leaves turn yellow?", "Common causes include overwatering, poor drainage, low light, root stress, and nutrient problems. Check soil moisture and drainage before adding fertilizer."],
      ["Which indoor plants are easiest for beginners?", "Snake plant, money plant, aloe vera, and several pothos varieties are popular beginner choices when they receive suitable light and are not overwatered."],
    ].map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  },
  "/landscaping-services": [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Landscaping Services",
      serviceType: "Garden landscaping and planting",
      areaServed: { "@type": "City", name: "Kasur" },
      provider: { "@id": `${CANONICAL_ORIGIN}/#organization` },
      url: `${CANONICAL_ORIGIN}/landscaping-services`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        ["Which landscaping services are available in Kasur?", "The Nursery Pakistan provides garden planning, plant selection, planting, and landscaping consultation for suitable residential and commercial projects in Kasur."],
        ["How do I request a landscaping consultation?", "Use the landscaping consultation form and share your location, space details, and project goals. The team can then review the request and discuss the next step."],
        ["Can I view completed landscaping work?", "Yes. The completed projects section shows published landscaping work from The Nursery Pakistan."],
      ].map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    },
  ],
};

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
      .select("id, name, description, category, price, stock_quantity, image_url, image_urls, updated_at, sale_percentage, sale_start_at, sale_end_at")
      .eq("is_visible", true),
  ),
  runQuery(
    "published blogs",
    supabase
      .from("blogs")
      .select("slug, title, excerpt, featured_image_url, published_at, updated_at")
      .eq("is_published", true),
  ),
  runQuery(
    "active workshops",
    supabase
      .from("workshops")
      .select("slug, title, description, workshop_date, cover_image_url, updated_at")
      .eq("is_active", true),
  ),
  runQuery(
    "completed projects",
    supabase.from("completed_projects").select("slug, title, description, cover_image_url, updated_at"),
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

const slugifyProductName = (name) => {
  const slug = String(name || "product")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || "product";
};

const productPath = (product) =>
  `/product/${slugifyProductName(product.name)}--${product.id}`;

const entries = staticPaths.map((pathname) => ({ pathname }));

if (products.some((product) => isActiveSale(product))) {
  entries.push({ pathname: "/category/sale" });
}

for (const product of products) {
  const id = safeSegment(product.id);
  if (!id) continue;
  entries.push({
    pathname: productPath(product),
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

const seoPages = staticPaths.map((pathname) => {
  const [title, description, heading] = staticSeo[pathname];
  return {
    pathname,
    title,
    description,
    heading,
    structuredData: staticStructuredData[pathname],
  };
});

if (products.some((product) => isActiveSale(product))) {
  const [title, description, heading] = staticSeo["/category/sale"];
  seoPages.push({ pathname: "/category/sale", title, description, heading });
}

for (const product of products) {
  const pathname = productPath(product);
  seoPages.push({
    pathname,
    title: `${product.name} | The Nursery Pakistan`,
    description:
      product.description?.slice(0, 160) ||
      `Shop ${product.name} from The Nursery Pakistan.`,
    heading: product.name,
    image: product.image_urls?.[0] || product.image_url,
    type: "product",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.image_urls?.length ? product.image_urls : [product.image_url].filter(Boolean),
      sku: product.id,
      category: product.category,
      offers: {
        "@type": "Offer",
        priceCurrency: "PKR",
        price: String(product.price),
        availability:
          Number(product.stock_quantity) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: `${CANONICAL_ORIGIN}${pathname}`,
      },
    },
  });
}

for (const blog of blogs) {
  const pathname = `/blog/${safeSegment(blog.slug)}`;
  seoPages.push({
    pathname,
    title: `${blog.title} | The Nursery Pakistan`,
    description: blog.excerpt,
    heading: blog.title,
    image: blog.featured_image_url,
    type: "article",
  });
}

for (const workshop of workshops) {
  const pathname = `/workshop/${safeSegment(workshop.slug)}`;
  seoPages.push({
    pathname,
    title: `${workshop.title} | The Nursery Pakistan`,
    description: workshop.description.slice(0, 160),
    heading: workshop.title,
    image: workshop.cover_image_url,
    type: "article",
  });
}

for (const project of projects) {
  const pathname = `/project/${safeSegment(project.slug)}`;
  seoPages.push({
    pathname,
    title: `${project.title} | The Nursery Pakistan`,
    description: project.description.slice(0, 160),
    heading: project.title,
    image: project.cover_image_url,
  });
}

const seoManifestPath = path.join(projectRoot, "scripts", ".seo-pages.json");
await writeFile(seoManifestPath, JSON.stringify(seoPages, null, 2), "utf8");

console.log(
  `Sitemap written to ${path.relative(projectRoot, outputPath)} with ${sitemapEntries.length} URLs ` +
    `(${products.length} products, ${blogs.length} blogs, ${workshops.length} workshops, ${projects.length} projects).`,
);
