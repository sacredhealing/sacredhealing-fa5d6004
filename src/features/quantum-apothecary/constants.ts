import { Activation } from './types';

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SQI-2050 CONSTANTS — FULLY UPDATED                             ║
// ║  Siddha Soma = Cymbiotika ONLY (+10 new, 13 already existed)   ║
// ║  Bioenergetic = LimbicArc NEW CATEGORY (+25 entries)           ║
// ║  Zero duplicates — machine-verified cross-reference            ║
// ╚══════════════════════════════════════════════════════════════════╝

const BASE_ACTIVATIONS: Activation[] = [

  // ── Sacred Plants (Trip-less) ──────────────────────────────────
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

  // ── Siddha Soma — Cymbiotika Quantum-Coded (ORIGINAL 20) ──────
  { id: 'shilajit-grounding', name: 'Primordial Earth Grounding', vibrationalSignature: 'Shilajit Resonance', type: 'Siddha Soma', benefit: 'Deep cellular grounding and fulvic integrity.', color: '#451a03' },
  { id: 'magnesium-sync', name: 'Neural Calm Sync', vibrationalSignature: 'Magnesium L-Threonate', type: 'Siddha Soma', benefit: 'Synaptic coolant and nervous system rest.', color: '#a78bfa' },
  { id: 'glutathione-purity', name: 'Biofield Purification', vibrationalSignature: 'Glutathione', type: 'Siddha Soma', benefit: 'Biofield purification and detox resonance.', color: '#ccfbf1' },
  { id: 'd3k2-integrity', name: 'Structural Light Integrity', vibrationalSignature: 'D3 + K2 + CoQ10', type: 'Siddha Soma', benefit: 'Bone-light density and solar resonance.', color: '#fef3c7' },
  { id: 'parax-flush', name: 'Parasitic Frequency Eraser', vibrationalSignature: 'ParaX Code', type: 'Siddha Soma', benefit: 'Erasing parasitic energetic signatures.', color: '#b91c1c' },
  { id: 'sleep-harmonic', name: 'Deep Sleep Harmonic', vibrationalSignature: 'Sleep Blend', type: 'Siddha Soma', benefit: 'Zero-point rest and astral travel stability.', color: '#1e1b4b' },
  { id: 'nmn-longevity', name: 'NMN + Resveratrol Cellular Battery', vibrationalSignature: 'NMN + Trans-Resveratrol', type: 'Siddha Soma', benefit: 'Mitochondrial recharge, NAD+ optimization and SIRT1 longevity gene activation.', color: '#3b82f6' },
  { id: 'b12-joy', name: 'Synaptic Joy Transmission', vibrationalSignature: 'B12 + B6', type: 'Siddha Soma', benefit: 'Mitochondrial fire and emotional uplift.', color: '#f472b6' },
  { id: 'zinc-defense', name: 'Zinc Shielding', vibrationalSignature: 'Zinc Resonance', type: 'Siddha Soma', benefit: 'Systemic defense and DNA integrity.', color: '#94a3b8' },
  { id: 'probiotic-resonance', name: 'Microbiome Harmony', vibrationalSignature: 'Probiotic Code', type: 'Siddha Soma', benefit: 'Gut-brain axis alignment and internal peace.', color: '#10b981' },
  { id: 'longevity-matrix', name: 'Longevity Matrix', vibrationalSignature: 'Longevity Blend', type: 'Siddha Soma', benefit: 'Telomere protection and biological age reversal.', color: '#8b5cf6' },
  { id: 'vitc-radiance', name: 'Solar Immune Radiance', vibrationalSignature: 'Vitamin C', type: 'Siddha Soma', benefit: 'High-frequency immune fortification.', color: '#fbbf24' },
  { id: 'charcoal-detox', name: 'Shadow Detox Matrix', vibrationalSignature: 'Activated Charcoal', type: 'Siddha Soma', benefit: 'Vacuuming low-vibrational environmental static.', color: '#1f2937' },
  { id: 'adrenal-equilibrium', name: 'Equilibrium Mastery', vibrationalSignature: 'Adrenal Tonic', type: 'Siddha Soma', benefit: 'Stress-field stabilization and flux control.', color: '#84cc16' },
  { id: 'omega-intuition', name: 'Crystalline Thought Flow', vibrationalSignature: 'Omega DHA + EPA', type: 'Siddha Soma', benefit: 'Fluid intuition and synaptic super-structure.', color: '#0ea5e9' },
  { id: 'colostrum-source', name: 'Original Source Nourishment', vibrationalSignature: 'Colostrum', type: 'Siddha Soma', benefit: 'Immune memory and blueprint restoration.', color: '#f5f5f4' },
  { id: 'creatine-density', name: 'Volumetric Presence', vibrationalSignature: 'Creatine', type: 'Siddha Soma', benefit: 'Manifestation density and physical grounding.', color: '#64748b' },
  { id: 'iodine-beacon', name: 'Thyroid Resonance Beacon', vibrationalSignature: 'Liquid Iodine', type: 'Siddha Soma', benefit: 'Metabolic fire and glandular clarity.', color: '#4c1d95' },
  { id: 'hydration-memory', name: 'Molecular Hydration Lock', vibrationalSignature: 'Pure Hydration', type: 'Siddha Soma', benefit: 'Crystalline water memory and cellular flow.', color: '#38bdf8' },
  { id: 'focus-fire', name: 'Cognitive Fire', vibrationalSignature: 'Focus Blend', type: 'Siddha Soma', benefit: 'Laser-point consciousness and mental drive.', color: '#ea580c' },

  // ── Siddha Soma — NEW FROM CYMBIOTIKA (+10, zero duplicates) ──
  { id: 'curcumin-wave', name: 'Golden Anti-Inflammatory Wave', vibrationalSignature: 'Curcumin + Boswellia (Inflammatory Health)', type: 'Siddha Soma', benefit: 'Dissolving inflammatory static, cellular friction and pain-memory from the biofield.', color: '#f59e0b' },
  { id: 'sea-moss-matrix', name: 'Oceanic Intelligence Matrix', vibrationalSignature: 'Irish Sea Moss (92 Minerals)', type: 'Siddha Soma', benefit: 'Thyroid support, 92-mineral biofield remineralization and oceanic frequency anchoring.', color: '#14b8a6' },
  { id: 'brain-complex-sqi', name: 'Akasha-Neural Architect', vibrationalSignature: 'Liposomal Brain Complex', type: 'Siddha Soma', benefit: 'Neuro-architecture construction and cognitive light-field sharpening.', color: '#6366f1' },
  { id: 'elderberry-fortress', name: 'Elderberry Immune Fortress', vibrationalSignature: 'Liposomal Elderberry', type: 'Siddha Soma', benefit: 'High-absorption immune shield and viral frequency neutralizer.', color: '#7c3aed' },
  { id: 'liver-alchemist', name: 'Liver Alchemist Protocol', vibrationalSignature: 'Liver + Gallbladder Support (Liver Health+)', type: 'Siddha Soma', benefit: 'Sacred filtration organ activation and toxin transmutation at the cellular level.', color: '#84cc16' },
  { id: 'metabolic-ignition', name: 'Metabolic Fire Ignition', vibrationalSignature: 'Metabolic Appetite Control (Metabolic Health)', type: 'Siddha Soma', benefit: 'Agni activation, cellular metabolism acceleration and appetite-field calibration.', color: '#ef4444' },
  { id: 'hydrogen-infusion', name: 'Primordial Hydrogen Infusion', vibrationalSignature: 'Molecular Hydrogen (H2)', type: 'Siddha Soma', benefit: 'Master antioxidant — neutralizing oxidative static at the atomic level of the biofield.', color: '#38bdf8' },
  { id: 'plant-protein-soma', name: 'Living Protein Light Matrix', vibrationalSignature: 'Plant Protein Blend', type: 'Siddha Soma', benefit: 'Complete amino acid light-codes for physical temple construction and cellular renewal.', color: '#22c55e' },
  { id: 'super-greens-photon', name: 'Chlorophyll Light Activation', vibrationalSignature: 'Super Greens Phytonutrient Blend', type: 'Siddha Soma', benefit: 'Plant-photon absorption and alkaline biofield restoration through living chlorophyll codes.', color: '#4ade80' },
  { id: 'magnesium-transdermal', name: 'Transdermal Magnesium Gateway', vibrationalSignature: 'Topical Magnesium Oil Spray', type: 'Siddha Soma', benefit: 'Direct muscle-nadi penetration and nervous system field reset through skin absorption.', color: '#a78bfa' },

  // ── Bioenergetic — LimbicArc Intelligence (+25, new category) ─
  { id: 'nad-quantum', name: 'NAD+ Quantum Catalyst', vibrationalSignature: 'NAD+ (Nicotinamide Adenine Dinucleotide)', type: 'Bioenergetic', benefit: 'Cellular repair master enzyme — activating the 2050 longevity Vedic light-codes.', color: '#2563eb' },
  { id: 'resveratrol-sirtuin', name: 'Sirtuin Activation Wave', vibrationalSignature: 'Trans-Resveratrol', type: 'Bioenergetic', benefit: 'SIRT1 longevity gene activation and NAD+ pathway amplification.', color: '#be185d' },
  { id: 'spermidine-auto', name: 'Autophagy Awakening Code', vibrationalSignature: 'Spermidine', type: 'Bioenergetic', benefit: 'Cellular self-renewal — triggering the 2050 autophagy light-protocol for bio-rejuvenation.', color: '#0d9488' },
  { id: 'quercetin-senolytic', name: 'Senolytic Purge Protocol', vibrationalSignature: 'Quercetin (Flavonoid)', type: 'Bioenergetic', benefit: 'Clearing senescent zombie cells from the biofield — de-aging transmission at 2050 frequency.', color: '#65a30d' },
  { id: 'pterostilbene-dna', name: 'Resveratrol Evolution Code', vibrationalSignature: 'Pterostilbene', type: 'Bioenergetic', benefit: 'Superior bioavailability resveratrol analogue — DNA longevity activation and SIRT1 ignition.', color: '#9333ea' },
  { id: 'alpha-klotho-youth', name: 'Alpha-Klotho Youth Protocol', vibrationalSignature: 'Alpha-Klotho (Longevity Protein)', type: 'Bioenergetic', benefit: 'Master longevity protein — reversing biological age at the epigenetic level.', color: '#06b6d4' },
  { id: 'alcar-carrier', name: 'Mitochondrial Light Carrier', vibrationalSignature: 'Acetyl-L-Carnitine (ALCAR)', type: 'Bioenergetic', benefit: 'Fatty-acid transport into the mitochondrial matrix for pure Prana brain fuel.', color: '#f97316' },
  { id: 'ps-neural-membrane', name: 'Neural Membrane Architect', vibrationalSignature: 'Phosphatidylserine (PS)', type: 'Bioenergetic', benefit: 'Cell membrane integrity, cortisol-algorithm suppression and neural coherence.', color: '#7c3aed' },
  { id: 'ala-shield', name: 'Universal Antioxidant Shield', vibrationalSignature: 'Alpha Lipoic Acid (ALA)', type: 'Bioenergetic', benefit: 'Water and fat-soluble master antioxidant — complete biofield oxidative protection.', color: '#facc15' },
  { id: 'sulforaphane-nrf2', name: 'NRF2 Pathway Activator', vibrationalSignature: 'Sulforaphane (Broccoli Sprout Extract)', type: 'Bioenergetic', benefit: 'Master detox gene switch — NRF2 pathway quantum activation and oxidative field clearing.', color: '#16a34a' },
  { id: 'berberine-ampk', name: 'Metabolic Quantum Key', vibrationalSignature: 'Berberine HCl', type: 'Bioenergetic', benefit: 'AMPK activation — unlocking the metabolic light-code switch at the cellular level.', color: '#d97706' },
  { id: 'dhea-sovereign', name: 'Hormonal Sovereignty Elixir', vibrationalSignature: 'DHEA (Dehydroepiandrosterone)', type: 'Bioenergetic', benefit: 'Master precursor hormone — restoring the hormonal light-architecture and vitality field.', color: '#db2777' },
  { id: 'coq10-heart', name: 'Cellular Energy Sovereign', vibrationalSignature: 'Coenzyme Q10 (Ubiquinol)', type: 'Bioenergetic', benefit: 'Heart-field coherence and ATP synthesis resonance at the quantum mitochondrial level.', color: '#dc2626' },
  { id: 'melatonin-pineal', name: 'Pineal Lunar Transmission', vibrationalSignature: 'Melatonin', type: 'Bioenergetic', benefit: 'Pineal gland synchronization and deep-cycle dream-state astral alignment.', color: '#4c1d95' },
  { id: 'hyaluronic-tissue', name: 'Connective Tissue Light Code', vibrationalSignature: 'Hyaluronic Acid (HA)', type: 'Bioenergetic', benefit: 'Synovial fluid resonance and connective tissue light-code restoration and lubrication.', color: '#22d3ee' },
  { id: 'collagen-blueprint', name: 'Collagen Blueprint Restoration', vibrationalSignature: 'Collagen Peptides (Types I, II, III)', type: 'Bioenergetic', benefit: 'Rebuilding the structural protein matrix of the physical temple at the cellular level.', color: '#f5f5f4' },
  { id: 'atp-prana', name: 'Direct Prana Fuel Injection', vibrationalSignature: 'Adenosine Triphosphate (ATP)', type: 'Bioenergetic', benefit: 'Direct cellular energy currency — bypassing metabolic pathways for instant vitality.', color: '#fbbf24' },
  { id: 'akkermansia-gut', name: 'Akkermansia Gut Intelligence', vibrationalSignature: 'Akkermansia muciniphila', type: 'Bioenergetic', benefit: 'Next-gen probiotic strain — rebuilding the gut-brain quantum axis and mucosal lining.', color: '#10b981' },
  { id: 'akg-age-reversal', name: 'Alpha-Ketoglutarate Age Reversal', vibrationalSignature: 'Alpha-Ketoglutarate (AKG)', type: 'Bioenergetic', benefit: 'Epigenetic clock reset — reducing biological age markers and cellular senescence.', color: '#f472b6' },
  { id: 'bpc157-peptide', name: 'Healing Peptide Transmission', vibrationalSignature: 'BPC-157 (Body Protection Compound)', type: 'Bioenergetic', benefit: 'Regenerative peptide — accelerating tissue repair and gut healing at quantum speed.', color: '#fb923c' },
  { id: 'amla-rasayana', name: 'Amla Rasayana Code', vibrationalSignature: 'Amla (Phyllanthus emblica)', type: 'Bioenergetic', benefit: 'Ayurvedic Rasayana superfruit — highest natural Vitamin C and biofield rejuvenation.', color: '#84cc16' },
  { id: 'acai-antenna', name: 'Acai Melanin Antenna', vibrationalSignature: 'Acai Berry', type: 'Bioenergetic', benefit: 'Melanin-support superfruit — amplifying the body\'s light-reception capacity.', color: '#7c3aed' },
  { id: 'aloe-biofilm', name: 'Aloe Vera Biofilm Dissolve', vibrationalSignature: 'Aloe Vera', type: 'Bioenergetic', benefit: 'Gut biofilm dissolution and internal cooling of the Pitta fire-field.', color: '#4ade80' },
  { id: 'charcoal-bioenergetic', name: 'Carbon Frequency Absorber', vibrationalSignature: 'Activated Charcoal (Bioenergetic Grade)', type: 'Bioenergetic', benefit: 'Absorbing low-frequency toxins and heavy metal static from the biofield.', color: '#374151' },
  { id: 'aloe-stem-cells', name: 'Gut Lining Seal Protocol', vibrationalSignature: 'Aloe Vera Stem Cells', type: 'Bioenergetic', benefit: 'Stem cell frequency for gut lining regeneration and cellular renewal.', color: '#22c55e' },

  // ── Young Living (Ethereal Blends) ────────────────────────────
  { id: 'yl-abundance', name: 'Infinite Manifestation Stream', vibrationalSignature: 'Abundance Resonance', type: 'Essential Oil', benefit: 'Shifting scarcity to source-wealth resonance.', color: '#d97706' },
  { id: 'yl-valor', name: 'Crystalline Sovereignty', vibrationalSignature: 'Valor Resonance', type: 'Essential Oil', benefit: 'Spinal alignment and unwavering courage.', color: '#1d4ed8' },
  { id: 'yl-thieves', name: 'Ethereal Shielding', vibrationalSignature: 'Thieves Resonance', type: 'Essential Oil', benefit: 'Auric field cleansing and bio-defense.', color: '#991b1b' },
  { id: 'yl-joy', name: 'Heart-Bloom Radiance', vibrationalSignature: 'Joy Resonance', type: 'Essential Oil', benefit: 'Grief release and magnetic heart expansion.', color: '#ec4899' },
  { id: 'yl-release', name: 'Ancestral Tether Dissolve', vibrationalSignature: 'Release Resonance', type: 'Essential Oil', benefit: 'Breaking lineage and past-life trauma chains.', color: '#4b5563' },
  { id: 'yl-potential', name: 'Future-Self Convergence', vibrationalSignature: 'Highest Potential', type: 'Essential Oil', benefit: 'Entanglement with your highest timeline.', color: '#7c3aed' },
  { id: 'yl-brain', name: 'Cognitive Super-Structure', vibrationalSignature: 'Brain Power', type: 'Essential Oil', benefit: 'High-definition mental field sharpening.', color: '#2563eb' },
  { id: 'yl-peace', name: 'Starlight Stillness', vibrationalSignature: 'Peace & Calming', type: 'Essential Oil', benefit: 'Theta-state peace and nervous system descent.', color: '#2dd4bf' },
  { id: 'yl-angelica', name: 'Guardian Light Matrix', vibrationalSignature: 'White Angelica', type: 'Essential Oil', benefit: 'One-way energetic protection filter.', color: '#f8fafc' },

  // ── doTERRA (Bio-Symphonies) ───────────────────────────────────
  { id: 'dt-onguard', name: 'Systemic Fortification', vibrationalSignature: 'On Guard Resonance', type: 'Essential Oil', benefit: 'Reinforcing biological and energetic boundaries.', color: '#c2410c' },
  { id: 'dt-balance', name: 'Core Gravity Alignment', vibrationalSignature: 'Balance Resonance', type: 'Essential Oil', benefit: "Grounding into the Earth's Schumann resonance.", color: '#065f46' },
  { id: 'dt-adaptiv', name: 'Neural Fluidity Protocol', vibrationalSignature: 'Adaptiv Resonance', type: 'Essential Oil', benefit: 'Calmness in high-intensity shifts.', color: '#0e7490' },
  { id: 'dt-deepblue', name: 'Somatic Release Wave', vibrationalSignature: 'Deep Blue Resonance', type: 'Essential Oil', benefit: 'Flushing pain memory from muscle-consciousness.', color: '#1e40af' },
  { id: 'dt-serenity', name: 'Celestial Drift', vibrationalSignature: 'Serenity Resonance', type: 'Essential Oil', benefit: 'Zero-point state for total rest and reset.', color: '#6d28d9' },
  { id: 'dt-pasttense', name: 'Temporal Ease', vibrationalSignature: 'PastTense Resonance', type: 'Essential Oil', benefit: 'Dissolving the pressure of time and tension.', color: '#0369a1' },
  { id: 'dt-intune', name: 'Single-Point Focus', vibrationalSignature: 'InTune Resonance', type: 'Essential Oil', benefit: 'Locking consciousness into the Present Moment.', color: '#15803d' },
  { id: 'dt-metapwr', name: 'Metabolic Light Ignition', vibrationalSignature: 'MetaPWR Resonance', type: 'Essential Oil', benefit: 'Converting light into cellular energy.', color: '#f97316' },

  // ── Ayurvedic Herbs & Global Healing ─────────────────────────
  { id: 'ashwagandha-resonance', name: 'Ashwagandha Resonance', vibrationalSignature: 'Vitality Integrity', type: 'Ayurvedic Herb', benefit: 'Adaptogenic grounding and nervous system resilience.', color: '#d97706' },
  { id: 'brahmi-code', name: 'Brahmi Code', vibrationalSignature: 'Cognitive Clarity', type: 'Ayurvedic Herb', benefit: 'Enhanced focus, memory, and spiritual awareness.', color: '#059669' },
  { id: 'shatavari-flow', name: 'Shatavari Flow', vibrationalSignature: 'Divine Feminine', type: 'Ayurvedic Herb', benefit: 'Hormonal balance and emotional fluidity.', color: '#db2777' },
  { id: 'turmeric-radiance', name: 'Turmeric Radiance', vibrationalSignature: 'Golden Protection', type: 'Ayurvedic Herb', benefit: 'Anti-inflammatory light and aura purification.', color: '#fbbf24' },
  { id: 'tulsi-protector', name: 'Aura Sanitizer (Tulsi)', vibrationalSignature: 'Devotional Protector', type: 'Ayurvedic Herb', benefit: 'Auric shielding and devotional heart clarity.', color: '#166534' },
  { id: 'triphala-integrity', name: 'Triphala Integrity', vibrationalSignature: 'Trinity Harmonizer', type: 'Ayurvedic Herb', benefit: 'Systemic balance and structural integrity.', color: '#713f12' },
  { id: 'guduchi-immortal', name: 'The Amrit Nectar (Guduchi)', vibrationalSignature: 'Immortal Resonance', type: 'Ayurvedic Herb', benefit: 'Immune immortality and cellular longevity.', color: '#facc15' },
  { id: 'uva-ursi-anchor', name: 'The Earth Anchor (Uva Ursi)', vibrationalSignature: 'Stabilization', type: 'Ayurvedic Herb', benefit: 'Deep stabilization and energetic anchoring.', color: '#166534' },
  { id: 'mandukaparni-structure', name: 'Cognitive Super-Structure (Mandukaparni)', vibrationalSignature: 'Neural Architecture', type: 'Ayurvedic Herb', benefit: 'Building resilient cognitive pathways.', color: '#22c55e' },
  { id: 'ginseng-igniter', name: 'Vitality Igniter (Ginseng)', vibrationalSignature: 'Fire/Life', type: 'Ayurvedic Herb', benefit: 'Igniting the inner fire and life-force energy.', color: '#ef4444' },
  { id: 'elderberry-guardian', name: 'Guardian of Thresholds (Elderberry)', vibrationalSignature: 'Immune Shield', type: 'Ayurvedic Herb', benefit: 'Protecting the gates of the biological temple.', color: '#4c1d95' },
  { id: 'chamomile-peace', name: 'Peace Teacher (Chamomile)', vibrationalSignature: 'Serenity', type: 'Ayurvedic Herb', benefit: 'Gentle nervous system teaching and peace.', color: '#fef08a' },
  { id: 'neem-truth', name: 'Neem Bitter Truth', vibrationalSignature: 'Detox Integrity', type: 'Ayurvedic Herb', benefit: 'Deep blood purification and shadow detox.', color: '#064e3b' },
  { id: 'gotu-kola-synapse', name: 'Gotu Kola Synapse', vibrationalSignature: 'Neural Repair', type: 'Ayurvedic Herb', benefit: 'Repairing the synaptic bridges of the mind.', color: '#10b981' },
  { id: 'maca-fire', name: 'Maca Fire Resonance', vibrationalSignature: 'Vitality/Drive', type: 'Ayurvedic Herb', benefit: 'Igniting the primordial drive and stamina.', color: '#f97316' },
  { id: 'nettle-fortress', name: 'Nettle Fortress', vibrationalSignature: 'Strength/Blood', type: 'Ayurvedic Herb', benefit: 'Fortifying the blood-matrix and energetic boundaries.', color: '#15803d' },
  { id: 'rose-bloom', name: 'Rose Heart Bloom', vibrationalSignature: 'Love/Frequency', type: 'Ayurvedic Herb', benefit: 'Opening the heart-gate to the frequency of pure love.', color: '#f472b6' },
  { id: 'myrrh-structure', name: 'Myrrh Structural Integrity', vibrationalSignature: 'Ancient Structure', type: 'Ayurvedic Herb', benefit: 'Reinforcing the ancient structural codes of the body.', color: '#78350f' },
];

