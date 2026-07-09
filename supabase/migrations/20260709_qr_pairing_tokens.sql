-- QR Sign-In Pairing Tokens
-- Run this via Lovable chat (ask Lovable to "run this SQL migration") since the
-- live Supabase project (ssygukfdbtehvtndandn) only accepts migrations through Lovable.
--
-- Purpose: lets a desktop screen show a QR code that an already-logged-in phone
-- can scan to sign the desktop in, without re-typing a password.

CREATE TABLE IF NOT EXISTS qr_pairing_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | consumed | expired
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_hash text,               -- one-time magic-link token_hash, set on confirm
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_qr_pairing_status ON qr_pairing_tokens(status, expires_at);

-- Locked down: only edge functions (using the service role key) may read/write this
-- table. No anon or authenticated client can query it directly — the frontend only
-- ever talks to the qr-pairing edge function, never to this table.
ALTER TABLE qr_pairing_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON qr_pairing_tokens
  USING (auth.role() = 'service_role');

-- Housekeeping: delete stale rows so the table doesn't grow forever.
-- (Optional: schedule this with pg_cron if the project has it enabled; otherwise
-- the edge function also opportunistically cleans up expired rows it encounters.)
CREATE OR REPLACE FUNCTION cleanup_qr_pairing_tokens()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM qr_pairing_tokens WHERE expires_at < now() - interval '30 minutes';
$$;
