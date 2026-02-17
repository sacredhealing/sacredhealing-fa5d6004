# soul_sync_v1 (Rishi Automation Engine)

`soul_sync_v1` is a Supabase Edge Function that scans recent mantra practice and sends a compassionate follow-up message aligned to an approximate **planetary hour** signal.

Current focus (v1):
- Detect users practicing **Sun** mantras recently
- If they are **not** Stargate members, send a gentle invitation referencing the *Stargate Solar module* without sales language
- Sends both **email (Resend)** and an **in-app DM** (from an admin user)

## Environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Invoke (dry run)

Send no emails/DMs, but logs what would happen:

```bash
supabase functions invoke soul_sync_v1 --body '{"dryRun": true}'
```

## Invoke (live)

```bash
supabase functions invoke soul_sync_v1 --body '{"dryRun": false}'
```

## Notes

- Planetary hour logic is an approximation in UTC (sunrise varies by location). It’s used as a *soft timing signal* for messaging tone, not as a strict Jyotish engine.
- Stargate membership is detected via `public.stargate_community_members` (buyers are auto-added via Stripe webhook + admins can manually add members).

