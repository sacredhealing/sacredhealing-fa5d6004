/**
 * GoLiveButton.tsx
 * ─────────────────────────────────────────────────────────────
 * SQI-2050 Go Live — powered by Daily.co
 *
 * HOW DAILY.CO WORKS FOR YOUR NEEDS:
 * ────────────────────────────────────────────────────────────
 * 1. ONE-ON-ONE SESSION (e.g. healing session with a student):
 *    - Admin/teacher clicks "Start Private Session"
 *    - A Daily.co room is created with a private token
 *    - Admin shares the link (or it appears in the student's DM)
 *    - Up to 2 people, fully private
 *
 * 2. GROUP SESSION (e.g. Andlig Transformation monthly call):
 *    - Admin clicks "Go Live in [Channel Name]"
 *    - Daily.co room created → URL broadcast to all channel members
 *    - A "🔴 LIVE NOW — Join" banner appears at top of that channel
 *    - Anyone in the channel can join (like Zoom)
 *    - Session supports up to 1000 participants on Daily.co
 *
 * 3. RECORDING:
 *    - Daily.co auto-records if you enable it in your dashboard
 *    - After meeting ends → Daily.co webhook fires
 *    - Our edge function receives it → saves to Supabase storage
 *    - Recording link appears in /membership under that channel
 *
 * SETUP (5 minutes):
 * ─────────────────
 * 1. Sign up at daily.co (free tier: 10,000 min/month)
 * 2. Go to your Daily.co dashboard → Developers → API Keys
 * 3. Copy your API key
 * 4. In your project: add to .env → VITE_DAILY_API_KEY=your_key_here
 * 5. In Supabase: add DAILY_API_KEY to Edge Function secrets
 * 6. Deploy the edge function below (supabase/functions/create-meeting)
 * ─────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoLiveButtonProps {
  channelId: string;
  channelName: string;
  isAdmin: boolean;
  /** Called when room is ready — parent switches to meeting view */
  onGoLive: (roomUrl: string) => void;
}

export default function GoLiveButton({
  channelId,
  channelName,
  isAdmin,
  onGoLive,
}: GoLiveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Non-admins see the "Join Live" button when a live session is active
  const [activeLiveUrl, setActiveLiveUrl] = useState<string | null>(null);

  // Check if there's currently a live session in this channel
  // (stored in Supabase when admin starts it)
  useState(() => {
    const checkLive = async () => {
      const { data } = await supabase
        .from('community_live_sessions')
        .select('room_url')
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .single();
      if (data) setActiveLiveUrl(data.room_url);
    };
    checkLive();

    // Subscribe to real-time updates for this channel's live status
    const sub = supabase
      .channel(`live-${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_live_sessions',
        filter: `channel_id=eq.${channelId}`,
      }, (payload: any) => {
        if (payload.new?.is_active) {
          setActiveLiveUrl(payload.new.room_url);
        } else {
          setActiveLiveUrl(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  });

  const createRoom = async (type: 'group' | 'private') => {
    setLoading(true);
    try {
      // Call our Supabase Edge Function to create a Daily.co room
      // (keeps your API key server-side, never exposed to client)
      const { data, error } = await supabase.functions.invoke('create-meeting', {
        body: {
          channelId,
          channelName,
          type, // 'group' = everyone can join | 'private' = 1:1 token
          enableRecording: true, // saved to /membership after
        },
      });

      if (error) throw error;

      const { roomUrl, roomName } = data;

      // Save to Supabase so other users see the live banner
      if (type === 'group') {
        await supabase.from('community_live_sessions').upsert({
          channel_id: channelId,
          room_url: roomUrl,
          room_name: roomName,
          is_active: true,
          started_at: new Date().toISOString(),
        });
      }

      onGoLive(roomUrl);
    } catch (err) {
      console.error('Go Live error:', err);
      alert('Could not start meeting. Check DAILY_API_KEY in your Supabase secrets.');
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  // ── NON-ADMIN: Show join button if live ──────────────────
  if (!isAdmin) {
    if (!activeLiveUrl) return null;
    return (
      <button
        className="sqi-join-live-btn"
        onClick={() => onGoLive(activeLiveUrl)}
      >
        🔴 LIVE NOW — Join Sacred Space
      </button>
    );
  }

  // ── ADMIN: Show go live options ──────────────────────────
  return (
    <div className="sqi-golive-container">
      {activeLiveUrl ? (
        <button
          className="sqi-golive-active-btn"
          onClick={() => onGoLive(activeLiveUrl)}
        >
          🔴 You are LIVE — Rejoin
        </button>
      ) : (
        <button
          className="sqi-golive-btn"
          onClick={() => setShowOptions(!showOptions)}
          disabled={loading}
        >
          {loading ? '⏳ Creating Room...' : '📡 Enter Sacred Space (Go Live)'}
        </button>
      )}

      {showOptions && (
        <div className="sqi-golive-options">
          <button
            className="sqi-golive-option group"
            onClick={() => createRoom('group')}
          >
            <span className="sqi-option-icon">👥</span>
            <span>
              <strong>Group Session</strong>
              <span>All channel members can join · Like Zoom</span>
            </span>
          </button>
          <button
            className="sqi-golive-option private"
            onClick={() => createRoom('private')}
          >
            <span className="sqi-option-icon">🔐</span>
            <span>
              <strong>Private 1:1 Session</strong>
              <span>Share link with one student · Healing session</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

