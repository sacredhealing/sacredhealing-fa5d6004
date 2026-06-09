-- Shreem Brzee copy trading signals
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.shreem_brzee_signals (
  id          BIGSERIAL PRIMARY KEY,
  sig         TEXT UNIQUE NOT NULL,
  wallet      TEXT NOT NULL,
  label       TEXT,
  action      TEXT NOT NULL CHECK (action IN ('BUY','SELL')),
  mint        TEXT NOT NULL,
  symbol      TEXT,
  amount_sol  DECIMAL,
  token_amount DECIMAL,
  is_pump_fun BOOLEAN DEFAULT false,
  block_time  BIGINT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shreem_brzee_signals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='shreem_brzee_signals' AND policyname='public_read') THEN
    CREATE POLICY "public_read" ON public.shreem_brzee_signals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='shreem_brzee_signals' AND policyname='service_insert') THEN
    CREATE POLICY "service_insert" ON public.shreem_brzee_signals FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_signals;

SELECT 'shreem_brzee_signals table ready' AS status;
