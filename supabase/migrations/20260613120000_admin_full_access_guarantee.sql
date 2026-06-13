-- ============================================================
-- ADMIN FULL ACCESS — Kritagya Das (bd0b21c9-577a-450b-bb1e-21c9d0423f17)
-- Covers all 3 admin check paths: user_roles, profiles.role, admin_granted_access
-- ============================================================

DO $$
DECLARE
  v_admin_uuid uuid := 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';
BEGIN

  -- ── 1. user_roles table (has_role RPC primary path) ──────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_admin_uuid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'user_roles: admin row ensured';
  END IF;

  -- ── 2. profiles.role (is_admin_v3 fallback path) ─────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- profiles keyed by id
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
      UPDATE public.profiles SET role = 'admin' WHERE id = v_admin_uuid;
      IF NOT FOUND THEN
        INSERT INTO public.profiles (id, role)
        VALUES (v_admin_uuid, 'admin')
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
      END IF;
    END IF;
    -- profiles keyed by user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
      UPDATE public.profiles SET role = 'admin' WHERE user_id = v_admin_uuid;
    END IF;
    RAISE NOTICE 'profiles.role: admin set';
  END IF;

  -- ── 3. profiles.membership_tier = akasha-infinity ────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_tier'
  ) THEN
    UPDATE public.profiles
    SET membership_tier = 'akasha-infinity'
    WHERE id = v_admin_uuid OR (
      EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='profiles' AND column_name='user_id')
      AND user_id = v_admin_uuid
    );
    RAISE NOTICE 'profiles.membership_tier: akasha-infinity set';
  END IF;

  -- ── 4. admin_granted_access — membership tier ────────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_granted_access'
  ) THEN
    -- Deactivate any stale rows
    UPDATE public.admin_granted_access
    SET is_active = false
    WHERE user_id = v_admin_uuid
      AND access_type = 'membership'
      AND (tier != 'akasha-infinity' OR tier IS NULL);

    -- Insert akasha-infinity if not exists
    INSERT INTO public.admin_granted_access (
      user_id, access_type, tier, access_id, is_active, granted_by, granted_at
    )
    SELECT
      v_admin_uuid,
      'membership',
      'akasha-infinity',
      'akasha-infinity',
      true,
      v_admin_uuid,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.admin_granted_access
      WHERE user_id = v_admin_uuid
        AND access_type = 'membership'
        AND tier = 'akasha-infinity'
        AND is_active = true
    );
    RAISE NOTICE 'admin_granted_access: akasha-infinity ensured';
  END IF;

  -- ── 5. user_memberships table (useMembership primary fetch) ──────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_memberships'
  ) THEN
    -- Find the akasha-infinity tier id
    DECLARE
      v_tier_id uuid;
    BEGIN
      SELECT id INTO v_tier_id
      FROM public.membership_tiers
      WHERE slug = 'akasha-infinity'
      LIMIT 1;

      IF v_tier_id IS NOT NULL THEN
        INSERT INTO public.user_memberships (
          user_id, tier_id, status, expires_at, created_at
        )
        VALUES (
          v_admin_uuid, v_tier_id, 'active', '2099-12-31 23:59:59+00', NOW()
        )
        ON CONFLICT (user_id, tier_id) DO UPDATE
          SET status = 'active', expires_at = '2099-12-31 23:59:59+00';
        RAISE NOTICE 'user_memberships: akasha-infinity row upserted';
      ELSE
        RAISE NOTICE 'user_memberships: akasha-infinity tier id not found — skipping';
      END IF;
    END;
  END IF;

END $$;

-- ── 6. Laila admin access (co-founder) ───────────────────────────────────
DO $$
DECLARE
  v_laila_uuid uuid;
BEGIN
  SELECT id INTO v_laila_uuid
  FROM auth.users
  WHERE email = 'laila.amrouche@gmail.com'
  LIMIT 1;

  IF v_laila_uuid IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_laila_uuid, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'admin_granted_access') THEN
      INSERT INTO public.admin_granted_access (
        user_id, access_type, tier, access_id, is_active, granted_by, granted_at
      )
      SELECT v_laila_uuid, 'membership', 'akasha-infinity', 'akasha-infinity', true,
             'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.admin_granted_access
        WHERE user_id = v_laila_uuid AND access_type = 'membership'
          AND tier = 'akasha-infinity' AND is_active = true
      );
    END IF;
    RAISE NOTICE 'Laila admin access ensured: %', v_laila_uuid;
  ELSE
    RAISE NOTICE 'Laila user not found — skipping';
  END IF;
END $$;
