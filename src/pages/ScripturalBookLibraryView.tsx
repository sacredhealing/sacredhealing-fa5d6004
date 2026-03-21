import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BookReader } from '@/components/scriptural/BookReader';
import type { BookChapter, ScripturalBook } from '@/hooks/useScripturalBooks';

/**
 * Member-facing reader for scriptural books (e.g. opened from Stargate course materials).
 */
const ScripturalBookLibraryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<ScripturalBook | null>(null);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: b, error: eb } = await (supabase as any)
        .from('scriptural_books')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (eb || !b) {
        setBook(null);
        setChapters([]);
        setLoading(false);
        return;
      }
      setBook(b as ScripturalBook);
      const { data: ch, error: ec } = await (supabase as any)
        .from('book_chapters')
        .select('*')
        .eq('book_id', id)
        .order('chapter_number', { ascending: true });
      if (!cancelled) {
        if (ec) setChapters([]);
        else setChapters((ch || []) as BookChapter[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-6">
        <p className="text-white/50 mb-4">Boken hittades inte eller saknar åtkomst.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Tillbaka
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div
        className="sticky top-0 z-30 border-b border-white/[0.06] px-2 py-2 flex items-center gap-1"
        style={{ background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(24px)' }}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-[#D4AF37]/80 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35 truncate">Tillbaka till kurs</span>
      </div>
      {chapters.length > 0 ? (
        <BookReader chapters={chapters} bookTitle={book.title} verseLayout="split" />
      ) : (
        <div className="flex items-center justify-center py-16 text-white/40 text-sm">Inga kapitel ännu.</div>
      )}
    </div>
  );
};

export default ScripturalBookLibraryView;
