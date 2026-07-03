
-- 1. clawbot_members: revoke read access on sensitive API credential columns from authenticated
-- Column-level: grant SELECT only on non-sensitive columns
REVOKE SELECT ON public.clawbot_members FROM authenticated;
GRANT SELECT (
  id, user_id, poly_wallet_address, tier, platform_fee_pct, is_active, paper_mode,
  balance_usdc, total_won_usdc, total_fees_paid_usdc, joined_at, updated_at
) ON public.clawbot_members TO authenticated;
-- Service role retains full access for edge functions (clawbot-bridge)
GRANT ALL ON public.clawbot_members TO service_role;

-- 2. lessons: restrict SELECT to admins, enrolled users, or preview lessons
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

CREATE POLICY "Preview lessons are public"
ON public.lessons
FOR SELECT
USING (is_preview = true);

CREATE POLICY "Enrolled users can view lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.course_id = lessons.course_id
      AND ce.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. suppressed_emails: add admin SELECT policy
CREATE POLICY "Admins can view suppressed emails"
ON public.suppressed_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. user_roles: add restrictive policy so only admins can INSERT/UPDATE/DELETE, preventing privilege escalation
CREATE POLICY "Only admins can modify roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. content_changelog: document admin-only intent
COMMENT ON TABLE public.content_changelog IS
  'Internal admin-only log of content changes. Not surfaced to end users. RLS: admins only.';

-- 6. email_subscribers: document admin-only intent
COMMENT ON TABLE public.email_subscribers IS
  'Admin-only subscriber list. Public signups go through SECURITY DEFINER function subscribe_to_newsletter(). No public SELECT/RPC exposes this data.';
