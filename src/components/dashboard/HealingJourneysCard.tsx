import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSacredFlame } from '@/hooks/useSacredFlame';
import { LivingCoinIcon } from '@/components/icons/LivingCoinIcon';

export const HealingJourneysCard: React.FC = () => {
  const { brightness, streakDays, isLoading } = useSacredFlame();

  // Flame status based on brightness
  const getFlameStatus = () => {
    if (brightness >= 0.8) return { text: 'Blazing Bright', color: 'text-amber-400' };
    if (brightness >= 0.5) return { text: 'Glowing Strong', color: 'text-orange-400' };
    if (brightness >= 0.3) return { text: 'Gently Burning', color: 'text-yellow-400' };
    return { text: 'Needs Kindling', color: 'text-muted-foreground' };
  };

  const flameStatus = getFlameStatus();

  return (
    <Card className="glass-card p-5 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">
            Healing Journeys
          </h3>
        </div>
        <Link 
          to="/healing" 
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Sacred Flame Status Card */}
      <Link to="/healing">
        <motion.div
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20 border border-amber-500/30 p-4 hover:border-amber-500/50 transition-all group"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-4">
            {/* Sacred Healing Coin with Turquoise Aura */}
            <div className="relative flex items-center justify-center">
              {/* Outer turquoise pulsing aura */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'radial-gradient(circle, hsl(var(--secondary) / 0.4) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Inner turquoise glow */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'radial-gradient(circle, hsl(var(--secondary) / 0.5) 0%, transparent 60%)',
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
              {/* Living Coin Icon */}
              <LivingCoinIcon size={48} showAura={false} />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">My Sacred Flame</h4>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${flameStatus.color}`}>
                  {isLoading ? '...' : flameStatus.text}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {streakDays} day streak
                </span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </div>
        </motion.div>
      </Link>

      {/* Quickie Reset Card */}
      <Link to="/breathing?quick=true">
        <motion.div
          className="flex items-center gap-3 rounded-xl bg-background/40 border border-border/30 p-4 hover:border-secondary/40 hover:bg-background/60 transition-all group"
          whileHover={{ scale: 1.01 }}
        >
          <div className="p-3 rounded-full bg-secondary/20 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground text-sm">Quickie Reset</h4>
            <p className="text-xs text-muted-foreground">2 min breathing exercise</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </motion.div>
      </Link>
    </Card>
  );
};
