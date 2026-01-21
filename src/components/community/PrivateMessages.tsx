import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, usePrivateChat, useAllUsers } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ArrowLeft, Send, Loader2, Mail, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarRequiredAlert } from './AvatarRequiredAlert';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';

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
  const users = useAllUsers();
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) => u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
           u.bio?.toLowerCase().includes(search.toLowerCase())
  );

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
        {filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">{t('community.noUsersFound')}</p>
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
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !hasAvatar) return;
    setIsSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage('');
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={partnerProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {partnerProfile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold text-foreground">{partnerProfile?.full_name || 'Loading...'}</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('community.startConversation')}</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {user && hasAvatar && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Input
            placeholder={t('community.typeMessage')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PrivateMessages;
