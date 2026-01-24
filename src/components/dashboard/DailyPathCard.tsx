import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Sparkles, ArrowRight, Wind, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyPath } from '@/hooks/useDailyPath';

export const DailyPathCard: React.FC = () => {
  const { suggestion, isLoading, clearSuggestion } = useDailyPath();

  if (isLoading || !suggestion) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 border-primary/30">
        {/* Dismiss button */}
        <button
          onClick={clearSuggestion}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-background/30 hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Dismiss suggestion"
        >
          <X size={14} />
        </button>

        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </div>

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-1.5">
                Your Daily Path
                <Sparkles className="w-4 h-4 text-accent" />
              </h3>
              <p className="text-xs text-muted-foreground">Based on your last session</p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-foreground/80 mb-4 leading-relaxed italic">
            "{suggestion.message}"
          </p>

          {/* Suggested Practice */}
          <Link to={suggestion.practiceRoute} onClick={clearSuggestion}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/30 hover:bg-background/60 hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Wind className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{suggestion.practiceTitle}</p>
                  <p className="text-xs text-muted-foreground">Suggested for tomorrow</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};
