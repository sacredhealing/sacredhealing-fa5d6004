import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SacredBreathingGuide } from '@/components/breathing/SacredBreathingGuide';
import { ChevronLeft, Check } from 'lucide-react';
import type { SessionType } from '@/hooks/useDailyGuidance';
import { useTranslation } from '@/hooks/useTranslation';

interface InlineSessionPlayerProps {
  sessionType: SessionType;
  sessionId: string;
  buttonLabel?: string;
  onComplete: () => void;
  onBack?: () => void;
}

export const InlineSessionPlayer: React.FC<InlineSessionPlayerProps> = ({
  sessionType,
  buttonLabel,
  onComplete,
  onBack,
}) => {
  const { t } = useTranslation();
  const isRitual = sessionType === 'morning_ritual' || sessionType === 'evening_reflection';
  const isBreathing = sessionType === 'breathing_reset';
  const isOther = sessionType === 'meditation' || sessionType === 'journal' || sessionType === 'path_day';

  const getDescription = () => {
    if (sessionType === 'meditation') return t('dashboard.inlineDescMeditation');
    if (sessionType === 'journal') return t('dashboard.inlineDescJournal');
    if (sessionType === 'path_day') return t('dashboard.inlineDescPathDay');
    if (isRitual) return t('dashboard.inlineDescRitual');
    return t('dashboard.inlineDescDefault');
  };

  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            {t('dashboard.inlineBack')}
          </Button>
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {buttonLabel || t('dashboard.inlinePracticeFallback')}
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {(isBreathing || isRitual || isOther) && (
          <div className="space-y-4">
            {!isBreathing && (
              <p className="text-sm text-muted-foreground text-center">
                {getDescription()}
              </p>
            )}
            <SacredBreathingGuide
              inhaleSeconds={4}
              exhaleSeconds={4}
              autoStart={false}
            />
            <Button className="w-full" onClick={onComplete} variant="default">
              <Check className="w-4 h-4 mr-2" />
              {isBreathing ? t('dashboard.inlineDoneBreathing') : t('dashboard.inlineDone')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
