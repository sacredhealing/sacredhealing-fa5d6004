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
  /** ISO timestamp — default ~8 days from activation */
  expiresAt?: string;
  /**
   * Deterministic SHA-256 frequency hash — the digital signature of this ingredient.
   * Derived from name + type + benefit. Acts as the quantum anchor payload:
   * stored alongside the user's voice FFT fingerprint in user_active_transmissions.
   * This is the same mechanism as LimbicArc's "Virtual Ingredient" digital signature.
   */
  frequencyHash?: string;
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

/**
 * The quantum anchor stored per user in user_active_transmissions.
 * Links the user's unique voice FFT fingerprint to the active ingredient
 * frequency hashes — the same mechanism as LimbicArc's quantum entanglement link.
 */
export interface QuantumAnchor {
  /** FFT frequency array extracted from the user's voice scan (RMS + centroid + ZCR series) */
  voiceFftFingerprint: number[];
  /** ISO timestamp of the voice scan that created this anchor */
  anchoredAt: string;
  /** Dosha reading from the voice scan */
  dominantDosha: string;
  /** Nadi channel from the voice scan */
  nadiReading: string;
  /** Overall coherence score 0-100 */
  coherenceScore: number;
}
