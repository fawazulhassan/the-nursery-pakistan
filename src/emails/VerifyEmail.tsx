import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { BrandLayout, primaryButton } from "./branding.tsx";

export interface VerifyEmailProps {
  confirmUrl: string;
  businessLocation?: string;
}

export default function VerifyEmail({ confirmUrl, businessLocation }: VerifyEmailProps) {
  return (
    <BrandLayout preview="Verify your email for The Nursery Pakistan" businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "16px" }}>
        Welcome to The Nursery Pakistan
      </Heading>
      <Text style={{ color: "#444444", fontSize: "15px", lineHeight: "24px", marginBottom: "24px" }}>
        Thanks for signing up. Please confirm your email address so we can keep your account secure and send you order
        updates.
      </Text>
      <div style={{ textAlign: "center" as const, marginBottom: "24px" }}>{primaryButton("Verify email", confirmUrl)}</div>
      <Text style={{ color: "#666666", fontSize: "13px", lineHeight: "20px", wordBreak: "break-all" as const }}>
        If the button does not work, copy and paste this link into your browser:
        <br />
        <span style={{ color: "#2D6A4F" }}>{confirmUrl}</span>
      </Text>
    </BrandLayout>
  );
}
