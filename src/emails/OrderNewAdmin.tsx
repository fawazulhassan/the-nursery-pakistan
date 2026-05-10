import * as React from "react";
import { Heading, Hr, Text } from "@react-email/components";
import { BrandLayout, PRIMARY_GREEN } from "./branding.tsx";

export interface AdminOrderLine {
  name: string;
  quantity: number;
  unitPrice: string;
}

export interface OrderNewAdminProps {
  orderId: string;
  customerName: string | null;
  customerEmail: string | null;
  phone: string | null;
  items: AdminOrderLine[];
  totalFormatted: string;
  deliveryAddress: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  businessLocation?: string;
}

export default function OrderNewAdmin({
  orderId,
  customerName,
  customerEmail,
  phone,
  items,
  totalFormatted,
  deliveryAddress,
  paymentMethod,
  paymentStatus,
  businessLocation,
}: OrderNewAdminProps) {
  return (
    <BrandLayout preview={`New order ${orderId}`} businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "16px" }}>
        New order received
      </Heading>

      <Text style={{ margin: "8px 0", fontSize: "14px", color: "#333" }}>
        <strong>Order ID:</strong> <span style={{ color: PRIMARY_GREEN }}>{orderId}</span>
      </Text>

      <Text style={{ margin: "8px 0", fontSize: "14px", color: "#333" }}>
        <strong>Name:</strong> {customerName ?? "—"}
      </Text>
      <Text style={{ margin: "8px 0", fontSize: "14px", color: "#333" }}>
        <strong>Email:</strong> {customerEmail ?? "—"}
      </Text>
      <Text style={{ margin: "8px 0", fontSize: "14px", color: "#333" }}>
        <strong>Phone:</strong> {phone ?? "—"}
      </Text>
      {paymentMethod ? (
        <Text style={{ margin: "8px 0", fontSize: "14px", color: "#333" }}>
          <strong>Payment:</strong> {paymentMethod} {paymentStatus ? `(${paymentStatus})` : ""}
        </Text>
      ) : null}

      <Hr style={{ borderColor: "#eaeaea", margin: "20px 0" }} />

      <Text style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "8px" }}>Items</Text>
      {items.map((line, idx) => (
        <Text key={idx} style={{ color: "#444", fontSize: "14px", margin: "4px 0" }}>
          {line.name} × {line.quantity} @ {line.unitPrice}
        </Text>
      ))}

      <Text style={{ fontSize: "16px", fontWeight: 700, marginTop: "16px" }}>
        Total: <span style={{ color: PRIMARY_GREEN }}>{totalFormatted}</span>
      </Text>

      <Text style={{ fontWeight: 600, marginTop: "22px", marginBottom: "6px", color: "#1a1a1a" }}>Delivery address</Text>
      <Text style={{ color: "#444", fontSize: "14px", whiteSpace: "pre-wrap" as const }}>{deliveryAddress}</Text>
    </BrandLayout>
  );
}
