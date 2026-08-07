-- SQI 2050 | Bhrigu Readings — Admin RLS Policy
-- Run in Supabase SQL Editor to allow admin to see ALL users' readings
-- Admin UUID: bd0b21c9-577a-450b-bb1e-21c9d0423f17

-- Drop existing select policy and replace with admin-aware version
DROP POLICY IF EXISTS "Users select own bhrigu readings" ON public.bhrigu_readings;
DROP POLICY IF EXISTS "Admin select all bhrigu readings"  ON public.bhrigu_readings;

-- Users see own readings; admin sees all
CREATE POLICY "Users select own bhrigu readings"
  ON public.bhrigu_readings FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid
  );

-- Confirm: list current policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'bhrigu_readings';
