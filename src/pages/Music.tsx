import React, { useState, useEffect, useMemo } from 'react';
import { Music2, Plus, List, Crown, ChevronRight, X, GripVertical, Edit2, Check, Loader2, Disc, ArrowLeft, ChevronDown, ChevronUp, Headphones, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { TrackCard } from '@/components/music/TrackCard';
import { CuratedPlaylistCard } from '@/components/music/CuratedPlaylistCard';
import { useCuratedPlaylists, CuratedPlaylist } from '@/hooks/useCuratedPlaylists';
import MusicMembershipBanner from '@/components/music/MusicMembershipBanner';
import { useAuth } from '@/hooks/useAuth';
import { selectTrackForMood, type MoodKey, getTrackIdSafe, getTrackLabel } from '@/features/music/selectTrackForMood';
interface Playlist {
  id: string;
  name: string;
  user_id: string;
}

interface PlayHistory {
  track_id: string;
  play_count: number;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  cover_image_url: string | null;
  price_usd: number;
}

const GENRES = ['all', 'beats', 'meditation', 'mystic', 'reggae', 'hip-hop', 'reggaeton', 'indian', 'shamanic'];

const MOODS = [
  { value: 'all', label: 'All Moods' },
  { value: 'calm', label: 'Calm' },
  { value: 'energizing', label: 'Energizing' },
  { value: 'healing', label: 'Healing' },
  { value: 'meditative', label: 'Meditative' },
  { value: 'grounding', label: 'Grounding' },
];

const SPIRITUAL_PATHS = [
  { value: 'all', label: 'All Paths' },
  { value: 'inner_peace', label: 'Inner Peace' },
  { value: 'focus', label: 'Focus' },
  { value: 'sleep', label: 'Sleep Sanctuary' },
  { value: 'healing', label: 'Deep Healing' },
  { value: 'awakening', label: 'Awakening' },
];

function timeOfDayKey() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

const Music: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, checkSubscription, refreshPurchases, playTrack, currentTrack } = useMusicPlayer();
  const { user } = useAuth();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [purchasedAlbumIds, setPurchasedAlbumIds] = useState<string[]>([]);
  const [albumTracksMap, setAlbumTracksMap] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'albums' | 'playlists' | 'history'>('browse');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedPath, setSelectedPath] = useState('all');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
  // Curated playlists
  const { playlists: curatedPlaylists, loading: curatedLoading, getPlaylistItems } = useCuratedPlaylists('music');
  const [selectedCuratedPlaylist, setSelectedCuratedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [curatedPlaylistTracks, setCuratedPlaylistTracks] = useState<Track[]>([]);
  
  // User Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playHistory, setPlayHistory] = useState<PlayHistory[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<string[]>([]);
  const [openLibrary, setOpenLibrary] = useState(false);
  const [shuffleNonce, setShuffleNonce] = useState(0);
  const [selectedForMood, setSelectedForMood] = useState<Record<MoodKey, Track | null>>({
    calm: null,
    comfort: null,
    energy: null,
    rest: null,
    background: null,
  });

  useEffect(() => {
    fetchTracks();
    fetchAlbums();
    fetchPlaylists();
    fetchPlayHistory();
    fetchPurchasedAlbums();
    checkSubscription();
    refreshPurchases();
    
    const membershipSuccess = searchParams.get('membership_success');
    const albumSuccess = searchParams.get('album_success');
    if (membershipSuccess) {
      toast({ title: "Subscription active!", description: "Enjoy unlimited music streaming." });
      checkSubscription();
    }
    if (albumSuccess) {
      toast({ title: "Album purchased!", description: "You now have full access to all tracks in this album." });
      fetchPurchasedAlbums();
      refreshPurchases();
    }
  }, [searchParams]);

  const fetchTracks = async () => {
    const { data } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
    if (data) setTracks(data as Track[]);
    setIsLoading(false);
  };

  const fetchAlbums = async () => {
    const { data: albumsData } = await supabase.from('music_albums').select('*').order('created_at', { ascending: false });
    if (albumsData) setAlbums(albumsData);
    
    // Fetch album tracks
    const { data: albumTracks } = await supabase.from('album_tracks').select('album_id, track_id').order('order_index');
    if (albumTracks) {
      const map: Record<string, string[]> = {};
      albumTracks.forEach(at => {
        if (!map[at.album_id]) map[at.album_id] = [];
        map[at.album_id].push(at.track_id);
      });
      setAlbumTracksMap(map);
    }
  };

  const fetchPurchasedAlbums = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('album_purchases').select('album_id').eq('user_id', user.id);
    if (data) setPurchasedAlbumIds(data.map(p => p.album_id));
  };

  const hasAlbumAccess = (albumId: string) => {
    return isSubscribed || purchasedAlbumIds.includes(albumId);
  };

  const handlePurchaseAlbum = async (album: Album) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-album-checkout', {
        body: { albumId: album.id }
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
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

  const filteredTracks = tracks.filter(t => {
    if (selectedGenre !== 'all' && t.genre !== selectedGenre) return false;
    if (selectedMood !== 'all' && t.mood !== selectedMood) return false;
    if (selectedPath !== 'all' && t.spiritual_path !== selectedPath) return false;
    return true;
  });
  const newReleases = [...tracks].sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime()).slice(0, 5);
  const historyTracks = playHistory.map(h => tracks.find(t => t.id === h.track_id)).filter(Boolean) as Track[];
  const playlistTracksList = playlistTracks.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];
  const userId = user?.id ?? 'anon';

  const dailyPicks = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const baseSeed = `${userId}:${date}:${shuffleNonce}`;

    const picks: Record<MoodKey, Track | null> = {
      calm: null,
      comfort: null,
      energy: null,
      rest: null,
      background: null,
    };

    const used: string[] = [];

    const pickMood = (mood: MoodKey) => {
      const t = selectTrackForMood(tracks as any[], mood, {
        seed: `${baseSeed}:${mood}`,
        excludeIds: used,
      }) as Track | null;
      if (t) used.push(getTrackIdSafe(t as any));
      picks[mood] = t;
    };

    pickMood('calm');
    pickMood('comfort');
    pickMood('energy');
    pickMood('rest');
    pickMood('background');

    return picks;
  }, [tracks, userId, shuffleNonce]);

  const onMoodClick = (mood: MoodKey) => {
    const track = dailyPicks[mood];
    if (!track) {
      toast({ title: 'No tracks available', description: 'Music sessions are coming soon.' });
      return;
    }
    playTrack(track, tracks);
    setSelectedForMood((prev) => ({ ...prev, [mood]: track }));
  };

  const playForMe = () => {
    const tod = timeOfDayKey();
    const key: MoodKey =
      tod === 'morning' ? 'energy' : tod === 'afternoon' ? 'background' : 'rest';
    onMoodClick(key);
  };

  const lastPlayed: Track | null =
    currentTrack ||
    (historyTracks && historyTracks.length > 0 ? historyTracks[0] : null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-40 max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Music2 className="text-primary" /> Music
        </h1>
      </header>

      {/* Subscription Banner */}
      <MusicMembershipBanner />

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

      {/* Start listening — state doorway */}
      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold">What do you need right now?</div>
            <div className="mt-1 text-sm text-white/60">
              One tap — and the sound meets you where you are.
            </div>
          </div>
          <button
            onClick={() => {
              setShuffleNonce((n) => n + 1);
              setSelectedForMood({
                calm: null,
                comfort: null,
                energy: null,
                rest: null,
                background: null,
              });
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/7 transition flex items-center gap-1"
            aria-label="Shuffle picks"
          >
            <Shuffle size={16} />
            <span>Shuffle</span>
          </button>
        </div>

        {(() => {
          const moodCards: Array<{ key: MoodKey; title: string; fallback: string }> = [
            {
              key: 'calm',
              title: 'Calm my thoughts',
              fallback: 'Quiet the mind, soften the body.',
            },
            {
              key: 'comfort',
              title: 'Feel comfort',
              fallback: 'Warm support for the heart.',
            },
            {
              key: 'energy',
              title: 'More energy',
              fallback: 'Lift and focus without strain.',
            },
            {
              key: 'rest',
              title: 'Deep rest',
              fallback: 'Slow down into night.',
            },
            {
              key: 'background',
              title: 'Silent background',
              fallback: 'Gentle atmosphere while you live.',
            },
          ];

          return (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moodCards.map((c) => {
                const pick = dailyPicks[c.key];
                const selected = selectedForMood[c.key];
                const line = selected
                  ? `Today's pick: ${getTrackLabel(selected)}`
                  : pick
                  ? `Today’s pick: ${getTrackLabel(pick)}`
                  : c.fallback;

                return (
                  <button
                    key={c.key}
                    onClick={() => onMoodClick(c.key)}
                    className={[
                      'rounded-2xl border p-4 text-left transition-colors transition-shadow relative',
                      (currentTrack && selected && currentTrack.id === selected.id)
                        ? 'border-primary/50 bg-white/10 shadow-[0_0_20px_rgba(0,242,254,0.2)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/7',
                      c.key === 'background' ? 'sm:col-span-2' : '',
                    ].join(' ')}
                  >
                    <div className="text-white font-semibold">{c.title}</div>
                    <div className="mt-1 text-sm text-white/60">{line}</div>
                    {(currentTrack && selected && currentTrack.id === selected.id) && (
                      <>
                        <div className="mt-2 text-xs text-white/60 opacity-70">
                          Others are listening to this today
                        </div>
                        <div className="mt-1 text-xs text-primary/70 opacity-70">
                          Now playing
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* Your sound path */}
      <section className="mt-6">
        <div className="text-lg font-semibold text-white">Your sound path</div>
        <div className="mt-1 text-sm text-white/60">
          The sounds you've returned to recently.
        </div>

        <div className="mt-3 grid gap-3">
          {lastPlayed && (
            <button
              onClick={() => playTrack(lastPlayed, tracks)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition-colors transition-shadow"
            >
              <div className="text-white font-semibold">Continue listening</div>
              <div className="mt-1 text-sm text-white/60">
                {lastPlayed?.title ?? 'Last played'}
              </div>
              {lastPlayed?.mood && (
                <div className="mt-1 text-xs text-white/50">
                  {lastPlayed.mood}
                </div>
              )}
            </button>
          )}

          {/* Show last 2-3 tracks from history */}
          {historyTracks.slice(0, 2).map((track, index) => {
            if (track.id === lastPlayed?.id) return null; // Skip if already shown above
            return (
              <button
                key={track.id}
                onClick={() => playTrack(track, tracks)}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition-colors transition-shadow"
              >
                <div className="text-white font-semibold">{track.title}</div>
                {track.mood && (
                  <div className="mt-1 text-xs text-white/50">
                    {track.mood}
                  </div>
                )}
              </button>
            );
          })}

          <button
            onClick={playForMe}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/7 transition-colors transition-shadow"
          >
            <div className="text-white font-semibold">The sound that fits now</div>
            <div className="mt-1 text-sm text-white/60">
              Matched to your time of day — no thinking required.
            </div>
          </button>
        </div>
      </section>

      {/* Browse all sounds (collapsed library with full controls) */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5">
        <button
          onClick={() => setOpenLibrary((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <div className="text-left">
            <div className="text-white font-semibold">Browse all sounds</div>
            <div className="mt-1 text-sm text-white/60">
              Only if you feel like exploring.
            </div>
          </div>
          {openLibrary ? (
            <ChevronUp className="text-white/70" />
          ) : (
            <ChevronDown className="text-white/70" />
          )}
        </button>

        {openLibrary && (
          <div className="px-1 pt-3 pb-4">

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['browse', 'albums', 'playlists', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { 
              setActiveTab(tab); 
              if (tab === 'browse') { 
                setSelectedPlaylist(null); 
                setSelectedAlbum(null); 
                setSelectedCuratedPlaylist(null);
              } 
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tab === 'albums' && <Disc size={14} className="inline mr-1" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Albums Tab */}
      {activeTab === 'albums' && (
        <div>
          {selectedAlbum ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedAlbum(null)}>← Back</Button>
              </div>
              
              {/* Album Header */}
              <div className="flex gap-4 mb-6">
                {selectedAlbum.cover_image_url ? (
                  <img src={selectedAlbum.cover_image_url} alt={selectedAlbum.title} className="w-24 h-24 rounded-xl object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                    <Disc size={32} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedAlbum.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedAlbum.artist}</p>
                  <p className="text-xs text-muted-foreground mt-1">{albumTracksMap[selectedAlbum.id]?.length || 0} tracks</p>
                  
                  {hasAlbumAccess(selectedAlbum.id) ? (
                    <span className="text-xs text-primary mt-2 inline-block">✓ Full access</span>
                  ) : (
                    <Button size="sm" className="mt-2" onClick={() => handlePurchaseAlbum(selectedAlbum)}>
                      Buy Album ${selectedAlbum.price_usd}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Album Tracks */}
              <div className="space-y-2">
                {(albumTracksMap[selectedAlbum.id] || []).map(trackId => {
                  const track = tracks.find(t => t.id === trackId);
                  if (!track) return null;
                  return (
                    <TrackCard
                      key={track.id}
                      track={track}
                      playlists={playlists}
                      onAddToPlaylist={addToPlaylist}
                      onPurchase={handlePurchaseTrack}
                      allTracks={tracks.filter(t => albumTracksMap[selectedAlbum.id]?.includes(t.id))}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="bg-muted/30 border border-border/50 rounded-xl p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt={album.title} className="w-full aspect-square rounded-lg object-cover mb-2" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-2">
                      <Disc size={32} className="text-muted-foreground" />
                    </div>
                  )}
                  <h3 className="font-medium text-sm truncate">{album.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{albumTracksMap[album.id]?.length || 0} tracks</span>
                    {hasAlbumAccess(album.id) ? (
                      <span className="text-xs text-primary">✓ Owned</span>
                    ) : (
                      <span className="text-xs text-primary font-medium">${album.price_usd}</span>
                    )}
                  </div>
                </button>
              ))}
              {albums.length === 0 && (
                <p className="col-span-2 text-muted-foreground text-sm text-center py-8">No albums available yet</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {selectedCuratedPlaylist ? (
            /* Curated Playlist Detail View */
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSelectedCuratedPlaylist(null); setCuratedPlaylistTracks([]); }}
                >
                  <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
              </div>
              
              {/* Playlist Header */}
              <div className="flex gap-4 mb-6">
                {selectedCuratedPlaylist.cover_image_url ? (
                  <img 
                    src={selectedCuratedPlaylist.cover_image_url} 
                    alt={selectedCuratedPlaylist.title} 
                    className="w-24 h-24 rounded-xl object-cover" 
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Music2 size={32} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedCuratedPlaylist.title}</h2>
                  {selectedCuratedPlaylist.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedCuratedPlaylist.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedCuratedPlaylist.track_count} tracks • {Math.floor(selectedCuratedPlaylist.total_duration / 60)} min
                  </p>
                </div>
              </div>
              
              {/* Playlist Tracks */}
              <div className="space-y-2">
                {curatedPlaylistTracks.map(track => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    playlists={playlists}
                    onAddToPlaylist={addToPlaylist}
                    onPurchase={handlePurchaseTrack}
                    allTracks={curatedPlaylistTracks}
                  />
                ))}
                {curatedPlaylistTracks.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Browse View with Curated Playlists */
            <>
              {/* Curated Playlists Section */}
              {curatedPlaylists.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Featured Playlists</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {curatedPlaylists.map(playlist => (
                      <CuratedPlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        onClick={async () => {
                          setSelectedCuratedPlaylist(playlist);
                          const items = await getPlaylistItems(playlist.id);
                          setCuratedPlaylistTracks(items as Track[]);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Filters Section */}
              <h2 className="text-lg font-semibold mb-3">All Tracks</h2>
              
              {/* Genre Filter */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Genre</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
              </div>

              {/* Mood Filter */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Mood</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMood(m.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedMood === m.value 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spiritual Path Filter */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Spiritual Path</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {SPIRITUAL_PATHS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPath(p.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedPath === p.value 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tracks */}
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
            </>
          )}
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
        )}
      </section>

      {/* Floating CTA: Play something for me */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={playForMe}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg hover:opacity-90 transition"
        >
          <Headphones size={16} />
          Play something for me
        </button>
      </div>
    </div>
  );
};

export default Music;
