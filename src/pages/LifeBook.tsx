import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type LifeBookCategory =
  | 'children'
  | 'healing_upgrades'
  | 'past_lives'
  | 'future_visions'
  | 'spiritual_figures'
  | 'nadi_knowledge'
  | 'general_wisdom';

interface LifeBookEntry {
  title?: string;
  summary?: string;
  source?: string;
  created_at?: string;
}

interface LifeBookChapter {
  id: string;
  user_id: string;
  chapter_type: LifeBookCategory;
  title: string | null;
  content: LifeBookEntry[];
  sort_order: number;
  created_at: string;
}

const CHAPTER_ORDER: LifeBookCategory[] = [
  'children', 'healing_upgrades', 'past_lives', 'future_visions',
  'spiritual_figures', 'nadi_knowledge', 'general_wisdom',
];

const LABEL_MAP: Record<LifeBookCategory, string> = {
  children: 'Children',
  healing_upgrades: 'Healing Upgrades',
  past_lives: 'Past Lives',
  future_visions: 'Future Visions',
  spiritual_figures: 'Spiritual Figures',
  nadi_knowledge: 'Nadi Knowledge',
  general_wisdom: 'General Wisdom',
};

const ICON_MAP: Record<LifeBookCategory, string> = {
  children: '👶',
  healing_upgrades: '✨',
  past_lives: '🔮',
  future_visions: '🌅',
  spiritual_figures: '🙏',
  nadi_knowledge: '🧬',
  general_wisdom: '📖',
};

const LifeBook: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chapters, setChapters] = useState<LifeBookChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setChapters([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('life_book_chapters')
        .select('*')
        .eq('user_id', user.id)
        .order('chapter_type', { ascending: true });
      if (!error && data) {
        setChapters(
          (data as unknown as LifeBookChapter[]).map(ch => ({
            ...ch,
            content: Array.isArray(ch.content) ? ch.content : [],
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const ordered = useMemo(() => {
    const byType: Record<string, LifeBookChapter | null> = {};
    CHAPTER_ORDER.forEach(t => (byType[t] = null));
    for (const ch of chapters) {
      if (!byType[ch.chapter_type]) byType[ch.chapter_type] = ch;
    }
    return CHAPTER_ORDER
      .map(type => byType[type])
      .filter((ch): ch is LifeBookChapter => ch !== null && ch.content.length > 0);
  }, [chapters]);

  const totalEntries = useMemo(
    () => ordered.reduce((sum, ch) => sum + ch.content.length, 0),
    [ordered]
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(212,175,55,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        padding: '20px 16px 24px',
      }}>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors mb-4 text-xs font-bold uppercase tracking-[0.3em]">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={22} color="#D4AF37" />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                fontWeight: 300, fontStyle: 'italic', color: 'white', lineHeight: 1.1,
              }}>
                Life Book
              </h1>
              <p style={{
                fontSize: 8, fontWeight: 800, letterSpacing: '0.5em',
                textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', marginTop: 4,
              }}>
                Quantum Apothecary · SQI Archive
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div style={{
              background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)',
              borderRadius: 100, padding: '8px 20px', fontSize: 12,
            }}>
              <span style={{ color: '#D4AF37', fontWeight: 800 }}>{ordered.length}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>Chapters</span>
            </div>
            <div style={{
              background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)',
              borderRadius: 100, padding: '8px 20px', fontSize: 12,
            }}>
              <span style={{ color: '#D4AF37', fontWeight: 800 }}>{totalEntries}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>Entries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles size={48} className="mx-auto mb-4 text-[#D4AF37]/30" />
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic', fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.3)', maxWidth: 400, margin: '0 auto', lineHeight: 1.8,
            }}>
              Your Life Book is empty. Chat with SQI in the Quantum Apothecary to begin writing your soul record.
            </p>
            <button onClick={() => navigate('/quantum-apothecary', { state: { focusChat: true } })}
              style={{
                marginTop: 24, background: '#D4AF37', color: '#050505',
                border: 'none', borderRadius: 100, padding: '13px 32px',
                fontWeight: 800, fontSize: 9, letterSpacing: '0.4em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}>
              Open Quantum Apothecary
            </button>
          </div>
        ) : (
          ordered.map(chapter => {
            const isExpanded = expandedChapter === chapter.id;
            const catKey = chapter.chapter_type as LifeBookCategory;
            return (
              <div key={chapter.id} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(212,175,55,0.12)',
                borderRadius: 20, overflow: 'hidden',
                transition: 'border-color 0.3s',
                ...(isExpanded ? { borderColor: 'rgba(212,175,55,0.3)' } : {}),
              }}>
                {/* Chapter Header */}
                <button
                  onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '20px 24px',
                    background: 'transparent', border: 'none', cursor: 'pointer', color: 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24 }}>{ICON_MAP[catKey] || '📖'}</span>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{
                        fontWeight: 700, fontSize: 14, color: '#D4AF37',
                        display: 'block', marginBottom: 2,
                      }}>
                        {LABEL_MAP[catKey] || chapter.chapter_type}
                      </span>
                      <span style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.3)',
                      }}>
                        {chapter.content.length} {chapter.content.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={16} style={{
                    color: 'rgba(212,175,55,0.5)',
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.25s',
                  }} />
                </button>

                {/* Entries */}
                {isExpanded && (
                  <div style={{
                    padding: '0 24px 24px',
                    borderTop: '1px solid rgba(212,175,55,0.08)',
                  }}>
                    {chapter.content.map((entry, idx) => (
                      <div key={idx} style={{
                        padding: '16px 0',
                        borderBottom: idx < chapter.content.length - 1
                          ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}>
                        {entry.title && (
                          <h4 style={{
                            fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.8)',
                            marginBottom: 6,
                          }}>
                            {entry.title}
                          </h4>
                        )}
                        {entry.summary && (
                          <p style={{
                            fontSize: 13, color: 'rgba(255,255,255,0.45)',
                            lineHeight: 1.7,
                          }}>
                            {entry.summary}
                          </p>
                        )}
                        <div style={{
                          display: 'flex', gap: 12, marginTop: 8,
                          fontSize: 10, color: 'rgba(255,255,255,0.2)',
                        }}>
                          {entry.source && <span>Source: {entry.source}</span>}
                          {entry.created_at && (
                            <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LifeBook;
