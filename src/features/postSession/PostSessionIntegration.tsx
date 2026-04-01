import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { getIntegrationUI, type PostSessionEmotion } from './integrationCopy';
import type { PostSessionContext } from './sessionContext';

export type { PostSessionContext } from './sessionContext';

interface Props {
  initialContext: PostSessionContext;
}

function EmotionButton({
  label,
  onClick,
  isSelected,
}: {
  label: string;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 py-4 px-6 rounded-[24px] text-sm font-semibold transition-all duration-200
        border min-w-0
        ${isSelected
          ? 'bg-[#D4AF37]/12 border-[#D4AF37]/35 text-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.14)]'
          : 'bg-white/[0.03] border-white/[0.06] text-white/70 hover:bg-white/[0.05] hover:border-white/[0.10]'
        }
      `}
    >
      {label}
    </button>
  );
}

export function PostSessionIntegration({ initialContext }: Props) {
  const navigate = useNavigate();
  const { item, durationSec, depth } = initialContext;
  const [emotion, setEmotion] = useState<PostSessionEmotion | null>(null);

  const ui = getIntegrationUI(initialContext, emotion ?? undefined);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] text-white"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 42%), radial-gradient(ellipse 90% 70% at 15% 25%, rgba(255,255,255,0.05) 0%, transparent 50%), #050505",
      }}
    >
      <div className="max-w-md w-full text-center">
        <div className="glass-card space-y-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center border border-[#D4AF37]/25 shadow-[0_0_30px_rgba(212,175,55,0.12)]">
              <Sparkles className="w-9 h-9 text-[#D4AF37]" />
            </div>
          </div>

          <div>
            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">
              Vedic Light-Codes integrated
            </div>
            <h1 className="mt-3 text-[28px] leading-[1.05] font-black tracking-[-0.05em] text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)]">
              Session Complete
            </h1>
            <p className="mt-3 text-white/60 leading-[1.6]">
            {item?.title || 'Meditation'} finished
            {durationSec != null && ` • ${Math.floor(durationSec / 60)} min`}
            {depth && ` • ${depth}`}
            </p>
          </div>

          <p className="text-white/80 text-[15px] leading-[1.7] min-h-[3rem] transition-all duration-300">
            {ui.message}
          </p>

          <div className="space-y-4">
            <p className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/60">
              How does it feel now?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <EmotionButton
                label="Softer"
                onClick={() => setEmotion('softer')}
                isSelected={emotion === 'softer'}
              />
              <EmotionButton
                label="Clear"
                onClick={() => setEmotion('clear')}
                isSelected={emotion === 'clear'}
              />
              <EmotionButton
                label="Heavy"
                onClick={() => setEmotion('still-heavy')}
                isSelected={emotion === 'still-heavy'}
              />
              <EmotionButton
                label="Restless"
                onClick={() => setEmotion('restless')}
                isSelected={emotion === 'restless'}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => navigate(ui.ctaRoute)}
              className="w-full rounded-[20px] bg-[#D4AF37] text-[#050505] font-black hover:opacity-90"
            >
              {ui.ctaLabel}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-[20px] border-white/15 bg-white/[0.02] text-white/85 hover:bg-white/[0.05]"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/explore')}
              className="w-full rounded-[20px] text-white/60 hover:text-[#D4AF37] hover:bg-white/[0.03]"
            >
              Explore More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
