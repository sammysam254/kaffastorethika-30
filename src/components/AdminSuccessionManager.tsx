import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { makeSammySuperAdmin, emergencyMakeSuperAdmin } from '@/utils/makeUserAdmin';
import SuperAdminSuccession from './SuperAdminSuccession';
import DatabaseSetup from './DatabaseSetup';

const AdminSuccessionManager = () => {
  const [loading, setLoading] = useState(false);
  const { isSuperAdmin, isAdmin } = useAdmin();
  const { user } = useAuth();

  // Show emergency restore to approved super admin emails
  const approvedEmails = ['sammyseth260@gmail.com', 'sammdev.ai@gmail.com'];
  const showEmergencyRestore = isAdmin && approvedEmails.includes(user?.email || '');
  
  if (!isAdmin) {
    return null;
  }

  const handleEmergencyMakeAdmin = async () => {
    if (!confirm('Emergency action: Grant all super admin privileges to sammyseth260@gmail.com? This will grant maximum privileges.')) {
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting comprehensive super admin grant...');
      
      // Try the comprehensive local function first
      let result = await makeSammySuperAdmin();
      
      // If that fails, try the emergency edge function
      if (!result.success) {
        console.log('Local function failed, trying emergency edge function...');
        result = await emergencyMakeSuperAdmin();
      }

      if (result.success) {
        toast.success(result.message || 'All super admin privileges granted successfully!');
        console.log('Super admin grant successful:', result);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('Both methods failed:', result.error);
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Unexpected error during super admin grant:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Admin Succession System
            {isSuperAdmin ? (
              <Badge variant="outline">Super Admin Only</Badge>
            ) : (
              <Badge variant="destructive">Emergency Access Required</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage automatic transfer of super admin privileges when admins resign or become inactive.
          </p>
          
          <div className="space-y-4">
            {isSuperAdmin && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">How it works:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Designate a successor who will inherit your super admin privileges</li>
                  <li>• When you resign, manually trigger the transfer process</li>
                  <li>• Automatic succession occurs if you're inactive for 30+ days</li>
                  <li>• Only one active succession plan per super admin</li>
                </ul>
              </div>
            )}

            {!isSuperAdmin && showEmergencyRestore && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">Super Admin Required</h3>
                <p className="text-sm text-red-700 mb-3">
                  You need super admin privileges to use the succession system. Use the emergency restore button below to upgrade your privileges.
                </p>
              </div>
            )}

            {(isSuperAdmin || showEmergencyRestore) && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Grant All Super Admin Privileges</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Grant comprehensive super admin access including all special privileges and roles.
                </p>
                <Button 
                  onClick={handleEmergencyMakeAdmin} 
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  {loading ? 'Granting All Privileges...' : 'Grant All Super Admin Privileges'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DatabaseSetup />
      {isSuperAdmin && <SuperAdminSuccession />}
    </div>
  );
};

export default AdminSuccessionManager;