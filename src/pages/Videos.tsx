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
      ) : videos.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, textAlign: 'center', padding: '60px 20px' }}>
          Nothing here yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {videos.map((v) => (
            <ContentDropCard key={v.id} content={v} />
          ))}
        </div>
      )}
    </div>
  );
}
