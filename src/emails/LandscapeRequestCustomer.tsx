import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { BrandLayout, PRIMARY_GREEN } from "./branding.tsx";

export interface LandscapeRequestCustomerProps {
  customerName: string;
  /** Echo of their message/details */
  detailSummary: string;
  replyEmailDisplay?: string;
  businessLocation?: string;
}

export default function LandscapeRequestCustomer({
  customerName,
  detailSummary,
  replyEmailDisplay = "fawazulhassan@gmail.com",
  businessLocation,
}: LandscapeRequestCustomerProps) {
  return (
    <BrandLayout preview="We received your consultation request" businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "12px" }}>
        Hello {customerName},
      </Heading>
      <Text style={{ color: "#444444", fontSize: "15px", lineHeight: "24px" }}>
        We&apos;ve received your landscaping consultation request. Our team aims to reach out within <strong>24 hours</strong>
        {" "}to discuss your space and next steps.
      </Text>

      <Text style={{ fontWeight: 600, marginTop: "24px", marginBottom: "8px", color: "#1a1a1a" }}>
        Your request summary
      </Text>
      <Text
        style={{
          backgroundColor: "#f8faf8",
          borderLeft: `4px solid ${PRIMARY_GREEN}`,
          color: "#333333",
          fontSize: "14px",
          lineHeight: "22px",
          padding: "12px 16px",
          whiteSpace: "pre-wrap" as const,
        }}
      >
        {detailSummary || "—"}
      </Text>

      <Text style={{ color: "#555555", fontSize: "14px", lineHeight: "22px", marginTop: "28px" }}>
        You can also reach us at{" "}
        <a href={`mailto:${replyEmailDisplay}`} style={{ color: PRIMARY_GREEN }}>
          {replyEmailDisplay}
        </a>
        .
      </Text>
    </BrandLayout>
  );
}
