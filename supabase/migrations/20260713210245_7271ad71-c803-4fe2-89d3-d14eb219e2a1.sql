
DELETE FROM public.healing_audio_purchases a
USING public.healing_audio_purchases b
WHERE a.user_id = b.user_id
  AND a.audio_id = b.audio_id
  AND a.purchased_at > b.purchased_at;

ALTER TABLE public.healing_audio_purchases
  DROP CONSTRAINT IF EXISTS healing_audio_purchases_user_audio_unique;
ALTER TABLE public.healing_audio_purchases
  ADD CONSTRAINT healing_audio_purchases_user_audio_unique UNIQUE (user_id, audio_id);

ALTER TABLE public.divine_transmissions
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS public.divine_transmission_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transmission_id UUID NOT NULL REFERENCES public.divine_transmissions(id) ON DELETE CASCADE,
  amount_usd      NUMERIC(10,2) NOT NULL,
  stripe_session_id TEXT,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, transmission_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.divine_transmission_purchases TO authenticated;
GRANT ALL ON public.divine_transmission_purchases TO service_role;

ALTER TABLE public.divine_transmission_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transmission purchases" ON public.divine_transmission_purchases;
CREATE POLICY "Users view own transmission purchases" ON public.divine_transmission_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access transmission purchases" ON public.divine_transmission_purchases;
CREATE POLICY "Service role full access transmission purchases" ON public.divine_transmission_purchases
  FOR ALL TO service_role USING (true) WITH CHECK (true);
