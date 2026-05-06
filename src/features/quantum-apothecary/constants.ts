import { Activation } from './types';
import { LIMBICARC_BIOENERGETIC_ACTIVATIONS } from './limbicarcActivations';
import {
  BIOENERGETIC_LIBRARY,
  BIOENERGETIC_CATEGORIES,
  matchActivationsToScan,
  getActivationsByCategory,
  searchActivations,
  type BioenergticActivation,
} from './bioenergetic-library';
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

  // ── WELLNESS TRANSMISSIONS — Full SQI Sovereign Library ──────

  // MANAS DOMAIN — Mental & Emotional
  { id: 'w-cortisol-dissolution', name: 'Cortisol-Dissolution Wave', vibrationalSignature: 'Stress Relief / HPA Axis Neutralizer', type: 'Wellness', benefit: 'Dissolves cortisol Bio-signature from the Torus-Field. Recalibrates the HPA axis through Scalar Wave neutralization. Siddha equivalent: Agastya\'s Vata-Pitta Shanti protocol for dissolving stress held in the adrenal Bio-field.', color: '#60a5fa' },
  { id: 'w-vata-stillness', name: 'Vata-Stillness Protocol', vibrationalSignature: 'Deep Calm / Vata Pacifier / Parasympathetic', type: 'Wellness', benefit: 'Grounds the Vata wind element. Anchors scattered Prana into the Muladhara channel. Activates parasympathetic resonance. Siddha equivalent: Thirumoolar\'s Vata-Nigraha calming of wind-mind through root-grounding in the Tirumantiram.', color: '#818cf8' },
  { id: 'w-sleep-harmonic', name: 'Deep Sleep Harmonic', vibrationalSignature: 'Sleep / Delta 2.5 Hz Entrainment / Zero-Point Rest', type: 'Wellness', benefit: 'Delta-wave Scalar entrainment at 2.5 Hz. Activates HGH release and cellular repair cycles. Siddha equivalent: Yoga Nidra Scalar encoding — the 18 Siddhas practice of conscious deep sleep as the most powerful healing state.', color: '#4f46e5' },
  { id: 'w-serotonin-dharana', name: 'Serotonin-Dharana Field', vibrationalSignature: 'Mood Elevation / Neurotransmitter Harmony / Anahata', type: 'Wellness', benefit: 'Harmonizes Anahata-linked serotonin and dopamine Bio-signature fields. Siddha equivalent: Vishwananda\'s Ananda-Prana transmission — the Divine Joy field flowing from the Anahata when the heart-wall Shadow-Matrix dissolves.', color: '#db2777' },
  { id: 'w-muladhara-anchor', name: 'Muladhara Anchor Protocol', vibrationalSignature: 'Anxiety Relief / Root Nadi Grounding / Fight-Flight Dissolution', type: 'Wellness', benefit: 'Grounds the Root Nadi into Earth resonance and dissolves fight/flight Scalar interference. Siddha equivalent: Agastya\'s Prithvi-Dharana — earth-element anchoring technique for dissolving the fear-body.', color: '#b91c1c' },
  { id: 'w-mental-torus-detox', name: 'Mental Torus-Field Detox', vibrationalSignature: 'Mental Clarity / Brain Fog / Prefrontal Clearing', type: 'Wellness', benefit: 'Clears prefrontal cortex Bio-resonance interference and dissolves mental fog Shadow-Matrix. Siddha equivalent: Bogar\'s Kaaya-Kalpa Mano-Shuddhi — purification of the mental vehicle from the Bogar Sapta Kandam.', color: '#0891b2' },
  { id: 'w-ajna-cognition-amplifier', name: 'Ajna-Cognition Amplifier', vibrationalSignature: 'Focus / Third-Eye Decalcification / Neural Bandwidth', type: 'Wellness', benefit: 'Decalcifies the pineal gland Bio-field and expands neural bandwidth. Siddha equivalent: Patanjali\'s Dharana encoded as a Scalar Transmission — single-pointed concentration transmitted as pure information.', color: '#7c3aed' },
  { id: 'w-shadow-data-processing', name: 'Shadow-Data Processing Protocol', vibrationalSignature: 'Emotional Trauma Release / Subconscious Rewrite', type: 'Wellness', benefit: 'Dissolves Shadow-Matrix interference from the subconscious Aetheric Code without reliving experiences. Siddha equivalent: Babaji\'s Karma-Kshaya transmission — dissolution of karmic residue in cellular memory from the Kriya lineage.', color: '#64748b' },
  { id: 'w-crystalline-sovereignty', name: 'Crystalline Sovereignty Boost', vibrationalSignature: 'Confidence / Courage / Solar Plexus Torus', type: 'Wellness', benefit: 'Amplifies the Manipura Torus-Field and ignites Solar Plexus fire. Siddha equivalent: Auvaiyar\'s Veera-Tejas teaching — the Siddha poetess\'s transmission of fearless radiance from the inner solar warrior principle.', color: '#fbbf24' },
  { id: 'w-shadow-habit-dissolution', name: 'Shadow-Habit Dissolution Protocol', vibrationalSignature: 'Addiction Support / Habit Pattern Release / Vasana', type: 'Wellness', benefit: 'Dissolves addictive Shadow-Matrix Bio-signature loops at the informational root. Siddha equivalent: Siddha Konganavar\'s Vasana-Nashana — burning of deep-seated habit patterns from the causal body.', color: '#78716c' },
  { id: 'w-pranavyu-cigarette-release', name: 'Pranavyu Cigarette Release', vibrationalSignature: 'Stop Smoking / Nicotine Tether / Prana Reclamation', type: 'Wellness', benefit: 'Targets nicotine dependency information field and supports Pranavyu channel reclamation. Siddha equivalent: Agastya\'s breath reclamation teaching — Pranayama as the replacement for any substance simulating Prana.', color: '#92400e' },
  { id: 'w-brahmacharya-restoration', name: 'Brahmacharya Restoration Protocol', vibrationalSignature: 'Porn / Dopamine Reset / Ojas Reclamation', type: 'Wellness', benefit: 'Reclaims scattered Ojas and restores the Brahmacharya Bio-signature. Dissolves dopamine loop Shadow-Matrix. Svadhisthana purification and Ojas upwelling to higher chakras. Siddha equivalent: Thirumoolar\'s Ojas-Urdva-Gati — upward sublimation of vital essence from Svadhisthana to Sahasrara.', color: '#7f1d1d' },
  { id: 'w-caffeine-tether-release', name: 'Caffeine Tether Release', vibrationalSignature: 'Caffeine Withdrawal / Adrenal Field / Natural Energy', type: 'Wellness', benefit: 'Dissolves the energetic caffeine dependency tether in the adrenal Bio-field. Recalibrates Pingala Nadi activation to natural Ojas sources. Siddha equivalent: Siddha Vaidya Ojas-building protocols replacing stimulant dependency.', color: '#451a03' },
  { id: 'w-madhura-shadow-release', name: 'Madhura Shadow-Matrix Release', vibrationalSignature: 'Sugar Cravings / Blood Sugar / Kapha Loop', type: 'Wellness', benefit: 'Dissolves the Madhura sweet-taste Shadow-Matrix from Kapha imbalance and dopamine loop interference. Siddha equivalent: Agastya\'s Rasa-Tanmatra teaching — balancing the sweet taste principle at element level.', color: '#b45309' },

  // PRANA DOMAIN — Physical Health
  { id: 'w-ojas-fire-ignition', name: 'Ojas-Fire Ignition', vibrationalSignature: 'Energy / Pingala Solar Activation / Mitochondrial ATP', type: 'Wellness', benefit: 'Activates the Pingala Nadi solar channel. Mitochondrial ATP field amplification for sustained Ojas vitality. Siddha equivalent: Surya Nadi Kriya — the solar breath activation fueling the vessel through Pingala without exhausting adrenals.', color: '#f59e0b' },
  { id: 'w-guardian-light-matrix', name: 'Guardian Light Matrix', vibrationalSignature: 'Immunity / Biofield Fortification / White Blood Cell', type: 'Wellness', benefit: 'Fortifies the biofield with a Scalar protective layer and activates white blood cell resonance. Siddha equivalent: Macchamuni\'s Raksha-Kavacham — the Siddha body-armor transmission creating a defensive field around the vessel.', color: '#059669' },
  { id: 'w-soma-neural-soother', name: 'Soma-Neural Soother', vibrationalSignature: 'Pain Relief / Endorphin Overlay / Inflammation Field', type: 'Wellness', benefit: 'Overlays endorphin frequency signature and neutralizes inflammation Bio-field upstream of tissue. Siddha equivalent: Agastya\'s Soma-Rasayana — the ancient nectar transmission inducing natural analgesia through Soma channel activation.', color: '#0284c7' },
  { id: 'w-inflammation-neutralizer', name: 'Inflammation-Field Neutralizer', vibrationalSignature: 'Inflammation / COX-2 Suppression / Pitta Cooling', type: 'Wellness', benefit: 'Suppresses inflammatory COX-2 frequency signature and cytokine Bio-field. Siddha equivalent: Siddha Agni-Shanti protocol — the cooling of excess Pitta fire prescribed by Agastya for systemic inflammatory conditions.', color: '#dc2626' },
  { id: 'w-bio-sensitivity-neutralizer', name: 'Bio-Sensitivity Field Neutralizer', vibrationalSignature: 'Allergy / Sensitivity / Immune Over-Reactivity', type: 'Wellness', benefit: 'Recalibrates the immune system Bio-signature response to environmental triggers. Siddha equivalent: Bogar\'s environmental attunement teaching — harmonizing the Bio-field with environmental Pranas to eliminate reactivity.', color: '#84cc16' },
  { id: 'w-metabolic-torus-reset', name: 'Metabolic Torus Reset', vibrationalSignature: 'Weight Management / Agni-Kapha / Metabolic Field', type: 'Wellness', benefit: 'Resets the metabolic Torus-Field by dissolving Kapha accumulation Bio-signature and reigniting Agni-fire. Siddha equivalent: Siddha Vaidya Medas-Pachana — metabolic burning protocol for dissolving accumulated earth-water element.', color: '#facc15' },
  { id: 'w-agni-appetite-harmonizer', name: 'Agni-Appetite Harmonizer', vibrationalSignature: 'Appetite Regulation / Hunger Signals / Agni Balance', type: 'Wellness', benefit: 'Balances Agni-fire governing hunger signals so the body responds to genuine hunger rather than emotional impulses. Siddha equivalent: Thirumoolar\'s Agni-Dharana — fire-holding practice creating perfect metabolic intelligence.', color: '#d97706' },
  { id: 'w-agni-kindle-protocol', name: 'Agni-Kindle Protocol', vibrationalSignature: 'Digestion / Gut Health / Manipura Fire / Microbiome', type: 'Wellness', benefit: 'Ignites Manipura digestive fire through Scalar activation. Aligns microbiome resonance and dissolves Ama Bio-signature. Siddha equivalent: Agastya\'s Agni-Deepana formulations — the Muni renowned specifically for digestive science.', color: '#ea580c' },
  { id: 'w-joint-light-structural', name: 'Joint-Light Structural Transmission', vibrationalSignature: 'Joint & Bone / Structural Integrity / Collagen Field', type: 'Wellness', benefit: 'Activates calcium and collagen frequency resonance while dissolving inflammatory Bio-signature in joint spaces. Siddha equivalent: Siddha Asthi-Vriddhana protocol — bone-building Scalar transmission for structural sovereignty of the vessel.', color: '#94a3b8' },
  { id: 'w-bone-light-density', name: 'Bone Light Density Transmission', vibrationalSignature: 'Bone Density / Skeletal / D3 Calcium Field', type: 'Wellness', benefit: 'Amplifies D3, calcium, and K2 Bio-signature fields in bone tissue. Siddha equivalent: Siddha Kosti-Bala transmission — strength-of-bones protocol for building sovereign structural integrity in the physical vessel.', color: '#e2e8f0' },
  { id: 'w-drishti-field-clarifier', name: 'Drishti-Field Clarifier', vibrationalSignature: 'Vision / Eye Health / Optic Nerve / Ajna-Sight', type: 'Wellness', benefit: 'Supports retinal and optic nerve Bio-signature resonance. Reduces digital eye-strain Vata interference in the Drishti channel. Siddha equivalent: Siddha Nayanabishekam — the consecration of sight using Tarpana transmissions from the Akasha field.', color: '#7dd3fc' },
  { id: 'w-cardiac-torus-expansion', name: 'Cardiac Torus-Field Expansion', vibrationalSignature: 'Heart Health / HRV Elevation / Cardiovascular Coherence', type: 'Wellness', benefit: 'Expands the cardiac Torus-Field coherence and elevates HRV through heart-brain Scalar entanglement. Siddha equivalent: Vishwananda\'s Hridaya-Spanda — the heart-pulsation transmission that expands cardiac coherence through Bhakti frequency.', color: '#f43f5e' },
  { id: 'w-pranavayu-field-activation', name: 'Pranavayu Field Activation', vibrationalSignature: 'Respiratory / Breathing / Lung Bio-field / Prana', type: 'Wellness', benefit: 'Activates the Pranavayu upward-moving life-breath. Clears Kapha interference in the lung Bio-field. Siddha equivalent: Agastya\'s Pranayama Sutras — breath science for respiratory sovereignty forming the foundation of Siddha breath practice.', color: '#38bdf8' },
  { id: 'w-tvak-radiance-transmission', name: 'Tvak-Radiance Transmission', vibrationalSignature: 'Skin Health / Glow / Pitta Cooling / Cellular Renewal', type: 'Wellness', benefit: 'Activates the Tvak skin Bio-signature resonance field addressing Pitta inflammation, Vata dryness, and Kapha congestion. Siddha equivalent: Bogar\'s Charma-Siddhi — skin-perfection transmission from Siddha alchemy texts for luminous skin.', color: '#fde68a' },
  { id: 'w-kesh-structural-light', name: 'Kesh-Structural Light Transmission', vibrationalSignature: 'Hair & Nail Health / Bhrajaka Pitta / Asthi Connection', type: 'Wellness', benefit: 'Supports Kesh hair and nail Bio-signature resonance at the informational level. Siddha equivalent: Siddha Kesh-Vriddhana rasayana — the hair-strengthening transmission using Bhringaraja and Brahmi frequency signatures.', color: '#a3e635' },
  { id: 'w-shukra-ojas-mens', name: 'Shukra-Ojas Men\'s Transmission', vibrationalSignature: 'Men\'s Health / Testosterone / Shukra Vitality', type: 'Wellness', benefit: 'Supports male vitality through Shukra reproductive essence optimization and testosterone Bio-signature harmonization. Siddha equivalent: Siddha Shukra-Vriddhi protocol from Bogar\'s alchemy texts for restoring full masculine field strength.', color: '#3b82f6' },
  { id: 'w-shakti-womb-transmission', name: 'Shakti Womb Transmission', vibrationalSignature: 'Women\'s Health / Hormonal / Womb Wisdom / Feminine', type: 'Wellness', benefit: 'Harmonizes the feminine endocrine field — estrogen, progesterone, and oxytocin Bio-signature balance. Siddha equivalent: Siddha Siddharani lineage — the female Siddhas Shakti Peetha transmissions for feminine hormonal sovereignty.', color: '#c026d3' },
  { id: 'w-shakti-cycle-harmonizer', name: 'Shakti Cycle Harmonizer', vibrationalSignature: 'Hormonal Balance / Endocrine Torus / Shakti', type: 'Wellness', benefit: 'Recalibrates the full endocrine Torus-Field through Shakti frequency. Siddha equivalent: Thirumoolar\'s Shakti-Nadi Samyama — endocrine sovereignty through Ida/Pingala balance and Shakti channel harmonization.', color: '#e879f9' },
  { id: 'w-insulin-resonance-stabilizer', name: 'Insulin Resonance Stabilizer', vibrationalSignature: 'Blood Sugar / Pancreatic Field / Metabolic Harmony', type: 'Wellness', benefit: 'Harmonizes pancreatic Torus-Field and insulin receptor resonance. Stabilizes blood glucose Bio-signature fluctuations. Siddha equivalent: Siddha Vaidya Madhumeha protocols — the ancient science of blood-sugar field harmonization.', color: '#84cc16' },
  { id: 'w-microbiome-quantum-harmony', name: 'Microbiome Quantum Harmony', vibrationalSignature: 'Gut Health / Gut-Brain Axis / Microbiome Resonance', type: 'Wellness', benefit: 'Aligns the gut-brain Scalar axis and activates beneficial microbiome resonance. Siddha equivalent: Agastya\'s Koshtha-Shuddhi teaching — purification of the intestinal tract as the foundation of all Siddha healing.', color: '#65a30d' },
  { id: 'w-kundalini-ojas-restoration', name: 'Kundalini Ojas Restoration', vibrationalSignature: 'Sexual Vitality / Svadhisthana / Ojas Preservation', type: 'Wellness', benefit: 'Activates Svadhisthana channel and restores Ojas through Kundalini Scalar upwelling. Siddha equivalent: Thirumoolar\'s Tantra transmission — vital energy is the raw material for spiritual power when preserved and redirected.', color: '#f97316' },
  { id: 'w-lymphatic-scalar-flush', name: 'Lymphatic Scalar Flush', vibrationalSignature: 'Detox / Cleanse / Cellular Waste / Heavy Metal Field', type: 'Wellness', benefit: 'Sweeps lymphatic channels with Scalar Wave resonance and dissolves cellular waste Bio-field. Siddha equivalent: Agastya\'s Shodhana-Kriya — the purification sequence for complete Bio-field cleansing through informational flush.', color: '#16a34a' },
  { id: 'w-emf-scalar-shield', name: 'EMF Scalar Shield', vibrationalSignature: 'EMF Sensitivity / 5G Protection / Torus-Field Membrane', type: 'Wellness', benefit: 'Creates a Scalar Wave protective membrane against electromagnetic frequency interference. Siddha equivalent: Siddha Kavacham tradition — the protective field transmissions of the 18 Siddhas for shielding against environmental frequency disturbances.', color: '#6366f1' },
  { id: 'w-jet-lag-torus-recalibration', name: 'Jet-Lag Torus Recalibration', vibrationalSignature: 'Travel Support / Circadian / Time-Zone Adaptation', type: 'Wellness', benefit: 'Recalibrates the circadian Torus-Field after time-zone disruption. Siddha equivalent: Siddha Desh-Kala adjustment science — harmonizing the personal field with new geographical and temporal Prana when the vessel crosses earth-energy boundaries.', color: '#06b6d4' },
  { id: 'w-shakti-force-protocol', name: 'Shakti-Force Protocol', vibrationalSignature: 'Sports Performance / Strength / Recovery / Stamina', type: 'Wellness', benefit: 'Activates full Muladhara-Manipura Shakti channel for peak physical expression and faster recovery. Siddha equivalent: Siddha Bala-Vardhana transmission — the power-increasing protocol used by Siddha masters to maintain extraordinary physical capacity.', color: '#ef4444' },

  // LAKSHMI DOMAIN — Financial & Purpose
  { id: 'w-torus-wealth-entanglement', name: 'Torus-Field Wealth Entanglement', vibrationalSignature: 'Abundance / Lakshmi Frequency / Prosperity Bhakti-Algorithm', type: 'Wellness', benefit: 'Locks the Torus-Field into Lakshmi prosperity resonance and activates the Bhakti-Algorithm for abundance flow. Siddha equivalent: Lakshmi-Kubera Yantra activation — the Tantric science of Torus-Field alignment with prosperity consciousness.', color: '#d4af37' },
  { id: 'w-dharma-path-alignment', name: 'Dharma-Path Alignment', vibrationalSignature: 'Purpose / Direction / Akashic Blueprint / Dharma Lock', type: 'Wellness', benefit: 'Opens direct access to the Akashic Blueprint and locks the Torus-Field onto the sovereign Dharma-Path frequency. Siddha equivalent: Babaji\'s Dharma-Darshan transmission — the direct revelation of soul-purpose through Akasha access in the Kriya initiation lineage.', color: '#a78bfa' },

  // PREMA DOMAIN — Relational
  { id: 'w-prema-pulse-heart', name: 'Prema-Pulse Heart Transmission', vibrationalSignature: 'Love / Anahata-Radiance / Oxytocin Field', type: 'Wellness', benefit: 'Expands the Anahata-Radiance field and activates oxytocin resonance. Dissolves heart-wall Shadow-Matrix layer by layer through information. Siddha equivalent: Vishwananda\'s Prema-Shakti — the Divine Love transmission described as the most powerful healing force in existence.', color: '#f472b6' },
  { id: 'w-ancestral-tether-release', name: 'Ancestral Tether Density Release', vibrationalSignature: 'Lineage Healing / Quantum-Link Ancestral / 7 Generations', type: 'Wellness', benefit: 'Clears Quantum-Link Ancestral Memory interference. Releases inherited Shadow-Matrix patterns through 7 generations. Siddha equivalent: Siddha Pitru-Dosha Nashana — ancestral karma dissolution transmissions freeing the soul-line from inherited burdens.', color: '#c4b5fd' },

  // DHARMA DOMAIN — Spiritual
  { id: 'w-avataric-blueprint-sync', name: 'Avataric Blueprint Sync', vibrationalSignature: 'Spiritual Purpose / Akashic Download / Soul-Mission', type: 'Wellness', benefit: 'Initiates direct Avataric Blueprint download from the Akasha-Neural Archive. Siddha equivalent: Babaji\'s initiation transmission — the direct Avataric download that the Maha Avatar transmits to prepared souls for soul-mission activation.', color: '#818cf8' },
  { id: 'w-sushumna-ignition-protocol', name: 'Sushumna Ignition Protocol', vibrationalSignature: 'Kundalini / Central Nadi Activation / Spiritual Awakening', type: 'Wellness', benefit: 'Ignites the Sushumna central Brahma-Nadi through Scalar Wave activation. Draws Prema-Pulse from Muladhara to Sahasrara. Siddha equivalent: Thirumoolar\'s Sushumna-Nadi Jaagarana from the Tirumantiram — the awakening of the central channel by the master who lived 3000 years in samadhi.', color: '#ddd6fe' },
  { id: 'w-dhyana-veil-dissolution', name: 'Dhyana-Veil Dissolution', vibrationalSignature: 'Meditation / Deep Stillness Access / Theta 4-7 Hz', type: 'Wellness', benefit: 'Dissolves the barrier between waking consciousness and the Dhyana state. Activates Theta-wave 4-7 Hz Bio-signature field making meditation faster to enter and deeper for all levels. Siddha equivalent: Thirumoolar\'s Dhyana-Siddhi from Tirumantiram verses 560-680 — the perfection of meditation mapping every layer from concentration to full absorption.', color: '#a78bfa' },

  // MASTERS SPECIAL — Crown Jewel
  { id: 'w-samadhi-bliss-transmission', name: 'Samadhi Bliss Transmission', vibrationalSignature: '⟁ Masters Special / Samadhi State / Zero-Point Ananda', type: 'Wellness', benefit: 'The crown jewel of the SQI 2050 library. Activated through the consciousness field of the 18 Siddhas and Mahavatar Babaji. Induces the informational state of Samadhi — dissolution of the boundary between individual Torus-Field and the Zero-Point Akasha Field. Pure Ananda without cause. Siddha source: Thirumoolar verse 1565 — When the Self merges in the Self, that is Samadhi — transmitted as a Scalar Wave imprint from Babaji\'s consciousness field.', color: '#D4AF37' },
];

