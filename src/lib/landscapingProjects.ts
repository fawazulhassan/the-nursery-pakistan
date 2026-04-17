import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CompletedProjectRow = Tables<"completed_projects">;

export interface CompletedProjectInput {
  title: string;
  description: string;
  cover_image_url: string;
  gallery_image_urls: string[];
  display_order?: number | null;
}

const LANDSCAPING_IMAGES_BUCKET = "landscaping-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function generateProjectSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base.slice(0, 80) || "project";
}

async function generateUniqueProjectSlug(title: string, ignoreId?: string): Promise<string> {
  const baseSlug = generateProjectSlug(title);
  let candidateSlug = baseSlug;
  let suffix = 2;

  // Suffix strategy: slug, slug-2, slug-3, ...
  while (true) {
    let query = supabase.from("completed_projects").select("id").eq("slug", candidateSlug).maybeSingle();
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

export async function getPublishedProjects(): Promise<CompletedProjectRow[]> {
  const { data, error } = await supabase
    .from("completed_projects")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCompletedProjects(): Promise<CompletedProjectRow[]> {
  return getPublishedProjects();
}

export async function getProjectBySlug(slug: string): Promise<CompletedProjectRow> {
  const { data, error } = await supabase
    .from("completed_projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getNextCompletedProjectOrder(): Promise<number> {
  const { data, error } = await supabase
    .from("completed_projects")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return typeof data?.display_order === "number" ? data.display_order + 1 : 1;
}

export async function createCompletedProject(input: CompletedProjectInput): Promise<CompletedProjectRow> {
  const normalizedOrder =
    typeof input.display_order === "number" && Number.isFinite(input.display_order)
      ? Math.trunc(input.display_order)
      : await getNextCompletedProjectOrder();
  const slug = await generateUniqueProjectSlug(input.title);

  const { data, error } = await supabase
    .from("completed_projects")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      cover_image_url: input.cover_image_url,
      gallery_image_urls: input.gallery_image_urls,
      display_order: normalizedOrder,
      slug,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateCompletedProject(
  id: string,
  input: CompletedProjectInput
): Promise<CompletedProjectRow> {
  const { data, error } = await supabase
    .from("completed_projects")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      cover_image_url: input.cover_image_url,
      gallery_image_urls: input.gallery_image_urls,
      display_order: typeof input.display_order === "number" ? Math.trunc(input.display_order) : null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCompletedProject(id: string): Promise<void> {
  const { error } = await supabase.from("completed_projects").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadLandscapingImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeExtension = (extension ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `projects/${crypto.randomUUID()}-${Date.now()}.${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(LANDSCAPING_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(LANDSCAPING_IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
