/** English source for Temple Home site registry — used as base for i18n merges. */

export const templeHomeSitesEn: Record<string, { name: string; focus: string }> = {
  giza: { name: 'Giza', focus: 'Spinal Alignment & Torsion Field' },
  arunachala: { name: 'Arunachala', focus: 'Self-Inquiry & I AM Presence' },
  samadhi: { name: 'Samadhi Portal', focus: 'Aura Repair & Dissolution' },
  babaji: { name: "Babaji's Cave", focus: 'Kriya Activation & DNA Sync' },
  machu_picchu: { name: 'Machu Picchu', focus: 'Solar Vitality & Manifestation' },
  lourdes: { name: 'Lourdes Grotto', focus: 'Physical Restoration & Healing Water' },
  mansarovar: { name: 'Lake Mansarovar', focus: 'Mental Detox & Crown Purification' },
  zimbabwe: { name: 'Great Zimbabwe', focus: 'Ancestral Strength & Lineage' },
  shasta: { name: 'Mount Shasta', focus: 'Light-Body & Violet Flame' },
  luxor: { name: 'Luxor Temples', focus: 'Ka Body & Healer Activation' },
  uluru: { name: 'Uluru', focus: 'Dreamtime & Ancestral DNA' },
  kailash_13x: { name: 'Mount Kailash', focus: 'Moksha — Ultimate System Reset' },
  glastonbury: { name: 'Glastonbury (Avalon)', focus: 'Heart-Gate & Emotional Restoration' },
  sedona: { name: 'Sedona Vortex', focus: 'Psychic Vision & Creative Downloads' },
  titicaca: { name: 'Lake Titicaca', focus: 'Creative Rebirth & M/F Balance' },
  amritsar: { name: 'Golden Temple (Amritsar)', focus: 'Selfless Service & Abundance' },
  mauritius: { name: "Paramahamsa's Miracle Room", focus: 'Quantum Shifts & Instant Healing' },
  shirdi: { name: 'Shirdi Sai Baba Samadhi', focus: 'Total Surrender — Shraddha / Saburi' },
  vrindavan_krsna: { name: 'Ancient Vrindavan', focus: 'Premananda — Supreme Bliss' },
  ayodhya_rama: { name: 'Ancient Ayodhya', focus: 'Dharma & Spiritual Fortress' },
  lemuria: { name: 'Lemuria (Mu)', focus: 'Maternal Healing & Inner Child' },
  atlantis: { name: 'Atlantis (Poseidia)', focus: 'Mental Clarity & High-Tech Logic' },
  pleiades: { name: 'Pleiades Star System', focus: 'Starlight Harmony & Music Alignment' },
  sirius: { name: 'Sirius (The Blue Star)', focus: 'Initiation & Wisdom Downloads' },
  arcturus: { name: 'Arcturus', focus: 'Rapid Regeneration & Geometric Healing' },
  lyra: { name: 'Lyra (The Felines)', focus: 'Original Sound — Frequency of Creation' },
};

export type TempleSiteDbEntryEn = {
  title: string;
  primaryBenefit: string;
  instruction: string;
  experience: string;
  bio?: string;
  intensityLabel?: string;
};

