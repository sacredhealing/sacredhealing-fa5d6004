-- Allow all authenticated users to view profiles (for DM search and user discovery)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);