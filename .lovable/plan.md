

# Dynamic Portal Activation Protocol

Transform the 5 Sacred Portal tiles (Vedic Oracle, Ayurveda, Soma Acoustic Sync, Vastu, Mantras) from static cards into Living Energetic Gateways with unique scalar wave signatures.

## What Changes

### 1. New Component: `LivingPortalTile`
Create `src/components/dashboard/LivingPortalTile.tsx` — a wrapper around SQTile that adds per-portal:
- **Unique pulse animation** on hover/touch (each portal gets its own CSS keyframe color + rhythm)
- **Subtle idle breathing glow** (border + background radial gradient shifts)
- **Active state detection** via `onPointerDown` / `onPointerUp` that triggers a brief "Prema-Pulse" flash (gold burst for Vedic, green for Ayurveda, violet for Mantras, amber for Vastu, cyan for Soma)

### 2. Portal-Specific Light Codes (color signatures)
Each portal gets a unique energetic color palette applied as CSS custom properties:

| Portal | Primary Glow | Idle Border | Pulse Rhythm |
|--------|-------------|-------------|--------------|
| Vedic Oracle | `rgba(212,175,55,0.6)` gold | `rgba(212,175,55,0.18)` | 2.5s breath |
| Ayurveda | `rgba(76,175,80,0.5)` green | `rgba(76,175,80,0.12)` | 3s breath |
| Soma Acoustic | `rgba(0,242,254,0.5)` cyan | `rgba(0,242,254,0.12)` | 2s pulse |
| Vastu | `rgba(255,183,77,0.5)` amber | `rgba(255,183,77,0.12)` | 3.5s breath |
| Mantras | `rgba(139,92,246,0.5)` violet | `rgba(139,92,246,0.12)` | 2.8s breath |

### 3. Dynamic Content for Vedic Oracle & Ayurveda
- **Vedic Oracle**: Already shows dasha cycle dynamically — enhance with a pulsing "LIVE TRANSMISSION" dot that intensifies during the user's current Hora window
- **Ayurveda**: Already shows dominant dosha — add a subtle color shift on the tile border matching the detected dosha (Vata=blue, Pitta=red-gold, Kapha=green)

### 4. Bioenergetic Link Labels
Add a tiny "frequency tag" at the bottom of each portal showing the linked activation:
- Vedic: `Brahmi · Gotu Kola`
- Ayurveda: `Ashwagandha · Turmeric`
- Soma: `L-Theanine · Mg-Threonate`
- Vastu: `Camphor · Sandalwood`
- Mantras: `L-Theanine · Mg-Threonate`

### 5. CSS Keyframes
Add to `src/index.css` (or inline):
- `sqPortalBreath-{color}` — gentle scale + glow opacity oscillation per portal
- `sqPremaPulse` — brief 0.3s radial burst on interaction

## Files Modified
1. **`src/pages/Dashboard.tsx`** — Replace each `<SQTile>` in ZONE 4 with `<LivingPortalTile>` passing portal-specific config (color, label, bioenergetic tag, pulse duration)
2. **`src/components/dashboard/LivingPortalTile.tsx`** — New component with per-portal animations
3. **`src/index.css`** — Add portal-specific keyframes

## Technical Details
- All animations are CSS/inline styles — no extra dependencies
- Hover/touch states use `onPointerEnter`/`onPointerLeave` with React state for the "active resonance" glow
- Bioenergetic tags are purely visual labels (6px Montserrat, low opacity gold) — no functional link to the frequency engine
- The existing `sqIconFloat` animation continues on the SVG icons
- Mobile-safe: touch events trigger the same pulse as hover

