CREATE TABLE IF NOT EXISTS public.user_jyotish_vidya_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_jyotish_vidya_section_progress_user_module
  ON public.user_jyotish_vidya_section_progress(user_id, module_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_jyotish_vidya_section_progress TO authenticated;
GRANT ALL ON public.user_jyotish_vidya_section_progress TO service_role;

ALTER TABLE public.user_jyotish_vidya_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_jyotish_vidya_section_progress_select_own ON public.user_jyotish_vidya_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_jyotish_vidya_section_progress_insert_own ON public.user_jyotish_vidya_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_jyotish_vidya_section_progress_update_own ON public.user_jyotish_vidya_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_jyotish_vidya_section_progress_delete_own ON public.user_jyotish_vidya_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_user_jyotish_vidya_section_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_jyotish_vidya_section_progress_updated_at
  ON public.user_jyotish_vidya_section_progress;

CREATE TRIGGER update_user_jyotish_vidya_section_progress_updated_at
  BEFORE UPDATE ON public.user_jyotish_vidya_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_user_jyotish_vidya_section_progress_updated_at();