import React from 'react';
import { motion } from 'framer-motion';

interface SacredGeometryHeroProps {
  className?: string;
}

export const SacredGeometryHero: React.FC<SacredGeometryHeroProps> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Outer turquoise glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(185 100% 50% / 0.35) 0%, transparent 65%)',
          filter: 'blur(25px)',
        }}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary purple glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(271 76% 53% / 0.25) 0%, transparent 60%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Slow rotating Metatron's Cube / Sacred Geometry */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 15px hsl(185 100% 50% / 0.5))' }}
        >
          {/* Outer circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke="hsl(185 100% 50% / 0.25)"
            strokeWidth="0.5"
            animate={{
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Metatron's Cube - outer hexagon points */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const x = 100 + 75 * Math.cos((angle * Math.PI) / 180);
            const y = 100 + 75 * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.circle
                key={`outer-${angle}`}
                cx={x}
                cy={y}
                r="20"
                fill="none"
                stroke="hsl(185 100% 50% / 0.3)"
                strokeWidth="0.5"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
              />
            );
          })}

          {/* Inner hexagon connecting lines */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const x1 = 100 + 75 * Math.cos((angle * Math.PI) / 180);
            const y1 = 100 + 75 * Math.sin((angle * Math.PI) / 180);
            const nextAngle = (angle + 60) % 360;
            const x2 = 100 + 75 * Math.cos((nextAngle * Math.PI) / 180);
            const y2 = 100 + 75 * Math.sin((nextAngle * Math.PI) / 180);
            return (
              <motion.line
                key={`line-${angle}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(185 100% 50% / 0.2)"
                strokeWidth="0.5"
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
              />
            );
          })}

          {/* Center to outer connections */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const x = 100 + 75 * Math.cos((angle * Math.PI) / 180);
            const y = 100 + 75 * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.line
                key={`center-line-${angle}`}
                x1={100}
                y1={100}
                x2={x}
                y2={y}
                stroke="hsl(185 100% 50% / 0.15)"
                strokeWidth="0.5"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.1,
                }}
              />
            );
          })}

          {/* Inner circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="40"
            fill="none"
            stroke="hsl(185 100% 50% / 0.35)"
            strokeWidth="0.5"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>

      {/* Sacred Lotus SVG - center piece */}
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
          className="w-2/3 h-2/3"
          style={{ 
            filter: 'drop-shadow(0 0 20px hsl(185 100% 50% / 0.7))',
          }}
        >
          {/* Center lotus */}
          <g transform="translate(50, 50)">
            {/* Outer petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.path
                key={angle}
                d="M0,-32 C8,-22 8,-8 0,0 C-8,-8 -8,-22 0,-32"
                fill="hsl(185 100% 50% / 0.2)"
                stroke="hsl(185 100% 50% / 0.5)"
                strokeWidth="0.5"
                transform={`rotate(${angle})`}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
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
                d="M0,-20 C5,-14 5,-6 0,0 C-5,-6 -5,-14 0,-20"
                fill="hsl(185 100% 50% / 0.35)"
                stroke="hsl(185 100% 50% / 0.7)"
                strokeWidth="0.5"
                transform={`rotate(${angle})`}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
              />
            ))}
            
            {/* Center circle glow */}
            <motion.circle
              cx="0"
              cy="0"
              r="10"
              fill="hsl(185 100% 50% / 0.4)"
              stroke="hsl(185 100% 50%)"
              strokeWidth="1"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
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
              r="4"
              fill="hsl(185 100% 60%)"
              animate={{
                opacity: [0.8, 1, 0.8],
                scale: [1, 1.1, 1],
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
