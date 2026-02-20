import { ArrowLeft, Search, Phone, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  name: string;
  avatar: string | null;
  isOnline?: boolean;
  isBot?: boolean;
  /** Show Sovereign Badge (Gold ॐ) for Premium/Stargate members */
  isPremium?: boolean;
  lastSeen?: string;
  onBack?: () => void;
  showBackOnDesktop?: boolean;
}

const ChatHeader = ({
  name,
  avatar,
  isOnline = false,
  isBot = false,
  isPremium = false,
  lastSeen,
  onBack,
  showBackOnDesktop = false
}: ChatHeaderProps) => {
  return (
    <div className="h-16 border-b border-border bg-background/90 backdrop-blur-md flex items-center px-4 shrink-0 shadow-sm">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={`mr-2 ${showBackOnDesktop ? '' : 'md:hidden'}`}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div className="flex items-center flex-1">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={avatar || undefined} alt={name} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="ml-3">
          <h2 className="font-bold text-foreground text-sm leading-tight flex items-center gap-2">
            {name}
            {isPremium && (
              <span className="text-[#D4AF37] text-base font-normal" title="Sovereign / Premium">ॐ</span>
            )}
            {isBot && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 uppercase font-normal">
                Bot
              </Badge>
            )}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {isOnline ? (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                online
              </span>
            ) : (
              lastSeen || 'offline'
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-muted-foreground">
        <Button variant="ghost" size="icon" className="hover:text-primary">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="hover:text-primary">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="hover:text-primary">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
