-- ============================================================================
-- CLEAN UP BROKEN CONTENT-DROP TEST MESSAGES
-- Safe: only deletes chat_messages rows that are content_drop type AND
-- point at a content_vault id that no longer exists (the "Drop card failed
-- to load" ones from earlier testing). Every normal text/image/video/voice
-- message, and every WORKING content_drop, is left completely untouched.
-- ============================================================================

-- STEP 1 — REVIEW: see exactly what would be deleted, before deleting anything
SELECT cm.id, cm.content, cm.content_id, cm.created_at, cr.name AS room_name
FROM public.chat_messages cm
LEFT JOIN public.content_vault cv ON cv.id = cm.content_id
LEFT JOIN public.chat_rooms cr ON cr.id = cm.room_id
WHERE cm.message_type = 'content_drop'
  AND cv.id IS NULL;  -- content_id points at a row that doesn't exist anymore

-- STEP 2 — DELETE: run this once you've confirmed Step 1 only shows junk
DELETE FROM public.chat_messages
WHERE message_type = 'content_drop'
  AND content_id IS NOT NULL
  AND content_id NOT IN (SELECT id FROM public.content_vault);

-- STEP 3 — VERIFY: should return 0
SELECT COUNT(*) AS still_broken
FROM public.chat_messages cm
LEFT JOIN public.content_vault cv ON cv.id = cm.content_id
WHERE cm.message_type = 'content_drop' AND cv.id IS NULL;
