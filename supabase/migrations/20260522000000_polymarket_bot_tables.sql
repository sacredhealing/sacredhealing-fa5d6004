-- Polymarket Bot tables for standalone Supabase project
-- Created: 2026-05-22

CREATE TABLE IF NOT EXISTS polymarket_bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_balance numeric NOT NULL DEFAULT 10.00,
  paper_mode boolean NOT NULL DEFAULT true,
  risk_pct numeric NOT NULL DEFAULT 0.05,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO polymarket_bot_settings (paper_balance, paper_mode, risk_pct)
SELECT 10.00, true, 0.05
WHERE NOT EXISTS (SELECT 1 FROM polymarket_bot_settings LIMIT 1);

CREATE TABLE IF NOT EXISTS polymarket_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text,
  market_question text,
  outcome text,
  token_id text,
  direction text CHECK (direction IN ('buy', 'sell')),
  shares numeric,
  entry_price numeric,
  amount_usdc numeric,
  tx_hash text,
  strategy text,
  is_paper boolean DEFAULT true,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poly_trades_created ON polymarket_trades (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poly_trades_strategy ON polymarket_trades (strategy);

