import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Sparkles, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSHC } from '@/contexts/SHCContext';
import { AnimatedCounter } from '@/components/ui/animated-counter';

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

  return (
    <Card className="glass-card p-5 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <TrendingUp className="w-5 h-5 text-accent" />
        </div>
        <h3 className="font-heading font-semibold text-foreground">
          Positive Me
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        <StatItem
          icon={Sparkles}
          label="Energy Collected"
          value={
            <span className="flex items-baseline gap-1">
              <AnimatedCounter value={balance?.balance ?? 0} className="text-sm font-semibold" />
              <span className="text-xs text-accent">SHC</span>
            </span>
          }
          color="bg-accent/20 text-accent"
          delay={0}
        />

        <StatItem
          icon={Heart}
          label="Moments of Presence"
          value="12"
          color="bg-rose-500/20 text-rose-400"
          delay={0.1}
        />

        <StatItem
          icon={Clock}
          label="Time With Yourself"
          value="145 min"
          color="bg-secondary/20 text-secondary"
          delay={0.2}
        />
      </div>
    </Card>
  );
};
