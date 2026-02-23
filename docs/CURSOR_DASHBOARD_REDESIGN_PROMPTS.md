# Sacred Healing — Cursor Implementation Prompts

Paste these prompts into Cursor one at a time, in order.
Wait for each to complete before pasting the next.
Run `npm run build` after each to verify nothing breaks.

---

## PROMPT 1: Unified Gold Color Palette

```
DESIGN: Unify the entire dashboard to the Sacred Gold palette.

Currently the dashboard has a gold/amber top section but the lower cards use 
clashing cyan, teal, green, and blue colors. Unify everything to the gold spectrum.

Files to update:

1. src/components/dashboard/DailyRitualCard.tsx
   - Replace the green checkmark circle (bg-green-500/20, ring-green-500/50, text-green-500) 
     with a warm olive-gold: bg-[#8B7D3C]/20, ring-[#8B7D3C]/50, text-[#8B7D3C]
   - Replace the bright green dot indicators (bg-green-500) with bg-[#8B7D3C]
   - Replace the sky-400 midday icon color with text-amber-400/70
   - Replace the indigo-400 evening icon color with text-amber-300/50
   - Replace the "completed" text color (text-green-500) with text-[#D4AF37]
   - Replace the active phase border (border-primary/30, bg-primary/10) with 
     border-[#D4AF37]/20 bg-[#D4AF37]/5

2. src/components/dashboard/SpiritualPathCard.tsx
   - The progress bar gradient is already gold — keep it
   - Replace the "Continue Day" button variant="spiritual" with a gold pill:
     className="text-xs h-8 bg-gradient-to-r from-[#D4AF37] to-[#C4943A] text-black 
     font-semibold rounded-full px-4 hover:brightness-110 border-0"

3. src/components/dashboard/WallInscription.tsx (if it has any cyan/blue elements)
   - Replace any non-gold accent colors with the #D4AF37 spectrum

4. src/index.css or tailwind.config.ts
   - If there's a global --primary or --accent CSS variable using cyan/blue,
     change it to the gold hue: hsl(43, 74%, 49%) for gold

The goal: scrolling from top to bottom should feel like ONE continuous 
sacred gold experience, not a gold top bolted onto a blue-tech bottom.
```

---

## PROMPT 2: Consistent Serif Typography for Headers

```
DESIGN: Use Cinzel/DM Serif Display serif font consistently for ALL section headers.

Currently the top section uses serif font (Cinzel) but the lower section 
headers like "Daily Spiritual Practice", "Dharma Path Progress", "More practices",
and "Progress & achievements" use the default sans-serif.

Files to update:

1. src/components/dashboard/DailyRitualCard.tsx
   - The <h3> "Daily Spiritual Practice" should use:
     style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
   - Keep body text (times, labels) as the default sans-serif system font

2. src/components/dashboard/SpiritualPathCard.tsx
   - The <h3> "Dharma Path Progress" should use the serif font
   - The path title (e.g. "Inner Peace Path") should also use serif

3. src/components/ui/SectionCollapse.tsx (or wherever "More practices" and 
   "Progress & achievements" headers are rendered)
   - All section collapse titles should use the serif font:
     style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}

4. src/pages/Dashboard.tsx
   - The "Daily routine" section label should use serif font
   - Any section header text should use serif

Rule: Section titles and card headers = serif.
Body text, times, data labels, small text = sans-serif system font.
This carries the "ancient scripture" feel throughout the whole dashboard.
```

---

## PROMPT 3: Redesign Three Gateways (Sacred Sound / Inner Light / Stillness)

