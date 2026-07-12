
-- Fix bot_trades: remove overly permissive update policy
DROP POLICY IF EXISTS "bot_update_all" ON public.bot_trades;

-- Fix request_supports: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view supports" ON public.request_supports;
CREATE POLICY "Authenticated can view supports" ON public.request_supports
  FOR SELECT TO authenticated USING (true);

-- Fix social_post_queue: use has_role instead of hardcoded UUID
DROP POLICY IF EXISTS "Admin full access" ON public.social_post_queue;
CREATE POLICY "Admin full access" ON public.social_post_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix sniper_members: lock down all sensitive financial columns
DROP POLICY IF EXISTS "Users update own sniper non-sensitive" ON public.sniper_members;
CREATE POLICY "Users update own sniper non-sensitive" ON public.sniper_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND tier = (SELECT sm.tier FROM public.sniper_members sm WHERE sm.user_id = auth.uid())
    AND balance = (SELECT sm.balance FROM public.sniper_members sm WHERE sm.user_id = auth.uid())
    AND total_earned = (SELECT sm.total_earned FROM public.sniper_members sm WHERE sm.user_id = auth.uid())
    AND platform_fee_pct = (SELECT sm.platform_fee_pct FROM public.sniper_members sm WHERE sm.user_id = auth.uid())
    AND wallet_address IS NOT DISTINCT FROM (SELECT sm.wallet_address FROM public.sniper_members sm WHERE sm.user_id = auth.uid())
  );

-- Fix profiles: prevent users from self-editing financial/reward fields
-- Drop both duplicate self-update policies then create a guarded one
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND total_affiliate_earnings IS NOT DISTINCT FROM (SELECT p.total_affiliate_earnings FROM public.profiles p WHERE p.user_id = auth.uid())
    AND total_referrals IS NOT DISTINCT FROM (SELECT p.total_referrals FROM public.profiles p WHERE p.user_id = auth.uid())
    AND streak_days IS NOT DISTINCT FROM (SELECT p.streak_days FROM public.profiles p WHERE p.user_id = auth.uid())
    AND referral_code IS NOT DISTINCT FROM (SELECT p.referral_code FROM public.profiles p WHERE p.user_id = auth.uid())
    AND referred_by IS NOT DISTINCT FROM (SELECT p.referred_by FROM public.profiles p WHERE p.user_id = auth.uid())
  );
