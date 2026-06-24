-- ── Increment helpers for MLM distributor ────────────────────────────────────

-- Increment bot member SOL balance safely
CREATE OR REPLACE FUNCTION public.increment_bot_balance(
  p_user_id UUID, p_amount NUMERIC
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.shreem_bot_members
  SET sol_balance      = sol_balance + p_amount,
      total_earned_sol = total_earned_sol + p_amount,
      updated_at       = NOW()
  WHERE user_id = p_user_id;
$$;

-- Increment MLM earnings safely
CREATE OR REPLACE FUNCTION public.increment_mlm_earnings(
  p_user_id UUID, p_amount NUMERIC
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.shreem_mlm_earnings
  SET total_earned = total_earned + p_amount,
      pending      = pending + p_amount,
      updated_at   = NOW()
  WHERE user_id = p_user_id;
$$;

SELECT 'MLM increment functions ready' AS status;
