import React from 'react';
import type { CourseModule, Language } from '@/types/academy';

interface ModuleCardProps {
  module: CourseModule;
  language: Language;
  onClick: () => void;
  isActive: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, language, onClick, isActive }) => {
  const displayTitle = module.content?.title?.[language] || module.topic.split(':')[0];
  const isGenerated = !!module.content;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-6 rounded-[2rem] transition-all duration-500 relative group overflow-hidden outline-none ${
        isActive
          ? 'bg-white/10 border-teal-500/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] border'
      }`}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-turquoise-gradient shadow-[0_0_20px_rgba(45,212,191,1)]" />
      )}

      <div className="flex items-center justify-between mb-3">
        <span className={`text-[9px] font-black tracking-[0.25em] uppercase transition-colors ${isActive ? 'text-teal-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
          Month {module.month}
        </span>
        <div className="flex items-center gap-2">
          {!isGenerated && (
            <span className="text-[7px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-purple-500/10">
              Planned
            </span>
          )}
          <div className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${isActive ? 'bg-teal-400 shadow-[0_0_12px_#2dd4bf]' : isGenerated ? 'bg-purple-500' : 'bg-slate-800'}`} />
        </div>
      </div>

      <h3 className={`text-xl font-bold mb-2 leading-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
        {displayTitle}
      </h3>

      <p className={`text-[11px] line-clamp-2 font-medium leading-relaxed italic transition-colors ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
        {module.content?.objective?.[language] || 'Wisdom transmission awaiting generation...'}
      </p>

      {isGenerated && !isActive && (
        <div className="absolute bottom-4 right-6 text-teal-400 text-[8px] font-black tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          SELECT PATH →
        </div>
      )}
    </button>
  );
};