export const templeHomeSiteDbEn: Record<string, TempleSiteDbEntryEn> = {
  giza: { title: 'Pyramid of Giza', primaryBenefit: 'Spinal Alignment & Torsion Field', instruction: 'Visualize a golden pillar of light passing through your spine, root to crown.', experience: 'A sense of vertical alignment and structural integrity throughout the body.' },
  babaji: { title: "Mahavatar Babaji's Cave", primaryBenefit: 'Kriya DNA Activation', instruction: "Focus on the Third Eye. Breathe 'up and down' the spine in a spiral. Allow spontaneous Kriya to begin.", experience: 'Deep stillness, spinal heat, a sense of timeless presence.' },
  arunachala: { title: 'Arunachala', primaryBenefit: 'Self-Inquiry & Silence', instruction: "Rest in the 'I AM' presence. Let all thoughts dissolve back to their source without engagement.", experience: 'The mind becoming quiet. The heart expanding into boundlessness.' },
  samadhi: { title: 'Samadhi Portal', primaryBenefit: 'Aura Repair', instruction: 'Merge your awareness with the infinite void. Dissolve the edges of self completely.', experience: 'A feeling of dissolving into the infinite. The aura resets.' },
  machu_picchu: { title: 'Machu Picchu', primaryBenefit: 'Solar Vitality & Manifestation', instruction: 'Breathe the golden sun directly into your Solar Plexus. Fill the entire abdomen with solar fire.', experience: 'A surge of vitality, personal power, and manifestation clarity.' },
  lourdes: { title: 'Lourdes Grotto', primaryBenefit: 'Physical Restoration', instruction: 'Imagine pure healing water flowing through every cell. Let it reach areas of pain or illness first.', experience: 'A soothing, cooling, cleansing sensation through the entire body.' },
  mansarovar: { title: 'Lake Mansarovar', primaryBenefit: 'Mental Detox & Crown Purification', instruction: 'Visualize crystal clear Himalayan water pouring through the Crown chakra, washing the mind completely clean.', experience: 'Mental clarity. A sense of pure, high-altitude air in the mind.' },
  zimbabwe: { title: 'Great Zimbabwe', primaryBenefit: 'Ancestral Strength', instruction: "Feel the strength of thousands of years of lineage grounding you into the Earth's core. You are not alone.", experience: 'A feeling of ancestral support, solid foundation, and deep belonging.' },
  shasta: { title: 'Mount Shasta', primaryBenefit: 'Light-Body Activation', instruction: 'Visualize a violet flame surrounding the entire body. Allow it to dissolve anything not of the light.', experience: "A 'cool,' breezy feeling in the aura. The body feeling lighter." },
  luxor: { title: 'Luxor Temples', primaryBenefit: 'Ka Body & Healer Activation', instruction: 'Breathe warm alchemical gold light into the palms of the hands. Feel the Ka body double activate.', experience: 'Heat and tingling in the hands. A warm, solid sensation in the physical body.' },
  uluru: { title: 'Uluru', primaryBenefit: 'Dreamtime & Ancestral DNA', instruction: "Sink deep into the red earth. Feel the Dreamtime consciousness rising from below the feet.", experience: "Intense grounding. A feeling of being 'held' by the entire Earth." },
  kailash_13x: { title: 'Mount Kailash — 13X Awakening', primaryBenefit: 'Moksha / Total Purification', instruction: 'Breathe in a 7.83-second cycle. Visualize the sacred peak; allow all karmic layers to dissolve into the void. Every mantra playing is amplified 13×.', experience: 'Shimmering violet clarity. Total purification. A sense of liberation from karmic weight.', bio: 'The Axis Mundi. Strips karmic imprints and 13× the power of any mantra or healing audio in your space.' },
  glastonbury: { title: 'Glastonbury (Avalon)', primaryBenefit: 'Heart-Gate Activation', instruction: 'Open the heart gate. Breathe emerald light into the chest; feel the Avalon mist dissolving old emotional armoring.', experience: 'Heart-Gate activation. Emotional restoration. An emerald warmth in the chest.', bio: 'Heart-Gate activation and emotional restoration. Heals relationships, grief, and long-held emotional wounding.' },
  sedona: { title: 'Sedona Vortex', primaryBenefit: 'Psychic Vision & Ability Activation', instruction: "Align with the magnetic spiral. Focus at the Third Eye; let the red-rock energy 'spin out' mental fog.", experience: 'Magnetic spiral activation. Heightened psychic vision. Creative clarity.', bio: 'Spins out mental fog and activates dormant psychic abilities. The premier portal for creative downloads.' },
  titicaca: { title: 'Lake Titicaca', primaryBenefit: 'Creative Rebirth & Manifestation', instruction: 'Connect to the sacral center. Solar gold light ripples from the lake into the lower belly, igniting creative fire.', experience: 'Solar gold ripples. Creative energy surging. Balance between masculine and feminine.', bio: 'Activates the sacral center for creative rebirth, manifestation, and masculine/feminine balance.' },
  amritsar: { title: 'Golden Temple — Harmandir Sahib', primaryBenefit: 'Selfless Service (Seva) & Infinite Abundance', instruction: 'Visualize wading into still, golden water. Liquid gold light rises into your heart. Release all desire for personal reward. Serve without expectation.', experience: 'A warm, liquid-gold sensation flooding the chest. Deep equality and profound calm. The feeling of being held by the entire universe.', bio: 'Clears poverty consciousness. Aligns the heart with selfless giving (Seva). Abundance flows in proportion to the willingness to give.' },
  mauritius: { title: "Paramahamsa Vishwananda's Miracle Room", primaryBenefit: 'Quantum Shifts & Cellular Recalibration', instruction: 'Sit in complete stillness. Do NOT visualize. Empty the mind. Do not seek a miracle — become the vessel. White sparks at vision periphery confirm field activation.', experience: 'Third Eye pressure. Palm heat. Spontaneous emotional release. Time distortion. Divine Spark particles visible in app.', bio: 'Breaks stagnant physical laws in the body. Used for "impossible" healing and rapid cellular recalibration. Highest-voltage portal.' },
  shirdi: { title: 'Shirdi Sai Baba Dhuni Samadhi', primaryBenefit: 'Total Surrender & Nervous System Protection', instruction: 'Visualize the Dhuni — ancient sacred fire burning before you. Offer every fear into the flame. Repeat: "Shraddha. Saburi." — Faith. Patience.', experience: 'A warm weight settling on the shoulders. Fear dissolving. A deep, abiding protection surrounding you.', intensityLabel: 'Faith & Patience (Shraddha / Saburi)', bio: 'Drastically lowers cortisol/stress. Creates a Faith Shield that protects the nervous system from anxiety and overwhelm.' },
  vrindavan_krsna: { title: 'Ancient Vrindavan (Era of Krishna)', primaryBenefit: 'Premananda — Supreme Bliss', instruction: 'Rest in the peacock-blue field of divine play. Allow falling lotus petals to carry you into supreme bliss. Do not try — just receive.', experience: 'Premananda — bliss arising from love. Falling lotus petals. Spontaneous joy.', bio: 'Infuses the home with Premananda — Supreme Bliss. Heals through joy, playfulness, and divine love.' },
  ayodhya_rama: { title: 'Ancient Ayodhya (Era of Rama & Hanuman)', primaryBenefit: 'Dharma & Spiritual Fortress', instruction: "Invoke the golden shield of dharma. Feel Rama's order and Hanuman's protection anchoring around your entire field.", experience: 'Golden shield aura forming. Dharma and divine protection established. A sense of sacred order.', bio: 'The ultimate Spiritual Fortress. Provides 24/7 protection and re-establishes Dharma in the household.' },
  lemuria: { title: 'Lemuria (Mu)', primaryBenefit: 'Maternal Healing & Inner Child Safety', instruction: 'Sink into warm turquoise waters. Allow maternal creation energy to restore the heart and hold the inner child.', experience: 'Tropical soft warmth. Deep emotional safety. The inner child relaxing completely.', bio: 'Maternal and Ancestral healing. Provides deep emotional safety and nurtures the Inner Child.' },
  atlantis: { title: 'Atlantis (Poseidia)', primaryBenefit: 'Mental Clarity & High-Tech Logic', instruction: 'Merge with deep navy crystal light. Let liquid light geometry flow through the brain, clearing all fog.', experience: 'Liquid light geometry visible in the mind. Crystal clarity. Mental breakthroughs.', bio: 'Clears brain fog and enhances high-tech logic, problem-solving, and analytical brilliance.' },
  pleiades: { title: 'Pleiades Star System', primaryBenefit: 'Starlight Harmony & Music Production', instruction: 'Receive diamond-white starlight from above. Do not direct it — let it flow through you and into your creative work.', experience: 'Diamond sparkle. Creative downloads arriving spontaneously. Musical ideas flowing without effort.', bio: 'Aligns music production and healing audio with Starlight Harmony. The premier portal for musicians and sound healers.' },
  sirius: { title: 'Sirius (The Blue Star)', primaryBenefit: 'Initiation & Wisdom Downloads', instruction: 'Attune to the Blue Star. Open to initiation. Allow ancient high-wisdom to download as direct knowing, not concepts.', experience: 'Double sun flare in inner vision. A sense of being initiated. Wisdom arriving as direct knowing.', bio: 'Transmits initiation and Ancient High-Wisdom. Activates higher orders of knowing beyond learned intelligence.' },
  arcturus: { title: 'Arcturus', primaryBenefit: 'Rapid Regeneration & Geometric Healing', instruction: 'Let an electric violet grid pulse through the body from head to toe. Allow it to recalibrate every cell.', experience: 'Violet grid pulse throughout the body. Cellular regeneration. Rapid physical healing.', bio: 'Focused on rapid physical regeneration and advanced geometric healing for the mind and body.' },
  lyra: { title: 'Lyra (The Felines)', primaryBenefit: 'Original Sound — Frequency of Creation', instruction: 'Merge with pure white light. This is the original sound — before all other sounds. Do not direct it. Become it.', experience: 'White light fire. The feeling of touching the original creative frequency from which all exists.', bio: 'The Original Sound and Frequency of Creation. The deepest and most primordial portal in the registry.' },
};

