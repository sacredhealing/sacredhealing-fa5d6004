-- Fix infinite recursion in chat_members RLS policy
-- The policy "Users can view room members for rooms they belong to" queries chat_members
-- within its own SELECT policy, causing infinite recursion.

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_members;

-- Replace with a non-recursive version that checks chat_rooms instead
-- Users can view members of rooms they can access (via chat_rooms visibility)
CREATE POLICY "Users can view room members for accessible rooms"
ON public.chat_members
FOR SELECT
USING (
  -- Allow if user is viewing their own membership
  auth.uid() = user_id
  OR
  -- Allow if the room is active and not locked (users can see who's in public rooms)
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_members.room_id
    AND cr.is_active = true
    AND (cr.is_locked = false OR cr.is_locked IS NULL)
  )
  OR
  -- Admins handled by separate policy, but include here for safety
  public.has_role(auth.uid(), 'admin')
);
