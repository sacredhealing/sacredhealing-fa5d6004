-- Per explicit decision: keep only pranayama patterns that have a real
-- recorded video (Kritagya's or Laila's). These six were seeded as
-- generic classical-progression placeholders in 20260723190000 and were
-- never backed by actual footage — delete them outright.
--
-- NOT touched: Crown Pump Pranayama (Kritagya's video), Nadi Shodhana —
-- With Retention and Kapalabhati (both now carry Laila's real videos,
-- attached in 20260723220000).

DELETE FROM public.breathing_patterns
WHERE (name ILIKE '%sama vritti%' OR name = 'Box Breathing')
   OR name ILIKE '%bhramari%'
   OR name ILIKE '%nadi shodhana%foundation%'
   OR name ILIKE '%ujjayi%'
   OR name ILIKE '%kumbhaka%extended%'
   OR name ILIKE '%bhastrika%';
