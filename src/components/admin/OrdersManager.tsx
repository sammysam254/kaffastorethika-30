import { useState, useEffect } from 'react';
import { useAdmin, Order } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Package, Truck, CheckCircle, XCircle, Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { getProductImageUrl } from '@/utils/imageUtils';
import ReceiptGenerator from './ReceiptGenerator';

const OrdersManager = () => {
  const { fetchOrders, createOrder, updateOrderStatus, fetchProducts } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [paymentConfirmationNumber, setPaymentConfirmationNumber] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    product_id: '',
    quantity: 1,
    payment_method: 'mpesa'
  });

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleCreateOrder = async () => {
    if (!formData.customer_name || !formData.customer_email || !formData.product_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (!selectedProduct) {
        toast.error('Selected product not found');
        return;
      }

      const totalAmount = selectedProduct.price * formData.quantity;

      await createOrder({
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: formData.shipping_address,
        product_id: formData.product_id,
        quantity: formData.quantity,
        total_amount: totalAmount,
        payment_method: formData.payment_method,
        status: 'pending'
      });

      setIsCreateDialogOpen(false);
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        shipping_address: '',
        product_id: '',
        quantity: 1,
        payment_method: 'mpesa'
      });
      loadOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  const handleReceiptGeneration = (order: Order) => {
    setSelectedOrder(order);
    setPaymentConfirmationNumber('');
    setIsReceiptDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Package, label: 'Pending' },
      processing: { variant: 'default' as const, icon: Package, label: 'Processing' },
      shipped: { variant: 'secondary' as const, icon: Truck, label: 'Shipped' },
      delivered: { variant: 'default' as const, icon: CheckCircle, label: 'Delivered' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const orderStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Orders ({orders.length})</h3>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Order</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Customer Name *</label>
                  <Input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Customer Email *</label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    placeholder="Enter customer email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Customer Phone</label>
                  <Input
                    type="text"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    placeholder="Enter customer phone"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Product *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - KES {product.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Shipping Address</label>
                  <Textarea
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({...formData, shipping_address: e.target.value})}
                    placeholder="Enter shipping address"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <Button onClick={handleCreateOrder} className="w-full">
                  Create Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={loadOrders}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {orderStatuses.map((status) => {
          const count = orders.filter(order => order.status === status.value).length;
          return (
            <Card key={status.value}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{status.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">
                  {order.id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {order.products?.image_url && (
                      <img
                        src={order.products.image_url}
                        alt={order.products.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{order.products?.name || 'Product'}</div>
                      <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  KES {order.total_amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReceiptGeneration(order)}
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>

                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusUpdate(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedOrder.customer_name}</div>
                    <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
                    {selectedOrder.customer_phone && (
                      <div><strong>Phone:</strong> {selectedOrder.customer_phone}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Order ID:</strong> {selectedOrder.id}</div>
                    <div><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Shipping Address</h4>
                <p className="text-sm">{selectedOrder.shipping_address}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Product Details</h4>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  {selectedOrder.products && (
                    <img
                      src={getProductImageUrl(selectedOrder.products)}
                      alt={selectedOrder.products.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.jpg';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{selectedOrder.products?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Quantity: {selectedOrder.quantity} × KES {selectedOrder.products?.price.toLocaleString()}
                    </div>
                    <div className="font-semibold">
                      Total: KES {selectedOrder.total_amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Update Order Status</h4>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Generation Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Receipt</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Generating receipt for Order #{selectedOrder.id.substring(0, 8)}
                </p>
                <p className="text-sm">
                  <strong>Customer:</strong> {selectedOrder.customer_name}
                </p>
                <p className="text-sm">
                  <strong>Total:</strong> KES {selectedOrder.total_amount.toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Payment Confirmation Number (Optional)
                </label>
                <Input
                  type="text"
                  value={paymentConfirmationNumber}
                  onChange={(e) => setPaymentConfirmationNumber(e.target.value)}
                  placeholder="Enter payment confirmation number"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be included in the receipt for verification
                </p>
              </div>
              
              <div className="flex space-x-2">
                <ReceiptGenerator 
                  order={selectedOrder} 
                />
                <Button 
                  variant="outline" 
                  onClick={() => setIsReceiptDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default OrdersManager;