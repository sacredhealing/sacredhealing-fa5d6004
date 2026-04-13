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
  blockages: string[];
  planetaryAlignment: string;
  herbOfToday: string;
  timestamp: string;
  activeNadis: number;
  totalNadis: number;
  /** Subtle sub-Nadi channels (0–350,000) when the vision model returns them */
  activeSubNadis?: number;
  /** 0–100 primary Nadi restriction when returned */
  blockagePercentage?: number;
  remedies: string[];
  /** Per-chakra bioenergetic assessment (7–10 chakras) */
  chakraReadings?: ChakraReading[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
