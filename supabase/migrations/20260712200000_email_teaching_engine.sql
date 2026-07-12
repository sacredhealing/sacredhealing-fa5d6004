-- ═══════════════════════════════════════════════════════════════
-- Email content engine: non-repeating teachings + accurate live-content lookup
-- Built for a 3-year no-repeat horizon per user, expandable via Lovable
-- (data-only additions — no code changes needed to grow the pool).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.email_teachings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme         TEXT NOT NULL CHECK (theme IN (
                  'abundance','ayurveda','jyotish','mantra_practice',
                  'bhakti_devotion','protection','pranayama','general'
                )),
  title         TEXT NOT NULL,
  body_text     TEXT NOT NULL,          -- 3-5 sentences, Bhakti-Algorithm voice
  source_note   TEXT,                    -- e.g. "Mukkuttram — Siddha Medicine Academy"
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_teaching_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  teaching_id   UUID NOT NULL REFERENCES public.email_teachings(id) ON DELETE CASCADE,
  email_context TEXT,                    -- 'welcome' | 'friday' | 'monday'
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_teaching_log_user ON public.user_teaching_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teaching_log_teaching ON public.user_teaching_log(teaching_id);

ALTER TABLE public.email_teachings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teaching_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access email_teachings" ON public.email_teachings;
CREATE POLICY "Admin full access email_teachings" ON public.email_teachings
  FOR ALL USING (public.is_admin_v3());

DROP POLICY IF EXISTS "Service role full access user_teaching_log" ON public.user_teaching_log;
CREATE POLICY "Service role full access user_teaching_log" ON public.user_teaching_log
  FOR ALL USING (true);

