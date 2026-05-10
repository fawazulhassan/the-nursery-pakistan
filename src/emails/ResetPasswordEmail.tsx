import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { BrandLayout, primaryButton } from "./branding.tsx";

export interface ResetPasswordEmailProps {
  resetUrl: string;
  businessLocation?: string;
}

export default function ResetPasswordEmail({ resetUrl, businessLocation }: ResetPasswordEmailProps) {
  return (
    <BrandLayout preview="Reset your password — The Nursery Pakistan" businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "16px" }}>
        Reset your password
      </Heading>
      <Text style={{ color: "#444444", fontSize: "15px", lineHeight: "24px", marginBottom: "20px" }}>
        We received a request to reset the password for your account. Tap the button below to choose a new password.
      </Text>
      <div style={{ textAlign: "center" as const, marginBottom: "24px" }}>{primaryButton("Reset password", resetUrl)}</div>
      <Text style={{ color: "#666666", fontSize: "13px", lineHeight: "20px", wordBreak: "break-all" as const }}>
        Or open this link: <span style={{ color: "#2D6A4F" }}>{resetUrl}</span>
      </Text>
      <Text style={{ color: "#888888", fontSize: "13px", lineHeight: "20px", marginTop: "28px" }}>
        If you did not request this, you can safely ignore this email. Your password will stay the same.
      </Text>
    </BrandLayout>
  );
}
