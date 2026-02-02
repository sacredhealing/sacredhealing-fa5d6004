import React from 'react';
import { motion } from 'framer-motion';
import { GoalType } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface GoalSelectorProps {
  selectedGoals: GoalType[];
  onToggle: (goal: GoalType) => void;
}

// Simplified, transformational goals - Mindvalley style
const goals: { 
  type: GoalType; 
  label: string; 
  color: string;
  bgGradient: string;
}[] = [
  { 
    type: 'peace', 
    label: 'Calm', 
    color: 'text-indigo-600',
    bgGradient: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-400'
  },
  { 
    type: 'sleep', 
    label: 'Sleep', 
    color: 'text-blue-600',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-400'
  },
  { 
    type: 'healing', 
    label: 'Healing', 
    color: 'text-rose-600',
    bgGradient: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 hover:border-rose-400'
  },
  { 
    type: 'focus', 
    label: 'Focus', 
    color: 'text-amber-600',
    bgGradient: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400'
  },
  { 
    type: 'awakening', 
    label: 'Awakening', 
    color: 'text-violet-600',
    bgGradient: 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:border-violet-400'
  },
];

export const GoalSelector: React.FC<GoalSelectorProps> = ({ selectedGoals, onToggle }) => {
  return (
    <div className="space-y-3 max-w-md mx-auto">
      {goals.map((goal, index) => {
        const isSelected = selectedGoals.includes(goal.type);
        
        return (
          <motion.button
            key={goal.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            onClick={() => onToggle(goal.type)}
            className={cn(
              'w-full p-4 rounded-xl border-2 transition-all duration-200 text-center font-medium text-lg',
              goal.bgGradient,
              isSelected 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] shadow-md border-primary' 
                : 'hover:scale-[1.01] hover:shadow-sm'
            )}
          >
            <span className={cn(
              'transition-colors font-semibold',
              goal.color
            )}>
              {goal.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
