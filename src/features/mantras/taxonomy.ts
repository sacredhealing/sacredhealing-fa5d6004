export const MANTRA_CATEGORIES = [
  { id: 'planet', label: 'Planets' },
  { id: 'deity', label: 'Deity' },
  { id: 'intention', label: 'Intention' },
  { id: 'karma', label: 'Karma & Healing' },
  { id: 'wealth', label: 'Wealth & Abundance' },
  { id: 'health', label: 'Health & Vitality' },
  { id: 'peace', label: 'Peace & Calm' },
  { id: 'protection', label: 'Protection & Power' },
  { id: 'spiritual', label: 'Spiritual Growth' },
  { id: 'general', label: 'General' },
] as const;

export type MantraCategoryId = (typeof MANTRA_CATEGORIES)[number]['id'];

export const PLANET_TYPES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
export type PlanetType = (typeof PLANET_TYPES)[number];

export function getMantraCategoryLabel(id?: string | null): string | null {
  if (!id) return null;
  return MANTRA_CATEGORIES.find((c) => c.id === id)?.label ?? null;
}

