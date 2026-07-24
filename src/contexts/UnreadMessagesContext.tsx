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
  /** Per-room breakdown — the piece that was missing. Lets any screen show
   *  WHICH channel has unread messages, not just that something, somewhere, does. */
  groupUnreadByRoom: Record<string, number>;
  latest: IncomingMessage | null;
  clearLatest: () => void;
  clearRoomUnread: (roomId: string) => void;
  refresh: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesState>({
  unreadCount: 0,
  privateUnread: 0,
  groupUnread: 0,
  groupUnreadByRoom: {},
  latest: null,
  clearLatest: () => {},
  clearRoomUnread: () => {},
  refresh: async () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [privateUnread, setPrivateUnread] = useState(0);
  const [groupUnread, setGroupUnread] = useState(0);
  const [groupUnreadByRoom, setGroupUnreadByRoom] = useState<Record<string, number>>({});
  const [latest, setLatest] = useState<IncomingMessage | null>(null);
  const dmChannelRef = useRef<any>(null);
  const roomChannelRef = useRef<any>(null);
  const myRoomIdsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setPrivateUnread(0);
      setGroupUnread(0);
      setGroupUnreadByRoom({});
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

    // Per-room breakdown — built entirely client-side (a handful of small
    // COUNT queries, one per room the user belongs to) so no new SQL/RPC
    // is needed. Also refreshes myRoomIdsRef so the realtime filter below
    // always has current membership, without a separate effect race.
    try {
      const { data: memberships, error: memErr } = await supabase
        .from('chat_members')
        .select('room_id')
        .eq('user_id', user.id);
      if (memErr) throw memErr;

      const roomIds = (memberships || []).map((r: any) => r.room_id);
      myRoomIdsRef.current = new Set(roomIds);

      if (roomIds.length === 0) {
        setGroupUnread(0);
        setGroupUnreadByRoom({});
        return;
      }

      const { data: reads } = await (supabase as any)
        .from('chat_room_reads')
        .select('room_id, last_read_at')
        .eq('user_id', user.id);
      const lastReadMap: Record<string, string> = {};
      (reads || []).forEach((r: any) => { lastReadMap[r.room_id] = r.last_read_at; });

      const counts = await Promise.all(
        roomIds.map(async (rid: string) => {
          const since = lastReadMap[rid] || '1970-01-01T00:00:00Z';
          const { count } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('room_id', rid)
            .neq('user_id', user.id)
            .gt('created_at', since);
          return [rid, count || 0] as const;
        })
      );

      const byRoom: Record<string, number> = {};
      let total = 0;
      counts.forEach(([rid, c]) => {
        if (c > 0) { byRoom[rid] = c; total += c; }
      });
      setGroupUnreadByRoom(byRoom);
      setGroupUnread(total);
    } catch (e) {
      // Expected until supabase/RUN_THIS_group_chat_read_tracking.sql has been run — fail silent, not fatal.
      setGroupUnread(0);
      setGroupUnreadByRoom({});
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
          setGroupUnreadByRoom((prev) => ({ ...prev, [msg.room_id]: (prev[msg.room_id] || 0) + 1 }));

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

  const clearRoomUnread = useCallback((roomId: string) => {
    setGroupUnreadByRoom((prev) => {
      if (!prev[roomId]) return prev;
      const cleared = prev[roomId];
      const next = { ...prev };
      delete next[roomId];
      setGroupUnread((g) => Math.max(0, g - cleared));
      return next;
    });
  }, []);

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCount: privateUnread + groupUnread,
        privateUnread,
        groupUnread,
        groupUnreadByRoom,
        latest,
        clearLatest,
        clearRoomUnread,
        refresh,
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
};
