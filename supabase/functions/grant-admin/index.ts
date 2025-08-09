import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Only allow either super_admin callers OR self-elevation for specific approved emails
const APPROVED_SELF_ELEVATE_EMAILS = new Set([
  'sammyseth260@gmail.com',
  'sammdev.ai@gmail.com',
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail: string | undefined = body.target_email;
    const targetUserId: string | undefined = body.target_user_id;

    console.log('Grant admin request:', { targetEmail, targetUserId });

    // Special case: Allow emergency access without authentication for approved emails
    const isEmergencyAccess = targetEmail && APPROVED_SELF_ELEVATE_EMAILS.has(targetEmail);
    
    let caller = null;
    let callerIsSuperAdmin = false;

    // Only require authentication if not emergency access
    if (!isEmergencyAccess) {
      const authHeader = req.headers.get('Authorization');
      const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader ?? '' } },
      });

      const { data: userData, error: userErr } = await anon.auth.getUser();
      if (userErr || !userData?.user) {
        return json({ error: 'Not authenticated' }, 401);
      }

      caller = userData.user;
    }

    // Admin client with service role for privileged DB access
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if caller is super_admin (only for authenticated users)
    if (caller) {
      const { data: roles, error: rolesErr } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', caller.id)
        .eq('role', 'super_admin');

      callerIsSuperAdmin = !rolesErr && Array.isArray(roles) && roles.length > 0;
    }

    // Allow if caller is super_admin OR emergency access OR self-elevation for approved email
    const isSelfElevationApproved = caller && APPROVED_SELF_ELEVATE_EMAILS.has(caller.email ?? '')
      && (!targetEmail || targetEmail === caller.email);

    if (!callerIsSuperAdmin && !isSelfElevationApproved && !isEmergencyAccess) {
      return json({ error: 'Forbidden: Only super admins can grant admin privileges' }, 403);
    }

    // Resolve target user id
    let uid = targetUserId;
    if (!uid) {
      if (!targetEmail) {
        return json({ error: 'Provide target_email or target_user_id' }, 400);
      }
      // Find user by email via Admin API
      const { data: listed, error: listErr } = await admin.auth.admin.listUsers();
      if (listErr) return json({ error: 'Failed to list users', details: listErr.message }, 500);
      const found = listed.users.find((u: any) => u.email === targetEmail);
      if (!found) return json({ error: 'Target user not found' }, 404);
      uid = found.id;
    }

    // For emergency restore, always grant super_admin for approved emails
    const roles_to_grant = ['admin'];
    const isEmergencyRestore = APPROVED_SELF_ELEVATE_EMAILS.has(targetEmail || '') || isEmergencyAccess;
    
    console.log('Emergency restore check:', { targetEmail, isEmergencyRestore, isEmergencyAccess, callerIsSuperAdmin });
    
    // Grant super_admin if caller is super_admin OR it's emergency restore for approved email
    if (callerIsSuperAdmin || isEmergencyRestore) {
      roles_to_grant.push('super_admin');
      console.log('Granting super_admin role');
    }

    // Upsert roles
    const upsertData = roles_to_grant.map(role => ({ user_id: uid, role }));
    const { error: upsertErr } = await admin
      .from('user_roles')
      .upsert(upsertData, { onConflict: 'user_id,role' });

    if (upsertErr) return json({ error: 'Failed to grant roles', details: upsertErr.message }, 500);

    return json({ success: true, user_id: uid, roles: roles_to_grant });
  } catch (e) {
    console.error('grant-admin error:', e);
    return json({ error: 'Internal error', details: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
