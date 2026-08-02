import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export {
  isValidOrderReference,
  isValidTrackingEmail,
  nextTrackingFailureState,
} from "./orderTrackingValidation";

export interface TrackedOrderItem {
  name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
}

export interface TrackedGuestOrder {
  order_reference: string;
  status: string;
  order_date: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  items: TrackedOrderItem[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeItems = (items: Json): TrackedOrderItem[] => {
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    if (!isRecord(item)) return [];

    const name = typeof item.name === "string" ? item.name : "Product unavailable";
    const imageUrl = typeof item.image_url === "string" ? item.image_url : null;
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);

    if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(unitPrice)) {
      return [];
    }

    return [{ name, image_url: imageUrl, quantity, unit_price: unitPrice }];
  });
};

export async function trackGuestOrder(
  orderReference: string,
  customerEmail: string,
): Promise<TrackedGuestOrder | null> {
  const { data, error } = await supabase.rpc("track_guest_order", {
    p_order_reference: orderReference.trim(),
    p_customer_email: customerEmail.trim(),
  });

  if (error) {
    throw new Error("Order tracking is temporarily unavailable. Please try again.");
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;

  return {
    order_reference: row.order_reference,
    status: row.status,
    order_date: row.order_date,
    total_amount: Number(row.total_amount),
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    items: normalizeItems(row.items),
  };
}