```
DESIGN: Redesign the ThreeGateways component with new names and circular portal style.

File: src/components/dashboard/ThreeGateways.tsx

Current state: Three dark rectangular cards with lucide icons (Sparkles, Heart, Play)
and labels "Mantra", "Soul", "Meditate".

Redesign to:

1. RENAME the gateways:
   - "Mantra" → "Sacred Sound" (keep route /mantras)
   - "Soul" → "Inner Light" (keep route /healing)  
   - "Meditate" → "Stillness" (keep route /meditations)

2. UPDATE the i18n keys:
   - dashboard.mantra → dashboard.sacredSound (fallback: "Sacred Sound")
   - dashboard.soul → dashboard.innerLight (fallback: "Inner Light")
   - dashboard.meditate → dashboard.stillness (fallback: "Stillness")

3. RESTYLE each gateway card:
   - Remove the rectangular dark card with arch SVG overlay
   - Replace with a clean circular portal design:
     - A 56px circle with a radial gradient glow: 
       background: radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)
     - Inside: a thin golden circle border (1px solid rgba(212,175,55,0.2))
     - Icon inside the circle: use a simple SVG or the existing lucide icon 
       but in #D4AF37 color, smaller (w-6 h-6)
   - Label below: 11px, uppercase, letter-spacing 0.15em, color #9C8E7A
     font-family: Cinzel, serif
   - The whole card background: transparent or rgba(255,255,255,0.02) with 
     a subtle border rgba(255,255,255,0.04), rounded-2xl
   - Active/hover state: background rgba(212,175,55,0.08), border rgba(212,175,55,0.2)

4. KEEP the existing hora-based glow logic (shouldGlow) but change the glow 
   colors from purple to gold: replace all purple/violet references with 
   amber/gold variants.

5. REMOVE the arch SVG overlay completely — it adds visual noise.

The labels should be compact — use short text. 
"Sacred Sound", "Inner Light", "Stillness" — not longer phrases.
```

---

## PROMPT 4: Simplify Dashboard Layout & Rename Sections

```
DESIGN: Simplify the dashboard layout and rename sections.

File: src/pages/Dashboard.tsx

Changes:

1. RENAME section labels:
   - "Daily routine" → "Daily Practice" 
   - "More practices" (SectionCollapse) → "More Practices" (keep as is, just ensure serif font)
   - "Progress & achievements" (SectionCollapse) → "Your Light"
     Update the description from "Timeline, streaks, achievements and share" 
     to "Your journey, streaks & milestones"

2. REMOVE the "DAILY ROUTINE" uppercase label above the Daily Spiritual Practice card.
   Instead, let the card header speak for itself. If you want a subtle label, 
   make it use the serif font at 11px with letter-spacing 0.2em and color 
   rgba(212,175,55,0.4) — very subtle.

3. CARD BORDERS: Update all glass-card borders throughout the dashboard 
   components to use the gold border: border-[#D4AF37]/10 instead of 
   border-white/10 or border-border.

4. WALL INSCRIPTION: The Hora inscription bar ("Adam, your Rahu Cycle is active...")
   should have a subtle gold background: bg-[#D4AF37]/5 with 
   border border-[#D4AF37]/10 and text in text-[#D4AF37]/50.
   Make it feel like an inscription, not an alert banner.

5. FLOATING MANTRA BUTTON: The bottom-right floating sparkle button is fine.
   Just ensure its shadow uses gold only — no purple:
   shadow-[0_0_20px_rgba(212,175,55,0.4)] (remove the purple glow).
```

---

## PROMPT 5: Fix "Step Into The Day" Button

```
BUG FIX: The "Step Into The Day" button on the dashboard doesn't visibly respond 
when clicked after the morning ritual is completed.

File: src/components/dashboard/TempleEntrance.tsx and src/pages/Dashboard.tsx

The issue: When the morning ritual has been completed, the button text changes to 
a continuation label (e.g. "Set Intention") but clicking it doesn't show visible 
feedback. The InlineSessionPlayer should appear but it seems like the guidance 
object may not have valid data in the continuation state.

Debug and fix:
1. In TempleEntrance.tsx, the onClick calls:
   onStartClick?.(activeGuidance, { isContinuation: true })
   
   Verify that `activeGuidance` always has a valid session_type and session_id
   when in continuation mode. The getContinuationSuggestion function returns
   session_ids like '/meditations?category=morning' — these are route paths, 
   not actual Supabase session IDs.

2. In Dashboard.tsx, handleStartSession sets flowState to 'in_session' and 
   stores activeGuidance. The InlineSessionPlayer receives sessionType and 
   sessionId from this.

3. The InlineSessionPlayer currently only renders a SacredBreathingGuide for 
   ALL session types. If the sessionType is 'meditation' and session_id is a 
   route path like '/meditations?category=morning', the player should either:
   a) Navigate to that route instead of showing inline breathing, OR
   b) Show the breathing guide with a clear "Begin" state so the user sees 
      something happened

4. Add a smooth scroll-to-top or fade transition when flowState changes from 
   'idle' to 'in_session' so the user clearly sees the InlineSessionPlayer 
   appear (it might be rendering above the fold but the user is scrolled down).

The most reliable fix: when the button is clicked and flowState changes to 
'in_session', scroll to the top of the page so the InlineSessionPlayer 
is visible.
```

