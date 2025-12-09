-- Add policies for music_tracks table management
CREATE POLICY "Authenticated users can insert music tracks"
ON public.music_tracks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update music tracks"
ON public.music_tracks FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete music tracks"
ON public.music_tracks FOR DELETE
TO authenticated
USING (true);