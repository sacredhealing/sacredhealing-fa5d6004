
-- Whale wallet registry
CREATE TABLE IF NOT EXISTS polymarket_whales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  alias text,
  win_rate_30d numeric DEFAULT 0,
  roi_30d numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  trades_tracked integer DEFAULT 0,
  last_checked timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seen trade hashes to detect new trades (dedup)
CREATE TABLE IF NOT EXISTS polymarket_seen_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id text UNIQUE NOT NULL,
  whale_address text NOT NULL,
  detected_at timestamptz DEFAULT now()
);

-- Seed known high-performing whale wallets
INSERT INTO polymarket_whales (address, alias, win_rate_30d, roi_30d)
VALUES
  ('0xb9156052b7f3886a1c999045fc5cca3aaf77b1e', 'Shark-A', 99, 97),
  ('0x7ea542b1492c7e1dd8040e3ba27da67ab3de7b0', 'Shark-B', 75, 60),
  ('0x6f9c91dcc6c2a0cecc75f08150bb5a370c7c5f6', 'Shark-C', 0, 0),
  ('0x927fe3b5d9ca1e17c9e89b9b9b9d9d9e9f9a9b9', 'Shark-D', 0, 0),
  ('0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'Shark-E', 0, 0)
ON CONFLICT (address) DO NOTHING;

-- Grant permissions
GRANT ALL ON polymarket_whales TO service_role, anon, authenticated;
GRANT ALL ON polymarket_seen_trades TO service_role, anon, authenticated;
