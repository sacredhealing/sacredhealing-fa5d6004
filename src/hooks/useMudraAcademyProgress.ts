import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeError } from '@/lib/describeError';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MudraCourseRow {
  id: string;
  module_number: number;
  module_key: string;
  title: string;
  subtitle: string | null;
  tier_required: string | null;
  is_published: boolean | null;
}

export interface MudraProgressRow {
  mudra_id: string;
  module_id: string;
  completed: boolean;
}

const COURSE_SELECT = 'id, module_number, module_key, title, subtitle, tier_required, is_published';
const MUDRA_SELECT = 'mudra_id, module_id, completed';

export function useMudraAcademyProgress(enabled = true) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<MudraCourseRow[]>([]);
  const [mudraProgress, setMudraProgress] = useState<Record<string, MudraProgressRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data: courseRows, error: cErr } = await supabase
        .from('mudra_academy_courses')
        .select(COURSE_SELECT)
        .order('module_number', { ascending: true });
      if (cErr) throw cErr;
      setCourses((courseRows || []) as MudraCourseRow[]);

      if (user?.id) {
        const { data: mudraRows, error: mErr } = await supabase
          .from('user_mudra_academy_mudra_progress')
          .select(MUDRA_SELECT)
          .eq('user_id', user.id);
        if (mErr) throw mErr;
        const map: Record<string, MudraProgressRow> = {};
        (mudraRows || []).forEach((row: MudraProgressRow) => {
          map[row.mudra_id] = row;
        });
        setMudraProgress(map);
      } else {
        setMudraProgress({});
      }
    } catch (e: unknown) {
      setError(describeError(e));
      setCourses([]);
      setMudraProgress({});
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const toggleMudraComplete = useCallback(
    async (moduleId: string, mudraId: string) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const prev = mudraProgress[mudraId];
      const nextCompleted = !(prev?.completed ?? false);
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_mudra_academy_mudra_progress').upsert(
        { user_id: user.id, module_id: moduleId, mudra_id: mudraId, completed: nextCompleted, completed_at: nextCompleted ? now : null, updated_at: now },
        { onConflict: 'user_id,mudra_id' },
      );
      if (upErr) throw upErr;
      setMudraProgress((m) => ({ ...m, [mudraId]: { mudra_id: mudraId, module_id: moduleId, completed: nextCompleted } }));
    },
    [user?.id, mudraProgress],
  );

  const moduleCompletionByModuleId = useMemo(() => {
    const byModule: Record<string, number> = {};
    Object.values(mudraProgress).forEach((mp) => {
      if (!mp.completed) return;
      byModule[mp.module_id] = (byModule[mp.module_id] || 0) + 1;
    });
    return byModule;
  }, [mudraProgress]);

  return { courses, mudraProgress, loading, error, refresh, toggleMudraComplete, moduleCompletionByModuleId };
}
