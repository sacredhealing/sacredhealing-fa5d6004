import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  audio_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  post_type: string;
  is_live_recording: boolean;
  live_recording_title: string | null;
  live_recording_description: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  user_liked?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type?: 'text' | 'voice' | 'image' | 'file' | 'video';
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  duration?: number | null;
  thumbnail_url?: string | null;
  status?: 'pending' | 'sent' | 'error';
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Conversation {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useCommunity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    const { data: postsData, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    // Fetch profiles for each post
    const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    // Fetch user's likes
    let userLikes: string[] = [];
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      userLikes = likes?.map(l => l.post_id) || [];
    }

    const postsWithProfiles = postsData?.map(post => ({
      ...post,
      profile: profiles?.find(p => p.user_id === post.user_id),
      user_liked: userLikes.includes(post.id)
    })) || [];

    setPosts(postsWithProfiles);
  };

  const fetchChatRooms = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat rooms:', error);
      return;
    }

    setChatRooms(data || []);
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data: messages, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    // Group by conversation partner
    const conversationMap = new Map<string, PrivateMessage[]>();
    messages?.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, []);
      }
      conversationMap.get(partnerId)!.push(msg);
    });

    // Fetch profiles for conversation partners
    const partnerIds = [...conversationMap.keys()];
    if (partnerIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', partnerIds);

    const convs: Conversation[] = partnerIds.map(partnerId => {
      const msgs = conversationMap.get(partnerId)!;
      const profile = profiles?.find(p => p.user_id === partnerId);
      const unreadCount = msgs.filter(m => m.receiver_id === user.id && !m.is_read).length;

      return {
        user_id: partnerId,
        full_name: profile?.full_name || 'Unknown User',
        avatar_url: profile?.avatar_url,
        last_message: msgs[0].content,
        last_message_time: msgs[0].created_at,
        unread_count: unreadCount
      };
    });

    setConversations(convs);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPosts(), fetchChatRooms(), fetchConversations()]);
      setIsLoading(false);
    };
    loadData();
  }, [user]);

  const createPost = async (content: string, imageUrl?: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl || null
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Success', description: 'Post created!' });
    await fetchPosts();
    return true;
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.user_liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      await supabase.from('community_posts').update({ likes_count: post.likes_count - 1 }).eq('id', postId);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      await supabase.from('community_posts').update({ likes_count: post.likes_count + 1 }).eq('id', postId);
    }

    await fetchPosts();
  };

  const createChatRoom = async (name: string, description?: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        description: description || null,
        created_by: user.id
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to create chat room', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Success', description: 'Chat room created!' });
    await fetchChatRooms();
    return true;
  };

  const sendPrivateMessage = async (receiverId: string, content: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('private_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
      return false;
    }

    await fetchConversations();
    return true;
  };

  return {
    posts,
    chatRooms,
    conversations,
    isLoading,
    createPost,
    likePost,
    createChatRoom,
    sendPrivateMessage,
    fetchPosts,
    fetchChatRooms,
    fetchConversations
  };
};

export const useChatRoom = (roomId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!roomId) return;
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
      profile: profiles?.find(p => p.user_id === msg.user_id)
    })) || [];

    setMessages(messagesWithProfiles);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!roomId) return;
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

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

  return { messages, isLoading, sendMessage };
};

export const usePrivateChat = (partnerId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  };

  const fetchPartnerProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', partnerId)
      .single();

    setPartnerProfile(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    fetchPartnerProfile();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`dm-${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        (payload) => {
          const msg = payload.new as PrivateMessage;
          if ((msg.sender_id === user?.id && msg.receiver_id === partnerId) ||
              (msg.sender_id === partnerId && msg.receiver_id === user?.id)) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId, user]);

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

    // Optimistic update
    const tempId = `temp-dm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const optimisticMessage: PrivateMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: partnerId,
      content,
      created_at: now,
      is_read: false,
      message_type: type,
      status: 'pending',
      ...fileData
    };

    setMessages(prev => [...prev, optimisticMessage]);

    const { data, error } = await supabase
      .from('private_messages')
      .insert({ sender_id: user.id, receiver_id: partnerId, content })
      .select()
      .single();

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return false;
    }

    // Replace optimistic with real message
    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }

    return true;
  };

  return { messages, partnerProfile, isLoading, sendMessage };
};

export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    const userIds = [...new Set(data?.map(c => c.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const commentsWithProfiles = data?.map(comment => ({
      ...comment,
      profile: profiles?.find(p => p.user_id === comment.user_id)
    })) || [];

    setComments(commentsWithProfiles);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const addComment = async (content: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      });

    if (error) return false;

    // Update comments count
    const post = await supabase
      .from('community_posts')
      .select('comments_count')
      .eq('id', postId)
      .single();

    if (post.data) {
      await supabase
        .from('community_posts')
        .update({ comments_count: post.data.comments_count + 1 })
        .eq('id', postId);
    }

    await fetchComments();
    return true;
  };

  return { comments, isLoading, addComment, fetchComments };
};

export const useAllUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<{ user_id: string; full_name: string | null; avatar_url: string | null; bio: string | null; subscription_tier?: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);

      // Fetch admin user IDs to exclude them from the member list
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      const adminIds = new Set((adminRoles || []).map((r: any) => r.user_id));

      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio')
        .neq('user_id', user?.id || '');

      // Exclude admin accounts from the DM user picker
      const filtered = (data || []).filter((u: any) => {
        if (adminIds.has(u.user_id)) return false;
        const tier = (u.subscription_tier || '').toLowerCase();
        return tier !== 'admin';
      });
      setUsers(filtered);
      setIsLoading(false);
    };

    if (user) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return { users, isLoading };
};
