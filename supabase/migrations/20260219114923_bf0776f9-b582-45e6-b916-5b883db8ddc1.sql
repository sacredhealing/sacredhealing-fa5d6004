
-- Fix: Allow admins to insert members for any user (not just themselves)
-- The existing "Users can join rooms" policy only allows users to insert rows where user_id = auth.uid()
-- Admins need to insert rows where user_id is another user's ID

-- Drop the overly restrictive insert policy
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_members;

-- Recreate: users can join rooms (insert their own membership)
CREATE POLICY "Users can join rooms"
  ON public.chat_members
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Add separate admin insert policy that allows any user_id
CREATE POLICY "Admins can add any member"
  ON public.chat_members
  FOR INSERT
  TO public
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also ensure admins can delete any membership (for remove member to work)
DROP POLICY IF EXISTS "Admins can delete members" ON public.chat_members;
CREATE POLICY "Admins can delete members"
  ON public.chat_members
  FOR DELETE
  TO public
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure users can delete their own membership (leave room)
DROP POLICY IF EXISTS "Users can leave rooms" ON public.chat_members;
CREATE POLICY "Users can leave rooms"
  ON public.chat_members
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);
