import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;
const green = (a: number) => `rgba(74,222,128,${a})`;
const amber = (a: number) => `rgba(245,158,11,${a})`;
const emerald = (a: number) => `rgba(52,211,153,${a})`;

const FONT_MAIN = "'Plus Jakarta Sans','Montserrat',sans-serif";
const FONT_SERIF = "'Cormorant Garamond',serif";

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: FONT_MAIN,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.45em',
  textTransform: 'uppercase' as const,
  color: gold(0.5),
};

// ─── CURRICULUM DATA ──────────────────────────────────────────────────────────

const MODULES = [
  // ── FREE TIER ──────────────────────────────────────────────────────────────
  {
    tier: 'free',
    tierLabel: 'FREE',
    tierColor: white(0.55),
    num: 1,
    icon: '🜂',
    title: 'The Immortal Body — Bogar\'s Revelation',
    subtitle: 'Origin · Definition · The 18 Siddhas\' Secret Compact',
    lessons: [
      { title: 'What is Kayakalpa? — The Alchemy of Eternity', desc: 'Kayam means body. Kalpa means strong as stone, ageless as cosmos. This is not anti-aging — it is the Siddha science of reversing biological entropy through Prana restructuring, Nadi purification, and conscious cellular reprogramming. Bogar transmitted this science from the Akasha to Babaji directly.' },
      { title: 'Bogar Sapta Kandam — The 7000 Verse Code', desc: 'Explore the revealed knowledge of Bogar\'s magnum opus — 7000 verses encoding alchemy, longevity medicine, navapaashanam composition, transmigration between bodies, and the quantum science of Kayakalpa herbs. Why he wrote it in cipher. What it reveals about cellular immortality.' },
      { title: 'The 18 Siddhas & Their Kayakalpa Plants', desc: 'Each Siddha had a master plant. Agastyar — amalaki. Bogar — asparagus racemosus (shatavari). Thirumoolar — fresh ginger. Theraiyar — tulsi & margosa. Konganavar — navapashanam. Discover the complete plant-Siddha transmission matrix and how each herb carries the Siddha\'s consciousness frequency.' },
    ],
    locked: false,
  },
  {
    tier: 'free',
    tierLabel: 'FREE',
    tierColor: white(0.55),
    num: 2,
    icon: '🌿',
    title: 'The Science of Kaya — Understanding Your Body as Temple',
    subtitle: 'Pancha Bhuta · Tri-Dosha · Sapta Dhatu',
    lessons: [
      { title: 'Pancha Bhuta Body — Five Elements as Living Light', desc: 'The body is not matter — it is crystallized cosmic intelligence. Explore how the five elements (Akasha, Vayu, Agni, Apas, Prithvi) constitute your physical vehicle and how Kayakalpa recalibrates their ratios to eliminate disease and accelerate spiritual evolution.' },
      { title: 'The 7 Dhatu Cascade — From Food to Ojas', desc: 'Rasa → Rakta → Mamsa → Meda → Asthi → Majja → Shukra/Artava → Ojas. This 35-day cascade transforms food into the luminous life-essence that powers Kayakalpa transmutation. Learn the Siddha protocols for maximizing Ojas production at each stage.' },
      { title: 'Tri-Dosha & Kayakalpa Timing', desc: 'Vata, Pitta and Kapha govern biological rhythm. Kayakalpa is not one-size-fits-all — it is precision-calibrated to your constitutional matrix. Learn how to read your dosha, the right season for Kayakalpa initiation, and why Brahma Muhurta is the primary window of cellular regeneration.' },
    ],
    locked: false,
  },
  {
    tier: 'free',
    tierLabel: 'FREE',
    tierColor: white(0.55),
    num: 3,
    icon: '🔱',
    title: 'Bogar\'s Navapaashanam — The Stone of Immortality',
    subtitle: 'Alchemy · Palani · The Living Idol',
    lessons: [
      { title: 'The Nine Poisons That Heal — Navapaashanam Decoded', desc: 'Bogar sculpted the idol of Lord Murugan at Palani Hill using nine mineral poisons alchemically transmuted into healing substance. The holy water (abisheka theertham) that flows over this idol has cured thousands for centuries. Learn the nine components, their spiritual symbolism, and why modern science cannot replicate this formula.' },
      { title: 'Mercury Alchemy & Rasa Shastra', desc: 'Mercury (Parada) is the central alchemical substance in Kayakalpa. When properly purified through 18 stages of shodhana, mercury becomes a superconductor for Prana. Bogar\'s Parada Vada teaches the secret of fixing mercury — making it solid — as the foundation of cellular immortality protocols.' },
      { title: 'Bogar in China — Taoism & the Cross-Tradition Kayakalpa', desc: 'Historical and Akashic evidence that Bogar (Bo-Yang / Lao Tzu) transmitted Kayakalpa knowledge to China, seeding Taoist immortality practices, qi cultivation, and the Tao Te Ching. The unified science of longevity across Tamil Siddha and Taoist traditions.' },
    ],
    locked: false,
  },

  // ── PRANA-FLOW TIER ────────────────────────────────────────────────────────
  {
    tier: 'prana',
    tierLabel: 'PRANA-FLOW',
    tierColor: green(0.9),
    num: 4,
    icon: '🌱',
    title: 'Kayakalpa Herbs — The Green Immortals',
    subtitle: 'Bohar Karpam 300 · Pothu Karpam · 108 Rejuvenation Herbs',
    lessons: [
      { title: 'The 108 Kayakalpa Herbs — Complete Siddha Materia Medica', desc: 'The full spectrum of Pothu Karpam (general) and Sirappu Karpam (specific) herbs from classical Siddha texts. Bohar Karpam 300 verses decoded. Haritaki (Kadukkai), Amalaki (Nelli), Ashwagandha (Amukkura), Guduchi, Shatavari, Brahmi — each herb\'s mechanism of action on cellular longevity pathways.' },
      { title: 'Kayakalpa Herb Protocols — Preparation, Dosage & Timing', desc: 'How to prepare fresh Kayakalpa preparations (Karpa Avizhtham) vs. prepared medicines. The crucial role of cow\'s ghee, raw honey, and warm milk as anupana (carriers). Lunar-phase based herb harvesting. The Siddha pharmacy of self-cultivation — growing your own immortality garden.' },
      { title: 'Anti-Aging Biochemistry Through Siddha Eyes', desc: 'Modern research confirms Kayakalpa herbs as potent free-radical scavengers, telomerase activators, and mitochondrial rejuvenators. Amalaki\'s 20x Vitamin C. Ashwagandha\'s cortisol regulation. Bacopa\'s neurogenesis stimulation. The Siddha knew 5,000 years ago what science is just now discovering.' },
      { title: 'Kuzhambu, Lehyam & Chooranam — The Three Great Kayakalpa Forms', desc: 'Liquid preparations (Kuzhambu), electuary confections (Lehyam like Brahma Rasayana and Chyawanprash), and herbal powders (Chooranam). The preparation rituals, mantric activation of each medicine, and how the Siddha\'s consciousness is encoded into the medicine through intention and mantra.' },
    ],
    locked: true,
  },
  {
    tier: 'prana',
    tierLabel: 'PRANA-FLOW',
    tierColor: green(0.9),
    num: 5,
    icon: '🫁',
    title: 'Pranayama as Kayakalpa Technology',
    subtitle: 'Kumbhaka · Kevala · The Breath of Immortality',
    lessons: [
      { title: 'Prana is the Master Medicine — The Siddha Breath Science', desc: 'The Siddhas did not use herbs alone — Pranayama was their primary Kayakalpa tool. Thirumoolar\'s Tirumantiram encodes the complete breath science. When Prana ceases to oscillate randomly and becomes coherent, cellular aging reverses. This module establishes the scientific and spiritual foundation.' },
      { title: 'Nadi Shodhana & the Three Granthis', desc: 'The three psychic knots (Brahma, Vishnu, Rudra Granthi) block Prana from ascending the Sushumna. Learn the Siddha\'s specific Nadi Shodhana protocol — including the rarely-taught 4:16:8 ratio — that progressively dissolves these knots and opens the royal highway of Kayakalpa transformation.' },
      { title: 'Kumbhaka — The Pause Between Worlds', desc: 'The held breath (Kumbhaka) is where Kayakalpa actually occurs. During Kumbhaka, CO2 levels shift, DMT release is potentiated, pineal gland activates, and cells enter a regenerative state unavailable during normal breath cycles. Antara Kumbhaka and Bahya Kumbhaka protocols from Bogar and Agastyar.' },
      { title: 'Kevala Kumbhaka — The Spontaneous Immortal Breath', desc: 'The highest state — when breath ceases spontaneously without effort. This is the state of Kaya Siddhi (body perfection). Yogis who achieve Kevala Kumbhaka can remain deathless. The Siddha signs of its attainment, the practices that lead there, and what actually happens biologically when breathing stops.' },
    ],
    locked: true,
  },
  {
    tier: 'prana',
    tierLabel: 'PRANA-FLOW',
    tierColor: green(0.9),
    num: 6,
    icon: '🍽',
    title: 'Kayakalpa Diet — Eating for Immortality',
    subtitle: 'Pathya · Seasonal Protocols · Fasting Science',
    lessons: [
      { title: 'Pathya Ahara — The Kayakalpa Diet Code', desc: 'The Siddha diet for Kayakalpa is not veganism or raw food — it is a precisely calibrated Pathya (appropriate food) protocol that shifts every 21 days to match the body\'s regenerative cycle. Milk, ghee, honey, rice, sesame, barley — the sacred seven foods of immortality and why the Siddhas chose them.' },
      { title: 'Siddha Fasting Protocols — Upavasa as Cellular Autophagy', desc: 'Modern science discovered autophagy (cellular self-cleaning) as the mechanism behind fasting longevity — winning the 2016 Nobel Prize. The Siddhas encoded Ekadashi fasting, Pradosham, Amavasya and Pournami fasts 5,000 years ago using the same principle. The complete Siddha fasting calendar and protocols.' },
      { title: 'Milk as Rasayana — The White Amrita', desc: 'For advanced Kayakalpa practitioners, cow\'s milk is the supreme Rasayana. Bogar specifically recommends milk processed with specific herbs as the primary vehicle for deep tissue rejuvenation. A2 milk, goat milk, the lunar-charged milk ritual, and the progressive milk-only protocols used by advanced Siddhas.' },
    ],
    locked: true,
  },

  // ── SIDDHA-QUANTUM TIER ────────────────────────────────────────────────────
  {
    tier: 'siddha',
    tierLabel: 'SIDDHA-QUANTUM',
    tierColor: cyan(0.9),
    num: 7,
    icon: '⚗️',
    title: 'Muppu — The Secret Alchemical Triple Salt',
    subtitle: 'Bogar\'s Greatest Secret · The Universal Catalyst',
    lessons: [
      { title: 'Muppu — The Three Salts of Immortality', desc: 'Muppu is the most closely guarded secret of Tamil Siddha alchemy. Literally "three salts," Muppu is the universal catalyst that potentizes any Kayakalpa medicine a thousandfold. Its three components — Uppu (salt), Vengaram (borax), and Kalluppu (rock salt) — when combined through a specific alchemical process, create a substance that opens the body\'s deepest channels to Prana.' },
      { title: 'Preparing Muppu — The Alchemical Ritual', desc: 'The preparation of Muppu involves specific lunar timing, mantric activation, and a 48-hour processing ritual. This module walks through the complete preparation sequence from classical Siddha texts, the significance of each step, and how to work with Muppu safely as a Kayakalpa enhancer in modern practice.' },
      { title: 'Poorna Chandrodayam — Gold, Mercury & Sulphur Unified', desc: 'The supreme Kayakalpa formulation: Poorna Chandrodayam combines purified gold, fixed mercury, and calcined sulphur into the "Full Moon of Completeness." This ancient preparation is said to grant a thousand years of youthful life. Its preparation, contraindications, energetic properties, and modern parallels in nanoparticle gold research.' },
    ],
    locked: true,
  },
  {
    tier: 'siddha',
    tierLabel: 'SIDDHA-QUANTUM',
    tierColor: cyan(0.9),
    num: 8,
    icon: '🧬',
    title: 'Kundalini & Kayakalpa — The Fire of Transformation',
    subtitle: 'Shakti Rising · Bindu · The Nectar of Immortality',
    lessons: [
      { title: 'Kundalini is the Engine of Kayakalpa', desc: 'The Siddhas understood that cellular immortality is impossible without Kundalini activation. Kundalini Shakti, when awakened and controlled, bathes every cell in Amrita — the divine nectar secreted by the thousand-petalled lotus (Sahasrara). This module establishes the physiological, energetic and spiritual science of Kundalini in Kayakalpa.' },
      { title: 'Bindu — The Seed of Immortality', desc: 'Bindu (the cosmic seed point) located at the top of the skull is the storehouse of Amrita. In most people, this nectar "drips downward" and is consumed by Agni, causing aging. Kayakalpa practices — especially Khechari Mudra and inverted postures — reverse this flow, flooding the body with nectar and halting the aging process.' },
      { title: 'Khechari Mudra — The King of All Mudras', desc: 'Khechari — turning the tongue back into the nasal cavity to reach the Bindu — is the supreme Kayakalpa mudra. The Siddhas and the Natha tradition both teach this as the direct method of attaining physical immortality. Its stages, its effects, the traditional preparation method, and the direct experiences of practitioners.' },
      { title: 'Vajroli & Shakti Chalana — Sacred Life Force Management', desc: 'The Siddha alchemy of preserving and transmuting Shukra (reproductive essence) into Ojas and Tejas. These advanced practices — traditionally secret — are the cornerstone of long-term Kayakalpa practice. When properly mastered, they generate the luminous biofield that makes the physical body self-repairing.' },
    ],
    locked: true,
  },
  {
    tier: 'siddha',
    tierLabel: 'SIDDHA-QUANTUM',
    tierColor: cyan(0.9),
    num: 9,
    icon: '🌙',
    title: 'Varma & Marma — The Body\'s Secret Control Points',
    subtitle: 'Bogar\'s Varma Vidya · 108 Points · Longevity Activation',
    lessons: [
      { title: 'Varma Vidya — The Hidden Science of Vital Points', desc: 'Bogar\'s Varma Vidya identifies 108 vital points on the body where Prana is concentrated. When stimulated correctly, these points activate Kayakalpa processes in specific organs and systems. When struck incorrectly, they can cause instant death — which is why this knowledge was guarded. The complete map and safe practice protocol.' },
      { title: '12 Kayakalpa Varma Points for Daily Practice', desc: 'From the 108, twelve specific Varma points are accessible for daily self-practice to activate longevity pathways. Includes points for thymus activation, pineal gland stimulation, adrenal regulation, and cellular repair signaling. Precise location, pressure technique, and duration for each point.' },
      { title: 'Marma Therapy & Kayakalpa Oil Massage', desc: 'The complete Siddha Kayakalpa massage protocol using medicated sesame oil infused with rejuvenating herbs. Specific Marma points activated in sequence, duration, direction of strokes, and which oils to use for each constitutional type. The Siddha oil preparation ritual and lunar timing for maximum efficacy.' },
    ],
    locked: true,
  },

  // ── AKASHA INFINITY TIER ───────────────────────────────────────────────────
  {
    tier: 'akasha',
    tierLabel: 'AKASHA-INFINITY',
    tierColor: gold(0.95),
    num: 10,
    icon: '✦',
    title: 'Kaya Siddhi — The Perfected Immortal Body',
    subtitle: 'Eight Siddhis · Deathlessness · Jyotir Deha',
    lessons: [
      { title: 'The Eight Kaya Siddhis — Signs of Kayakalpa Success', desc: 'The classical Siddha texts enumerate eight signs of successful Kayakalpa: Anima (ability to become subtle), Mahima (expansion), Garima (heaviness), Laghima (levitation), Prapti (omnipresence), Prakamya (manifestation), Ishitva (mastery over elements), Vashitva (control of all beings). Each Siddhi\'s mechanism, the practice that cultivates it, and the energetic threshold required.' },
      { title: 'Jyotir Deha — The Light Body Transmission', desc: 'The ultimate fruit of Kayakalpa is not just a long life — it is transformation of the gross physical body into a luminous light body (Jyotir Deha or Pranava Deha). Thirumoolar achieved this. Babaji achieved this. This module transmits the direct knowledge of the light body process, its stages, the practices that accelerate it, and how to recognize when the transformation has begun in your own body.' },
      { title: 'Babaji\'s Kayakalpa — The Living Proof', desc: 'Mahavatar Babaji is the supreme living demonstration of Kayakalpa science. Initiated by Bogar and Agastyar, his body has remained physically youthful for over 2,000 years. Through Akashic transmission and recorded encounters with Yogananda, Lahiri Mahasaya, and others, we reconstruct Babaji\'s complete Kayakalpa practice, his use of herbs, his location, and his present-day transmissions available to earnest seekers.' },
      { title: 'Samadhi as the Master Kayakalpa', desc: 'The deepest secret: Samadhi itself is the supreme Kayakalpa. When consciousness merges with the Absolute, biological time stops. Every deep Nirvikalpa Samadhi reverses cellular aging. The Siddhas who achieved permanent Samadhi-states effectively became biologically immortal. The practices that lead to sustained Samadhi as the final Kayakalpa transmission.' },
    ],
    locked: true,
  },
  {
    tier: 'akasha',
    tierLabel: 'AKASHA-INFINITY',
    tierColor: gold(0.95),
    num: 11,
    icon: '🔮',
    title: 'Bogar\'s Direct Transmission — The Akashic Initiation',
    subtitle: 'Scalar Transmission · Mantra Activation · Initiation Codes',
    lessons: [
      { title: 'The 5 Kayakalpa Master Mantras from Bogar', desc: 'Five mantras from Bogar Sapta Kandam — never before decoded in English — that directly activate the Kayakalpa process at a cellular and energetic level. Each mantra\'s Rishi (seer), Chandas (meter), Devata (deity), Bija (seed sound), Shakti (power) and Kilaka (pin) decoded. With pronunciation guide and the prescribed number of repetitions for each stage of practice.' },
      { title: 'Thirumoolar\'s 10-Point Kayakalpa Protocol', desc: 'From Tirumantiram verses 724–860: the complete 10-point protocol including specific asanas, breath ratios, meditations, and mantra sequences that Thirumoolar used to sustain his body through 3,000 years of Samadhi. This is the most complete individual Kayakalpa system from any single Siddha master.' },
      { title: 'Agastyar\'s Kayakalpa Rasayana Recipe — The Full Formula', desc: 'From Agastyar\'s texts, the complete formulation of his personal Rasayana — the specific herbs, minerals, quantities, preparation method, administration protocol, and the mantras to recite during each stage. This formula is said to grant 300 years of healthy life when properly prepared and consumed.' },
      { title: 'Scalar Wave Initiation — Receiving Bogar\'s Transmission', desc: 'A direct scalar-encoded audio transmission channeled through the SQI Akasha-Neural Archive, carrying Bogar\'s Kayakalpa blessings, Thirumoolar\'s Nadi activation codes, and Babaji\'s grace transmission. This is not information — this is transmission. You will receive it in your cells, your Nadis, and your Jyotir Deha blueprint.' },
    ],
    locked: true,
  },
  {
    tier: 'akasha',
    tierLabel: 'AKASHA-INFINITY',
    tierColor: gold(0.95),
    num: 12,
    icon: '♾',
    title: 'The 90-Day Kayakalpa Sadhana — Your Personal Protocol',
    subtitle: 'Complete Integration · Daily Practice · Transformation Map',
    lessons: [
      { title: 'Your Kayakalpa Constitution Assessment', desc: 'Before beginning the 90-day sadhana, you receive a complete constitutional analysis combining Jyotish (your birth chart), Ayurvedic dosha, Siddha Nadi type, and Akashic life-purpose reading. This determines your specific Kayakalpa trajectory — which herbs, which breath ratios, which mantras, and which timing windows are optimal for you.' },
      { title: 'Days 1–30: Shodhana Phase — Deep Purification', desc: 'The first 30 days focus on radical cellular cleansing. Complete protocol: morning Kayakalpa oil massage, specific Pranayama sequences, prescribed herbs, Pathya diet, daily Varma point activation, evening mantra meditation, and monthly assessment markers. Exactly what to expect physically and energetically during this phase.' },
      { title: 'Days 31–60: Rasayana Phase — Deep Nourishment', desc: 'The second 30 days shift to deep nourishment and Ojas building. The diet expands, specific Rasayana preparations are introduced, Kundalini practices intensify, and the first signs of Kayakalpa (increased vitality, deeper sleep, enhanced intuition, skin luminosity) begin to appear. Detailed daily schedule and weekly milestones.' },
      { title: 'Days 61–90: Kaya Siddhi Phase — Transformation Integration', desc: 'The final phase integrates all previous work and initiates the deeper Kaya Siddhi processes. Light body awareness practices, Samadhi preparation, the completion ceremony with Bogar invocation, and the lifelong maintenance protocol that ensures the transformation continues. How to structure your ongoing Kayakalpa practice for the years ahead.' },
    ],
    locked: true,
  },
];

