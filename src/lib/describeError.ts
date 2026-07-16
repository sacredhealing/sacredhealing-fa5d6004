/**
 * Supabase/Postgrest errors are plain objects ({message, details, hint, code}),
 * not real Error instances, so `err instanceof Error` misses them and
 * `String(err)` collapses to the useless "[object Object]". Pull the real
 * fields out however the error is shaped.
 *
 * Shared across every academy's progress hook so this only needs fixing
 * once instead of once per academy (see the notes-save bug this exact
 * pattern caused in AgastyarModule.tsx).
 */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.code, e.details, e.hint].filter(
      (v): v is string => typeof v === 'string' && v.length > 0,
    );
    if (parts.length) return parts.join(' — ');
    try {
      return JSON.stringify(err);
    } catch {
      return 'unknown error';
    }
  }
  return String(err);
}
