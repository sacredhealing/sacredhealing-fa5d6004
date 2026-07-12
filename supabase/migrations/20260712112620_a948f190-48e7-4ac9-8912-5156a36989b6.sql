DROP POLICY IF EXISTS "Anyone can view stream messages" ON public.live_stream_messages;
CREATE POLICY "Authenticated users can view stream messages"
ON public.live_stream_messages
FOR SELECT
TO authenticated
USING (true);