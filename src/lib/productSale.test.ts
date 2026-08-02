import { describe, expect, it } from "vitest";

import { getEffectivePrice, isSaleListingProduct } from "./productSale";

const now = new Date("2026-08-02T12:00:00.000Z");
const baseProduct = {
  price: 1000,
  category: "Indoor Plants",
  sale_percentage: null,
  sale_start_at: null,
  sale_end_at: null,
};

describe("isSaleListingProduct", () => {
  it.each(["Sale", "sale", "SALE", "sAlE"])(
    "includes a fixed-price product with category casing %s",
    (category) => {
      expect(
        isSaleListingProduct({ ...baseProduct, category }, now),
      ).toBe(true);
    },
  );

  it("includes an active percentage sale outside the Sale category", () => {
    expect(
      isSaleListingProduct(
        {
          ...baseProduct,
          sale_percentage: 20,
          sale_start_at: "2026-08-01T00:00:00.000Z",
          sale_end_at: "2026-08-03T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(true);
  });

  it("excludes a future percentage sale outside the Sale category", () => {
    expect(
      isSaleListingProduct(
        {
          ...baseProduct,
          sale_percentage: 20,
          sale_start_at: "2026-08-03T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });

  it("excludes an expired percentage sale outside the Sale category", () => {
    expect(
      isSaleListingProduct(
        {
          ...baseProduct,
          sale_percentage: 20,
          sale_end_at: "2026-08-01T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });

  it.each([null, 0])("excludes a non-Sale product with percentage %s", (percentage) => {
    expect(
      isSaleListingProduct(
        { ...baseProduct, sale_percentage: percentage },
        now,
      ),
    ).toBe(false);
  });

  it("keeps visibility outside the helper so public queries can enforce it", () => {
    const hiddenSaleProduct = {
      ...baseProduct,
      category: "Sale",
      is_visible: false,
    };

    expect(isSaleListingProduct(hiddenSaleProduct, now)).toBe(true);
  });

  it("uses the stored price for a fixed-price Sale-category product", () => {
    expect(
      getEffectivePrice({ ...baseProduct, category: "Sale" }, now),
    ).toBe(1000);
  });
});
