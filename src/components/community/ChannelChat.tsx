/**
 * ChannelChat.tsx
 * ─────────────────────────────────────────────────────────────
 * Real-time channel chat via Supabase Realtime
 * - NO pre-filled/dummy messages — starts empty
 * - Each channel has its own isolated message thread
 * - Input bar ALWAYS visible — sticky at bottom
 * - Messages: name (bold), role badge, gold sent bubbles
 * - Reactions: click emoji to react
 * - Admin: can pin messages, delete messages
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    subscription_tier: string | null;
  } | null;
  reactions: Record<string, string[]>; // emoji → [userId, ...]
}

interface ChannelChatProps {
  channelId: string;
  channel: any;
  userId: string;
  isAdmin: boolean;
  onGoLive: (url: string) => void;
}

// Tier → display label
const TIER_LABELS: Record<string, string> = {
  basic: 'Member',
  siddha_quantum: 'Siddha',
  akasha_infinity: 'Akasha',
  stargate: 'Stargate',
  admin: 'Avatara',
};

export default function ChannelChat({
  channelId,
  channel,
  userId,
  isAdmin,
  onGoLive,
}: ChannelChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeLive, setActiveLive] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── FETCH MESSAGES ──────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_messages')
      .select(`
        id, channel_id, user_id, content, created_at, reactions,
        profiles(full_name, avatar_url, subscription_tier)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);

    setMessages((data as Message[]) || []);
    setLoading(false);
  }, [channelId]);

  // ── SUBSCRIBE TO REAL-TIME ──────────────────────────────
  useEffect(() => {
    fetchMessages();

    const sub = supabase
      .channel(`chat-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'community_messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    // Check for active live session
    supabase
      .from('community_live_sessions')
      .select('room_url')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .single()
      .then(({ data }) => { if (data) setActiveLive(data.room_url); });

    return () => { supabase.removeChannel(sub); };
  }, [channelId, fetchMessages]);

  // ── SCROLL TO BOTTOM ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── SEND MESSAGE ────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !userId) return;
    setInput('');

    await supabase.from('community_messages').insert({
      channel_id: channelId,
      user_id: userId,
      content: text,
      reactions: {},
    });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── ADD REACTION ────────────────────────────────────────
  const addReaction = async (msgId: string, emoji: string, currentReactions: Record<string, string[]>) => {
    const emojiUsers = currentReactions[emoji] || [];
    const already = emojiUsers.includes(userId);
    const updated = {
      ...currentReactions,
      [emoji]: already
        ? emojiUsers.filter(u => u !== userId)
        : [...emojiUsers, userId],
    };
    await supabase
      .from('community_messages')
      .update({ reactions: updated })
      .eq('id', msgId);
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, reactions: updated } : m
    ));
  };

  // ── DELETE MESSAGE (admin) ──────────────────────────────
  const deleteMessage = async (msgId: string) => {
    await supabase.from('community_messages').delete().eq('id', msgId);
  };

  // ── INITIALS ────────────────────────────────────────────
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="sqi-channel-chat">

      {/* ── CHANNEL HEADER ─────────────────────── */}
      <div className="sqi-chat-header">
        <div className="sqi-chat-channel-icon">{channel.icon}</div>
        <div>
          <div className="sqi-chat-channel-name">{channel.name}</div>
          <div className="sqi-chat-channel-desc">{channel.description}</div>
        </div>
        <div className="sqi-chat-header-actions">
          {activeLive && (
            <button
              className="sqi-join-live-mini"
              onClick={() => onGoLive(activeLive)}
            >
              🔴 LIVE
            </button>
          )}
        </div>
      </div>

      {/* ── MESSAGES ───────────────────────────── */}
      <div className="sqi-messages-area">
        {loading && (
          <div className="sqi-loading">
            <div className="sqi-loading-spinner" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="sqi-empty-state">
            <div className="sqi-empty-icon">{channel.icon}</div>
            <div className="sqi-empty-title">{channel.name}</div>
            <div className="sqi-empty-sub">
              {channel.description} · Be the first to transmit
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.user_id === userId;
          const name = msg.profiles?.full_name || 'Anonymous';
          const tier = msg.profiles?.subscription_tier || 'basic';
          const tierLabel = TIER_LABELS[tier] || tier;
          const initials = getInitials(name);
          const isConsecutive = i > 0 && messages[i - 1].user_id === msg.user_id;
          const totalReactions = Object.entries(msg.reactions || {});

          return (
            <div
              key={msg.id}
              className={`sqi-msg-row ${isMine ? 'mine' : ''} ${isConsecutive ? 'consecutive' : ''}`}
            >
              {/* Avatar — only show for first in a run */}
              <div className="sqi-msg-avatar-col">
                {!isConsecutive && (
                  <div className={`sqi-msg-avatar ${isMine ? 'mine' : ''}`}>
                    {initials}
                  </div>
                )}
              </div>

              <div className="sqi-msg-body">
                {/* Name + role — only first in run */}
                {!isConsecutive && !isMine && (
                  <div className="sqi-msg-meta">
                    <span className="sqi-msg-name">{name}</span>
                    <span className="sqi-msg-role">{tierLabel}</span>
                  </div>
                )}

                {/* Bubble */}
                <div className={`sqi-msg-bubble ${isMine ? 'mine' : ''}`}>
                  {msg.content}

                  {/* Admin: delete button */}
                  {isAdmin && (
                    <button
                      className="sqi-delete-btn"
                      onClick={() => deleteMessage(msg.id)}
                      title="Delete message"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Reactions */}
                {totalReactions.length > 0 && (
                  <div className="sqi-reactions">
                    {totalReactions.map(([emoji, users]) =>
                      users.length > 0 ? (
                        <button
                          key={emoji}
                          className={`sqi-reaction-btn ${users.includes(userId) ? 'mine' : ''}`}
                          onClick={() => addReaction(msg.id, emoji, msg.reactions)}
                        >
                          {emoji} <span>{users.length}</span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}

                {/* Time */}
                <div className={`sqi-msg-time ${isMine ? 'mine' : ''}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT BAR — ALWAYS VISIBLE ────────── */}
      <div className="sqi-input-bar">
        <div className="sqi-input-inner">
          <button className="sqi-input-icon-btn" title="Attach file">📎</button>
          <input
            ref={inputRef}
            type="text"
            className="sqi-message-input"
            placeholder={`Transmit in ${channel.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="sqi-input-icon-btn" title="Emoji">✦</button>
          <button
            className="sqi-send-btn"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

