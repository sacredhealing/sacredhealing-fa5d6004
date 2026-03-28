import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { normalizeSpiritualPathSlugKey } from '@/lib/spiritualPathSlug';
import { useSpiritualPaths } from '@/hooks/useSpiritualPaths';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const SpiritualPaths: React.FC = () => {
  const { t } = useTranslation();
  const { paths, isLoading, userProgress, getProgressForPath } = useSpiritualPaths();

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">
          {t('pathsIndex.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('pathsIndex.subtitle')}
        </p>
      </header>

      <div className="space-y-4">
        {paths.map((path, index) => {
          const progress = getProgressForPath(path.id);
          const progressPercent = progress 
            ? Math.round((progress.current_day / path.duration_days) * 100) 
            : 0;
          const pathKey = normalizeSpiritualPathSlugKey(path.slug);
          const pathTitle = t(`spiritualPath.paths.${pathKey}.title`, path.title);
          const pathDesc = t(`spiritualPath.paths.${pathKey}.description`, path.description || '');

          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/paths/${path.slug}`}>
                <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                  {path.cover_image_url && (
                    <div className="h-32 overflow-hidden relative">
                      <img
                        src={path.cover_image_url}
                        alt={pathTitle}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                      
                      {progress?.is_active && (
                        <Badge className="absolute top-3 left-3 bg-primary/90">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t('pathsIndex.inProgress')}
                        </Badge>
                      )}
                      
                      {progress?.completed_at && (
                        <Badge className="absolute top-3 left-3 bg-green-500/90">
                          ✓ {t('pathsIndex.completed')}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-heading font-semibold text-foreground text-lg">
                        {pathTitle}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {pathDesc}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{t('pathsIndex.daysCount', { count: path.duration_days })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-accent">
                        <Star className="w-4 h-4" />
                        <span>+{path.shc_reward_total} SHC</span>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {t(`pathDetail.difficulty.${path.difficulty.toLowerCase()}`, path.difficulty)}
                      </Badge>
                    </div>

                    {progress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('pathsIndex.dayProgress', { current: progress.current_day, total: path.duration_days })}</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {paths.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('pathsIndex.empty')}</p>
        </div>
      )}
    </div>
  );
};

export default SpiritualPaths;
