-- Allow authenticated users to view all profiles (for Community members list).
-- Keeps birth data etc. protected by other policies; this only adds SELECT for discovery.
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
