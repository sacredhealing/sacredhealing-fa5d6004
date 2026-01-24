import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Wallet, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSHC } from '@/contexts/SHCContext';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useTranslation } from 'react-i18next';

export const QuickActionsCard: React.FC = () => {
  const { t } = useTranslation();
  const { balance } = useSHC();

  const actions = [
    {
      icon: Gift,
      label: t('dashboard.earn', 'Earn'),
      route: '/earn',
      color: 'from-amber-500 to-orange-500',
      glowColor: 'hsl(45 100% 50% / 0.3)',
    },
    {
      icon: Wallet,
      label: t('dashboard.wallet', 'Wallet'),
      route: '/wallet',
      color: 'from-secondary to-cyan-400',
      glowColor: 'hsl(185 100% 50% / 0.3)',
    },
    {
      icon: Sparkles,
      label: t('dashboard.rewards', 'Rewards'),
      route: '/rewards',
      color: 'from-purple-500 to-primary',
      glowColor: 'hsl(271 76% 53% / 0.3)',
    },
  ];

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-foreground">Quick Actions</h3>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-subtle">
          <span className="text-xs text-muted-foreground">SHC:</span>
          <span className="text-sm font-bold text-secondary">
            <AnimatedCounter value={typeof balance === 'number' ? balance : 0} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, index) => (
          <Link key={action.route} to={action.route}>
            <motion.div
              className="flex flex-col items-center gap-2 p-3 rounded-xl glass-subtle hover:border-secondary/30 transition-all cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              style={{
                boxShadow: `0 0 20px ${action.glowColor}`,
              }}
            >
              <div 
                className={`p-2.5 rounded-full bg-gradient-to-br ${action.color}`}
                style={{
                  boxShadow: `0 0 15px ${action.glowColor}`,
                }}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </Card>
  );
};
