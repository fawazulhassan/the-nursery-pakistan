import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Banknote, CreditCard, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { useAuth } from "@/contexts/AuthContext";
import { useDefaultAddress } from "@/hooks/useDefaultAddress";
import { trackInitiateCheckout, trackPurchase } from "@/lib/metaPixel";
import { useSitewideSale } from "@/context/SitewideSaleContext";
import { getEffectivePrice } from "@/lib/productSale";

interface StockError {
  product_id: string;
  name: string;
  available: number;
  requested: number;
}

interface BuyNowItem {
  id: string;
  name: string;
  price: string | number;
  image: string;
  quantity: number;
  description?: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { sale, ready: sitewideReady } = useSitewideSale();
  const checkoutTracked = useRef(false);
  const [pricedLines, setPricedLines] = useState<Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }> | null>(null);
  const [priceError, setPriceError] = useState("");
  const { defaultAddress } = useDefaultAddress();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockErrors, setStockErrors] = useState<StockError[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const buyNowItem = (location.state as { buyNowItem?: BuyNowItem } | null)?.buyNowItem;
  const isBuyNowCheckout = Boolean(buyNowItem);
  const checkoutSourceItems = isBuyNowCheckout && buyNowItem ? [buyNowItem] : cartItems;

  const checkoutItemKey = checkoutSourceItems.map((item) => `${item.id}:${item.quantity}`).join("|");
  const pricedTotal = pricedLines
    ? pricedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
    : null;

  useEffect(() => {
    if (!sitewideReady) return;
    let cancelled = false;

    const loadPrices = async () => {
      if (checkoutSourceItems.length === 0) {
        setPricedLines([]);
        setPriceError("");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, price, sale_percentage, sale_start_at, sale_end_at")
        .in("id", checkoutSourceItems.map((item) => item.id));

      if (cancelled) return;
      if (error || !data) {
        setPricedLines(null);
        setPriceError("Could not load current prices. Refresh and try again.");
        return;
      }

      const productsById = new Map(data.map((product) => [product.id, product]));
      const missing = checkoutSourceItems.some((item) => !productsById.has(item.id));
      if (missing) {
        setPricedLines(null);
        setPriceError("A product in your order is no longer available.");
        return;
      }

      setPriceError("");
      setPricedLines(
        checkoutSourceItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: getEffectivePrice(productsById.get(item.id)!, new Date(), sale),
        })),
      );
    };

    void loadPrices();
    return () => {
      cancelled = true;
    };
  }, [checkoutItemKey, sale, sitewideReady]);

  // Pre-fill form with default address when available
  useEffect(() => {
    if (defaultAddress && !formData.name) {
      setFormData({
        name: defaultAddress.full_name,
        email: user?.email || "",
        phone: defaultAddress.phone_number,
        address: defaultAddress.address_line,
        city: defaultAddress.city,
        notes: defaultAddress.notes || "",
      });
    }
  }, [defaultAddress, user]);

  useEffect(() => {
    if (!pricedLines || pricedLines.length === 0 || checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackInitiateCheckout(
      pricedLines.map((line) => ({
        id: line.id,
        quantity: line.quantity,
        price: line.unitPrice,
      })),
    );
  }, [pricedLines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) {
      toast({
        title: "Please wait",
        description: "Checking your session before placing order.",
      });
      return;
    }

    setIsSubmitting(true);
    setStockErrors([]);

    const trimmedCheckoutEmail = formData.email.trim();
    if (!trimmedCheckoutEmail || !trimmedCheckoutEmail.includes("@")) {
      toast({
        title: "Valid email required",
        description: "Please enter your email so we can send order confirmations.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // First, validate stock availability for all items
      const stockCheckItems = checkoutSourceItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const { data: stockValidation, error: stockError } = await supabase
        .rpc('validate_stock', { p_items: stockCheckItems });

      if (stockError) throw stockError;

      // Check for any invalid items
      const invalidItems = (stockValidation as any[]).filter(item => !item.valid);
      if (invalidItems.length > 0) {
        setStockErrors(invalidItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          available: item.available,
          requested: item.requested
        })));
        toast({
          title: "Stock Unavailable",
          description: "Some items in your cart exceed available stock. Please adjust quantities.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!pricedLines || pricedLines.length === 0) {
        toast({
          title: "Prices still loading",
          description: priceError || "Wait for the order total, then place the order.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const totalAmount = pricedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

      // Determine payment status based on method
      const paymentStatus = paymentMethod === 'online' ? 'paid' : 'unpaid';

      // Build atomic checkout payload (order + items + stock updates in one transaction)
      const checkoutItems = pricedLines.map((line) => ({
        product_id: line.id,
        quantity: line.quantity,
        price: line.unitPrice,
      }));

      const { data: orderId, error: checkoutError } = await supabase.rpc("create_checkout_order", {
        p_total_amount: totalAmount,
        p_shipping_address: `${formData.address}, ${formData.city}`,
        p_phone_number: formData.phone,
        p_payment_method: paymentMethod,
        p_payment_status: paymentStatus,
        p_customer_name: formData.name.trim(),
        p_customer_email: trimmedCheckoutEmail,
        p_customer_note: formData.notes.trim() || null,
        p_items: checkoutItems,
      });

      if (checkoutError) throw checkoutError;
      console.log("Order created, orderId:", orderId);
      if (!checkoutError && orderId !== null && orderId !== undefined) {
        trackPurchase({
          orderId: String(orderId),
          value: totalAmount,
          contents: checkoutItems.map((item) => ({
            id: item.product_id,
            quantity: item.quantity,
            item_price: item.price,
          })),
        });
        console.log("Sending email for order:", orderId);
        await sendEmail({ type: "order", id: orderId as string });
      }

      toast({
        title: "Order Placed Successfully!",
        description: paymentMethod === 'online' 
          ? "Payment successful! Your order is being processed." 
          : "We'll contact you shortly to confirm your order.",
      });
      
      if (!isBuyNowCheckout) {
        clearCart();
      }
      navigate("/", { replace: isBuyNowCheckout });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (checkoutSourceItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <Link to="/cart" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Checkout
            </h1>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <form onSubmit={handleSubmit}>
              <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h2 className="text-2xl font-bold text-foreground mb-6">
                        Delivery Information
                      </h2>

                      {!user && (
                        <div className="mb-6 p-4 bg-muted/40 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            You are checking out as a guest. Log in to save addresses and view order history.
                          </p>
                        </div>
                      )}

                      {user && defaultAddress && (
                        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Using your saved address</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You can update your addresses in <Link to="/account" className="text-primary hover:underline">My Account</Link>
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              placeholder="your@email.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                              placeholder="+92 300 1234567"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address">Delivery Address *</Label>
                          <Textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            placeholder="House/Flat number, Street, Area"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            placeholder="Karachi, Lahore, Islamabad, etc."
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes">Order Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Any special instructions for delivery"
                            rows={3}
                            maxLength={500}
                          />
                        </div>

                        {/* Payment Method Selection */}
                        <div className="pt-4 border-t border-border">
                          <Label className="text-base font-semibold">Payment Method *</Label>
                          <RadioGroup
                            value={paymentMethod}
                            onValueChange={(value: 'cod' | 'online') => setPaymentMethod(value)}
                            className="mt-3 space-y-3"
                          >
                            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                              <RadioGroupItem value="cod" id="cod" />
                              <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                                <Banknote className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">Cash on Delivery</p>
                                  <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                                </div>
                              </Label>
                            </div>
                            {/* <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                              <RadioGroupItem value="online" id="online" />
                              <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer flex-1">
                                <CreditCard className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">Online Payment</p>
                                  <p className="text-sm text-muted-foreground">Pay securely online (Credit/Debit Card)</p>
                                </div>
                              </Label>
                            </div> */}
                          </RadioGroup>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="lg:sticky lg:top-4">
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="text-xl font-bold text-foreground mb-4">
                        Order Summary
                      </h3>
                      
                      {stockErrors.length > 0 && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm font-medium text-destructive mb-2">Stock Issues:</p>
                          {stockErrors.map((error) => (
                            <p key={error.product_id} className="text-xs text-destructive">
                              {error.name}: Only {error.available} available (requested {error.requested})
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3 mb-6">
                        {priceError && (
                          <p className="text-sm text-destructive">{priceError}</p>
                        )}
                        {pricedLines ? pricedLines.map((line) => (
                          <div key={line.id} className="flex justify-between text-sm">
                            <span className="text-foreground">
                              {line.name} x {line.quantity}
                            </span>
                            <span className="text-muted-foreground">
                              Rs {(line.unitPrice * line.quantity).toLocaleString()}
                            </span>
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground">Loading current prices...</p>
                        )}
                        
                        <div className="border-t border-border pt-3">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">
                              {pricedTotal == null ? "..." : `Rs ${pricedTotal.toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-muted-foreground">
                          {paymentMethod === 'cod' 
                            ? "We'll contact you to confirm your order and arrange cash on delivery."
                            : "You will be redirected to complete your payment securely."}
                        </p>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || authLoading || pricedTotal == null}>
                        {authLoading ? "Checking Session..." : isSubmitting ? "Placing Order..." : "Place Order"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
