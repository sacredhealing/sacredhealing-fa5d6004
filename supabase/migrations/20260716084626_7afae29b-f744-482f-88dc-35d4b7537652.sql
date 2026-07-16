
-- 1) profiles: also lock membership_tier
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (total_affiliate_earnings IS DISTINCT FROM (SELECT p.total_affiliate_earnings FROM public.profiles p WHERE p.user_id = auth.uid()))
    AND NOT (total_referrals IS DISTINCT FROM (SELECT p.total_referrals FROM public.profiles p WHERE p.user_id = auth.uid()))
    AND NOT (streak_days IS DISTINCT FROM (SELECT p.streak_days FROM public.profiles p WHERE p.user_id = auth.uid()))
    AND NOT (referral_code IS DISTINCT FROM (SELECT p.referral_code FROM public.profiles p WHERE p.user_id = auth.uid()))
    AND NOT (referred_by IS DISTINCT FROM (SELECT p.referred_by FROM public.profiles p WHERE p.user_id = auth.uid()))
    AND NOT (membership_tier IS DISTINCT FROM (SELECT p.membership_tier FROM public.profiles p WHERE p.user_id = auth.uid()))
  );

-- 2) affiliate_profiles: lock balances/earnings/payout/code/stripe_connect_id
DROP POLICY IF EXISTS affiliate_profiles_update_own ON public.affiliate_profiles;
CREATE POLICY affiliate_profiles_update_own
  ON public.affiliate_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (pending_balance   IS DISTINCT FROM (SELECT a.pending_balance   FROM public.affiliate_profiles a WHERE a.user_id = auth.uid()))
    AND NOT (total_earnings    IS DISTINCT FROM (SELECT a.total_earnings    FROM public.affiliate_profiles a WHERE a.user_id = auth.uid()))
    AND NOT (paid_out          IS DISTINCT FROM (SELECT a.paid_out          FROM public.affiliate_profiles a WHERE a.user_id = auth.uid()))
    AND NOT (affiliate_code    IS DISTINCT FROM (SELECT a.affiliate_code    FROM public.affiliate_profiles a WHERE a.user_id = auth.uid()))
    AND NOT (stripe_connect_id IS DISTINCT FROM (SELECT a.stripe_connect_id FROM public.affiliate_profiles a WHERE a.user_id = auth.uid()))
  );

-- 3) user_balances: lock balance/total_earned/total_spent
DROP POLICY IF EXISTS "Users can update their own balance" ON public.user_balances;
CREATE POLICY "Users can update their own balance"
  ON public.user_balances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (balance      IS DISTINCT FROM (SELECT b.balance      FROM public.user_balances b WHERE b.user_id = auth.uid()))
    AND NOT (total_earned IS DISTINCT FROM (SELECT b.total_earned FROM public.user_balances b WHERE b.user_id = auth.uid()))
    AND NOT (total_spent  IS DISTINCT FROM (SELECT b.total_spent  FROM public.user_balances b WHERE b.user_id = auth.uid()))
  );

-- 4) completions/activities: require shc_earned to be 0 on client insert
DROP POLICY IF EXISTS "Users can insert their own completions" ON public.meditation_completions;
CREATE POLICY "Users can insert their own completions"
  ON public.meditation_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND COALESCE(shc_earned, 0) = 0);

DROP POLICY IF EXISTS "Users can insert own mantra completions" ON public.mantra_completions;
CREATE POLICY "Users can insert own mantra completions"
  ON public.mantra_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND COALESCE(shc_earned, 0) = 0);

DROP POLICY IF EXISTS "Users can insert their own music completions" ON public.music_completions;
CREATE POLICY "Users can insert their own music completions"
  ON public.music_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND COALESCE(shc_earned, 0) = 0);

DROP POLICY IF EXISTS "Users can insert own video completions" ON public.video_completions;
CREATE POLICY "Users can insert own video completions"
  ON public.video_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND COALESCE(shc_earned, 0) = 0);

-- daily_activities uses FOR ALL; split so INSERT/UPDATE cannot set shc_earned
DROP POLICY IF EXISTS "Users can manage their own daily activities" ON public.daily_activities;
CREATE POLICY "Users can insert own daily activities"
  ON public.daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id AND COALESCE(shc_earned, 0) = 0);
CREATE POLICY "Users can update own daily activities"
  ON public.daily_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (shc_earned IS DISTINCT FROM (SELECT d.shc_earned FROM public.daily_activities d WHERE d.id = daily_activities.id))
  );
CREATE POLICY "Users can delete own daily activities"
  ON public.daily_activities FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.user_daily_activities;
CREATE POLICY "Users can insert their own activities"
  ON public.user_daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id AND COALESCE(shc_earned, 0) = 0);

DROP POLICY IF EXISTS "Users can update their own activities" ON public.user_daily_activities;
CREATE POLICY "Users can update their own activities"
  ON public.user_daily_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (shc_earned IS DISTINCT FROM (SELECT u.shc_earned FROM public.user_daily_activities u WHERE u.id = user_daily_activities.id))
  );

-- 5) security_events: prevent spoofing user_id
DROP POLICY IF EXISTS "Authenticated can log security events" ON public.security_events;
CREATE POLICY "Authenticated can log security events"
  ON public.security_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));
