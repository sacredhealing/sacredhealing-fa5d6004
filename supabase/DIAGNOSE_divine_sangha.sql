-- DIAGNOSTIC ONLY — does not change any data. Run and paste back every result.

-- 1. Every row whose name could match "Divine Sangha" — how many are there really?
SELECT id, name, is_active, type, created_at
FROM public.chat_rooms
WHERE name ILIKE '%divine sangha%' OR name ILIKE '%community lounge%'
ORDER BY created_at ASC;

-- 2. Did the "Guided Relaxation" post actually create a chat_messages row,
--    and if so, which room_id did it go into?
SELECT cm.id, cm.room_id, cm.message_type, cm.content_id, cm.content, cm.created_at, cr.name AS room_name
FROM public.chat_messages cm
LEFT JOIN public.chat_rooms cr ON cr.id = cm.room_id
WHERE cm.message_type = 'content_drop'
ORDER BY cm.created_at DESC
LIMIT 10;

-- 3. Confirm the content_vault row for "Guided Relaxation" actually exists
--    and is published.
SELECT id, title, content_type, is_published, metadata
FROM public.content_vault
WHERE title ILIKE '%guided relaxation%';
