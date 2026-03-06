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
        <div
          className="h-48 overflow-hidden relative flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #050505 0%, rgba(212,175,55,0.08) 50%, #050505 100%)' }}
        >
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" style={{ animation: 'siddhiSpin 30s linear infinite', opacity: 0.6 }}>
            <circle cx="80" cy="80" r="75" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
            <polygon points="80,15 145,120 15,120" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.9" />
            <polygon points="80,145 15,40 145,40" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.9" />
            <polygon points="80,32 132,112 28,112" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
            <polygon points="80,128 28,48 132,48" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
            <circle cx="80" cy="80" r="22" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.4" />
            <circle cx="80" cy="80" r="10" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.3" />
            <circle cx="80" cy="80" r="3" fill="#D4AF37" opacity="0.9" />
          </svg>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${(i % 3) + 1.5}px`,
                height: `${(i % 3) + 1.5}px`,
                borderRadius: '50%',
                background: '#D4AF37',
                opacity: 0.1 + (i % 5) * 0.08,
                left: `${(i * 17) % 85 + 5}%`,
                top: `${(i * 11) % 85 + 5}%`,
                animation: `glowBreathe ${1 + (i % 3) * 0.5}s ease-in-out infinite`,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, #050505 100%)',
            }}
          />
        </div>

        <div className="p-5 relative">
          <h3
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 600,
              fontSize: '1.6rem',
              color: 'white',
              marginBottom: 8,
              textShadow: '0 0 20px rgba(212,175,55,0.2)',
            }}
          >
            {recommendedPath.title}
          </h3>
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {recommendedPath.description}
          </p>

          <div className="flex items-center gap-4 mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Clock className="w-4 h-4" />
              <span>{recommendedPath.duration_days} days</span>
            </div>
            <div className="flex items-center gap-1 text-[#D4AF37]">
              <Star className="w-4 h-4" />
              <span>+{recommendedPath.shc_reward_total} SHC</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)' }} className="px-2 py-0.5 rounded-full bg-white/5 capitalize">
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
