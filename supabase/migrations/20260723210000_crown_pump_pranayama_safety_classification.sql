-- Crown Pump Pranayama already exists as a live pattern (Kritagya's own
-- recorded teaching) and predates the leveling system added in
-- 20260723190000. Its breath mechanic is rapid pumping exhales — the same
-- class of technique as Kapalabhati/Bhastrika — so it gets the same
-- 'forceful' safety treatment and health-screen gate. Per explicit
-- decision: stays free/beginner tier (no paywall), but is not exempt
-- from the safety gate just because it's free.

UPDATE public.breathing_patterns
SET
  level = 'beginner',
  tier_required = 'free',
  technique_type = 'forceful',
  requires_health_screen = true,
  sanskrit_name = COALESCE(NULLIF(sanskrit_name, ''), 'Kapala Pump Kriya'),
  steps = CASE WHEN array_length(steps, 1) IS NULL OR array_length(steps, 1) = 0 THEN ARRAY[
    'Sit tall with a straight spine.',
    'Follow the pumping exhale rhythm shown in the accompanying video — sharp, active exhale, passive inhale.',
    'Keep rounds short and rest with normal breathing between them.',
    'Never practice on a full stomach.'
  ] ELSE steps END,
  benefits = CASE WHEN array_length(benefits, 1) IS NULL OR array_length(benefits, 1) = 0 THEN ARRAY[
    'Rapidly raises energy and alertness',
    'Generates internal heat',
    'Directs pranic pumping action toward the crown'
  ] ELSE benefits END,
  cautions = CASE WHEN array_length(cautions, 1) IS NULL OR array_length(cautions, 1) = 0 THEN ARRAY[
    'Stop immediately if you feel dizzy, light-headed, or short of breath.',
    'Practice on an empty stomach, ideally in the morning.',
    'Start with short rounds and build up gradually — never force the pace.'
  ] ELSE cautions END,
  contraindications = CASE WHEN array_length(contraindications, 1) IS NULL OR array_length(contraindications, 1) = 0 THEN ARRAY[
    'Pregnancy', 'High blood pressure', 'Heart conditions', 'Hernia',
    'Recent abdominal surgery', 'Epilepsy', 'Vertigo'
  ] ELSE contraindications END
WHERE name ILIKE '%crown%' AND name ILIKE '%pump%';
