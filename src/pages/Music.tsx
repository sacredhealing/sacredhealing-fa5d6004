import React, { useState, useEffect } from 'react';
import { Music2, Plus, List, Crown, ChevronRight, X, GripVertical, Edit2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { TrackCard } from '@/components/music/TrackCard';

interface Playlist {
  id: string;
  name: string;
  user_id: string;
}

interface PlayHistory {
  track_id: string;
  play_count: number;
}

const GENRES = ['all', 'beats', 'meditation', 'mystic', 'reggae', 'hip-hop', 'reggaeton', 'indian', 'shamanic'];

const Music: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, checkSubscription, refreshPurchases, playTrack } = useMusicPlayer();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'playlists' | 'history'>('browse');
  const [selectedGenre, setSelectedGenre] = useState('all');
  
  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playHistory, setPlayHistory] = useState<PlayHistory[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<string[]>([]);

  useEffect(() => {
    fetchTracks();
    fetchPlaylists();
    fetchPlayHistory();
    checkSubscription();
    refreshPurchases();
    
    const membershipSuccess = searchParams.get('membership_success');
    if (membershipSuccess) {
      toast({ title: "Subscription active!", description: "Enjoy unlimited music streaming." });
      checkSubscription();
    }
  }, [searchParams]);

  const fetchTracks = async () => {
    const { data } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
    if (data) setTracks(data as Track[]);
    setIsLoading(false);
  };

  const fetchPlaylists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_playlists').select('*').eq('user_id', user.id).order('created_at');
    if (data) setPlaylists(data);
  };

  const fetchPlayHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('music_play_history').select('track_id, play_count').eq('user_id', user.id).order('play_count', { ascending: false });
    if (data) setPlayHistory(data);
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    const { data } = await supabase.from('playlist_tracks').select('track_id').eq('playlist_id', playlistId).order('order_index');
    if (data) setPlaylistTracks(data.map(pt => pt.track_id));
  };

  const handleSubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-music-membership-checkout', {
        body: { planType: 'monthly' }
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePurchaseTrack = async (track: Track) => {
    try {
      const { data, error } = await supabase.functions.invoke('purchase-music', {
        body: { trackId: track.id, paymentMethod: 'stripe' }
      });
      if (error) throw error;
      if (data?.checkoutUrl) window.open(data.checkoutUrl, '_blank');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('user_playlists').insert({ user_id: user.id, name: newPlaylistName.trim() });
    setNewPlaylistName('');
    fetchPlaylists();
    toast({ title: "Playlist created" });
  };

  const renamePlaylist = async (id: string) => {
    if (!editingName.trim()) return;
    await supabase.from('user_playlists').update({ name: editingName.trim() }).eq('id', id);
    setEditingPlaylistId(null);
    fetchPlaylists();
  };

  const deletePlaylist = async (id: string) => {
    await supabase.from('user_playlists').delete().eq('id', id);
    fetchPlaylists();
    if (selectedPlaylist === id) setSelectedPlaylist(null);
  };

  const addToPlaylist = async (playlistId: string, trackId: string) => {
    const maxOrder = playlistTracks.length;
    await supabase.from('playlist_tracks').insert({ playlist_id: playlistId, track_id: trackId, order_index: maxOrder });
    fetchPlaylistTracks(playlistId);
    toast({ title: "Added to playlist" });
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId).eq('track_id', trackId);
    fetchPlaylistTracks(playlistId);
  };

  const filteredTracks = selectedGenre === 'all' ? tracks : tracks.filter(t => t.genre === selectedGenre);
  const newReleases = [...tracks].sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime()).slice(0, 5);
  const historyTracks = playHistory.map(h => tracks.find(t => t.id === h.track_id)).filter(Boolean) as Track[];
  const playlistTracksList = playlistTracks.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-40">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Music2 className="text-primary" /> Music
        </h1>
      </header>

      {/* Subscription Banner */}
      {!isSubscribed && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="text-primary" size={20} />
              <div>
                <p className="text-sm font-medium">Unlimited streaming</p>
                <p className="text-xs text-muted-foreground">€4.99/month • Full tracks + 100 SHC per stream</p>
              </div>
            </div>
            <Button size="sm" onClick={handleSubscribe}>Subscribe</Button>
          </div>
        </div>
      )}

      {/* Mastering Service Banner */}
      <button
        onClick={() => navigate('/mastering')}
        className="w-full flex items-center justify-between bg-muted/30 border border-border/50 rounded-xl p-3 mb-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Music2 size={16} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">Music Mastering Service</p>
            <p className="text-xs text-muted-foreground">Professional audio mastering from €147</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['browse', 'playlists', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); if (tab === 'browse') setSelectedPlaylist(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Genres */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {GENRES.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedGenre === g 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* New Releases */}
          {newReleases.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">New Releases</h2>
              <div className="space-y-2">
                {newReleases.map(track => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    playlists={playlists}
                    onAddToPlaylist={addToPlaylist}
                    onPurchase={handlePurchaseTrack}
                    allTracks={newReleases}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Tracks */}
          <div>
            <h2 className="text-lg font-semibold mb-3">All Tracks ({filteredTracks.length})</h2>
            <div className="space-y-2">
              {filteredTracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  playlists={playlists}
                  onAddToPlaylist={addToPlaylist}
                  onPurchase={handlePurchaseTrack}
                  allTracks={filteredTracks}
                />
              ))}
              {filteredTracks.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No tracks in this genre yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Playlists Tab */}
      {activeTab === 'playlists' && (
        <div>
          {/* Create Playlist */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && createPlaylist()}
            />
            <Button size="sm" onClick={createPlaylist}><Plus size={16} /></Button>
          </div>

          {selectedPlaylist ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPlaylist(null)}>← Back</Button>
                <span className="font-semibold">{playlists.find(p => p.id === selectedPlaylist)?.name}</span>
              </div>
              <div className="space-y-2">
                {playlistTracksList.map(track => (
                  <div key={track.id} className="flex items-center gap-2">
                    <GripVertical size={16} className="text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <TrackCard
                        track={track}
                        onPurchase={handlePurchaseTrack}
                        allTracks={playlistTracksList}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromPlaylist(selectedPlaylist, track.id)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                {playlistTracksList.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No tracks in this playlist yet</p>}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {playlists.map(pl => (
                <div key={pl.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl hover:bg-muted/40 transition-colors">
                  <List size={18} className="text-muted-foreground" />
                  {editingPlaylistId === pl.id ? (
                    <>
                      <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="flex-1 h-8" />
                      <Button size="icon" variant="ghost" onClick={() => renamePlaylist(pl.id)}><Check size={14} /></Button>
                    </>
                  ) : (
                    <>
                      <span 
                        className="flex-1 cursor-pointer" 
                        onClick={() => { setSelectedPlaylist(pl.id); fetchPlaylistTracks(pl.id); }}
                      >
                        {pl.name}
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingPlaylistId(pl.id); setEditingName(pl.name); }}>
                        <Edit2 size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deletePlaylist(pl.id)}>
                        <X size={14} />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {playlists.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Create your first playlist</p>}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Most Played</h2>
          <div className="space-y-2">
            {historyTracks.map((track, i) => (
              <div key={track.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-6 text-center font-medium">{i + 1}</span>
                <div className="flex-1">
                  <TrackCard
                    track={track}
                    playlists={playlists}
                    onAddToPlaylist={addToPlaylist}
                    onPurchase={handlePurchaseTrack}
                    allTracks={historyTracks}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {playHistory.find(h => h.track_id === track.id)?.play_count} plays
                </span>
              </div>
            ))}
            {historyTracks.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No play history yet</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Music;