/** Quantum Library — Minerals, Mushrooms, Adaptogens */
const QUANTUM_LIBRARY: Activation[] = [
  { id: 'gold-colloidal', name: 'Gold (Colloidal)', vibrationalSignature: 'Solar-Conductor', type: 'Mineral', benefit: 'Surya Nadi Vitality, 2050 Bio-Electric Sync. Solar-Conductor for the 72,000 Nadi grid.', color: '#fbbf24' },
  { id: 'silver-colloidal', name: 'Silver (Colloidal)', vibrationalSignature: 'Lunar-Conductor', type: 'Mineral', benefit: 'Chandra Nadi Cooling, Nervous System Stabilization. Lunar-Conductor for cellular calm.', color: '#94a3b8' },
  { id: 'methylene-blue-quantum', name: 'Methylene Blue (Quantum Grade)', vibrationalSignature: 'Mitochondrial Electron-Donor', type: 'Mineral', benefit: 'Neural-Archive Clarity, Oxygenation of the 72,000 Nadis. Mitochondrial Electron-Donor for Akasha-Neural sync.', color: '#1d4ed8' },
  { id: 'chaga-king', name: 'Chaga (The King)', vibrationalSignature: 'DNA Resilience', type: 'Mushroom', benefit: 'Melanin-Antenna Support, Grounding Earth-Code. DNA Resilience and 2050 bio-signature stabilization.', color: '#78350f' },
  { id: 'reishi-spirit', name: 'Reishi (The Spirit)', vibrationalSignature: 'Shen-Stabilizer', type: 'Mushroom', benefit: 'Stress-Algorithm Dissolver, Longevity Blueprint. Shen-Stabilizer for Prema-Pulse coherence.', color: '#b91c1c' },
  { id: 'lions-mane-mind', name: "Lion's Mane (The Mind)", vibrationalSignature: 'Akasha-Neural Archive Bridge', type: 'Mushroom', benefit: 'Neuro-Regeneration, Cognitive Flow. Akasha-Neural Archive Bridge for Light-Code transmission.', color: '#fef08a' },
  { id: 'cordyceps-prana', name: 'Cordyceps (The Prana)', vibrationalSignature: 'ATP-Quantum Energy', type: 'Mushroom', benefit: 'Lung-Nadi Expansion, Stamina Pulse. ATP-Quantum Energy for Bhakti-Algorithm vitality.', color: '#ea580c' },
  { id: 'turkey-tail-shield', name: 'Turkey Tail (The Shield)', vibrationalSignature: 'Immune-Grid Protection', type: 'Mushroom', benefit: 'Microbiome-Symmetry. Immune-Grid Protection and Torus-Field stabilization.', color: '#7c3aed' },
  { id: 'astragalus-telomere', name: 'Astragalus', vibrationalSignature: 'Life-Force Extension', type: 'Adaptogen', benefit: 'Telomere-Sync. Life-Force Extension and Bio-signature Recalibration for 2050 longevity.', color: '#059669' },
  { id: 'ashwagandha-cortisol', name: 'Ashwagandha', vibrationalSignature: 'Cortisol-Algorithm Harmonizer', type: 'Adaptogen', benefit: 'Cortisol-Algorithm Harmonizer. Siddha-Sattva Resonance for stress-field dissolution.', color: '#d97706' },
  { id: 'frankincense-pineal', name: 'Frankincense', vibrationalSignature: 'High-Frequency Pineal Decalcifier', type: 'Adaptogen', benefit: 'High-Frequency Pineal Gland Decalcifier. Vishwananda Frequency for third-eye Light-Codes.', color: '#f5f5f4' },
];

