import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeSelectorProps {
  morningTime: string;
  middayTime: string;
  eveningTime: string;
  onMorningChange: (time: string) => void;
  onMiddayChange: (time: string) => void;
  onEveningChange: (time: string) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  morningTime,
  middayTime,
  eveningTime,
  onMorningChange,
  onMiddayChange,
  onEveningChange,
}) => {
  const timeSlots = [
    {
      id: 'morning',
      label: 'Morning Practice',
      description: 'Start your day mindfully',
      icon: Sun,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      iconColor: 'text-amber-400',
      value: morningTime,
      onChange: onMorningChange,
    },
    {
      id: 'midday',
      label: 'Midday Check-in',
      description: 'A moment of calm',
      icon: Cloud,
      color: 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
      iconColor: 'text-sky-400',
      value: middayTime,
      onChange: onMiddayChange,
    },
    {
      id: 'evening',
      label: 'Evening Reset',
      description: 'Wind down peacefully',
      icon: Moon,
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30',
      iconColor: 'text-indigo-400',
      value: eveningTime,
      onChange: onEveningChange,
    },
  ];

  return (
    <div className="space-y-4">
      {timeSlots.map((slot, index) => {
        const Icon = slot.icon;
        
        return (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border bg-gradient-to-br ${slot.color}`}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-background/20">
                <Icon className={`w-5 h-5 ${slot.iconColor}`} />
              </div>
              <div className="flex-1">
                <Label htmlFor={slot.id} className="font-semibold text-foreground">
                  {slot.label}
                </Label>
                <p className="text-xs text-muted-foreground">{slot.description}</p>
              </div>
              <Input
                id={slot.id}
                type="time"
                value={slot.value}
                onChange={(e) => slot.onChange(e.target.value || slot.value)}
                className="w-28 bg-background/50 border-border/50"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
