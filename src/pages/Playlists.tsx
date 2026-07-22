import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, ListMusic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PlaylistCard {
  id: string;
  name: string;
  trackCount: number;
  covers: string[];
}

const Playlists: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data: pls } = await supabase
      .from('user_playlists')
      .select('id,name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const cards: PlaylistCard[] = [];
    for (const pl of pls || []) {
      const { data: pt } = await supabase
        .from('playlist_tracks')
        .select('track_id, order_index')
        .eq('playlist_id', pl.id)
        .order('order_index', { ascending: true })
        .limit(4);
      let covers: string[] = [];
      if (pt && pt.length > 0) {
        const { data: tracksData } = await supabase
          .from('music_tracks')
          .select('id,cover_image_url')
          .in('id', pt.map((p) => p.track_id));
        covers = (tracksData || []).map((t) => t.cover_image_url).filter(Boolean) as string[];
      }
      const { count } = await supabase
        .from('playlist_tracks')
        .select('id', { count: 'exact', head: true })
        .eq('playlist_id', pl.id);
      cards.push({ id: pl.id, name: pl.name, trackCount: count || 0, covers });
    }
    setPlaylists(cards);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, location.key]);

  useEffect(() => {
    const onFocus = () => load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  const createPlaylist = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('user_playlists')
      .insert({ user_id: user.id, name: newName.trim() })
      .select('id')
      .single();
    setCreating(false);
    if (error || !data) { toast.error('Could not create playlist'); return; }
    setNewName('');
    navigate(`/playlists/${data.id}`);
  };

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 100, color: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 8px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Your Playlists</div>
      </div>

      {/* New playlist input */}
      <div style={{ display: 'flex', gap: 8, margin: '18px 20px' }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
          placeholder="Name your new playlist"
          style={{
            flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(212,175,55,.25)',
            borderRadius: 16, padding: '13px 16px', fontSize: 14, color: '#fff', outline: 'none',
          }}
        />
        <button
          onClick={createPlaylist}
          disabled={!newName.trim() || creating}
          style={{
            width: 46, height: 46, borderRadius: 16, border: 'none', flexShrink: 0,
            background: newName.trim() ? '#D4AF37' : 'rgba(212,175,55,.15)', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: newName.trim() ? 'pointer' : 'default',
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading…</div>}

      {!loading && playlists.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 30px', color: 'rgba(255,255,255,.4)', fontSize: 13, lineHeight: 1.6 }}>
          No playlists yet. Create one above, or tap "Add to Playlist" on any track in Music.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 20px' }}>
        {playlists.map((pl) => (
          <div key={pl.id} onClick={() => navigate(`/playlists/${pl.id}`)} style={{ cursor: 'pointer' }}>
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: 16, overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(212,175,55,.18), rgba(15,8,0,.9))',
              border: '1px solid rgba(212,175,55,.22)',
              display: 'grid', gridTemplateColumns: pl.covers.length > 1 ? '1fr 1fr' : '1fr',
              gridTemplateRows: pl.covers.length > 2 ? '1fr 1fr' : '1fr',
            }}>
              {pl.covers.length > 0 ? (
                pl.covers.slice(0, 4).map((c, i) => (
                  <img key={i} src={c} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ListMusic size={28} style={{ color: 'rgba(212,175,55,.5)' }} />
                </div>
              )}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,.9)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pl.name}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>
              {pl.trackCount} {pl.trackCount === 1 ? 'song' : 'songs'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlists;
