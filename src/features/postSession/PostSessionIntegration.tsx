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
        flex-1 py-4 px-6 rounded-2xl text-base font-medium transition-all duration-200
        border-2 min-w-0
        ${isSelected
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <Sparkles className="w-10 h-10 text-amber-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Session Complete</h1>
          <p className="text-slate-400">
            {item?.title || 'Meditation'} finished
            {durationSec != null && ` • ${Math.floor(durationSec / 60)} min`}
            {depth && ` • ${depth}`}
          </p>
        </div>

        <p className="text-slate-300 text-lg leading-relaxed min-h-[3rem] transition-all duration-300">
          {ui.message}
        </p>

        <div className="space-y-4">
          <p className="text-slate-500 text-sm font-medium">How does it feel now?</p>
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
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
          >
            {ui.ctaLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            Go to Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/explore')}
            className="w-full text-slate-500 hover:text-slate-300 hover:bg-white/5"
          >
            Explore More
          </Button>
        </div>
      </div>
    </div>
  );
}
