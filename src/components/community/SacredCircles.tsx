import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSacredCircles, useCircleMessages, SacredCircle, CircleMessage } from '@/hooks/useSacredCircles';
import { useCommunityPolls, type CommunityPoll } from '@/hooks/useCommunityPolls';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStargateAccess } from '@/hooks/useStargateAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Send, Loader2, Users, Lock, Crown, Sparkles, 
  MessageCircle, Pin, Trash2, MoreVertical, Heart, ExternalLink, DoorOpen 
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
  const { isStargateMember } = useStargateAccess();
  const [selectedCircle, setSelectedCircle] = useState<SacredCircle | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const handleSelectCircle = async (circle: SacredCircle) => {
    if (circle.type === 'andlig' && circle.invite_link) {
      window.open(circle.invite_link, '_blank');
      return;
    }
    if (circle.type === 'stargate' && !isStargateMember) return;
    // Fallback Stargate (no DB room yet): show card only; don't open chat
    if (circle.type === 'stargate' && circle.id === 'fallback-stargate') return;
    if (!canAccessCircle(circle) && circle.type !== 'stargate') return;

    if (circle.type !== 'andlig' && !circle.is_member && user) {
      await joinCircle(circle.id);
    }

    if (circle.type !== 'andlig') setSelectedCircle(circle);
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
  const andligCircles = circles.filter(c => c.type === 'andlig');
  const stargateCircles = circles.filter(c => c.type === 'stargate');

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

      {/* Andlig Transformation: Open to all active subscribers — Open Invite Link */}
      {andligCircles.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-cyan-500" />
            Andlig Transformation
          </h3>
          {andligCircles.map(circle => (
            <Card
              key={circle.id}
              className={`bg-card border-border transition-all duration-200 ${
                hasPremium ? 'cursor-pointer hover:bg-accent/50 hover:border-cyan-500/30' : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => hasPremium && circle.invite_link && window.open(circle.invite_link, '_blank')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{circle.name}</h3>
                    {circle.intention && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{circle.intention}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Open to all active subscribers</p>
                  </div>
                  {hasPremium && circle.invite_link ? (
                    <Button size="sm" variant="outline" className="shrink-0 gap-1">
                      <ExternalLink className="h-4 w-4" />
                      Open Invite Link
                    </Button>
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Stargate Community: Restricted — Enter Private Chat */}
      {stargateCircles.length > 0 && isStargateMember && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Crown className="h-5 w-5 text-amber-500" />
            Stargate Community
          </h3>
          {stargateCircles.map(circle => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onSelect={handleSelectCircle}
              canAccess={true}
              actionLabel="Enter Private Chat"
              actionIcon={<DoorOpen className="h-4 w-4" />}
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
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

const CircleCard = ({ circle, onSelect, canAccess, actionLabel, actionIcon }: CircleCardProps) => {
  const getCircleIcon = () => {
    switch (circle.type) {
      case 'guide': return <Sparkles className="h-6 w-6 text-primary" />;
      case 'path': return <MessageCircle className="h-6 w-6 text-blue-500" />;
      case 'stargate': return <Crown className="h-6 w-6 text-amber-500" />;
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
          {canAccess && actionLabel && (
            <Button size="sm" variant="outline" className="shrink-0 gap-1">
              {actionIcon}
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/** Poll card with percentage bars (soft feedback style) */
const CommunityPollCard = ({ poll, onVote }: { poll: CommunityPoll; onVote: (pollId: string, optionId: string) => Promise<boolean> }) => {
  const [voting, setVoting] = useState(false);
  const hasVoted = !!poll.user_vote_option_id;

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting) return;
    setVoting(true);
    await onVote(poll.id, optionId);
    setVoting(false);
  };

  return (
    <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-3xl my-4">
      <h3 className="text-sm font-medium mb-4 text-foreground">{poll.question}</h3>
      <div className="space-y-3">
        {poll.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleVote(option.id)}
            disabled={hasVoted || voting}
            className="w-full relative h-12 bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all disabled:opacity-80 disabled:cursor-default"
          >
            <div
              className="absolute inset-0 bg-cyan-500/10 transition-all duration-1000"
              style={{ width: `${option.percentage ?? 0}%` }}
            />
            <div className="relative flex justify-between px-4 items-center h-full text-xs text-foreground">
              <span>{option.text}</span>
              <span className="opacity-50">{option.percentage ?? 0}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
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
  const { polls, vote, createPoll, isAdmin: isPollAdmin } = useCommunityPolls(circle.id);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

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
    <div className="flex flex-col h-[calc(100vh-250px)] rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 p-4">
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
        {isPollAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowCreatePoll(true)}>
            Create poll
          </Button>
        )}
      </div>

      {/* Create Poll Dialog */}
      {showCreatePoll && (
        <Card className="mb-4 p-4 bg-card border-border">
          <h4 className="font-medium mb-2">New poll</h4>
          <Input
            placeholder="Question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            className="mb-2"
          />
          {[0, 1, 2, 3].map((i) => (
            <Input
              key={i}
              placeholder={`Option ${i + 1}`}
              value={pollOptions[i] ?? ''}
              onChange={(e) => {
                const next = [...pollOptions];
                next[i] = e.target.value;
                setPollOptions(next);
              }}
              className="mb-2"
            />
          ))}
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={async () => {
                const opts = pollOptions.filter(Boolean);
                if (pollQuestion.trim() && opts.length >= 2 && opts.length <= 4) {
                  await createPoll(pollQuestion.trim(), opts);
                  setPollQuestion('');
                  setPollOptions(['', '']);
                  setShowCreatePoll(false);
                }
              }}
            >
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreatePoll(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Community Polls */}
      {polls.length > 0 && (
        <div className="mb-4 space-y-4">
          {polls.map((poll) => (
            <CommunityPollCard key={poll.id} poll={poll} onVote={vote} />
          ))}
        </div>
      )}

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
              <Card key={msg.id} className="bg-cyan-500/5 border-cyan-500/30 border">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Pin className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{msg.profile?.full_name || 'Guide'}</p>
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
