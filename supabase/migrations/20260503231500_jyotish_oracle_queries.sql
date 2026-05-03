-- Jyotish Vidya — Bhrigu Oracle query log (adapted from 20260503_jyotish_vidya.sql)
-- Uses public.profiles + gen_random_uuid() to match Agastyar / SQI migrations.
-- Note: public.jyotish_progress + public.jyotish_queries already exist in 20260503220000_jyotish_vidya.sql.

CREATE TABLE IF NOT EXISTS public.jyotish_oracle_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id integer CHECK (module_id IS NULL OR (module_id >= 1 AND module_id <= 32)),
  query text NOT NULL,
  response text,
  chart_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jyotish_oracle_queries_user ON public.jyotish_oracle_queries(user_id);

ALTER TABLE public.jyotish_oracle_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jyotish_oracle_queries_select_own ON public.jyotish_oracle_queries;
CREATE POLICY jyotish_oracle_queries_select_own ON public.jyotish_oracle_queries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_oracle_queries_insert_own ON public.jyotish_oracle_queries;
CREATE POLICY jyotish_oracle_queries_insert_own ON public.jyotish_oracle_queries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
