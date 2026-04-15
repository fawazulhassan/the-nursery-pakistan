import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ReviewImageLightboxProps {
  open: boolean;
  imageUrl: string;
  alt: string;
  onOpenChange: (open: boolean) => void;
}

const ReviewImageLightbox = ({ open, imageUrl, alt, onOpenChange }: ReviewImageLightboxProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-black/95 border-none p-2">
        <DialogTitle className="sr-only">Review image preview</DialogTitle>
        <img src={imageUrl} alt={alt} className="w-full max-h-[85vh] object-contain rounded-md" />
      </DialogContent>
    </Dialog>
  );
};

export default ReviewImageLightbox;
