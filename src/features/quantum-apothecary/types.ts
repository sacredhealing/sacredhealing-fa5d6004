export type ActivationType =
  | 'Wellness'
  | 'Sacred Plant'
  | 'Siddha Soma'
  | 'Bioenergetic'
  | 'Essential Oil'
  | 'Mineral'
  | 'Ayurvedic Herb'
  | 'Mushroom'
  | 'Adaptogen'
  | 'avataric'
  | 'plant_deva'
  | 'Siddha Transmission';

export interface Activation {
  id: string;
  name: string;
  vibrationalSignature: string;
  type: ActivationType;
  benefit: string;
  color: string;
  /** LimbicArc / bio-library row category (e.g. Herb, Vitamin) when type is Bioenergetic */
  category?: string;
  sacredName?: string;
  /** ISO timestamp when this activation was added to the active stack */
  activatedAt?: string;
  /** Provenance for UX / analytics */
  source?: 'manual' | 'nadi_scan' | 'voice_scan' | 'apothecary_chat';
  /** ISO timestamp — default ~8 days from activation in admin flows */
  expiresAt?: string;
}

export interface ChakraReading {
  chakra: string;
  status: 'Active' | 'Stressed' | 'Blocked' | 'Awakening';
  pct: number;
  note: string;
}

export interface NadiScanResult {
  dominantDosha: 'Vata' | 'Pitta' | 'Kapha';
  secondaryDosha?: string;
  blockages: string[];
  planetaryAlignment: string;
  herbOfToday: string;
  timestamp: string;
  activeNadis: number;
  totalNadis: number;
  activeSubNadis?: number;
  blockagePercentage?: number;
  remedies: string[];
  chakraReadings?: ChakraReading[];
  soulBioSignature?: string;
  karmaFieldReading?: string;
  palmType?: string;
  dominantMount?: string;
  karmaPath?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp?: number;
  id?: string;
  needs_codex_sync?: boolean;
  codex_student_id?: string | null;
}
