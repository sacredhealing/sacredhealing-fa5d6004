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

// Sacred Geometry SVG - Flower of Life pattern
const SacredGeometryIcon: React.FC<{ glowing: boolean; scale: number }> = ({ glowing, scale }) => {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-20 h-20"
      animate={{ 
        scale,
        filter: glowing ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))' : 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.3))',
      }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Central circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-purple-400"
        animate={{ opacity: glowing ? 1 : 0.6 }}
      />
      
      {/* Six surrounding circles (Flower of Life pattern) */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const x = 50 + 15 * Math.cos((angle * Math.PI) / 180);
        const y = 50 + 15 * Math.sin((angle * Math.PI) / 180);
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-purple-400"
            animate={{ 
              opacity: glowing ? 1 : 0.5,
              strokeWidth: glowing ? 1.5 : 1,
            }}
            transition={{ delay: i * 0.05 }}
          />
        );
      })}
      
      {/* Outer ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        className="text-purple-300"
        animate={{ opacity: glowing ? 0.8 : 0.3 }}
      />
      
      {/* Inner hexagon */}
      <motion.polygon
        points="50,35 62.99,42.5 62.99,57.5 50,65 37.01,57.5 37.01,42.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-violet-400"
        animate={{ 
          opacity: glowing ? 1 : 0.4,
          scale: glowing ? 1 : 0.95,
        }}
        style={{ transformOrigin: 'center' }}
      />
      
      {/* Center dot */}
      <motion.circle
        cx="50"
        cy="50"
        r="3"
        className="text-white"
        fill="currentColor"
        animate={{ 
          opacity: glowing ? 1 : 0.6,
          scale: glowing ? 1.2 : 1,
        }}
        style={{ transformOrigin: 'center' }}
      />
    </motion.svg>
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
    const interval = 50; // Update every 50ms for smooth animation
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
      
      // Count cycles
      if (elapsed > 0 && elapsed % totalDuration < interval) {
        setCycleCount(prev => prev + 1);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, inhaleSeconds, exhaleSeconds, cycleDuration]);

  // Calculate circle scale based on phase and progress
  const getCircleScale = () => {
    if (!isActive || phase === 'idle') return 1;
    
    const inhaleEnd = (inhaleSeconds / (inhaleSeconds + exhaleSeconds)) * 100;
    
    if (phase === 'inhale') {
      // Expand from 1 to 1.4 during inhale
      const inhaleProgress = progress / inhaleEnd;
      return 1 + (inhaleProgress * 0.4);
    } else {
      // Contract from 1.4 to 1 during exhale
      const exhaleProgress = (progress - inhaleEnd) / (100 - inhaleEnd);
      return 1.4 - (exhaleProgress * 0.4);
    }
  };

  const circleScale = getCircleScale();
  const isGlowing = phase === 'inhale';

  const phaseText = {
    idle: 'Begin when ready',
    inhale: 'Breathe In...',
    exhale: 'Breathe Out...',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Main Breathing Circle */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer glow rings */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, 
              hsla(270, 60%, 50%, ${isGlowing ? 0.15 : 0.05}) 0%, 
              transparent 70%
            )`,
          }}
          animate={{
            scale: circleScale * 1.5,
            opacity: isGlowing ? 1 : 0.5,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        
        {/* Main pulsing circle */}
        <motion.div
          className="relative w-56 h-56 rounded-full flex items-center justify-center"
          animate={{
            scale: circleScale,
          }}
          transition={{ 
            duration: phase === 'inhale' ? inhaleSeconds : exhaleSeconds,
            ease: 'easeInOut',
          }}
          style={{
            background: `
              radial-gradient(circle at 30% 30%, 
                hsla(280, 70%, 60%, 0.3) 0%, 
                hsla(260, 60%, 40%, 0.2) 50%, 
                hsla(250, 50%, 25%, 0.3) 100%
              )
            `,
            boxShadow: isGlowing 
              ? '0 0 60px rgba(168, 85, 247, 0.4), inset 0 0 40px rgba(168, 85, 247, 0.2)'
              : '0 0 30px rgba(168, 85, 247, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          {/* Sacred Geometry Icon */}
          <SacredGeometryIcon glowing={isGlowing} scale={isGlowing ? 1.1 : 1} />
        </motion.div>

        {/* Rotating outer ring */}
        <motion.div
          className="absolute w-64 h-64 rounded-full border border-purple-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            borderStyle: 'dashed',
          }}
        />
      </div>

      {/* Phase Text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-medium text-purple-200 mb-2 h-7"
        >
          {phaseText[phase]}
        </motion.p>
      </AnimatePresence>

      {/* Cycle counter */}
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
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Breathing
          </Button>
        ) : (
          <>
            <Button onClick={stopBreathing} variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button onClick={resetBreathing} variant="ghost">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </>
        )}
      </div>

      {/* Timing info */}
      <p className="text-xs text-muted-foreground mt-4">
        {inhaleSeconds}s inhale · {exhaleSeconds}s exhale
      </p>
    </div>
  );
};

export default SacredBreathingGuide;
