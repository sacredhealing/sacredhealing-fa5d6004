CREATE TABLE IF NOT EXISTS public.shreem_brzee_signals (
  id BIGSERIAL PRIMARY KEY,
  sig TEXT UNIQUE NOT NULL,
  wallet TEXT NOT NULL,
  label TEXT,
  action TEXT NOT NULL,
  mint TEXT,
  symbol TEXT,
  amount_sol NUMERIC,
  token_amount NUMERIC,
  is_pump_fun BOOLEAN DEFAULT FALSE,
  block_time BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shreem_brzee_signals TO anon, authenticated;
GRANT ALL ON public.shreem_brzee_signals TO service_role;

ALTER TABLE public.shreem_brzee_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_shreem_signals"
  ON public.shreem_brzee_signals FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_shreem_signals_created ON public.shreem_brzee_signals (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_signals;