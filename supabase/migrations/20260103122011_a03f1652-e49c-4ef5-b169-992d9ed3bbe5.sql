-- Create table for affirmation soundtrack content management
CREATE TABLE public.affirmation_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL DEFAULT 'text', -- text, image, audio, price
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affirmation_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view content
CREATE POLICY "Anyone can view affirmation content"
ON public.affirmation_content
FOR SELECT
USING (true);

-- Only admins can manage content
CREATE POLICY "Admins can manage affirmation content"
ON public.affirmation_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_affirmation_content_updated_at
BEFORE UPDATE ON public.affirmation_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for English
INSERT INTO public.affirmation_content (content_key, content_type, title, content, metadata, language) VALUES
-- Hero section
('badge', 'text', 'Badge', 'Sacred Sound Healing', '{}', 'en'),
('title', 'text', 'Title', 'Personalized Affirmation Soundtrack', '{}', 'en'),
('subtitle', 'text', 'Subtitle', 'Reprogram Your Mind and Manifest Your Dreams', '{}', 'en'),
('description', 'text', 'Description', 'Experience a meditation crafted uniquely for you, designed to align your subconscious with your goals, dreams, and personal growth. This audio meditation combines sacred sounds, healing frequencies, and affirmations to support deep transformation.', '{}', 'en'),

-- What's Included section
('included_affirmations_title', 'text', 'Custom Affirmations Title', 'Custom Affirmations', '{}', 'en'),
('included_affirmations_desc', 'text', 'Custom Affirmations Description', 'Tailored to your personal goals and challenges, designed to reprogram limiting beliefs.', '{}', 'en'),
('included_frequencies_title', 'text', 'Frequencies Title', 'Healing Frequencies & Sacred Sounds', '{}', 'en'),
('included_frequencies_desc', 'text', 'Frequencies Description', 'Activate relaxation, clarity, and energetic alignment.', '{}', 'en'),
('included_binaural_title', 'text', 'Binaural Title', 'Binaural Beats & Soothing Music', '{}', 'en'),
('included_binaural_desc', 'text', 'Binaural Description', 'Harmonize mind, heart, and energy for manifestation and focus.', '{}', 'en'),

-- Benefits
('benefit_1', 'text', 'Benefit 1', 'Reprogram subconscious patterns and old thought loops', '{}', 'en'),
('benefit_2', 'text', 'Benefit 2', 'Support manifestation of goals and desires', '{}', 'en'),
('benefit_3', 'text', 'Benefit 3', 'Enhance clarity, confidence, and inner calm', '{}', 'en'),
('benefit_4', 'text', 'Benefit 4', 'Integrate daily spiritual practice with ease', '{}', 'en'),

-- How it works
('step_1_title', 'text', 'Step 1 Title', 'Questionnaire', '{}', 'en'),
('step_1_desc', 'text', 'Step 1 Description', 'Share your personal goals, challenges, and intentions.', '{}', 'en'),
('step_2_title', 'text', 'Step 2 Title', 'Custom Meditation', '{}', 'en'),
('step_2_desc', 'text', 'Step 2 Description', 'Receive a one-of-a-kind affirmation soundtrack created for your energy.', '{}', 'en'),
('step_3_title', 'text', 'Step 3 Title', 'Daily Use', '{}', 'en'),
('step_3_desc', 'text', 'Step 3 Description', 'Listen regularly to amplify transformation and manifestation in your life.', '{}', 'en'),

-- Pricing - Basic Package
('basic_price', 'price', 'Basic Package Price', '1497', '{"currency": "SEK", "stripe_price_id": "price_1SZs4pAPsnbrivP0zvyPJHqb"}', 'en'),
('basic_title', 'text', 'Basic Package Title', 'Personalized Affirmation Soundtrack', '{}', 'en'),
('basic_cta', 'text', 'Basic CTA', 'Get Your Personalized Soundtrack', '{}', 'en'),

-- Pricing - Ultimate Package  
('ultimate_price', 'price', 'Ultimate Package Price', '2997', '{"currency": "SEK", "stripe_price_id": "price_1SZs5FAPsnbrivP0OBTsyeON"}', 'en'),
('ultimate_title', 'text', 'Ultimate Package Title', 'The Ultimate Soulwave Activation Package', '{}', 'en'),
('ultimate_subtitle', 'text', 'Ultimate Package Subtitle', 'Achieve Your Dreams and Transform Your Life', '{}', 'en'),
('ultimate_cta', 'text', 'Ultimate CTA', 'Get The Ultimate Package', '{}', 'en'),
('ultimate_savings', 'text', 'Ultimate Savings Text', 'Save 497 SEK vs purchasing separately', '{}', 'en'),
('ultimate_includes', 'text', 'Ultimate Includes', 'Includes 30 Days of Healing + Personalized Soundtrack + Private Session', '{}', 'en'),

-- Ultimate package items
('ultimate_soundtrack_title', 'text', 'Ultimate Soundtrack Title', 'Personalized Affirmation Soundtrack', '{}', 'en'),
('ultimate_soundtrack_item1', 'text', 'Ultimate Soundtrack Item 1', 'Tailored affirmations to reprogram your subconscious mind', '{}', 'en'),
('ultimate_soundtrack_item2', 'text', 'Ultimate Soundtrack Item 2', 'Sacred sounds and healing frequencies', '{}', 'en'),
('ultimate_soundtrack_item3', 'text', 'Ultimate Soundtrack Item 3', 'Binaural beats and soothing background music', '{}', 'en'),

('ultimate_healing_title', 'text', 'Ultimate Healing Title', '30 Days of Healing Transmission', '{}', 'en'),
('ultimate_healing_item1', 'text', 'Ultimate Healing Item 1', 'Daily healing sessions with divine energies', '{}', 'en'),
('ultimate_healing_item2', 'text', 'Ultimate Healing Item 2', 'Strengthen immune system & clear negativity', '{}', 'en'),
('ultimate_healing_item3', 'text', 'Ultimate Healing Item 3', 'Overcome physical and mental challenges', '{}', 'en'),

('ultimate_session_title', 'text', 'Ultimate Session Title', 'Private Online Session', '{}', 'en'),
('ultimate_session_item1', 'text', 'Ultimate Session Item 1', 'One-on-one session to explore your fears and goals', '{}', 'en'),
('ultimate_session_item2', 'text', 'Ultimate Session Item 2', 'Written game plan for your journey', '{}', 'en'),
('ultimate_session_item3', 'text', 'Ultimate Session Item 3', 'Direct guidance from sacred healers', '{}', 'en'),

-- Footer
('footer_title', 'text', 'Footer Title', 'Step into alignment, clarity, and empowerment.', '{}', 'en'),
('footer_desc', 'text', 'Footer Description', 'Use your personalized soundtrack daily to heal, manifest, and reprogram your mind.', '{}', 'en');

-- Add index for faster lookups
CREATE INDEX idx_affirmation_content_key_lang ON public.affirmation_content(content_key, language);