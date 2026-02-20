import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMembership } from '@/hooks/useMembership';
import { generateAkashicCertificatePdf } from '@/utils/akashicCertificatePdf';

/** Deep Akashic: Vedic Triad + Multi-Planetary (Ketu/Saturn) + Origin, Mastery, Shadow */
type AkashicRecord = {
  title: string;
  origin: string;
  debt: string;
  remedy: string;
  incarnation: string;
  saturnDebt: string;
  eighthHouseGift: string;
  soulOccupation: string;
  unfinishedLesson: string;
  eighthHouseShadow: string;
  transmutationPath: string;
  /** The Akashic Origin — where you came from */
  akashicOrigin: string;
  /** The Siddha Mastery — hidden powers you possess */
  siddhaMastery: string;
  /** The Shadow of Saturn — specific past-life debts causing current stress */
  shadowOfSaturn: string;
};

const AKASHIC_RECORDS: Record<number, AkashicRecord> = {
  1: {
    title: 'The Sovereign Atma',
    origin: 'Ancient Aryavarta',
    debt: 'Mastery of Self-Will',
    remedy: 'Sun Mantra',
    incarnation: 'You were a sovereign ruler in Ancient Aryavarta.',
    saturnDebt: 'You are here to settle a debt regarding Self — reclaiming rightful authority without domination.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: the ability to transmute power into grace.',
    soulOccupation: 'Sovereign and Law-Giver',
    unfinishedLesson: 'You took birth in this era to learn leadership without tyranny — to wield authority as service, not domination. The age demands leaders who lead from the heart.',
    eighthHouseShadow: 'You suppressed the power to say no and set boundaries. That unexpressed "no" became inner rigidity and blocks in partnership and shared resources. Reclaim the right to choose.',
    transmutationPath: 'At 432Hz, chant the Surya mantra 12 times at sunrise: Om Hram Hreem Hraum Sah Suryaya Namah. Then sit in silence for 12 minutes. This sequence rewrites the record of withheld authority.',
    akashicOrigin: 'You came from the royal courts of Ancient Aryavarta — a lineage of rulers and law-givers who carried the solar flame of sovereignty.',
    siddhaMastery: 'You possess the hidden power to hold space for others without losing your center — the Siddha gift of steady authority that inspires without dominating.',
    shadowOfSaturn: 'Saturn’s debt: you once abused authority or withheld justice. That debt now shows as stress around responsibility, criticism, and the fear of being wrong.',
  },
  4: {
    title: 'The Heart Guardian',
    origin: 'Temple of the South',
    debt: 'Emotional Boundaries',
    remedy: 'Moon Mantra',
    incarnation: 'You were a Heart Guardian in the Temple of the South.',
    saturnDebt: 'You are here to settle a debt regarding Family — balancing nurture with healthy boundaries.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: deep emotional intuition and healing touch.',
    soulOccupation: 'Temple Guardian and Healer',
    unfinishedLesson: 'You took birth now to complete the lesson of loving without losing yourself. 2026 calls you to build a true home — inner and outer — without sacrificing your own need for safety.',
    eighthHouseShadow: 'You suppressed your need for emotional safety and hid your vulnerability. That suppression now blocks intimacy and trust. Your shadow is the fear of being seen in need.',
    transmutationPath: 'At 432Hz, chant the Chandra mantra 12 times at night: Om Shram Shreem Shraum Sah Chandraya Namah. Then place one hand on the heart and breathe for 12 minutes. This rewrites the record of hidden vulnerability.',
    akashicOrigin: 'You came from the Temple of the South — a lineage of heart guardians and healers who tended the sacred flame of feeling.',
    siddhaMastery: 'You possess the hidden power of emotional alchemy — the Siddha gift of turning pain into presence and holding safe space for the unspoken.',
    shadowOfSaturn: 'Saturn’s debt: you once closed your heart or broke a bond. That debt now shows as stress in family, home, and the fear of abandonment.',
  },
  9: {
    title: 'The Vedic Scholar',
    origin: 'Banks of the Saraswati',
    debt: 'Shared Wisdom',
    remedy: 'Jupiter Mantra',
    incarnation: 'You were a Vedic Scholar on the Banks of the Saraswati.',
    saturnDebt: 'You are here to settle a debt regarding Work — teaching what you once withheld.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: access to collective wisdom and dharma.',
    soulOccupation: 'Scholar and Keeper of Wisdom',
    unfinishedLesson: 'You took birth in this time to finally share what you once hoarded. The world in 2026 needs teachers who speak truth without dogma. Your lesson is to give wisdom freely.',
    eighthHouseShadow: 'You suppressed the teacher within for fear of being wrong or rejected. That unexpressed wisdom became mental restlessness and blocks in higher learning and long journeys. Speak what you know.',
    transmutationPath: 'At 432Hz, chant the Guru mantra 12 times at dawn: Om Gram Greem Graum Sah Gurave Namah. Then write one paragraph of truth you have never shared. Burn or release it. This rewrites the record of withheld wisdom.',
    akashicOrigin: 'You came from the Banks of the Saraswati — a lineage of scholars and keepers of the Vedas who preserved wisdom across ages.',
    siddhaMastery: 'You possess the hidden power of instant comprehension — the Siddha gift of grasping complex truths and transmitting them with clarity.',
    shadowOfSaturn: 'Saturn’s debt: you once withheld knowledge or misused teaching. That debt now shows as stress in career, higher education, and the fear of being judged.',
  },
  12: {
    title: 'The Himalayan Mystic',
    origin: 'Mount Kailash Range',
    debt: 'Solitude vs. Service',
    remedy: 'Ketu Mantra',
    incarnation: 'You were a Himalayan Mystic in the Mount Kailash Range.',
    saturnDebt: 'You are here to settle a debt regarding Self — integrating solitude with service to the world.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: the capacity to dissolve ego and merge with the infinite.',
    soulOccupation: 'Mystic and Renunciate',
    unfinishedLesson: 'You took birth now to bring the cave into the marketplace. 2026 asks you to serve without losing your connection to the void. The unfinished lesson is solitude in action.',
    eighthHouseShadow: 'You suppressed the desire for recognition and hid your light. That suppression now blocks liberation and surrender — you fear losing yourself if you merge. The shadow is the need to be special.',
    transmutationPath: 'At 432Hz, chant the Ketu mantra 12 times in a dark or dim space: Om Stram Streem Straum Sah Ketave Namah. Then sit with the intention to disappear for 12 minutes. This rewrites the record of hidden light.',
    akashicOrigin: 'You came from the Mount Kailash range — a lineage of mystics and renunciates who sought liberation in the high caves.',
    siddhaMastery: 'You possess the hidden power of dissolution — the Siddha gift of releasing attachment and touching the void without fear.',
    shadowOfSaturn: 'Saturn’s debt: you once escaped responsibility or hid from service. That debt now shows as stress in solitude, loss, and the fear of insignificance.',
  },
};

