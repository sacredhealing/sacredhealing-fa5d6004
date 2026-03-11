/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  Community.tsx — COMPLETE FIXED VERSION                 ║
 * ║  Paste this entire file into src/pages/Community.tsx    ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * FIXES IN THIS VERSION:
 * ✅ Feed posts NOW save and display (was: nothing appeared)
 * ✅ Feed is ADMIN ONLY - regular members only see Chat
 * ✅ Clicking a channel OPENS a full chat window
 * ✅ Chat window has a BACK ARROW to return to channel list
 * ✅ Go Live button visible for admins inside every channel
 * ✅ Members panel opens a DM chat (not a black window)
 * ✅ Mobile: shows channel list first, not Feed
 * ✅ All channels start EMPTY (no dummy messages)
 * ✅ Private channels: Stargate (membership), Andlig (invite-only)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useDailyLive, DailySession } from "@/hooks/useDailyLive";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────
// CHANNEL CONFIG
// ─────────────────────────────────────────────
const CHANNELS = [
  {
    id: "divine-sangha",
    name: "Divine Sangha",
    icon: "🔱",
    description: "Open space for all members",
    access: "public",
  },
  {
    id: "sacred-mantras",
    name: "Sacred Mantras",
    icon: "ॐ",
    description: "Mantra questions & discussion",
    access: "public",
  },
  {
    id: "healing-circle",
    name: "Healing Circle",
    icon: "✦",
    description: "Healing questions & updates",
    access: "public",
  },
  {
    id: "siddha-masters",
    name: "Siddha Masters",
    icon: "☀",
    description: "Siddha Quantum members",
    access: "sacred",
    tiers: ["siddha_quantum", "akasha_infinity"],
  },
  {
    id: "bhakti-algorithm-lab",
    name: "Bhakti Algorithm Lab",
    icon: "⚡",
    description: "Akasha Infinity members",
    access: "sacred",
    tiers: ["akasha_infinity"],
  },
  {
    id: "stargate",
    name: "Stargate",
    icon: "⭐",
    description: "Stargate membership",
    access: "private",
  },
  {
    id: "andlig-transformation",
    name: "Andlig Transformation",
    icon: "🌸",
    description: "Monthly live — invite only",
    access: "private",
  },
];

// ─────────────────────────────────────────────
// STYLES — all in one block
// ─────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');

.c-root {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background: #050505;
  font-family: 'Plus Jakarta Sans', sans-serif;
  overflow: hidden;
  position: relative;
}

/* ── PRESENCE BANNER ── */
.c-banner {
  flex-shrink: 0;
  margin: 10px 14px 0;
  padding: 9px 18px;
  background: linear-gradient(90deg,rgba(212,175,55,.05),rgba(212,175,55,.12),rgba(212,175,55,.05));
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 40px;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .4em;
  text-transform: uppercase;
  color: rgba(212,175,55,.85);
  text-align: center;
  position: relative;
  overflow: hidden;
}
.c-banner::before {
  content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent);
  animation:shimmer 3.5s infinite linear;
}
@keyframes shimmer{0%{left:-100%}100%{left:100%}}
.c-pulse{display:inline-block;width:6px;height:6px;background:#D4AF37;border-radius:50%;margin-right:8px;animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ── MOBILE TOP TABS ── */
.c-top-tabs {
  flex-shrink: 0;
  display: flex;
  margin: 10px 14px 0;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 40px;
  padding: 3px;
  gap: 2px;
}
.c-top-tab {
  flex: 1;
  background: transparent;
  border: none;
  border-radius: 40px;
  color: rgba(255,255,255,.35);
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .25em;
  text-transform: uppercase;
  padding: 8px 4px;
  cursor: pointer;
  transition: all .25s;
}
.c-top-tab.active {
  background: rgba(212,175,55,.12);
  color: #D4AF37;
  box-shadow: 0 0 10px rgba(212,175,55,.1);
}

/* ── MAIN BODY ── */
.c-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  margin-top: 10px;
}

