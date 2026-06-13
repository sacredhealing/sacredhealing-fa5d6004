ALTER TABLE public.bot_trades ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.bot_trades ADD COLUMN IF NOT EXISTS asset text;
ALTER TABLE public.bot_trades ADD COLUMN IF NOT EXISTS signal text;
ALTER TABLE public.bot_trades ADD COLUMN IF NOT EXISTS delta text;
ALTER TABLE public.bot_trades ADD COLUMN IF NOT EXISTS pnl_usdc numeric(12,4);
ALTER TABLE public.bot_trades ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'PAPER';
ALTER TABLE public.bot_trades ADD COLUMN IF NOT EXISTS order_id text;

DROP POLICY IF EXISTS "bot_trades_select_own" ON public.bot_trades;
DROP POLICY IF EXISTS "anon_read_all_bot_trades" ON public.bot_trades;
DROP POLICY IF EXISTS "bot_insert_all" ON public.bot_trades;
CREATE POLICY "anon_read_all_bot_trades" ON public.bot_trades FOR SELECT USING (true);
CREATE POLICY "bot_insert_all" ON public.bot_trades FOR INSERT WITH CHECK (true);

GRANT SELECT ON public.bot_trades TO anon;
GRANT SELECT, INSERT ON public.bot_trades TO authenticated;
GRANT ALL ON public.bot_trades TO service_role;