import React from 'react';
import { motion } from 'framer-motion';
import { useSacredFlame } from '@/hooks/useSacredFlame';
import { useTranslation } from 'react-i18next';

interface SacredFlameProps {
  className?: string;
}

export const SacredFlame: React.FC<SacredFlameProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { brightness, scale, isLoading, streakDays } = useSacredFlame();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 ${className}`}>
        <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
        <div className="w-6 h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Dynamic glow intensity based on brightness
  const glowIntensity = brightness * 40;
  const innerGlowIntensity = brightness * 20;

  return (
    <div className={`flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 ${className}`}>
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ scale }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Outer glow aura */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, hsla(35, 100%, 60%, ${brightness * 0.4}) 0%, transparent 70%)`,
            filter: `blur(${glowIntensity * 0.3}px)`,
            width: '40px',
            height: '40px',
            left: '-10px',
            top: '-10px',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [brightness * 0.6, brightness * 0.8, brightness * 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Inner glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, hsla(30, 100%, 70%, ${brightness * 0.6}) 0%, transparent 60%)`,
            filter: `blur(${innerGlowIntensity * 0.2}px)`,
            width: '28px',
            height: '28px',
            left: '-4px',
            top: '-4px',
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />

        {/* Sacred Flame SVG with soft golden pulse */}
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 ${glowIntensity}px hsla(35, 100%, 55%, ${brightness}))`,
          }}
          animate={{
            y: [0, -1, 0],
            filter: [
              `drop-shadow(0 0 ${glowIntensity}px hsla(35, 100%, 55%, ${brightness})) drop-shadow(0 0 8px hsla(45, 100%, 60%, 0.4))`,
              `drop-shadow(0 0 ${glowIntensity * 1.3}px hsla(35, 100%, 55%, ${brightness})) drop-shadow(0 0 15px hsla(45, 100%, 65%, 0.6))`,
              `drop-shadow(0 0 ${glowIntensity}px hsla(35, 100%, 55%, ${brightness})) drop-shadow(0 0 8px hsla(45, 100%, 60%, 0.4))`,
            ],
          }}
          transition={{
            y: {
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            filter: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          {/* Outer flame */}
          <motion.path
            d="M12 2C12 2 8 7 8 11C8 14 9.5 16 11 17C10 16 9.5 14.5 10 13C10 13 11 14.5 13 14.5C15 14.5 16 13 16 11C16 9 14 7 14 7C14 7 15 9 14.5 10.5C14 12 13 12.5 12.5 12C12 11.5 12.5 10 12.5 10C12.5 10 11 11.5 11 13C11 14.5 12 15.5 13 16C14 16.5 15 16 15.5 15C16 14 16 13 16 11C16 7 12 2 12 2Z"
            fill={`hsla(35, 100%, ${50 + brightness * 20}%, ${brightness})`}
            animate={{
              scale: [1, 1.05, 1],
              fill: [
                `hsla(35, 100%, ${50 + brightness * 20}%, ${brightness})`,
                `hsla(45, 100%, ${55 + brightness * 20}%, ${brightness * 1.1})`,
                `hsla(35, 100%, ${50 + brightness * 20}%, ${brightness})`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Inner bright core */}
          <motion.path
            d="M12 8C12 8 10.5 10 10.5 12C10.5 13.5 11 14.5 12 15C13 14.5 13.5 13.5 13.5 12C13.5 10 12 8 12 8Z"
            fill={`hsla(45, 100%, ${60 + brightness * 25}%, ${brightness * 1.2})`}
            animate={{
              opacity: [brightness, brightness * 1.15, brightness],
              fill: [
                `hsla(45, 100%, ${60 + brightness * 25}%, ${brightness * 1.2})`,
                `hsla(50, 100%, ${70 + brightness * 20}%, ${brightness * 1.3})`,
                `hsla(45, 100%, ${60 + brightness * 25}%, ${brightness * 1.2})`,
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Central bright spot */}
          <motion.ellipse
            cx="12"
            cy="12"
            rx="1"
            ry="1.5"
            fill={`hsla(50, 100%, 85%, ${brightness})`}
            animate={{
              opacity: [brightness * 0.8, brightness, brightness * 0.8],
              scale: [0.9, 1.2, 0.9],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.svg>
      </motion.div>

      {/* Streak display */}
      <div className="flex items-center gap-1.5">
        <motion.span
          className="font-heading font-semibold text-foreground"
          style={{
            textShadow: brightness > 0.7 
              ? `0 0 ${brightness * 10}px hsla(35, 100%, 60%, ${brightness * 0.5})` 
              : 'none',
          }}
          animate={{
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {streakDays}
        </motion.span>
        <span className="text-sm text-muted-foreground">{t('dashboard.streak')}</span>
      </div>
    </div>
  );
};