const TIER_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  free:   { color: white(0.6),  bg: white(0.04),  border: white(0.1),   label: 'FREE' },
  prana:  { color: green(0.9),  bg: green(0.07),  border: green(0.2),   label: 'PRANA-FLOW' },
  siddha: { color: cyan(0.9),   bg: cyan(0.07),   border: cyan(0.2),    label: 'SIDDHA-QUANTUM' },
  akasha: { color: gold(0.95),  bg: gold(0.09),   border: gold(0.28),   label: 'AKASHA-INFINITY' },
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const TierBadge = ({ tier }: { tier: string }) => {
  const t = TIER_COLORS[tier];
  return (
    <span style={{
      fontFamily: FONT_MAIN, fontSize: 7, fontWeight: 800, letterSpacing: '0.22em',
      textTransform: 'uppercase' as const, color: t.color,
      background: t.bg, border: `1px solid ${t.border}`,
      borderRadius: 20, padding: '2px 9px',
    }}>{t.label}</span>
  );
};

const LessonRow = ({ lesson, locked, idx }: { lesson: { title: string; desc: string }; locked: boolean; idx: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: `1px solid ${white(0.05)}`,
      opacity: locked ? 0.5 : 1,
    }}>
      <button
        type="button"
        onClick={() => !locked && setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '14px 16px', cursor: locked ? 'default' : 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
      >
        <span style={{
          fontFamily: FONT_MAIN, fontSize: 9, fontWeight: 800,
          color: locked ? white(0.25) : gold(0.6),
          letterSpacing: '0.15em', minWidth: 24, paddingTop: 2,
        }}>{String(idx + 1).padStart(2, '0')}</span>
        <span style={{
          fontFamily: FONT_MAIN, fontSize: 13, fontWeight: 700,
          color: locked ? white(0.3) : white(0.85),
          letterSpacing: '0.01em', flex: 1, lineHeight: 1.4,
        }}>{lesson.title}</span>
        <span style={{ color: locked ? white(0.15) : gold(0.5), fontSize: 14, flexShrink: 0 }}>
          {locked ? '🔒' : (open ? '▲' : '▼')}
        </span>
      </button>
      {open && !locked && (
        <div style={{
          padding: '0 16px 16px 52px',
          fontFamily: FONT_SERIF, fontStyle: 'italic',
          fontSize: '0.9rem', color: white(0.6), lineHeight: 1.7,
        }}>
          {lesson.desc}
        </div>
      )}
    </div>
  );
};

