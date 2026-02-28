

## Problem

The user is on `/explore` (renders `Explore.tsx`) and cannot see the GlobalResonanceHub / SanctuaryDashboard. It currently only exists on `/library` (renders `Library.tsx`). The user wants it visible on the Explore page, gated to admin and premium members only.

## Plan

### Step 1: Add SanctuaryDashboard to `src/pages/Explore.tsx`

- Import `GlobalResonanceProvider`, `SiteEffectOverlay`, and `SanctuaryDashboard` from `@/components/resonance/GlobalResonanceHub`
- Import `useAdminRole` (already imported) and `useMembership` (already imported)
- After the existing "Your Space" section (~line 396), add a new section that renders `SanctuaryDashboard` wrapped in `GlobalResonanceProvider` — only visible when `isAdmin || isPremium`
- Gate with: `const { isPremium } = useMembership();` (already called) and `isAdmin` (already available)
- The section will show `SiteEffectOverlay` + `SanctuaryDashboard` in a styled container, matching the page's dark gradient theme

### Step 2: Extract `isPremium` from existing `useMembership()` call

- Line 167 currently calls `useMembership()` without destructuring. Change to `const { isPremium } = useMembership();`

### No other files changed

Only `Explore.tsx` is modified. No existing code is removed — only additions.

