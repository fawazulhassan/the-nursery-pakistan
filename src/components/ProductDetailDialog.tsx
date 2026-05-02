import { useEffect, useState } from "react";
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

const ProductDetailDialog = ({
  open,
  onOpenChange,
  product,
}: ProductDetailDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const productImages = resolveProductImageUrls(product);
  const fallbackImage = product.image_url || product.image || "";
  const [selectedImage, setSelectedImage] = useState(productImages[0] ?? fallbackImage);
  const saleActive = isSaleActive(product);
  const effectivePrice = getEffectivePrice(product);
  const displayPrice = typeof product.price === "string" ? product.price : `Rs ${effectivePrice.toLocaleString()}`;

  useEffect(() => {
    setSelectedImage(productImages[0] ?? fallbackImage);
  }, [product.id, fallbackImage, productImages]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const hasDescription = Boolean(product.description?.trim());

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-full">
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
                      <img src={imageUrl} alt={`${product.name} thumbnail ${index + 1}`} className="w-16 h-16 md:w-full md:h-16 object-cover object-center" />
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
