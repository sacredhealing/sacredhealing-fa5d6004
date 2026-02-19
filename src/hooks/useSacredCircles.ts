import { useState, useEffect, useCallback, useRef } from 'react';
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
  message_type: 'text' | 'voice' | 'image' | 'file' | 'video';
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  duration?: number | null; // For voice notes/videos in seconds
  thumbnail_url?: string | null;
  status: 'pending' | 'sent' | 'error';
  profile: {
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

      let circlesWithCounts = roomsData?.map(room => ({
        ...room,
        type: (room.type as SacredCircle['type']) || 'community',
        invite_link: (room as { invite_link?: string | null }).invite_link ?? null,
        member_count: countMap[room.id] || 0,
        is_member: userMemberships.includes(room.id)
      })) || [];

      // Create Andlig + Stargate rooms from app if missing (no migration needed; DB only allows type 'community'/'path'/'guide')
      const hasAndligByName = circlesWithCounts.some(c => c.name === 'Andlig Transformation');
      const hasStargateByName = circlesWithCounts.some(c => c.name === 'Stargate Community');
      if (user && (!hasAndligByName || !hasStargateByName)) {
        if (!hasAndligByName) {
          await supabase.from('chat_rooms').insert({
            name: 'Andlig Transformation',
            type: 'community',
            path_slug: null,
            is_premium: true,
            intention: 'Open to all active subscribers. Connect and grow together.',
            created_by: user.id
          }).then(() => {});
        }
        if (!hasStargateByName) {
          await supabase.from('chat_rooms').insert({
            name: 'Stargate Community',
            type: 'community',
            path_slug: null,
            is_premium: true,
            intention: 'Private space for Stargate members and invited souls.',
            created_by: user.id
          }).then(() => {});
        }
        // Refetch so new rooms appear (ignore errors if invite_link column missing)
        const { data: refetch } = await supabase.from('chat_rooms').select('*').eq('is_active', true).order('created_at', { ascending: true });
        if (refetch?.length) {
          const refetchIds = refetch.map(r => r.id);
          const { data: refetchCounts } = await supabase.from('chat_members').select('room_id').in('room_id', refetchIds);
          const refetchCountMap: Record<string, number> = {};
          refetchCounts?.forEach(m => { refetchCountMap[m.room_id] = (refetchCountMap[m.room_id] || 0) + 1; });
          circlesWithCounts = refetch.map(room => ({
            ...room,
            type: (room.type as SacredCircle['type']) || 'community',
            invite_link: (room as { invite_link?: string | null }).invite_link ?? null,
            member_count: refetchCountMap[room.id] || 0,
            is_member: user ? userMemberships.includes(room.id) : false
          }));
        }
      }

      // Treat rooms by name so they show in correct sections and chat works (real room_id)
      const ANDLIG_INVITE = 'https://t.me/sacredhealing_community';
      circlesWithCounts = circlesWithCounts.map(c => {
        if (c.name === 'Andlig Transformation') return { ...c, type: 'andlig' as const, invite_link: c.invite_link ?? ANDLIG_INVITE };
        if (c.name === 'Stargate Community') return { ...c, type: 'stargate' as const };
        return c;
      });

      const hasAndlig = circlesWithCounts.some(c => c.type === 'andlig');
      const hasStargate = circlesWithCounts.some(c => c.type === 'stargate');
      const fallbacks: SacredCircle[] = [];
      if (!hasAndlig) {
        fallbacks.push({
          id: 'fallback-andlig',
          name: 'Andlig Transformation',
          description: null,
          type: 'andlig',
          path_slug: null,
          is_premium: true,
          intention: 'Open to all active subscribers. Connect and grow together.',
          is_locked: false,
          created_at: new Date().toISOString(),
          invite_link: ANDLIG_INVITE,
          member_count: 0,
          is_member: false
        });
      }
      if (!hasStargate) {
        fallbacks.push({
          id: 'fallback-stargate',
          name: 'Stargate Community',
          description: null,
          type: 'stargate',
          path_slug: null,
          is_premium: true,
          intention: 'Private space for Stargate members and invited souls.',
          is_locked: false,
          created_at: new Date().toISOString(),
          invite_link: null,
          member_count: 0,
          is_member: false
        });
      }
      const combined = [...circlesWithCounts, ...fallbacks];
      // Only one of each: Andlig Transformation and Stargate Community; prefer real room over fallback
      const andligList = combined.filter(c => c.name === 'Andlig Transformation');
      const stargateList = combined.filter(c => c.name === 'Stargate Community');
      const otherCircles = combined.filter(c => c.name !== 'Andlig Transformation' && c.name !== 'Stargate Community');
      const oneAndlig = andligList.find(c => c.id !== 'fallback-andlig') ?? andligList[0];
      const oneStargate = stargateList.find(c => c.id !== 'fallback-stargate') ?? stargateList[0];
      const deduped = [
        ...otherCircles,
        ...(oneAndlig ? [oneAndlig] : []),
        ...(oneStargate ? [oneStargate] : [])
      ];
      setCircles(deduped);
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
    // Andlig: allow premium OR anyone already added to the room (invite/add flow)
    if (circle.type === 'andlig') return isPremium || !!circle.is_member;
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
  const optimisticMessagesRef = useRef<Map<string, CircleMessage>>(new Map());

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

    const messagesWithProfiles: CircleMessage[] = messagesData?.map(msg => ({
      ...msg,
      is_pinned: msg.is_pinned || false,
      message_type: (msg as any).message_type || 'text',
      status: ((msg as any).status || 'sent') as 'pending' | 'sent' | 'error',
      profile: profiles?.find(p => p.user_id === msg.user_id) ?? { full_name: null, avatar_url: null }
    })) || [];

    // Merge with optimistic messages (replace by ID if exists in DB)
    const optimisticMap = optimisticMessagesRef.current;
    const finalMessages = messagesWithProfiles.map(dbMsg => {
      const optimistic = optimisticMap.get(dbMsg.id);
      return optimistic ? { ...dbMsg, ...optimistic } : dbMsg;
    });

    // Add any optimistic messages not yet in DB
    optimisticMap.forEach((optMsg, tempId) => {
      if (!finalMessages.find(m => m.id === tempId)) {
        finalMessages.push(optMsg);
      }
    });

    setMessages(finalMessages);
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

  const sendMessage = async (
    content: string,
    type: 'text' | 'voice' | 'image' | 'file' | 'video' = 'text',
    fileData?: {
      file_url?: string;
      file_name?: string;
      file_size?: number;
      mime_type?: string;
      duration?: number;
      thumbnail_url?: string;
    }
  ) => {
    if (!user) return false;

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create optimistic message
    const optimisticMessage: CircleMessage = {
      id: tempId,
      room_id: roomId,
      user_id: user.id,
      content,
      created_at: now,
      is_pinned: false,
      message_type: type,
      status: 'pending',
      profile: {
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null
      },
      ...fileData
    };

    // Add to optimistic messages map
    optimisticMessagesRef.current.set(tempId, optimisticMessage);
    
    // Update UI immediately (optimistic)
    setMessages(prev => [...prev, optimisticMessage]);

    // Prepare database payload
    const messageData: any = {
      room_id: roomId,
      user_id: user.id,
      content,
      message_type: type,
      status: 'sent'
    };

    if (fileData) {
      Object.assign(messageData, fileData);
    }

    // Send to database
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      // Update optimistic message to error state
      optimisticMessage.status = 'error';
      optimisticMessagesRef.current.set(tempId, optimisticMessage);
      setMessages(prev => prev.map(m => m.id === tempId ? optimisticMessage : m));
      return false;
    }

    // Replace optimistic message with real one
    optimisticMessagesRef.current.delete(tempId);
    if (data) {
      const userIds = [data.user_id];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const realMessage: CircleMessage = {
        ...data,
        is_pinned: data.is_pinned || false,
        message_type: (data as any).message_type || 'text',
        status: 'sent',
        profile: profiles?.[0] ?? { full_name: null, avatar_url: null }
      };

      setMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
    }

    return true;
  };

  const createPinnedMessage = async (content: string) => {
    if (!user || !isAdmin) return false;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content,
        is_pinned: true
      });

    if (!error) {
      await fetchMessages();
    }
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
    createPinnedMessage,
    isAdmin 
  };
};

