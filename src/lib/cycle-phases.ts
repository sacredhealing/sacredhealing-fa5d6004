/**
 * Sovereign Hormonal Alchemy — Cycle Phase Constants
 * Four phases mapped to dosha, mantra, frequency, nutrition, movement & ritual guidance.
 */

export type CycleDosha = 'Vata' | 'Kapha' | 'Pitta';
export type CyclePhaseName = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

export interface CyclePhaseData {
  name: CyclePhaseName;
  dosha: CycleDosha;
  label: string;
  mantra: string;
  frequency: string;
  frequencyHz: number;
  nutrition: string;
  movement: string;
  ritual: string;
  mudra: string;
  mudraInstruction: string;
  colorAccent: string;
}

/** Phase 1 — Menstrual / Release (bleed days) */
export const MENSTRUAL_PHASE: CyclePhaseData = {
  name: 'Menstrual',
  dosha: 'Vata',
  label: 'Release',
  mantra: 'Om Somaye Namaha — I release into the cosmic void.',
  frequency: '396Hz (Grounding)',
  frequencyHz: 396,
  nutrition: 'Warm, grounding soups with root vegetables',
  movement: 'Yin Yoga & gentle stretching',
  ritual: 'Rose water anointing & candlelight meditation',
  mudra: 'Prithvi Mudra',
  mudraInstruction:
    'Touch the tip of the ring finger to the tip of the thumb. Visualize golden roots extending from your spine into the crystalline core of Gaia.',
  colorAccent: 'rgba(147, 130, 220, 0.85)', // soft violet
};

/** Phase 2 — Follicular / Nourish (bleed end → ovulation) */
export const FOLLICULAR_PHASE: CyclePhaseData = {
  name: 'Follicular',
  dosha: 'Kapha',
  label: 'Nourish',
  mantra: 'Om Shrim Namaha — I nourish the temple of creation.',
  frequency: '417Hz (Stimulating)',
  frequencyHz: 417,
  nutrition: 'Spicy, light greens & sprouted seeds',
  movement: 'Sun Salutations & dynamic flow',
  ritual: 'Flower offering at sunrise',
  mudra: 'Hakini Mudra',
  mudraInstruction:
    'Bring all fingertips together, forming a tent shape. Direct awareness to the third eye and invite creative Shakti to rise.',
  colorAccent: 'rgba(72, 209, 148, 0.85)', // emerald
};

/** Phase 3 — Ovulatory / Radiate (ovulation window ≈ 3 days) */
export const OVULATORY_PHASE: CyclePhaseData = {
  name: 'Ovulatory',
  dosha: 'Pitta',
  label: 'Radiate',
  mantra: 'Om Dum Durgaye Namaha — I radiate sovereign fire.',
  frequency: '528Hz (Heart Resonance)',
  frequencyHz: 528,
  nutrition: 'Cooling coconut water & raw fruits',
  movement: 'Dance, ecstatic movement & expressive flow',
  ritual: 'Mirror gazing with sandalwood tika',
  mudra: 'Anahata Mudra',
  mudraInstruction:
    'Place the right palm over the heart center; left palm on top. Breathe golden-rose light into the Anahata chakra.',
  colorAccent: 'rgba(212, 175, 55, 0.92)', // gold
};

/** Phase 4 — Luteal / Transform (post-ovulation → next bleed) */
export const LUTEAL_PHASE: CyclePhaseData = {
  name: 'Luteal',
  dosha: 'Pitta',
  label: 'Transform',
  mantra: 'Om Dum Durgaye Namaha — I transform fire into wisdom.',
  frequency: '741Hz (Intuition)',
  frequencyHz: 741,
  nutrition: 'Magnesium-rich cacao & warm sesame milk',
  movement: 'Moonlight walks & restorative yoga',
  ritual: 'Evening journaling under candlelight',
  mudra: 'Yoni Mudra',
  mudraInstruction:
    'Interlace the fingers with index fingers and thumbs forming a downward triangle. Rest at the womb center and invite Shakti inward.',
  colorAccent: 'rgba(212, 175, 55, 0.65)', // muted gold
};

export const ALL_PHASES: CyclePhaseData[] = [
  MENSTRUAL_PHASE,
  FOLLICULAR_PHASE,
  OVULATORY_PHASE,
  LUTEAL_PHASE,
];
