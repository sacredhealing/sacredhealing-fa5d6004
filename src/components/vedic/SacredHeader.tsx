import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export interface BirthDataDisplay {
  location: string;
  date: string;
  time: string;
}

interface SacredHeaderProps {
  name: string;
  birthData: BirthDataDisplay;
  syncTime: string;
  onAdjustBirthData?: () => void;
}

/**
 * Condensed header: only name + online dot visible; birth details in dropdown.
 */
export const SacredHeader: React.FC<SacredHeaderProps> = ({
  name,
  birthData,
  syncTime,
  onAdjustBirthData,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-amber-900/30 bg-[#0a0a0f]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((o) => !o);
          }
        }}
        className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-amber-900/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"
            aria-hidden
          />
          <h2 className="text-lg font-serif tracking-wide text-amber-100">{name}</h2>
        </div>
        <span className="text-amber-400/40 text-sm">
          {isOpen ? t('vedicAstrology.sacredHeaderClose') : t('vedicAstrology.sacredHeaderOpen')}
        </span>
      </div>

      {isOpen && (
        <div
          className="px-6 pb-5 border-t border-amber-900/20 bg-[#0d0d14] animate-in slide-in-from-top duration-300"
          role="region"
          aria-label={t('vedicAstrology.sacredHeaderBirthDetailsAria')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="text-sm text-amber-200/50 space-y-1">
              <p>📍 {birthData.location}</p>
              <p>🗓️ {birthData.date} {t('vedicAstrology.sacredHeaderAt')} {birthData.time}</p>
              <p className="text-xs italic">{t('vedicAstrology.sacredHeaderLastSynced', { time: syncTime })}</p>
            </div>
            <div className="flex flex-col gap-2">
              {onAdjustBirthData && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdjustBirthData();
                  }}
                  className="px-4 py-2 bg-amber-900/20 border border-amber-700/30 rounded-lg text-amber-200/70 hover:bg-amber-900/30 transition text-sm"
                >
                  {t('vedicAstrology.adjustBirthData')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
