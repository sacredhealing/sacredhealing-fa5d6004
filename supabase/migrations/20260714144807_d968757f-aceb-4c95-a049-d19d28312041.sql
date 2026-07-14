ALTER TABLE public.user_course_progress
  DROP CONSTRAINT IF EXISTS user_course_progress_user_id_fkey;
ALTER TABLE public.user_course_progress
  ADD CONSTRAINT user_course_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.dosha_assessments
  DROP CONSTRAINT IF EXISTS dosha_assessments_user_id_fkey;
ALTER TABLE public.dosha_assessments
  ADD CONSTRAINT dosha_assessments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.jyotish_progress
  DROP CONSTRAINT IF EXISTS jyotish_progress_user_id_fkey;
ALTER TABLE public.jyotish_progress
  ADD CONSTRAINT jyotish_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.jyotish_queries
  DROP CONSTRAINT IF EXISTS jyotish_queries_user_id_fkey;
ALTER TABLE public.jyotish_queries
  ADD CONSTRAINT jyotish_queries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.jyotish_oracle_queries
  DROP CONSTRAINT IF EXISTS jyotish_oracle_queries_user_id_fkey;
ALTER TABLE public.jyotish_oracle_queries
  ADD CONSTRAINT jyotish_oracle_queries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.clawbot_members
  DROP CONSTRAINT IF EXISTS clawbot_members_user_id_fkey;
ALTER TABLE public.clawbot_members
  ADD CONSTRAINT clawbot_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.clawbot_fee_ledger
  DROP CONSTRAINT IF EXISTS clawbot_fee_ledger_user_id_fkey;
ALTER TABLE public.clawbot_fee_ledger
  ADD CONSTRAINT clawbot_fee_ledger_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;