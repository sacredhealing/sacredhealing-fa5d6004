import React from 'react';
import { motion } from 'framer-motion';
import { SriYantra } from './SriYantra';

/** The Entrance — Sacred Geometry focal point (breathing Sri Yantra) for above-the-fold. */
interface SacredGeometryFocalProps {
  className?: string;
}

export const SacredGeometryFocal: React.FC<SacredGeometryFocalProps> = ({ className = '' }) => (
  <motion.div
    className={`relative flex items-center justify-center w-full ${className}`}
    animate={{
      scale: [1, 1.02, 1],
      opacity: [0.9, 1, 0.9],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <div className="w-72 h-72 sm:w-80 sm:h-80">
      <SriYantra variant="gold" />
    </div>
  </motion.div>
);
