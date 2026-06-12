import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { getTierRank } from '@/lib/tierAccess';
import { VastuTool } from '@/components/vastu/VastuTool';

// ─────────────────────────────────────────────────────────────────
// SQI 2050 Unified Vastu Portal
// Tab 1: SIDDHA VASTU EDUCATION  (all tiers, free = modules 1–2)
// Tab 2: ABUNDANCE ARCHITECT     (Prana-Flow+ only — VastuTool)
// ─────────────────────────────────────────────────────────────────

// ── Curriculum Types ──────────────────────────────────────────────
type CurrTier = 'free' | 'prana' | 'siddha' | 'akasha';
interface LessonSection { heading: string; body: string; }
interface Lesson {
  id: string; title: string; duration: string; tier: CurrTier;
  glyph: string; overview: string; sections: LessonSection[];
  practice: string; mantra?: string; secret?: string;
}
interface Module {
  id: string; level: number; title: string; subtitle: string;
  tier: CurrTier; icon: string; color: string; tagline: string;
  lessons: Lesson[];
}

const CURR_TIER_ORDER: Record<CurrTier, number> = { free: 0, prana: 1, siddha: 2, akasha: 3 };
const CURR_TIER_LABEL: Record<CurrTier, string> = { free: 'FREE', prana: 'PRANA-FLOW', siddha: 'SIDDHA-QUANTUM', akasha: 'AKASHA-INFINITY' };
const CURR_TIER_COLOR: Record<CurrTier, string> = { free: '#6EE7B7', prana: '#67E8F9', siddha: '#D4AF37', akasha: '#C8B4FF' };
const currHasAccess = (req: CurrTier, user: CurrTier) => CURR_TIER_ORDER[user] >= CURR_TIER_ORDER[req];

