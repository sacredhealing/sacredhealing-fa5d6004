import React, { useMemo } from 'react';
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
}

export const CompletionResponse: React.FC<CompletionResponseProps> = ({
  onDone,
  completedSession,
}) => {
  const reflection = pickRandom(REFLECTIONS);
  const affirmation = pickRandom(AFFIRMATIONS);

  const recommendations = useMemo(
    () => getFallbackRecommendations(completedSession ?? null),
    [completedSession]
  );

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

          <SessionRecommendationCards recommendations={recommendations} />

          <Button onClick={onDone} className="w-full">
            Done
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
