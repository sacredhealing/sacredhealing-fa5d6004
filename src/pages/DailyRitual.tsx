import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, Moon, Check, Sparkles, Play } from 'lucide-react';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const DailyRitual: React.FC = () => {
  const { 
    isLoading, 
    completeMorning, 
    completeMidday, 
    completeEvening,
    getJourneyData 
  } = useDailyJourney();

  const journeyData = getJourneyData();

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const rituals = [
    {
      id: 'morning',
      title: 'Morning Practice',
      description: 'Start your day with intention and clarity',
      icon: Sun,
      iconColor: 'text-amber-400',
      bgGradient: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'border-amber-500/30',
      completed: journeyData.morning.completed,
      shcReward: journeyData.morning.shcReward,
      onComplete: () => completeMorning.mutate(undefined),
      isPending: completeMorning.isPending,
    },
    {
      id: 'midday',
      title: 'Midday Mindfulness',
      description: 'A moment of calm in your busy day',
      icon: Cloud,
      iconColor: 'text-sky-400',
      bgGradient: 'from-sky-500/20 to-blue-500/10',
      borderColor: 'border-sky-500/30',
      completed: journeyData.midday.completed,
      shcReward: journeyData.midday.shcReward,
      onComplete: () => completeMidday.mutate(undefined),
      isPending: completeMidday.isPending,
    },
    {
      id: 'evening',
      title: 'Evening Reset',
      description: 'Reflect, release, and rest peacefully',
      icon: Moon,
      iconColor: 'text-indigo-400',
      bgGradient: 'from-indigo-500/20 to-purple-500/10',
      borderColor: 'border-indigo-500/30',
      completed: journeyData.evening.completed,
      shcReward: journeyData.evening.shcReward,
      onComplete: () => completeEvening.mutate({}),
      isPending: completeEvening.isPending,
    },
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">
          Daily Rituals
        </h1>
        <p className="text-muted-foreground">
          Your sacred moments throughout the day
        </p>
      </header>

      {/* Progress Overview */}
      <Card className="p-4 mb-6 bg-gradient-card border-primary/30 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-foreground">Today's Progress</span>
          <div className="flex items-center gap-1 text-accent">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              +{(journeyData.morning.completed ? 15 : 0) + 
                (journeyData.midday.completed ? 10 : 0) + 
                (journeyData.evening.completed ? 20 : 0)} SHC
            </span>
          </div>
        </div>
        <Progress value={journeyData.totalProgress} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          {journeyData.totalProgress}% complete
        </p>
      </Card>

      {/* Ritual Cards */}
      <div className="space-y-4">
        {rituals.map((ritual, index) => {
          const Icon = ritual.icon;
          
          return (
            <motion.div
              key={ritual.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-5 bg-gradient-to-br ${ritual.bgGradient} ${ritual.borderColor} border`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-background/20`}>
                    <Icon className={`w-6 h-6 ${ritual.iconColor}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground">
                        {ritual.title}
                      </h3>
                      {ritual.completed && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {ritual.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-accent flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        +{ritual.shcReward} SHC
                      </span>
                      
                      {ritual.completed ? (
                        <span className="text-sm text-green-500 font-medium">
                          Completed ✓
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="spiritual"
                          onClick={ritual.onComplete}
                          disabled={ritual.isPending}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Journal Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Link to="/journal">
          <Card className="p-5 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 hover:border-violet-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-background/20">
                <span className="text-2xl">📝</span>
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-foreground">
                  Daily Journal
                </h3>
                <p className="text-sm text-muted-foreground">
                  Reflect on your journey and earn +10 SHC
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    </div>
  );
};

export default DailyRitual;
