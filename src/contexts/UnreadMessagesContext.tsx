import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IncomingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
}

interface UnreadMessagesState {
  unreadCount: number;
  latest: IncomingMessage | null;
  clearLatest: () => void;
  refresh: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesState>({
  unreadCount: 0,
  latest: null,
  clearLatest: () => {},
  refresh: async () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState<IncomingMessage | null>(null);
  const channelRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from('private_messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`unread-dm-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const msg = payload.new as { id: string; sender_id: string; content: string };

          setUnreadCount((prev) => prev + 1);

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();

          setLatest({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: profile?.full_name || 'Someone',
            senderAvatar: profile?.avatar_url || null,
            content: msg.content,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  const clearLatest = useCallback(() => setLatest(null), []);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, latest, clearLatest, refresh }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
