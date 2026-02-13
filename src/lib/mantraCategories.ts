/**
 * Shared mantra categories — used by Admin and Mantras page.
 * DB stores `category` as the `id` value.
 */
export const MANTRA_CATEGORIES = [
  { id: 'planet', label: 'Planets', icon: '🪐' },
  { id: 'deity', label: 'Deity', icon: '🕉️' },
  { id: 'intention', label: 'Intention', icon: '🎯' },
  { id: 'karma', label: 'Karma & Healing', icon: '🌿' },
  { id: 'wealth', label: 'Wealth & Abundance', icon: '💰' },
  { id: 'health', label: 'Health & Vitality', icon: '💚' },
  { id: 'peace', label: 'Peace & Calm', icon: '☮️' },
  { id: 'protection', label: 'Protection & Power', icon: '🛡️' },
  { id: 'spiritual', label: 'Spiritual Growth', icon: '✨' },
  { id: 'general', label: 'General', icon: '🌟' },
] as const;

export type MantraCategoryId = (typeof MANTRA_CATEGORIES)[number]['id'];