export interface CircleMember {
  id: string;
  room_id: string;
  user_id: string;
  role: string | null;
  joined_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useCircleMembers = (roomId: string) => {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`[useCircleMembers] Fetching members for room ${roomId}`);
      
      // Try RPC function first if available (for admins, bypasses RLS)
      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('get_room_members', { _room_id: roomId });
      
      let memberRows: any[] | null = null;
      let error: any = null;
      
      if (!rpcError && rpcData) {
        console.log(`[useCircleMembers] RPC function returned ${(rpcData as any[]).length} members`);
        memberRows = rpcData as any[];
      } else {
        // Fallback to direct query
        const result = await supabase
          .from('chat_members')
          .select('id, room_id, user_id, role, joined_at')
          .eq('room_id', roomId)
          .order('joined_at', { ascending: false });
        memberRows = result.data;
        error = result.error;
      }

      if (error) {
        console.error('[useCircleMembers] Error fetching chat_members:', error);
        const errorMsg = error.message || '';
        // Don't fail silently on recursion - log it
        if (errorMsg.includes('recursion')) {
          console.error('[useCircleMembers] RLS recursion detected - need SQL fix');
        }
        setMembers([]);
        setIsLoading(false);
        return;
      }

      console.log(`[useCircleMembers] Found ${memberRows?.length || 0} member rows`);

      if (!memberRows || memberRows.length === 0) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      const userIds = [...new Set(memberRows.map(m => m.user_id).filter(Boolean))];
      console.log(`[useCircleMembers] Fetching profiles for ${userIds.length} users`);
      let profiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
        
        if (profileError) {
          console.warn('[useCircleMembers] Profile fetch error (non-fatal):', profileError);
        } else {
          profiles = profileData || [];
        }
      }

      const enriched: CircleMember[] = memberRows.map(m => ({
        ...m,
        profile: profiles.find(p => p.user_id === m.user_id) ?? { full_name: null, avatar_url: null, user_id: m.user_id }
      }));

      console.log(`[useCircleMembers] Setting ${enriched.length} members`);
      setMembers(enriched);
    } catch (e) {
      console.error('Error in fetchMembers:', e);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMembers();

    // Subscribe to realtime updates for members
    const channel = supabase
      .channel(`circle-members-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_members', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('[useCircleMembers] Realtime update:', payload.eventType);
          // Small delay to ensure DB commit
          setTimeout(() => fetchMembers(), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchMembers]);

  return { members, isLoading, refreshMembers: fetchMembers };
};
