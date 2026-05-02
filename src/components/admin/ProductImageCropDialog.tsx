import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cropImageToJpegFile } from "@/lib/cropImageToJpegFile";

type ProductImageCropDialogProps = {
  open: boolean;
  /** Overlay, Escape, built-in X */
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  /** Shown in the header; e.g. original file name */
  displayLabel?: string;
  originalFileName?: string;
  onConfirm: (file: File) => void | Promise<void>;
};

/**
 * react-easy-crop does not expose zoomStep; the zoom slider uses step 0.1 to match the plan (min 1, max 3).
 */
export function ProductImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  displayLabel,
  originalFileName,
  onConfirm,
}: ProductImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!open || !imageSrc) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleDialogOpenChange = (next: boolean) => {
    if (!next && isApplying) return;
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || isApplying) return;
    setIsApplying(true);
    try {
      const file = await cropImageToJpegFile(imageSrc, croppedAreaPixels, originalFileName);
      await onConfirm(file);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-[min(100vw-2rem,28rem)]">
        <DialogHeader>
          <DialogTitle>Square crop</DialogTitle>
          {displayLabel ? (
            <p className="text-sm text-muted-foreground truncate" title={displayLabel}>
              {displayLabel}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">Square crop · this is what we upload.</p>
        </DialogHeader>

        {imageSrc ? (
          <>
            <div className="relative mx-auto aspect-square w-full max-w-[min(100%,20rem)] overflow-hidden rounded-md bg-muted">
              <Cropper
                key={imageSrc}
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={0}
                aspect={1}
                minZoom={1}
                maxZoom={3}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="crop-zoom">Zoom</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{zoom.toFixed(1)}×</span>
              </div>
              <Slider
                id="crop-zoom"
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0] ?? 1)}
              />
            </div>
          </>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!imageSrc || !croppedAreaPixels || isApplying}>
            {isApplying ? "Working…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