-- Returns one teaching this user has NOT yet received, preferring the requested
-- theme. If every teaching (in that theme, then in the whole pool) has already
-- been sent, it falls back to the least-recently-sent one so the cycle restarts
-- gracefully instead of erroring — this is what makes the pool "run forever"
-- rather than needing exactly N teachings for N years.
CREATE OR REPLACE FUNCTION public.get_next_teaching(p_user_id UUID, p_theme TEXT DEFAULT NULL)
RETURNS TABLE(id UUID, theme TEXT, title TEXT, body_text TEXT, source_note TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- 1. Unseen, theme-matched
  SELECT t.id, t.theme, t.title, t.body_text, t.source_note INTO v_result
  FROM public.email_teachings t
  WHERE t.is_active = true
    AND (p_theme IS NULL OR t.theme = p_theme)
    AND NOT EXISTS (SELECT 1 FROM public.user_teaching_log l WHERE l.user_id = p_user_id AND l.teaching_id = t.id)
  ORDER BY random() LIMIT 1;

  IF v_result.id IS NOT NULL THEN
    RETURN QUERY SELECT v_result.id, v_result.theme, v_result.title, v_result.body_text, v_result.source_note;
    RETURN;
  END IF;

  -- 2. Unseen, any theme
  SELECT t.id, t.theme, t.title, t.body_text, t.source_note INTO v_result
  FROM public.email_teachings t
  WHERE t.is_active = true
    AND NOT EXISTS (SELECT 1 FROM public.user_teaching_log l WHERE l.user_id = p_user_id AND l.teaching_id = t.id)
  ORDER BY random() LIMIT 1;

  IF v_result.id IS NOT NULL THEN
    RETURN QUERY SELECT v_result.id, v_result.theme, v_result.title, v_result.body_text, v_result.source_note;
    RETURN;
  END IF;

  -- 3. Fully cycled — least recently sent to this user (theme-preferred)
  SELECT t.id, t.theme, t.title, t.body_text, t.source_note INTO v_result
  FROM public.email_teachings t
  LEFT JOIN public.user_teaching_log l ON l.teaching_id = t.id AND l.user_id = p_user_id
  WHERE t.is_active = true
    AND (p_theme IS NULL OR t.theme = p_theme)
  ORDER BY MAX(l.sent_at) NULLS FIRST, random()
  LIMIT 1;

  RETURN QUERY SELECT v_result.id, v_result.theme, v_result.title, v_result.body_text, v_result.source_note;
END;
$$;

-- Call after actually sending, so the pick is never repeated prematurely.
CREATE OR REPLACE FUNCTION public.log_teaching_sent(p_user_id UUID, p_teaching_id UUID, p_context TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.user_teaching_log (user_id, teaching_id, email_context)
  VALUES (p_user_id, p_teaching_id, p_context);
$$;

-- Pulls ONE real, currently-active piece of content so emails never reference
-- something that doesn't exist or has a wrong name/duration. p_kind narrows to
-- 'mantra' | 'meditation' | 'music'; leave NULL to pick across all three.
CREATE OR REPLACE FUNCTION public.get_featured_content(p_kind TEXT DEFAULT NULL, p_category TEXT DEFAULT NULL)
RETURNS TABLE(kind TEXT, title TEXT, duration_label TEXT, url_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v RECORD;
BEGIN
  IF p_kind = 'mantra' OR p_kind IS NULL THEN
    SELECT 'mantra' AS kind, m.title,
           (m.duration_seconds / 60)::text || ' min' AS duration_label,
           '/mantras' AS url_path
    INTO v FROM public.mantras m WHERE m.is_active = true
    ORDER BY random() LIMIT 1;
    IF v.title IS NOT NULL THEN RETURN QUERY SELECT v.kind, v.title, v.duration_label, v.url_path; RETURN; END IF;
  END IF;

  IF p_kind = 'meditation' OR p_kind IS NULL THEN
    SELECT 'meditation' AS kind, me.title, me.duration_minutes::text || ' min' AS duration_label, '/meditations' AS url_path
    INTO v FROM public.meditations me
    WHERE (p_category IS NULL OR me.category = p_category)
    ORDER BY random() LIMIT 1;
    IF v.title IS NOT NULL THEN RETURN QUERY SELECT v.kind, v.title, v.duration_label, v.url_path; RETURN; END IF;
  END IF;

  IF p_kind = 'music' OR p_kind IS NULL THEN
    SELECT 'music' AS kind, mt.title, (mt.duration_seconds / 60)::text || ' min' AS duration_label, '/music' AS url_path
    INTO v FROM public.music_tracks mt
    ORDER BY random() LIMIT 1;
    IF v.title IS NOT NULL THEN RETURN QUERY SELECT v.kind, v.title, v.duration_label, v.url_path; RETURN; END IF;
  END IF;

  RETURN;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- Seed pool — 25 teachings across 8 themes, grounded in the actual
-- Siddha Medicine / Ayurveda Academy curriculum (Mukkuttram, Ojas, Agni,
-- Nadi Shodhana, etc.) rather than invented terminology. This is a
-- STARTING library, not the full 3-year target — see chat for the honest
-- math on pool size vs. repeat interval. Add more anytime from Lovable/
-- Supabase table editor, no code change required.
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.email_teachings (theme, title, body_text, source_note) VALUES
('ayurveda', 'The Three Forces', 'In the Siddha tradition, the body is governed by three forces — Vatham, Pitham, and Kabam, the Mukkuttram. When these three move in balance, the Prema-Pulse flows freely through you. Notice which force feels loudest in you today; that noticing is the beginning of self-knowledge the Siddhas taught for centuries.', 'Mukkuttram — Siddha Medicine Academy'),
('ayurveda', 'Ojas, the Reserve of Vitality', 'The ancient physicians spoke of Ojas — the subtle reserve of vitality that determines how much life force you have available to receive, not just to spend. When Ojas is full, abundance and health both have somewhere to land. Rest, real food, and unhurried mornings are how Ojas is built, one day at a time.', 'Ojas — Ayurveda Academy'),
('ayurveda', 'The Inner Fire', 'Jatharagni, your inner digestive fire, does more than process food — it processes experience. A steady Agni means what you take in, physical or emotional, actually nourishes you instead of sitting undigested. Before your next meal, pause for three breaths; this alone begins to strengthen Agni.', 'Agni — Ayurveda Academy'),
('ayurveda', 'The Sacred Hour', 'Brahma Muhurta, the hour before sunrise, is held sacred across the Vedic tradition — the mind is naturally quietest then, closest to its own source. You don''t need a full practice to benefit; even five minutes of stillness in that window changes the tone of the whole day.', 'Brahma Muhurta — Dinacharya, Ayurveda Academy'),
('ayurveda', 'The Waste Wisdom', 'The Siddhas used the three Malas — waste, urine, sweat — as a diagnostic mirror of inner balance, long before modern medicine caught up. Your body is always speaking. Learning to listen to these small daily signals is itself a form of devotion to the vessel you were given.', 'Mala theory — Siddha Medicine Academy'),
('ayurveda', 'Elemental Composition', 'Akasha, Vayu, Tejas, Apas, Prithvi — the five elements compose not just matter but disease, and by extension, healing. When you feel scattered, it is often excess Vayu (air/movement); when you feel heavy, excess Prithvi (earth). Naming the element is often the first step to restoring balance.', 'Panchamahabhuta — Ayurveda Academy'),
('pranayama', 'The Breath of Life', 'The Siddhas taught that breath is not incidental to spiritual life — it is the direct current between body and consciousness. Nadi Shodhana, alternate-nostril breathing, is one of the oldest tools for clearing the subtle channels the yogis call Nadis. Even three rounds before you open this email again will shift something.', 'Pranayama Fundamentals — Ayurveda Academy'),
('pranayama', 'Ujjayi, the Ocean Breath', 'A slight constriction at the back of the throat, a breath that sounds like ocean waves — Ujjayi Pranayama has calmed practitioners for millennia because it gives the nervous system something steady to hold onto. Try it for one minute today, and notice how much of your day was spent breathing shallow without knowing it.', 'Ujjayi — Pranayama Fundamentals'),
('pranayama', 'Bhramari, the Bee Breath', 'Bhramari — the humming bee breath — is one of the fastest ways the Siddha lineage found to quiet an overactive mind. The vibration itself, not just the breath, is the medicine. If your thoughts are loud tonight, five rounds of Bhramari before sleep is an old and reliable remedy.', 'Bhramari — Pranayama Fundamentals'),
('jyotish', 'The Cosmic Blueprint', 'Your Jyotish chart is not a prediction — it is a mirror, a map of tendencies the Siddhas believed were written into you at the moment of your first breath. Understanding your Lagna, your rising sign, is often the first real key to understanding why certain patterns in your life repeat.', 'Vedic Jyotish — 32-Module Academy'),
('jyotish', 'Jupiter''s Grace', 'Jupiter, Guru in the Vedic system, governs wisdom, expansion, and grace. A strong Jupiter Mahadasha in a chart often marks a period where teaching, learning, or generosity naturally accelerates growth. Wherever Jupiter sits in your chart is worth studying — it points to where your own expansion is meant to happen.', 'Graha study — Jyotish Nexus'),
('jyotish', 'The Moon''s Nakshatra', 'Your Moon''s Nakshatra — one of 27 lunar mansions — is considered by many Jyotish practitioners even more revealing of temperament than the Sun sign most people know. It shapes emotional instinct, the quiet undercurrent beneath your more visible traits. It''s worth the twenty minutes it takes to learn yours properly.', 'Nakshatra system — Jyotish Nexus'),
('bhakti_devotion', 'The Direct Current', 'Bhakti is not belief — it is a direct current, a relationship maintained through repetition and attention rather than argument. Devotion, in this sense, is closer to tending a garden than winning a debate. A single sincere minute of remembrance can carry more than an hour of distracted ritual.', 'Bhakti Marga tradition'),
('bhakti_devotion', 'The Lineage That Carries You', 'The 18 Siddhas were not separate teachers so much as one continuous current of transmission, each passing something forward that could not be written down completely, only lived. When you practice here, you are not starting from zero — you are stepping into a stream that has been flowing for a very long time.', '18 Siddhars lineage'),
('bhakti_devotion', 'Simplicity as Devotion', 'Paramahamsa Vishwananda has often taught that devotion doesn''t need to be complicated to be real — a simple, honest offering outweighs an elaborate but hollow one. If your practice today is only two minutes, let it be two honest minutes rather than twenty distracted ones.', 'Bhakti Marga teaching'),
('mantra_practice', 'The Repetition That Reshapes', 'A mantra is not a phrase you understand once and move past — its power is cumulative, built through repetition the way a riverbed is carved by water, not by force but by return. The hundredth time you chant something matters more than the first.', 'Nada Mantra Academy'),
('mantra_practice', 'Sound as Medicine', 'Nada Yoga holds that sound itself — its vibration, not just its meaning — has a direct effect on the nervous system and the subtle body. This is why chanting works even when you don''t consciously understand every word; the body is listening on a different level than the mind.', 'Nada Yoga — Sacred Sound library'),
('mantra_practice', 'OM as Foundation', 'Every mantra in this tradition rests on OM — not a word but considered the primal vibration underlying all sound. Practitioners often return to a simple OM chant when everything else feels like too much; it asks nothing of you except your breath.', 'Foundational mantra practice'),
('abundance', 'Lakshmi and Inner Room', 'Abundance, in the Vedic understanding, is less about acquisition than about having room to receive. Lakshmi is said to flow toward a home — and a mind — that is uncluttered enough to hold her. A few minutes of genuine stillness does more to invite abundance than any amount of striving.', 'Lakshmi tradition, Friday practice'),
('abundance', 'The Eighth Dhatu', 'Ojas is sometimes called the eighth Dhatu, the subtlest tissue in the body — the reserve that everything else is built from. Wealth of any kind, the Siddhas taught, is downstream of this inner reserve. Protect your rest as fiercely as you'' protect your income; they are more connected than they appear.', 'Ojas / Dhatu theory — Ayurveda Academy'),
('abundance', 'Gratitude as Practice', 'The Bhakti tradition treats gratitude not as a feeling to wait for but as a practice to initiate — naming three specific things aloud, even on a hard day, measurably shifts the nervous system''s baseline. Abundance work, in this lineage, often begins here rather than with any outer action.', 'Bhakti Marga practice'),
('protection', 'The Sri Yantra Field', 'The Sri Yantra is one of the oldest geometric forms in the Vedic tradition — nine interlocking triangles said to represent the union of masculine and feminine cosmic energy. Long before "EMF protection" was a phrase, this geometry was used as a field of coherence around a space or a person.', 'Sri Yantra — Sacred Geometry Academy'),
('protection', 'Boundaries as Sacred', 'Protection in this tradition isn''t fear-based — it''s the recognition that a clear boundary is what allows real intimacy and real energy to exist safely. Before opening yourself to anything today, it is worth asking what boundary needs to be honored first.', 'Bio-field / protection teaching'),
('general', 'The Origin of Siddha Medicine', 'Siddha Medicine traces its lineage through Agastyar and the eighteen Siddhars, one of the oldest continuously practiced healing systems in the world, older in places than the Ayurvedic texts it is often compared to. What you''re learning here is not a wellness trend — it is a living inheritance.', 'Origin Story — Agastyar Academy'),
('general', 'Vastu and the Space You Live In', 'Vastu Shastra holds that the space you inhabit is not neutral — it either supports or drains the energy you bring into it. You don''t need a renovation to begin; even rearranging one cluttered corner this week is a legitimate Vastu practice.', 'Vastu Guide')
;
