import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** Breaking the Seal — Golden wax seal melting / temple door opening animation for post-purchase reveal. */
export interface CheckoutProps {
  onComplete?: () => void;
  durationMs?: number;
}

const Checkout: React.FC<CheckoutProps> = ({ onComplete, durationMs = 3500 }) => {
  const [phase, setPhase] = useState<'seal' | 'melting' | 'open'>('seal');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('melting'), 800);
    const t2 = setTimeout(() => setPhase('open'), 2200);
    const t3 = setTimeout(() => onComplete?.(), durationMs);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete, durationMs]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
      <AnimatePresence mode="wait">
        {phase === 'seal' && (
          <motion.div
            key="seal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="w-28 h-28 rounded-full border-4 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37] via-amber-700 to-[#8B6914] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.5)]"
              animate={{ boxShadow: ['0 0 40px rgba(212,175,55,0.5)', '0 0 60px rgba(212,175,55,0.7)', '0 0 40px rgba(212,175,55,0.5)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-5xl text-[#0a0a0a] font-bold">ॐ</span>
            </motion.div>
            <p className="mt-6 text-[#D4AF37] text-sm uppercase tracking-[0.3em]">Sacred Seal</p>
          </motion.div>
        )}
        {phase === 'melting' && (
          <motion.div
            key="melting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
              animate={{ scale: 1.2, opacity: 0.7 }}
              transition={{ duration: 1.2 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] via-amber-700 to-[#8B6914] rounded-full"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.9, 0.6, 0.2],
                  borderRadius: ['50%', '45%', '30%'],
                }}
                transition={{ duration: 1.2 }}
              />
              <span className="relative z-10 text-4xl text-[#0a0a0a]/80">ॐ</span>
            </motion.div>
            <motion.p
              className="mt-6 text-[#D4AF37] text-sm uppercase tracking-[0.3em]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8 }}
            >
              Breaking the Seal
            </motion.p>
          </motion.div>
        )}
        {phase === 'open' && (
          <motion.div
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/40 to-amber-900/40 border-2 border-[#D4AF37]/50 flex items-center justify-center"
            >
              <span className="text-5xl">✨</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-[#D4AF37] text-lg uppercase tracking-widest"
            >
              Your Record Awaits
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
