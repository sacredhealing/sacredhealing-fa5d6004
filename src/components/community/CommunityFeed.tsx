import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, usePostComments } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AvatarRequiredAlert } from './AvatarRequiredAlert';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import AdminPostCreator from './AdminPostCreator';
import RichMediaPost from './RichMediaPost';
import LiveStreamList from './LiveStreamList';
import AdminGoLive from './AdminGoLive';
import { useDiaryEntries } from '@/features/community/useDiaryEntries';

const CommunityFeed = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasAvatar } = useProfile();
  const { isAdmin } = useAdminRole();
  const { posts, isLoading, likePost, fetchPosts } = useCommunity();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const diaryEntries = useDiaryEntries();

  const SEEDED_REFLECTIONS = [
    { id: 'seed-1', title: t('community.seededReflections.oneWordCheckIn.title'), body: t('community.seededReflections.oneWordCheckIn.body') },
    { id: 'seed-2', title: t('community.seededReflections.gentleWin.title'), body: t('community.seededReflections.gentleWin.body') },
    { id: 'seed-3', title: t('community.seededReflections.eveningSoftness.title'), body: t('community.seededReflections.eveningSoftness.body') },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Community title */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-white">{t('community.title')}</h1>
        <p className="text-sm text-white/60 mt-1">
          {t('community.subtitle')}
        </p>
      </div>

      {/* Live Indicator Banner - Prominent when admins are live */}
      <LiveStreamList />

      {/* Avatar Required Alert */}
      {user && !hasAvatar && (
        <AvatarRequiredAlert onUploadClick={() => setProfileEditOpen(true)} />
      )}

      {/* Admin Go Live Button - Only for admins */}
      {isAdmin && (
        <AdminGoLive />
      )}

      {/* Admin Post Creator - Only visible to admins */}
      {isAdmin && (
        <AdminPostCreator onPostCreated={fetchPosts} />
      )}

      {/* ===================== */}
      {/* ADMIN DIARY SECTION */}
      {/* ===================== */}
      {diaryEntries.length > 0 && (
        <section className="mb-8 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-white/40 px-1">
            {t('community.diary.fromTheSpace', 'From the Space')}
          </h2>

          {diaryEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {entry.title}
                  </span>
                  {entry.type === "daily" && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                      {t('community.diary.today', 'Today')}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-white/40">
                  {entry.type}
                </span>
              </div>

              <p className="text-sm text-white/70 leading-relaxed">
                {entry.body}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-white/30">
                  {t('community.diary.sharedBy', 'Shared by the Sacred Healing team')}
                </span>

                <button 
                  className="text-xs text-purple-400 hover:text-purple-300 transition"
                  onClick={() => toast({ 
                    title: t('community.comingSoon'), 
                    description: t('community.replyAvailableSoon') 
                  })}
                >
                  {t('community.diary.comment', 'Comment')}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="space-y-4">
            {/* Empty state message */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white/80 text-sm">
                {isAdmin 
                  ? t('community.emptyStateAdmin')
                  : t('community.emptyStateMember')}
              </p>
            </div>
            
            {/* Seeded reflections for empty state */}
            {SEEDED_REFLECTIONS.map((item) => (
              <Card key={item.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{item.body}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-white/20 text-white/80 hover:bg-white/10"
                    onClick={() => toast({ title: t('community.comingSoon'), description: t('community.replyAvailableSoon') })}
                  >
                    {t('community.reply')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          posts.map((post) => (
            <RichMediaPost
              key={post.id}
              post={post}
              onLike={likePost}
              onToggleComments={(postId) =>
                setExpandedPost(expandedPost === postId ? null : postId)
              }
              isCommentsOpen={expandedPost === post.id}
              hasAvatar={hasAvatar}
            >
              <PostComments
                postId={post.id}
                onCommentAdded={fetchPosts}
                hasAvatar={hasAvatar}
              />
            </RichMediaPost>
          ))
        )}
      </div>

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

const PostComments = ({ postId, onCommentAdded, hasAvatar }: { postId: string; onCommentAdded: () => void; hasAvatar: boolean }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { comments, isLoading, addComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting || !hasAvatar) return;
    setIsSubmitting(true);
    const success = await addComment(newComment.trim());
    if (success) {
      setNewComment('');
      onCommentAdded();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      {user && hasAvatar && (
        <div className="flex gap-2">
          <Input
            placeholder={t('community.writeComment')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">{t('community.noComments')}</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {comment.profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted rounded-lg p-2">
              <p className="text-sm font-medium text-foreground">{comment.profile?.full_name || t('community.anonymous')}</p>
              <p className="text-sm text-foreground">{comment.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CommunityFeed;
