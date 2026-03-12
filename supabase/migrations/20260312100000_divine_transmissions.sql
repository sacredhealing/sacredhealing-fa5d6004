-- Divine Transmissions: non-meditation audio talks for the Explore Akasha "Wisdom Archive"
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

DROP POLICY IF EXISTS "Anyone can view published transmissions" ON public.divine_transmissions;
CREATE POLICY "Anyone can view published transmissions"
  ON public.divine_transmissions FOR SELECT
  TO authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Admins can manage transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can manage transmissions"
  ON public.divine_transmissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
