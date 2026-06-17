
-- shreem_brzee_signals
CREATE TABLE IF NOT EXISTS public.shreem_brzee_signals (
  id BIGSERIAL PRIMARY KEY,
  sig TEXT UNIQUE NOT NULL,
  wallet TEXT NOT NULL,
  label TEXT,
  action TEXT NOT NULL CHECK (action IN ('BUY','SELL')),
  mint TEXT NOT NULL,
  symbol TEXT,
  amount_sol DECIMAL,
  token_amount DECIMAL,
  is_pump_fun BOOLEAN DEFAULT false,
  block_time BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shreem_brzee_signals DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shreem_brzee_signals TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.shreem_brzee_signals_id_seq TO anon, authenticated, service_role;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_signals; EXCEPTION WHEN others THEN NULL; END;
END $$;

-- shreem_brzee_session
CREATE TABLE IF NOT EXISTS public.shreem_brzee_session (
  id TEXT PRIMARY KEY DEFAULT 'default',
  portfolio DECIMAL NOT NULL DEFAULT 2.0,
  start_balance DECIMAL NOT NULL DEFAULT 2.0,
  positions JSONB DEFAULT '{}',
  total_pnl DECIMAL DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  mode TEXT DEFAULT 'paper',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shreem_brzee_session ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMPTZ;
ALTER TABLE public.shreem_brzee_session ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'paper';
ALTER TABLE public.shreem_brzee_session DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shreem_brzee_session TO anon, authenticated, service_role;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_session; EXCEPTION WHEN others THEN NULL; END;
END $$;

-- shreem_brzee_paper_trades
CREATE TABLE IF NOT EXISTS public.shreem_brzee_paper_trades (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT DEFAULT 'default',
  sig TEXT,
  mint TEXT NOT NULL,
  symbol TEXT,
  label TEXT,
  action TEXT NOT NULL,
  gross_sol DECIMAL,
  net_sol DECIMAL,
  slip_sol DECIMAL,
  fee_sol DECIMAL,
  pnl_sol DECIMAL DEFAULT 0,
  mult DECIMAL,
  mult_source TEXT,
  failed BOOLEAN DEFAULT false,
  fail_reason TEXT,
  sell_reason TEXT,
  live BOOLEAN DEFAULT false,
  portfolio_after DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shreem_brzee_paper_trades ADD COLUMN IF NOT EXISTS sell_reason TEXT;
ALTER TABLE public.shreem_brzee_paper_trades ADD COLUMN IF NOT EXISTS live BOOLEAN DEFAULT false;
ALTER TABLE public.shreem_brzee_paper_trades DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shreem_brzee_paper_trades TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.shreem_brzee_paper_trades_id_seq TO anon, authenticated, service_role;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_paper_trades; EXCEPTION WHEN others THEN NULL; END;
END $$;
