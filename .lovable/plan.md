

## Full Vastu Architect Rebuild — Original Logic + Audio Recording + Photo Upload

### What is currently missing vs. the original

The original code was a fully-featured standalone React app with these capabilities that are **completely absent** from the current implementation:

| Feature | Original | Current |
|---|---|---|
| Module progress sidebar with locked/unlocked/completed states | ✅ | ❌ |
| Module navigation (click to jump to a module) | ✅ | ❌ |
| AI-driven module progression via `[MODULE_START: X]` tags | ✅ | ❌ |
| 48-hour integration phase tracking with progress bar | ✅ | ❌ |
| Photo upload (multi-image 360° diagnostic) | ✅ | ❌ |
| Audio transmission cards with mantra scripts | ✅ | ❌ |
| Voice/audio recording of mantras | ✅ | ❌ |
| AI parsing of `[AUDIO: X - Title]` tags to render audio cards | ✅ | ❌ |
| Welcome screen with prompt suggestions | partial | partial |
| Multimodal image analysis (send photos to AI) | ✅ | ❌ |
| Full Siddha system prompt with 10-module logic | ✅ | basic |
| Master unlock (developer tool for testing) | ✅ | ❌ |

---

### Architecture Plan

The current `VastuTool.tsx` + `VastuChat.tsx` split needs to be replaced with a proper architecture that mirrors the original:

```text
VastuTool.tsx          ← Top-level orchestrator (state, module logic)
  ├── VastuSidebar     ← Module progress sidebar (desktop only)
  ├── VastuchatWindow  ← Full chat with image upload + audio cards
  │     ├── AudioTransmissionCard  ← Mantra recording cards
  │     └── Message rendering with markdown + audio tag parsing
  └── Integration48HourBanner  ← Floating 48hr phase indicator
```

The edge function also needs to be upgraded to use the full **Siddha system prompt** with all 10-module logic, Ayadi Calculator, Elemental Alchemy, Marma Points, and Dhwani Kriya protocols, plus support for **image payloads** (multimodal).

---

### Files to Create / Modify

#### 1. `supabase/functions/vastu-chat/index.ts` — Full Siddha System Prompt + Image Support
- Replace the basic system prompt with the complete `SYSTEM_INSTRUCTION` from the original (Siddha Architect, 10 tools, audio tags, module progression tags)
- Accept `images` array alongside `messages` in the request body
- When images are present, use Gemini's vision capability (inline image data parts) for multimodal analysis
- Keep GEMINI_API_KEY (already configured as a secret) — switch to `gemini-2.5-flash` which supports vision

#### 2. `src/components/vastu/VastuTool.tsx` — Full Orchestrator with State
Replace with the complete `App.tsx` logic from original, adapted for our React/Tailwind stack:
- `currentModule` state (1–10)
- `messages` state with `role: 'user' | 'model'`, `text`, `images[]`, `timestamp`
- `isThinking` state
- `lastChangeTimestamp` for 48-hour tracking
- `isMasterUnlocked` developer toggle
- `unlockedTransmissions` array
- Module progression detection: parse `[MODULE_START: X]` and `[MODULE_COMPLETE: X]` from AI responses
- Audio unlock detection: parse `[AUDIO: X - Title]` from AI responses
- `handleModuleClick(id)` — jump to module via AI message
- `getIntegrationProgress()` — 0–100% based on 48 hours elapsed
- Sidebar with all 10 modules, locked/current/completed states
- Mobile sidebar overlay toggle
- 48-hour floating status banner (only shown after changes)

The 10 modules from the original:
1. The Home as a Field (Overview)
2. The Entrance (Receiving)
3. The Living Room (Circulating)
4. The Kitchen (Creating)
5. The North (Money Flow)
6. The North-East (Grace/Support)
7. The Bedroom (Holding/Nervous System)
8. Technology & Mirrors (Amplification)
9. Storage (Reserves)
10. Sealing the Field (Maintenance)

#### 3. `src/components/vastu/VastuChat.tsx` — Full Chat Window with Photo Upload + Audio Cards
Replace with the complete `ChatWindow.tsx` logic from the original:

**Photo upload:**
- Camera/file button opens `<input type="file" multiple accept="image/*">`
- Images converted to base64 via `FileReader`
- Preview thumbnails shown before sending
- Sent as `images[]` array alongside message text
- Displayed inline in the message bubble

**Audio Transmission Cards** (rendered when AI response contains `[AUDIO: X - Title]`):
- Card with mantra title and Sound Alchemy layer number
- "Unveil Script" button — reveals the sacred mantra text
- "Perform Transmission" button — starts microphone recording via `MediaRecorder` API
- "Seal Recording" button — stops recording
- "Review Frequency" button — plays back the recording via `URL.createObjectURL`
- No upload needed — all local recording

**Message rendering:**
- Parse AI text for `[AUDIO: X - Title]` patterns → render `AudioTransmissionCard` inline
- Strip `[MODULE_START: X]` and `[MODULE_COMPLETE: X]` tags from display text
- Render markdown (bold, italic, headers, blockquotes, tables) using a simple markdown parser (no new package — use regex-based rendering or a lightweight approach since `react-markdown` isn't installed)

**Input area:**
- Large styled text input
- Camera button for photo upload
- Send button
- Directional energy hints below (North/Wealth, SE/Energy, SW/Stability, NE/Grace)
- Welcome screen with "Initiate Path" and "360° Diagnostic" quick-start cards

#### 4. `src/components/vastu/TransmissionScripts.ts` — Sacred Script Data
New file with the `TRANSMISSION_SCRIPTS` constant from the original (10 mantra scripts for modules 0–10).

---

### Transmission Scripts (from original constants)
All 11 scripts (0–10) covering: OM, GAM, GLAUM, RAM, SHREEM, EEM, LUM, HUM, KREEM, HREEM — each with mantra title and full spoken script for recording.

---

### Edge Function: Multimodal Support
When `images[]` is provided in the request body, the function will:
1. Build Gemini content parts including both text and `inlineData` image parts
2. Use `gemini-2.5-flash` model (supports vision)
3. Append the diagnostic system instruction overlay
4. Stream the response back the same way

---

### Styling Notes
- Use existing amber/stone color palette (already in VastuChat)
- Bubble styles: user = `bg-stone-900 text-white rounded-br-none`, AI = `bg-white border rounded-bl-none`
- Sidebar: `w-64 hidden md:flex` (desktop only)
- Mobile overlay for sidebar
- Custom CSS for `vastu-bubble-user`, `vastu-bubble-ai` bubble shapes via inline styles or Tailwind `rounded` variants

