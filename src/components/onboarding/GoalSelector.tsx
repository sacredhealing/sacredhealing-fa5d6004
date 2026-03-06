import React from 'react';
import { GoalType } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface GoalSelectorProps {
  selectedGoals: GoalType[];
  onToggle: (goal: GoalType) => void;
}

const goals: {
  type: GoalType;
  name: string;
  desc: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    type: 'peace',
    name: 'INNER STILLNESS',
    desc: 'Calm the nervous system. Find the eye of the storm.',
    Icon: ({ className }) => (
      <svg className={cn('w-11 h-11', className)} viewBox="0 0 44 44" fill="none" style={{ animation: 'pulse-scale 2s ease-in-out infinite' }}>
        <circle cx="22" cy="22" r="18" stroke="#22D3EE" strokeWidth="1.2" opacity="0.9" fill="none" />
        <circle cx="22" cy="22" r="12" stroke="#22D3EE" strokeWidth="0.8" opacity="0.5" fill="none" />
        <circle cx="22" cy="22" r="4" fill="#22D3EE" opacity="0.8" />
      </svg>
    ),
  },
  {
    type: 'sleep',
    name: 'DEEP REST',
    desc: 'Restore through sacred sleep and Nadi relaxation.',
    Icon: ({ className }) => (
      <svg className={cn('w-11 h-11', className)} viewBox="0 0 44 44" fill="none">
        <path d="M22 8c-8 0-14 6-14 14 0 4 2 8 5 10.5.5.4 1.2.2 1.2-.4v-4c0-.4-.3-.7-.7-.6-3.5 1.2-6-2.2-6-5.5 0-6 5-11 11-11s11 5 11 11c0 3.3-2.5 6.7-6 5.5-.4-.1-.7.2-.7.6v4c0 .6.7.8 1.2.4 3-2.5 5-6.5 5-10.5 0-8-6-14-14-14z" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.85" />
        <path d="M14 24h16M14 28h12M14 32h10" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: 'healing',
    name: 'CELLULAR HEALING',
    desc: "Activate the body's quantum repair frequencies.",
    Icon: ({ className }) => (
      <svg className={cn('w-11 h-11', className)} viewBox="0 0 44 44" fill="none" style={{ animation: 'pulse-scale 1.5s ease-in-out infinite' }}>
        <path d="M22 10v24M10 22h24" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
        <path d="M22 10c-4 4-8 6-8 12s4 8 8 12 8-6 8-12-4-8-8-12z" stroke="#D4AF37" strokeWidth="1" fill="rgba(212,175,55,0.15)" opacity="0.9" />
        <path d="M22 34c4-4 8-6 8-12s-4-8-8-12-8 6-8 12 4 8 8 12z" stroke="#D4AF37" strokeWidth="1" fill="rgba(212,175,55,0.1)" opacity="0.9" />
      </svg>
    ),
  },
  {
    type: 'focus',
    name: 'SOVEREIGN FOCUS',
    desc: 'Sharpen attention. Clear the Ajna field.',
    Icon: ({ className }) => (
      <svg className={cn('w-11 h-11', className)} viewBox="0 0 44 44" fill="none">
        <path d="M22 6l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10z" stroke="rgba(255,255,255,0.95)" strokeWidth="1" fill="none" opacity="0.9" />
        <circle cx="22" cy="22" r="3" fill="rgba(255,255,255,0.8)" />
      </svg>
    ),
  },
  {
    type: 'awakening',
    name: 'SPIRITUAL AWAKENING',
    desc: 'Activate dormant Vedic Light-Codes within your DNA.',
    Icon: ({ className }) => (
      <svg className={cn('w-11 h-11', className)} viewBox="0 0 44 44" fill="none">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 22 + 20 * Math.cos(rad);
          const y1 = 22 + 20 * Math.sin(rad);
          const x2 = 22 + 6 * Math.cos(rad);
          const y2 = 22 + 6 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D4AF37" strokeWidth="1.2" opacity="0.9" />;
        })}
        <circle cx="22" cy="22" r="5" stroke="#D4AF37" strokeWidth="0.8" fill="rgba(212,175,55,0.2)" opacity="0.9" />
      </svg>
    ),
  },
];

export const GoalSelector: React.FC<GoalSelectorProps> = ({ selectedGoals, onToggle }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {goals.map((goal) => {
        const isSelected = selectedGoals.includes(goal.type);
        const Icon = goal.Icon;
        return (
          <button
            key={goal.type}
            type="button"
            onClick={() => onToggle(goal.type)}
            className={cn(
              'onb-card w-full text-left p-5 md:py-5 md:px-7 rounded-[20px] border backdrop-blur-xl flex items-center gap-4 relative transition-all duration-300',
              isSelected
                ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.06] shadow-[0_0_30px_rgba(212,175,55,0.1)]'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-[#D4AF37]/20'
            )}
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 text-[#D4AF37] text-sm" aria-hidden>✦</span>
            )}
            <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center">
              <Icon className={isSelected ? 'opacity-100' : 'opacity-70'} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-[11px] font-extrabold tracking-[0.3em] uppercase">
                {goal.name}
              </div>
              <div className="text-white/50 text-[0.95rem] italic mt-0.5" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {goal.desc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
