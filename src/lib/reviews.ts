import { supabase } from "@/integrations/supabase/client";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewMediaType = "image" | "video";

export interface ReviewMediaItem {
  url: string;
  type: ReviewMediaType;
}

export interface ReviewRow {
  id: string;
  product_slug: string;
  reviewer_name: string;
  reviewer_email: string | null;
  reviewer_city: string;
  rating: number;
  review_text: string;
  image_url: string | null;
  media_urls: string[] | null;
  media_types: string[] | null;
  status: ReviewStatus;
  show_on_homepage: boolean;
  created_at: string;
}

export interface SubmitReviewInput {
  product_slug: string;
  reviewer_name: string;
  reviewer_email?: string;
  reviewer_city: string;
  rating: number;
  review_text: string;
  image_url?: string;
  media_urls?: string[];
  media_types?: ReviewMediaType[];
}

const REVIEW_IMAGES_BUCKET = "review-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_REVIEW_MEDIA_FILES = 10;

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
  const mediaUrls = data.media_urls ?? [];
  const mediaTypes = data.media_types ?? [];
  const { error } = await supabase
    .from("reviews")
    .insert({
      ...data,
      reviewer_email: data.reviewer_email || null,
      image_url: data.image_url || null,
      media_urls: mediaUrls,
      media_types: mediaTypes,
      status: "pending",
      show_on_homepage: false,
    });

  if (error) throw error;
}

export function validateReviewMediaFile(file: File): ReviewMediaType {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    throw new Error("Only image and video files are allowed.");
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video must be under 50MB.");
  }
  return isVideo ? "video" : "image";
}

export async function uploadReviewMedia(file: File): Promise<ReviewMediaItem> {
  const mediaType = validateReviewMediaFile(file);
  const fallbackExtension = mediaType === "video" ? "mp4" : "jpg";
  const fileExt = file.name.includes(".") ? file.name.split(".").pop() : fallbackExtension;
  const safeExt = (fileExt ?? fallbackExtension).toLowerCase().replace(/[^a-z0-9]/g, "") || fallbackExtension;
  const filePath = `reviews/${crypto.randomUUID()}-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(REVIEW_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(filePath);
  return { url: data.publicUrl, type: mediaType };
}

export async function uploadReviewImage(file: File): Promise<string> {
  const uploaded = await uploadReviewMedia(file);
  if (uploaded.type !== "image") {
    throw new Error("Only image files are allowed.");
  }
  return uploaded.url;
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

function extractReviewImageStoragePath(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const marker = `/storage/v1/object/public/${REVIEW_IMAGES_BUCKET}/`;
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex === -1) return null;

  const rawPath = trimmed.slice(markerIndex + marker.length).split("?")[0].split("#")[0];
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

export async function deleteReview(id: string, imageUrl?: string | null): Promise<void> {
  const { data: reviewData, error: reviewFetchError } = await supabase
    .from("reviews")
    .select("image_url, media_urls")
    .eq("id", id)
    .maybeSingle();
  if (reviewFetchError) throw reviewFetchError;

  const allUrls = [
    ...(reviewData?.media_urls as string[] | null) ?? [],
    reviewData?.image_url,
    imageUrl,
  ].filter((url): url is string => Boolean(url));

  const storagePaths = Array.from(
    new Set(
      allUrls
        .map((url) => extractReviewImageStoragePath(url))
        .filter((path): path is string => Boolean(path))
    )
  );

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(REVIEW_IMAGES_BUCKET)
      .remove(storagePaths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function getReviewMediaItems(review: ReviewRow): ReviewMediaItem[] {
  const urls = ((review.media_urls as string[] | null) ?? []).filter(Boolean);
  const types = ((review.media_types as string[] | null) ?? []).filter(Boolean);

  if (urls.length > 0) {
    return urls.map((url, index) => ({
      url,
      type: types[index] === "video" ? "video" : "image",
    }));
  }

  if (review.image_url) {
    return [{ url: review.image_url, type: "image" }];
  }

  return [];
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
