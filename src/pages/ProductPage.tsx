import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_visible", true)
        .single();

      if (error) throw error;
      setProduct(data);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Link
              to="/products"
              className="inline-flex items-center text-muted-foreground hover:text-primary mb-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>

            <div className="grid md:grid-cols-2 gap-12">
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
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mb-6">
                  {product.sale_percentage ? (
                    <>
                      <span className="text-2xl line-through text-muted-foreground">
                        Rs {product.price}
                      </span>
                      <span className="text-3xl font-bold text-red-500">{displayPrice}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary">{displayPrice}</span>
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

                <Button
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