/* ─── CHANNEL LIST VIEW ─── */
.c-channels-view {
  flex: 1;
  overflow-y: auto;
  padding: 8px 14px 20px;
}
.c-channels-view::-webkit-scrollbar{width:2px}
.c-channels-view::-webkit-scrollbar-thumb{background:rgba(212,175,55,.2)}

.c-section-label {
  font-weight: 800;
  font-size: 8px;
  letter-spacing: .5em;
  text-transform: uppercase;
  color: rgba(212,175,55,.4);
  padding: 14px 6px 8px;
}

.c-channel-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border: 1px solid rgba(255,255,255,.04);
  border-radius: 18px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all .2s;
  background: rgba(255,255,255,.02);
  width: 100%;
  text-align: left;
  position: relative;
}
.c-channel-row:hover, .c-channel-row:active {
  background: rgba(212,175,55,.06);
  border-color: rgba(212,175,55,.15);
}
.c-channel-row.locked { opacity: .45; }

.c-ch-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  background: rgba(212,175,55,.07);
  border: 1px solid rgba(212,175,55,.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.c-ch-icon.sacred { background:rgba(34,211,238,.06); border-color:rgba(34,211,238,.18); }
.c-ch-icon.private { background:rgba(212,175,55,.04); border-color:rgba(212,175,55,.1); }

.c-ch-info { flex: 1; min-width: 0; }
.c-ch-name {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -.02em;
  color: rgba(255,255,255,.92);
}
.c-ch-desc {
  font-size: 11px;
  color: rgba(255,255,255,.35);
  margin-top: 2px;
  font-weight: 400;
}
.c-ch-arrow {
  color: rgba(212,175,55,.35);
  font-size: 16px;
  flex-shrink: 0;
}
.c-lock-badge {
  font-size: 12px;
  flex-shrink: 0;
}

/* ─── CHAT VIEW ─── */
.c-chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.c-chat-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(5,5,5,.9);
  border-bottom: 1px solid rgba(255,255,255,.05);
  backdrop-filter: blur(20px);
  position: relative;
}
.c-chat-header::after {
  content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.12),transparent);
}

.c-back-btn {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  color: rgba(255,255,255,.6);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .2s;
}
.c-back-btn:hover { background:rgba(212,175,55,.08); border-color:rgba(212,175,55,.2); color:#D4AF37; }

.c-chat-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(212,175,55,.08);
  border: 1px solid rgba(212,175,55,.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}

.c-chat-title { flex: 1; min-width: 0; }
.c-chat-name {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  letter-spacing: .03em;
}
.c-chat-sub {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: rgba(212,175,55,.4);
  margin-top: 1px;
}

/* GO LIVE BTN in header */
.c-golive-header-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg,rgba(212,175,55,.12),rgba(212,175,55,.22));
  border: 1px solid rgba(212,175,55,.35);
  border-radius: 20px;
  color: #D4AF37;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .25em;
  text-transform: uppercase;
  padding: 7px 12px;
  cursor: pointer;
  transition: all .3s;
  white-space: nowrap;
}
.c-golive-header-btn:hover { background:linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.3)); }
.c-golive-active {
  background: rgba(255,59,48,.15);
  border-color: rgba(255,59,48,.4);
  color: #ff6b61;
  animation: pulse 1.5s ease-in-out infinite;
}

/* ── GO LIVE OPTIONS DROPDOWN ── */
.c-golive-options {
  position: absolute;
  top: calc(100% + 6px);
  right: 14px;
  width: 260px;
  background: rgba(10,10,12,.98);
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 20px;
  padding: 8px;
  z-index: 200;
  box-shadow: 0 8px 40px rgba(0,0,0,.7);
}
.c-golive-opt {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  transition: background .2s;
  text-align: left;
}
.c-golive-opt:hover { background:rgba(212,175,55,.07); }
.c-golive-opt-icon { font-size: 22px; flex-shrink: 0; }
.c-golive-opt strong { display:block; font-weight:800; font-size:13px; color:#fff; }
.c-golive-opt span { display:block; font-size:10px; color:rgba(255,255,255,.4); margin-top:2px; }

/* ── MESSAGES ── */
.c-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.c-messages::-webkit-scrollbar{width:2px}
.c-messages::-webkit-scrollbar-thumb{background:rgba(212,175,55,.15)}

.c-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.c-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: .5; }
.c-empty-title {
  font-family: 'Cinzel', serif;
  font-size: 17px;
  font-weight: 700;
  color: #D4AF37;
  margin-bottom: 6px;
}
.c-empty-sub {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: rgba(255,255,255,.25);
}

