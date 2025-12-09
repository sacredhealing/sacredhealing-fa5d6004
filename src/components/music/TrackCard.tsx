import React, { useState } from 'react';
import { Play, Pause, Heart, Plus, Clock, Music2, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';

interface Playlist {
  id: string;
  name: string;
}

interface TrackCardProps {
  track: Track;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string, trackId: string) => void;
  onPurchase?: (track: Track) => void;
  allTracks?: Track[];
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  playlists,
  onAddToPlaylist,
  onPurchase,
  allTracks,
}) => {
  const { currentTrack, isPlaying, playTrack, hasAccess, likedIds, toggleLike, isSubscribed } = useMusicPlayer();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedIds.includes(track.id);
  const canPlay = hasAccess(track);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    playTrack(track, allTracks || [track]);
  };

  return (
    <div className="group bg-muted/20 hover:bg-muted/40 rounded-xl p-3 transition-colors">
      <div className="flex items-start gap-3">
        {/* Cover / Play button */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
          {track.cover_image_url ? (
            <img src={track.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={20} className="text-muted-foreground" />
            </div>
          )}
          <button 
            onClick={handlePlay}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause size={22} className="text-white" />
            ) : (
              <Play size={22} className="text-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate mb-2">{track.artist}</p>
          
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {formatDuration(track.duration_seconds)}
            </span>
            {track.bpm && (
              <span className="bg-muted/50 px-1.5 py-0.5 rounded">{track.bpm} BPM</span>
            )}
            <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded capitalize">{track.genre.replace('-', ' ')}</span>
            <span className="flex items-center gap-0.5">
              <Users size={10} />
              {track.play_count}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* Like button */}
          <button 
            onClick={() => toggleLike(track.id)}
            className={`p-1.5 rounded-full hover:bg-muted/50 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          {/* Price / Access */}
          {canPlay || isSubscribed ? (
            <span className="text-[10px] text-green-500 font-medium">Included</span>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 text-xs px-2"
              onClick={() => onPurchase?.(track)}
            >
              €{track.price_usd}
            </Button>
          )}

          {/* Add to playlist */}
          {playlists && playlists.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground"
              >
                <Plus size={14} />
              </button>
              {showPlaylistMenu && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg p-1 z-50 min-w-28 shadow-lg">
                  {playlists.map(pl => (
                    <button 
                      key={pl.id} 
                      onClick={() => {
                        onAddToPlaylist?.(pl.id, track.id);
                        setShowPlaylistMenu(false);
                      }}
                      className="block w-full text-left px-2 py-1 text-xs hover:bg-muted rounded truncate"
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
