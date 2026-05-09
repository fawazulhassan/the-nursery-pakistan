/**
 * Client-side image upload optimization helpers.
 *
 * Kept intentionally separate from `cropImageFile.ts`: that module powers an
 * interactive cropping pipeline at q=0.9 with format preservation, while this
 * module handles upload-time WebP conversion at q=0.85 with a hard 2MB cap.
 * Do not merge them.
 */

export const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;
export const DEFAULT_WEBP_QUALITY = 0.85;

const WEBP_MIME = "image/webp";

export class ImageTooLargeError extends Error {
  constructor() {
    super("Image must be under 2MB");
    this.name = "ImageTooLargeError";
  }
}

export function validateImageUploadSize(file: File): void {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new ImageTooLargeError();
  }
}

function replaceExtensionWithWebp(name: string): string {
  if (!name) return "image.webp";
  if (/\.[^.]+$/.test(name)) {
    return name.replace(/\.[^.]+$/, ".webp");
  }
  return `${name}.webp`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };
    img.onerror = (event) => {
      cleanup();
      reject(event instanceof Event ? new Error("Failed to load image") : event);
    };
    img.src = objectUrl;
  });
}

/**
 * Convert an image File to WebP using the Canvas API.
 *
 * - Returns the original file unchanged when it is already `image/webp`.
 * - Falls back to the original file if `canvas.toBlob` returns null
 *   (e.g. older Safari without WebP encoder support).
 * - Renames the file extension to `.webp` and sets MIME `image/webp`.
 */
export async function convertToWebP(
  file: File,
  quality: number = DEFAULT_WEBP_QUALITY,
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  if (file.type === WEBP_MIME) {
    return file;
  }

  let img: HTMLImageElement;
  try {
    img = await loadImageFromFile(file);
  } catch {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), WEBP_MIME, quality);
  });

  if (!blob) {
    return file;
  }

  const webpName = replaceExtensionWithWebp(file.name);
  return new File([blob], webpName, { type: WEBP_MIME });
}
