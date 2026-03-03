

## Welcome Email: Gap Analysis and Fix Plan

### Current State vs. Specification

The **deployed** `send-welcome-email/index.ts` is the **old version** and is missing almost everything from your specification:

| Feature | Spec | Deployed |
|---|---|---|
| IP geolocation | Yes | **Missing** |
| RESEND_API_KEY check | 503 if missing | **No check** — Resend created at top level blindly |
| Localized greeting | Per-language (Hej/Hello/Hola/Hei) | **Hardcoded "Hej"** for all languages |
| Localized CTA in template | Per-language field | Inline ternary (works but fragile) |
| Step-by-step logging | 7 steps with prefix | **Only 1 console.log** |
| Resend error handling | Check `result.error` | **No check** — fire and forget |
| Spanish country codes | 20+ countries mapped | **Missing** |
| Auth.tsx error logging | Log `welcomeData?.error` | Only catches thrown errors, not response errors |

### Plan

**1. Replace `send-welcome-email/index.ts` with the full version**

Use the complete implementation from your README spec (which matches the code you provided earlier in this conversation). Key changes:
- Move `Resend` instantiation inside the handler, after a key length check (return 503 if missing)
- Add IP detection from `x-forwarded-for` / `x-real-ip`
- Add geolocation via `ip-api.com` to resolve `countryCode`
- Map country to language: Spanish countries → `es`, NO → `no`, SE → `sv`, else `en`; fall back to client `language` param if no IP
- Add `greeting` and `cta` fields to each template (no more hardcoded "Hej")
- Add 7-step logging with `[send-welcome-email]` prefix
- Check `result.error` from Resend and return 500 with message
- Wrap send in try/catch for exceptions

**2. Update Auth.tsx to log response errors**

Currently line 191-197 only catches thrown errors. Add logging for the invoke response:
```
const { data: welcomeData, error: welcomeErr } = await supabase.functions.invoke(...)
if (welcomeErr) console.error('Welcome email invoke error:', welcomeErr);
if (welcomeData?.error) console.error('Welcome email send error:', welcomeData.error);
```

**3. Deploy the edge function**

Call `deploy_edge_functions` for `send-welcome-email` to push the updated code.

**4. No config.toml change needed** — `verify_jwt = false` is already set.

**5. No secret changes needed** — `RESEND_API_KEY` is already configured in secrets.

### Files Touched
- `supabase/functions/send-welcome-email/index.ts` — full rewrite
- `src/pages/Auth.tsx` — improved error logging (~3 lines)

