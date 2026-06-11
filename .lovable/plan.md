## Goal
Add a discreet card on `/dashboard` that links to `/admin/delta-arb`, visible **only** to the two admin UUIDs (Kritagya + Laila). Everyone else sees nothing different.

## Changes
1. **`src/pages/Dashboard.tsx`** — render a single card near the top (above existing content) gated by:
   ```ts
   const ADMIN_UUIDS = [
     'bd0b21c9-577a-450b-bb1e-21c9d0423f17',
     'a711f099-3d34-456f-8473-8a65eab056d5',
   ];
   if (!user || !ADMIN_UUIDS.includes(user.id)) return null;
   ```
   Card styling matches the Delta-Arb page (glassmorphism, gold `#D4AF37`, cyan `#22D3EE`, black `#050505`). Label: "Delta-Arb Bot · Admin", subtext: "Live balance & trade feed", with a gold arrow. `onClick` → `navigate('/admin/delta-arb')`.

2. **No other files touched.** Route, page, RLS, and access logic stay exactly as-is.

## Out of scope
- Bottom nav, affiliate dashboard, route changes, RLS changes.