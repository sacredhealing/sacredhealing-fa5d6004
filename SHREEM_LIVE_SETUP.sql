-- ============================================================
-- SHREEM BRZEE LIVE TRADING TABLES
-- Run in Supabase SQL Editor (ssygukfdbtehvtndandn)
-- ============================================================

-- 1. Add mode column to session table
ALTER TABLE shreem_brzee_session 
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'paper'
    CHECK (mode IN ('paper', 'live'));

-- 2. Add live_processed flag to signals table
ALTER TABLE shreem_brzee_signals
  ADD COLUMN IF NOT EXISTS live_processed BOOLEAN NOT NULL DEFAULT false;

-- Index for fast unprocessed signal queries
CREATE INDEX IF NOT EXISTS idx_signals_live_unprocessed 
  ON shreem_brzee_signals (live_processed, action, created_at)
  WHERE live_processed = false;

-- 3. Live trades table (real money, real transactions)
CREATE TABLE IF NOT EXISTS shreem_brzee_live_trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      TEXT NOT NULL DEFAULT 'default',
  sig             TEXT NOT NULL,          -- signal sig that triggered this
  tx_sig          TEXT,                   -- Solana transaction signature
  mint            TEXT NOT NULL,          -- token mint address
  symbol          TEXT,
  label           TEXT,                   -- whale label
  wallet          TEXT,                   -- whale wallet
  action          TEXT NOT NULL CHECK (action IN ('BUY','SELL')),
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','closed','unconfirmed','failed')),
  amount_sol      NUMERIC(18,9),          -- SOL spent on buy
  entry_price     NUMERIC(24,12),         -- SOL per token at entry
  exit_price      NUMERIC(24,12),         -- SOL per token at exit
  tokens_received NUMERIC(24,6),          -- tokens bought
  tokens_sold     NUMERIC(24,6),          -- tokens sold on close
  sol_received    NUMERIC(18,9),          -- SOL received on close
  pnl_sol         NUMERIC(18,9),          -- profit/loss in SOL
  pnl_pct         NUMERIC(10,4),          -- profit/loss %
  slippage_pct    NUMERIC(8,4),           -- actual slippage at execution
  sell_reason     TEXT,                   -- 'whale_sell_mirror' | '4h_timeout' | 'stop_loss' | 'manual'
  opened_at       TIMESTAMPTZ DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_trades_status ON shreem_brzee_live_trades (status);
CREATE INDEX IF NOT EXISTS idx_live_trades_mint ON shreem_brzee_live_trades (mint, status);
CREATE INDEX IF NOT EXISTS idx_live_trades_created ON shreem_brzee_live_trades (created_at DESC);

-- RLS: admin only for live trades
ALTER TABLE shreem_brzee_live_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admin can do all on live trades"
  ON shreem_brzee_live_trades FOR ALL
  USING (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);

-- Allow service role (edge functions) full access
CREATE POLICY IF NOT EXISTS "Service role full access"
  ON shreem_brzee_live_trades FOR ALL
  USING (auth.role() = 'service_role');

-- Enable realtime on live trades
ALTER PUBLICATION supabase_realtime ADD TABLE shreem_brzee_live_trades;

-- 4. Bot wallet config table (stores public key only — never private key)
CREATE TABLE IF NOT EXISTS shreem_bot_config (
  id              TEXT PRIMARY KEY DEFAULT 'default',
  wallet_pubkey   TEXT,                   -- Solana public key (safe to store)
  wallet_label    TEXT DEFAULT 'SQI Bot Wallet',
  balance_sol     NUMERIC(18,9) DEFAULT 0,
  balance_updated TIMESTAMPTZ,
  live_mode       BOOLEAN NOT NULL DEFAULT false,
  max_trade_sol   NUMERIC(10,4) DEFAULT 0.5,   -- max per trade
  max_exposure_pct NUMERIC(5,2) DEFAULT 50.0,  -- max % of balance in open positions
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO shreem_bot_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- RLS: admin only
ALTER TABLE shreem_bot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admin only bot config"
  ON shreem_bot_config FOR ALL
  USING (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);
CREATE POLICY IF NOT EXISTS "Service role bot config"
  ON shreem_bot_config FOR ALL
  USING (auth.role() = 'service_role');

-- Verify
SELECT 
  'shreem_brzee_session mode column' as check_name,
  column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'shreem_brzee_session' AND column_name = 'mode'
UNION ALL
SELECT 
  'shreem_brzee_signals live_processed column',
  column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'shreem_brzee_signals' AND column_name = 'live_processed'
UNION ALL
SELECT 
  'shreem_brzee_live_trades table exists',
  table_name, table_type, ''
FROM information_schema.tables 
WHERE table_name = 'shreem_brzee_live_trades';
