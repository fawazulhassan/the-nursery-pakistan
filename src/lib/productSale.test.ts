import { describe, expect, it } from "vitest";

import {
  getActiveSitewidePercent,
  getAppliedSalePercent,
  getEffectivePrice,
  isSaleListingProduct,
  karachiInputToUtcIso,
  utcIsoToKarachiInput,
  type SitewideSale,
} from "./productSale";

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

  it("keeps a Sale-category product off the listing rule when only a site sale is active", () => {
    const siteSale: SitewideSale = {
      enabled: true,
      percentage: 20,
      name: "11.11 Sale",
      starts_at: null,
      ends_at: null,
    };

    expect(isSaleListingProduct(baseProduct, now)).toBe(false);
    expect(getActiveSitewidePercent(siteSale, now)).toBe(20);
  });
});

describe("sitewide sale pricing", () => {
  const siteSale: SitewideSale = {
    enabled: true,
    percentage: 20,
    name: "11.11 Sale",
    starts_at: "2026-08-01T00:00:00.000Z",
    ends_at: "2026-08-03T00:00:00.000Z",
  };

  it("applies an active site sale", () => {
    expect(getEffectivePrice(baseProduct, now, siteSale)).toBe(800);
    expect(getAppliedSalePercent(baseProduct, now, siteSale)).toBe(20);
  });

  it("charges the full price when the site sale is off", () => {
    expect(
      getEffectivePrice(baseProduct, now, { ...siteSale, enabled: false }),
    ).toBe(1000);
    expect(getActiveSitewidePercent({ ...siteSale, enabled: false }, now)).toBe(0);
  });

  it("charges the full price outside the site sale window", () => {
    expect(
      getEffectivePrice(baseProduct, new Date("2026-08-04T00:00:00.000Z"), siteSale),
    ).toBe(1000);
  });

  it("keeps the higher product sale", () => {
    const product = {
      ...baseProduct,
      sale_percentage: 25,
      sale_start_at: "2026-08-01T00:00:00.000Z",
      sale_end_at: "2026-08-03T00:00:00.000Z",
    };

    expect(getAppliedSalePercent(product, now, siteSale)).toBe(25);
    expect(getEffectivePrice(product, now, siteSale)).toBe(750);
  });

  it("accepts a site percent from 1 to 100", () => {
    expect(getActiveSitewidePercent({ ...siteSale, percentage: 1 }, now)).toBe(1);
    expect(getActiveSitewidePercent({ ...siteSale, percentage: 100 }, now)).toBe(100);
    expect(getEffectivePrice(baseProduct, now, { ...siteSale, percentage: 100 })).toBe(0);
    expect(getActiveSitewidePercent({ ...siteSale, percentage: 0 }, now)).toBe(0);
    expect(getActiveSitewidePercent({ ...siteSale, percentage: 101 }, now)).toBe(0);
  });

  it("rounds the discounted price to the nearest rupee", () => {
    expect(
      getEffectivePrice({ ...baseProduct, price: 999 }, now, { ...siteSale, percentage: 10 }),
    ).toBe(899);
  });

  it("stores Karachi wall time as UTC", () => {
    expect(karachiInputToUtcIso("2026-11-11T00:00")).toBe("2026-11-10T19:00:00.000Z");
    expect(utcIsoToKarachiInput("2026-11-10T19:00:00.000Z")).toBe("2026-11-11T00:00");
  });
});
