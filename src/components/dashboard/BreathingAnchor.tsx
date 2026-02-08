import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreathingAnchorProps {
  /** Duration in seconds. Default 3. */
  durationSeconds?: number;
  onComplete?: () => void;
  /** Compact mode for inline use */
  compact?: boolean;
}

/**
 * Minimal breathing animation for the return-visit flow.
 * Runs for a fixed duration (default 3s), no sound, no controls.
 */
export const BreathingAnchor: React.FC<BreathingAnchorProps> = ({
  durationSeconds = 3,
  onComplete,
  compact = true,
}) => {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsDone(true);
      onComplete?.();
    }, durationSeconds * 1000);
    return () => clearTimeout(t);
  }, [durationSeconds, onComplete]);

  const size = compact ? 48 : 80;

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="rounded-full border border-primary/40"
            style={{
              width: size,
              height: size,
              background: 'radial-gradient(circle at 30% 30%, rgba(0, 242, 254, 0.25) 0%, rgba(0, 242, 254, 0.05) 100%)',
            }}
            animate={{
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 2,
              repeat: Math.floor(durationSeconds / 2),
              repeatType: 'reverse',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
