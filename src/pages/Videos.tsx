import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ContentDropCard from '@/components/community/ContentDropCard';

export default function Videos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    (async () => {
      const { data, error } = await (supabase as any)
        .from('content_vault')
        .select('*')
        .eq('content_type', 'video')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (!error) setVideos(data || []);
      setIsLoading(false);
    })();
  }, [user, navigate]);

  // Three categories: recordings from Divine Sangha lives, recordings from
  // private 1-on-1 sessions with admin, and everything manually uploaded
  // through Content Vault. Anything without a category tag (older uploads,
  // or a category value we don't recognize) falls into Content Vault by
  // default, so nothing silently disappears from the page.
  const liveRecordings = videos.filter((v) => v.metadata?.category === 'live-recording');
  const privateSessions = videos.filter((v) => v.metadata?.category === 'private-session-recording');
  const contentVaultUploads = videos.filter((v) => v.metadata?.category !== 'live-recording' && v.metadata?.category !== 'private-session-recording');

  // Always shows the section, even at zero items — an empty section that's
  // still visible proves the category exists and is wired up correctly,
  // instead of silently vanishing until the first item lands in it.
  const Section = ({ title, items, emptyText }: { title: string; items: any[]; emptyText: string }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,.55)', marginBottom: 12 }}>
        {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', padding: '18px 4px', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 14 }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((v) => (
            <ContentDropCard key={v.id} content={v} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '20px 16px 100px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', padding: '8px 14px', fontSize: 12, marginBottom: 16, cursor: 'pointer' }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>Videos</h1>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 24 }}>
        Sacred video teachings and offerings.
      </p>

      {isLoading ? (
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          <Section title="🔴 Divine Sangha Lives" items={liveRecordings} emptyText="Nothing recorded yet — the next live you end in Divine Sangha will show up here." />
          <Section title="🤝 Private Sessions" items={privateSessions} emptyText="Nothing recorded yet — a private 1-on-1 call will show up here once it ends, visible only to you and the other person." />
          <Section title="📼 Content Vault" items={contentVaultUploads} emptyText="Nothing uploaded yet." />
        </>
      )}
    </div>
  );
}
