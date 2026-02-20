import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, useChatRoom } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ArrowLeft, Send, Loader2, Users, MessageCircle, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarRequiredAlert } from './AvatarRequiredAlert';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';

const ChatRooms = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasAvatar } = useProfile();
  const { chatRooms, isLoading, createChatRoom } = useCommunity();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || isCreating) return;
    setIsCreating(true);
    const success = await createChatRoom(newRoomName.trim(), newRoomDesc.trim());
    if (success) {
      setNewRoomName('');
      setNewRoomDesc('');
      setIsCreateOpen(false);
    }
    setIsCreating(false);
  };

  if (selectedRoom) {
    return (
      <ChatRoomView
        roomId={selectedRoom}
        roomName={selectedRoomName}
        onBack={() => setSelectedRoom(null)}
        hasAvatar={hasAvatar}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Avatar Required Alert */}
      {user && !hasAvatar && (
        <AvatarRequiredAlert onUploadClick={() => setProfileEditOpen(true)} />
      )}

      {/* Create Room Button */}
      {user && hasAvatar && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full rounded-2xl gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              {t('community.createRoom')}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl bg-[#1a1a2e] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">{t('community.createRoom')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Input
                placeholder={t('community.roomName')}
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
              />
              <Input
                placeholder={t('community.roomDescription')}
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
              />
              <Button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || isCreating}
                className="w-full rounded-xl"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('community.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rooms List — Telegram channel style */}
      {chatRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-primary/60" />
          </div>
          <p className="text-white/50 text-sm">{t('community.noRooms')}</p>
        </div>
      ) : (
        chatRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => {
              setSelectedRoom(room.id);
              setSelectedRoomName(room.name);
            }}
            className="w-full text-left rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 transition-all duration-200 p-4 flex items-center gap-4 group"
          >
            {/* Room avatar */}
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/40 to-violet-600/40 flex items-center justify-center flex-shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white">{room.name}</h3>
              {room.description && (
                <p className="text-sm text-white/50 truncate mt-0.5">{room.description}</p>
              )}
            </div>
            <div className="text-white/20 group-hover:text-white/40 transition-colors">›</div>
          </button>
        ))
      )}

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

const ChatRoomView = ({
  roomId,
  roomName,
  onBack,
  hasAvatar,
}: {
  roomId: string;
  roomName: string;
  onBack: () => void;
  hasAvatar: boolean;
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChatRoom(roomId);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !hasAvatar) return;
    setIsSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage('');
    setIsSending(false);
  };

  // Group messages by sender for Telegram-style consecutive bubbles
  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const isConsecutive = prev && prev.user_id === msg.user_id;
    acc.push({ ...msg, isConsecutive });
    return acc;
  }, [] as any[]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>

      {/* Header — Telegram-style */}
      <div className="flex items-center gap-3 px-1 py-3 border-b border-white/8 mb-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/50 to-violet-600/50 flex items-center justify-center border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white leading-tight">{roomName}</h2>
          <p className="text-xs text-white/40">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MessageCircle className="h-7 w-7 text-primary/50" />
            </div>
            <p className="text-white/40 text-sm">{t('community.noMessages')}</p>
            <p className="text-white/25 text-xs mt-1">Be the first to share something sacred 🙏</p>
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {groupedMessages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              const showAvatar = !isOwn && !msg.isConsecutive;
              const showName = !isOwn && !msg.isConsecutive;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${msg.isConsecutive ? 'mt-0.5' : 'mt-3'}`}
                >
                  {/* Avatar — only show for first in group */}
                  {!isOwn && (
                    <div className="w-8 flex-shrink-0 self-end mb-1">
                      {showAvatar ? (
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-600/40 to-primary/40 text-white text-xs font-semibold">
                            {msg.profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender name */}
                    {showName && (
                      <span className="text-[11px] font-semibold text-primary/80 mb-1 ml-3">
                        {msg.profile?.full_name || 'Anonymous'}
                      </span>
                    )}

                    <div
                      className={`relative px-4 py-2.5 shadow-md ${
                        isOwn
                          ? 'bg-gradient-to-br from-teal-600 to-cyan-700 text-white rounded-2xl rounded-br-md'
                          : 'bg-gradient-to-br from-[#2a2a3e] to-[#1e1e2e] text-white border border-white/8 rounded-2xl rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-white/40'} text-right`}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input bar — Telegram style */}
      {user && hasAvatar ? (
        <div className="flex-shrink-0 pt-3 pb-1 px-1">
          <div className="flex items-center gap-2 bg-[#1e1e2e] border border-white/10 rounded-2xl px-4 py-2 shadow-lg">
            <input
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
              placeholder={t('community.typeMessage', 'Share from presence...')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                newMessage.trim()
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/30 hover:scale-105'
                  : 'bg-white/5 text-white/20'
              }`}
            >
              {isSending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
        </div>
      ) : user && !hasAvatar ? (
        <div className="flex-shrink-0 pt-3">
          <p className="text-center text-xs text-white/40 py-3 bg-white/5 rounded-2xl border border-white/8">
            Add a profile photo to join the conversation 🙏
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ChatRooms;
