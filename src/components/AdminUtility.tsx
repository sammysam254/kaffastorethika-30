import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';

const AdminUtility = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { isSuperAdmin } = useAdmin();

  // Only show to super admins
  if (!isSuperAdmin) {
    return null;
  }

  const handleMakeAdmin = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('grant-admin', {
        body: { target_email: email },
      });

      if (error) {
        toast.error(`Failed: ${error.message}`);
      } else if (data?.success) {
        toast.success(`Successfully made ${email} an admin!`);
        setEmail('');
        window.location.reload();
      } else {
        toast.error(data?.error || 'Failed to make user admin');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeCurrentUserAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('grant-admin', {
        body: { target_email: 'sammyseth260@gmail.com' },
      });
      if (error) {
        toast.error(`Failed: ${error.message}`);
      } else if (data?.success) {
        toast.success('Successfully made sammyseth260@gmail.com an admin!');
        window.location.reload();
      } else {
        toast.error(data?.error || 'Failed to make user admin');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Super Admin Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            As a super admin, you can grant super admin privileges to other users. This will give them full access to all admin features including succession management and admin utilities.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Grant Super Admin Access</h3>
              <p className="text-sm text-blue-700 mb-3">
                Enter an email address to grant both admin and super admin privileges. The user will have access to all admin features.
              </p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter email address to make super admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
                <Button 
                  onClick={handleMakeAdmin} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Granting Privileges...' : 'Grant Super Admin Access'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2">Quick Actions</h3>
              <p className="text-sm text-amber-700 mb-3">
                Emergency access for approved accounts
              </p>
              <Button 
                onClick={handleMakeCurrentUserAdmin} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Processing...' : 'Grant Super Admin to sammyseth260@gmail.com'}
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Super Admin Features</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Access to all admin management features</li>
              <li>• Ability to grant admin and super admin privileges</li>
              <li>• Admin succession planning and management</li>
              <li>• Full access to admin utility tools</li>
              <li>• User management and role assignment</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUtility;