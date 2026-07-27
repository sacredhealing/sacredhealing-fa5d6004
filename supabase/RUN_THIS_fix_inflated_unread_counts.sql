-- ============================================================================
-- FIX CURRENTLY-INFLATED UNREAD COUNTS (one-time backfill)
-- ============================================================================
-- Real bug: any room you're a chat_members member of but have no
-- chat_room_reads row for gets treated as "everything since 1970 is
-- unread" by the unread counter. Being auto-joined to a channel (which
-- happens just from opening it) could silently dump that channel's
-- entire history into your unread count. The app-side fix now creates a
-- read-marker the moment someone joins, but that only prevents this
-- going forward — this backfills a baseline for everyone already
-- affected, so the count becomes accurate immediately instead of slowly
-- fixing itself room by room as people happen to open each one.
-- ============================================================================

INSERT INTO public.chat_room_reads (room_id, user_id, last_read_at)
SELECT cm.room_id, cm.user_id, now()
FROM public.chat_members cm
LEFT JOIN public.chat_room_reads cr
  ON cr.room_id = cm.room_id AND cr.user_id = cm.user_id
WHERE cr.id IS NULL
ON CONFLICT DO NOTHING;

-- Verify — should return 0 once the backfill above has run
SELECT COUNT(*) AS still_missing_read_marker
FROM public.chat_members cm
LEFT JOIN public.chat_room_reads cr
  ON cr.room_id = cm.room_id AND cr.user_id = cm.user_id
WHERE cr.id IS NULL;
