## Goal

Fix the Monday newsletter so it (a) clearly comes from **Adam & Laila** (not "Shiva · SQI"), (b) the "What's New in the Nexus" section automatically lists every new thing users can actually use across the app from the last 7 days (audio, courses, mantras, meditations, tools, announcements, etc.), and (c) it sends automatically every Monday to all users — no manual trigger.

Tone/visual style of the existing mystical email is kept as-is per your selection (only the sender name and the "What's New" content source change).

## Changes

### 1. `supabase/functions/weekly-digest/index.ts`

- **From header** — change `Shiva · SQI <noreply@siddhaquantumnexus.com>` to `Adam & Laila <noreply@siddhaquantumnexus.com>`.
- **Footer signature** — add a small "— With love, Adam & Laila" line above the existing footer so the personal source is obvious even when "From" gets truncated in inboxes.
- **"What's New" source** — replace the current `content_changelog`-only query with an aggregated 7-day scan across every table that represents something a user can use:
  - `mantras` (new + `is_active`)
  - `meditations`
  - `healing_audio`
  - `music_tracks` / `music_albums`
  - `courses` + new `lessons`
  - `ambient_sounds` / `sound_library`
  - `creative_tools`
  - `transformation_programs` / `transformation_variations`
  - `divine_transmissions`
  - `announcements`
  - `live_events`
  - `content_changelog` (kept as manual override / catch-all)
  
  Each row is normalized into `{ type, title, description, created_at }`, sorted newest-first, capped at ~20 items, grouped by type in the email (New Audio, New Meditations, New Mantras, New Courses, New Tools, Announcements, etc.).
- Empty-state stays the same wording.

### 2. Automatic Monday delivery

A pg_cron job is scheduled to POST to `weekly-digest` every Monday at 09:00 UTC, using the project's `CRON_SECRET` via `X-Cron-Secret` (the function already accepts this). If `CRON_SECRET` isn't set yet, we set it as a Supabase secret first.

```text
Schedule: 0 9 * * 1  (every Monday 09:00 UTC)
Endpoint: /functions/v1/weekly-digest
Auth:     X-Cron-Secret header
Audience: every auth user with an email (current behavior preserved)
```

Existing `sqi-weekly-digest` schedule is unscheduled first if present, to avoid duplicates.

### 3. Deploy

After the function edits, `weekly-digest` is redeployed so the new sender + grouped "What's New" go live immediately. A one-off test send to your admin email confirms the new layout before the first scheduled Monday run.

## Out of scope (not changed)

- Visual design, colors, mystical copy ("Monday Transmission", Personal Transmission block, Gemini-generated paragraph) — kept exactly as it is.
- Other weekly functions (`weekly-motivational-email`, `weekly-alignment-email`) — untouched.
- Unsubscribe / suppression flow — unchanged (current behavior: sends to all auth users).
