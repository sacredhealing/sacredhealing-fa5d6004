-- ============================================
-- Fix Challenges RLS Policy
-- ============================================
-- Ensures challenges are accessible to all users (authenticated and unauthenticated)

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.challenges;

-- Create a more permissive policy that handles NULL created_by properly
CREATE POLICY "Anyone can view active challenges"
ON public.challenges FOR SELECT
USING (
  is_active = true OR 
  (auth.uid() IS NOT NULL AND auth.uid() = created_by)
);

-- Also ensure challenge_participants policy allows viewing counts
DROP POLICY IF EXISTS "Users can view challenge participants" ON public.challenge_participants;

-- More permissive policy for viewing participant counts (needed for challenge cards)
-- Allow viewing participants for active challenges so we can show participant counts
CREATE POLICY "Users can view challenge participants"
ON public.challenge_participants FOR SELECT
USING (
  -- Users can always see their own participation
  auth.uid() = user_id OR
  -- Allow viewing all participants for active challenges (for participant counts on cards)
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_participants.challenge_id
    AND c.is_active = true
  )
);

