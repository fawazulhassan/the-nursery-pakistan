import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { fetchProductsWithFallback } from "@/lib/productQueries";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import { useAuth } from "@/contexts/AuthContext";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data, error } = await fetchProductsWithFallback({ id });

      if (error) throw error;
      setProduct((data || [])[0] || null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const imageUrl = product.image_url || "";
    const basePrice = Number(product.price);
    const salePrice = product.sale_percentage
      ? basePrice - (basePrice * product.sale_percentage / 100)
      : null;
    const effectivePrice = salePrice ?? basePrice;

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: `Rs ${effectivePrice.toLocaleString()}`,
        image: imageUrl,
        description: product.description,
      },
      quantity
    );
    navigate("/cart");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Product not found.</p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const basePrice = Number(product.price);
  const salePrice = product.sale_percentage
    ? basePrice - (basePrice * product.sale_percentage / 100)
    : null;
  const effectivePrice = salePrice ?? basePrice;
  const displayPrice = salePrice
    ? `Rs ${salePrice.toFixed(0)}`
    : `Rs ${basePrice.toLocaleString()}`;
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <Link
              to="/products"
              className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 sm:mb-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-12">
              <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{product.category}</Badge>
                  {product.sale_percentage && (
                    <Badge className="bg-red-500 text-white">
                      {product.sale_percentage}% OFF
                    </Badge>
                  )}
                  {product.stock_quantity === 0 && (
                    <Badge variant="destructive">Sold Out</Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {product.sale_percentage ? (
                    <>
                      <span className="text-xl sm:text-2xl line-through text-muted-foreground">
                        Rs {product.price}
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-red-500">{displayPrice}</span>
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-primary">{displayPrice}</span>
                  )}
                </div>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  {product.description ||
                    "A beautiful plant that will bring life and freshness to your space."}
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity((p) => p + 1)}
                      disabled={quantity >= product.stock_quantity}
                    >
                      +
                    </Button>
                  </div>
                  {product.stock_quantity > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {product.stock_quantity} in stock
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="w-full md:w-auto"
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  <Button
                    size="lg"
                    variant={inWishlist ? "default" : "outline"}
                    className="w-full sm:w-auto"
                    onClick={() => toggleWishlist(product)}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${inWishlist ? "fill-current" : ""}`} />
                    {inWishlist ? "Wishlisted" : "Add to Wishlist"}
                  </Button>
                </div>
              </div>
            </div>

            <section className="mt-14 border-t pt-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Customer Reviews</h2>
              <p className="text-muted-foreground mb-6">
                Reviews from customers who bought this product.
              </p>

              <ReviewList productSlug={product.id} />

              <div className="mt-6">
                {user ? (
                  <Button onClick={() => setShowReviewForm(true)}>Write a Review</Button>
                ) : (
                  <Button asChild>
                    <Link to="/auth">Log in to write a review</Link>
                  </Button>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>

      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your product experience. Your review appears after admin approval.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm productSlug={product.id} onSuccess={() => setShowReviewForm(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProductPage;
