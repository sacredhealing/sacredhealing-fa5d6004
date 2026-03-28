import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Star, Play, BookOpen, CheckCircle2, Lock, Wind, Music, Headphones } from 'lucide-react';
import { useSpiritualPaths, SpiritualPath, PathDay } from '@/hooks/useSpiritualPaths';
import { usePathTracks } from '@/hooks/usePathTracks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
// Map path slugs to spiritual path values used in music tracks
const PATH_SLUG_MAP: Record<string, string> = {
  'inner-peace': 'inner_peace',
  'deep-healing': 'deep_healing',
  'sleep-sanctuary': 'sleep_sanctuary',
  'focus-mastery': 'focus_mastery',
  'awakening': 'awakening',
};

const PathDetail: React.FC = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getPathBySlug, getPathDays, getProgressForPath, startPath, completeDay, isProgressLoading, userProgress } = useSpiritualPaths();
  const pathKey = slug ? slug.replace(/-/g, '_') : '';
  
  // Fetch path-specific music tracks
  const pathTrackSlug = slug ? PATH_SLUG_MAP[slug] || slug.replace(/-/g, '_') : undefined;
  const { data: pathTracks = [] } = usePathTracks(pathTrackSlug);
  
  const [path, setPath] = useState<SpiritualPath | null>(null);
  const [days, setDays] = useState<PathDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    const fetchPath = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const pathData = await getPathBySlug(slug);
        if (pathData) {
          setPath(pathData);
          const daysData = await getPathDays(pathData.id);
          setDays(daysData);
        }
      } catch (error) {
        console.error('Error fetching path:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPath();
  }, [slug]);

  // Update progress when userProgress data loads or path changes
  useEffect(() => {
    if (path && !isProgressLoading) {
      setProgress(getProgressForPath(path.id));
    }
  }, [path, userProgress, isProgressLoading]);

  if (isLoading || isProgressLoading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24 flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">{t('pathDetail.pathNotFound')}</p>
        <Button onClick={() => navigate('/paths')}>{t('pathDetail.backToPaths')}</Button>
      </div>
    );
  }

  const progressPercent = progress 
    ? Math.round((progress.current_day / path.duration_days) * 100) 
    : 0;

  const localizedPathTitle = pathKey ? t(`spiritualPath.paths.${pathKey}.title`, path.title) : path.title;

  const handleStartPath = async () => {
    await startPath.mutateAsync(path.id);
    setProgress(getProgressForPath(path.id));
  };

  const handleCompleteDay = async (dayReward: number) => {
    if (!progress) return;
    await completeDay.mutateAsync({ progressId: progress.id, dayReward });
  };

  const currentDay = progress?.current_day || 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        {path.cover_image_url && (
          <img
            src={path.cover_image_url}
            alt={localizedPathTitle}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <button
          onClick={() => navigate('/paths')}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/50 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-4 -mt-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge className="mb-2 capitalize">{t(`pathDetail.difficulty.${path.difficulty.toLowerCase()}`, path.difficulty)}</Badge>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            {localizedPathTitle}
          </h1>
          <p className="text-muted-foreground mb-4">
            {pathKey ? t(`spiritualPath.paths.${pathKey}.description`, path.description || '') : (path.description || '')}
          </p>

          <div className="flex items-center gap-4 text-sm mb-6">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{path.duration_days} {t('pathDetail.days')}</span>
            </div>
            <div className="flex items-center gap-1 text-accent">
              <Star className="w-4 h-4" />
              <span>+{path.shc_reward_total} SHC</span>
            </div>
          </div>

          {/* Progress or Start */}
          {progress ? (
            <Card className="p-4 mb-6 bg-gradient-card border-primary/30">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground">{t('pathDetail.yourProgress')}</span>
                <span className="text-sm text-muted-foreground">
                  {t('pathDetail.dayOf', { current: progress.current_day, total: path.duration_days })}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3 mb-2" />
              <p className="text-xs text-muted-foreground">
                {t('pathDetail.shcEarned', { count: progress.total_shc_earned })}
              </p>
            </Card>
          ) : (
            <Button
              onClick={handleStartPath}
              className="w-full mb-6"
              variant="spiritual"
              size="lg"
              disabled={startPath.isPending}
            >
              <Play className="w-5 h-5 mr-2" />
              {t('pathDetail.startThisPath')}
            </Button>
          )}

          {/* Daily Content */}
          <h2 className="font-heading font-semibold text-lg text-foreground mb-3">
            {t('pathDetail.dailyPractice')}
          </h2>

          <Accordion type="single" collapsible defaultValue={`day-${currentDay}`}>
            {days.length > 0 ? days.map((day) => {
              const isCompleted = day.day_number < currentDay;
              const isCurrentDay = day.day_number === currentDay;
              const isLocked = day.day_number > currentDay && !progress?.completed_at;

              return (
                <AccordionItem key={day.id} value={`day-${day.day_number}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{day.day_number}</span>
                        </div>
                      )}
                      <div className="text-left">
                        <span className="font-medium text-foreground">
                          {t('spiritualPath.day')} {day.day_number}: {pathKey ? t(`spiritualPath.paths.${pathKey}.days.${day.day_number}.title`, day.title) : day.title}
                        </span>
                        <span className="text-xs text-accent ml-2">+{day.shc_reward} SHC</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-8 space-y-3">
                      {(() => {
                        const desc = pathKey ? t(`spiritualPath.paths.${pathKey}.days.${day.day_number}.description`, day.description || '') : day.description;
                        return desc ? <p className="text-sm text-muted-foreground">{desc}</p> : null;
                      })()}
                      
                      {(() => {
                        const aff = pathKey ? t(`spiritualPath.paths.${pathKey}.days.${day.day_number}.affirmation`, day.affirmation || '') : day.affirmation;
                        return aff ? (
                          <Card className="p-3 bg-primary/10 border-primary/30">
                            <p className="text-sm italic text-foreground">"{aff}"</p>
                          </Card>
                        ) : null;
                      })()}

                      {(() => {
                        const jp = pathKey ? t(`spiritualPath.paths.${pathKey}.days.${day.day_number}.journalPrompt`, day.journal_prompt || '') : day.journal_prompt;
                        return jp ? (
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('pathDetail.journalPrompt')}</p>
                              <p className="text-sm text-foreground">{jp}</p>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {(() => {
                        const mantra =
                          pathKey && day.day_number != null
                            ? t(
                                `spiritualPath.paths.${pathKey}.days.${day.day_number}.mantraText`,
                                day.mantra_text || ''
                              )
                            : day.mantra_text || '';
                        return mantra.trim() ? (
                          <div className="flex items-start gap-2">
                            <Music className="w-4 h-4 text-accent mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('pathDetail.todaysMantra')}</p>
                              <p className="text-sm text-foreground font-medium">{mantra}</p>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {(() => {
                        const breath =
                          pathKey && day.day_number != null
                            ? t(
                                `spiritualPath.paths.${pathKey}.days.${day.day_number}.breathingDescription`,
                                day.breathing_description || ''
                              )
                            : day.breathing_description || '';
                        return breath.trim() ? (
                          <div className="flex items-start gap-2">
                            <Wind className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('pathDetail.breathingPractice')}</p>
                              <p className="text-sm text-foreground">{breath}</p>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {isCurrentDay && progress && !progress.completed_at && (
                        <Button
                          onClick={() => handleCompleteDay(day.shc_reward)}
                          className="w-full mt-2"
                          variant="spiritual"
                          disabled={completeDay.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {t('pathDetail.completeDay', { day: day.day_number })}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }) : (
              <p className="text-muted-foreground text-center py-8">
                {t('pathDetail.contentComingSoon')}
              </p>
            )}
          </Accordion>

          {/* Path-Specific Music Tracks */}
          {pathTracks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  {t('pathDetail.musicForPath')}
                </h2>
                <Link to="/music" className="text-sm text-primary hover:underline">
                  {t('pathDetail.seeAll')}
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {pathTracks.slice(0, 4).map((track) => (
                  <Link 
                    key={track.id} 
                    to={`/music/track/${track.id}`}
                    className="group"
                  >
                    <Card className="p-3 bg-gradient-card border-border/50 hover:border-primary/50 transition-all">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                        {track.cover_image_url ? (
                          <img 
                            src={track.cover_image_url} 
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-foreground truncate">{track.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      {track.affirmation && (
                        <p className="text-xs text-primary/80 italic mt-1 line-clamp-2">
                          "{track.affirmation}"
                        </p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PathDetail;
