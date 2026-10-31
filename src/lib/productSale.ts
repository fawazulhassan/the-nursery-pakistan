import type { Product } from "@/types";

type SaleProduct = Pick<
  Product,
  "price" | "category" | "sale_percentage" | "sale_start_at" | "sale_end_at"
>;

export type SitewideSale = {
  enabled: boolean;
  percentage: number | null;
  name: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;

export const isSaleActive = (product: SaleProduct, now: Date = new Date()): boolean => {
  const salePercentage = Number(product.sale_percentage ?? 0);
  if (!Number.isFinite(salePercentage) || salePercentage <= 0) return false;

  const saleStartAt: string | null = product.sale_start_at ?? null;
  const saleEndAt: string | null = product.sale_end_at ?? null;

  if (saleStartAt) {
    const startDate = new Date(saleStartAt);
    if (!Number.isNaN(startDate.getTime()) && startDate > now) return false;
  }

  if (saleEndAt) {
    const endDate = new Date(saleEndAt);
    if (!Number.isNaN(endDate.getTime()) && endDate < now) return false;
  }

  return true;
};

export const isSaleListingProduct = (
  product: SaleProduct,
  now: Date = new Date()
): boolean =>
  product.category?.toLowerCase() === "sale" || isSaleActive(product, now);

const toNumberPrice = (price: number | string): number => {
  if (typeof price === "number") return price;
  const parsed = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isOpenBound = (value: string | null, now: Date, edge: "start" | "end"): boolean => {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return edge === "start" ? date <= now : date >= now;
};

export const parseSitewideSale = (value: unknown): SitewideSale | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const percentageRaw = row.percentage;
  let percentage: number | null = null;
  if (typeof percentageRaw === "number" && Number.isFinite(percentageRaw)) {
    percentage = percentageRaw;
  } else if (typeof percentageRaw === "string" && percentageRaw.trim() !== "") {
    const parsed = Number(percentageRaw);
    percentage = Number.isFinite(parsed) ? parsed : null;
  }

  return {
    enabled: row.enabled === true,
    percentage,
    name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : null,
    starts_at: typeof row.starts_at === "string" && row.starts_at ? row.starts_at : null,
    ends_at: typeof row.ends_at === "string" && row.ends_at ? row.ends_at : null,
  };
};

export const getActiveSitewidePercent = (
  sale: SitewideSale | null | undefined,
  now: Date = new Date(),
): number => {
  if (!sale?.enabled) return 0;
  const percentage = Number(sale.percentage);
  if (!Number.isInteger(percentage) || percentage < 1 || percentage > 100) return 0;
  if (!isOpenBound(sale.starts_at, now, "start") || !isOpenBound(sale.ends_at, now, "end")) return 0;
  return percentage;
};

export const getAppliedSalePercent = (
  product: SaleProduct,
  now: Date = new Date(),
  sitewideSale?: SitewideSale | null,
): number => {
  const productPercent = isSaleActive(product, now) ? Number(product.sale_percentage ?? 0) : 0;
  return Math.max(productPercent, getActiveSitewidePercent(sitewideSale, now));
};

export const getEffectivePrice = (
  product: SaleProduct,
  now: Date = new Date(),
  sitewideSale?: SitewideSale | null,
): number => {
  const basePrice = toNumberPrice(product.price);
  const appliedPercent = getAppliedSalePercent(product, now, sitewideSale);
  return Math.round((basePrice * (100 - appliedPercent)) / 100);
};

export const karachiInputToUtcIso = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - KARACHI_OFFSET_MS).toISOString();
};

export const utcIsoToKarachiInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const karachi = new Date(date.getTime() + KARACHI_OFFSET_MS);
  const year = karachi.getUTCFullYear();
  const month = String(karachi.getUTCMonth() + 1).padStart(2, "0");
  const day = String(karachi.getUTCDate()).padStart(2, "0");
  const hour = String(karachi.getUTCHours()).padStart(2, "0");
  const minute = String(karachi.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};
