DROP POLICY IF EXISTS "Users select own bhrigu readings" ON public.bhrigu_readings;
DROP POLICY IF EXISTS "Admin select all bhrigu readings" ON public.bhrigu_readings;

CREATE POLICY "Users select own bhrigu readings"
  ON public.bhrigu_readings FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid
  );