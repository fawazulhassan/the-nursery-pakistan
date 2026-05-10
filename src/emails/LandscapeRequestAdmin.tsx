import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { BrandLayout, PRIMARY_GREEN } from "./branding.tsx";

export interface LandscapeRequestAdminProps {
  requestId: string;
  fullName: string;
  email: string;
  phone: string;
  message: string | null;
  businessLocation?: string;
}

export default function LandscapeRequestAdmin({
  requestId,
  fullName,
  email,
  phone,
  message,
  businessLocation,
}: LandscapeRequestAdminProps) {
  return (
    <BrandLayout preview="New consultation request" businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "16px" }}>
        New consultation request
      </Heading>

      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Request ID:</strong> <span style={{ color: PRIMARY_GREEN }}>{requestId}</span>
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Full name:</strong> {fullName}
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Email:</strong> {email}
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Phone:</strong> {phone}
      </Text>

      <Text style={{ fontWeight: 600, marginTop: "22px", marginBottom: "8px", color: "#1a1a1a" }}>
        Message / property details
      </Text>
      <Text style={{ color: "#444444", fontSize: "14px", lineHeight: "22px", whiteSpace: "pre-wrap" as const }}>
        {message?.trim() ? message : "—"}
      </Text>
    </BrandLayout>
  );
}
