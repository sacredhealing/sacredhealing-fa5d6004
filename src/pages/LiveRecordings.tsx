import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Radio, Play, Calendar, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface LiveRecording {
  id: string;
  content: string;
  video_url: string;
  image_url: string | null;
  live_recording_title: string | null;
  live_recording_description: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const LiveRecordings = () => {
  const { t } = useTranslation();
  const [recordings, setRecordings] = useState<LiveRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<LiveRecording | null>(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('is_live_recording', true)
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recordings:', error);
        setIsLoading(false);
        return;
      }

      // Fetch profiles
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const recordingsWithProfiles = data?.map(recording => ({
        ...recording,
        profile: profiles?.find(p => p.user_id === recording.user_id)
      })) || [];

      setRecordings(recordingsWithProfiles);
      setIsLoading(false);
    };

    fetchRecordings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/20 rounded-full p-2">
          <Radio className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Recordings</h1>
          <p className="text-muted-foreground text-sm">Watch past live sessions anytime</p>
        </div>
      </div>

      {/* Featured Video Player */}
      {selectedRecording && (
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-0">
            <video
              src={selectedRecording.video_url}
              controls
              autoPlay
              className="w-full rounded-t-lg aspect-video"
              poster={selectedRecording.image_url || undefined}
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {selectedRecording.live_recording_title || 'Live Recording'}
              </h2>
              {selectedRecording.live_recording_description && (
                <p className="text-muted-foreground mb-3">
                  {selectedRecording.live_recording_description}
                </p>
              )}
              <p className="text-foreground whitespace-pre-wrap">
                {selectedRecording.content}
              </p>
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(selectedRecording.created_at), 'PPP')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recordings Grid */}
      {recordings.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No live recordings yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for new content
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recordings.map((recording) => (
            <Card 
              key={recording.id} 
              className={`bg-card border-border cursor-pointer hover:border-primary/50 transition-colors ${
                selectedRecording?.id === recording.id ? 'border-primary' : ''
              }`}
              onClick={() => setSelectedRecording(recording)}
            >
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                  {recording.image_url ? (
                    <img 
                      src={recording.image_url} 
                      alt={recording.live_recording_title || 'Recording'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Radio className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-primary rounded-full p-3">
                      <Play className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    Live Recording
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                    {recording.live_recording_title || 'Live Recording'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={recording.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {recording.profile?.full_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {recording.profile?.full_name || 'Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveRecordings;