export const templeHomeSiteBgEn: Record<string, { scene: string }> = {
  kailash_13x: { scene: 'Snow-capped peak · Violet-gold Schumann sky' },
  amritsar: { scene: 'Golden Temple night · Amrit Sarovar reflection' },
  ayodhya_rama: { scene: 'Grand Vedic temple · Saffron celestial aura' },
  vrindavan_krsna: { scene: 'Mystical forest twilight · Blue lotus & peacock sky' },
  glastonbury: { scene: 'Green hills of Avalon · Emerald mist rising' },
  giza: { scene: 'Cosmic night sky · Milky Way · Ancient torsion' },
  sedona: { scene: 'Red rock vortex · Fiery sunset · Energy spirals' },
  pleiades: { scene: 'Deep space nebula · Diamond-white stardust' },
  sirius: { scene: 'The Blue Star · Initiation light field' },
  arcturus: { scene: 'Violet regeneration grid · Geometric light fields' },
  mauritius: { scene: 'Miracle Room · Divine Spark field' },
  shirdi: { scene: 'Dhuni eternal flame · Sacred fire of surrender' },
};

export const templeHomeSiteSignatures: Record<string, string> = {
  giza: 'GIZA_TORSION',
  babaji: 'KRIYA_SYNC',
  arunachala: 'STILLNESS_FIELD',
  samadhi: 'AURA_REPAIR',
  machu_picchu: 'SOLAR_SYNC',
  lourdes: 'WATER_RESONANCE',
  mansarovar: 'MENTAL_DETOX',
  zimbabwe: 'ANCESTRAL_STRENGTH',
  shasta: 'LIGHT_BODY_SYNC',
  luxor: 'KA_ACTIVATION',
  uluru: 'DREAMTIME_SYNC',
  kailash_13x: 'KAILASH_SHIMMER',
  glastonbury: 'AVALON_MIST',
  sedona: 'SEDONA_VORTEX',
  titicaca: 'SOLAR_RIPPLES',
  amritsar: 'AMRIT_SAROVAR',
  mauritius: 'MIRACLE_PORTAL',
  shirdi: 'DHUNI_FLAME',
  vrindavan_krsna: 'FALLING_LOTUS',
  ayodhya_rama: 'GOLDEN_SHIELD_AURA',
  lemuria: 'TROPICAL_SOFT_GLOW',
  atlantis: 'LIQUID_LIGHT_GEOMETRY',
  pleiades: 'DIAMOND_SPARKLE',
  sirius: 'DOUBLE_SUN_FLARE',
  arcturus: 'VIOLET_GRID_PULSE',
  lyra: 'WHITE_LIGHT_FIRE',
};
