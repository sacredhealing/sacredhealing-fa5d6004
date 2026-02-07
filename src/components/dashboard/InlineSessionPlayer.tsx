import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SacredBreathingGuide } from '@/components/breathing/SacredBreathingGuide';
import { DailyRitualCard } from '@/components/dashboard/DailyRitualCard';
import { useDailyJourney } from '@/hooks/useDailyJourney';
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
  sessionId,
  buttonLabel,
  onComplete,
  onBack,
}) => {
  const { getJourneyData } = useDailyJourney();
  const journey = getJourneyData();
  const prevCompletedRef = useRef<number | null>(null);

  const completedCount = [
    journey.morning.completed,
    journey.midday.completed,
    journey.evening.completed,
  ].filter(Boolean).length;

  // Detect ritual completion (only when count increases while in session)
  useEffect(() => {
    if (sessionType !== 'morning_ritual' && sessionType !== 'evening_reflection') return;
    if (prevCompletedRef.current === null) {
      prevCompletedRef.current = completedCount;
      return;
    }
    if (completedCount > prevCompletedRef.current) {
      prevCompletedRef.current = completedCount;
      onComplete();
    }
  }, [completedCount, sessionType, onComplete]);

  const isRitual =
    sessionType === 'morning_ritual' || sessionType === 'evening_reflection';

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header with back */}
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
        {sessionType === 'breathing_reset' && (
          <div className="space-y-4">
            <SacredBreathingGuide
              inhaleSeconds={4}
              exhaleSeconds={4}
              autoStart={false}
            />
            <Button
              className="w-full"
              onClick={onComplete}
              variant="default"
            >
              <Check className="w-4 h-4 mr-2" />
              I'm done
            </Button>
          </div>
        )}

        {isRitual && (
          <DailyRitualCard />
        )}

        {(sessionType === 'meditation' || sessionType === 'journal' || sessionType === 'path_day') && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {sessionType === 'meditation' && 'A brief breath practice to center yourself.'}
              {sessionType === 'journal' && 'A moment of mindful breathing before journaling.'}
              {sessionType === 'path_day' && 'Begin with a calming breath.'}
            </p>
            <SacredBreathingGuide
              inhaleSeconds={4}
              exhaleSeconds={4}
              autoStart={false}
            />
            <Button className="w-full" onClick={onComplete} variant="default">
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
