import { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChapterTree from '@/components/books/ChapterTree';
import BookEntry from '@/components/books/BookEntry';
import BookAdmin from '@/components/books/BookAdmin';

const ADMIN_UUID = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';

interface Chapter {
  id: string;
  title: string;
  glyph: string;
  depth: number;
  parent_id: string | null;
  order_index: number;
}

interface Entry {
  id: string;
  title: string;
  content: string;
  transmission_seal: string | null;
  source: string;
  tags: string[];
  chapter_id: string | null;
  book_type: string;
  created_at: string;
}

// Build breadcrumb path for an entry's chapter
function getChapterPath(chapters: Chapter[], chapterId: string | null): string {
  if (!chapterId) return '';
  const map: Record<string, Chapter> = {};
  chapters.forEach(c => { map[c.id] = c; });
  const path: string[] = [];
  let current = map[chapterId];
  while (current) {
    path.unshift(current.title);
    current = current.parent_id ? map[current.parent_id] : null!;
  }
  return path.join(' › ');
}

export default function AkashicCodexV2() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const isAdmin = userId === ADMIN_UUID;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [transferEntry, setTransferEntry] = useState<Entry | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  // Load chapters
  const loadChapters = useCallback(async () => {
    const { data } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('book_type', 'akashic_codex')
      .order('depth').order('order_index');
    setChapters(data || []);
  }, []);

  // Load entries
  const loadEntries = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('book_entries')
      .select('id,title,content,transmission_seal,source,tags,chapter_id,book_type,created_at')
      .eq('book_type', 'akashic_codex')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (selectedChapterId) {
      // Also get sub-chapter entries
      const subIds = chapters
        .filter(c => c.parent_id === selectedChapterId || c.id === selectedChapterId)
        .map(c => c.id);
      query = query.in('chapter_id', subIds.length > 0 ? subIds : [selectedChapterId]);
    }

    const { data, error } = await query.limit(50);
    if (error) toast({ title: 'Error loading entries', variant: 'destructive' });
    setEntries(data || []);
    setLoading(false);
  }, [selectedChapterId, chapters]);

  useEffect(() => { loadChapters(); }, [loadChapters]);
  useEffect(() => { if (chapters.length >= 0) loadEntries(); }, [loadEntries]);

  // Transfer entry to Life Book
  const handleTransfer = async (entry: Entry) => {
    const confirmed = window.confirm(
      `Transfer "${entry.title}" to the Life Book?`
    );
    if (!confirmed) return;
    const { error } = await (supabase as any).from('book_entries').update({
      book_type: 'life_book',
      chapter_id: null,
    }).eq('id', entry.id);
    if (error) { toast({ title: 'Transfer failed', variant: 'destructive' }); return; }

    // Log
    await (supabase as any).from('book_entry_transfers').insert({
      entry_id: entry.id, from_book: 'akashic_codex', to_book: 'life_book',
      from_chapter_id: entry.chapter_id, transferred_by: userId,
    });
    toast({ title: '→ Entry transferred to Life Book' });
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('book_entries').update({ is_archived: true }).eq('id', id);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    toast({ title: 'Entry archived' });
    loadEntries();
  };

  // Filter by search
  const filtered = entries.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase()) ||
    e.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: '#050505', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-6 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(5,5,5,0.9)',
          backdropFilter: 'blur(40px)',
          borderBottom: '1px solid rgba(212,175,55,0.08)',
        }}
      >
        <BookOpen size={20} className="text-[#D4AF37]" />
        <div>
          <h1
            className="text-white font-black leading-none"
            style={{ fontSize: '20px', letterSpacing: '-0.04em' }}
          >
            Akashic Codex
          </h1>
          <p
            className="text-[rgba(212,175,55,0.5)] uppercase"
            style={{ fontSize: '8px', letterSpacing: '0.3em', marginTop: '2px' }}
          >
            Universal Teachings · V2
          </p>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm ml-auto relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teachings..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl text-white text-sm placeholder-[rgba(255,255,255,0.2)]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <BookAdmin
            bookType="akashic_codex"
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            adminUid={ADMIN_UUID}
            onEntryAdded={loadEntries}
            onChapterAdded={loadChapters}
          />
        )}
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div
          className="w-64 shrink-0 p-4 overflow-hidden"
          style={{
            borderRight: '1px solid rgba(212,175,55,0.08)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <ChapterTree
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
            onAddSubChapter={isAdmin ? (parentId) => {
              // Handled via BookAdmin modal
            } : undefined}
            isAdmin={isAdmin}
            bookType="akashic_codex"
          />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Selected chapter header */}
          {selectedChapterId && (() => {
            const ch = chapters.find(c => c.id === selectedChapterId);
            return ch ? (
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">{ch.glyph}</span>
                <div>
                  <h2 className="text-white font-black" style={{ fontSize: '24px', letterSpacing: '-0.04em' }}>
                    {ch.title}
                  </h2>
                  <p className="text-[rgba(255,255,255,0.3)] text-xs">
                    {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
              >
                <span className="text-2xl">⟁</span>
              </div>
              <p className="text-[rgba(255,255,255,0.3)] text-sm">
                {search ? 'No teachings match that search' : 'This chapter awaits its first teaching'}
              </p>
              {isAdmin && !search && (
                <p className="text-[rgba(212,175,55,0.4)] text-xs mt-2">
                  Use NEW ENTRY above to add the first entry here
                </p>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-[40px] animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.02)' }} />
              ))}
            </div>
          )}

          {/* Entries */}
          {!loading && (
            <div className="space-y-6">
              {filtered.map(entry => (
                <BookEntry
                  key={entry.id}
                  entry={entry}
                  chapterPath={getChapterPath(chapters, entry.chapter_id)}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  onTransfer={handleTransfer}
                  onEdit={() => toast({ title: 'Edit coming in next deploy' })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
