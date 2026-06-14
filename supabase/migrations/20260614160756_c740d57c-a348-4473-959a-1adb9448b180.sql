
-- Clawbot platform config: restrict to admins
DROP POLICY IF EXISTS "Anyone reads platform config" ON public.clawbot_platform_config;
CREATE POLICY "Admins read platform config"
  ON public.clawbot_platform_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Polymarket seen trades: restrict to admins
DROP POLICY IF EXISTS "Anyone reads seen" ON public.polymarket_seen_trades;
CREATE POLICY "Admins read seen trades"
  ON public.polymarket_seen_trades FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin SELECT/UPDATE for custom_meditation_bookings
CREATE POLICY "Admins view all custom meditation bookings"
  ON public.custom_meditation_bookings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all custom meditation bookings"
  ON public.custom_meditation_bookings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin SELECT/UPDATE for mastering_orders
CREATE POLICY "Admins view all mastering orders"
  ON public.mastering_orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all mastering orders"
  ON public.mastering_orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin SELECT/UPDATE for session_bookings
CREATE POLICY "Admins view all session bookings"
  ON public.session_bookings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all session bookings"
  ON public.session_bookings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin write policies for influencer_partners
CREATE POLICY "Admins insert influencer partners"
  ON public.influencer_partners FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update influencer partners"
  ON public.influencer_partners FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete influencer partners"
  ON public.influencer_partners FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
