CREATE TABLE IF NOT EXISTS public.kriya_yoga_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tier_required text NOT NULL DEFAULT 'free' CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  transmitter text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kriya_yoga_category ON public.kriya_yoga_entries(category);
CREATE INDEX IF NOT EXISTS idx_kriya_yoga_created_at ON public.kriya_yoga_entries(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kriya_yoga_entries TO authenticated;
GRANT SELECT ON public.kriya_yoga_entries TO anon;
GRANT ALL ON public.kriya_yoga_entries TO service_role;

ALTER TABLE public.kriya_yoga_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kriya_yoga_select_all" ON public.kriya_yoga_entries;
CREATE POLICY "kriya_yoga_select_all" ON public.kriya_yoga_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "kriya_yoga_admin_write" ON public.kriya_yoga_entries;
CREATE POLICY "kriya_yoga_admin_write" ON public.kriya_yoga_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_kriya_yoga_entries_updated_at ON public.kriya_yoga_entries;
CREATE TRIGGER update_kriya_yoga_entries_updated_at BEFORE UPDATE ON public.kriya_yoga_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meditation playlists (separate from music playlists)
CREATE TABLE IF NOT EXISTS public.meditation_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meditation_playlists TO authenticated;
GRANT ALL ON public.meditation_playlists TO service_role;

ALTER TABLE public.meditation_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meditation_playlists_own" ON public.meditation_playlists FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_meditation_playlists_updated_at ON public.meditation_playlists;
CREATE TRIGGER update_meditation_playlists_updated_at BEFORE UPDATE ON public.meditation_playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.meditation_playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.meditation_playlists(id) ON DELETE CASCADE,
  meditation_id uuid NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, meditation_id)
);

CREATE INDEX IF NOT EXISTS idx_meditation_playlist_items_playlist ON public.meditation_playlist_items(playlist_id, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meditation_playlist_items TO authenticated;
GRANT ALL ON public.meditation_playlist_items TO service_role;

ALTER TABLE public.meditation_playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meditation_playlist_items_own" ON public.meditation_playlist_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meditation_playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meditation_playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()));