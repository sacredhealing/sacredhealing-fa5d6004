-- ============================================================================
-- CLEAN UP DUPLICATE CHAT ROOMS
-- Run the SELECT first to review, then the UPDATE to actually clean up.
-- Nothing is deleted — duplicates are set is_active = false, so they stop
-- showing up in room pickers (including the Content Vault "post to" dropdown)
-- but message history is preserved if anyone ever needs it.
-- ============================================================================

-- STEP 1 — REVIEW: see every duplicate-named room and how many messages each copy has
SELECT
  cr.id,
  cr.name,
  cr.is_active,
  cr.created_at,
  COUNT(cm.id) AS message_count
FROM public.chat_rooms cr
LEFT JOIN public.chat_messages cm ON cm.room_id = cr.id
WHERE cr.name IN (
  SELECT name FROM public.chat_rooms
  WHERE is_active = true
  GROUP BY name
  HAVING COUNT(*) > 1
)
GROUP BY cr.id, cr.name, cr.is_active, cr.created_at
ORDER BY cr.name, message_count DESC;


-- STEP 2 — CLEAN UP: for each duplicate name, keep the copy with the most
-- messages (ties broken by oldest = likely the original), deactivate the rest.
WITH ranked AS (
  SELECT
    cr.id,
    cr.name,
    COUNT(cm.id) AS message_count,
    ROW_NUMBER() OVER (
      PARTITION BY cr.name
      ORDER BY COUNT(cm.id) DESC, cr.created_at ASC
    ) AS rnk
  FROM public.chat_rooms cr
  LEFT JOIN public.chat_messages cm ON cm.room_id = cr.id
  WHERE cr.is_active = true
    AND cr.name IN (
      SELECT name FROM public.chat_rooms
      WHERE is_active = true
      GROUP BY name
      HAVING COUNT(*) > 1
    )
  GROUP BY cr.id, cr.name, cr.created_at
)
UPDATE public.chat_rooms
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rnk > 1);


-- STEP 3 — VERIFY: should return zero rows if cleanup worked
SELECT name, COUNT(*) FROM public.chat_rooms
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1;
