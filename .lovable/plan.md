

## Plan: Remove custom reset email invocation from Auth.tsx

### Context

The password reset flow currently does two things:
1. Calls `supabase.auth.resetPasswordForEmail()` — this is the standard Supabase method that sends a reset email via Supabase's built-in SMTP
2. Calls `supabase.functions.invoke('send-reset-email')` — a custom edge function that sends a *second* reset email via Resend

Once Supabase SMTP is configured with Resend credentials (Thing 1 — done by you in the Supabase dashboard), the built-in call handles everything. The custom edge function call becomes redundant and should be removed.

### What I'll change

**File: `src/pages/Auth.tsx` (lines 461–463)**

Remove these 3 lines:
```ts
await supabase.functions.invoke('send-reset-email', {
  body: { email, language: i18n.language },
});
```

The surrounding code (`resetPasswordForEmail` call, success toast, error handling) stays intact.

### Note on Thing 1

Configuring Supabase SMTP settings must be done by you directly in the Supabase dashboard — I cannot change SMTP settings from here. Make sure that's done before testing password reset.

### About the build errors

This change alone won't fix the existing build errors (they're in other files). Want me to fix those separately?

