-- Ensure profiles RLS is strict for per-user birth data (Vedic/Jyotish).
-- The profiles table already has correct policies in the initial migration;
-- this migration drops any overly permissive policy that would let users see others' data.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove permissive policies if they were added elsewhere
DROP POLICY IF EXISTS "Allow all" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.profiles;

-- Ensure per-user policies exist (idempotent: drop then create)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
