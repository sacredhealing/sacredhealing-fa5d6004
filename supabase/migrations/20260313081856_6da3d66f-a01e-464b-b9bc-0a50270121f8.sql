
CREATE TABLE IF NOT EXISTS public.divine_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'divine_transmissions',
  audio_url_en TEXT,
  audio_url_sv TEXT,
  cover_image_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  required_tier INTEGER NOT NULL DEFAULT 0,
  series_name TEXT,
  series_order INTEGER,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.divine_transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published transmissions"
  ON public.divine_transmissions FOR SELECT
  USING (published = true);

CREATE POLICY "Admins full access"
  ON public.divine_transmissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_divine_transmissions_category ON public.divine_transmissions(category);
CREATE INDEX IF NOT EXISTS idx_divine_transmissions_published ON public.divine_transmissions(published);

CREATE OR REPLACE FUNCTION public.update_divine_transmissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_divine_transmissions_updated_at
  BEFORE UPDATE ON public.divine_transmissions
  FOR EACH ROW EXECUTE FUNCTION public.update_divine_transmissions_updated_at();
