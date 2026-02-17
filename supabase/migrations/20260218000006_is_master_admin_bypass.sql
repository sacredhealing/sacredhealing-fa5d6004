-- ============================================================
-- Stage 1: Master Admin Bypass (Total RLS Bypass)
-- ============================================================
-- Creates is_master_admin() function that bypasses RLS by checking profiles.role directly
-- Applies universal admin access to chat_members and community groups

-- 1) Create the Master Bypass Function
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Try profiles.id = auth.uid() schema (if profiles.id references auth.users)
  BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    IF v_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN undefined_column OR undefined_table OR invalid_text_representation THEN
    -- ignore and try next
  END;

  -- Try profiles.user_id = auth.uid() schema (canonical in this repo)
  BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE user_id = auth.uid();
    IF v_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN undefined_column OR undefined_table OR invalid_text_representation THEN
    -- ignore and fall back
  END;

  -- Fallback: Use canonical role system (user_roles table)
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

REVOKE ALL ON FUNCTION public.is_master_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO authenticated;

-- 2) Force chat_members to respect Master Admin
DO $$
BEGIN
  IF to_regclass('public.chat_members') IS NOT NULL THEN
    ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing admin policies
    DROP POLICY IF EXISTS "admin_universal_access" ON public.chat_members;
    DROP POLICY IF EXISTS "Master_Admin_View_All" ON public.chat_members;
    DROP POLICY IF EXISTS "Master_Admin_Manage_All" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_members;
    
    -- Create universal admin access policy
    CREATE POLICY "admin_universal_access" 
    ON public.chat_members 
    FOR ALL 
    TO authenticated 
    USING (public.is_master_admin() OR auth.uid() = user_id)
    WITH CHECK (public.is_master_admin() OR auth.uid() = user_id);
  END IF;
END $$;

-- 3) Sync the Groups (check if community_groups exists, otherwise use chat_rooms)
DO $$
BEGIN
  -- Try community_groups first
  IF to_regclass('public.community_groups') IS NOT NULL THEN
    DROP POLICY IF EXISTS "group_master_access" ON public.community_groups;
    CREATE POLICY "group_master_access" 
    ON public.community_groups 
    FOR ALL 
    TO authenticated 
    USING (public.is_master_admin() OR is_private = false)
    WITH CHECK (public.is_master_admin() OR is_private = false);
  END IF;

  -- Also apply to chat_rooms (the actual table used in this app)
  IF to_regclass('public.chat_rooms') IS NOT NULL THEN
    DROP POLICY IF EXISTS "room_master_access" ON public.chat_rooms;
    CREATE POLICY "room_master_access" 
    ON public.chat_rooms 
    FOR ALL 
    TO authenticated 
    USING (public.is_master_admin() OR is_active = true)
    WITH CHECK (public.is_master_admin());
  END IF;
END $$;
