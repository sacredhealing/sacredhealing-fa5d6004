import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, Brain, Heart, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const breathingJourneys = [
  { 
    id: 'anxiety', 
    icon: Heart, 
    labelKey: 'Anxiety Relief',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    route: '/breathing?type=anxiety'
  },
  { 
    id: 'balance', 
    icon: Sparkles, 
    labelKey: 'Balance',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    route: '/breathing?type=balance'
  },
  { 
    id: 'focus', 
    icon: Brain, 
    labelKey: 'Focus',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    route: '/breathing?type=focus'
  },
  { 
    id: 'sleep', 
    icon: Moon, 
    labelKey: 'Sleep',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    route: '/breathing?type=sleep'
  },
];

export const BreathingJourneysCard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Card className="glass-card p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#00F2FE]/20">
            <Wind className="w-5 h-5 text-[#00F2FE]" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">
            Breathing Journeys
          </h3>
        </div>
        <Link 
          to="/breathing" 
          className="text-xs text-[#00F2FE] hover:text-[#00F2FE]/80 flex items-center gap-1 transition-colors"
        >
          All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Journey Grid */}
      <div className="grid grid-cols-2 gap-3">
        {breathingJourneys.map((journey, index) => (
          <Link key={journey.id} to={journey.route}>
            <motion.div
              className="flex flex-col items-center gap-2 p-4 rounded-[16px] bg-white/[0.02] border border-white/10 hover:border-[#00F2FE]/40 hover:bg-white/[0.04] transition-all group cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className={`p-3 rounded-full ${journey.bgColor} group-hover:scale-110 transition-transform`}>
                <journey.icon className={`w-5 h-5 ${journey.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground text-center">
                {journey.labelKey}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </Card>
  );
};
