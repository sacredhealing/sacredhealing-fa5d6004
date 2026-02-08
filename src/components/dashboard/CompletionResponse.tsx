import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFallbackRecommendations } from '@/lib/recommendationEngine';
import { SessionRecommendationCards } from './SessionRecommendationCards';
import type { CompletedSession } from '@/lib/recommendationEngine';

const REFLECTIONS = [
  "Well done. You've taken a step for your wellbeing.",
  "You showed up. That matters.",
  "Your practice is complete. Honor this moment.",
  "One breath at a time. You did it.",
];

const AFFIRMATIONS = [
  "I am present. I am enough.",
  "I choose peace. I choose clarity.",
  "I am worthy of rest and renewal.",
  "My practice nourishes my soul.",
];

const pickRandom = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

interface CompletionResponseProps {
  onDone: () => void;
  completedSession?: CompletedSession | null;
  /** Closing affirmation after continuation - emotional closure, no more prompts */
  variant?: 'standard' | 'closing';
}

export const CompletionResponse: React.FC<CompletionResponseProps> = ({
  onDone,
  completedSession,
  variant = 'standard',
}) => {
  const { t } = useTranslation();
  const reflection = variant === 'closing'
    ? t('dashboard.closingTitle', 'One breath at a time.')
    : pickRandom(REFLECTIONS);
  const affirmation = variant === 'closing'
    ? t('dashboard.closingQuote', 'I am present. I am enough.')
    : pickRandom(AFFIRMATIONS);

  const recommendations = useMemo(
    () => (variant === 'closing' ? [] : getFallbackRecommendations(completedSession ?? null)),
    [completedSession, variant]
  );

  const buttonLabel = variant === 'closing'
    ? t('dashboard.closingFinish', 'Finish')
    : t('dashboard.done', 'Done');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass-card p-6 sm:p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground mb-2">{reflection}</p>
            <p className="text-base text-amber-400/90 font-serif italic">
              "{affirmation}"
            </p>
          </div>

          {recommendations.length > 0 && (
            <SessionRecommendationCards recommendations={recommendations} />
          )}

          <Button onClick={onDone} className="w-full">
            {buttonLabel}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
