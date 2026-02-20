import React from 'react';
import type { VedicBook } from '@/types/vedicTranslation';

interface Props {
  currentBook: VedicBook;
}

export const VedicHeader: React.FC<Props> = ({ currentBook }) => {
  return (
    <header className="py-12 px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="mb-6">
          <img
            src="https://raw.githubusercontent.com/BhaktiMarga/brand-assets/main/logos/BM_Logo_Gold.png"
            alt="Bhakti Marga"
            className="h-12 w-auto opacity-90 brightness-110 mx-auto"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <h1 className="cinzel text-4xl md:text-6xl font-semibold tracking-[0.2em] mb-2 text-white uppercase">
          {currentBook}
        </h1>
        <p className="cinzel text-xl md:text-2xl italic tracking-[0.3em] sacred-gold essentials-title mb-8 uppercase">
          Essentials
        </p>
        <div className="flex items-center space-x-4 opacity-40">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[var(--theme-accent)]" />
          <p className="text-white text-[10px] tracking-[0.5em] uppercase font-bold">
            Paramahamsa Vishwananda
          </p>
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[var(--theme-accent)]" />
        </div>
      </div>
    </header>
  );
};
