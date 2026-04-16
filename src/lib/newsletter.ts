import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type NewsletterSubscriberRow = Tables<"newsletter_subscribers">;

type SubscribeResult =
  | { status: "subscribed" }
  | { status: "duplicate" };

function isDuplicateEmailError(error: PostgrestError | null) {
  return error?.code === "23505";
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: normalizedEmail,
  });

  if (isDuplicateEmailError(error)) {
    return { status: "duplicate" };
  }

  if (error) {
    throw error;
  }

  return { status: "subscribed" };
}

export async function getAdminSubscribers(): Promise<NewsletterSubscriberRow[]> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function deleteSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
