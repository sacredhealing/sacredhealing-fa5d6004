
-- Tighten shreem_brzee_paper_trades reads to admins only
DROP POLICY IF EXISTS "shreem_trades_auth_read" ON public.shreem_brzee_paper_trades;
CREATE POLICY "shreem_trades_admin_read"
  ON public.shreem_brzee_paper_trades
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten shreem_brzee_session reads to admins only
DROP POLICY IF EXISTS "shreem_session_auth_read" ON public.shreem_brzee_session;
CREATE POLICY "shreem_session_admin_read"
  ON public.shreem_brzee_session
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict post_likes SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Authenticated users can view likes"
  ON public.post_likes
  FOR SELECT
  TO authenticated
  USING (true);
