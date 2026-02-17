import React from 'react';
import { BookOpen, Languages } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-cyan-900/20 border-purple-500/30 backdrop-blur-xl">
      <CardContent className="p-6 space-y-4">
        {/* Devanagari Script (Primary) */}
        {devanagari && (
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-serif text-foreground leading-relaxed mb-2" dir="ltr">
              {devanagari}
            </div>
            {iast && iast !== content && (
              <div className="text-sm text-muted-foreground/80 italic mb-2">
                {iast}
              </div>
            )}
          </div>
        )}

        {/* IAST Transliteration (if no Devanagari) */}
        {!devanagari && (
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-mono text-foreground leading-relaxed mb-2">
              {content}
            </div>
          </div>
        )}

        {/* Translation */}
        {translation && (
          <div className="border-t border-purple-500/20 pt-4">
            <div className="flex items-start gap-2 mb-2">
              <Languages className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
              <h4 className="text-sm font-semibold text-purple-300">Translation</h4>
            </div>
            <p className="text-foreground/90 leading-relaxed pl-6">
              {translation}
            </p>
          </div>
        )}

        {/* Padapatha (Word-for-word) */}
        {padapatha && (
          <div className="border-t border-purple-500/20 pt-4">
            <div className="flex items-start gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
              <h4 className="text-sm font-semibold text-purple-300">Padapatha</h4>
            </div>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed pl-6">
              {padapatha}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
