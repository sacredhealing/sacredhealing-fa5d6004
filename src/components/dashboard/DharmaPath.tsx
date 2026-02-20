import React from 'react';
import { motion } from 'framer-motion';

/** The Dharma Path — 21 stepping stones. Completed days = golden glow, current = blue shimmer. No percentages. */
interface DharmaPathProps {
  completedDays: number;
  currentDayActive: boolean;
  experientialPhrase: string;
}

const PHRASES = [
  'You are at the threshold.',
  'The path is opening before you.',
  'Each step deepens the silence.',
  'You are walking into stillness.',
  'The forest of peace awaits.',
  'You are deep within the forest of peace.',
  'The inner temple draws near.',
  'Grace follows each footprint.',
  'You move through the veil.',
  'The sacred ground rises to meet you.',
  'Halfway to the sanctuary.',
  'The light grows steadier.',
  'You are approaching the heart.',
  'The path remembers your steps.',
  'Almost there.',
  'The temple gates are near.',
  'You have journeyed far.',
  'Rest and walk as one.',
  'The final stones gleam.',
  'The sanctuary awaits.',
  'You have arrived.',
];

export const DharmaPath: React.FC<DharmaPathProps> = ({
  completedDays,
  currentDayActive,
  experientialPhrase,
}) => {
  const totalStones = 21;
  const currentStone = Math.min(completedDays + 1, totalStones);

  return (
    <div className="space-y-3">
      <p className="text-sm font-serif italic text-amber-200/90 text-center leading-relaxed">
        {experientialPhrase}
      </p>
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-2 px-1 scrollbar-hide">
        {Array.from({ length: totalStones }, (_, i) => {
          const dayNum = i + 1;
          const isCompleted = dayNum <= completedDays;
          const isCurrent = dayNum === currentStone && currentDayActive && !isCompleted;

          return (
            <motion.div
              key={dayNum}
              className={`relative flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all
                ${isCompleted
                  ? 'bg-[#D4AF37]/60 border-[#D4AF37]/80 shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                  : isCurrent
                    ? 'bg-blue-400/50 border-blue-300/80 shadow-[0_0_12px_rgba(96,165,250,0.6)]'
                    : 'bg-white/5 border-white/15'
                }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
            >
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-400/30"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export function getDharmaPhrase(completedDays: number): string {
  const index = Math.min(completedDays, PHRASES.length - 1);
  return PHRASES[index];
}
