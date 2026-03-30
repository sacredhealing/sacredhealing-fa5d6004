import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface Episode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audioUrl: string;
  spotifyUrl: string;
  imageUrl: string;
}

const PodcastEpisodeList: React.FC = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('fetch-podcast-episodes');
      
      if (error) throw error;
      
      if (data?.success && data?.episodes) {
        setEpisodes(data.episodes);
      } else {
        setError(data?.error || 'Failed to load episodes');
      }
    } catch (err) {
      console.error('Error fetching episodes:', err);
      setError('Failed to load podcast episodes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    // If already in HH:MM:SS or MM:SS format
    if (duration.includes(':')) return duration;
    // If in seconds
    const seconds = parseInt(duration);
    if (isNaN(seconds)) return duration;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openInSpotify = (episode: Episode) => {
    window.open(episode.spotifyUrl || 'https://open.spotify.com/show/2nhPr6e1a4dhivvIgMcceI', '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchEpisodes} variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  if (episodes.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No episodes found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        {episodes.length} episodes available
      </p>
      
      {episodes.map((episode) => (
        <Card 
          key={episode.id} 
          className="p-4 hover:bg-accent/5 transition-colors cursor-pointer"
          onClick={() => openInSpotify(episode)}
        >
          <div className="flex gap-4">
            {/* Episode Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-purple/20">
              {episode.imageUrl ? (
                <img 
                  src={episode.imageUrl} 
                  alt={episode.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-purple" />
                </div>
              )}
            </div>
            
            {/* Episode Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground line-clamp-2 text-sm">
                {episode.title}
              </h3>
              
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {episode.pubDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(episode.pubDate)}
                  </span>
                )}
                {episode.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(episode.duration)}
                  </span>
                )}
              </div>
              
              {episode.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {episode.description}
                </p>
              )}
            </div>
            
            {/* Play Button */}
            <Button 
              size="icon" 
              variant="ghost"
              className="flex-shrink-0 self-center text-[#1DB954] hover:text-[#1DB954] hover:bg-[#1DB954]/10"
              onClick={(e) => {
                e.stopPropagation();
                openInSpotify(episode);
              }}
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PodcastEpisodeList;
