-- Laila's video teaches the classical 1:4:2 ratio (4s inhale, 16s hold,
-- 8s exhale), not the 4-8-8 placeholder ratio originally seeded before
-- her video was attached. Correct it to match the real teaching.

UPDATE public.breathing_patterns
SET hold = 16
WHERE name ILIKE '%nadi shodhana%' AND name ILIKE '%retention%';
