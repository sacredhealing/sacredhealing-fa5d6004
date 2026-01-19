/**
 * Vedic Astrology Types - Deep Reading System
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

export interface VedicReading {
  todayInfluence: TodayInfluence;
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
