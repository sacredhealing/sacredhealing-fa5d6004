import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ChatListItemProps {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  isBot?: boolean;
  isActive: boolean;
  onClick: () => void;
}

const ChatListItem = ({
  name,
  avatar,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isOnline,
  isBot,
  isActive,
  onClick
}: ChatListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-all duration-200 rounded-xl mx-2 mb-1 ${
        isActive
          ? 'bg-[rgba(212,175,55,0.03)] border border-[rgba(212,175,55,0.25)] shadow-[0_0_20px_rgba(212,175,55,0.08),0_0_0_1px_rgba(147,51,234,0.15)]'
          : 'bg-[rgba(212,175,55,0.03)] border border-transparent hover:border-white/10 hover:shadow-[0_0_12px_rgba(212,175,55,0.05)]'
      }`}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border-2 border-border">
          <AvatarImage src={avatar || undefined} alt={name} />
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>
      
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-baseline">
          <h3 className={`font-semibold truncate flex items-center gap-1.5 ${isActive ? 'text-foreground' : 'text-foreground/90'}`}>
            {name}
            {isBot && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 uppercase font-normal">
                Bot
              </Badge>
            )}
          </h3>
          {lastMessageTime && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
              {lastMessageTime}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {lastMessage || 'No messages yet'}
          </p>
          {unreadCount > 0 && !isActive && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2 min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
