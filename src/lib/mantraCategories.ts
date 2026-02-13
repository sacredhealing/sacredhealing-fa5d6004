/**
 * Shared mantra categories — used by Admin and Mantras page.
 * DB stores `category` as the `id` value.
 */
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
