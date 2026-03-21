/**
 * Deep-merge locale JSON: every language inherits all keys from English,
 * with the target locale overriding only what it defines. Prevents missing
 * keys and keeps profile-chosen language consistent app-wide.
 */
export function deepMergeLocales(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const bVal = base[key];
    const oVal = override[key];
    if (
      oVal !== null &&
      oVal !== undefined &&
      typeof oVal === 'object' &&
      !Array.isArray(oVal) &&
      bVal !== null &&
      bVal !== undefined &&
      typeof bVal === 'object' &&
      !Array.isArray(bVal)
    ) {
      out[key] = deepMergeLocales(
        bVal as Record<string, unknown>,
        oVal as Record<string, unknown>
      );
    } else {
      out[key] = oVal;
    }
  }
  return out;
}
