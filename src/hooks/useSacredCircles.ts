import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAdminRole } from './useAdminRole';
import { useMembership } from './useMembership';

export interface SacredCircle {
  id: string;
  name: string;
  description: string | null;
  type: 'community' | 'path' | 'guide' | 'andlig' | 'stargate';
  path_slug: string | null;
  is_premium: boolean;
  intention: string | null;
  is_locked: boolean;
  created_at: string;
  invite_link?: string | null;
  member_count?: number;
  is_member?: boolean;
}

export interface CircleMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useSacredCircles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const { isPremium } = useMembership();
  const [circles, setCircles] = useState<SacredCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCircles = useCallback(async () => {
    try {
      // Fetch all active circles
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (roomsError) throw roomsError;

      // Get member counts
      const roomIds = roomsData?.map(r => r.id) || [];
      const { data: memberCounts } = await supabase
        .from('chat_members')
        .select('room_id')
        .in('room_id', roomIds);

      // Get user's memberships
      let userMemberships: string[] = [];
      if (user) {
        const { data: memberships } = await supabase
          .from('chat_members')
          .select('room_id')
          .eq('user_id', user.id);
        userMemberships = memberships?.map(m => m.room_id) || [];
      }

      // Count members per room
      const countMap: Record<string, number> = {};
      memberCounts?.forEach(m => {
        countMap[m.room_id] = (countMap[m.room_id] || 0) + 1;
      });

      const circlesWithCounts = roomsData?.map(room => ({
        ...room,
        type: (room.type as SacredCircle['type']) || 'community',
        invite_link: (room as { invite_link?: string | null }).invite_link ?? null,
        member_count: countMap[room.id] || 0,
        is_member: userMemberships.includes(room.id)
      })) || [];

      setCircles(circlesWithCounts);
    } catch (error) {
      console.error('Error fetching circles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  const canAccessCircle = (circle: SacredCircle): boolean => {
    if (isAdmin) return true;
    if (circle.type === 'guide') return true; // Guide visible to all; posting is admin-only
    if (circle.type === 'stargate') return false; // Stargate access checked separately via useStargateAccess
    if (circle.type === 'andlig') return isPremium; // Andlig: active subscribers only
    if (circle.is_premium && !isPremium) return false;
    if (circle.is_locked) return false;
    return true;
  };

  const joinCircle = async (roomId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('chat_members')
      .insert({
        room_id: roomId,
        user_id: user.id,
        role: 'member'
      });

    if (error) {
      if (error.code === '23505') {
        // Already a member
        return true;
      }
      toast({ title: 'Error', description: 'Failed to join circle', variant: 'destructive' });
      return false;
    }

    await fetchCircles();
    return true;
  };

  const leaveCircle = async (roomId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to leave circle', variant: 'destructive' });
      return false;
    }

    await fetchCircles();
    return true;
  };

  return {
    circles,
    isLoading,
    canAccessCircle,
    joinCircle,
    leaveCircle,
    refreshCircles: fetchCircles,
    isAdmin,
    hasPremium: isPremium
  };
};

export const useCircleMessages = (roomId: string) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data: messagesData, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const messagesWithProfiles = messagesData?.map(msg => ({
      ...msg,
      is_pinned: msg.is_pinned || false,
      profile: profiles?.find(p => p.user_id === msg.user_id)
    })) || [];

    setMessages(messagesWithProfiles);
    setIsLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`sacred-circle-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content
      });

    return !error;
  };

  const pinMessage = async (messageId: string, pinned: boolean) => {
    if (!isAdmin) return false;

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_pinned: pinned })
      .eq('id', messageId);

    if (!error) {
      await fetchMessages();
    }
    return !error;
  };

  const deleteMessage = async (messageId: string) => {
    if (!isAdmin) return false;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (!error) {
      await fetchMessages();
    }
    return !error;
  };

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    pinMessage, 
    deleteMessage,
    isAdmin 
  };
};
