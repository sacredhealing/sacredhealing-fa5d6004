import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music2, Clock, Plus, List, Sparkles, Loader2, X, GripVertical, Edit2, Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSHC } from '@/contexts/SHCContext';
import { useSearchParams } from 'react-router-dom';

interface Track {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  genre: string;
  duration_seconds: number;
  preview_url: string;
  full_audio_url: string;
  cover_image_url: string | null;
  price_usd: number;
  shc_reward: number;
  play_count: number;
  bpm: number | null;
  release_date: string | null;
  created_at: string;
}

interface Playlist {
  id: string;
  name: string;
  user_id: string;
}

interface PlayHistory {
  track_id: string;
  play_count: number;
}

const GENRES = ['all', 'meditation', 'healing', 'gym', 'yoga', 'run', 'mindpower', 'instrumentals', 'beats'];
const MUSIC_PRICE_ID = 'price_1SaGG4APsnbrivP0nnavK58y';

const Music: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addOptimisticBalance } = useSHC();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'browse' | 'playlists' | 'history'>('browse');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  
  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playHistory, setPlayHistory] = useState<PlayHistory[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const MUSIC_REWARD = 100;
  const PREVIEW_LIMIT = 30;

  useEffect(() => {
    fetchTracks();
    fetchPurchases();
    checkSubscription();
    fetchPlaylists();
    fetchPlayHistory();
    
    const membershipSuccess = searchParams.get('membership_success');
    if (membershipSuccess) {
      toast({ title: "Subscription active!", description: "Enjoy unlimited music streaming." });
      setIsSubscribed(true);
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [searchParams]);

  const checkSubscription = async () => {
    try {
      const { data } = await supabase.functions.invoke('check-music-membership');
      setIsSubscribed(data?.hasAccess || false);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const fetchTracks = async () => {
    const { data } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
    if (data) setTracks(data);
    setIsLoading(false);
  };

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('music_purchases').select('track_id').eq('user_id', user.id);
    if (data) setPurchasedIds(data.map(p => p.track_id));
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

  const hasAccess = (track: Track) => isSubscribed || purchasedIds.includes(track.id);

  const playTrack = async (track: Track) => {
    const canPlayFull = hasAccess(track);
    
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    if (audioRef.current) audioRef.current.pause();
    
    const audioUrl = canPlayFull ? track.full_audio_url : track.preview_url;
    audioRef.current = new Audio(audioUrl);
    
    audioRef.current.onloadedmetadata = () => {
      if (audioRef.current) setDuration(audioRef.current.duration);
    };
    
    audioRef.current.ontimeupdate = () => {
      if (!audioRef.current) return;
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      setProgress((time / audioRef.current.duration) * 100);
      
      // Limit preview to 30 seconds
      if (!canPlayFull && time >= PREVIEW_LIMIT) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        toast({ title: "Preview ended", description: "Subscribe or purchase to hear the full track." });
      }
    };
    
    audioRef.current.onended = async () => {
      setIsPlaying(false);
      if (canPlayFull) {
        addOptimisticBalance(MUSIC_REWARD);
        toast({ title: `+${MUSIC_REWARD} SHC earned!`, description: `Completed "${track.title}"` });
      }
    };
    
    audioRef.current.play();
    setCurrentTrack(track);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
    
    // Update play history
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('music_play_history').upsert({
        user_id: user.id,
        track_id: track.id,
        play_count: (playHistory.find(h => h.track_id === track.id)?.play_count || 0) + 1,
        last_played_at: new Date().toISOString()
      }, { onConflict: 'user_id,track_id' });
      fetchPlayHistory();
    }
  };

  const seekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * audioRef.current.duration;
    
    // Limit seeking for non-subscribers
    if (!hasAccess(currentTrack) && seekTime > PREVIEW_LIMIT) {
      toast({ title: "Preview limit", description: "Subscribe to seek past 30 seconds." });
      return;
    }
    
    audioRef.current.currentTime = seekTime;
    setProgress(percent * 100);
    setCurrentTime(seekTime);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTracks = selectedGenre === 'all' ? tracks : tracks.filter(t => t.genre === selectedGenre);
  const newReleases = [...tracks].sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime()).slice(0, 5);
  const historyTracks = playHistory.map(h => tracks.find(t => t.id === h.track_id)).filter(Boolean) as Track[];
  const playlistTracksList = playlistTracks.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];

  if (isLoading || checkingSubscription) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-32">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Music2 className="text-primary" /> Music
        </h1>
      </header>

      {/* Subscription Banner */}
      {!isSubscribed && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="text-primary" size={20} />
              <span className="text-sm">Unlimited streaming for €4.99/month</span>
            </div>
            <Button size="sm" onClick={handleSubscribe}>Subscribe</Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['browse', 'playlists', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); if (tab === 'browse') setSelectedPlaylist(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Genres */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${selectedGenre === g ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'}`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>

          {/* New Releases */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">New Releases</h2>
            <div className="space-y-2">
              {newReleases.map(track => (
                <TrackRow 
                  key={track.id} 
                  track={track} 
                  isPlaying={isPlaying && currentTrack?.id === track.id}
                  hasAccess={hasAccess(track)}
                  isSubscribed={isSubscribed}
                  onPlay={() => playTrack(track)}
                  onPurchase={() => handlePurchaseTrack(track)}
                  showDate
                />
              ))}
            </div>
          </div>

          {/* All Tracks */}
          <div>
            <h2 className="text-lg font-semibold mb-3">All Tracks ({filteredTracks.length})</h2>
            <div className="space-y-2">
              {filteredTracks.map(track => (
                <TrackRow 
                  key={track.id} 
                  track={track} 
                  isPlaying={isPlaying && currentTrack?.id === track.id}
                  hasAccess={hasAccess(track)}
                  isSubscribed={isSubscribed}
                  onPlay={() => playTrack(track)}
                  onPurchase={() => handlePurchaseTrack(track)}
                  playlists={playlists}
                  onAddToPlaylist={(pid) => addToPlaylist(pid, track.id)}
                />
              ))}
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
                      <TrackRow 
                        track={track} 
                        isPlaying={isPlaying && currentTrack?.id === track.id}
                        hasAccess={hasAccess(track)}
                        isSubscribed={isSubscribed}
                        onPlay={() => playTrack(track)}
                        onPurchase={() => handlePurchaseTrack(track)}
                        compact
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromPlaylist(selectedPlaylist, track.id)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                {playlistTracksList.length === 0 && <p className="text-muted-foreground text-sm">No tracks yet</p>}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {playlists.map(pl => (
                <div key={pl.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <List size={18} className="text-muted-foreground" />
                  {editingPlaylistId === pl.id ? (
                    <>
                      <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="flex-1 h-8" />
                      <Button size="icon" variant="ghost" onClick={() => renamePlaylist(pl.id)}><Check size={14} /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 cursor-pointer" onClick={() => { setSelectedPlaylist(pl.id); fetchPlaylistTracks(pl.id); }}>{pl.name}</span>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingPlaylistId(pl.id); setEditingName(pl.name); }}><Edit2 size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deletePlaylist(pl.id)}><X size={14} /></Button>
                    </>
                  )}
                </div>
              ))}
              {playlists.length === 0 && <p className="text-muted-foreground text-sm">Create your first playlist</p>}
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
                <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                <div className="flex-1">
                  <TrackRow 
                    track={track} 
                    isPlaying={isPlaying && currentTrack?.id === track.id}
                    hasAccess={hasAccess(track)}
                    isSubscribed={isSubscribed}
                    onPlay={() => playTrack(track)}
                    onPurchase={() => handlePurchaseTrack(track)}
                    compact
                  />
                </div>
                <span className="text-xs text-muted-foreground">{playHistory.find(h => h.track_id === track.id)?.play_count} plays</span>
              </div>
            ))}
            {historyTracks.length === 0 && <p className="text-muted-foreground text-sm">No play history yet</p>}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {currentTrack && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => playTrack(currentTrack)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                {isPlaying ? <Pause size={18} className="text-primary-foreground" /> : <Play size={18} className="text-primary-foreground ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground">{currentTrack.artist}</p>
              </div>
              {!hasAccess(currentTrack) && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Preview</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-muted rounded-full cursor-pointer" onClick={seekAudio}>
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-10">{formatTime(hasAccess(currentTrack) ? duration : Math.min(duration, PREVIEW_LIMIT))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Track Row Component
interface TrackRowProps {
  track: Track;
  isPlaying: boolean;
  hasAccess: boolean;
  isSubscribed: boolean;
  onPlay: () => void;
  onPurchase: () => void;
  showDate?: boolean;
  compact?: boolean;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string) => void;
}

const TrackRow: React.FC<TrackRowProps> = ({ track, isPlaying, hasAccess, isSubscribed, onPlay, onPurchase, showDate, compact, playlists, onAddToPlaylist }) => {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-1' : 'p-3 bg-muted/20 rounded-lg'}`}>
      <button onClick={onPlay} className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center`}>
        {track.cover_image_url ? (
          <img src={track.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          isPlaying ? <Pause size={compact ? 14 : 18} className="text-primary" /> : <Play size={compact ? 14 : 18} className="text-primary" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>{track.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{track.artist}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock size={10} />{formatDuration(track.duration_seconds)}</span>
          {track.bpm && <span>• {track.bpm} BPM</span>}
          {showDate && track.release_date && <span>• {new Date(track.release_date).toLocaleDateString()}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasAccess ? (
          <span className="text-xs text-green-500 flex items-center gap-1"><Sparkles size={12} />Included</span>
        ) : isSubscribed ? (
          <span className="text-xs text-green-500">Included</span>
        ) : (
          <Button size="sm" variant="outline" onClick={onPurchase}>€{track.price_usd}</Button>
        )}
        
        {playlists && playlists.length > 0 && (
          <div className="relative">
            <Button size="icon" variant="ghost" onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}><Plus size={14} /></Button>
            {showPlaylistMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg p-2 z-50 min-w-32">
                {playlists.map(pl => (
                  <button key={pl.id} onClick={() => { onAddToPlaylist?.(pl.id); setShowPlaylistMenu(false); }} className="block w-full text-left px-2 py-1 text-sm hover:bg-muted rounded">{pl.name}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Music;
