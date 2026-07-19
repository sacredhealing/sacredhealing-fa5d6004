# Subscription Flow — End-to-End Test Checklist

Run this **for every paid tier** after any change to:
- `supabase/functions/create-membership-checkout/index.ts`
- `supabase/functions/create-tier-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `src/hooks/useMembership.ts`
- `membership_tiers` / `user_memberships` schema
- Stripe price IDs / env secrets

---

## Tiers under test

| Tier              | Slug              | Stripe Price ID                        | Mode         | Trial   | Expected client tier (useMembershipTier) |
| ----------------- | ----------------- | -------------------------------------- | ------------ | ------- | ---------------------------------------- |
| Prana-Flow        | `prana-flow`      | `price_1T8o3YAPsnbrivP056UJqOP7`       | subscription | 7 days  | `monthly` (rank 1)                       |
| Siddha-Quantum    | `siddha-quantum`  | `price_1T8o3jAPsnbrivP0uZKR33EY`       | subscription | none    | `annual` (rank 2)                        |
| Akasha-Infinity   | `akasha-infinity` | `price_1TsTQbAPsnbrivP0X0Obb5YN`       | one-time     | none    | `lifetime` (rank 3)                      |

Use **Stripe test mode** with card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

---

## Pre-flight (once)

- [ ] `STRIPE_SECRET_KEY` set (test mode key while testing).
- [ ] `SELECT slug, stripe_price_id, is_active FROM membership_tiers WHERE slug IN ('prana-flow','siddha-quantum','akasha-infinity');` — all three rows present, active, correct price IDs.
- [ ] `GRANT SELECT ON public.membership_tiers TO anon, authenticated;` verified.
- [ ] Stripe webhook endpoint pointed at `…/functions/v1/stripe-webhook` with signing secret in `STRIPE_WEBHOOK_SECRET`.
- [ ] Create a fresh test user (or wipe an existing test account's `user_memberships` row).

---

## Per-tier test steps

Repeat this block **for each** of the three tiers.

### 1. Checkout starts
- [ ] Sign in as the test user.
- [ ] Click the tier's upgrade CTA.
- [ ] Redirected to `checkout.stripe.com`.
- [ ] Stripe page shows correct price (€19 / €45 / €2997) and correct product name.
- [ ] **Prana-Flow only:** page shows "7 days free" / "Total after trial".
- [ ] **Siddha / Akasha:** no trial language shown.

### 2. Payment completes
- [ ] Complete checkout with `4242 4242 4242 4242`.
- [ ] Redirected back to app success URL (no error banner).

### 3. Webhook received
Within ~10 seconds:
- [ ] Stripe Dashboard → Developers → Webhooks → recent deliveries show `checkout.session.completed` **and** `customer.subscription.created` (subs) OR `checkout.session.completed` (Akasha one-time) with HTTP 200.
- [ ] `SELECT * FROM stripe_webhook_logs ORDER BY created_at DESC LIMIT 5;` — event rows present with no error.

### 4. `user_memberships` row created
```sql
SELECT um.user_id, mt.slug, um.status, um.starts_at, um.expires_at,
       um.stripe_subscription_id, um.stripe_customer_id
