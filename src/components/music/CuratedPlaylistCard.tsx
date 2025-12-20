import React from 'react';
import { Play, Clock, Music2 } from 'lucide-react';

interface CuratedPlaylist {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  category: string;
  mood: string | null;
  theme: string | null;
  duration_range: string | null;
  track_count: number;
  total_duration: number;
  total_plays: number;
}

interface CuratedPlaylistCardProps {
  playlist: CuratedPlaylist;
  onClick: () => void;
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

const formatPlayCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M plays`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K plays`;
  }
  return `${count} plays`;
};

export const CuratedPlaylistCard: React.FC<CuratedPlaylistCardProps> = ({
  playlist,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] text-left w-full"
    >
      {/* Cover Image */}
      <div className="aspect-square relative">
        {playlist.cover_image_url ? (
          <img
            src={playlist.cover_image_url}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music2 size={32} className="text-muted-foreground" />
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Play size={20} className="text-primary-foreground ml-0.5" />
          </div>
        </div>

        {/* Mood/Theme badge */}
        {(playlist.mood || playlist.theme) && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full backdrop-blur-sm">
            <span className="text-xs text-white capitalize">
              {playlist.mood || playlist.theme}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground truncate">{playlist.title}</h3>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(playlist.total_duration)}
          </span>
          <span>•</span>
          <span>{playlist.track_count} tracks</span>
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {formatPlayCount(playlist.total_plays)}
        </p>
      </div>
    </button>
  );
};
