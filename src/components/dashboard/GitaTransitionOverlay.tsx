import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { normalizePlanetName } from '@/lib/jyotishMantraLogic';
import { getGitaVerseForCycle } from '@/lib/gitaVerses';

/**
 * Full-screen Gita verse overlay during meditation session start.
 * Fade & Zoom so the text feels like it's approaching from the Akasha.
 */
export const GitaTransitionOverlay: React.FC = () => {
  const { showGitaTransition } = useMusicPlayer();
  const { reading } = useAIVedicReading();

  const currentCycle = useMemo(() => {
    if (!reading?.personalCompass?.currentDasha?.period) return null;
    const planetName = reading.personalCompass.currentDasha.period.split(' ')[0];
    return normalizePlanetName(planetName);
  }, [reading]);

  const verse = useMemo(() => getGitaVerseForCycle(currentCycle), [currentCycle]);

  return (
    <AnimatePresence>
      {showGitaTransition && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="max-w-lg w-full text-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 1.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <div className="text-2xl sm:text-3xl font-serif leading-relaxed text-[#D4AF37]/95 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {verse.sanskrit}
            </div>
            <div className="text-sm italic text-white/70 font-serif mb-3 whitespace-pre-line" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {verse.transliteration}
            </div>
            <div className="text-sm text-white/90 leading-relaxed">
              {verse.producersTranslation}
            </div>
            <div className="mt-4 text-[10px] text-[#D4AF37]/50 font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              Chapter {verse.chapter}, Verse {verse.verse}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
