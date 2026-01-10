# Creative Soul Meditation - Stripe Integration Deployment Guide

## ✅ Implementation Complete

All code has been implemented and committed. The following features are now available:

### 🎯 Features Implemented

1. **Access Control**
   - Admins → direct to `/creative-soul-meditation-tool`
   - Paid subscribers/lifetime → direct to `/creative-soul-meditation-tool`
   - Non-subscribers → landing page `/creative-soul-meditation-landing`

2. **Stripe Integration**
   - Three payment options: Lifetime (€149), Monthly (€14.99/month), Single (€9.99)
   - Automatic access grant after successful payment
   - Automatic access revocation when subscription cancels/fails
   - 1000 coins credited per purchased tool (idempotent, no double credits)
   - Affiliate tracking for all events (visit/checkout/purchase)

3. **Database Tables Created**
   - `profiles` - Role-based access (admin/user)
   - `creative_soul_entitlements` - Access tracking with plan types
   - `user_wallet` - Coins tracking
   - `coin_awards` - Idempotent coin crediting
   - `affiliate_attribution` - First ref tracking
   - `affiliate_events` - All affiliate events

4. **Edge Functions**
   - `creative-soul-create-checkout` - Creates Stripe checkout sessions
   - `stripe-webhook` - Updated with full Creative Soul logic

5. **Frontend Updates**
   - `/creative-soul/store` - Access checking and redirect logic
   - `/creative-soul-meditation-landing` - Checkout buttons functional
   - `/creative-soul-meditation-tool` - Access enforcement

---

## 📋 Required Actions (Deploy to Supabase)

### 1. Run Database Migration

**Location:** `supabase/migrations/20260113000000_creative_soul_stripe_integration.sql`

**Method:** Supabase Dashboard → SQL Editor

Copy the entire content of the migration file and run it in the SQL Editor.

**OR** via Supabase CLI:
```bash
supabase db push
```

---

### 2. Set Environment Variables (Supabase Dashboard)

Go to: **Project Settings → Edge Functions → Secrets**

Add these secrets:

```
SUPABASE_URL=<your-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
SITE_URL=<your-lovable-domain-or-localhost:5173>
STRIPE_PRICE_LIFETIME_149=<stripe-price-id-for-€149>
STRIPE_PRICE_MONTHLY_1499=<stripe-price-id-for-€14.99-month>
STRIPE_PRICE_SINGLE_999=<stripe-price-id-for-€9.99>
```

**Important:** You must create these Price IDs in your Stripe Dashboard first!

---

### 3. Create Stripe Price IDs

In Stripe Dashboard:

1. **Lifetime License (€149)**
   - Product: "Creative Soul Meditation - Lifetime License"
   - Price: €149.00
   - Type: One-time payment
   - Copy the Price ID → use for `STRIPE_PRICE_LIFETIME_149`

2. **Monthly Subscription (€14.99/month)**
   - Product: "Creative Soul Meditation - Monthly Creator Subscription"
   - Price: €14.99/month
   - Type: Recurring (monthly)
   - Copy the Price ID → use for `STRIPE_PRICE_MONTHLY_1499`

3. **Single Meditation (€9.99)**
   - Product: "Creative Soul Meditation - One Meditation"
   - Price: €9.99
   - Type: One-time payment
   - Copy the Price ID → use for `STRIPE_PRICE_SINGLE_999`

---

### 4. Deploy Edge Functions

**Option A: Via Supabase CLI**
```bash
supabase functions deploy creative-soul-create-checkout
supabase functions deploy stripe-webhook
```

**Option B: Via Supabase Dashboard**
1. Go to: **Edge Functions → Create Function**
2. For `creative-soul-create-checkout`:
   - Copy content from `supabase/functions/creative-soul-create-checkout/index.ts`
   - Paste into the editor
   - Deploy

3. For `stripe-webhook`:
   - Go to existing `stripe-webhook` function
   - Replace with updated content from `supabase/functions/stripe-webhook/index.ts`
   - Deploy

---

### 5. Configure Stripe Webhook

In Stripe Dashboard → Webhooks:

1. **Add endpoint:**
   ```
   https://<your-project>.supabase.co/functions/v1/stripe-webhook
   ```

2. **Enable events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

