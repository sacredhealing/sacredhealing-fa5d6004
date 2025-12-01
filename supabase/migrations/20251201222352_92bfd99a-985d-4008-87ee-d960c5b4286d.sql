-- Allow authenticated users to manage announcements (admin check should be in app logic)
CREATE POLICY "Authenticated users can insert announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (true);

-- Also allow viewing all announcements for admin
CREATE POLICY "Authenticated users can view all announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (true);