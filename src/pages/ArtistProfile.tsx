import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Music2, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Track } from '@/contexts/MusicPlayerContext';
import { TrackCard } from '@/components/music/TrackCard';
import { useTranslation } from '@/hooks/useTranslation';

interface Artist {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  signature_style: string | null;
  total_plays: number;
  created_at: string;
}

const ArtistProfile: React.FC = () => {
  const { t } = useTranslation();
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (artistId) {
      fetchArtist();
      fetchArtistTracks();
    }
  }, [artistId]);

  const fetchArtist = async () => {
    const { data } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();
    
    if (data) {
      setArtist(data as Artist);
    }
    setIsLoading(false);
  };

  const fetchArtistTracks = async () => {
    const { data } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('artist_id', artistId)
      .order('play_count', { ascending: false });
    
    if (data) {
      setTracks(data as Track[]);
    }
  };

  const signatureTracks = tracks.slice(0, 5);
  const totalPlays = tracks.reduce((sum, t) => sum + t.play_count, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Music2 size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('music.artistPage.notFound', 'Artist not found')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/music')}>
          {t('music.artistPage.backToMusic', 'Back to Music')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-40">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/music')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-heading font-semibold text-foreground">
          {t('music.artistPage.headerTitle', 'Artist')}
        </h1>
      </header>

      {/* Artist Hero */}
      <div className="text-center mb-8">
        {/* Avatar */}
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 shadow-xl border-2 border-primary/30">
          {artist.avatar_url ? (
            <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <Music2 size={48} className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Name */}
        <h2 className="text-2xl font-bold mb-2">{artist.name}</h2>
        
        {/* Signature Style */}
        {artist.signature_style && (
          <span className="inline-block bg-primary/15 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
            {artist.signature_style}
          </span>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Music2 size={16} />
            {t('music.artistPage.trackCountStats', {
              defaultValue: '{{count}} tracks',
              count: String(tracks.length),
            })}
          </span>
          <span className="flex items-center gap-1">
            <Users size={16} />
            {t('music.artistPage.playCountStats', {
              defaultValue: '{{count}} plays',
              count: totalPlays.toLocaleString(),
            })}
          </span>
        </div>

        {/* Website */}
        {artist.website && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(artist.website!, '_blank')}
            className="gap-2"
          >
            <Globe size={16} />
            {t('music.artistPage.visitWebsite', 'Visit Website')}
          </Button>
        )}
      </div>

      {/* Bio */}
      {artist.bio && (
        <Card className="bg-muted/20 border-border/50 p-5 mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t('music.artistPage.about', 'About')}
          </h3>
          <p className="text-foreground leading-relaxed">{artist.bio}</p>
        </Card>
      )}

      {/* Social Links */}
      {artist.social_links && Object.keys(artist.social_links).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(artist.social_links).map(([platform, url]) => (
            <Button
              key={platform}
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank')}
              className="capitalize"
            >
              {platform}
            </Button>
          ))}
        </div>
      )}

      {/* Signature Tracks */}
      {signatureTracks.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {t('music.artistPage.signatureTracks', 'Signature Tracks')}
          </h3>
          <div className="space-y-2">
            {signatureTracks.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                allTracks={signatureTracks}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full Discography */}
      {tracks.length > 5 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t('music.artistPage.allTracksCount', {
              defaultValue: 'All Tracks ({{count}})',
              count: String(tracks.length),
            })}
          </h3>
          <div className="space-y-2">
            {tracks.slice(5).map(track => (
              <TrackCard
                key={track.id}
                track={track}
                allTracks={tracks}
              />
            ))}
          </div>
        </div>
      )}

      {tracks.length === 0 && (
        <Card className="bg-muted/20 border-border/50 p-8 text-center">
          <Music2 size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            {t('music.artistPage.noTracksYet', 'No tracks available yet')}
          </p>
        </Card>
      )}
    </div>
  );
};

export default ArtistProfile;
