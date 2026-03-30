import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SacredBreathingGuideProps {
  inhaleSeconds?: number;
  exhaleSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

/** Faint rotating Sri Yantra (9 triangles + bindu) for inside the orb */
const SriYantraInOrb: React.FC = () => {
  const cx = 50;
  const cy = 50;
  const tan52 = 1.28;
  const downHeights = [26, 20, 14, 8, 2.5];
  const downTriangles = downHeights.map((h) => {
    const halfBase = h * tan52;
    return `M ${cx - halfBase},${cy - h} L ${cx + halfBase},${cy - h} L ${cx},${cy + h} Z`;
  });
  const upHeights = [22, 15, 9, 3];
  const upTriangles = upHeights.map((h) => {
    const halfBase = h * tan52;
    return `M ${cx - halfBase},${cy + h} L ${cx + halfBase},${cy + h} L ${cx},${cy - h} Z`;
  });
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={{ rotate: 360 }}
      transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
    >
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] opacity-[0.12]" preserveAspectRatio="xMidYMid meet">
        <g fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" strokeLinejoin="round">
          {downTriangles.map((d, i) => (
            <path key={`d-${i}`} d={d} />
          ))}
          {upTriangles.map((d, i) => (
            <path key={`u-${i}`} d={d} />
          ))}
        </g>
        <circle cx={cx} cy={cy} r="1.5" fill="rgba(255,255,255,0.3)" />
      </svg>
    </motion.div>
  );
};

export const SacredBreathingGuide: React.FC<SacredBreathingGuideProps> = ({
  inhaleSeconds = 4,
  exhaleSeconds = 4,
  onComplete,
  autoStart = false,
}) => {
  const [isActive, setIsActive] = useState(autoStart);
  const [phase, setPhase] = useState<'inhale' | 'exhale' | 'idle'>('idle');
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  const cycleDuration = (inhaleSeconds + exhaleSeconds) * 1000;

  const startBreathing = useCallback(() => {
    setIsActive(true);
    setPhase('inhale');
    setProgress(0);
    setCycleCount(0);
  }, []);

  const stopBreathing = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    setProgress(0);
  }, []);

  const resetBreathing = useCallback(() => {
    stopBreathing();
    setCycleCount(0);
  }, [stopBreathing]);

  useEffect(() => {
    if (!isActive) return;

    const totalDuration = cycleDuration;
    const inhaleEnd = (inhaleSeconds / (inhaleSeconds + exhaleSeconds)) * 100;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const cycleProgress = (elapsed % totalDuration) / totalDuration * 100;

      setProgress(cycleProgress);

      if (cycleProgress < inhaleEnd) {
        setPhase('inhale');
      } else {
        setPhase('exhale');
      }

      if (elapsed > 0 && elapsed % totalDuration < interval) {
        setCycleCount(prev => prev + 1);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, inhaleSeconds, exhaleSeconds, cycleDuration]);

  const orbScale = !isActive || phase === 'idle' ? 1 : phase === 'inhale' ? 1.5 : 1;
  const inhaleEnd = (inhaleSeconds / (inhaleSeconds + exhaleSeconds)) * 100;
  const phaseDuration = phase === 'inhale'
    ? (inhaleEnd / 100) * cycleDuration / 1000
    : ((100 - inhaleEnd) / 100) * cycleDuration / 1000;

  const sacredPrompt = {
    idle: 'Begin when ready',
    inhale: 'Awaken the Kundalini...',
    exhale: 'Release the Karma...',
  };

  return (
    <div className="relative flex flex-col items-center min-h-[420px]">
      {/* Particle field (gold dust / Ojas) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none -mx-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/40"
            style={{
              left: `${(i * 7 + 3) % 100}%`,
              bottom: '-10%',
            }}
            animate={{
              y: [0, -420],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 8 + (i % 4),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Deep Violet Glowing Orb + Sri Yantra */}
      <div className="relative flex items-center justify-center my-6">
        <motion.div
          className="relative w-56 h-56 rounded-full flex items-center justify-center"
          animate={{ scale: orbScale }}
          transition={{
            duration: phaseDuration,
            ease: 'easeInOut',
          }}
          style={{
            background: `
              radial-gradient(circle at 35% 35%,
                rgba(139, 92, 246, 0.5) 0%,
                rgba(88, 28, 135, 0.4) 40%,
                rgba(59, 7, 100, 0.5) 100%
              )
            `,
            boxShadow: '0 0 60px rgba(88, 28, 135, 0.6), 0 0 100px rgba(139, 92, 246, 0.3), inset 0 0 50px rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
          }}
        >
          <SriYantraInOrb />
        </motion.div>
      </div>

      {/* Sacred counter — serif prompts */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-serif text-purple-200 mb-1 h-8 flex items-center justify-center"
          style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
        >
          {sacredPrompt[phase]}
        </motion.p>
      </AnimatePresence>

      {isActive && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mb-4"
        >
          Cycle {cycleCount + 1}
        </motion.p>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!isActive ? (
          <Button
            onClick={startBreathing}
            className="bg-[#D4AF37] text-black font-semibold hover:bg-[#c4a030] animate-kriya-commence-pulse"
          >
            <Play className="w-4 h-4 mr-2" />
            Begin the Kriya
          </Button>
        ) : (
          <>
            <Button onClick={stopBreathing} variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button onClick={resetBreathing} variant="ghost" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </>
        )}
      </div>

      {/* Seal the Practice — discreet bottom */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 w-full flex justify-center"
        >
          <button
            type="button"
            onClick={stopBreathing}
            className="py-2.5 px-6 rounded-full border border-amber-500/30 text-amber-200/90 text-sm font-serif hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors"
            style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
          >
            Seal the Practice
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SacredBreathingGuide;
