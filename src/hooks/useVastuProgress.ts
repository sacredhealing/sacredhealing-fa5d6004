import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/describeError';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface VastuLessonProgressRow {
  lesson_id: string;
  completed: boolean;
  last_accessed_at?: string | null;
}

const SELECT = 'lesson_id, completed, last_accessed_at';

export function useVastuProgress(enabled = true) {
  const { user } = useAuth();
  const [progressByLessonId, setProgressByLessonId] = useState<Record<string, VastuLessonProgressRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !user?.id) {
      setProgressByLessonId({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fErr } = await supabase
        .from('user_vastu_lesson_progress')
        .select(SELECT)
        .eq('user_id', user.id);
      if (fErr) throw fErr;
      const map: Record<string, VastuLessonProgressRow> = {};
      (data || []).forEach((row: VastuLessonProgressRow) => {
        map[row.lesson_id] = row;
      });
      setProgressByLessonId(map);
    } catch (e: unknown) {
      setError(describeError(e));
      setProgressByLessonId({});
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const markComplete = useCallback(
    async (lessonId: string) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_vastu_lesson_progress').upsert(
        { user_id: user.id, lesson_id: lessonId, completed: true, completed_at: now, last_accessed_at: now },
        { onConflict: 'user_id,lesson_id' },
      );
      if (upErr) throw upErr;
      setProgressByLessonId((m) => ({ ...m, [lessonId]: { lesson_id: lessonId, completed: true, last_accessed_at: now } }));
    },
    [user?.id],
  );

  const touchAccessed = useCallback(
    async (lessonId: string) => {
      if (!user?.id) return;
      const prev = progressByLessonId[lessonId];
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_vastu_lesson_progress').upsert(
        { user_id: user.id, lesson_id: lessonId, completed: prev?.completed ?? false, last_accessed_at: now },
        { onConflict: 'user_id,lesson_id' },
      );
      if (upErr) return;
      setProgressByLessonId((m) => ({ ...m, [lessonId]: { lesson_id: lessonId, completed: prev?.completed ?? false, last_accessed_at: now } }));
    },
    [user?.id, progressByLessonId],
  );

  const completedLessonIds = new Set(Object.values(progressByLessonId).filter((p) => p.completed).map((p) => p.lesson_id));

  return { progressByLessonId, completedLessonIds, loading, error, refresh, markComplete, touchAccessed };
}
