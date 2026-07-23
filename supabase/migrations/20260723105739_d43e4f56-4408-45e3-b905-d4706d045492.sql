-- GROUP CHAT READ TRACKING
CREATE TABLE IF NOT EXISTS public.chat_room_reads (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, room_id)
);

GRANT SELECT, INSERT, UPDATE ON public.chat_room_reads TO authenticated;
GRANT ALL ON public.chat_room_reads TO service_role;

CREATE INDEX IF NOT EXISTS idx_chat_room_reads_user ON public.chat_room_reads(user_id);

ALTER TABLE public.chat_room_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own read state" ON public.chat_room_reads;
CREATE POLICY "Users can view their own read state"
ON public.chat_room_reads FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their own read state" ON public.chat_room_reads;
CREATE POLICY "Users can upsert their own read state"
ON public.chat_room_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own read state" ON public.chat_room_reads;
CREATE POLICY "Users can update their own read state"
ON public.chat_room_reads FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_unread_group_count(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total integer;
BEGIN
  SELECT COUNT(*)::integer INTO total
  FROM public.chat_messages cm
  JOIN public.chat_members mem
    ON mem.room_id = cm.room_id AND mem.user_id = _user_id
  LEFT JOIN public.chat_room_reads r
    ON r.room_id = cm.room_id AND r.user_id = _user_id
  WHERE cm.user_id != _user_id
    AND cm.created_at > COALESCE(r.last_read_at, 'epoch'::timestamptz);
  RETURN COALESCE(total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_group_count(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_room_read(_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chat_room_reads (user_id, room_id, last_read_at)
  VALUES (auth.uid(), _room_id, now())
  ON CONFLICT (user_id, room_id)
  DO UPDATE SET last_read_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_room_read(uuid) TO authenticated;