# Deploy Edge Functions - Copy-Paste Instructions

## ✅ Edge Function 1: creative-soul-create-checkout

### In Supabase Dashboard:

1. Go to: **Edge Functions** → **Create Function**
2. Function name: `creative-soul-create-checkout`
3. Copy the entire content from: `supabase/functions/creative-soul-create-checkout/index.ts`
4. Paste into the editor
5. Click **Deploy**

---

## ✅ Edge Function 2: stripe-webhook (UPDATE EXISTING)

### In Supabase Dashboard:

1. Go to: **Edge Functions** → **stripe-webhook** (existing function)
2. Click **Edit**
3. Replace entire content with: `supabase/functions/stripe-webhook/index.ts`
4. Click **Deploy**

---

## 🔐 Required Secrets

After deploying, go to: **Project Settings → Edge Functions → Secrets**

Add these (replace with your actual values):

```
SUPABASE_URL=https://ssygukfdbtehvtndandn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook)
SITE_URL=https://<your-lovable-domain> or http://localhost:5173
STRIPE_PRICE_LIFETIME_149=price_xxxxx (create in Stripe first)
STRIPE_PRICE_MONTHLY_1499=price_xxxxx (create in Stripe first)
STRIPE_PRICE_SINGLE_999=price_xxxxx (create in Stripe first)
```

---

## 📋 Quick Checklist

- [ ] Run `DEPLOY_NOW.sql` in Supabase SQL Editor
- [ ] Deploy `creative-soul-create-checkout` Edge Function
- [ ] Update `stripe-webhook` Edge Function
- [ ] Set all 8 environment variables (secrets)
- [ ] Create 3 Stripe Price IDs
- [ ] Configure Stripe Webhook endpoint

