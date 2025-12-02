import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, useChatRoom } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ArrowLeft, Send, Loader2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChatRooms = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { chatRooms, isLoading, createChatRoom } = useCommunity();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
    return <ChatRoomView roomId={selectedRoom} onBack={() => setSelectedRoom(null)} />;
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
      {/* Create Room Button */}
      {user && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('community.createRoom')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('community.createRoom')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={t('community.roomName')}
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
              <Input
                placeholder={t('community.roomDescription')}
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
              />
              <Button onClick={handleCreateRoom} disabled={!newRoomName.trim() || isCreating} className="w-full">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('community.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rooms List */}
      {chatRooms.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('community.noRooms')}</p>
          </CardContent>
        </Card>
      ) : (
        chatRooms.map((room) => (
          <Card
            key={room.id}
            className="bg-card border-border cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedRoom(room.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{room.name}</h3>
                  {room.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{room.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

const ChatRoomView = ({ roomId, onBack }: { roomId: string; onBack: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChatRoom(roomId);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
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
        <h2 className="text-lg font-semibold text-foreground">{t('community.chatRoom')}</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('community.noMessages')}</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {msg.profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-xs font-medium mb-1 opacity-80">
                    {msg.profile?.full_name || 'Anonymous'}
                  </p>
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
      {user && (
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

export default ChatRooms;
