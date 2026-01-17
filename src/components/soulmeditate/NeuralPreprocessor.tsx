import React, { useEffect, useState } from 'react';
import { Loader2, Zap, Volume2, AudioWaveform } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface NeuralPreprocessorProps {
  isProcessing: boolean;
  stage?: 'analyzing' | 'normalizing' | 'gating' | 'limiting' | 'complete';
  autoGainDb?: number;
}

const STAGE_LABELS: Record<string, string> = {
  analyzing: 'Analyzing RMS levels...',
  normalizing: 'Normalizing to -14 LUFS...',
  gating: 'Applying intelligent noise gate...',
  limiting: 'Engaging soft-knee limiter...',
  complete: 'Neural cleaning complete',
};

const STAGE_ORDER = ['analyzing', 'normalizing', 'gating', 'limiting', 'complete'];

export default function NeuralPreprocessor({ 
  isProcessing, 
  stage = 'analyzing',
  autoGainDb = 0 
}: NeuralPreprocessorProps) {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    if (!isProcessing) {
      setDots('');
      return;
    }
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 300);
    
    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isProcessing && stage !== 'complete') return null;

  const stageIndex = STAGE_ORDER.indexOf(stage);
  const progress = stage === 'complete' ? 100 : ((stageIndex + 1) / (STAGE_ORDER.length - 1)) * 100;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-950/80 border border-cyan-500/30 p-4">
      {/* Pulsing cyan status bar */}
      <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 ${
            isProcessing ? 'animate-pulse' : ''
          }`}
          style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          stage === 'complete' 
            ? 'bg-cyan-500/20' 
            : 'bg-cyan-500/10 animate-pulse'
        }`}>
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : (
            <Zap className="w-5 h-5 text-cyan-400" />
          )}
        </div>

        {/* Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-cyan-300">
              Neural Cleaning{isProcessing ? dots : ''}
            </span>
            {stage === 'complete' && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                Ready
              </span>
            )}
          </div>
          <p className="text-xs text-cyan-400/70 font-mono truncate">
            {STAGE_LABELS[stage] || 'Processing...'}
          </p>
        </div>

        {/* Pre-Gain Readout */}
        {(stage === 'complete' || stage === 'limiting') && autoGainDb !== 0 && (
          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-cyan-500/20">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <div className="text-right">
              <div className="text-[10px] text-cyan-400/60 uppercase tracking-wider">Pre-Gain</div>
              <div className={`text-sm font-mono font-bold ${
                autoGainDb > 0 ? 'text-green-400' : autoGainDb < 0 ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                {autoGainDb > 0 ? '+' : ''}{autoGainDb.toFixed(1)} dB
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isProcessing && (
        <div className="mt-3">
          <Progress value={progress} className="h-1 bg-cyan-950" />
        </div>
      )}
    </div>
  );
}
