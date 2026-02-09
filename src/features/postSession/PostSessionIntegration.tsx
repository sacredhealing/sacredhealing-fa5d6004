import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export interface PostSessionContext {
  dayPhase?: string;
  userState?: string;
  streakDays?: number;
  depth?: string;
  durationSec?: number;
  completed?: boolean;
  item?: {
    id?: string;
    title?: string;
    contentType?: string;
  };
}

interface Props {
  initialContext: PostSessionContext;
}

export function PostSessionIntegration({ initialContext }: Props) {
  const navigate = useNavigate();
  const { item, durationSec, depth } = initialContext;

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
        <p className="text-slate-500 text-sm">
          Carry the feeling forward. A gentle next step awaits.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/explore')}
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            Explore More
          </Button>
        </div>
      </div>
    </div>
  );
}
