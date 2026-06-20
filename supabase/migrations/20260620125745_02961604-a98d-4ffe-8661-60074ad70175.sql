DROP POLICY IF EXISTS "Anyone can read active sequences" ON public.email_sequences;
CREATE POLICY "Authenticated users can read active sequences"
ON public.email_sequences
FOR SELECT
TO authenticated
USING (is_active = true);
REVOKE SELECT ON public.email_sequences FROM anon;