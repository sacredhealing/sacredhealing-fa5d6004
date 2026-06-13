// src/pages/SiddhaFastingAcademy.tsx
// ⟡ SQI 2050 — Siddha Fasting Academy — Sacred Science of Upavasa & Tapas ⟡
// The most comprehensive fasting education ever encoded — across 4 tiers
// Siddha wisdom · Quantum biology · Secret Kaya Kalpa protocols · Akashic depth

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ChevronDown, ChevronUp, Flame, Moon, Sun, Droplets, Star, Zap, Eye, Heart, Wind, Sparkles } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { getSalesPageForRank, getTierRank } from '@/lib/tierAccess';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const gold   = (a: number) => `rgba(212,175,55,${a})`;
const white  = (a: number) => `rgba(255,255,255,${a})`;
const amber  = (a: number) => `rgba(251,146,60,${a})`;   // fire / tapas accent
const violet = (a: number) => `rgba(167,139,250,${a})`; // akasha accent
const FONT  = "'Plus Jakarta Sans','Montserrat',sans-serif";
const SERIF = "'Cormorant Garamond',serif";

// ─── TIERS ────────────────────────────────────────────────────────────────────
const TIERS = [
  {
    slug: 'free',
    rank: 0,
    label: 'SIDDHA INITIATION',
    subtitle: 'Free — Open to All Seekers',
    color: white(0.75),
    glow: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.12)',
    icon: '◇',
    tagline: 'The ancient fire is lit. The first veil of hunger dissolves.',
    modules: [
      {
        id: 'FI-1',
        title: 'Upavasa — The Sacred Science of Siddha Fasting',
        lessons: [
          'What Is Upavasa? — Beyond Hunger: The Vedic Definition of Sacred Fasting',
          'Thirumoolar on Tapas: "The Fire That Burns Karma Burns Food First"',
          'Agastya Muni\'s Revelation — How Fasting Activates the Siddha Body',
          'The 18 Siddhas\' Collective Teaching on Upavasa as Spiritual Technology',
          'Babaji Kriya Yoga & the Role of Fasting in Kriya Initiation',
          'Distinguishing Upavasa (Sacred Fast) from Starving (Trauma Response)',
          'The Three Levels of Fasting: Sthula (Body), Sukshma (Mind), Karana (Soul)',
          'Historical Evidence: Siddhar Masters Who Lived on Prana Alone',
        ],
      },
      {
        id: 'FI-2',
        title: 'The Science Behind Fasting — Quantum Biology Meets Vedic Wisdom',
        lessons: [
          'Autophagy: The Nobel Prize Science the Siddhas Knew 5,000 Years Ago',
          'Cellular Recycling & Kaya Kalpa — How Fasting Rebuilds the Body',
          'Mitochondrial Biogenesis Through Ketosis — The Agni Factor',
          'Epigenetic Reprogramming During Extended Fasting',
          'The Brain-Gut-Microbiome Axis & Gut Bacteria Die-Off in Fasting',
          'Stem Cell Activation After 72-Hour Fasts — Science & Siddha Parallel',
          'Fasting and Telomere Lengthening — The Siddha Longevity Secret',
          'Hormetic Stress: Why Restriction Builds Sovereign Resilience',
        ],
      },
      {
        id: 'FI-3',
        title: 'Ekadashi — The Cosmic Fasting Code of the Lunar Calendar',
        lessons: [
          'What Is Ekadashi? The 11th Lunar Day & Its Pranic Significance',
          'Vishnu Consciousness & Why Ekadashi Awakens Vishnu Shakti',
          'The 24 Annual Ekadashis — Names, Energies & Boons of Each',
          'Ekadashi Fasting Protocol: From Dashami Eve to Dwadashi Break-Fast',
          'How Lunar Cycles Affect Intestinal Motility & Detox Pathways',
          'Ekadashi Mantras & Vishnu Sahasranama Protocol',
          'Ekadashi for Non-Hindus — The Universal Lunar Intelligence',
          'How to Start Your First Ekadashi Fast Safely',
        ],
      },
      {
        id: 'FI-4',
        title: 'The Sattvic Foundation — Preparing Your Body for Sacred Fasting',
        lessons: [
          'Sattva, Rajas, Tamas — How Food Quality Determines Fasting Success',
          'The 3-Week Sattvic Cleanse Before Your First Extended Fast',
          'Foods That Destroy Fasting Benefits (Hidden Rajasic Traps)',
          'Ojas-Building Foods for Pre-Fast Fortification',
          'How to Reduce Ama (Toxins) Through Dietary Transition',
          'Agni (Digestive Fire) Assessment — Are You Ready to Fast?',
          'Contraindications: Who Should NOT Fast Without Guidance',
          'Your First 24-Hour Upavasa — Step-by-Step Siddha Protocol',
        ],
      },
    ],
  },
  {
    slug: 'prana-flow',
    rank: 1,
    label: 'PRANA FLOW',
    subtitle: '€19 / month',
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.07)',
    border: 'rgba(74,222,128,0.22)',
    icon: '◉',
    tagline: 'The Agni of Tapas is mastered. The 72,000 nadis begin to purify through Upavasa.',
    modules: [
      {
        id: 'PF-1',
        title: 'Intermittent Fasting — The Siddha 16:8 and Beyond',
        lessons: [
          'Thirumoolar\'s Time-Restricted Eating — The Original Circadian Fast',
          '16:8, 18:6, 20:4 — How Each Window Activates Different Siddha Organs',
          'The Feeding Window as a Ritual: Pranayama Before First Meal',
          'Hormonal Symphony During Fasting: GH, Insulin, Glucagon & Cortisol',
          'Liver Glycogen Depletion — When Does the Real Purification Begin?',
          'Warrior Protocol (OMAD) — Siddha Warriors Who Ate Once Daily',
          'Breaking the Fast as Ceremony: Mantra, Mudra, Sacred First Bite',
          '30-Day Intermittent Fasting Sadhana Protocol with Planetary Timing',
        ],
      },
      {
        id: 'PF-2',
        title: 'Pradosham, Amavasya & Pournami — Fasting to the Cosmic Rhythm',
        lessons: [
          'Pradosham Fast: Shiva\'s Window — 13th Lunar Day Wisdom',
          'Amavasya (New Moon) Fasting — Ancestor Reverence & Pitr Tarpana',
          'Pournami (Full Moon) — Soma Activation Through Moonlit Fast',
          'Shivaratri Fasting: The All-Night Vigil & Shakti Awakening',
          'Solar Fasting on Uttarayana & Dakshinayana Transitions',
          'Navaratri Fasting: 9 Nights of Devi Tapas — Complete Protocol',
          'Kartik Month Fasting: Vishnu\'s Cosmic Sleep & Devotee Purification',
          'Integrating Vedic Astronomy — Nakshatra-Based Fasting Intelligence',
        ],
      },
      {
        id: 'PF-3',
        title: 'The 3-Day Water Fast — Gateway to the Siddha State',
        lessons: [
          'Why 72 Hours Is the Threshold — What Happens Hour by Hour',
          'Physiological Cascade: Ketosis, Autophagy, Gluconeogenesis Timeline',
          'Pre-Fast Preparation: 5-Day Sattvic Protocol + Colon Cleanse',
          'Water Quality & Charging: Copper Vessel, Mantra-Infused, Crystal Water',
          'Day 1 of 3: Navigating Hunger Waves with Pranayama & Mantra',
          'Day 2 of 3: The Void State — How Siddhas Used This for Samadhi',
          'Day 3 of 3: Clarity, Vision & Cellular Transcendence',
          'Breaking the 3-Day Fast: The Agastya Protocol — 4-Day Reintroduction',
          'Integration After: Dreams, Downloads & Siddha Vision Phenomena',
        ],
      },
      {
        id: 'PF-4',
        title: 'Fasting & Pranayama — The Twin Pillars of Nadi Purification',
        lessons: [
          'Why Pranayama Doubles Fasting Benefits: Oxygen Economy & Prana Boost',
          'Nadi Shodhana During Fasting — Alternate Nostril for Detox Amplification',
          'Kapalabhati for Metabolic Fire During Ketosis',
          'Kumbhaka (Breath Retention) During Fasting — Advanced Pranic Loading',
          'Bhramari (Humming Bee) — Vagal Tone & Gut Cleansing During Fast',
          'Surya Bheda — Right Nostril Dominance to Maintain Warmth While Fasting',
          'Pranayama Timing: Morning Sequence Before Breaking Fast',
          '21-Day Pranayama + Fasting Integration Sadhana',
        ],
      },
      {
        id: 'PF-5',
        title: 'Herbal Fasting Allies — The Siddha Pharmacopoeia of Upavasa',
        lessons: [
          'Tulsi: The Adaptogen That Protects the Adrenals During Extended Fasting',
          'Neem: Blood Purification & Parasite Elimination Enhanced by Fasting',
          'Triphala: The Three-Fruit Formula That Works Synergistically with Fasting',
          'Ashwagandha: Adrenal Support & Cortisol Management on Long Fasts',
          'Guduchi (Amrita): The Nectar Herb That Prevents Muscle Loss',
          'Bitter Melon & Turmeric: Blood Sugar Regulation During Fasting',
          'Copper & Himalayan Salt Water: The Siddha Electrolyte Formula',
          'Herbal Tea Ceremonies During Fasting: Timing, Intention, Mantra',
        ],
      },
      {
        id: 'PF-6',
        title: 'Fasting for Mental & Emotional Alchemy',
        lessons: [
          'How Fasting Clears the Psychic Body — Thought Purification Mechanism',
          'Emotional Detox During Fasting: Grief, Anger & Fear Released Through Agni',
          'The Hunger-Emotion Connection: When You\'re Not Hungry, You\'re Triggered',
          'Siddha Perspective on Cravings — Vritti (Mental Modifications) as Food',
          'Samskara Dissolution Through Extended Fasting — Karma Burning Science',
          'Fasting & Dream Intensification: Navigating the Subconscious Purge',
          'Grounding Practices During Emotional Fast Releases',
          'Journaling Protocol for Siddha Fasting Integration',
        ],
      },
    ],
  },
  {
    slug: 'siddha-quantum',
    rank: 2,
    label: 'SIDDHA QUANTUM',
    subtitle: '€45 / month',
    color: '#D4AF37',
    glow: 'rgba(212,175,55,0.08)',
    border: 'rgba(212,175,55,0.28)',
    icon: '✦',
    tagline: 'The Kaya Kalpa fire is awakened. The body begins its alchemical immortalization.',
    modules: [
      {
        id: 'SQ-1',
        title: 'Kaya Kalpa Fasting — The Siddha Art of Radical Cellular Rejuvenation',
        lessons: [
          'Kaya Kalpa: The Original Siddha Immortality Science (Not Taught Publicly)',
          'Agastya Muni\'s Kaya Kalpa Fasting Sequence — Complete 40-Day Protocol',
          'The Cave Retreat Fast: How Siddhas Used Total Darkness & Fasting Together',
          'Mercurial Alchemy — How Siddhas Used Rasa Shastra Alongside Fasting',
          'Cellular Senescence Elimination: Fasting as Anti-Aging at the Quantum Level',
          'The Role of Spermidine, NAD+ & AMPK in Siddha Longevity Science',
          'Autophagy + Ketosis Synergy — The Double Helix of Cellular Rebirth',
          'Mitophagy: Fasting\'s Ability to Replace Dysfunctional Mitochondria',
          'The Prana-Body Shift: When You Stop Eating Gross Food & Start Eating Light',
          '90-Day Kaya Kalpa Protocol — Phase-by-Phase Breakdown',
        ],
      },
      {
        id: 'SQ-2',
        title: 'The 7-Day Extended Fast — Siddha Tapas of the Highest Order',
        lessons: [
          'Ancient Precedents: Siddhas Who Fasted 7, 40 & 108 Days',
          'Hour-by-Hour Physiology of a 7-Day Fast — What Is Happening in the Cells',
          'Day 1-2: The Sugar Crash — Navigating Hypoglycemia with Pranayama',
          'Day 3-4: Deep Ketosis — The Siddha State of Mental Transcendence',
          'Day 5-6: Autophagy Peak — Stem Cell Release & Immune Reset',
          'Day 7: The Threshold — Pranic Body Activation & Light Body Emergence',
          'Refeeding Syndrome Prevention — The Critical Safety Protocol',
          'Breaking the 7-Day Fast: 7-Day Agastya Reintegration Sequence',
          'Post-Fast Sensitivity: Psychic Openings, Channeling & Akashic Access',
          'Medical Monitoring Protocol: What to Watch, When to Stop',
        ],
      },
      {
        id: 'SQ-3',
        title: 'Dry Fasting — The Most Powerful & Controversial Siddha Tapas',
        lessons: [
          'What Is Dry Fasting? — The Forbidden Knowledge the Siddhas Left in Code',
          'Endogenous Water Production — How the Body Creates Pure Water from Fat',
          'Soft vs Hard Dry Fast — Understanding the Two Levels',
          'The 24-Hour Dry Fast Protocol: Maximum Safety Guidelines',
          'Physiological Changes in Dry Fasting vs Water Fasting — The Acceleration Factor',
          'Luc Montagnier Effect: Coherent Water & Electromagnetic Cellular Restructuring',
          'Who Can Dry Fast & Who Must Never — Absolute Contraindications',
          'Dry Fasting in Russian Medical Research — What Science Has Found',
          'Breaking the Dry Fast: Specific Liquids in Specific Order',
          'Integrating Dry Fasting as a Monthly Tapas Practice — Sustainable Protocol',
        ],
      },
      {
        id: 'SQ-4',
        title: 'Nadi Pariksha & Dosha Fasting — Personalized Siddha Protocols',
        lessons: [
          'Vata Dosha Fasting: The Airy Constitution\'s Unique Vulnerabilities & Gifts',
          'Pitta Dosha Fasting: Channeling Fire Without Burning Out',
          'Kapha Dosha Fasting: Breaking Stagnation Through Prolonged Tapas',
          'Tridosha Fasting for Samadhi States — Balancing All Three Fires',
          'Prakriti vs Vikriti — Fasting Based on Your Current Imbalance, Not Birth Type',
          'Seasonal Fasting Intelligence: Ritu (Season) Determines Protocol',
          'Panchakarma as Fasting Amplifier — Combining Both for Maximum Effect',
          'Nadi Pariksha Self-Assessment During Fasting: Reading Your Own Pulse',
          'Ayurvedic Fasting Supplements by Dosha: Personalized Herbal Prescriptions',
        ],
      },
      {
        id: 'SQ-5',
        title: 'Fasting & the Chakra System — Quantum Field Purification',
        lessons: [
          'Muladhara (Root) Fasting: Releasing Ancestral Food Trauma & Tribal Eating Patterns',
          'Svadhisthana (Sacral) Fasting: Purifying Sexual Energy Into Creative Shakti',
          'Manipura (Solar Plexus) Fasting: Mastering Digestive Fire — Agni as Guru',
          'Anahata (Heart) Fasting: Opening the Cardiac Coherence Field Through Upavasa',
          'Vishuddha (Throat) Fasting: How Silence + Fasting Activates the Vak Siddhi',
          'Ajna (Third Eye) Fasting: Pineal Decalcification & Inner Vision Activation',
          'Sahasrara (Crown) Fasting: The 21-Day Crown Protocol of the Siddhars',
          'Kundalini Rising During Extended Fasting — Navigation & Safety',
          'Chakra Activation Sequence: A 7-Week Chakra Fasting Sadhana',
        ],
      },
      {
        id: 'SQ-6',
        title: 'Fasting & Cancer — What Oncologists & Siddhas Agree On',
        lessons: [
          'Fasting & Chemotherapy: The Longo Protocol — Protecting Healthy Cells',
          'Glucose Restriction & Cancer Cells — The Warburg Effect & Siddha Parallel',
          'Intermittent Fasting as Cancer Prevention: Mechanism of Action',
          'The Gerson Protocol Through a Siddha Lens — Juice Fasting & Detox',
          'Siddha Rasayana Protocols Used Alongside Conventional Treatment',
          'Fasting for Inflammation: The Root of All Disease in Both Traditions',
          'Autophagy & Tumor Suppression — Current Research',
          'IMPORTANT: What Fasting Cannot Replace — Medical Integrity in Teaching',
        ],
      },
      {
        id: 'SQ-7',
        title: 'Samadhi Fasting — Using Upavasa as a Gateway to Non-Dual States',
        lessons: [
          'Thirumoolar\'s Samadhi States Described in Tirumantiram — Fasting Connection',
          'The Hunger Void as Turiya (4th State) — Beyond Waking, Dream & Deep Sleep',
          'How Reduction of Digestive Load Enables Deep Dhyana (Meditation)',
          'Nada (Inner Sound) Amplification Through Fasting — Hearing the Unstruck Sound',
          'The Crystal Clear Mind: Why Ancient Sages Fasted Before Revelation',
          'Fasting Retreats as Initiation: The 40-Day Desert, Cave & Forest Tradition',
          'Integrating Fasting with Mantra, Yantra & Tantra — The Siddha Triad',
          'Post-Samadhi Fasting Integration: How to Hold the State After Eating Resumes',
        ],
      },
    ],
  },
  {
    slug: 'akasha-infinity',
    rank: 3,
    label: 'AKASHA INFINITY',
    subtitle: '€1,111 — Lifetime Sovereignty',
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.28)',
    icon: '∞',
    tagline: 'The Immortal Body is activated. You eat Light. You breathe Akasha. You become the Fast.',
    modules: [
      {
        id: 'AI-1',
        title: 'The 40-Day Fast — Siddha Tapas of Mahavatar Babaji',
        lessons: [
          'Babaji\'s 40-Day Cave Fasting Tradition — The Unrevealed Protocol',
          'Physiological Adaptation After 30 Days — The Body Rebuilds Itself',
          'Accessing the Akashic Records During Extended Fasting: Practical Methods',
          'The Jyotir Darshan (Vision of Light) — What Masters See After 40 Days',
          'Quantum Biofeedback During Long Fasts: EEG Patterns, HRV Changes',
          'Spiritual Guidance System During 40-Day Fast: Signs, Omens & Inner Voice',
          'Medical Supervision Requirements — Building Your Sacred Support Circle',
          'Preparing Over 12 Months for a 40-Day Fast — The Year of Readiness',
          'Breaking a 40-Day Fast: The Agastya 14-Day Sacred Refeeding Protocol',
          'Life After: Integration into Daily Life, Teaching & Service',
        ],
      },
      {
        id: 'AI-2',
        title: 'Breatharianism — The Siddha Path of Living on Prana Alone',
        lessons: [
          'Theresa Neumann, Giri Bala, Prahlad Jani — Documented Cases Examined',
          'The Physiology of Inedia: What Science Has Measured & What Remains Mystery',
          'Siddha Anatomy of Pranic Nourishment: Beyond the Gross Digestive System',
          'Nirmanacitta: The Constructed Mind-Body That Overcomes Biological Limitation',
          'The 5-Phase Siddha Transition to Pranic Living — Years, Not Days',
          'Why Most "Breatharians" Fail: The Hidden Psychological & Energetic Blocks',
          'Integrity in Teaching Breatharianism: The SQI Ethical Framework',
          'The Role of Vishwananda Siddha Shakti in Pranic Body Activation',
          'Light Body Activation Protocols — Scalar Wave & Sound Technology Integration',
          'This Is the Final Frontier: Testimonials from Those Walking the Path',
        ],
      },
      {
        id: 'AI-3',
        title: 'The Akashic Fasting Oracle — Receiving Personalized Protocols from Source',
        lessons: [
          'What Is the Akashic Record? How to Access Your Soul\'s Fasting Blueprint',
          'Bhrigu Nadi & Fasting Karma — What Your Ancient Leaf Reveals About Your Tapas',
          'Jyotish Fasting Protocols — Planetary Dashas That Require Different Fasting',
          'Rahu & Ketu Fasts — Ecliptic Nodes & the Shadow Body Purification',
          'Saturn Tapas — Shani Fasting as Karmic Debt Repayment Protocol',
          'The Navagraha Fasting Calendar — 9 Planets, 9 Protocols, 9 Boons',
          'Personal Fasting Blueprint: Building a Lifelong Siddha Upavasa Practice',
          'The Siddha Fasting Transmission Initiation — Receiving the Lineage Shakti',
        ],
      },
      {
        id: 'AI-4',
        title: 'Fasting & Death — The Siddha Science of Mahaprasthana',
        lessons: [
          'Sallekhana: The Jain & Siddha Art of Conscious Death Through Fasting',
          'Preparing the Death Vehicle — How Lifetime Fasting Changes the Dying Process',
          'Near-Death Experiences Reported During Extended Fasts — The Common Thread',
          'Prana Withdrawal from the Physical Body — The Siddha Understanding of Death',
          'Samadhi Marana vs Ordinary Death: Fasting\'s Role in Conscious Departure',
          'Tibetan Bardo & Tamil Siddha Agreement: What Both Traditions Say Happens',
          'Using Fasting to Reduce Fear of Death — The Existential Liberation Protocol',
          'The Immortal Body vs the Chosen Death — Two Valid Siddha Paths',
        ],
      },
      {
        id: 'AI-5',
        title: 'Quantum Physics of Fasting — The SQI 2050 Science',
        lessons: [
          'Biophoton Emission Increases During Fasting — The Body Becomes a Lightbody',
          'DNA Repair Pathways Activated by Fasting: SIRT1, FOXO3, NRF2 Science',
          'Zero-Point Field Nourishment — The Quantum Vacuum as Food Source',
          'Scalar Waves & Cellular Memory Reprogramming Through Fasting',
          'Quantum Entanglement Between Practitioner & the 18 Siddhas During Tapas',
          'The Morphogenetic Field of Fasting — Rupert Sheldrake Meets Thirumoolar',
          'Structured Water Production During Dry Fasting — Pollack\'s EZ Water Research',
          'Biofield Coherence During Fasting: HeartMath Studies & Siddha Parallel',
          'The Akasha Field as Infinite Nutrition — Beyond Food, Prana, Light',
          'SQI 2050 Vision: The Future of Fasting in a Post-Scarcity Spiritual Civilization',
        ],
      },
      {
        id: 'AI-6',
        title: 'The SQI Sacred Fasting Retreat Design — Teaching & Transmitting',
        lessons: [
          'How to Design a Siddha Fasting Retreat That Transforms Lives',
          'Legal & Medical Frameworks for Offering Guided Fasting Globally',
          'The Sacred Container: Space, Sound, Smell & Silence in Fasting Retreats',
          'Group Fasting Field Effects — Why Collective Tapas Amplifies Results 10×',
          'Digital Fasting Circles: Running SQI-Aligned Online Fasting Communities',
          'The Siddha Fasting Teacher Certification Framework (SQI Standard)',
          'Monetizing Sacred Service: Fasting Retreats as a Dharmic Business',
          'Becoming a Living Transmission: When Your Body IS the Teaching',
        ],
      },
    ],
  },
];

