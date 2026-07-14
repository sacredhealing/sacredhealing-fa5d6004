-- Extend the proven individual-purchase pattern (already working for
-- music_tracks and healing_audio) to divine_transmissions. Real money
-- only (Stripe) — SHC is being retired for new content per direction:
-- it was confusing, nobody understood the coin economy. Existing SHC
-- purchase paths on music/healing_audio are left untouched here (a
-- separate decision if those should change too).

-- Safety: remove any duplicate (user_id, audio_id) rows first (keeping the
-- earliest), so the new constraint below can't fail to apply on live data.
DELETE FROM public.healing_audio_purchases a
USING public.healing_audio_purchases b
WHERE a.user_id = b.user_id
  AND a.audio_id = b.audio_id
  AND a.purchased_at > b.purchased_at;

-- FIX: healing_audio_purchases had no unique constraint on (user_id,
-- audio_id) at all, meaning an upsert targeting that pair would fail
-- outright with no matching constraint. Required for the webhook fix that
-- now actually records Stripe purchases for this table (previously never
-- written at all after Stripe payment succeeded).
ALTER TABLE public.healing_audio_purchases
  DROP CONSTRAINT IF EXISTS healing_audio_purchases_user_audio_unique;
ALTER TABLE public.healing_audio_purchases
  ADD CONSTRAINT healing_audio_purchases_user_audio_unique UNIQUE (user_id, audio_id);

ALTER TABLE public.divine_transmissions
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10,2);
  -- NULL = not individually purchasable (existing tier-gating still
  -- applies as-is). Set a price to make a specific transmission a real,
  -- one-time "drop" purchasable by anyone regardless of tier.

CREATE TABLE IF NOT EXISTS public.divine_transmission_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transmission_id UUID NOT NULL REFERENCES public.divine_transmissions(id) ON DELETE CASCADE,
  amount_usd      NUMERIC(10,2) NOT NULL,
  stripe_session_id TEXT,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, transmission_id)
);

ALTER TABLE public.divine_transmission_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transmission purchases" ON public.divine_transmission_purchases;
CREATE POLICY "Users view own transmission purchases" ON public.divine_transmission_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access transmission purchases" ON public.divine_transmission_purchases;
CREATE POLICY "Service role full access transmission purchases" ON public.divine_transmission_purchases
  FOR ALL USING (true);
