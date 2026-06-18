
-- Restrict shreem_brzee_signals SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can read signals" ON public.shreem_brzee_signals;
CREATE POLICY "Admins can read signals"
  ON public.shreem_brzee_signals FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict students INSERT to admins only (prevents arbitrary self-assignment as practitioner)
DROP POLICY IF EXISTS "Practitioners insert own students" ON public.students;
CREATE POLICY "Admins insert students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict tracked_whales INSERT to admins only (prevents data poisoning)
DROP POLICY IF EXISTS "Authenticated can add tracked whales" ON public.tracked_whales;
CREATE POLICY "Admins can add tracked whales"
  ON public.tracked_whales FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
