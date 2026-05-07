import type { Area } from "react-easy-crop";

const JPEG_MIME = "image/jpeg";
const PNG_MIME = "image/png";
const WEBP_MIME = "image/webp";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: JPEG_MIME,
  jpeg: JPEG_MIME,
  png: PNG_MIME,
  webp: WEBP_MIME,
};

const EXTENSION_BY_MIME: Record<string, string> = {
  [JPEG_MIME]: "jpg",
  [PNG_MIME]: "png",
  [WEBP_MIME]: "webp",
};

const CANVAS_ENCODABLE_MIMES = new Set<string>([JPEG_MIME, PNG_MIME, WEBP_MIME]);
const JPEG_QUALITY = 0.9;
const WEBP_QUALITY = 0.9;

function sanitizeBaseName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").trim() || "image";
  return base.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "image";
}

function detectMimeType(file: File): string {
  if (typeof file.type === "string" && file.type.trim().length > 0) {
    return file.type.trim().toLowerCase();
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : "";
  if (ext && MIME_BY_EXTENSION[ext]) {
    return MIME_BY_EXTENSION[ext];
  }

  return JPEG_MIME;
}

function resolveCanvasMime(file: File): string {
  const detected = detectMimeType(file);
  if (CANVAS_ENCODABLE_MIMES.has(detected)) return detected;
  return JPEG_MIME;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.src = src;
  });
}

export async function cropImageFile(file: File, croppedAreaPixels: Area): Promise<File> {
  const imageSrc = await readFileAsDataUrl(file);
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

  const outputMime = resolveCanvasMime(file);
  const blob = await new Promise<Blob>((resolve, reject) => {
    const onBlob = (b: Blob | null) => {
      if (!b) {
        reject(new Error("Image crop failed: canvas toBlob returned null"));
      } else {
        resolve(b);
      }
    };

    if (outputMime === PNG_MIME) {
      canvas.toBlob(onBlob, outputMime);
      return;
    }

    const quality = outputMime === WEBP_MIME ? WEBP_QUALITY : JPEG_QUALITY;
    canvas.toBlob(onBlob, outputMime, quality);
  });

  const extension = EXTENSION_BY_MIME[outputMime] ?? "jpg";
  const fileName = `${sanitizeBaseName(file.name)}.${extension}`;
  return new File([blob], fileName, { type: outputMime });
}
