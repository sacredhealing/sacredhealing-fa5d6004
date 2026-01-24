import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Youtube, Gift, Wallet, Sparkles } from 'lucide-react';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  route: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Youtube,
    label: 'YouTube',
    route: '/spiritual-education',
    color: 'bg-red-500',
  },
  {
    icon: Gift,
    label: 'Earn',
    route: '/earn',
    color: 'bg-amber-500',
  },
  {
    icon: Wallet,
    label: 'Wallet',
    route: '/wallet',
    color: 'bg-cyan-400',
  },
  {
    icon: Sparkles,
    label: 'Creative Soul',
    route: '/creative-soul/store',
    color: 'bg-purple-500',
  },
];

export const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 items-end"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={action.route}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <span className="glass-card px-3 py-1.5 rounded-full text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {action.label}
                  </span>
                  <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform sacred-glow`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-cyan-400 rounded-full shadow-2xl flex items-center justify-center text-2xl text-[#0F0C29] sacred-glow hover:scale-105 transition-all"
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
      </motion.button>
    </div>
  );
};
