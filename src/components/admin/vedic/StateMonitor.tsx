import React from 'react';
import { Download } from 'lucide-react';
import type { ProjectState } from '@/types/vedicTranslation';

interface Props {
  state: ProjectState;
  onOpenArchive: () => void;
  onExportToFile?: () => void;
  onPublishToStargate?: () => void;
  publishingToStargate?: boolean;
}

export const StateMonitor: React.FC<Props> = ({
  state,
  onOpenArchive,
  onExportToFile,
  onPublishToStargate,
  publishingToStargate,
}) => {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-4xl">📜</span>
      </div>
      <h2 className="cinzel text-xs font-bold sacred-gold mb-10 flex items-center tracking-[0.4em] border-b border-white/5 pb-4 uppercase">
        Project Focus
      </h2>
      <div className="space-y-10">
        <div>
          <label className="text-[9px] uppercase font-bold text-white/20 tracking-[0.3em] block mb-3">Active Manuscript</label>
          <div className="text-2xl font-bold cinzel tracking-tight transition-colors duration-500 sacred-gold uppercase">
            {state.currentBook}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="border-l border-white/10 pl-5">
            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.2em] block mb-2">Chapter</label>
            <div className="text-3xl font-light cinzel text-slate-100">{state.chapter}</div>
          </div>
          <div className="border-l border-white/10 pl-5">
            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.2em] block mb-2">Verse</label>
            <div className="text-3xl font-light cinzel text-slate-100">{state.verse}</div>
          </div>
        </div>
        <div className="pt-6">
          <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-[0.2em] text-slate-500 mb-3">
            <span>Archival Integrity</span>
            <span className="sacred-gold">{(state.interactionCount % 5) + 1} / 5</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-[var(--theme-accent)] shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-in-out"
              style={{ width: `${((state.interactionCount % 5) + 1) * 20}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenArchive}
          className="w-full bg-white/5 border border-white/10 text-white/60 px-4 py-4 rounded-xl text-[10px] font-bold cinzel tracking-[0.4em] mt-6 hover:bg-white/10 hover:text-white transition-all uppercase"
        >
          Explore Sacred Archive
        </button>
        {onExportToFile && (
          <button
            type="button"
            onClick={onExportToFile}
            className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-4 rounded-xl text-[10px] font-bold cinzel tracking-[0.4em] mt-3 hover:bg-amber-500/20 transition-all uppercase flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export & Push to Git
          </button>
        )}
        {onPublishToStargate && (
          <button
            type="button"
            onClick={onPublishToStargate}
            disabled={publishingToStargate}
            className="w-full mt-3 py-4 px-6 rounded-2xl transition-all border uppercase tracking-widest text-xs font-bold cinzel bg-amber-500/5 border-amber-500/20 text-amber-500/70 hover:bg-amber-500/15 hover:text-amber-400 disabled:opacity-50 disabled:pointer-events-none"
          >
            {publishingToStargate ? 'Publicerar…' : '🌟 Publish to Stargate'}
          </button>
        )}
      </div>
    </div>
  );
};
