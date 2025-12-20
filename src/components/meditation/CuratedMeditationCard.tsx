import React from 'react';
import { Play, Clock, Sparkles } from 'lucide-react';

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

interface CuratedMeditationCardProps {
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

export const CuratedMeditationCard: React.FC<CuratedMeditationCardProps> = ({
  playlist,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 hover:scale-[1.02] transition-all duration-300 text-left w-full"
    >
      {/* Cover Image */}
      <div className="aspect-[4/3] relative">
        {playlist.cover_image_url ? (
          <img
            src={playlist.cover_image_url}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
            <Sparkles size={32} className="text-primary/50" />
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-purple">
            <Play size={24} className="text-primary-foreground ml-1" />
          </div>
        </div>

        {/* Mood badge */}
        {(playlist.mood || playlist.theme) && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm">
            <span className="text-xs font-medium text-white capitalize">
              {playlist.mood || playlist.theme}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground">{playlist.title}</h3>
        
        {playlist.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {playlist.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(playlist.total_duration)}
          </span>
          <span>•</span>
          <span>{playlist.track_count} sessions</span>
        </div>
      </div>
    </button>
  );
};
