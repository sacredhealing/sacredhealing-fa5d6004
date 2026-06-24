
-- session_bookings: block users from changing sensitive fields on their own rows
CREATE OR REPLACE FUNCTION public.guard_session_bookings_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.session_type_id IS DISTINCT FROM OLD.session_type_id
     OR NEW.practitioner_id IS DISTINCT FROM OLD.practitioner_id
     OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.amount_paid IS DISTINCT FROM OLD.amount_paid
     OR NEW.stripe_payment_id IS DISTINCT FROM OLD.stripe_payment_id
     OR NEW.contact_email IS DISTINCT FROM OLD.contact_email
     OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone
  THEN
    RAISE EXCEPTION 'Not allowed to modify protected fields on session_bookings';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_session_bookings_user_update ON public.session_bookings;
CREATE TRIGGER trg_guard_session_bookings_user_update
BEFORE UPDATE ON public.session_bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_session_bookings_user_update();

DROP POLICY IF EXISTS "Users can update own bookings" ON public.session_bookings;
CREATE POLICY "Users can update own bookings"
ON public.session_bookings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- custom_meditation_bookings
CREATE OR REPLACE FUNCTION public.guard_custom_meditation_bookings_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col record;
  allowed text[] := ARRAY['notes','additional_notes','updated_at'];
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  FOR col IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='custom_meditation_bookings'
  LOOP
    IF col.column_name = ANY(allowed) THEN CONTINUE; END IF;
    EXECUTE format(
      'SELECT ($1).%I IS DISTINCT FROM ($2).%I',
      col.column_name, col.column_name
    ) INTO STRICT col USING NEW, OLD;
  END LOOP;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- fallback explicit check
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.amount_paid IS DISTINCT FROM OLD.amount_paid
     OR NEW.stripe_payment_id IS DISTINCT FROM OLD.stripe_payment_id
     OR NEW.contract_signed IS DISTINCT FROM OLD.contract_signed
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Not allowed to modify protected fields on custom_meditation_bookings';
  END IF;
  RETURN NEW;
END;
$$;

-- simpler, explicit version: replace the function with an explicit field check
CREATE OR REPLACE FUNCTION public.guard_custom_meditation_bookings_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.amount_paid IS DISTINCT FROM OLD.amount_paid
     OR NEW.stripe_payment_id IS DISTINCT FROM OLD.stripe_payment_id
     OR NEW.contract_signed IS DISTINCT FROM OLD.contract_signed
  THEN
    RAISE EXCEPTION 'Not allowed to modify protected fields on custom_meditation_bookings';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_custom_meditation_bookings_user_update ON public.custom_meditation_bookings;
CREATE TRIGGER trg_guard_custom_meditation_bookings_user_update
BEFORE UPDATE ON public.custom_meditation_bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_custom_meditation_bookings_user_update();

DROP POLICY IF EXISTS "Users can update own bookings" ON public.custom_meditation_bookings;
CREATE POLICY "Users can update own bookings"
ON public.custom_meditation_bookings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- mastering_orders
CREATE OR REPLACE FUNCTION public.guard_mastering_orders_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.amount_paid IS DISTINCT FROM OLD.amount_paid
     OR NEW.stripe_payment_id IS DISTINCT FROM OLD.stripe_payment_id
  THEN
    RAISE EXCEPTION 'Not allowed to modify protected fields on mastering_orders';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_mastering_orders_user_update ON public.mastering_orders;
CREATE TRIGGER trg_guard_mastering_orders_user_update
BEFORE UPDATE ON public.mastering_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_mastering_orders_user_update();

DROP POLICY IF EXISTS "Users can update own mastering orders" ON public.mastering_orders;
CREATE POLICY "Users can update own mastering orders"
ON public.mastering_orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
