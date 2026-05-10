import * as React from "npm:react@18.3.1";
import { Heading, Text } from "npm:@react-email/components@0.0.22";
import { BrandLayout, PRIMARY_GREEN } from "./branding.tsx";

export interface WorkshopBookingAdminProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  workshopName: string;
  workshopDateLabel: string;
  bookingId: string;
  notes?: string | null;
  businessLocation?: string;
}

export default function WorkshopBookingAdmin({
  customerName,
  customerEmail,
  customerPhone,
  workshopName,
  workshopDateLabel,
  bookingId,
  notes,
  businessLocation,
}: WorkshopBookingAdminProps) {
  return (
    <BrandLayout preview="New workshop booking" businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "16px" }}>
        New workshop booking
      </Heading>

      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Booking ID:</strong> <span style={{ color: PRIMARY_GREEN }}>{bookingId}</span>
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Name:</strong> {customerName}
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Email:</strong> {customerEmail}
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Phone:</strong> {customerPhone}
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Workshop:</strong> {workshopName}
      </Text>
      <Text style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
        <strong>Schedule:</strong> {workshopDateLabel}
      </Text>
      {notes ? (
        <Text style={{ fontSize: "14px", color: "#444", marginTop: "16px", whiteSpace: "pre-wrap" as const }}>
          <strong>Notes:</strong>
          <br />
          {notes}
        </Text>
      ) : null}
    </BrandLayout>
  );
}
