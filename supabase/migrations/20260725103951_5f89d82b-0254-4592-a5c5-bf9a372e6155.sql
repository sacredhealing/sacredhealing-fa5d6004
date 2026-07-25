-- 1. Fix Content Vault drop cards: table-level grants were missing, so
--    PostgREST returned "permission denied" before RLS ever ran. The RLS
--    SELECT policy already restricts to published rows / owner / admin.
GRANT SELECT ON public.content_vault TO authenticated;
GRANT SELECT ON public.content_vault TO anon;
GRANT ALL ON public.content_vault TO service_role;

-- 2. Clean up the failed drop-card messages that were spamming Divine Sangha
--    while the catalog was unreachable. Only touches content_drop rows in
--    that specific room; every normal text/image/video/voice message stays.
DELETE FROM public.chat_messages
WHERE message_type = 'content_drop'
  AND room_id IN (
    SELECT id FROM public.chat_rooms WHERE name ILIKE '%divine sangha%'
  );