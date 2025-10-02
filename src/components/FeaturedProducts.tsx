import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, ShoppingCart, Star } from "lucide-react";
import monsteraImg from "@/assets/product-monstera.jpg";
import snakePlantImg from "@/assets/product-snake-plant.jpg";
import fiddleLeafImg from "@/assets/product-fiddle-leaf.jpg";
import succulentsImg from "@/assets/product-succulents.jpg";
import ProductDetailDialog from "./ProductDetailDialog";

const FeaturedProducts = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const products = [
    {
      id: 1,
      name: "Monstera Deliciosa",
      price: "Rs 2,500",
      rating: 4.8,
      image: monsteraImg,
      category: "Indoor Plants",
    },
    {
      id: 2,
      name: "Snake Plant",
      price: "Rs 1,200",
      rating: 4.9,
      image: snakePlantImg,
      category: "Indoor Plants",
    },
    {
      id: 3,
      name: "Fiddle Leaf Fig",
      price: "Rs 3,800",
      rating: 4.7,
      image: fiddleLeafImg,
      category: "Indoor Plants",
    },
    {
      id: 4,
      name: "Succulent Collection",
      price: "Rs 800",
      rating: 4.9,
      image: succulentsImg,
      category: "Indoor Plants",
    },
  ];

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
                <div className="absolute top-4 left-4">
                  <span className="bg-accent text-accent-foreground text-xs px-3 py-1 rounded-full font-medium">
                    Popular
                  </span>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  {product.category}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">(120 reviews)</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {product.price}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full group/btn"
                  onClick={() => setSelectedProduct(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                  Add to Cart
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
