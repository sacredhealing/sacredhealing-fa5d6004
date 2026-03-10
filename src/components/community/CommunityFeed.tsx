/**
 * CommunityFeed.tsx  
 * ─────────────────────────────────────────────────────────────
 * Facebook-style wall:
 *  - PostComposer at top (admin + members can post)
 *  - Posts with images/text
 *  - Like, Comment, Share reactions
 *  - Comments inline under each post
 *  - Real-time via Supabase
 *
 * SHOULD YOU KEEP THE POST COMPOSER?
 * ─────────────────────────────────────────────────────────────
 * YES — here's why it's better than just chat:
 *  • Posts stay permanent and discoverable (chat scrolls away)
 *  • Great for: event announcements, mantra releases, photos
 *  • Members love seeing what you're up to (social proof)
 *  • Comments build community around each piece of content
 *  • Unlike chat, admins can pin important posts to top
 *
 * The FEED is the "wall" — Chat is for real-time conversation.
 * They serve different purposes and both belong.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes: string[]; // user IDs
  is_pinned: boolean;
  comment_count: number;
  profiles: { full_name: string | null; avatar_url: string | null; subscription_tier: string | null } | null;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export default function CommunityFeed({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // ── FETCH POSTS ─────────────────────────────────────────
  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('*, profiles(full_name, avatar_url, subscription_tier)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30);
      setPosts(data as Post[] || []);
      setLoading(false);
    };

    fetchPosts();

    // Real-time post subscription
    const sub = supabase
      .channel('community-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts',
      }, (payload) => {
        setPosts(prev => [payload.new as Post, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  // ── SUBMIT POST ─────────────────────────────────────────
  const submitPost = async () => {
    if (!composerText.trim() && !composerImage) return;
    setPosting(true);

    let imageUrl: string | null = null;

    if (composerImage) {
      const ext = composerImage.name.split('.').pop();
      const path = `community/${user?.id}/${Date.now()}.${ext}`;
      const { data: uploadData } = await supabase.storage
        .from('community-media')
        .upload(path, composerImage);
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('community-media')
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    await supabase.from('community_posts').insert({
      user_id: user?.id,
      content: composerText.trim(),
      image_url: imageUrl,
      likes: [],
      is_pinned: false,
    });

    setComposerText('');
    setComposerImage(null);
    setPosting(false);
  };

  // ── LIKE POST ────────────────────────────────────────────
  const toggleLike = async (postId: string, currentLikes: string[]) => {
    if (!user) return;
    const liked = currentLikes.includes(user.id);
    const updated = liked
      ? currentLikes.filter(id => id !== user.id)
      : [...currentLikes, user.id];
    await supabase.from('community_posts').update({ likes: updated }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updated } : p));
  };

  // ── FETCH COMMENTS ───────────────────────────────────────
  const loadComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => { const s = new Set(prev); s.delete(postId); return s; });
      return;
    }
    const { data } = await supabase
      .from('community_comments')
      .select('*, profiles(full_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(prev => ({ ...prev, [postId]: data as Comment[] || [] }));
    setExpandedComments(prev => new Set([...prev, postId]));
  };

  // ── SUBMIT COMMENT ───────────────────────────────────────
  const submitComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;
    await supabase.from('community_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    loadComments(postId);
  };

  const getInitials = (name: string | null) =>
    name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

  return (
    <div className="sqi-feed">

      {/* ── POST COMPOSER ───────────────────────── */}
      <div className="sqi-composer">
        <div className="sqi-composer-avatar">
          {getInitials(user?.user_metadata?.full_name || null)}
        </div>
        <div className="sqi-composer-right">
          <textarea
            className="sqi-composer-input"
            placeholder="Share your Prema-Pulse with the Sangha..."
            value={composerText}
            onChange={e => setComposerText(e.target.value)}
            rows={3}
          />
          {composerImage && (
            <div className="sqi-composer-image-preview">
              <img src={URL.createObjectURL(composerImage)} alt="Preview" />
              <button onClick={() => setComposerImage(null)}>×</button>
            </div>
          )}
          <div className="sqi-composer-actions">
            <button
              className="sqi-composer-media-btn"
              onClick={() => fileRef.current?.click()}
            >
              📷 Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => setComposerImage(e.target.files?.[0] || null)}
            />
            <button
              className="sqi-composer-submit"
              onClick={submitPost}
              disabled={posting || (!composerText.trim() && !composerImage)}
            >
              {posting ? 'Transmitting...' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* ── POSTS ───────────────────────────────── */}
      {loading && <div className="sqi-loading"><div className="sqi-loading-spinner" /></div>}

      {!loading && posts.length === 0 && (
        <div className="sqi-empty-state">
          <div className="sqi-empty-icon">✦</div>
          <div className="sqi-empty-title">The Wall Awaits</div>
          <div className="sqi-empty-sub">Share something with the Sangha</div>
        </div>
      )}

      {posts.map(post => {
        const isLiked = post.likes?.includes(user?.id || '');
        const commentsOpen = expandedComments.has(post.id);
        const postComments = comments[post.id] || [];
        const name = post.profiles?.full_name || 'Anonymous';

        return (
          <div key={post.id} className={`sqi-post ${post.is_pinned ? 'pinned' : ''}`}>

            {post.is_pinned && (
              <div className="sqi-pinned-label">📌 Pinned</div>
            )}

            {/* Post header */}
            <div className="sqi-post-header">
              <div className="sqi-post-avatar">{getInitials(name)}</div>
              <div className="sqi-post-author-info">
                <div className="sqi-post-author-name">{name}</div>
                <div className="sqi-post-time">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
              {isAdmin && (
                <div className="sqi-post-admin-actions">
                  <button
                    onClick={() =>
                      supabase.from('community_posts').update({ is_pinned: !post.is_pinned }).eq('id', post.id)
                        .then(() => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p)))
                    }
                  >
                    {post.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() =>
                      supabase.from('community_posts').delete().eq('id', post.id)
                        .then(() => setPosts(prev => prev.filter(p => p.id !== post.id)))
                    }
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Post content */}
            {post.content && (
              <div className="sqi-post-content">{post.content}</div>
            )}

            {/* Post image */}
            {post.image_url && (
              <div className="sqi-post-image-wrap">
                <img src={post.image_url} alt="" className="sqi-post-image" />
              </div>
            )}

            {/* Reactions row */}
            <div className="sqi-post-actions">
              <button
                className={`sqi-action-btn ${isLiked ? 'liked' : ''}`}
                onClick={() => toggleLike(post.id, post.likes || [])}
              >
                {isLiked ? '💛' : '🤍'} {post.likes?.length || 0}
              </button>
              <button
                className="sqi-action-btn"
                onClick={() => loadComments(post.id)}
              >
                💬 {post.comment_count || 0} {commentsOpen ? '▲' : '▼'}
              </button>
            </div>

            {/* Comments */}
            {commentsOpen && (
              <div className="sqi-comments">
                {postComments.map(c => (
                  <div key={c.id} className="sqi-comment">
                    <div className="sqi-comment-avatar">
                      {getInitials(c.profiles?.full_name || null)}
                    </div>
                    <div className="sqi-comment-body">
                      <span className="sqi-comment-name">{c.profiles?.full_name || 'Anonymous'}</span>
                      <span className="sqi-comment-text">{c.content}</span>
                    </div>
                  </div>
                ))}
                <div className="sqi-comment-input-row">
                  <input
                    type="text"
                    className="sqi-comment-input"
                    placeholder="Add a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') submitComment(post.id); }}
                  />
                  <button
                    className="sqi-comment-submit"
                    onClick={() => submitComment(post.id)}
                  >
                    ➤
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
                  {t('community.diary.sharedBy', 'Siddha Quantum Nexus team')}
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
                className="rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[rgba(212,175,55,0.03)] p-5 relative"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"), linear-gradient(135deg, rgba(255,255,255,0.02) 0%25, transparent 50%25)`,
                }}
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
              className="rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[rgba(212,175,55,0.03)] overflow-hidden relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"), linear-gradient(135deg, rgba(255,255,255,0.02) 0%25, transparent 50%25)`,
              }}
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
