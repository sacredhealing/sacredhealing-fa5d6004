import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Star, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GoalType } from '@/hooks/useOnboarding';
import { Skeleton } from '@/components/ui/skeleton';

interface SpiritualPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image_url: string | null;
  duration_days: number;
  difficulty: string;
  goal_types: string[];
  shc_reward_total: number;
}

interface PathRecommendationProps {
  userGoals: GoalType[];
  onStartPath?: (pathId: string) => void;
}

export const PathRecommendation: React.FC<PathRecommendationProps> = ({ 
  userGoals,
  onStartPath 
}) => {
  const [recommendedPath, setRecommendedPath] = useState<SpiritualPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedPath = async () => {
      setIsLoading(true);
      try {
        const { data: paths, error } = await supabase
          .from('spiritual_paths')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        if (error) throw error;

        // Find best matching path based on user goals
        if (paths && paths.length > 0) {
          const scoredPaths = paths.map(path => {
            const pathGoals = path.goal_types || [];
            const matchScore = userGoals.filter(goal => 
              pathGoals.includes(goal)
            ).length;
            return { ...path, matchScore };
          });

          // Sort by match score, then by order_index
          scoredPaths.sort((a, b) => b.matchScore - a.matchScore || a.order_index - b.order_index);
          setRecommendedPath(scoredPaths[0]);
        }
      } catch (error) {
        console.error('Error fetching paths:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedPath();
  }, [userGoals]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!recommendedPath) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No paths available at this time.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm mb-2">
          <Sparkles className="w-4 h-4" />
          Recommended for you
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-primary/30">
        {recommendedPath.cover_image_url && (
          <div className="h-40 overflow-hidden">
            <img 
              src={recommendedPath.cover_image_url} 
              alt={recommendedPath.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}
        
        <div className="p-5 -mt-12 relative">
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">
            {recommendedPath.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {recommendedPath.description}
          </p>

          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{recommendedPath.duration_days} days</span>
            </div>
            <div className="flex items-center gap-1 text-accent">
              <Star className="w-4 h-4" />
              <span>+{recommendedPath.shc_reward_total} SHC</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-muted text-xs capitalize">
              {recommendedPath.difficulty}
            </span>
          </div>

          {onStartPath && (
            <Button
              onClick={() => onStartPath(recommendedPath.id)}
              className="w-full"
              variant="spiritual"
            >
              Start This Path
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        You can browse all paths anytime from your dashboard
      </p>
    </motion.div>
  );
};
