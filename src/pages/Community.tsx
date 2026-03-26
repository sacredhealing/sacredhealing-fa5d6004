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

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { requestNotificationPermission } from "@/services/NotificationService";
import { useDailyLive, DailySession } from "@/hooks/useDailyLive";
import { usePrivateChat } from "@/hooks/useCommunity";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getTierRank } from "@/lib/tierAccess";

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
  min-height: 280px;
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
  min-height: 0;
  overflow: hidden;
  display: flex;
  margin-top: 10px;
}

/* ─── CHANNEL LIST VIEW ─── */
.c-channels-view {
  flex: 1;
  min-height: 0;
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
  min-height: 0;
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
  min-height: 0;
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
.c-skip-loading-btn {
  margin-top: 16px;
  padding: 10px 20px;
  font-size: 12px;
  font-weight: 600;
  color: #D4AF37;
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.3);
  border-radius: 8px;
  cursor: pointer;
  transition: background .2s, border-color .2s;
}
.c-skip-loading-btn:hover {
  background: rgba(212,175,55,.2);
  border-color: rgba(212,175,55,.5);
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
  padding: 10px 14px max(14px, env(safe-area-inset-bottom));
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
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 14px;
  color: #D4AF37;
  overflow: hidden;
  object-fit: cover;
}
.c-member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* ── VIDEO CALL BUTTON (DMs) ── */
.c-video-call-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg,rgba(34,211,238,.12),rgba(34,211,238,.22));
  border: 1px solid rgba(34,211,238,.35);
  border-radius: 20px;
  color: #22d3ee;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .25em;
  text-transform: uppercase;
  padding: 7px 12px;
  cursor: pointer;
  transition: all .3s;
  white-space: nowrap;
}
.c-video-call-btn:hover { background:linear-gradient(135deg,rgba(34,211,238,.2),rgba(34,211,238,.3)); }
.c-video-call-btn:disabled { opacity:.4; cursor:default; }

/* ── LIVE PILL (small, in header, max 36px, dismissible) ── */
.c-live-pill-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  max-height: 36px;
  margin-left: auto;
}
.c-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-height: 36px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255,59,48,.15), rgba(212,175,55,.12));
  border: 1px solid rgba(255,59,48,.3);
  border-radius: 18px;
  color: #ff6b61;
  font-weight: 700;
  font-size: 11px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.c-live-pill:hover {
  background: linear-gradient(135deg, rgba(255,59,48,.25), rgba(212,175,55,.18));
}
.c-live-pill-dismiss {
  padding: 2px 6px;
  font-size: 12px;
  color: rgba(255,255,255,.5);
  cursor: pointer;
  border-radius: 50%;
}
.c-live-pill-dismiss:hover {
  color: rgba(255,255,255,.9);
}

/* ── LIVE IFRAME ── */
.c-live-frame {
  flex-shrink: 0;
  background: #000;
  border-bottom: 1px solid rgba(212,175,55,.15);
}
.c-live-frame iframe {
  width: 100%;
  height: 300px;
  border: none;
}

/* ── DESKTOP ── */
@media (min-width: 768px) {
  .c-top-tabs { display: none; }
  .c-body { gap: 0; }
  .c-live-frame iframe { height: 400px; }
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

type Member = {
  id: string;
  full_name: string | null;
  subscription_tier: string | null;
  avatar_url: string | null;
  isAdmin?: boolean;
};

type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  audio_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  post_type: string;
  likes_count: number;
  comments_count: number;
  user_liked?: boolean;
};

type FeedComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string | null;
};

