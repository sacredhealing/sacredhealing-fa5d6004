import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, usePostComments } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

const CommunityFeed = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasAvatar } = useProfile();
  const { posts, isLoading, createPost, likePost, fetchPosts } = useCommunity();
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const handleSubmit = async () => {
    if (!newPost.trim() || isSubmitting || !hasAvatar) return;
    setIsSubmitting(true);
    const success = await createPost(newPost.trim());
    if (success) setNewPost('');
    setIsSubmitting(false);
  };

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

      {/* Create Post */}
      {user && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <Textarea
              placeholder={hasAvatar ? t('community.shareSomething') : t('community.uploadAvatarFirst')}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="mb-3 resize-none"
              rows={3}
              disabled={!hasAvatar}
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!newPost.trim() || isSubmitting || !hasAvatar}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {t('community.post')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t('community.noPosts')}</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="bg-card border-border">
            <CardContent className="p-4">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {post.profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{post.profile?.full_name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>

              {post.image_url && (
                <img src={post.image_url} alt="Post" className="rounded-lg mb-4 max-h-96 w-full object-cover" />
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => hasAvatar && likePost(post.id)}
                  disabled={!hasAvatar}
                  className={post.user_liked ? 'text-red-500' : 'text-muted-foreground'}
                >
                  <Heart className={`h-4 w-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
                  {post.likes_count}
                </Button>
                <Collapsible open={expandedPost === post.id} onOpenChange={(open) => setExpandedPost(open ? post.id : null)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.comments_count}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <PostComments postId={post.id} onCommentAdded={fetchPosts} hasAvatar={hasAvatar} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        ))
      )}

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
