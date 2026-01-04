import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DurationSelectorProps {
  selectedDuration: number;
  onSelect: (duration: number) => void;
}

const durations = [
  { value: 5, label: '5 min', description: 'Quick reset' },
  { value: 10, label: '10 min', description: 'Daily practice' },
  { value: 20, label: '20 min', description: 'Deep session' },
  { value: 30, label: '30+ min', description: 'Immersive journey' },
];

export const DurationSelector: React.FC<DurationSelectorProps> = ({ 
  selectedDuration, 
  onSelect 
}) => {
  return (
    <div className="space-y-3">
      {durations.map((duration, index) => {
        const isSelected = selectedDuration === duration.value;
        
        return (
          <motion.button
            key={duration.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(duration.value)}
            className={cn(
              'w-full p-4 rounded-xl border transition-all duration-300 flex items-center gap-4',
              isSelected 
                ? 'bg-primary/20 border-primary/50 ring-2 ring-primary/30' 
                : 'bg-muted/30 border-border/50 hover:bg-muted/50'
            )}
          >
            <div className={cn(
              'p-3 rounded-full',
              isSelected ? 'bg-primary/30' : 'bg-muted'
            )}>
              <Clock className={cn(
                'w-5 h-5',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div className="text-left flex-1">
              <h3 className={cn(
                'font-semibold',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {duration.label}
              </h3>
              <p className="text-sm text-muted-foreground">{duration.description}</p>
            </div>
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
            )}>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-primary-foreground"
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
