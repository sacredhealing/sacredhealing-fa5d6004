import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LiveStream {
  id: string;
  admin_user_id: string;
  title: string;
  description: string | null;
  channel_name: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  viewer_count: number;
  recording_url: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface StreamMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useLiveStream = () => {
  const { user } = useAuth();
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveStreams = useCallback(async () => {
    try {
      const { data: streamsData, error: streamsError } = await supabase
        .from('live_streams')
        .select('*')
        .eq('status', 'live')
        .order('started_at', { ascending: false });
      
      if (streamsError) throw streamsError;

      // Fetch profiles for admins
      if (streamsData && streamsData.length > 0) {
        const adminIds = [...new Set(streamsData.map(s => s.admin_user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', adminIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        const streamsWithProfiles: LiveStream[] = streamsData.map(s => ({
          ...s,
          profile: profileMap.get(s.admin_user_id) as LiveStream['profile']
        }));

        setActiveStreams(streamsWithProfiles);
      } else {
        setActiveStreams([]);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveStreams();

    // Subscribe to live stream changes
    const channel = supabase
      .channel('live-streams-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_streams' },
        () => fetchActiveStreams()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveStreams]);

  const createStream = async (title: string, description?: string) => {
    if (!user) return null;

    const channelName = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('live_streams')
      .insert({
        admin_user_id: user.id,
        title,
        description,
        channel_name: channelName,
        status: 'live'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stream:', error);
      toast.error('Failed to create stream');
      return null;
    }

    toast.success('Stream created!');
    return data;
  };

  const endStream = async (streamId: string) => {
    const { error } = await supabase
      .from('live_streams')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', streamId);

    if (error) {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
      return false;
    }

    toast.success('Stream ended');
    return true;
  };

  const updateViewerCount = async (streamId: string, count: number) => {
    await supabase
      .from('live_streams')
      .update({ viewer_count: count })
      .eq('id', streamId);
  };

  return {
    activeStreams,
    isLoading,
    createStream,
    endStream,
    updateViewerCount,
    fetchActiveStreams
  };
};

export const useStreamMessages = (streamId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!streamId) return;

    try {
      const { data, error } = await supabase
        .from('live_stream_messages')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch profiles for messages
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      const messagesWithProfiles = data?.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id)
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    if (!streamId) return;

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`stream-messages-${streamId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'live_stream_messages',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const newMessage = payload.new as StreamMessage;
          
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', newMessage.user_id)
            .single();
          
          setMessages(prev => [...prev, { ...newMessage, profile }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, fetchMessages]);

  const sendMessage = async (message: string) => {
    if (!user || !streamId || !message.trim()) return false;

    const { error } = await supabase
      .from('live_stream_messages')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        message: message.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }

    return true;
  };

  return {
    messages,
    isLoading,
    sendMessage
  };
};
