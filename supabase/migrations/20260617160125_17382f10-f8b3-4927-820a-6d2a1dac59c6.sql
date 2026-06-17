
ALTER TABLE public.shreem_brzee_signals DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shreem_brzee_signals TO anon;
GRANT ALL ON public.shreem_brzee_signals TO authenticated;
GRANT ALL ON public.shreem_brzee_signals TO service_role;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_signals; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.shreem_brzee_session DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shreem_brzee_session TO anon;
GRANT ALL ON public.shreem_brzee_session TO authenticated;
GRANT ALL ON public.shreem_brzee_session TO service_role;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_session; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.shreem_brzee_paper_trades DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shreem_brzee_paper_trades TO anon;
GRANT ALL ON public.shreem_brzee_paper_trades TO authenticated;
GRANT ALL ON public.shreem_brzee_paper_trades TO service_role;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_brzee_paper_trades; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
