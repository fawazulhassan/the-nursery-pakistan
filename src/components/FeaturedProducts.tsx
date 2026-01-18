import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Tag } from "lucide-react";
import ProductDetailDialog from "./ProductDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FeaturedProducts = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSalePrice = (price: number, salePercentage: number | null) => {
    if (!salePercentage) return null;
    return price - (price * salePercentage / 100);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Loading Products...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Plants
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Handpicked selection of our most popular plants, perfect for beginners and plant enthusiasts alike.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="group hover:shadow-xl transition-all duration-300 animate-fade-in overflow-hidden border-border"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <div className="absolute top-4 left-4 flex gap-2">
                  {product.stock_quantity === 0 ? (
                    <Badge variant="destructive" className="text-xs px-3 py-1">
                      Sold Out
                    </Badge>
                  ) : product.stock_quantity < 5 ? (
                    <>
                      {product.sale_percentage && (
                        <Badge className="bg-red-500 text-white text-xs px-3 py-1">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.sale_percentage}% OFF
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs px-3 py-1 bg-yellow-500 text-white">
                        Only {product.stock_quantity} left
                      </Badge>
                    </>
                  ) : product.sale_percentage ? (
                    <Badge className="bg-red-500 text-white text-xs px-3 py-1">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.sale_percentage}% OFF
                    </Badge>
                  ) : (
                    <span className="bg-accent text-accent-foreground text-xs px-3 py-1 rounded-full font-medium">
                      Popular
                    </span>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  {product.category}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center gap-2">
                  {product.sale_percentage ? (
                    <>
                      <div className="text-xl line-through text-muted-foreground">
                        Rs {product.price}
                      </div>
                      <div className="text-2xl font-bold text-red-500">
                        Rs {calculateSalePrice(product.price, product.sale_percentage)?.toFixed(0)}
                      </div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      Rs {product.price}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full group/btn"
                  onClick={() => setSelectedProduct(product)}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                  {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Products
          </Button>
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

export default FeaturedProducts;
