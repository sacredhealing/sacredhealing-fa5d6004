import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ScripturalBook {
  id: string;
  title: string;
  author_id: string;
  status: 'draft' | 'processing' | 'completed' | 'published';
  audio_url: string | null;
  transcription_url: string | null;
  total_chapters: number;
  total_verses: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BookChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string | null;
  theme: string | null;
  summary: string | null;
  content: Array<{
    type: 'TEACHING' | 'VERSE';
    content: string;
    devanagari?: string;
    translation?: string | null;
    padapatha?: string | null;
    timestamp?: number;
  }>;
  created_at: string;
  updated_at: string;
}

export const useScripturalBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<ScripturalBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('scriptural_books')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    } else {
      setBooks(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const createBook = useCallback(async (title: string, audioUrl: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('audio-to-scripture', {
        body: { audioUrl, bookTitle: title }
      });

      if (error) {
        console.error('Error creating book:', error);
        return null;
      }

      await fetchBooks();
      return data?.bookId || null;
    } catch (err) {
      console.error('Error invoking audio-to-scripture:', err);
      return null;
    }
  }, [user, fetchBooks]);

  return {
    books,
    loading,
    createBook,
    refreshBooks: fetchBooks
  };
};

export const useBookChapters = (bookId: string | null) => {
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChapters = useCallback(async () => {
    if (!bookId) {
      setChapters([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true });

    if (error) {
      console.error('Error fetching chapters:', error);
      setChapters([]);
    } else {
      setChapters(data || []);
    }
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  return {
    chapters,
    loading,
    refreshChapters: fetchChapters
  };
};
