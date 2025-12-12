import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, VideoOff, Mic, MicOff, Users, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLiveStream, useStreamMessages, LiveStream } from '@/hooks/useLiveStream';
import { toast } from 'sonner';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface LiveBroadcasterProps {
  stream: LiveStream;
  onEnd: () => void;
}

const LiveBroadcaster = ({ stream, onEnd }: LiveBroadcasterProps) => {
  const { endStream } = useLiveStream();
  const { messages, sendMessage } = useStreamMessages(stream.id);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeStream();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeStream = async () => {
    try {
      // Get Agora token
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: {
          channelName: stream.channel_name,
          role: 'publisher',
          uid: 0
        }
      });

      if (error || !data?.token) {
        throw new Error(error?.message || 'Failed to get token');
      }

      // Initialize Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Set role to host
      await client.setClientRole('host');

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      audioTrackRef.current = audioTrack;
      videoTrackRef.current = videoTrack;

      // Display local video
      if (videoRef.current && videoTrack) {
        videoTrack.play(videoRef.current);
      }

      // Join channel
      await client.join(data.appId, stream.channel_name, data.token, data.uid);

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      // Track viewer count
      client.on('user-joined', () => {
        setViewerCount(prev => prev + 1);
      });
      client.on('user-left', () => {
        setViewerCount(prev => Math.max(0, prev - 1));
      });

      setIsConnected(true);
      setIsConnecting(false);
      toast.success('You are now live!');

    } catch (error) {
      console.error('Error initializing stream:', error);
      toast.error('Failed to start stream');
      setIsConnecting(false);
    }
  };

  const cleanup = async () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current.close();
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current.close();
    }
    if (clientRef.current) {
      await clientRef.current.leave();
    }
  };

  const toggleVideo = async () => {
    if (videoTrackRef.current) {
      await videoTrackRef.current.setEnabled(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = async () => {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  };

  const handleEndStream = async () => {
    await cleanup();
    await endStream(stream.id);
    onEnd();
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      await sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Video Preview */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {isConnecting ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2" />
                <p>Connecting...</p>
              </div>
            </div>
          ) : (
            <div ref={videoRef} className="w-full h-full" />
          )}
          
          {/* Live indicator */}
          {isConnected && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Users className="h-4 w-4" />
                {viewerCount}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isVideoOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleVideo}
            disabled={!isConnected}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button
            variant={isAudioOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleAudio}
            disabled={!isConnected}
          >
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="destructive"
            onClick={handleEndStream}
            className="px-6"
          >
            <X className="h-4 w-4 mr-2" />
            End Stream
          </Button>
        </div>
      </div>

      {/* Chat */}
      <Card className="bg-card border-border h-[400px] lg:h-auto flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-foreground mb-2">Live Chat</h3>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={msg.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {msg.profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary">
                      {msg.profile?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-foreground break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="flex gap-2 mt-2 pt-2 border-t border-border">
            <Input
              placeholder="Send a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveBroadcaster;
