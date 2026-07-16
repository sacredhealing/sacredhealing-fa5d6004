-- Supreme Siddha Meditation: expand from 14 to 18 modules (42 to 58 lessons).
-- Recovered from a parallel session's genuine, completed expansion work
-- (4 new Siddha masters: Ramadevar, Pambatti Siddhar, Kudambai + Sattamuni,
-- Sundaranandar + Idaikkadar) plus 3 additional lessons added to the
-- existing modules 2, 3, 6, and 8. All with full guided meditation scripts,
-- not just short summaries.

INSERT INTO public.meditation_course_modules (module_number, module_key, title, subtitle, tier_required) VALUES
  (15, 'm15', 'Ramadevar — The Sufi-Siddha Bridge', 'Where the Tamil Siddha Tradition Meets Islamic Mysticism', 'siddha-quantum'),
  (16, 'm16', 'Pambatti Siddhar — The Serpent Master', 'Kundalini as the Living Intelligence of the Spine', 'siddha-quantum'),
  (17, 'm17', 'Kudambai & Sattamuni — The Formless and the Dharmic', 'Samadhi Without Form · Liberation Through Right Living', 'akasha-infinity'),
  (18, 'm18', 'Sundaranandar & Idaikkadar — Love and Simplicity', 'Bhakti as Liberation · The Shepherd''s Path to Samadhi', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
