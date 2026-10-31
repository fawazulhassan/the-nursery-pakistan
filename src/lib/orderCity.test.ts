import { describe, expect, it } from "vitest";

import { getOrderCity } from "./orderCity";

describe("getOrderCity", () => {
  it("uses the segment after the last comma", () => {
    expect(getOrderCity("House 12, Block B, Lahore")).toBe("Lahore");
  });

  it("trims the city segment", () => {
    expect(getOrderCity("Street 4,  Kasur  ")).toBe("Kasur");
  });

  it("falls back to the previous segment when the last one is empty", () => {
    expect(getOrderCity("Garden Town, ")).toBe("Garden Town");
    expect(getOrderCity("House 1, , ")).toBe("House 1");
  });

  it("uses the whole address when there is no comma", () => {
    expect(getOrderCity("Lahore")).toBe("Lahore");
  });

  it("uses the whole trimmed address when every segment is empty", () => {
    expect(getOrderCity(" , ")).toBe(",");
  });

  it("returns an empty string for a blank address", () => {
    expect(getOrderCity("   ")).toBe("");
    expect(getOrderCity(null)).toBe("");
    expect(getOrderCity(undefined)).toBe("");
  });
});
