import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useScripturalBooks, type ScripturalBook } from '@/hooks/useScripturalBooks';
import AudioUpload from '@/components/admin/AudioUpload';

const AdminScripturalBooks = () => {
  const navigate = useNavigate();
  const { books, loading, createBook, refreshBooks } = useScripturalBooks();
  const [showForm, setShowForm] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [toneFilter, setToneFilter] = useState<'vishwananda' | 'sri_yukteswar' | 'robbins'>('vishwananda');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateBook = async () => {
    if (!bookTitle.trim() || !audioUrl.trim()) {
      toast.error('Please provide a title and audio file');
      return;
    }

    setIsProcessing(true);
    try {
      const bookId = await createBook(bookTitle.trim(), audioUrl, toneFilter);
      if (bookId) {
        toast.success('Book creation started! Processing may take a few minutes.');
        setShowForm(false);
        setBookTitle('');
        setAudioUrl('');
      } else {
        toast.error('Failed to create book');
      }
    } catch (error: any) {
      console.error('Error creating book:', error);
      toast.error(error.message || 'Failed to create book');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Scriptural Books</h1>
            <p className="text-sm text-muted-foreground">
              Automated book creation from audio recordings
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-4xl mx-auto">
        {/* Create Book Form */}
        {showForm ? (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Create New Book</h3>
            <div className="space-y-4">
              <div>
                <Label>Book Title *</Label>
                <Input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="The Path of the Siddha"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label>Audio Recording *</Label>
                <AudioUpload
                  value={audioUrl}
                  onChange={setAudioUrl}
                  folder="scriptural-books"
                  label="Upload Audio (1hr+ supported)"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supports long-form audio (1+ hours). The system will transcribe, detect Sanskrit verses, and structure chapters automatically.
                </p>
              </div>
              <div>
                <Label>Tone Filter (Siddha-Flow)</Label>
                <Select value={toneFilter} onValueChange={(value: any) => setToneFilter(value)}>
                  <SelectTrigger className="h-12 text-base" style={{ fontSize: '1rem', minHeight: '48px' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vishwananda">Vishwananda (Heart-Centered Love)</SelectItem>
                    <SelectItem value="sri_yukteswar">Sri Yukteswar (Logical Wisdom)</SelectItem>
                    <SelectItem value="robbins">Robbins (Action Energy)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Choose the energy filter for chapter structuring. Vishwananda: Heart-centered love | Sri Yukteswar: Logical precision | Robbins: Action-oriented transformation.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateBook}
                  disabled={!bookTitle.trim() || !audioUrl.trim() || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Create Book
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setBookTitle('');
                    setAudioUrl('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setShowForm(true)} className="w-full mb-6">
            <Plus className="w-4 h-4 mr-2" />
            Create New Book
          </Button>
        )}

        {/* Books List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : books.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No books yet. Create your first scriptural book!</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {books.map((book) => (
              <div
                key={book.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/books/${book.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/admin/books/${book.id}`);
                  }
                }}
                className="cursor-pointer group relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '40px',
                  padding: '32px',
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"
                  aria-hidden
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      style={{
                        fontWeight: 800,
                        letterSpacing: '0.5em',
                        textTransform: 'uppercase',
                        fontSize: '8px',
                        color: 'rgba(212,175,55,0.6)',
                      }}
                    >
                      SCRIPTURAL BOOK
                    </p>
                    <h2
                      className="cinzel"
                      style={{
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                        color: '#D4AF37',
                        fontSize: '1.25rem',
                        marginTop: '8px',
                        textShadow: '0 0 15px rgba(212,175,55,0.3)',
                      }}
                    >
                      {book.title}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '8px' }}>
                      {book.total_chapters} kapitel · {book.total_verses} verser
                    </p>
                  </div>

                  <span
                    style={{
                      padding: '4px 16px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.3em',
                      background:
                        book.status === 'completed' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                      color: book.status === 'completed' ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${
                        book.status === 'completed' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'
                      }`,
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    {book.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScripturalBooks;
