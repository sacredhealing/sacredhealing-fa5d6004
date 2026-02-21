import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SriYantra } from './SriYantra';
import { Button } from '@/components/ui/button';

interface SriYantraBannerProps {
  showRestCta?: boolean;
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
      className="rounded-2xl bg-[#0a0a0a] border border-white/5 overflow-hidden relative"
    >
      {/* Teal glow */}
      <div
        className="absolute top-0 left-0 right-0 h-2/3 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0, 242, 254, 0.18) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Sri Yantra — large, nearly full width */}
        <div className="w-72 h-72 sm:w-80 sm:h-80 mx-auto pt-4">
          <SriYantra
            variant="default"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 0 24px rgba(0, 242, 254, 0.65)) drop-shadow(0 0 48px rgba(0, 242, 254, 0.3))',
            }}
          />
        </div>

        {/* Text directly under yantra, no gap */}
        {showRestCta && (
          <div className="px-6 pb-7 pt-3 w-full">
            <p className="text-white font-bold text-base sm:text-lg leading-relaxed mb-1.5">
              {t('guidance.eveningIntegration', 'Your mind is settling beneath the surface. Sleep will continue the process.')}
            </p>
            <p className="text-amber-500 sm:text-amber-400 text-sm sm:text-base font-medium mb-5">
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
          </div>
        )}
      </div>
    </motion.div>
  );
};
