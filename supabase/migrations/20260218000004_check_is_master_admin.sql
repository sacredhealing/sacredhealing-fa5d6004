-- ============================================================
-- Stage 1: God-Mode Security Kernel
-- ============================================================
-- Total RLS Bypass: check_is_master_admin() function
-- Rewrites chat_members and profiles policies to kill infinite recursion

-- 1) Create the master admin check function (canonical name)
CREATE OR REPLACE FUNCTION public.check_is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.check_is_master_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_is_master_admin() TO authenticated;

-- 2) Apply to chat_members (complete rewrite to kill recursion)
DO $$
BEGIN
  IF to_regclass('public.chat_members') IS NOT NULL THEN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view their own memberships" ON public.chat_members;
    DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_members;
    DROP POLICY IF EXISTS "Users can view room members for accessible rooms" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can view all members" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;
    DROP POLICY IF EXISTS "Admin_Access_Fixed" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_members;

    -- Master admin bypass (no recursion - checks user_roles directly)
    CREATE POLICY "Master_Admin_View_All"
    ON public.chat_members
    FOR SELECT
    TO authenticated
    USING (public.check_is_master_admin());

    -- Users can view their own memberships (simple, no recursion)
    CREATE POLICY "Users_View_Own_Memberships"
    ON public.chat_members
    FOR SELECT
    USING (auth.uid() = user_id);

    -- Users can view members of accessible rooms (checks chat_rooms, NOT chat_members - no recursion)
    CREATE POLICY "Users_View_Accessible_Room_Members"
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

    -- Master admin can manage all members (INSERT/UPDATE/DELETE)
    CREATE POLICY "Master_Admin_Manage_All"
    ON public.chat_members
    FOR ALL
    USING (public.check_is_master_admin())
    WITH CHECK (public.check_is_master_admin());
  END IF;
END $$;

-- 3) Apply to profiles table (admin can view/manage all)
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    -- Drop existing admin policies if any
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

    -- Master admin can view all profiles
    CREATE POLICY "Master_Admin_View_All_Profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.check_is_master_admin() OR auth.uid() = COALESCE(id, user_id));

    -- Master admin can manage all profiles
    CREATE POLICY "Master_Admin_Manage_All_Profiles"
    ON public.profiles
    FOR ALL
    USING (public.check_is_master_admin())
    WITH CHECK (public.check_is_master_admin());
  END IF;
END $$;
