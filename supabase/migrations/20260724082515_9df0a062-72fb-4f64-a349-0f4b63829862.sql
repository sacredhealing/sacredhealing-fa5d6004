-- Pranayama proper Siddha-lineage leveling: beginner/intermediate/advanced,
-- tied to membership tier, plus a mandatory health screening gate for any
-- retention (Kumbhaka) or forceful (Kapalabhati/Bhastrika) technique.

-- 1) Extend breathing_patterns with level, tier gate, technique classification,
--    and real guidance content (steps / benefits / cautions / contraindications).
ALTER TABLE public.breathing_patterns
  ADD COLUMN IF NOT EXISTS sanskrit_name TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS tier_required TEXT NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  ADD COLUMN IF NOT EXISTS technique_type TEXT NOT NULL DEFAULT 'gentle'
    CHECK (technique_type IN ('gentle', 'retention', 'forceful')),
  ADD COLUMN IF NOT EXISTS requires_health_screen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS steps TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS benefits TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cautions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contraindications TEXT[] NOT NULL DEFAULT '{}';

-- 2) Bring the existing Box Breathing row in line as the level-0 baseline.
UPDATE public.breathing_patterns
SET
  sanskrit_name = 'Sama Vritti',
  level = 'beginner',
  tier_required = 'free',
  technique_type = 'gentle',
  requires_health_screen = false,
  steps = ARRAY[
    'Sit upright, spine tall, shoulders relaxed.',
    'Inhale through the nose for the count shown.',
    'Hold gently at the top — no straining.',
    'Exhale through the nose for the count shown.',
    'Hold gently at the bottom, then begin the next cycle.'
  ],
  benefits = ARRAY['Calms the nervous system', 'Builds even, steady attention', 'Safe daily foundation practice'],
  cautions = ARRAY['Stop if you feel lightheaded — return to normal breathing.'],
  contraindications = '{}'
WHERE id = (SELECT id FROM public.breathing_patterns WHERE name = 'Box Breathing' ORDER BY order_index LIMIT 1);

-- 3) Seed the rest of the proper Siddha-lineage progression, level by level.
INSERT INTO public.breathing_patterns
  (name, sanskrit_name, description, inhale, hold, exhale, hold_out, cycles, order_index, level, tier_required, technique_type, requires_health_screen, steps, benefits, cautions, contraindications)
