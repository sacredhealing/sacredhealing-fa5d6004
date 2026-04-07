import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Loader2, Upload, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useScripturalBooks } from '@/hooks/useScripturalBooks';
import AudioUpload from '@/components/admin/AudioUpload';

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 40,
};

const AdminScripturalBooks = () => {
  const navigate = useNavigate();
  const { books, loading, createBook } = useScripturalBooks();
  const [showForm, setShowForm] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [toneFilter, setToneFilter] = useState<'vishwananda' | 'sri_yukteswar' | 'robbins'>('vishwananda');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateBook = async () => {
    if (!bookTitle.trim() || !audioUrl.trim()) {
      toast.error('Ange titel och ljudfil');
      return;
    }
    setIsProcessing(true);
    try {
      const bookId = await createBook(bookTitle.trim(), audioUrl, toneFilter);
      if (bookId) {
        toast.success('Bokprocessering startad! Det kan ta några minuter.');
        setShowForm(false);
        setBookTitle('');
        setAudioUrl('');
      } else {
        toast.error('Kunde inte skapa bok');
      }
    } catch (error: any) {
      toast.error(error.message || 'Kunde inte skapa bok');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        paddingBottom: 48,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: 'rgba(212,175,55,0.6)',
              marginBottom: 2,
            }}
          >
            ADMIN
          </p>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '-0.05em',
              color: '#D4AF37',
              textShadow: '0 0 15px rgba(212,175,55,0.3)',
            }}
          >
            Heliga Böcker
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Create form */}
        {showForm ? (
          <div style={{ ...GLASS, padding: 32, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            {/* Gold top line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                opacity: 0.5,
              }}
            />
            <p
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.6)',
                marginBottom: 20,
              }}
            >
              SKAPA NY BOK
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <Label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Boktitel
                </Label>
                <Input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Bhagavad Gita — Vishwananda Edition"
                  disabled={isProcessing}
                  style={{
                    marginTop: 8,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    color: 'white',
                    height: 48,
                  }}
                />
              </div>

              <div>
                <Label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Ljudinspelning
                </Label>
                <div style={{ marginTop: 8 }}>
                  <AudioUpload
                    value={audioUrl}
                    onChange={setAudioUrl}
                    folder="scriptural-books"
                    label="Ladda upp ljud (1h+ stöds)"
                  />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
                  Systemet transkriberar, hittar Sanskrit-verser och strukturerar kapitel automatiskt.
                </p>
              </div>

              <div>
                <Label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Ton-filter
                </Label>
                <Select value={toneFilter} onValueChange={(v: any) => setToneFilter(v)}>
                  <SelectTrigger
                    style={{
                      marginTop: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                      color: 'white',
                      height: 48,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vishwananda">Vishwananda — Hjärtcentrerad Kärlek</SelectItem>
                    <SelectItem value="sri_yukteswar">Sri Yukteswar — Logisk Visdom</SelectItem>
                    <SelectItem value="robbins">Robbins — Handlingsenergi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleCreateBook}
                  disabled={!bookTitle.trim() || !audioUrl.trim() || isProcessing}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 16,
                    border: '1px solid rgba(212,175,55,0.3)',
                    background: 'rgba(212,175,55,0.1)',
                    color: '#D4AF37',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  {isProcessing ? (
                    <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Bearbetar...</>
                  ) : (
                    <><Upload size={14} /> Skapa bok</>
                  )}
                </button>
                <button
                  onClick={() => { setShowForm(false); setBookTitle(''); setAudioUrl(''); }}
                  disabled={isProcessing}
                  style={{
                    padding: '0 20px',
                    height: 48,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 20,
              border: '1px dashed rgba(212,175,55,0.25)',
              background: 'rgba(212,175,55,0.03)',
              color: 'rgba(212,175,55,0.6)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 24,
              transition: 'all 0.2s',
            }}
          >
            <Plus size={16} />
            Skapa ny bok
          </button>
        )}

        {/* Books list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={24} style={{ color: '#D4AF37', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : books.length === 0 ? (
          <div
            style={{
              ...GLASS,
              padding: 48,
              textAlign: 'center',
            }}
          >
            <BookOpen size={40} style={{ color: 'rgba(212,175,55,0.3)', margin: '0 auto 16px' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Inga böcker ännu. Skapa din första heliga bok!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/admin/books/${book.id}`)}
                style={{
                  ...GLASS,
                  padding: '24px 28px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(212,175,55,0.2)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.03)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                {/* Gold top line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                    opacity: 0.3,
                  }}
                />

                <BookOpen size={20} style={{ color: 'rgba(212,175,55,0.5)', flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: '0.5em',
                      textTransform: 'uppercase',
                      color: 'rgba(212,175,55,0.5)',
                      marginBottom: 4,
                    }}
                  >
                    HELIG BOK
                  </p>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      color: '#D4AF37',
                      textShadow: '0 0 10px rgba(212,175,55,0.2)',
                      marginBottom: 4,
                    }}
                  >
                    {book.title}
                  </h2>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    {book.total_chapters} kapitel · {book.total_verses} verser
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      padding: '4px 14px',
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      background:
                        book.status === 'completed'
                          ? 'rgba(212,175,55,0.1)'
                          : book.status === 'processing'
                          ? 'rgba(34,211,238,0.08)'
                          : 'rgba(255,255,255,0.04)',
                      color:
                        book.status === 'completed'
                          ? '#D4AF37'
                          : book.status === 'processing'
                          ? '#22D3EE'
                          : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${
                        book.status === 'completed'
                          ? 'rgba(212,175,55,0.25)'
                          : book.status === 'processing'
                          ? 'rgba(34,211,238,0.2)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                    }}
                  >
                    {book.status === 'completed' ? 'Klar' : book.status === 'processing' ? 'Bearbetar' : book.status}
                  </span>
                  <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminScripturalBooks;
