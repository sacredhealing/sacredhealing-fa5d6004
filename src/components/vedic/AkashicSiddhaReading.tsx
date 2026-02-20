import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMembership } from '@/hooks/useMembership';

/** Vedic Triad: Ketu (incarnation), Saturn (debt), 8th House (hidden gift) */
const AKASHIC_RECORDS: Record<
  number,
  {
    title: string;
    origin: string;
    debt: string;
    remedy: string;
    /** The Incarnation — Ketu: "You were a [Archetype] in [Location]." */
    incarnation: string;
    /** The Saturnian Debt: "You are here to settle a debt regarding [Work/Family/Self]." */
    saturnDebt: string;
    /** The Hidden Gift — 8th House: "A secret power from the past is active in your DNA." */
    eighthHouseGift: string;
  }
> = {
  1: {
    title: 'The Sovereign Atma',
    origin: 'Ancient Aryavarta',
    debt: 'Mastery of Self-Will',
    remedy: 'Sun Mantra',
    incarnation: 'You were a sovereign ruler in Ancient Aryavarta.',
    saturnDebt: 'You are here to settle a debt regarding Self — reclaiming rightful authority without domination.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: the ability to transmute power into grace.',
  },
  4: {
    title: 'The Heart Guardian',
    origin: 'Temple of the South',
    debt: 'Emotional Boundaries',
    remedy: 'Moon Mantra',
    incarnation: 'You were a Heart Guardian in the Temple of the South.',
    saturnDebt: 'You are here to settle a debt regarding Family — balancing nurture with healthy boundaries.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: deep emotional intuition and healing touch.',
  },
  9: {
    title: 'The Vedic Scholar',
    origin: 'Banks of the Saraswati',
    debt: 'Shared Wisdom',
    remedy: 'Jupiter Mantra',
    incarnation: 'You were a Vedic Scholar on the Banks of the Saraswati.',
    saturnDebt: 'You are here to settle a debt regarding Work — teaching what you once withheld.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: access to collective wisdom and dharma.',
  },
  12: {
    title: 'The Himalayan Mystic',
    origin: 'Mount Kailash Range',
    debt: 'Solitude vs. Service',
    remedy: 'Ketu Mantra',
    incarnation: 'You were a Himalayan Mystic in the Mount Kailash Range.',
    saturnDebt: 'You are here to settle a debt regarding Self — integrating solitude with service to the world.',
    eighthHouseGift: 'A secret power from the past is active in your DNA: the capacity to dissolve ego and merge with the infinite.',
  },
};

const DEFAULT_RECORD = {
  title: 'The Wandering Gandharva',
  origin: 'Celestial Realms',
  debt: 'Creative Expression',
  remedy: 'Saraswati Mantra',
  incarnation: 'You were a wandering bard in the Celestial Realms.',
  saturnDebt: 'You are here to settle a debt regarding Work — offering your creativity without attachment to outcome.',
  eighthHouseGift: 'A secret power from the past is active in your DNA: the gift of inspiring others through sound and story.',
};

/** Year of Karmic Climax — when past-life debt is fully paid (derived from userHouse + birth year hint) */
function getYearOfKarmicClimax(userHouse: number): number {
  const now = new Date().getFullYear();
  const cycle = [42, 48, 36, 54, 45, 39, 51, 33, 60, 57][userHouse % 10] ?? 48;
  return now + (cycle % 12) - 3;
}

interface AkashicSiddhaReadingProps {
  userHouse?: number;
  onComplete?: (archetype: string) => void;
  isModal?: boolean;
}

const AkashicSiddhaReadingComponent: React.FC<AkashicSiddhaReadingProps> = ({
  userHouse = 12,
  onComplete,
  isModal = false,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [readingVisible, setReadingVisible] = useState(false);
  const [deepenRevealed, setDeepenRevealed] = useState(false);
  const { isPremium } = useMembership();
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
                The Scroll of Time — Palm Leaf Manuscript
              </span>
            </div>
            <div className={manuscriptContent}>
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

              {/* Past Life Archetype + Origin + Karmic Debt + Remedy */}
              <section className="border-t border-[#D4AF37]/20 pt-6">
                <span
                  className="text-xs uppercase opacity-60 tracking-widest"
                  style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                >
                  Past Life Archetype
                </span>
                <h3
                  className="text-3xl text-white mt-2"
                  style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                >
                  {record.title}
                </h3>
                <p className="text-white/70 mt-2 italic">{record.origin}</p>
              </section>

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

              {/* Deepen Reading — Premium: Year of Karmic Climax */}
              {isPremium && (
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
