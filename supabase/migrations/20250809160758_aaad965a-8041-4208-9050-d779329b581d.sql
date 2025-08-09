-- Make sammyseth260@gmail.com a super admin
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
        
        RAISE NOTICE 'Successfully made user % a super admin', user_uuid;
    ELSE
        RAISE NOTICE 'User with email sammyseth260@gmail.com not found in profiles table';
    END IF;
END
$$;