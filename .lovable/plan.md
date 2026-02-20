

## Remove Stem Mode Dropdown and YouTube Neural Link

Based on the screenshots, two UI elements need to be removed from the meditation tool page:

1. **"Full Mix" stem mode dropdown** (with Vocals Only, Music Only, All Stems options) -- the cyan dropdown in the top toolbar
2. **"YouTube Neural Link" section** -- the card with YouTube URL input and CONVERT button

### Changes in `src/pages/CreativeSoulMeditationTool.tsx`

- **Remove the stem mode dropdown** (lines 443-456): Delete the entire `div` containing the Scissors icon and Select component
- **Remove the `YouTubeLinker` usage** (line 665): Delete `<YouTubeLinker onAudioExtracted={handleYouTubeAudio} />`
- **Clean up unused imports and state**:
  - Remove `YouTubeLinker` import (line 42)
  - Remove `Scissors` from lucide-react imports
  - Remove `StemMode` type (line 48)
  - Remove `STEM_OPTIONS` constant (lines 50-55)
  - Remove `stemMode` / `setStemMode` state (line 81)
  - Remove `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` imports if no longer used elsewhere
  - Remove `handleYouTubeAudio` handler if it exists

The `YouTubeLinker` component file itself (`src/components/soulmeditate/YouTubeLinker.tsx`) will be kept in the codebase but simply unused.

### Build error fixes (unrelated but blocking)

- **`supabase/functions/stripe-webhook/index.ts` line 1002**: Fix `const userId` reassignment -- change to `let userId`
- **`supabase/functions/weekly-motivational-email/index.ts` line 79**: Fix type narrowing for `profilesError`

