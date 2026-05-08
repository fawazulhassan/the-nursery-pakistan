import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { resolveProductImageUrls } from "@/lib/productImages";

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCartFromWishlist = (item: (typeof wishlistItems)[number]) => {
    const salePrice = item.sale_percentage
      ? item.price - (item.price * item.sale_percentage / 100)
      : null;
    const effectivePrice = salePrice ?? item.price;

    addToCart(
      {
        id: item.id,
        name: item.name,
        price: `Rs ${effectivePrice.toLocaleString()}`,
        image: item.image_url,
        description: item.description,
      },
      1
    );
    removeFromWishlist(item.id);
  };

  const resolveWishlistBuyNowImage = (item: (typeof wishlistItems)[number]) => {
    const fullProduct = (item as any).product ?? (item as any).fullProduct;
    if (fullProduct) {
      return (
        resolveProductImageUrls(fullProduct)[0] ??
        (item as any).image ??
        (item as any).image_url
      );
    }

    return (item as any).image ?? (item as any).image_url;
  };

  const handleBuyNowFromWishlist = (item: (typeof wishlistItems)[number]) => {
    const salePrice = item.sale_percentage
      ? item.price - (item.price * item.sale_percentage / 100)
      : null;
    const effectivePrice = salePrice ?? item.price;

    navigate("/checkout", {
      state: {
        buyNowItem: {
          id: item.id,
          name: item.name,
          price: `Rs ${effectivePrice.toLocaleString()}`,
          image: resolveWishlistBuyNowImage(item),
          description: item.description,
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">My Wishlist</h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Save your favorite plants and come back anytime to shop.
            </p>
            <span className="text-sm text-muted-foreground mt-4 block">
              {wishlistItems.length} item{wishlistItems.length === 1 ? "" : "s"} in wishlist
            </span>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {wishlistItems.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-lg mb-4">Your wishlist is empty.</p>
                <Button asChild>
                  <Link to="/products">Explore Products</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {wishlistItems.map((item) => {
                  const salePrice = item.sale_percentage
                    ? item.price - (item.price * item.sale_percentage / 100)
                    : null;

                  return (
                    <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <Link to={`/product/${item.id}`} className="block relative overflow-hidden bg-muted">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-40 sm:h-52 lg:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-4 right-4"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeFromWishlist(item.id);
                          }}
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="text-xs px-3 py-1">
                            {item.category}
                          </Badge>
                        </div>
                      </Link>

                      <CardContent className="p-3 sm:p-4">
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground hover:text-primary line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {salePrice ? (
                            <>
                              <div className="text-sm sm:text-xl line-through text-muted-foreground">
                                Rs {item.price.toLocaleString()}
                              </div>
                              <div className="text-base sm:text-2xl font-bold text-red-500">
                                Rs {salePrice.toFixed(0)}
                              </div>
                            </>
                          ) : (
                            <div className="text-base sm:text-2xl font-bold text-primary">
                              Rs {item.price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="p-3 sm:p-4 pt-0">
                        <div className="w-full space-y-2">
                          <Button
                            className="w-full group/btn"
                            onClick={() => handleAddToCartFromWishlist(item)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            Add to Cart
                          </Button>
                          <Button
                            className="w-full bg-foreground text-background hover:bg-foreground/90"
                            onClick={() => handleBuyNowFromWishlist(item)}
                          >
                            Buy it now
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WishlistPage;