const DEFAULT_RECORD: AkashicRecord = {
  title: 'The Wandering Gandharva',
  origin: 'Celestial Realms',
  debt: 'Creative Expression',
  remedy: 'Saraswati Mantra',
  incarnation: 'You were a wandering bard in the Celestial Realms.',
  saturnDebt: 'You are here to settle a debt regarding Work — offering your creativity without attachment to outcome.',
  eighthHouseGift: 'A secret power from the past is active in your DNA: the gift of inspiring others through sound and story.',
  soulOccupation: 'Sacred Dancer and Bard',
  unfinishedLesson: 'You took birth in this era to ground your creativity in form. 2026 invites you to offer your art without waiting for permission. The lesson is to create for the sake of creation.',
  eighthHouseShadow: 'You suppressed your voice and your desire for beauty. That suppression now blocks transformation and shared resources. The shadow is the belief that your gift is not enough.',
  transmutationPath: 'At 432Hz, chant the Saraswati mantra 12 times: Om Aim Saraswatyai Namah. Then sing or hum one note for 12 minutes. This rewrites the record of silenced creativity.',
  akashicOrigin: 'You came from the Celestial Realms — a lineage of bards and dancers who carried the frequency of beauty across worlds.',
  siddhaMastery: 'You possess the hidden power of resonance — the Siddha gift of moving others through sound, story, and presence.',
  shadowOfSaturn: 'Saturn’s debt: you once refused to create or silenced another’s voice. That debt now shows as stress in creativity, partnership, and the fear of being unseen.',
};

