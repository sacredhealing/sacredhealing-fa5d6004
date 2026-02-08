import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSacredFlame } from '@/hooks/useSacredFlame';
import { useTranslation } from 'react-i18next';

export const HealingJourneysCard: React.FC = () => {
  const { t } = useTranslation();
  const { brightness, streakDays, isLoading } = useSacredFlame();

  const getFlameStatus = () => {
    if (brightness >= 0.8) return { textKey: 'journeys.blazingBright', color: 'text-amber-400' };
    if (brightness >= 0.5) return { textKey: 'journeys.glowingStrong', color: 'text-orange-400' };
    if (brightness >= 0.3) return { textKey: 'journeys.gentlyBurning', color: 'text-yellow-400' };
    return { textKey: 'journeys.needsKindling', color: 'text-muted-foreground' };
  };

  const flameStatus = getFlameStatus();

  return (
    <Card className="glass-card p-5 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">
            {t('journeys.soulTitle')}
          </h3>
        </div>
        <Link 
          to="/healing" 
          className="text-xs text-[#00F2FE] hover:text-[#00F2FE]/80 flex items-center gap-1 transition-colors"
        >
          {t('journeys.all')} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Sacred Flame Status Card */}
      <Link to="/healing/my-sacred-flame">
        <motion.div
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20 border border-amber-500/30 p-4 hover:border-amber-500/50 transition-all group"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-4">
            {/* Animated Flame */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, hsla(35, 100%, 60%, ${brightness * 0.4}) 0%, transparent 70%)`,
                  width: '64px',
                  height: '64px',
                  left: '-8px',
                  top: '-8px',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-b from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">{t('journeys.mySacredFlame')}</h4>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${flameStatus.color}`}>
                  {isLoading ? '...' : t(flameStatus.textKey)}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {streakDays} {t('journeys.dayStreak')}
                </span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </div>
        </motion.div>
      </Link>

      {/* Quickie Reset Card */}
      <Link to="/breathing?quick=true">
        <motion.div
          className="flex items-center gap-3 rounded-[16px] bg-white/[0.02] border border-white/10 p-4 hover:border-[#00F2FE]/40 hover:bg-white/[0.04] transition-all group"
          whileHover={{ scale: 1.01 }}
        >
          <div className="p-3 rounded-full bg-[#00F2FE]/20 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-[#00F2FE]" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground text-sm">{t('journeys.quickieReset')}</h4>
            <p className="text-xs text-muted-foreground">{t('journeys.quickieResetDesc')}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </motion.div>
      </Link>
    </Card>
  );
};
