import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Shuffle, X, ListMusic, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { toast } from 'sonner';

interface PlaylistRow {
  track: Track;
  orderIndex: number;
}

const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying, hasAccess } = useMusicPlayer();

  const [name, setName] = useState('');
  const [rows, setRows] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: pl } = await supabase.from('user_playlists').select('name').eq('id', id).single();
    if (pl) setName(pl.name);

    const { data: pt } = await supabase
      .from('playlist_tracks')
      .select('track_id, order_index')
      .eq('playlist_id', id)
      .order('order_index', { ascending: true });

    if (pt && pt.length > 0) {
      const { data: tracksData } = await supabase
        .from('music_tracks')
        .select('*')
        .in('id', pt.map((p) => p.track_id));
      const byId = new Map((tracksData || []).map((t) => [t.id, t]));
      const ordered = pt
        .map((p) => {
          const t = byId.get(p.track_id);
          return t ? { track: t as Track, orderIndex: p.order_index } : null;
        })
        .filter(Boolean) as PlaylistRow[];
      setRows(ordered);
    } else {
      setRows([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Refetch whenever this screen regains focus — fixes cards/tracklist
  // going stale after adding or removing tracks elsewhere in the app.
  useEffect(() => {
    const onFocus = () => load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const tracks = rows.map((r) => r.track);
  const covers = tracks.map((t) => t.cover_image_url).filter(Boolean).slice(0, 4) as string[];

  const playAll = (shuffle = false) => {
    if (tracks.length === 0) return;
    const queue = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    playTrack(queue[0], queue);
  };

  const removeTrack = async (trackId: string) => {
    if (!id) return;
    await supabase.from('playlist_tracks').delete().eq('playlist_id', id).eq('track_id', trackId);
    setRows((r) => r.filter((row) => row.track.id !== trackId));
    toast.success('Removed from playlist');
  };

  const moveTrack = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (!id || targetIndex < 0 || targetIndex >= rows.length) return;

    const a = rows[index];
    const b = rows[targetIndex];
    const aOrder = a.orderIndex;
    const bOrder = b.orderIndex;

    // Swap positions locally so the row moves immediately, without waiting on the network
    const next = [...rows];
    next[index] = { track: b.track, orderIndex: aOrder };
    next[targetIndex] = { track: a.track, orderIndex: bOrder };
    setRows(next);

    // Persist the swapped order_index values so the new order survives a reload
    await Promise.all([
      supabase.from('playlist_tracks').update({ order_index: aOrder }).eq('playlist_id', id).eq('track_id', b.track.id),
      supabase.from('playlist_tracks').update({ order_index: bOrder }).eq('playlist_id', id).eq('track_id', a.track.id),
    ]);
  };

  if (loading) {
    return (
      <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        Loading playlist…
      </div>
    );
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 120, color: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* HEADER — cover mosaic fading into black, like Spotify's playlist screen */}
      <div style={{ position: 'relative', padding: '20px 20px 26px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% -10%, rgba(212,175,55,.28) 0%, transparent 60%), linear-gradient(180deg, transparent 0%, #050505 95%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 168, height: 168, borderRadius: 18, overflow: 'hidden', margin: '0 auto 20px',
            boxShadow: '0 12px 40px rgba(0,0,0,.6)',
            background: 'linear-gradient(135deg, rgba(212,175,55,.2), rgba(15,8,0,.95))',
            border: '1px solid rgba(212,175,55,.25)',
            display: 'grid', gridTemplateColumns: covers.length > 1 ? '1fr 1fr' : '1fr',
            gridTemplateRows: covers.length > 2 ? '1fr 1fr' : '1fr',
          }}>
            {covers.length > 0 ? (
              covers.map((c, i) => <img key={i} src={c} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ListMusic size={44} style={{ color: 'rgba(212,175,55,.5)' }} />
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)', marginBottom: 6 }}>
              Your Playlist
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>{name}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            </div>
          </div>

          {tracks.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 22 }}>
              <button
                onClick={() => playAll(true)}
                style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(212,175,55,.35)', background: 'rgba(212,175,55,.06)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Shuffle size={18} />
              </button>
              <button
                onClick={() => playAll(false)}
                style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: '#D4AF37', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(212,175,55,.35)' }}
              >
                <Play size={26} style={{ marginLeft: 3 }} fill="#000" />
              </button>
              <div style={{ width: 44 }} />
            </div>
          )}
        </div>
      </div>

      {/* TRACK LIST */}
      <div style={{ padding: '0 16px' }}>
        {tracks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,.4)', fontSize: 13, lineHeight: 1.6 }}>
            No songs here yet. Go to Music and tap "Add to Playlist" on any track.
          </div>
        )}
        {rows.map((row, index) => {
          const track = row.track;
          const active = currentTrack?.id === track.id;
          const locked = !hasAccess(track);
          return (
            <div
              key={track.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                borderRadius: 16, background: active ? 'rgba(212,175,55,.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <button
                  onClick={() => moveTrack(index, -1)}
                  disabled={index === 0}
                  style={{ width: 22, height: 18, border: 'none', background: 'transparent', color: index === 0 ? 'rgba(255,255,255,.12)' : 'rgba(212,175,55,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === 0 ? 'default' : 'pointer' }}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  onClick={() => moveTrack(index, 1)}
                  disabled={index === rows.length - 1}
                  style={{ width: 22, height: 18, border: 'none', background: 'transparent', color: index === rows.length - 1 ? 'rgba(255,255,255,.12)' : 'rgba(212,175,55,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === rows.length - 1 ? 'default' : 'pointer' }}
                >
                  <ChevronDown size={15} />
                </button>
              </div>
              <div
                onClick={() => playTrack(track, tracks)}
                style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative', background: 'rgba(212,175,55,.08)' }}
              >
                {track.cover_image_url && <img src={track.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {active && isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" fill="#fff" />}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#D4AF37' : 'rgba(255,255,255,.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                  {track.artist}{locked ? ' · 30s preview' : ''}
                </div>
              </div>
              <button
                onClick={() => removeTrack(track.id)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', color: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlaylistDetail;
