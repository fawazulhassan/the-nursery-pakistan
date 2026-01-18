import { useParams, Link } from "react-router-dom";
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

const CategoryPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { category } = useParams<{ category: string }>();
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Convert URL slug back to category name
  const categoryName = category
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "";

  useEffect(() => {
    fetchProducts();
  }, [categoryName]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', categoryName)
        .order('created_at', { ascending: false });

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

  const getCategoryDescription = (cat: string) => {
    const descriptions: Record<string, string> = {
      "Indoor Plants": "Transform your living space with our curated collection of indoor plants. Perfect for Pakistani homes, these plants thrive indoors and purify your air.",
      "Outdoor Plants": "Hardy outdoor plants that flourish in Pakistan's climate. From flowering plants to shrubs, find the perfect additions for your garden.",
      "Pots & Accessories": "Beautiful planters and essential accessories to complement your plants. From traditional terracotta to modern ceramic designs.",
      "Fertilizers & Soil": "Premium quality fertilizers and soil mixes specially formulated for optimal plant growth in Pakistani conditions.",
      "Sale": "Amazing deals on plants and accessories! Limited time offers on our most popular items.",
    };
    return descriptions[cat] || "Explore our collection";
  };

  const filteredProducts = products.filter((product) => {
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
        {/* Breadcrumb & Header */}
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {categoryName}
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              {getCategoryDescription(categoryName)}
            </p>
            
            <div className="flex items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} products found
              </span>
            </div>
          </div>
        </section>

        {/* Filters & Products */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Filter by Price:</span>
              </div>
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

            {/* Products Grid */}
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
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  No products found in this price range.
                </p>
                <Button onClick={() => setPriceFilter("all")}>
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

export default CategoryPage;
