## Goal

Apply the SQI Sovereign Shield database migration (security_events, rate_limit_events, blocked_users, RLS, auto-block trigger) and enable Realtime on `security_events` so `ThreatLevelIndicator` in `SecurityProvider.tsx` receives live HIGH/CRITICAL events.

## Problems found in the existing migration file

The file `supabase/migrations/20260504000000_sovereign_shield.sql` does NOT match the live schema and would break things if applied as-is:

1. **Wrong profiles join column** — file uses `auth.uid() = id`, but live `profiles` matches on `user_id` (confirmed via `pg_policies`). All current policies use `auth.uid() = user_id`.
2. **References non-existent columns** — the `prevent_tier_self_escalation` trigger reads `membership_tier`, `is_prana_flow`, `is_siddha_quantum`, `is_akasha_infinity` on `profiles`. None of these columns exist. The migration would fail at trigger creation, or silently misbehave.
3. **Hardcoded admin emails** — the project already uses the `has_role(auth.uid(), 'admin')` security-definer pattern (per project memory and existing policies). The migration's email allowlist (`sacredhealingvibe@gmail.com`, `laila.amrouche@gmail.com`) bypasses that system and creates a parallel admin model.
4. **Drops & replaces existing profile policies** — would weaken/duplicate already-working RLS for no benefit.

## Plan

### 1. Rewrite migration as a corrected version

Create a new migration that:

- Creates `security_events`, `rate_limit_events`, `blocked_users` tables + indexes (unchanged from original).
- Enables RLS and adds policies using `has_role(auth.uid(), 'admin')` for admin reads, matching project convention.
- Leaves `profiles` policies alone (they are already correct).
- **Skips** the `prevent_tier_self_escalation` trigger entirely (the columns don't exist; tier escalation prevention belongs in a separate, schema-correct migration once we know where tier lives — likely `user_memberships` or similar).
- Keeps `cleanup_rate_limit_events`, `is_user_blocked`, `security_dashboard` view, and `auto_block_on_critical` trigger.
- Adds `ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;` so the realtime channel in `SecurityProvider` works without a manual dashboard step.
- Sets `REPLICA IDENTITY FULL` on `security_events` for complete payloads.

### 2. Run via the migration tool

Apply the corrected SQL with `supabase--migration`. The user approves it in-place — no SQL Editor copy/paste required.

### 3. Verify post-migration

- Confirm tables exist and RLS is enabled.
- Confirm `security_events` is in the `supabase_realtime` publication.
- Confirm the `auto_block_trigger` is attached.

### 4. Note (no code changes this round)

`SecurityProvider.tsx` already subscribes to `postgres_changes` on `public.security_events` and inserts events with `severity` + `event_type` — it will start receiving live events automatically once realtime is enabled.

## What I will NOT do

- Will not touch `profiles` policies.
- Will not add the tier-escalation trigger (needs a separate plan once the actual tier column location is confirmed).
- Will not change `SecurityProvider.tsx` or `lib/security.ts`.

## Files

- New: `supabase/migrations/<new_timestamp>_sovereign_shield_fixed.sql` (via migration tool)
- The old `20260504000000_sovereign_shield.sql` stays on disk as a historical artifact but will not be re-run.
