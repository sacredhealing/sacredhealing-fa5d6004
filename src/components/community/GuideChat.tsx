import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, MessageCircle, ArrowLeft, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GuideMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ConversationSummary {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const GuideChat = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">Please sign in to chat with a guide</p>
        </CardContent>
      </Card>
    );
  }

  // Admin sees list of all user conversations
  if (isAdmin && !selectedConversation) {
    return <AdminConversationList onSelectUser={setSelectedConversation} />;
  }

  // User or admin with selected conversation sees chat view
  return (
    <GuideChatView 
      partnerId={isAdmin ? selectedConversation : null} 
      onBack={isAdmin ? () => setSelectedConversation(null) : undefined}
    />
  );
};

// Helper functions to avoid TypeScript deep instantiation
async function fetchAdminIds(): Promise<Set<string>> {
  // @ts-ignore - Supabase types cause deep instantiation
  const result = await supabase.from('profiles').select('user_id').eq('is_admin', true);
  return new Set((result.data || []).map((p: any) => p.user_id));
}

async function fetchAllMessages(): Promise<any[]> {
  // @ts-ignore - Supabase types cause deep instantiation
  const result = await supabase
    .from('private_messages')
    .select('sender_id, receiver_id, content, created_at, is_read')
    .order('created_at', { ascending: false });
  return result.data || [];
}

async function fetchUserProfiles(userIds: string[]): Promise<Map<string, any>> {
  if (userIds.length === 0) return new Map<string, any>();
  // @ts-ignore - Supabase types cause deep instantiation
  const result = await supabase
    .from('profiles')
    .select('user_id, full_name, avatar_url')
    .in('user_id', userIds);
  return new Map((result.data || []).map((p: any) => [p.user_id, p]));
}

