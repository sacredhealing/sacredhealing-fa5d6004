import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BreathingGuideProps {
  bpm: number | null;
}

export const BreathingGuide: React.FC<BreathingGuideProps> = ({ bpm }) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);

  const inhaleDuration = 4;
  const holdDuration = 2;
  const exhaleDuration = bpm && bpm > 80 ? 6 : 4;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const runCycle = () => {
      setPhase('inhale');
      timer = setTimeout(() => {
        setPhase('hold');
        timer = setTimeout(() => {
          setPhase('exhale');
          timer = setTimeout(() => {
            setCycleCount(c => c + 1);
            runCycle();
          }, exhaleDuration * 1000);
        }, holdDuration * 1000);
      }, inhaleDuration * 1000);
    };

    runCycle();

    return () => clearTimeout(timer);
  }, [exhaleDuration]);

  return (
    <div className="flex flex-col items-center gap-12 p-8 rounded-[32px] border border-white/10 bg-white/[0.02] max-w-md w-full mx-auto overflow-hidden backdrop-blur-xl">
      <div className="relative flex items-center justify-center w-64 h-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ scale: phase === 'inhale' ? 0.6 : phase === 'hold' ? 1.2 : 1.2, opacity: 0.3 }}
            animate={{
              scale: phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.2 : 0.6,
              opacity: phase === 'hold' ? 0.8 : 0.5,
            }}
            transition={{
              duration: phase === 'inhale' ? inhaleDuration : phase === 'hold' ? holdDuration : exhaleDuration,
              ease: 'easeInOut',
            }}
            className="absolute w-full h-full rounded-full bg-gradient-to-br from-[#FF6B4A]/40 to-[#5AE4A8]/40 blur-xl"
          />
        </AnimatePresence>

        <motion.div
          animate={{
            scale: phase === 'inhale' ? 1.1 : phase === 'hold' ? 1.1 : 0.7,
          }}
          transition={{
            duration: phase === 'inhale' ? inhaleDuration : phase === 'hold' ? holdDuration : exhaleDuration,
            ease: 'easeInOut',
          }}
          className="relative z-10 w-48 h-48 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          <Wind className="text-white/40 mb-2" size={32} />
          <span className="text-2xl font-serif font-light tracking-widest uppercase text-white/90">
            {t(`digitalNadi.breathingPhases.${phase}`)}
          </span>
        </motion.div>

        <div className="absolute w-full h-full rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" style={{ animation: 'spin 20s linear infinite' }} />
        <div className="absolute w-[110%] h-[110%] rounded-full border border-white/5" style={{ animation: 'spin 30s linear infinite reverse' }} />
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-serif italic text-white/80">
          {bpm && bpm > 80 ? t('digitalNadi.breathingGuide.calming') : t('digitalNadi.breathingGuide.balanced')}
        </h3>
        <p className="text-sm text-white/40 font-light max-w-[240px]">
          {phase === 'inhale' && t('digitalNadi.breathingGuide.inhaleHint')}
          {phase === 'hold' && t('digitalNadi.breathingGuide.holdHint')}
          {phase === 'exhale' && t('digitalNadi.breathingGuide.exhaleHint')}
        </p>
      </div>

      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${i < (cycleCount % 6) ? 'bg-[#FF6B4A]' : 'bg-white/10'}`}
          />
        ))}
      </div>
    </div>
  );
};
