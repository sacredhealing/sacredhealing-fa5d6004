-- Add Jyotish profile columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS lagna TEXT,
  ADD COLUMN IF NOT EXISTS moon_sign TEXT,
  ADD COLUMN IF NOT EXISTS current_dasha TEXT,
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS birth_time TEXT;

-- RLS: users can update their own jyotish fields
CREATE POLICY IF NOT EXISTS "users_update_own_jyotish" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