VALUES
  (
    'Nadi Shodhana — Foundation', 'Anuloma Viloma (no retention)',
    'Alternate nostril breathing without holds. Balances the left and right nervous-system channels.',
    4, 0, 4, 0, 6, 10, 'beginner', 'free', 'gentle', false,
    ARRAY[
      'Sit comfortably. Rest the left hand on the knee.',
      'Use the right thumb to close the right nostril. Inhale through the left.',
      'Close the left nostril with the ring finger, release the right thumb. Exhale through the right.',
      'Inhale through the right, then switch and exhale through the left.',
      'That is one round. Keep the breath smooth — no holding yet.'
    ],
    ARRAY['Balances the nervous system', 'Settles a scattered mind', 'Prepares the body for meditation'],
    ARRAY['If you feel dizzy, stop and breathe normally through both nostrils.'],
    '{}'
  ),
  (
    'Bhramari — Humming Bee', 'Bhramari Pranayama',
    'Soft humming exhale that stimulates the vagus nerve and calms the mind. No retention.',
    4, 0, 6, 0, 5, 11, 'beginner', 'free', 'gentle', false,
    ARRAY[
      'Sit quietly and close your eyes.',
      'Inhale through the nose.',
      'Exhale slowly while humming like a bee, lips closed, jaw relaxed.',
      'Let the vibration settle in your skull and chest before the next inhale.'
    ],
    ARRAY['Calms anxiety quickly', 'Lowers heart rate', 'Good before sleep'],
    ARRAY['Practice at a volume comfortable for your ears — no forcing the sound.'],
    '{}'
  ),
  (
    'Nadi Shodhana — With Retention', 'Anuloma Viloma (sahita kumbhaka)',
    'Alternate nostril breathing with a brief, gentle hold at the top of the inhale.',
    4, 8, 8, 0, 6, 20, 'intermediate', 'prana-flow', 'retention', true,
    ARRAY[
      'Begin as in the foundation practice.',
      'After the inhale, hold gently for the count shown — never to the point of strain.',
      'Exhale slowly through the alternate nostril, twice the length of the inhale.',
      'If the hold feels forced at any point, shorten it or drop it for that cycle.'
    ],
    ARRAY['Deepens nervous-system balancing', 'Builds breath capacity gradually', 'Sharpens focus'],
    ARRAY['The hold should always feel comfortable. Never hold to the point of gasping.'],
    ARRAY['Pregnancy', 'Uncontrolled high or low blood pressure', 'Heart conditions', 'Panic disorder']
  ),
  (
    'Ujjayi — Ocean Breath', 'Ujjayi Pranayama',
    'A soft throat constriction on both inhale and exhale, creating an ocean-like sound. No retention.',
    5, 0, 5, 0, 8, 21, 'intermediate', 'prana-flow', 'gentle', false,
    ARRAY[
      'Breathe through the nose only, mouth closed throughout.',
      'Gently narrow the back of the throat, as if fogging a mirror with your mouth shut.',
      'Keep the sound soft and even on both the inhale and the exhale.',
      'Let the breath stay long and unhurried, cycle after cycle.'
    ],
    ARRAY['Builds internal heat and focus', 'Steadies the mind for asana or meditation', 'Used throughout classical yoga practice'],
    ARRAY['Keep the throat constriction gentle — it should never feel like straining or a sore throat.'],
    '{}'
  ),
  (
    'Kapalabhati — Skull-Shining Breath', 'Kapalabhati Pranayama',
    'Short, sharp exhales driven by the lower belly, with passive inhales. An activating, cleansing practice.',
    2, 0, 1, 0, 20, 22, 'intermediate', 'prana-flow', 'forceful', true,
    ARRAY[
      'Sit tall. Rest hands on the knees.',
      'Exhale sharply through the nose by pumping the lower belly in.',
      'Let the inhale happen passively and naturally — do not force it.',
      'Start with short rounds (around 20 pumps), then rest and breathe normally.',
      'Never practice on a full stomach.'
    ],
    ARRAY['Clears stale air from the lungs', 'Energizes and sharpens mental clarity', 'Warms the body'],
    ARRAY['Stop immediately if you feel dizzy, light-headed, or short of breath.', 'Practice on an empty stomach, ideally in the morning.'],
    ARRAY['Pregnancy', 'High blood pressure', 'Heart conditions', 'Hernia', 'Recent abdominal surgery', 'Epilepsy', 'Vertigo']
  ),
  (
    'Kumbhaka — Extended Retention', 'Antara & Bahya Kumbhaka',
    'Classical 1:4:2 ratio breath retention. The deepest pranic accumulation practice — only for those with a steady foundation.',
    6, 24, 12, 0, 6, 30, 'advanced', 'siddha-quantum', 'retention', true,
    ARRAY[
      'Only attempt this once alternate-nostril retention feels effortless.',
      'Inhale fully but without strain for the count shown.',
      'Hold — the chest and throat should stay soft, never clenched.',
      'Release the exhale slowly, at roughly twice the length of the inhale.',
      'If you ever feel the urge to gasp, end the hold immediately — that is the body''s limit for today.'
    ],
    ARRAY['Deep pranic accumulation', 'Trains real breath mastery', 'Foundation for deeper Kriya practice'],
    ARRAY['This is an advanced practice. Build up gradually over weeks, never in a single session.', 'Stop at once if you feel dizzy, see spots, or feel your heart racing.'],
    ARRAY['Pregnancy', 'Any heart condition', 'High or low blood pressure', 'Epilepsy or seizure history', 'Glaucoma or retinal conditions', 'Recent surgery', 'Panic or anxiety disorders']
  ),
  (
    'Bhastrika — Bellows Breath', 'Bhastrika Pranayama',
    'Forceful, equal-effort inhales and exhales driven by the diaphragm — a heating, activating practice.',
    1, 0, 1, 0, 20, 31, 'advanced', 'siddha-quantum', 'forceful', true,
    ARRAY[
      'Sit tall with a straight spine.',
      'Inhale and exhale forcefully and equally through the nose, driven by the diaphragm, like a bellows.',
      'Keep rounds short (around 20 breaths) followed by a natural pause and a few normal breaths.',
      'Never practice more than a few rounds without rest.'
    ],
    ARRAY['Rapidly raises energy and alertness', 'Generates internal heat', 'Classical Siddha activating technique'],
    ARRAY['Stop immediately if dizzy, light-headed, or if vision changes.', 'Never practice on a full stomach or late at night.'],
    ARRAY['Pregnancy', 'High blood pressure', 'Heart conditions', 'Epilepsy', 'Hernia', 'Recent surgery', 'Vertigo or fainting history']
  )
ON CONFLICT DO NOTHING;

