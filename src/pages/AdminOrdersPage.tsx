import { useState, useEffect } from 'react';
import { Package, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';

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
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number;
  status: string;
  shipping_address: string;
  phone_number: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
  order_items: OrderItem[];
}

type PaymentStatus = "unpaid" | "paid";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            email,
            full_name
          ),
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

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.profiles?.email?.toLowerCase().includes(normalizedSearch) ||
        order.profiles?.full_name?.toLowerCase().includes(normalizedSearch) ||
        order.customer_email?.toLowerCase().includes(normalizedSearch) ||
        order.customer_name?.toLowerCase().includes(normalizedSearch) ||
        order.id.toLowerCase().includes(normalizedSearch)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  // Define valid status transitions
  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  const canTransitionTo = (currentStatus: string, newStatus: string) => {
    return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
  };

  const getAvailableStatuses = (currentStatus: string) => {
    return VALID_TRANSITIONS[currentStatus] || [];
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, currentStatus: string) => {
    if (!canTransitionTo(currentStatus, newStatus)) {
      toast({
        title: 'Invalid Transition',
        description: `Cannot change status from "${currentStatus}" to "${newStatus}"`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Order status updated to "${newStatus}"`,
      });

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Payment status updated to "${newPaymentStatus}"`,
      });

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newPaymentStatus });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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

  const getPaymentMethodLabel = (method: string) => {
    return method === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    return status === 'paid' ? 'default' : 'secondary';
  };

  const normalizePaymentStatus = (status: string): PaymentStatus =>
    status === "paid" ? "paid" : "unpaid";

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const getDisplayName = (order: Order) =>
    order.profiles?.full_name || order.customer_name || order.profiles?.email || 'Unknown';

  const getDisplayEmail = (order: Order) =>
    order.profiles?.email || order.customer_email || 'N/A';

  return (
    <AdminLayout title="Orders Management" icon={Package} desktopMenuMode="hamburger">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Search by email, name, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No orders found
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            Order #{order.id.slice(0, 8)}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Customer: {getDisplayName(order)}</p>
                          <p>Email: {getDisplayEmail(order)}</p>
                          <p>Phone: {order.phone_number}</p>
                          <p>Total: Rs {order.total_amount.toLocaleString()}</p>
                          <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                          <p>Items: {order.order_items.length} product(s)</p>
                          <p className="flex items-center gap-2 mt-2">
                            Payment: {getPaymentMethodLabel(order.payment_method)} 
                            <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)}>
                              {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {getAvailableStatuses(order.status).length > 0 ? (
                          <Select
                            value=""
                            onValueChange={(value) => updateOrderStatus(order.id, value, order.status)}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableStatuses(order.status).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="w-[160px] text-center text-sm text-muted-foreground py-2">
                            {order.status === 'delivered' ? 'Completed' : 'No actions'}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewOrderDetails(order)}
                          className="w-[160px]"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Select
                          value={normalizePaymentStatus(order.payment_status)}
                          onValueChange={(value) =>
                            updatePaymentStatus(order.id, value as PaymentStatus)
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Payment Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Mark Unpaid</SelectItem>
                            <SelectItem value="paid">Mark Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <div className="text-sm space-y-1">
                    <p>Name: {getDisplayName(selectedOrder)}</p>
                    <p>Email: {getDisplayEmail(selectedOrder)}</p>
                    <p>Phone: {selectedOrder.phone_number}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Order Information</h4>
                  <div className="text-sm space-y-1">
                    <p>Order ID: {selectedOrder.id}</p>
                    <p>Status: <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
                    <p>Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    <p>Total: Rs {selectedOrder.total_amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span>Payment:</span>
                      <span>{getPaymentMethodLabel(selectedOrder.payment_method)}</span>
                      <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.payment_status)}>
                        {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Shipping Address</h4>
                <p className="text-sm">{selectedOrder.shipping_address}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
