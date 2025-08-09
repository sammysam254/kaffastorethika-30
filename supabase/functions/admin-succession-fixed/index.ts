import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const { action, resigning_user_email, successor_email } = body;

    console.log('Request body:', body);

    switch (action) {
      case 'designate_successor':
        return await designateSuccessor(admin, resigning_user_email, successor_email);
      
      case 'process_resignation':
        return await processResignation(admin, resigning_user_email);
      
      case 'auto_succession':
        return await autoSuccession(admin);
      
      case 'list_successions':
        return await listSuccessions(admin);
      
      default:
        return json({ error: 'Invalid action' }, 400);
    }
  } catch (e) {
    console.error('admin-succession error:', e);
    return json({ error: 'Internal error', details: String(e) }, 500);
  }
});

async function designateSuccessor(admin: any, resigningEmail: string, successorEmail: string) {
  try {
    console.log('Designating successor:', { resigningEmail, successorEmail });
    
    // Find both users
    const { data: users, error: usersError } = await admin.auth.admin.listUsers();
    if (usersError) {
      console.error('Users error:', usersError);
      return json({ error: 'Failed to list users' }, 500);
    }

    const resigningUser = users.users.find((u: any) => u.email === resigningEmail);
    const successorUser = users.users.find((u: any) => u.email === successorEmail);

    if (!resigningUser || !successorUser) {
      return json({ error: 'User(s) not found' }, 404);
    }

    // Verify resigning user is super admin
    const { data: roles, error: rolesError } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', resigningUser.id)
      .eq('role', 'super_admin');

    if (rolesError || !roles || roles.length === 0) {
      return json({ error: 'Only super admins can designate successors' }, 403);
    }

    // Create succession record - first try to create the table if it doesn't exist
    const { error: successionError } = await admin
      .from('admin_succession')
      .upsert({
        resigning_super_admin_id: resigningUser.id,
        successor_id: successorUser.id,
        resigning_email: resigningEmail,
        successor_email: successorEmail,
        designated_at: new Date().toISOString(),
        status: 'designated'
      }, { onConflict: 'resigning_super_admin_id' });

    if (successionError) {
      console.error('Succession error:', successionError);
      if (successionError.message?.includes('relation "admin_succession" does not exist')) {
        return json({ 
          error: 'Admin succession table not found. Please create the admin_succession table first using the Database Setup tool.',
          table_missing: true 
        }, 404);
      }
      return json({ error: 'Failed to designate successor', details: successionError.message }, 500);
    }

    return json({ 
      success: true, 
      message: `${successorEmail} designated as successor for ${resigningEmail}` 
    });
  } catch (error) {
    console.error('Error in designateSuccessor:', error);
    return json({ error: 'Internal error' }, 500);
  }
}

async function processResignation(admin: any, resigningEmail: string) {
  try {
    // Find resigning user
    const { data: users, error: usersError } = await admin.auth.admin.listUsers();
    if (usersError) return json({ error: 'Failed to list users' }, 500);

    const resigningUser = users.users.find((u: any) => u.email === resigningEmail);
    if (!resigningUser) {
      return json({ error: 'Resigning user not found' }, 404);
    }

    // Find succession record
    const { data: succession, error: successionError } = await admin
      .from('admin_succession')
      .select('*')
      .eq('resigning_super_admin_id', resigningUser.id)
      .eq('status', 'designated')
      .single();

    if (successionError) {
      if (successionError.message?.includes('relation "admin_succession" does not exist')) {
        return json({ 
          error: 'Admin succession table not found. Please create the admin_succession table first using the Database Setup tool.',
          table_missing: true 
        }, 404);
      }
      return json({ error: 'No designated successor found' }, 404);
    }

    // Transfer super admin privileges
    const transferResult = await transferSuperAdminPrivileges(admin, resigningUser.id, succession.successor_id);
    
    if (!transferResult.success) {
      return json({ error: transferResult.error }, 500);
    }

    // Update succession record
    await admin
      .from('admin_succession')
      .update({
        status: 'completed',
        transferred_at: new Date().toISOString()
      })
      .eq('id', succession.id);

    return json({ 
      success: true, 
      message: `Super admin privileges transferred from ${resigningEmail} to ${succession.successor_email}`,
      transfer_details: transferResult
    });
  } catch (error) {
    console.error('Error in processResignation:', error);
    return json({ error: 'Internal error' }, 500);
  }
}

