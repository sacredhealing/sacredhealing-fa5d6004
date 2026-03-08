import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Users, Heart, Eye, Globe, Brain, Scroll, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  updated_at: string;
}

const CHAPTER_META: Record<LifeBookCategory, { label: string; icon: React.ReactNode; color: string }> = {
  children: { label: 'Children & Family', icon: <Users size={18} />, color: '#10B981' },
  healing_upgrades: { label: 'Healing Upgrades', icon: <Heart size={18} />, color: '#22D3EE' },
  past_lives: { label: 'Past Lives', icon: <Eye size={18} />, color: '#A78BFA' },
  future_visions: { label: 'Future Visions', icon: <Sparkles size={18} />, color: '#F59E0B' },
  spiritual_figures: { label: 'Spiritual Figures', icon: <Globe size={18} />, color: '#D4AF37' },
  nadi_knowledge: { label: 'Nadi Knowledge', icon: <Brain size={18} />, color: '#EC4899' },
  general_wisdom: { label: 'General Wisdom', icon: <Scroll size={18} />, color: '#8B5CF6' },
};

const CHAPTER_ORDER: LifeBookCategory[] = [
  'children', 'healing_upgrades', 'past_lives', 'future_visions',
  'spiritual_figures', 'nadi_knowledge', 'general_wisdom',
];

export default function LifeBook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chapters, setChapters] = useState<LifeBookChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setChapters([]); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from('life_book_chapters')
        .select('*')
        .eq('user_id', user.id)
        .order('chapter_type', { ascending: true });
      if (!error && data) {
        setChapters((data as unknown as LifeBookChapter[]).map(ch => ({
          ...ch,
          content: Array.isArray(ch.content) ? ch.content : [],
        })));
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const ordered = useMemo(() => {
    const byType: Record<string, LifeBookChapter | null> = {};
    for (const ch of chapters) {
      if (!byType[ch.chapter_type]) byType[ch.chapter_type] = ch;
    }
    return CHAPTER_ORDER
      .map(type => byType[type])
      .filter(Boolean) as LifeBookChapter[];
  }, [chapters]);

  const totalEntries = chapters.reduce((sum, ch) => sum + (ch.content?.length || 0), 0);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#050505', color: 'rgba(255,255,255,0.9)', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');
        @keyframes lbShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .lb-shimmer { background: linear-gradient(135deg,#D4AF37 0%,#F5E17A 40%,#D4AF37 60%,#A07C10 100%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: lbShimmer 5s linear infinite; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)' }}>Akasha-Neural Archive</div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 600, margin: 0 }} className="lb-shimmer">Your Life Book</h1>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#D4AF37' }}>{ordered.length}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Chapters</div>
        </div>
        <div style={{ flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#22D3EE' }}>{totalEntries}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Transmissions</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px 120px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            <BookOpen size={28} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            Accessing Akasha-Neural Archive…
          </div>
        ) : ordered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <BookOpen size={32} style={{ margin: '0 auto 12px', color: 'rgba(212,175,55,0.3)' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>No chapters yet.</p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Start a conversation with SQI in the Quantum Apothecary to begin writing your Life Book.</p>
            <button
              onClick={() => navigate('/quantum-apothecary')}
              style={{ marginTop: 20, padding: '12px 24px', borderRadius: 100, background: 'linear-gradient(135deg, #D4AF37, #B8960C)', color: '#050505', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}
            >
              Open Quantum Apothecary
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ordered.map(chapter => {
              const meta = CHAPTER_META[chapter.chapter_type];
              const isExpanded = expandedChapter === chapter.id;
              const entries = chapter.content || [];

              return (
                <div key={chapter.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden', transition: 'border-color .3s' }}>
                  <button
                    onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                    style={{ width: '100%', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', textAlign: 'left' }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: `${meta.color}12`, border: `1px solid ${meta.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{meta.label}</div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>
                        {entries.length} {entries.length === 1 ? 'transmission' : 'transmissions'}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {entries.map((entry, i) => (
                        <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16 }}>
                          {entry.title && (
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: meta.color, marginBottom: 4 }}>{entry.title}</div>
                          )}
                          {entry.summary && (
                            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{entry.summary}</div>
                          )}
                          {entry.created_at && (
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                              {new Date(entry.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
