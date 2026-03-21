import React from 'react';
import { BookChapter } from '@/hooks/useScripturalBooks';
import { SanskritVerse } from './SanskritVerse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Sparkles } from 'lucide-react';

interface BookReaderProps {
  chapters: BookChapter[];
  bookTitle: string;
}

export const BookReader: React.FC<BookReaderProps> = ({ chapters, bookTitle }) => {
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
                  {segment.type === 'VERSE' ? (
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