async function autoSuccession(admin: any) {
  try {
    // Find all pending successions
    const { data: pendingSuccessions, error: pendingError } = await admin
      .from('admin_succession')
      .select('*')
      .eq('status', 'designated');

    if (pendingError) {
      if (pendingError.message?.includes('relation "admin_succession" does not exist')) {
        return json({ 
          error: 'Admin succession table not found. Please create the admin_succession table first using the Database Setup tool.',
          table_missing: true 
        }, 404);
      }
      return json({ error: 'Failed to fetch pending successions' }, 500);
    }

    const results = [];

    for (const succession of pendingSuccessions || []) {
      // Check if resigning user is still active (has logged in recently)
      const { data: resigningUserAuth } = await admin.auth.admin.getUserById(succession.resigning_super_admin_id);
      
      // If user hasn't logged in for 30 days, consider them resigned
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const lastSignIn = new Date(resigningUserAuth?.user?.last_sign_in_at || 0);
      
      if (lastSignIn < thirtyDaysAgo) {
        const transferResult = await transferSuperAdminPrivileges(
          admin, 
          succession.resigning_super_admin_id, 
          succession.successor_id
        );

        if (transferResult.success) {
          await admin
            .from('admin_succession')
            .update({
              status: 'auto_completed',
              transferred_at: new Date().toISOString()
            })
            .eq('id', succession.id);

          results.push({
            succession_id: succession.id,
            from_email: succession.resigning_email,
            to_email: succession.successor_email,
            status: 'transferred'
          });
        }
      }
    }

    return json({ 
      success: true, 
      processed_successions: results.length,
      details: results
    });
  } catch (error) {
    console.error('Error in autoSuccession:', error);
    return json({ error: 'Internal error' }, 500);
  }
}

async function transferSuperAdminPrivileges(admin: any, fromUserId: string, toUserId: string) {
  try {
    // Remove super admin role from resigning user
    const { error: removeError } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', fromUserId)
      .eq('role', 'super_admin');

    if (removeError) {
      console.error('Error removing super admin role:', removeError);
      return { success: false, error: 'Failed to remove super admin role' };
    }

    // Grant super admin role to successor
    const { error: grantError } = await admin
      .from('user_roles')
      .upsert([
        { user_id: toUserId, role: 'admin' },
        { user_id: toUserId, role: 'super_admin' }
      ], { onConflict: 'user_id,role' });

    if (grantError) {
      console.error('Error granting super admin role:', grantError);
      
      // Rollback: restore super admin role to original user
      await admin
        .from('user_roles')
        .upsert([
          { user_id: fromUserId, role: 'super_admin' }
        ], { onConflict: 'user_id,role' });
      
      return { success: false, error: 'Failed to grant super admin role' };
    }

    return { 
      success: true, 
      from_user_id: fromUserId, 
      to_user_id: toUserId 
    };
  } catch (error) {
    console.error('Error in transferSuperAdminPrivileges:', error);
    return { success: false, error: 'Transfer failed' };
  }
}

async function listSuccessions(admin: any) {
  try {
    const { data: successions, error } = await admin
      .from('admin_succession')
      .select('id, resigning_email, successor_email, status, designated_at, transferred_at')
      .order('designated_at', { ascending: false });

    if (error) {
      if (error.message?.includes('relation "admin_succession" does not exist')) {
        return json({ 
          error: 'Admin succession table not found. Please create the admin_succession table first using the Database Setup tool.',
          table_missing: true 
        }, 404);
      }
      console.error('Error fetching successions:', error);
      return json({ error: 'Failed to fetch successions' }, 500);
    }

    return json({ success: true, successions: successions || [] });
  } catch (error) {
    console.error('Error in listSuccessions:', error);
    return json({ error: 'Internal error' }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}