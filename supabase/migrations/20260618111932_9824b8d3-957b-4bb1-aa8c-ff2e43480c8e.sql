CREATE TABLE IF NOT EXISTS public.tracked_whales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  source TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracked_whales TO authenticated;
GRANT SELECT ON public.tracked_whales TO anon;
GRANT ALL ON public.tracked_whales TO service_role;

ALTER TABLE public.tracked_whales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tracked whales"
  ON public.tracked_whales FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can add tracked whales"
  ON public.tracked_whales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update tracked whales"
  ON public.tracked_whales FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tracked whales"
  ON public.tracked_whales FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tracked_whales_updated
  BEFORE UPDATE ON public.tracked_whales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();