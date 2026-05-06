// src/components/UserChatHistory.tsx
// SQI 2050 :: Personal Akashic Archive Panel — resume transmissions across oracles

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { ChatSession, ChatType } from '@/hooks/useUserChatMemory';

/** App routes (Sacred Healing paths differ from generic /jyotish, /apothecary, /eotis). */
const ORACLE_ROUTES: Record<ChatType, string> = {
  ayurveda: '/ayurveda',
  jyotish: '/jyotish-vidya',
  apothecary: '/quantum-apothecary',
  eotis: '/temple-home',
};

const ORACLE_META: Record<ChatType, { glyph: string; label: string; color: string }> = {
  ayurveda: { glyph: '𑀆', label: 'ĀYURVEDA', color: '#22c55e' },
  jyotish: { glyph: '✦', label: 'JYOTIṢA', color: '#D4AF37' },
  apothecary: { glyph: '⟁', label: 'APOTHECARY', color: '#a855f7' },
  eotis: { glyph: '◎', label: 'EOTIS', color: '#22D3EE' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  filterChatType?: ChatType;
  onSessionSelect?: (sessionId: string, chatType: ChatType) => void;
}

export default function UserChatHistory({ filterChatType, onSessionSelect }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<(ChatSession & { chat_type: ChatType })[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ChatType | 'all'>(filterChatType ?? 'all');

  useEffect(() => {
    if (!user || !open) return;
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from('user_chat_sessions')
        .select('id, chat_type, session_title, message_count, last_message_at, created_at, context_summary')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(30);

      if (filterChatType) query = query.eq('chat_type', filterChatType);

      const { data } = await query;
      if (data) setSessions(data as (ChatSession & { chat_type: ChatType })[]);
      setLoading(false);
    };
    void load();
  }, [user, open, filterChatType]);

  if (!user) return null;

  const filtered =
    activeFilter === 'all' ? sessions : sessions.filter((s) => s.chat_type === activeFilter);

  const handleSelect = (session: ChatSession & { chat_type: ChatType }) => {
    setOpen(false);
    if (onSessionSelect) {
      onSessionSelect(session.id, session.chat_type);
    } else {
      navigate(`${ORACLE_ROUTES[session.chat_type]}?session=${session.id}`);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="My Sacred Sessions"
          style={{
            background: open ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '999px',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: open ? '0 0 24px rgba(212,175,55,0.25)' : 'none',
          }}
        >
          <span style={{ fontSize: '18px' }}>◈</span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            MY SESSIONS
          </span>
          <span
            style={{
              background: 'rgba(212,175,55,0.2)',
              borderRadius: '999px',
              padding: '1px 8px',
              fontSize: '10px',
              color: '#D4AF37',
              fontWeight: 700,
            }}
          >
            {sessions.length}
          </span>
        </button>
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(480px, 94vw)',
            maxHeight: '70vh',
            background: 'rgba(5, 5, 5, 0.92)',
            backdropFilter: 'blur(60px)',
            WebkitBackdropFilter: 'blur(60px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '28px',
            zIndex: 49,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 0 60px rgba(212,175,55,0.1)',
          }}
        >
          <div
            style={{
              padding: '20px 24px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <p
              style={{
                fontSize: '8px',
                fontWeight: 800,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
                margin: '0 0 4px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              AKASHIC ARCHIVE
            </p>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: '#D4AF37',
                margin: 0,
                textShadow: '0 0 15px rgba(212,175,55,0.3)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              My Sacred Sessions
            </h3>
          </div>

          {!filterChatType && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                padding: '12px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                overflowX: 'auto',
              }}
            >
              {(['all', 'ayurveda', 'jyotish', 'apothecary', 'eotis'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveFilter(type)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor:
                      activeFilter === type ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)',
                    background:
                      activeFilter === type ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: activeFilter === type ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {type === 'all' ? 'ALL' : ORACLE_META[type].label}
                </button>
              ))}
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {loading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>◈</div>
                <p style={{ fontSize: '11px', letterSpacing: '0.2em' }}>SCANNING ARCHIVE…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                <p style={{ fontSize: '12px', letterSpacing: '0.1em' }}>No transmissions yet</p>
                <p style={{ fontSize: '10px', marginTop: '4px', color: 'rgba(255,255,255,0.2)' }}>
                  Begin a session to activate the Archive
                </p>
              </div>
            ) : (
              filtered.map((session) => {
                const meta = ORACLE_META[session.chat_type];
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSelect(session)}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(212,175,55,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: `${meta.color}15`,
                        border: `1px solid ${meta.color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                        color: meta.color,
                      }}
                    >
                      {meta.glyph}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            fontSize: '7px',
                            fontWeight: 800,
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase',
                            color: meta.color,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.8)',
                          margin: '0 0 4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}
                      >
                        {session.session_title || 'Sacred Transmission'}
                      </p>
                      <p
                        style={{
                          fontSize: '10px',
                          color: 'rgba(255,255,255,0.3)',
                          margin: 0,
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}
                      >
                        {session.message_count} messages · {timeAgo(session.last_message_at)}
                      </p>
                    </div>

                    <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: '16px' }}>›</span>
                  </button>
                );
              })
            )}
          </div>

          <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              CLOSE ARCHIVE
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          role="presentation"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 48,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}
    </>
  );
}
