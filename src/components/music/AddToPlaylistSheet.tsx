import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Check, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PlaylistRow {
  id: string;
  name: string;
}

export const AddToPlaylistSheet: React.FC<{
  trackId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ trackId, open, onOpenChange }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !user || !trackId) return;
    (async () => {
      setLoading(true);
      const { data: pls } = await supabase
        .from('user_playlists')
        .select('id,name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const { data: memberships } = await supabase
        .from('playlist_tracks')
        .select('playlist_id')
        .eq('track_id', trackId);
      setPlaylists(pls || []);
      setMemberOf(new Set((memberships || []).map((m) => m.playlist_id)));
      setLoading(false);
    })();
  }, [open, user, trackId]);

  const nextOrderIndex = async (playlistId: string) => {
    const { data } = await supabase
      .from('playlist_tracks')
      .select('order_index')
      .eq('playlist_id', playlistId)
      .order('order_index', { ascending: false })
      .limit(1);
    return data && data.length > 0 ? data[0].order_index + 1 : 0;
  };

  const toggle = async (playlistId: string) => {
    if (!trackId) return;
    const isMember = memberOf.has(playlistId);
    if (isMember) {
      await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId).eq('track_id', trackId);
      setMemberOf((s) => { const n = new Set(s); n.delete(playlistId); return n; });
      toast.success('Removed from playlist');
    } else {
      const order_index = await nextOrderIndex(playlistId);
      await supabase.from('playlist_tracks').insert({ playlist_id: playlistId, track_id: trackId, order_index });
      setMemberOf((s) => new Set(s).add(playlistId));
      toast.success('Added to playlist');
    }
  };

  const createAndAdd = async () => {
    if (!user || !trackId || !newName.trim()) return;
    setCreating(true);
    const { data: pl, error } = await supabase
      .from('user_playlists')
      .insert({ user_id: user.id, name: newName.trim() })
      .select('id,name')
      .single();
    if (error || !pl) {
      toast.error('Could not create playlist');
      setCreating(false);
      return;
    }
    await supabase.from('playlist_tracks').insert({ playlist_id: pl.id, track_id: trackId, order_index: 0 });
    setPlaylists((p) => [pl, ...p]);
    setMemberOf((s) => new Set(s).add(pl.id));
    setNewName('');
    setCreating(false);
    toast.success(`Added to "${pl.name}"`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0a0a0a] border-[#D4AF37]/25 p-5 max-h-[80vh] overflow-y-auto">
        <div style={{ fontWeight: 800, fontSize: 16, color: 'rgba(255,255,255,.92)', marginBottom: 14 }}>
          Add to Playlist
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New playlist name"
            style={{
              flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(212,175,55,.25)',
              borderRadius: 14, padding: '11px 14px', fontSize: 13, color: '#fff', outline: 'none',
            }}
          />
          <button
            onClick={createAndAdd}
            disabled={!newName.trim() || creating}
            style={{
              width: 42, height: 42, borderRadius: 14, border: 'none', flexShrink: 0,
              background: newName.trim() ? '#D4AF37' : 'rgba(212,175,55,.15)',
              color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: newName.trim() ? 'pointer' : 'default',
            }}
          >
            <Plus size={18} />
          </button>
        </div>

        {loading && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '20px 0' }}>Loading your playlists…</div>}

        {!loading && playlists.length === 0 && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '20px 0' }}>
            You don't have any playlists yet — create one above.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {playlists.map((pl) => {
            const active = memberOf.has(pl.id);
            return (
              <button
                key={pl.id}
                onClick={() => toggle(pl.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 16, border: '1px solid rgba(255,255,255,.06)',
                  background: 'rgba(255,255,255,.02)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Music2 size={15} style={{ color: '#D4AF37' }} />
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.88)' }}>{pl.name}</div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: active ? 'none' : '1.5px solid rgba(255,255,255,.2)',
                  background: active ? '#D4AF37' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <Check size={14} style={{ color: '#000' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistSheet;
