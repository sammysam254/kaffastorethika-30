-- Allow users to read their own roles (and let admins/super_admins read as well)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)  
  OR has_role(auth.uid(), 'super_admin'::app_role)
);