/** Year of Karmic Climax — when past-life debt is fully paid (derived from userHouse + birth year hint) */
function getYearOfKarmicClimax(userHouse: number): number {
  const now = new Date().getFullYear();
  const cycle = [42, 48, 36, 54, 45, 39, 51, 33, 60, 57][userHouse % 10] ?? 48;
  return now + (cycle % 12) - 3;
}

interface AkashicSiddhaReadingProps {
  /** Ketu's house (1–12) — from Jyotish; drives archetype/origin */
  userHouse?: number;
  /** Saturn's house (1–12) — from Jyotish; refines Shadow of Saturn */
  saturnHouse?: number;
  /** Optional Vedic reading for multi-planetary bridge */
  vedicReading?: { personalCompass?: { currentDasha?: { period?: string } }; masterBlueprint?: { soulMap12Houses?: string } } | null;
  onComplete?: (archetype: string) => void;
  isModal?: boolean;
  /** Purchased high-ticket $49 reveal — unlocks full manuscript + Certificate of Origin */
  hasDeepReadingAccess?: boolean;
  /** Show Download Certificate of Origin PDF button (when hasDeepReadingAccess) */
  showCertificateDownload?: boolean;
  /** User display name for Certificate title */
  userName?: string;
}

/** Derive Ketu house from Dasha period name if possible (e.g. Ketu → 12, Moon → 4) */
function ketuHouseFromReading(reading: AkashicSiddhaReadingProps['vedicReading']): number | undefined {
  const period = reading?.personalCompass?.currentDasha?.period;
  if (!period) return undefined;
  const p = period.toLowerCase();
  if (p.startsWith('ketu')) return 12;
  if (p.startsWith('moon')) return 4;
  if (p.startsWith('jupiter')) return 9;
  if (p.startsWith('sun')) return 1;
  return undefined;
}

