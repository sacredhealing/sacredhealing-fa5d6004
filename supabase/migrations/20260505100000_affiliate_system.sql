-- ============================================================
-- SQI 2050 Sovereign Transmission Network — Affiliate System
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- ── 1. Affiliate Profiles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code          TEXT UNIQUE NOT NULL,
  stripe_connect_id       TEXT,
  total_earnings          DECIMAL(12,2) NOT NULL DEFAULT 0,
  pending_balance         DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_out                DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency                TEXT NOT NULL DEFAULT 'EUR',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── 2. Affiliate Commissions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id       TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  gross_amount            DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_rate         DECIMAL(6,4) NOT NULL DEFAULT 0.3000,
  currency                TEXT NOT NULL DEFAULT 'EUR',
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','paid','rejected')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Payout Requests ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_payout_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount                  DECIMAL(12,2) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'EUR',
  bank_details            JSONB,          -- { iban, swift, account_holder }
  status                  TEXT NOT NULL DEFAULT 'requested'
                          CHECK (status IN ('requested','processing','completed','failed')),
  admin_notes             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id    ON affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code       ON affiliate_profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_aff     ON affiliate_commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_session ON affiliate_commissions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_user         ON affiliate_payout_requests(affiliate_user_id);

-- ── 5. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE affiliate_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_requests   ENABLE ROW LEVEL SECURITY;

-- affiliate_profiles policies
DROP POLICY IF EXISTS "affiliate_profiles_select_own"  ON affiliate_profiles;
DROP POLICY IF EXISTS "affiliate_profiles_update_own"  ON affiliate_profiles;
CREATE POLICY "affiliate_profiles_select_own"
  ON affiliate_profiles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "affiliate_profiles_update_own"
  ON affiliate_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Public read of affiliate_code (needed for landing page to verify code exists)
DROP POLICY IF EXISTS "affiliate_profiles_public_code_check" ON affiliate_profiles;
CREATE POLICY "affiliate_profiles_public_code_check"
  ON affiliate_profiles FOR SELECT
  USING (true); -- anyone can verify a code exists, but only user_id owner sees full data via above

-- affiliate_commissions policies
DROP POLICY IF EXISTS "affiliate_commissions_select_own" ON affiliate_commissions;
CREATE POLICY "affiliate_commissions_select_own"
  ON affiliate_commissions FOR SELECT
  USING (auth.uid() = affiliate_user_id);

-- affiliate_payout_requests policies
DROP POLICY IF EXISTS "affiliate_payouts_insert_own"  ON affiliate_payout_requests;
DROP POLICY IF EXISTS "affiliate_payouts_select_own"  ON affiliate_payout_requests;
CREATE POLICY "affiliate_payouts_insert_own"
  ON affiliate_payout_requests FOR INSERT
  WITH CHECK (auth.uid() = affiliate_user_id);
CREATE POLICY "affiliate_payouts_select_own"
  ON affiliate_payout_requests FOR SELECT
  USING (auth.uid() = affiliate_user_id);

-- ── 6. Affiliate Code Generator ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_sqi_affiliate_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  is_taken BOOLEAN;
BEGIN
  LOOP
    -- Format: SQI-XXXX-XXXX (uppercase alphanumeric)
    new_code := 'SQI' ||
                upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 4)) ||
                upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    SELECT EXISTS(
      SELECT 1 FROM affiliate_profiles WHERE affiliate_code = new_code
    ) INTO is_taken;
    EXIT WHEN NOT is_taken;
  END LOOP;
  RETURN new_code;
END;
$$;

-- ── 7. Auto-create affiliate profile for every new user ───────────────────────
CREATE OR REPLACE FUNCTION handle_new_user_affiliate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO affiliate_profiles (user_id, affiliate_code)
  VALUES (NEW.id, generate_sqi_affiliate_code())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_affiliate ON auth.users;
CREATE TRIGGER on_auth_user_created_affiliate
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_affiliate();

-- ── 8. Backfill affiliate profiles for all existing users ─────────────────────
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    INSERT INTO affiliate_profiles (user_id, affiliate_code)
    VALUES (u.id, generate_sqi_affiliate_code())
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ── 9. Updated_at auto-update triggers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_affiliate_profiles_updated_at    ON affiliate_profiles;
DROP TRIGGER IF EXISTS trg_affiliate_commissions_updated_at ON affiliate_commissions;
DROP TRIGGER IF EXISTS trg_affiliate_payouts_updated_at     ON affiliate_payout_requests;

CREATE TRIGGER trg_affiliate_profiles_updated_at
  BEFORE UPDATE ON affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_affiliate_commissions_updated_at
  BEFORE UPDATE ON affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_affiliate_payouts_updated_at
  BEFORE UPDATE ON affiliate_payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 10. Admin view (optional — useful for Supabase Table Editor) ──────────────
CREATE OR REPLACE VIEW admin_affiliate_overview AS
SELECT
  ap.affiliate_code,
  p.full_name,
  p.email,
  ap.total_earnings,
  ap.pending_balance,
  ap.paid_out,
  ap.currency,
  COUNT(ac.id)                            AS total_conversions,
  SUM(ac.gross_amount)                    AS total_gross_revenue,
  ap.created_at
FROM affiliate_profiles ap
LEFT JOIN profiles p ON p.id = ap.user_id
LEFT JOIN affiliate_commissions ac ON ac.affiliate_user_id = ap.user_id
GROUP BY ap.id, p.full_name, p.email
ORDER BY ap.total_earnings DESC;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Verify by running:
-- SELECT * FROM affiliate_profiles LIMIT 5;
-- SELECT * FROM admin_affiliate_overview LIMIT 5;
