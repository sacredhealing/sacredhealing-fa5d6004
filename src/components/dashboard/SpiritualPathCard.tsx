import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, ChevronRight, Play, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSpiritualPaths } from '@/hooks/useSpiritualPaths';
import { Skeleton } from '@/components/ui/skeleton';

export const SpiritualPathCard: React.FC = () => {
  const { t } = useTranslation();
  const { paths, userProgress, isLoading, getActiveProgress } = useSpiritualPaths();

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  const activeProgress = getActiveProgress();

  // If user has an active path, show progress
  if (activeProgress) {
    const activePath = paths.find(p => p.id === activeProgress.path_id);
    if (activePath) {
      const progressPercent = Math.round((activeProgress.current_day / activePath.duration_days) * 100);

      return (
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#00F2FE]" />
              <h3 className="font-heading font-semibold text-foreground">
                {t('spiritualPath.yourPath', 'Your Path')}
              </h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {t('spiritualPath.day')} {activeProgress.current_day}/{activePath.duration_days}
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-medium text-foreground">{activePath.title}</p>
              <p className="text-xs text-muted-foreground">{activePath.description}</p>
            </div>

            <Progress value={progressPercent} className="h-2" />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {progressPercent}% {t('common.complete', 'complete')}
              </span>
              <Link to={`/paths/${activePath.slug}`}>
                <Button size="sm" variant="spiritual" className="text-xs h-8">
                  <Play className="w-3 h-3 mr-1" />
                  {t('spiritualPath.continueDay', 'Continue Day')} {activeProgress.current_day}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      );
    }
  }

  // Show recommended paths if no active path
  const recommendedPath = paths[0];
  if (!recommendedPath) {
    return null;
  }

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <h3 className="font-heading font-semibold text-foreground">
            {t('spiritualPath.startJourney', 'Start Your Journey')}
          </h3>
        </div>
        <Link to="/paths" className="text-xs text-primary hover:underline">
          {t('common.viewAll', 'View All')}
        </Link>
      </div>

      <Link to={`/paths/${recommendedPath.slug}`}>
        <div className="flex items-center gap-4 p-3 rounded-xl bg-background/50 border border-border/30 hover:border-primary/50 transition-all">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0">
            {recommendedPath.cover_image_url ? (
              <img 
                src={recommendedPath.cover_image_url} 
                alt={recommendedPath.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Compass className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">{recommendedPath.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{recommendedPath.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {recommendedPath.duration_days} {t('common.days')}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-accent border-accent/30">
                +{recommendedPath.shc_reward_total} SHC
              </Badge>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Link>
    </Card>
  );
};
