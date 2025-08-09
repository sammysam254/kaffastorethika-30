import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';

const DatabaseSetup = () => {
  const [loading, setLoading] = useState(false);
  const { isSuperAdmin } = useAdmin();

  if (!isSuperAdmin) {
    return null;
  }

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // Test if the admin succession function is working
      const { data, error } = await supabase.functions.invoke('admin-succession', {
        body: { action: 'list_successions' }
      });

      if (error) {
        if (error.message?.includes('relation "admin_succession" does not exist')) {
          toast.error('Admin succession table does not exist. Please create it manually using the SQL provided below.');
        } else {
          toast.error(`Function error: ${error.message}`);
        }
      } else {
        toast.success('Admin succession system is working correctly!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to test admin succession system.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Database Setup
          <Badge variant="outline">Super Admin Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Set up required database tables for admin succession system.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Admin Succession Table</h3>
            <p className="text-sm text-blue-700 mb-3">
              Creates the admin_succession table required for managing super admin succession.
            </p>
            <Button 
              onClick={handleTestConnection} 
              disabled={loading}
              size="sm"
            >
              {loading ? 'Testing...' : 'Test Admin Succession System'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Manual Setup Instructions</h3>
            <p className="text-sm text-muted-foreground mb-3">
              If automatic creation fails, you can manually run this SQL in your Supabase dashboard:
            </p>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 overflow-x-auto">
              {`CREATE TABLE IF NOT EXISTS admin_succession (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resigning_super_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resigning_email TEXT NOT NULL,
  successor_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('designated', 'completed', 'auto_completed')) DEFAULT 'designated',
  designated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resigning_super_admin_id)
);

ALTER TABLE admin_succession ENABLE ROW LEVEL SECURITY;`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetup;