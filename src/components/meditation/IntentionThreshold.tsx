import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserDailyState } from '@/hooks/useUserDailyState';

export type IntentionType = 'peace' | 'healing' | 'release' | 'focus' | 'anxiety';

export interface IntentionWeeklyContext {
  last7DaysSessions: number;
  userState: UserDailyState;
  todaySessions: number;
  dayPhaseLabel: string;
}

interface IntentionThresholdProps {
  isOpen: boolean;
  onSelectIntention: (intention: IntentionType) => void;
  onClose: () => void;
  /** Optional: 7-day Prema-Pulse field (display only; does not change playback logic). */
  weeklyContext?: IntentionWeeklyContext | null;
}

const INTENTION_IDS: IntentionType[] = ['peace', 'healing', 'release', 'focus', 'anxiety'];

export const IntentionThreshold: React.FC<IntentionThresholdProps> = ({
  isOpen,
  onSelectIntention,
  onClose,
  weeklyContext,
}) => {
  const { t } = useTranslation();
  const [selectedIntention, setSelectedIntention] = useState<IntentionType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const particleSeed = useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return [...Array(18)].map((_, i) => ({
      key: i,
      x: ((i * 47) % 100 / 100) * w,
      y: ((i * 73) % 100 / 100) * h,
      scale: 0.4 + (i % 5) * 0.12,
      dur: 2.5 + (i % 4) * 0.9,
      delay: (i % 6) * 0.35,
    }));
  }, []);

  const handleSelect = (intention: IntentionType) => {
    setSelectedIntention(intention);
    setIsTransitioning(true);

    setTimeout(() => {
      onSelectIntention(intention);
      setTimeout(() => {
        setSelectedIntention(null);
        setIsTransitioning(false);
      }, 300);
    }, 1200);
  };

  const selectedLabel = selectedIntention
    ? t(`meditations.intention.${selectedIntention}`)
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ backgroundColor: 'rgba(5, 5, 5, 0.94)' }}
            animate={{
              backgroundColor: isTransitioning
                ? 'rgba(5, 5, 5, 0.97)'
                : 'rgba(5, 5, 5, 0.94)',
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            animate={{
              background: isTransitioning
                ? 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212,175,55,0.14) 0%, transparent 65%)'
                : 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(212,175,55,0.06) 0%, transparent 55%)',
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particleSeed.map((p) => (
              <motion.div
                key={p.key}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  background: 'rgba(212, 175, 55, 0.35)',
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.4)',
                }}
                initial={{ scale: p.scale, opacity: 0.25 }}
                animate={{
                  y: [0, -120 - p.key * 4],
                  opacity: [0.2, 0],
                }}
                transition={{
                  duration: p.dur,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          <motion.div
            className="relative z-10 flex w-full max-w-lg flex-col items-center"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            <motion.div
              className="w-full rounded-[40px] border border-white/[0.05] bg-white/[0.02] px-7 py-9 shadow-[0_0_48px_rgba(212,175,55,0.07)] backdrop-blur-[40px] [-webkit-backdrop-filter:blur(40px)]"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: isTransitioning ? 0 : 1, scale: isTransitioning ? 0.98 : 1 }}
              transition={{ delay: 0.2, duration: 0.45 }}
            >
              <div className="text-center mb-8">
                <Sparkles
                  className="mx-auto mb-4 h-8 w-8 text-[#D4AF37]"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.35))' }}
                  aria-hidden
                />
                <h2
                  className="mb-2 text-2xl font-black tracking-[-0.05em] text-white md:text-3xl"
                  style={{ textShadow: '0 0 20px rgba(212,175,55,0.15)' }}
                >
                  {t('meditations.intentionThreshold.title')}
                </h2>
                <p className="text-sm leading-[1.6] text-white/60">
                  {t('meditations.intentionThreshold.subtitle')}
                </p>
              </div>

              {weeklyContext && (
                <div className="mb-8 rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
                  <div className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]/55">
                    {t('meditations.intentionThreshold.weeklyMicro')}
                  </div>
                  <p className="text-xs leading-relaxed text-white/55">
                    {t('meditations.intentionThreshold.weeklyLine', {
                      phase: weeklyContext.dayPhaseLabel,
                      count: weeklyContext.last7DaysSessions,
                      today: weeklyContext.todaySessions,
                      state: t(`meditations.userDailyState.${weeklyContext.userState}`),
                    })}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3">
                {INTENTION_IDS.map((id, index) => (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + index * 0.06, duration: 0.35 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative min-w-[140px] rounded-[40px] border border-white/[0.08] bg-white/[0.02] px-6 py-3.5 text-base font-semibold tracking-tight text-white/90 shadow-[0_0_0_0_rgba(212,175,55,0)] backdrop-blur-[40px] transition-all duration-300 [-webkit-backdrop-filter:blur(40px)] hover:border-[rgba(212,175,55,0.35)] hover:shadow-[0_0_28px_rgba(212,175,55,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/45"
                  >
                    <span
                      className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-br from-[rgba(212,175,55,0.12)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden
                    />
                    <span className="relative z-10">{t(`meditations.intention.${id}`)}</span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                type="button"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: isTransitioning ? 0 : 0.55 }}
                transition={{ delay: 0.65, duration: 0.3 }}
                whileHover={{ opacity: 1 }}
                className="mt-8 w-full text-center text-sm text-white/50 underline decoration-white/25 underline-offset-4 transition-colors hover:text-[#D4AF37] hover:decoration-[#D4AF37]/50"
              >
                {t('meditations.intentionThreshold.skip')}
              </motion.button>
            </motion.div>

            <AnimatePresence>
              {isTransitioning && selectedIntention && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
                >
                  <div className="w-full max-w-md rounded-[40px] border border-[rgba(212,175,55,0.25)] bg-[#050505]/90 px-8 py-10 text-center shadow-[0_0_48px_rgba(212,175,55,0.2)] backdrop-blur-xl">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                    >
                      <Sparkles
                        className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]"
                        style={{ filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.45))' }}
                        aria-hidden
                      />
                    </motion.div>
                    <h3
                      className="font-black tracking-[-0.05em] text-[#D4AF37] text-2xl md:text-3xl"
                      style={{ textShadow: '0 0 18px rgba(212,175,55,0.35)' }}
                    >
                      {selectedLabel}
                    </h3>
                    <p className="mt-3 text-sm text-white/60">
                      {t('meditations.intentionThreshold.preparing')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntentionThreshold;
