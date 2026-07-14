-- Fix broken foreign key on 7 tables that all repeat the same mistake:
--   user_id uuid NOT NULL REFERENCES public.profiles(id)
--
-- profiles.id is profiles' own random primary key -- NOT the same value
-- as auth.uid() / the logged-in user's real ID. That real ID lives in
-- profiles.user_id. Every one of these tables was built with the wrong
-- column as the FK target, so every insert/update using the real
-- auth.uid() (which is what the app has always sent) fails with a
-- foreign-key violation: "Key is not present in table profiles".
--
-- This silently breaks, for every user, every time:
--   - user_course_progress  (module completion, progress %, notes, bookmarks)
--   - dosha_assessments     (Ayurveda dosha quiz results)
--   - jyotish_progress      (Jyotish Vidya module progress)
--   - jyotish_queries       (Jyotish query history)
--   - jyotish_oracle_queries (Bhrigu Oracle query history)
--   - clawbot_members       (Solana bot membership/profit-share records)
--   - clawbot_fee_ledger    (Solana bot fee tracking)
--
-- Fix: point every one of these at auth.users(id) instead, matching the
-- pattern profiles.user_id itself already uses.

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
