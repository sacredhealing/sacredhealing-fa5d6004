// src/components/books/SacredBooksWidget.tsx
// SQI 2050 | Bhrigu Jyotish + Agastya Life Book
// Dashboard: two glowing icons identical to Akashic + Portrait
// Tap icon → full-screen book slides in

import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase: any = _supabase;

// ── Types ─────────────────────────────────────────────────────
interface BhriguReading {
  id: string;
  reading_type: string;
  question?: string;
  sections: Record<string, string>;
  birth_data?: { dob?: string; tob?: string; pob?: string };
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface DayGroup {
  dateKey: string;
  date: string;
  transmissions: { question: string; answer: string }[];
}

// ── Helpers ───────────────────────────────────────────────────
const HISTORY_KEY = 'sqi:bhrigu:history:v2';

const READING_LABELS: Record<string, string> = {
  general: 'Full Nadi Reading', career: 'Dharma & Career',
  relationships: 'Love & Relationships', health: 'Body & Prana',
  spiritual: 'Moksha Path', wealth: 'Wealth & Abundance',
};

const BHRIGU_SECTIONS = [
  { key: 'graha',        label: '☀ Dominant Graha',       color: '#D4AF37' },
  { key: 'dasha',        label: '⏳ Dasha Transmission',   color: '#22D3EE' },
  { key: 'shadow',       label: '🌑 Shadow & Blind Spot',  color: 'rgba(255,100,100,0.9)' },
  { key: 'sadhana',      label: '🔱 Sadhana Prescription', color: '#A78BFA' },
  { key: 'transmission', label: '✦ Bhrigu\'s Transmission', color: '#D4AF37' },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDay(msgs: ChatMessage[]): DayGroup[] {
  const days: Record<string, DayGroup> = {};
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (m.role !== 'user') continue;
    const next = msgs[i + 1];
    if (!next || next.role !== 'assistant') continue;
    const key = m.created_at.slice(0, 10);
    if (!days[key]) days[key] = { dateKey: key, date: fmtDate(m.created_at), transmissions: [] };
    days[key].transmissions.push({ question: m.content, answer: next.content });
  }
  return Object.values(days).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

// ── Main Component ────────────────────────────────────────────
export default function SacredBooksWidget() {
  const [open, setOpen] = useState<'bhrigu' | 'ayurveda' | null>(null);
  const [bhriguData, setBhriguData] = useState<BhriguReading[]>([]);
  const [ayurData, setAyurData] = useState<DayGroup[]>([]);
  const [loadedBhrigu, setLoadedBhrigu] = useState(false);
  const [loadedAyur, setLoadedAyur] = useState(false);

  // Expanded state
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openQ, setOpenQ] = useState<string | null>(null);

  // Load Bhrigu
  useEffect(() => {
    if (open !== 'bhrigu' || loadedBhrigu) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadedBhrigu(true); return; }

      // Migrate localStorage → Supabase once
      const localRaw = localStorage.getItem(HISTORY_KEY);
      if (localRaw) {
        try {
          const entries = JSON.parse(localRaw) as any[];
          if (entries.length > 0) {
            const { count } = await supabase
              .from('bhrigu_readings')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id);
            if ((count || 0) === 0) {
              await supabase.from('bhrigu_readings').insert(
                entries.map((e: any) => ({
                  user_id: user.id,
                  reading_type: e.readingType || 'general',
                  question: e.question || null,
                  sections: e.sections || {},
                  birth_data: e.birthData || null,
                  created_at: e.date || new Date().toISOString(),
                }))
              );
            }
            localStorage.removeItem(HISTORY_KEY);
          }
        } catch (_) {}
      }

      const { data } = await supabase
        .from('bhrigu_readings')
        .select('id, reading_type, question, sections, birth_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setBhriguData(data);
      setLoadedBhrigu(true);
    })();
  }, [open]);

  // Load Ayurveda
  useEffect(() => {
    if (open !== 'ayurveda' || loadedAyur) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadedAyur(true); return; }
      const { data } = await supabase
        .from('apothecary_chat_messages')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .eq('chat_context', 'ayurveda')
        .order('created_at', { ascending: true })
        .limit(500);
      if (data) setAyurData(groupByDay(data));
      setLoadedAyur(true);
    })();
  }, [open]);

  function openBook(name: 'bhrigu' | 'ayurveda') {
    setOpen(name);
    setOpenChapter(null);
    setOpenSection(null);
    setOpenQ(null);
  }

  function closeBook() {
    setOpen(null);
  }

  // ── Shared styles ──────────────────────────────────────────
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: '#050505',
    zIndex: 9999, overflowY: 'auto',
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  const stickyHeader = (title: string, sub: string) => (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(5,5,5,0.96)', backdropFilter: 'blur(20px)',
      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <button onClick={closeBook} style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
        color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>←</button>
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{title}</div>
        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );

  const toggleChapter = (id: string) => {
    setOpenChapter(c => c === id ? null : id);
    setOpenSection(null);
    setOpenQ(null);
  };

  return (
    <>
      {/* ── DASHBOARD ICON BLOCK — identical to Akashic + Portrait ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(212,175,55,0.18)',
        borderRadius: 40,
        margin: '12px 16px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 40, paddingTop: 24, paddingBottom: 24, paddingLeft: 32, paddingRight: 32,
      }}>
        {/* Bhrigu */}
        <button onClick={() => openBook('bhrigu')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: '#D4AF37',
        }}>
          <span style={{ fontSize: 32, fontWeight: 900, textShadow: '0 0 18px rgba(212,175,55,0.45)', lineHeight: 1 }}>⟁</span>
          <span style={{ fontWeight: 800, fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', opacity: 0.75 }}>Jyotish</span>
        </button>

        <div style={{ width: 1, height: 36, background: 'rgba(212,175,55,0.2)' }} />

        {/* Agastya */}
        <button onClick={() => openBook('ayurveda')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: '#D4AF37',
        }}>
          <span style={{ fontSize: 28, fontWeight: 900, textShadow: '0 0 18px rgba(212,175,55,0.45)', lineHeight: 1 }}>🔱</span>
          <span style={{ fontWeight: 800, fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', opacity: 0.75 }}>Agastya</span>
        </button>
      </div>

      {/* ── BHRIGU FULL-SCREEN BOOK ── */}
      <div style={{ ...overlayStyle, transform: open === 'bhrigu' ? 'translateX(0)' : 'translateX(100%)' }}>
        {stickyHeader('⟁ Bhrigu Jyotish Book', `${bhriguData.length} Nadi Readings · Sealed in Akasha`)}
        <div style={{ padding: '20px 16px 100px' }}>
          {!loadedBhrigu && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>Loading transmissions…</p>
          )}
          {loadedBhrigu && bhriguData.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>No Nadi readings yet. Receive your first transmission.</p>
          )}
          {bhriguData.map((r) => {
            const isOpen = openChapter === r.id;
            return (
              <div key={r.id} style={{
                background: isOpen ? 'rgba(212,175,55,0.03)' : 'rgba(212,175,55,0.015)',
                border: `1px solid ${isOpen ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.08)'}`,
                borderRadius: 20, overflow: 'hidden', marginBottom: 10,
                transition: 'border-color 0.3s',
              }}>
                <button onClick={() => toggleChapter(r.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '16px 16px', textAlign: 'left',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 3 }}>
                      {READING_LABELS[r.reading_type] || r.reading_type}
                    </div>
                    {r.question && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 5 }}>
                        "{r.question.length > 55 ? r.question.slice(0, 55) + '…' : r.question}"
                      </div>
                    )}
                    <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)' }}>
                      {fmtDate(r.created_at)}
                    </div>
                  </div>
                  <span style={{ color: isOpen ? '#D4AF37' : 'rgba(212,175,55,0.25)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(212,175,55,0.07)', padding: '0 16px 16px' }}>
                    {r.birth_data?.dob && (
                      <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.08)', margin: '12px 0' }}>
                        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)', marginBottom: 4 }}>Birth Data</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                          {[r.birth_data.dob, r.birth_data.tob, r.birth_data.pob].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    )}
                    {BHRIGU_SECTIONS.map((sec, idx) => {
                      const text = r.sections[sec.key];
                      if (!text) return null;
                      const secId = `${r.id}-${sec.key}`;
                      const secOpen = openSection === secId;
                      return (
                        <div key={sec.key}>
                          <button onClick={() => setOpenSection(s => s === secId ? null : secId)} style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'none', border: 'none', cursor: 'pointer', padding: '9px 0',
                            borderBottom: idx < BHRIGU_SECTIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          }}>
                            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: sec.color }}>{sec.label}</span>
                            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{secOpen ? '▲' : '▼'}</span>
                          </button>
                          {secOpen && (
                            <p style={{ fontSize: 12, lineHeight: 1.75, color: 'rgba(255,255,255,0.62)', padding: '8px 0 6px', whiteSpace: 'pre-wrap' }}>{text}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AGASTYA FULL-SCREEN BOOK ── */}
      <div style={{ ...overlayStyle, transform: open === 'ayurveda' ? 'translateX(0)' : 'translateX(100%)' }}>
        {stickyHeader('🔱 Agastya Life Book', `${ayurData.reduce((s, g) => s + g.transmissions.length, 0)} Transmissions · Ayurveda Archive`)}
        <div style={{ padding: '20px 16px 100px' }}>
          {!loadedAyur && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>Loading transmissions…</p>
          )}
          {loadedAyur && ayurData.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>No Agastya consultations yet.</p>
          )}
          {ayurData.map((group) => {
            const isOpen = openChapter === group.dateKey;
            return (
              <div key={group.dateKey} style={{
                background: isOpen ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.015)',
                border: `1px solid ${isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 20, overflow: 'hidden', marginBottom: 10,
                transition: 'border-color 0.3s',
              }}>
                <button onClick={() => toggleChapter(group.dateKey)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '16px 16px', textAlign: 'left',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 5 }}>
                      {group.date}
                    </div>
                    <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
                      {group.transmissions.length} {group.transmissions.length === 1 ? 'consultation' : 'consultations'}
                    </div>
                  </div>
                  <span style={{ color: isOpen ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '0 12px 12px' }}>
                    {group.transmissions.map((tx, idx) => {
                      const qId = `${group.dateKey}-${idx}`;
                      const qOpen = openQ === qId;
                      return (
                        <div key={qId}>
                          <button onClick={() => setOpenQ(q => q === qId ? null : qId)} style={{
                            width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '10px 4px',
                            borderBottom: idx < group.transmissions.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                            textAlign: 'left',
                          }}>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', flex: 1, marginRight: 8, lineHeight: 1.5, margin: '0 8px 0 0' }}>
                              "{tx.question.length > 75 ? tx.question.slice(0, 75) + '…' : tx.question}"
                            </p>
                            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, flexShrink: 0 }}>{qOpen ? '▲' : '▼'}</span>
                          </button>
                          {qOpen && (
                            <div style={{ padding: '10px 4px 6px' }}>
                              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', marginBottom: 8 }}>
                                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>Your Question</div>
                                <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{tx.question}</p>
                              </div>
                              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 8 }}>🔱 Agastya Muni</div>
                                <p style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.62)', margin: 0, whiteSpace: 'pre-wrap' }}>{tx.answer}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
