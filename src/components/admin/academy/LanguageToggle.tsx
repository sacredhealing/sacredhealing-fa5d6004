import React from 'react';
import type { Language } from '@/types/academy';

interface LanguageToggleProps {
  language: Language;
  onToggle: (lang: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ language, onToggle }) => {
  return (
    <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => onToggle('en')}
        className={`px-4 py-1.5 rounded-full text-[10px] tracking-widest font-bold transition-all duration-300 ${
          language === 'en' ? 'bg-turquoise-gradient text-[#0f0720] shadow-[0_0_20px_rgba(45,212,191,0.3)]' : 'text-slate-400 hover:text-teal-400'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onToggle('sv')}
        className={`px-4 py-1.5 rounded-full text-[10px] tracking-widest font-bold transition-all duration-300 ${
          language === 'sv' ? 'bg-turquoise-gradient text-[#0f0720] shadow-[0_0_20px_rgba(45,212,191,0.3)]' : 'text-slate-400 hover:text-teal-400'
        }`}
      >
        SV
      </button>
    </div>
  );
};
