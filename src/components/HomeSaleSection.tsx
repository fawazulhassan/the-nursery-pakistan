import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, ArrowRight } from "lucide-react";
import ProductDetailDialog from "./ProductDetailDialog";
import { fetchProductsWithFallback } from "@/lib/productQueries";
import { useToast } from "@/hooks/use-toast";
import { resolvePrimaryProductImage } from "@/lib/productImages";
import { getEffectivePrice, isSaleActive } from "@/lib/productSale";

const HomeSaleSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSaleProducts();
  }, []);

  const fetchSaleProducts = async () => {
    try {
      const { data, error } = await fetchProductsWithFallback({
        saleOnly: true,
        limit: 6,
      });

      if (error) throw error;

      const filtered = (data || []).filter((p) => isSaleActive(p));
      setProducts(filtered);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load sale products",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = (product: any) => {
    const effectivePrice = getEffectivePrice(product);
    const productImage = resolvePrimaryProductImage(product);
    navigate("/checkout", {
      state: {
        buyNowItem: {
        id: product.id,
        name: product.name,
        price: `Rs ${effectivePrice.toLocaleString()}`,
        image: productImage,
        description: product.description,
          quantity: 1,
        },
      },
    });
  };

  if (isLoading || products.length === 0) return null;

  return (
    <section className="py-16 bg-primary/5 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              On Sale Now
            </h2>
            <p className="text-muted-foreground">
              Limited time deals on our most popular plants and accessories
            </p>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link to="/category/sale" className="flex items-center gap-2">
              View All Deals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {products.map((product, index) => {
            const productImage = resolvePrimaryProductImage(product);
            const effectivePrice = getEffectivePrice(product);
            return (
            <Card
              key={product.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-border"
            >
              <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-muted">
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full h-40 sm:h-48 lg:h-56 object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white text-sm px-3 py-1">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.sale_percentage}% OFF
                  </Badge>
                </div>
              </Link>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground hover:text-primary line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <span className="text-sm sm:text-lg line-through text-muted-foreground">
                    Rs {product.price}
                  </span>
                  <span className="text-base sm:text-2xl font-bold text-red-500">
                    Rs {effectivePrice.toFixed(0)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-3 sm:p-4 pt-0">
                <div className="w-full space-y-2">
                <Button
                  className="w-full"
                  onClick={() => setSelectedProduct(product)}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => handleBuyNow(product)}
                  disabled={product.stock_quantity === 0}
                >
                  Buy it now
                </Button>
                </div>
              </CardFooter>
            </Card>
            );
          })}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailDialog
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </section>
  );
};

export default HomeSaleSection;
