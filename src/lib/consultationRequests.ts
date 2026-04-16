import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ConsultationRequestRow = Tables<"consultation_requests">;
export type ConsultationStatus = "new" | "contacted" | "closed";

export interface ConsultationRequestInput {
  full_name: string;
  email: string;
  phone_number: string;
  message?: string;
}

export async function submitConsultationRequest(input: ConsultationRequestInput): Promise<void> {
  const { error } = await supabase.from("consultation_requests").insert({
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    phone_number: input.phone_number.trim(),
    message: input.message?.trim() || null,
    status: "new",
  });

  if (error) throw error;
}

export async function getAdminConsultationRequests(): Promise<ConsultationRequestRow[]> {
  const { data, error } = await supabase
    .from("consultation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateConsultationStatus(
  id: string,
  status: ConsultationStatus
): Promise<ConsultationRequestRow> {
  const { data, error } = await supabase
    .from("consultation_requests")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConsultationRequest(id: string): Promise<void> {
  const { error } = await supabase.from("consultation_requests").delete().eq("id", id);
  if (error) throw error;
}
