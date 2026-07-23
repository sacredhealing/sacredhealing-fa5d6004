-- Attach Laila's real recorded teachings to the patterns they actually match.
-- Same pattern as the Crown Pump fix: match by name, set the real
-- youtube_url, don't clobber any hand-written guidance already in place.

-- Nadi Shodhana — With Retention: Laila's video teaches exactly the 4-16-8
-- (1:4:2) ratio, starting and ending on the left nostril — matches the
-- seeded pattern's ratio precisely.
UPDATE public.breathing_patterns
SET youtube_url = 'https://youtu.be/2Ysng5QTNvg'
WHERE name ILIKE '%nadi shodhana%' AND name ILIKE '%retention%';

-- Kapalabhati — Skull-Shining Breath: Laila's "lysande skalle" (shining
-- skull) video is a direct match for this technique.
UPDATE public.breathing_patterns
SET youtube_url = 'https://youtu.be/oHpVjNVjy3k'
WHERE name ILIKE '%kapalabhati%';
