import React from 'react';
import { BookOpen, Languages } from 'lucide-react';

interface SanskritVerseProps {
  content: string;
  devanagari?: string;
  translation?: string | null;
  padapatha?: string | null;
  iast?: string;
}

export const SanskritVerse: React.FC<SanskritVerseProps> = ({
  content,
  devanagari,
  translation,
  padapatha,
  iast
}) => {
  return (
    <div className="card-glass !rounded-[28px] !p-6 space-y-4">
      {/* Devanagari Script (Primary) */}
      {devanagari && (
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-serif text-white leading-relaxed mb-2" dir="ltr">
            {devanagari}
          </div>
          {iast && iast !== content && (
            <div className="text-sm text-white/40 italic mb-2">
              {iast}
            </div>
          )}
        </div>
      )}

      {/* IAST Transliteration (if no Devanagari) */}
      {!devanagari && (
        <div className="text-center">
          <div className="text-xl sm:text-2xl font-mono text-white leading-relaxed mb-2">
            {content}
          </div>
        </div>
      )}

      {/* Translation */}
      {translation && (
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-start gap-2 mb-2">
            <Languages className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0" />
            <h4 className="text-sm font-bold text-[#D4AF37]">Translation</h4>
          </div>
          <p className="text-white/70 leading-relaxed pl-6">
            {translation}
          </p>
        </div>
      )}

      {/* Padapatha (Word-for-word) */}
      {padapatha && (
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-start gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0" />
            <h4 className="text-sm font-bold text-[#D4AF37]">Padapatha</h4>
          </div>
          <p className="text-sm text-white/40 font-mono leading-relaxed pl-6">
            {padapatha}
          </p>
        </div>
      )}
    </div>
  );
};