const AkashicSiddhaReadingComponent: React.FC<AkashicSiddhaReadingProps> = ({
  userHouse: userHouseProp = 12,
  saturnHouse: saturnHouseProp,
  vedicReading,
  onComplete,
  isModal = false,
  hasDeepReadingAccess = false,
  showCertificateDownload = false,
  userName,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [readingVisible, setReadingVisible] = useState(false);
  const [deepenRevealed, setDeepenRevealed] = useState(false);
  const [burnRevealed, setBurnRevealed] = useState(false);
  const { isPremium } = useMembership();
  const hasFullManuscript = isPremium || hasDeepReadingAccess;
  const userHouse = ketuHouseFromReading(vedicReading) ?? userHouseProp;
  const record = AKASHIC_RECORDS[userHouse] || DEFAULT_RECORD;
  const yearClimax = getYearOfKarmicClimax(userHouse);

  const startReading = () => {
    setIsSyncing(true);
    setDeepenRevealed(false);
    setTimeout(() => {
      setIsSyncing(false);
      setReadingVisible(true);
      onComplete?.(record.title);
    }, 4000);
  };

  const handleClose = () => {
    setReadingVisible(false);
    setIsSyncing(false);
    setDeepenRevealed(false);
  };

  const containerClass = isModal
    ? 'text-[#D4AF37] font-serif flex flex-col items-center p-6'
    : 'min-h-screen bg-[#0a0a0a] text-[#D4AF37] p-8 font-serif flex flex-col items-center';

  const scrollClass =
    'max-w-2xl w-full overflow-y-auto overflow-x-hidden max-h-[70vh] rounded-lg border-2 border-[#D4AF37]/30 bg-gradient-to-b from-amber-950/30 via-[#0d0a06] to-amber-950/20 shadow-[0_0_60px_rgba(212,175,55,0.15)]';
  const manuscriptContent =
    'px-8 py-10 space-y-8 border-l-4 border-r-4 border-[#D4AF37]/20 bg-[linear-gradient(90deg,transparent_0%,rgba(212,175,55,0.03)_50%,transparent_100%)] min-h-[600px]';

  return (
    <div className={containerClass}>
      {!isModal && (
        <h2
          className="text-3xl tracking-widest uppercase mb-12 text-center"
          style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
        >
          Akashic Record Access
        </h2>
      )}

      {!readingVisible && !isSyncing && (
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #D4AF37' }}
          onClick={startReading}
          className="px-10 py-4 border-2 border-[#D4AF37] rounded-full bg-transparent text-[#D4AF37] text-lg uppercase tracking-tighter hover:bg-[#D4AF37]/10 transition-colors"
          style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
        >
          Sync with the Akasha
        </motion.button>
      )}

      {isSyncing && (
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="w-32 h-32 border-t-2 border-[#D4AF37] rounded-full mb-6 opacity-50"
          />
          <p
            className="animate-pulse tracking-widest italic"
            style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
          >
            Aligning with your Soul&apos;s Frequency...
          </p>
        </div>
      )}

      <AnimatePresence>
        {readingVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={scrollClass}
          >
            <div className="sticky top-0 z-10 py-2 text-center border-b border-[#D4AF37]/20 bg-[#0a0a0a]/90 backdrop-blur-sm">
              <span
                className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37]/70"
                style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
              >
                {burnRevealed ? (hasFullManuscript ? 'The Scroll of Time — Full Akashic Manuscript' : 'Akashic Record — Summary') : 'Secret Manuscript'}
              </span>
            </div>
            <div className={`relative ${manuscriptContent}`}>
              {/* Burn-to-Read parchment overlay */}
              <AnimatePresence>
                {!burnRevealed && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8 } }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-b-lg bg-gradient-to-b from-amber-950/98 via-amber-900/95 to-black/98 border-b-2 border-[#D4AF37]/30"
                    onClick={() => setBurnRevealed(true)}
                    style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                  >
                    <span className="text-[#D4AF37]/90 text-4xl mb-4" aria-hidden>🔥</span>
                    <span className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-2">Secret Manuscript</span>
                    <span className="text-white/80 text-xs uppercase tracking-widest">Touch to burn & reveal</span>
                  </motion.button>
                )}
              </AnimatePresence>
              {/* ——— FREE: Summary (always visible) ——— */}
              <section className="border-b border-[#D4AF37]/20 pb-6">
                <span
                  className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/60"
                  style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                >
                  Summary
                </span>
                <h3
                  className="text-2xl text-white mt-2"
                  style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                >
                  {record.title}
                </h3>
                <p className="text-white/70 mt-1 italic">{record.origin}</p>
                <p className="text-white/80 mt-3 text-sm leading-relaxed">{record.incarnation}</p>
              </section>

              {/* ——— MEMBERSHIP GATE: Full Manuscript requires Premium or $49 Deep Reading ——— */}
              {!hasFullManuscript && (
                <section className="py-6">
                  <div className="rounded-xl border-2 border-[#D4AF37]/50 bg-[#D4AF37]/5 p-6 text-center">
                    <h4
                      className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      Full Akashic Manuscript
                    </h4>
                    <p className="text-white/80 text-sm mb-4">
                      The complete Deep Akashic Decoder — Soul&apos;s Occupation, Unfinished Lesson, 8th House Shadow, Transmutation Path, and Year of Karmic Climax — is a Premium feature.
                    </p>
                    <Link
                      to="/membership"
                      className="inline-block px-6 py-3 rounded-xl border-2 border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold uppercase tracking-wider hover:bg-[#D4AF37]/30 transition-colors"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      Unlock Full Manuscript
                    </Link>
                  </div>
                </section>
              )}

              {/* ——— FULL MANUSCRIPT: Premium or $49 Deep Reading ——— */}
              {hasFullManuscript && (
                <>
                  {/* The Akashic Origin — where you came from */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Akashic Origin
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed italic"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.akashicOrigin}
                    </p>
                  </section>

                  {/* The Siddha Mastery — hidden powers */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Siddha Mastery
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.siddhaMastery}
                    </p>
                  </section>

                  {/* The Shadow of Saturn — past-life debts causing current stress */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Shadow of Saturn
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.shadowOfSaturn}
                    </p>
                  </section>

                  {/* The Soul's Occupation */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Soul&apos;s Occupation
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.soulOccupation}
                    </p>
                  </section>

                  {/* The Unfinished Lesson */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Unfinished Lesson
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.unfinishedLesson}
                    </p>
                  </section>

                  {/* The 8th House Shadow */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The 8th House Shadow
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.eighthHouseShadow}
                    </p>
                  </section>

                  {/* The Transmutation Path */}
                  <section className="bg-[#D4AF37]/10 p-4 rounded border-l-4 border-[#D4AF37]">
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Transmutation Path
                    </h4>
                    <p
                      className="text-white/95 text-sm leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.transmutationPath}
                    </p>
                  </section>

                  {/* The Incarnation — Ketu */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Incarnation
                    </h4>
                    <p
                      className="text-white/90 italic text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.incarnation}
                    </p>
                  </section>

                  {/* The Saturnian Debt */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Saturnian Debt
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.saturnDebt}
                    </p>
                  </section>

                  {/* The Hidden Gift — 8th House */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/90 mb-2"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Hidden Gift
                    </h4>
                    <p
                      className="text-white/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      {record.eighthHouseGift}
                    </p>
                  </section>

                  {/* Karmic Debt + Siddha Remedy */}
                  <section>
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      The Karmic Debt
                    </h4>
                    <p className="text-white/80 mt-1" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                      {record.debt}
                    </p>
                  </section>

                  <section className="bg-[#D4AF37]/10 p-4 rounded border-l-4 border-[#D4AF37]">
                    <h4
                      className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                    >
                      Siddha Remedy
                    </h4>
                    <p className="text-white mt-1" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                      Practice the <strong>{record.remedy}</strong> daily at 432Hz to clear this frequency.
                    </p>
                  </section>

                  {/* Deepen Reading — Year of Karmic Climax */}
                  <section className="pt-6">
                    <button
                      type="button"
                      onClick={() => setDeepenRevealed(true)}
                      className="px-6 py-3 rounded-xl border-2 border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-bold uppercase tracking-wider hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50"
                      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                      disabled={deepenRevealed}
                    >
                      {deepenRevealed ? 'Revealed' : 'Deepen Reading'}
                    </button>
                    <AnimatePresence>
                      {deepenRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0 }}
                          className="mt-4 p-4 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40"
                        >
                          <h4
                            className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2"
                            style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                          >
                            Year of Karmic Climax
                          </h4>
                          <p className="text-white/95 text-lg" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                            The year in this life when the past-life debt is fully paid: <strong className="text-[#D4AF37]">{yearClimax}</strong>.
                            Prepare through consistent practice of your Siddha Remedy.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>

                  {/* Certificate of Origin — downloadable PDF with gold seal */}
                  {showCertificateDownload && userName && (
                    <section className="pt-6 border-t border-[#D4AF37]/20">
                      <button
                        type="button"
                        onClick={() => generateAkashicCertificatePdf(userName, record, yearClimax)}
                        className="w-full px-6 py-4 rounded-xl border-2 border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] text-sm font-bold uppercase tracking-wider hover:bg-[#D4AF37]/25 transition-colors flex items-center justify-center gap-2"
                        style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                      >
                        <span aria-hidden>📜</span>
                        Download Certificate of Origin — PDF
                      </button>
                      <p className="text-[10px] text-[#D4AF37]/60 text-center mt-2">The {userName} Akashic Record: A Siddha Transmission</p>
                    </section>
                  )}
                </>
              )}

              <button
                onClick={handleClose}
                className="mt-12 text-xs opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
                style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
              >
                Close Record Vault
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AkashicSiddhaReading = React.memo(AkashicSiddhaReadingComponent);
export default AkashicSiddhaReading;
