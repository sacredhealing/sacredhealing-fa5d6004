# Healing Page Complete Redesign

Paste this ENTIRE message into Lovable:

---

I need a complete redesign of the `/healing` page. This is a major overhaul — the page should feel like entering a sacred temple, not a standard wellness website. The healer has 15 years of experience and works in the lineage of Mahavatar Babaji and the 18 Siddhas.

## DESIGN PRINCIPLES

- Dark theme: deep blacks (#0a0a0a), with gold (#D4AF37) and subtle cyan accents
- Typography: serif fonts for headings (sacred/mystical feel), clean sans-serif for body
- Spacing: generous whitespace, let the content breathe
- Feel: temple-like, vibrational, premium — NOT clinical or "wellness startup"
- No emojis in the actual page content
- Smooth scroll animations (fade-in on scroll) for each section

## LANGUAGE SYSTEM

The page must display in the user's preferred language from their profile. Support 4 languages: English, Swedish (Svenska), Norwegian (Norsk), Spanish (Español).

Implementation:
1. Check the user's language preference from their profile in Supabase (the `profiles` table should have a `language` or `preferred_language` column — if it doesn't exist, create it with default 'en')
2. If user is not logged in, detect browser language or default to English
3. ALL text content on the page must use a translation object — no hardcoded English strings
4. Use this pattern for the translations:

```typescript
const translations = {
  en: {
    heroTitle: "15 Years of Healing. One Infinite Connection.",
    heroSubtitle: "Through the grace of Mahavatar Babaji and Paramahamsa Vishwananda, enter a sanctified field where miracles are the natural state of existence.",
    // ... all text keys
  },
  sv: {
    heroTitle: "15 År av Helande. En Oändlig Förbindelse.",
    heroSubtitle: "Genom Mahavatar Babajis och Paramahamsa Vishwanandas nåd, träd in i ett helgat fält där mirakel är det naturliga tillståndet.",
    // ... all text keys
  },
  no: {
    heroTitle: "15 År med Helbredelse. Én Uendelig Forbindelse.",
    heroSubtitle: "Gjennom nåden til Mahavatar Babaji og Paramahamsa Vishwananda, tre inn i et hellig felt der mirakler er den naturlige tilstanden.",
    // ... all text keys
  },
  es: {
    heroTitle: "15 Años de Sanación. Una Conexión Infinita.",
    heroSubtitle: "A través de la gracia de Mahavatar Babaji y Paramahamsa Vishwananda, entra en un campo sagrado donde los milagros son el estado natural de existencia.",
    // ... all text keys
  },
};
```

Use `useAuth` to get the user, then fetch their language preference. Create a `useUserLanguage()` hook if one doesn't exist.

## PAGE SECTIONS (in order, top to bottom)

### SECTION 1: HERO — "Step into the Field"

Full-viewport dark section with subtle radial gold gradient from center.

```
[Sacred geometry SVG or subtle animated mandala in background — very low opacity]

Title: "15 Years of Healing. One Infinite Connection."

Subtitle: "Through the grace of Mahavatar Babaji and Paramahamsa Vishwananda, 
I provide a 30-day spiritual surgery that operates beyond time. You don't just 
receive a session — you enter a sanctified field where miracles are the natural 
state of existence."

[CTA Button: "Begin Your Transformation" → scrolls to booking section]
```

Style: Title in large serif, gold color. Subtitle in smaller text, white/70 opacity. Button in gold with dark text.

### SECTION 2: HEALER'S STATEMENT — "The Evolution of Grace"

```
"For 15 years, I have walked the path of the healer, serving as a bridge for 
those seeking balance. Through the sacred initiation of Atma Kriya Yoga and a 
direct connection to the lineage of Mahavatar Babaji and the 18 Siddhas, my 
work has evolved.

I no longer simply treat the body; I recalibrate the soul. By merging the 
ancient science of the masters with the modern power of vibrational sound, I 
facilitate a 'Silent Transmission.' This is surgery without a scalpel — performed 
in the Akasha, governed by Divine Grace, and delivered through the heart."
```

Style: Centered, elegant typography. Gold left border or top ornament. Italicized quote feel.

### SECTION 3: HOW IT WORKS — "The Power of Silent Transmission"

Three cards/steps in a row (stack on mobile):

**Card 1: "The Resonance"**
"When you book, your soul's frequency is integrated into my daily Atma Kriya Yoga. I scan your Akashic Record and perform Subtle Surgery during my dawn Sadhana."

**Card 2: "The 30-Day Blueprint"**  
"Your physical body takes 30 days to catch up to the soul's new vibration. During this time, Siddha energy re-codes your cells 24/7. My music acts as the carrier wave for this transformation."

**Card 3: "The Sonic Alchemy"**
"As a producer, I weave sacred Beeja mantras and 963Hz frequencies into the rhythm of healing music. Your transformation happens while you simply listen."

Style: Dark cards with gold borders, subtle glow effect. Small icons (not emojis — use Lucide icons or custom SVGs).

### SECTION 4: WHY IT'S DIFFERENT — Comparison

A clean comparison between traditional therapy and Siddha healing:

| Traditional Therapy | Siddha Healing |
|---|---|
| Talking about the past | Clearing the past in the Akasha |
| Fixed 1-hour sessions | 24/7 Transmission for 30 days |
| Surface-level relaxation | Karmic surgery at the root |
| Human effort | Divine Grace through Babaji's Lineage |

Style: Don't use a literal HTML table. Use two columns with contrasting styling — left column muted/grey, right column gold/highlighted. On mobile, stack vertically.

### SECTION 5: MEDITATIONS — "Sonic Treatments"

