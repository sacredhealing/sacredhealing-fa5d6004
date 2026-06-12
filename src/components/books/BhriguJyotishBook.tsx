// src/components/books/BhriguJyotishBook.tsx
// SQI 2050 | Bhrigu Jyotish Book — full reading archive on dashboard
// Pulls from Supabase bhrigu_readings table + migrates localStorage on first load

import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase: any = _supabase;

const HISTORY_KEY = 'sqi:bhrigu:history:v2';

interface BhriguSections {
  graha?: string;
  dasha?: string;
  shadow?: string;
  sadhana?: string;
  transmission?: string;
}

interface BhriguReading {
  id: string;
  reading_type: string;
  question?: string;
  sections: BhriguSections;
  birth_data?: { dob?: string; tob?: string; pob?: string };
  created_at: string;
}

const SECTION_CONFIG = [
  { key: 'graha', title: 'Dominant Graha', icon: '☀', color: '#D4AF37' },
  { key: 'dasha', title: 'Dasha Transmission', icon: '⏳', color: '#22D3EE' },
  { key: 'shadow', title: 'Shadow & Blind Spot', icon: '🌑', color: 'rgba(255,120,120,0.9)' },
  { key: 'sadhana', title: 'Sadhana Prescription', icon: '🔱', color: '#A78BFA' },
  { key: 'transmission', title: "Bhrigu's Transmission", icon: '✦', color: '#D4AF37' },
];

const READING_LABELS: Record<string, string> = {
  general: 'Full Nadi Reading',
  career: 'Dharma & Career',
  relationships: 'Love & Relationships',
  health: 'Body & Prana',
  spiritual: 'Moksha Path',
  wealth: 'Wealth & Abundance',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function BhriguJyotishBook() {
  const [readings, setReadings] = useState<BhriguReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadReadings();
  }, []);

  async function loadReadings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Migrate localStorage → Supabase on first load
    const localRaw = localStorage.getItem(HISTORY_KEY);
    if (localRaw) {
      try {
        const localEntries = JSON.parse(localRaw) as any[];
        if (localEntries.length > 0) {
          // Check if already migrated
          const { count } = await supabase
            .from('bhrigu_readings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if ((count || 0) === 0) {
            // Insert all local entries
            const rows = localEntries.map((e: any) => ({
              user_id: user.id,
              reading_type: e.readingType || 'general',
              question: e.question || null,
              sections: e.sections || {},
              birth_data: e.birthData || null,
              created_at: e.date || new Date().toISOString(),
            }));
            await supabase.from('bhrigu_readings').insert(rows);
          }
          // Clear localStorage after migration
          localStorage.removeItem(HISTORY_KEY);
        }
      } catch (_) {}
    }

    // Load from Supabase
    const { data, error } = await supabase
      .from('bhrigu_readings')
      .select('id, reading_type, question, sections, birth_data, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setReadings(data as BhriguReading[]);
    setLoading(false);
  }

  if (loading) return null;
  if (readings.length === 0) return null;

  return (
    <div style={{ margin: '0 0 8px' }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px 12px',
        }}
      >
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '8px', fontWeight: 800, letterSpacing: '0.35em',
          textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', margin: 0,
        }}>
          ✦ Bhrigu Jyotish Book · {readings.length} {readings.length === 1 ? 'Reading' : 'Readings'}
        </p>
        <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: 10 }}>
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {readings.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <div
                key={r.id}
                style={{
                  background: 'rgba(212,175,55,0.02)',
                  border: `1px solid ${isOpen ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.08)'}`,
                  borderRadius: 24,
                  overflow: 'hidden',
                  transition: 'border-color 0.3s',
                }}
              >
                {/* Reading header row */}
                <button
                  onClick={() => {
                    setExpanded(isOpen ? null : r.id);
                    setExpandedSection(null);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#D4AF37' }}>⟁</span>
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 12, fontWeight: 900, color: '#fff',
                        letterSpacing: '-0.02em',
                      }}>
                        {READING_LABELS[r.reading_type] || r.reading_type}
                      </span>
                    </div>
                    {r.question && (
                      <p style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 10, color: 'rgba(255,255,255,0.35)',
                        margin: 0, fontStyle: 'italic',
                      }}>
                        "{r.question.length > 60 ? r.question.slice(0, 60) + '…' : r.question}"
                      </p>
                    )}
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 8, fontWeight: 800, letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: 'rgba(212,175,55,0.35)',
                      margin: '6px 0 0',
                    }}>
                      {formatDate(r.created_at)}
                    </p>
                  </div>
                  <span style={{
                    color: isOpen ? '#D4AF37' : 'rgba(212,175,55,0.3)',
                    fontSize: 14, transition: 'color 0.2s',
                  }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Full reading content */}
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(212,175,55,0.06)' }}>
                    {r.birth_data && (r.birth_data.dob || r.birth_data.pob) && (
                      <div style={{
                        padding: '8px 12px', borderRadius: 12,
                        background: 'rgba(212,175,55,0.04)',
                        border: '1px solid rgba(212,175,55,0.08)',
                        marginBottom: 12, marginTop: 12,
                      }}>
                        <p style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 8, fontWeight: 800, letterSpacing: '0.3em',
                          textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)',
                          margin: '0 0 4px',
                        }}>Birth Data</p>
                        <p style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0,
                        }}>
                          {[r.birth_data.dob, r.birth_data.tob, r.birth_data.pob].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    )}

                    {SECTION_CONFIG.map((sec) => {
                      const text = (r.sections as any)[sec.key];
                      if (!text) return null;
                      const secOpen = expandedSection === `${r.id}-${sec.key}`;
                      return (
                        <div key={sec.key} style={{ marginTop: 8 }}>
                          <button
                            onClick={() => setExpandedSection(secOpen ? null : `${r.id}-${sec.key}`)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', background: 'none',
                              border: 'none', cursor: 'pointer', padding: '8px 0',
                              borderBottom: `1px solid ${secOpen ? sec.color + '22' : 'rgba(255,255,255,0.04)'}`,
                            }}
                          >
                            <span style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
                              textTransform: 'uppercase', color: sec.color,
                            }}>
                              {sec.icon} {sec.title}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
                              {secOpen ? '▲' : '▼'}
                            </span>
                          </button>
                          {secOpen && (
                            <p style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: 12, lineHeight: 1.7,
                              color: 'rgba(255,255,255,0.65)',
                              margin: '10px 0 4px', whiteSpace: 'pre-wrap',
                            }}>
                              {text}
                            </p>
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
      )}
    </div>
  );
}
