import React from 'react';
import { ACTIVATIONS } from '@/features/quantum-apothecary/constants';
import type { Activation } from '@/features/quantum-apothecary/types';

interface Props {
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  selectedActivations: Activation[];
  addActivation: (act: Activation) => void;
}

export default function FrequencyLibrarySection({
  activeCategory,
  setActiveCategory,
  selectedActivations,
  addActivation,
}: Props) {
  return (
    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold">Frequency Library</h2>
        <p className="text-[10px] text-white/40">Select essences for your transmission</p>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {['All', 'Sacred Plant', 'Siddha Soma', 'Essential Oil', 'Ayurvedic Herb', 'Mineral', 'Mushroom', 'Adaptogen'].map(
          type => (
            <button
              key={type}
              onClick={() => setActiveCategory(type)}
              className={`text-[9px] uppercase tracking-tight px-2.5 py-1.5 border rounded-md transition ${
                activeCategory === type
                  ? 'bg-[#ff4e00] border-[#ff4e00] text-white shadow-[0_0_15px_rgba(255,78,0,0.3)]'
                  : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              {type}
            </button>
          ),
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
        {ACTIVATIONS.filter(act => activeCategory === 'All' || act.type === activeCategory).map(act => (
          <button
            key={act.id}
            onClick={() => addActivation(act)}
            disabled={!!selectedActivations.find(a => a.id === act.id)}
            className="text-left p-3 bg-white/5 border border-white/5 hover:border-[#ff4e00]/40 hover:bg-[#ff4e00]/5 transition rounded-2xl disabled:opacity-30 relative overflow-hidden"
          >
            <div
              className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
              style={{ background: act.color, filter: 'blur(20px)' }}
            />
            <p className="text-xs font-bold relative">{act.name}</p>
            <p className="text-[10px] text-white/40 relative mt-0.5">
              {act.benefit}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