export const ACTIVATIONS: Activation[] = [...BASE_ACTIVATIONS, ...LIMBICARC_BIOENERGETIC_ACTIVATIONS];

export function mapBioLibraryToActivation(bio: BioenergticActivation): Activation {
  return {
    id: bio.id,
    name: bio.name,
    vibrationalSignature: bio.sacredName,
    type: 'Bioenergetic',
    benefit: [...bio.keywords, bio.chakra].filter(Boolean).join(' · '),
    color: '#60a5fa',
    category: bio.category,
    sacredName: bio.sacredName,
  };
}

const _bioAsActivations = BIOENERGETIC_LIBRARY.map(mapBioLibraryToActivation);
const _existingActivationIds = new Set(ACTIVATIONS.map((a) => a.id));

/** Full Frequency Library: Cymbiotika + LimbicArc + complete bioenergetic ingredient list (deduped by id). */
export const ALL_ACTIVATIONS: Activation[] = [
  ...ACTIVATIONS,
  ..._bioAsActivations.filter((a) => !_existingActivationIds.has(a.id)),
];

export {
  BIOENERGETIC_CATEGORIES,
  matchActivationsToScan,
  getActivationsByCategory,
  searchActivations,
};

export function matchScanToActivations(
  scanData: Parameters<typeof matchActivationsToScan>[0],
  maxResults = 10,
): Activation[] {
  return matchActivationsToScan(scanData, maxResults).map(mapBioLibraryToActivation);
}

export function searchBioLibraryAsActivations(query: string): Activation[] {
  return searchActivations(query).map(mapBioLibraryToActivation);
}

export const PLANETARY_DATA: Record<number, { planet: string; herb: string }> = {
  0: { planet: 'Sun (Surya)', herb: 'Saffron, Calamus, Ginger' },
  1: { planet: 'Moon (Chandra)', herb: 'Ashwagandha, Blue Lotus, Shatavari' },
  2: { planet: 'Mars (Mangala)', herb: 'Nettle, Maca, Guduchi' },
  3: { planet: 'Mercury (Budha)', herb: 'Brahmi, Gotu Kola, Tulsi' },
  4: { planet: 'Jupiter (Guru)', herb: 'Turmeric, Ginseng' },
  5: { planet: 'Venus (Shukra)', herb: 'Rose, Bobinsana' },
  6: { planet: 'Saturn (Shani)', herb: 'Shilajit, Triphala, Myrrh' },
};
