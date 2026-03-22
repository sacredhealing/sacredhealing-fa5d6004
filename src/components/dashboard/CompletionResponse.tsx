import React, { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFallbackRecommendations } from '@/lib/recommendationEngine';
import { SessionRecommendationCards } from './SessionRecommendationCards';
import { SomaHealingCoinPanel } from './SomaHealingCoinPanel';
import type { CompletedSession } from '@/lib/recommendationEngine';

const REFLECTION_KEYS = [
  'dashboard.completionReflection1',
  'dashboard.completionReflection2',
  'dashboard.completionReflection3',
  'dashboard.completionReflection4',
] as const;

const AFFIRMATION_KEYS = [
  'dashboard.completionAffirmation1',
  'dashboard.completionAffirmation2',
  'dashboard.completionAffirmation3',
  'dashboard.completionAffirmation4',
] as const;

const pickRandom = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

interface CompletionResponseProps {
  onDone: () => void;
  completedSession?: CompletedSession | null;
  /** Closing affirmation after continuation - emotional closure, no more prompts */
  variant?: 'standard' | 'closing';
  /** Sacred Healing Coin (SHC) credited for this daily-practice completion */
  shcGift?: number | null;
}

export const CompletionResponse: React.FC<CompletionResponseProps> = ({
  onDone,
  completedSession,
  variant = 'standard',
  shcGift = null,
}) => {
  const { t } = useTranslation();
  const reflection = variant === 'closing'
    ? t('dashboard.closingTitle')
    : t(pickRandom(REFLECTION_KEYS));
  const affirmation = variant === 'closing'
    ? t('dashboard.closingQuote')
    : t(pickRandom(AFFIRMATION_KEYS));

  const recommendations = useMemo(
    () => (variant === 'closing' ? [] : getFallbackRecommendations(completedSession ?? null)),
    [completedSession, variant]
  );

  const buttonLabel = variant === 'closing'
    ? t('dashboard.closingFinish')
    : t('dashboard.done');

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

          {variant === 'standard' && shcGift != null && shcGift > 0 && (
            <div className="w-full rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.12] to-amber-950/20 px-5 py-5 shadow-[0_0_28px_rgba(212,175,55,0.08)]">
              <SomaHealingCoinPanel shcAmount={shcGift} />
            </div>
          )}

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
