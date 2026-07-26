import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import ContentDropCard from '@/components/community/ContentDropCard';

type TabKey = 'lives' | 'private' | 'vault';

// Original SVG icons — a rotating trident-flame for lives, an interlocking
// mudra/hands mark for private sessions, a sealed-scroll mark for the
// vault. Same gold gradient + glow language as the rest of the app
// (badges, sacred geometry), not stock emoji.
function TabIcon({ kind, active }: { kind: TabKey; active: boolean }) {
  const stroke = active ? '#F4D35E' : 'rgba(212,175,55,.5)';
  const glow = active ? 'drop-shadow(0 0 5px rgba(244,211,94,.8))' : 'none';
  if (kind === 'lives') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: glow }}>
        <circle cx="12" cy="12" r="4" fill={active ? '#F4D35E' : 'none'} stroke={stroke} strokeWidth="1.4">
          {active && <animate attributeName="r" values="3.4;4.4;3.4" dur="1.8s" repeatCount="indefinite" />}
        </circle>
        <circle cx="12" cy="12" r="8.5" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.6">
          {active && <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite" />}
        </circle>
      </svg>
    );
  }
  if (kind === 'private') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: glow }}>
        <path d="M6 11a6 6 0 0 1 12 0v2H6z" fill="none" stroke={stroke} strokeWidth="1.4" />
        <rect x="5" y="13" width="14" height="8" rx="2.5" fill={active ? 'rgba(244,211,94,.15)' : 'none'} stroke={stroke} strokeWidth="1.4" />
        <circle cx="12" cy="17" r="1.6" fill={stroke} />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: glow }}>
      <rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke={stroke} strokeWidth="1.4" />
      <path d="M9 9l6 3-6 3z" fill={stroke} />
      <circle cx="12" cy="4" r="1.4" fill={stroke} />
    </svg>
  );
}

export default function Videos() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('vault');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from('content_vault')
      .select('*')
      .eq('content_type', 'video')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (!error) setVideos(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchVideos();
  }, [user, navigate]);

  const liveRecordings = videos.filter((v) => v.metadata?.category === 'live-recording');
  const privateSessions = videos.filter((v) => v.metadata?.category === 'private-session-recording');
  const contentVaultUploads = videos.filter((v) => v.metadata?.category !== 'live-recording' && v.metadata?.category !== 'private-session-recording');

  const tabs: { key: TabKey; label: string; items: any[]; emptyText: string }[] = [
    { key: 'lives', label: 'Lives', items: liveRecordings, emptyText: 'Nothing recorded yet — the next live you end in Divine Sangha will show up here.' },
    { key: 'private', label: 'Private', items: privateSessions, emptyText: 'Nothing recorded yet — a private 1-on-1 call will show up here once it ends, visible only to you and the other person.' },
    { key: 'vault', label: 'Content Vault', items: contentVaultUploads, emptyText: 'Nothing uploaded yet.' },
  ];
  const activeItems = tabs.find((t) => t.key === activeTab)!;

  const handleDelete = async (video: any) => {
    if (!window.confirm(`Delete "${video.title}"? This can't be undone.`)) return;
    setDeletingId(video.id);
    try {
      // Delete the row first — this is the part that actually removes it
      // from the app everywhere. Then clean up the underlying file too,
      // if there is one (YouTube embeds and Daily.co recordings have an
      // empty storage_path since they're external links, nothing to
      // delete from our own storage for those).
      const { error } = await (supabase as any).from('content_vault').delete().eq('id', video.id);
      if (error) throw error;

      if (video.storage_path) {
        const { error: storageError } = await supabase.storage.from('content-vault').remove([video.storage_path]);
        if (storageError) {
          console.error('[Videos] row deleted but storage cleanup failed:', storageError);
          // Non-fatal — the row is gone either way, which is what matters
          // most for the user. Log it so it's traceable if storage costs
          // ever look off, but don't block or alarm over it.
        }
      }

      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err: any) {
      alert(`Could not delete: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '20px 16px 100px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', padding: '8px 14px', fontSize: 12, marginBottom: 16, cursor: 'pointer' }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>Videos</h1>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>
        Sacred video teachings and offerings.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1,
                padding: '14px 6px 12px',
                borderRadius: 18,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden',
                background: active
                  ? 'linear-gradient(180deg, rgba(212,175,55,.16), rgba(212,175,55,.04))'
                  : 'rgba(255,255,255,.03)',
                border: active ? '1px solid rgba(212,175,55,.5)' : '1px solid rgba(255,255,255,.08)',
                boxShadow: active ? '0 0 18px rgba(212,175,55,.22), inset 0 0 12px rgba(212,175,55,.08)' : 'none',
                transition: 'all .25s ease',
              }}
            >
              <div style={{
                width: 40, height: 40, margin: '0 auto 6px', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'radial-gradient(circle at 30% 30%, rgba(244,211,94,.25), rgba(212,175,55,.06))' : 'rgba(255,255,255,.04)',
                border: active ? '1px solid rgba(244,211,94,.4)' : '1px solid rgba(255,255,255,.08)',
              }}>
                <TabIcon kind={t.key} active={active} />
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: active ? '#F4D35E' : 'rgba(255,255,255,.5)' }}>
                {t.label}
              </div>
              <div style={{ fontSize: 8.5, color: active ? 'rgba(244,211,94,.6)' : 'rgba(255,255,255,.3)', marginTop: 2 }}>
                ({t.items.length})
              </div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading…</div>
      ) : activeItems.items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', padding: '24px 16px', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 14, textAlign: 'center' }}>
          {activeItems.emptyText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeItems.items.map((v) => (
            <div key={v.id} style={{ position: 'relative' }}>
              <ContentDropCard content={v} />
              {isAdmin && (
                <button
                  onClick={() => handleDelete(v)}
                  disabled={deletingId === v.id}
                  title="Delete this video"
                  style={{
                    position: 'absolute', top: 8, right: 8, zIndex: 10,
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(5,5,5,.85)', border: '1px solid rgba(255,80,80,.4)',
                    color: '#ff8080', fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {deletingId === v.id ? '…' : '🗑️'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
