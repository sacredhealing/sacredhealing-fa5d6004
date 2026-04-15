import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type DailyRoomFnPayload = {
  error?: string;
  details?: string;
  hint?: string;
  session?: DailySession;
  room_url?: string;
  success?: boolean;
};

function formatDailyRoomError(data: unknown, fallback: string): string {
  const d = data as DailyRoomFnPayload | null | undefined;
  if (!d?.error) return fallback;
  const parts = [d.error, d.details, d.hint].filter(Boolean);
  return parts.length ? parts.join(' — ') : fallback;
}

/** Supabase may return a non-2xx with the JSON body only on `error.context` (not in `data`). */
async function mergeFunctionErrorPayload(
  data: unknown,
  error: unknown,
): Promise<DailyRoomFnPayload | null> {
  const direct = data as DailyRoomFnPayload | null;
  if (direct?.error || direct?.session) return direct;

  const err = error as { context?: { json?: () => Promise<unknown> } } | null;
  if (err?.context && typeof err.context.json === 'function') {
    try {
      const j = (await err.context.json()) as DailyRoomFnPayload;
      return j?.error || j?.session ? j : direct ?? null;
    } catch {
      return direct ?? null;
    }
  }
  return direct ?? null;
}

export interface DailySession {
  id: string;
  channel_id: string;
  host_user_id: string;
  title: string;
  description: string | null;
  room_url: string | null;
  room_name: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export function useDailyLive() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);

  const createRoom = useCallback(async (channelId: string, title: string, description?: string, allowNonAdmin = false, source: 'channel' | 'feed' = 'channel') => {
    if (!user) {
      toast.error(t('community.goLive.signIn'));
      return null;
    }
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    if (!token) {
      toast.error(t('community.goLive.signIn'));
      return null;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-room', {
        body: {
          action: 'create',
          channel_id: source === 'feed' ? 'feed' : channelId,
          title,
          description,
          allow_non_admin: allowNonAdmin,
          source,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await mergeFunctionErrorPayload(data, error);
      if (error || payload?.error) {
        toast.error(formatDailyRoomError(payload, error?.message || t('community.goLive.createFailed')));
        return null;
      }
      if (!payload?.session) {
        toast.error(t('community.goLive.createFailed'));
        return null;
      }
      setActiveSession(payload.session);
      toast.success(t('community.goLive.roomCreated'));
      return { session: payload.session, room_url: payload.room_url as string };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('community.goLive.createFailed');
      toast.error(msg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user, t]);

  const endSession = useCallback(async (sessionId: string) => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) {
        toast.error(t('community.goLive.signIn'));
        return;
      }
      const { data, error } = await supabase.functions.invoke('daily-room', {
        body: { action: 'end', session_id: sessionId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await mergeFunctionErrorPayload(data, error);
      if (error || payload?.error) {
        toast.error(formatDailyRoomError(payload, error?.message || t('community.goLive.endFailed')));
        return;
      }
      setActiveSession(null);
      toast.success(t('community.goLive.sessionEnded'));
    } catch {
      toast.error(t('community.goLive.endFailed'));
    }
  }, [t]);

  const fetchActiveSessions = useCallback(async (channelId?: string) => {
    let query = supabase
      .from('community_live_sessions' as any)
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false });
    if (channelId) query = query.eq('channel_id', channelId);
    const { data } = await query;
    return ((data as unknown) as DailySession[] | null) || [];
  }, []);

  return useMemo(
    () => ({ createRoom, endSession, fetchActiveSessions, activeSession, isCreating, setActiveSession }),
    [createRoom, endSession, fetchActiveSessions, activeSession, isCreating]
  );
}
