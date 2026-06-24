-- Add missing columns to shreem_bot_members
ALTER TABLE public.shreem_bot_members
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paper_mode BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS total_paid_sol NUMERIC(16,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS affiliate_code_used TEXT;

-- Add tx signature columns + total_paid to distributions/earnings
ALTER TABLE public.shreem_profit_distributions
  ADD COLUMN IF NOT EXISTS l1_tx_sig TEXT,
  ADD COLUMN IF NOT EXISTS l2_tx_sig TEXT,
  ADD COLUMN IF NOT EXISTS l3_tx_sig TEXT,
  ADD COLUMN IF NOT EXISTS l4_tx_sig TEXT,
  ADD COLUMN IF NOT EXISTS l5_tx_sig TEXT;

ALTER TABLE public.shreem_mlm_earnings
  ADD COLUMN IF NOT EXISTS total_paid NUMERIC(16,8) NOT NULL DEFAULT 0;

-- Re-grant (idempotent)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_bot_members TO authenticated;
GRANT ALL ON public.shreem_bot_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_mlm_tree TO authenticated;
GRANT ALL ON public.shreem_mlm_tree TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_profit_distributions TO authenticated;
GRANT ALL ON public.shreem_profit_distributions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_mlm_earnings TO authenticated;
GRANT ALL ON public.shreem_mlm_earnings TO service_role;

-- Enable realtime (ignore if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_profit_distributions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_mlm_earnings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Harden increment functions with search_path
CREATE OR REPLACE FUNCTION public.increment_bot_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shreem_bot_members
  SET sol_balance = sol_balance + p_amount,
      total_earned_sol = total_earned_sol + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_mlm_earnings(p_user_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shreem_mlm_earnings
  SET total_earned = total_earned + p_amount,
      pending = pending + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
$$;