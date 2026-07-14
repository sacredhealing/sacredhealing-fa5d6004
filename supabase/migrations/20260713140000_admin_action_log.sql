-- Lightweight audit log for manual admin actions (e.g. granting membership
-- to someone who paid outside Stripe). Also fixes a real bug in
-- admin-user-management's update_membership action, which was writing to a
-- 'tier' column that doesn't exist on user_memberships (the real column is
-- tier_id, a foreign key to membership_tiers) — that action would have
-- failed on every use.

CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action          TEXT NOT NULL,
  target_user_id  UUID,
  performed_by    UUID,
  details         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access admin_action_log" ON public.admin_action_log;
CREATE POLICY "Admin full access admin_action_log" ON public.admin_action_log
  FOR ALL USING (public.is_admin_v3());
