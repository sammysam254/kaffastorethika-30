import { useState, useEffect } from 'react';
import { useAdmin, Message } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Mail, MailOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const MessagesManager = () => {
  const { fetchMessages, updateMessageStatus } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchMessages();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (messageId: string, newStatus: string) => {
    try {
      await updateMessageStatus(messageId, newStatus);
      loadMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      unread: { variant: 'destructive' as const, icon: Mail, label: 'Unread' },
      read: { variant: 'secondary' as const, icon: MailOpen, label: 'Read' },
      replied: { variant: 'default' as const, icon: CheckCircle, label: 'Replied' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unread;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const messageStatuses = [
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'replied', label: 'Replied' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Customer Messages ({messages.length})</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadMessages}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {messageStatuses.map((status) => {
          const count = messages.filter(message => message.status === status.value).length;
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((message) => (
              <TableRow key={message.id} className={message.status === 'unread' ? 'bg-accent/50' : ''}>
                <TableCell>
                  <div className="font-medium">{message.name}</div>
                  {message.phone && (
                    <div className="text-sm text-muted-foreground">{message.phone}</div>
                  )}
                </TableCell>
                <TableCell>{message.email}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {message.subject || 'No subject'}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(message.status)}
                </TableCell>
                <TableCell>
                  <div>
                    {new Date(message.created_at).toLocaleDateString()}
                    <div className="text-sm text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMessage(message);
                            if (message.status === 'unread') {
                              handleStatusUpdate(message.id, 'read');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Message Details</DialogTitle>
                        </DialogHeader>
                        
                        {selectedMessage && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Contact Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div><strong>Name:</strong> {selectedMessage.name}</div>
                                  <div><strong>Email:</strong> {selectedMessage.email}</div>
                                  {selectedMessage.phone && (
                                    <div><strong>Phone:</strong> {selectedMessage.phone}</div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Message Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</div>
                                  <div><strong>Status:</strong> {getStatusBadge(selectedMessage.status)}</div>
                                  {selectedMessage.replied_at && (
                                    <div><strong>Replied:</strong> {new Date(selectedMessage.replied_at).toLocaleString()}</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {selectedMessage.subject && (
                              <div>
                                <h4 className="font-semibold mb-2">Subject</h4>
                                <p className="text-sm bg-accent/50 p-3 rounded-lg">{selectedMessage.subject}</p>
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold mb-2">Message</h4>
                              <div className="text-sm bg-accent/50 p-4 rounded-lg whitespace-pre-wrap">
                                {selectedMessage.message}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Update Status</h4>
                              <Select
                                value={selectedMessage.status}
                                onValueChange={(value) => handleStatusUpdate(selectedMessage.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {messageStatuses.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Quick Actions</h4>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Your inquiry'}`);
                                  }}
                                >
                                  Reply via Email
                                </Button>
                                {selectedMessage.phone && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      window.open(`tel:${selectedMessage.phone}`);
                                    }}
                                  >
                                    Call
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Select
                      value={message.status}
                      onValueChange={(value) => handleStatusUpdate(message.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {messageStatuses.map((status) => (
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

      {messages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No messages found. Customer messages will appear here when they contact you.
        </div>
      )}
    </div>
  );
};

export default MessagesManager;