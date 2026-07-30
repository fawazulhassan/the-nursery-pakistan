export const SEO_ORIGIN = "https://nurserypakistan.pk";

type BreadcrumbSchemaItem = {
  name: string;
  path: string;
};

export const absoluteSeoUrl = (pathOrUrl: string) => {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, SEO_ORIGIN).href;
};

export const createBreadcrumbSchema = (items: BreadcrumbSchemaItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteSeoUrl(item.path),
  })),
});
