import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Star, Play, BookOpen, CheckCircle2, Lock } from 'lucide-react';
import { useSpiritualPaths, SpiritualPath, PathDay } from '@/hooks/useSpiritualPaths';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PathDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getPathBySlug, getPathDays, getProgressForPath, startPath, completeDay } = useSpiritualPaths();
  
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
          setProgress(getProgressForPath(pathData.id));
        }
      } catch (error) {
        console.error('Error fetching path:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPath();
  }, [slug]);

  if (isLoading) {
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
        <p className="text-muted-foreground mb-4">Path not found</p>
        <Button onClick={() => navigate('/paths')}>Back to Paths</Button>
      </div>
    );
  }

  const progressPercent = progress 
    ? Math.round((progress.current_day / path.duration_days) * 100) 
    : 0;

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
            alt={path.title}
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
          <Badge className="mb-2 capitalize">{path.difficulty}</Badge>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            {path.title}
          </h1>
          <p className="text-muted-foreground mb-4">
            {path.description}
          </p>

          <div className="flex items-center gap-4 text-sm mb-6">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{path.duration_days} days</span>
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
                <span className="font-semibold text-foreground">Your Progress</span>
                <span className="text-sm text-muted-foreground">
                  Day {progress.current_day} of {path.duration_days}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3 mb-2" />
              <p className="text-xs text-muted-foreground">
                {progress.total_shc_earned} SHC earned so far
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
              Start This Path
            </Button>
          )}

          {/* Daily Content */}
          <h2 className="font-heading font-semibold text-lg text-foreground mb-3">
            Daily Practice
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
                          Day {day.day_number}: {day.title}
                        </span>
                        <span className="text-xs text-accent ml-2">+{day.shc_reward} SHC</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-8 space-y-3">
                      {day.description && (
                        <p className="text-sm text-muted-foreground">{day.description}</p>
                      )}
                      
                      {day.affirmation && (
                        <Card className="p-3 bg-primary/10 border-primary/30">
                          <p className="text-sm italic text-foreground">"{day.affirmation}"</p>
                        </Card>
                      )}

                      {day.journal_prompt && (
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Journal Prompt</p>
                            <p className="text-sm text-foreground">{day.journal_prompt}</p>
                          </div>
                        </div>
                      )}

                      {isCurrentDay && progress && !progress.completed_at && (
                        <Button
                          onClick={() => handleCompleteDay(day.shc_reward)}
                          className="w-full mt-2"
                          variant="spiritual"
                          disabled={completeDay.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Complete Day {day.day_number}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }) : (
              <p className="text-muted-foreground text-center py-8">
                Daily content will be available soon.
              </p>
            )}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
};

export default PathDetail;
