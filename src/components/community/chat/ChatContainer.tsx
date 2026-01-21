import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageCircle } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatMessageInput from './ChatMessageInput';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatContainerProps {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  isBot?: boolean;
  isOnline?: boolean;
  onBack?: () => void;
  showBackOnDesktop?: boolean;
}

const ChatContainer = ({
  partnerId,
  partnerName,
  partnerAvatar,
  isBot = false,
  isOnline = true,
  onBack,
  showBackOnDesktop = false
}: ChatContainerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('private_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Mark messages as read
        const unreadIds = (data || [])
          .filter((m: Message) => !m.is_read && m.sender_id === partnerId)
          .map((m: Message) => m.id);

        if (unreadIds.length > 0) {
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

    fetchMessages();
  }, [user, partnerId]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === partnerId) ||
            (newMsg.sender_id === partnerId && newMsg.receiver_id === user.id)
          ) {
            setMessages(prev => [...prev, newMsg]);
            // Mark as read if from partner
            if (newMsg.sender_id === partnerId) {
              supabase
                .from('private_messages')
                .update({ is_read: true })
                .eq('id', newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId]);

  const handleSendMessage = async (content: string) => {
    if (!user || isSending) return;
    setIsSending(true);

    try {
      // Insert message to database
      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: partnerId,
          content
        });

      if (error) throw error;

      // If this is a bot, get AI response
      if (isBot) {
        setIsTyping(true);
        try {
          const response = await supabase.functions.invoke('guide-chat', {
            body: {
              messages: [
                ...messages.map(m => ({
                  role: m.sender_id === user.id ? 'user' : 'assistant',
                  content: m.content
                })),
                { role: 'user', content }
              ],
              userId: user.id,
              guideId: partnerId
            }
          });

          if (response.error) throw response.error;

          // AI response is already saved by the edge function
        } catch (aiError: any) {
          console.error('AI response error:', aiError);
          // Show error but don't fail
          if (aiError.message?.includes('429') || aiError.message?.includes('Rate limit')) {
            toast({
              title: "Please wait",
              description: "The guide is taking a moment to reflect. Try again shortly.",
              variant: "default"
            });
          }
        }
        setIsTyping(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
    setIsSending(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ChatHeader
        name={partnerName}
        avatar={partnerAvatar}
        isOnline={isOnline}
        isBot={isBot}
        onBack={onBack}
        showBackOnDesktop={showBackOnDesktop}
      />

      {/* Messages Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 relative"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)'
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")'
          }}
        />

        <div className="max-w-4xl mx-auto space-y-1 relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4 opacity-50">
              <MessageCircle className="h-12 w-12" />
              <p className="text-center">
                {isBot ? 'Welcome to your sacred space. How are you feeling today?' : 'Send a message to start the conversation'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                timestamp={formatTime(msg.created_at)}
                isMe={msg.sender_id === user?.id}
                isRead={msg.is_read}
                showReadReceipt={msg.sender_id === user?.id}
              />
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-1 text-primary text-xs mt-2 pl-2">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '200ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '400ms' }}>.</span>
              <span className="ml-1 italic">{partnerName} is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatMessageInput
        onSend={handleSendMessage}
        disabled={isSending}
        placeholder={isBot ? 'Ask the guide anything...' : 'Write a message...'}
      />
    </div>
  );
};

export default ChatContainer;
