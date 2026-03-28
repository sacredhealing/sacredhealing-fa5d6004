/** Normalizes DB slug to i18n key segment: spiritualPath.paths.<key> */
export function normalizeSpiritualPathSlugKey(slug: string): string {
  return slug.trim().replace(/-/g, '_').toLowerCase();
}

const INNER_PEACE_PATH_KEYS = new Set(['inner_peace', 'inner_peace_7day', 'inner_peace_path']);

export function isInnerPeacePathSlug(slug: string): boolean {
  return INNER_PEACE_PATH_KEYS.has(normalizeSpiritualPathSlugKey(slug));
}
