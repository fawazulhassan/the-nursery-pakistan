import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type WorkshopRow = Tables<"workshops">;

export interface WorkshopInput {
  title: string;
  description: string;
  workshop_date: string;
  cover_image_url: string;
  gallery_image_urls: string[];
  display_order?: number | null;
  is_active?: boolean;
}

const WORKSHOP_IMAGES_BUCKET = "workshop-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function generateWorkshopSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base.slice(0, 80) || "workshop";
}

async function generateUniqueWorkshopSlug(title: string, ignoreId?: string): Promise<string> {
  const baseSlug = generateWorkshopSlug(title);
  let candidateSlug = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase.from("workshops").select("id").eq("slug", candidateSlug).maybeSingle();
    if (ignoreId) {
      query = query.neq("id", ignoreId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.id) return candidateSlug;

    candidateSlug = `${baseSlug.slice(0, 75)}-${suffix}`;
    suffix += 1;
  }
}

export async function getPublishedWorkshops(): Promise<WorkshopRow[]> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAdminWorkshops(): Promise<WorkshopRow[]> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getWorkshopBySlug(slug: string): Promise<WorkshopRow> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  return data;
}

export async function getNextWorkshopOrder(): Promise<number> {
  const { data, error } = await supabase
    .from("workshops")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return typeof data?.display_order === "number" ? data.display_order + 1 : 1;
}

export async function createWorkshop(input: WorkshopInput): Promise<WorkshopRow> {
  const normalizedOrder =
    typeof input.display_order === "number" && Number.isFinite(input.display_order)
      ? Math.trunc(input.display_order)
      : await getNextWorkshopOrder();
  const slug = await generateUniqueWorkshopSlug(input.title);

  const { data, error } = await supabase
    .from("workshops")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      workshop_date: input.workshop_date,
      cover_image_url: input.cover_image_url,
      gallery_image_urls: input.gallery_image_urls,
      display_order: normalizedOrder,
      slug,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkshop(id: string, input: WorkshopInput): Promise<WorkshopRow> {
  const { data, error } = await supabase
    .from("workshops")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      workshop_date: input.workshop_date,
      cover_image_url: input.cover_image_url,
      gallery_image_urls: input.gallery_image_urls,
      display_order: typeof input.display_order === "number" ? Math.trunc(input.display_order) : null,
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkshop(id: string): Promise<void> {
  const { error } = await supabase.from("workshops").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadWorkshopImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeExtension = (extension ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `workshops/${crypto.randomUUID()}-${Date.now()}.${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(WORKSHOP_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(WORKSHOP_IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