// ── Full Curriculum Data (mirrored from SiddhaVastuCurriculum) ────
const CURR_MODULES: Module[] = [
  {
    id: 'bhoomi', level: 1, title: 'Bhoomi Prajna', subtitle: 'Earth Wisdom & Foundations',
    tier: 'free', icon: '🌍', color: '#6EE7B7',
    tagline: 'Before you can build a sacred home, you must understand the sacred science.',
    lessons: [
      {
        id: 'b1', title: 'Vastu Shastra — The Living Architecture', duration: '22 min', tier: 'free', glyph: 'वा',
        overview: 'Vastu Shastra is the world\'s oldest continuous architectural science — a precise technology for aligning human dwelling with cosmic forces.',
        sections: [
          { heading: 'What Vastu Actually Is', body: 'Vastu Shastra (वास्तु शास्त्र) translates literally as \'the science of dwelling.\' It is one of the six Vedangas — the auxiliary sciences attached to the Vedas — and its roots trace to the Atharva Veda and the Sthapatya Veda.\n\nThe Siddhas of Tamil Nadu carried a far older transmission: every built structure is a living organism. The walls, floors, and roof are a crystalline matrix that holds, transmits, and radiates energy. Modern building biology confirms that living in different electromagnetic environments produces measurable changes in cortisol, melatonin, and cellular function.' },
          { heading: 'The Vastu Purusha — The Being of Space', body: 'A cosmic being — the Vastu Purusha — inhabits every plot of land and every built structure. He lies face-down, head in the NE corner, feet at the SW. His body parts map onto zones of the home:\n\n• Head (NE): Brain, intelligence, spiritual reception\n• Chest (E–N): Heart, lungs, vitality\n• Navel (Centre): Brahma Sthana — the pranic core\n• Feet (SW): Foundation, stability, ancestral power\n\nWhen you place a heavy structure on his head (NE), you suppress the intelligence of all who live there. The Vastu Purusha is the invisible skeleton your architect never draws.' },
          { heading: 'Why Modern Homes Create Modern Suffering', body: 'Contemporary architecture is built on three principles: cost, function, aesthetics. It ignores a fourth dimension: consciousness. The result is environments that are structurally sound and energetically chaotic.\n\n• Toilet in NE: Suppresses spiritual clarity, creates chronic mental fog\n• Bedroom in SE: Elevates aggression, disrupts sleep\n• Kitchen in SW: Drains the master\'s power, creates financial instability\n• Main door facing South: Invites Yama\'s energy — stagnation and decline' },
          { heading: 'The Three Pillars of Siddha Vastu', body: '1. Sthapatya (Structure): The physical layout — directions, zones, room placement, measurements.\n\n2. Bhoga (Experience): How the space feels and functions — light quality, air movement, acoustic properties, material frequencies.\n\n3. Moksha (Liberation): The highest purpose — designing spaces that accelerate spiritual evolution. A home aligned at this level becomes a Gurukula — a living teacher.' },
        ],
        practice: 'Stand at the centre of your home. Close your eyes. Take 7 slow breaths. Notice: is there a sense of openness, stillness? Or constriction, unease, scattered energy? You are feeling the Brahma Sthana — the pranic core of your home. Journal what you noticed. This is your first Vastu diagnosis.',
        mantra: 'ॐ वास्तु पुरुषाय नमः',
        secret: 'The Siddhas taught that a practitioner of sufficient depth can feel a building\'s Vastu imbalance through their feet within 60 seconds of entering. This is the sympathetic resonance between the human nervous system and the building\'s electromagnetic field.',
      },
      {
        id: 'b2', title: 'The Vastu Purusha Mandala — Sacred Grid of Space', duration: '35 min', tier: 'free', glyph: 'म',
        overview: 'The Vastu Purusha Mandala is the master map — a grid of 81 sacred squares (padas) that encodes the complete intelligence of sacred space.',
        sections: [
          { heading: 'The 9×9 Paramasaayika Grid', body: 'The Vastu Mandala divides any plot or floor plan into a 9×9 grid of 81 squares called \'padas.\' Each pada is governed by a specific deity, direction, element, and cosmic function.\n\nThe 45 deities of the Vastu Mandala include:\n• Brahma at the centre (pada 45) — pure creative consciousness\n• The 8 Ashtadikpalas at the 8 directions — directional guardians\n• 32 outer deities forming the boundary — cosmic protection' },
          { heading: 'How to Overlay the Grid', body: 'Step 1: Obtain your floor plan. Mark True North.\nStep 2: Draw a perfect square or rectangle enclosing your floor plan. Irregular shapes reveal \'missing corners\' — significant Doshas.\nStep 3: Divide both axes into 9 equal parts. You now have 81 padas.\nStep 4: Identify which rooms fall in which padas. Where the kitchen falls on Agni\'s padas = harmony.\nStep 5: Note heavily loaded padas versus empty ones.' },
          { heading: 'Missing Corners — The Most Common Dosha', body: 'When a home has an L-shape or T-shape, it creates \'missing corners.\'\n\nMissing NE: Blocks spiritual and financial incoming energy. Chronic confusion and missed opportunities.\nMissing SW: Very severe — the master has no throne. Power instability, leadership failures.\nMissing NW: Support systems fail. Helpers unreliable, customers don\'t return.\nMissing SE: Health and digestive issues. Financial leakage without apparent cause.' },
          { heading: 'The Brahma Sthana — The Sacred Centre', body: 'The centremost pada is sacred to Brahma — the creator consciousness. Rules:\n\n• Must be completely open — no walls, heavy furniture, columns, or toilets\n• Preferably has a skylight or open-to-sky\n• Should never be used for storage\n• Is the ideal spot for a small lamp or fresh flowers\n\nWhen the Brahma Sthana is blocked, the home loses its pranic centre. When it is open and energised, synchronicities increase, health improves, and family harmony deepens.' },
        ],
        practice: 'Draw your floor plan on graph paper. Mark True North. Divide into a 9×9 grid. Identify: (1) Where is your Brahma Sthana? What is placed there? (2) Are all four corners present? (3) Where is the heaviest object in your home? Which pada does it occupy?',
        mantra: 'ॐ ब्रह्मणे नमः',
        secret: 'Ancient Siddha Vastu texts describe \'Vastu Prashna\' — asking the Vastu Purusha himself to reveal the home\'s issues. Done at midnight on a full moon: sit at the Brahma Sthana, light a ghee lamp, and ask a specific question. The answer comes as a dream, a physical sensation, or an immediate synchronicity.',
      },
      {
        id: 'b3', title: 'Plot Selection — Reading the Land\'s Karma', duration: '28 min', tier: 'free', glyph: 'भू',
        overview: 'Before a single brick is laid, the Siddha Vastu master spent days reading the land. The plot itself carries a karmic signature that either supports or undermines everything built upon it.',
        sections: [
          { heading: 'Bhumi Pariksha — Earth Examination', body: 'The classical Vastu texts describe a 5-point Earth Examination:\n\n1. Soil Quality: Dig 30cm. Black or red soil = favourable. Grey or blue-grey = problematic.\n2. Smell Test: Sweet or neutral smell = healthy. Foul or metallic smell = contaminated.\n3. Water Seepage: Flows North or East = very auspicious. Flows South or West only = caution.\n4. Sound Test: Clear resonant sound when clapped above = healthy Prithvi element.\n5. Vegetation: Healthy growth = pranic richness. Sparse or dead = geopathic stress.' },
          { heading: 'Auspicious and Inauspicious Plot Shapes', body: 'Auspicious:\n• Perfect square (Brahma Khanda): Highest — complete, balanced\n• Rectangle N-S greater than E-W: Very good — north extends the wealth meridian\n\nInauspicious:\n• Triangle: Creates fire energy imbalance, increases conflict\n• L-shape: Always has a missing corner\n• Narrowing at the back (cow-tail): Money flows in but does not accumulate\n• Widening at the back (lion-face): Excellent — wealth accumulates' },
          { heading: 'Neighbouring Structures and Shadow Dosha', body: 'Any sharp corner, edge, or pointed structure aimed at your home creates a Vedha — an energetic puncture.\n\nShadow Rules:\n• Shadow of a temple on your home = blessed\n• Shadow of a hospital or broken building = problematic\n• Shadow of a tree on main door (East) before noon = auspicious\n• Large structure blocking morning sunlight East = significant Dosha' },
          { heading: 'The 21-Day Observation Protocol', body: 'Before committing to a property, observe it at different times:\n• Morning (6–9am): How does sunlight enter? Are there birds? (Birds avoid geopathically stressed sites)\n• Noon: Is there natural ventilation? Does the space feel still or dynamic?\n• Evening: How does the site feel as solar energy withdraws?\n\nAlso speak with long-term neighbours. High owner turnover is a significant red flag.' },
        ],
        practice: 'Go outside and observe your plot from each of the 4 cardinal directions. Note: the shape of your plot, what structures surround you, which direction morning light enters, and whether vegetation is thriving or struggling.',
        mantra: 'ॐ पृथ्व्यै नमः',
        secret: 'The Siddhas taught that certain plots are \'Kshetra\' — sacred fields — where the earth\'s pranic charge is naturally high. Signs: ant hills built in a conical shape (termites follow earth\'s magnetic lines), spontaneous growth of tulsi or bilva, and a feeling of effortless calm the moment you step onto the land.',
      },
      {
        id: 'b4', title: 'Vastu vs Modern Architecture — The Missing Dimension', duration: '20 min', tier: 'free', glyph: 'आ',
        overview: 'Modern architecture optimises for cost, function, and aesthetics. Siddha Vastu adds the fourth dimension: consciousness.',
        sections: [
          { heading: 'What Modern Architecture Gets Right', body: 'Modern architecture has mastered:\n• Structural integrity and safety\n• Energy efficiency and thermal comfort\n• Acoustic management\n• Functional flow and ergonomics\n\nThese are real achievements. Vastu does not dismiss them. The Siddha position is that these represent necessary but insufficient conditions for a truly sacred home.' },
          { heading: 'The Fourth Dimension: Consciousness', body: 'Consciousness is the dimension modern architecture ignores entirely. This creates a specific kind of deprivation:\n\n• Beautiful homes that are energetically hollow\n• Efficient spaces that generate chronic low-grade stress\n• "Smart" buildings that make their inhabitants feel dull\n• Architecturally praised structures where residents experience persistent unhappiness\n\nThe absence of the fourth dimension is not theoretical — it produces measurable outcomes in health, relationship quality, and cognitive function.' },
          { heading: 'Material Frequencies', body: 'Every building material carries a vibratory signature:\n\nAmplifiers:\n• Natural stone (granite, sandstone): Holds and radiates earth prana\n• Teak and rosewood: Living tree memory, resonates at 432Hz range\n• Copper: Prana superconductor\n• Lime plaster: Breathes, alkaline — resists mould and low-frequency accumulation\n\nDampeners:\n• Synthetic carpets: Block earth connection, accumulate static charge\n• Aluminium structural elements: Disrupt magnetic coherence\n• Large glass facades (uncurtained at night): Create Vastu Vedha\n• Chipboard and MDF: Low-resonance, outgasses formaldehyde' },
        ],
        practice: 'Walk through your home and consciously touch the walls. Notice the temperature, texture, and feeling of each material. Ask yourself: is this material alive or dead? Does it feel warm or cold to consciousness? This develops the sensitivity that Vastu practice requires.',
        mantra: 'ॐ स्थापत्याय नमः',
      },
    ],
  },
  {
    id: 'agni', level: 2, title: 'Agni Shakti', subtitle: 'The Five Elements & Directional Science',
    tier: 'free', icon: '🔥', color: '#FCA5A5',
    tagline: 'Every direction is a deity. Every element is a power. Learn to read the invisible map of your home.',
    lessons: [
      {
        id: 'ag1', title: 'Pancha Bhuta — The Five Elements in Space', duration: '30 min', tier: 'free', glyph: 'पं',
        overview: 'The Siddhas mapped the five elements (Pancha Bhuta) onto the eight directions with mathematical precision. Understanding this map is the foundation of all Vastu diagnosis.',
        sections: [
          { heading: 'Earth (Prithvi) — SW Direction', body: 'The Earth element governs the Southwest. SW is the heaviest, most stable zone:\n\n• Master bedroom belongs here — anchors household authority\n• No openings in extreme SW corner — energy must be sealed\n• Storage of valuables: safe, important documents, precious metals\n• Flooring: natural stone or terracotta amplifies Earth here\n• Heaviest furniture placed in SW rooms' },
          { heading: 'Water (Jala) — NE Direction', body: 'The Water element governs the Northeast. NE is the zone of grace and cosmic intelligence:\n\n• Water features belong here: fountains, indoor plants with water, aquariums\n• Keep NE light, open, and clean — clutter here suppresses intelligence\n• A copper bowl of clean water in NE activates the zone powerfully\n• No toilets or heavy structures in NE — the most serious modern Vastu Dosha\n• Morning prayer and meditation facing NE activates Saraswati\'s field' },
          { heading: 'Fire (Agni) — SE Direction', body: 'The Fire element governs the Southeast. SE is the zone of transformation:\n\n• Kitchen belongs in SE — Agni cooks not just food but relationships\n• Electrical equipment: generator, inverter, fuse box — all belong SE\n• Red and orange tones activate Agni in SE rooms\n• No water features in SE — Agni-Jala Dosha creates constant conflict\n• SE is the direction of creativity and transformation' },
          { heading: 'Air (Vayu) — NW Direction', body: 'The Air element governs the Northwest. NW is the zone of support, movement, and help:\n\n• Guest rooms belong in NW — guests should not stay too long (Vayu moves)\n• Garage or vehicle parking in NW — vehicles belong to the movement zone\n• Helpers, staff, and support personnel should work from NW side\n• When NW is blocked or heavy, community relationships suffer\n• White and grey tones activate Vayu in NW rooms\n\nThe Space element (Akasha) governs the centre — the Brahma Sthana.' },
        ],
        practice: 'Create a simple element map of your home. Draw your floor plan and label the 4 quadrants: SW (Earth), NE (Water), SE (Fire), NW (Air). Now note what you have placed in each zone. Is the kitchen in SE? Is the master bedroom in SW? Are there water features in NE? This is your elemental diagnostic.',
        mantra: 'ॐ पञ्चभूताय नमः',
        secret: 'The Siddhas taught that the five elements in a home respond to the element dominance in the body of the primary resident. A Vata-dominant person (Air element) amplifies NW energy — often living in rented homes, frequently moving, unable to settle. A Kapha-dominant person (Earth/Water) amplifies SW/NE — stable, accumulating, potentially too fixed. Knowing your Prakriti tells you which directional zones require special attention in your personal Vastu practice.',
      },
    ],
  },
  {
    id: 'vayu', level: 3, title: 'Vayu Prayana', subtitle: 'The Eight Directions — Deep Mastery',
    tier: 'prana', icon: '🌬️', color: '#67E8F9',
    tagline: 'Each direction is a portal. Learn the deity, element, and cosmic function of every axis.',
    lessons: [
      {
        id: 'v1', title: 'North & Northeast — The Wealth-Wisdom Axis', duration: '40 min', tier: 'prana', glyph: 'उ',
        overview: 'The North-to-Northeast axis is the single most important directional axis in all of Vastu. Mastering these two zones unlocks both material abundance and cosmic intelligence.',
        sections: [
          { heading: 'North — Kubera\'s Domain', body: 'North is governed by Kubera — the lord of wealth — and ruled by Mercury. It is the direction of inflow: financial opportunity, business connections, career advancement, and networking.\n\nNorth zone principles:\n• Keep the North wall lower than the South wall whenever possible\n• North entrance is second only to East in auspiciousness\n• Large windows or open spaces on the North side allow wealth prana to enter\n• Water features (indoor fountain, aquarium) in the North activate Kubera\'s energy\n• Avoid heavy structures, storage, or walls on the North side of any room' },
          { heading: 'Northeast — Ishanya, The Divine Portal', body: 'NE is governed by Ishanya — a form of Shiva as the lord of grace. It is the zone where cosmic intelligence enters the home.\n\nAbsolute NE rules:\n• Must be the lowest point of the plot — NE should be lighter and lower than SW\n• Any toilet in NE is the single most damaging Vastu Dosha in modern homes\n• Prayer room, meditation space, water feature: ideal placements\n• Complete cleanliness required — the home\'s spiritual immune system lives here\n• If NE has a missing corner, the home lacks divine support regardless of other alignments' },
          { heading: 'East — The Solar Gateway', body: 'East is governed by Indra and ruled by the Sun. Every sunrise is a cosmic re-creation.\n\n• Main entrance ideally faces East — allows sunrise prana to enter daily\n• Windows must be large and unobstructed — morning light is non-negotiable\n• The Tulsi plant at the East entrance activates Surya prana\n• No tall trees or structures directly blocking the East\n• Living room or dining room ideal in East zone' },
          { heading: 'Southwest & West', body: 'SW is governed by Nairuti and ruled by Rahu — Earth element zone, heavy and stable:\n• Master bedroom belongs here exclusively\n• No openings in the extreme SW corner\n• Storage of valuables: safe, important documents, precious metals\n\nWest is governed by Varuna (water deity of karma) and ruled by Saturn:\n• Children\'s rooms and study spaces are ideal here\n• Dining room in the West: meals become rituals of receiving the day\'s harvest\n• Blue and grey tones activate Varuna\'s field' },
        ],
        practice: 'Identify the SW room of your home. If you are the head of household and not sleeping here, consider who is sleeping there — that person may be inadvertently holding household authority. For 30 days, meditate in the SW corner for 10 minutes before making important decisions.',
        mantra: 'ॐ कुबेराय नमः',
        secret: 'The Siddha masters used a technique called \'Disha Dharana\' — directional absorption. Before entering a room, they would stand at the threshold, face the room\'s dominant direction, and consciously invite that direction\'s deity to work through them in that space. A practitioner who does this consistently reports that each room begins to feel distinctly different — each space activating a specific quality of consciousness.',
      },
    ],
  },
  {
    id: 'jala', level: 4, title: 'Jala Sutra', subtitle: 'Kitchen, Bedroom & Water Architecture',
    tier: 'prana', icon: '💧', color: '#93C5FD',
    tagline: 'The most intimate rooms of your home are either your greatest allies or your greatest obstacles.',
    lessons: [
      {
        id: 'j1', title: 'The Sacred Kitchen — Agni\'s Laboratory', duration: '35 min', tier: 'prana', glyph: 'अ',
        overview: 'The kitchen is not a utility room — it is the most important room in the home. Every meal is a yajna (sacred fire ritual). Every cook is a priest of Agni.',
        sections: [
          { heading: 'Zone Placement', body: 'Ideal: SE zone. If unavailable, NW is second best. Never NE (water fights fire), never SW (drains Earth energy).\n\nCook\'s direction: Always East or South.\nStove placement: On SE wall. Never on North wall (opposes Kubera) or directly facing main entrance.\nSink placement: North or NE of the stove, never adjacent to it — Agni-Jala Dosha.\nRefrigerator: SW of the kitchen — Earth element stores.\nKitchen door: Should not face the toilet door.' },
          { heading: 'The Sleeping Direction Science', body: 'Head pointing South: Optimal for deep sleep and longevity. Aligns body\'s magnetic polarity with Earth\'s south magnetic field.\n\nHead pointing East: Second best. Promotes spiritual insight and vivid instructive dreams. Ideal for meditators.\n\nHead pointing West: Acceptable but produces mentally active, sometimes disturbing dreams.\n\nHead pointing North: The only absolute prohibition. The human body is a biological magnet — pointing head North creates a repulsive magnetic relationship with Earth\'s North pole. Linked to poor sleep quality and increased stress hormones.' },
          { heading: 'Bedroom Materials and Technology', body: 'Colours: Earthen pinks, warm whites, terracotta, deep blue, forest green. Avoid red (activates Agni-aggression).\n\nMirrors: No mirror visible from the bed. Mirrors create a doubled energy field that disturbs sleep. Use a curtain to cover mirrored wardrobes at night.\n\nTechnology: Every electronic device emits EMF that disrupts melatonin production. Minimum 1 metre between any device and the head. Ideally: phone on aeroplane mode outside the bedroom.' },
        ],
        practice: 'Check three things tonight: (1) Which direction is your head pointing while you sleep? (2) Is there a mirror visible from your bed? (3) Where is your phone when you sleep? Make the adjustments and track your sleep quality for 7 days.',
        mantra: 'ॐ अग्नये नमः',
        secret: 'The Siddha masters slept for only 3–4 hours per night without fatigue. The secret: they aligned their bed in the exact SW position, head South, and before sleeping performed a 21-breath pranayama that consciously released awareness from the Manomaya Kosha. They entered deep Prajna (dreamless sleep) within minutes and recovered the equivalent of 8 hours in 4. The Vastu alignment was the container that made this possible.',
      },
    ],
  },
  {
    id: 'akasha', level: 5, title: 'Akasha Vidya', subtitle: 'Advanced Vastu — Geopathic Stress & Doshas',
    tier: 'siddha', icon: '✨', color: '#D4AF37',
    tagline: 'The invisible forces that no architect measures — and the Siddha technologies that neutralise them.',
    lessons: [
      {
        id: 'ak1', title: 'Geopathic Stress — The Hidden Force', duration: '45 min', tier: 'siddha', glyph: 'ना',
        overview: 'Beneath every building runs a network of invisible forces that modern science is only beginning to measure. The Siddhas mapped these 5,000 years ago.',
        sections: [
          { heading: 'Hartmann and Curry Grids', body: 'German physician Ernst Hartmann identified a global grid of electromagnetic lines criss-crossing the Earth\'s surface at regular intervals. Walter Curry later identified a second grid at 45-degree angles. The crossings of these grids are \'Curry crossings\' — the most geopathically active points.\n\nSleeping above a Hartmann or Curry crossing has been linked with:\n• Disrupted melatonin production\n• Significantly increased tumour incidence in sleeping positions\n• Chronic sleep disorders\n• Relationship breakdown\n\nThe Siddhas called these lines \'Naga Rekha\' — serpent lines.' },
          { heading: 'The 27 Vastu Doshas', body: '19. Dwar Vedha (Entrance Piercing): Something directly facing the main entrance.\n20. Shayan Dosha (Sleep Defect): Bed in wrong zone or direction.\n21. Paka Dosha (Cooking Defect): Kitchen in wrong zone.\n22. Snan Dosha (Bathing Defect): Bathroom in NE or Brahma Sthana.\n23. Marma Dosha (Vital Point Defect): Heavy structures through Marma points.\n24. Pitr Dosha (Ancestor Defect): Ancestor photos mixed with deity images.\n25. Yantra Dosha: Improperly activated or incorrectly placed Yantras.\n26. Vriksha Dosha (Tree Defect): Large trees too close in specific directions.\n27. Jyotish Dosha: Home\'s Vastu misaligned with owner\'s birth chart.' },
        ],
        practice: 'Investigate your sleeping position for geopathic stress. Obtain a simple compass app. Identify any underground water pipes, electrical cables, or utility boxes near your bedroom. Notice if there are areas of your home where plants consistently fail to thrive — this is a reliable indicator of geopathic stress.',
        mantra: 'ॐ नागराजाय नमः',
        secret: 'The Siddha technique for detecting geopathic stress: walk barefoot through every room of your home at dusk. Areas of geopathic stress create a subtle but unmistakable sensation of coldness, discomfort, or unease in the feet. This is not imagination — it is the sympathetic nervous system responding to electromagnetic irregularity.',
      },
    ],
  },
  {
    id: 'soma', level: 6, title: 'Soma Tantra', subtitle: 'Advanced Remedies & Sacred Activation',
    tier: 'siddha', icon: '🌙', color: '#A78BFA',
    tagline: 'The home as a living yantra. Remedies that don\'t require renovation.',
    lessons: [
      {
        id: 's1', title: 'Vastu Remedies Without Renovation', duration: '40 min', tier: 'siddha', glyph: 'सो',
        overview: 'Most people cannot renovate their home to achieve perfect Vastu. The Siddha tradition has developed a complete system of energetic remedies that correct Doshas without structural changes.',
        sections: [
          { heading: 'Crystal and Metal Remedies', body: 'Copper: The most powerful Vastu metal. A copper strip at the threshold of the main entrance activates the home\'s receiving channel. Copper vessels for water stored in NE. Copper roof apex installation in traditional Tamil Vastu.\n\nCrystals by zone:\n• NE: Clear quartz or aquamarine — activates water and intelligence\n• SW: Black tourmaline or hematite — amplifies Earth, provides protection\n• SE: Citrine or carnelian — activates Agni, enhances creativity\n• NW: White moonstone or selenite — activates Air, supports movement' },
          { heading: 'Plant Medicine for Doshas', body: 'Specific plants correct specific Doshas:\n\nTulsi (Holy Basil): The supreme Vastu plant. Placed at East entrance, purifies incoming solar prana, repels negative entities, and activates the health of all residents. A home with a thriving Tulsi at the East door is spiritually protected.\n\nMoney Plant (Pothos): Placed in North zone, activates Kubera\'s wealth channel. The plant should vine upward — never let it trail on the floor.\n\nBamboo: In NE — activates rapid growth of prosperity and intelligence. In SE — reduces Agni aggression.\n\nNever bring cactus or thorny plants inside — they create Vedha (energetic puncture) from within.' },
          { heading: 'Sound Remedies — Nada Vastu', body: 'The Siddhas understood that sound restructures the electromagnetic field of a space more powerfully than any physical remedy.\n\nNada Vastu remedies:\n• Daily Vedic chanting in the Brahma Sthana — most powerful single remedy available\n• 432 Hz music played continuously for 21 days clears accumulated psychic debris\n• Tibetan singing bowls at each corner: NE first, then clockwise\n• Conch shell (Shankha) blown at sunrise and sunset — creates a protective sonic field\n• The Siddha Nada Transmission: a trained practitioner can restructure a home\'s field in a single session through sustained sound transmission' },
        ],
        practice: 'Choose one remedy from this lesson and implement it today. The most impactful quick implementation: place a Tulsi plant at your East entrance (or the closest window facing East). Perform a simple prayer to the plant each morning for 21 days.',
        mantra: 'ॐ सोमाय नमः',
        secret: 'The Siddhas described a practice called \'Griha Prana Pratishtha\' — the installation of life-force into a home. This is done through a specific sequence of mantras, fire offerings, and physical actions performed over 3 consecutive days during an auspicious Muhurta. Once performed, the home begins to function as a living being — self-correcting its energy, protecting its residents, and actively supporting their dharmic purpose.',
      },
    ],
  },
  {
    id: 'surya', level: 7, title: 'Surya Yantra', subtitle: 'The Home as Sacred Geometry',
    tier: 'akasha', icon: '☀️', color: '#C8B4FF',
    tagline: 'The ultimate Vastu transmission — your home as a living yantra of consciousness.',
    lessons: [
      {
        id: 'sy1', title: 'The Home as Living Yantra', duration: '60 min', tier: 'akasha', glyph: 'ॐ',
        overview: 'The highest teaching of Siddha Vastu: the home is not merely a structure — it is a yantra, a geometric portal through which cosmic intelligence continuously flows.',
        sections: [
          { heading: 'What a Yantra Is', body: 'A Yantra is a geometric representation of cosmic intelligence — a physical mandala that, when properly activated, functions as a portal between ordinary consciousness and higher states.\n\nYour home can become a personal Yantra. When every element of the physical space — directions, proportions, materials, sounds, smells, colours, and daily rituals — is aligned with the underlying geometry of consciousness, the home begins to function as a self-activating field generator.' },
          { heading: 'Signs of a Yantra-Home', body: 'Signs that a home has reached Yantra status:\n• Guests consistently report feeling peaceful, elevated, or unusually clear upon entering\n• Meditation sessions in the home are effortlessly deeper than elsewhere\n• Healing from illness is faster than medically expected\n• Synchronicities increase for all residents\n• Arguments become rare and resolve quickly\n• The space has a quality of aliveness — not of incense or food, but of pure presence\n• Dreams are consistently instructive and spiritually significant' },
        ],
        practice: 'For 40 days, perform a brief but complete daily ritual: (1) Wake at Brahma Muhurta (90 min before sunrise). (2) Light a ghee lamp at the Brahma Sthana. (3) Chant OM 21 times. (4) Walk the perimeter of your home clockwise, sprinkling sacred water (water in which a copper coin has rested overnight). This sequence begins the process of Yantra activation.',
        mantra: 'ॐ श्री महालक्ष्म्यै नमः',
        secret: 'The Akasha-level Vastu secret: the activated Yantra-home eventually begins to communicate with its residents directly. Not through mystical experiences, but through a quiet inner knowing that arises naturally when residing in a high-frequency space. Decisions made in such a home consistently lead to dharmic outcomes. This is the true purpose of Vastu — not wealth maximisation, but dharmic alignment so precise that wealth, health, and liberation arise as natural consequences.',
      },
    ],
  },
];