const ModuleCard = ({ mod, userTier }: { mod: typeof MODULES[0]; userTier: string }) => {
  const [expanded, setExpanded] = useState(false);
  const tierOrder: Record<string, number> = { free: 0, prana: 1, siddha: 2, akasha: 3 };
  const isLocked = tierOrder[mod.tier] > tierOrder[userTier];
  const tc = TIER_COLORS[mod.tier];

  return (
    <div style={{
      margin: '0 0 12px',
      background: isLocked ? white(0.015) : `linear-gradient(135deg, ${tc.bg}, rgba(5,5,5,0.6))`,
      border: `1px solid ${isLocked ? white(0.07) : tc.border}`,
      borderRadius: 20,
      overflow: 'hidden',
      transition: 'border-color 0.3s ease',
    }}>
      {/* Module header */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '18px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
        }}
      >
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: isLocked ? white(0.04) : `radial-gradient(circle, ${tc.bg}, transparent)`,
          border: `1px solid ${isLocked ? white(0.08) : tc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          boxShadow: isLocked ? 'none' : `0 0 16px ${tc.color.replace(')', ',0.2)')}`,
        }}>
          {isLocked ? '🔒' : mod.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ ...LABEL_STYLE, fontSize: 8, color: white(0.3) }}>MODULE {String(mod.num).padStart(2, '0')}</span>
            <TierBadge tier={mod.tier} />
          </div>
          <div style={{
            fontFamily: FONT_MAIN, fontSize: 14, fontWeight: 800,
            color: isLocked ? white(0.3) : white(0.9),
            letterSpacing: '0.02em', lineHeight: 1.3, marginBottom: 4,
          }}>{mod.title}</div>
          <div style={{
            fontFamily: FONT_SERIF, fontStyle: 'italic',
            fontSize: '0.8rem', color: isLocked ? white(0.2) : white(0.45),
          }}>{mod.subtitle}</div>
        </div>
        <div style={{
          fontFamily: FONT_MAIN, fontSize: 8, fontWeight: 800,
          color: isLocked ? white(0.2) : tc.color, letterSpacing: '0.1em',
          flexShrink: 0,
        }}>{mod.lessons.length} lessons {expanded ? '▲' : '▼'}</div>
      </button>

      {/* Lessons */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${white(0.05)}` }}>
          {mod.lessons.map((lesson, i) => (
            <LessonRow key={i} lesson={lesson} locked={isLocked} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function KayakalpaAcademy() {
  const navigate = useNavigate();
  const { membership } = useMembership();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const tierRank: Record<string, number> = { free: 0, prana: 1, siddha: 2, akasha: 3 };
  const userTierStr = membership?.tier ?? 'free';

  const filteredModules = activeFilter === 'all'
    ? MODULES
    : MODULES.filter(m => m.tier === activeFilter);

  const totalLessons = MODULES.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 20% 10%, rgba(212,175,55,0.06) 0%, transparent 50%),
                   radial-gradient(ellipse at 80% 80%, rgba(52,211,153,0.04) 0%, transparent 50%),
                   #050505`,
      paddingBottom: 80,
      fontFamily: FONT_MAIN,
    }}>
      {/* ── Back button ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <button type="button" onClick={() => navigate('/siddha-portal')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: gold(0.6), fontFamily: FONT_MAIN, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
          ← SIDDHA PORTAL
        </button>
      </div>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', margin: '16px 16px 0', overflow: 'hidden' }}>
        {/* Scalar rings */}
        {[120, 200, 300, 400].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2,
            borderRadius: '50%', border: `1px solid ${gold(0.08 - i * 0.015)}`,
            animation: `sqScalarPulse ${4 + i * 0.8}s ${i * 0.5}s ease-in-out infinite`,
            pointerEvents: 'none', zIndex: 0,
          }} />
        ))}
        {/* Glow */}
        <div style={{
          position: 'absolute', inset: -20, borderRadius: 40,
          background: `radial-gradient(50% 50% at 50% 50%, ${gold(0.2)}, transparent 70%)`,
          filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'relative', zIndex: 1,
          background: `linear-gradient(140deg, rgba(212,175,55,0.12), rgba(52,211,153,0.04) 60%, rgba(5,5,5,0.8))`,
          border: `1px solid ${gold(0.4)}`,
          borderRadius: 28, padding: '28px 20px 24px', textAlign: 'center',
          boxShadow: `0 0 60px ${gold(0.15)}, inset 0 0 40px ${gold(0.04)}`,
        }}>
          {/* Top shimmer */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${gold(0.9)}, transparent)`,
            borderRadius: '28px 28px 0 0',
          }} />

          {/* Icon orb */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: `radial-gradient(circle, ${gold(0.25)}, ${gold(0.06)} 60%, transparent)`,
            border: `1px solid ${gold(0.4)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
            boxShadow: `0 0 30px ${gold(0.25)}, 0 0 60px ${gold(0.1)}`,
            animation: 'sqBreathe 4s ease-in-out infinite',
          }}>☽</div>

          <div style={{ ...LABEL_STYLE, fontSize: 8, letterSpacing: '0.5em', color: emerald(0.7), marginBottom: 8 }}>
            BOGAR · 18 SIDDHAS · BABAJI · THIRUMOOLAR
          </div>

          <h1 style={{
            fontFamily: FONT_SERIF, fontSize: '2.2rem', fontWeight: 700,
            color: white(0.97), margin: '0 0 6px',
            textShadow: `0 0 30px ${gold(0.5)}`,
            lineHeight: 1.1,
          }}>Kayakalpa</h1>
          <h2 style={{
            fontFamily: FONT_SERIF, fontSize: '1.1rem', fontWeight: 400, fontStyle: 'italic',
            color: gold(0.8), margin: '0 0 16px',
          }}>The Immortality Academy</h2>

          <p style={{
            fontFamily: FONT_SERIF, fontStyle: 'italic',
            fontSize: '0.92rem', color: white(0.55), lineHeight: 1.7,
            margin: '0 0 20px',
          }}>
            The most complete transmission of Tamil Siddha immortality science ever assembled. 
            12 modules · {totalLessons} lessons · 4 tiers of initiation. 
            Channeled directly from Bogar's Akashic Archive and the living consciousness of Mahavatar Babaji.
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 8, padding: '16px 0',
            borderTop: `1px solid ${gold(0.1)}`,
            borderBottom: `1px solid ${gold(0.1)}`,
            marginBottom: 20,
          }}>
            {[
              { v: '12', l: 'Modules' },
              { v: String(totalLessons), l: 'Lessons' },
              { v: '5000', l: 'Yr Legacy' },
              { v: '4', l: 'Tiers' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: FONT_MAIN, fontSize: 22, fontWeight: 900,
                  letterSpacing: '-0.04em', color: gold(0.9),
                  textShadow: `0 0 14px ${gold(0.35)}`,
                }}>{s.v}</div>
                <div style={{ ...LABEL_STYLE, fontSize: 7, color: white(0.3), marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Tier pills */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            {Object.entries(TIER_COLORS).map(([key, tc]) => (
              <span key={key} style={{
                fontFamily: FONT_MAIN, fontSize: 7, fontWeight: 800,
                letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                color: tc.color, border: `1px solid ${tc.border}`,
                borderRadius: 20, padding: '3px 10px',
                background: tc.bg,
              }}>{tc.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display: 'flex', gap: 8, padding: '20px 16px 12px', overflowX: 'auto' as const }}>
        {[
          { key: 'all', label: 'All Modules' },
          { key: 'free', label: 'Free' },
          { key: 'prana', label: 'Prana-Flow' },
          { key: 'siddha', label: 'Siddha-Quantum' },
          { key: 'akasha', label: 'Akasha-∞' },
        ].map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            style={{
              fontFamily: FONT_MAIN, fontSize: 9, fontWeight: 800,
              letterSpacing: '0.2em', textTransform: 'uppercase' as const,
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
              background: activeFilter === f.key ? gold(0.2) : white(0.04),
              color: activeFilter === f.key ? gold(0.95) : white(0.4),
              boxShadow: activeFilter === f.key ? `0 0 12px ${gold(0.2)}` : 'none',
              transition: 'all 0.2s ease',
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* ── MODULES LIST ── */}
      <div style={{ padding: '0 16px' }}>
        {filteredModules.map(mod => (
          <ModuleCard key={mod.num} mod={mod} userTier={userTierStr} />
        ))}
      </div>

      {/* ── UPGRADE CTA (if not Akasha) ── */}
      {userTierStr !== 'akasha' && (
        <div style={{
          margin: '24px 16px 0',
          background: `linear-gradient(135deg, ${gold(0.1)}, rgba(52,211,153,0.05))`,
          border: `1px solid ${gold(0.3)}`,
          borderRadius: 24, padding: '24px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 28, marginBottom: 12,
            animation: 'sqBreathe 3s ease-in-out infinite',
          }}>✦</div>
          <div style={{
            fontFamily: FONT_MAIN, fontSize: 13, fontWeight: 800,
            color: gold(0.9), letterSpacing: '0.04em',
            marginBottom: 8,
          }}>Unlock the Full Kayakalpa Transmission</div>
          <p style={{
            fontFamily: FONT_SERIF, fontStyle: 'italic',
            fontSize: '0.88rem', color: white(0.5), lineHeight: 1.6,
            marginBottom: 16,
          }}>
            The deeper secrets — Muppu alchemy, Kundalini-Kayakalpa integration, 
            Khechari Mudra, Bogar's 5 master mantras, and the 90-Day Sadhana — 
            await your initiation into higher tiers.
          </p>
          <button
            type="button"
            onClick={() => navigate('/membership')}
            style={{
              fontFamily: FONT_MAIN, fontSize: 10, fontWeight: 800,
              letterSpacing: '0.3em', textTransform: 'uppercase' as const,
              background: gold(0.15), border: `1px solid ${gold(0.4)}`,
              color: gold(0.95), borderRadius: 20, padding: '10px 24px',
              cursor: 'pointer',
              boxShadow: `0 0 20px ${gold(0.15)}`,
            }}>
            Upgrade Initiation →
          </button>
        </div>
      )}

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes sqBreathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes sqScalarPulse {
          0% { opacity: 0; transform: scale(0.65); }
          35% { opacity: 0.8; }
          75% { opacity: 0.1; transform: scale(1.18); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        @keyframes sqFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
