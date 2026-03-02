-- Sri Yantra Universal Protection Shield: lifetime access after purchase
CREATE TABLE IF NOT EXISTS public.sri_yantra_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_access BOOLEAN NOT NULL DEFAULT true,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_session_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sri_yantra_access_has_access ON public.sri_yantra_access(has_access) WHERE has_access = true;

ALTER TABLE public.sri_yantra_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sri_yantra access"
  ON public.sri_yantra_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sri_yantra access"
  ON public.sri_yantra_access FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.sri_yantra_access IS 'Lifetime access to Sri Yantra Shield after €49 purchase (Stripe/Crypto).';