FROM user_memberships um
JOIN membership_tiers mt ON mt.id = um.tier_id
WHERE um.user_id = '<TEST_USER_ID>'
ORDER BY um.created_at DESC LIMIT 1;
```
- [ ] Exactly one active row for the test user.
- [ ] `slug` matches the tier just purchased.
- [ ] `status = 'active'`.
- [ ] **Prana-Flow:** `expires_at ≈ now() + 7 days` (trial end).
- [ ] **Siddha:** `expires_at ≈ now() + 1 month`.
- [ ] **Akasha:** `expires_at` NULL or far-future (lifetime).
- [ ] `stripe_subscription_id` present for subs; `stripe_customer_id` present for all.

### 5. Client reflects tier without logout
On the same tab where checkout was initiated (do **not** log out):
- [ ] Return to app; `useMembership.refresh()` (auto-runs on mount) picks up the new row.
- [ ] Header/profile shows the new tier name.
- [ ] Navigate to a tier-gated route and confirm access:
  - Prana-Flow → Agastya chat (`/ayurveda` tool) loads without paywall.
  - Siddha-Quantum → Prana-Flow content **plus** Siddha-only routes (e.g. Quantum Apothecary advanced features) load.
  - Akasha-Infinity → all above plus Akasha-only routes (e.g. Temple Home / Universal Resonance).
- [ ] `localStorage['sh:membership:v4:<userId>']` cache updated with new tier.
- [ ] Hard refresh (Cmd/Ctrl-R) — access persists.

### 6. Cleanup between tiers
- [ ] `DELETE FROM user_memberships WHERE user_id = '<TEST_USER_ID>';`
- [ ] In Stripe test dashboard: cancel the test subscription (subs) so the next tier test starts clean.
- [ ] Clear browser localStorage or use a fresh incognito window.

---

## Trial-specific checks (Prana-Flow only)

- [ ] Stripe subscription object: `status = 'trialing'`, `trial_end ≈ now() + 7d`.
- [ ] No invoice paid yet (`amount_paid = 0` on the initial invoice).
- [ ] Fast-forward test (optional): in Stripe test mode use "Advance clock" on the customer to jump 7 days.
  - [ ] `invoice.paid` webhook fires.
  - [ ] `user_memberships.expires_at` extended by the webhook handler (next billing period).
  - [ ] Subscription status flips to `active`.

## Cancellation regression

For each subscription tier after activation:
- [ ] Cancel via customer portal.
- [ ] `customer.subscription.updated` webhook received (cancel_at_period_end=true).
- [ ] `user_memberships.expires_at` unchanged, `status` still active until period end.
- [ ] After period end: `customer.subscription.deleted` → row marked `status='canceled'` (or expires).

---

## Known failure modes to explicitly re-test

These have broken in production before — regressions must be caught:

1. **`membership_tiers` missing GRANTs** → frontend query returns 0 rows → "Prana Flow monthly is not available" toast.
   Verify anon/authenticated can `SELECT` from `membership_tiers`.
2. **`user_memberships` schema drift** (missing `stripe_customer_id`, no default on `starts_at`, no unique index on `user_id`) → webhook upsert fails silently, no membership row created.
3. **Trial `payment_status = 'no_payment_required'`** was skipped by `checkout.session.completed` handler → trials never granted access.
4. **`resolveUserByEmail` paginating only page 1 of `auth.admin.listUsers`** → users beyond first 50 never got mapped.
5. **Slug mismatch** (`prana-monthly` vs `prana-flow`) in checkout starter → tier lookup fails.
6. **Client cache staleness** — `useMembership` cache TTL should not block newly purchased tier from appearing after `refresh()`.

---

## Automated smoke test (optional, run in CI against test-mode Stripe)

A full automated E2E requires a Stripe test-mode key + webhook forwarding (`stripe listen`), which we can't run inside Lovable's sandbox. If run externally:

```bash
# 1. Trigger checkout for each tier via the edge function using a service-role JWT
for TIER in prana-flow siddha-quantum akasha-infinity; do
  curl -s -X POST "$SUPABASE_URL/functions/v1/create-membership-checkout" \
    -H "Authorization: Bearer $TEST_USER_JWT" \
    -H "Content-Type: application/json" \
    -d "{\"priceId\":\"$(price_for $TIER)\",\"tierSlug\":\"$TIER\"}" | jq .url
done

# 2. Use Stripe CLI to complete each session:
stripe checkout sessions complete <session_id> --payment-method pm_card_visa

# 3. Poll user_memberships:
psql "$DB_URL" -c "SELECT slug, status, expires_at FROM user_memberships um
  JOIN membership_tiers mt ON mt.id = um.tier_id
  WHERE user_id = '$TEST_USER_ID';"
```

Assert one active row per tier with the expected slug + expires_at window.
