import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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

          {variant === 'standard' && shcGift != null && shcGift > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="w-full rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.12] to-amber-950/20 px-5 py-5 shadow-[0_0_28px_rgba(212,175,55,0.08)]"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 25%, rgba(255,235,180,0.35), rgba(212,175,55,0.12) 45%, rgba(0,0,0,0.2) 100%)',
                    border: '1px solid rgba(212,175,55,0.45)',
                    boxShadow: '0 0 20px rgba(212,175,55,0.25), inset 0 0 12px rgba(255,255,255,0.06)',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <polygon
                      points="12,2 14.5,9 22,9 16,14 18.5,21 12,17 5.5,21 8,14 2,9 9.5,9"
                      stroke="rgba(212,175,55,0.95)"
                      strokeWidth="1.35"
                      strokeLinejoin="round"
                      fill="rgba(212,175,55,0.14)"
                    />
                    <circle cx="12" cy="12" r="2.2" fill="rgba(255,248,220,0.95)" />
                  </svg>
                  <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-400/90" />
                </div>
                <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.28em] text-amber-500/85">
                  {t('dashboard.sacredSomaHealingCoin', 'Sacred Soma Healing Coin')}
                </p>
                <p className="text-2xl font-semibold tabular-nums text-amber-300" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  +{shcGift} SHC
                </p>
                <p className="text-xs italic text-muted-foreground leading-relaxed max-w-[260px]">
                  {t(
                    'dashboard.somaCoinGiftLine',
                    'Your practice is sealed. This harmonic credit is yours — spend it in the sanctuary or hold it as resonance.'
                  )}
                </p>
                <Link
                  to="/income-streams/shc-coin"
                  className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 hover:text-amber-400 transition-colors"
                >
                  {t('dashboard.somaCoinLearnMore', 'About Sacred Healing Coin →')}
                </Link>
              </div>
            </motion.div>
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
