import React from "react";
import { motion } from "framer-motion";

export const SriYantra = ({ isActive }: { isActive: boolean }) => {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      animate={{
        rotate: isActive ? 360 : 0,
        scale: isActive ? [1, 1.05, 1] : 1,
      }}
      transition={{
        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <defs>
        <radialGradient id="sri-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isActive ? "#60a5fa" : "#ef4444"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isActive ? "#3b82f6" : "#b91c1c"} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer Glow */}
      <circle cx="100" cy="100" r="90" fill="url(#sri-glow)" />

      {/* Outer Circles */}
      <circle cx="100" cy="100" r="80" fill="none" stroke={isActive ? "#3b82f6" : "#ef4444"} strokeWidth="0.5" opacity="0.5" />
      <circle cx="100" cy="100" r="75" fill="none" stroke={isActive ? "#60a5fa" : "#f87171"} strokeWidth="1" />

      {/* Petals (Simplified) */}
      {[...Array(16)].map((_, i) => (
        <motion.path
          key={i}
          d="M100 25 Q110 40 100 55 Q90 40 100 25"
          fill="none"
          stroke={isActive ? "#93c5fd" : "#fca5a5"}
          strokeWidth="0.5"
          transform={`rotate(${i * 22.5} 100 100)`}
          animate={{ opacity: isActive ? [0.3, 0.8, 0.3] : 0.2 }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}

      {/* Interlocking Triangles (The Core) */}
      <g transform="translate(100, 100) scale(0.6)">
        {/* Shakti Triangles (Downward) */}
        <path d="M0 -80 L70 40 L-70 40 Z" fill="none" stroke={isActive ? "#3b82f6" : "#ef4444"} strokeWidth="1" opacity="0.8" />
        <path d="M0 -60 L50 30 L-50 30 Z" fill="none" stroke={isActive ? "#60a5fa" : "#f87171"} strokeWidth="1" opacity="0.6" />
        <path d="M0 -40 L30 20 L-30 20 Z" fill="none" stroke={isActive ? "#93c5fd" : "#fca5a5"} strokeWidth="1" opacity="0.4" />

        {/* Shiva Triangles (Upward) */}
        <path d="M0 80 L70 -40 L-70 -40 Z" fill="none" stroke={isActive ? "#3b82f6" : "#ef4444"} strokeWidth="1" opacity="0.8" />
        <path d="M0 60 L50 -30 L-50 -30 Z" fill="none" stroke={isActive ? "#60a5fa" : "#f87171"} strokeWidth="1" opacity="0.6" />
        <path d="M0 40 L30 -20 L-30 -20 Z" fill="none" stroke={isActive ? "#93c5fd" : "#fca5a5"} strokeWidth="1" opacity="0.4" />
      </g>

      {/* Bindu (Central Point) */}
      <motion.circle
        cx="100"
        cy="100"
        r="2"
        fill={isActive ? "#fff" : "#ef4444"}
        animate={{ scale: isActive ? [1, 2, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  );
};
