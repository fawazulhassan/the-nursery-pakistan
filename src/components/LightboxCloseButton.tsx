import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type LightboxCloseButtonProps = {
  onClose: () => void;
};

/** Shared close control for dialogs that hide the default Radix close ([&>button]:hidden). */
const LightboxCloseButton = ({ onClose }: LightboxCloseButtonProps) => (
  <Button
    type="button"
    variant="secondary"
    size="icon"
    aria-label="Close"
    onClick={onClose}
    className="absolute top-3 right-3 z-50 min-h-[44px] min-w-[44px] shrink-0 rounded-full border-0 bg-black/60 text-white hover:bg-black/80 hover:text-white"
  >
    <X className="h-6 w-6" />
  </Button>
);

export default LightboxCloseButton;