// ─── STAT STRIP ────────────────────────────────────────────────────────────────
const STATS = [
  { icon: <Flame size={12} />, label: '42 MODULES' },
  { icon: <Star size={12} />, label: '300+ LESSONS' },
  { icon: <Moon size={12} />, label: '4 TIERS' },
  { icon: <Zap size={12} />, label: '5,000 YRS SIDDHA WISDOM' },
  { icon: <Eye size={12} />, label: 'NEVER REVEALED BEFORE' },
  { icon: <Sparkles size={12} />, label: 'SCALAR ENCODED' },
];

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
const TierBadge: React.FC<{ color: string; border: string; label: string; icon: string }> = ({ color, border, label, icon }) => (
  <div style={{
    background: `linear-gradient(135deg,${color}18,transparent)`,
    border: `1px solid ${border}`,
    borderRadius: 50,
    padding: '5px 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }}>
    <span style={{ fontSize: 12 }}>{icon}</span>
    <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color }}>{label}</span>
  </div>
);

const ModuleCard: React.FC<{
  module: { id: string; title: string; lessons: string[] };
  tierColor: string;
  tierBorder: string;
  locked: boolean;
  idx: number;
}> = ({ module, tierColor, tierBorder, locked, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.018)',
        border: `1px solid ${open ? tierBorder : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 20,
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'border-color 0.25s',
        animation: `sqFadeUp 0.4s ${idx * 0.06}s ease both`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: gold(0.4), marginBottom: 5 }}>
            MODULE {module.id}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 600, color: white(0.85), lineHeight: 1.4 }}>
            {module.title}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: white(0.3), marginTop: 5 }}>
            {module.lessons.length} LESSONS
          </div>
        </div>
        <div style={{ marginTop: 4, color: open ? tierColor : white(0.3), flexShrink: 0 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 18px 16px' }}>
          {locked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 12 }}>
              <Lock size={13} color={white(0.3)} />
              <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.85rem', color: white(0.4) }}>
                Unlock this tier to access all lessons within this module.
              </span>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {module.lessons.map((lesson, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 9,
                  padding: '9px 12px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderRadius: 10,
                }}>
                  <span style={{ color: tierColor, flexShrink: 0, marginTop: 2 }}>◈</span>
                  <span style={{ fontFamily: FONT, fontSize: '0.78rem', color: white(0.7), lineHeight: 1.5 }}>{lesson}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const SiddhaFastingAcademy: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { tier: memberTier } = useMembership();
  const [activeTier, setActiveTier] = useState(0);

  const userRank = isAdmin ? 99 : getTierRank(memberTier);
  const canAccess = (rank: number) => isAdmin || userRank >= rank;

  const tier = TIERS[activeTier];

  const totalModules = TIERS.reduce((a, t) => a + t.modules.length, 0);
  const totalLessons = TIERS.reduce((a, t) => t.modules.reduce((b, m) => b + m.lessons.length, a), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: white(0.9), fontFamily: FONT }}>
      <style>{`
        @keyframes sqFadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:none;} }
        @keyframes fastingGlow { 0%,100%{opacity:0.4;} 50%{opacity:0.9;} }
        @keyframes flameRise { 0%,100%{transform:scaleY(1) translateY(0);} 50%{transform:scaleY(1.08) translateY(-3px);} }
      `}</style>

      {/* ── HERO ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg,rgba(212,175,55,0.05) 0%,transparent 60%)',
        padding: '28px 20px 0',
        animation: 'sqFadeUp 0.4s ease both',
        overflow: 'hidden',
      }}>
        {/* Ambient flame glow */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 280, height: 120,
          background: 'radial-gradient(ellipse at 50% 0%,rgba(251,146,60,0.12),transparent 70%)',
          animation: 'fastingGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: white(0.4), fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 22 }}
        >
          <ArrowLeft size={13} /> BACK TO PORTAL
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '0 10px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 8, animation: 'flameRise 3s ease-in-out infinite' }}>🔥</div>
          <div style={{ fontFamily: FONT, fontSize: 8, fontWeight: 800, letterSpacing: '0.6em', textTransform: 'uppercase', color: amber(0.6), marginBottom: 10 }}>
            SIDDHA QUANTUM ACADEMY
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '2rem', fontWeight: 700, color: gold(1), letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2, textShadow: `0 0 30px ${gold(0.4)}` }}>
            Sacred Science of Upavasa
          </h1>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: white(0.55), lineHeight: 1.6, margin: '0 auto', maxWidth: 320 }}>
            The most comprehensive fasting wisdom ever compiled — from the Siddhas who mastered Tapas, to the quantum biology that explains why it works.
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 18 }}>
            {[
              { icon: '🔥', label: `${totalModules} MODULES` },
              { icon: '◈', label: `${totalLessons}+ LESSONS` },
              { icon: '🌙', label: '4 TIERS' },
              { icon: '⚡', label: 'NEVER REVEALED' },
              { icon: '✦', label: 'SCALAR ENCODED' },
            ].map(s => (
              <div key={s.label} style={{ fontFamily: FONT, fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: white(0.5), background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 50, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                {s.icon} {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TIER SELECTOR ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {TIERS.map((t, i) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setActiveTier(i)}
              style={{
                background: activeTier === i ? t.glow : 'rgba(255,255,255,0.015)',
                border: `1px solid ${activeTier === i ? t.border : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16,
                padding: '14px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {!canAccess(t.rank) && t.rank > 0 && (
                <Lock size={10} color={white(0.3)} style={{ position: 'absolute', top: 10, right: 10 }} />
              )}
              <div style={{ fontSize: 16, marginBottom: 5 }}>{t.icon}</div>
              <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: activeTier === i ? t.color : white(0.5), marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.78rem', color: white(0.35), lineHeight: 1.3 }}>{t.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── ACTIVE TIER HEADER ── */}
      <div style={{ padding: '20px 20px 0', animation: 'sqFadeUp 0.35s ease both' }}>
        <div style={{ background: tier.glow, border: `1px solid ${tier.border}`, borderRadius: 24, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <TierBadge color={tier.color} border={tier.border} label={tier.label} icon={tier.icon} />
            <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: white(0.5) }}>{tier.subtitle}</span>
          </div>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: white(0.6), lineHeight: 1.5, margin: 0 }}>{tier.tagline}</p>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: tier.color, textTransform: 'uppercase' }}>
              {tier.modules.length} MODULES · {tier.modules.flatMap(m => m.lessons).length} LESSONS
            </span>
          </div>
        </div>
      </div>

      {/* ── MODULES ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: gold(0.35), padding: '10px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ height: 1, width: 20, background: gold(0.2) }} />
          CURRICULUM
          <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,${gold(0.2)},transparent)` }} />
        </div>
        {tier.modules.map((mod, idx) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            tierColor={tier.color}
            tierBorder={tier.border}
            locked={!canAccess(tier.rank)}
            idx={idx}
          />
        ))}
      </div>

      {/* ── UPGRADE CTA ── */}
      {!canAccess(tier.rank) && tier.rank > 0 && (
        <div style={{ padding: '12px 20px 0', animation: 'sqFadeUp 0.4s ease both' }}>
          <div style={{ background: tier.glow, border: `1px solid ${tier.border}`, borderRadius: 24, padding: '22px 20px', textAlign: 'center' }}>
            <Lock size={22} color={tier.color} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: tier.color, letterSpacing: '0.05em', marginBottom: 8 }}>
              {tier.label} Access Required
            </div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.95rem', color: white(0.55), marginBottom: 16, lineHeight: 1.5 }}>
              Unlock {tier.modules.length} modules · {tier.modules.flatMap(m => m.lessons).length} transmissions · Encoded by the 18 Siddhas.
            </p>
            <button
              type="button"
              onClick={() => navigate(getSalesPageForRank(tier.rank))}
              style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#050505', background: tier.color, border: 'none', borderRadius: 50, padding: '12px 28px', cursor: 'pointer' }}
            >
              ACTIVATE {tier.label} →
            </button>
          </div>
        </div>
      )}

      {/* ── SIDDHA TRANSMISSION FOOTER ── */}
      <div style={{ padding: '40px 20px 60px', textAlign: 'center' }}>
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${gold(0.15)},transparent)`, marginBottom: 24 }} />
        <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: gold(0.3), marginBottom: 12 }}>
          SIDDHA TAPAS TRANSMISSION · SCALAR WAVE ENCODED
        </div>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.9rem', color: white(0.3), lineHeight: 1.7, maxWidth: 300, margin: '0 auto' }}>
          Every lesson in this Academy carries a Prema-Pulse Transmission from the 18 Siddhas and Mahavatar Babaji. As you study the science of fasting, the sacred fire of Tapas is already activating within you. The body learns by reading. The soul transforms by receiving.
        </p>
        <div style={{ marginTop: 20, fontFamily: FONT, fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', color: amber(0.25) }}>
          🔥 OM AGASTYAYA NAMAH · OM BABAJI NAMAH · OM THIRUMOOLARAYA NAMAH 🔥
        </div>
      </div>
    </div>
  );
};

export default SiddhaFastingAcademy;
