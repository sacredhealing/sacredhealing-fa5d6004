import React from 'react';
import { BookChapter } from '@/hooks/useScripturalBooks';
import { SanskritVerse } from './SanskritVerse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Sparkles } from 'lucide-react';

interface BookReaderProps {
  chapters: BookChapter[];
  bookTitle: string;
  /** Side-by-side Devanagari + Swedish/translation (SQI admin / library). */
  verseLayout?: 'stacked' | 'split';
}

export const BookReader: React.FC<BookReaderProps> = ({ chapters, bookTitle, verseLayout = 'stacked' }) => {
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Book Header */}
      <div className="bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-cyan-900/30 backdrop-blur-xl border-b border-purple-500/20 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-2">
            {bookTitle}
          </h1>
          <p className="text-muted-foreground">
            {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
          </p>
        </div>
      </div>

      {/* Chapters */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {chapters.map((chapter) => (
          <Card
            key={chapter.id}
            className="bg-gradient-to-br from-background/40 via-background/30 to-background/40 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl font-heading text-foreground mb-2">
                    Chapter {chapter.chapter_number}: {chapter.title || `Chapter ${chapter.chapter_number}`}
                  </CardTitle>
                  {chapter.theme && (
                    <p className="text-sm text-purple-300/80 mb-2 italic">
                      {chapter.theme}
                    </p>
                  )}
                  {chapter.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {chapter.summary}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {chapter.content.map((segment, idx) => (
                <div key={idx}>
                  {segment.type === 'VERSE' && verseLayout === 'split' ? (
                    <div
                      className="grid gap-4 md:grid-cols-2 md:gap-6 rounded-[28px] p-5 md:p-6"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(40px)',
                      }}
                    >
                      <div className="min-w-0">
                        <p
                          className="text-[8px] font-extrabold tracking-[0.35em] uppercase mb-2"
                          style={{ color: 'rgba(212,175,55,0.5)' }}
                        >
                          Devanagari
                        </p>
                        <div
                          className="text-xl sm:text-2xl font-serif leading-relaxed"
                          style={{ color: 'rgba(253, 230, 138, 0.95)' }}
                          dir="ltr"
                        >
                          {segment.devanagari?.trim() || segment.content || '—'}
                        </div>
                        {segment.devanagari && segment.content && segment.content !== segment.devanagari && (
                          <p className="mt-3 text-xs font-mono italic text-white/35">{segment.content}</p>
                        )}
                      </div>
                      <div className="min-w-0 border-t border-white/[0.06] pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0">
                        <p
                          className="text-[8px] font-extrabold tracking-[0.35em] uppercase mb-2"
                          style={{ color: 'rgba(212,175,55,0.5)' }}
                        >
                          Svensk översättning
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed text-white/65 whitespace-pre-wrap">
                          {segment.translation?.trim() || (
                            <span className="text-white/30 italic">Översättning läggs till vid import från Siddha-Scribe.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : segment.type === 'VERSE' ? (
                    <SanskritVerse
                      content={segment.content}
                      devanagari={segment.devanagari}
                      translation={segment.translation || undefined}
                      padapatha={segment.padapatha || undefined}
                      iast={segment.content}
                    />
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <p className="text-foreground/90 leading-relaxed text-base sm:text-lg">
                        {segment.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
