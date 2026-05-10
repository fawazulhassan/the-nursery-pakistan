import * as React from "npm:react@18.3.1";
import { Heading, Text } from "npm:@react-email/components@0.0.22";
import { BrandLayout, PRIMARY_GREEN } from "./branding.tsx";

export interface WorkshopBookingCustomerProps {
  workshopName: string;
  bookingId: string;
  dateTimeLabel: string;
  locationLine: string;
  seats?: number;
  whatToBring?: string;
  businessLocation?: string;
}

export default function WorkshopBookingCustomer({
  workshopName,
  bookingId,
  dateTimeLabel,
  locationLine,
  seats = 1,
  whatToBring = "Bring a notebook, comfortable clothes, and a water bottle. We will share any materials list before the session if something extra is needed.",
  businessLocation,
}: WorkshopBookingCustomerProps) {
  return (
    <BrandLayout preview="Your workshop booking is confirmed" businessLocation={businessLocation}>
      <Heading as="h1" style={{ color: "#1a1a1a", fontSize: "22px", marginBottom: "12px" }}>
        Workshop booking confirmed
      </Heading>
      <Text style={{ color: "#444444", fontSize: "15px", lineHeight: "24px" }}>
        Thank you for booking with The Nursery Pakistan. We are excited to see you!
      </Text>

      <Text style={{ margin: "12px 0", fontSize: "15px", color: "#333" }}>
        <strong>Workshop:</strong> {workshopName}
      </Text>
      <Text style={{ margin: "8px 0", fontSize: "15px", color: "#333" }}>
        <strong>Confirmation #:</strong> <span style={{ color: PRIMARY_GREEN }}>{bookingId}</span>
      </Text>
      <Text style={{ margin: "8px 0", fontSize: "15px", color: "#333" }}>
        <strong>Date &amp; time:</strong> {dateTimeLabel}
      </Text>
      <Text style={{ margin: "8px 0", fontSize: "15px", color: "#333" }}>
        <strong>Location:</strong> {locationLine}
      </Text>
      <Text style={{ margin: "8px 0", fontSize: "15px", color: "#333" }}>
        <strong>Seats:</strong> {seats}
      </Text>

      <Text style={{ fontWeight: 600, marginTop: "24px", marginBottom: "8px", color: "#1a1a1a" }}>What to bring</Text>
      <Text style={{ color: "#555555", fontSize: "14px", lineHeight: "22px" }}>{whatToBring}</Text>

      <Text style={{ color: "#666666", fontSize: "14px", lineHeight: "22px", marginTop: "28px" }}>
        Questions? Reply to this email and our team will get back to you.
      </Text>
    </BrandLayout>
  );
}
