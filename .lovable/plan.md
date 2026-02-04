
# Creative Soul Landing Page Redesign

## Overview
Create a compelling, modern landing page for `/creative-soul` that showcases **Creative Soul Meditation** (Spectral Alchemy) as the primary product, matching the dark, immersive aesthetic of the meditation tool while providing direct access to all three payment tiers.

## Current State
- The existing `/creative-soul` page (`CreativeSoulLanding.tsx`) focuses on "Creative Soul Studio" (voice-to-text/AI)
- Uses a light purple/pink gradient theme that doesn't match the meditation tool's aesthetic
- Has only one payment option (€19.99 for Studio)
- Admins are redirected to `/creative-soul/store`

## Proposed Design

### Visual Theme
Match the meditation tool's **"Spectral Alchemy" aesthetic**:
- Deep slate/purple gradient background (`from-slate-950 via-purple-950/20 to-slate-950`)
- Ambient glow orbs (purple, cyan, violet blur effects)
- Glassmorphism cards with `bg-black/40 backdrop-blur-xl border-white/10`
- Cyan-to-purple gradient text for headings
- Dark, immersive atmosphere

### Page Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│                     HERO SECTION                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🎧 Spectral Alchemy Logo                                   │ │
│  │  "Transform Any Audio Into Healing Meditation"              │ │
│  │  Subtext: Neural Processing • Healing Frequencies • Export  │ │
│  │                                                              │ │
│  │  [ Watch Demo ]  [ Start Free Trial ]                       │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                   FEATURE HIGHLIGHTS                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Neural  │  │ 15      │  │ Healing │  │ Binaural│            │
│  │ Engine  │  │ Styles  │  │ Freqs   │  │ Beats   │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Stem    │  │ DSP     │  │ WAV/MP3 │  │ YouTube │            │
│  │ Separ.  │  │ Master  │  │ Export  │  │ Import  │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                   PRICING SECTION                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │   LIFETIME     │  │    MONTHLY     │  │   SINGLE USE   │     │
│  │     €149       │  │    €14.99/mo   │  │     €9.99      │     │
│  │  +1000 SHC     │  │   +1000 SHC    │  │   +1000 SHC    │     │
│  │ [ Get Access ] │  │ [ Subscribe ]  │  │ [ Pay Once ]   │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│                   HOW IT WORKS                                   │
│  1. Upload audio or paste YouTube link                          │
│  2. Choose meditation style and frequencies                     │
│  3. Apply DSP mastering and healing tones                       │
│  4. Export professional-quality meditation                      │
├─────────────────────────────────────────────────────────────────┤
│               TESTIMONIAL / TRUST SECTION                        │
│  "You don't need to understand technology..."                   │
│  🔒 Secure Stripe • Affiliate program • Instant access          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Sections

#### 1. Hero Section
- Large, animated heading with gradient text: "Spectral Alchemy"
- Subtitle: "Neural Production Mastering Suite"
- Value proposition: Transform any audio into healing meditation tracks
- Primary CTA buttons: "Start Creating" and "Watch Demo"
- Ambient background with floating blur orbs

#### 2. Feature Grid (8 features)
- **Neural Engine**: AI-powered audio processing
- **15 Meditation Styles**: Indian, Tibetan, Nature, Space, etc.
- **Healing Frequencies**: 432Hz, 528Hz, Solfeggio tones
- **Binaural Beats**: Alpha, Theta, Delta brainwave entrainment
- **Stem Separation**: Isolate vocals, music, or full mix
- **DSP Mastering**: Professional reverb, delay, warmth
- **High-Quality Export**: WAV/MP3 format
- **YouTube Import**: Extract audio from any YouTube video

#### 3. Pricing Section (All 3 Options)
Integrate directly with `creative-soul-create-checkout` edge function:

| Plan | Price | Mode | SHC Reward |
|------|-------|------|------------|
| Lifetime | €149 | One-time | +1000 SHC |
| Monthly | €14.99 | Subscription | +1000 SHC |
| Single Use | €9.99 | One-time | +1000 SHC |

Each card will have:
- Icon (Crown, Radio, Zap)
- Price with styling
- Feature highlights
- Direct checkout button
- Loading state with spinner

#### 4. How It Works Section
Step-by-step visual guide:
1. Upload audio file or paste YouTube URL
2. Select meditation style (15 options)
3. Configure healing frequencies and binaural beats
4. Apply DSP mastering (reverb, delay, warmth)
5. Export and download your meditation

#### 5. Trust/Footer Section
- Secure payment badge (Stripe)
- Affiliate program mention (30% commission)
- Quote about accessibility
- Link to Creative Soul Studio (secondary product)

## Technical Implementation

### Files to Modify
- `src/pages/CreativeSoulLanding.tsx` - Complete redesign

### Checkout Integration
Reuse the existing checkout logic from `CreativeSoulStore.tsx`:
```typescript
const handleMeditationPurchase = async (plan: 'lifetime' | 'monthly' | 'single') => {
  const { data, error } = await supabase.functions.invoke('creative-soul-create-checkout', {
    body: { plan, ...(affiliateId && { ref: affiliateId }) }
  });
  if (data?.url) window.location.href = data.url;
};
```

### Affiliate Tracking
Preserve existing affiliate code detection from URL `?ref=` parameter and localStorage.

### Access Checking
Reuse entitlement check to show "Open Tool" for users with access vs. pricing for others.

### Responsive Design
- Mobile-first layout
- Pricing cards stack on mobile, 3-column on desktop
- Feature grid: 2-column on mobile, 4-column on desktop

## Key Improvements Over Current Page
1. **Matching Theme**: Dark, immersive aesthetic matching the actual tool
2. **All 3 Payment Options**: Direct checkout for lifetime, monthly, and single-use
3. **Feature-Rich**: Showcases the powerful capabilities of Spectral Alchemy
4. **Clear Value Proposition**: Focused messaging on audio transformation
5. **Professional Feel**: Glassmorphism, gradients, and ambient effects
6. **Affiliate-Ready**: Tracking preserved for referral commissions
