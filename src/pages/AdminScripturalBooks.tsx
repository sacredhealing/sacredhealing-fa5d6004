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
          <div className="space-y-4">
            {books.map((book) => (
              <Card
                key={book.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/admin/books/${book.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-heading">{book.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {book.total_chapters} chapters • {book.total_verses} verses
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        book.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : book.status === 'processing'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {book.status}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScripturalBooks;
