import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music2, ShoppingCart, Download, Heart, Clock, Sparkles, Lock, Check, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  price: number;
  shcReward: number;
  cover: string;
  previewUrl?: string;
  owned: boolean;
  liked: boolean;
}

const mockTracks: Track[] = [
  { id: 1, title: 'Healing Frequencies', artist: 'Sacred Healing', duration: '4:32', price: 50, shcReward: 10, cover: '🎵', owned: true, liked: true },
  { id: 2, title: 'Chakra Alignment', artist: 'Sacred Healing', duration: '5:15', price: 75, shcReward: 15, cover: '🧘', owned: false, liked: false },
  { id: 3, title: 'Deep Meditation Beats', artist: 'Sacred Healing', duration: '6:00', price: 100, shcReward: 20, cover: '🌙', owned: true, liked: true },
  { id: 4, title: 'Crystal Bowl Symphony', artist: 'Sacred Healing', duration: '3:45', price: 60, shcReward: 12, cover: '💎', owned: false, liked: false },
  { id: 5, title: 'Ocean of Calm', artist: 'Sacred Healing', duration: '5:30', price: 80, shcReward: 16, cover: '🌊', owned: false, liked: true },
  { id: 6, title: 'Forest Whispers', artist: 'Sacred Healing', duration: '4:20', price: 65, shcReward: 13, cover: '🌲', owned: false, liked: false },
  { id: 7, title: 'Sunrise Mantra', artist: 'Sacred Healing', duration: '4:00', price: 55, shcReward: 11, cover: '🌅', owned: true, liked: false },
  { id: 8, title: 'Inner Peace Journey', artist: 'Sacred Healing', duration: '7:15', price: 120, shcReward: 25, cover: '✨', owned: false, liked: false },
];

const Music: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(mockTracks);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'liked'>('all');
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const ownedTracks = tracks.filter(t => t.owned);
  const likedTracks = tracks.filter(t => t.liked);

  const displayTracks = activeTab === 'all' ? tracks : activeTab === 'owned' ? ownedTracks : likedTracks;

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const maxProgress = currentTrack.owned ? 100 : 30; // 30% = 30 seconds preview
          if (prev >= maxProgress) {
            setIsPlaying(false);
            if (!currentTrack.owned) {
              toast({
                title: "Preview ended",
                description: "Purchase this track to listen to the full version!",
              });
            }
            return prev;
          }
          return prev + 1;
        });
      }, 300); // Simulated playback speed
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, currentTrack]);

  const purchaseTrack = (track: Track) => {
    setTracks(prev => prev.map(t => 
      t.id === track.id ? { ...t, owned: true } : t
    ));
    if (currentTrack?.id === track.id) {
      setCurrentTrack({ ...track, owned: true });
    }
    toast({
      title: "Purchase successful! 🎉",
      description: `You earned +${track.shcReward} SHC! Enjoy "${track.title}"`,
    });
  };

  const toggleLike = (trackId: number) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, liked: !t.liked } : t
    ));
  };

  const downloadTrack = (track: Track) => {
    toast({
      title: "Download started",
      description: `"${track.title}" is being downloaded...`,
    });
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-32">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <Music2 className="text-primary" />
          Sacred Music
        </h1>
        <p className="text-muted-foreground mt-1">Healing beats & spiritual sounds</p>
      </header>

      {/* Stats */}
      <div className="flex gap-4 mb-6 animate-slide-up">
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-primary">{ownedTracks.length}</p>
          <p className="text-xs text-muted-foreground">Owned</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-secondary">{likedTracks.length}</p>
          <p className="text-xs text-muted-foreground">Liked</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-accent">{tracks.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <Music2 size={16} />
          All
        </button>
        <button
          onClick={() => setActiveTab('owned')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'owned'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <ListMusic size={16} />
          My Music
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'liked'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          <Heart size={16} />
          Liked
        </button>
      </div>

      {/* Track List */}
      <div className="space-y-3 animate-fade-in">
        {displayTracks.map((track, index) => (
          <div
            key={track.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              currentTrack?.id === track.id
                ? 'bg-primary/10 border-primary/50'
                : 'bg-gradient-card border-border/50'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Cover & Play */}
            <button
              onClick={() => playTrack(track)}
              className="relative w-14 h-14 rounded-lg bg-gradient-spiritual flex items-center justify-center text-2xl shrink-0"
            >
              <span>{track.cover}</span>
              <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="text-primary" size={20} />
                ) : (
                  <Play className="text-primary" size={20} />
                )}
              </div>
              {!track.owned && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                  <Lock size={10} className="text-accent-foreground" />
                </div>
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground">{track.artist}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {track.duration}
                </span>
                {!track.owned && (
                  <span className="text-xs text-accent flex items-center gap-1">
                    <Sparkles size={10} />
                    +{track.shcReward} SHC
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleLike(track.id)}
                className={`p-2 rounded-full transition-colors ${
                  track.liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                }`}
              >
                <Heart size={18} fill={track.liked ? 'currentColor' : 'none'} />
              </button>
              
              {track.owned ? (
                <Button variant="ghost" size="sm" onClick={() => downloadTrack(track)}>
                  <Download size={16} />
                </Button>
              ) : (
                <Button variant="gold" size="sm" onClick={() => purchaseTrack(track)}>
                  <ShoppingCart size={14} />
                  {track.price}
                </Button>
              )}
            </div>
          </div>
        ))}

        {displayTracks.length === 0 && (
          <div className="text-center py-12">
            <Music2 className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground">
              {activeTab === 'owned' ? "You haven't purchased any tracks yet" : "No liked tracks yet"}
            </p>
          </div>
        )}
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 animate-slide-up">
          <div className="bg-card/95 backdrop-blur-lg rounded-2xl border border-border/50 p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-spiritual flex items-center justify-center text-xl">
                {currentTrack.cover}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground">
                  {currentTrack.owned ? 'Full Track' : '30s Preview'}
                </p>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="text-primary-foreground" size={20} />
                ) : (
                  <Play className="text-primary-foreground" size={20} />
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Slider
                value={[progress]}
                max={currentTrack.owned ? 100 : 30}
                step={1}
                className="flex-1"
                onValueChange={(val) => setProgress(val[0])}
              />
              {!currentTrack.owned && (
                <Button variant="gold" size="sm" onClick={() => purchaseTrack(currentTrack)}>
                  Buy {currentTrack.price} SHC
                </Button>
              )}
            </div>
            
            {!currentTrack.owned && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                🔒 Purchase to unlock full track & earn +{currentTrack.shcReward} SHC
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Music;
