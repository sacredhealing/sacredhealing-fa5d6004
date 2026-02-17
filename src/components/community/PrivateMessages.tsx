import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, usePrivateChat, useAllUsers } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ArrowLeft, Send, Loader2, Mail, Search, ChevronDown, Circle, Clock, Check, AlertCircle, File } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarRequiredAlert } from './AvatarRequiredAlert';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { TelegramChatInput } from './TelegramChatInput';
import { VoicePlayer } from './VoicePlayer';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const PrivateMessages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasAvatar } = useProfile();
  const { conversations, isLoading } = useCommunity();
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  if (selectedPartner) {
    return <PrivateChatView partnerId={selectedPartner} onBack={() => setSelectedPartner(null)} hasAvatar={hasAvatar} />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Avatar Required Alert */}
      {user && !hasAvatar && (
        <AvatarRequiredAlert onUploadClick={() => setProfileEditOpen(true)} />
      )}

      {/* New Chat Button */}
      {user && hasAvatar && (
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('community.newMessage')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('community.selectUser')}</DialogTitle>
            </DialogHeader>
            <UserSelector
              onSelect={(userId) => {
                setSelectedPartner(userId);
                setIsNewChatOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('community.noConversations')}</p>
          </CardContent>
        </Card>
      ) : (
        conversations.map((conv) => (
          <Card
            key={conv.user_id}
            className="bg-card border-border cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedPartner(conv.user_id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {conv.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground truncate">{conv.full_name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

const UserSelector = ({ onSelect }: { onSelect: (userId: string) => void }) => {
  const { t } = useTranslation();
  const { users, isLoading } = useAllUsers();
  const [search, setSearch] = useState('');

  const filteredUsers = search.trim() 
    ? users.filter(
        (u) => u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
               u.bio?.toLowerCase().includes(search.toLowerCase())
      )
    : users; // Show all users when no search term

  return (
    <div className="space-y-4 pt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('community.searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {search.trim() ? t('community.noUsersFound') : t('community.noUsersAvailable', 'No other users available yet')}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => onSelect(user.user_id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{user.full_name || 'Anonymous'}</span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

const PrivateChatView = ({ partnerId, onBack, hasAvatar }: { partnerId: string; onBack: () => void; hasAvatar: boolean }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, partnerProfile, isLoading, sendMessage } = usePrivateChat(partnerId);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && !showScrollToBottom) {
      scrollToBottom(false);
    }
  }, [messages.length, showScrollToBottom, scrollToBottom]);

  const handleSendText = async (text: string) => {
    if (!text.trim() || isSending || !hasAvatar) return;
    setIsSending(true);
    await sendMessage(text.trim(), 'text');
    setIsSending(false);
  };

  const handleSendVoice = async (audioBlob: Blob, duration: number, fileData: any) => {
    setIsSending(true);
    await sendMessage('Voice message', 'voice', { ...fileData, duration });
    setIsSending(false);
  };

  const handleSendFile = async (file: File, fileData: any) => {
    setIsSending(true);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const type = isImage ? 'image' : isVideo ? 'video' : 'file';
    await sendMessage(file.name, type, fileData);
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] rounded-3xl bg-gradient-to-b from-background/40 via-background/30 to-background/40 backdrop-blur-2xl border border-white/10 shadow-2xl p-4">
      {/* Header with Liquid Glass */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 bg-gradient-to-r from-background/30 via-background/20 to-background/30 backdrop-blur-xl rounded-2xl p-3 -mx-1 shadow-lg">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={partnerProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {partnerProfile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold text-foreground">{partnerProfile?.full_name || 'Loading...'}</h2>
      </div>

      {/* Messages with Fast Scroll */}
      <div className="relative flex-1">
        <ScrollArea className="h-full pr-4" ref={messagesContainerRef}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('community.startConversation')}</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: any) => (
                <DMMessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Fast Scroll Button */}
        {showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-6"
          >
            <Button
              variant="default"
              size="icon"
              onClick={() => scrollToBottom()}
              className="rounded-full bg-background/80 backdrop-blur-xl border border-white/10 hover:bg-background/90 shadow-lg h-10 w-10"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Telegram-Grade Input Bar */}
      {user && hasAvatar && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <TelegramChatInput
            onSendText={handleSendText}
            onSendVoice={handleSendVoice}
            onSendFile={handleSendFile}
            roomId={`dm-${partnerId}`}
            disabled={isSending}
            placeholder={t('community.typeMessage')}
          />
        </div>
      )}
    </div>
  );
};

const DMMessageBubble = ({ message, isOwn }: { message: any; isOwn: boolean }) => {
  const messageType = message.message_type || 'text';
  const status = message.status || 'sent';

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 opacity-60" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Check className="h-3 w-3 opacity-60" />;
    }
  };

  const renderContent = () => {
    switch (messageType) {
      case 'voice':
        return message.file_url ? (
          <VoicePlayer audioUrl={message.file_url} duration={message.duration || undefined} className="w-full" />
        ) : (
          <p className="text-sm">Voice message</p>
        );
      case 'image':
        return message.file_url ? (
          <div className="space-y-2">
            <img src={message.file_url} alt={message.content} className="max-w-full rounded-lg" loading="lazy" />
            {message.content && message.content !== message.file_name && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        );
      case 'video':
        return message.file_url ? (
          <div className="space-y-2">
            <video src={message.file_url} controls className="max-w-full rounded-lg" poster={message.thumbnail_url || undefined} />
            {message.content && message.content !== message.file_name && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        );
      case 'file':
        return (
          <div className="flex items-center gap-3 p-2 bg-background/30 rounded-lg">
            <File className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.file_name || message.content}</p>
              {message.file_size && (
                <p className="text-xs opacity-60">{(message.file_size / 1024 / 1024).toFixed(2)} MB</p>
              )}
            </div>
            {message.file_url && (
              <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 rotate-[-135deg]" />
                </Button>
              </a>
            )}
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      <div className="group relative max-w-[70%]">
        <div
          className={`rounded-2xl p-4 backdrop-blur-md shadow-lg transition-all ${
            isOwn
              ? 'bg-gradient-to-br from-cyan-500/90 via-blue-500/90 to-cyan-600/90 text-white border border-cyan-400/30'
              : 'bg-gradient-to-br from-muted/90 via-muted/80 to-muted/90 text-foreground border border-white/10'
          }`}
        >
          {renderContent()}
          <div className="flex items-center justify-between mt-2 gap-2">
            <p className="text-xs opacity-60">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </p>
            {isOwn && (
              <div className="shrink-0">
                {getStatusIcon()}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivateMessages;
