import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import ContentDropCard from '@/components/community/ContentDropCard';

type TabKey = 'lives' | 'private' | 'vault';

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
    { key: 'lives', label: '🔴 Lives', items: liveRecordings, emptyText: 'Nothing recorded yet — the next live you end in Divine Sangha will show up here.' },
    { key: 'private', label: '🤝 Private', items: privateSessions, emptyText: 'Nothing recorded yet — a private 1-on-1 call will show up here once it ends, visible only to you and the other person.' },
    { key: 'vault', label: '📼 Content Vault', items: contentVaultUploads, emptyText: 'Nothing uploaded yet.' },
  ];
  const activeItems = tabs.find((t) => t.key === activeTab)!;

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setDeletingId(id);
    try {
      const { error } = await (supabase as any).from('content_vault').delete().eq('id', id);
      if (error) throw error;
      setVideos((prev) => prev.filter((v) => v.id !== id));
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

      {/* Tab cards — tap one to filter, matching the same pill-tab pattern used elsewhere in the app */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1,
              padding: '12px 8px',
              borderRadius: 16,
              cursor: 'pointer',
              textAlign: 'center',
              fontFamily: 'inherit',
              background: activeTab === t.key ? 'rgba(212,175,55,.14)' : 'rgba(255,255,255,.03)',
              border: activeTab === t.key ? '1px solid rgba(212,175,55,.45)' : '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{t.label.split(' ')[0]}</div>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', color: activeTab === t.key ? '#D4AF37' : 'rgba(255,255,255,.5)' }}>
              {t.label.split(' ').slice(1).join(' ')}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>({t.items.length})</div>
          </button>
        ))}
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
                  onClick={() => handleDelete(v.id, v.title)}
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
