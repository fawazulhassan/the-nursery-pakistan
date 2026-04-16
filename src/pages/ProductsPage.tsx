import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Tag, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES as CATEGORY_LIST } from "@/lib/constants";
import { fetchProductsWithFallback } from "@/lib/productQueries";
import { useWishlist } from "@/context/WishlistContext";
import { resolvePrimaryProductImage } from "@/lib/productImages";

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
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchProductsWithFallback();

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
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
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
            <div className="flex flex-col gap-4 mb-6 sm:mb-8 p-3 sm:p-4 bg-card border border-border rounded-lg">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Filter by Category:</span>
                </div>
                <div className="flex overflow-x-auto gap-2 pb-1 sm:pb-0 -mx-1 sm:mx-0">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={categoryFilter === cat.value ? "default" : "outline"}
                      size="sm"
                      className="shrink-0"
                      onClick={() => setCategoryFilter(cat.value)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 pt-2 border-t border-border">
                <span className="font-medium shrink-0">Filter by Price:</span>
                <div className="flex overflow-x-auto gap-2 pb-1 sm:pb-0 -mx-1 sm:mx-0">
                  <Button
                    variant={priceFilter === "all" ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPriceFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={priceFilter === "low" ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPriceFilter("low")}
                  >
                    Under Rs 1,500
                  </Button>
                  <Button
                    variant={priceFilter === "mid" ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPriceFilter("mid")}
                  >
                    Rs 1,500 - 3,000
                  </Button>
                  <Button
                    variant={priceFilter === "high" ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredProducts.map((product, index) => {
                  const inWishlist = isInWishlist(product.id);
                  const productImage = resolvePrimaryProductImage(product);
                  return (
                  <Card
                    key={product.id}
                    className="group hover:shadow-xl transition-all duration-300 animate-fade-in overflow-hidden border-border"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-muted">
                      <img
                        src={productImage}
                        alt={product.name}
                        className="w-full h-40 sm:h-52 lg:h-64 object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleWishlist(product);
                        }}
                        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        className={`absolute top-4 right-4 transition-opacity ${
                          inWishlist ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? "fill-current text-red-500" : ""}`} />
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

                    <CardContent className="p-3 sm:p-4">
                      <div className="text-xs text-muted-foreground mb-1">
                        {product.category}
                      </div>
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground hover:text-primary line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {product.sale_percentage ? (
                          <>
                            <div className="text-sm sm:text-xl line-through text-muted-foreground">
                              Rs {product.price}
                            </div>
                            <div className="text-base sm:text-2xl font-bold text-red-500">
                              Rs {calculateSalePrice(product.price, product.sale_percentage)?.toFixed(0)}
                            </div>
                          </>
                        ) : (
                          <div className="text-base sm:text-2xl font-bold text-primary">
                            Rs {product.price}
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="p-3 sm:p-4 pt-0">
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
                  );
                })}
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
