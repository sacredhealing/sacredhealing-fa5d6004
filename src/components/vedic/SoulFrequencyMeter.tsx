import React from 'react';
import { motion } from 'framer-motion';

/** Soul Frequency meter — pulses as if 432Hz remedy is playing during the reading. */
export const SoulFrequencyMeter: React.FC<{ isActive?: boolean; className?: string }> = ({
  isActive = true,
  className = '',
}) => (
  <div className={`flex flex-col items-center gap-2 ${className}`}>
    <span
      className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]/60"
      style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
    >
      Soul Frequency · 432Hz
    </span>
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-6 rounded-full bg-[#D4AF37]/30"
          animate={
            isActive
              ? {
                  scaleY: [0.4, 0.9, 0.5, 0.8, 0.4],
                  opacity: [0.5, 1, 0.6, 1, 0.5],
                }
              : { scaleY: 0.4, opacity: 0.5 }
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.08,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  </div>
);
