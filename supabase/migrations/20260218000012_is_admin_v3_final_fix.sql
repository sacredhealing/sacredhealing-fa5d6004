-- ============================================================
-- CRITICAL: Break RLS Recursion & Restore Member Visibility
-- ============================================================
-- Creates is_admin_v3() with SECURITY DEFINER that queries profiles.role directly
-- This bypasses ALL RLS policies during the check, breaking infinite recursion

-- 1) Create the God-Mode Bypass Function (Tesla-level direct fix)
CREATE OR REPLACE FUNCTION public.is_admin_v3()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Direct query to profiles table - bypasses ALL RLS during check
  -- Try profiles.user_id = auth.uid() first (canonical schema)
  BEGIN
    SELECT role INTO v_role 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    IF v_role = 'admin' THEN
      RETURN true;
    END IF;
  EXCEPTION 
    WHEN undefined_column OR undefined_table OR invalid_text_representation THEN
      -- Try profiles.id = auth.uid() as fallback
      BEGIN
        SELECT role INTO v_role 
        FROM public.profiles 
        WHERE id = auth.uid()
        LIMIT 1;
        
        IF v_role = 'admin' THEN
          RETURN true;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Final fallback: use user_roles table
        RETURN public.has_role(auth.uid(), 'admin');
      END;
    WHEN OTHERS THEN
      -- Fallback: use user_roles table
      RETURN public.has_role(auth.uid(), 'admin');
  END;
  
  -- Final fallback if no role found
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_v3() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_v3() TO authenticated;

-- 2) Nuke ALL existing broken policies on chat_members
DO $$
BEGIN
  IF to_regclass('public.chat_members') IS NOT NULL THEN
    -- Drop every possible policy name that might exist
    DROP POLICY IF EXISTS "Admins can view all" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can view all members" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;
    DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_members;
    DROP POLICY IF EXISTS "Admin_Access_Fixed" ON public.chat_members;
    DROP POLICY IF EXISTS "admin_universal_access" ON public.chat_members;
    DROP POLICY IF EXISTS "Master_Admin_View_All" ON public.chat_members;
    DROP POLICY IF EXISTS "Master_Admin_Manage_All" ON public.chat_members;
    DROP POLICY IF EXISTS "chat_members_admin_policy" ON public.chat_members;
    DROP POLICY IF EXISTS "Users can view their own memberships" ON public.chat_members;
    DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_members;
    DROP POLICY IF EXISTS "Users can view room members for accessible rooms" ON public.chat_members;
    DROP POLICY IF EXISTS "Users_View_Own_Memberships" ON public.chat_members;
    DROP POLICY IF EXISTS "Users_View_Accessible_Room_Members" ON public.chat_members;
    
    -- 3) Install the God-Mode policy (simple, no recursion)
    CREATE POLICY "God_Mode_Member_Visibility" 
    ON public.chat_members
    FOR SELECT 
    TO authenticated
    USING (public.is_admin_v3() OR auth.uid() = user_id);
    
    -- 4) Admin can manage all (INSERT/UPDATE/DELETE)
    CREATE POLICY "God_Mode_Member_Management"
    ON public.chat_members
    FOR ALL
    TO authenticated
    USING (public.is_admin_v3() OR auth.uid() = user_id)
    WITH CHECK (public.is_admin_v3() OR auth.uid() = user_id);
    
    -- 5) Users can view members of accessible rooms (checks chat_rooms, NOT chat_members - no recursion)
    CREATE POLICY "Users_View_Accessible_Room_Members"
    ON public.chat_members
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.chat_rooms cr
        WHERE cr.id = chat_members.room_id
          AND cr.is_active = true
          AND (cr.is_locked = false OR cr.is_locked IS NULL)
      )
    );
  END IF;
END $$;

-- Comment
COMMENT ON FUNCTION public.is_admin_v3() IS 'God-Mode Bypass: Queries profiles.role directly, bypassing ALL RLS. Breaks infinite recursion.';
