import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Tag, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES as CATEGORY_LIST } from "@/lib/constants";

const CATEGORIES = [
  { name: "All", value: "all" },
  ...CATEGORY_LIST.map((c) => ({ name: c.name, value: c.name })),
];

const ProductsPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSalePrice = (price: number, salePercentage: number | null) => {
    if (!salePercentage) return null;
    return price - (price * salePercentage / 100);
  };

  const filteredProducts = products.filter((product) => {
    if (categoryFilter === "Sale") {
      if (!product.sale_percentage || product.sale_percentage <= 0) return false;
      const now = new Date();
      if (product.sale_start_at && new Date(product.sale_start_at) > now) return false;
      if (product.sale_end_at && new Date(product.sale_end_at) < now) return false;
    } else if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
    if (priceFilter === "all") return true;
    const price = parseFloat(product.price);
    if (priceFilter === "low") return price < 1500;
    if (priceFilter === "mid") return price >= 1500 && price <= 3000;
    if (priceFilter === "high") return price > 3000;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              All Products
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Browse our full collection of plants, pots, soil, and accessories.
            </p>
            <span className="text-sm text-muted-foreground mt-4 block">
              {filteredProducts.length} products found
            </span>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-4 mb-8 p-4 bg-card border border-border rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Filter by Category:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={categoryFilter === cat.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter(cat.value)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
                <span className="font-medium">Filter by Price:</span>
                <div className="flex gap-2">
                  <Button
                    variant={priceFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={priceFilter === "low" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceFilter("low")}
                  >
                    Under Rs 1,500
                  </Button>
                  <Button
                    variant={priceFilter === "mid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceFilter("mid")}
                  >
                    Rs 1,500 - 3,000
                  </Button>
                  <Button
                    variant={priceFilter === "high" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceFilter("high")}
                  >
                    Above Rs 3,000
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <Card
                    key={product.id}
                    className="group hover:shadow-xl transition-all duration-300 animate-fade-in overflow-hidden border-border"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-muted">
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
                            {product.category}
                          </span>
                        )}
                      </div>
                    </Link>

                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground mb-1">
                        {product.category}
                      </div>
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold text-lg mb-2 text-foreground hover:text-primary">
                          {product.name}
                        </h3>
                      </Link>
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
                        {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  No products found with the selected filters.
                </p>
                <Button onClick={() => { setCategoryFilter("all"); setPriceFilter("all"); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedProduct && (
        <ProductDetailDialog
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}

      <Footer />
    </div>
  );
};

export default ProductsPage;
