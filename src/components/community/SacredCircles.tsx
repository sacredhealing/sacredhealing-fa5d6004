import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSacredCircles, useCircleMessages, SacredCircle, CircleMessage } from '@/hooks/useSacredCircles';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Send, Loader2, Users, Lock, Crown, Sparkles, 
  MessageCircle, Pin, Trash2, MoreVertical, Heart 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AvatarRequiredAlert } from './AvatarRequiredAlert';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';

const SacredCircles = () => {
  const { user } = useAuth();
  const { hasAvatar } = useProfile();
  const { circles, isLoading, canAccessCircle, joinCircle, hasPremium } = useSacredCircles();
  const [selectedCircle, setSelectedCircle] = useState<SacredCircle | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const handleSelectCircle = async (circle: SacredCircle) => {
    if (!canAccessCircle(circle)) {
      return;
    }
    
    // Auto-join if not a member
    if (!circle.is_member && user) {
      await joinCircle(circle.id);
    }
    
    setSelectedCircle(circle);
  };

  if (selectedCircle) {
    return (
      <CircleChat 
        circle={selectedCircle} 
        onBack={() => setSelectedCircle(null)} 
        hasAvatar={hasAvatar}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const communityCircles = circles.filter(c => c.type === 'community');
  const pathCircles = circles.filter(c => c.type === 'path');
  const guideChannels = circles.filter(c => c.type === 'guide');

  return (
    <div className="space-y-6">
      {/* Avatar Required Alert */}
      {user && !hasAvatar && (
        <AvatarRequiredAlert onUploadClick={() => setProfileEditOpen(true)} />
      )}

      {/* Premium Notice */}
      {!hasPremium && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Premium Feature</p>
              <p className="text-xs text-muted-foreground">Join Sacred Circles to connect with the community</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guide Channel */}
      {guideChannels.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Guide Channel
          </h3>
          {guideChannels.map(circle => (
            <CircleCard 
              key={circle.id} 
              circle={circle} 
              onSelect={handleSelectCircle}
              canAccess={canAccessCircle(circle)}
            />
          ))}
        </section>
      )}

      {/* Community Lounge */}
      {communityCircles.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Heart className="h-5 w-5 text-pink-500" />
            Community
          </h3>
          {communityCircles.map(circle => (
            <CircleCard 
              key={circle.id} 
              circle={circle} 
              onSelect={handleSelectCircle}
              canAccess={canAccessCircle(circle)}
            />
          ))}
        </section>
      )}

      {/* Path Circles */}
      {pathCircles.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            Path Circles
          </h3>
          <div className="space-y-3">
            {pathCircles.map(circle => (
              <CircleCard 
                key={circle.id} 
                circle={circle} 
                onSelect={handleSelectCircle}
                canAccess={canAccessCircle(circle)}
              />
            ))}
          </div>
        </section>
      )}

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

interface CircleCardProps {
  circle: SacredCircle;
  onSelect: (circle: SacredCircle) => void;
  canAccess: boolean;
}

const CircleCard = ({ circle, onSelect, canAccess }: CircleCardProps) => {
  const getCircleIcon = () => {
    switch (circle.type) {
      case 'guide': return <Sparkles className="h-6 w-6 text-primary" />;
      case 'path': return <MessageCircle className="h-6 w-6 text-blue-500" />;
      default: return <Heart className="h-6 w-6 text-pink-500" />;
    }
  };

  return (
    <Card
      className={`bg-card border-border transition-all duration-200 ${
        canAccess 
          ? 'cursor-pointer hover:bg-accent/50 hover:border-primary/30' 
          : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={() => canAccess && onSelect(circle)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {getCircleIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{circle.name}</h3>
              {circle.is_premium && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
              {circle.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            {circle.intention && (
              <p className="text-sm text-muted-foreground line-clamp-1">{circle.intention}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{circle.member_count} members</span>
              {circle.is_member && (
                <Badge variant="outline" className="text-xs">Joined</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CircleChatProps {
  circle: SacredCircle;
  onBack: () => void;
  hasAvatar: boolean;
}

const CircleChat = ({ circle, onBack, hasAvatar }: CircleChatProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, pinMessage, deleteMessage, isAdmin } = useCircleMessages(circle.id);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !hasAvatar) return;
    
    // Guide channel - only admins can post
    if (circle.type === 'guide' && !isAdmin) return;
    
    setIsSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage('');
    setIsSending(false);
  };

  const pinnedMessages = messages.filter(m => m.is_pinned);
  const regularMessages = messages.filter(m => !m.is_pinned);

  const canPost = circle.type !== 'guide' || isAdmin;

  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">{circle.name}</h2>
          {circle.intention && (
            <p className="text-xs text-muted-foreground line-clamp-1">{circle.intention}</p>
          )}
        </div>
      </div>

      {/* Pinned Messages */}
      <AnimatePresence>
        {pinnedMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2"
          >
            {pinnedMessages.map(msg => (
              <Card key={msg.id} className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Pin className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-primary">{msg.profile?.full_name || 'Guide'}</p>
                      <p className="text-sm text-foreground">{msg.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : regularMessages.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Be the first to share in this sacred space</p>
          </div>
        ) : (
          <div className="space-y-4">
            {regularMessages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.user_id === user?.id}
                isAdmin={isAdmin}
                onPin={() => pinMessage(msg.id, !msg.is_pinned)}
                onDelete={() => deleteMessage(msg.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {user && hasAvatar && canPost && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Input
            placeholder="Share from presence..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="bg-background"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {circle.type === 'guide' && !isAdmin && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 inline mr-1" />
            This is a guide-only channel. Enjoy the teachings.
          </p>
        </div>
      )}
    </div>
  );
};

interface MessageBubbleProps {
  message: CircleMessage;
  isOwn: boolean;
  isAdmin: boolean;
  onPin: () => void;
  onDelete: () => void;
}

const MessageBubble = ({ message, isOwn, isAdmin, onPin, onDelete }: MessageBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {message.profile?.full_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="group relative max-w-[70%]">
        <div
          className={`rounded-lg p-3 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          <p className="text-xs font-medium mb-1 opacity-80">
            {message.profile?.full_name || 'Anonymous'}
          </p>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs opacity-60 mt-1">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </p>
        </div>
        
        {/* Admin Actions */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPin}>
                <Pin className="h-4 w-4 mr-2" />
                {message.is_pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
};

export default SacredCircles;
