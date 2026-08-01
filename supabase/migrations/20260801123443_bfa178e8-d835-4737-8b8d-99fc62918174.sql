
-- 1. user_balances: users may only create their own zeroed row
DROP POLICY IF EXISTS "Users can insert their own balance" ON public.user_balances;
CREATE POLICY "Users can insert their own zero balance"
ON public.user_balances FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND coalesce(balance, 0) = 0
  AND coalesce(total_earned, 0) = 0
  AND coalesce(total_spent, 0) = 0
);

CREATE OR REPLACE FUNCTION public.guard_user_balances_values()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.balance := 0; NEW.total_earned := 0; NEW.total_spent := 0;
    RETURN NEW;
  END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
     OR NEW.total_spent IS DISTINCT FROM OLD.total_spent THEN
    RAISE EXCEPTION 'Balances can only be modified server-side';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_user_balances_values ON public.user_balances;
CREATE TRIGGER guard_user_balances_values
BEFORE INSERT OR UPDATE ON public.user_balances
FOR EACH ROW EXECUTE FUNCTION public.guard_user_balances_values();

-- 2. referral_signups: validate referrer + fix bonuses server-side
DROP POLICY IF EXISTS "Users can insert their own referral attribution" ON public.referral_signups;
CREATE POLICY "Users can insert their own referral attribution"
ON public.referral_signups FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = referred_user_id
  AND referrer_user_id IS DISTINCT FROM auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.affiliate_profiles ap
    WHERE ap.user_id = referral_signups.referrer_user_id
      AND ap.affiliate_code = referral_signups.referral_code
  )
);

CREATE OR REPLACE FUNCTION public.guard_referral_signup_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.signup_bonus_shc := 100;
  NEW.referred_bonus_shc := 50;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_referral_signup_bonus ON public.referral_signups;
CREATE TRIGGER guard_referral_signup_bonus
BEFORE INSERT OR UPDATE ON public.referral_signups
FOR EACH ROW EXECUTE FUNCTION public.guard_referral_signup_bonus();

-- 3. challenge_participants: no self-awarded completion
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND coalesce(completed, false) = false
  AND completed_at IS NULL
);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.challenge_participants;
CREATE POLICY "Users can update their own progress"
ON public.challenge_participants FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.guard_challenge_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.completed := false;
    NEW.completed_at := NULL;
    RETURN NEW;
  END IF;
  NEW.completed := OLD.completed;
  NEW.completed_at := OLD.completed_at;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_challenge_completion ON public.challenge_participants;
CREATE TRIGGER guard_challenge_completion
BEFORE INSERT OR UPDATE ON public.challenge_participants
FOR EACH ROW EXECUTE FUNCTION public.guard_challenge_completion();

GRANT ALL ON public.user_balances TO service_role;
GRANT ALL ON public.referral_signups TO service_role;
GRANT ALL ON public.challenge_participants TO service_role;
