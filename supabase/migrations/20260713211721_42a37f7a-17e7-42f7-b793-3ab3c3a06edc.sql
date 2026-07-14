CREATE OR REPLACE FUNCTION public.get_featured_content(p_kind TEXT DEFAULT NULL, p_category TEXT DEFAULT NULL)
RETURNS TABLE(kind TEXT, title TEXT, duration_label TEXT, url_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v RECORD;
BEGIN
  SELECT 'drop' AS kind, dt.title,
         CASE WHEN dt.content_type = 'video' THEN 'Video' ELSE (dt.duration_seconds / 60)::text || ' min' END AS duration_label,
         '/explore-akasha' AS url_path
  INTO v FROM public.divine_transmissions dt
  WHERE dt.published = true
    AND dt.price_usd IS NOT NULL
    AND dt.created_at >= now() - interval '8 days'
  ORDER BY dt.created_at DESC LIMIT 1;
  IF v.title IS NOT NULL THEN RETURN QUERY SELECT v.kind, v.title, v.duration_label, v.url_path; RETURN; END IF;

  IF p_kind = 'mantra' OR p_kind IS NULL THEN
    SELECT 'mantra' AS kind, m.title,
           (m.duration_seconds / 60)::text || ' min' AS duration_label,
           '/mantras' AS url_path
    INTO v FROM public.mantras m WHERE m.is_active = true
    ORDER BY random() LIMIT 1;
    IF v.title IS NOT NULL THEN RETURN QUERY SELECT v.kind, v.title, v.duration_label, v.url_path; RETURN; END IF;
  END IF;

  IF p_kind = 'meditation' OR p_kind IS NULL THEN
    SELECT 'meditation' AS kind, me.title, me.duration_minutes::text || ' min' AS duration_label, '/meditations' AS url_path
    INTO v FROM public.meditations me
    WHERE (p_category IS NULL OR me.category = p_category)
    ORDER BY random() LIMIT 1;
    IF v.title IS NOT NULL THEN RETURN QUERY SELECT v.kind, v.title, v.duration_label, v.url_path; RETURN; END IF;
  END IF;

  IF p_kind = 'music' OR p_kind IS NULL THEN
    SELECT 'music' AS kind, mt.title, (mt.duration_seconds / 60)::text || ' min' AS duration_label, '/music' AS url_path
    INTO v FROM public.music_tracks mt
    ORDER BY random() LIMIT 1;
    IF v.title IS NOT NULL THEN RETURN QUERY SELECT v.kind, v.title, v.duration_label, v.url_path; RETURN; END IF;
  END IF;

  RETURN;
END;
$$;