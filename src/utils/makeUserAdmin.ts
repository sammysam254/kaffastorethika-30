import { supabase } from '@/integrations/supabase/client';

export async function makeUserAdmin(userEmail: string) {
  try {
    // First, get the user's ID from their email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      return { success: false, error: authError.message };
    }

    const user = authData.users.find((u: any) => u.email === userEmail);
    
    if (!user) {
      console.error('User not found with email:', userEmail);
      return { success: false, error: 'User not found' };
    }

    console.log('Found user:', user.id);

    // Insert admin and super_admin roles
    const { data, error } = await supabase
      .from('user_roles')
      .upsert([
        { user_id: user.id, role: 'admin' },
        { user_id: user.id, role: 'super_admin' }
      ], { 
        onConflict: 'user_id,role' 
      });

    if (error) {
      console.error('Error inserting admin roles:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully added admin roles:', data);
    return { success: true, data };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Comprehensive function to make approved emails super admin with all privileges
export async function makeSammySuperAdmin() {
  const approvedEmails = ['sammyseth260@gmail.com', 'sammdev.ai@gmail.com'];
  const targetEmail = approvedEmails.find(email => email) || 'sammyseth260@gmail.com';
  const userId = 'd35cfed9-7175-4b56-9a86-0e6daecddd71';
  
  try {
    console.log('Granting all super admin privileges to:', targetEmail);
    
    // Core admin roles that exist in the system
    const coreRoles: ('admin' | 'super_admin')[] = [
      'admin',
      'super_admin'
    ];
    
    const upsertData = coreRoles.map(role => ({ 
      user_id: userId, 
      role: role 
    }));
    
    const { data, error } = await supabase
      .from('user_roles')
      .upsert(upsertData, { 
        onConflict: 'user_id,role' 
      });

    if (error) {
      console.error('Error granting super admin privileges:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully granted all super admin privileges:', data);
    return { 
      success: true, 
      data, 
      roles_granted: coreRoles,
      message: `All super admin privileges granted to ${targetEmail}`
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Emergency function using the grant-admin edge function
export async function emergencyMakeSuperAdmin() {
  try {
    console.log('Using emergency grant-admin function...');
    
    const { data, error } = await supabase.functions.invoke('grant-admin', {
      body: { target_email: 'sammyseth260@gmail.com' },
    });

    if (error) {
      console.error('Emergency function error:', error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      console.log('Emergency super admin grant successful:', data);
      return { 
        success: true, 
        data: null,
        roles_granted: ['admin', 'super_admin'] as ('admin' | 'super_admin')[],
        message: `Emergency super admin privileges granted via edge function`
      };
    } else {
      return { success: false, error: data?.error || 'Emergency function failed' };
    }

  } catch (error) {
    console.error('Emergency function unexpected error:', error);
    return { success: false, error: 'Emergency function failed' };
  }
}

// Quick function to make the specific user admin (legacy)
export async function makeUserAdminDirectly() {
  const userId = 'd35cfed9-7175-4b56-9a86-0e6daecddd71';
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .upsert([
        { user_id: userId, role: 'admin' },
        { user_id: userId, role: 'super_admin' }
      ], { 
        onConflict: 'user_id,role' 
      });

    if (error) {
      console.error('Error inserting admin roles:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully added admin roles for user:', userId);
    return { success: true, data };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}