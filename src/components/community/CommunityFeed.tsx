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

const SEEDED_REFLECTIONS = [
  { id: 'seed-1', title: 'One word check-in', body: 'What word describes your inner weather today?' },
  { id: 'seed-2', title: 'Gentle win', body: 'What is one small thing you did for yourself recently?' },
  { id: 'seed-3', title: 'Evening softness', body: 'Before sleep: place one hand on your heart and breathe once.' },
];

const CommunityFeed = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasAvatar } = useProfile();
  const { isAdmin } = useAdminRole();
  const { posts, isLoading, likePost, fetchPosts } = useCommunity();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

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
        <h1 className="text-2xl font-semibold text-white">Community</h1>
        <p className="text-sm text-white/60 mt-1">
          A shared space to connect, reflect, and grow together.
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

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="space-y-4">
            {/* Empty state message */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white/80 text-sm">
                {isAdmin 
                  ? "Share your first reflection or go live to start the conversation."
                  : "No posts yet. Admins will share reflections and updates here soon."}
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
                    onClick={() => toast({ title: 'Coming soon', description: 'Reply will be available soon.' })}
                  >
                    Reply
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
              <p className="text-sm font-medium text-foreground">{comment.profile?.full_name || 'Anonymous'}</p>
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