// Admin view: List of all user conversations
const AdminConversationList = ({ onSelectUser }: { onSelectUser: (userId: string) => void }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const adminIds = await fetchAdminIds();
        const messages = await fetchAllMessages();

        // Find conversations where one party is an admin and one is not
        const userConversations = new Map<string, { messages: any[], unread: number }>();

        messages.forEach((msg: any) => {
          const isAdminSender = adminIds.has(msg.sender_id);
          const isAdminReceiver = adminIds.has(msg.receiver_id);
          
          // Only include conversations between admin and non-admin
          if (isAdminSender !== isAdminReceiver) {
            const userId = isAdminSender ? msg.receiver_id : msg.sender_id;
            if (!userConversations.has(userId)) {
              userConversations.set(userId, { messages: [], unread: 0 });
            }
            const conv = userConversations.get(userId)!;
            conv.messages.push(msg);
            if (!msg.is_read && !isAdminSender) {
              conv.unread++;
            }
          }
        });

        // Get user profiles
        const userIds = Array.from(userConversations.keys());
        
        if (userIds.length === 0) {
          setConversations([]);
          setIsLoading(false);
          return;
        }

        const profileMap = await fetchUserProfiles(userIds);

        const summaries: ConversationSummary[] = userIds.map(userId => {
          const conv = userConversations.get(userId)!;
          const profile = profileMap.get(userId);
          const lastMsg = conv.messages[0];
          
          return {
            user_id: userId,
            full_name: profile?.full_name || 'Anonymous User',
            avatar_url: profile?.avatar_url || null,
            last_message: lastMsg?.content || '',
            last_message_time: lastMsg?.created_at || new Date().toISOString(),
            unread_count: conv.unread
          };
        });

        // Sort by most recent message
        summaries.sort((a, b) => 
          new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
        );

        setConversations(summaries);
      } catch (err) {
        console.error('Error:', err);
      }
      setIsLoading(false);
    };

    fetchConversations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">User Messages</h2>
      </div>

      {conversations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No user messages yet</p>
          </CardContent>
        </Card>
      ) : (
        conversations.map((conv) => (
          <Card
            key={conv.user_id}
            className="bg-card border-border cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelectUser(conv.user_id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={conv.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {conv.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-lg truncate">{conv.full_name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-base text-muted-foreground truncate">{conv.last_message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

// Chat view for both users and admins
const GuideChatView = ({ partnerId, onBack }: { partnerId: string | null; onBack?: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [guideProfile, setGuideProfile] = useState<{ full_name: string; avatar_url: string | null; user_id: string } | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch guide profile for users, or partner profile for admins
  useEffect(() => {
    const fetchProfiles = async () => {
      if (isAdmin && partnerId) {
        // Admin viewing user's messages - fetch user profile
        // @ts-ignore - Supabase types cause deep instantiation
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', partnerId)
          .single();
        
        if (data) {
          setPartnerProfile(data as any);
        }
      } else {
        // User - fetch first admin as the guide
        // @ts-ignore - Supabase types cause deep instantiation
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('is_admin', true)
          .limit(1)
          .single();

        if (data) {
          setGuideProfile(data as any);
        }
      }
    };

    fetchProfiles();
  }, [isAdmin, partnerId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;

      try {
        let messagesData: any[] = [];
        
        if (isAdmin && partnerId) {
          // Admin viewing specific user's conversation
          const adminIds = await fetchAdminIds();
          const adminIdArray = Array.from(adminIds);
          
          // @ts-ignore - Supabase types cause deep instantiation
          const { data } = await supabase
            .from('private_messages')
            .select('*')
            .order('created_at', { ascending: true });
          
          // Filter for messages between this user and any admin
          messagesData = (data || []).filter((m: any) => 
            (m.sender_id === partnerId && adminIds.has(m.receiver_id)) ||
            (m.receiver_id === partnerId && adminIds.has(m.sender_id))
          );
        } else if (!isAdmin && guideProfile) {
          // User viewing their conversation with guide
          // @ts-ignore - Supabase types cause deep instantiation
          const { data } = await supabase
            .from('private_messages')
            .select('*')
            .order('created_at', { ascending: true });
          
          messagesData = (data || []).filter((m: any) => 
            (m.sender_id === user.id && m.receiver_id === guideProfile.user_id) ||
            (m.receiver_id === user.id && m.sender_id === guideProfile.user_id)
          );
        }

        setMessages(messagesData);
        
        // Mark messages as read
        const unreadIds = messagesData.filter((m: any) => 
          !m.is_read && m.receiver_id === user.id
        ).map((m: any) => m.id);
        
        if (unreadIds.length > 0) {
          // @ts-ignore - Supabase types cause deep instantiation
          await supabase
            .from('private_messages')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
      setIsLoading(false);
    };

    if (guideProfile || (isAdmin && partnerId)) {
      fetchMessages();
    }
  }, [user, guideProfile, isAdmin, partnerId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('guide-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        (payload) => {
          const newMsg = payload.new as GuideMessage;
          // Check if this message belongs to our conversation
          if (isAdmin && partnerId) {
            if (newMsg.sender_id === partnerId || newMsg.receiver_id === partnerId) {
              setMessages(prev => [...prev, newMsg]);
            }
          } else if (guideProfile) {
            if (
              (newMsg.sender_id === user.id && newMsg.receiver_id === guideProfile.user_id) ||
              (newMsg.receiver_id === user.id && newMsg.sender_id === guideProfile.user_id)
            ) {
              setMessages(prev => [...prev, newMsg]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, guideProfile, isAdmin, partnerId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !user) return;
    
    const receiverId = isAdmin ? partnerId : guideProfile?.user_id;
    if (!receiverId) return;

    setIsSending(true);
    
    try {
      // @ts-ignore - Supabase types cause deep instantiation
      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
      } else {
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setIsSending(false);
  };

  const displayName = isAdmin ? partnerProfile?.full_name : guideProfile?.full_name;
  const displayAvatar = isAdmin ? partnerProfile?.avatar_url : guideProfile?.avatar_url;

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-12 w-12">
          <AvatarImage src={displayAvatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-lg">
            {displayName?.charAt(0) || 'G'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {displayName || 'Sacred Guide'}
          </h2>
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
        </div>
        {!isAdmin && (
          <Badge variant="secondary" className="ml-auto">
            Free Support
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 pr-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {isAdmin ? 'No messages from this user yet' : 'Start a conversation with your guide'}
            </p>
            <p className="text-sm text-muted-foreground">
              {!isAdmin && 'Ask questions, share your journey, or request support'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-base leading-relaxed">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-border">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="text-base h-12"
        />
        <Button 
          onClick={handleSend} 
          disabled={!newMessage.trim() || isSending}
          size="lg"
          className="h-12 px-6"
        >
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default GuideChat;
