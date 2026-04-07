// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Mic, MicOff, Send, Download, Star, ChevronRight } from 'lucide-react';
import { ArchitectConsole } from '@/components/admin/vedic/ArchitectConsole';
import { ArchiveModal } from '@/components/admin/vedic/ArchiveModal';
import { ProjectState, VedicBook, LibraryArchive } from '@/types/vedicTranslation';
import { INITIAL_ARCHIVE } from '@/data/vedicManuscript';
import { downloadVedicManuscript } from '@/utils/vedicExport';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Stargate Course ID — set your actual course ID here ───────────────────
const STARGATE_COURSE_ID = 'stargate'; // update with real UUID if needed

const BOOKS = [
  { id: VedicBook.BHAGAVAD_GITA,     label: 'Bhagavad Gita',      icon: '📖', color: '#b48c35' },
  { id: VedicBook.GURU_GITA,          label: 'Guru Gita',           icon: '💠', color: '#f43f5e' },
  { id: VedicBook.SHREEMAD_BHAGAVATAM,label: 'Shreemad Bhagavatam', icon: '🕉️', color: '#fcd34d' },
];

const AdminVedicTranslation: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ProjectState>({
    currentBook: VedicBook.BHAGAVAD_GITA,
    chapter: 1,
    verse: 1,
    interactionCount: 0,
    mode: 'INGESTION',
  });
  const [archive, setArchive] = useState<LibraryArchive>(INITIAL_ARCHIVE);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const activeBook = BOOKS.find((b) => b.id === state.currentBook)!;

  const handleStateUpdate = (newState: Partial<ProjectState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const handleUpdateManuscript = (newManuscript: LibraryArchive[VedicBook]) => {
    setArchive((prev) => ({ ...prev, [state.currentBook]: newManuscript }));
  };

  const handleArchiveUpdate = (
    type: 'TITLE' | 'SUMMARY' | 'COMMENTARY',
    content: string,
    chapter?: number
  ) => {
    const ch = chapter ?? state.chapter;
    setArchive((prev) => {
      const manuscript = JSON.parse(JSON.stringify(prev[state.currentBook]));
      const getChapter = (n: number) => {
        if (n === 1) return manuscript.chapter1 ?? { title: '', summary: '', verses: [] };
        if (!manuscript.chapters) manuscript.chapters = {};
        if (!manuscript.chapters[n]) manuscript.chapters[n] = { title: '', summary: '', verses: [] };
        return manuscript.chapters[n];
      };
      const currentChapter = getChapter(ch);
      if (type === 'TITLE') currentChapter.title = content;
      else if (type === 'SUMMARY') currentChapter.summary = content;
      else if (type === 'COMMENTARY') {
        currentChapter.commentaries = [...(currentChapter.commentaries || []), content];
      }
      if (ch === 1) manuscript.chapter1 = currentChapter;
      else (manuscript.chapters = manuscript.chapters || {})[ch] = currentChapter;
      return { ...prev, [state.currentBook]: manuscript };
    });
  };

  // Count how many chapters have content
  const chapterCount = (() => {
    const m = archive[state.currentBook] as any;
    let count = 0;
    if (m?.chapter1?.title || m?.chapter1?.commentaries?.length) count++;
    if (m?.chapters) count += Object.keys(m.chapters).length;
    return count;
  })();

  const handleExport = () => {
    downloadVedicManuscript(archive, 'vedicManuscript.ts');
    toast({
      title: '📥 Fil nedladdad',
      description: 'Ersätt src/data/vedicManuscript.ts och pusha till Git.',
      duration: 6000,
    });
  };

  const handlePublishToStargate = async () => {
    setPublishing(true);
    try {
      const manuscript = archive[state.currentBook] as any;
      const chapters: any[] = [];

      // Build chapters array from archive
      if (manuscript?.chapter1) chapters.push({ chapter: 1, ...manuscript.chapter1 });
      if (manuscript?.chapters) {
        Object.entries(manuscript.chapters).forEach(([n, data]: any) => {
          chapters.push({ chapter: parseInt(n), ...data });
        });
      }

      const { data: book, error } = await supabase
        .from('scriptural_books')
        .upsert(
          {
            title: `${activeBook.label} — Vishwananda Edition`,
            status: 'completed',
            tone_filter: 'vishwananda',
            total_chapters: chapters.length,
            total_verses: chapters.reduce((s, c) => s + (c.commentaries?.length || 0), 0),
            content_json: chapters,
            source: 'vedic_translation_tool',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'title' }
        )
        .select()
        .single();

      if (error) throw error;

      // Link to Stargate course
      await supabase.from('course_resources').upsert(
        {
          course_id: STARGATE_COURSE_ID,
          resource_type: 'book',
          resource_id: book.id,
          title: book.title,
          order_index: 99,
        },
        { onConflict: 'course_id,resource_id' }
      );

      toast({
        title: '🌟 Publicerad till Stargate!',
        description: `${activeBook.label} är nu tillgänglig i kursen.`,
        duration: 6000,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Fel',
        description: err.message || 'Kunde inte publicera',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#050505', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            to="/admin"
            style={{
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            <ArrowLeft size={16} />
          </Link>
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
              VEDIC TRANSLATION TOOL
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
              Siddha-Scribe
            </h1>
          </div>
        </div>

        {/* Chapter counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.2)',
              fontSize: 11,
              color: 'rgba(212,175,55,0.8)',
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}
          >
            {chapterCount} kapitel sparade
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* ── LEFT SIDEBAR ────────────────────────────────────── */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            padding: '24px 16px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Book selector */}
          <p
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 8,
              paddingLeft: 12,
            }}
          >
            VÄLJ BOK
          </p>

          {BOOKS.map((book) => {
            const isActive = state.currentBook === book.id;
            return (
              <button
                key={book.id}
                onClick={() => handleStateUpdate({ currentBook: book.id, chapter: 1, verse: 1 })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 16,
                  border: `1px solid ${isActive ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                  color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                <span style={{ fontSize: 18 }}>{book.icon}</span>
                <span>{book.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.05)',
              margin: '16px 0',
            }}
          />

          {/* Actions */}
          <p
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 8,
              paddingLeft: 12,
            }}
          >
            ÅTGÄRDER
          </p>

          <button
            onClick={() => setArchiveVisible(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              width: '100%',
              fontSize: 13,
              transition: 'all 0.2s',
            }}
          >
            <BookOpen size={15} />
            Visa arkiv
          </button>

          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              width: '100%',
              fontSize: 13,
              transition: 'all 0.2s',
            }}
          >
            <Download size={15} />
            Exportera fil
          </button>

          {/* Publish to Stargate — the big one */}
          <button
            onClick={handlePublishToStargate}
            disabled={publishing || chapterCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px',
              borderRadius: 16,
              border: '1px solid rgba(212,175,55,0.4)',
              background:
                chapterCount > 0
                  ? 'rgba(212,175,55,0.1)'
                  : 'rgba(255,255,255,0.02)',
              color: chapterCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.2)',
              cursor: chapterCount > 0 ? 'pointer' : 'not-allowed',
              width: '100%',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.05em',
              marginTop: 8,
              transition: 'all 0.2s',
              textShadow: chapterCount > 0 ? '0 0 10px rgba(212,175,55,0.3)' : 'none',
            }}
          >
            <Star size={14} />
            {publishing ? 'Publicerar...' : 'Publicera till Stargate'}
          </button>

          {chapterCount === 0 && (
            <p
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.2)',
                textAlign: 'center',
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              Klistra in text först
            </p>
          )}
        </aside>

        {/* ── MAIN AREA ────────────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Active book banner */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22 }}>{activeBook.icon}</span>
            <div>
              <p
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                AKTIV BOK
              </p>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: '#D4AF37',
                }}
              >
                {activeBook.label}
              </h2>
            </div>

            <div
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                fontStyle: 'italic',
              }}
            >
              Klistra in text → AI strukturerar Swedish + Sanskrit automatiskt
            </div>
          </div>

          {/* Chat console — takes all remaining space */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ArchitectConsole
              state={state}
              interactions={[]}
              onAddInteractions={() => {}}
              onStateChange={handleStateUpdate}
              onArchiveUpdate={handleArchiveUpdate}
            />
          </div>
        </main>
      </div>

      {/* Archive Modal */}
      {archiveVisible && (
        <ArchiveModal
          manuscript={archive[state.currentBook]}
          onUpdateManuscript={handleUpdateManuscript}
          onClose={() => setArchiveVisible(false)}
        />
      )}
    </div>
  );
};

export default AdminVedicTranslation;
