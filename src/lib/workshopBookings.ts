import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type WorkshopSlotRow = Tables<"workshop_slots">;
export type WorkshopBookingRow = Tables<"workshop_bookings">;
export type WorkshopBookingStatus = "new" | "confirmed" | "completed" | "cancelled";

export interface WorkshopSlotWithCount extends WorkshopSlotRow {
  /** Non-cancelled bookings (includes status new / confirmed / completed). */
  booked_count: number;
  is_fully_booked: boolean;
}

export interface CreateWorkshopBookingInput {
  slot_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  notes?: string;
}

export interface AdminBookingFilters {
  workshopId?: string;
  slotId?: string;
  status?: WorkshopBookingStatus;
}

export interface WorkshopSlotInput {
  workshop_id: string;
  slot_label: string;
  slot_start_at: string;
  slot_end_at: string;
  capacity: number;
  is_active?: boolean;
}

export async function getSlotsByWorkshop(workshopId: string): Promise<WorkshopSlotWithCount[]> {
  const { data: slots, error: slotsError } = await supabase
    .from("workshop_slots")
    .select("*")
    .eq("workshop_id", workshopId)
    .eq("is_active", true)
    .order("slot_start_at", { ascending: true });

  if (slotsError) throw slotsError;
  if (!slots?.length) return [];

  const slotIds = slots.map((slot) => slot.id);
  const { data: countRows, error: countsError } = await supabase.rpc("get_confirmed_booking_counts_by_slots", {
    p_slot_ids: slotIds,
  });

  if (countsError) throw countsError;

  const countBySlot = new Map<string, number>();
  for (const row of countRows ?? []) {
    const r = row as { slot_id: string; cnt: number | string };
    countBySlot.set(r.slot_id, Number(r.cnt));
  }

  return slots.map((slot) => {
    const booked = countBySlot.get(slot.id) ?? 0;
    return {
      ...slot,
      booked_count: booked,
      is_fully_booked: booked >= slot.capacity,
    };
  });
}

export async function createBooking(data: CreateWorkshopBookingInput): Promise<WorkshopBookingRow> {
  const payload = {
    attendee_name: data.full_name.trim(),
    email: data.email.trim().toLowerCase(),
    phone_number: data.phone_number.trim(),
    notes: data.notes?.trim() || null,
  };

  const { data: rpcData, error } = await supabase.rpc("create_booking_if_available", {
    p_slot_id: data.slot_id,
    p_booking_data: payload,
  });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes("fully booked")) {
      throw new Error("This slot is fully booked.");
    }
    if (error.code === "23505") {
      throw new Error(
        "This email already has an active booking for this slot. If you canceled or meant to register someone else, use a different email or contact support."
      );
    }
    throw new Error("Could not create booking. Please try again.");
  }
  if (!rpcData) {
    throw new Error("Booking could not be created.");
  }

  return Array.isArray(rpcData) ? (rpcData[0] as WorkshopBookingRow) : (rpcData as WorkshopBookingRow);
}

export async function getAdminBookings(filters?: AdminBookingFilters): Promise<WorkshopBookingRow[]> {
  let query = supabase.from("workshop_bookings").select("*").order("created_at", { ascending: false });

  if (filters?.workshopId) {
    query = query.eq("workshop_id", filters.workshopId);
  }
  if (filters?.slotId) {
    query = query.eq("slot_id", filters.slotId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateBookingStatus(
  id: string,
  status: WorkshopBookingStatus
): Promise<WorkshopBookingRow> {
  const { data, error } = await supabase
    .from("workshop_bookings")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from("workshop_bookings").delete().eq("id", id);
  if (error) throw error;
}

export async function getAdminWorkshopSlots(workshopId?: string): Promise<WorkshopSlotRow[]> {
  let query = supabase.from("workshop_slots").select("*").order("slot_start_at", { ascending: true });

  if (workshopId) {
    query = query.eq("workshop_id", workshopId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createWorkshopSlot(input: WorkshopSlotInput): Promise<WorkshopSlotRow> {
  const { data, error } = await supabase
    .from("workshop_slots")
    .insert({
      workshop_id: input.workshop_id,
      slot_label: input.slot_label.trim(),
      slot_start_at: input.slot_start_at,
      slot_end_at: input.slot_end_at,
      capacity: Math.max(1, Math.trunc(input.capacity)),
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkshopSlot(id: string, input: WorkshopSlotInput): Promise<WorkshopSlotRow> {
  const { data, error } = await supabase
    .from("workshop_slots")
    .update({
      workshop_id: input.workshop_id,
      slot_label: input.slot_label.trim(),
      slot_start_at: input.slot_start_at,
      slot_end_at: input.slot_end_at,
      capacity: Math.max(1, Math.trunc(input.capacity)),
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkshopSlot(id: string): Promise<void> {
  const { error } = await supabase.from("workshop_slots").delete().eq("id", id);
  if (error) throw error;
}
