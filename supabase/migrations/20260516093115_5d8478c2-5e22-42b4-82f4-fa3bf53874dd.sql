CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  stripe_subscription_id text,
  current_period_end timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscription_events'
      AND policyname = 'Users can view own events'
  ) THEN
    CREATE POLICY "Users can view own events" ON public.subscription_events
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;