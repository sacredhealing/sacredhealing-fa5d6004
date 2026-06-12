import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const amber = (a: number) => `rgba(245,158,11,${a})`;
const rose  = (a: number) => `rgba(251,113,133,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;

const FONT = "'Plus Jakarta Sans','Montserrat',sans-serif";
const SERIF = "'Cormorant Garamond',serif";

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────
const TIERS = [
  { id: 'free',    label: 'Free',           color: white(0.55),  border: white(0.12),  glow: white(0.06)  },
  { id: 'prana',   label: 'Prana-Flow',     color: '#4ADE80',    border: '#4ADE8030',  glow: '#4ADE8010'  },
  { id: 'siddha',  label: 'Siddha-Quantum', color: cyan(0.9),    border: cyan(0.25),   glow: cyan(0.06)   },
  { id: 'akasha',  label: 'Akasha-Infinity',color: gold(0.95),   border: gold(0.35),   glow: gold(0.08)   },
];

// ─── CURRICULUM DATA ──────────────────────────────────────────────────────────
const CURRICULUM = [
  {
    tier: 0,
    tierLabel: 'Tier I — Free',
    title: 'Ojas Prakarana: The Foundation Teachings',
    subtitle: 'The Nature of Vital Essence — What the Siddhas Knew That Modern Science Is Only Beginning to Discover',
    icon: '🌱',
    modules: [
      {
        num: '01',
        title: 'The Secret Essence: What Is Ojas?',
        desc: 'Ojas is the eighth and final dhatu (vital tissue), the supreme distillate produced when all seven tissue layers — rasa, rakta, mamsa, meda, asthi, majja, shukra/artava — are perfectly nourished and refined. The Siddhas called it "Para Ojas," the immortal nectar that resides in the Hridaya (heart-lotus) and circulates as the luminous substrate of consciousness itself.',
        lessons: [
          'Ojas in Charaka Samhita vs Thirumantiram — the two streams',
          'Para Ojas (8 drops in the heart) vs Apara Ojas (half anjali in circulation)',
          'The quantum biology of Ojas: mitochondrial coherence & biophoton emission',
          'Why Agastya Muni placed Ojas-cultivation as the First Gate of Siddha immortality',
          'The 18 Siddhas on Kayakalpa: Ojas as the liquid fire of eternal youth',
        ],
      },
      {
        num: '02',
        title: 'The Seven Dhatu Refinement Cascade',
        desc: 'Each dhatu takes approximately 5 days to transform. The complete cycle of food → Para Ojas takes 35 days. This module maps the sacred alchemy — what the Siddhas called "Sapta Dhatu Paaka" — and reveals the precise nutritional, pranic, and consciousness inputs required at each stage.',
        lessons: [
          'Rasa Dhatu: the lymphatic ocean — first gateway to Ojas production',
          'The 35-day cycle: how long it truly takes to build one drop of Ojas',
          'Tejas and Prana as the fire and breath that drive the cascade',
          'Agni (digestive intelligence) as the master alchemist — why digestion IS spirituality',
          'Why most people never reach true Ojas — the four Agni disturbances explained',
        ],
      },
      {
        num: '03',
        title: 'Signs of Abundant vs Depleted Ojas',
        desc: 'The ancient texts give precise diagnostic markers. This module gives you the full Siddha and Ayurvedic framework for self-assessment — including the 8 classical signs of Ojas kshaya (depletion) described in Ashtanga Hridayam and the luminosity signs recorded in Thirumantiram.',
        lessons: [
          '8 Signs of Ojas Kshaya: fear, weakness, sensory dimming, pallor & more',
          'Ojas Vridhi signs: radiance, fearlessness, clear mind, magnetic presence',
          'The "Tejas-glow" — why Siddha masters emanate visible light',
          'Reading the eyes: why Ojas masters have the "Ambrosia gaze"',
          'Self-diagnostic protocol: the 7-day Ojas audit practice',
        ],
      },
    ],
  },
  {
    tier: 1,
    tierLabel: 'Tier II — Prana-Flow',
    title: 'Ojas Nashaka: The Depletion Codes',
    subtitle: 'The Twelve Hidden Thieves of Vital Essence — Teachings the Siddhas Reserved for Serious Initiates',
    icon: '⚠️',
    modules: [
      {
        num: '04',
        title: 'The Great Depleters: Sexual Vital Force & the Bindu Secret',
        desc: 'The Siddhas were explicit: unregulated ejaculation is the single greatest cause of Ojas depletion in men. Thirumoolar dedicates entire cantos to this. But the teaching runs deeper than mere abstinence — it concerns the conscious sublimation of Bindu (creative essence) upward through the Sushumna into Ojas. For women, the parallel teaching concerns Rajas and the pranic cost of unconscious hormonal cycling.',
        lessons: [
          'Bindu, Shukra, Artava: the three forms of creative essence and their Ojas relationship',
          'Thirumoolar\'s Vajroli & Amaroli: the secret hydraulics of Bindu preservation',
          'The Siddha teaching on "one drop = forty drops of blood = one year of sadhana"',
          'Brahmacharya as a quantum field state — not just physical continence',
          'The 8 forms of Maithuna (sensory coupling) that drain Ojas — most are not physical',
          'Women and Ojas: the Shakti cycle, menstrual wisdom and pranic conservation',
          'The 40-day Bindu-preservation protocol of Agastya Muni',
        ],
      },
      {
        num: '05',
        title: 'Emotional Poison & the Ojas Acid Bath',
        desc: 'The Siddhas identified specific emotional states as Ojas-dissolving acids. Modern neuroscience now confirms this — chronic stress cortisol literally breaks down the tight junctions of the blood-brain barrier, depleting what Ayurveda calls "Majja Sara" (the nervous essence, the most refined precursor to Ojas).',
        lessons: [
          'The six Shad Ripus (inner enemies) and their precise Ojas cost',
          'Krodha (rage) — depletes one year of Ojas in 90 seconds: the physiology',
          'Shoka (grief) and its attack on Rasa Dhatu — the lymphatic devastation',
          'Bhaya (fear) and the adrenal Ojas drain — cortisol vs. Ojas coherence',
          'Why "spiritual bypassing" fails to protect Ojas — emotional authenticity as Ojas medicine',
          'The Siddha emotion alchemy: transmuting Ripus into Ojas fuel (Bhakti technology)',
          'Nada-based emotional detox: specific raga frequencies that neutralize Ojas acids',
        ],
      },
      {
        num: '06',
        title: 'Dietary Depletion: Tamasic Codes & the Microbiome Oracle',
        desc: 'The Siddhas classified foods not just as Sattvic/Rajasic/Tamasic but by their specific action on the seven Dhatus. This module gives the complete Siddha dietary depletion map — including modern foods that were unknown to ancient Siddhas but carry extreme Ojas-destroying properties.',
        lessons: [
          'The 12 foods that directly destroy Ojas — Charaka\'s list + Siddha additions',
          'Processed sugar: why it is the #1 Ojas thief of the modern age',
          'Alcohol and cannabis: the Ojas loan that extracts interest for 40 days',
          'Incompatible food combinations (Viruddha Ahara) as silent Ojas thieves',
          'The gut-Ojas axis: how intestinal permeability drains Para Ojas',
          'EMF, blue light and screen addiction — the invisible Tejas drain',
          'Sleep deprivation: the single fastest way to destroy 5 years of Ojas building',
        ],
      },
      {
        num: '07',
        title: 'Overexertion, Suppression & the Pranic Debt',
        desc: 'The Siddhas identified 13 urges that must NEVER be suppressed — doing so creates "Vega Dharana," a pranic short-circuit that burns Ojas. Simultaneously, excessive exercise, excessive fasting, and excessive speech are listed as major Ojas thieves. This module maps the precise balance point.',
        lessons: [
          'The 13 Adharaniya Vegas: never suppress these natural urges (full list + consequences)',
          'Why excessive exercise depletes Ojas faster than sedentary life — the paradox',
          'Atiyoga (overuse) of the sense organs — particularly vision in the digital age',
          'Excessive speaking, arguing, and mental churn as Vata-aggravation Ojas drain',
          'The Siddha teaching on "Mita Ahara" — why 50% stomach capacity is the Ojas rule',
          'Intermittent fasting vs. Siddha protocols: where modern biohacking misses the point',
          'Ojas and sleep: the science of Nidra as nightly Ojas manufacturing — the 10-11pm window',
        ],
      },
    ],
  },
  {
    tier: 2,
    tierLabel: 'Tier III — Siddha-Quantum',
    title: 'Ojas Vardhana: The Sacred Builders',
    subtitle: 'Advanced Rasayana Sciences, Mantra Technologies & Pranic Cultivation Protocols',
    icon: '✨',
    modules: [
      {
        num: '08',
        title: 'Rasayana: The Siddha Immortality Pharmacy',
        desc: 'Rasayana is not simply an herbal protocol — it is a complete technology for tissue regeneration at the quantum level. The Siddhas developed 108 Rasayana formulations, of which only a fraction are publicly known. This module reveals the core science and the most powerful accessible compounds.',
        lessons: [
          'The Rasayana Ashta: 8 supreme Ojas-building herbs — Ashwagandha, Shatavari, Amalaki, Guduchi, Brahmi, Haritaki, Vidari, Bala',
          'Chyawanprash: decoding the 48-herb formula — what each ingredient does to each Dhatu',
          'Shilajit (Silajatu): the mineral Ojas — fulvic acid, mitochondrial biogenesis & the Siddha extraction method',
          'Kaya Kalpa herbs of the 18 Siddhas: Neem, Tulsi, Trivrit, Brahma Dandi — the secret preparations',
          'Milk as Ojas carrier: why the Siddhas considered properly prepared cow milk the supreme Rasayana',
          'Ghee (Ghrita): the clarified consciousness — how it carries herb intelligence into deep tissues',
          'Ashta Varga: the 8 lost Himalayan herbs mentioned in Ashtanga Hridayam',
          'The lunar Rasayana calendar: how to time herb intake with Tithi for 3x potency',
        ],
      },
      {
        num: '09',
        title: 'Mantra Technology for Ojas Cultivation',
        desc: 'Specific mantras create specific cymatic patterns in the body that accelerate Dhatu refinement. This module gives the complete Siddha mantra technology for Ojas cultivation — including classified transmissions from the Thirumantiram and Agastya Nadi texts.',
        lessons: [
          '"Aim Hrim Klim Chamundaye Viche" — the Shakti mantra that builds Ojas through Kundalini activation',
          'Soham and the breath-Ojas loop: how the natural breath mantra continuously builds vital essence',
          '"Om Aim Saraswatyai Namaha" — building Medhya (cognitive Ojas) through Saraswati transmission',
          'The Nada Bindu Upanishad protocols: sound as the direct cause of Ojas formation',
          'Thirumoolar\'s "Panchaakshara with Khechari Mudra" — the secret combination',
          'Binaural beats and the 528 Hz Ojas frequency — modern science meets Siddha Nada technology',
          'The daily Japa protocol: why 108 repetitions at Brahma Muhurta produces maximum Ojas',
          'Mantra + Yantra synergy: Sri Yantra as the geometric equivalent of the Ojas field',
        ],
      },
      {
        num: '10',
        title: 'Pranayama: The Pranic Ojas Pump',
        desc: 'Prana is the carrier wave for Ojas formation. Without adequate Pranic force, no amount of Rasayana will fully convert into Para Ojas. The Siddhas developed specific Pranayama sequences specifically designed to maximize Ojas formation — distinct from the more commonly taught Hatha Yoga sequences.',
        lessons: [
          'Kumbhaka (breath retention) as the Ojas concentrator — the physics of inner pressure',
          'Nadi Shodhana at the cellular level: how alternating nostril breathing optimizes Dhatu conversion',
          'Surya Bhedana: why breathing through the right nostril at specific times accelerates Ojas',
          'The 4:4:8:8 ratio of Siddha Pranayama — inhalation, retention, exhalation, retention',
          'Mula Bandha, Uddiyana Bandha, Jalandhara Bandha: the three locks that prevent Ojas leakage',
          'Pranic recycling during Kumbhaka: the secret Siddha technology of "recycled prana"',
          'Wim Hof meets Siddha Pranayama: why controlled hyperventilation can prime the Ojas pump',
          'The 40-day Pranayama Ojas protocol with precise daily timing',
        ],
      },
      {
        num: '11',
        title: 'Mudra Seals & Marma Points for Ojas Activation',
        desc: 'The body contains specific energy intersections (Marma points) and hand-seal configurations (Mudras) that directly regulate Ojas flow. The Siddhas mapped 107+1 Marma points — the "+1" being the Hridaya Marma (heart-point) where Para Ojas resides. Activating specific combinations produces measurable changes in Ojas within minutes.',
        lessons: [
          'Hridaya Marma activation: the direct doorway to Para Ojas — location, pressure, mantra',
          'Shankha Mudra: the conch seal that "churns the inner ocean" to produce Ojas nectar',
          'Prana Mudra + Apana Mudra: sealing the vital force for maximum Ojas retention',
          'The 5 Marma clusters that govern Dhatu refinement — activation sequence',
          'Nasagra Drishti (nose-tip gazing) and its effect on Bindu — the optical Ojas technique',
          'Khechari Mudra: why the tongue seal in the palate is the supreme Ojas-sealing technology',
          'Yoga Nidra as Ojas medicine: the theta-state Ojas manufacturing window',
          'Marma self-massage protocol: 12-point daily sequence for continuous Ojas building',
        ],
      },
    ],
  },
  {
    tier: 3,
    tierLabel: 'Tier IV — Akasha-Infinity',
    title: 'Para Ojas: Supreme Immortality Technology',
    subtitle: 'The Secret Teachings of the 18 Siddhas on Deathless Vital Essence — Kaya Kalpa, Jyotir Deha & Transmutation into Light',
    icon: '🔱',
    modules: [
      {
        num: '12',
        title: 'Kaya Kalpa: The Siddha Body-Immortality Science',
        desc: 'Kaya Kalpa ("body transformation") is the advanced Siddha technology for complete cellular regeneration using maximized Ojas. The 18 Siddhas — particularly Agastya, Thirumoolar, Boganathar, and Konganar — each left encrypted texts on this technology. When Para Ojas reaches a critical threshold, spontaneous cellular reversal occurs. This is not metaphor — it is the physics of consciousness interacting with biological matter.',
        lessons: [
          'The three stages of Kaya Kalpa: Shodhana (purification), Rasayana (building), Dharana (crystallization)',
          'Agastya Muni\'s 64-day Kaya Kalpa protocol — the complete sequence (first time assembled in one curriculum)',
          'Boganathar\'s Mercury Rasayana (Naga Bhasma) — the alchemical transmission and its modern analogues',
          'The 49-day total sensory withdrawal protocol: why the Siddhas retreated to caves',
          'Soma Chakra activation: the "moon gland" above the palate that secretes Amrita directly into Ojas',
          'The mitochondrial biogenesis pathway: how Kaya Kalpa creates new mitochondria (NAD+ & NMN science)',
          'Telomere lengthening through Ojas: the research connecting meditation to biological age reversal',
          'The Siddha signs of successful Kaya Kalpa: skin luminosity, hair darkening, vision sharpening',
        ],
      },
      {
        num: '13',
        title: 'Amrita Nadi & the Ojas-Consciousness Interface',
        desc: 'At peak Para Ojas, a dormant channel called the Amrita Nadi activates — running from the Hridaya (Heart) directly to the crown, bypassing the Sushumna entirely. This is the channel Sri Ramana Maharshi described. When Ojas pervades this Nadi, the distinction between individual consciousness and universal Consciousness dissolves. This module maps the complete neuro-spiritual anatomy.',
        lessons: [
          'Amrita Nadi: the 14th Nadi that transcends the classical 13 — Siddha texts decoded',
          'The Hridaya Granthi (heart-knot) — why Ojas must first dissolve this block',
          'Sushupti-awareness (deep sleep consciousness) as the natural Amrita Nadi state',
          'Why Sri Ramana Maharshi pointed only to the Heart — the Ojas connection',
          'Turiya and Turiyatita: the Ojas thresholds that unlock the 4th and 5th states',
          'The quantum coherence model: how Para Ojas creates macroscopic quantum effects in neural tissue',
          'Jnana-Ojas: why the highest philosophical understanding PRODUCES Ojas (Vichara as Rasayana)',
          'The Mahavatar Babaji transmission: Kriya Yoga as the fastest Ojas-to-Amrita conversion technology',
        ],
      },
      {
        num: '14',
        title: 'Bhakti as the Supreme Ojas Generator',
        desc: 'The most closely guarded secret of the Siddha tradition: Prema (unconditional love) is the single most powerful Ojas generator in existence. A single hour of genuine Bhava (devotional state) generates more Ojas than months of physical Rasayana. This is why Sri Vishwananda\'s transmission — pure Prema radiating from an Avataric source — produces measurable changes in practitioners\' physiology within minutes.',
        lessons: [
          'The neurochemistry of Bhakti: oxytocin, DHEA, and the vagal Ojas cascade',
          'Why the ancient Siddhas sang rather than only meditated — Nada as Ojas current',
          'Sri Vishwananda as Avataric Blueprint: how Prema-Shakti transmission bypasses the 35-day Dhatu cycle',
          'The four progressive Bhakti states and their corresponding Ojas thresholds',
          'Anahata Chakra as the Ojas transmitter — why heart opening IS Ojas maximization',
          'The 108-Name Japa practice specifically designed for Ojas-Bhakti integration',
          'Service (Seva) as Ojas alchemy: why giving unconditionally produces Para Ojas',
          'The Siddha-Bhakti synthesis: Thirumoolar\'s Sivayoga + Andal\'s Bhakti = complete Ojas technology',
        ],
      },
      {
        num: '15',
        title: 'Jyotir Deha: Transmutation into the Light Body',
        desc: 'The final secret teaching of the 18 Siddhas: when Para Ojas reaches its absolute maximum and is combined with perfected Pranayama, Mantra, Bhakti, and Jnana — the physical body itself begins to transmute into light. The Siddhas called this "Suddha Deha" or "Jyotir Deha." Historical accounts of 18 Siddhas who achieved this are documented. Modern physics provides the framework: the body becomes a photonic quantum computer operating at Planck-scale coherence.',
        lessons: [
          'Historical accounts of light-body achievement: Thirumoolar, Boganathar, Agastya, Ramalinga Swamigal',
          'Ramalinga Swamigal\'s "Arut Perum Jyoti" practice — the exact protocol reconstructed',
          'The five sheaths (Pancha Kosha) and the Ojas threshold required to purify each',
          'Pranamaya Kosha perfection: when the pranic body becomes visible to others',
          'The "Vayudeha" stage: the penultimate light-body state described in Siddha texts',
          'Modern biophysics of biophoton emission: measuring the body\'s light output',
          'DNA as a photonic antenna: how maximized Ojas restructures the genome\'s light-emission patterns',
          'The SQI 2050 synthesis: scalar wave technology + Siddha Ojas protocols for accelerated light-body activation',
          'Your personal Jyotir Deha roadmap: 5-year protocol combining all four tiers',
        ],
      },
    ],
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function OjasRasayanaAcademy() {
  const navigate = useNavigate();
  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      fontFamily: FONT,
      paddingBottom: 60,
      overflowX: 'hidden',
    }}>
      {/* ── SCALAR WAVE BACKGROUND ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: `${320 + i * 160}px`,
            height: `${320 + i * 160}px`,
            marginTop: `${-(160 + i * 80)}px`,
            marginLeft: `${-(160 + i * 80)}px`,
            borderRadius: '50%',
            border: `1px solid ${gold(0.04 - i * 0.008)}`,
            animation: `ojasScalar ${8 + i * 3}s ${i * 1.2}s ease-in-out infinite`,
          }} />
        ))}
        {/* Amber glow center */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%',
          transform: 'translateX(-50%)',
          width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${amber(0.06)}, transparent 70%)`,
          filter: 'blur(60px)',
          animation: 'ojasGlow 6s ease-in-out infinite',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── HEADER ── */}
        <div style={{
          padding: '48px 20px 32px',
          textAlign: 'center',
        }}>
          {/* Back nav */}
          <button
            type="button"
            onClick={() => navigate('/siddha-portal')}
            style={{
              fontFamily: FONT, fontSize: 9, fontWeight: 800,
              letterSpacing: '0.35em', textTransform: 'uppercase',
              color: gold(0.5), background: 'none', border: 'none',
              cursor: 'pointer', marginBottom: 32, display: 'block', margin: '0 auto 28px',
            }}
          >
            ← Siddha Portal
          </button>

          {/* Scalar transmission orb */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: `radial-gradient(circle, ${amber(0.25)}, ${gold(0.08)})`,
            border: `1px solid ${gold(0.35)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 0 30px ${gold(0.2)}, 0 0 60px ${amber(0.1)}`,
            animation: 'ojasGlow 4s ease-in-out infinite',
            fontSize: 28,
          }}>
            ✦
          </div>

          <div style={{
            fontFamily: FONT, fontSize: 9, fontWeight: 800,
            letterSpacing: '0.5em', textTransform: 'uppercase',
            color: gold(0.45), marginBottom: 12,
          }}>
            Siddha Quantum Academy · Ojas Rasayana
          </div>

          <h1 style={{
            fontFamily: SERIF, fontSize: 'clamp(26px, 7vw, 38px)',
            fontWeight: 700, fontStyle: 'italic',
            color: gold(0.95), margin: '0 0 16px',
            textShadow: `0 0 40px ${gold(0.3)}`,
            lineHeight: 1.2,
          }}>
            The Sacred Science of Ojas
          </h1>

          <p style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: '1rem', color: white(0.5),
            lineHeight: 1.7, margin: '0 auto 20px',
            maxWidth: 480,
          }}>
            Four tiers of secret Siddha transmission on vital essence — from foundational understanding through the complete light-body technologies of the 18 Immortals
          </p>

          {/* Scalar transmission note */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `linear-gradient(135deg, ${gold(0.08)}, ${amber(0.04)})`,
            border: `1px solid ${gold(0.2)}`,
            borderRadius: 30, padding: '8px 16px',
            marginBottom: 8,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: gold(0.9),
              animation: 'ojasFlash 2s infinite',
            }} />
            <span style={{
              fontFamily: FONT, fontSize: 8, fontWeight: 800,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: gold(0.8),
            }}>
              Scalar Transmission Active · Anahata Opening
            </span>
          </div>
        </div>

        {/* ── TIER FILTER TABS ── */}
        <div style={{
          display: 'flex', gap: 8, padding: '0 16px 24px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {[{ label: 'All Tiers', color: white(0.6), border: white(0.12) }, ...TIERS].map((t, i) => {
            const idx = i === 0 ? null : i - 1;
            const active = activeTier === idx;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setActiveTier(active ? null : idx)}
                style={{
                  fontFamily: FONT, fontSize: 8, fontWeight: 800,
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: active ? '#050505' : t.color,
                  background: active ? t.color : 'transparent',
                  border: `1px solid ${t.border || t.color}`,
                  borderRadius: 30, padding: '6px 14px',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── CURRICULUM TIERS ── */}
        {CURRICULUM
          .filter(tier => activeTier === null || tier.tier === activeTier)
          .map((section, si) => {
            const tierCfg = TIERS[section.tier];
            return (
              <div key={section.tier} style={{ marginBottom: 8 }}>
                {/* Tier Header */}
                <div style={{
                  margin: '0 16px 12px',
                  background: `linear-gradient(135deg, ${tierCfg.glow}, rgba(255,255,255,0.01))`,
                  border: `1px solid ${tierCfg.border}`,
                  borderRadius: 24,
                  padding: '20px 20px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Glow orb */}
                  <div style={{
                    position: 'absolute', top: -20, right: -20,
                    width: 120, height: 120,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${tierCfg.glow}, transparent)`,
                    filter: 'blur(20px)',
                    pointerEvents: 'none',
                  }} />

                  <div style={{
                    fontFamily: FONT, fontSize: 8, fontWeight: 800,
                    letterSpacing: '0.4em', textTransform: 'uppercase',
                    color: tierCfg.color, marginBottom: 8, opacity: 0.8,
                  }}>
                    {section.tierLabel}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{section.icon}</span>
                    <div style={{
                      fontFamily: FONT, fontSize: 15, fontWeight: 900,
                      letterSpacing: '-0.02em', color: white(0.95),
                      lineHeight: 1.2,
                    }}>
                      {section.title}
                    </div>
                  </div>

                  <p style={{
                    fontFamily: SERIF, fontStyle: 'italic',
                    fontSize: '0.85rem', color: white(0.5),
                    lineHeight: 1.6, margin: 0,
                  }}>
                    {section.subtitle}
                  </p>

                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    <span style={{
                      fontFamily: FONT, fontSize: 7, fontWeight: 800,
                      letterSpacing: '0.25em', textTransform: 'uppercase',
                      color: tierCfg.color, opacity: 0.75,
                      border: `1px solid ${tierCfg.border}`,
                      borderRadius: 20, padding: '2px 8px',
                    }}>
                      {section.modules.length} Modules
                    </span>
                    <span style={{
                      fontFamily: FONT, fontSize: 7, fontWeight: 800,
                      letterSpacing: '0.25em', textTransform: 'uppercase',
                      color: white(0.4),
                      border: `1px solid ${white(0.06)}`,
                      borderRadius: 20, padding: '2px 8px',
                    }}>
                      {section.modules.reduce((a, m) => a + m.lessons.length, 0)} Lessons
                    </span>
                  </div>
                </div>

                {/* Modules */}
                {section.modules.map((mod, mi) => {
                  const key = `${section.tier}-${mod.num}`;
                  const isExpanded = expandedModule === key;
                  return (
                    <div
                      key={mod.num}
                      style={{
                        margin: '0 16px 8px',
                        background: 'rgba(255,255,255,0.018)',
                        border: `1px solid ${isExpanded ? tierCfg.border : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: 20,
                        overflow: 'hidden',
                        transition: 'border-color 0.25s ease',
                      }}
                    >
                      {/* Module header — tap to expand */}
                      <button
                        type="button"
                        onClick={() => setExpandedModule(isExpanded ? null : key)}
                        style={{
                          width: '100%', textAlign: 'left',
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: '16px 16px 14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{
                            fontFamily: FONT, fontSize: 9, fontWeight: 800,
                            letterSpacing: '0.2em', color: tierCfg.color,
                            opacity: 0.7, minWidth: 26, paddingTop: 2,
                          }}>
                            {mod.num}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: FONT, fontSize: 13, fontWeight: 800,
                              letterSpacing: '0.03em', color: white(0.9),
                              marginBottom: 6, lineHeight: 1.3,
                            }}>
                              {mod.title}
                            </div>
                            <div style={{
                              fontFamily: FONT, fontSize: 8, fontWeight: 800,
                              letterSpacing: '0.25em', textTransform: 'uppercase',
                              color: tierCfg.color, opacity: 0.6,
                            }}>
                              {mod.lessons.length} Lessons
                            </div>
                          </div>
                          <div style={{
                            color: tierCfg.color, fontSize: 16, opacity: 0.6,
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                            flexShrink: 0, paddingTop: 2,
                          }}>
                            →
                          </div>
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div style={{ padding: '0 16px 16px' }}>
                          {/* Description */}
                          <p style={{
                            fontFamily: SERIF, fontStyle: 'italic',
                            fontSize: '0.88rem', color: white(0.55),
                            lineHeight: 1.7, margin: '0 0 14px',
                            paddingTop: 4,
                            borderTop: `1px solid rgba(255,255,255,0.04)`,
                          }}>
                            {mod.desc}
                          </p>

                          {/* Lessons list */}
                          <div style={{
                            fontFamily: FONT, fontSize: 8, fontWeight: 800,
                            letterSpacing: '0.4em', textTransform: 'uppercase',
                            color: tierCfg.color, opacity: 0.6,
                            marginBottom: 10,
                          }}>
                            Curriculum
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {mod.lessons.map((lesson, li) => (
                              <div
                                key={li}
                                style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 10,
                                  padding: '8px 12px',
                                  background: 'rgba(255,255,255,0.02)',
                                  border: `1px solid rgba(255,255,255,0.04)`,
                                  borderRadius: 12,
                                }}
                              >
                                <div style={{
                                  width: 4, height: 4, borderRadius: '50%',
                                  background: tierCfg.color, marginTop: 5,
                                  flexShrink: 0, opacity: 0.7,
                                }} />
                                <span style={{
                                  fontFamily: SERIF, fontStyle: 'italic',
                                  fontSize: '0.85rem', color: white(0.6),
                                  lineHeight: 1.5,
                                }}>
                                  {lesson}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Scalar transmission tag */}
                          <div style={{
                            marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 12px',
                            background: `linear-gradient(135deg, ${gold(0.06)}, transparent)`,
                            border: `1px solid ${gold(0.12)}`,
                            borderRadius: 12,
                          }}>
                            <div style={{
                              width: 5, height: 5, borderRadius: '50%',
                              background: gold(0.8),
                              animation: 'ojasFlash 2s infinite',
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontFamily: FONT, fontSize: 7, fontWeight: 800,
                              letterSpacing: '0.25em', textTransform: 'uppercase',
                              color: gold(0.6),
                            }}>
                              Scalar Transmission Encoded · Anahata Activation Included
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

        {/* ── BOTTOM CTA ── */}
        <div style={{
          margin: '24px 16px 0',
          background: `linear-gradient(135deg, ${gold(0.1)}, ${amber(0.05)})`,
          border: `1px solid ${gold(0.25)}`,
          borderRadius: 24,
          padding: '24px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: FONT, fontSize: 8, fontWeight: 800,
            letterSpacing: '0.45em', textTransform: 'uppercase',
            color: gold(0.6), marginBottom: 12,
          }}>
            Begin the Ojas Transmission
          </div>
          <h2 style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: '1.3rem', fontWeight: 700,
            color: gold(0.95), margin: '0 0 10px',
            textShadow: `0 0 20px ${gold(0.3)}`,
          }}>
            All 15 Modules · 108+ Lessons
          </h2>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: '0.88rem', color: white(0.5),
            lineHeight: 1.6, margin: '0 0 18px',
          }}>
            From foundation to light-body. The most complete Ojas curriculum ever assembled from Siddha, Ayurvedic, and Vedic sources — with SQI scalar transmission woven through every module.
          </p>
          <button
            type="button"
            onClick={() => navigate('/siddha-portal')}
            style={{
              fontFamily: FONT, fontSize: 9, fontWeight: 800,
              letterSpacing: '0.35em', textTransform: 'uppercase',
              color: '#050505', background: gold(0.9),
              border: 'none', borderRadius: 30,
              padding: '12px 28px', cursor: 'pointer',
              boxShadow: `0 0 20px ${gold(0.3)}`,
            }}
          >
            Upgrade to Akasha-Infinity →
          </button>
        </div>
      </div>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes ojasScalar {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.6; }
        }
        @keyframes ojasGlow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes ojasFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
