import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, usePostComments } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdminRole } from '@/hooks/useAdminRole';
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

function getMockPosts(arrival: string) {
  const base: Record<string, string[]> = {
    Heavy: [
      "If today feels heavy, you’re not behind. You’re human.",
      "One gentle breath is enough to begin.",
      "You can read quietly. You belong here.",
    ],
    Restless: [
      "Restless days pass. Let the body settle one minute at a time.",
      "Try unclenching the jaw and softening the shoulders.",
      "You don’t need to fix anything right now.",
    ],
    Calm: [
      "If you feel calm, you can share calm just by being here.",
      "Let this steadiness stay with you.",
      "A quiet day is still a meaningful day.",
    ],
    Grateful: [
      "Gratitude is a nervous system signal: ‘I am safe enough now.’",
      "If you want, share one small thing that helped today.",
      "Your gratitude supports the whole space.",
    ],
    "Just looking": [
      "You can simply read. No pressure to post.",
      "This space is here whenever you’re ready.",
      "Take one slow breath before scrolling.",
    ],
  };

  const list = base[arrival] ?? base["Just looking"];
  return list.map((text, i) => ({
    id: `${arrival}-${i}`,
    text,
  }));
}

const CommunityFeed = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasAvatar } = useProfile();
  const { isAdmin } = useAdminRole();
  const { posts, isLoading, likePost, fetchPosts } = useCommunity();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [arrival, setArrival] = useState<string | null>(null);

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

      {/* Admin Go Live Button */}
      {isAdmin && (
        <AdminGoLive />
      )}

      {/* Live Streams */}
      <LiveStreamList />

      {/* Admin Post Creator - Only visible to admins */}
      {isAdmin && (
        <AdminPostCreator onPostCreated={fetchPosts} />
      )}

      {/* Today in the space (heartbeat) */}
      <section className="mt-4">
        <div className="text-white font-semibold">Today in the space</div>
        <div className="mt-2 grid gap-2 text-sm text-white/70">
          <div>🌿 Someone slept better after 4 days</div>
          <div>💭 A member noticed calmer reactions</div>
          <div>🌙 Evening silence gathering later</div>
        </div>
      </section>

      {/* One-tap arrival */}
      <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white font-semibold">How are you arriving today?</div>

        <div className="mt-3 flex flex-wrap gap-2">
          {["Heavy", "Restless", "Calm", "Grateful", "Just looking"].map((m) => (
            <button
              key={m}
              onClick={() => setArrival(m)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/7 transition"
            >
              {m}
            </button>
          ))}
        </div>

        {arrival ? (
          <div className="mt-4">
            <div className="text-sm text-white/60">
              Reflections for {arrival.toLowerCase()} moments
            </div>
            <div className="mt-3 grid gap-2">
              {getMockPosts(arrival).map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="text-white/80 text-sm">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Posts */}
      <div className="space-y-3">
        {/* Pinned Daily Arrival */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-white font-semibold">🌅 Daily Arrival</div>
          <div className="mt-1 text-sm text-white/60">
            Take one slow breath before reading.
            You can share one word about your day — or simply read others.
          </div>
        </div>

        {posts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                It’s a quiet moment here. You can arrive using the buttons above or check back later.
              </p>
            </CardContent>
          </Card>
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