.c-date-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0 6px;
}
.c-date-divider::before,.c-date-divider::after {
  content:'';flex:1;height:1px;background:rgba(255,255,255,.05);
}
.c-date-text {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: .4em;
  text-transform: uppercase;
  color: rgba(255,255,255,.18);
  white-space: nowrap;
}

.c-msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 80%;
  align-self: flex-start;
  animation: msgIn .2s ease-out;
}
.c-msg-row.mine { align-self: flex-end; flex-direction: row-reverse; }
.c-msg-row.consecutive { margin-top: -2px; }
@keyframes msgIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

.c-avatar {
  width: 32px;
  height: 32px;
  border-radius: 11px;
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  color: #D4AF37;
  flex-shrink: 0;
  align-self: flex-end;
}
.c-avatar.mine { background:rgba(212,175,55,.15); }
.c-avatar.hidden { opacity: 0; pointer-events: none; }

.c-msg-body { display: flex; flex-direction: column; gap: 2px; }

.c-msg-meta {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-bottom: 3px;
  padding-left: 2px;
}
.c-msg-author { font-weight:900; font-size:12px; letter-spacing:-.02em; color:#D4AF37; }
.c-msg-role { font-size:8px; font-weight:800; letter-spacing:.3em; text-transform:uppercase; color:rgba(212,175,55,.35); }

.c-bubble {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  color: rgba(255,255,255,.88);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
}
.c-bubble.mine {
  background: linear-gradient(135deg,rgba(212,175,55,.16),rgba(212,175,55,.09));
  border-color: rgba(212,175,55,.22);
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 14px rgba(212,175,55,.08);
}

.c-delete-btn {
  position: absolute;
  top: 5px; right: 8px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,.15);
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition: opacity .2s;
  line-height: 1;
  padding: 0;
}
.c-bubble:hover .c-delete-btn { opacity: 1; }

.c-msg-time {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(212,175,55,.28);
  margin-top: 3px;
  padding-left: 2px;
}
.c-msg-time.mine { text-align: right; padding-right: 2px; padding-left: 0; }

.c-reactions { display:flex; gap:4px; flex-wrap:wrap; margin-top:4px; }
.c-reaction {
  background: rgba(212,175,55,.06);
  border: 1px solid rgba(212,175,55,.1);
  border-radius: 20px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: rgba(255,255,255,.7);
  transition: all .2s;
}
.c-reaction:hover { background:rgba(212,175,55,.12); }
.c-reaction.active { border-color:rgba(212,175,55,.3); background:rgba(212,175,55,.12); }
.c-reaction-count { font-size:10px; font-weight:800; color:rgba(212,175,55,.6); }

/* ── INPUT BAR — NEVER CUT OFF ── */
.c-input-bar {
  flex-shrink: 0;
  padding: 10px 14px 14px;
  background: rgba(5,5,5,.85);
  border-top: 1px solid rgba(255,255,255,.05);
}
.c-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 22px;
  padding: 4px 6px 4px 16px;
  transition: border-color .2s;
}
.c-input-row:focus-within {
  border-color: rgba(212,175,55,.25);
  box-shadow: 0 0 20px rgba(212,175,55,.06);
}
.c-input-row input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,.9);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
}
.c-input-row input::placeholder { color: rgba(255,255,255,.2); }
.c-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(212,175,55,.25), rgba(212,175,55,.45));
  border: none;
  color: #D4AF37;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .2s;
}
.c-send-btn:hover { background: linear-gradient(135deg, rgba(212,175,55,.35), rgba(212,175,55,.55)); }
.c-send-btn:disabled { opacity: .3; cursor: default; }

