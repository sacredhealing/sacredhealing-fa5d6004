

## Understanding

- **Sanctuary Dashboard** (on Explore/Library pages) = requires €499 Temple Home License OR admin
- **ResonancePanel** (on Music, Mantra, Healing, Meditation pages) = available to premium members and admin
- Currently the Explore page shows SanctuaryDashboard to `isAdmin || isPremium` which is too broad — it should require the Temple Home License (€499), not just premium

## Changes

### 1. Fix Explore.tsx gating for SanctuaryDashboard

Change the condition from `(isAdmin || isPremium)` to only show for admin (since there's no Temple License purchase tracking yet) or add a `hasTempleLicense` check. Since the Temple Home License is a one-time €499 purchase and the existing `UniversalResonanceEngine.tsx` already has `hasTempleLicense` in its access model, the Sanctuary on Explore should be gated to **admin only** (or users who purchased the license).

For now, gate to **admin only** on Explore, since there's no Stripe product/purchase tracking for the €499 license yet. Add a visible upsell card for premium users showing the €499 Sanctuary upgrade option.

### 2. Ensure ResonancePanel works for premium on 4 content pages

The `GatedResonancePanel` in `UniversalResonanceEngine.tsx` already gates on admin or non-free membership. Verify this is working correctly — no code changes needed here.

### 3. Add Sanctuary upsell card on Explore for premium (non-admin) users

Show a promotional card when `isPremium && !isAdmin` explaining the €499 Temple Home License, linking to a purchase flow or contact page.

### Steps
1. Update Explore.tsx: change `(isAdmin || isPremium)` to `isAdmin` for SanctuaryDashboard rendering
2. Add a €499 Sanctuary upsell card for premium users who don't have admin access, shown in the same spot

