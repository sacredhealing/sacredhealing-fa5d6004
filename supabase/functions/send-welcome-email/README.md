# Send Welcome Email

Sends a localized welcome email after signup. Language is chosen by **IP geolocation** at request time (Spanish for Spanish-speaking countries, Norwegian for Norway, Swedish for Sweden, English for the rest). Falls back to client-provided `language` if IP is unavailable (e.g. localhost).

## Flow

1. **Request** – Body: `{ email, name?, language? }`. Triggered from Auth page after successful signup.
2. **IP detection** – Reads `x-forwarded-for` or `x-real-ip` from request headers.
3. **Geolocation** – Calls ip-api.com (no key) to get `countryCode` for the IP.
4. **Language** – Maps country to one of: `es`, `no`, `sv`, `en`. Spanish for all Spanish-speaking countries; Norway → `no`, Sweden → `sv`; else `en`. If no IP/local IP, uses `language` from body (e.g. app locale).
5. **Template** – Picks subject, greeting, body, footer, CTA for the selected language.
6. **Send** – Uses Resend API. Logs each step for debugging.

## Environment

- **RESEND_API_KEY** (required) – Set in Supabase Dashboard → Edge Functions → send-welcome-email → Secrets. If missing, the function returns 503 and logs "RESEND_API_KEY missing or invalid".

## Logging

All steps are logged with prefix `[send-welcome-email]`:

- Step 1: Request received, parsed body
- Step 2: IP detection (raw IP, headers)
- Step 3: Geolocation result or skip
- Step 4: Language selection (from geo and from client, final choice)
- Step 5: Template selected
- Step 6: Before Resend API call
- Step 7: Success (with Resend id) or error

Check Supabase Dashboard → Edge Functions → Logs to trace failures (e.g. missing key, Resend errors, geolocation failures).
