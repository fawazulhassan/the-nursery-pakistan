export const CATEGORIES = [
  { name: "Indoor Plants", slug: "indoor-plants" },
  { name: "Outdoor Plants", slug: "outdoor-plants" },
  { name: "Pots & Accessories", slug: "pots-accessories" },
  { name: "Fertilizers & Soil", slug: "fertilizers-soil" },
  { name: "Sale", slug: "sale" },
] as const;

export const slugToCategory: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);
