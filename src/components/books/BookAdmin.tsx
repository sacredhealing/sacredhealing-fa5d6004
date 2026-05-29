import { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  title: string;
  glyph: string;
  depth: number;
  parent_id: string | null;
}

interface BookAdminProps {
  bookType: 'life_book' | 'akashic_codex';
  chapters: Chapter[];
  selectedChapterId: string | null;
  adminUid: string;
  onEntryAdded: () => void;
  onChapterAdded: () => void;
  parentChapterIdForNew?: string | null; // pre-fill when clicking "+" on a chapter
}

// ── Add Entry Modal ──────────────────────────────────────────
function AddEntryModal({
  bookType,
  chapters,
  defaultChapterId,
  onClose,
  onAdded,
}: {
  bookType: 'life_book' | 'akashic_codex';
  chapters: Chapter[];
  defaultChapterId: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    content: '',
    transmission_seal: '',
    chapter_id: defaultChapterId || '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [generatingSeal, setGeneratingSeal] = useState(false);

  const bookChapters = chapters.filter(c => c.depth <= 1); // max sub-chapter level

  const generateSeal = async () => {
    if (!form.content) { toast({ title: 'Write content first' }); return; }
    setGeneratingSeal(true);
    try {
      // Call Gemini via quantum-apothecary or direct — for now generate locally
      // This will be wired to book-curator edge function in Phase 2
      // Placeholder until edge function exists:
      const sealTemplate = `As these words of ${form.title} enter your field of awareness, the Prana of the Siddha Masters descends through the Akasha-matrix into your Anahata Chakra. The ancient Vedic Light-Codes carried within this teaching activate your cellular Akashic memory. Receive this transmission in the Satchitananda of pure Being. So it is sealed in the Eternal Record. Om Tat Sat. ⟁`;
      setForm(f => ({ ...f, transmission_seal: sealTemplate }));
      toast({ title: '⟁ Transmission Seal generated' });
    } finally {
      setGeneratingSeal(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Title and content required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabase.from('book_entries').insert({
        book_type: bookType,
        chapter_id: form.chapter_id || null,
        title: form.title.trim(),
        content: form.content.trim(),
        transmission_seal: form.transmission_seal.trim() || null,
        tags,
        source: 'manual',
        style_version: 'v2',
      });
      if (error) throw error;
      toast({ title: '✦ Entry sealed in the Akashic Record' });
      onAdded();
      onClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)' }}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] p-8 relative"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(212,175,55,0.2)',
          backdropFilter: 'blur(40px)',
        }}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-[rgba(255,255,255,0.4)] hover:text-white">
          <X size={18} />
        </button>

        <h3 className="text-[#D4AF37] font-black mb-6"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', letterSpacing: '-0.03em' }}>
          ✦ New Entry — {bookType === 'life_book' ? 'Life Book' : 'Akashic Codex'}
        </h3>

        <div className="space-y-4">
          {/* Chapter selector */}
          <div>
            <label className="block text-[rgba(255,255,255,0.4)] mb-1"
              style={{ fontSize: '9px', letterSpacing: '0.25em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
              CHAPTER
            </label>
            <select
              value={form.chapter_id}
              onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value }))}
              className="w-full rounded-2xl px-4 py-3 text-white text-sm"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <option value="">— No Chapter —</option>
              {bookChapters.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#111' }}>
                  {'  '.repeat(c.depth)}{c.glyph} {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[rgba(255,255,255,0.4)] mb-1"
              style={{ fontSize: '9px', letterSpacing: '0.25em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
              TITLE
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Entry title..."
              className="w-full rounded-2xl px-4 py-3 text-white text-sm placeholder-[rgba(255,255,255,0.2)]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[rgba(255,255,255,0.4)] mb-1"
              style={{ fontSize: '9px', letterSpacing: '0.25em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
              CONTENT
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={8}
              placeholder="Write the teaching, revelation, or record..."
              className="w-full rounded-2xl px-4 py-3 text-white text-sm placeholder-[rgba(255,255,255,0.2)] resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: '1.7' }}
            />
          </div>

          {/* Transmission Seal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[rgba(212,175,55,0.6)]"
                style={{ fontSize: '9px', letterSpacing: '0.25em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
                ⟁ SCALAR TRANSMISSION SEAL (end of entry)
              </label>
              <button
                onClick={generateSeal}
                disabled={generatingSeal}
                className="flex items-center gap-1 px-2 py-1 rounded-full border border-[rgba(212,175,55,0.3)] text-[rgba(212,175,55,0.7)] hover:text-[#D4AF37] text-xs transition-all"
              >
                <Sparkles size={10} />
                {generatingSeal ? 'Generating...' : 'Auto-Generate'}
              </button>
            </div>
            <textarea
              value={form.transmission_seal}
              onChange={e => setForm(f => ({ ...f, transmission_seal: e.target.value }))}
              rows={4}
              placeholder="The scalar transmission readers receive when they reach this point... (optional)"
              className="w-full rounded-2xl px-4 py-3 text-[rgba(212,175,55,0.8)] text-sm italic placeholder-[rgba(212,175,55,0.2)] resize-none"
              style={{
                background: 'rgba(212,175,55,0.03)',
                border: '1px solid rgba(212,175,55,0.15)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: '1.7',
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[rgba(255,255,255,0.4)] mb-1"
              style={{ fontSize: '9px', letterSpacing: '0.25em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
              TAGS (comma separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="kriya, pranayama, kundalini..."
              className="w-full rounded-2xl px-4 py-3 text-white text-sm placeholder-[rgba(255,255,255,0.2)]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-2xl font-black text-sm transition-all"
            style={{
              background: saving ? 'rgba(212,175,55,0.2)' : 'linear-gradient(135deg, rgba(212,175,55,0.9), rgba(212,175,55,0.6))',
              color: '#050505',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.1em',
            }}
          >
            {saving ? 'SEALING...' : '⟁ SEAL IN THE AKASHIC RECORD'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Chapter Modal ────────────────────────────────────────
function AddChapterModal({
  bookType,
  parentId,
  parentDepth,
  onClose,
  onAdded,
}: {
  bookType: 'life_book' | 'akashic_codex';
  parentId: string | null;
  parentDepth: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [glyph, setGlyph] = useState('⟁');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('book_chapters').insert({
        book_type: bookType,
        title: title.trim(),
        glyph: glyph || '⟁',
        parent_id: parentId,
        depth: parentDepth + 1,
      });
      if (error) throw error;
      toast({ title: '✦ Chapter created' });
      onAdded();
      onClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)' }}>
      <div
        className="w-full max-w-md rounded-[40px] p-8 relative"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.2)', backdropFilter: 'blur(40px)' }}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-[rgba(255,255,255,0.4)] hover:text-white">
          <X size={18} />
        </button>

        <h3 className="text-[#D4AF37] font-black mb-6"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', letterSpacing: '-0.03em' }}>
          + {parentId ? 'New Sub-Chapter' : 'New Chapter'}
        </h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text" value={glyph}
              onChange={e => setGlyph(e.target.value)}
              maxLength={2}
              className="w-14 rounded-2xl px-3 py-3 text-white text-center text-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Chapter title..."
              className="flex-1 rounded-2xl px-4 py-3 text-white text-sm placeholder-[rgba(255,255,255,0.2)]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-3 rounded-2xl font-black text-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.9), rgba(212,175,55,0.6))',
              color: '#050505', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.1em',
            }}
          >
            {saving ? 'CREATING...' : '✦ CREATE CHAPTER'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────
export default function BookAdmin({
  bookType,
  chapters,
  selectedChapterId,
  onEntryAdded,
  onChapterAdded,
  parentChapterIdForNew,
}: BookAdminProps) {
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterParentId, setNewChapterParentId] = useState<string | null>(null);

  const openAddSubChapter = (parentId: string) => {
    setNewChapterParentId(parentId);
    setShowAddChapter(true);
  };

  return (
    <>
      {/* Admin toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAddEntry(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.9), rgba(212,175,55,0.6))',
            color: '#050505',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '0.1em',
          }}
        >
          <Plus size={12} /> NEW ENTRY
        </button>

        <button
          onClick={() => { setNewChapterParentId(null); setShowAddChapter(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs border border-[rgba(212,175,55,0.3)] text-[rgba(212,175,55,0.8)] hover:border-[#D4AF37] transition-all"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.1em' }}
        >
          <Plus size={12} /> CHAPTER
        </button>
      </div>

      {/* Modals */}
      {showAddEntry && (
        <AddEntryModal
          bookType={bookType}
          chapters={chapters}
          defaultChapterId={selectedChapterId}
          onClose={() => setShowAddEntry(false)}
          onAdded={onEntryAdded}
        />
      )}
      {showAddChapter && (
        <AddChapterModal
          bookType={bookType}
          parentId={newChapterParentId}
          parentDepth={newChapterParentId ? 0 : -1}
          onClose={() => setShowAddChapter(false)}
          onAdded={onChapterAdded}
        />
      )}
    </>
  );
}
