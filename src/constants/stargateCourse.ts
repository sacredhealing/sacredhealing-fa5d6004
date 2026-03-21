/** Optional explicit UUID from env (recommended for production). */
export const STARGATE_COURSE_ID_ENV = (import.meta.env.VITE_STARGATE_COURSE_ID as string | undefined)?.trim() ?? '';

type CoursesQuery = {
  from: (t: string) => {
    select: (c: string) => {
      eq: (a: string, v: unknown) => {
        ilike: (a: string, p: string) => {
          limit: (n: number) => {
            maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
          };
        };
      };
    };
  };
};

/**
 * Resolve the Stargate membership course id for linking scriptural materials.
 * Uses VITE_STARGATE_COURSE_ID when set; otherwise tries a loose title match on published courses.
 */
export async function resolveStargateCourseId(supabase: CoursesQuery): Promise<string | null> {
  if (STARGATE_COURSE_ID_ENV) return STARGATE_COURSE_ID_ENV;
  const { data, error } = await supabase
    .from('courses')
    .select('id')
    .eq('is_published', true)
    .ilike('title', '%stargate%')
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('resolveStargateCourseId:', error.message);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}
