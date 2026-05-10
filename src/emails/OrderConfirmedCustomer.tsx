import * as React from "react";
import { Heading, Hr, Text } from "@react-email/components";
import { BrandLayout, PRIMARY_GREEN } from "./branding.tsx";

export interface OrderLine {
  name: string;
  quantity: number;
  unitPrice: string;
}

export interface OrderConfirmedCustomerProps {
  orderId: string;
  items: OrderLine[];
  totalFormatted: string;
  deliveryAddress: string;
  estimatedDeliveryNote?: string;
  businessLocation?: string;
}

export default function OrderConfirmedCustomer({
  orderId,
  items,
  totalFormatted,
  deliveryAddress,
  estimatedDeliveryNote = "We typically prepare plants within 1–3 business days. Our team may contact you to confirm delivery timing for Kasur and nearby areas.",
  businessLocation,
}: OrderConfirmedCustomerProps) {
  return (
    <BrandLayout preview="Your order has been placed — The Nursery Pakistan" businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "12px" }}>
        Thank you for your order
      </Heading>
      <Text style={{ color: "#444444", fontSize: "15px", lineHeight: "24px" }}>
        We have received your order and will process it shortly. Your order reference is{" "}
        <strong style={{ color: PRIMARY_GREEN }}>{orderId}</strong>.
      </Text>

      <Text style={{ color: "#1a1a1a", fontSize: "15px", fontWeight: 600, marginBottom: "8px", marginTop: "24px" }}>
        Items ordered
      </Text>
      {items.map((line, idx) => (
        <Text key={idx} style={{ color: "#444444", fontSize: "14px", lineHeight: "22px", margin: "6px 0" }}>
          {line.name} × {line.quantity} — <span style={{ color: PRIMARY_GREEN }}>{line.unitPrice}</span>
        </Text>
      ))}
      <Hr style={{ borderColor: "#eaeaea", margin: "18px 0" }} />
      <Text style={{ color: "#1a1a1a", fontSize: "16px", fontWeight: 700 }}>
        Total: <span style={{ color: PRIMARY_GREEN }}>{totalFormatted}</span>
      </Text>

      <Text style={{ color: "#1a1a1a", fontSize: "15px", fontWeight: 600, marginTop: "28px", marginBottom: "6px" }}>
        Delivery address
      </Text>
      <Text style={{ color: "#444444", fontSize: "14px", lineHeight: "22px", whiteSpace: "pre-wrap" as const }}>
        {deliveryAddress}
      </Text>

      <Text style={{ color: "#1a1a1a", fontSize: "15px", fontWeight: 600, marginTop: "28px", marginBottom: "6px" }}>
        Estimated delivery
      </Text>
      <Text style={{ color: "#555555", fontSize: "14px", lineHeight: "22px" }}>{estimatedDeliveryNote}</Text>

      <Text style={{ color: "#666666", fontSize: "13px", lineHeight: "20px", marginTop: "28px" }}>
        Questions? Reply to this email — we route replies to our team inbox.
      </Text>
    </BrandLayout>
  );
}
