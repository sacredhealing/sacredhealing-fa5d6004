
-- Fix the self-referencing SELECT policy that causes infinite recursion
-- "Users can view room members for rooms they belong to" queries chat_members FROM a chat_members policy = recursion

DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_members;

-- Replace with a simpler non-recursive policy:
-- Users can see members of rooms they themselves belong to (checked via their own membership row)
-- We use auth.uid() = user_id (own rows) OR admin check to avoid recursion
-- The admin SELECT is already covered by "Admins can manage members" (FOR ALL)

-- Allow users to see all members in a room if they are a member themselves
-- Use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE room_id = _room_id AND user_id = auth.uid()
  )
$$;

-- Allow members of a room to see all other members (non-recursive via security definer fn)
CREATE POLICY "Members can view room members"
  ON public.chat_members
  FOR SELECT
  TO public
  USING (public.is_room_member(room_id) OR public.has_role(auth.uid(), 'admin'));
