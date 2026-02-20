import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SriYantra } from './SriYantra';
import { Button } from '@/components/ui/button';

/**
 * Dark banner with glowing teal Sri Yantra.
 * When showRestCta: displays text, "Enter rest" button, and "Not now" link.
 */
interface SriYantraBannerProps {
  /** When true, show the rest CTA (text + Enter rest button + Not now) */
  showRestCta?: boolean;
  /** Called when user taps "Enter rest" or "Not now" */
  onSkipContinuation?: () => void;
}

export const SriYantraBanner: React.FC<SriYantraBannerProps> = ({
  showRestCta = false,
  onSkipContinuation,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-[#0a0a0a] border border-white/5 overflow-hidden px-6 py-8 sm:py-10 relative"
    >
      {/* Subtle teal glow around top */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-6 flex-shrink-0">
          <SriYantra
            variant="default"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(0, 242, 254, 0.6)) drop-shadow(0 0 40px rgba(0, 242, 254, 0.3))',
            }}
          />
        </div>

        {showRestCta && (
          <>
            <p className="text-white font-bold text-base sm:text-lg leading-relaxed mb-2">
              {t('guidance.eveningIntegration', 'Your mind is settling beneath the surface. Sleep will continue the process.')}
            </p>
            <p className="text-amber-500 sm:text-amber-400 text-sm sm:text-base font-medium mb-4">
              {t('guidance.eveningIntegrationSubtext', 'Tomorrow may begin differently.')}
            </p>
            <div className="flex flex-col items-center gap-2 w-full">
              <Button
                onClick={onSkipContinuation}
                className="w-full gap-2 bg-[#D4AF37] hover:bg-amber-500 text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-amber-400/50 px-6 py-3 text-sm"
              >
                {t('guidance.integrationButtonEvening', 'Enter rest')}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-sm text-foreground/90">
                {t('dashboard.continuationAnchorEvening', 'Tomorrow morning will begin softer.')}
              </p>
              <button
                type="button"
                onClick={onSkipContinuation}
                className="text-xs text-muted-foreground hover:text-foreground/80"
              >
                {t('common.notNow')}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
