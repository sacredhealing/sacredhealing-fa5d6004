
-- Lock down clawbot_members: users cannot escalate tier/fee/paper_mode
DROP POLICY IF EXISTS "Users manage own membership" ON public.clawbot_members;

CREATE POLICY "Users view own clawbot membership"
  ON public.clawbot_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own clawbot membership"
  ON public.clawbot_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tier = 'free'
    AND paper_mode = true
    AND platform_fee_pct = public.clawbot_fee_for_tier('free')
    AND COALESCE(balance_usdc, 0) = 0
    AND COALESCE(total_won_usdc, 0) = 0
    AND COALESCE(total_fees_paid_usdc, 0) = 0
  );

-- Users may update only non-sensitive operational fields (wallet creds, is_active)
CREATE POLICY "Users update own clawbot non-sensitive"
  ON public.clawbot_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND tier = (SELECT tier FROM public.clawbot_members WHERE user_id = auth.uid())
    AND platform_fee_pct = (SELECT platform_fee_pct FROM public.clawbot_members WHERE user_id = auth.uid())
    AND paper_mode = (SELECT paper_mode FROM public.clawbot_members WHERE user_id = auth.uid())
    AND balance_usdc = (SELECT balance_usdc FROM public.clawbot_members WHERE user_id = auth.uid())
    AND total_won_usdc = (SELECT total_won_usdc FROM public.clawbot_members WHERE user_id = auth.uid())
    AND total_fees_paid_usdc = (SELECT total_fees_paid_usdc FROM public.clawbot_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role manages clawbot_members"
  ON public.clawbot_members FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Lock down sniper_members similarly
DROP POLICY IF EXISTS "Users manage own sniper_members" ON public.sniper_members;

CREATE POLICY "Users view own sniper_members"
  ON public.sniper_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sniper_members"
  ON public.sniper_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tier = 'free'
  );

CREATE POLICY "Users update own sniper non-sensitive"
  ON public.sniper_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND tier = (SELECT tier FROM public.sniper_members WHERE user_id = auth.uid())
  );
