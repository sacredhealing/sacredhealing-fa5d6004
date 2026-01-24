import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export type IntentionType = 'peace' | 'healing' | 'release';

interface IntentionThresholdProps {
  isOpen: boolean;
  onSelectIntention: (intention: IntentionType) => void;
  onClose: () => void;
}

const INTENTIONS: { id: IntentionType; label: string; color: string; gradient: string; glow: string }[] = [
  { 
    id: 'peace', 
    label: 'Peace', 
    color: 'hsl(200, 80%, 60%)',
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    glow: 'shadow-[0_0_40px_rgba(56,189,248,0.6)]'
  },
  { 
    id: 'healing', 
    label: 'Healing', 
    color: 'hsl(150, 70%, 50%)',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    glow: 'shadow-[0_0_40px_rgba(52,211,153,0.6)]'
  },
  { 
    id: 'release', 
    label: 'Release', 
    color: 'hsl(280, 70%, 60%)',
    gradient: 'from-purple-400 via-violet-500 to-fuchsia-600',
    glow: 'shadow-[0_0_40px_rgba(192,132,252,0.6)]'
  },
];

export const IntentionThreshold: React.FC<IntentionThresholdProps> = ({
  isOpen,
  onSelectIntention,
  onClose,
}) => {
  const [selectedIntention, setSelectedIntention] = useState<IntentionType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSelect = (intention: IntentionType) => {
    setSelectedIntention(intention);
    setIsTransitioning(true);
    
    // Wait for the color fade animation, then trigger callback
    setTimeout(() => {
      onSelectIntention(intention);
      // Reset state after a brief delay
      setTimeout(() => {
        setSelectedIntention(null);
        setIsTransitioning(false);
      }, 300);
    }, 1200);
  };

  const selectedConfig = INTENTIONS.find(i => i.id === selectedIntention);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Background with mood color transition */}
          <motion.div 
            className="absolute inset-0"
            initial={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            animate={{ 
              backgroundColor: isTransitioning && selectedConfig 
                ? selectedConfig.color.replace('hsl', 'hsla').replace(')', ', 0.85)')
                : 'rgba(0, 0, 0, 0.9)'
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Ambient particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: [null, Math.random() * -200],
                  opacity: [0.3, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <motion.div 
            className="relative z-10 flex flex-col items-center px-6 max-w-md mx-auto"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Question */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: isTransitioning ? 0 : 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center mb-10"
            >
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">
                What is your intention for this practice?
              </h2>
              <p className="text-white/60 text-sm">
                Set your sacred intention before we begin
              </p>
            </motion.div>

            {/* Intention Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 w-full justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: isTransitioning ? 0 : 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {INTENTIONS.map((intention, index) => (
                <motion.button
                  key={intention.id}
                  onClick={() => handleSelect(intention.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative px-8 py-4 rounded-full font-semibold text-white text-lg
                    bg-gradient-to-r ${intention.gradient}
                    ${intention.glow}
                    transition-all duration-300
                    hover:brightness-110
                    focus:outline-none focus:ring-2 focus:ring-white/50
                  `}
                >
                  {/* Glow animation */}
                  <motion.span
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${intention.gradient} opacity-50 blur-xl`}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <span className="relative z-10">{intention.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Skip button */}
            <motion.button
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: isTransitioning ? 0 : 0.6 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              whileHover={{ opacity: 1 }}
              className="mt-8 text-white/60 hover:text-white text-sm underline transition-colors"
            >
              Skip for now
            </motion.button>

            {/* Selected intention message */}
            <AnimatePresence>
              {isTransitioning && selectedConfig && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                    >
                      <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-3xl font-heading font-bold text-white">
                      {selectedConfig.label}
                    </h3>
                    <p className="text-white/80 mt-2">Preparing your session...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntentionThreshold;
