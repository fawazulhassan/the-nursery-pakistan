type ProductUrlLike = {
  id: string;
  name?: string | null;
};

const UUID_AT_END =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export const slugifyProductName = (name?: string | null) => {
  const slug = (name || "product")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return slug || "product";
};

export const productPath = (product: ProductUrlLike) =>
  `/product/${slugifyProductName(product.name)}--${product.id}`;

export const productIdFromRoute = (value?: string) =>
  value?.match(UUID_AT_END)?.[1] || null;
