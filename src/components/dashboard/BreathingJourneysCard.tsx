import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, Brain, Heart, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const breathingJourneys = [
  { id: 'anxiety', icon: Heart, labelKey: 'journeys.anxietyRelief', color: 'text-rose-400', bgColor: 'bg-rose-500/20', route: '/breathing?type=anxiety' },
  { id: 'balance', icon: Sparkles, labelKey: 'journeys.balance', color: 'text-amber-400', bgColor: 'bg-amber-500/20', route: '/breathing?type=balance' },
  { id: 'focus', icon: Brain, labelKey: 'journeys.focus', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', route: '/breathing?type=focus' },
  { id: 'sleep', icon: Moon, labelKey: 'journeys.sleep', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', route: '/breathing?type=sleep' },
];

export const BreathingJourneysCard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Card className="glass-card p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Wind className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">
            {t('journeys.breathingTitle')}
          </h3>
        </div>
        <Link 
          to="/breathing" 
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          {t('journeys.all')} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Journey Grid */}
      <div className="grid grid-cols-2 gap-3">
        {breathingJourneys.map((journey, index) => (
          <Link key={journey.id} to={journey.route}>
            <motion.div
              className="flex flex-col items-center gap-2 p-4 rounded-[16px] bg-white/[0.02] border border-primary/20 hover:border-primary/40 hover:bg-white/[0.04] transition-all group cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className={`p-3 rounded-full ${journey.bgColor} group-hover:scale-110 transition-transform`}>
                <journey.icon className={`w-5 h-5 ${journey.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground text-center">
                {t(journey.labelKey)}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </Card>
  );
};
