import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Tag, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { resolvePrimaryProductImage } from "@/lib/productImages";
import { fetchProductsWithFallback } from "@/lib/productQueries";
import { getEffectivePrice, isSaleActive } from "@/lib/productSale";
import { productDescriptionPreview } from "@/components/ProductDescription";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (q.trim()) {
      fetchSearchResults();
    } else {
      setProducts([]);
      setIsLoading(false);
    }
  }, [q]);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchProductsWithFallback({
        searchTerm: q.trim(),
      });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to search products",
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
              {q ? `Search results for "${q}"` : "Search"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {q
                ? `${products.length} product${products.length !== 1 ? "s" : ""} found`
                : "Enter a search term to find plants and products."}
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {!q.trim() ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Use the search bar above to find products.</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Searching...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {products.map((product, index) => {
                  const productImage = resolvePrimaryProductImage(product);
                  const saleActive = isSaleActive(product);
                  const effectivePrice = getEffectivePrice(product);
                  return (
                  <Card
                    key={product.id}
                    className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-border"
                  >
                    <Link to={`/product/${product.id}`} className="block">
                      <div className="relative overflow-hidden bg-muted">
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-full h-40 sm:h-52 lg:h-64 object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          {product.stock_quantity === 0 ? (
                            <Badge variant="destructive" className="text-xs px-3 py-1">
                              Sold Out
                            </Badge>
                          ) : saleActive ? (
                            <Badge className="bg-red-500 text-white text-xs px-3 py-1">
                              <Tag className="h-3 w-3 mr-1" />
                              {product.sale_percentage}% OFF
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                    <CardContent className="p-3 sm:p-4">
                      <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
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
                <p className="text-muted-foreground text-lg mb-4">No products found for "{q}".</p>
                <Button asChild variant="outline">
                  <Link to="/products">Browse All Products</Link>
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

export default SearchPage;
