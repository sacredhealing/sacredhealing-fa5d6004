-- 2-tier MLM commission structure.
--
-- Tier 1 (unchanged): the affiliate who directly referred a customer earns
-- 30% on that customer's purchases and renewals — already working, fixed
-- in the previous migration/commit.
--
-- Tier 2 (new): if that Tier-1 affiliate was themselves recruited by
-- someone (i.e. THEY signed up via another affiliate's link before
-- becoming an affiliate themselves), that upline affiliate earns an
-- override commission too — a real 2-tier structure, not just modeled.
--
-- Upline is resolved automatically via the SAME permanent attribution
-- system already fixed (affiliate_attribution): whoever referred this
-- affiliate as a MEMBER is automatically their upline as an AFFILIATE.
-- No separate "who recruited you" flow needed — it reuses data that
-- already exists the moment someone becomes an affiliate.
--
-- Tier 2 rate: set to 10% here as a reasonable default. NOT confirmed
-- with Kritagya/Laila — flagged in chat, adjust the constant below if a
-- different rate is wanted.

ALTER TABLE public.affiliate_profiles
  ADD COLUMN IF NOT EXISTS recruited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- The frontend Commission type has always had a 'level' field, but the real
-- table never had this column — confirmed dead. Adding it for real now.
ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Resolve and store upline whenever a new affiliate profile is created.
CREATE OR REPLACE FUNCTION public.resolve_affiliate_upline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referrer_code TEXT;
  v_referrer_user_id UUID;
BEGIN
  IF NEW.recruited_by_user_id IS NOT NULL THEN
    RETURN NEW; -- already set explicitly, don't override
  END IF;

  -- Was this new affiliate themselves referred by someone, back when
  -- they joined as a regular member?
  SELECT ref_code INTO v_referrer_code
  FROM public.affiliate_attribution
  WHERE user_id = NEW.user_id;

  IF v_referrer_code IS NOT NULL AND v_referrer_code != 'direct' THEN
    SELECT user_id INTO v_referrer_user_id
    FROM public.affiliate_profiles
    WHERE affiliate_code = v_referrer_code;

    IF v_referrer_user_id IS NOT NULL AND v_referrer_user_id != NEW.user_id THEN
      NEW.recruited_by_user_id := v_referrer_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resolve_affiliate_upline ON public.affiliate_profiles;
CREATE TRIGGER trg_resolve_affiliate_upline
  BEFORE INSERT ON public.affiliate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.resolve_affiliate_upline();

-- Backfill: resolve upline for any affiliate profiles that already exist.
UPDATE public.affiliate_profiles ap
SET recruited_by_user_id = ref.user_id
FROM public.affiliate_attribution attr
JOIN public.affiliate_profiles ref ON ref.affiliate_code = attr.ref_code
WHERE ap.user_id = attr.user_id
  AND attr.ref_code != 'direct'
  AND ap.recruited_by_user_id IS NULL
  AND ref.user_id != ap.user_id;
