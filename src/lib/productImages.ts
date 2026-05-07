import { supabase } from "@/integrations/supabase/client";

const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 5;
const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ProductImageLike = {
  image_url?: string | null;
  image_urls?: string[] | null;
};

export function resolveProductImageUrls(product?: ProductImageLike | null): string[] {
  if (!product) return [];

  const fromArray = Array.isArray(product.image_urls)
    ? product.image_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];

  if (fromArray.length > 0) return fromArray;
  if (product.image_url && product.image_url.trim().length > 0) return [product.image_url];
  return [];
}

export function resolvePrimaryProductImage(product?: ProductImageLike | null): string {
  const urls = resolveProductImageUrls(product);
  return urls[0] ?? "";
}

export function validateProductImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return "Each image must be 5MB or smaller.";
  }
  return null;
}

export async function uploadProductImage(file: File): Promise<string> {
  const validationError = validateProductImageFile(file);
  if (validationError) throw new Error(validationError);

  const mimeExt = typeof file.type === "string" ? MIME_EXTENSION_MAP[file.type.toLowerCase()] : undefined;
  const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safeNameExt = (fileExt ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = mimeExt || safeNameExt || "jpg";
  const filePath = `products/${crypto.randomUUID()}-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

function extractProductImageStoragePath(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
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

export function resolveProductStoragePaths(product?: ProductImageLike | null): string[] {
  const imageUrls = resolveProductImageUrls(product);
  const paths = imageUrls
    .map((url) => extractProductImageStoragePath(url))
    .filter((path): path is string => Boolean(path));

  return Array.from(new Set(paths));
}

export async function deleteProductImagesFromStorage(product?: ProductImageLike | null): Promise<void> {
  const paths = resolveProductStoragePaths(product);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  if (error) throw error;
}
