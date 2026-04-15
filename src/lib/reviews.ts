import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ReviewRow = Tables<"reviews">;
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface SubmitReviewInput {
  product_slug: string;
  reviewer_name: string;
  reviewer_email?: string;
  reviewer_city: string;
  rating: number;
  review_text: string;
  image_url?: string;
}

const REVIEW_IMAGES_BUCKET = "review-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function getProductReviews(slug: string): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_slug", slug)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getHomepageReviews(): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .eq("show_on_homepage", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function submitReview(data: SubmitReviewInput): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .insert({
      ...data,
      reviewer_email: data.reviewer_email || null,
      image_url: data.image_url || null,
      status: "pending",
      show_on_homepage: false,
    });

  if (error) throw error;
}

export async function uploadReviewImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeExt = (fileExt ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `reviews/${crypto.randomUUID()}-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(REVIEW_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getAdminReviews(slug?: string): Promise<ReviewRow[]> {
  let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });

  if (slug && slug !== "all") {
    query = query.eq("product_slug", slug);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateReview(
  id: string,
  status: "approved" | "rejected",
  show_on_homepage: boolean
): Promise<ReviewRow> {
  const { data, error } = await supabase
    .from("reviews")
    .update({ status, show_on_homepage })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getDefaultReviewerCity(): Promise<string> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return "";

  const { data, error } = await supabase
    .from("delivery_addresses")
    .select("city, is_default, created_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.city?.trim() ?? "";
}
