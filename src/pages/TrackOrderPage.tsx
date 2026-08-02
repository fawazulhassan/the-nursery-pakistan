import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderStatusTimeline from "@/components/OrderStatusTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  isValidOrderReference,
  isValidTrackingEmail,
  nextTrackingFailureState,
  trackGuestOrder,
  type TrackedGuestOrder,
} from "@/lib/orderTracking";

const NOT_FOUND_MESSAGE = "We could not find an order matching those details.";

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Order Placed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
};

const paymentMethodLabel = (method: string) =>
  method === "cod" ? "Cash on Delivery" : "Online Payment";

const TrackOrderPage = () => {
  const { user } = useAuth();
  const [orderReference, setOrderReference] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<TrackedGuestOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFoundCount, setNotFoundCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || cooldownSeconds > 0) return;

    const reference = orderReference.trim();
    const email = checkoutEmail.trim();
    setTrackedOrder(null);

    if (!isValidOrderReference(reference)) {
      setErrorMessage("Enter the complete order reference from your confirmation email.");
      return;
    }

    if (!isValidTrackingEmail(email)) {
      setErrorMessage("Enter the same valid email address used during checkout.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await trackGuestOrder(reference, email);
      if (!result) {
        const failureState = nextTrackingFailureState(notFoundCount);
        setErrorMessage(NOT_FOUND_MESSAGE);
        setNotFoundCount(failureState.notFoundCount);
        setCooldownSeconds(failureState.cooldownSeconds);
        return;
      }

      setTrackedOrder(result);
      setNotFoundCount(0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Order tracking is temporarily unavailable. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackAnother = () => {
    setOrderReference("");
    setCheckoutEmail("");
    setTrackedOrder(null);
    setErrorMessage("");
    setNotFoundCount(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <Link
              to="/"
              className="inline-flex items-center text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">Track Order</h1>
            </div>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Enter the complete order reference from your confirmation email and the email
              address you used at checkout.
            </p>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4 max-w-3xl space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Find your order</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="orderReference">Order reference</Label>
                    <Input
                      id="orderReference"
                      value={orderReference}
                      onChange={(event) => setOrderReference(event.target.value)}
                      placeholder="6a098c59-68e1-483d-b8b8-9cfa8016aed1"
                      autoComplete="off"
                      spellCheck={false}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Copy the full reference shown near the top of your order-confirmation email.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkoutEmail">Checkout email</Label>
                    <Input
                      id="checkoutEmail"
                      type="email"
                      value={checkoutEmail}
                      onChange={(event) => setCheckoutEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div aria-live="polite">
                    {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
                    {cooldownSeconds > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Too many unsuccessful attempts. Try again in {cooldownSeconds} seconds.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <Button
                      type="submit"
                      disabled={isSubmitting || cooldownSeconds > 0}
                      className="sm:w-auto"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {isSubmitting
                        ? "Tracking..."
                        : cooldownSeconds > 0
                          ? `Try again in ${cooldownSeconds}s`
                          : "Track Order"}
                    </Button>
                    {user && !user.is_anonymous && (
                      <Button variant="outline" asChild>
                        <Link to="/account?tab=orders">View all my orders</Link>
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {trackedOrder && (
              <Card aria-live="polite">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle>Order status</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2 break-all">
                        Reference: {trackedOrder.order_reference}
                      </p>
                    </div>
                    <Badge variant={trackedOrder.status === "cancelled" ? "destructive" : "secondary"}>
                      {statusLabel(trackedOrder.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-7">
                  <OrderStatusTimeline status={trackedOrder.status} />

                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Order date</p>
                      <p className="text-muted-foreground">
                        {new Date(trackedOrder.order_date).toLocaleDateString("en-PK", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Payment</p>
                      <p className="text-muted-foreground">
                        {paymentMethodLabel(trackedOrder.payment_method)} · {trackedOrder.payment_status}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-primary font-semibold">
                        Rs {trackedOrder.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-semibold mb-3">Items ordered</h2>
                    <div className="space-y-3">
                      {trackedOrder.items.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex items-center gap-4 rounded-lg border p-3"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-16 w-16 rounded object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × Rs {item.unit_price.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold text-right">
                            Rs {(item.quantity * item.unit_price).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" onClick={handleTrackAnother}>
                    Track another order
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrderPage;
