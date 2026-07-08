-- Flash Loan Arb Monitor — detection-only tracking table + income_streams card
-- Run via Lovable SQL editor (Supabase project ssygukfdbtehvtndandn is locked inside Lovable).

-- 1. Table: every check the monitor runs, hit or miss
CREATE TABLE IF NOT EXISTS public.flash_arb_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  trigger_signature text,
  pool text,
  mint text,
  estimated_swap_usd numeric,
  latency_ms integer,
  gross_profit_usd numeric,
  net_profit_usd numeric,
  viable boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS flash_arb_checks_created_at_idx
  ON public.flash_arb_checks (created_at DESC);

-- Locked down — all access goes through the flasharb-proxy edge function (service role)
ALTER TABLE public.flash_arb_checks ENABLE ROW LEVEL SECURITY;

-- 2. income_streams card
INSERT INTO public.income_streams
  (title, description, link, internal_slug, is_active, order_index,
   icon_name, badge_text, color_from, color_to, category)
VALUES
  ('Flash Arb Scanner',
   'Detection-only monitor watching Raydium/Orca for large swaps, then checking Jupiter for a residual profitable imbalance net of fees. No execution, no capital at risk — pure signal collection.',
   '/income-streams/flash-arb-monitor',
   'flash-arb-monitor',
   true, 8,
   'Zap', 'SCANNING · DETECTION ONLY', 'cyan-500', 'blue-600', 'trading')
ON CONFLICT (internal_slug) DO UPDATE
  SET link = '/income-streams/flash-arb-monitor', is_active = true;
