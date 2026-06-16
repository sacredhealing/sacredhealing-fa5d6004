## Audit: what works, what doesn't

### ✅ `/admin/email-list` — works
- Reads/writes `email_subscribers` (88 active subs).
- CSV export, add/edit/delete subscriber — all wired to a table that exists.
- "Send Email" button on this page links to `/admin/send-email` (the bulk sender).

### ✅ Bulk send to the whole list — works
- `/admin/send-email` (`AdminSendEmail.tsx`) calls edge function `send-bulk-email`.
- `send-bulk-email` is deployed, queries `email_subscribers WHERE is_active = true`, sends via Resend with the branded template, batches of 10, admin-only auth gate.
- Sender: `Sacred Healing <noreply@mail.siddhaquantumnexus.com>` (verify this subdomain is verified in Resend, otherwise sends will fail).
- This is the page to actually email the 88 subscribers.

### ❌ `/admin/email-automation` — broken
This page (`EmailManager.tsx`) depends on two tables that **do not exist** in the database:
- `content_changelog` — used by the "New Content" tab (log + list) → every action fails.
- `email_logs` — used by the "Logs" tab → tab is empty/errors.

Other issues on this page:
- "Send Monday Digest Now" → calls `weekly-digest` function, which likely also reads `content_changelog`/`email_logs` → will fail.
- "Send Lakshmi Friday Now" → calls `lakshmi-friday` function → same risk.
- "Send Email to user" tab calls `send-to-user` (single user only — not a bulk-to-list sender).

### ❌ `send-email-list` edge function — broken
Queries a non-existent `email_list` table. Unused by the UI but should either be removed or pointed at `email_subscribers`.

---

## Proposed plan

**1. Create the two missing tables** (with RLS, grants, admin-only policies):

```sql
-- content_changelog: log of new content for digests/announcements
create table public.content_changelog (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_title text not null,
  content_description text,
  tier_required text not null default 'free',
  auto_announced boolean not null default false,
  included_in_digest boolean not null default false,
  created_at timestamptz not null default now()
);

-- email_logs: per-email send history surfaced in the Logs tab
create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  email_type text not null,
  recipient_email text,
  subject text,
  status text not null default 'sent',
  error text,
  sent_at timestamptz not null default now()
);
```
+ `GRANT` to `authenticated` / `service_role` + RLS policies restricted to `has_role(auth.uid(),'admin')`.

**2. Verify the three digest/blast edge functions** (`weekly-digest`, `lakshmi-friday`, `send-to-user`) read/write these tables correctly; patch any column mismatches and redeploy.

**3. Fix `send-email-list`** — repoint to `email_subscribers` (or delete it, since `send-bulk-email` already covers this).

**4. Add a clear link from `/admin/email-list` → `/admin/send-email`** so the "send to whole list" path is obvious (it already exists, just labeling).

### Out of scope (ask if you want them)
- Building a real digest content pipeline (requires deciding what auto-populates `content_changelog`).
- Replacing `email_logs` with the platform `email_send_log` table that's already in your DB (would unify with auth/transactional logs).

Shall I proceed with steps 1–4?