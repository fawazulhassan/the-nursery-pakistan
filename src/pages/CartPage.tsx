import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    const fetchStockLevels = async () => {
      if (cartItems.length === 0) {
        setStockLevels({});
        setLoadingStock(false);
        return;
      }

      const itemIds = cartItems.map(item => item.id);
      const { data, error } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .in('id', itemIds);

      if (!error && data) {
        const stockMap: Record<string, number> = {};
        data.forEach(prod => {
          stockMap[prod.id] = prod.stock_quantity;
        });
        setStockLevels(stockMap);
      }
      setLoadingStock(false);
    };

    fetchStockLevels();
  }, [cartItems]); // Re-fetch when items might change (though mainly concerned with ID changes)

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-16 px-4">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Add some beautiful plants to get started!
            </p>
            <Link to="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Shopping Cart
            </h1>
            <p className="text-muted-foreground mt-2">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const currentStock = stockLevels[item.id] ?? 999; // Default high if loading
                  const isStockLow = currentStock < 10 && currentStock > 0;
                  const isOutOfStock = currentStock === 0;
                  const canIncrease = item.quantity < currentStock;

                  return (
                    <Card key={item.id} className={isOutOfStock ? "opacity-75" : ""}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg bg-muted"
                          />

                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground mb-1">
                              {item.name}
                            </h3>
                            <p className="text-primary font-bold mb-3">{item.price}</p>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!canIncrease || loadingStock}
                                onClick={() => {
                                  if (canIncrease) {
                                    updateQuantity(item.id, item.quantity + 1);
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Stock Warnings */}
                            <div className="mt-2">
                              {loadingStock ? (
                                <span className="text-xs text-muted-foreground">Checking stock...</span>
                              ) : (
                                <>
                                  {item.quantity >= currentStock && !isOutOfStock && (
                                    <p className="text-xs text-amber-600 flex items-center mt-1">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Max quantity reached (Only {currentStock} available)
                                    </p>
                                  )}
                                  {isOutOfStock && (
                                    <p className="text-xs text-destructive font-semibold mt-1">
                                      Out of Stock - Please remove
                                    </p>
                                  )}
                                </>
                              )}
                            </div>

                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      Order Summary
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{getCartTotal()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping</span>
                        <span>Calculated at checkout</span>
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">{getCartTotal()}</span>
                        </div>
                      </div>
                    </div>

                    <Link to="/checkout">
                      <Button size="lg" className="w-full">
                        Proceed to Checkout
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
