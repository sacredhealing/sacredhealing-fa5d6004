import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SacredBreathingGuide } from '@/components/breathing/SacredBreathingGuide';
import { ChevronLeft, Check } from 'lucide-react';
import type { SessionType } from '@/hooks/useDailyGuidance';

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
  const isRitual = sessionType === 'morning_ritual' || sessionType === 'evening_reflection';
  const isBreathing = sessionType === 'breathing_reset';
  const isOther = sessionType === 'meditation' || sessionType === 'journal' || sessionType === 'path_day';

  const getDescription = () => {
    if (sessionType === 'meditation') return 'A brief breath practice to center yourself.';
    if (sessionType === 'journal') return 'A moment of mindful breathing before journaling.';
    if (sessionType === 'path_day') return 'Begin with a calming breath.';
    if (isRitual) return 'Breathe gently. When you feel ready, tap Done.';
    return 'Follow along, then tap Done when finished.';
  };

  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {buttonLabel || 'Your practice'}
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
              {isBreathing ? "I'm done" : 'Done'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
