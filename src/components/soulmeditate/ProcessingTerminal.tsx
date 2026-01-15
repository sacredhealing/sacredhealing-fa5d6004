import React, { useEffect, useState } from 'react';
import { Loader2, Terminal } from 'lucide-react';

interface ProcessingTerminalProps {
  isProcessing: boolean;
  stage?: string;
}

const PROCESSING_STAGES = [
  'Initializing Neural Reconstruction Logic...',
  'Buffering PCM waveforms...',
  'Calibrating frequency harmonics...',
  'Synchronizing binaural entrainment...',
  'Applying sacred geometry filters...',
  'Mastering spectral dynamics...',
  'Finalizing quantum coherence...',
];

export default function ProcessingTerminal({ isProcessing, stage }: ProcessingTerminalProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStage(0);
      setDots('');
      return;
    }

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    // Cycle through stages
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => (prev + 1) % PROCESSING_STAGES.length);
    }, 2000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(stageInterval);
    };
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Neural Processing</h3>
            <p className="text-xs text-white/50">Spectral Alchemy in Progress</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-pulse"
              style={{ width: `${((currentStage + 1) / PROCESSING_STAGES.length) * 100}%` }}
            />
          </div>

          {/* Current stage */}
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <span className="text-sm text-cyan-400 font-mono">
              {stage || PROCESSING_STAGES[currentStage]}{dots}
            </span>
          </div>

          {/* Terminal-style output */}
          <div className="bg-black/50 rounded-lg p-3 font-mono text-[10px] text-slate-500 space-y-1 max-h-32 overflow-y-auto">
            {PROCESSING_STAGES.slice(0, currentStage + 1).map((s, i) => (
              <div key={i} className={i === currentStage ? 'text-cyan-400' : 'text-slate-600'}>
                {'>'} {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
