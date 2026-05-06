import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Tag, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { slugToCategory } from "@/lib/constants";
import { fetchProductsWithFallback } from "@/lib/productQueries";
import { useWishlist } from "@/context/WishlistContext";
import { resolvePrimaryProductImage } from "@/lib/productImages";
import { getEffectivePrice, isSaleActive } from "@/lib/productSale";
import { productDescriptionPreview } from "@/components/ProductDescription";

const CategoryPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { category } = useParams<{ category: string }>();
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const categoryName = (category && slugToCategory[category]) || "";

  useEffect(() => {
    fetchProducts();
  }, [categoryName, category]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchProductsWithFallback(
        category === "sale"
          ? { saleOnly: true }
          : { category: categoryName }
      );

      if (error) throw error;
      let result = data || [];
      if (category === 'sale') {
        result = result.filter((p) => isSaleActive(p));
      }
      setProducts(result);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Breadcrumb & Header */}
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
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
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 p-3 sm:p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Filter by Price:</span>
              </div>
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

            {/* Products Grid */}
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredProducts.map((product, index) => {
                  const inWishlist = isInWishlist(product.id);
                  const productImage = resolvePrimaryProductImage(product);
                  const saleActive = isSaleActive(product);
                  const effectivePrice = getEffectivePrice(product);
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
                            {saleActive && (
                              <Badge className="bg-red-500 text-white text-xs px-3 py-1">
                                <Tag className="h-3 w-3 mr-1" />
                                {product.sale_percentage}% OFF
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs px-3 py-1 bg-yellow-500 text-white">
                              Only {product.stock_quantity} left
                            </Badge>
                          </>
                        ) : saleActive ? (
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
                    </Link>

                    <CardContent className="p-3 sm:p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground hover:text-primary line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {productDescriptionPreview(product.description)}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {saleActive ? (
                          <>
                            <div className="text-sm sm:text-xl line-through text-muted-foreground">
                              Rs {product.price}
                            </div>
                            <div className="text-base sm:text-2xl font-bold text-red-500">
                              Rs {effectivePrice.toFixed(0)}
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
                      <div className="w-full space-y-2">
                        <Button
                          className="w-full group/btn"
                          onClick={() => setSelectedProduct(product)}
                          disabled={product.stock_quantity === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
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
