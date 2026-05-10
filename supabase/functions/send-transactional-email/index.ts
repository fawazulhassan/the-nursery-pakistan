import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { replyToEmail, sendHtmlEmail } from "../_shared/resend.ts";
import OrderConfirmedCustomer from "../_shared/email-templates/OrderConfirmedCustomer.tsx";
import OrderNewAdmin from "../_shared/email-templates/OrderNewAdmin.tsx";
import WorkshopBookingCustomer from "../_shared/email-templates/WorkshopBookingCustomer.tsx";
import WorkshopBookingAdmin from "../_shared/email-templates/WorkshopBookingAdmin.tsx";
import LandscapeRequestCustomer from "../_shared/email-templates/LandscapeRequestCustomer.tsx";
import LandscapeRequestAdmin from "../_shared/email-templates/LandscapeRequestAdmin.tsx";

type TxnType = "order" | "booking" | "consultation";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatRs(n: number): string {
  return `Rs ${Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function formatDateTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${new Intl.DateTimeFormat("en-PK", opts).format(start)} – ${new Intl.DateTimeFormat("en-PK", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end)}`;
}

/** Log when contact email missing; admin email still attempted. Plan log line. */
function logSkipCustomerSend(kind: "order" | "booking" | "consultation", recordId: string) {
  console.log(`No customer_email for ${kind} ${recordId} — skipping customer send, sending admin only.`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const type = (body as { type?: string })?.type as TxnType | undefined;
    const id = (body as { id?: string })?.id;
    if (!type || !id || !["order", "booking", "consultation"].includes(type)) {
      console.warn("[send-transactional-email] invalid payload", body);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[send-transactional-email] Email type:", type);
    console.log("[send-transactional-email] id:", id);

    const supabase = getSupabaseAdmin();
    const bizLoc = Deno.env.get("BUSINESS_LOCATION") ?? "Kasur, Pakistan";
    const adminTo = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "fawazulhassan@gmail.com";
    const reply = replyToEmail();

    console.log("[send-transactional-email] Sending to admin:", adminTo);

    if (type === "order") {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*, order_items(quantity, price, products(name, price))")
        .eq("id", id)
        .single();

      if (error || !order) {
        console.error("[send-transactional-email] order load failed", error);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const items =
        (order.order_items as Array<{
          quantity: number;
          price: number | string;
          products: { name: string; price?: number | string } | null;
        }>) ?? [];

      const lineItems = items.map((row) => ({
        name: row.products?.name ?? "Product",
        quantity: row.quantity,
        unitPrice: formatRs(Number(row.price)),
      }));

      const total = Number(order.total_amount);
      const shipping = String(order.shipping_address ?? "");

      const customerEmail =
        typeof order.customer_email === "string" ? order.customer_email.trim() : "";

      if (!customerEmail) {
        logSkipCustomerSend("order", id);
      }

      console.log("[send-transactional-email] Customer email found:", customerEmail || "(empty)");

      const customerName = order.customer_name as string | null;
      const phone = order.phone_number as string | null;

      let customerHtml = "";
      let adminHtml = "";

      try {
        customerHtml = await renderAsync(
          React.createElement(OrderConfirmedCustomer, {
            orderId: order.id,
            items: lineItems,
            totalFormatted: formatRs(total),
            deliveryAddress: shipping,
            businessLocation: bizLoc,
          }),
        );
      } catch (e) {
        console.error("[send-transactional-email] render order customer failed", e);
      }

      try {
        adminHtml = await renderAsync(
          React.createElement(OrderNewAdmin, {
            orderId: order.id,
            customerName,
            customerEmail: customerEmail || null,
            phone,
            items: lineItems,
            totalFormatted: formatRs(total),
            deliveryAddress: shipping,
            paymentMethod: order.payment_method as string | undefined,
            paymentStatus: order.payment_status as string | undefined,
            businessLocation: bizLoc,
          }),
        );
      } catch (e) {
        console.error("[send-transactional-email] render order admin failed", e);
      }

      const tasks: Promise<unknown>[] = [];
      if (customerEmail && customerHtml) {
        console.log("[send-transactional-email] Sending to customer:", customerEmail);
        tasks.push(
          sendHtmlEmail({
            to: customerEmail,
            subject: "Your order has been placed – The Nursery Pakistan",
            html: customerHtml,
            replyTo: reply,
          }),
        );
      }
      if (adminHtml) {
        tasks.push(
          sendHtmlEmail({
            to: adminTo,
            subject: "New order received",
            html: adminHtml,
            replyTo: reply,
          }),
        );
      }
      const results = await Promise.allSettled(tasks);
      results.forEach((r, i) => {
        if (r.status === "rejected") console.error(`[send-transactional-email] order send[${i}]`, r.reason);
      });
    } else if (type === "booking") {
      const { data: booking, error } = await supabase
        .from("workshop_bookings")
        .select("*, workshop_slots(*, workshops(title, workshop_date))")
        .eq("id", id)
        .single();

      if (error || !booking) {
        console.error("[send-transactional-email] booking load failed", error);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      type SlotEmbed = {
        slot_label?: string;
        slot_start_at?: string;
        slot_end_at?: string;
        workshops?: { title?: string; workshop_date?: string } | null;
      };

      const rawSlot = booking.workshop_slots as SlotEmbed | SlotEmbed[] | null | undefined;
      const slot = Array.isArray(rawSlot) ? rawSlot[0] : rawSlot;

      const workshopName = slot?.workshops?.title ?? "Workshop";
      const dateTimeLabel =
        slot?.slot_label && slot?.slot_start_at && slot?.slot_end_at
          ? `${slot.slot_label}: ${formatDateTimeRange(slot.slot_start_at, slot.slot_end_at)}`
          : "—";
      const workshopDateLabel = slot?.workshops?.workshop_date
        ? `${new Date(slot.workshops.workshop_date).toLocaleDateString("en-PK", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}`
        : "—";

      const customerEmail = typeof booking.email === "string" ? booking.email.trim() : "";

      if (!customerEmail) {
        logSkipCustomerSend("booking", id);
      }

      console.log("[send-transactional-email] Customer email found:", customerEmail || "(empty)");

      const attendee = booking.full_name as string;
      const attendeePhone = booking.phone_number as string;
      const bookingNotes = booking.notes as string | null;

      let customerHtml = "";
      let adminHtml = "";

      try {
        customerHtml = await renderAsync(
          React.createElement(WorkshopBookingCustomer, {
            workshopName,
            bookingId: booking.id,
            dateTimeLabel,
            locationLine: `${bizLoc}`,
            seats: 1,
            businessLocation: bizLoc,
          }),
        );
      } catch (e) {
        console.error("[send-transactional-email] render workshop customer failed", e);
      }

      try {
        adminHtml = await renderAsync(
          React.createElement(WorkshopBookingAdmin, {
            customerName: attendee,
            customerEmail,
            customerPhone: attendeePhone,
            workshopName,
            workshopDateLabel: `${workshopDateLabel} — ${dateTimeLabel}`,
            bookingId: booking.id,
            notes: bookingNotes,
            businessLocation: bizLoc,
          }),
        );
      } catch (e) {
        console.error("[send-transactional-email] render workshop admin failed", e);
      }

      const tasks: Promise<unknown>[] = [];
      if (customerEmail && customerHtml) {
        console.log("[send-transactional-email] Sending to customer:", customerEmail);
        tasks.push(
          sendHtmlEmail({
            to: customerEmail,
            subject: "Your workshop booking is confirmed – The Nursery Pakistan",
            html: customerHtml,
            replyTo: reply,
          }),
        );
      }
      if (adminHtml) {
        tasks.push(
          sendHtmlEmail({
            to: adminTo,
            subject: "New workshop booking",
            html: adminHtml,
            replyTo: reply,
          }),
        );
      }
      const settled = await Promise.allSettled(tasks);
      settled.forEach((r, i) => {
        if (r.status === "rejected") console.error(`[send-transactional-email] booking send[${i}]`, r.reason);
      });
    } else if (type === "consultation") {
      const { data: row, error } = await supabase.from("consultation_requests").select("*").eq("id", id).single();

      if (error || !row) {
        console.error("[send-transactional-email] consultation load failed", error);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const custEmail = typeof row.email === "string" ? row.email.trim() : "";

      if (!custEmail) {
        logSkipCustomerSend("consultation", id);
      }

      console.log("[send-transactional-email] Customer email found:", custEmail || "(empty)");

      const fullName = row.full_name as string;
      const msg = (row.message as string | null) ?? "";

      let customerHtml = "";
      let adminHtml = "";

      try {
        customerHtml = await renderAsync(
          React.createElement(LandscapeRequestCustomer, {
            customerName: fullName,
            detailSummary: msg || "—",
            replyEmailDisplay: reply,
            businessLocation: bizLoc,
          }),
        );
      } catch (e) {
        console.error("[send-transactional-email] render consultation customer failed", e);
      }

      try {
        adminHtml = await renderAsync(
          React.createElement(LandscapeRequestAdmin, {
            requestId: row.id as string,
            fullName,
            email: custEmail || "",
            phone: row.phone_number as string,
            message: row.message as string | null,
            businessLocation: bizLoc,
          }),
        );
      } catch (e) {
        console.error("[send-transactional-email] render consultation admin failed", e);
      }

      const tasks: Promise<unknown>[] = [];
      if (custEmail && customerHtml) {
        console.log("[send-transactional-email] Sending to customer:", custEmail);
        tasks.push(
          sendHtmlEmail({
            to: custEmail,
            subject: "We've received your consultation request – The Nursery Pakistan",
            html: customerHtml,
            replyTo: reply,
          }),
        );
      }
      if (adminHtml) {
        tasks.push(
          sendHtmlEmail({
            to: adminTo,
            subject: "New consultation request",
            html: adminHtml,
            replyTo: reply,
          }),
        );
      }
      const settled = await Promise.allSettled(tasks);
      settled.forEach((r, i) => {
        if (r.status === "rejected") console.error(`[send-transactional-email] consultation send[${i}]`, r.reason);
      });
    }
  } catch (e) {
    console.error("[send-transactional-email] unexpected", e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
