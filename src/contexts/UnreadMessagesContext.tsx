import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IncomingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  kind: 'private' | 'group';
  roomId?: string;
  roomName?: string;
}

interface UnreadMessagesState {
  unreadCount: number;
  privateUnread: number;
  groupUnread: number;
  latest: IncomingMessage | null;
  clearLatest: () => void;
  refresh: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesState>({
  unreadCount: 0,
  privateUnread: 0,
  groupUnread: 0,
  latest: null,
  clearLatest: () => {},
  refresh: async () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [privateUnread, setPrivateUnread] = useState(0);
  const [groupUnread, setGroupUnread] = useState(0);
  const [latest, setLatest] = useState<IncomingMessage | null>(null);
  const dmChannelRef = useRef<any>(null);
  const roomChannelRef = useRef<any>(null);
  const myRoomIdsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setPrivateUnread(0);
      setGroupUnread(0);
      return;
    }
    try {
      const { count } = await supabase
        .from('private_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setPrivateUnread(count || 0);
    } catch (e) {
      console.error('[UnreadMessages] private count failed:', e);
    }
    try {
      const { data: groupCount, error } = await supabase.rpc('get_unread_group_count', { _user_id: user.id });
      if (error) throw error;
      setGroupUnread(typeof groupCount === 'number' ? groupCount : 0);
    } catch (e) {
      // Expected until supabase/RUN_THIS_group_chat_read_tracking.sql has been run — fail silent, not fatal.
      setGroupUnread(0);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('sqi:room-read', handler);
    return () => window.removeEventListener('sqi:room-read', handler);
  }, [refresh]);

  // Keep a local set of the user's room memberships so the (unfiltered) chat_messages
  // realtime channel can cheaply ignore inserts for rooms they're not in.
  useEffect(() => {
    if (!user) return;
    supabase
      .from('chat_members')
      .select('room_id')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error('[UnreadMessages] room membership fetch failed:', error);
          return;
        }
        myRoomIdsRef.current = new Set((data || []).map((r: any) => r.room_id));
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (dmChannelRef.current) supabase.removeChannel(dmChannelRef.current);

    const dmChannel = supabase
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
          setPrivateUnread((prev) => prev + 1);

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
            kind: 'private',
          });
        }
      )
      .subscribe();

    dmChannelRef.current = dmChannel;

    return () => {
      if (dmChannelRef.current) {
        supabase.removeChannel(dmChannelRef.current);
        dmChannelRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (roomChannelRef.current) supabase.removeChannel(roomChannelRef.current);

    // No server-side filter possible here (would need one channel per room membership),
    // so we filter client-side against myRoomIdsRef — fine at this member count.
    const roomChannel = supabase
      .channel(`unread-rooms-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const msg = payload.new as { id: string; room_id: string; user_id: string; content: string };
          if (msg.user_id === user.id) return;
          if (!myRoomIdsRef.current.has(msg.room_id)) return;

          setGroupUnread((prev) => prev + 1);

          const [{ data: profile }, { data: room }] = await Promise.all([
            supabase.from('profiles').select('full_name, avatar_url').eq('user_id', msg.user_id).single(),
            supabase.from('chat_rooms').select('name').eq('id', msg.room_id).single(),
          ]);

          setLatest({
            id: msg.id,
            senderId: msg.user_id,
            senderName: profile?.full_name || 'Someone',
            senderAvatar: profile?.avatar_url || null,
            content: msg.content,
            kind: 'group',
            roomId: msg.room_id,
            roomName: room?.name || 'Group',
          });
        }
      )
      .subscribe();

    roomChannelRef.current = roomChannel;

    return () => {
      if (roomChannelRef.current) {
        supabase.removeChannel(roomChannelRef.current);
        roomChannelRef.current = null;
      }
    };
  }, [user]);

  const clearLatest = useCallback(() => setLatest(null), []);

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCount: privateUnread + groupUnread,
        privateUnread,
        groupUnread,
        latest,
        clearLatest,
        refresh,
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
};
