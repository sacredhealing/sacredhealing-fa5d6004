/**
 * Ayurveda Dosha Analysis Types
 */

export enum AyurvedaMembershipLevel {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  LIFETIME = 'LIFETIME'
}

export interface AyurvedaUserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  location: string;
  currentChallenge: string;
  personalityTraits: string;
}

export interface DoshaGuidelines {
  diet: string[];
  lifestyle: string[];
  herbs: string[];
}

export interface DoshaProfile {
  vata: number;
  pitta: number;
  kapha: number;
  primary: string;
  mentalConstitution: string;
  personalitySummary: string;
  lifeSituationAdvice: string;
  summary: string;
  guidelines: DoshaGuidelines;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Dosha color mapping
export const DOSHA_COLORS: Record<string, string> = {
  vata: '#93c5fd',   // Blue
  pitta: '#f87171',  // Red
  kapha: '#4ade80',  // Green
};

export const getDoshaColor = (dosha: string): string => {
  const key = dosha.toLowerCase();
  return DOSHA_COLORS[key] || '#10b981';
};

export const getDoshaEmoji = (dosha: string): string => {
  const key = dosha.toLowerCase();
  if (key.includes('vata')) return '🌬️';
  if (key.includes('pitta')) return '🔥';
  if (key.includes('kapha')) return '🌍';
  return '☯️';
};