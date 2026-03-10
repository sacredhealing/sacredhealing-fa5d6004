/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SQI-2050 COMMUNITY PAGE — FULL REBUILD                     ║
 * ║  Akasha-Neural Archive | Prema-Pulse Transmission           ║
 * ║  Paste this file into: src/pages/Community.tsx              ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * CHANNEL ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────
 * PUBLIC (all members):
 *   • Divine Sangha     — open talk for all members
 *   • Sacred Mantras    — mantra Q&A and discussion
 *   • Healing Circle    — healing Q&A, updates
 *
 * SACRED (Siddha Quantum + Akasha Infinity tiers):
 *   • Siddha Masters    — gated by membership tier
 *   • Bhakti Algorithm Lab — gated by membership tier
 *
 * PRIVATE (invite-only by admin):
 *   • Stargate          — Stargate membership holders only
 *   • Andlig Transformation — monthly live attendees, admin-invite
 *
 * FEATURES:
 *   • Real-time chat via Supabase Realtime
 *   • Daily.co Go Live (1:1 and group video)
 *   • Post Wall / Feed (like, comment, share)
 *   • Meeting recordings saved to Supabase → membership area
 *   • Admin: invite to private channels
 *   • Layout: sidebar always visible, chat center, members right
 *   • No content cut off — sticky footer CTA
 */

import '@/styles/community.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import CommunityFeed from '@/components/community/CommunityFeed';
import ChannelChat from '@/components/community/ChannelChat';
import SacredMeetingRoom from '@/components/community/SacredMeetingRoom';
import MembersList from '@/components/community/MembersList';
import GoLiveButton from '@/components/community/GoLiveButton';

// ── CHANNEL DEFINITIONS ─────────────────────────────────────
// Access levels: 'public' | 'sacred' | 'private'
// sacred = Siddha Quantum / Akasha Infinity tiers
// private = admin-invite only (Stargate, Andlig Transformation)

export const COMMUNITY_CHANNELS = [
  {
    id: 'divine-sangha',
    name: 'Divine Sangha',
    icon: '🔱',
    description: 'Open space for all members — talk, share, connect',
    access: 'public',
    defaultWelcome: '',  // empty — no pre-filled text
  },
  {
    id: 'sacred-mantras',
    name: 'Sacred Mantras',
    icon: 'ॐ',
    description: 'Questions and discussion about mantras',
    access: 'public',
    defaultWelcome: '',
  },
  {
    id: 'healing-circle',
    name: 'Healing Circle',
    icon: '✦',
    description: 'Healing questions, updates, and support',
    access: 'public',
    defaultWelcome: '',
  },
  {
    id: 'siddha-masters',
    name: 'Siddha Masters',
    icon: '☀',
    description: 'For Siddha Quantum members',
    access: 'sacred',
    requiredTier: ['siddha_quantum', 'akasha_infinity'],
    defaultWelcome: '',
  },
  {
    id: 'bhakti-algorithm-lab',
    name: 'Bhakti Algorithm Lab',
    icon: '⚡',
    description: 'For Akasha Infinity members',
    access: 'sacred',
    requiredTier: ['akasha_infinity'],
    defaultWelcome: '',
  },
  {
    id: 'stargate',
    name: 'Stargate',
    icon: '⭐',
    description: 'Stargate membership — private channel',
    access: 'private',
    requiredMembership: 'stargate',
    defaultWelcome: '',
  },
  {
    id: 'andlig-transformation',
    name: 'Andlig Transformation',
    icon: '🌸',
    description: 'Monthly live attendees — admin invite only',
    access: 'private',
    inviteOnly: true,
    defaultWelcome: '',
  },
] as const;

export type ChannelId = typeof COMMUNITY_CHANNELS[number]['id'];
export type ActiveView = 'feed' | 'chat' | 'meeting';

