import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScripturalBooks, useBookChapters } from '@/hooks/useScripturalBooks';
import { BookReader } from '@/components/scriptural/BookReader';

const AdminScripturalBookView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, loading: booksLoading } = useScripturalBooks();
  const { chapters, loading: chaptersLoading } = useBookChapters(id || null);

  const book = books.find(b => b.id === id);

  if (booksLoading || chaptersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Book not found</p>
          <Button onClick={() => navigate('/admin/books')}>Back to Books</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/books')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{book.title}</h1>
            <p className="text-xs text-muted-foreground">
              {book.total_chapters} chapters • {book.total_verses} verses • {book.status}
            </p>
          </div>
        </div>
      </div>

      {/* Book Reader */}
      {chapters.length > 0 ? (
        <BookReader chapters={chapters} bookTitle={book.title} />
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No chapters yet. Book is still processing...</p>
        </div>
      )}
    </div>
  );
};

export default AdminScripturalBookView;
