// src/components/books/AyurvedaLifeBook.tsx
// SQI 2050 | Agastya Ayurveda Life Book — full consultation archive on dashboard
// Pulls from apothecary_chat_messages where chat_context='ayurveda'
// Groups by day, shows full assistant transmissions as book entries

import { useState, useEffect } from 'react';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase: any = _supabase;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface DayGroup {
  date: string;        // e.g. "12 Jun 2026"
  dateKey: string;     // ISO date string for key
  transmissions: { question: string; answer: string; timestamp: string }[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function groupByDay(messages: ChatMessage[]): DayGroup[] {
  const days: Record<string, DayGroup> = {};

  // Pair user + next assistant messages
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const next = messages[i + 1];
    if (!next || next.role !== 'assistant') continue;

    const dateKey = msg.created_at.slice(0, 10);
    if (!days[dateKey]) {
      days[dateKey] = {
        date: formatDate(msg.created_at),
        dateKey,
        transmissions: [],
      };
    }
    days[dateKey].transmissions.push({
      question: msg.content,
      answer: next.content,
      timestamp: msg.created_at,
    });
  }

  return Object.values(days).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export default function AyurvedaLifeBook() {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('apothecary_chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .eq('chat_context', 'ayurveda')
      .order('created_at', { ascending: true })
      .limit(500);

    if (!error && data) {
      setGroups(groupByDay(data as ChatMessage[]));
    }
    setLoading(false);
  }

  if (loading) return null;
  if (groups.length === 0) return null;

  const totalTransmissions = groups.reduce((sum, g) => sum + g.transmissions.length, 0);

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
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0,
        }}>
          🔱 Agastya Life Book · {totalTransmissions} {totalTransmissions === 1 ? 'Transmission' : 'Transmissions'}
        </p>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map((group) => {
            const isDayOpen = expandedDay === group.dateKey;
            return (
              <div
                key={group.dateKey}
                style={{
                  background: 'rgba(255,255,255,0.015)',
                  border: `1px solid ${isDayOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 24,
                  overflow: 'hidden',
                  transition: 'border-color 0.3s',
                }}
              >
                {/* Day header */}
                <button
                  onClick={() => {
                    setExpandedDay(isDayOpen ? null : group.dateKey);
                    setExpandedTx(null);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '14px 16px', textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>🔱</span>
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 12, fontWeight: 900, color: '#fff',
                        letterSpacing: '-0.02em',
                      }}>
                        {group.date}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 8, fontWeight: 800, letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.2)', margin: '5px 0 0',
                    }}>
                      {group.transmissions.length} {group.transmissions.length === 1 ? 'consultation' : 'consultations'}
                    </p>
                  </div>
                  <span style={{
                    color: isDayOpen ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                    fontSize: 14, transition: 'color 0.2s',
                  }}>
                    {isDayOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Transmissions for this day */}
                {isDayOpen && (
                  <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {group.transmissions.map((tx, idx) => {
                      const txKey = `${group.dateKey}-${idx}`;
                      const isTxOpen = expandedTx === txKey;
                      return (
                        <div key={txKey} style={{ marginTop: 8 }}>
                          <button
                            onClick={() => setExpandedTx(isTxOpen ? null : txKey)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'flex-start',
                              justifyContent: 'space-between', background: 'none',
                              border: 'none', cursor: 'pointer',
                              padding: '8px 4px',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              textAlign: 'left',
                            }}
                          >
                            <p style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: 11, color: 'rgba(255,255,255,0.45)',
                              margin: 0, fontStyle: 'italic', flex: 1, marginRight: 8,
                              lineHeight: 1.5,
                            }}>
                              "{tx.question.length > 80 ? tx.question.slice(0, 80) + '…' : tx.question}"
                            </p>
                            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, flexShrink: 0 }}>
                              {isTxOpen ? '▲' : '▼'}
                            </span>
                          </button>

                          {isTxOpen && (
                            <div style={{ padding: '12px 4px 4px' }}>
                              {/* Question */}
                              <div style={{
                                padding: '10px 12px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.03)',
                                marginBottom: 8,
                              }}>
                                <p style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  fontSize: 8, fontWeight: 800, letterSpacing: '0.25em',
                                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
                                  margin: '0 0 6px',
                                }}>
                                  Your Question
                                </p>
                                <p style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  fontSize: 12, lineHeight: 1.6,
                                  color: 'rgba(255,255,255,0.5)', margin: 0,
                                }}>
                                  {tx.question}
                                </p>
                              </div>

                              {/* Agastya's answer — FULL */}
                              <div style={{
                                padding: '10px 12px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}>
                                <p style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  fontSize: 8, fontWeight: 800, letterSpacing: '0.25em',
                                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                                  margin: '0 0 8px',
                                }}>
                                  🔱 Agastya Muni
                                </p>
                                <p style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  fontSize: 12, lineHeight: 1.8,
                                  color: 'rgba(255,255,255,0.65)',
                                  margin: 0, whiteSpace: 'pre-wrap',
                                }}>
                                  {tx.answer}
                                </p>
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
      )}
    </div>
  );
}
