import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePersonalizedDailyPractice } from '@/hooks/usePersonalizedDailyPractice';
import { motion } from 'framer-motion';

export const DailyPracticeCard: React.FC = () => {
  const { practice, isLoading } = usePersonalizedDailyPractice();

  if (isLoading) {
    return (
      <Card className="p-5 rounded-2xl bg-card border border-border/50">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-32" />
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-full" />
        </div>
      </Card>
    );
  }

  if (!practice) {
    return null;
  }

  const getRoute = () => {
    switch (practice.type) {
      case 'meditation':
        return `/meditations`;
      case 'path':
        return `/paths/${practice.id}`;
      case 'healing':
        return `/healing`;
      default:
        return `/meditations`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-primary/20 shadow-lg">
        <CardContent className="p-0 space-y-4">
          <div>
            <h2 className="text-lg font-medium text-foreground mb-1">
              Today's Practice
            </h2>
            {practice.category && (
              <Badge variant="secondary" className="text-xs mb-2">
                {practice.category}
              </Badge>
            )}
            <h3 className="text-xl font-heading font-semibold text-foreground mt-2">
              {practice.title}
            </h3>
            {practice.description && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                {practice.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {practice.duration && (
              <span>{practice.duration} min</span>
            )}
            {practice.shc_reward && (
              <span className="flex items-center gap-1 text-accent">
                <Sparkles className="w-4 h-4" />
                +{practice.shc_reward} SHC
              </span>
            )}
          </div>

          <Link to={getRoute()}>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 text-base font-medium"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Begin
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

