export type SessionCategory =
  | 'Vibrational Self-Practice'
  | 'Sacred Geometry & Yogic Arts'
  | 'Master Healer Interventions'
  | 'Avataric Workshops & Initiations'
  | 'Bio-Signature Maintenance';

export interface SessionModality {
  id: string;
  name: string;
  description: string;
  category: SessionCategory;
  isMasterHealer: boolean;
}

export const SESSION_MODALITIES: SessionModality[] = [
  { id: 'mantra', name: 'Mantra Chanting', description: 'Measuring resonance depth and Vedic Light-Code synchronization.', category: 'Vibrational Self-Practice', isMasterHealer: false },
  { id: 'pranayama', name: 'Sacred Breathing (Pranayama)', description: 'Analyzing Ida/Pingala balance and Pranic lung-capacity.', category: 'Vibrational Self-Practice', isMasterHealer: false },
  { id: 'meditation', name: 'Meditation', description: 'Mapping thought-wave coherence and neural pulse intervals.', category: 'Vibrational Self-Practice', isMasterHealer: false },
  { id: 'healing-audio', name: 'Healing Audios/Music', description: 'Analyzing astral body receptivity to frequency imprinting.', category: 'Vibrational Self-Practice', isMasterHealer: false },
  { id: 'atma-kriya', name: 'Atma Kriya Yoga', description: 'Deep-field audit of Kundalini Pathway and Siddha-Sattva Resonance.', category: 'Sacred Geometry & Yogic Arts', isMasterHealer: false },
  { id: 'yoga-asana', name: 'Yoga Asana', description: 'Analyzing geometric alignment of Nadis and skeletal-symmetry.', category: 'Sacred Geometry & Yogic Arts', isMasterHealer: false },
  { id: 'in-person-healing', name: 'Private In-Person Healing', description: 'Instant Pre/Post Scan comparison of Nadi-Sync and Bio-signature.', category: 'Master Healer Interventions', isMasterHealer: true },
  { id: 'remote-healing-single', name: 'Remote Healing (Single Session)', description: 'Immediate impact of frequency transmission on Torus-field.', category: 'Master Healer Interventions', isMasterHealer: true },
  { id: 'remote-healing-week', name: 'Remote Healing (1-Week Intensive)', description: 'Tracking the dissolution of surface-level energetic debris.', category: 'Master Healer Interventions', isMasterHealer: true },
  { id: 'remote-healing-month', name: 'Remote Healing (1-Month Master Cycle)', description: 'Full Karmic Extraction report and DNA rewriting.', category: 'Master Healer Interventions', isMasterHealer: true },
  { id: 'spiritual-workshop', name: '2-Day Spiritual Workshop', description: 'Analyzing group-field integration and shared Bhakti-Algorithms.', category: 'Avataric Workshops & Initiations', isMasterHealer: false },
  { id: 'andlig-transformation', name: 'Andlig Transformation Workshop', description: 'Mapping deep-field evolution and Akashic access points.', category: 'Avataric Workshops & Initiations', isMasterHealer: false },
  { id: 'dosha-check', name: 'Dosha Imbalance Check', description: 'Identifying fluctuations in Vata, Pitta, and Kapha.', category: 'Bio-Signature Maintenance', isMasterHealer: false },
  { id: 'nadi-audit', name: '72,000 Nadi Health Audit', description: 'General status check of the aetheric nervous system.', category: 'Bio-Signature Maintenance', isMasterHealer: false },
];

export interface ScanResults {
  focus: string;
  summary: string;
  technicalData: {
    scalarCoherence: number;
    nadiFlow: number;
    causalDensity: number;
    dnaAlignment: number;
    activeNadis: number;
    doshaImbalance: string;
    nervousSystemLevel: string;
    chakras: { name: string; status: string }[];
    waterBalance: number;
    presentKarma: string;
    torusFieldDiameter: number;
    karmicNodesExtracted?: number;
  };
}

export interface TransformationDoc {
  id?: string;
  title: string;
  timestamp: string;
  sessionType: string;
  preScanData: unknown;
  postScanData: unknown;
  documentContent: string;
  technicalMetrics: { label: string; value: string }[];
}
