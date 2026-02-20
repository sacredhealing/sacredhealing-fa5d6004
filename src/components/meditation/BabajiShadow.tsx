import React from 'react';
import { motion } from 'framer-motion';

/** Gold-lined geometric mountain / seated yogi — sacred geometry for empty state. */
const BabajiShadow = () => {
  return (
    <div className="relative flex flex-col items-center justify-center p-12 overflow-hidden">
      {/* Subtle glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-48 h-48 bg-[#D4AF37] rounded-full blur-[60px]"
      />

      {/* Gold-lined geometric mountain / seated figure (sacred geometry) */}
      <motion.svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10"
      >
        {/* Mountain peaks — triangular sacred geometry */}
        <path
          d="M100 40 L160 180 L40 180 Z"
          stroke="rgba(212,175,55,0.25)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M100 70 L130 180 L70 180 Z"
          stroke="rgba(212,175,55,0.3)"
          strokeWidth="0.6"
          fill="none"
        />
        {/* Inner triangle — bindu / meditator seat */}
        <path
          d="M100 95 L115 180 L85 180 Z"
          stroke="rgba(212,175,55,0.2)"
          strokeWidth="0.5"
          fill="none"
        />
        {/* Lotus / base circle */}
        <circle
          cx="100"
          cy="100"
          r="55"
          stroke="rgba(212,175,55,0.15)"
          strokeWidth="0.5"
          fill="none"
        />
      </motion.svg>

      {/* THE VOID IS FULL */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <p className="text-[#D4AF37] text-xs tracking-[0.4em] uppercase font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          The Void is Full
        </p>
        <p className="text-white/25 text-[10px] mt-2 italic font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          Mahavatar Babaji waits in the silence...
        </p>
      </motion.div>
    </div>
  );
};

export default BabajiShadow;
