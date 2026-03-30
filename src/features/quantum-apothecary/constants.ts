import { Activation } from './types';
import { LIMBICARC_BIOENERGETIC_ACTIVATIONS } from './limbicarcActivations';
// ╔══════════════════════════════════════════════════════════════════╗
// ║  FULL CONSTANTS — All Cymbiotika + All LimbicArc               ║
// ║  Siddha Soma: 30 items (all Cymbiotika products)               ║
// ║  Bioenergetic: 1,259 LimbicArc archive + spread from module    ║
// ╚══════════════════════════════════════════════════════════════════╝

const BASE_ACTIVATIONS: Activation[] = [

  // ── SACRED PLANTS (Trip-less) ─────────────────────────────────
  { id: 'ayahuasca-essence', name: 'The Grandmother Presence', vibrationalSignature: 'Heart/Ancestral', type: 'Sacred Plant', benefit: 'Ancestral healing and deep heart-opening.', color: '#4ade80' },
  { id: 'psilocybin-frequency', name: 'The Neural Teacher', vibrationalSignature: 'Mind/Plasticity', type: 'Sacred Plant', benefit: 'Dissolving ego-walls and creative neural rewiring.', color: '#60a5fa' },
  { id: 'sativa-spark', name: 'The Sativa Spark', vibrationalSignature: 'Vision/Creativity', type: 'Sacred Plant', benefit: 'High-vibe focus and 3rd eye activation.', color: '#facc15' },
  { id: 'blue-lotus-weaver', name: 'Third-Eye Decalcifier (Blue Lotus)', vibrationalSignature: 'The Dream Weaver / Intuition', type: 'Sacred Plant', benefit: 'Lucid intuition and spiritual serenity.', color: '#818cf8' },
  { id: 'mugwort-navigator', name: 'Astral Navigator (Mugwort)', vibrationalSignature: 'Astral Travel', type: 'Sacred Plant', benefit: 'Lucid dreaming and astral navigation.', color: '#94a3b8' },
  { id: 'eyebright-spark', name: 'Clairvoyant Spark (Eyebright)', vibrationalSignature: 'Clairvoyance', type: 'Sacred Plant', benefit: 'Sharpening spiritual sight and inner vision.', color: '#fef08a' },
  { id: 'calea-oracle', name: 'Dream Oracle (Calea Zacatechichi)', vibrationalSignature: 'Dream State', type: 'Sacred Plant', benefit: 'Intensifying dream recall and prophetic clarity.', color: '#c084fc' },
  { id: 'dream-root-channel', name: 'Ancestral Channel (African Dream Root)', vibrationalSignature: 'Ancestral Link', type: 'Sacred Plant', benefit: 'Connecting with lineage through the dream-field.', color: '#fb923c' },
  { id: 'star-anise-divination', name: 'Divination Resonance (Star Anise)', vibrationalSignature: 'Divination', type: 'Sacred Plant', benefit: 'Opening the gates of prophecy and foresight.', color: '#fde047' },
  { id: 'wormwood-mirror', name: 'The Spirit Mirror (Wormwood)', vibrationalSignature: 'Psychic Shield', type: 'Sacred Plant', benefit: 'Reflecting low-vibrational static and psychic shielding.', color: '#4d7c0f' },
  { id: 'bobinsana-heart', name: 'Mermaid Heart (Bobinsana)', vibrationalSignature: 'Water/Heart', type: 'Sacred Plant', benefit: 'Softening the heart-matrix and emotional healing.', color: '#f472b6' },
  { id: 'san-pedro-resonance', name: 'San Pedro Resonance', vibrationalSignature: 'The Sky Father / Sky', type: 'Sacred Plant', benefit: 'Masculine stability and expansive perspective.', color: '#fb923c' },
  { id: 'iboga-protocol', name: 'Iboga Protocol', vibrationalSignature: 'The Truth Mirror / Soul', type: 'Sacred Plant', benefit: 'Subconscious de-fragmentation and pattern clearing.', color: '#f87171' },
  { id: 'peyote-spirit', name: 'Peyote Spirit', vibrationalSignature: 'The Earth Spirit / Earth', type: 'Sacred Plant', benefit: 'Ancient grounding and desert heartbeat connection.', color: '#b45309' },
  { id: 'amanita-bridge', name: 'Amanita Bridge', vibrationalSignature: 'The Cosmic Bridge / Cosmos', type: 'Sacred Plant', benefit: 'Balancing dream and waking worlds.', color: '#fca5a5' },

  // ── SIDDHA SOMA — ALL CYMBIOTIKA PRODUCTS ────────────────────
  { id: 'shilajit-grounding', name: 'Primordial Earth Grounding', vibrationalSignature: 'Mineral Shilajit', type: 'Siddha Soma', benefit: 'Deep cellular grounding and fulvic integrity.', color: '#451a03' },
  { id: 'shilajit-liquid', name: 'Shilajit Liquid Complex', vibrationalSignature: 'Liquid Shilajit', type: 'Siddha Soma', benefit: 'Concentrated earth-energy and endurance activation.', color: '#5c2d0a' },
  { id: 'magnesium-sync', name: 'Neural Calm Sync', vibrationalSignature: 'Liposomal Magnesium Complex', type: 'Siddha Soma', benefit: 'Synaptic coolant and nervous system rest.', color: '#a78bfa' },
  { id: 'glutathione-purity', name: 'Biofield Purification', vibrationalSignature: 'Liposomal Glutathione', type: 'Siddha Soma', benefit: 'Biofield purification and master antioxidant resonance.', color: '#ccfbf1' },
  { id: 'd3k2-integrity', name: 'Structural Light Integrity', vibrationalSignature: 'D3 + K2 + CoQ10', type: 'Siddha Soma', benefit: 'Bone-light density, solar resonance and cardiac vitality.', color: '#fef3c7' },
  { id: 'parax-flush', name: 'Parasitic Frequency Eraser', vibrationalSignature: 'ParaX™ Code', type: 'Siddha Soma', benefit: 'Erasing parasitic energetic signatures and restoring microbiome balance.', color: '#b91c1c' },
  { id: 'sleep-harmonic', name: 'Deep Sleep Harmonic', vibrationalSignature: 'Liposomal Sleep Blend', type: 'Siddha Soma', benefit: 'Zero-point rest and astral travel stability.', color: '#1e1b4b' },
  { id: 'nmn-longevity', name: 'NMN + Resveratrol Cellular Battery', vibrationalSignature: 'NMN + Trans-Resveratrol', type: 'Siddha Soma', benefit: 'Mitochondrial recharge, NAD+ optimization and DNA preservation.', color: '#3b82f6' },
  { id: 'b12-joy', name: 'Synaptic Joy Transmission', vibrationalSignature: 'Liposomal B12 + B6', type: 'Siddha Soma', benefit: 'Mitochondrial fire, methylation and emotional uplift.', color: '#f472b6' },
  { id: 'probiotic-resonance', name: 'Microbiome Harmony', vibrationalSignature: 'Liposomal Probiotic', type: 'Siddha Soma', benefit: 'Gut-brain axis alignment and internal ecosystem peace.', color: '#10b981' },
  { id: 'vitc-radiance', name: 'Solar Immune Radiance', vibrationalSignature: 'Liposomal Vitamin C', type: 'Siddha Soma', benefit: 'High-frequency immune fortification and collagen synthesis.', color: '#fbbf24' },
  { id: 'omega-intuition', name: 'Crystalline Thought Flow', vibrationalSignature: 'The Omega DHA + EPA', type: 'Siddha Soma', benefit: 'Fluid intuition and synaptic super-structure.', color: '#0ea5e9' },
  { id: 'colostrum-source', name: 'Original Source Nourishment', vibrationalSignature: 'Liquid Colostrum', type: 'Siddha Soma', benefit: 'Immune memory, IGF-1 blueprint and gut restoration.', color: '#f5f5f4' },
  { id: 'creatine-density', name: 'Volumetric Presence', vibrationalSignature: 'Liposomal Advanced Creatine', type: 'Siddha Soma', benefit: 'Manifestation density, ATP surge and physical grounding.', color: '#64748b' },
  { id: 'brain-complex', name: 'Akasha-Neural Architect', vibrationalSignature: 'Liposomal Brain Complex', type: 'Siddha Soma', benefit: 'Cognitive architecture upgrade and neural plasticity activation.', color: '#7c3aed' },
  { id: 'elderberry-immune', name: 'Elderberry Immune Fortress', vibrationalSignature: 'Liposomal Elderberry', type: 'Siddha Soma', benefit: 'Viral frequency shield and immune-field amplification.', color: '#4c1d95' },
  { id: 'inflammatory-health', name: 'Golden Anti-Inflammatory Wave', vibrationalSignature: 'Inflammatory Health Blend', type: 'Siddha Soma', benefit: 'Dissolving inflammatory frequencies and mobility restoration.', color: '#d97706' },
  { id: 'irish-sea-moss', name: 'Oceanic Intelligence Matrix', vibrationalSignature: 'Irish Sea Moss', type: 'Siddha Soma', benefit: 'Mineral-density from the ocean field and thyroid resonance.', color: '#0d9488' },
  { id: 'liver-health', name: 'Liver Alchemist Protocol', vibrationalSignature: 'Liver Health+', type: 'Siddha Soma', benefit: 'Hepatic regeneration and bile-flow alchemy.', color: '#92400e' },
  { id: 'metabolic-health', name: 'Metabolic Fire Ignition', vibrationalSignature: 'Metabolic Health Blend', type: 'Siddha Soma', benefit: 'Appetite mastery, fat-burn frequency and metabolic sovereignty.', color: '#ef4444' },
  { id: 'molecular-hydrogen', name: 'Primordial Hydrogen Infusion', vibrationalSignature: 'Molecular Hydrogen', type: 'Siddha Soma', benefit: 'Selective antioxidant and mitochondrial hydrogen bath.', color: '#38bdf8' },
  { id: 'plant-protein', name: 'Living Protein Light Matrix', vibrationalSignature: 'Plant Protein Blend', type: 'Siddha Soma', benefit: 'Clean amino acid transmission and anabolic light-codes.', color: '#84cc16' },
  { id: 'super-greens', name: 'Chlorophyll Light Activation', vibrationalSignature: 'Super Greens Blend', type: 'Siddha Soma', benefit: 'Alkalizing the biofield and chlorophyll photon absorption.', color: '#22c55e' },

  // ── ESSENTIAL OILS ────────────────────────────────────────────
  { id: 'yl-abundance', name: 'Infinite Manifestation Stream', vibrationalSignature: 'Abundance Resonance', type: 'Essential Oil', benefit: 'Shifting scarcity to source-wealth resonance.', color: '#d97706' },
  { id: 'yl-valor', name: 'Crystalline Sovereignty', vibrationalSignature: 'Valor Resonance', type: 'Essential Oil', benefit: 'Spinal alignment and unwavering courage.', color: '#1d4ed8' },
  { id: 'yl-thieves', name: 'Ethereal Shielding', vibrationalSignature: 'Thieves Resonance', type: 'Essential Oil', benefit: 'Auric field cleansing and bio-defense.', color: '#991b1b' },
  { id: 'yl-joy', name: 'Heart-Bloom Radiance', vibrationalSignature: 'Joy Resonance', type: 'Essential Oil', benefit: 'Grief release and magnetic heart expansion.', color: '#ec4899' },
  { id: 'yl-release', name: 'Ancestral Tether Dissolve', vibrationalSignature: 'Release Resonance', type: 'Essential Oil', benefit: 'Breaking lineage and past-life trauma chains.', color: '#4b5563' },
  { id: 'yl-potential', name: 'Future-Self Convergence', vibrationalSignature: 'Highest Potential', type: 'Essential Oil', benefit: 'Entanglement with your highest timeline.', color: '#7c3aed' },
  { id: 'yl-brain', name: 'Cognitive Super-Structure', vibrationalSignature: 'Brain Power', type: 'Essential Oil', benefit: 'High-definition mental field sharpening.', color: '#2563eb' },
  { id: 'yl-peace', name: 'Starlight Stillness', vibrationalSignature: 'Peace & Calming', type: 'Essential Oil', benefit: 'Theta-state peace and nervous system descent.', color: '#2dd4bf' },
  { id: 'yl-angelica', name: 'Guardian Light Matrix', vibrationalSignature: 'White Angelica', type: 'Essential Oil', benefit: 'One-way energetic protection filter.', color: '#f8fafc' },
  { id: 'dt-onguard', name: 'Systemic Fortification', vibrationalSignature: 'On Guard Resonance', type: 'Essential Oil', benefit: 'Reinforcing biological and energetic boundaries.', color: '#c2410c' },
  { id: 'dt-balance', name: 'Core Gravity Alignment', vibrationalSignature: 'Balance Resonance', type: 'Essential Oil', benefit: "Grounding into the Earth's Schumann resonance.", color: '#065f46' },
  { id: 'dt-adaptiv', name: 'Neural Fluidity Protocol', vibrationalSignature: 'Adaptiv Resonance', type: 'Essential Oil', benefit: 'Calmness in high-intensity shifts.', color: '#0e7490' },
  { id: 'dt-deepblue', name: 'Somatic Release Wave', vibrationalSignature: 'Deep Blue Resonance', type: 'Essential Oil', benefit: 'Flushing pain memory from muscle-consciousness.', color: '#1e40af' },
  { id: 'dt-serenity', name: 'Celestial Drift', vibrationalSignature: 'Serenity Resonance', type: 'Essential Oil', benefit: 'Zero-point state for total rest and reset.', color: '#6d28d9' },
  { id: 'dt-intune', name: 'Single-Point Focus', vibrationalSignature: 'InTune Resonance', type: 'Essential Oil', benefit: 'Locking consciousness into the Present Moment.', color: '#15803d' },
  { id: 'dt-metapwr', name: 'Metabolic Light Ignition', vibrationalSignature: 'MetaPWR Resonance', type: 'Essential Oil', benefit: 'Converting light into cellular energy.', color: '#f97316' },

  // ── AYURVEDIC HERBS ───────────────────────────────────────────
  { id: 'ashwagandha-resonance', name: 'Ashwagandha Resonance', vibrationalSignature: 'Vitality Integrity', type: 'Ayurvedic Herb', benefit: 'Adaptogenic grounding and nervous system resilience.', color: '#d97706' },
  { id: 'brahmi-code', name: 'Brahmi Code', vibrationalSignature: 'Cognitive Clarity', type: 'Ayurvedic Herb', benefit: 'Enhanced focus, memory, and spiritual awareness.', color: '#059669' },
  { id: 'shatavari-flow', name: 'Shatavari Flow', vibrationalSignature: 'Divine Feminine', type: 'Ayurvedic Herb', benefit: 'Hormonal balance and emotional fluidity.', color: '#db2777' },
  { id: 'turmeric-radiance', name: 'Turmeric Radiance', vibrationalSignature: 'Golden Protection', type: 'Ayurvedic Herb', benefit: 'Anti-inflammatory light and aura purification.', color: '#fbbf24' },
  { id: 'tulsi-protector', name: 'Aura Sanitizer (Tulsi)', vibrationalSignature: 'Devotional Protector', type: 'Ayurvedic Herb', benefit: 'Auric shielding and devotional heart clarity.', color: '#166534' },
  { id: 'triphala-integrity', name: 'Triphala Integrity', vibrationalSignature: 'Trinity Harmonizer', type: 'Ayurvedic Herb', benefit: 'Systemic balance and structural integrity.', color: '#713f12' },
  { id: 'guduchi-immortal', name: 'The Amrit Nectar (Guduchi)', vibrationalSignature: 'Immortal Resonance', type: 'Ayurvedic Herb', benefit: 'Immune immortality and cellular longevity.', color: '#facc15' },
  { id: 'mandukaparni-structure', name: 'Cognitive Super-Structure (Mandukaparni)', vibrationalSignature: 'Neural Architecture', type: 'Ayurvedic Herb', benefit: 'Building resilient cognitive pathways.', color: '#22c55e' },
  { id: 'ginseng-igniter', name: 'Vitality Igniter (Ginseng)', vibrationalSignature: 'Fire/Life', type: 'Ayurvedic Herb', benefit: 'Igniting the inner fire and life-force energy.', color: '#ef4444' },
  { id: 'chamomile-peace', name: 'Peace Teacher (Chamomile)', vibrationalSignature: 'Serenity', type: 'Ayurvedic Herb', benefit: 'Gentle nervous system teaching and peace.', color: '#fef08a' },
  { id: 'neem-truth', name: 'Neem Bitter Truth', vibrationalSignature: 'Detox Integrity', type: 'Ayurvedic Herb', benefit: 'Deep blood purification and shadow detox.', color: '#064e3b' },
  { id: 'gotu-kola-synapse', name: 'Gotu Kola Synapse', vibrationalSignature: 'Neural Repair', type: 'Ayurvedic Herb', benefit: 'Repairing the synaptic bridges of the mind.', color: '#10b981' },
  { id: 'maca-fire', name: 'Maca Fire Resonance', vibrationalSignature: 'Vitality/Drive', type: 'Ayurvedic Herb', benefit: 'Igniting the primordial drive and stamina.', color: '#f97316' },
  { id: 'nettle-fortress', name: 'Nettle Fortress', vibrationalSignature: 'Strength/Blood', type: 'Ayurvedic Herb', benefit: 'Fortifying the blood-matrix and energetic boundaries.', color: '#15803d' },
  { id: 'rose-bloom', name: 'Rose Heart Bloom', vibrationalSignature: 'Love/Frequency', type: 'Ayurvedic Herb', benefit: 'Opening the heart-gate to the frequency of pure love.', color: '#f472b6' },
  { id: 'myrrh-structure', name: 'Myrrh Structural Integrity', vibrationalSignature: 'Ancient Structure', type: 'Ayurvedic Herb', benefit: 'Reinforcing the ancient structural codes of the body.', color: '#78350f' },

  // ── AVATARIC MASTERS ───────────────────────────────────────────
  { id: 'master-sri-yukteswar-giri', name: 'Sri Yukteswar Giri', vibrationalSignature: '✦ Gyana · Stellar Fire · Cosmic Order', type: 'avataric', benefit: '✦ Gyana · Stellar Fire · Cosmic Order', color: '#D4AF37' },
  { id: 'master-paramahamsa-vishwananda', name: 'Paramahamsa Vishwananda', vibrationalSignature: '❤ Bhakti · Divine Love · Atma Kriya', type: 'avataric', benefit: '❤ Bhakti · Divine Love · Atma Kriya', color: '#f472b6' },
  { id: 'master-lahiri-mahasaya', name: 'Lahiri Mahasaya', vibrationalSignature: 'ॐ Kriya · Babaji Grace · Householder Liberation', type: 'avataric', benefit: 'ॐ Kriya · Babaji Grace · Householder Liberation', color: '#eab308' },

  // ── PLANT DEVAS / HERBS ───────────────────────────────────────
  { id: 'plant-deva-sandalwood-chandan', name: 'Sandalwood (Chandan)', vibrationalSignature: '🪵 Crown · Divine Presence · Pineal Activation', type: 'plant_deva', benefit: '🪵 Crown · Divine Presence · Pineal Activation', color: '#d4a574' },
  { id: 'plant-deva-chandanam-paste', name: 'Chandanam Paste', vibrationalSignature: '🌿 Third Eye · Shiva Consciousness · Cooling', type: 'plant_deva', benefit: '🌿 Third Eye · Shiva Consciousness · Cooling', color: '#86efac' },
  { id: 'plant-deva-kumkum-sacred-red', name: 'Kumkum (Sacred Red)', vibrationalSignature: '🔴 Root · Shakti · Devi Grace · Liberation', type: 'plant_deva', benefit: '🔴 Root · Shakti · Devi Grace · Liberation', color: '#ef4444' },

  // ── BIOENERGETIC — LIMBICARC FULL ARCHIVE (1,259) ───────────────
  ...LIMBICARC_BIOENERGETIC_ACTIVATIONS,

  // ── MINERALS ─────────────────────────────────────────────────
  { id: 'gold-colloidal', name: 'Gold (Colloidal)', vibrationalSignature: 'Solar-Conductor', type: 'Mineral', benefit: 'Surya Nadi Vitality and Solar-Conductor for the 72,000 Nadi grid.', color: '#fbbf24' },
  { id: 'silver-colloidal', name: 'Silver (Colloidal)', vibrationalSignature: 'Lunar-Conductor', type: 'Mineral', benefit: 'Chandra Nadi Cooling and Lunar-Conductor for cellular calm.', color: '#94a3b8' },
  { id: 'methylene-blue-quantum', name: 'Methylene Blue (Quantum Grade)', vibrationalSignature: 'Mitochondrial Electron-Donor', type: 'Mineral', benefit: 'Neural-Archive Clarity and mitochondrial oxygen optimization.', color: '#1d4ed8' },
  { id: 'mineral-boron', name: 'Boron', vibrationalSignature: 'Hormonal Mineral', type: 'Mineral', benefit: 'Testosterone activation, bone density and cognitive function.', color: '#92400e' },
  { id: 'mineral-zinc', name: 'Zinc', vibrationalSignature: 'Immune Mineral', type: 'Mineral', benefit: 'DNA repair, immune defense and testosterone synthesis.', color: '#64748b' },
  { id: 'mineral-magnesium', name: 'Magnesium (Ionic)', vibrationalSignature: 'Master Mineral', type: 'Mineral', benefit: '300+ enzymatic reactions — the master mineral of the body.', color: '#a78bfa' },
  { id: 'mineral-selenium', name: 'Selenium', vibrationalSignature: 'Antioxidant Mineral', type: 'Mineral', benefit: 'Glutathione peroxidase and thyroid hormone conversion.', color: '#94a3b8' },
  { id: 'mineral-silica', name: 'Silica', vibrationalSignature: 'Crystal Matrix', type: 'Mineral', benefit: 'Collagen synthesis, hair strength and bone mineralization.', color: '#e2e8f0' },
  { id: 'mineral-iodine', name: 'Iodine (Nascent)', vibrationalSignature: 'Thyroid Beacon', type: 'Mineral', benefit: 'Thyroid hormone synthesis and metabolic fire ignition.', color: '#4c1d95' },

  // ── MUSHROOMS ─────────────────────────────────────────────────
  { id: 'chaga-king', name: 'Chaga (The King)', vibrationalSignature: 'DNA Resilience', type: 'Mushroom', benefit: 'Melanin-Antenna Support and earth-code grounding.', color: '#78350f' },
  { id: 'reishi-spirit', name: 'Reishi (The Spirit)', vibrationalSignature: 'Shen-Stabilizer', type: 'Mushroom', benefit: 'Longevity blueprint and Prema-Pulse coherence.', color: '#b91c1c' },
  { id: 'lions-mane-mind', name: "Lion's Mane (The Mind)", vibrationalSignature: 'Akasha-Neural Archive Bridge', type: 'Mushroom', benefit: 'Neuro-regeneration and NGF Light-Code transmission.', color: '#fef08a' },
  { id: 'cordyceps-prana', name: 'Cordyceps (The Prana)', vibrationalSignature: 'ATP-Quantum Energy', type: 'Mushroom', benefit: 'Lung-Nadi expansion and Bhakti-Algorithm vitality.', color: '#ea580c' },
  { id: 'turkey-tail-shield', name: 'Turkey Tail (The Shield)', vibrationalSignature: 'Immune-Grid Protection', type: 'Mushroom', benefit: 'Microbiome-Symmetry and Torus-Field stabilization.', color: '#7c3aed' },
  { id: 'shiitake-mushroom', name: 'Shiitake', vibrationalSignature: 'Immune Modulator', type: 'Mushroom', benefit: 'Lentinan polysaccharide for immune enhancement and cardiovascular.', color: '#b45309' },
  { id: 'maitake-mushroom', name: 'Maitake (Hen of the Woods)', vibrationalSignature: 'Blood Sugar Balancer', type: 'Mushroom', benefit: 'Beta-glucan for immune activation and glucose regulation.', color: '#92400e' },
  { id: 'agarikon-mushroom', name: 'Agarikon', vibrationalSignature: 'Ancient Protector', type: 'Mushroom', benefit: 'Rare longevity mushroom with anti-viral resonance.', color: '#f5f5f4' },

  // ── ADAPTOGENS ────────────────────────────────────────────────
  { id: 'astragalus-telomere', name: 'Astragalus', vibrationalSignature: 'Life-Force Extension', type: 'Adaptogen', benefit: 'Telomere-Sync and Bio-signature Recalibration for longevity.', color: '#059669' },
  { id: 'ashwagandha-cortisol', name: 'Ashwagandha (KSM-66)', vibrationalSignature: 'Cortisol-Algorithm Harmonizer', type: 'Adaptogen', benefit: 'Withaferin A — stress dissolution and testosterone support.', color: '#d97706' },
  { id: 'frankincense-pineal', name: 'Frankincense (Boswellia)', vibrationalSignature: 'Pineal Decalcifier', type: 'Adaptogen', benefit: 'AKBA — neuroinflammation and third-eye Light-Codes.', color: '#f5f5f4' },
  { id: 'adaptogen-rhodiola', name: 'Rhodiola Rosea', vibrationalSignature: 'Stress Armor', type: 'Adaptogen', benefit: 'Rosavin and salidroside for peak mental and physical performance.', color: '#f87171' },
  { id: 'adaptogen-eleuthero', name: 'Eleuthero', vibrationalSignature: 'Endurance Code', type: 'Adaptogen', benefit: 'Eleutherosides for immune modulation and stamina.', color: '#166534' },
  { id: 'adaptogen-schisandra', name: 'Schisandra', vibrationalSignature: 'Five-Element Balancer', type: 'Adaptogen', benefit: 'Lignans for liver detox, stress adaptation and longevity.', color: '#be123c' },
  { id: 'adaptogen-morinda', name: 'Morinda (Noni Root)', vibrationalSignature: 'Jing Tonifier', type: 'Adaptogen', benefit: 'Kidney jing restoration and anti-aging adaptogen.', color: '#fbbf24' },
  { id: 'adaptogen-gynostemma', name: 'Gynostemma', vibrationalSignature: 'AMPK Activator', type: 'Adaptogen', benefit: 'Gypenosides activating AMPK — longevity pathway.', color: '#4ade80' },
];

export const ACTIVATIONS: Activation[] = BASE_ACTIVATIONS;

export const PLANETARY_DATA: Record<number, { planet: string; herb: string }> = {
  0: { planet: 'Sun (Surya)', herb: 'Saffron, Calamus, Ginger' },
  1: { planet: 'Moon (Chandra)', herb: 'Ashwagandha, Blue Lotus, Shatavari' },
  2: { planet: 'Mars (Mangala)', herb: 'Nettle, Maca, Guduchi' },
  3: { planet: 'Mercury (Budha)', herb: 'Brahmi, Gotu Kola, Tulsi' },
  4: { planet: 'Jupiter (Guru)', herb: 'Turmeric, Ginseng' },
  5: { planet: 'Venus (Shukra)', herb: 'Rose, Bobinsana' },
  6: { planet: 'Saturn (Shani)', herb: 'Shilajit, Triphala, Myrrh' },
};
