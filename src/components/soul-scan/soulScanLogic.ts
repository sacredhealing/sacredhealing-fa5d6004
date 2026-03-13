/**
 * Soul-scan scan logic — mirrors /quantum-apothecary runNadiScan so soul-scan
 * produces the same style of results (day-based planetary/herb, random dosha,
 * blockages, active nadis, remedies). Output is mapped to ScanResults for
 * transformation doc and archive.
 */

import type { ScanResults } from '@/types/soulScan';

// Same as quantum-apothecary PLANETARY_DATA (day 0 = Sunday … 6 = Saturday)
const PLANETARY_DATA: Record<number, { planet: string; herb: string }> = {
  0: { planet: 'Sun (Surya)', herb: 'Saffron, Calamus, Ginger' },
  1: { planet: 'Moon (Chandra)', herb: 'Ashwagandha, Blue Lotus, Shatavari' },
  2: { planet: 'Mars (Mangala)', herb: 'Nettle, Maca, Guduchi' },
  3: { planet: 'Mercury (Budha)', herb: 'Brahmi, Gotu Kola, Tulsi' },
  4: { planet: 'Jupiter (Guru)', herb: 'Turmeric, Ginseng' },
  5: { planet: 'Venus (Shukra)', herb: 'Rose, Bobinsana' },
  6: { planet: 'Saturn (Shani)', herb: 'Shilajit, Triphala, Myrrh' },
};

const DOSHAS: ('Vata' | 'Pitta' | 'Kapha')[] = ['Vata', 'Pitta', 'Kapha'];

const NADI_BLOCKAGES = [
  'Throat/Vishuddhi Nadi',
  'Root/Muladhara Nadi',
  'Heart/Anahata Nadi',
  '3rd Eye/Ajna Nadi',
  'Solar Plexus/Manipura Nadi',
];

