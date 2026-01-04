import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Sparkles, Check, Lock, Cloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { motion } from 'framer-motion';

export const DailyRitualCard: React.FC = () => {
  const { t } = useTranslation();
  const { 
    getJourneyData, 
    completeMorning, 
    completeMidday, 
    completeEvening,
    isLoading 
  } = useDailyJourney();

  const journey = getJourneyData();
  const currentHour = new Date().getHours();

  // Determine which activity is current
  const isMorningTime = currentHour >= 5 && currentHour < 12;
  const isMiddayTime = currentHour >= 12 && currentHour < 17;
  const isEveningTime = currentHour >= 17 || currentHour < 5;

  const activities = [
    {
      id: 'morning',
      icon: Sun,
      label: t('dailyRitual.morning', 'Morning Ritual'),
      time: '5:00 - 12:00',
      completed: journey.morning.completed,
      isCurrent: isMorningTime && !journey.morning.completed,
      reward: journey.morning.shcReward,
      onComplete: () => completeMorning.mutate(undefined),
      isLoading: completeMorning.isPending,
      color: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
    },
    {
      id: 'midday',
      icon: Cloud,
      label: t('dailyRitual.midday', 'Midday Practice'),
      time: '12:00 - 17:00',
      completed: journey.midday.completed,
      isCurrent: isMiddayTime && !journey.midday.completed,
      reward: journey.midday.shcReward,
      onComplete: () => completeMidday.mutate(undefined),
      isLoading: completeMidday.isPending,
      color: 'from-sky-500/20 to-blue-500/10',
      iconColor: 'text-sky-400',
    },
    {
      id: 'evening',
      icon: Moon,
      label: t('dailyRitual.evening', 'Evening Reflection'),
      time: '17:00 - 5:00',
      completed: journey.evening.completed,
      isCurrent: isEveningTime && !journey.evening.completed,
      reward: journey.evening.shcReward,
      onComplete: () => completeEvening.mutate({}),
      isLoading: completeEvening.isPending,
      color: 'from-indigo-500/20 to-purple-500/10',
      iconColor: 'text-indigo-400',
    },
  ];

  const completedCount = [journey.morning.completed, journey.midday.completed, journey.evening.completed].filter(Boolean).length;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-foreground">
          {t('dailyRitual.title', 'Daily Spiritual Practice')}
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/3
        </span>
      </div>

      <Progress value={journey.totalProgress} className="h-2 mb-4" />

      {/* Activity Cards */}
      <div className="space-y-2">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            layout
            className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${activity.color} border border-border/30 ${
              activity.isCurrent ? 'ring-2 ring-primary/50' : ''
            }`}
          >
            <div className={`p-2 rounded-lg bg-background/50 ${activity.iconColor}`}>
              {activity.completed ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <activity.icon className="w-4 h-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">{activity.label}</p>
              <p className="text-[10px] text-muted-foreground">{activity.time}</p>
            </div>

            {activity.completed ? (
              <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                +{activity.reward} SHC
              </span>
            ) : activity.isCurrent ? (
              <Button
                size="sm"
                variant="spiritual"
                onClick={activity.onComplete}
                disabled={activity.isLoading}
                className="text-xs h-7 px-3"
              >
                {activity.isLoading ? '...' : t('common.complete', 'Complete')}
              </Button>
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground/50" />
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
