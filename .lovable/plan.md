## Goal
Add a prominent, glowing "Agastyar Academy" hero card at the top of the Siddha Portal page (`/siddha-portal`) that routes to the existing Academy at `/agastyar-academy`.

## Placement
In `src/pages/SiddhaPortal.tsx`, insert the new card immediately after the header/subtitle block and before the Sri Yantra divider — so it sits at the very top of the scroll content.

## Visual design (matches Sanctuary theme)
- Full-width card (inside the 430px container, with 16px side margin)
- Background: layered gradient using Alchemical Gold (#D4AF37) + Glowing Turquoise (#00F2FE) at low opacity over Midnight Black
- 1px gold border, 24px radius (consistent with existing `CARD_BASE`)
- **Glowing light effect**: outer `box-shadow` halo in gold + cyan, plus an animated pulsing aura behind the card using a new `@keyframes sqGlowPulse` (opacity + blur breathing, 4s loop). No layout-shifting entrance animations (per memory rule).
- Small "ACADEMY • 108 MODULES" gold uppercase kicker
- Title "Agastyar Academy" in Cormorant Garamond serif
- Italic subtitle: "The complete path of Ayurvedic mastery — from Atma-Seed to Akasha-Infinity."
- CTA button "Enter Academy →" in gold
- Tiny tier-strip row at bottom showing 4 dots (Free / Prana / Siddha / Akasha) so users see it spans every tier

## Access logic
- The card itself is visible to anyone who can already reach `/siddha-portal` (admin + Rank 2+, enforced by existing `FEATURE_TIER.siddhaPortal` gate at top of the page — no change).
- Navigation target `/agastyar-academy` is unchanged. The Academy page already enforces per-module `tier_required` via `getCourseTierRequiredRank`, so:
  - Admin → full access (bypass via `isAdmin` in `hasFeatureAccess`)
  - Free (rank 0) → Phase 1 (modules 1–12)
  - Prana-Flow (rank 1) → + Phase 2
  - Siddha-Quantum (rank 2) → + Phase 3
  - Akasha-Infinity (rank 3) → + Phases 4–5
- No changes to `tierAccess.ts` or DB needed — tier connections already exist correctly.

## Files to change
- `src/pages/SiddhaPortal.tsx` — add `AcademyHeroCard` component + `sqGlowPulse` keyframe in the existing `<style>` block.

No new routes, no DB migration, no i18n keys required (using inline strings consistent with the rest of the page).
