-- Emergency Fix: Restored member visibility by breaking RLS recursion
-- Adds a SECURITY DEFINER admin-check helper and re-applies safe chat_members policies.
--
-- NOTE:
-- - We intentionally do NOT read admin role from public.profiles here.
-- - The app uses public.user_roles + public.has_role(), which is already SECURITY DEFINER.

-- 1) Create the bypass function
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.check_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;

-- 2) Apply it to the members table (and remove any recursive/conflicting policies)
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view room members for accessible rooms" ON public.chat_members;
DROP POLICY IF EXISTS "Admins can view all members" ON public.chat_members;
DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Admin_Access_Fixed" ON public.chat_members;

-- Admin + self-view (simple, no recursion)
CREATE POLICY "Admin_Access_Fixed"
ON public.chat_members
FOR SELECT
TO authenticated
USING (public.check_is_admin() OR auth.uid() = user_id);

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

-- Ensure admin INSERT/UPDATE/DELETE policy exists
DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_members;
CREATE POLICY "Admins can manage members"
ON public.chat_members
FOR ALL
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

