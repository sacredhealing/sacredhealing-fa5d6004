import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SriYantra } from './SriYantra';

/**
 * Dark banner with glowing teal Sri Yantra and evening integration message.
 * "Your mind is settling beneath the surface. Sleep will continue the process."
 * "Tomorrow may begin differently."
 */
export const SriYantraBanner: React.FC = () => {
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

        <p className="text-white font-bold text-base sm:text-lg leading-relaxed mb-2">
          {t('guidance.eveningIntegration', 'Your mind is settling beneath the surface. Sleep will continue the process.')}
        </p>
        <p className="text-amber-500 sm:text-amber-400 text-sm sm:text-base font-medium">
          {t('guidance.eveningIntegrationSubtext', 'Tomorrow may begin differently.')}
        </p>
      </div>
    </motion.div>
  );
};
