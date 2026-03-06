import React from 'react';
import { cn } from '@/lib/utils';

interface DurationSelectorProps {
  selectedDuration: number;
  onSelect: (duration: number) => void;
}

const durations = [
  { value: 5, label: '5 MINUTES', desc: 'A quantum reset — powerful in any gap.' },
  { value: 10, label: '10 MINUTES', desc: 'The sovereign minimum. Deep field entry.' },
  { value: 20, label: '20 MINUTES', desc: 'Full Nadi activation cycle.' },
  { value: 30, label: '30 MINUTES', desc: 'Complete Siddha immersion protocol.' },
];

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      {durations.map((d) => {
        const isSelected = selectedDuration === d.value;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onSelect(d.value)}
            className={cn(
              'onb-card w-full p-5 rounded-[20px] border backdrop-blur-xl flex items-center gap-4 text-left transition-all duration-300',
              isSelected
                ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.06] shadow-[0_0_30px_rgba(212,175,55,0.1)]'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-[#D4AF37]/20'
            )}
          >
            <div
              className={cn(
                'w-3 h-3 rounded-full flex-shrink-0 transition-colors',
                isSelected ? 'bg-[#D4AF37]' : 'bg-white/20'
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-white text-sm font-extrabold tracking-widest uppercase"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {d.label}
              </div>
              <p className="text-white/50 text-sm mt-0.5" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {d.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
