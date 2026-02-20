import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunity, usePostComments } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Loader2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { AvatarRequiredAlert } from './AvatarRequiredAlert';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import AdminPostCreator from './AdminPostCreator';
import RichMediaPost from './RichMediaPost';
import LiveStreamList from './LiveStreamList';
import AdminGoLive from './AdminGoLive';
import AdminDiaryCreator from './AdminDiaryCreator';
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
  const [diaryRefreshKey, setDiaryRefreshKey] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const { entries: diaryEntries, isLoading: diaryLoading } = useDiaryEntries(diaryRefreshKey);

  const handleDiaryCreated = () => setDiaryRefreshKey(prev => prev + 1);

  const SEEDED_REFLECTIONS = [
    { id: 'seed-1', title: t('community.seededReflections.oneWordCheckIn.title'), body: t('community.seededReflections.oneWordCheckIn.body') },
    { id: 'seed-2', title: t('community.seededReflections.gentleWin.title'), body: t('community.seededReflections.gentleWin.body') },
    { id: 'seed-3', title: t('community.seededReflections.eveningSoftness.title'), body: t('community.seededReflections.eveningSoftness.body') },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-semibold text-white">{t('community.title', 'Community')}</h1>
        <p className="text-sm text-white/50 mt-1">{t('community.subtitle', 'A shared space to connect, reflect, and grow together.')}</p>
      </div>

      {/* Avatar alert */}
      {user && !hasAvatar && (
        <AvatarRequiredAlert onUploadClick={() => setProfileEditOpen(true)} />
      )}

      {/* Live streams — shown prominently but only when live */}
      <LiveStreamList />

      {/* Admin tools — collapsed behind a subtle toggle */}
      {isAdmin && (
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <button
            onClick={() => setAdminOpen(!adminOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-white/40 hover:text-white/70 hover:bg-white/5 transition text-sm"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Admin tools</span>
            </div>
            {adminOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {adminOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/8 pt-3">
              <AdminGoLive />
              <AdminPostCreator onPostCreated={fetchPosts} />
              <AdminDiaryCreator onDiaryCreated={handleDiaryCreated} />
            </div>
          )}
        </div>
      )}

      {/* Diary entries — warm intimate cards */}
      {!diaryLoading && diaryEntries.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-white/30 px-1">
            {t('community.diary.fromTheSpace', 'From the Space')}
          </p>
          {diaryEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-950/30 via-orange-950/20 to-black/40 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-amber-100/90">{entry.title}</span>
                {entry.type === 'daily' && (
                  <span className="text-[10px] bg-amber-500/15 text-amber-300/80 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {t('community.diary.today', 'Today')}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/65 leading-relaxed">{entry.body}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-white/25">
                  {t('community.diary.sharedBy', 'Sacred Healing team')}
                </span>
                <button
                  className="text-xs text-amber-400/60 hover:text-amber-300 transition"
                  onClick={() => toast({ title: t('community.comingSoon'), description: t('community.replyAvailableSoon') })}
                >
                  {t('community.diary.comment', 'Reflect')} 🙏
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Posts feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="space-y-3">
            {/* Warm empty state */}
            <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-violet-950/20 to-black/40 p-6 text-center">
              <p className="text-2xl mb-2">🙏</p>
              <p className="text-white/70 text-sm leading-relaxed">
                {isAdmin ? t('community.emptyStateAdmin') : t('community.emptyStateMember')}
              </p>
            </div>

            {/* Seeded reflections */}
            {SEEDED_REFLECTIONS.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <h3 className="font-medium text-white/90 text-sm">{item.title}</h3>
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed">{item.body}</p>
                <button
                  className="mt-3 text-xs text-violet-400/70 hover:text-violet-300 transition"
                  onClick={() => toast({ title: t('community.comingSoon'), description: t('community.replyAvailableSoon') })}
                >
                  {t('community.reply', 'Reflect')} ✨
                </button>
              </div>
            ))}
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden"
            >
              <RichMediaPost
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
            </div>
          ))
        )}
      </div>

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

const PostComments = ({
  postId,
  onCommentAdded,
  hasAvatar,
}: {
  postId: string;
  onCommentAdded: () => void;
  hasAvatar: boolean;
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { comments, isLoading, addComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting || !hasAvatar) return;
    setIsSubmitting(true);
    const success = await addComment(newComment.trim());
    if (success) { setNewComment(''); onCommentAdded(); }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-3 border-t border-white/8 pt-4 px-4 pb-4">
      {user && hasAvatar && (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition"
            placeholder={t('community.writeComment', 'Share a reflection...')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="w-9 h-9 rounded-xl bg-violet-600/40 hover:bg-violet-600/60 text-white flex items-center justify-center transition disabled:opacity-30"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-white/30" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-white/30 text-center py-2">{t('community.noComments', 'No reflections yet')}</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-7 w-7 border border-white/10 flex-shrink-0">
              <AvatarImage src={comment.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-violet-900/40 text-white text-xs">
                {comment.profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-white/[0.04] rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-white/70 mb-0.5">{comment.profile?.full_name || t('community.anonymous')}</p>
              <p className="text-sm text-white/80 leading-relaxed">{comment.content}</p>
              <p className="text-[10px] text-white/30 mt-1">
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
