import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface NcbaLoopPayment {
  id: string;
  order_id: string;
  amount: number;
  phone_number: string;
  reference_id: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'rejected';
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
  orders?: {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    shipping_address: string;
    phone: string;
  };
}

const NcbaLoopPaymentsManager = () => {
  const { isAdmin } = useAdmin();
  const [payments, setPayments] = useState<NcbaLoopPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<NcbaLoopPayment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchPayments();
    }
  }, [isAdmin]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ncba_loop_payments')
        .select(`
          *,
          orders (
            id,
            user_id,
            total_amount,
            status,
            shipping_address,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching NCBA Loop payments:', error);
      toast.error('Failed to load NCBA Loop payments');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'confirmed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('ncba_loop_payments')
        .update({
          status,
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
          confirmed_by: status === 'confirmed' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Update order status if payment is confirmed
      if (status === 'confirmed') {
        const payment = payments.find(p => p.id === paymentId);
        if (payment) {
          await supabase
            .from('orders')
            .update({ status: 'processing' })
            .eq('id', payment.order_id);
        }
      }

      toast.success(`Payment ${status} successfully`);
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesSearch = 
      payment.orders?.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NCBA Loop Payments</h2>
          <p className="text-muted-foreground">Manage and confirm NCBA Loop paybill payments</p>
        </div>
        <Button onClick={fetchPayments} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or transaction details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>NCBA Loop Payments ({filteredPayments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No NCBA Loop payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">Order #{payment.order_id}</p>
                          <p className="text-sm text-muted-foreground">{payment.orders?.user_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        Amount: KES {payment.orders?.total_amount?.toLocaleString() || 'N/A'}
                      </TableCell>
                      <TableCell>KES {payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.phone_number || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>NCBA Loop Payment Details</DialogTitle>
                                <DialogDescription>
                                  Review and manage this NCBA Loop payment
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedPayment && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                     <div>
                                       <Label>Order Details</Label>
                                       <p className="font-medium">Order #{selectedPayment.order_id}</p>
                                       <p className="text-sm text-muted-foreground">User: {selectedPayment.orders?.user_id}</p>
                                     </div>
                                    <div>
                                      <Label>Amount</Label>
                                      <p className="font-medium">KES {selectedPayment.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label>Phone Number</Label>
                                      <p>{selectedPayment.phone_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                    </div>
                                  </div>
                                   
                                   <div>
                                     <Label>Reference ID</Label>
                                     <div className="mt-1 p-3 bg-muted rounded-lg">
                                       <p className="text-sm">
                                         {selectedPayment.reference_id || 'N/A'}
                                       </p>
                                     </div>
                                   </div>
                                  
                                  {selectedPayment.status === 'pending' && (
                                    <div className="flex space-x-2 pt-4">
                                      <Button
                                        onClick={() => updatePaymentStatus(selectedPayment.id, 'confirmed')}
                                        className="flex items-center space-x-2"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Confirm Payment</span>
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => updatePaymentStatus(selectedPayment.id, 'rejected')}
                                        className="flex items-center space-x-2"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        <span>Reject Payment</span>
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {selectedPayment.confirmed_at && (
                                    <div className="text-sm text-muted-foreground">
                                      Confirmed at: {new Date(selectedPayment.confirmed_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {payment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updatePaymentStatus(payment.id, 'confirmed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NcbaLoopPaymentsManager;