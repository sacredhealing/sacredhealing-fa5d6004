import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, Users, Loader2 } from 'lucide-react';
import { useLiveStream, LiveStream } from '@/hooks/useLiveStream';
import LiveStreamViewer from './LiveStreamViewer';
import { formatDistanceToNow } from 'date-fns';

const LiveStreamList = () => {
  const { activeStreams, isLoading } = useLiveStream();
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activeStreams.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Live Now
        </h3>
        
        {activeStreams.map((stream) => (
          <Card 
            key={stream.id} 
            className="bg-gradient-to-r from-red-500/10 to-primary/10 border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer"
            onClick={() => setSelectedStream(stream)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-red-500">
                    <AvatarImage src={stream.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {stream.profile?.full_name?.charAt(0) || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    LIVE
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{stream.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {stream.profile?.full_name || 'Admin'} • Started {formatDistanceToNow(new Date(stream.started_at), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{stream.viewer_count}</span>
                  </div>
                  <Button size="sm" className="bg-red-500 hover:bg-red-600">
                    <Video className="h-4 w-4 mr-1" />
                    Watch
                  </Button>
                </div>
              </div>
              
              {stream.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {stream.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStream && (
        <LiveStreamViewer
          stream={selectedStream}
          isOpen={!!selectedStream}
          onClose={() => setSelectedStream(null)}
        />
      )}
    </>
  );
};

export default LiveStreamList;
