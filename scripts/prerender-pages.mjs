import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://nurserypakistan.pk";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const templatePath = path.join(distRoot, "index.html");
const manifestPath = path.join(projectRoot, "scripts", ".seo-pages.json");

const [template, manifestText] = await Promise.all([
  readFile(templatePath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
const pages = JSON.parse(manifestText);

if (!Array.isArray(pages) || pages.length === 0) {
  throw new Error("SEO prerender manifest is empty or malformed.");
}

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const safeJson = (value) =>
  JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");

const removeManagedHead = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+(?:name|property)=["'](?:description|robots|twitter:title|twitter:description|twitter:image|og:title|og:description|og:type|og:url|og:image)["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");

const breadcrumbSchema = (page) => {
  const parts = page.pathname.split("/").filter(Boolean);
  const items = [{ name: "Home", item: `${ORIGIN}/` }];
  parts.forEach((part, index) => {
    const itemPath = `/${parts.slice(0, index + 1).join("/")}`;
    items.push({
      name: index === parts.length - 1 ? page.heading : part.replaceAll("-", " "),
      item: `${ORIGIN}${itemPath}`,
    });
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...item,
    })),
  };
};

for (const page of pages) {
  if (!page?.pathname || !page?.title || !page?.description || !page?.heading) {
    throw new Error(`Malformed SEO page entry: ${JSON.stringify(page)}`);
  }

  const canonical = new URL(page.pathname, ORIGIN).href;
  const image = page.image || `${ORIGIN}/portfolio-1.webp`;
  const pageSchemas = Array.isArray(page.structuredData)
    ? page.structuredData
    : page.structuredData
      ? [page.structuredData]
      : [];
  const schemas = [breadcrumbSchema(page), ...pageSchemas];
  const head = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    '<meta name="robots" content="index, follow">',
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(page.description)}">`,
    `<meta property="og:type" content="${page.type || "website"}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
    ...schemas.map(
      (schema) =>
        `<script type="application/ld+json" data-prerender-json-ld>${safeJson(schema)}</script>`,
    ),
  ].join("\n    ");

  const shell = [
    '<div id="root">',
    '<header style="padding:16px;max-width:1200px;margin:auto"><a href="/">The Nursery Pakistan</a></header>',
    '<main style="padding:32px 16px;max-width:1200px;margin:auto">',
    `<h1>${escapeHtml(page.heading)}</h1>`,
    `<p>${escapeHtml(page.description)}</p>`,
    "</main>",
    "</div>",
  ].join("");

  const rendered = removeManagedHead(template)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', shell);

  const segments = page.pathname.split("/").filter(Boolean);
  const outputPath =
    segments.length === 0
      ? templatePath
      : path.join(distRoot, ...segments, "index.html");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered, "utf8");
}

await unlink(manifestPath);
console.log(`Prerendered SEO HTML for ${pages.length} public routes.`);
