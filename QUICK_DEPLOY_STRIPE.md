# ⚡ Quick Deploy - Stripe Integration

## ✅ All Code Is Ready!

Everything has been implemented and committed. Now deploy to Supabase:

---

## 🚀 DEPLOYMENT STEPS (Do These Now)

### Step 1: Run Database Migration (5 minutes)

**In Supabase Dashboard → SQL Editor:**

1. Copy entire content from: `supabase/migrations/20260113000000_creative_soul_stripe_integration.sql`
2. Paste into SQL Editor
3. Click **Run**

**OR via CLI:**
```bash
supabase db push
```

---

### Step 2: Set Environment Variables (2 minutes)

**In Supabase Dashboard → Project Settings → Edge Functions → Secrets:**

Add these secrets (get values from your Stripe Dashboard):

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook endpoint)
SITE_URL=https://<your-lovable-domain> (or http://localhost:5173 for local)
STRIPE_PRICE_LIFETIME_149=price_xxxxx (create in Stripe first)
STRIPE_PRICE_MONTHLY_1499=price_xxxxx (create in Stripe first)
STRIPE_PRICE_SINGLE_999=price_xxxxx (create in Stripe first)
```

**⚠️ IMPORTANT:** Create the 3 Price IDs in Stripe Dashboard first, then copy the IDs here.

---

### Step 3: Create Stripe Price IDs (3 minutes)

**In Stripe Dashboard → Products:**

1. **Lifetime (€149):**
   - Product name: "Creative Soul Meditation - Lifetime License"
   - Price: €149.00
   - Type: One-time
   - Copy Price ID → use for `STRIPE_PRICE_LIFETIME_149`

2. **Monthly (€14.99/month):**
   - Product name: "Creative Soul Meditation - Monthly Creator Subscription"
   - Price: €14.99/month
   - Type: Recurring (monthly)
   - Copy Price ID → use for `STRIPE_PRICE_MONTHLY_1499`

3. **Single (€9.99):**
   - Product name: "Creative Soul Meditation - One Meditation"
   - Price: €9.99
   - Type: One-time
   - Copy Price ID → use for `STRIPE_PRICE_SINGLE_999`

---

### Step 4: Deploy Edge Functions (2 minutes)

**Option A: Via Supabase Dashboard**

1. Go to: **Edge Functions → Create Function**
2. Function name: `creative-soul-create-checkout`
3. Copy code from: `supabase/functions/creative-soul-create-checkout/index.ts`
4. Paste and **Deploy**

5. Go to: **Edge Functions → stripe-webhook** (existing)
6. Replace code with: `supabase/functions/stripe-webhook/index.ts`
7. **Deploy**

**Option B: Via CLI**
```bash
supabase functions deploy creative-soul-create-checkout
supabase functions deploy stripe-webhook
```

---

### Step 5: Configure Stripe Webhook (3 minutes)

**In Stripe Dashboard → Webhooks:**

1. Click **Add endpoint**
2. Endpoint URL: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`
3. **Select events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. **Copy the signing secret** (starts with `whsec_`)
6. Add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

---

### Step 6: Set Admin Role (Optional - 1 minute)

**In Supabase Dashboard → SQL Editor:**

```sql
-- Replace <user-id> with your actual user UUID
INSERT INTO public.profiles (id, role)
VALUES ('<your-user-id>', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

To find your user ID:
```sql
SELECT id, email FROM auth.users LIMIT 10;
```

---

## ✅ VERIFY IT WORKS

### Test 1: Checkout Flow
1. Go to `/creative-soul-meditation-landing`
2. Click any pricing button
3. Should redirect to Stripe checkout (if logged in)

### Test 2: Access Control
1. As admin: `/creative-soul/store` → Click Meditation → Should go to tool
2. As non-paid: `/creative-soul/store` → Click Meditation → Should go to landing

### Test 3: After Payment
1. Complete a test purchase in Stripe
2. Check `creative_soul_entitlements` table → `has_access = true`
3. Check `user_wallet` table → `coins = 1000`
4. Should redirect to `/creative-soul-meditation-tool?payment=success`

---

## 🎯 TOTAL TIME: ~15 minutes

All code is ready. Just follow the steps above!

---

## 📋 Checklist

- [ ] Database migration executed
- [ ] Environment variables set (all 8 secrets)
- [ ] Stripe Price IDs created (3 prices)
- [ ] Edge Functions deployed (2 functions)
- [ ] Stripe Webhook configured (5 events)
- [ ] Admin role set (optional)
- [ ] Test checkout flow
- [ ] Test access control
- [ ] Verify payment grants access

