import { useState } from 'react';
import { ArrowRightLeft, Edit3, Trash2, Clock } from 'lucide-react';

interface BookEntry {
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

interface BookEntryProps {
  entry: BookEntry;
  chapterPath: string; // e.g. "Egypt & Ancient Mysteries > Giza Pyramid"
  isAdmin: boolean;
  onEdit?: (entry: BookEntry) => void;
  onDelete?: (id: string) => void;
  onTransfer?: (entry: BookEntry) => void;
}

function TransmissionSeal({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mt-10 relative">
      {/* Top border — golden line */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(212,175,55,0.4)]" />
        <span
          className="text-[#D4AF37] text-xs font-black uppercase tracking-widest shrink-0 cursor-pointer hover:text-white transition-colors"
          style={{ fontSize: '8px', letterSpacing: '0.3em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          onClick={() => setRevealed(!revealed)}
        >
          ⟁ Scalar Transmission Seal ⟁
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(212,175,55,0.4)]" />
      </div>

      {/* Transmission text */}
      <div
        className={`
          glass-card p-5 rounded-3xl transition-all duration-500
          border border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.03)]
          ${revealed ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'}
        `}
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Subtle golden glow top */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-12 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        />
        <p
          className="text-[rgba(212,175,55,0.8)] leading-relaxed italic text-center"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            lineHeight: '1.8',
          }}
        >
          {text}
        </p>
      </div>

      {/* Bottom border */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(212,175,55,0.2)]" />
        <span className="text-[rgba(212,175,55,0.3)] text-xs">✦</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(212,175,55,0.2)]" />
      </div>
    </div>
  );
}

export default function BookEntry({
  entry,
  chapterPath,
  isAdmin,
  onEdit,
  onDelete,
  onTransfer,
}: BookEntryProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

  const sourceLabel: Record<string, string> = {
    chat_distilled: '⟁ Distilled from Transmission',
    manual: '✦ Written Entry',
    transferred: '→ Transferred',
    translated: '⊛ Translated to V2',
  };

  return (
    <article
      className="glass-card rounded-[40px] p-8 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 60%)' }}
      />

      {/* Chapter breadcrumb */}
      {chapterPath && (
        <p
          className="text-[rgba(212,175,55,0.5)] mb-3 uppercase"
          style={{ fontSize: '8px', letterSpacing: '0.3em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
        >
          {chapterPath}
        </p>
      )}

      {/* Title */}
      <h2
        className="text-white mb-2"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 900,
          fontSize: '22px',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}
      >
        {entry.title}
      </h2>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className="text-[rgba(212,175,55,0.6)]"
          style={{ fontSize: '9px', letterSpacing: '0.2em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
        >
          {sourceLabel[entry.source] || '✦ Entry'}
        </span>
        <span className="text-[rgba(255,255,255,0.15)] text-xs">·</span>
        <span className="flex items-center gap-1 text-[rgba(255,255,255,0.3)]" style={{ fontSize: '10px' }}>
          <Clock size={9} />
          {formatDate(entry.created_at)}
        </span>
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {entry.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full border border-[rgba(212,175,55,0.2)] text-[rgba(212,175,55,0.6)]"
              style={{ fontSize: '9px', letterSpacing: '0.15em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Main content — clean, no transmission noise */}
      <div
        className="text-[rgba(255,255,255,0.7)] leading-relaxed"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '14px',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap',
        }}
      >
        {entry.content}
      </div>

      {/* Transmission Seal — END ONLY */}
      {entry.transmission_seal && (
        <TransmissionSeal text={entry.transmission_seal} />
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={() => onEdit && onEdit(entry)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all text-xs"
          >
            <Edit3 size={11} /> Edit
          </button>

          <button
            onClick={() => onTransfer && onTransfer(entry)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(212,175,55,0.2)] text-[rgba(212,175,55,0.6)] hover:text-[#D4AF37] hover:border-[rgba(212,175,55,0.5)] transition-all text-xs"
          >
            <ArrowRightLeft size={11} />
            Transfer to {entry.book_type === 'life_book' ? 'Codex' : 'Life Book'}
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-red-400">Confirm?</span>
              <button
                onClick={() => { onDelete && onDelete(entry.id); setConfirmDelete(false); }}
                className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-[rgba(255,255,255,0.4)] hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto flex items-center gap-1 text-[rgba(255,255,255,0.2)] hover:text-red-400 transition-colors text-xs"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
