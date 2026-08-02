import { beforeEach, describe, expect, it, vi } from "vitest";

import { supabase } from "@/integrations/supabase/client";
import { trackGuestOrder } from "./orderTracking";

import {
  isValidOrderReference,
  isValidTrackingEmail,
  nextTrackingFailureState,
} from "./orderTrackingValidation";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const rpcMock = vi.mocked(supabase.rpc);

describe("public order tracking RPC", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("sends the complete reference and trimmed checkout email to the tracking RPC", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null } as never);

    await trackGuestOrder(
      " 6a098c59-68e1-483d-b8b8-9cfa8016aed1 ",
      " customer@example.com ",
    );

    expect(rpcMock).toHaveBeenCalledWith("track_guest_order", {
      p_order_reference: "6a098c59-68e1-483d-b8b8-9cfa8016aed1",
      p_customer_email: "customer@example.com",
    });
  });

  it("normalizes any order row returned by the RPC without a guest-only client filter", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          order_reference: "6a098c59-68e1-483d-b8b8-9cfa8016aed1",
          status: "processing",
          order_date: "2026-08-02T10:00:00.000Z",
          total_amount: 1000,
          payment_method: "cod",
          payment_status: "unpaid",
          items: [
            {
              name: "Snake Plant",
              image_url: null,
              quantity: 1,
              unit_price: 1000,
            },
          ],
        },
      ],
      error: null,
    } as never);

    await expect(
      trackGuestOrder(
        "6a098c59-68e1-483d-b8b8-9cfa8016aed1",
        "customer@example.com",
      ),
    ).resolves.toEqual({
      order_reference: "6a098c59-68e1-483d-b8b8-9cfa8016aed1",
      status: "processing",
      order_date: "2026-08-02T10:00:00.000Z",
      total_amount: 1000,
      payment_method: "cod",
      payment_status: "unpaid",
      items: [
        {
          name: "Snake Plant",
          image_url: null,
          quantity: 1,
          unit_price: 1000,
        },
      ],
    });
  });

  it("returns null when the RPC returns no matching order", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null } as never);

    await expect(
      trackGuestOrder(
        "6a098c59-68e1-483d-b8b8-9cfa8016aed1",
        "customer@example.com",
      ),
    ).resolves.toBeNull();
  });

  it("uses a generic availability error when the RPC fails", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "database detail" } } as never);

    await expect(
      trackGuestOrder(
        "6a098c59-68e1-483d-b8b8-9cfa8016aed1",
        "customer@example.com",
      ),
    ).rejects.toThrow("Order tracking is temporarily unavailable. Please try again.");
  });
});

describe("public order tracking validation", () => {
  it("accepts a complete version-4 UUID reference", () => {
    expect(isValidOrderReference("6a098c59-68e1-483d-b8b8-9cfa8016aed1")).toBe(true);
  });

  it("accepts uppercase UUID characters and surrounding spaces", () => {
    expect(isValidOrderReference("  6A098C59-68E1-483D-B8B8-9CFA8016AED1  ")).toBe(true);
  });

  it.each([
    "6a098c59",
    "not-a-reference",
    "6a098c59-68e1-383d-b8b8-9cfa8016aed1",
    "6a098c59-68e1-483d-78b8-9cfa8016aed1",
  ])("rejects invalid or non-version-4 reference %s", (reference) => {
    expect(isValidOrderReference(reference)).toBe(false);
  });

  it("validates and trims a checkout email", () => {
    expect(isValidTrackingEmail("  customer@example.com ")).toBe(true);
    expect(isValidTrackingEmail("customer@example")).toBe(false);
  });
});

describe("public tracking not-found cooldown", () => {
  it("counts the first two consecutive not-found results", () => {
    expect(nextTrackingFailureState(0)).toEqual({ notFoundCount: 1, cooldownSeconds: 0 });
    expect(nextTrackingFailureState(1)).toEqual({ notFoundCount: 2, cooldownSeconds: 0 });
  });

  it("starts a 30-second cooldown after the third result", () => {
    expect(nextTrackingFailureState(2)).toEqual({ notFoundCount: 0, cooldownSeconds: 30 });
  });
});
