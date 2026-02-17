-- ============================================================
-- Universal Translation Engine: Multilingual by Default
-- ============================================================

-- Create UI Translations table
CREATE TABLE IF NOT EXISTS public.ui_translations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name text UNIQUE NOT NULL, -- e.g., 'header_mantras', 'banner_welcome'
  en_text text NOT NULL,
  sv_text text NOT NULL,
  category text DEFAULT 'ui', -- 'ui', 'jyotish', 'ayurveda', 'mantra'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add language preference to profiles if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'language'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN language text DEFAULT 'sv' CHECK (language IN ('sv', 'en'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ui_translations_key ON public.ui_translations(key_name);
CREATE INDEX IF NOT EXISTS idx_ui_translations_category ON public.ui_translations(category);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON public.profiles(language);

-- Enable RLS
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read translations
CREATE POLICY "Anyone can view translations"
  ON public.ui_translations FOR SELECT
  USING (true);

-- Admins can manage translations
CREATE POLICY "Admins can manage translations"
  ON public.ui_translations FOR ALL
  USING (public.check_is_master_admin() OR public.fn_admin_master_check())
  WITH CHECK (public.check_is_master_admin() OR public.fn_admin_master_check());

-- Insert common UI translations
INSERT INTO public.ui_translations (key_name, en_text, sv_text, category) VALUES
  -- Headers
  ('header_mantras', 'Mantras', 'Mantras', 'ui'),
  ('header_meditations', 'Meditations', 'Meditationer', 'ui'),
  ('header_music', 'Music', 'Musik', 'ui'),
  ('header_community', 'Community', 'Gemenskap', 'ui'),
  ('header_profile', 'Profile', 'Profil', 'ui'),
  ('header_dashboard', 'Dashboard', 'Instrumentpanel', 'ui'),
  ('header_shop', 'Shop', 'Butik', 'ui'),
  ('header_courses', 'Courses', 'Kurser', 'ui'),
  ('header_healing', 'Healing', 'Healing', 'ui'),
  ('header_breathing', 'Breathing', 'Andning', 'ui'),
  ('header_vedic_astrology', 'Vedic Astrology', 'Vedisk Astrologi', 'ui'),
  ('header_ayurveda', 'Ayurveda', 'Ayurveda', 'ui'),
  
  -- Navigation
  ('nav_home', 'Home', 'Hem', 'ui'),
  ('nav_explore', 'Explore', 'Utforska', 'ui'),
  ('nav_meditations', 'Meditations', 'Meditationer', 'ui'),
  ('nav_mantras', 'Mantras', 'Mantras', 'ui'),
  ('nav_music', 'Music', 'Musik', 'ui'),
  ('nav_community', 'Community', 'Gemenskap', 'ui'),
  ('nav_profile', 'Profile', 'Profil', 'ui'),
  ('nav_settings', 'Settings', 'Inställningar', 'ui'),
  
  -- Common Actions
  ('action_play', 'Play', 'Spela', 'ui'),
  ('action_pause', 'Pause', 'Pausa', 'ui'),
  ('action_stop', 'Stop', 'Stoppa', 'ui'),
  ('action_download', 'Download', 'Ladda ner', 'ui'),
  ('action_share', 'Share', 'Dela', 'ui'),
  ('action_like', 'Like', 'Gilla', 'ui'),
  ('action_save', 'Save', 'Spara', 'ui'),
  ('action_cancel', 'Cancel', 'Avbryt', 'ui'),
  ('action_submit', 'Submit', 'Skicka', 'ui'),
  ('action_continue', 'Continue', 'Fortsätt', 'ui'),
  ('action_back', 'Back', 'Tillbaka', 'ui'),
  ('action_next', 'Next', 'Nästa', 'ui'),
  ('action_previous', 'Previous', 'Föregående', 'ui'),
  
  -- Messages
  ('message_loading', 'Loading...', 'Laddar...', 'ui'),
  ('message_error', 'An error occurred', 'Ett fel uppstod', 'ui'),
  ('message_success', 'Success!', 'Framgång!', 'ui'),
  ('message_no_results', 'No results found', 'Inga resultat hittades', 'ui'),
  ('message_try_again', 'Try again', 'Försök igen', 'ui'),
  
  -- Jyotish Layman Terms
  ('jyotish_saturn_transition', 'A Time for Discipline & Focus', 'En tid för disciplin och fokus', 'jyotish'),
  ('jyotish_jupiter_transition', 'A Time for Growth & Wisdom', 'En tid för tillväxt och visdom', 'jyotish'),
  ('jyotish_mars_transition', 'A Time for Action & Energy', 'En tid för handling och energi', 'jyotish'),
  ('jyotish_sun_transition', 'A Time for Leadership & Clarity', 'En tid för ledarskap och klarhet', 'jyotish'),
  ('jyotish_venus_transition', 'A Time for Love & Harmony', 'En tid för kärlek och harmoni', 'jyotish'),
  ('jyotish_mercury_transition', 'A Time for Communication & Learning', 'En tid för kommunikation och lärande', 'jyotish'),
  ('jyotish_moon_transition', 'A Time for Intuition & Emotions', 'En tid för intuition och känslor', 'jyotish'),
  
  -- Ayurveda
  ('ayurveda_vata', 'Vata Dosha', 'Vata Dosha', 'ayurveda'),
  ('ayurveda_pitta', 'Pitta Dosha', 'Pitta Dosha', 'ayurveda'),
  ('ayurveda_kapha', 'Kapha Dosha', 'Kapha Dosha', 'ayurveda'),
  ('ayurveda_recipe', 'Recipe', 'Recept', 'ayurveda'),
  ('ayurveda_tip', 'Tip', 'Tips', 'ayurveda'),
  ('ayurveda_balance', 'Balance Your Dosha', 'Balansera din Dosha', 'ayurveda'),
  
  -- Admin Member Management
  ('action_add_member', 'Add Member', 'Lägg till medlem', 'ui'),
  ('current_members', 'Current Members', 'Nuvarande medlemmar', 'ui'),
  ('search_by_email', 'Search by Email', 'Sök efter e-post', 'ui'),
  ('search_by_name', 'Or Search by Name', 'Eller sök efter namn', 'ui'),
  ('add_by_user_id', 'Or Add by User ID (UUID)', 'Eller lägg till med användar-ID (UUID)', 'ui'),
  ('action_find', 'Find', 'Hitta', 'ui'),
  ('action_search', 'Search', 'Sök', 'ui'),
  ('action_add', 'Add', 'Lägg till', 'ui'),
  ('action_remove', 'Remove', 'Ta bort', 'ui'),
  ('no_members_yet', 'No members yet', 'Inga medlemmar ännu', 'ui'),
  ('refresh_member_list', 'Refresh member list', 'Uppdatera medlemslista', 'ui'),
  ('email_placeholder', 'user@example.com', 'användare@exempel.com', 'ui'),
  ('name_placeholder', 'Type name...', 'Skriv namn...', 'ui'),
  ('uuid_placeholder', 'Paste UUID here...', 'Klistra in UUID här...', 'ui'),
  
  -- Prompt Library
  ('prompt_library', 'Prompt Library', 'Promptbibliotek', 'ui'),
  ('prompt_library_desc', 'Single-click templates for instant productivity', 'Enklicksmallar för omedelbar produktivitet', 'ui'),
  ('templates', 'templates', 'mallar', 'ui'),
  ('search_templates', 'Search templates...', 'Sök mallar...', 'ui'),
  ('filter_by_tone', 'Filter by Tone', 'Filtrera efter ton', 'ui'),
  ('all_tones', 'All Tones', 'Alla toner', 'ui'),
  ('all_categories', 'All Categories', 'Alla kategorier', 'ui'),
  ('category_writing', 'Writing', 'Skrivande', 'ui'),
  ('category_business', 'Business', 'Affärer', 'ui'),
  ('category_marketing', 'Marketing', 'Marknadsföring', 'ui'),
  ('category_productivity', 'Productivity', 'Produktivitet', 'ui'),
  ('category_spiritual', 'Spiritual', 'Andlig', 'ui'),
  ('category_health', 'Health', 'Hälsa', 'ui'),
  ('category_relationships', 'Relationships', 'Relationer', 'ui'),
  ('category_education', 'Education', 'Utbildning', 'ui'),
  ('use_template', 'Use Template', 'Använd mall', 'ui'),
  ('template_copied', 'Template copied! Ready to use with your AI assistant.', 'Mall kopierad! Redo att använda med din AI-assistent.', 'ui'),
  ('no_templates_found', 'No templates found', 'Inga mallar hittades', 'ui')
ON CONFLICT (key_name) DO UPDATE SET
  en_text = EXCLUDED.en_text,
  sv_text = EXCLUDED.sv_text,
  updated_at = now();
