-- Allow admins to grant/revoke Sri Yantra access from the Grant Access page
CREATE POLICY "Admins can manage sri_yantra access"
  ON public.sri_yantra_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
