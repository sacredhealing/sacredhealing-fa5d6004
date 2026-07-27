import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, X, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { toast } from 'sonner';

interface MeditationLite {
  id: string;
  title: string;
  audio_url: string | null;
  duration_minutes?: number | null;
}

interface PlaylistRow {
  med: MeditationLite;
  orderIndex: number;
}

const MeditationPlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { playUniversalAudio, currentAudio, isPlaying } = useMusicPlayer();

  const [name, setName] = useState('');
  const [rows, setRows] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: pl } = await supabase.from('meditation_playlists').select('name').eq('id', id).single();
    if (pl) setName(pl.name);

    const { data: items } = await supabase
      .from('meditation_playlist_items')
      .select('meditation_id, order_index')
      .eq('playlist_id', id)
      .order('order_index', { ascending: true });

    if (items && items.length > 0) {
      const { data: medsData } = await supabase
        .from('meditations')
        .select('id,title,audio_url,duration_minutes')
        .in('id', items.map((p) => p.meditation_id));
      const byId = new Map((medsData || []).map((m) => [m.id, m]));
      const ordered = items
        .map((p) => {
          const m = byId.get(p.meditation_id);
          return m ? { med: m as MeditationLite, orderIndex: p.order_index } : null;
        })
        .filter(Boolean) as PlaylistRow[];
      setRows(ordered);
    } else {
      setRows([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

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

  const playOne = (med: MeditationLite) => {
    if (!med.audio_url) {
      toast.error('Audio not yet uploaded for this meditation.');
      return;
    }
    const audio: UniversalAudioItem = {
      id: med.id, title: med.title, audio_url: med.audio_url, artist: '',
      cover_image_url: null, duration_seconds: 0, shc_reward: 0, contentType: 'meditation',
    };
    playUniversalAudio(audio);
  };

  const removeItem = async (meditationId: string) => {
    if (!id) return;
    await supabase.from('meditation_playlist_items').delete().eq('playlist_id', id).eq('meditation_id', meditationId);
    setRows((r) => r.filter((row) => row.med.id !== meditationId));
    toast.success('Removed from playlist');
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (!id || targetIndex < 0 || targetIndex >= rows.length) return;

    const a = rows[index];
    const b = rows[targetIndex];
    const aOrder = a.orderIndex;
    const bOrder = b.orderIndex;

    const next = [...rows];
    next[index] = { med: b.med, orderIndex: aOrder };
    next[targetIndex] = { med: a.med, orderIndex: bOrder };
    setRows(next);

    await Promise.all([
      supabase.from('meditation_playlist_items').update({ order_index: aOrder }).eq('playlist_id', id).eq('meditation_id', b.med.id),
      supabase.from('meditation_playlist_items').update({ order_index: bOrder }).eq('playlist_id', id).eq('meditation_id', a.med.id),
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
      {/* HEADER */}
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={44} style={{ color: 'rgba(212,175,55,.5)' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)', marginBottom: 6 }}>
              Your Meditation Playlist
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>{name}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>
              {rows.length} {rows.length === 1 ? 'meditation' : 'meditations'}
            </div>
          </div>

          {rows.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 22 }}>
              <button
                onClick={() => playOne(rows[0].med)}
                style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: '#D4AF37', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(212,175,55,.35)' }}
              >
                <Play size={26} style={{ marginLeft: 3 }} fill="#000" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MEDITATION LIST */}
      <div style={{ padding: '0 16px' }}>
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,.4)', fontSize: 13, lineHeight: 1.6 }}>
            No meditations here yet. Go to Dhyana and tap "Add to Playlist" on any meditation.
          </div>
        )}
        {rows.map((row, index) => {
          const med = row.med;
          const active = currentAudio?.id === med.id;
          return (
            <div
              key={med.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                borderRadius: 16, background: active ? 'rgba(212,175,55,.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  style={{ width: 22, height: 18, border: 'none', background: 'transparent', color: index === 0 ? 'rgba(255,255,255,.12)' : 'rgba(212,175,55,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === 0 ? 'default' : 'pointer' }}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === rows.length - 1}
                  style={{ width: 22, height: 18, border: 'none', background: 'transparent', color: index === rows.length - 1 ? 'rgba(255,255,255,.12)' : 'rgba(212,175,55,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === rows.length - 1 ? 'default' : 'pointer' }}
                >
                  <ChevronDown size={15} />
                </button>
              </div>
              <div
                onClick={() => playOne(med)}
                style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative', background: 'rgba(212,175,55,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {active && isPlaying ? <Pause size={16} color="#D4AF37" /> : <Play size={16} color="#D4AF37" fill="#D4AF37" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#D4AF37' : 'rgba(255,255,255,.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {med.title}
                </div>
                {med.duration_minutes ? (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>{med.duration_minutes} min</div>
                ) : null}
              </div>
              <button
                onClick={() => removeItem(med.id)}
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

export default MeditationPlaylistDetail;
