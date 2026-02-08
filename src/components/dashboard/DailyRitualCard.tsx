import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Check, Lock, Cloud, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { motion } from 'framer-motion';

export const DailyRitualCard: React.FC = () => {
  const { t } = useTranslation();
  const { getJourneyData, isLoading } = useDailyJourney();

  const journey = getJourneyData();
  const currentHour = new Date().getHours();

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
      isUpcoming: isMorningTime && !journey.morning.completed,
      reward: journey.morning.shcReward,
      iconColor: 'text-amber-400',
    },
    {
      id: 'midday',
      icon: Cloud,
      label: t('dailyRitual.midday', 'Midday Practice'),
      time: '12:00 - 17:00',
      completed: journey.midday.completed,
      isUpcoming: isMiddayTime && !journey.midday.completed,
      reward: journey.midday.shcReward,
      iconColor: 'text-sky-400',
    },
    {
      id: 'evening',
      icon: Moon,
      label: t('dailyRitual.evening', 'Evening Reflection'),
      time: '17:00 - 5:00',
      completed: journey.evening.completed,
      isUpcoming: isEveningTime && !journey.evening.completed,
      reward: journey.evening.shcReward,
      iconColor: 'text-indigo-400',
    },
  ];

  const getStatus = (activity: (typeof activities)[0]) => {
    if (activity.completed) return 'completed';
    if (activity.isUpcoming) return 'upcoming';
    return 'locked';
  };

  const completedCount = [journey.morning.completed, journey.midday.completed, journey.evening.completed].filter(Boolean).length;

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-foreground">
          {t('dailyRitual.title', 'Daily Spiritual Practice')}
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/3
        </span>
      </div>

      <Progress value={journey.totalProgress} className="h-2 mb-4" />

      <div className="space-y-2">
        {activities.map((activity) => {
          const status = getStatus(activity);
          return (
            <motion.div
              key={activity.id}
              layout
              className="flex items-center gap-3 p-3 rounded-[16px] bg-white/[0.02] border border-primary/20"
            >
              <div className={`p-2 rounded-lg bg-background/50 ${activity.iconColor}`}>
                {status === 'completed' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <activity.icon className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{activity.label}</p>
                <p className="text-[10px] text-muted-foreground">{activity.time}</p>
              </div>

              {status === 'completed' ? (
                <span className="text-xs text-green-500 font-medium flex items-center gap-1 shrink-0">
                  <Check className="w-3 h-3" />
                  +{activity.reward} SHC
                </span>
              ) : status === 'upcoming' ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {t('dailyRitual.upcoming', 'Upcoming')}
                </span>
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
