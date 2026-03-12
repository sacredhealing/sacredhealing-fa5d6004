-- Re-run: Create divine_transmissions table if it does not yet exist
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'divine_transmissions' AND policyname = 'Anyone can view published transmissions'
  ) THEN
    CREATE POLICY "Anyone can view published transmissions"
      ON public.divine_transmissions FOR SELECT
      TO authenticated
      USING (published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'divine_transmissions' AND policyname = 'Admins can manage transmissions'
  ) THEN
    CREATE POLICY "Admins can manage transmissions"
      ON public.divine_transmissions FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_divine_transmissions_category
  ON public.divine_transmissions(category);

CREATE INDEX IF NOT EXISTS idx_divine_transmissions_published
  ON public.divine_transmissions(published);
