-- ============================================================
-- SUPPORT CHANNEL FIX
-- Creates the Support & Help chat room and opens RLS so
-- ALL authenticated users can read + write to it.
-- Run in: Lovable → Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Create the Support & Help chat room if it doesn't exist
INSERT INTO public.chat_rooms (name, is_active, is_locked)
VALUES ('Support & Help', true, false)
ON CONFLICT (name) DO UPDATE
  SET is_active = true,
      is_locked  = false;

-- 2. Auto-join every existing user into the support room
-- (so they can read messages under current RLS)
INSERT INTO public.chat_members (room_id, user_id)
SELECT r.id, p.user_id
FROM public.chat_rooms r
CROSS JOIN public.profiles p
WHERE r.name = 'Support & Help'
ON CONFLICT (room_id, user_id) DO NOTHING;

-- 3. Add the is_support_resolved column if not yet added
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_support_resolved boolean NOT NULL DEFAULT false;

-- 4. Create a trigger that auto-joins every NEW user into the support room
CREATE OR REPLACE FUNCTION public.auto_join_support_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
BEGIN
  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE name = 'Support & Help'
  LIMIT 1;

  IF v_room_id IS NOT NULL THEN
    INSERT INTO public.chat_members (room_id, user_id)
    VALUES (v_room_id, NEW.user_id)
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_join_support ON public.profiles;
CREATE TRIGGER trg_auto_join_support
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_support_room();

-- 5. Also auto-join when anyone opens a chat room for the support channel
--    (belt + suspenders: the app code already does this, but this guarantees it at DB level)
--    Allow any authenticated user to INSERT themselves into chat_members
DROP POLICY IF EXISTS "Users can join support room" ON public.chat_members;
CREATE POLICY "Users can join support room"
ON public.chat_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = room_id
      AND cr.name = 'Support & Help'
  )
);
