import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { fetchProductsWithFallback } from "@/lib/productQueries";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import { useAuth } from "@/contexts/AuthContext";
import { resolvePrimaryProductImage, resolveProductImageUrls } from "@/lib/productImages";
import { getEffectivePrice, isSaleActive } from "@/lib/productSale";
import { ProductDescription } from "@/components/ProductDescription";

const isEditableKeyboardTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
};

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) {
      setSelectedImage("");
      return;
    }
    const images = resolveProductImageUrls(product);
    setSelectedImage(images[0] ?? resolvePrimaryProductImage(product));
  }, [product]);

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
    const imageUrl = selectedImage || resolvePrimaryProductImage(product);
    const effectivePrice = getEffectivePrice(product);

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

  const handleBuyNow = () => {
    if (!product) return;
    const imageUrl = selectedImage || resolvePrimaryProductImage(product);
    const effectivePrice = getEffectivePrice(product);

    navigate("/checkout", {
      state: {
        buyNowItem: {
        id: product.id,
        name: product.name,
        price: `Rs ${effectivePrice.toLocaleString()}`,
        image: imageUrl,
        description: product.description,
          quantity,
        },
      },
    });
  };

  useEffect(() => {
    if (!product) return;

    const productImages = resolveProductImageUrls(product);
    if (productImages.length <= 1) return;

    const mainImage = selectedImage || resolvePrimaryProductImage(product);
    const currentImageIndex = Math.max(
      0,
      productImages.findIndex((imageUrl) => imageUrl === mainImage)
    );

    const showPreviousImage = () => {
      const nextIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
      setSelectedImage(productImages[nextIndex]);
    };

    const showNextImage = () => {
      const nextIndex = (currentImageIndex + 1) % productImages.length;
      setSelectedImage(productImages[nextIndex]);
    };

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
  }, [product, selectedImage]);

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
  const saleActive = isSaleActive(product);
  const effectivePrice = getEffectivePrice(product);
  const displayPrice = saleActive ? `Rs ${effectivePrice.toFixed(0)}` : `Rs ${basePrice.toLocaleString()}`;
  const inWishlist = isInWishlist(product.id);
  const productImages = resolveProductImageUrls(product);
  const mainImage = selectedImage || resolvePrimaryProductImage(product);
  const currentImageIndex = Math.max(0, productImages.findIndex((imageUrl) => imageUrl === mainImage));

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
              <div>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  {productImages.length > 1 && (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        onClick={showPreviousImage}
                        aria-label="Previous product image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        onClick={showNextImage}
                        aria-label="Next product image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {productImages.length > 1 && (
                  <div className="mt-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-[repeat(auto-fit,4rem)] md:overflow-visible">
                      {productImages.map((imageUrl, index) => (
                        <button
                          key={`${product.id}-thumb-${index}`}
                          type="button"
                          onClick={() => setSelectedImage(imageUrl)}
                          className={`rounded-md overflow-hidden border shrink-0 w-16 h-16 ${mainImage === imageUrl ? "border-primary" : "border-border"}`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            className="w-16 h-16 object-cover object-center"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{product.category}</Badge>
                  {saleActive && (
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
                  {saleActive ? (
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
                <ProductDescription
                  text={product.description}
                  className="text-muted-foreground leading-relaxed"
                  wrapperClassName="mb-8"
                />

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
                    className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90"
                    onClick={handleBuyNow}
                    disabled={product.stock_quantity === 0}
                  >
                    Buy it now
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
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
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