3. **Copy the webhook signing secret:**
   - Use this value for `STRIPE_WEBHOOK_SECRET` in Supabase secrets

---

### 6. Set Admin Role (Optional)

To grant admin access to a user:

```sql
INSERT INTO public.profiles (id, role)
VALUES ('<user-id>', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

Replace `<user-id>` with the actual user UUID from `auth.users` table.

---

## ✅ Verification Steps

### 1. Test Database Tables
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'creative_soul_entitlements', 'user_wallet', 'coin_awards', 'affiliate_attribution', 'affiliate_events');
```

### 2. Test Edge Function (Checkout)
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/creative-soul-create-checkout \
  -H "Authorization: Bearer <user-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"plan": "lifetime", "ref": "TEST123"}'
```

Expected response: `{"id": "cs_...", "url": "https://checkout.stripe.com/..."}`

### 3. Test Webhook (Local Testing)
Use Stripe CLI:
```bash
stripe listen --forward-to https://<your-project>.supabase.co/functions/v1/stripe-webhook
```

Trigger test events:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### 4. Test Frontend Flow

1. **As non-admin, non-paid user:**
   - Navigate to `/creative-soul/store`
   - Click "Creative Soul Meditation" → should redirect to `/creative-soul-meditation-landing`
   - Click pricing button → should redirect to Stripe checkout (if logged in) or `/auth` (if not logged in)

2. **As admin:**
   - Navigate to `/creative-soul/store`
   - Click "Creative Soul Meditation" → should show "Open Tool (Admin Access)"
   - Click button → should go directly to `/creative-soul-meditation-tool`

3. **As paid user:**
   - After completing Stripe checkout → redirects to `/creative-soul-meditation-tool?payment=success`
   - Tool should load with full access

4. **After payment:**
   - Check `creative_soul_entitlements` table → `has_access = true`
   - Check `user_wallet` table → `coins = 1000`
   - Check `coin_awards` table → record exists with `coins = 1000`

---

## 🔍 Troubleshooting

### Issue: Edge Function returns 401
**Solution:** Ensure `STRIPE_SECRET_KEY` is set in Supabase secrets

### Issue: Webhook returns 400 "Invalid signature"
**Solution:** Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret in Stripe Dashboard

### Issue: Access not granted after payment
**Solution:** 
- Check webhook logs in Supabase Dashboard
- Verify webhook events are enabled in Stripe
- Check `creative_soul_entitlements` table after webhook processes

### Issue: Coins not credited
**Solution:**
- Check `coin_awards` table for duplicate prevention
- Verify `user_wallet` table exists and has RLS policies
- Check webhook logs for errors

### Issue: Affiliate tracking not working
**Solution:**
- Verify `affiliate_attribution` and `affiliate_events` tables exist
- Check RLS policies allow inserts
- Verify ref code is passed in checkout metadata

---

## 📝 Important Notes

1. **Demo Mode:** Users can access `/creative-soul-meditation-tool?mode=demo` without payment (limited to one demo per user)

2. **Admin Bypass:** Admins skip all access checks and can use the tool freely

3. **Subscription Lifecycle:** Monthly subscriptions are automatically managed via Stripe webhooks (active/canceled/past_due status)

4. **Coin Crediting:** 1000 coins are credited **once per purchase** (idempotent via `coin_awards` table unique constraint)

5. **Affiliate Tracking:** Ref codes are stored in `affiliate_attribution` on first visit and passed to Stripe checkout metadata

---

## ✅ Deployment Checklist

- [ ] Database migration executed (`20260113000000_creative_soul_stripe_integration.sql`)
- [ ] All environment variables set in Supabase Dashboard
- [ ] Stripe Price IDs created and configured
- [ ] Edge Functions deployed (`creative-soul-create-checkout`, `stripe-webhook`)
- [ ] Stripe Webhook configured with correct endpoint and events
- [ ] Admin role set for test user (if needed)
- [ ] Frontend tested (non-admin → landing, admin → tool, paid → tool)
- [ ] Payment flow tested (checkout → payment → access granted)
- [ ] Coin crediting verified after purchase
- [ ] Subscription lifecycle tested (cancel → access revoked)
- [ ] Affiliate tracking verified

---

## 🚀 Ready to Deploy!

All code is committed and ready. Follow the steps above to deploy to Supabase.

