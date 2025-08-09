-- Clean up all existing users and reset authentication
-- This will allow fresh user registration

-- Delete all user-related data in reverse dependency order
DELETE FROM public.voucher_usage;
DELETE FROM public.support_ticket_messages;
DELETE FROM public.support_tickets;
DELETE FROM public.feedback;
DELETE FROM public.order_items;
DELETE FROM public.mpesa_payments;
DELETE FROM public.ncba_loop_payments;
DELETE FROM public.orders;
DELETE FROM public.flash_sales;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- Note: We cannot directly delete from auth.users table as it's managed by Supabase Auth
-- Users will need to be deleted through the Supabase dashboard if needed

-- Reset any auto-increment sequences if they exist
-- (Not applicable here as we use UUIDs)

-- Ensure the profiles trigger is working correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile with email from auth.users
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix any RLS policies that might be causing issues
-- Ensure users can always create their own profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow anyone to view basic profile info (needed for display names, etc.)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Ensure the update timestamp function exists and works
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to profiles if it doesn't exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();