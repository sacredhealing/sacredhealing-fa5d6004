import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Plus, Clock, Music2, Users, Sparkles, Moon, Zap, Leaf, Brain, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { useTranslation } from '@/hooks/useTranslation';
import { tMusicGenre, tMusicMood, tMusicSpiritualPath } from '@/features/music/musicDisplayI18n';
import { cn } from '@/lib/utils';

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
  const live = isCurrentTrack && isPlaying;
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
    <div
      className={cn(
        // SQI-2050 sovereign glass (visual only)
        'group cursor-pointer rounded-[28px] border p-3 transition-colors',
        live
          ? 'tc-sqi-active'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-[#D4AF37]/20 hover:bg-white/[0.04]',
      )}
      onClick={handleNavigateToDetail}
    >
      <div className="flex items-start gap-3">
        {/* Cover / Play button */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {track.cover_image_url ? (
            <img src={track.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={20} className="text-white/30" />
            </div>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause size={22} className="text-[#D4AF37]" />
            ) : (
              <Play size={22} className="ml-0.5 text-[#D4AF37]" />
            )}
          </button>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className={cn('truncate text-sm font-black tracking-[-0.02em] text-white/90', live && 'tc-sqi-title')}>{track.title}</p>
          <p className="mb-1 truncate text-xs text-white/35">{track.artist}</p>
          
          {/* Mood & Path badges */}
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {track.mood && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                {track.mood === 'calm' && <Moon size={9} />}
                {track.mood === 'energizing' && <Zap size={9} />}
                {track.mood === 'healing' && <Sparkles size={9} />}
                {track.mood === 'meditative' && <Brain size={9} />}
                {track.mood === 'grounding' && <Leaf size={9} />}
                {tMusicMood(track.mood, t)}
              </span>
            )}
            {track.spiritual_path && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-white/50 capitalize">
                {tMusicSpiritualPath(track.spiritual_path, t)}
              </span>
            )}
            {track.intended_use && (
              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] font-bold text-white/35 capitalize">
                {track.intended_use.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/35">
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {formatDuration(track.duration_seconds)}
            </span>
            {track.bpm && (
              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5">{track.bpm} BPM</span>
            )}
            <span className="rounded-full border border-[#D4AF37]/18 bg-[#D4AF37]/[0.08] px-2 py-0.5 text-[#D4AF37] capitalize">
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
            className={cn(
              'rounded-full border p-1.5 transition',
              isLiked
                ? 'border-red-500/25 bg-red-500/10 text-red-400'
                : 'border-white/[0.06] bg-white/[0.02] text-white/45 hover:border-[#D4AF37]/18 hover:text-[#D4AF37]',
            )}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          {/* Share button */}
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/music/track/${track.id}`); }}
            className="rounded-full border border-white/[0.06] bg-white/[0.02] p-1.5 text-white/45 transition hover:border-[#D4AF37]/18 hover:text-[#D4AF37]"
          >
            <Share2 size={14} />
          </button>

          {/* Price / Access */}
          {canPlay || isSubscribed ? (
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#D4AF37]/70">
              {t('music.included', 'Included')}
            </span>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/20"
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
                className="rounded-full border border-white/[0.06] bg-white/[0.02] p-1.5 text-white/45 transition hover:border-[#D4AF37]/18 hover:text-[#D4AF37]"
              >
                <Plus size={14} />
              </button>
              {showPlaylistMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-28 rounded-2xl border border-white/[0.08] bg-[#050505]/95 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur">
                  {playlists.map(pl => (
                    <button 
                      key={pl.id} 
                      onClick={() => {
                        onAddToPlaylist?.(pl.id, track.id);
                        setShowPlaylistMenu(false);
                      }}
                      className="block w-full truncate rounded-xl px-2 py-1 text-left text-xs font-bold text-white/70 transition hover:bg-white/[0.04] hover:text-[#D4AF37]"
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
