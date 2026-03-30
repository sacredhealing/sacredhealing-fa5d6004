import React from 'react';
import { ArrowLeft, BarChart3, Users, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const SPOTIFY_SHOW_ID = "2nhPr6e1a4dhivvIgMcceI";

const Podcast: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 z-10">
        <Link to="/home">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="font-semibold text-foreground">Podcast</h1>
          <p className="text-xs text-muted-foreground">Awaken Your Spiritual Bliss</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center bg-gradient-to-br from-purple/10 to-purple/5 border-purple/20">
            <BarChart3 className="w-8 h-8 text-purple mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">280,545</p>
            <p className="text-xs text-muted-foreground">Streams & Downloads</p>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
            <Users className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">1,107</p>
            <p className="text-xs text-muted-foreground">Spotify Followers</p>
          </Card>
        </div>

        {/* Podcast Info */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Headphones className="w-6 h-6 text-turquoise" />
            <h2 className="font-semibold text-foreground">All Episodes</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Join Laila & Adam for deep spiritual conversations, guided meditations, and transformative teachings. Play episodes directly below or scroll to see more.
          </p>
          
          {/* Spotify Embed - Plays audio inside the app with scrollable episode list */}
          <iframe
            src={`https://open.spotify.com/embed/show/${SPOTIFY_SHOW_ID}?utm_source=generator&theme=0`}
            width="100%"
            height="500"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
            title="Siddha Quantum Nexus Podcast"
          />
        </Card>

        {/* Open in Spotify */}
        <a 
          href={`https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <Button className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white">
            Open Full Show in Spotify
          </Button>
        </a>
      </div>
    </div>
  );
};

export default Podcast;
