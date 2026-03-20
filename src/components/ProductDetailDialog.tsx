import { useState } from "react";
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

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: string | number;
    image?: string;
    image_url?: string;
    description?: string;
    sale_percentage?: number | null;
  };
}

const ProductDetailDialog = ({
  open,
  onOpenChange,
  product,
}: ProductDetailDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const imageUrl = product.image_url || product.image || "";
  const basePrice = typeof product.price === "string"
    ? parseInt(product.price.replace(/[^0-9]/g, ""), 10)
    : Number(product.price);
  const salePrice = product.sale_percentage
    ? basePrice - (basePrice * product.sale_percentage / 100)
    : null;
  const effectivePrice = salePrice ?? basePrice;
  const displayPrice = typeof product.price === "string" ? product.price : `Rs ${effectivePrice.toLocaleString()}`;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: `Rs ${effectivePrice.toLocaleString()}`,
      image: imageUrl,
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
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-muted-foreground">Description</h3>
              <p className="text-foreground">
                {product.description ||
                  "A beautiful plant that will bring life and freshness to your space. Easy to care for and perfect for any home or office environment."}
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-4">
                {displayPrice}
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
