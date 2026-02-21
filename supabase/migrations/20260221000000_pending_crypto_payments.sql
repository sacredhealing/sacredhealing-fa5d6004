-- Pending crypto payments for Akashic (manual admin verification)
CREATE TABLE IF NOT EXISTS public.pending_crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pending_crypto_payments_user_id ON public.pending_crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_crypto_payments_status ON public.pending_crypto_payments(status);

ALTER TABLE public.pending_crypto_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own pending crypto payments"
  ON public.pending_crypto_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own pending crypto payments"
  ON public.pending_crypto_payments FOR SELECT
  USING (auth.uid() = user_id);