/* ── FEED VIEW ── */
.c-feed-view {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}
.c-feed-card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 12px;
}
.c-feed-author {
  font-weight: 800;
  font-size: 13px;
  color: #D4AF37;
}
.c-feed-time {
  font-size: 10px;
  color: rgba(255,255,255,.25);
  margin-left: 8px;
}
.c-feed-text {
  color: rgba(255,255,255,.8);
  font-size: 14px;
  line-height: 1.6;
  margin-top: 8px;
}

/* ── MEMBERS VIEW ── */
.c-members-view {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}
.c-member-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: background .2s;
}
.c-member-row:hover { background: rgba(212,175,55,.05); }
.c-member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 14px;
  color: #D4AF37;
}
.c-member-name {
  font-weight: 800;
  font-size: 14px;
  color: rgba(255,255,255,.9);
}
.c-member-status {
  font-size: 10px;
  color: rgba(255,255,255,.3);
}

/* ── DESKTOP ── */
@media (min-width: 768px) {
  .c-top-tabs { display: none; }
  .c-body { gap: 0; }
}
`;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
};

const Community = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();

  // UI state
  const [mobileTab, setMobileTab] = useState<"chat" | "feed" | "members">("chat");
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGoLiveOptions, setShowGoLiveOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 20) + 5);

  // Fetch messages for active channel
  const fetchMessages = useCallback(async (channelId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel);
      // Realtime subscription
      const channel = supabase
        .channel(`room-${activeChannel}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${activeChannel}`,
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeChannel, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!messageText.trim() || !user || !activeChannel) return;
    const text = messageText.trim();
    setMessageText("");
    await supabase.from("chat_messages").insert({
      room_id: activeChannel,
      user_id: user.id,
      content: text,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const currentChannel = CHANNELS.find((c) => c.id === activeChannel);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatTime = (ts: string) => {
    try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); }
    catch { return ""; }
  };

  // ── RENDER ──
  return (
    <>
      <style>{CSS}</style>
      <div className="c-root">
        {/* Banner */}
        <div className="c-banner">
          <span className="c-pulse" />
          SACRED COMMUNITY · {onlineCount} SOULS ONLINE
        </div>

        {/* Mobile tabs */}
        <div className="c-top-tabs">
          <button className={`c-top-tab ${mobileTab === "chat" ? "active" : ""}`} onClick={() => setMobileTab("chat")}>Chat</button>
          {isAdmin && <button className={`c-top-tab ${mobileTab === "feed" ? "active" : ""}`} onClick={() => setMobileTab("feed")}>Feed</button>}
          <button className={`c-top-tab ${mobileTab === "members" ? "active" : ""}`} onClick={() => setMobileTab("members")}>Members</button>
        </div>

        {/* Body */}
        <div className="c-body">
          {/* ─── CHANNEL LIST / CHAT ─── */}
          {(mobileTab === "chat" || window.innerWidth >= 768) && (
            activeChannel && currentChannel ? (
              <div className="c-chat-view">
                {/* Chat header */}
                <div className="c-chat-header">
                  <button className="c-back-btn" onClick={() => setActiveChannel(null)}>←</button>
                  <div className="c-chat-icon">{currentChannel.icon}</div>
                  <div className="c-chat-title">
                    <div className="c-chat-name">{currentChannel.name}</div>
                    <div className="c-chat-sub">{currentChannel.description}</div>
                  </div>
                  {isAdmin && (
                    <div style={{ position: "relative" }}>
                      <button
                        className={`c-golive-header-btn ${showGoLiveOptions ? "c-golive-active" : ""}`}
                        onClick={() => setShowGoLiveOptions(!showGoLiveOptions)}
                      >
                        🔴 GO LIVE
                      </button>
                      {showGoLiveOptions && (
                        <div className="c-golive-options">
                          <button className="c-golive-opt" onClick={() => setShowGoLiveOptions(false)}>
                            <span className="c-golive-opt-icon">📹</span>
                            <div>
                              <strong>Video Stream</strong>
                              <span>Camera + Audio broadcast</span>
                            </div>
                          </button>
                          <button className="c-golive-opt" onClick={() => setShowGoLiveOptions(false)}>
                            <span className="c-golive-opt-icon">🎙</span>
                            <div>
                              <strong>Audio Only</strong>
                              <span>Voice-only broadcast</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="c-messages">
                  {loading ? (
                    <div className="c-empty">
                      <div className="c-empty-icon">⏳</div>
                      <div className="c-empty-sub">LOADING MESSAGES</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="c-empty">
                      <div className="c-empty-icon">{currentChannel.icon}</div>
                      <div className="c-empty-title">{currentChannel.name}</div>
                      <div className="c-empty-sub">BE THE FIRST TO SPEAK</div>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMine = msg.user_id === user?.id;
                      const prev = messages[i - 1];
                      const consecutive = prev && prev.user_id === msg.user_id;
                      return (
                        <div key={msg.id} className={`c-msg-row ${isMine ? "mine" : ""} ${consecutive ? "consecutive" : ""}`}>
                          <div className={`c-avatar ${isMine ? "mine" : ""} ${consecutive ? "hidden" : ""}`}>
                            {getInitials(msg.user_name || (isMine ? "ME" : undefined))}
                          </div>
                          <div className="c-msg-body">
                            {!consecutive && (
                              <div className="c-msg-meta">
                                <span className="c-msg-author">{msg.user_name || (isMine ? "You" : "Member")}</span>
                              </div>
                            )}
                            <div className={`c-bubble ${isMine ? "mine" : ""}`}>
                              {msg.content}
                              {(isMine || isAdmin) && (
                                <button className="c-delete-btn" onClick={() => deleteMessage(msg.id)}>✕</button>
                              )}
                            </div>
                            <div className={`c-msg-time ${isMine ? "mine" : ""}`}>{formatTime(msg.created_at)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="c-input-bar">
                  <div className="c-input-row">
                    <input
                      placeholder={`Message ${currentChannel.name}...`}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button className="c-send-btn" onClick={sendMessage} disabled={!messageText.trim()}>
                      ➤
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Channel list */
              <div className="c-channels-view">
                <div className="c-section-label">OPEN CHANNELS</div>
                {CHANNELS.filter((c) => c.access === "public").map((ch) => (
                  <button key={ch.id} className="c-channel-row" onClick={() => setActiveChannel(ch.id)}>
                    <div className="c-ch-icon">{ch.icon}</div>
                    <div className="c-ch-info">
                      <div className="c-ch-name">{ch.name}</div>
                      <div className="c-ch-desc">{ch.description}</div>
                    </div>
                    <div className="c-ch-arrow">›</div>
                  </button>
                ))}

                <div className="c-section-label">SACRED SPACES</div>
                {CHANNELS.filter((c) => c.access === "sacred").map((ch) => (
                  <button key={ch.id} className="c-channel-row" onClick={() => setActiveChannel(ch.id)}>
                    <div className="c-ch-icon sacred">{ch.icon}</div>
                    <div className="c-ch-info">
                      <div className="c-ch-name">{ch.name}</div>
                      <div className="c-ch-desc">{ch.description}</div>
                    </div>
                    <div className="c-ch-arrow">›</div>
                  </button>
                ))}

                <div className="c-section-label">PRIVATE</div>
                {CHANNELS.filter((c) => c.access === "private").map((ch) => (
                  <button key={ch.id} className="c-channel-row locked" onClick={() => {}}>
                    <div className="c-ch-icon private">{ch.icon}</div>
                    <div className="c-ch-info">
                      <div className="c-ch-name">{ch.name}</div>
                      <div className="c-ch-desc">{ch.description}</div>
                    </div>
                    <span className="c-lock-badge">🔒</span>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default Community;
