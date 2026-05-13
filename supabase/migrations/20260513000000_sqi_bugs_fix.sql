-- SQI BUGS DB FIX 20260513
-- Bug 6: Clean sqi_user_memory Vishwananda contamination
-- Bug 5: Add jyotish_cache to students
-- Bug 3: Add frequency_source to user_active_transmissions

UPDATE sqi_user_memory
SET memory_profile = (
  SELECT string_agg(line, E'\n' ORDER BY ord)
  FROM (
    SELECT row_number() OVER () AS ord, line
    FROM unnest(string_to_array(memory_profile, E'\n')) AS line
  ) t
  WHERE lower(line) NOT LIKE '%miracle room%'
    AND lower(line) NOT LIKE '%vishwananda room%'
    AND lower(line) NOT LIKE '%babaji cave%'
    AND lower(line) NOT LIKE '%activated in%'
    AND NOT (lower(line) LIKE '%room%' AND lower(line) LIKE '%active%')
),
updated_at = NOW()
WHERE user_id = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS jyotish_cache text,
  ADD COLUMN IF NOT EXISTS jyotish_cached_at timestamptz;

ALTER TABLE user_active_transmissions
  ADD COLUMN IF NOT EXISTS frequency_source text DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_students_practitioner_active
  ON students(practitioner_id, archived) WHERE archived = false;
