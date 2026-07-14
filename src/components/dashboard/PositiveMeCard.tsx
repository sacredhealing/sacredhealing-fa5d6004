import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Sparkles, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSHC } from '@/contexts/SHCContext';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useTranslation } from 'react-i18next';

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  color: string;
  delay?: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    className="flex items-center gap-3"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
  >
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  </motion.div>
);

export const PositiveMeCard: React.FC = () => {
  const { balance } = useSHC();
  const { t } = useTranslation();

  return (
    <Card className="glass-card p-5 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <TrendingUp className="w-5 h-5 text-accent" />
        </div>
        <h3 className="font-heading font-semibold text-foreground">
          {t('dashboard.positiveMe')}
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        {/* Energy Collected (SHC balance) stat intentionally removed - showed
            an actual coin quantity, not a rankable score. useSHC hook above
            still called, left as infrastructure. */}
        <StatItem
          icon={Heart}
          label={t('dashboard.momentsOfPresence')}
          value="12"
          color="bg-rose-500/20 text-rose-400"
          delay={0.1}
        />

        <StatItem
          icon={Clock}
          label={t('dashboard.timeWithYourself')}
          value="145 min"
          color="bg-secondary/20 text-secondary"
          delay={0.2}
        />
      </div>
    </Card>
  );
};
