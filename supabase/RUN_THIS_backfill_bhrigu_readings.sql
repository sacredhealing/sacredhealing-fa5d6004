-- ══════════════════════════════════════════════════════════════════
-- SQI 2050 | Bhrigu Chat Log → bhrigu_readings BACKFILL
-- Run once in Supabase SQL Editor (service role, bypasses RLS)
-- 
-- What it does:
--   1. Pairs every (user → oracle) consecutive message from bhrigu_chat_log
--   2. Inserts each pair as a bhrigu_readings row with:
--        reading_type = 'chat'
--        question     = the user's message
--        sections     = { "transmission": oracle's reply }
--        created_at   = timestamp of the user message
--   3. Skips pairs already backfilled (dedup by user_id + created_at)
--   4. Admin RLS fix included at the bottom
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Build paired Q&A from chat log using window functions
WITH ranked AS (
  SELECT
    id,
    user_id,
    role,
    text,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
  FROM public.bhrigu_chat_log
),
pairs AS (
  SELECT
    u.user_id,
    u.text        AS question,
    o.text        AS answer,
    u.created_at  AS asked_at
  FROM ranked u
  JOIN ranked o
    ON  o.user_id = u.user_id
    AND o.rn = u.rn + 1
    AND o.role = 'oracle'
  WHERE u.role = 'user'
    AND u.text IS NOT NULL
    AND o.text IS NOT NULL
),
-- Step 2: Exclude pairs already present in bhrigu_readings
-- (match on user_id + created_at to avoid duplicates on re-run)
new_pairs AS (
  SELECT p.*
  FROM pairs p
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.bhrigu_readings r
    WHERE r.user_id    = p.user_id
      AND r.created_at = p.asked_at
      AND r.reading_type = 'chat'
  )
)
-- Step 3: Insert
INSERT INTO public.bhrigu_readings (
  user_id,
  reading_type,
  question,
  sections,
  birth_data,
  created_at
)
SELECT
  user_id,
  'chat'                                          AS reading_type,
  LEFT(question, 1000)                            AS question,
  jsonb_build_object('transmission', answer)      AS sections,
  '{}'::jsonb                                     AS birth_data,
  asked_at                                        AS created_at
FROM new_pairs;

-- Report how many rows were inserted
DO $$
DECLARE inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Backfill complete: % chat exchanges inserted into bhrigu_readings', inserted_count;
END $$;

COMMIT;

-- ── Admin RLS fix (safe to run even if already applied) ──────────
DROP POLICY IF EXISTS "Users select own bhrigu readings" ON public.bhrigu_readings;
DROP POLICY IF EXISTS "Admin select all bhrigu readings"  ON public.bhrigu_readings;

CREATE POLICY "Users select own bhrigu readings"
  ON public.bhrigu_readings FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid
  );

-- Verify
SELECT
  COUNT(*)            AS total_readings,
  COUNT(DISTINCT user_id) AS total_users,
  MIN(created_at)     AS oldest,
  MAX(created_at)     AS newest
FROM public.bhrigu_readings;
