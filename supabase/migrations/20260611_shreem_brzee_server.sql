-- Shreem Brzee Server-Side Paper Trading Tables

-- Session state (portfolio balance, open positions)
CREATE TABLE IF NOT EXISTS public.shreem_brzee_session (
  id          TEXT PRIMARY KEY DEFAULT 'default',
  portfolio   DECIMAL NOT NULL DEFAULT 2.0,
  start_balance DECIMAL NOT NULL DEFAULT 2.0,
  positions   JSONB DEFAULT '{}',
  total_pnl   DECIMAL DEFAULT 0,
  wins        INTEGER DEFAULT 0,
  losses      INTEGER DEFAULT 0,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shreem_brzee_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_session" ON public.shreem_brzee_session FOR SELECT USING (true);
CREATE POLICY "service_write_session" ON public.shreem_brzee_session FOR ALL WITH CHECK (true);

-- Trade history (every paper trade the server executes)
CREATE TABLE IF NOT EXISTS public.shreem_brzee_paper_trades (
  id           BIGSERIAL PRIMARY KEY,
  session_id   TEXT DEFAULT 'default',
  sig          TEXT,
  mint         TEXT NOT NULL,
  symbol       TEXT,
  label        TEXT,
  action       TEXT NOT NULL,
  gross_sol    DECIMAL,
  net_sol      DECIMAL,
  slip_sol     DECIMAL,
  fee_sol      DECIMAL,
  pnl_sol      DECIMAL DEFAULT 0,
  mult         DECIMAL,
  mult_source  TEXT,
  failed       BOOLEAN DEFAULT false,
  fail_reason  TEXT,
  portfolio_after DECIMAL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shreem_brzee_paper_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_trades" ON public.shreem_brzee_paper_trades FOR SELECT USING (true);
CREATE POLICY "service_write_trades" ON public.shreem_brzee_paper_trades FOR ALL WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_paper_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_session;

SELECT 'server-side paper trading tables ready' AS status;
