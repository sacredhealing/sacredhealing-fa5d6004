DROP POLICY IF EXISTS "Service can create bundle purchases" ON public.bundle_purchases;
CREATE POLICY "Service can create bundle purchases"
  ON public.bundle_purchases
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Track ratings are viewable by everyone" ON public.track_ratings;
CREATE POLICY "Users can view their own track ratings"
  ON public.track_ratings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);