// ── TIER ACCESS LOGIC ────────────────────────────────────────
// Replace with your actual tier check from Supabase
function useUserAccess() {
  const { user } = useAuth();
  const [userTier, setUserTier] = useState<string>('basic');
  const [privateChannels, setPrivateChannels] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    // Fetch user's subscription tier
    supabase
      .from('profiles')
      .select('subscription_tier, private_channel_access')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserTier(data.subscription_tier || 'basic');
          setPrivateChannels(data.private_channel_access || []);
        }
      });
  }, [user]);

  const canAccessChannel = useCallback((channelId: string) => {
    const channel = COMMUNITY_CHANNELS.find(c => c.id === channelId);
    if (!channel) return false;
    if (channel.access === 'public') return true;
    if (channel.access === 'sacred') {
      return channel.requiredTier?.includes(userTier as any) ?? false;
    }
    if (channel.access === 'private') {
      return privateChannels.includes(channelId);
    }
    return false;
  }, [userTier, privateChannels]);

  return { userTier, privateChannels, canAccessChannel };
}

// ── MAIN COMMUNITY PAGE ──────────────────────────────────────
export default function Community() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const { canAccessChannel } = useUserAccess();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const [activeView, setActiveView] = useState<ActiveView>(isMobile ? 'chat' : 'feed');
  const [activeChannelId, setActiveChannelId] = useState<ChannelId>('divine-sangha');
  const [onlineCount, setOnlineCount] = useState(108);
  const [liveMeetingUrl, setLiveMeetingUrl] = useState<string | null>(null);
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  const [showMobileChannelSheet, setShowMobileChannelSheet] = useState(false);
  const [showMobileMembersSheet, setShowMobileMembersSheet] = useState(false);

  // Real-time online presence count
  useEffect(() => {
    const channel = supabase.channel('community-presence');
    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length || 108);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user?.id, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleChannelSelect = (channelId: ChannelId) => {
    if (!canAccessChannel(channelId) && !isAdmin) {
      // Show upgrade/request access modal
      // TODO: wire to your existing upgrade flow
      alert('Upgrade your membership to access this channel.');
      return;
    }
    setActiveChannelId(channelId);
    setActiveView('chat');
    setShowMobileChannelSheet(false);
  };

  const handleGoLive = async (roomUrl: string) => {
    setLiveMeetingUrl(roomUrl);
    setActiveView('meeting');
  };

  const activeChannel = COMMUNITY_CHANNELS.find(c => c.id === activeChannelId) || COMMUNITY_CHANNELS[0];

  return (
    <div className="sqi-community-root">
      {/* ── LEFT SIDEBAR ────────────────────────────── */}
      {/* Desktop / tablet sidebar */}
      <aside className="sqi-sidebar">
        <SidebarHeader onlineCount={onlineCount} />

        {/* SEARCH */}
        <div className="sqi-search-wrap">
          <span className="sqi-search-icon">⌕</span>
          <input
            type="text"
            className="sqi-search-input"
            placeholder="Search channels, souls..."
          />
        </div>

        {/* GO LIVE — ALWAYS VISIBLE, NEVER CUT OFF */}
        <div className="sqi-golive-wrap">
          <GoLiveButton
            channelId={activeChannelId}
            channelName={activeChannel.name}
            isAdmin={isAdmin}
            onGoLive={handleGoLive}
          />
        </div>

        {/* NAV TABS */}
        <div className="sqi-sidebar-nav">
          <button
            className={`sqi-nav-tab ${activeView === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveView('feed')}
          >
            📰 Feed
          </button>
          <button
            className={`sqi-nav-tab ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveView('chat')}
          >
            💬 Chat
          </button>
        </div>

        {/* CHANNEL LIST — SCROLLABLE */}
        <div className="sqi-channel-list">
          <ChannelSection
            label="Public Channels"
            channels={COMMUNITY_CHANNELS.filter(c => c.access === 'public')}
            activeChannelId={activeChannelId}
            canAccess={canAccessChannel}
            onSelect={handleChannelSelect}
          />
          <ChannelSection
            label="Sacred Spaces"
            sublabel="Siddha Quantum · Akasha Infinity"
            channels={COMMUNITY_CHANNELS.filter(c => c.access === 'sacred')}
            activeChannelId={activeChannelId}
            canAccess={canAccessChannel}
            onSelect={handleChannelSelect}
          />
          <ChannelSection
            label="Private Channels"
            sublabel="Invite Only"
            channels={COMMUNITY_CHANNELS.filter(c => c.access === 'private')}
            activeChannelId={activeChannelId}
            canAccess={canAccessChannel}
            onSelect={handleChannelSelect}
            isAdmin={isAdmin}
          />
        </div>

        {/* ADMIN: Invite to private channel */}
        {isAdmin && (
          <div className="sqi-admin-invite">
            <button
              className="sqi-invite-btn"
              onClick={() => navigate('/admin/community')}
            >
              ⚙ Manage Channels & Invites
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN AREA ────────────────────────────────── */}
      <main className="sqi-main-area">
        {/* Mobile top tabs */}
        {isMobile && (
          <div className="sqi-mobile-tabs">
            <button
              className={`sqi-mobile-tab ${activeView === 'feed' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('feed');
                setShowMobileChannelSheet(false);
                setShowMobileMembersSheet(false);
              }}
            >
              📰 Feed
            </button>
            <button
              className={`sqi-mobile-tab ${activeView === 'chat' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('chat');
                setShowMobileChannelSheet(true);
                setShowMobileMembersSheet(false);
              }}
            >
              💬 Channels
            </button>
            <button
              className={`sqi-mobile-tab ${showMobileMembersSheet ? 'active' : ''}`}
              onClick={() => {
                setShowMobileMembersSheet(true);
                setShowMobileChannelSheet(false);
              }}
            >
              👥 Members
            </button>
          </div>
        )}

        {/* 108 Souls Banner */}
        <div className="sqi-presence-banner">
          <span className="sqi-pulse-dot" />
          {onlineCount} SOULS CURRENTLY IN DIVINE RESONANCE · YOUR PRESENCE ADDS TO THE LIGHT
        </div>

        {activeView === 'feed' && (
          <CommunityFeed isAdmin={isAdmin} />
        )}

        {/* Inline channel list on mobile (quick access) */}
        {isMobile && activeView === 'chat' && (
          <div className="sqi-mobile-channel-list">
            <ChannelSection
              label="Public Channels"
              channels={COMMUNITY_CHANNELS.filter(c => c.access === 'public')}
              activeChannelId={activeChannelId}
              canAccess={canAccessChannel}
              onSelect={handleChannelSelect}
            />
            <ChannelSection
              label="Sacred Spaces"
              sublabel="Siddha Quantum · Akasha Infinity"
              channels={COMMUNITY_CHANNELS.filter(c => c.access === 'sacred')}
              activeChannelId={activeChannelId}
              canAccess={canAccessChannel}
              onSelect={handleChannelSelect}
              isAdmin={isAdmin}
            />
            <ChannelSection
              label="Private Channels"
              sublabel="Invite Only"
              channels={COMMUNITY_CHANNELS.filter(c => c.access === 'private')}
              activeChannelId={activeChannelId}
              canAccess={canAccessChannel}
              onSelect={handleChannelSelect}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {activeView === 'chat' && activeChannel && activeChannelId && (
          <ChannelChat
            channelId={activeChannelId}
            channel={activeChannel}
            userId={user?.id ?? ''}
            isAdmin={isAdmin}
            onGoLive={handleGoLive}
          />
        )}

        {activeView === 'meeting' && liveMeetingUrl && (
          <SacredMeetingRoom
            roomUrl={liveMeetingUrl}
            channelId={activeChannelId}
            channelName={activeChannel.name}
            userId={user?.id ?? ''}
            isAdmin={isAdmin}
            onEnd={() => {
              setLiveMeetingUrl(null);
              setActiveView('chat');
            }}
          />
        )}
      </main>

      {/* ── RIGHT: MEMBERS ───────────────────────────── */}
      {showMembersSidebar && (
        <MembersList
          channelId={activeChannelId}
          onlineCount={onlineCount}
          isAdmin={isAdmin}
        />
      )}

      {/* Mobile channels sheet */}
      {isMobile && showMobileChannelSheet && (
        <div className="sqi-mobile-sheet-backdrop" onClick={() => setShowMobileChannelSheet(false)}>
          <aside className="sqi-mobile-sheet" onClick={e => e.stopPropagation()}>
            <SidebarHeader onlineCount={onlineCount} />
            <div className="sqi-search-wrap">
              <span className="sqi-search-icon">⌕</span>
              <input
                type="text"
                className="sqi-search-input"
                placeholder="Search channels, souls..."
              />
            </div>
            <div className="sqi-golive-wrap">
              <GoLiveButton
                channelId={activeChannelId}
                channelName={activeChannel.name}
                isAdmin={isAdmin}
                onGoLive={handleGoLive}
              />
            </div>
            <div className="sqi-channel-list">
              <ChannelSection
                label="Public Channels"
                channels={COMMUNITY_CHANNELS.filter(c => c.access === 'public')}
                activeChannelId={activeChannelId ?? ''}
                canAccess={canAccessChannel}
                onSelect={handleChannelSelect}
                isAdmin={isAdmin}
              />
              <ChannelSection
                label="Sacred Spaces"
                sublabel="Siddha Quantum · Akasha Infinity"
                channels={COMMUNITY_CHANNELS.filter(c => c.access === 'sacred')}
                activeChannelId={activeChannelId ?? ''}
                canAccess={canAccessChannel}
                onSelect={handleChannelSelect}
                isAdmin={isAdmin}
              />
              <ChannelSection
                label="Private Channels"
                sublabel="Invite Only"
                channels={COMMUNITY_CHANNELS.filter(c => c.access === 'private')}
                activeChannelId={activeChannelId ?? ''}
                canAccess={canAccessChannel}
                onSelect={handleChannelSelect}
                isAdmin={isAdmin}
              />
            </div>
            {isAdmin && (
              <div className="sqi-admin-invite">
                <button
                  className="sqi-invite-btn"
                  onClick={() => {
                    setShowMobileChannelSheet(false);
                    navigate('/admin/community');
                  }}
                >
                  ⚙ Manage Channels & Invites
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Mobile members sheet */}
      {isMobile && showMobileMembersSheet && (
        <div className="sqi-mobile-sheet-backdrop" onClick={() => setShowMobileMembersSheet(false)}>
          <aside className="sqi-mobile-sheet" onClick={e => e.stopPropagation()}>
            <MembersList
              channelId={activeChannelId ?? 'divine-sangha'}
              onlineCount={onlineCount}
              isAdmin={isAdmin}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

// ── SIDEBAR HEADER ───────────────────────────────────────────
function SidebarHeader({ onlineCount }: { onlineCount: number }) {
  return (
    <div className="sqi-sidebar-header">
      <div className="sqi-sidebar-title">
        <span className="sqi-title-icon">🔱</span>
        <span className="sqi-title-text">Community</span>
        <span className="sqi-live-badge">● LIVE</span>
      </div>
    </div>
  );
}

// ── CHANNEL SECTION ──────────────────────────────────────────
function ChannelSection({
  label, sublabel, channels, activeChannelId, canAccess, onSelect, isAdmin
}: {
  label: string;
  sublabel?: string;
  channels: readonly any[];
  activeChannelId: string;
  canAccess: (id: string) => boolean;
  onSelect: (id: ChannelId) => void;
  isAdmin?: boolean;
}) {
  return (
    <div className="sqi-channel-section">
      <div className="sqi-section-label">
        {label}
        {sublabel && <span className="sqi-section-sublabel"> · {sublabel}</span>}
      </div>
      {channels.map(ch => {
        const hasAccess = canAccess(ch.id) || isAdmin;
        return (
          <button
            key={ch.id}
            className={`sqi-channel-btn ${activeChannelId === ch.id ? 'active' : ''} ${!hasAccess ? 'locked' : ''}`}
            onClick={() => onSelect(ch.id)}
          >
            <span className="sqi-ch-icon">{ch.icon}</span>
            <span className="sqi-ch-info">
              <span className="sqi-ch-name">{ch.name}</span>
              <span className="sqi-ch-desc">{ch.description}</span>
            </span>
            {!hasAccess && <span className="sqi-lock">🔒</span>}
          </button>
        );
      })}
    </div>
  );
}
