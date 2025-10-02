import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, ShoppingCart, Star, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { getProductsByCategory } from "@/data/products";
import { useState } from "react";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [priceFilter, setPriceFilter] = useState<string>("all");
  
  // Convert URL slug back to category name
  const categoryName = category
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "";

  const products = getProductsByCategory(categoryName);

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
    const price = parseInt(product.price.replace(/[^0-9]/g, ""));
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
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <Card
                    key={product.id}
                    className="group hover:shadow-xl transition-all duration-300 animate-fade-in overflow-hidden border-border"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative overflow-hidden bg-muted">
                      <img
                        src={product.image}
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
                      {product.originalPrice && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-destructive text-destructive-foreground text-xs px-3 py-1 rounded-full font-medium">
                            Sale
                          </span>
                        </div>
                      )}
                      {!product.originalPrice && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-accent text-accent-foreground text-xs px-3 py-1 rounded-full font-medium">
                            Popular
                          </span>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-primary">
                          {product.price}
                        </div>
                        {product.originalPrice && (
                          <div className="text-sm text-muted-foreground line-through">
                            {product.originalPrice}
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                      <Button className="w-full group/btn">
                        <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        Add to Cart
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

      <Footer />
    </div>
  );
};

export default CategoryPage;
