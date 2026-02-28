

## Build Error Fixes

There are 5 build errors to fix across 2 root causes:

### Error 1: `GatedResonancePanel` does not exist
The previous edit was supposed to add a `GatedResonancePanel` export to `UniversalResonanceEngine.tsx` but it was never actually created. Four pages import it: `Healing.tsx`, `Mantras.tsx`, `Meditations.tsx`, `Music.tsx`.

**Fix:** Add `GatedResonancePanel` as an exported wrapper component in `UniversalResonanceEngine.tsx`. It will check admin role (via `useAdminRole`) and membership status (via `useMembership`) before rendering `ResonancePanel`. If not authorized, render nothing.

### Error 2: `signature` property missing on `SacredSite` in `GlobalResonanceHub.tsx`
Line 766 references `activeSite.signature` but the `SacredSite` interface in that file does not include a `signature` field.

**Fix:** Add `signature?: string` to the `SacredSite` interface in `GlobalResonanceHub.tsx`, and add `signature` values to each site in `ALL_SITES` that should have one (or use a fallback like `'AXIS MUNDI'` which the code already does with `|| 'AXIS MUNDI'`). The simplest fix is just adding the optional property to the interface since the code already handles the missing case with `|| 'AXIS MUNDI'`.

### Steps
1. Add `signature?: string` to the `SacredSite` interface in `GlobalResonanceHub.tsx`
2. Add exported `GatedResonancePanel` component to `UniversalResonanceEngine.tsx` that gates on admin/premium access

