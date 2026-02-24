

# Fix: "Step into the Day" Button Not Working

## Root Cause

The previous fix added `navigate(g.session_id)` at the top of `handleStartSession`, which causes two critical problems:

1. **Auto-redirect on page load**: The `useDashboardAutostart` hook calls `openSession` after 450ms. Since all guidance objects have a `session_id` starting with `/`, the dashboard immediately navigates the user away to `/ritual` or `/breathing` before they even see the page. This makes the button appear "broken" because the user is being auto-redirected.

2. **Broken completion tracking**: The early `return` skips setting `flowState`, `activeGuidance`, and `isContinuationCompletion`, so when users return from the session page, the "completed" state is never triggered and daily progress isn't recorded.

## Fix Plan

### 1. Revert `handleStartSession` to use the inline player (Dashboard.tsx)

Remove the `navigate()` logic added in the last change. Restore the original behavior that sets `flowState = 'in_session'` and renders the `InlineSessionPlayer` inside the dashboard. This was the intended design.

### 2. Fix `InlineSessionPlayer` to handle route-based sessions (if needed)

If specific session types (like `morning_ritual` pointing to `/ritual`) aren't supported by the inline player, add support by either:
- Embedding the ritual content within `InlineSessionPlayer`
- Or providing a "Go to practice" button inside the inline player that navigates to the route while preserving the completion callback

### 3. Prevent autostart from navigating away

Update the autostart hook's `openSession` callback to only set `flowState` (inline player mode), never navigate away from the dashboard.

## Technical Changes

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Revert `handleStartSession` to remove `navigate()` call; restore inline player flow |
| `src/components/dashboard/InlineSessionPlayer.tsx` | Verify it can handle all `session_type` values from guidance (ritual, breathing, meditation, path) |

## Expected Result

- Dashboard loads without auto-redirecting
- Clicking "Step into the day" opens the inline session player on the dashboard
- Completing a session properly triggers the completion flow and records daily progress
- The button label and guidance text remain contextual based on time of day

