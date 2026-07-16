import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeError } from '@/lib/describeError';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface KriyaYogaCourseRow {
  id: string;
  module_number: number;
  module_key: string;
  title: string;
  subtitle: string | null;
  tier_required: string | null;
  is_published: boolean | null;
}

export interface KriyaYogaProgressSnapshot {
  module_id: string;
  completed: boolean;
  bookmarked: boolean;
  last_accessed_at?: string | null;
}

export interface KriyaYogaStats {
  totalModules: number;
  completedModules: number;
  completionPercent: number;
  bookmarkedModules: number;
}

const COURSE_SELECT = 'id, module_number, module_key, title, subtitle, tier_required, is_published';
const PROGRESS_SELECT = 'module_id, completed, bookmarked, last_accessed_at';

export function useKriyaYogaProgress(enabled = true) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<KriyaYogaCourseRow[]>([]);
  const [progressByModuleId, setProgressByModuleId] = useState<Record<string, KriyaYogaProgressSnapshot>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data: courseRows, error: cErr } = await supabase
        .from('kriya_yoga_courses')
        .select(COURSE_SELECT)
        .order('module_number', { ascending: true });
      if (cErr) throw cErr;
      setCourses((courseRows || []) as KriyaYogaCourseRow[]);

      if (user?.id) {
        const { data: progRows, error: pErr } = await supabase
          .from('user_kriya_yoga_progress')
          .select(PROGRESS_SELECT)
          .eq('user_id', user.id);
        if (pErr) throw pErr;
        const map: Record<string, KriyaYogaProgressSnapshot> = {};
        (progRows || []).forEach((row: KriyaYogaProgressSnapshot) => {
          map[row.module_id] = row;
        });
        setProgressByModuleId(map);
      } else {
        setProgressByModuleId({});
      }
    } catch (e: unknown) {
      setError(describeError(e));
      setCourses([]);
      setProgressByModuleId({});
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const markComplete = useCallback(
    async (moduleId: string) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const now = new Date().toISOString();
      const prevBookmarked = progressByModuleId[moduleId]?.bookmarked ?? false;
      const { error: upErr } = await supabase.from('user_kriya_yoga_progress').upsert(
        { user_id: user.id, module_id: moduleId, completed: true, bookmarked: prevBookmarked, completed_at: now, last_accessed_at: now },
        { onConflict: 'user_id,module_id' },
      );
      if (upErr) throw upErr;
      setProgressByModuleId((m) => ({ ...m, [moduleId]: { module_id: moduleId, completed: true, bookmarked: prevBookmarked, last_accessed_at: now } }));
    },
    [user?.id, progressByModuleId],
  );

  const touchAccessed = useCallback(
    async (moduleId: string) => {
      if (!user?.id) return;
      const prev = progressByModuleId[moduleId];
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_kriya_yoga_progress').upsert(
        { user_id: user.id, module_id: moduleId, completed: prev?.completed ?? false, bookmarked: prev?.bookmarked ?? false, last_accessed_at: now },
        { onConflict: 'user_id,module_id' },
      );
      if (upErr) return; // best-effort
      setProgressByModuleId((m) => ({ ...m, [moduleId]: { module_id: moduleId, completed: prev?.completed ?? false, bookmarked: prev?.bookmarked ?? false, last_accessed_at: now } }));
    },
    [user?.id, progressByModuleId],
  );

  const toggleBookmark = useCallback(
    async (moduleId: string) => {
      if (!user?.id) return;
      const prev = progressByModuleId[moduleId];
      const nextBookmark = !(prev?.bookmarked ?? false);
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_kriya_yoga_progress').upsert(
        { user_id: user.id, module_id: moduleId, completed: prev?.completed ?? false, bookmarked: nextBookmark, last_accessed_at: now },
        { onConflict: 'user_id,module_id' },
      );
      if (upErr) throw upErr;
      setProgressByModuleId((m) => ({ ...m, [moduleId]: { module_id: moduleId, completed: prev?.completed ?? false, bookmarked: nextBookmark, last_accessed_at: now } }));
    },
    [user?.id, progressByModuleId],
  );

  const completedCount = useMemo(
    () => Object.values(progressByModuleId).filter((p) => p.completed).length,
    [progressByModuleId],
  );

  const stats = useMemo((): KriyaYogaStats => ({
    totalModules: courses.length,
    completedModules: completedCount,
    completionPercent: courses.length > 0 ? Math.round((completedCount / courses.length) * 100) : 0,
    bookmarkedModules: Object.values(progressByModuleId).filter((p) => p.bookmarked).length,
  }), [courses.length, completedCount, progressByModuleId]);

  return { courses, progressByModuleId, loading, error, refresh, markComplete, touchAccessed, toggleBookmark, completedCount, stats };
}
