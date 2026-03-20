import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface SomaHealingCoinPanelProps {
  shcAmount: number;
  showLearnLink?: boolean;
  className?: string;
}

/** Shared Sacred Soma / SHC gift visual — completion screen + Daily Sadhana dialog */
export const SomaHealingCoinPanel: React.FC<SomaHealingCoinPanelProps> = ({
  shcAmount,
  showLearnLink = true,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center text-center gap-3 ${className}`}
    >
      <div
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, rgba(255,235,180,0.35), rgba(212,175,55,0.12) 45%, rgba(0,0,0,0.2) 100%)',
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
      <p
        className="text-2xl font-semibold tabular-nums text-amber-300"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        +{shcAmount} SHC
      </p>
      <p className="text-xs italic text-muted-foreground leading-relaxed max-w-[280px]">
        {t(
          'dashboard.somaCoinGiftLine',
          'Your practice is sealed. This harmonic credit is yours — spend it in the sanctuary or hold it as resonance.'
        )}
      </p>
      {showLearnLink && (
        <Link
          to="/income-streams/shc-coin"
          className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 hover:text-amber-400 transition-colors pt-1"
        >
          {t('dashboard.somaCoinLearnMore', 'About Sacred Healing Coin →')}
        </Link>
      )}
    </motion.div>
  );
};
