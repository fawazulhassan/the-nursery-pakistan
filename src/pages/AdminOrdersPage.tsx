import { useState, useEffect } from 'react';
import { Package, Search, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrderCity } from '@/lib/orderCity';
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
  admin_dispatch_note: string | null;
  customer_note: string | null;
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
  const [cityFilter, setCityFilter] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, cityFilter]);

  useEffect(() => {
    setNoteDrafts((current) => {
      let changed = false;
      const next = { ...current };
      for (const order of orders) {
        if (!(order.id in next)) {
          next[order.id] = order.admin_dispatch_note ?? "";
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [orders]);

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

    const normalizedCity = cityFilter.trim().toLowerCase();
    if (normalizedCity) {
      filtered = filtered.filter((order) =>
        getOrderCity(order.shipping_address).toLowerCase().includes(normalizedCity)
      );
    }

    setFilteredOrders(filtered);
  };

  const saveDispatchNote = async (orderId: string) => {
    const trimmed = (noteDrafts[orderId] ?? "").trim();
    if (trimmed.length > 500) {
      toast({
        title: "Note too long",
        description: "Dispatch notes are limited to 500 characters.",
        variant: "destructive",
      });
      return;
    }

    const savedNote = trimmed.length === 0 ? null : trimmed;
    setSavingNoteId(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ admin_dispatch_note: savedNote })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, admin_dispatch_note: savedNote } : order
        )
      );
      setNoteDrafts((current) => ({ ...current, [orderId]: savedNote ?? "" }));
      setSelectedOrder((current) =>
        current?.id === orderId ? { ...current, admin_dispatch_note: savedNote } : current
      );
      toast({
        title: "Note saved",
        description: "Dispatch note updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message ?? "Failed to save dispatch note.",
        variant: "destructive",
      });
    } finally {
      setSavingNoteId(null);
    }
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

  const handleDeleteOrder = async (order: Order) => {
    const confirmMessage = `Permanently delete order #${order.id.slice(0, 8)}?\nThis will also remove all order items and cannot be undone.`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    setDeletingOrderId(order.id);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (error) {
        throw error;
      }

      setOrders((prev) => prev.filter((row) => row.id !== order.id));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
        setIsDialogOpen(false);
      }

      toast({
        title: 'Order deleted',
        description: `Order #${order.id.slice(0, 8)} was permanently deleted.`,
      });
    } catch (error: any) {
      setDeletingOrderId(null);
      toast({
        title: 'Delete failed',
        description: error.message ?? 'Failed to delete order. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setDeletingOrderId(null);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by email, name, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Input
                placeholder="Filter by city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
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
            <p className="text-sm font-medium text-foreground">
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
              {" · "}
              Total: Rs{" "}
              {filteredOrders
                .reduce((sum, order) => sum + Number(order.total_amount), 0)
                .toLocaleString("en-PK")}
            </p>
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
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
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
                          <p>City: {getOrderCity(order.shipping_address) || "—"}</p>
                          <p>Total: Rs {Number(order.total_amount).toLocaleString("en-PK")}</p>
                          <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                          <p>Items: {order.order_items.length} product(s)</p>
                          <p className="flex items-center gap-2 mt-2">
                            Payment: {getPaymentMethodLabel(order.payment_method)} 
                            <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)}>
                              {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </p>
                        </div>
                        <div className="mt-4 max-w-xl space-y-2">
                          <p className="text-sm font-medium text-foreground">Customer note</p>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {order.customer_note?.trim() || "No customer note"}
                          </p>
                          <label className="text-sm font-medium text-foreground" htmlFor={`dispatch-note-${order.id}`}>
                            Dispatch note
                          </label>
                          <Textarea
                            id={`dispatch-note-${order.id}`}
                            value={noteDrafts[order.id] ?? ""}
                            maxLength={500}
                            onChange={(event) =>
                              setNoteDrafts((current) => ({
                                ...current,
                                [order.id]: event.target.value,
                              }))
                            }
                            placeholder="Notes for packing or dispatch"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => saveDispatchNote(order.id)}
                            disabled={savingNoteId === order.id}
                          >
                            {savingNoteId === order.id ? "Saving..." : "Save note"}
                          </Button>
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteOrder(order)}
                          disabled={deletingOrderId === order.id}
                          className="w-[160px]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                        </Button>
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
                <p className="text-sm mt-1">City: {getOrderCity(selectedOrder.shipping_address) || "—"}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Customer note</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedOrder.customer_note?.trim() || "No customer note"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Dispatch note</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedOrder.admin_dispatch_note?.trim() || "No dispatch note"}
                </p>
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
                        loading="lazy"
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
