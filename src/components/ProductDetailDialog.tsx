import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { resolveProductImageUrls } from "@/lib/productImages";
import { getEffectivePrice, isSaleActive } from "@/lib/productSale";
import { ProductDescription } from "@/components/ProductDescription";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: string | number;
    image?: string;
    image_url?: string;
    image_urls?: string[] | null;
    description?: string;
    sale_percentage?: number | null;
    sale_start_at?: string | null;
    sale_end_at?: string | null;
  };
}

const isEditableKeyboardTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
};

const ProductDetailDialog = ({
  open,
  onOpenChange,
  product,
}: ProductDetailDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: only rememoize when image fields change.
  const productImages = useMemo(
    () => resolveProductImageUrls(product),
    [product.image_url, product.image_urls]
  );
  const fallbackImage = product.image_url || product.image || "";
  const [selectedImage, setSelectedImage] = useState(productImages[0] ?? fallbackImage);
  const saleActive = isSaleActive(product);
  const effectivePrice = getEffectivePrice(product);
  const displayPrice = typeof product.price === "string" ? product.price : `Rs ${effectivePrice.toLocaleString()}`;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: reset image only when dialog switches to a different product.
  useEffect(() => {
    setSelectedImage(productImages[0] ?? fallbackImage);
  }, [product.id]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const hasDescription = Boolean(product.description?.trim());
  const currentImageIndex = Math.max(
    0,
    productImages.findIndex((imageUrl) => imageUrl === selectedImage)
  );

  const showPreviousImage = () => {
    if (productImages.length <= 1) return;
    const nextIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
    setSelectedImage(productImages[nextIndex]);
  };

  const showNextImage = () => {
    if (productImages.length <= 1) return;
    const nextIndex = (currentImageIndex + 1) % productImages.length;
    setSelectedImage(productImages[nextIndex]);
  };

  useEffect(() => {
    if (!open || productImages.length <= 1) return;

    const handleImageKeyboardNavigation = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
    };

    window.addEventListener("keydown", handleImageKeyboardNavigation);
    return () => {
      window.removeEventListener("keydown", handleImageKeyboardNavigation);
    };
  }, [open, productImages.length, currentImageIndex]);

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: `Rs ${effectivePrice.toLocaleString()}`,
      image: selectedImage,
      description: product.description,
    };
    addToCart(cartItem, quantity);
    setQuantity(1);
    onOpenChange(false);
  };

  const handleBuyNow = () => {
    onOpenChange(false);
    navigate("/checkout", {
      state: {
        buyNowItem: {
          id: product.id,
          name: product.name,
          price: `Rs ${effectivePrice.toLocaleString()}`,
          image: selectedImage,
          description: product.description,
          quantity,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-full">
        <div className="max-h-[90vh] overflow-y-auto pr-1">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">{product.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
              {productImages.length > 1 && (
                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible">
                    {productImages.map((imageUrl, index) => (
                      <button
                        key={`${product.id}-${index}`}
                        type="button"
                        className={`border rounded overflow-hidden shrink-0 w-16 md:w-auto ${selectedImage === imageUrl ? "border-primary" : "border-border"}`}
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="w-16 h-16 md:w-full md:h-16 object-cover object-center"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              {hasDescription ? (
                <div>
                  <h3 className="font-semibold mb-2 text-muted-foreground">Description</h3>
                  <ProductDescription text={product.description} className="text-foreground" />
                </div>
              ) : null}

              <div className="border-t border-border pt-4">
                <p className="text-2xl sm:text-3xl font-bold text-primary mb-4">
                  {saleActive && typeof product.price !== "string" ? `Rs ${effectivePrice.toFixed(0)}` : displayPrice}
                </p>
                
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleIncrement}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddToCart} size="lg" className="w-full md:w-auto">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              size="lg"
              className="w-full md:w-auto bg-foreground text-background hover:bg-foreground/90"
            >
              Buy it now
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
