import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Plus, Clock, Music2, Users, Sparkles, Moon, Zap, Leaf, Brain, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { useTranslation } from '@/hooks/useTranslation';
import { tMusicGenre, tMusicMood, tMusicSpiritualPath } from '@/features/music/musicDisplayI18n';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleNavigateToDetail = () => {
    navigate(`/music/track/${track.id}`);
  };

  return (
    <div className="group bg-muted/20 hover:bg-muted/40 rounded-xl p-3 transition-colors cursor-pointer" onClick={handleNavigateToDetail}>
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
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
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
          <p className="text-xs text-muted-foreground truncate mb-1">{track.artist}</p>
          
          {/* Mood & Path badges */}
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {track.mood && (
              <span className="inline-flex items-center gap-0.5 bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
                {track.mood === 'calm' && <Moon size={9} />}
                {track.mood === 'energizing' && <Zap size={9} />}
                {track.mood === 'healing' && <Sparkles size={9} />}
                {track.mood === 'meditative' && <Brain size={9} />}
                {track.mood === 'grounding' && <Leaf size={9} />}
                {tMusicMood(track.mood, t as any)}
              </span>
            )}
            {track.spiritual_path && (
              <span className="bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize">
                {tMusicSpiritualPath(track.spiritual_path, t)}
              </span>
            )}
            {track.intended_use && (
              <span className="bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[10px] capitalize">
                {track.intended_use.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {formatDuration(track.duration_seconds)}
            </span>
            {track.bpm && (
              <span className="bg-muted/50 px-1.5 py-0.5 rounded">{track.bpm} BPM</span>
            )}
            <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded capitalize">
              {tMusicGenre(track.genre, t)}
            </span>
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
            onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
            className={`p-1.5 rounded-full hover:bg-muted/50 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          {/* Share button */}
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/music/track/${track.id}`); }}
            className="p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground"
          >
            <Share2 size={14} />
          </button>

          {/* Price / Access */}
          {canPlay || isSubscribed ? (
            <span className="text-[10px] text-green-500 font-medium">
              {t('music.included', 'Included')}
            </span>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 text-xs px-2"
              onClick={(e) => { e.stopPropagation(); onPurchase?.(track); }}
            >
              €{track.price_usd}
            </Button>
          )}

          {/* Add to playlist */}
          {playlists && playlists.length > 0 && (
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(!showPlaylistMenu); }}
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