// Remedy names from quantum-apothecary ACTIVATIONS (subset for 5-random pick)
const REMEDY_NAMES = [
  'The Grandmother Presence',
  'The Neural Teacher',
  'Third-Eye Decalcifier (Blue Lotus)',
  'Primordial Earth Grounding',
  'Neural Calm Sync',
  'Ashwagandha Resonance',
  'Brahmi Code',
  'Turmeric Radiance',
  'Gold (Colloidal)',
  'Reishi (The Spirit)',
  "Lion's Mane (The Mind)",
  'Cordyceps (The Prana)',
  'Infinite Manifestation Stream',
  'Crystalline Sovereignty',
  'Systemic Fortification',
  'Core Gravity Alignment',
  'Deep Sleep Harmonic',
  'NMN Cellular Battery',
  'Rose Heart Bloom',
  'Frankincense',
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Same logic as quantum-apothecary runNadiScan: 5s “scan” then build result
 * from current day (planet/herb), random dosha, random blockage, random
 * activeNadis 60k–70k, 5 random remedies. Returns ScanResults for soul-scan.
 */
export function runSoulScanLogic(
  isHealerPresent: boolean,
  modalityName: string
): ScanResults {
  const now = new Date();
  const day = now.getDay();
  const planetary = PLANETARY_DATA[day] ?? PLANETARY_DATA[0];
  const dominantDosha = DOSHAS[Math.floor(Math.random() * DOSHAS.length)];
  const blockage = NADI_BLOCKAGES[Math.floor(Math.random() * NADI_BLOCKAGES.length)];
  const activeNadis = Math.floor(Math.random() * 10000) + 60000;
  const totalNadis = 72000;
  const remedies = shuffle(REMEDY_NAMES).slice(0, 5);

  const focus = isHealerPresent
    ? `Master Intervention: ${modalityName}`
    : `Self-Practice: ${modalityName}`;

  const summary = isHealerPresent
    ? `Direct Healer Transmission via ${modalityName}: 14 layers of past-life karma dissolved and Akashic records rewritten. Alignment: ${planetary.planet}. Herb of today: ${planetary.herb}. Active Nadis: ${activeNadis}/${totalNadis}. Remedies: ${remedies.join(', ')}.`
    : `User Practice (${modalityName}): DNA coherence increased via Mantra vibration and Aura harmonization. Dominant Dosha: ${dominantDosha}. Blockage: ${blockage}. Alignment: ${planetary.planet}. Herb of today: ${planetary.herb}. Active Nadis: ${activeNadis}/${totalNadis}. Remedies: ${remedies.join(', ')}.`;

  const scalarCoherence = isHealerPresent ? 90 + Math.random() * 10 : 70 + Math.random() * 15;
  const nadiFlow = isHealerPresent ? 88 + Math.random() * 12 : 62 + Math.random() * 18;
  const causalDensity = isHealerPresent ? 8 + Math.random() * 8 : 38 + Math.random() * 18;
  const dnaAlignment = isHealerPresent ? 95 + Math.random() * 5 : 78 + Math.random() * 12;

  const chakraStatus = (name: string, blocked: boolean) =>
    blocked ? (isHealerPresent ? 'Aligned' : 'Blocked') : 'Opening';
  const blockageLower = blockage.toLowerCase();
  const chakras = [
    { name: 'Root', status: chakraStatus('Root', blockageLower.includes('root')) },
    { name: 'Sacral', status: chakraStatus('Sacral', blockageLower.includes('sacral')) },
    { name: 'Solar', status: chakraStatus('Solar', blockageLower.includes('solar')) },
    { name: 'Heart', status: 'Opening' },
    { name: 'Throat', status: chakraStatus('Throat', blockageLower.includes('throat')) },
    { name: 'Third Eye', status: chakraStatus('Third', blockageLower.includes('3rd') || blockageLower.includes('ajna')) },
    { name: 'Crown', status: isHealerPresent ? 'Aligned' : 'Dormant' },
  ];

  // Extended SoulScan metrics
  const stressLevel = isHealerPresent
    ? Math.round((5 + Math.random() * 15) * 10) / 10
    : Math.round((45 + Math.random() * 35) * 10) / 10;
  const bloodLevel = isHealerPresent
    ? Math.round((78 + Math.random() * 18) * 10) / 10
    : Math.round((52 + Math.random() * 22) * 10) / 10;
  const mindLevel = isHealerPresent
    ? Math.round((85 + Math.random() * 14) * 10) / 10
    : Math.round((48 + Math.random() * 28) * 10) / 10;
  const pastLifeClarity = isHealerPresent
    ? Math.round((80 + Math.random() * 18) * 10) / 10
    : Math.round((30 + Math.random() * 35) * 10) / 10;
  const jyotishAlignment = isHealerPresent
    ? Math.round((88 + Math.random() * 12) * 10) / 10
    : Math.round((55 + Math.random() * 30) * 10) / 10;
  const heartSync = isHealerPresent
    ? Math.round((90 + Math.random() * 10) * 10) / 10
    : Math.round((42 + Math.random() * 30) * 10) / 10;

  return {
    focus,
    summary,
    technicalData: {
      scalarCoherence: Math.round(scalarCoherence * 10) / 10,
      nadiFlow: Math.round(nadiFlow * 10) / 10,
      causalDensity: Math.round(causalDensity * 10) / 10,
      dnaAlignment: Math.round(dnaAlignment * 10) / 10,
      activeNadis,
      doshaImbalance: isHealerPresent ? 'Balanced' : dominantDosha,
      nervousSystemLevel: isHealerPresent ? 'Deep Parasympathetic' : 'Sympathetic Dominant',
      chakras,
      waterBalance: isHealerPresent ? 70 + Math.floor(Math.random() * 10) : 60 + Math.floor(Math.random() * 12),
      presentKarma: isHealerPresent ? 'Cleared' : `Blockage: ${blockage}`,
      torusFieldDiameter: Math.round((isHealerPresent ? 10 + Math.random() * 5 : 3 + Math.random() * 4) * 10) / 10,
      karmicNodesExtracted: isHealerPresent ? Math.floor(Math.random() * 20) + 5 : undefined,
      stressLevel,
      bloodLevel,
      mindLevel,
      pastLifeClarity,
      jyotishAlignment,
      heartSync,
    },
  };
}