Reorganize existing meditations into 3 categories. Display as collapsible sections or tabbed interface:

**Category 1: "Root & Earth" — Grounding & Physical Vitality**
Description: "For grounding, physical health, and cellular regeneration."
[List meditations that fit this category]

**Category 2: "Heart & Water" — Emotional Release & Relationships**  
Description: "For emotional healing, heart opening, and relationship harmony."
[List meditations that fit this category]

**Category 3: "Akashic Gateway" — Third Eye & Past Life Connection**
Description: "High-frequency transmissions for spiritual awakening and Akashic access."
[List meditations that fit this category]

Each meditation should show:
- Title
- Duration
- Language badge (🇬🇧 EN / 🇸🇪 SV)
- Play button (30-second preview)
- Lock icon if premium-only

Style: Dark cards, gold accent on active category tab. Show "Encoded with Atma Kriya frequencies" text under each category.

### SECTION 6: TESTIMONIALS — "Miracle Logs"

Keep existing testimonials but redesign the display:
- Large quote marks in gold
- Client name/initials only (privacy)
- Highlight testimonials that mention distance healing or unexpected results
- Show language of testimonial with a small flag icon
- Carousel/slider format on mobile, grid on desktop

### SECTION 7: FAQ — "The Science of Grace"

Accordion/collapsible FAQ section with these questions:

**Q1: "How can you heal me if we aren't talking on the phone?"**
A: "In the dimensions of the Siddhas, distance is an illusion. I work within the Akasha — the unified field where all consciousness is connected. Just as a radio captures a signal from miles away, your energy body receives the transmission I release during my daily Atma Kriya Yoga."

**Q2: "Why is the program 30 days long?"**
A: "True transformation isn't a quick fix — it's a cellular recalibration. It takes roughly 30 days for the human nervous system and physical tissues to fully integrate a shift in the soul's frequency. During this month, you are held in a Field of Grace that works on you 24/7."

**Q3: "I've tried other healers. Why is this different?"**
A: "Most healers use their own personal energy, which is limited. I serve as a hollow bamboo for the lineage of Mahavatar Babaji. You aren't receiving my energy — you are being connected to a 5,000-year-old reservoir of Divine Power. My background as a Music Producer allows me to encode your healing into specific sonic frequencies that bypass mental resistance."

**Q4: "What do I need to do during the 30 days?"**
A: "Your only job is surrender. Listen to the provided Initiation Track in the app. Drink plenty of water. Simply observe the shifts in your dreams, moods, and physical vitality."

**Q5: "Can you really see my organs and past lives from a distance?"**
A: "Yes. Through Sukshma Drishti (Subtle Vision), I scan the body's energy field. Blockages appear as dark knots or dissonant frequencies. The root of physical pain is often a karmic imprint stored in the Akasha. I identify these seeds and use Siddha mantras to dissolve them at the source."

**Q6: "Is this related to a specific religion?"**
A: "This work is rooted in Sanatana Dharma (Universal Law) and the path of the Siddhas, but it is universal. Whether you are religious, spiritual, or skeptical, the frequencies work on a biological and energetic level."

Style: Gold accordion arrows, smooth open/close animation. Dark background.

### SECTION 8: BOOKING & PAYMENT — "Enter the Portal"

```
Title: "This is Not a Session. It is an Initiation."
Subtitle: "30 days of continuous Siddha transmission. Sacred sonic frequencies. 
Akashic surgery at the soul level."

[Price display: show the price]
[Stripe checkout button: "ENTER THE PORTAL" in gold]
```

**Stripe Integration:**
Create a Supabase edge function called `create-healing-checkout` (similar to the akashic checkout) that creates a Stripe Checkout Session for the 30-day healing program.

```typescript
// Edge function: create-healing-checkout
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  customer_email: userEmail,
  line_items: [{
    price_data: {
      currency: "usd",
      product_data: {
        name: "30-Day Siddha Healing Transmission",
        description: "Continuous spiritual surgery through the lineage of Mahavatar Babaji. Includes personalized sonic healing tracks.",
      },
      unit_amount: priceInCents, // Set appropriate price
    },
    quantity: 1,
  }],
  success_url: `${origin}/healing?success=true`,
  cancel_url: `${origin}/healing`,
  metadata: { user_id: userId, product: "siddha_healing_30day" },
});
```

After successful payment, show a confirmation message and grant access to the healing program content.

### SECTION 9: POST-BOOKING INSTRUCTION (shown only after purchase)

If the user has purchased the 30-day program, show this section instead of or above the booking section:

```
Title: "Your Initiation Has Begun"

"The Siddha Breath" — Your daily practice while listening to your healing tracks:

1. Sit with a straight spine — the antenna for Babaji's Grace
2. Inhale for 7 counts, seeing golden light enter the crown
3. Hold for 7 counts, mentally repeating the name of Mahavatar Babaji
4. Exhale for 7 counts, pushing energy from heart into hands and feet

Day X of 30 — [progress indicator]
```

## ALL TEXT MUST BE TRANSLATED

Remember: every single text string on this page must be in the translations object supporting en, sv, no, es. Translate ALL the FAQ answers, section titles, button labels, meditation category names — everything.

## IMPORTANT TECHNICAL NOTES

- Keep existing meditation data/structure — just reorganize the display
- Keep existing testimonials data — just redesign the cards
- The page should be a single scrollable page with smooth section transitions
- Add `scroll-behavior: smooth` for the CTA button that scrolls to booking
- Make sure the page works well on mobile (most users will be on phones)
- Use Framer Motion or CSS animations for fade-in-on-scroll effects

Please implement the full page redesign and show me what files you created or changed.