---

## PROMPT 6: SHC "Tap to Claim" Mechanic

```
FEATURE: Add "Tap to Claim" SHC reward after completing each ritual.

Currently, SHC is awarded automatically when a ritual slot is completed. 
Change this so the user must actively claim their SHC reward.

Files to update:

1. src/components/dashboard/DailyRitualCard.tsx
   - When a ritual is completed (phase.status === 'completed'), instead of 
     showing the static "+15 SHC" text, show a glowing "Claim" button:
     - Small pill button: "✦ Claim 15 SHC"
     - Style: bg-gradient-to-r from-[#D4AF37] to-[#C4943A], text-black, 
       text-xs, rounded-full, px-3 py-1, font-semibold
     - Add a subtle pulse animation (animate-pulse or a custom CSS keyframe 
       with a gold glow)
     - On click: trigger the SHC reward mutation, then replace the button 
       with a confirmed state showing "✓ +15 SHC" in gold text

2. Create a new state to track which slots have been "claimed" vs just 
   "completed". Options:
   a) Use local state in DailyRitualCard with a Set<PhaseId> for claimed phases
   b) Or add a 'claimed' field to the daily journey data in Supabase
   
   For now, use local state (simpler). The SHC is still actually awarded 
   on completion server-side, but the visual "claim" action creates the 
   psychological reward loop. If you want true server-side gating, that's 
   a separate Supabase migration.

3. The claim animation:
   - When user taps "Claim 15 SHC", show a brief gold sparkle/glow effect
   - The button transforms into "✓ +15 SHC" with a fade transition
   - Use framer-motion: initial={{ scale: 1 }} → animate={{ scale: [1, 1.2, 1] }}
     over 0.3s

4. If the phase was completed before the user opened the app (e.g. they 
   completed morning, closed the app, reopened), still show the "Claim" 
   button so they get the satisfaction of claiming it.

This creates a "moment of intention" — the user actively receives their 
reward rather than having it silently added.
```

---

## PROMPT 7: Bottom Navigation Gold Unification

```
DESIGN: Unify the bottom navigation bar to the gold palette.

Find the bottom tab navigation component (likely in src/components/layout/AppLayout.tsx 
or a BottomNav component).

Changes:
- Active tab icon and label color: #D4AF37 (sacred gold)
- Inactive tab icon and label color: #6B5F50 (warm gray, not cool gray)
- Remove any cyan/blue active indicator
- If there's an active dot or line indicator, make it gold
- Background should remain dark (the current dark works fine)
- Remove any purple or blue shadow effects on the active tab

This ensures the navigation feels part of the same sacred gold system.
```

---

## Order of Implementation

1. **Prompt 1** (Gold palette) — biggest visual impact
2. **Prompt 2** (Serif headers) — quick typography fix
3. **Prompt 3** (Three Gateways) — the focal redesign
4. **Prompt 4** (Layout simplification) — cleanup
5. **Prompt 5** (Step Into The Day fix) — bug fix
6. **Prompt 6** (SHC tap to claim) — new feature
7. **Prompt 7** (Bottom nav) — final polish

After all 7: run `npm run build` and test on mobile viewport.
