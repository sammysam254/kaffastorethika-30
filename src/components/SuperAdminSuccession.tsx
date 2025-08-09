import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';

interface SuccessionRecord {
  id: string;
  resigning_email: string;
  successor_email: string;
  status: 'designated' | 'completed' | 'auto_completed';
  designated_at: string;
  transferred_at?: string;
}

const SuperAdminSuccession = () => {
  const [successorEmail, setSuccessorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successions, setSuccessions] = useState<SuccessionRecord[]>([]);
  const { isSuperAdmin } = useAdmin();
  const { user } = useAuth();

  const fetchSuccessions = async () => {
    try {
      console.log('Fetching successions...');
      const { data, error } = await supabase.functions.invoke('admin-succession-fixed', {
        body: { action: 'list_successions' }
      });
      
      console.log('Succession response:', { data, error });
      
      if (error) {
        console.error('Error fetching successions:', error);
        if (error.message?.includes('table not found') || data?.table_missing) {
          toast.error('Admin succession table not found. Please use the Database Setup tool to create it.');
        } else {
          toast.error(`Failed to fetch successions: ${error.message}`);
        }
        setSuccessions([]);
        return;
      }
      
      setSuccessions(data?.successions || []);
    } catch (error) {
      console.error('Error fetching successions:', error);
      toast.error('Network error while fetching successions');
      setSuccessions([]);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSuccessions();
    }
  }, [isSuperAdmin]);

  // Only show to super admins - conditional rendering moved AFTER all hooks
  if (!isSuperAdmin) {
    return null;
  }

  const handleDesignateSuccessor = async () => {
    if (!successorEmail || !user?.email) {
      toast.error('Please enter a successor email address');
      return;
    }

    setLoading(true);
    try {
      console.log('Designating successor:', { successorEmail, userEmail: user.email });
      const { data, error } = await supabase.functions.invoke('admin-succession-fixed', {
        body: { 
          action: 'designate_successor',
          resigning_user_email: user.email,
          successor_email: successorEmail
        },
      });

      console.log('Designation response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error(`Failed: ${error.message}`);
      } else if (data?.success) {
        toast.success(`Successfully designated ${successorEmail} as your successor!`);
        setSuccessorEmail('');
        fetchSuccessions();
      } else {
        toast.error(data?.error || 'Failed to designate successor');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessResignation = async (resigningEmail: string) => {
    if (!confirm(`Are you sure you want to process the resignation for ${resigningEmail}? This will transfer super admin privileges to their designated successor.`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('Processing resignation for:', resigningEmail);
      const { data, error } = await supabase.functions.invoke('admin-succession-fixed', {
        body: { 
          action: 'process_resignation',
          resigning_user_email: resigningEmail
        },
      });

      console.log('Resignation response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error(`Failed: ${error.message}`);
      } else if (data?.success) {
        toast.success(data.message);
        fetchSuccessions();
        // Refresh the page to update admin status
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(data?.error || 'Failed to process resignation');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSuccession = async () => {
    setLoading(true);
    try {
      console.log('Processing automatic succession...');
      const { data, error } = await supabase.functions.invoke('admin-succession-fixed', {
        body: { action: 'auto_succession' },
      });

      console.log('Auto succession response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error(`Failed: ${error.message}`);
      } else if (data?.success) {
        toast.success(`Processed ${data.processed_successions} automatic successions`);
        fetchSuccessions();
        if (data.processed_successions > 0) {
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        toast.error('Failed to process automatic successions');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'designated': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'auto_completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Super Admin Succession Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Designate Successor</label>
            <p className="text-sm text-muted-foreground">
              Choose who will inherit your super admin privileges when you resign
            </p>
            <Input
              type="email"
              placeholder="Enter successor email address"
              value={successorEmail}
              onChange={(e) => setSuccessorEmail(e.target.value)}
            />
            <Button 
              onClick={handleDesignateSuccessor} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Designate Successor'}
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Button 
              onClick={handleAutoSuccession} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Processing...' : 'Process Automatic Successions'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Automatically transfers privileges from super admins who haven't logged in for 30+ days
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Succession Records</CardTitle>
        </CardHeader>
        <CardContent>
          {successions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No succession records found</p>
          ) : (
            <div className="space-y-4">
              {successions.map((succession) => (
                <div key={succession.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {succession.resigning_email} → {succession.successor_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Designated: {new Date(succession.designated_at).toLocaleDateString()}
                      </p>
                      {succession.transferred_at && (
                        <p className="text-sm text-muted-foreground">
                          Transferred: {new Date(succession.transferred_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(succession.status)}>
                      {succession.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {succession.status === 'designated' && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleProcessResignation(succession.resigning_email)}
                        disabled={loading}
                      >
                        Process Resignation
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSuccession;