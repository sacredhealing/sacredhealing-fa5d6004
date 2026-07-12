# QR Sign-In: Apply migration + verify edge function

The frontend (`/qr-signin`, `/pair`) and the `qr-pairing` edge function code are already in the repo. Two things are missing on the live backend:

1. The `qr_pairing_tokens` table doesn't exist yet (confirmed via a live DB check).
2. The edge function needs to be (re)deployed so it can read/write that table.

## Step 1 — Create the table

Run one migration that creates `public.qr_pairing_tokens` with the right shape, GRANTs, RLS, and policy. I'm not running the file in `supabase/migrations/20260709_qr_pairing_tokens.sql` as-is because it's missing the `GRANT` block required for tables in the `public` schema, and its RLS policy has no `WITH CHECK` clause.

Migration will:

- Create `public.qr_pairing_tokens` with columns: `token` (uuid PK), `status` (text, default `'pending'`), `user_id` (uuid → `auth.users`), `session_hash` (text), `created_at`, `expires_at` (default `now() + 5 minutes`).
- Index on `(status, expires_at)` for the opportunistic cleanup query.
- `GRANT ALL ... TO service_role` only. No `anon` / `authenticated` grants — the frontend never touches this table directly, only via the edge function using the service role.
- `ENABLE ROW LEVEL SECURITY`.
- Policy `"Service role only" FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role')` — belt and braces; with no other grants this is already unreachable from clients, but keeping RLS on means a future accidental grant can't leak it.
- `cleanup_qr_pairing_tokens()` housekeeping function (matches what the current file defines).

In plain terms for you: this adds one internal table used only by the QR sign-in flow. Nobody signed into the site can read or write it — only the server-side function that runs the pairing handshake can. Nothing existing changes.

## Step 2 — Deploy the edge function

After the migration is approved, redeploy `qr-pairing` so the freshly-created table is visible to it and the function is confirmed live at its URL. Nothing about the function's code needs to change.

## Step 3 — What to test

Once both are done:

1. Desktop (logged out): open `sacredhealing.lovable.app/qr-signin` → QR code should render (not the "Could not generate a QR code right now" error).
2. Phone (logged in): scan → lands on `/pair?token=...` → tap "Approve".
3. Desktop should auto-sign-in within ~2.5s (the poll interval).

If any step fails, I'll pull edge function logs to see the exact error.

## Not doing in this plan

- No frontend changes (`QRSignIn.tsx`, `Auth.tsx`, etc. stay as-is).
- No changes to the existing edge function code — just a redeploy.
- Not touching the 5 unrelated security-scan findings visible in the More panel (`affiliate_profiles`, `reviews`, `user_balances`, `challenge_participants`, daily activity SHC self-award). Happy to do those in a separate pass if you want — they're pre-existing and unrelated to QR sign-in.
