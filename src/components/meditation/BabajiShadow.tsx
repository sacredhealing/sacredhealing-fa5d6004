import React from 'react';
import { motion } from 'framer-motion';

const BabajiShadow = () => {
  return (
    <div className="relative flex flex-col items-center justify-center p-12 overflow-hidden">
      {/* THE DIVINE GLOW (AURA) */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-64 h-64 bg-[#D4AF37] rounded-full blur-[80px] opacity-30"
      />

      {/* THE BABAJI SILHOUETTE */}
      <motion.svg
        width="280"
        height="350"
        viewBox="0 0 200 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        className="relative z-10 filter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
      >
        <path
          d="M100 40C85 40 75 55 75 70C75 85 85 95 100 95C115 95 125 85 125 70C125 55 115 40 100 40Z"
          fill="url(#paint0_radial)"
        />
        <path
          d="M100 100C60 100 30 130 30 180V220H170V180C170 130 140 100 100 100Z"
          fill="url(#paint0_radial)"
        />
        <defs>
          <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 125) rotate(90) scale(125 100)">
            <stop stopColor="#1a0b2e" />
            <stop offset="1" stopColor="#000000" />
          </radialGradient>
        </defs>
      </motion.svg>

      {/* THE KRIYA TEXT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <p className="text-[#D4AF37] text-xs tracking-[0.4em] uppercase font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          The Void is Full
        </p>
        <p className="text-white/30 text-[10px] mt-2 italic font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          Mahavatar Babaji waits in the silence...
        </p>
      </motion.div>
    </div>
  );
};

export default BabajiShadow;
