import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Play, Flame, Target, Music, Heart, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealingProgress } from '@/hooks/useHealingProgress';

interface HealingProgressCardProps {
  variant?: 'compact' | 'full';
}

export const HealingProgressCard: React.FC<HealingProgressCardProps> = ({ variant = 'compact' }) => {
  const { t } = useTranslation();
  const { progress, nextRecommendation, isLoading } = useHealingProgress();
  const tSafe = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-white/[0.02] border border-white/[0.06] animate-pulse">
        <div className="h-24 bg-muted/30 rounded-xl" />
      </Card>
    );
  }

  if (!progress) return null;

  const totalSessions = progress.totalMeditations + progress.totalMantras + progress.totalMusicSessions;
  
  // Calculate a simple "healing level" based on total sessions
  const healingLevel = Math.min(Math.floor(totalSessions / 5) + 1, 10);
  const progressToNextLevel = ((totalSessions % 5) / 5) * 100;

  if (variant === 'compact') {
    return (
      <Link to="/healing">
        <Card className="p-4 bg-white/[0.02] border border-white/[0.06] hover:border-[#D4AF37]/25 transition-all backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#D4AF37]/12 border border-[#D4AF37]/20">
                <Heart className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{tSafe('healing.journeyTitle', 'Your journey')}</h3>
                <p className="text-xs text-muted-foreground">{healingLevel === 1 ? tSafe('healing.initiationLevel', 'Initiation Level') : `${tSafe('healing.level', 'Level')} ${healingLevel}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-accent">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{progress.currentStreak}</span>
            </div>
          </div>
          
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-2">
            <div
              className="h-full rounded-full glowing-filament transition-all duration-500"
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalSessions} {tSafe('healing.sessionsCount', 'sessions')}</span>
            <span>{5 - (totalSessions % 5)} {tSafe('healing.toNextLevel', 'to next level')}</span>
          </div>
        </Card>
      </Link>
    );
  }

  // Full variant for Healing page
  return (
    <Card className="p-6 bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">{tSafe('healing.journeyTitle', 'Your journey')}</h2>
        <div className="flex items-center gap-2 bg-accent/20 rounded-full px-3 py-1">
          <Flame className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">{progress.currentStreak} {tSafe('healing.streakDays', 'day streak')}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-medium text-foreground">{healingLevel === 1 ? tSafe('healing.initiationLevel', 'Initiation Level') : `${tSafe('healing.level', 'Level')} ${healingLevel}`}</span>
          </div>
          <span className="text-sm text-muted-foreground">{progressToNextLevel.toFixed(0)}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full glowing-filament transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {5 - (totalSessions % 5)} {tSafe('healing.moreSessionsToLevel', 'more sessions to reach Level')} {healingLevel + 1}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold text-foreground">{progress.totalMeditations}</span>
          </div>
          <p className="text-xs text-muted-foreground">{tSafe('healing.meditationsLabel', 'Meditations')}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Music className="w-4 h-4 text-[#D4AF37]/90" />
            <span className="text-xl font-bold text-foreground">{progress.totalMantras}</span>
          </div>
          <p className="text-xs text-muted-foreground">{tSafe('healing.mantrasLabel', 'Mantras')}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold text-foreground">{progress.daysActive}</span>
          </div>
          <p className="text-xs text-muted-foreground">{tSafe('healing.daysActiveLabel', 'Days Active')}</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xl font-bold text-foreground">{progress.totalSHCEarned}</span>
          </div>
          <p className="text-xs text-muted-foreground">{tSafe('healing.shcEarnedLabel', 'SHC Earned')}</p>
        </div>
      </div>

      {nextRecommendation && (
        <div className="rounded-xl p-4 border border-[#D4AF37]/22 bg-gradient-to-br from-[#D4AF37]/10 via-[#D4AF37]/04 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-foreground">{tSafe('healing.recommendedNextLabel', 'Recommended Next')}</span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">{nextRecommendation.title}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            {nextRecommendation.duration != null && (
              <span>{t('healing.minutesShort', { count: nextRecommendation.duration, defaultValue: '{{count}} min' })}</span>
            )}
            {nextRecommendation.reward != null && (
              <span className="flex items-center gap-1 text-[#D4AF37]/90">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                {t('healing.shcRewardShort', { count: nextRecommendation.reward, defaultValue: '+{{count}} SHC' })}
              </span>
            )}
          </div>
          <Link to={nextRecommendation.type === 'meditation' ? '/meditations' : '/mantras'}>
            <Button variant="glass" size="sm" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              {tSafe('healing.startSessionButton', 'Start Session')}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};
