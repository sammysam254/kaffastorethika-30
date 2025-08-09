import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SupportTicket {
  id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  initial_message: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface TicketMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

const SupportTicketsManager = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTicketMessages(data || []);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ticket messages",
        variant: "destructive"
      });
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
    await fetchTicketMessages(ticket.id);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString();
        updateData.closed_by = user?.id;
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      // Send email notification when ticket is closed
      if (newStatus === 'closed' && selectedTicket) {
        try {
          await supabase.functions.invoke('send-ticket-email', {
            body: {
              to: selectedTicket.customer_email,
              customerName: selectedTicket.customer_name,
              subject: selectedTicket.subject,
              ticketId: selectedTicket.id,
              type: 'closed'
            }
          });
        } catch (emailError) {
          console.error('Failed to send closure email notification:', emailError);
          // Don't block the status change if email fails
        }
      }

      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
      }

      toast({
        title: "Success",
        description: newStatus === 'closed' 
          ? "Ticket closed and customer notified" 
          : `Ticket status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
    const { error } = await supabase
      .from('ticket_messages')
      .insert({
          ticket_id: selectedTicket.id,
          sender_id: user?.id,
          sender_name: user?.email?.split('@')[0] || 'Admin',
          sender_email: user?.email || 'admin@kaffa.com',
          message: replyMessage,
          is_internal: false
        });

      if (error) throw error;

      // Send email notification to customer
      try {
        await supabase.functions.invoke('send-ticket-email', {
          body: {
            to: selectedTicket.customer_email,
            customerName: selectedTicket.customer_name,
            subject: selectedTicket.subject,
            ticketId: selectedTicket.id,
            message: replyMessage,
            type: 'reply',
            adminName: user?.email?.split('@')[0] || 'Admin'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't block the reply if email fails
      }

      // Update ticket status to in_progress if it's still open
      if (selectedTicket.status === 'open') {
        await handleStatusChange(selectedTicket.id, 'in_progress');
      }

      await fetchTicketMessages(selectedTicket.id);
      setReplyMessage('');

      toast({
        title: "Success",
        description: "Reply sent successfully and customer notified",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <XCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="p-4">Loading support tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                  </div>
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewTicket(ticket)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>From: {ticket.customer_name} ({ticket.customer_email})</span>
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm line-clamp-2">{ticket.initial_message}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {tickets.length === 0 && (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Support Tickets</h3>
            <p className="text-muted-foreground">No support tickets have been created yet.</p>
          </Card>
        )}
      </div>

      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Ticket Details: {selectedTicket?.subject}</span>
              <Badge variant={getStatusColor(selectedTicket?.status || '')}>
                {selectedTicket?.status?.replace('_', ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Customer:</strong> {selectedTicket.customer_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedTicket.customer_email}
                </div>
                <div>
                  <strong>Priority:</strong> 
                  <Badge variant={getPriorityColor(selectedTicket.priority)} className="ml-2">
                    {selectedTicket.priority.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Update Status:</span>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h3 className="font-medium">Conversation</h3>
                <div className="border rounded-lg p-4 space-y-4 max-h-60 overflow-y-auto">
                  {/* Initial message */}
                  <div className="bg-muted p-3 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{selectedTicket.customer_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedTicket.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{selectedTicket.initial_message}</p>
                  </div>

                  {/* Additional messages */}
                  {ticketMessages.map((message) => (
                    <div key={message.id} className={`p-3 rounded ${
                      message.sender_email === selectedTicket.customer_email 
                        ? 'bg-muted' 
                        : 'bg-primary/10'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{message.sender_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply section */}
              {selectedTicket.status !== 'closed' && (
                <div className="space-y-4">
                  <h3 className="font-medium">Send Reply</h3>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                  />
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                    >
                      Close Ticket
                    </Button>
                    <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketsManager;