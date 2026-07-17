CREATE TABLE IF NOT EXISTS public.user_water_alchemy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_water_alchemy_progress_user ON public.user_water_alchemy_progress(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_water_alchemy_progress TO authenticated;
GRANT ALL ON public.user_water_alchemy_progress TO service_role;

ALTER TABLE public.user_water_alchemy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_water_alchemy_progress_select_own ON public.user_water_alchemy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_water_alchemy_progress_insert_own ON public.user_water_alchemy_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_water_alchemy_progress_update_own ON public.user_water_alchemy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_water_alchemy_progress_delete_own ON public.user_water_alchemy_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);