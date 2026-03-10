import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function MembersList({ channelId, onlineCount, isAdmin }: {
  channelId: string;
  onlineCount: number;
  isAdmin: boolean;
}) {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('user_id, full_name, subscription_tier, avatar_url')
      .limit(20)
      .then(({ data }) => setMembers(data || []));
  }, []);

  return (
    <aside className="sqi-members-panel">
      <div style={{
        padding: '16px 12px',
        borderBottom: '1px solid rgba(212,175,55,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: 'rgba(212,175,55,0.4)',
          marginBottom: 8,
        }}>
          Souls in Resonance
        </div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
        }}>
          {onlineCount}{' '}
          <span style={{
            fontSize: 11,
            color: 'rgba(212,175,55,0.5)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}>
            ONLINE
          </span>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
      }}>
        {members.map(m => (
          <div
            key={m.user_id}
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 8,
              alignItems: 'center',
              padding: '6px 6px',
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 900,
              color: '#D4AF37',
            }}>
              {(m.full_name || '?').substring(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.8)',
              }}>
                {m.full_name || 'Anonymous'}
              </div>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.4)',
              }}>
                {m.subscription_tier || 'member'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

