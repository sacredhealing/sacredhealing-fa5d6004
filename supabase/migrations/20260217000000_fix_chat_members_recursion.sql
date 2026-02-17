-- Fix infinite recursion in chat_members RLS policy
-- The policy "Users can view room members for rooms they belong to" queries chat_members
-- within its own SELECT policy, causing infinite recursion.

-- Drop ALL existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view room members for accessible rooms" ON public.chat_members;
DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;

-- Recreate SELECT policies in correct order (admin first, then user policies)
-- Admin bypass: Admins can see ALL members (no recursion, checks user_roles directly)
CREATE POLICY "Admins can view all chat members"
ON public.chat_members
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own memberships (simple, no recursion)
CREATE POLICY "Users can view their own memberships"
ON public.chat_members
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view members of accessible rooms (checks chat_rooms, NOT chat_members - no recursion)
CREATE POLICY "Users can view room members for accessible rooms"
ON public.chat_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_members.room_id
    AND cr.is_active = true
    AND (cr.is_locked = false OR cr.is_locked IS NULL)
  )
);

-- Ensure admin INSERT/UPDATE/DELETE policy exists (should already exist, but ensure it's correct)
DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_members;
CREATE POLICY "Admins can manage members"
ON public.chat_members
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
