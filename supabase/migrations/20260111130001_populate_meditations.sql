-- ============================================
-- Populate Meditations Table with 25 Meditations
-- ============================================
-- This migration inserts all the meditation entries specified by the user

-- Morning Meditations (5)
INSERT INTO public.meditations (title, duration_minutes, category, is_premium, shc_reward, description) VALUES
('Morning Awakening', 10, 'morning', false, 10, 'Start your day with gentle awakening energy'),
('Sunrise Gratitude', 8, 'morning', false, 8, 'Begin with gratitude and positive intention'),
('Energizing Morning Flow', 15, 'morning', true, 15, 'Premium morning practice for full body awakening'),
('Morning Clarity', 12, 'morning', false, 12, 'Clear your mind and set intentions for the day'),
('Dawn Intention Setting', 10, 'morning', true, 12, 'Premium practice for setting powerful daily intentions')
ON CONFLICT DO NOTHING;

-- Sleep Meditations (5)
INSERT INTO public.meditations (title, duration_minutes, category, is_premium, shc_reward, description) VALUES
('Deep Sleep Journey', 30, 'sleep', false, 15, 'Guided journey into deep, restorative sleep'),
('Starlight Sleep', 25, 'sleep', true, 18, 'Premium sleep meditation under the stars'),
('Ocean Waves Sleep', 45, 'sleep', false, 20, 'Extended sleep meditation with ocean sounds'),
('Dream Preparation', 20, 'sleep', true, 15, 'Premium practice to prepare for lucid dreaming'),
('Midnight Calm', 15, 'sleep', false, 12, 'Gentle meditation for late-night relaxation')
ON CONFLICT DO NOTHING;

-- Healing Meditations (5)
INSERT INTO public.meditations (title, duration_minutes, category, is_premium, shc_reward, description) VALUES
('Heart Chakra Healing', 20, 'healing', true, 20, 'Premium heart chakra opening and healing'),
('Inner Child Healing', 25, 'healing', true, 22, 'Premium deep healing for inner child wounds'),
('Body Scan Healing', 18, 'healing', false, 15, 'Full body healing and energy clearing'),
('Forgiveness Release', 20, 'healing', true, 18, 'Premium practice for releasing forgiveness'),
('Ancestral Healing', 22, 'healing', true, 20, 'Premium healing for ancestral patterns and trauma')
ON CONFLICT DO NOTHING;

-- Focus Meditations (5)
INSERT INTO public.meditations (title, duration_minutes, category, is_premium, shc_reward, description) VALUES
('Laser Focus', 10, 'focus', false, 10, 'Sharpen your concentration and mental clarity'),
('Deep Work Preparation', 8, 'focus', false, 8, 'Quick practice to prepare for focused work'),
('Mental Clarity Boost', 12, 'focus', true, 12, 'Premium meditation for enhanced mental clarity'),
('Flow State Activation', 15, 'focus', true, 15, 'Premium practice to enter deep flow states'),
('Single-Point Focus Training', 10, 'focus', false, 10, 'Train your mind for sustained attention')
ON CONFLICT DO NOTHING;

-- Anxiety Meditations (5)
INSERT INTO public.meditations (title, duration_minutes, category, is_premium, shc_reward, description) VALUES
('Calm Anxiety Now', 8, 'anxiety', false, 10, 'Quick relief from anxiety and worry'),
('Breathing Through Anxiety', 10, 'anxiety', false, 10, 'Breathwork practice for anxiety management'),
('Grounding for Panic', 12, 'anxiety', false, 12, 'Grounding techniques for panic and overwhelm'),
('Worry Release', 15, 'anxiety', true, 15, 'Premium practice for releasing worry and fear'),
('Evening Anxiety Melt', 20, 'anxiety', true, 18, 'Premium evening practice to release accumulated anxiety')
ON CONFLICT DO NOTHING;

-- Note: These meditations are inserted without audio_url initially
-- Audio files should be uploaded through the admin interface
-- Scripts can be added through the admin interface using the "Add Script" feature

