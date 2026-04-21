import type { Product } from "@/types";

type SaleProduct = Pick<Product, "price" | "sale_percentage" | "sale_start_at" | "sale_end_at">;

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

const toNumberPrice = (price: number | string): number => {
  if (typeof price === "number") return price;
  const parsed = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getEffectivePrice = (product: SaleProduct, now: Date = new Date()): number => {
  const basePrice = toNumberPrice(product.price);
  if (!isSaleActive(product, now)) return basePrice;

  const salePercentage = Number(product.sale_percentage ?? 0);
  return basePrice - (basePrice * salePercentage) / 100;
};

