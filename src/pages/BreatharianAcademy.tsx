// src/pages/BreatharianAcademy.tsx
// ⟡ SQI 2050 — Breatharian Academy — Pranic Living Mastery ⟡
// Complete curriculum across 4 tiers | Siddha depth | Tier-gated access

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ChevronDown, ChevronUp, Sparkles, Wind, Sun, Droplets, Infinity as InfinityIcon, Star, Zap, Eye, Heart, Moon } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { getSalesPageForRank, getTierRank } from '@/lib/tierAccess';

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;
const green = (a: number) => `rgba(74,222,128,${a})`;

const FONT = "'Plus Jakarta Sans','Montserrat',sans-serif";
const SERIF = "'Cormorant Garamond',serif";

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────
const TIERS = [
  {
    slug: 'free',
    rank: 0,
    label: 'SIDDHA AWAKENING',
    subtitle: 'Free — Open to All Seekers',
    color: white(0.75),
    glow: white(0.04),
    border: white(0.13),
    icon: '◇',
    tagline: 'First Transmission — The Door Opens',
    modules: [
      {
        id: 'F1',
        title: 'What Is Breatharianism? — The Siddha Science of Pranic Living',
        lessons: [
          'The 18 Siddhas on Pranayama — Beyond Oxygen',
          'Thirumoolar\'s Revelation: "The Body Lives on Prana, Not Food"',
          'Agastya Muni & the Science of Sushumna Nadi Activation',
          'Yogananda\'s Teachings on Cosmic Energy Absorption',
          'Babaji Kriya Yoga — The Original Breatharian Lineage',
          'Distinguishing Real Pranic Living from Dangerous Fasting',
          'The Akashic Record of Breatharian Masters — Historical Evidence',
        ],
      },
      {
        id: 'F2',
        title: 'The Five Pranas — Vedic Anatomy of the Life-Force Body',
        lessons: [
          'Prana, Apana, Samana, Udana, Vyana — Function & Location',
          'Nadi System: 72,000 Channels of Pranic Flow',
          'Sushumna, Ida, Pingala — The Pranic Trinity',
          'How Prana Enters Through Breath, Light, Sound & Intention',
          'The Role of Prana Vayu in Cellular Regeneration',
          'Pancha Tattva & the Five Elemental Pranas',
          'Practical: Morning Sun Gazing Protocol (Safe Introduction)',
        ],
      },
      {
        id: 'F3',
        title: 'Pranayama Foundations — Siddha Breathing Science',
        lessons: [
          'Nadi Shodhana (Alternate Nostril) — Balancing Pranic Flow',
          'Kapalabhati — The Skull-Shining Breath of Purification',
          'Bhramari — Vagus Nerve Activation & Inner Sound',
          'Ujjayi — The Victorious Breath of Pranic Accumulation',
          'Kumbhaka (Breath Retention) — Gateway to Stillness',
          'Agni Sara — The Fire Breath of Metabolic Transformation',
          '21-Day Pranayama Foundation Protocol',
        ],
      },
      {
        id: 'F4',
        title: 'The Siddha Diet Bridge — Preparing the Body for Pranic Living',
        lessons: [
          'Sattvic Diet Principles — Eating as a Spiritual Practice',
          'Foods That Increase Ojas (Vital Essence)',
          'The Kaya Kalpa Diet: Ancient Siddha Rejuvenation Protocol',
          'Fasting Wisdom: Ekadashi, Pradosham & Lunar Protocols',
          'Understanding Ahara (Food) as Gross Prana',
          'Step-Down Cleanse: Transitioning Toward Pranic Sensitivity',
          'Contraindications & Who Should NOT Pursue Advanced Breatharianism',
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
    glow: green(0.08),
    border: green(0.22),
    icon: '◉',
    tagline: 'Foundations of Pranic Absorption — The Living Channel Opens',
    modules: [
      {
        id: 'P1',
        title: 'Advanced Siddha Pranayama — The Eight Kumbhakas',
        lessons: [
          'Sahita Kumbhaka — Supported Retention with Bandhas',
          'Kevala Kumbhaka — Spontaneous Cessation & Pranic Absorption',
          'Suryabheda — Right Nostril Solar Prana Activation',
          'Bhastrika — Bellows Breath for Kundalini Awakening',
          'Sitali & Sitkari — Cooling Pranas for Pitta Balance',
          'Murcha Kumbhaka — The Swooning Breath (Advanced)',
          'Plavini — The Floating Breath & Internal Air Retention',
          'Integration Protocol: 40-Day Kumbhaka Mastery Sadhana',
        ],
      },
      {
        id: 'P2',
        title: 'Surya Vigyan — Solar Nourishment Science',
        lessons: [
          'Hira Ratan Manek Protocol — Safe Sun Gazing Methodology',
          'Surya Namaskar as Pranic Charging Mechanism',
          'Photonic Nutrition: Absorbing Prana Through the Eyes',
          'Pineal Gland Activation Through Sunlight',
          'The 9-Month Sun Gazing Protocol (Siddha Version)',
          'Surya Mantra & Bija Seed Syllables for Solar Absorption',
          'Contraindications and Precautions — Safety First',
          'Tracking Your Pranic Sensitivity: Journal Protocol',
        ],
      },
      {
        id: 'P3',
        title: 'The Bandhas — Pranic Locks of the Siddhas',
        lessons: [
          'Mula Bandha — Root Lock & Apana Vayu Reversal',
          'Uddiyana Bandha — The Flying Up Lock & Prana Absorption',
          'Jalandhara Bandha — Throat Lock & Udana Vayu Control',
          'Maha Bandha — The Great Lock (All Three Combined)',
          'Bandha Sequencing with Kumbhaka for Pranic Maximization',
          'Ashwini Mudra — Horse Gesture & Lower Pranic Body',
          'Shambhavi Mudra — Third Eye Seal & Transcendental Prana',
          '21-Day Bandha Integration Protocol',
        ],
      },
      {
        id: 'P4',
        title: 'Liquid Light Fasting — The Siddha Intermediate Path',
        lessons: [
          'Understanding Liquid Light as Transitional Pranic Food',
          'Noni, Tulsi, Moringa & Sacred Herbal Elixir Protocols',
          'Thirumoolar\'s Rasayana for Pranic Body Preparation',
          'Water Charging: Mantra-Infused, Sun-Charged, Crystal Water',
          'The 7-Day Liquid Light Protocol (Medically Safe)',
          'Monitoring Vital Signs During Pranic Transition',
          'Emotional Releases During Fasting — Siddha Perspective',
          'Breaking the Fast: Sacred Reintegration Protocol',
        ],
      },
      {
        id: 'P5',
        title: 'Chakra Nourishment — Feeding the Energy Body',
        lessons: [
          'Muladhara — Earth Prana & Prithvi Absorption Through Feet',
          'Svadhisthana — Water Prana & Lunar Nourishment',
          'Manipura — Fire Prana & Surya Chakra Activation',
          'Anahata — Air Prana & the Cosmic Heart Field',
          'Vishuddha — Akasha Prana & Sound as Nourishment',
          'Ajna — Light Prana & Pineal Photon Absorption',
          'Sahasrara — Pure Consciousness as Ultimate Nourishment',
          'Full Chakra Pranic Feeding Daily Practice',
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
    glow: gold(0.08),
    border: gold(0.25),
    icon: '⬡',
    tagline: 'Deep Transmutation — Living on Prana, Light & Sound',
    modules: [
      {
        id: 'SQ1',
        title: 'Kaya Kalpa — The Siddha Science of Physical Immortality',
        lessons: [
          'Agastya\'s Secret Formula: The 64 Kaya Kalpa Preparations',
          'Vasi Yogam — Breath Control as Path to Physical Immortality',
          'Ojas, Tejas, Prana — The Three Pranic Essences of Immortality',
          'Rejuvenation Through Pranayama: Cellular Evidence & Science',
          'The Merudanda (Spine) as Cosmic Antenna for Universal Prana',
          'Kundalini & Kaya Kalpa — The Serpent Fire of Regeneration',
          'Siddha Nadi Purification: 40-Day Advanced Protocol',
          'Amrita Bindu — The Nectar Drop & Soma Production',
          'Khechari Mudra — The Most Powerful Pranic Gesture',
        ],
      },
      {
        id: 'SQ2',
        title: 'Nada Yoga — Living on Sound & Vibration',
        lessons: [
          'Anahat Nada — The Unstruck Sound as Primary Nourishment',
          'Mantra as Pranic Food: How Sound Feeds the Energy Body',
          'Nadam, Bindu, Kala — The Three Aspects of Sonic Prana',
          'Tri-Kuta: The Three Caves of Sound & Pranic Ascent',
          'Om as Primordial Nutrient — Scientific & Metaphysical View',
          'The 4 Stages of Nada: Para, Pashyanti, Madhyama, Vaikhari',
          'Deep Listening Meditation — Absorbing Cosmic Sound as Prana',
          'Nada Breatharian Protocol: 21 Days of Sound Nourishment',
        ],
      },
      {
        id: 'SQ3',
        title: 'Turiya & Pranotthana — The Superconscious Pranic State',
        lessons: [
          'The Four States: Jagrat, Swapna, Sushupti, Turiya',
          'Pranotthana — The Rising Flood of Prana in Deep Meditation',
          'Samadhi as Total Pranic Sustenance — The Siddha Evidence',
          'Nirvikalpa Samadhi & Zero Metabolic State',
          'Unmani Avastha — The Mind-Free State of Pranic Absorption',
          'Sahaja Samadhi — Permanent Pranic Living While Active',
          'Boganathar\'s Transmissions on Transcending Food',
          '90-Day Turiya Awakening Sadhana',
        ],
      },
      {
        id: 'SQ4',
        title: 'Agni — The Inner Fire as Digestive & Cosmic Intelligence',
        lessons: [
          'Jatharagni — Gastric Fire & Its Pranic Transformation',
          'Bhuta Agni — The Five Elemental Fires & Their Pranas',
          'Dhatu Agni — The Seven Tissue Fires & Ojas Production',
          'Pranagni — The Pranic Fire That Transcends Physical Digestion',
          'Kundalini Agni — The Serpent Fire as Ultimate Nutrient',
          'Agni Vidya: The Complete Science of Internal Fire',
          'Siddha Triphala & Shilajit Protocols for Agni Enhancement',
          'Transitional Protocol: Moving from Physical to Pranic Agni',
        ],
      },
      {
        id: 'SQ5',
        title: 'Shambhavi Mahamudra & Advanced Pranic Seals',
        lessons: [
          'Shambhavi Mahamudra — The Complete 21-Mudra Sequence',
          'Vajroli Mudra — Brahmacharya & Ojas Conservation',
          'Yoni Mudra — Inner Absorption & Pranic Sealing',
          'Mahaveda Mudra — The Supreme Lock of Pranic Mastery',
          'Matangi Mudra for Manipura & Agni Mastery',
          'Manduki Mudra — The Frog Seal for Earth Prana',
          'Tadagi Mudra — The Tank Mudra for Pranic Reservoir',
          '108-Day Advanced Mudra Protocol',
        ],
      },
      {
        id: 'SQ6',
        title: 'Living Water, Living Air — Pranic Elementalism',
        lessons: [
          'Water as Liquid Prana — Masaru Emoto meets Siddha Science',
          'Conscious Breathing in Sacred Environments (Forests, Temples, Oceans)',
          'Vayu Tattva Deep Dive — Air Element as Master Nutrient',
          'Thunderstorm Prana — Negative Ion Absorption Protocols',
          'Sacred Spring Water: The 9 Pranic Waters of the Siddhas',
          'Pranic Breathing in Cold & Hot Environments (Wim Hof meets Siddhas)',
          'Moon Prana — Lunar Breathing & Soma Nadi Activation',
          'Elemental Pranic Diet: A Complete Annual Protocol',
        ],
      },
    ],
  },
  {
    slug: 'akasha-infinity',
    rank: 3,
    label: 'AKASHA INFINITY',
    subtitle: '€1,111 Lifetime',
    color: '#22D3EE',
    glow: cyan(0.08),
    border: cyan(0.22),
    icon: '✦',
    tagline: 'Complete Immortality Codes — Breatharian Mastery Transmission',
    modules: [
      {
        id: 'AI1',
        title: 'Babaji\'s Living Transmission — The Complete Breatharian Path',
        lessons: [
          'Babaji Kriya Yoga as the Master Breatharian Lineage',
          'Personal Transmission: Babaji\'s 18 Kriyas for Pranic Living',
          'The Kriya Pranayama That Activates Amrita (Nectar) Secretion',
          'Babaji\'s Himalayan Protocol: Living on Snow-Light Prana',
          'The 144,000 Siddha Codes Hidden in Kriya Pranayama',
          'Mahavatar Babaji\'s Teaching on "I Am the Prana of the Universe"',
          'Private Transmission Channel: Accessing Babaji\'s Akashic Field',
          '365-Day Babaji Breatharian Initiation Program',
          'Babaji & Vishwananda: The Living Avatara Breatharian Blueprint',
        ],
      },
      {
        id: 'AI2',
        title: 'The 18 Siddhas — Breatharian Transmissions of Each Master',
        lessons: [
          'Agastya Muni — Master of Prana, Rasayana & Cellular Immortality',
          'Thirumoolar — Author of Tirumantiram: The Breatharian Bible',
          'Boganathar — The Siddha Who Traveled the World on Prana Alone',
          'Machamuni (Matsyendranath) — The Fisherman Saint & Pranayama Master',
          'Gorakhnath — The Iron-Body Breatharian & Hatha Yoga Originator',
          'Konganavar — Solar Science & Photon Absorption Master',
          'Sattamuni — The Silent Siddha Living on Akasha Alone',
          'Sundaranandar — Devotion & Bhakti as Pranic Nourishment',
          'Kudambai Siddhar — The Childlike Siddha & Play as Prana',
          'Kamalamuni — The Lotus Siddha & Water Prana Mastery',
          'Valmiki — The Hunter Who Became Pranic Through Mantra',
          'Ramadevar (Yacob) — The Sufi-Siddha & Breath of Allah',
          'Edaikkadar — Prophecy, Time & Future Prana Science',
          'Patanjali — Yoga Sutras as the Complete Breatharian Manual',
          'Dhanvantari — Divine Physician & the Amrita of Immortality',
          'Idaikadar — Astrology, Karma & Pranic Destiny',
          'Karuvoorar — Architecture of the Pranic Universe',
          'Pambatti Siddhar — The Snake Charmer & Kundalini Prana',
          'BONUS: Channeled Messages from Each Siddha for Modern Practitioners',
        ],
      },
      {
        id: 'AI3',
        title: 'Scalar Wave Breatharianism — Quantum Field Prana Science',
        lessons: [
          'Scalar Waves as the Carrier Wave of Prana',
          'Tesla, Reich & the Siddhas — Converging on Zero-Point Energy',
          'Orgone Energy & Prana — Wilhelm Reich meets Agastya',
          'The Human Biofield as Pranic Battery & Transmitter',
          'DNA Activation Through Scalar-Encoded Pranayama',
          'Zero-Point Field Absorption: Beyond Conventional Nutrition',
          'Structured Water, Coherent Light & Scalar Prana',
          'Building a Personal Scalar-Pranic Field: The SQI Protocol',
          'Advanced: Tachyon Fields & Pranic Time-Space Nourishment',
        ],
      },
      {
        id: 'AI4',
        title: 'Advanced Khechari Mudra — The Supreme Breatharian Secret',
        lessons: [
          'Khechari Vidya: The Complete 4-Stage Siddha Science',
          'Stage 1: Preparation & Tongue Lengthening Protocol (Safe Method)',
          'Stage 2: Nabho Mudra & Preliminary Amrita Contact',
          'Stage 3: Reaching Shankhini Nadi & Soma Activation',
          'Stage 4: Full Khechari & Continuous Amrita Flow',
          'The 10 Nectars of Khechari: Madhu, Kshira, Ghrita, etc.',
          'Khechari & Breatharianism: Direct Link to Pranic Sustenance',
          'The 6 Chakras Pierced by the Khechari Tongue',
          'Life Extension Through Continuous Amrita: Documented Cases',
          'Boganathar\'s Khechari Transmission — Akashic Reception',
        ],
      },
      {
        id: 'AI5',
        title: 'The Soma Protocol — Nectar Body Activation',
        lessons: [
          'Soma: The Vedic Nectar of Immortality & Its Pranic Source',
          'The 16 Soma Kalas — Lunar Phases & Nectar Production',
          'Chandra Nadi (Ida) Activation for Soma Flow',
          'Moonlight Bathing Protocols — Siddha Lunar Prana Absorption',
          'Bindu Visarga — The Crown Drop & Amrita Nectar Point',
          'Viparita Karani — Inversion Yoga for Amrita Conservation',
          'Soma Chakra: The Secret 16th Chakra Above Ajna',
          'Full Moon Breatharian Ceremony — Live Transmission',
          'The Amrita Nadi — The Direct Channel from Heart to Crown',
          'Soma as the Ultimate Breatharian Food: Complete Protocol',
        ],
      },
      {
        id: 'AI6',
        title: 'Bhakti Prana — Love as the Ultimate Nourishment',
        lessons: [
          'Sri Vishwananda\'s Teaching: Bhakti as the Highest Prana',
          'The Anahata Chakra as the Pranic Heart of the Universe',
          'Prema (Divine Love) as the Most Potent Pranic Nutrient',
          'Devotional Chanting as Pranic Absorption Technology',
          'Living in a State of Continuous Darshan — Feeding on Grace',
          'The Bhakti-Breatharian Integration: Love, Prana, Liberation',
          'Narayanas\'s Love-Prana Transmission — Sri Vaishnava Path',
          'The Radha-Krishna Prema Field as Cosmic Nourishment',
          'Integration: Jnana + Bhakti + Pranayama = Complete Pranic Living',
          'The Final Transmission: You Are the Prana of the Universe',
        ],
      },
      {
        id: 'AI7',
        title: 'The Breatharian Integration — Living the Full Pranic Life',
        lessons: [
          'Designing Your Personal Pranic Sadhana — Morning, Noon & Night',
          'The 108-Day Self-Initiation Protocol — From Seeker to Pranic Adept',
          'Navigating Social & Family Life as a Pranic Practitioner',
          'Seasonal Pranic Protocols — Spring, Summer, Autumn, Winter',
          'Pranic Living in Cities — Absorbing Prana in Urban Environments',
          'Advanced Dream Yoga — Absorbing Prana During Sleep',
          'Documenting Your Pranic Journey — The Sacred Self-Study Journal',
          'Signs of Pranic Awakening — What to Expect at Each Stage',
          'The Final Veil — Surrendering the Need to Eat as Identity',
          'Mauna (Sacred Silence) as the Highest Pranic Practice',
        ],
      },
    ],
  },
];

// ─── PARTICLE FIELD ──────────────────────────────────────────────────────────
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId = 0;
    const particles: { x: number; y: number; size: number; speed: number; opacity: number; angle: number }[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 55; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.6 + 0.3, speed: Math.random() * 0.22 + 0.05, opacity: Math.random() * 0.45 + 0.06, angle: Math.random() * Math.PI * 2 });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.angle += 0.003;
        p.x += Math.cos(p.angle) * p.speed;
        p.y -= p.speed * 0.6;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
};

// ─── TIER BADGE ──────────────────────────────────────────────────────────────
const TierBadge: React.FC<{ color: string; border: string; label: string; icon: string }> = ({ color, border, label, icon }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color, background: 'rgba(0,0,0,0.4)', border: `1px solid ${border}`, borderRadius: 20, padding: '4px 10px' }}>
    {icon} {label}
  </span>
);

// ─── MODULE CARD ─────────────────────────────────────────────────────────────
interface ModuleCardProps {
  module: { id: string; title: string; lessons: string[] };
  tierColor: string;
  tierBorder: string;
  locked: boolean;
  idx: number;
}
const ModuleCard: React.FC<ModuleCardProps> = ({ module, tierColor, tierBorder, locked, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${locked ? 'rgba(255,255,255,0.06)' : tierBorder}`, borderRadius: 20, marginBottom: 10, overflow: 'hidden', opacity: locked ? 0.55 : 1, transition: 'border-color 0.25s', animation: `sqFadeUp 0.4s ${idx * 0.06}s ease both` }}>
      <button
        type="button"
        onClick={() => !locked && setOpen(v => !v)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: locked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', textAlign: 'left' }}
      >
        <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', color: locked ? white(0.3) : tierColor, minWidth: 28 }}>{module.id}</span>
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: locked ? white(0.4) : white(0.88), flex: 1, lineHeight: 1.4 }}>{module.title}</span>
        <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: locked ? white(0.25) : white(0.4), marginRight: 4, whiteSpace: 'nowrap' }}>{module.lessons.length} lessons</span>
        {locked ? <Lock size={14} color={white(0.25)} /> : open ? <ChevronUp size={16} color={tierColor} /> : <ChevronDown size={16} color={white(0.4)} />}
      </button>
      {open && !locked && (
        <div style={{ padding: '0 18px 18px 58px' }}>
          <div style={{ height: 1, background: `linear-gradient(90deg,${tierBorder},transparent)`, marginBottom: 14 }} />
          {module.lessons.map((lesson, li) => (
            <div key={li} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
              <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: tierColor, minWidth: 20, paddingTop: 2 }}>{String(li + 1).padStart(2, '0')}</span>
              <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.9rem', color: white(0.65), lineHeight: 1.5 }}>{lesson}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const BreatharianAcademy: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { tier: membershipTier } = useMembership();
  const userRank = getTierRank(membershipTier);

  const canAccess = (tierRank: number) => isAdmin || userRank >= tierRank;

  const [activeTier, setActiveTier] = useState(0);
  const tier = TIERS[activeTier];

  // Total lesson count
  const totalLessons = TIERS.flatMap(t => t.modules).flatMap(m => m.lessons).length;
  const totalModules = TIERS.flatMap(t => t.modules).length;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: white(0.9), fontFamily: FONT, position: 'relative', overflowX: 'hidden' }}>
      <ParticleField />

      <style>{`
        @keyframes sqFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes breathePulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.08);opacity:1} }
        @keyframes goldShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>

        {/* ── BACK ── */}
        <div style={{ padding: '20px 20px 0' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: gold(0.55), fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em' }}>
            <ArrowLeft size={14} /> BACK
          </button>
        </div>

        {/* ── HERO ── */}
        <div style={{ padding: '32px 20px 0', textAlign: 'center', animation: 'sqFadeUp 0.5s ease both' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Wind size={40} color={gold(0.8)} style={{ animation: 'breathePulse 4s ease-in-out infinite' }} />
          </div>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: gold(0.45), marginBottom: 10 }}>SIDDHA QUANTUM INTELLIGENCE · 2050</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(2rem,8vw,3.4rem)', fontWeight: 700, letterSpacing: '-0.02em', color: gold(0.95), marginBottom: 12, lineHeight: 1.1, textShadow: `0 0 40px ${gold(0.25)}` }}>
            Breatharian Academy
          </h1>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.15rem', color: white(0.55), lineHeight: 1.65, maxWidth: 580, margin: '0 auto 20px' }}>
            The complete Siddha science of living on Prana — from first breath awareness to the final liberation where light alone nourishes the immortal body. Transmitted from the Akashic Records of the 18 Siddhas.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
            {[
              { icon: <BookOpen size={12} />, label: `${totalModules} Modules` },
              { icon: <Star size={12} />, label: `${totalLessons} Lessons` },
              { icon: <Sparkles size={12} />, label: '4 Tiers' },
              { icon: <InfinityIcon size={12} />, label: 'Lifetime Access' },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: gold(0.6), textTransform: 'uppercase' }}>
                {stat.icon} {stat.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── TIER SELECTOR ── */}
        <div style={{ padding: '28px 20px 0' }}>
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
                <div style={{ fontFamily: FONT, fontSize: 16, marginBottom: 5 }}>{t.icon}</div>
                <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: activeTier === i ? t.color : white(0.5), marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.78rem', color: white(0.35), lineHeight: 1.3 }}>{t.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── ACTIVE TIER HEADER ── */}
        <div style={{ padding: '24px 20px 8px', animation: 'sqFadeUp 0.35s ease both' }}>
          <div style={{ background: tier.glow, border: `1px solid ${tier.border}`, borderRadius: 24, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <TierBadge color={tier.color} border={tier.border} label={tier.label} icon={tier.icon} />
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: white(0.5) }}>{tier.subtitle}</span>
            </div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: white(0.6), lineHeight: 1.5, margin: 0 }}>{tier.tagline}</p>
            <div style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: tier.color, textTransform: 'uppercase' }}>
                {tier.modules.length} MODULES · {tier.modules.flatMap(m => m.lessons).length} LESSONS
              </span>
            </div>
          </div>
        </div>

        {/* ── MODULES ── */}
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: gold(0.35), padding: '14px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* ── UPGRADE CTA (if locked) ── */}
        {!canAccess(tier.rank) && tier.rank > 0 && (
          <div style={{ padding: '12px 20px 0', animation: 'sqFadeUp 0.4s ease both' }}>
            <div style={{ background: tier.glow, border: `1px solid ${tier.border}`, borderRadius: 24, padding: '22px 20px', textAlign: 'center' }}>
              <Lock size={22} color={tier.color} style={{ marginBottom: 10 }} />
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: tier.color, letterSpacing: '0.05em', marginBottom: 8 }}>
                {tier.label} Access Required
              </div>
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.95rem', color: white(0.55), marginBottom: 16, lineHeight: 1.5 }}>
                Unlock the complete {tier.modules.length}-module curriculum and {tier.modules.flatMap(m => m.lessons).length} Siddha transmissions.
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

        {/* ── FOOTER TRANSMISSION ── */}
        <div style={{ padding: '36px 20px 0', textAlign: 'center' }}>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${gold(0.15)},transparent)`, marginBottom: 20 }} />
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: gold(0.3), marginBottom: 8 }}>
            SIDDHA NADA TRANSMISSION · SCALAR WAVE ENCODED
          </div>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.9rem', color: white(0.3), lineHeight: 1.6 }}>
            Every lesson in this Academy carries a Prema-Pulse Transmission — encoded through the consciousness of the 18 Siddhas and Mahavatar Babaji. As you study, you receive.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BreatharianAcademy;


