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
  /** LimbicArc / bio-library row category (e.g. Herb, Vitamin) when type is Bioenergetic */
  category?: string;
  sacredName?: string;
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
  /** Stable id for the in-flight assistant message while streaming */
  id?: string;
  /**
   * Codex backfill flag — set to `true` when an assistant message is persisted
   * and cleared once the curator has accepted it (saved or excluded). The boot-time
   * sweeper finds messages with this flag still set and replays them, so a Codex
   * save can never be silently lost (e.g. tab closed mid-stream, network blip).
   */
  needs_codex_sync?: boolean;
  /** Optional student id this assistant reply was routed to (for backfill replay). */
  codex_student_id?: string | null;
}