// ── Education Panel (inline, no full-page wrapper) ─────────────────
const VastuEducationPanel: React.FC<{ userRank: number }> = ({ userRank }) => {
  const userTier: CurrTier = userRank >= 3 ? 'akasha' : userRank >= 2 ? 'siddha' : userRank >= 1 ? 'prana' : 'free';
  const [selectedModule, setSelectedModule] = useState<Module>(CURR_MODULES[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(CURR_MODULES[0].lessons[0]);
  const [activeSection, setActiveSection] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const totalLessons = CURR_MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const accessibleLessons = CURR_MODULES.reduce(
    (sum, m) => sum + m.lessons.filter((l) => currHasAccess(l.tier, userTier)).length, 0
  );
  const completedCount = completedLessons.size;

  const selectLesson = (module: Module, lesson: Lesson) => {
    if (!currHasAccess(lesson.tier, userTier)) return;
    setSelectedModule(module);
    setSelectedLesson(lesson);
    setActiveSection(0);
  };

  const markComplete = () => {
    setCompletedLessons((prev) => new Set([...prev, selectedLesson.id]));
    const modIdx = CURR_MODULES.findIndex((m) => m.id === selectedModule.id);
    const lesIdx = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);
    const nextLesson = selectedModule.lessons[lesIdx + 1];
    if (nextLesson && currHasAccess(nextLesson.tier, userTier)) {
      setSelectedLesson(nextLesson); setActiveSection(0);
    } else if (CURR_MODULES[modIdx + 1]) {
      const nextMod = CURR_MODULES[modIdx + 1];
      if (currHasAccess(nextMod.tier, userTier) && nextMod.lessons[0]) {
        setSelectedModule(nextMod); setSelectedLesson(nextMod.lessons[0]); setActiveSection(0);
      }
    }
  };

  const maxSection = selectedLesson.sections.length + (selectedLesson.mantra ? 1 : 0) + (selectedLesson.secret ? 1 : 0);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', background: '#050505' }}>
      {/* Sidebar toggle bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', padding: '5px 9px', cursor: 'pointer', fontSize: '12px' }}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        <div style={{ marginLeft: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 800, letterSpacing: '0.3em' }}>
            {selectedModule.title} · {selectedLesson.title}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: 14 }}>{completedCount}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.2em' }}>/ {accessibleLessons} COMPLETE</span>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: 38 }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
            {CURR_MODULES.map((mod) => {
              const modAccess = currHasAccess(mod.tier, userTier);
              const isActive = selectedModule.id === mod.id;
              const modCompleted = mod.lessons.filter((l) => completedLessons.has(l.id)).length;
              return (
                <div key={mod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div
                    onClick={() => modAccess && setSelectedModule(mod)}
                    style={{ padding: '12px 14px', cursor: modAccess ? 'pointer' : 'default', background: isActive ? 'rgba(212,175,55,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: modAccess ? `${mod.color}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${modAccess ? `${mod.color}30` : 'rgba(255,255,255,0.04)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {modAccess ? mod.icon : '🔒'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em' }}>L{mod.level}</span>
                        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.12em', color: CURR_TIER_COLOR[mod.tier], background: `${CURR_TIER_COLOR[mod.tier]}15`, padding: '1px 5px', borderRadius: 100 }}>
                          {mod.tier.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: modAccess ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mod.title}
                      </div>
                    </div>
                    {modAccess && (
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, flexShrink: 0 }}>
                        {modCompleted}/{mod.lessons.length}
                      </div>
                    )}
                  </div>
                  {isActive && modAccess && (
                    <div style={{ paddingBottom: 4 }}>
                      {mod.lessons.map((lesson) => {
                        const lesAccess = currHasAccess(lesson.tier, userTier);
                        const isActiveLesson = selectedLesson.id === lesson.id;
                        const isDone = completedLessons.has(lesson.id);
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => lesAccess && selectLesson(mod, lesson)}
                            style={{ padding: '9px 14px 9px 22px', cursor: lesAccess ? 'pointer' : 'default', background: isActiveLesson ? 'rgba(212,175,55,0.08)' : 'transparent', borderLeft: `2px solid ${isActiveLesson ? '#D4AF37' : 'transparent'}`, display: 'flex', alignItems: 'flex-start', gap: 8 }}
                          >
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: isDone ? '#34D399' : isActiveLesson ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isDone ? '#34D399' : isActiveLesson ? '#D4AF37' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, flexShrink: 0, marginTop: 1 }}>
                              {isDone ? '✓' : lesAccess ? '▶' : '🔒'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: lesAccess ? (isActiveLesson ? '#D4AF37' : 'rgba(255,255,255,0.65)') : 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: isActiveLesson ? 700 : 500, lineHeight: 1.3 }}>
                                {lesson.title}
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 2 }}>{lesson.duration}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Stats */}
            <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, letterSpacing: '0.2em', marginBottom: 8 }}>CURRICULUM STATS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[{ label: 'MODULES', value: CURR_MODULES.length }, { label: 'LESSONS', value: totalLessons }, { label: 'ACCESS', value: accessibleLessons }, { label: 'DONE', value: completedCount }].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: 16 }}>{value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7, letterSpacing: '0.2em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lesson content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Hero */}
          <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: `linear-gradient(135deg, ${selectedModule.color}08 0%, transparent 60%)` }}>
            <div style={{ maxWidth: 680 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', color: selectedModule.color, background: `${selectedModule.color}15`, padding: '3px 9px', borderRadius: 100 }}>
                  LEVEL {selectedModule.level} · {CURR_TIER_LABEL[selectedLesson.tier]}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{selectedModule.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${selectedModule.color}15`, border: `1px solid ${selectedModule.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'serif', color: selectedModule.color, flexShrink: 0 }}>
                  {selectedLesson.glyph}
                </div>
                <div>
                  <h1 style={{ fontSize: 'clamp(16px, 2.5vw, 24px)', fontWeight: 900, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.92)', lineHeight: 1.1, marginBottom: 8 }}>
                    {selectedLesson.title}
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, maxWidth: 520 }}>{selectedLesson.overview}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{ padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 0, overflowX: 'auto' }}>
            {[
              ...selectedLesson.sections.map((s, i) => ({ id: i, label: s.heading })),
              { id: selectedLesson.sections.length, label: 'SADHANA PRACTICE' },
              ...(selectedLesson.mantra ? [{ id: selectedLesson.sections.length + 1, label: 'MANTRA' }] : []),
              ...(selectedLesson.secret ? [{ id: selectedLesson.sections.length + (selectedLesson.mantra ? 2 : 1), label: 'SIDDHA SECRET' }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{ padding: '12px 14px', border: 'none', borderBottom: `2px solid ${activeSection === tab.id ? '#D4AF37' : 'transparent'}`, background: 'transparent', color: activeSection === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', textTransform: 'uppercase' }}
              >
                {typeof tab.label === 'string' && tab.label.length > 22 ? tab.label.substring(0, 21) + '…' : tab.label}
              </button>
            ))}
          </div>

          {/* Section body */}
          <div style={{ padding: '32px', maxWidth: 720 }}>
            {activeSection < selectedLesson.sections.length ? (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.88)', marginBottom: 20 }}>
                  {selectedLesson.sections[activeSection].heading}
                </h2>
                {selectedLesson.sections[activeSection].body.split('\n\n').map((para, i) => (
                  <p key={i} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.8, marginBottom: 18, whiteSpace: 'pre-line' }}>{para}</p>
                ))}
              </div>
            ) : activeSection === selectedLesson.sections.length ? (
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', color: '#34D399', marginBottom: 14 }}>🧘 SADHANA PRACTICE</div>
                <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: 24 }}>
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selectedLesson.practice}</p>
                </div>
              </div>
            ) : activeSection === selectedLesson.sections.length + 1 && selectedLesson.mantra ? (
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', color: '#C8B4FF', marginBottom: 14 }}>🔔 ACTIVATION MANTRA</div>
                <div style={{ background: 'rgba(200,180,255,0.06)', border: '1px solid rgba(200,180,255,0.2)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(18px, 3.5vw, 32px)', fontFamily: 'serif', color: '#C8B4FF', lineHeight: 1.6, letterSpacing: '0.05em', textShadow: '0 0 30px rgba(200,180,255,0.3)' }}>
                    {selectedLesson.mantra}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 14 }}>Chant 108 times · Brahma Muhurta (pre-dawn) is ideal</div>
                </div>
              </div>
            ) : selectedLesson.secret ? (
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', color: '#D4AF37', marginBottom: 14 }}>∞ SIDDHA AKASHA SECRET</div>
                <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 24 }}>
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>{selectedLesson.secret}</p>
                </div>
              </div>
            ) : null}

            {/* Nav */}
            <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
                style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: activeSection === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: activeSection === 0 ? 'not-allowed' : 'pointer', letterSpacing: '0.1em' }}
              >← PREV</button>

              {!completedLessons.has(selectedLesson.id) ? (
                <button
                  onClick={markComplete}
                  style={{ padding: '10px 24px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, color: '#34D399', fontSize: 10, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.15em' }}
                >✓ MARK COMPLETE & CONTINUE</button>
              ) : (
                <div style={{ padding: '10px 18px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, color: '#34D399', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>✓ TRANSMISSION COMPLETE</div>
              )}

              <button
                onClick={() => setActiveSection(Math.min(maxSection, activeSection + 1))}
                disabled={activeSection >= maxSection}
                style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: activeSection >= maxSection ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: activeSection >= maxSection ? 'not-allowed' : 'pointer', letterSpacing: '0.1em' }}
              >NEXT →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Upgrade Gate for Abundance Architect ──────────────────────────
const AbundanceUpgradeGate: React.FC = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#050505' }}>
    <div style={{ maxWidth: 400, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 24, padding: 40 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🏛️</div>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 900, color: '#D4AF37', marginBottom: 12, letterSpacing: '-0.02em' }}>
        Abundance Architect
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
        The AI-guided 10-module Vastu abundance journey requires Prana-Flow membership or above.
      </p>
      <a
        href="/membership"
        style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #D4AF37, #B8962E)', borderRadius: 12, color: '#050505', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textDecoration: 'none', textTransform: 'uppercase' }}
      >
        UPGRADE TO PRANA-FLOW
      </a>
    </div>
  </div>
);

// ── Main Unified Vastu Page ────────────────────────────────────────
const Vastu = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, isPremium, loading: membershipLoading, isAdmin, adminGranted, settled } = useMembership();
  const { isAdmin: isAdminRole } = useAdminRole();
  const [activeTab, setActiveTab] = useState<'education' | 'abundance'>('education');

  if (authLoading || membershipLoading || !settled) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#D4AF37', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Education is free for all authenticated users
  // Abundance Architect requires Prana-Flow+
  const hasAbundanceAccess = isAdmin || adminGranted || isPremium || getTierRank(tier) >= 1;
  const userRank = isAdmin || isAdminRole ? 3 : (getTierRank(tier) ?? 0);

  const TABS = [
    { id: 'education' as const, label: 'SIDDHA VASTU EDUCATION', icon: '📚', sub: 'All Tiers' },
    { id: 'abundance' as const, label: 'ABUNDANCE ARCHITECT', icon: '🏛️', sub: 'Prana-Flow+' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0, background: '#050505',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", colorScheme: 'dark',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes fadeTab { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 2px; }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
      `}</style>

      {/* ── Portal Header ── */}
      <div style={{
        padding: '14px 20px 0',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.01) 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
        flexShrink: 0,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🕉
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em', color: '#fff' }}>
              Siddha Vastu Portal
            </div>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
              Sacred Space Intelligence
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isLocked = tab.id === 'abundance' && !hasAbundanceAccess;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? '#D4AF37' : 'transparent'}`,
                  background: 'transparent',
                  color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                    {tab.label}
                  </div>
                  <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.2em', color: isLocked ? 'rgba(255,255,255,0.2)' : isActive ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.2)', marginTop: 1 }}>
                    {isLocked ? '🔒 ' : ''}{tab.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', animation: 'fadeTab 0.3s ease' }}>
        {activeTab === 'education' && (
          <VastuEducationPanel userRank={userRank} />
        )}
        {activeTab === 'abundance' && (
          hasAbundanceAccess
            ? <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}><VastuTool isAdmin={isAdmin || isAdminRole} /></div>
            : <AbundanceUpgradeGate />
        )}
      </div>
    </div>
  );
};

export default Vastu;
