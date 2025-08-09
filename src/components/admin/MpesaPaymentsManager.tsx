
import { useState, useEffect } from 'react';
import { useAdmin, MpesaPayment } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Eye, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const MpesaPaymentsManager = () => {
  const { 
    fetchMpesaPayments, 
    confirmMpesaPayment, 
    rejectMpesaPayment,
    updateOrderStatus
  } = useAdmin();
  
  const [payments, setPayments] = useState<MpesaPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<MpesaPayment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchMpesaPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading M-Pesa payments:', error);
      toast.error('Failed to load M-Pesa payments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (payment: MpesaPayment) => {
    try {
      await confirmMpesaPayment(payment.id);
      // Also update the order status to processing
      await updateOrderStatus(payment.order_id, 'processing');
      loadPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  const handleRejectPayment = async (payment: MpesaPayment) => {
    if (confirm('Are you sure you want to reject this payment?')) {
      try {
        await rejectMpesaPayment(payment.id);
        // Also update the order status to cancelled
        await updateOrderStatus(payment.order_id, 'cancelled');
        loadPayments();
      } catch (error) {
        console.error('Error rejecting payment:', error);
        toast.error('Failed to reject payment');
      }
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const extractMpesaCode = (message: string) => {
    // Try to extract M-Pesa transaction code from message
    const codeMatch = message.match(/[A-Z0-9]{10}/);
    return codeMatch ? codeMatch[0] : null;
  };

  if (loading) {
    return <div className="text-center py-8">Loading M-Pesa payments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Smartphone className="h-5 w-5 mr-2 text-green-500" />
          M-Pesa Payments ({payments.length})
        </h3>
        <div className="text-sm text-muted-foreground">
          Payment confirmation number: <span className="font-mono font-bold">0743049549</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {payments.filter(p => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter(p => p.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {payments.filter(p => p.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>M-Pesa Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono">
                  {payment.order_id.substring(0, 8)}...
                </TableCell>
                <TableCell className="font-semibold">
                  KES {payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>{payment.phone_number || 'N/A'}</TableCell>
                <TableCell>
                  <div className="font-mono text-sm">
                    {payment.mpesa_code || extractMpesaCode(payment.mpesa_message) || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.status)}
                </TableCell>
                <TableCell>
                  {new Date(payment.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>M-Pesa Payment Details</DialogTitle>
                          <DialogDescription>
                            Review the payment details and M-Pesa message
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedPayment && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Payment Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div><strong>Amount:</strong> KES {selectedPayment.amount.toLocaleString()}</div>
                                  <div><strong>Phone:</strong> {selectedPayment.phone_number || 'N/A'}</div>
                                  <div><strong>Status:</strong> {getStatusBadge(selectedPayment.status)}</div>
                                  <div><strong>Date:</strong> {new Date(selectedPayment.created_at).toLocaleString()}</div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Order Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div><strong>Order ID:</strong> {selectedPayment.order_id}</div>
                                  {selectedPayment.mpesa_code && (
                                    <div><strong>M-Pesa Code:</strong> <span className="font-mono">{selectedPayment.mpesa_code}</span></div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">M-Pesa Message</h4>
                              <Textarea
                                value={selectedPayment.mpesa_message}
                                readOnly
                                className="min-h-24 font-mono text-sm"
                              />
                            </div>

                            {selectedPayment.status === 'pending' && (
                              <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  onClick={() => handleRejectPayment(selectedPayment)}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleConfirmPayment(selectedPayment)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirm
                                </Button>
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
                          onClick={() => handleConfirmPayment(payment)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectPayment(payment)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
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

      {payments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No M-Pesa payments found. Payments will appear here when customers make purchases.
        </div>
      )}
    </div>
  );
};

export default MpesaPaymentsManager;
