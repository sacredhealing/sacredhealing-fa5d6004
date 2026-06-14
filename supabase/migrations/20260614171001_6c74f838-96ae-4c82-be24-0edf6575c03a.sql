
-- Restrict course_materials SELECT to enrolled users (or admins)
DROP POLICY IF EXISTS "Anyone can view materials" ON public.course_materials;

CREATE POLICY "Enrolled users can view course materials"
ON public.course_materials
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.course_id = course_materials.course_id
      AND ce.user_id = auth.uid()
  )
);

-- Restrict healing_audio SELECT: free tracks remain public, paid tracks only for purchasers/admins
DROP POLICY IF EXISTS "Anyone can view healing audio" ON public.healing_audio;

CREATE POLICY "View free or purchased healing audio"
ON public.healing_audio
FOR SELECT
USING (
  is_free = true
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.healing_audio_purchases hap
    WHERE hap.audio_id = healing_audio.id
      AND hap.user_id = auth.uid()
  )
);
