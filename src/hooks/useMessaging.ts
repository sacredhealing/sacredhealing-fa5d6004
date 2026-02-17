import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  room_id?: string;
  sender_id?: string;
  receiver_id?: string;
  user_id?: string;
  content: string;
  created_at: string;
  message_type?: 'text' | 'voice' | 'image' | 'file' | 'video';
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  duration?: number | null;
  thumbnail_url?: string | null;
  status?: 'pending' | 'sent' | 'error';
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface UseMessagingOptions {
  roomId?: string;
  receiverId?: string;
  enableRealtime?: boolean;
}

/**
 * Optimistic UI Messaging Hook (<50ms local updates)
 * Handles text, voice notes, images, files, and videos with instant UI feedback
 */
export const useMessaging = (options: UseMessagingOptions = {}) => {
  const { user } = useAuth();
  const { roomId, receiverId, enableRealtime = true } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const optimisticMessagesRef = useRef<Map<string, Message>>(new Map());

  const fetchMessages = useCallback(async () => {
    if (!roomId && !receiverId) return;

    let query = supabase.from('chat_messages');
    
    if (roomId) {
      query = query.eq('room_id', roomId);
    } else if (receiverId && user) {
      // DM: get messages between current user and receiver
      query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`);
    }

    const { data: messagesData, error } = await query
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
      return;
    }

    const userIds = [...new Set(messagesData?.map(m => m.user_id || m.sender_id).filter(Boolean) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const messagesWithProfiles = messagesData?.map(msg => ({
      ...msg,
      message_type: msg.message_type || 'text',
      status: msg.status || 'sent',
      profile: profiles?.find(p => p.user_id === (msg.user_id || msg.sender_id))
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
  }, [roomId, receiverId, user]);

  useEffect(() => {
    fetchMessages();

    if (!enableRealtime) return;

    // Subscribe to realtime updates
    const channelName = roomId ? `room-${roomId}` : `dm-${user?.id}-${receiverId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages',
          filter: roomId ? `room_id=eq.${roomId}` : undefined
        },
        () => {
          // Small delay to ensure DB commit
          setTimeout(() => fetchMessages(), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, receiverId, user, enableRealtime, fetchMessages]);

  const sendMessage = useCallback(async (
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
  ): Promise<boolean> => {
    if (!user || isSending) return false;
    if (!roomId && !receiverId) return false;

    setIsSending(true);

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create optimistic message (<50ms UI update)
    const optimisticMessage: Message = {
      id: tempId,
      room_id: roomId,
      sender_id: user.id,
      receiver_id: receiverId,
      user_id: user.id,
      content,
      created_at: now,
      message_type: type,
      status: 'pending',
      profile: {
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null
      },
      ...fileData
    };

    // Add to optimistic map
    optimisticMessagesRef.current.set(tempId, optimisticMessage);
    
    // Update UI immediately (optimistic - <50ms)
    setMessages(prev => [...prev, optimisticMessage]);

    // Prepare database payload
    const messageData: any = {
      content,
      message_type: type,
      status: 'sent'
    };

    if (roomId) {
      messageData.room_id = roomId;
      messageData.user_id = user.id;
    } else if (receiverId) {
      messageData.sender_id = user.id;
      messageData.receiver_id = receiverId;
    }

    if (fileData) {
      Object.assign(messageData, fileData);
    }

    try {
      // Send to database (background sync)
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
        setIsSending(false);
        return false;
      }

      // Replace optimistic message with real one
      optimisticMessagesRef.current.delete(tempId);
      if (data) {
        const realMessage: Message = {
          ...data,
          message_type: data.message_type || 'text',
          status: 'sent',
          profile: optimisticMessage.profile
        };
        setMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
      }

      setIsSending(false);
      return true;
    } catch (err) {
      optimisticMessage.status = 'error';
      optimisticMessagesRef.current.set(tempId, optimisticMessage);
      setMessages(prev => prev.map(m => m.id === tempId ? optimisticMessage : m));
      setIsSending(false);
      return false;
    }
  }, [user, roomId, receiverId, isSending]);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    refreshMessages: fetchMessages
  };
};
