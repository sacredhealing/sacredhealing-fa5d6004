/**
 * Vedic Astrology Types - Deep Reading System with Hora Watch
 */

export type MembershipTier = 'free' | 'compass' | 'premium';

export interface UserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  plan: MembershipTier;
}

export interface CurrentDasha {
  period: string;
  meaning: string;
  focusArea: string;
}

export interface PersonalCompass {
  career: string;
  relationship: string;
  health: string;
  financial: string;
  currentDasha: CurrentDasha;
}

export interface SignificantYoga {
  name: string;
  impact: string;
}

export interface MasterBlueprint {
  soulPurpose: string;
  karmaPatterns: string;
  navamshaAnalysis: string;
  karmicNodes: string;
  significantYogas: SignificantYoga[];
  sadeSatiStatus: string;
  timingPeaks: string;
  divineRemedies: string[];
  soulMap12Houses: string;
}

export interface GuruEfficiencyHack {
  recommendedTool: string;
  toolCategory: 'Productivity' | 'Learning' | 'Creation' | 'Logic';
  whyThisTool: string;
  workflow: string[];
  proTip: string;
  limitation: string;
}

export interface TodayInfluence {
  nakshatra: string;
  description: string;
  planetaryInfluence: string;
  wisdomQuote: string;
  whatToDo: string[];
  whatToAvoid: string[];
}

// Hora Watch Types (Dr. Pillai / AstroVed inspired)
export type HoraEnergyType = 'Auspicious' | 'Neutral' | 'Inauspicious';

export interface HoraInfo {
  planet: string;
  ruler: string;
  energyType: HoraEnergyType;
  successRating: number; // 0-100 based on user's birth chart
  bestFor: string[];
  description: string;
  startTime: string;
  endTime: string;
}

export interface HoraWatch {
  currentHora: HoraInfo;
  upcomingHoras: HoraInfo[];
}

export interface VedicReading {
  todayInfluence: TodayInfluence;
  horaWatch?: HoraWatch;
  personalCompass?: PersonalCompass;
  masterBlueprint?: MasterBlueprint;
  guruEfficiencyHack: GuruEfficiencyHack;
}

// Tier mapping for display
export const TIER_DISPLAY_NAMES: Record<MembershipTier, string> = {
  free: 'Cosmic Pulse',
  compass: 'Vedic Compass',
  premium: 'Master Blueprint',
};

export const TIER_ICONS: Record<MembershipTier, string> = {
  free: 'Star',
  compass: 'Compass',
  premium: 'Crown',
};

// Planet emoji mapping for Hora Watch
export const PLANET_EMOJIS: Record<string, string> = {
  sun: '☀️',
  moon: '🌙',
  mercury: '☿️',
  venus: '♀️',
  mars: '♂️',
  jupiter: '♃',
  saturn: '♄',
  rahu: '🐉',
  ketu: '🔮',
};

export const getPlanetEmoji = (planet: string): string => {
  const p = planet.toLowerCase();
  if (p.includes('sun')) return PLANET_EMOJIS.sun;
  if (p.includes('moon')) return PLANET_EMOJIS.moon;
  if (p.includes('mercury')) return PLANET_EMOJIS.mercury;
  if (p.includes('venus')) return PLANET_EMOJIS.venus;
  if (p.includes('mars')) return PLANET_EMOJIS.mars;
  if (p.includes('jupiter')) return PLANET_EMOJIS.jupiter;
  if (p.includes('saturn')) return PLANET_EMOJIS.saturn;
  if (p.includes('rahu')) return PLANET_EMOJIS.rahu;
  if (p.includes('ketu')) return PLANET_EMOJIS.ketu;
  return '✨';
};

export const getEnergyGradient = (type: HoraEnergyType): string => {
  switch (type) {
    case 'Auspicious':
      return 'from-emerald-500/20 to-teal-500/20';
    case 'Neutral':
      return 'from-amber-500/20 to-orange-500/20';
    case 'Inauspicious':
      return 'from-rose-500/20 to-indigo-600/20';
  }
};

export const getSuccessColor = (rating: number): string => {
  if (rating > 70) return 'text-emerald-400';
  if (rating > 40) return 'text-amber-400';
  return 'text-rose-400';
};
