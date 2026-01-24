import React from 'react';
import { motion } from 'framer-motion';

interface SacredGeometryHeroProps {
  className?: string;
}

export const SacredGeometryHero: React.FC<SacredGeometryHeroProps> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--secondary) / 0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner glow ring */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 10px hsl(var(--secondary) / 0.5))' }}
        >
          {/* Outer circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="hsl(var(--secondary) / 0.3)"
            strokeWidth="1"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Inner decorative circles */}
          <motion.circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="hsl(var(--secondary) / 0.4)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        </svg>
      </motion.div>

      {/* Sacred Lotus SVG */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-full h-full"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4"
          style={{ 
            filter: 'drop-shadow(0 0 15px hsl(var(--secondary) / 0.6))',
          }}
        >
          {/* Center lotus */}
          <g transform="translate(50, 50)">
            {/* Outer petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.path
                key={angle}
                d="M0,-35 C10,-25 10,-10 0,0 C-10,-10 -10,-25 0,-35"
                fill="hsl(var(--secondary) / 0.3)"
                stroke="hsl(var(--secondary) / 0.6)"
                strokeWidth="0.5"
                transform={`rotate(${angle})`}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
              />
            ))}
            
            {/* Inner petals */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
              <motion.path
                key={angle}
                d="M0,-22 C6,-16 6,-8 0,0 C-6,-8 -6,-16 0,-22"
                fill="hsl(var(--secondary) / 0.5)"
                stroke="hsl(var(--secondary) / 0.8)"
                strokeWidth="0.5"
                transform={`rotate(${angle})`}
                animate={{
                  opacity: [0.5, 0.9, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
              />
            ))}
            
            {/* Center circle */}
            <motion.circle
              cx="0"
              cy="0"
              r="8"
              fill="hsl(var(--secondary) / 0.6)"
              stroke="hsl(var(--secondary))"
              strokeWidth="1"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Inner bright core */}
            <motion.circle
              cx="0"
              cy="0"
              r="3"
              fill="hsl(var(--secondary))"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        </motion.svg>
      </motion.div>
    </div>
  );
};
