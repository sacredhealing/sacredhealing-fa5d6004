-- ============================================================
-- SQI 2050 Stripe Infrastructure Fix — Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Add stripe_connect_id to affiliate_profiles ──────────────────────────
ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- ── 2. Add stripe_transfer_id to payout requests ────────────────────────────
ALTER TABLE affiliate_payout_requests
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES auth.users(id);

-- ── 3. Ensure affiliate_payout_accounts table exists (Stripe Connect) ────────
CREATE TABLE IF NOT EXISTS affiliate_payout_accounts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_connect_account_id TEXT UNIQUE,
  account_status            TEXT NOT NULL DEFAULT 'pending'
                            CHECK (account_status IN ('pending', 'active', 'restricted', 'disabled')),
  country                   TEXT NOT NULL DEFAULT 'SE',
  currency                  TEXT NOT NULL DEFAULT 'eur',
  payout_method             TEXT NOT NULL DEFAULT 'bank',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for affiliate_payout_accounts
ALTER TABLE affiliate_payout_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payout_accounts_select_own" ON affiliate_payout_accounts;
DROP POLICY IF EXISTS "payout_accounts_insert_own" ON affiliate_payout_accounts;
DROP POLICY IF EXISTS "payout_accounts_update_own" ON affiliate_payout_accounts;

CREATE POLICY "payout_accounts_select_own"
  ON affiliate_payout_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "payout_accounts_insert_own"
  ON affiliate_payout_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payout_accounts_update_own"
  ON affiliate_payout_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- ── 4. Sync stripe_connect_id from affiliate_payout_accounts → affiliate_profiles ──
-- Run once to backfill existing accounts
UPDATE affiliate_profiles ap
SET stripe_connect_id = apa.stripe_connect_account_id
FROM affiliate_payout_accounts apa
WHERE ap.user_id = apa.user_id
  AND apa.stripe_connect_account_id IS NOT NULL;

-- ── 5. Admin policy for affiliate_payout_requests ───────────────────────────
-- Allow admin to see all payout requests
DROP POLICY IF EXISTS "affiliate_payouts_admin_all" ON affiliate_payout_requests;
CREATE POLICY "affiliate_payouts_admin_all"
  ON affiliate_payout_requests
  USING (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);

-- ── 6. Admin policy for affiliate_commissions ───────────────────────────────
DROP POLICY IF EXISTS "affiliate_commissions_admin_all" ON affiliate_commissions;
CREATE POLICY "affiliate_commissions_admin_all"
  ON affiliate_commissions
  USING (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);

-- ── 7. Admin policy for affiliate_profiles ──────────────────────────────────
DROP POLICY IF EXISTS "affiliate_profiles_admin_all" ON affiliate_profiles;
CREATE POLICY "affiliate_profiles_admin_all"
  ON affiliate_profiles
  USING (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);

-- ── 8. Verify ────────────────────────────────────────────────────────────────
-- SELECT * FROM affiliate_profiles LIMIT 3;
-- SELECT * FROM affiliate_payout_requests LIMIT 3;
-- SELECT * FROM affiliate_payout_accounts LIMIT 3;
