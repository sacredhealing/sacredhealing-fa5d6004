import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Brain, Heart, Sparkles, Sun, Leaf } from 'lucide-react';
import { GoalType } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface GoalSelectorProps {
  selectedGoals: GoalType[];
  onToggle: (goal: GoalType) => void;
}

const goals: { type: GoalType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { 
    type: 'stress', 
    label: 'Reduce Stress', 
    description: 'Find calm in chaos',
    icon: Leaf, 
    color: 'from-green-500/20 to-emerald-500/10 border-green-500/30 hover:border-green-500/50' 
  },
  { 
    type: 'sleep', 
    label: 'Better Sleep', 
    description: 'Rest deeply each night',
    icon: Moon, 
    color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 hover:border-indigo-500/50' 
  },
  { 
    type: 'focus', 
    label: 'Improve Focus', 
    description: 'Sharpen your mind',
    icon: Brain, 
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50' 
  },
  { 
    type: 'healing', 
    label: 'Emotional Healing', 
    description: 'Release & transform',
    icon: Heart, 
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 hover:border-rose-500/50' 
  },
  { 
    type: 'awakening', 
    label: 'Spiritual Awakening', 
    description: 'Expand consciousness',
    icon: Sparkles, 
    color: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 hover:border-purple-500/50' 
  },
  { 
    type: 'peace', 
    label: 'Inner Peace', 
    description: 'Cultivate tranquility',
    icon: Sun, 
    color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 hover:border-cyan-500/50' 
  },
];

export const GoalSelector: React.FC<GoalSelectorProps> = ({ selectedGoals, onToggle }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {goals.map((goal, index) => {
        const Icon = goal.icon;
        const isSelected = selectedGoals.includes(goal.type);
        
        return (
          <motion.button
            key={goal.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onToggle(goal.type)}
            className={cn(
              'p-4 rounded-xl border bg-gradient-to-br transition-all duration-300 text-left',
              goal.color,
              isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg shrink-0',
                isSelected ? 'bg-primary/30' : 'bg-foreground/10'
              )}>
                <Icon className={cn(
                  'w-5 h-5',
                  isSelected ? 'text-primary' : 'text-foreground/70'
                )} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{goal.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
