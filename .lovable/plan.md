

## Remove Integration Phase Banner from Vastu Tool

The floating "Integration Phase" banner at the bottom of the Vastu page will be removed. This includes cleaning up related UI elements and state that only served this feature.

### Changes in `src/components/vastu/VastuTool.tsx`

1. **Remove the floating 48-hour banner** -- the `AnimatePresence` block at the bottom of the component that renders the dark overlay card with "Integration Phase / Allow your adjustments to settle for 48 hours."

2. **Remove the sidebar "Energy Integration" progress bar** -- the section in the sidebar that shows the percentage progress and "48-hour field integration" text.

3. **Remove the "Skip 48h Wait" button** from the Dev Tools section in the sidebar.

4. **Clean up unused state and helpers**:
   - `lastChangeTimestamp` state and `setLastChangeTimestamp`
   - `getIntegrationProgress()` function
   - `integrationProgress` variable
   - Remove `setLastChangeTimestamp` calls from `handleSendMessage` (module progression logic)

No other files need to change -- this is entirely contained within `VastuTool.tsx`.

