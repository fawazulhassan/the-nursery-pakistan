import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Eye } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_id: string;
  products: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  phone_number: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
  order_items: OrderItem[];
}

const MyOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/my-orders' } });
      return;
    }
    
    if (user) {
      fetchOrders();
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          shipping_address,
          phone_number,
          created_at,
          payment_method,
          payment_status,
          order_items (
            id,
            quantity,
            price,
            product_id,
            products (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Order Placed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    return status === 'paid' ? 'default' : 'secondary';
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                My Orders
              </h1>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Start shopping to see your orders here
                  </p>
                  <Button asChild>
                    <Link to="/">Browse Products</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="font-semibold text-lg">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1 mb-6">
                            <p>Placed on {new Date(order.created_at).toLocaleDateString('en-PK', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}</p>
                            <p>{order.order_items.length} item(s) • Total: Rs {order.total_amount.toLocaleString()}</p>
                            <p className="flex items-center gap-2">
                              {getPaymentMethodLabel(order.payment_method)} • 
                              <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)} className="text-xs">
                                {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </p>
                          </div>

                          {/* Order Timeline */}
                          <div className="mb-6">
                            <OrderStatusTimeline status={order.status} />
                          </div>

                          {/* Product previews */}
                          <div className="flex flex-wrap gap-2">
                            {order.order_items.slice(0, 3).map((item) => (
                              <img
                                key={item.id}
                                src={item.products.image_url}
                                alt={item.products.name}
                                className="w-16 h-16 object-cover rounded-lg border border-border"
                              />
                            ))}
                            {order.order_items.length > 3 && (
                              <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                +{order.order_items.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            onClick={() => viewOrderDetails(order)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">
                  Order #{selectedOrder.id.slice(0, 8)}
                </h3>
                <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                  {getStatusLabel(selectedOrder.status)}
                </Badge>
              </div>

              {/* Timeline in dialog */}
              <OrderStatusTimeline status={selectedOrder.status} />

              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div>
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Contact</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.phone_number}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Order Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.created_at).toLocaleString('en-PK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Payment</h4>
                  <p className="text-sm text-muted-foreground">
                    {getPaymentMethodLabel(selectedOrder.payment_method)}
                  </p>
                  <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.payment_status)} className="mt-1">
                    {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 border rounded-lg p-3">
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.products.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × Rs {item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right font-semibold">
                        Rs {(item.quantity * item.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">Rs {selectedOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrdersPage;
