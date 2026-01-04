import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music2, TrendingUp, DollarSign, Users, PlayCircle, Heart, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TrackStats {
  id: string;
  title: string;
  artist: string;
  play_count: number;
  mood?: string;
  spiritual_path?: string;
}

const COLORS = ['#8b5cf6', '#6366f1', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

const AdminMusicAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackStats[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [totalBundles, setTotalBundles] = useState(0);
  const [moodDistribution, setMoodDistribution] = useState<{ name: string; value: number }[]>([]);
  const [pathDistribution, setPathDistribution] = useState<{ name: string; value: number }[]>([]);
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch tracks
      const { data: tracksData } = await supabase
        .from('music_tracks')
        .select('id, title, artist, play_count, mood, spiritual_path')
        .order('play_count', { ascending: false });

      if (tracksData) {
        setTracks(tracksData);
        setTotalTracks(tracksData.length);
        setTotalPlays(tracksData.reduce((sum, t) => sum + t.play_count, 0));

        // Calculate mood distribution
        const moods: Record<string, number> = {};
        const paths: Record<string, number> = {};
        
        tracksData.forEach(t => {
          if (t.mood) moods[t.mood] = (moods[t.mood] || 0) + 1;
          if (t.spiritual_path) paths[t.spiritual_path] = (paths[t.spiritual_path] || 0) + 1;
        });

        setMoodDistribution(Object.entries(moods).map(([name, value]) => ({ name, value })));
        setPathDistribution(Object.entries(paths).map(([name, value]) => ({ name, value })));
      }

      // Fetch album count
      const { count: albumCount } = await supabase
        .from('music_albums')
        .select('*', { count: 'exact', head: true });
      setTotalAlbums(albumCount || 0);

      // Fetch bundle count
      const { count: bundleCount } = await supabase
        .from('music_bundles')
        .select('*', { count: 'exact', head: true });
      setTotalBundles(bundleCount || 0);

      // Fetch active subscriptions
      const { count: subCount } = await supabase
        .from('music_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      setSubscriptionCount(subCount || 0);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const topTracks = tracks.slice(0, 10);
  const chartData = topTracks.map(t => ({
    name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
    plays: t.play_count,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
          <Music2 className="text-primary" /> Music Analytics
        </h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-muted/30 border-border/50 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <PlayCircle size={16} />
            <span className="text-xs">Total Plays</span>
          </div>
          <p className="text-2xl font-bold">{totalPlays.toLocaleString()}</p>
        </Card>

        <Card className="bg-muted/30 border-border/50 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Music2 size={16} />
            <span className="text-xs">Total Tracks</span>
          </div>
          <p className="text-2xl font-bold">{totalTracks}</p>
        </Card>

        <Card className="bg-muted/30 border-border/50 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users size={16} />
            <span className="text-xs">Subscribers</span>
          </div>
          <p className="text-2xl font-bold">{subscriptionCount}</p>
        </Card>

        <Card className="bg-muted/30 border-border/50 p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign size={16} />
            <span className="text-xs">Bundles</span>
          </div>
          <p className="text-2xl font-bold">{totalBundles}</p>
        </Card>
      </div>

      {/* Top Tracks Chart */}
      <Card className="bg-muted/20 border-border/50 p-4 mb-6">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          Top 10 Tracks by Plays
        </h3>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="plays" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">No track data available</p>
        )}
      </Card>

      {/* Mood & Path Distribution */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-muted/20 border-border/50 p-4">
          <h3 className="text-sm font-medium mb-3">Mood Distribution</h3>
          {moodDistribution.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name }) => name}
                  >
                    {moodDistribution.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs text-center py-8">No data</p>
          )}
        </Card>

        <Card className="bg-muted/20 border-border/50 p-4">
          <h3 className="text-sm font-medium mb-3">Path Distribution</h3>
          {pathDistribution.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pathDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name }) => name?.replace('_', ' ')}
                  >
                    {pathDistribution.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs text-center py-8">No data</p>
          )}
        </Card>
      </div>

      {/* Top Tracks List */}
      <Card className="bg-muted/20 border-border/50 p-4">
        <h3 className="text-sm font-medium mb-4">Top Performing Tracks</h3>
        <div className="space-y-2">
          {topTracks.map((track, index) => (
            <div 
              key={track.id} 
              className="flex items-center justify-between p-2 bg-background/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium line-clamp-1">{track.title}</p>
                  <p className="text-xs text-muted-foreground">{track.artist}</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {track.play_count.toLocaleString()} plays
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminMusicAnalytics;
