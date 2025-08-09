-- Add admin user for sammyseth260@gmail.com
-- This function will be executed once the user signs up

CREATE OR REPLACE FUNCTION add_admin_role_for_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get user_id for sammyseth260@gmail.com from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'sammyseth260@gmail.com';
    
    -- If user exists, add admin role
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role added for user %', target_user_id;
    ELSE
        RAISE NOTICE 'User sammyseth260@gmail.com not found in auth.users';
    END IF;
END;
$$;

-- Execute the function
SELECT add_admin_role_for_user();

-- Clean up the function
DROP FUNCTION add_admin_role_for_user();