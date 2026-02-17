-- ============================================================
-- Siddha Core: Admin God-Mode (non-recursive master check)
-- ============================================================
-- Goal:
-- - Provide a SECURITY DEFINER admin check that lives "outside" RLS evaluation loops
-- - Avoid any policies that query the same protected table (recursion)
-- - Work with the project's canonical role system: public.user_roles + public.has_role()
-- - Also provide a compatibility alias: public.is_shiva_admin()

-- 1) Master admin check (canonical)
CREATE OR REPLACE FUNCTION public.fn_admin_master_check()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.fn_admin_master_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_admin_master_check() TO authenticated;

-- 2) Compatibility alias for the SQL you provided (robust across schema variations)
CREATE OR REPLACE FUNCTION public.is_shiva_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Try legacy schema: profiles.id = auth.uid() and profiles.role exists
  BEGIN
    EXECUTE 'SELECT role FROM public.profiles WHERE id = auth.uid()' INTO v_role;
    IF v_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN undefined_column OR undefined_table THEN
    -- ignore and fall back
  END;

  -- Try main schema in this repo: profiles.user_id = auth.uid()
  BEGIN
    EXECUTE 'SELECT role FROM public.profiles WHERE user_id = auth.uid()' INTO v_role;
    IF v_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN undefined_column OR undefined_table THEN
    -- ignore and fall back
  END;

  -- Canonical admin check
  RETURN public.fn_admin_master_check();
END;
$$;

REVOKE ALL ON FUNCTION public.is_shiva_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_shiva_admin() TO authenticated;

-- 3) Apply to core community tables (safe patterns only)
-- chat_members is handled by dedicated recursion fix migrations, but ensure admin policies
-- can use the master check name going forward.
DO $$
BEGIN
  IF to_regclass('public.chat_rooms') IS NOT NULL THEN
    -- Admins should be able to see/manage all rooms (even inactive)
    DROP POLICY IF EXISTS "Admins can view all rooms" ON public.chat_rooms;
    CREATE POLICY "Admins can view all rooms"
      ON public.chat_rooms FOR SELECT
      USING (public.fn_admin_master_check());
  END IF;

  IF to_regclass('public.chat_members') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;
    CREATE POLICY "Admins can view all chat members"
    ON public.chat_members
    FOR SELECT
    USING (public.fn_admin_master_check());

    DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_members;
    CREATE POLICY "Admins can manage members"
    ON public.chat_members
    FOR ALL
    USING (public.fn_admin_master_check())
    WITH CHECK (public.fn_admin_master_check());
  END IF;

  IF to_regclass('public.stargate_community_members') IS NOT NULL THEN
    -- stargate_community_members: admin management
    DROP POLICY IF EXISTS "Admins can manage stargate community members" ON public.stargate_community_members;
    CREATE POLICY "Admins can manage stargate community members"
      ON public.stargate_community_members FOR ALL
      USING (public.fn_admin_master_check())
      WITH CHECK (public.fn_admin_master_check());
  END IF;

  IF to_regclass('public.community_polls') IS NOT NULL THEN
    -- community_polls: admin management
    DROP POLICY IF EXISTS "Admins can create and manage polls" ON public.community_polls;
    CREATE POLICY "Admins can create and manage polls"
      ON public.community_polls FOR ALL
      USING (public.fn_admin_master_check())
      WITH CHECK (public.fn_admin_master_check());
  END IF;

  IF to_regclass('public.community_poll_options') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can manage poll options" ON public.community_poll_options;
    CREATE POLICY "Admins can manage poll options"
      ON public.community_poll_options FOR ALL
      USING (public.fn_admin_master_check())
      WITH CHECK (public.fn_admin_master_check());
  END IF;
END $$;

