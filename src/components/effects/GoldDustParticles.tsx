import React from 'react';
import { motion } from 'framer-motion';

interface GoldDustParticlesProps {
  count?: number;
  duration?: number;
}

/** Gold dust particles (Ojas) floating effect */
export const GoldDustParticles: React.FC<GoldDustParticlesProps> = ({ count = 24, duration = 2.5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const targetX = Math.cos(angle) * distance;
        const targetY = -Math.abs(Math.sin(angle) * distance) - 100; // Flow upward and outward
        
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37] pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 0.9,
              scale: 1,
            }}
            animate={{
              x: [0, targetX * 0.5, targetX],
              y: [0, targetY * 0.5, targetY],
              opacity: [0.9, 0.7, 0],
              scale: [1, 0.9, 0.3],
            }}
            transition={{
              duration: duration + Math.random() * 0.3,
              delay: i * 0.04,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </>
  );
};