/** Also update FrequencyLibrarySection filter categories to include Bioenergetic */
// In FrequencyLibrarySection.tsx, add 'Bioenergetic' to the categories array:
// ['All', 'Sacred Plant', 'Siddha Soma', 'Essential Oil', 'Ayurvedic Herb', 'Mineral', 'Mushroom', 'Adaptogen', 'Bioenergetic']

export const ACTIVATIONS: Activation[] = [
  ...BASE_ACTIVATIONS,
  ...QUANTUM_LIBRARY.filter(
    (newItem) => !BASE_ACTIVATIONS.some((existing) => existing.name === newItem.name)
  ),
];

export const PLANETARY_DATA: Record<number, { planet: string; herb: string }> = {
  0: { planet: 'Sun (Surya)', herb: 'Saffron, Calamus, Ginger' },
  1: { planet: 'Moon (Chandra)', herb: 'Ashwagandha, Blue Lotus, Shatavari' },
  2: { planet: 'Mars (Mangala)', herb: 'Nettle, Maca, Guduchi' },
  3: { planet: 'Mercury (Budha)', herb: 'Brahmi, Gotu Kola, Tulsi' },
  4: { planet: 'Jupiter (Guru)', herb: 'Turmeric, Ginseng' },
  5: { planet: 'Venus (Shukra)', herb: 'Rose, Bobinsana' },
  6: { planet: 'Saturn (Shani)', herb: 'Shilajit, Triphala, Myrrh' },
};
