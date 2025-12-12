import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStreamMessages, LiveStream } from '@/hooks/useLiveStream';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AgoraRTC, { IAgoraRTCClient, IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';

interface LiveStreamViewerProps {
  stream: LiveStream;
  isOpen: boolean;
  onClose: () => void;
}

const LiveStreamViewer = ({ stream, isOpen, onClose }: LiveStreamViewerProps) => {
  const { user } = useAuth();
  const { messages, sendMessage } = useStreamMessages(stream.id);
  const [viewerCount, setViewerCount] = useState(stream.viewer_count);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const remoteVideoRef = useRef<IRemoteVideoTrack | null>(null);
  const remoteAudioRef = useRef<IRemoteAudioTrack | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeViewer();
    }
    return () => {
      cleanup();
    };
  }, [isOpen, stream.channel_name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeViewer = async () => {
    try {
      setIsConnecting(true);

      // Get Agora token
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: {
          channelName: stream.channel_name,
          role: 'subscriber',
          uid: Math.floor(Math.random() * 100000)
        }
      });

      if (error || !data?.token) {
        throw new Error(error?.message || 'Failed to get token');
      }

      // Initialize Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Set role to audience
      await client.setClientRole('audience');

      // Handle remote user publishing
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          remoteVideoRef.current = user.videoTrack || null;
          if (videoRef.current && user.videoTrack) {
            user.videoTrack.play(videoRef.current);
          }
        }
        if (mediaType === 'audio') {
          remoteAudioRef.current = user.audioTrack || null;
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', async (user, mediaType) => {
        if (mediaType === 'video') {
          remoteVideoRef.current = null;
        }
        if (mediaType === 'audio') {
          remoteAudioRef.current = null;
        }
      });

      // Track viewer count
      client.on('user-joined', () => {
        setViewerCount(prev => prev + 1);
      });
      client.on('user-left', () => {
        setViewerCount(prev => Math.max(0, prev - 1));
      });

      // Join channel
      await client.join(data.appId, stream.channel_name, data.token, data.uid);

      setIsConnected(true);
      setIsConnecting(false);

    } catch (error) {
      console.error('Error joining stream:', error);
      toast.error('Failed to join stream');
      setIsConnecting(false);
    }
  };

  const cleanup = async () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.stop();
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.stop();
    }
    if (clientRef.current) {
      await clientRef.current.leave();
    }
  };

  const handleClose = async () => {
    await cleanup();
    onClose();
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error('Please login to chat');
      return;
    }
    if (newMessage.trim()) {
      await sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">LIVE</span>
            {stream.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {isConnecting ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Joining stream...</p>
                  </div>
                </div>
              ) : !isConnected ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white">Stream unavailable</p>
                </div>
              ) : (
                <div ref={videoRef} className="w-full h-full" />
              )}
              
              {/* Viewer count */}
              {isConnected && (
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {viewerCount}
                  </div>
                </div>
              )}
            </div>

            {/* Stream info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-foreground">{stream.title}</h3>
              {stream.description && (
                <p className="text-sm text-muted-foreground mt-1">{stream.description}</p>
              )}
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
              {user ? (
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
              ) : (
                <p className="text-sm text-muted-foreground text-center mt-2 pt-2 border-t border-border">
                  Login to join the chat
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveStreamViewer;
