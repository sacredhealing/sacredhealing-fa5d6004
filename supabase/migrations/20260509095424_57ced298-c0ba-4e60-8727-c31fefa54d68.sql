ALTER TABLE public.active_transmissions
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "Users manage own transmission" ON public.active_transmissions;
DROP POLICY IF EXISTS "Users manage own active transmission" ON public.active_transmissions;

CREATE POLICY "Users manage own active transmission"
  ON public.active_transmissions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own pilgrimage activations" ON public.virtual_pilgrimage_activations;
DROP POLICY IF EXISTS "Users can manage their own pilgrimage" ON public.virtual_pilgrimage_activations;
DROP POLICY IF EXISTS "Service role can pulse virtual pilgrimage" ON public.virtual_pilgrimage_activations;
DROP POLICY IF EXISTS "Service role can pulse all active pilgrimages" ON public.virtual_pilgrimage_activations;

CREATE POLICY "Users can manage their own pilgrimage"
  ON public.virtual_pilgrimage_activations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can pulse virtual pilgrimage"
  ON public.virtual_pilgrimage_activations
  FOR UPDATE
  USING (auth.role() = 'service_role');