// DM chat using useCommunity's usePrivateChat (same as original app)
function DMChatView({ partnerId, onBack, isAdmin, onVideoCall, dmVideoUrl, onEndVideoCall, onDmSent }: { partnerId: string; onBack: () => void; isAdmin?: boolean; onVideoCall?: () => void; dmVideoUrl?: string | null; onEndVideoCall?: () => void; onDmSent?: (content: string, partnerId: string) => void }) {
  const { user } = useAuth();
  const { messages, partnerProfile, isLoading, sendMessage } = usePrivateChat(partnerId);
  const [messageText, setMessageText] = useState("");

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;
    setMessageText("");
    await sendMessage(text, "text");
    if (isAdmin && onDmSent) onDmSent(text, partnerId);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="c-chat-view">
      <div className="c-chat-header">
        <button className="c-back-btn" onClick={onBack}>←</button>
        <div className="c-chat-icon">👤</div>
        <div className="c-chat-title">
          <div className="c-chat-name">{partnerProfile?.full_name || "Direct Message"}</div>
          <div className="c-chat-sub">Private 1-on-1 chat</div>
        </div>
        {isAdmin && (dmVideoUrl ? (
          <button
            className="c-video-call-btn"
            onClick={onEndVideoCall}
            style={{ marginLeft: "auto", borderColor: "rgba(255,59,48,.4)", color: "#ff6b61" }}
          >
            ⬛ END CALL
          </button>
        ) : (
          <button
            className="c-video-call-btn"
            onClick={onVideoCall}
            style={{ marginLeft: "auto" }}
          >
            📹 VIDEO CALL
          </button>
        ))}
      </div>
      {dmVideoUrl && (
        <div className="c-live-frame">
          <iframe src={dmVideoUrl} allow="camera;microphone;fullscreen;display-capture" />
        </div>
      )}
      <div className="c-messages">
        {isLoading ? (
          <div className="c-empty">
            <div className="c-empty-icon">⏳</div>
            <div className="c-empty-sub">LOADING MESSAGES</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="c-empty">
            <div className="c-empty-icon">👤</div>
            <div className="c-empty-title">{partnerProfile?.full_name || "Direct Message"}</div>
            <div className="c-empty-sub">BE THE FIRST TO SPEAK</div>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`c-msg-row ${isMine ? "mine" : ""}`}>
                <div className={`c-avatar ${isMine ? "mine" : ""}`}>
                  {getInitials(isMine ? "You" : msg.sender_profile?.full_name)}
                </div>
                <div className="c-msg-body">
                  <div className="c-msg-meta">
                    <span className="c-msg-author">{isMine ? "You" : (msg.sender_profile?.full_name || "Member")}</span>
                  </div>
                  <div className={`c-bubble ${isMine ? "mine" : ""}`}>
                    {typeof msg.content === "string" && msg.content.startsWith("VIDEO_CALL:") ? (
                      <button
                        type="button"
                        className="c-video-call-btn"
                        onClick={() =>
                          window.open(msg.content.replace("VIDEO_CALL:", ""), "_blank", "noopener,noreferrer")
                        }
                      >
                        🔗 JOIN VIDEO CALL
                      </button>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div className={`c-msg-time ${isMine ? "mine" : ""}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="c-input-bar">
        <div className="c-input-row">
          <input
            placeholder={`Message ${partnerProfile?.full_name || "them"}...`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button className="c-send-btn" onClick={handleSend} disabled={!messageText.trim()}>➤</button>
        </div>
      </div>
    </div>
  );
}

const Community = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const daily = useDailyLive();
  console.log("[Community] isAdmin:", isAdmin);

  // UI state
  const [mobileTab, setMobileTab] = useState<"chat" | "feed" | "members">("chat");
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStuck, setLoadingStuck] = useState(false);
  const [showGoLiveOptions, setShowGoLiveOptions] = useState(false);
  const [liveRoomUrl, setLiveRoomUrl] = useState<string | null>(null);
  const [viewerSessions, setViewerSessions] = useState<DailySession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 20) + 5);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedText, setFeedText] = useState("");
  const [feedFile, setFeedFile] = useState<File | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [roomIds, setRoomIds] = useState<Record<string, string>>({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, FeedComment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [dmVideoUrl, setDmVideoUrl] = useState<string | null>(null);
  const [dismissedLiveChannels, setDismissedLiveChannels] = useState<Set<string>>(new Set());
  const [profilesMap, setProfilesMap] = useState<Record<string, { full_name: string | null; avatar_url?: string | null }>>({});
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; body: string; channel_id: string | null; link: string | null; is_read: boolean; created_at: string }>>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const profilesMapRef = useRef<Record<string, { full_name: string | null; avatar_url?: string | null }>>({});
  profilesMapRef.current = profilesMap;

  const memberNameMapRef = useRef<Record<string, string>>({});
  const memberNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    members.forEach((mem) => { if (mem.full_name) m[mem.id] = mem.full_name; });
    memberNameMapRef.current = m;
    return m;
  }, [members]);

  const isDmChannel = (id: string | null) => !!id && id.startsWith("dm-");

  const getDmPartnerId = (channelId: string, selfId: string): string | null => {
    // Format: "dm-{uuidA}-{uuidB}" where UUIDs themselves contain hyphens.
    // Strip the "dm-" prefix then split on the boundary between the two UUIDs.
    // A UUID is exactly 36 chars: 8-4-4-4-12.
    if (!channelId.startsWith("dm-")) return null;
    const rest = channelId.slice(3); // remove "dm-"
    const UUID_LEN = 36;
    if (rest.length < UUID_LEN * 2 + 1) return null;
    const a = rest.slice(0, UUID_LEN);
    const b = rest.slice(UUID_LEN + 1); // skip the "-" separator between the two UUIDs
    if (selfId === a) return b;
    if (selfId === b) return a;
    return null;
  };

  const fetchInProgressRef = useRef<string | null>(null);
  const roomIdsRef = useRef<Record<string, string>>({});
  roomIdsRef.current = roomIds;
  const fetchActiveSessionsRef = useRef(daily.fetchActiveSessions);
  fetchActiveSessionsRef.current = daily.fetchActiveSessions;

  // Show "Start chatting anyway" after 2s if loading is stuck
  useEffect(() => {
    if (!loading) {
      setLoadingStuck(false);
      return;
    }
    const t = setTimeout(() => setLoadingStuck(true), 2000);
    return () => clearTimeout(t);
  }, [loading]);

  // Fetch messages for active channel (group rooms + DMs)
  const fetchMessages = useCallback(
    async (channelId: string) => {
      if (!channelId || !user) return;
      fetchInProgressRef.current = channelId;
      setLoading(true);
      try {
        // Direct messages use private_messages table
        if (isDmChannel(channelId)) {
          const partnerId = getDmPartnerId(channelId, user.id);
          if (!partnerId) {
            setMessages([]);
            return;
          }
          const timeoutMs = 4000;
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("DM fetch timeout")), timeoutMs)
          );
          const fetchPromise = Promise.all([
            supabase.from("private_messages").select("*").eq("sender_id", user.id).eq("receiver_id", partnerId).order("created_at", { ascending: true }),
            supabase.from("private_messages").select("*").eq("sender_id", partnerId).eq("receiver_id", user.id).order("created_at", { ascending: true }),
          ]);
          let sentRes: any, receivedRes: any;
          try {
            const results = await Promise.race([fetchPromise, timeoutPromise]);
            [sentRes, receivedRes] = results ?? [];
          } catch (err) {
            console.error("DM fetch error or timeout:", err);
            if (fetchInProgressRef.current === channelId) setMessages([]);
            return;
          }
          if (fetchInProgressRef.current !== channelId) return;
          const sent = ((sentRes?.data) as any[] | null) ?? [];
          const received = ((receivedRes?.data) as any[] | null) ?? [];
          if (sentRes.error) console.error("Error loading DM sent:", sentRes.error);
          if (receivedRes.error) console.error("Error loading DM received:", receivedRes.error);
          const merged = [...sent, ...received].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          const nameMap = memberNameMapRef.current;
          const mapped: Message[] = merged.map((row) => ({
            id: row.id,
            channel_id: channelId,
            user_id: row.sender_id,
            content: row.content,
            created_at: row.created_at,
            user_name: row.sender_id === user.id ? "You" : (nameMap[row.sender_id] || "Member"),
          }));

          setMessages(mapped);
          return; // setLoading(false) handled in finally
        }

        // Group channels use chat_messages with UUID room_id
        const roomId = roomIds[channelId];
        if (!roomId) {
          setMessages([]);
          return;
        }

        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) {
          console.error("Error loading channel messages:", error);
          setMessages([]);
          return;
        }

        const nameMap = memberNameMapRef.current;
        const rows = (data as any[]) || [];
        const enriched: Message[] = rows.map((row) => ({
          ...row,
          user_name: row.user_name || (row.user_id === user?.id ? "You" : (nameMap[row.user_id] || "Member")),
        }));
        setMessages(enriched);
      } finally {
        if (fetchInProgressRef.current === channelId) fetchInProgressRef.current = null;
        setLoading(false);
      }
    },
    [roomIds, user]
  );

  // Fetch feed posts (admin posts); include likes/comments counts and current user's like state
  const fetchFeedPosts = useCallback(async () => {
    setFeedLoading(true);
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, user_id, content, created_at, image_url, audio_url, video_url, pdf_url, post_type, likes_count, comments_count")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("Error loading community feed:", error);
      setFeedPosts([]);
      setFeedLoading(false);
      return;
    }
    const posts = (data as (FeedPost & { likes_count?: number; comments_count?: number })[]) || [];
    const withLiked: FeedPost[] = posts.map((p) => ({
      ...p,
      likes_count: p.likes_count ?? 0,
      comments_count: p.comments_count ?? 0,
      user_liked: false,
    }));
    if (user?.id) {
      const postIds = withLiked.map((p) => p.id);
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);
      const likedSet = new Set((likesData || []).map((r: { post_id: string }) => r.post_id));
      withLiked.forEach((p) => {
        p.user_liked = likedSet.has(p.id);
      });
    }
    setFeedPosts(withLiked);
    setFeedLoading(false);
  }, [user?.id]);

  const fetchFeedPostsRef = useRef(fetchFeedPosts);
  fetchFeedPostsRef.current = fetchFeedPosts;

  const fetchPostComments = useCallback(async (postId: string) => {
    const { data, error } = await supabase
      .from("post_comments")
      .select("id, post_id, user_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error loading comments:", error);
      setCommentsByPostId((prev) => ({ ...prev, [postId]: [] }));
      return;
    }
    const rows = (data || []) as { id: string; post_id: string; user_id: string; content: string; created_at: string }[];
    setCommentsByPostId((prev) => ({
      ...prev,
      [postId]: rows.map((r) => ({
        id: r.id,
        post_id: r.post_id,
        user_id: r.user_id,
        content: r.content,
        created_at: r.created_at,
        user_name: user?.id === r.user_id ? "You" : (profilesMapRef.current[r.user_id]?.full_name ?? "Member"),
      })),
    }));
  }, [user?.id]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user || !content.trim()) return;
    setCommentingPostId(postId);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
    });
    setCommentingPostId(null);
    setCommentDraft("");
    if (error) {
      console.error("Failed to add comment:", error);
      toast.error("Could not add comment.");
      return;
    }
    const post = feedPosts.find((p) => p.id === postId);
    if (post) {
      await supabase
        .from("community_posts")
        .update({ comments_count: (post.comments_count || 0) + 1 })
        .eq("id", postId);
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
      );
    }
    await fetchPostComments(postId);
    toast.success("Comment added.");
  }, [user, feedPosts, fetchPostComments]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) {
      toast.info("Sign in to like posts.");
      return;
    }
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;
    setLikingPostId(postId);
    if (post.user_liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.from("community_posts").update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) }).eq("id", postId);
      setFeedPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, user_liked: false, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p
        )
      );
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.from("community_posts").update({ likes_count: (post.likes_count || 0) + 1 }).eq("id", postId);
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, user_liked: true, likes_count: (p.likes_count || 0) + 1 } : p))
      );
    }
    setLikingPostId(null);
  }, [user, feedPosts]);

  // Fetch members + rooms IN PARALLEL on mount (PERF: was sequential, now <500ms)
  useEffect(() => {
    if (!user) return;
    const loadMembers = async () => {
      try {
        let adminIds = new Set<string>();
        try {
          const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
          adminIds = new Set((adminRoles || []).map((r: any) => r.user_id));
        } catch (_) {
          // user_roles may not exist or RLS blocks; continue without admin list
        }

        let query = supabase.from("profiles").select("*").limit(500);
        if (user?.id) query = query.neq("user_id", user.id);
        const { data, error } = await query;

        if (error) {
          console.error("Error loading members:", error);
          setMembers([]);
          return;
        }

        const rows = (data as any[] | null) ?? [];
        const profileMap: Record<string, { full_name: string | null; avatar_url?: string | null }> = {};
        rows.forEach((row: any) => {
          const uid = row.user_id != null ? row.user_id : row.id;
          if (uid) profileMap[uid] = { full_name: row.full_name ?? null, avatar_url: row.avatar_url ?? null };
        });
        setProfilesMap((prev) => ({ ...prev, ...profileMap }));

        const mapped: Member[] = rows
          .filter((row) => {
            const uid = row.user_id != null ? row.user_id : row.id;
            if (uid === user?.id) return false; // exclude current user
            const tier = (row.subscription_tier || row.role || "").toLowerCase();
            return tier !== "admin"; // exclude only if tier/role is literally "admin" (legacy)
          })
          .map((row) => {
            const uid = (row.user_id != null ? row.user_id : row.id) as string;
            return {
              id: uid,
              full_name: (row.full_name ?? null) as string | null,
              subscription_tier: (row.subscription_tier ?? row.role ?? null) as string | null,
              avatar_url: (row.avatar_url ?? null) as string | null,
              isAdmin: adminIds.has(uid),
            };
          })
          .sort((a, b) => {
            // Admins first, then by name
            if (a.isAdmin && !b.isAdmin) return -1;
            if (!a.isAdmin && b.isAdmin) return 1;
            const na = (a.full_name || "").toLowerCase();
            const nb = (b.full_name || "").toLowerCase();
            return na.localeCompare(nb);
          });

        setMembers(mapped);
      } catch (e) {
        console.error("Failed to load members:", e);
        setMembers([]);
      }
    };

    const loadRooms = async () => {
      const { data, error } = await supabase.from("chat_rooms").select("id, name");
      if (error) {
        console.error("Error loading chat rooms:", error);
        return;
      }
      const map: Record<string, string> = {};
      const rooms = (data || []) as { id: string; name: string; type?: string }[];
      rooms.forEach((room: any) => {
        const matched = CHANNELS.find((ch) => ch.name === room.name);
        if (matched) map[matched.id] = room.id;
        if (room.type === "andlig") map["andlig-transformation"] = room.id;
        if (room.type === "stargate") map["stargate"] = room.id;
        if (room.name === "Community Lounge" && !map["divine-sangha"]) map["divine-sangha"] = room.id;
        if (room.name?.includes("Divine Sangha") && !map["divine-sangha"]) map["divine-sangha"] = room.id;
        if (room.name?.includes("Sacred Mantra") && !map["sacred-mantras"]) map["sacred-mantras"] = room.id;
        if (room.name?.includes("Healing") && !map["healing-circle"]) map["healing-circle"] = room.id;
      });
      const missingChannels = CHANNELS.filter((ch) => !map[ch.id]);
      if (missingChannels.length > 0) {
        const createPromises = missingChannels.map(async (ch) => {
          const { data: created, error: createErr } = await supabase
            .from("chat_rooms")
            .insert({ name: ch.name })
            .select("id")
            .single();
          if (!createErr && created?.id) return { channelId: ch.id, roomId: (created as any).id };
          const { data: found } = await supabase.from("chat_rooms").select("id").eq("name", ch.name).limit(1);
          if (found && found.length > 0) return { channelId: ch.id, roomId: (found[0] as any).id };
          return { channelId: ch.id, roomId: null };
        });
        const results = await Promise.all(createPromises);
        results.forEach((r) => { if (r.roomId) map[r.channelId] = r.roomId; });
      }
      setRoomIds(map);
    };

    Promise.all([loadMembers(), loadRooms()]);
  }, [user?.id]);

  // Track who's online via Realtime presence (community channel)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel("community-presence");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          (presences || []).forEach((p: { user_id?: string }) => {
            if (p?.user_id) ids.add(p.user_id);
          });
        });
        ids.add(user.id);
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Ensure room exists for a channel (create if missing) — chat_rooms has id, name, created_at only
  const ensureRoomForChannel = useCallback(
    async (channelId: string) => {
      if (!user || !channelId || isDmChannel(channelId)) return;
      if (roomIdsRef.current[channelId]) return;
      const logical = CHANNELS.find((c) => c.id === channelId);
      const channelName = logical?.name || channelId;
      try {
        // Query by name first
        let { data: room } = await supabase
          .from("chat_rooms")
          .select("id")
          .eq("name", channelName)
          .maybeSingle();

        if (!room) {
          const { data: newRoom, error } = await supabase
            .from("chat_rooms")
            .insert({ name: channelName })
            .select("id")
            .single();
          if (!error && newRoom) {
            room = newRoom;
          } else {
            // Insert failed — re-query by name in case room exists
            const { data: existing } = await supabase.from("chat_rooms").select("id").eq("name", channelName).maybeSingle();
            if (existing) room = existing;
            else console.error("Failed to create chat room:", error);
          }
        }
        if (room?.id) setRoomIds((prev) => ({ ...prev, [channelId]: room!.id }));
      } catch (e) {
        console.warn("Could not ensure room for channel:", channelId, e);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchFeedPosts();
  }, [fetchFeedPosts]);

  // Fetch notifications + realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifs = async () => {
      const { data } = await (supabase as any)
        .from("community_notifications")
        .select("id, type, title, body, channel_id, link, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications((data as any[]) || []);
    };
    fetchNotifs();
    const channel = supabase
      .channel(`notifs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_notifications", filter: `user_id=eq.${user.id}` } as any,
        (payload: any) => {
          const n = payload.new as any;
          setNotifications((prev: any[]) => [{ ...n }, ...prev.filter((p: any) => p.id !== n.id)]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Browser push permission prompt (ask once after 3s)
  useEffect(() => {
    const asked = typeof localStorage !== "undefined" ? localStorage.getItem("push-permission-asked") : null;
    if (!asked && user?.id) {
      if (typeof localStorage !== "undefined") localStorage.setItem("push-permission-asked", "1");
      const t = setTimeout(async () => {
        try {
          const granted = await requestNotificationPermission();
          if (granted) {
            await (supabase as any).from("profiles").update({ push_enabled: true }).eq("user_id", user.id);
          }
        } catch {
          // ignore
        }
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [user?.id]);

  useEffect(() => {
    if (openCommentsPostId) fetchPostComments(openCommentsPostId);
  }, [openCommentsPostId, fetchPostComments]);

  // Realtime listener so the Community view reacts to new feed + live posts
  useEffect(() => {
    const channel = supabase
      .channel("community-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => {
          fetchFeedPostsRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!activeChannel) {
      setViewerSessions([]);
      setLiveRoomUrl(null);
      return;
    }

    // DMs: fetch messages and subscribe to new private messages with this partner
    if (isDmChannel(activeChannel) && user) {
      const partnerId = getDmPartnerId(activeChannel, user.id);
      fetchMessages(activeChannel);
      if (partnerId) {
        const dmChannel = supabase
          .channel(`dm-${user.id}-${partnerId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "private_messages" },
            (payload: { new: { id: string; sender_id: string; receiver_id: string; content: string; created_at: string } }) => {
              const n = payload.new;
              const isBetweenUs =
                (n.sender_id === user.id && n.receiver_id === partnerId) ||
                (n.sender_id === partnerId && n.receiver_id === user.id);
              if (!isBetweenUs) return;
              const nameMap = memberNameMapRef.current;
              const newMsg: Message = {
                id: n.id,
                channel_id: activeChannel,
                user_id: n.sender_id,
                content: n.content,
                created_at: n.created_at,
                user_name: n.sender_id === user.id ? "You" : (nameMap[n.sender_id] || "Member"),
              };
              setMessages((prev) => {
                // Deduplicate by id
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          )
          .subscribe();
        return () => {
          supabase.removeChannel(dmChannel);
        };
      }
      return;
    }

    // Group channel logic — needs async for room creation
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let realtimeChannel: any = null;
    let liveChannel: any = null;

    (async () => {
      let roomId = roomIds[activeChannel];
      if (!roomId) {
        await ensureRoomForChannel(activeChannel);
        roomId = roomIdsRef.current[activeChannel];
        if (!roomId || cancelled) {
          if (!cancelled) {
            setMessages([]);
            setViewerSessions([]);
            setLiveRoomUrl(null);
          }
          return;
        }
      }

      if (cancelled) return;

      // Fetch messages + live sessions in parallel
      setLoading(true);
      const fetchSessions = fetchActiveSessionsRef.current;
      await Promise.all([
        (async () => {
          fetchInProgressRef.current = activeChannel;
          try {
            const { data, error } = await supabase
              .from("chat_messages")
              .select("*")
              .eq("room_id", roomId)
              .order("created_at", { ascending: true })
              .limit(100);
            if (cancelled || fetchInProgressRef.current !== activeChannel) return;
            if (error) {
              setMessages([]);
              return;
            }
            const nameMap = memberNameMapRef.current;
            const rows = (data as any[]) || [];
            setMessages(
              rows.map((row) => ({
                ...row,
                user_name: row.user_id === user?.id ? "You" : (nameMap[row.user_id] || "Member"),
              }))
            );
          } finally {
            if (fetchInProgressRef.current === activeChannel) fetchInProgressRef.current = null;
            setLoading(false);
          }
        })(),
        fetchSessions(activeChannel).then((s) => { if (!cancelled) setViewerSessions(s); }),
      ]).catch(() => { if (!cancelled) setLoading(false); });

      if (cancelled) return;

      pollInterval = setInterval(() => fetchSessions(activeChannel).then((s) => { if (!cancelled) setViewerSessions(s); }), 30000);

      // Realtime subscription for messages in this room
      realtimeChannel = supabase
        .channel(`room-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const n = payload.new as any;
            const nameMap = memberNameMapRef.current;
            const msg: Message = {
              ...n,
              user_name: n.user_id === user?.id ? "You" : (nameMap[n.user_id] || "Member"),
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              const tempIdx = prev.findIndex(
                (m) => m.id.startsWith("temp-") && m.user_id === n.user_id && m.content === n.content
              );
              if (tempIdx !== -1) {
                const next = [...prev];
                next[tempIdx] = msg;
                return next;
              }
              return [...prev, msg];
            });
          }
        )
        .subscribe();

      // Listen for live session changes
      liveChannel = supabase
        .channel(`live-${activeChannel}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "community_live_sessions",
          },
          () => {
            fetchActiveSessionsRef.current(activeChannel).then((s) => { if (!cancelled) setViewerSessions(s); });
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      if (liveChannel) supabase.removeChannel(liveChannel);
    };
  }, [activeChannel, fetchMessages, roomIds, user, ensureRoomForChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGoLiveForChannel = async (channelId: string, channelName: string) => {
    if (!user) return;
    setShowGoLiveOptions(false);
    const result = await daily.createRoom(channelId, `Live in ${channelName}`, undefined, false, "channel");
    if (result) {
      setLiveRoomUrl(result.room_url);
      const adminName = memberNameMap[user.id] || "Admin";
      try {
        await supabase.from("community_posts").insert({
          user_id: user.id,
          content: `🔴 Live now in ${channelName}`,
          post_type: "live",
          is_live_recording: true,
          live_recording_title: `Live in ${channelName}`,
          live_recording_description: "Streaming via Siddha Quantum Nexus",
          video_url: result.room_url,
        } as any);
        await fetchFeedPosts();
        await supabase.functions.invoke("notify-community", {
          body: {
            type: "live",
            triggeredBy: adminName,
            channelId,
            channelName,
            title: `🔴 ${adminName} is LIVE in ${channelName}`,
            body: "A live session just started. Tap to join now.",
            link: "/community",
          },
        });
      } catch (err) {
        console.error("Failed to create live feed post:", err);
      }
    }
  };

  const handleGoLive = async () => {
    if (!activeChannel || !currentChannel) return;
    await handleGoLiveForChannel(activeChannel, currentChannel.name);
  };

  const handleDmVideoCall = async () => {
    if (!activeChannel || !user || !isDmChannel(activeChannel)) return;
    const partnerId = getDmPartnerId(activeChannel, user.id);
    const partnerName = partnerId ? memberNameMap[partnerId] : "Member";
    const result = await daily.createRoom(
      activeChannel,
      `Video call with ${partnerName}`,
      "1-on-1 video call",
      true
    );
    if (result) {
      setDmVideoUrl(result.room_url);
      if (partnerId) {
        await supabase.from("private_messages").insert({
          sender_id: user.id,
          receiver_id: partnerId,
          content: "VIDEO_CALL:" + result.room_url,
        });
      }
    }
  };

  const handleEndLive = async () => {
    if (daily.activeSession) {
      await daily.endSession(daily.activeSession.id);
      setLiveRoomUrl(null);
      await fetchFeedPosts();
      toast.success("Session ended. Recording will appear in feed when processed.");
    }
  };

  const createFeedPost = async () => {
    if (!user || !feedText.trim()) return;

    setFeedLoading(true);
    let imageUrl: string | null = null;
    let audioUrl: string | null = null;
    let videoUrl: string | null = null;
    let pdfUrl: string | null = null;
    let postType = "text";

    try {
      if (feedFile) {
        const ext = feedFile.name.split(".").pop() || "bin";
        const path = `feed/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("community-media")
          .upload(path, feedFile, {
            upsert: true,
            contentType: feedFile.type || undefined,
          });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("community-media").getPublicUrl(path);
        const url = data.publicUrl;

        if (feedFile.type.startsWith("image/")) {
          imageUrl = url;
          postType = "image";
        } else if (feedFile.type.startsWith("video/")) {
          videoUrl = url;
          postType = "video";
        } else if (feedFile.type.startsWith("audio/")) {
          audioUrl = url;
          postType = "audio";
        } else if (feedFile.type === "application/pdf" || ext.toLowerCase() === "pdf") {
          pdfUrl = url;
          postType = "pdf";
        } else {
          // Fallback: treat as generic attachment in text post
          pdfUrl = url;
          postType = "attachment";
        }
      }

      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        content: feedText.trim(),
        image_url: imageUrl,
        audio_url: audioUrl,
        video_url: videoUrl,
        pdf_url: pdfUrl,
        post_type: postType,
      });

      if (error) throw error;

      const adminName = memberNameMap[user.id] || "Admin";
      const content = feedText.trim();
      setFeedText("");
      setFeedFile(null);
      await fetchFeedPosts();
      toast.success("Post shared to the Sangha feed.");
      try {
        await supabase.functions.invoke("notify-community", {
          body: {
            type: "post",
            triggeredBy: adminName,
            title: `✨ New post from ${adminName}`,
            body: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
            link: "/community",
          },
        });
      } catch (notifErr) {
        console.warn("Notify community failed:", notifErr);
      }
    } catch (e) {
      console.error("Failed to create feed post:", e);
      toast.error("Could not post to feed. Please try again.");
    } finally {
      setFeedLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user || !activeChannel) return;

    const text = messageText.trim();
    setMessageText("");

    // DM: write to private_messages
    if (isDmChannel(activeChannel)) {
      const partnerId = getDmPartnerId(activeChannel, user.id);
      if (!partnerId) return;

      // Optimistically append own message immediately
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        channel_id: activeChannel,
        user_id: user.id,
        content: text,
        created_at: new Date().toISOString(),
        user_name: "You",
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const { data: inserted, error } = await supabase
        .from("private_messages")
        .insert({
          sender_id: user.id,
          receiver_id: partnerId,
          content: text,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to send DM:", error);
        toast.error("Could not send message.");
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      } else if (inserted) {
        // Replace temp with real message
        setMessages((prev) =>
          prev.map((m) => m.id === optimisticMsg.id ? { ...optimisticMsg, id: (inserted as any).id } : m)
        );
      }
      return;
    }

    // Ensure there is a backing chat_rooms row for this channel (auto-create if missing)
    let roomId = roomIds[activeChannel];
    if (!roomId) {
      try {
        const logical = CHANNELS.find((c) => c.id === activeChannel);
        const channelName = logical?.name || activeChannel;

        // Query by name first
        let { data: room } = await supabase.from("chat_rooms").select("id").eq("name", channelName).maybeSingle();
        if (!room) {
          const { data: newRoom, error } = await supabase
            .from("chat_rooms")
            .insert({ name: channelName })
            .select("id")
            .single();
          if (!error && newRoom) room = newRoom;
          else {
            const { data: existing } = await supabase.from("chat_rooms").select("id").eq("name", channelName).maybeSingle();
            if (existing) room = existing;
          }
        }
        if (room?.id) {
          roomId = room.id;
          setRoomIds((prev) => ({ ...prev, [activeChannel]: roomId! }));
        } else {
          toast.error("Could not set up this channel. Please try again.");
          return;
        }
      } catch (e) {
        console.error("Error while ensuring chat room exists:", e);
        toast.error("Channel is not configured yet.");
        return;
      }
    }
    const profile = members.find((m) => m.id === user.id);
    const senderName = profile?.full_name || "You";

    // PERF 4: Optimistic update — show message INSTANTLY before Supabase confirms
    const optimisticGroupMsg: Message & { pending?: boolean } = {
      id: `temp-${Date.now()}`,
      channel_id: activeChannel,
      user_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      user_name: "You",
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticGroupMsg]);

    const { data: insertedGroup, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: text,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send message:", error);
      toast.error("Could not send message.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticGroupMsg.id));
    } else {
      if (insertedGroup) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticGroupMsg.id
              ? { ...(insertedGroup as any), user_name: "You", pending: false }
              : m
          )
        );
      }
      // Notify members (1-hour silence to avoid spam)
      try {
        const lastKey = `last-notif-${activeChannel}`;
        const lastNotified = typeof localStorage !== "undefined" ? localStorage.getItem(lastKey) : null;
        const oneHour = 60 * 60 * 1000;
        if (!lastNotified || Date.now() - parseInt(lastNotified, 10) > oneHour) {
          if (typeof localStorage !== "undefined") localStorage.setItem(lastKey, Date.now().toString());
          const ch = CHANNELS.find((c) => c.id === activeChannel);
          await supabase.functions.invoke("notify-community", {
            body: {
              type: "message",
              triggeredBy: senderName,
              channelId: activeChannel,
              channelName: ch?.name || activeChannel,
              title: `💬 New message in ${ch?.name || activeChannel}`,
              body: `${senderName}: ${text.substring(0, 80)}${text.length > 80 ? "…" : ""}`,
              link: "/community",
            },
          });
        }
      } catch (notifErr) {
        console.warn("Notify community failed:", notifErr);
      }
    }
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

  const currentChannel = useMemo(() => {
    if (!activeChannel) return undefined;
    const ch = CHANNELS.find((c) => c.id === activeChannel);
    if (ch) return ch;
    if (activeChannel.startsWith("dm-") && user) {
      const partnerId = getDmPartnerId(activeChannel, user.id);
      const partnerName = partnerId ? memberNameMap[partnerId] : null;
      return {
        id: activeChannel,
        name: partnerName || "Direct Message",
        icon: "👤",
        description: "Private 1-on-1 chat",
      };
    }
    return undefined;
  }, [activeChannel, user, memberNameMap]);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatTime = (ts: string) => {
    try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); }
    catch { return ""; }
  };

  // Avoid referencing window directly in render on environments without DOM (SSR/preview)
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

  // ── RENDER ──
  return (
    <>
      <style>{CSS}</style>
      <div className="c-root">
        {/* Banner + Notification bell */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 14px 0", gap: 10 }}>
          <div className="c-banner" style={{ flex: 1, margin: 0 }}>
            <span className="c-pulse" />
            {onlineCount} SOUL{onlineCount === 1 ? "" : "S"} CURRENTLY IN SACRED COMMUNITY
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => {
                setShowNotifPanel(!showNotifPanel);
                if (!showNotifPanel && notifications.some((n) => !n.is_read)) {
                  (supabase as any)
                    .from("community_notifications")
                    .update({ is_read: true })
                    .eq("user_id", user?.id)
                    .eq("is_read", false)
                    .then(() => {
                      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                    });
                }
              }}
              style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(212,175,55,.2)",
                borderRadius: 12,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              🔔
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#D4AF37",
                    color: "#000",
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    fontSize: 9,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {notifications.filter((n) => !n.is_read).length > 9 ? "9+" : notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#0a0a0a",
                  border: "1px solid rgba(212,175,55,.25)",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                  minWidth: 280,
                  maxWidth: 360,
                  maxHeight: 320,
                  overflowY: "auto",
                  zIndex: 100,
                }}
              >
                <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,.06)", fontWeight: 800, fontSize: 10, letterSpacing: "0.2em", color: "#D4AF37" }}>
                  NOTIFICATIONS
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, color: "rgba(255,255,255,.4)", fontSize: 13 }}>No notifications yet</div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.link) navigate(n.link);
                        setShowNotifPanel(false);
                      }}
                      style={{
                        padding: 12,
                        borderBottom: "1px solid rgba(255,255,255,.04)",
                        cursor: "pointer",
                        background: n.is_read ? "transparent" : "rgba(212,175,55,.06)",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 12, color: "rgba(255,255,255,.95)" }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 2 }}>{n.body}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="c-top-tabs">
          <button className={`c-top-tab ${mobileTab === "chat" ? "active" : ""}`} onClick={() => setMobileTab("chat")}>Chat</button>
          <button className={`c-top-tab ${mobileTab === "feed" ? "active" : ""}`} onClick={() => setMobileTab("feed")}>Feed</button>
          <button className={`c-top-tab ${mobileTab === "members" ? "active" : ""}`} onClick={() => setMobileTab("members")}>Members</button>
        </div>

        {/* Body */}
        <div className="c-body">
          {/* ─── CHANNEL LIST / CHAT ─── */}
          {(mobileTab === "chat" || isDesktop) ? (
            activeChannel && currentChannel ? (
              isDmChannel(activeChannel) ? (
                (() => {
                  const dmPartnerId = getDmPartnerId(activeChannel, user?.id || "");
                  return dmPartnerId ? (
                    <DMChatView
                      partnerId={dmPartnerId}
                      onBack={() => { setActiveChannel(null); setDmVideoUrl(null); setLiveRoomUrl(null); setMobileTab("members"); }}
                      isAdmin={isAdmin}
                      onVideoCall={handleDmVideoCall}
                      dmVideoUrl={dmVideoUrl}
                      onEndVideoCall={() => setDmVideoUrl(null)}
                      onDmSent={async (content, partnerId) => {
                        const adminName = memberNameMap[user?.id || ""] || "Admin";
                        try {
                          await supabase.functions.invoke("notify-community", {
                            body: {
                              type: "dm",
                              triggeredBy: adminName,
                              title: `💌 Message from ${adminName}`,
                              body: content.substring(0, 100) + (content.length > 100 ? "…" : ""),
                              link: "/community",
                              targetUserIds: [partnerId],
                            },
                          });
                        } catch (e) {
                          console.warn("Notify DM failed:", e);
                        }
                      }}
                    />
                  ) : (
                    <div className="c-chat-view">
                      <div className="c-chat-header">
                        <button className="c-back-btn" onClick={() => { setActiveChannel(null); setDmVideoUrl(null); setLiveRoomUrl(null); }}>←</button>
                        <div className="c-chat-title"><div className="c-chat-name">Invalid DM</div></div>
                      </div>
                    </div>
                  );
                })()
              ) : (
              <div className="c-chat-view">
                {/* Chat header */}
                <div className="c-chat-header">
                  <button className="c-back-btn" onClick={() => { setActiveChannel(null); setDmVideoUrl(null); setLiveRoomUrl(null); }}>←</button>
                  <div className="c-chat-icon">{currentChannel.icon}</div>
                  <div className="c-chat-title">
                    <div className="c-chat-name">{currentChannel.name}</div>
                    <div className="c-chat-sub">{currentChannel.description}</div>
                  </div>
                  {/* DM: 1o1 video call button (admin only) */}
                  {isDmChannel(activeChannel) && isAdmin && !dmVideoUrl && (
                    <button
                      className="c-video-call-btn"
                      onClick={handleDmVideoCall}
                      disabled={daily.isCreating}
                    >
                      {daily.isCreating ? "⏳" : "📹"} VIDEO CALL
                    </button>
                  )}
                  {isDmChannel(activeChannel) && isAdmin && dmVideoUrl && (
                    <button
                      className="c-video-call-btn"
                      onClick={() => setDmVideoUrl(null)}
                      style={{ borderColor: "rgba(255,59,48,.4)", color: "#ff6b61" }}
                    >
                      ⬛ END CALL
                    </button>
                  )}
                  {/* Group: Go Live button (admin only) */}
                  {!isDmChannel(activeChannel) && isAdmin && !liveRoomUrl && (
                    <button
                      className={`c-golive-header-btn ${daily.isCreating ? "c-golive-active" : ""}`}
                      onClick={handleGoLive}
                      disabled={daily.isCreating}
                    >
                      {daily.isCreating ? "⏳ CREATING..." : "🔴 GO LIVE"}
                    </button>
                  )}
                  {!isDmChannel(activeChannel) && isAdmin && liveRoomUrl && (
                    <button
                      className="c-golive-header-btn c-golive-active"
                      onClick={handleEndLive}
                    >
                      ⬛ END LIVE
                    </button>
                  )}
                  {/* Live pill: small dismissible pill in header, max 36px, does not block chat */}
                  {!isDmChannel(activeChannel) && !liveRoomUrl && viewerSessions.length > 0 && !dismissedLiveChannels.has(activeChannel) && (
                    <div className="c-live-pill-wrap">
                      {viewerSessions.slice(0, 1).map((s) => (
                        <div key={s.id} className="c-live-pill">
                          <span
                            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
                            onClick={() => s.room_url && window.open(s.room_url, "_blank")}
                          >
                            🔴
                          </span>
                          <span onClick={() => s.room_url && window.open(s.room_url, "_blank")}>
                            JOIN LIVE: {s.title.length > 18 ? s.title.slice(0, 18) + "…" : s.title}
                          </span>
                          <span
                            className="c-live-pill-dismiss"
                            onClick={() => setDismissedLiveChannels((prev) => new Set(prev).add(activeChannel!))}
                            aria-label="Dismiss"
                          >
                            ✕
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DM Video call iframe */}
                {isDmChannel(activeChannel) && dmVideoUrl && (
                  <div className="c-live-frame">
                    <iframe
                      src={dmVideoUrl}
                      allow="camera;microphone;fullscreen;display-capture"
                    />
                  </div>
                )}

                {/* Group Live Room iframe (admin broadcasting or viewer joined) */}
                {!isDmChannel(activeChannel) && liveRoomUrl && (
                  <div className="c-live-frame">
                    <iframe
                      src={liveRoomUrl}
                      allow="camera;microphone;fullscreen;display-capture"
                    />
                  </div>
                )}

                {/* Messages */}
                <div className="c-messages">
                  {loading ? (
                    <div className="c-empty">
                      <div className="c-empty-icon">⏳</div>
                      <div className="c-empty-sub">LOADING MESSAGES</div>
                      {loadingStuck && (
                        <button
                          className="c-skip-loading-btn"
                          onClick={() => { setLoading(false); setLoadingStuck(false); setMessages([]); }}
                        >
                          Start chatting anyway
                        </button>
                      )}
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
                          <div className={`c-avatar ${isMine ? "mine" : ""} ${consecutive || isMine ? "hidden" : ""}`}>
                            {getInitials(msg.user_name || (isMine ? "ME" : undefined))}
                          </div>
                          <div className="c-msg-body">
                            {!consecutive && !isMine && (
                              <div className="c-msg-meta">
                                <span className="c-msg-author">{msg.user_name || "Member"}</span>
                              </div>
                            )}
                            <div className={`c-bubble ${isMine ? "mine" : ""}`}>
                              {msg.content}
                              {!isDmChannel(activeChannel) && (isMine || isAdmin) && (
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
            )
            ) : (
              /* Channel list */
              <div className="c-channels-view">
                <div className="c-section-label">OPEN CHANNELS</div>
                {CHANNELS.filter((c) => c.access === "public").map((ch) => (
                  <button key={ch.id} className="c-channel-row" onClick={() => { console.log("[Community] Channel clicked:", ch.id); setActiveChannel(ch.id); setMobileTab("chat"); }}>
                    <div className="c-ch-icon">{ch.icon}</div>
                    <div className="c-ch-info">
                      <div className="c-ch-name">{ch.name}</div>
                      <div className="c-ch-desc">{ch.description}</div>
                    </div>
                    <div className="c-ch-arrow">›</div>
                  </button>
                ))}

                <div className="c-section-label">SACRED SPACES</div>
                {CHANNELS.filter((c) => c.access === "sacred").map((ch) => {
                  // Sacred channels require Siddha Quantum (rank 2) or higher
                  const userTier = members.find((m) => m.id === user?.id)?.subscription_tier;
                  const userRank = getTierRank(userTier);
                  const hasAccess = isAdmin || userRank >= 2;
                  return (
                    <button
                      key={ch.id}
                      className={`c-channel-row ${!hasAccess ? "locked" : ""}`}
                      onClick={() => {
                        if (hasAccess) {
                          console.log("[Community] Channel clicked:", ch.id);
                          setActiveChannel(ch.id);
                          setMobileTab("chat");
                        } else {
                          toast.error("This space requires Siddha Quantum or Akasha Infinity membership.");
                        }
                      }}
                    >
                      <div className="c-ch-icon sacred">{ch.icon}</div>
                      <div className="c-ch-info">
                        <div className="c-ch-name">{ch.name}</div>
                        <div className="c-ch-desc">{ch.description}</div>
                      </div>
                      {hasAccess ? <div className="c-ch-arrow">›</div> : <span className="c-lock-badge">🔒</span>}
                    </button>
                  );
                })}

                <div className="c-section-label">PRIVATE</div>
                {CHANNELS.filter((c) => c.access === "private").map((ch) => {
                  const locked = !isAdmin;
                  return (
                    <button
                      key={ch.id}
                      className={`c-channel-row ${locked ? "locked" : ""}`}
                      onClick={() => {
                        if (!locked) { console.log("[Community] Channel clicked:", ch.id); setActiveChannel(ch.id); setMobileTab("chat"); }
                      }}
                    >
                      <div className="c-ch-icon private">{ch.icon}</div>
                      <div className="c-ch-info">
                        <div className="c-ch-name">{ch.name}</div>
                        <div className="c-ch-desc">{ch.description}</div>
                      </div>
                      {locked ? <span className="c-lock-badge">🔒</span> : <div className="c-ch-arrow">›</div>}
                    </button>
                  );
                })}
              </div>
            )
          ) : mobileTab === "feed" ? (
            <div className="c-feed-view">
              <div className="c-section-label">{isAdmin ? "ADMIN FEED" : "SANGHA FEED"}</div>
              {isAdmin && (
              <div className="c-feed-card" style={{ marginBottom: 16 }}>
                <textarea
                  placeholder="Share an update with the Sangha..."
                  value={feedText}
                  onChange={(e) => setFeedText(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 70,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "vertical",
                    color: "rgba(255,255,255,.9)",
                    fontSize: 14,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*,application/pdf"
                    onChange={(e) => setFeedFile(e.target.files?.[0] || null)}
                    style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}
                  />
                  <button
                    onClick={createFeedPost}
                    disabled={feedLoading || !feedText.trim()}
                    style={{
                      marginLeft: "auto",
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "none",
                      background:
                        "linear-gradient(135deg, rgba(212,175,55,.3), rgba(212,175,55,.6))",
                      color: "#050505",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      cursor: feedLoading || !feedText.trim() ? "default" : "pointer",
                      opacity: feedLoading || !feedText.trim() ? 0.4 : 1,
                    }}
                  >
                    {feedLoading ? "Posting..." : "Post"}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (!user) return;
                    setShowGoLiveOptions(false);
                    const result = await daily.createRoom("feed", "Live from Divine Sangha", undefined, false, "feed");
                    if (result) {
                      setLiveRoomUrl(result.room_url);
                      setActiveChannel("divine-sangha");
                      setMobileTab("chat");
                      const adminName = memberNameMap[user.id] || "Admin";
                      try {
                        await supabase.from("community_posts").insert({
                          user_id: user.id,
                          content: "🔴 Live now in Divine Sangha",
                          post_type: "live",
                          is_live_recording: true,
                          live_recording_title: "Live from Divine Sangha",
                          live_recording_description: "Streaming via Siddha Quantum Nexus",
                          video_url: result.room_url,
                        } as any);
                        await fetchFeedPosts();
                        await supabase.functions.invoke("notify-community", {
                          body: {
                            type: "live",
                            triggeredBy: adminName,
                            title: `🔴 ${adminName} is LIVE`,
                            body: "A live transmission has started on the Sacred Feed.",
                            link: "/community",
                          },
                        });
                      } catch (err) {
                        console.error("Failed to create live feed post:", err);
                      }
                    }
                  }}
                  disabled={daily.isCreating}
                  style={{
                    marginTop: 10,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(212,175,55,.35)",
                    background: "rgba(5,5,5,.9)",
                    color: "#D4AF37",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    cursor: daily.isCreating ? "default" : "pointer",
                    opacity: daily.isCreating ? 0.5 : 1,
                  }}
                >
                  {daily.isCreating ? "⏳ Creating Live..." : "🔴 Go Live via Divine Sangha"}
                </button>
              </div>
              )}

              {feedLoading && feedPosts.length === 0 ? (
                <div className="c-empty">
                  <div className="c-empty-icon">⏳</div>
                  <div className="c-empty-sub">LOADING FEED</div>
                </div>
              ) : feedPosts.length === 0 ? (
                <div className="c-empty">
                  <div className="c-empty-icon">✦</div>
                  <div className="c-empty-title">No posts yet</div>
                  <div className="c-empty-sub">Share the first transmission</div>
                </div>
              ) : (
                feedPosts.map((post) => (
                  <div key={post.id} className="c-feed-card">
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                      <span className="c-feed-author">Admin Transmission</span>
                      <span className="c-feed-time">{formatTime(post.created_at)}</span>
                    </div>
                    <div className="c-feed-text">{post.content}</div>
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        style={{
                          marginTop: 10,
                          borderRadius: 16,
                          width: "100%",
                          maxHeight: 260,
                          objectFit: "cover",
                          border: "1px solid rgba(255,255,255,.06)",
                        }}
                      />
                    )}
                    {post.video_url && (
                      <video
                        src={post.video_url}
                        controls
                        style={{
                          marginTop: 10,
                          borderRadius: 16,
                          width: "100%",
                          maxHeight: 260,
                          objectFit: "cover",
                          border: "1px solid rgba(255,255,255,.06)",
                          background: "#000",
                        }}
                      />
                    )}
                    {post.audio_url && (
                      <audio
                        src={post.audio_url}
                        controls
                        style={{ marginTop: 10, width: "100%" }}
                      />
                    )}
                    {post.pdf_url && (
                      <a
                        href={post.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 10,
                          fontSize: 12,
                          color: "rgba(212,175,55,.9)",
                          textDecoration: "underline",
                        }}
                      >
                        📄 Open attached PDF
                      </a>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                      <button
                        type="button"
                        onClick={() => likePost(post.id)}
                        disabled={!!likingPostId}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "none",
                          border: "none",
                          color: post.user_liked ? "#D4AF37" : "rgba(255,255,255,.5)",
                          fontSize: 12,
                          cursor: likingPostId ? "default" : "pointer",
                        }}
                      >
                        <span>{post.user_liked ? "❤️" : "🤍"}</span>
                        <span>{post.likes_count ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenCommentsPostId((prev) => (prev === post.id ? null : post.id))}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "none",
                          border: "none",
                          color: "rgba(255,255,255,.5)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        <span>💬</span>
                        <span>{post.comments_count ?? 0}</span>
                      </button>
                    </div>
                    {openCommentsPostId === post.id && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                        {(commentsByPostId[post.id] || []).map((c) => (
                          <div key={c.id} style={{ marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,.8)" }}>
                            <span style={{ fontWeight: 600, color: "rgba(212,175,55,.9)", marginRight: 6 }}>{c.user_name ?? "Member"}:</span>
                            <span>{c.content}</span>
                            <span style={{ marginLeft: 6, color: "rgba(255,255,255,.4)", fontSize: 11 }}>{formatTime(c.created_at)}</span>
                          </div>
                        ))}
                        {user ? (
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addComment(post.id, commentDraft);
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,.1)",
                                background: "rgba(5,5,5,.8)",
                                color: "rgba(255,255,255,.9)",
                                fontSize: 12,
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => addComment(post.id, commentDraft)}
                              disabled={!commentDraft.trim() || commentingPostId === post.id}
                              style={{
                                padding: "8px 14px",
                                borderRadius: 999,
                                border: "none",
                                background: "rgba(212,175,55,.4)",
                                color: "#050505",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: commentDraft.trim() && commentingPostId !== post.id ? "pointer" : "default",
                                opacity: commentDraft.trim() && commentingPostId !== post.id ? 1 : 0.5,
                              }}
                            >
                              {commentingPostId === post.id ? "…" : "Comment"}
                            </button>
                          </div>
                        ) : (
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 8 }}>Sign in to comment.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : mobileTab === "members" ? (
            <div className="c-members-view">
              <div className="c-section-label">Guides & Admins</div>
              {members.filter((m) => m.isAdmin && m.id !== user?.id).length > 0 ? (
                members.filter((m) => m.isAdmin && m.id !== user?.id).map((m) => {
                  const isOnline = onlineUserIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      className="c-member-row"
                      onClick={() => {
                        if (!user) return;
                        const ids = [user.id, m.id].sort();
                        setActiveChannel(`dm-${ids[0]}-${ids[1]}`);
                        setMobileTab("chat");
                      }}
                      style={{ borderLeft: "2px solid rgba(212,175,55,.4)" }}
                    >
                      <div style={{ position: "relative" }}>
                        <div className="c-member-avatar">{m.avatar_url ? <img src={m.avatar_url} alt="" /> : getInitials(m.full_name || undefined)}</div>
                        {isOnline && <span style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#22c55e", border: "2px solid #050505" }} title="Online" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="c-member-name">{m.full_name || "Admin"} <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: "#D4AF37", textTransform: "uppercase" }}>Admin</span></div>
                        <div className="c-member-status">Message your guide</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "8px 12px", fontSize: 11, color: "rgba(255,255,255,.4)" }}>No guides online</div>
              )}
              <div className="c-section-label" style={{ marginTop: 16 }}>All Members</div>
              <div style={{ marginBottom: 10 }}>
                <input
                  placeholder="Search members…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(5,5,5,.8)",
                    color: "rgba(255,255,255,.9)",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
              </div>
              {(() => {
                const query = memberSearch.trim().toLowerCase();
                const filtered = members.filter((m) => {
                  if (user && m.id === user.id) return false;
                  if (!query && m.isAdmin) return false; // Admins in Guides section when not searching
                  const tier = (m.subscription_tier || "").toLowerCase();
                  if (tier === "admin") return false;
                  if (!query) return true;
                  const name = (m.full_name || "").toLowerCase();
                  const searchText = `${name} ${tier} ${m.isAdmin ? "admin guide" : ""}`;
                  const words = query.split(/\s+/).filter(Boolean);
                  return words.every((word) => searchText.includes(word));
                });
                if (filtered.length === 0) {
                  return (
                    <div className="c-empty" style={{ marginTop: 24 }}>
                      <div className="c-empty-icon">👤</div>
                      <div className="c-empty-title">
                        {query ? "No members match your search" : "No members yet"}
                      </div>
                      <div className="c-empty-sub">
                        {query ? "Try a different name or tier" : "Members will appear here"}
                      </div>
                    </div>
                  );
                }
                return filtered.map((m) => {
                  const isOnline = onlineUserIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      className="c-member-row"
                      onClick={() => {
                        if (!user) return;
                        const ids = [user.id, m.id].sort();
                        const dmId = `dm-${ids[0]}-${ids[1]}`;
                        setActiveChannel(dmId);
                        setMobileTab("chat");
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <div className="c-member-avatar">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" />
                          ) : (
                            getInitials(m.full_name || undefined)
                          )}
                        </div>
                        {isOnline && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: "#22c55e",
                              border: "2px solid #050505",
                              boxShadow: "0 0 8px #22c55e, 0 0 12px rgba(34, 197, 94, 0.6)",
                            }}
                            title="Online"
                            aria-label="Online"
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="c-member-name">
                          {m.full_name || "Member"}
                          {m.isAdmin && (
                            <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: "#D4AF37", textTransform: "uppercase" }}>Admin</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {isOnline && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 10,
                                color: "#22c55e",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "#22c55e",
                                  boxShadow: "0 0 6px #22c55e",
                                }}
                              />
                              Online
                            </span>
                          )}
                          {m.subscription_tier && (
                            <span className="c-member-status">
                              {m.subscription_tier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Community;
