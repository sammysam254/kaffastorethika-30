-- Add super_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Make sammyseth260@gmail.com a super admin
-- First, find the user ID for this email
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Get the user ID from profiles table
    SELECT user_id INTO user_uuid 
    FROM public.profiles 
    WHERE email = 'sammyseth260@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Remove existing admin role if it exists
        DELETE FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin';
        
        -- Add super_admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_uuid, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        RAISE NOTICE 'User with email sammyseth260@gmail.com not found in profiles table';
    END IF;
END
$$;