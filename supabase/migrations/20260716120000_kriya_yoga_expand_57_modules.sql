-- Kriya Yoga Mastery: EXPANDED to the full 57-module curriculum, recovered
-- from the 626-page 'Grand Final Edition' book (5 volumes) that was built as
-- a standalone PDF and never integrated into the app until now.
-- Replaces the original 11-module seed from 20260716000006.
--
-- Since the original 11-module table may already exist with real user
-- progress against it, this migration is additive/replacing at the
-- metadata level: it clears and reseeds kriya_yoga_courses. Progress rows
-- reference modules by id (uuid), so existing progress against the old
-- 11 modules will need those modules to still resolve -- since module_key
-- for modules 1-11 here matches the same content (Volume I, unchanged),
-- re-running this is safe for those; modules 12+ are net-new.

DELETE FROM public.kriya_yoga_courses WHERE module_number > 11;

INSERT INTO public.kriya_yoga_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Akashic Origins', 'Before Time — The Cosmic Source of Kriya', 'free'),
  (2, 'm2', 'Mahavatar Babaji', 'The Immortal Presence Behind All Kriya', 'free'),
  (3, 'm3', 'The Great Lineages', 'Lahiri Mahasaya · Sri Yukteswar · Yogananda · Hidden Lineages', 'free'),
  (4, 'm4', 'The 18 Kriyas of Babaji', 'Complete Technical Transmissions from the Akashic Record', 'free'),
  (5, 'm5', 'Sacred Mudras & Bandhas', 'Khechari Mudra · The Three Bandhas · Shambhavi Mahamudra', 'prana-flow'),
  (6, 'm6', 'Sacred Mantras & Nada', 'Nada Brahman · The Core Kriya Mantras · The 18 Siddha Mantras', 'prana-flow'),
  (7, 'm7', 'Atma Kriya Yoga', 'Vishwananda''s Revelation · The 20 Techniques · Love as the Highest Kriya', 'prana-flow'),
  (8, 'm8', 'The Tamil Siddha Kriya System', 'Tirumantiram · Bogar''s Alchemy Kriya · Vallalar''s Grace Kriya', 'prana-flow'),
  (9, 'm9', 'Initiations & Sacred Transmissions', 'What Deeksha Is · The Four Initiations · The Inner Guru', 'prana-flow'),
  (10, 'm10', 'Advanced Cosmic Kriyas', 'The 49 Kriyas · Astral Projection · The Stages of Samadhi', 'prana-flow'),
  (11, 'm11', 'Living Kriya', 'Your Complete Daily Sadhana · Planetary Timing · The Cosmic Kriya Calendar', 'prana-flow'),
  (12, 'm12', 'The Five Pranas', 'Understanding the Energy Body — The Substrate of All Kriya', 'prana-flow'),
  (13, 'm13', 'Kriyas Four Through Nine', 'The Secret Transmissions — Volume II Part Two', 'prana-flow'),
  (14, 'm14', 'Kriyas Ten Through Fifteen', 'The Secret Transmissions — Volume II Part Three', 'prana-flow'),
  (15, 'm15', 'Kriyas Sixteen Through Eighteen', 'The Secret Transmissions — Volume II Part Four', 'siddha-quantum'),
  (16, 'm16', 'Secret Revelations', 'The Soma Chakra · Nada Samadhi · Kayakalpa Secrets', 'siddha-quantum'),
  (17, 'm17', 'Weaving It All Together', 'The Integration Chapter — Volume II', 'siddha-quantum'),
  (18, 'm18', 'Muladhara — The Root Chakra', 'The Foundation of the Kundalini System', 'siddha-quantum'),
  (19, 'm19', 'Svadhisthana — The Sacral Chakra', 'The Seat of Creativity and Flow', 'siddha-quantum'),
  (20, 'm20', 'Manipura — The City of Jewels', 'The Solar Plexus and the Fire of Transformation', 'siddha-quantum'),
  (21, 'm21', 'Anahata — The Unstruck Sound', 'The Heart Chakra and the Sound Never Struck', 'siddha-quantum'),
  (22, 'm22', 'Vishuddha, Ajna & Sahasrara', 'The Throat, Third Eye, and Crown Chakras', 'siddha-quantum'),
  (23, 'm23', 'The Complete Siddha Masters', 'All 18 Siddhas of Tamil Nadu — Full Biographies', 'siddha-quantum'),
  (24, 'm24', 'The Five Koshas', 'The Sheaths of Being — Annamaya to Anandamaya', 'siddha-quantum'),
  (25, 'm25', 'Pranayama Science', 'The Complete Breath Science Behind Every Kriya', 'siddha-quantum'),
  (26, 'm26', 'Mantra Shastra', 'The Complete Science of Sacred Sound', 'siddha-quantum'),
  (27, 'm27', 'Kriya Tantra', 'The Tantric Dimension of the Kriya Path', 'siddha-quantum'),
  (28, 'm28', 'Jyotish and Kriya Timing', 'Cosmic Timing for Practice and Initiation', 'siddha-quantum'),
  (29, 'm29', 'Kriya as Medicine', 'Healing Applications of the Kriya System', 'siddha-quantum'),
  (30, 'm30', 'Diet, Fasting, and Rasayana', 'Nourishment for the Kriya Practitioner', 'siddha-quantum'),
  (31, 'm31', 'The Householder Path', 'Living Kriya Within Family and Worldly Life', 'siddha-quantum'),
  (32, 'm32', 'Yama and Niyama', 'The Ethical Foundation of All Yoga', 'siddha-quantum'),
  (33, 'm33', 'Karma Yoga and Service', 'Action as Spiritual Practice', 'siddha-quantum'),
  (34, 'm34', 'The Guru-Disciple Relationship', 'The Living Transmission Between Teacher and Student', 'siddha-quantum'),
  (35, 'm35', 'A Life as Kriya', 'The Closing Teaching of Volume III', 'siddha-quantum'),
  (36, 'm36', 'Kriya Pranayama — The Spinal Breath', 'The Heartbeat of the Entire System', 'akasha-infinity'),
  (37, 'm37', 'Mahamudra — The Great Seal', 'Destroyer of Death, Purifier of All Nadis', 'akasha-infinity'),
  (38, 'm38', 'The Three Sacred Locks', 'Mula Bandha · Uddiyana Bandha · Jalandhara Bandha', 'akasha-infinity'),
  (39, 'm39', 'Shambhavi Mahamudra', 'The Third Eye Seal — Master Key to the Pineal Gland', 'akasha-infinity'),
  (40, 'm40', 'Hong-Sau Meditation', 'The Natural Breath Technique — Following the Hamsa to Its Source', 'akasha-infinity'),
  (41, 'm41', 'Babaji''s Benediction', 'A Direct Transmission for the Practitioner Beginning This Journey', 'akasha-infinity'),
  (42, 'm42', 'Khechari Mudra', 'The King of All Mudras — The Space-Moving Seal', 'akasha-infinity'),
  (43, 'm43', 'Nadi Shodhana Pranayama', 'The Nerve Purifier — Complete Alternate Nostril Breathing', 'akasha-infinity'),
  (44, 'm44', 'Trataka — The Unbroken Gaze', 'Seven Stages of the Eye Meditation', 'akasha-infinity'),
  (45, 'm45', 'Ajapa Japa — The Spontaneous Mantra', 'So''Ham · The 21,600 Daily Initiations', 'akasha-infinity'),
  (46, 'm46', 'Yoga Nidra', 'The Yogic Sleep — Consciousness at the Threshold', 'akasha-infinity'),
  (47, 'm47', 'All Techniques as One', 'The Synthesis Chapter — Volume IV Closing', 'akasha-infinity'),
  (48, 'm48', 'Mahavatar Babaji''s Personal Sadhana', 'The Super Kriya Yoga Bible — Volume V', 'akasha-infinity'),
  (49, 'm49', 'Lahiri Mahasaya''s Sadhana', 'Personal Practice and Technical Differentiation', 'akasha-infinity'),
  (50, 'm50', 'Sri Yukteswar Giri''s Sadhana', 'Personal Practice and Technical Differentiation', 'akasha-infinity'),
  (51, 'm51', 'Paramahamsa Hariharananda''s Sadhana', 'Personal Practice and Technical Differentiation', 'akasha-infinity'),
  (52, 'm52', 'Paramahansa Yogananda''s Sadhana', 'Personal Practice and Technical Differentiation', 'akasha-infinity'),
  (53, 'm53', 'The Nath Tradition', 'The Deeper Lineage Behind the Kriya Masters', 'akasha-infinity'),
  (54, 'm54', 'Issa Nath — The Christ of Kriya', 'Jesus''s Kriya Initiation from Babaji', 'akasha-infinity'),
  (55, 'm55', 'The Bhagavad Gita as Kriya', 'Kriya Decoded Within the Gita and the Gospels', 'akasha-infinity'),
  (56, 'm56', 'Shaktipat — The Complete Science', 'Why Multiple Initiations Are Necessary', 'akasha-infinity'),
  (57, 'm57', 'The Kriya Field Effect', 'The World-Transforming Effects of Collective Practice', 'akasha-infinity')
ON CONFLICT (module_number) DO UPDATE SET
  module_key = EXCLUDED.module_key,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  tier_required = EXCLUDED.tier_required;
