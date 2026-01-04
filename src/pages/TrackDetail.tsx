import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Heart, Share2, Plus, Clock, Users, Music2, Sparkles, Moon, Zap, Leaf, Brain, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { TrackCard } from '@/components/music/TrackCard';
import { MusicShareCard } from '@/components/music/MusicShareCard';
import { Loader2 } from 'lucide-react';

const TrackDetail: React.FC = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, hasAccess, likedIds, toggleLike, isSubscribed } = useMusicPlayer();
  
  const [track, setTrack] = useState<Track | null>(null);
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (trackId) {
      fetchTrack();
    }
  }, [trackId]);

  const fetchTrack = async () => {
    setIsLoading(true);
    const { data: trackData } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('id', trackId)
      .single();
    
    if (trackData) {
      setTrack(trackData as Track);
      fetchRelatedTracks(trackData as Track);
    }
    setIsLoading(false);
  };

  const fetchRelatedTracks = async (currentTrack: Track) => {
    // Fetch tracks with same mood, path, or genre
    const { data } = await supabase
      .from('music_tracks')
      .select('*')
      .neq('id', currentTrack.id)
      .or(`mood.eq.${currentTrack.mood},spiritual_path.eq.${currentTrack.spiritual_path},genre.eq.${currentTrack.genre}`)
      .limit(6);
    
    if (data) {
      setRelatedTracks(data as Track[]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'calm': return <Moon size={14} />;
      case 'energizing': return <Zap size={14} />;
      case 'healing': return <Sparkles size={14} />;
      case 'meditative': return <Brain size={14} />;
      case 'grounding': return <Leaf size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Music2 size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Track not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/music')}>
          Back to Music
        </Button>
      </div>
    );
  }

  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedIds.includes(track.id);
  const canPlay = hasAccess(track);

  return (
    <div className="min-h-screen px-4 pt-6 pb-40">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/music')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-heading font-semibold text-foreground">Track Details</h1>
      </header>

      {/* Main Track Section */}
      <div className="mb-8">
        {/* Cover Art */}
        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden mb-6 shadow-2xl">
          {track.cover_image_url ? (
            <img src={track.cover_image_url} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <Music2 size={64} className="text-muted-foreground" />
            </div>
          )}
          
          {/* Play button overlay */}
          <button
            onClick={() => playTrack(track, [track])}
            className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
              {isCurrentTrack && isPlaying ? (
                <Pause size={36} className="text-primary-foreground" />
              ) : (
                <Play size={36} className="text-primary-foreground ml-1" />
              )}
            </div>
          </button>
        </div>

        {/* Track Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">{track.title}</h2>
          <p className="text-muted-foreground">{track.artist}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {track.mood && (
            <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 px-3 py-1.5 rounded-full text-sm font-medium">
              {getMoodIcon(track.mood)}
              {track.mood.charAt(0).toUpperCase() + track.mood.slice(1)}
            </span>
          )}
          {track.spiritual_path && (
            <span className="bg-purple-500/15 text-purple-400 px-3 py-1.5 rounded-full text-sm font-medium capitalize">
              {track.spiritual_path.replace('_', ' ')}
            </span>
          )}
          <span className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-medium capitalize">
            {track.genre.replace('-', ' ')}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {formatDuration(track.duration_seconds)}
          </span>
          {track.bpm && <span>{track.bpm} BPM</span>}
          <span className="flex items-center gap-1">
            <Users size={16} />
            {track.play_count} plays
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Button
            size="lg"
            onClick={() => playTrack(track, [track])}
            className="gap-2"
          >
            {isCurrentTrack && isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isCurrentTrack && isPlaying ? 'Playing' : 'Play Now'}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => toggleLike(track.id)}
            className={isLiked ? 'text-red-500 border-red-500/50' : ''}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowShareCard(true)}
          >
            <Share2 size={20} />
          </Button>
        </div>

        {/* Price/Access */}
        {!canPlay && !isSubscribed && (
          <Card className="bg-muted/30 border-border/50 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Purchase this track for</p>
            <p className="text-2xl font-bold text-primary mb-3">€{track.price_usd}</p>
            <Button className="w-full" onClick={() => navigate('/music')}>
              Purchase Track
            </Button>
          </Card>
        )}
      </div>

      {/* Affirmation Section */}
      {track.affirmation && (
        <Card className="bg-gradient-to-br from-purple-900/40 via-indigo-800/30 to-violet-900/40 border-purple-500/20 p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-2 left-2 opacity-20">
            <Quote className="w-12 h-12 text-purple-300" />
          </div>
          <div className="relative">
            <h3 className="text-sm font-medium text-purple-200 mb-3">Associated Affirmation</h3>
            <blockquote className="text-lg text-white font-medium italic leading-relaxed">
              "{track.affirmation}"
            </blockquote>
          </div>
        </Card>
      )}

      {/* Creator Notes */}
      {track.creator_notes && (
        <Card className="bg-muted/20 border-border/50 p-5 mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Creator Notes</h3>
          <p className="text-foreground leading-relaxed">{track.creator_notes}</p>
        </Card>
      )}

      {/* Intended Use */}
      {track.intended_use && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Best For</h3>
          <span className="inline-block bg-muted/30 px-4 py-2 rounded-lg text-sm capitalize">
            {track.intended_use.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Related Tracks */}
      {relatedTracks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">You Might Also Like</h3>
          <div className="space-y-2">
            {relatedTracks.slice(0, 4).map(related => (
              <TrackCard
                key={related.id}
                track={related}
                allTracks={relatedTracks}
              />
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareCard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowShareCard(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm">
            <MusicShareCard
              track={track}
              onClose={() => setShowShareCard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackDetail;
