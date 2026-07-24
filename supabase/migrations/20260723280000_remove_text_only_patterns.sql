-- Broader sweep than the earlier name-matched deletion: remove ANY
-- breathing_patterns row with no youtube_url, regardless of name. This
-- catches text-only patterns that may have existed in the table before
-- any of this work started (i.e. rows I never explicitly enumerated by
-- name), not just the specific invented placeholders deleted earlier.
-- Anything with a real video from Kritagya or Laila survives untouched.

DELETE FROM public.breathing_patterns
WHERE youtube_url IS NULL OR trim(youtube_url) = '';
