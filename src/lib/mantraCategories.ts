import type { LucideIcon } from 'lucide-react';
import { Orbit, Heart, Crosshair, Leaf, Wallet, HeartPulse, Flower2, Zap, Sparkles, Library } from 'lucide-react';

/**
 * Shared mantra categories — used by Admin and Mantras page.
 * DB stores `category` as the `id` value.
 * Icons are Lucide-react for consistent, elegant styling.
 */
export const MANTRA_CATEGORIES: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'planet', label: 'Planets', icon: Orbit },
  { id: 'deity', label: 'Deity', icon: Heart },
  { id: 'intention', label: 'Intention', icon: Crosshair },
  { id: 'karma', label: 'Karma & Healing', icon: Leaf },
  { id: 'wealth', label: 'Wealth & Abundance', icon: Wallet },
  { id: 'health', label: 'Health & Vitality', icon: HeartPulse },
  { id: 'peace', label: 'Peace & Calm', icon: Flower2 },
  { id: 'protection', label: 'Protection & Power', icon: Zap },
  { id: 'spiritual', label: 'Spiritual Growth', icon: Sparkles },
  { id: 'general', label: 'General', icon: Library },
];

export type MantraCategoryId = (typeof MANTRA_CATEGORIES)[number]['id'];
