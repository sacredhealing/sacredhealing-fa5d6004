import React from 'react';
import { Input } from '@/components/ui/input';

interface TimeSelectorProps {
  morningTime: string;
  middayTime: string;
  eveningTime: string;
  onMorningChange: (time: string) => void;
  onMiddayChange: (time: string) => void;
  onEveningChange: (time: string) => void;
}

const SunIcon = () => (
  <svg className="w-6 h-6 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const BoltIcon = () => (
  <svg className="w-6 h-6 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const MoonIcon = () => (
  <svg className="w-6 h-6 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const timeSlots = [
  { id: 'morning', label: 'Morning', valueKey: 'morningTime' as const, Icon: SunIcon },
  { id: 'midday', label: 'Midday', valueKey: 'middayTime' as const, Icon: BoltIcon },
  { id: 'evening', label: 'Evening', valueKey: 'eveningTime' as const, Icon: MoonIcon },
];

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  morningTime,
  middayTime,
  eveningTime,
  onMorningChange,
  onMiddayChange,
  onEveningChange,
}) => {
  const values = { morningTime, middayTime, eveningTime };
  const handlers = { morningTime: onMorningChange, middayTime: onMiddayChange, eveningTime: onEveningChange };

  return (
    <div className="space-y-4">
      {timeSlots.map((slot) => {
        const Icon = slot.Icon;
        const value = values[slot.valueKey];
        const onChange = handlers[slot.valueKey];
        return (
          <div
            key={slot.id}
            className="onb-card p-5 rounded-[20px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-11 h-11">
                <Icon />
              </div>
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={slot.id}
                  className="text-white/40 text-[8px] font-extrabold tracking-widest uppercase block"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {slot.label}
                </label>
                <Input
                  id={slot.id}
                  type="time"
                  value={value}
                  onChange={(e) => onChange(e.target.value || value)}
                  className="mt-1 w-28 bg-transparent border-0 border-b border-white/10 rounded-none text-[#D4AF37] text-[2rem] font-[300] p-0 h-auto focus-visible:ring-0 focus-visible:border-[#D4AF37]/50"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
