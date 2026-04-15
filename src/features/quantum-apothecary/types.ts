export type ActivationType =
  | 'Sacred Plant'
  | 'Siddha Soma'
  | 'Bioenergetic'
  | 'Essential Oil'
  | 'Mineral'
  | 'Ayurvedic Herb'
  | 'Mushroom'
  | 'Adaptogen'
  | 'avataric'
  | 'plant_deva';

export interface Activation {
  id: string;
  name: string;
  vibrationalSignature: string;
  type: ActivationType;
  benefit: string;
  color: string;
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
  /** Subtle sub-Nadi channels (0–350,000) */
  activeSubNadis?: number;
  /** 0–100 primary Nadi restriction */
  blockagePercentage?: number;
  remedies: string[];
  /** Per-chakra bioenergetic assessment (7+ chakras) */
  chakraReadings?: ChakraReading[];
  /** Unique quantum bio-signature fingerprint for this soul */
  soulBioSignature?: string;
  /** Karmic trajectory + past-life imprints visible in the palm */
  karmaFieldReading?: string;
  /** Palm morphology type: square | rectangular | spatulate | conic | psychic */
  palmType?: string;
  /** Most prominent mount observed */
  dominantMount?: string;
  /** Soul karma path: healer | teacher | mystic | warrior | creator | devotee */
  karmaPath?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  /** Unix ms when the message was created (client); optional for legacy persisted threads */
  timestamp?: number;
}
