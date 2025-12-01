-- Create site_content table for editable content throughout the app
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL DEFAULT 'text',
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public content)
CREATE POLICY "Anyone can view site content" ON public.site_content FOR SELECT USING (true);

-- Insert default healing page content
INSERT INTO public.site_content (content_key, content_type, title, content, metadata) VALUES
('healing_main_title', 'text', 'Healing Page Title', 'Sacred Healing Space', '{}'),
('healing_main_subtitle', 'text', 'Healing Page Subtitle', 'Begin your transformative journey', '{}'),
('healing_intro', 'text', 'Healing Introduction', 'Welcome to a sacred space designed for deep healing and transformation. Our healing program combines ancient wisdom with modern energy healing techniques to help you release blockages, restore balance, and awaken your inner healing power.', '{}'),
('healing_feature_1_title', 'text', 'Feature 1 Title', 'Daily Healing Sessions', '{}'),
('healing_feature_1_text', 'text', 'Feature 1 Description', 'Guided meditations and energy transmissions to align your chakras, clear emotional wounds, and activate your body''s natural healing abilities.', '{}'),
('healing_feature_2_title', 'text', 'Feature 2 Title', 'Frequency Healing', '{}'),
('healing_feature_2_text', 'text', 'Feature 2 Description', 'Special audio tracks infused with healing frequencies (432Hz, 528Hz) designed to harmonize your energy field and promote cellular regeneration.', '{}'),
('healing_feature_3_title', 'text', 'Feature 3 Title', 'Chakra Balancing', '{}'),
('healing_feature_3_text', 'text', 'Feature 3 Description', 'Targeted healing sessions for each of your seven main chakras, helping you release stored trauma and restore energetic flow.', '{}'),
('healing_feature_4_title', 'text', 'Feature 4 Title', 'Emotional Release', '{}'),
('healing_feature_4_text', 'text', 'Feature 4 Description', 'Gentle techniques to help you process and release old emotions, traumas, and limiting beliefs that no longer serve your highest good.', '{}'),
('healing_price_onetime', 'number', 'One-time Price', '197', '{"currency": "USD", "days": 30}'),
('healing_price_monthly', 'number', 'Monthly Price', '50', '{"currency": "USD", "min_months": 3}'),
('dashboard_quote', 'text', 'Daily Quote', 'The wound is the place where the Light enters you.', '{"author": "Rumi"}');

-- Create trigger for updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();