-- 4) Health screening
CREATE TABLE IF NOT EXISTS public.user_pranayama_health_screening (
  user_id UUID PRIMARY KEY,
  is_pregnant BOOLEAN NOT NULL DEFAULT false,
  has_heart_condition BOOLEAN NOT NULL DEFAULT false,
  has_blood_pressure_condition BOOLEAN NOT NULL DEFAULT false,
  has_epilepsy_or_seizures BOOLEAN NOT NULL DEFAULT false,
  has_glaucoma_or_eye_condition BOOLEAN NOT NULL DEFAULT false,
  has_recent_surgery BOOLEAN NOT NULL DEFAULT false,
  has_panic_or_anxiety_disorder BOOLEAN NOT NULL DEFAULT false,
  other_condition_note TEXT,
  cleared_for_retention BOOLEAN NOT NULL DEFAULT false,
  cleared_for_forceful BOOLEAN NOT NULL DEFAULT false,
  screened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pranayama_health_screening TO authenticated;
GRANT ALL ON public.user_pranayama_health_screening TO service_role;

ALTER TABLE public.user_pranayama_health_screening ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own screening" ON public.user_pranayama_health_screening;
DROP POLICY IF EXISTS "Users can insert their own screening" ON public.user_pranayama_health_screening;
DROP POLICY IF EXISTS "Users can update their own screening" ON public.user_pranayama_health_screening;

CREATE POLICY "Users can view their own screening" ON public.user_pranayama_health_screening
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own screening" ON public.user_pranayama_health_screening
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screening" ON public.user_pranayama_health_screening
  FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_pranayama_health_screening_updated_at ON public.user_pranayama_health_screening;
CREATE TRIGGER update_pranayama_health_screening_updated_at
  BEFORE UPDATE ON public.user_pranayama_health_screening
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Crown Pump Pranayama safety classification
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

-- Attach Laila's real recorded teachings
UPDATE public.breathing_patterns
SET youtube_url = 'https://youtu.be/2Ysng5QTNvg'
WHERE name ILIKE '%nadi shodhana%' AND name ILIKE '%retention%';

UPDATE public.breathing_patterns
SET youtube_url = 'https://youtu.be/oHpVjNVjy3k'
WHERE name ILIKE '%kapalabhati%';

-- Delete video-less placeholder patterns
DELETE FROM public.breathing_patterns
WHERE (name ILIKE '%sama vritti%' OR name = 'Box Breathing')
   OR name ILIKE '%bhramari%'
   OR name ILIKE '%nadi shodhana%foundation%'
   OR name ILIKE '%ujjayi%'
   OR name ILIKE '%kumbhaka%extended%'
   OR name ILIKE '%bhastrika%';

-- Full Yogic Breath
INSERT INTO public.breathing_patterns
  (name, sanskrit_name, description, inhale, hold, exhale, hold_out, cycles, order_index, level, tier_required, technique_type, requires_health_screen, youtube_url, steps, benefits, cautions, contraindications, is_active)
VALUES
  (
    'Full Yogic Breath', 'Dirgha Pranayama',
    'The classical three-part breath — belly, ribs, then chest. The foundation every other pranayama practice builds on.',
    6, 0, 6, 0, 8, 5, 'beginner', 'free', 'gentle', false,
    'https://youtu.be/xpWRo0Z806o',
    ARRAY[
      'Sit or lie down comfortably, spine long.',
      'Inhale into the belly first, letting it rise.',
      'Continue the same inhale into the ribs, feeling them expand sideways.',
      'Complete the inhale into the upper chest.',
      'Exhale slowly in reverse — chest, then ribs, then belly — fully emptying.',
      'Keep the whole breath smooth and unforced, like a wave.'
    ],
    ARRAY['Full use of lung capacity', 'Calms the nervous system', 'The foundation for every other pranayama practice'],
    ARRAY['Keep it slow and smooth — this is a foundation practice, not a race.'],
    '{}',
    true
  )
ON CONFLICT DO NOTHING;

-- Fix Nadi Shodhana ratio to match Laila's real teaching (1:4:2)
UPDATE public.breathing_patterns
SET hold = 16
WHERE name ILIKE '%nadi shodhana%' AND name ILIKE '%retention%';

-- Stage unclassified pranayama videos (inactive)
INSERT INTO public.breathing_patterns
  (name, description, inhale, hold, exhale, hold_out, cycles, order_index, level, tier_required, technique_type, requires_health_screen, youtube_url, is_active)
VALUES
  (
    'Pranayama 1 (unclassified)', 'Pending classification — breath mechanic not yet confirmed. Do not activate until reviewed.',
    4, 0, 4, 0, 4, 90, 'advanced', 'siddha-quantum', 'forceful', true,
    'https://youtu.be/aB869byeosg', false
  ),
  (
    'Pranayama 2 (unclassified)', 'Pending classification — breath mechanic not yet confirmed. Do not activate until reviewed.',
    4, 0, 4, 0, 4, 91, 'advanced', 'siddha-quantum', 'forceful', true,
    'https://youtu.be/4eXBigDD1OM', false
  )
ON CONFLICT DO NOTHING;

-- Activate Pranayama I & II with conservative gating
UPDATE public.breathing_patterns
SET
  name = 'Pranayama I',
  description = 'A recorded pranayama practice. Breath mechanic pending full confirmation — practiced cautiously as a forceful technique in the meantime.',
  is_active = true
WHERE name = 'Pranayama 1 (unclassified)';

UPDATE public.breathing_patterns
SET
  name = 'Pranayama II',
  description = 'A recorded pranayama practice. Breath mechanic pending full confirmation — practiced cautiously as a forceful technique in the meantime.',
  is_active = true
WHERE name = 'Pranayama 2 (unclassified)';
