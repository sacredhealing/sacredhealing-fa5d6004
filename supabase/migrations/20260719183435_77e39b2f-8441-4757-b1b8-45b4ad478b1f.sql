
-- Fix user_memberships schema so stripe-webhook can actually upsert subscriptions
ALTER TABLE public.user_memberships
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.user_memberships
  ALTER COLUMN starts_at SET DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS user_memberships_user_id_unique
  ON public.user_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_user_memberships_stripe_customer_id
  ON public.user_memberships (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_memberships_stripe_subscription_id
  ON public.user_memberships (stripe_subscription_id);
