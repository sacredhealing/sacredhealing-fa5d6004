import React from 'react';
import { motion } from 'framer-motion';

interface LivingCoinIconProps {
  className?: string;
  size?: number;
  showAura?: boolean;
}

export const LivingCoinIcon: React.FC<LivingCoinIconProps> = ({ 
  className = '', 
  size = 48,
  showAura = true 
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer pulsing aura */}
      {showAura && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              width: size * 2.5,
              height: size * 2.5,
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: size * 1.8,
              height: size * 1.8,
              background: 'radial-gradient(circle, hsl(var(--gold) / 0.3) 0%, transparent 60%)',
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Main coin icon */}
      <motion.div
        className="relative z-10 rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(145deg, hsl(var(--gold)) 0%, hsl(45 90% 40%) 100%)',
          boxShadow: `
            0 0 ${size * 0.4}px hsl(var(--gold) / 0.5),
            0 0 ${size * 0.8}px hsl(var(--gold) / 0.3),
            inset 0 2px 4px hsl(50 100% 80% / 0.4)
          `,
        }}
        animate={{
          boxShadow: [
            `0 0 ${size * 0.4}px hsl(var(--gold) / 0.5), 0 0 ${size * 0.8}px hsl(var(--gold) / 0.3), inset 0 2px 4px hsl(50 100% 80% / 0.4)`,
            `0 0 ${size * 0.6}px hsl(var(--gold) / 0.7), 0 0 ${size * 1.2}px hsl(var(--gold) / 0.4), inset 0 2px 4px hsl(50 100% 80% / 0.5)`,
            `0 0 ${size * 0.4}px hsl(var(--gold) / 0.5), 0 0 ${size * 0.8}px hsl(var(--gold) / 0.3), inset 0 2px 4px hsl(50 100% 80% / 0.4)`,
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Lotus/Sacred symbol */}
        <motion.svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          animate={{
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Center petal */}
          <path
            d="M12 4C12 4 10 8 10 12C10 16 12 18 12 18C12 18 14 16 14 12C14 8 12 4 12 4Z"
            fill="hsl(270 50% 15%)"
            opacity={0.9}
          />
          {/* Left petal */}
          <path
            d="M12 10C8 8 5 10 5 10C5 10 6 14 10 15C10 15 10 12 12 10Z"
            fill="hsl(270 50% 15%)"
            opacity={0.8}
          />
          {/* Right petal */}
          <path
            d="M12 10C16 8 19 10 19 10C19 10 18 14 14 15C14 15 14 12 12 10Z"
            fill="hsl(270 50% 15%)"
            opacity={0.8}
          />
          {/* Center dot */}
          <circle cx="12" cy="12" r="2" fill="hsl(270 50% 20%)" />
        </motion.svg>
      </motion.div>
    </div>
  );
};
