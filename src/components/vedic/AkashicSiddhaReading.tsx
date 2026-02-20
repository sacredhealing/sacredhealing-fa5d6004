import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// The "Unwritten" Archetypes mapped to Ketu's House
const AKASHIC_RECORDS: Record<number, {
  title: string;
  origin: string;
  debt: string;
  remedy: string;
}> = {
  1: { title: "The Sovereign Atma", origin: "Ancient Aryavarta", debt: "Mastery of Self-Will", remedy: "Sun Mantra" },
  4: { title: "The Heart Guardian", origin: "Temple of the South", debt: "Emotional Boundaries", remedy: "Moon Mantra" },
  9: { title: "The Vedic Scholar", origin: "Banks of the Saraswati", debt: "Shared Wisdom", remedy: "Jupiter Mantra" },
  12: { title: "The Himalayan Mystic", origin: "Mount Kailash Range", debt: "Solitude vs. Service", remedy: "Ketu Mantra" },
  // Add other houses as needed...
};

const DEFAULT_RECORD = { title: "The Wandering Gandharva", origin: "Celestial Realms", debt: "Creative Expression", remedy: "Saraswati Mantra" };

interface AkashicSiddhaReadingProps {
  userHouse?: number;
  onComplete?: (archetype: string) => void;
  isModal?: boolean;
}

const AkashicSiddhaReading: React.FC<AkashicSiddhaReadingProps> = ({ userHouse = 12, onComplete, isModal = false }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [readingVisible, setReadingVisible] = useState(false);
  const record = AKASHIC_RECORDS[userHouse] || DEFAULT_RECORD;

  const startReading = () => {
    setIsSyncing(true);
    // Simulate "Frequency Alignment"
    setTimeout(() => {
      setIsSyncing(false);
      setReadingVisible(true);
      // Call onComplete callback when reading is revealed
      if (onComplete) {
        onComplete(record.title);
      }
    }, 4000);
  };

  const handleClose = () => {
    setReadingVisible(false);
    setIsSyncing(false);
  };

  const containerClass = isModal 
    ? "text-[#D4AF37] font-serif flex flex-col items-center p-6"
    : "min-h-screen bg-[#0a0a0a] text-[#D4AF37] p-8 font-serif flex flex-col items-center";

  return (
    <div className={containerClass}>
      {!isModal && (
        <h2 className="text-3xl tracking-widest uppercase mb-12 text-center" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          Akashic Record Access
        </h2>
      )}

      {!readingVisible && !isSyncing && (
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px #D4AF37" }}
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
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 border-t-2 border-[#D4AF37] rounded-full mb-6 opacity-50"
          />
          <p className="animate-pulse tracking-widest italic" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
            Aligning with your Soul's Frequency...
          </p>
        </div>
      )}

      <AnimatePresence>
        {readingVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full bg-black/40 p-8 rounded-lg border border-[#D4AF37]/20 backdrop-blur-md"
          >
            <div className="mb-8 border-b border-[#D4AF37]/30 pb-4">
              <span className="text-xs uppercase opacity-60 tracking-widest" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                Past Life Archetype
              </span>
              <h3 className="text-4xl text-white mt-2" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                {record.title}
              </h3>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  Origin Point
                </h4>
                <p className="text-white/80 mt-1 italic text-lg" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  {record.origin}
                </p>
              </section>

              <section>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  The Karmic Debt
                </h4>
                <p className="text-white/80 mt-1" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  {record.debt}
                </p>
              </section>

              <section className="bg-[#D4AF37]/10 p-4 rounded border-l-4 border-[#D4AF37]">
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  Siddha Remedy
                </h4>
                <p className="text-white mt-1" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  Practice the <strong>{record.remedy}</strong> daily at 432Hz to clear this frequency.
                </p>
              </section>
            </div>

            <button 
              onClick={handleClose}
              className="mt-12 text-xs opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
              style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
            >
              Close Record Vault
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AkashicSiddhaReading;
