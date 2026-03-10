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
