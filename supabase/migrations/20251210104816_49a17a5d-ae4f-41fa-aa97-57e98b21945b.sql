-- Create practitioners table for managing practitioner profiles
CREATE TABLE public.practitioners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug IN ('adam', 'laila')),
  subtitle text,
  image_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;

-- Anyone can view practitioners
CREATE POLICY "Anyone can view practitioners" ON public.practitioners FOR SELECT USING (true);

-- Authenticated users can manage practitioners
CREATE POLICY "Authenticated users can manage practitioners" ON public.practitioners FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default practitioners
INSERT INTO public.practitioners (name, slug, subtitle, description) VALUES
('Adam', 'adam', 'Spiritual Guide & Energy Practitioner', 'Supporting healing through vibrational medicine and meditation, helping individuals realign with life purpose and inner wisdom.'),
('Laila', 'laila', 'Yogi & Sound Healer', 'Channeling divine energy through meditation, mantra, and transformational breathwork, empowering individuals to awaken their intuition.');