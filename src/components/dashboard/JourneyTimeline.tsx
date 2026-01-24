import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Sparkles, Heart, Moon, Sun, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useDailyPath } from '@/hooks/useDailyPath';

const timelineNodes = [
  { id: 1, completed: true, icon: Sun },
  { id: 2, completed: true, icon: Heart },
  { id: 3, completed: false, icon: Star, active: true },
  { id: 4, completed: false, icon: Moon },
  { id: 5, completed: false, icon: Sparkles },
];

export const JourneyTimeline: React.FC = () => {
  const { suggestion } = useDailyPath();

  const soulMessage = suggestion?.message || "Your soul seeks calm. Try 'Heart-Opening Breath' next.";

  return (
    <Card className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Compass className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-heading font-semibold text-foreground">
          Your Journey Timeline
        </h3>
      </div>

      {/* Soul Message */}
      <motion.div
        className="mb-5 p-4 rounded-[16px] bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 border border-primary/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-foreground/80 italic leading-relaxed">
          "{soulMessage}"
        </p>
      </motion.div>

      {/* Timeline Nodes */}
      <div className="relative flex items-center justify-between px-2">
        {/* Connection Line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-muted/20 -translate-y-1/2" />

        {timelineNodes.map((node, index) => (
          <motion.div
            key={node.id}
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                node.completed
                  ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]'
                  : node.active
                  ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                  : 'bg-white/5 border-white/20 text-muted-foreground'
              }`}
              animate={
                node.active
                  ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 15px hsl(186 100% 50% / 0.4)',
                        '0 0 25px hsl(186 100% 50% / 0.6)',
                        '0 0 15px hsl(186 100% 50% / 0.4)',
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: node.active ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <node.icon className="w-4 h-4" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
