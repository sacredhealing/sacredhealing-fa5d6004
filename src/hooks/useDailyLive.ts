import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);

  const createRoom = useCallback(async (channelId: string, title: string, description?: string, allowNonAdmin = false) => {
    if (!user) { toast.error('Please sign in'); return null; }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-room', {
        body: { action: 'create', channel_id: channelId, title, description, allow_non_admin: allowNonAdmin },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setActiveSession(data.session);
      toast.success('Live room created!');
      return data as { session: DailySession; room_url: string };
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user]);

  const endSession = useCallback(async (sessionId: string) => {
    try {
      await supabase.functions.invoke('daily-room', {
        body: { action: 'end', session_id: sessionId },
      });
      setActiveSession(null);
      toast.success('Live session ended');
    } catch {
      toast.error('Failed to end session');
    }
  }, []);

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

  return { createRoom, endSession, fetchActiveSessions, activeSession, isCreating, setActiveSession };
}
