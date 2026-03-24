import React from 'react';
import { Zap, ShieldCheck, X } from 'lucide-react';
import type { Activation } from '@/features/quantum-apothecary/types';

interface Props {
  activeTransmissions: Activation[];
  setActiveTransmissions: React.Dispatch<React.SetStateAction<Activation[]>>;
}

export default function ActiveTransmissionsSection({
  activeTransmissions,
  setActiveTransmissions,
}: Props) {
  return (
    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#ff4e00]" />
          <h2 className="text-sm font-bold">Active Transmissions</h2>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
          24/7 Live
        </span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        {activeTransmissions.length === 0 ? (
          <div className="text-center py-4 text-white/20">
            <ShieldCheck size={20} className="mx-auto mb-1" />
            <p className="text-[10px]">No Active Frequencies</p>
          </div>
        ) : (
          activeTransmissions.map(act => (
            <div
              key={act.id}
              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 group"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full" style={{ background: act.color }} />
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: act.color, opacity: 0.3 }}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium">{act.name}</p>
                  <p className="text-[9px] text-white/30">Resonating...</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTransmissions(t => t.filter(x => x.id !== act.id))}
                className="p-1 text-white/20 hover:text-red-400 transition"
                title="Dissolve"
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

