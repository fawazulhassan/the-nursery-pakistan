import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ReviewMediaItem } from "@/lib/reviews";

interface ReviewImageLightboxProps {
  open: boolean;
  items: ReviewMediaItem[];
  currentIndex: number;
  onNavigate: (nextIndex: number) => void;
  onOpenChange: (open: boolean) => void;
}

const ReviewImageLightbox = ({
  open,
  items,
  currentIndex,
  onNavigate,
  onOpenChange,
}: ReviewImageLightboxProps) => {
  const total = items.length;
  const activeItem = items[currentIndex];

  useEffect(() => {
    if (!open || total === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        onNavigate((currentIndex - 1 + total) % total);
      } else if (event.key === "ArrowRight") {
        onNavigate((currentIndex + 1) % total);
      } else if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, currentIndex, onNavigate, onOpenChange, total]);

  if (!activeItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-black/95 border-none p-2 [&>button]:hidden">
        <DialogTitle className="sr-only">Review media preview</DialogTitle>
        <div className="relative">
          {activeItem.type === "video" ? (
            <video
              src={activeItem.url}
              controls
              playsInline
              preload="metadata"
              autoPlay
              className="w-full max-h-[85vh] object-contain rounded-md"
            />
          ) : (
            <img
              src={activeItem.url}
              alt={`Review media ${currentIndex + 1}`}
              className="w-full max-h-[85vh] object-contain rounded-md"
            />
          )}

          {total > 1 ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                onClick={() => onNavigate((currentIndex - 1 + total) % total)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                onClick={() => onNavigate((currentIndex + 1) % total)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          ) : null}
          <p className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
            {currentIndex + 1} / {total}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewImageLightbox;
