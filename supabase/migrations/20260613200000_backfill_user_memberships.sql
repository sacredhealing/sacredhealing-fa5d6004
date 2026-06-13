-- MIGRATION: Backfill user_memberships from profiles.membership_tier
-- Fixes: all paying users who have tier in profiles but no row in user_memberships
-- Result: useMembership primary query works correctly for all users
-- Run: 2026-06-13 — fixes black screen / locked chat for all non-admin users

-- Step 1: Ensure membership_tiers has the canonical slugs
INSERT INTO public.membership_tiers (slug, name, price_monthly, price_yearly)
VALUES
  ('prana-flow',      'Prana-Flow',      19,    NULL),
  ('siddha-quantum',  'Siddha-Quantum',  45,    NULL),
  ('akasha-infinity', 'Akasha-Infinity', NULL,  1111)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Backfill user_memberships from profiles.membership_tier
-- For every user who has a non-free tier in profiles but no active user_memberships row
INSERT INTO public.user_memberships (user_id, tier_id, status, expires_at, created_at)
SELECT
  COALESCE(p.id, p.user_id) AS uid,
  mt.id AS tier_id,
  'active' AS status,
  '2099-12-31 23:59:59+00' AS expires_at,
  NOW() AS created_at
FROM public.profiles p
JOIN public.membership_tiers mt
  ON mt.slug = p.membership_tier
WHERE
  p.membership_tier IS NOT NULL
  AND p.membership_tier NOT IN ('free', '', 'Free')
  AND COALESCE(p.id, p.user_id) IS NOT NULL
  -- Only insert if no active row already exists
  AND NOT EXISTS (
    SELECT 1 FROM public.user_memberships um
    WHERE um.user_id = COALESCE(p.id, p.user_id)
      AND um.status = 'active'
  )
ON CONFLICT (user_id, tier_id) DO UPDATE
  SET status = 'active',
      expires_at = '2099-12-31 23:59:59+00';

-- Step 3: Also backfill from admin_granted_access
INSERT INTO public.user_memberships (user_id, tier_id, status, expires_at, created_at)
SELECT
  aga.user_id,
  mt.id AS tier_id,
  'active',
  '2099-12-31 23:59:59+00',
  NOW()
FROM public.admin_granted_access aga
JOIN public.membership_tiers mt
  ON mt.slug = aga.tier
WHERE
  aga.is_active = true
  AND aga.access_type = 'membership'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_memberships um
    WHERE um.user_id = aga.user_id AND um.status = 'active'
  )
ON CONFLICT (user_id, tier_id) DO UPDATE
  SET status = 'active', expires_at = '2099-12-31 23:59:59+00';

-- Verify: show count of backfilled rows
SELECT COUNT(*) AS total_active_memberships FROM public.user_memberships WHERE status = 'active';
