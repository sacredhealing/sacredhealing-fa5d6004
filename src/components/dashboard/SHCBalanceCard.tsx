import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSHC } from '@/contexts/SHCContext';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export const SHCBalanceCard: React.FC = () => {
  const { t } = useTranslation();
  const { balance } = useSHC();

  return (
    <Card className="glass-card p-4 sm:p-5 relative overflow-hidden">
      {/* Content */}
      <div className="flex items-center justify-between relative z-10 gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('dashboard.yourSHCBalance', 'Ditt SHC Saldo')}
          </p>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter
              value={balance?.balance ?? 0}
              className="text-3xl sm:text-4xl font-bold text-amber-400"
            />
            <span className="text-base sm:text-lg font-semibold text-amber-400/80">SHC</span>
          </div>
          <Link to="/earn">
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 sm:mt-3 bg-amber-400 text-background hover:bg-amber-300 border-0 font-semibold text-xs sm:text-sm px-3 sm:px-4"
            >
              {t('dashboard.claimRewards', 'Hämta Belöningar')}
            </Button>
          </Link>
        </div>

        {/* Glowing Icon - smaller on mobile */}
        <div className="relative shrink-0">
          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ width: '60px', height: '60px', left: '-6px', top: '-6px' }}
          />
          {/* Inner glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-500/40 blur-md"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            style={{ width: '48px', height: '48px' }}
          />
          {/* Icon */}
          <div className="relative w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-full bg-amber-400/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
          </div>
        </div>
      </div>
    </Card>
  );
};
