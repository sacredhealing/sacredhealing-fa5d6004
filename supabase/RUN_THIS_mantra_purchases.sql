-- ============================================================================
-- INDIVIDUAL MANTRA PURCHASES
-- Run once in the Supabase SQL Editor.
-- ============================================================================

ALTER TABLE public.mantras
ADD COLUMN IF NOT EXISTS price_usd numeric DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.mantra_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mantra_id uuid NOT NULL REFERENCES public.mantras(id) ON DELETE CASCADE,
  stripe_session_id text,
  amount_usd numeric NOT NULL DEFAULT 0,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mantra_id)
);

CREATE INDEX IF NOT EXISTS idx_mantra_purchases_user ON public.mantra_purchases(user_id);

ALTER TABLE public.mantra_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mantra purchases" ON public.mantra_purchases;
CREATE POLICY "Users can view their own mantra purchases"
ON public.mantra_purchases FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- No client INSERT policy on purpose — same as content_vault_purchases,
-- only the stripe-webhook (service-role key) writes a purchase row, and only
-- after Stripe confirms payment_status = 'paid'. Never on checkout-create.
