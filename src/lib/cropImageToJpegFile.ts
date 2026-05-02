import type { Area } from "react-easy-crop";

const JPEG_QUALITY = 0.9;
const JPEG_MIME = "image/jpeg";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    if (!src.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.src = src;
  });
}

function sanitizeBaseName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").trim() || "image";
  return base.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "image";
}

/**
 * Draws the given pixel crop from the image into a JPEG blob (quality 0.9), then returns a File with a .jpg name.
 */
export async function cropImageToJpegFile(
  imageSrc: string,
  croppedAreaPixels: Area,
  originalFileName?: string
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(croppedAreaPixels.width));
  canvas.height = Math.max(1, Math.round(croppedAreaPixels.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Cropped image is empty"));
        else resolve(b);
      },
      JPEG_MIME,
      JPEG_QUALITY
    );
  });

  const base = originalFileName ? sanitizeBaseName(originalFileName) : "image";
  const fileName = `cropped-${base}.jpg`;
  return new File([blob], fileName, { type: JPEG_MIME });
}
