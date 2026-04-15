-- Fix: ALL policy needs WITH CHECK for inserts/updates to work
DROP POLICY IF EXISTS "Admins can manage all granted access" ON public.admin_granted_access;

CREATE POLICY "Admins can manage all granted access"
ON public.admin_granted_access
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));