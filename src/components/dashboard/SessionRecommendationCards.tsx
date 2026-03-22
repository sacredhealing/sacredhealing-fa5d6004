import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Wind, Moon, Sun, Heart, BookOpen } from 'lucide-react';
import type { RecommendedSession } from '@/lib/recommendationEngine';
import { useTranslation } from '@/hooks/useTranslation';

interface SessionRecommendationCardsProps {
  recommendations: RecommendedSession[];
}

const getIconForRoute = (route: string) => {
  if (route.includes('/breathing')) return Wind;
  if (route.includes('/ritual')) return Sun;
  if (route.includes('/journal')) return BookOpen;
  if (route.includes('/meditations') && route.includes('sleep')) return Moon;
  if (route.includes('/paths')) return Heart;
  return Play;
};

export const SessionRecommendationCards: React.FC<SessionRecommendationCardsProps> = ({
  recommendations,
}) => {
  const { t } = useTranslation();
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{t('dashboard.nextStepTitle')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recommendations.map((session, index) => {
          const Icon = getIconForRoute(session.route);
          return (
            <Link key={session.slug} to={session.route}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50 hover:border-primary/40 hover:bg-white/[0.06] transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground truncate flex-1">
                  {session.label}
                </span>
                <Play className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
