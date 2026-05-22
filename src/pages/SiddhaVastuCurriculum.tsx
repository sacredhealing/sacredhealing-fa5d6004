import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tier = "free" | "prana" | "siddha" | "akasha";

interface LessonSection {
  heading: string;
  body: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  tier: Tier;
  glyph: string;
  overview: string;
  sections: LessonSection[];
  practice: string;
  mantra?: string;
  secret?: string;
}

interface Module {
  id: string;
  level: number;
  title: string;
  subtitle: string;
  tier: Tier;
  icon: string;
  color: string;
  tagline: string;
  lessons: Lesson[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_ORDER: Record<Tier, number> = { free: 0, prana: 1, siddha: 2, akasha: 3 };
const TIER_LABEL: Record<Tier, string> = { free: "FREE", prana: "PRANA-FLOW", siddha: "SIDDHA-QUANTUM", akasha: "AKASHA-INFINITY" };
const TIER_COLOR: Record<Tier, string> = { free: "#6EE7B7", prana: "#67E8F9", siddha: "#D4AF37", akasha: "#C8B4FF" };
const hasAccess = (req: Tier, user: Tier) => TIER_ORDER[user] >= TIER_ORDER[req];

// ─── Full Curriculum Data ─────────────────────────────────────────────────────
const MODULES: Module[] = [
  // ══════════════════════════════════════════════════════════
  // LEVEL 1 — BHOOMI
  // ══════════════════════════════════════════════════════════
  {
    id: "bhoomi",
    level: 1,
    title: "Bhoomi Prajna",
    subtitle: "Earth Wisdom & Foundations",
    tier: "free",
    icon: "🌍",
    color: "#6EE7B7",
    tagline: "Before you can build a sacred home, you must understand the sacred science.",
    lessons: [
      {
        id: "b1",
        title: "Vastu Shastra — The Living Architecture",
        duration: "22 min",
        tier: "free",
        glyph: "वा",
        overview: "Vastu Shastra is the world's oldest continuous architectural science — not a set of superstitions but a precise technology for aligning human dwelling with cosmic forces.",
        sections: [
          {
            heading: "What Vastu Actually Is",
            body: "Vastu Shastra (वास्तु शास्त्र) translates literally as 'the science of dwelling.' Vastu means 'a site or foundation for a house' and Shastra means 'system of knowledge.' It is one of the six Vedangas — the auxiliary sciences attached to the Vedas — and its roots trace to the Atharva Veda and the Sthapatya Veda.\n\nBut the Siddhas of Tamil Nadu carried a far older transmission: they understood that every built structure is a living organism. The walls, floors, and roof are not just materials — they are a crystalline matrix that holds, transmits, and radiates energy. This is not metaphor. Modern building biology confirms that living in different electromagnetic environments produces measurable changes in cortisol, melatonin, and cellular function.",
          },
          {
            heading: "The Vastu Purusha — The Being of Space",
            body: "The central teaching of Vastu is that a cosmic being — the Vastu Purusha — inhabits every plot of land and every built structure. He lies face-down, head in the NE corner, feet at the SW. His body parts map precisely onto zones of the home:\n\n• Head (NE): Brain, intelligence, spiritual reception\n• Chest (E–N): Heart, lungs, vitality\n• Navel (Centre): Brahma Sthana — the pranic core\n• Feet (SW): Foundation, stability, ancestral power\n\nWhen you place a heavy structure on his head (NE), you suppress the intelligence of all who live there. When you leave his navel (centre) open, the home breathes freely. This is not poetic — it is structural. The Vastu Purusha is the invisible skeleton your architect never draws.",
          },
          {
            heading: "Why Modern Homes Create Modern Suffering",
            body: "Contemporary architecture is built on three principles: cost, function, aesthetics. It ignores a fourth dimension: consciousness. The result is environments that are structurally sound and energetically chaotic.\n\nSpecific consequences documented by Vastu practitioners and increasingly by environmental psychologists:\n• Toilet in NE: Suppresses spiritual clarity, creates chronic mental fog\n• Bedroom in SE: Elevates aggression, disrupts sleep, increases relationship conflict\n• Kitchen in SW: Drains the master's power, creates financial instability\n• Main door facing South: Invites Yama's energy — stagnation, legal troubles, health decline\n\nNone of these effects are mystical. They arise because specific zones carry specific electromagnetic signatures based on solar angle, magnetic field gradient, and underground geology.",
          },
          {
            heading: "The Three Pillars of Siddha Vastu",
            body: "The Siddha tradition teaches three layers of Vastu practice:\n\n1. Sthapatya (Structure): The physical layout — directions, zones, room placement, measurements. This is what most people call 'Vastu.'\n\n2. Bhoga (Experience): How the space feels and functions — light quality, air movement, acoustic properties, material frequencies.\n\n3. Moksha (Liberation): The highest purpose — designing spaces that accelerate spiritual evolution. A home aligned at this level becomes a Gurukula — a living teacher.",
          },
        ],
        practice: "Stand at the centre of your home (or apartment). Close your eyes. Take 7 slow breaths. Notice: is there a sense of openness, stillness, or fullness? Or constriction, unease, scattered energy? You are feeling the Brahma Sthana — the pranic core of your home. Journal what you noticed. This is your first Vastu diagnosis.",
        mantra: "ॐ वास्तु पुरुषाय नमः",
        secret: "The Siddhas taught that a practitioner of sufficient depth can feel a building's Vastu imbalance through their feet within 60 seconds of entering. This is not clairvoyance — it is the sympathetic resonance between the human nervous system and the building's electromagnetic field. Developing this sensitivity is the foundation of mastery.",
      },
      {
        id: "b2",
        title: "The Vastu Purusha Mandala — Sacred Grid of Space",
        duration: "35 min",
        tier: "free",
        glyph: "म",
        overview: "The Vastu Purusha Mandala is the master map — a grid of 81 sacred squares (padas) that encodes the complete intelligence of sacred space.",
        sections: [
          {
            heading: "The 9×9 Paramasaayika Grid",
            body: "The most commonly used Vastu Mandala divides any plot or floor plan into a 9×9 grid of 81 squares called 'padas.' Each pada is governed by a specific deity, direction, element, and cosmic function. The mandala is not just a grid — it is a holographic map of the cosmos projected onto the dwelling.\n\nThe 45 deities of the Vastu Mandala include:\n• Brahma at the centre (pada 45) — pure creative consciousness\n• The 8 Ashtadikpalas at the 8 directions — directional guardians\n• 32 outer deities forming the boundary — cosmic protection\n• Inner ring deities — the functional organs of the home",
          },
          {
            heading: "How to Overlay the Grid",
            body: "Step 1: Obtain your floor plan (even a hand-drawn sketch works). Mark True North (not magnetic north — use a compass and correct for magnetic declination in your location).\n\nStep 2: Draw a perfect square or rectangle enclosing your floor plan. If your home is L-shaped or irregular, this step reveals 'missing corners' — which are significant Doshas.\n\nStep 3: Divide both axes into 9 equal parts. You now have 81 padas.\n\nStep 4: Identify which rooms fall in which padas. Compare to the deity map. Where the kitchen falls on Agni's padas = harmony. Where a bedroom falls on Yama's padas = problem.\n\nStep 5: Note any heavily loaded padas (structural columns, heavy furniture, toilets) versus empty ones. The mandala diagnosis reveals everything.",
          },
          {
            heading: "Missing Corners — The Most Common Dosha",
            body: "When a home has an L-shape, T-shape, or any irregular cut, it creates 'missing corners' — zones of the Vastu Purusha Mandala that are literally absent from the structure.\n\nMissing NE corner: Severe — blocks spiritual and financial incoming energy. Residents experience chronic confusion and missed opportunities.\n\nMissing SW corner: Very severe — the master has no throne. Power instability, leadership failures, and health issues in the eldest member.\n\nMissing NW: Support systems fail. Helpers are unreliable, customers don't return, community relationships suffer.\n\nMissing SE: Health and digestive issues throughout the family. Financial leakage without apparent cause.\n\nRemedies for missing corners exist — copper rods, mirror placement, plant extensions — but the most powerful solution is to avoid irregular plots when choosing property.",
          },
          {
            heading: "The Brahma Sthana — The Sacred Centre",
            body: "The centremost pada is sacred to Brahma — the creator consciousness. It is called the Brahma Sthana and is the most important single point in any Vastu system.\n\nRules for the Brahma Sthana:\n• Must be completely open — no walls, heavy furniture, columns, or toilets\n• Preferably has a skylight or open-to-sky (Brahmanda — 'sky egg')\n• Should never be used for storage\n• Is the ideal spot for a small lamp or fresh flowers\n• In open floor plans, this zone should feel spacious and calm\n\nWhen the Brahma Sthana is blocked, the home loses its pranic centre — like a body with a blocked solar plexus. All activity in the home becomes effortful. When it is open and energised, synchronicities increase, health improves, and family harmony deepens.",
          },
        ],
        practice: "Draw your floor plan on graph paper. Mark True North. Divide into a 9×9 grid. Identify: (1) Where is your Brahma Sthana? What is placed there? (2) Are all four corners present or are any missing? (3) Where is the heaviest object in your home (safe, bookshelf, refrigerator)? Which pada does it occupy? Note your findings — these are your first real Vastu diagnostics.",
        mantra: "ॐ ब्रह्मणे नमः",
        secret: "Ancient Siddha Vastu texts describe a practice called 'Vastu Prashna' — asking the Vastu Purusha himself to reveal the home's issues. This is done at midnight on a full moon: sit at the Brahma Sthana, light a ghee lamp, and ask a specific question. The answer comes as a dream, a physical sensation, or an immediate synchronicity. The Siddhas treated the Vastu Purusha as a living guru residing within every structure.",
      },
      {
        id: "b3",
        title: "Plot Selection — Reading the Land's Karma",
        duration: "28 min",
        tier: "free",
        glyph: "भू",
        overview: "Before a single brick is laid, the Siddha Vastu master spent days — sometimes weeks — reading the land. The plot itself carries a karmic signature that either supports or undermines everything built upon it.",
        sections: [
          {
            heading: "Bhumi Pariksha — Earth Examination",
            body: "The classical Vastu texts describe a 5-point Bhumi Pariksha (Earth Examination):\n\n1. Soil Quality: Dig 30cm and observe. Black or red soil = favourable. White soil = neutral. Grey or blue-grey = problematic (indicates underground water issues).\n\n2. Smell Test: Take a handful of soil and smell it. Sweet or neutral smell = healthy. Foul, metallic, or chemical smell = contaminated or geopathically stressed.\n\n3. Water Seepage Direction: Pour water on the plot and observe: if it spreads evenly = balanced. If it flows North or East = very auspicious. If it flows South or West only = caution.\n\n4. Sound Test: The Siddhas would clap sharply above the soil and listen. A clear resonant sound = healthy Prithvi element. A dull or hollow sound = underground voids or water channels.\n\n5. Vegetation: Healthy, lush vegetation = pranic richness. Sparse, stunted, or dead vegetation despite adequate water = geopathic stress.",
          },
          {
            heading: "Auspicious and Inauspicious Plot Shapes",
            body: "Plot shapes carry powerful energetic signatures:\n\nAuspicious:\n• Perfect square (Brahma Khanda): Highest — complete, balanced, no missing zones\n• Rectangle with N-S length greater than E-W width: Very good — north extends the wealth meridian\n• Circle (rare): Used for temples — too powerful for residences\n\nInauspicious:\n• Triangle: Creates fire energy imbalance, increases conflict\n• L-shape: Always has a missing corner — diagnose which direction\n• Narrowing at the back (cow-tail shape): Money flows in but does not accumulate\n• Widening at the back (lion-face shape): Excellent — wealth accumulates, family grows\n• Plots with a road hitting the main door directly: T-junction plots — aggressive energy requires strong remedies",
          },
          {
            heading: "Neighbouring Structures and Shadow Dosha",
            body: "The ancient Vastu texts spend significant space on the relationship between a property and its neighbours — particularly what casts shadows onto your plot.\n\nVastu Vedha (Energy Puncture): Any sharp corner, edge, or pointed structure aimed at your home creates a Vedha — an energetic puncture. Even a neighbour's roof angle pointing at your bedroom window can disrupt sleep and create health issues.\n\nShadow Rules:\n• Shadow of a temple falling on your home = blessed (absorbs the deity's prana)\n• Shadow of a hospital, crematorium, or broken building = problematic\n• Shadow of a tree falling on the main door (East or North) before noon = auspicious\n• Shadow of any large structure blocking morning sunlight to the East = significant Dosha",
          },
          {
            heading: "The 21-Day Observation Protocol",
            body: "Before committing to a property, the Siddha Vastu tradition recommends a 21-day observation period. This is not always practical with modern real estate — but even a modified version pays dividends.\n\nWhat to observe during site visits at different times:\n• Morning (6–9am): How does sunlight enter? Is there bird activity? (Birds are excellent Vastu indicators — they avoid geopathically stressed sites)\n• Noon (12–2pm): Is there natural ventilation? Does the space feel still or dynamic?\n• Evening (5–7pm): How does the site feel as solar energy withdraws? Peaceful or uneasy?\n• Night visit if possible: Are there insects, rodents, or other indicators of underground water activity?\n\nAlso speak with long-term neighbours. Ask casually: 'Has this plot had many different owners?' High turnover is a significant red flag — the land's karma does not support stability.",
          },
        ],
        practice: "If you are in your current home: go outside and observe your plot from each of the 4 cardinal directions. Note: the shape of your plot, what structures surround you, which direction morning light enters, and whether vegetation is thriving or struggling. If you are considering a new property: do the soil test and water test before signing. These 10 minutes can prevent years of energetic struggle.",
        mantra: "ॐ पृथ्व्यै नमः",
        secret: "The Siddhas taught that certain plots are 'Kshetra' — sacred fields — where the earth's pranic charge is naturally high. These spots were often where temples were later built. Signs of a Kshetra: ant hills specifically built in a conical shape (termites follow earth's magnetic lines to do this), spontaneous growth of specific plants (tulsi, bilva, ashoka), and a feeling of effortless calm that arrives the moment you step onto the land. If you find such a place — secure it at any cost.",
      },
      {
        id: "b4",
        title: "Vastu vs Modern Architecture — The Missing Dimension",
        duration: "18 min",
        tier: "free",
        glyph: "स्था",
        overview: "Understanding why modern buildings make people unwell — and what the Siddhas built instead.",
        sections: [
          {
            heading: "What Architecture Measures vs What Vastu Measures",
            body: "Modern architecture measures: structural load capacity, fire safety, square footage, natural light (lumens), acoustic decibels, HVAC airflow (cubic metres per minute), energy efficiency (kWh/year).\n\nVastu measures: pranic flow direction, electromagnetic field coherence, solar angle and photonic quality by time of day, magnetic resonance of materials, acoustic harmonics (not just decibels), cosmic axis alignment, and elemental balance across the spatial grid.\n\nNeither system is complete without the other. The ideal building satisfies both. The tragedy is that most modern architecture doesn't even know the second list exists.",
          },
          {
            heading: "The Angula Measurement System",
            body: "Classical Vastu uses the Angula (अंगुल) — the width of a finger — as its base unit of measurement. This is not arbitrary. The human body is the measuring instrument of cosmic harmony.\n\n8 Angulas = 1 Vitasti (hand-span)\n12 Angulas = 1 Vitasta (forearm)\n24 Angulas = 1 Hasta (cubit)\n96 Angulas = 1 Danda (rod — approx. 1.8m)\n\nWhy does this matter? Because Vastu dimensions calculated in Angulas create resonant harmonic relationships between the human body's proportions and the built space. This is related to Le Corbusier's Modulor system and Fibonacci-based architecture — except the Siddhas codified it 3,000 years earlier.\n\nThe Ayadi Shadvarga formula calculates which specific dimensions are auspicious for a specific person based on their birth star. This personalises the entire building to the owner's frequency — no two Vastu homes need the same dimensions.",
          },
          {
            heading: "Materials and Their Pranic Signatures",
            body: "Every building material carries a vibratory signature that either amplifies or dampens the pranic field of a space:\n\nAmplifiers:\n• Natural stone (granite, sandstone, marble): Holds and radiates earth prana. Heavy, stable, grounding.\n• Teak and rosewood: Living tree memory. Resonates at 432 Hz range.\n• Copper: Prana superconductor. Used for water vessels, roof apex, threshold strips.\n• Terracotta tiles: Earth element pure. Superior to ceramic or porcelain in any Vastu assessment.\n• Lime plaster: Breathes, self-repairs microcracks, alkaline — actively resists mould and low-frequency accumulation.\n\nDampeners:\n• Synthetic carpets: Block earth connection, accumulate static charge.\n• Aluminium structural elements: Disrupt magnetic coherence.\n• Large glass facades (uncurtained at night): Create Vastu Vedha — the interior becomes visually 'punctured' by the external night environment.\n• Chipboard and MDF: Low-resonance, outgasses formaldehyde — doubly problematic (chemically and energetically).",
          },
        ],
        practice: "Do a material audit of your home. Walk through each room and note the primary flooring material, wall surface, and what your furniture is made of. Identify: which rooms have the highest proportion of natural materials? Which have the most synthetic? Notice if there's a correlation between which rooms feel good and which feel flat or heavy.",
        mantra: "ॐ स्थापत्याय विद्महे",
        secret: "The Tamil Siddha texts (Agastya Muni's Vastu Sutras in particular) describe a building practice called 'Pranava Sthapatya' — where the architect enters a state of deep meditation before drawing a single line of the plan. In this state, the design emerges from consciousness itself rather than from calculation. The greatest temples of South India — Chidambaram, Madurai, Thanjavur — were built through this process. The result is structures that are still generating healing fields after 1,000 years.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 2 — PANCHA BHUTA
  // ══════════════════════════════════════════════════════════
  {
    id: "pancha",
    level: 2,
    title: "Pancha Bhuta Activation",
    subtitle: "Five Elements Mastery",
    tier: "free",
    icon: "🔥",
    color: "#FB923C",
    tagline: "Your home is a living elemental being. Learn to read and balance its five bodies.",
    lessons: [
      {
        id: "p1",
        title: "Prithvi — Earth Element Mastery",
        duration: "25 min",
        tier: "free",
        glyph: "पृ",
        overview: "Prithvi (Earth) is the foundation of all Vastu. It governs stability, weight, the skeletal system, and the home's capacity to hold blessings.",
        sections: [
          {
            heading: "Where Earth Lives in Your Home",
            body: "Earth element concentrates in the SW and S zones of any structure. It is also present wherever there is weight, density, and groundedness — stone floors, heavy furniture, structural columns.\n\nThe SW direction is governed by Nairuti — a fierce, powerful deity who is the custodian of boundaries and ancestral power. The SW must be the heaviest, most solid zone of any home. This is why the master bedroom belongs here: the heaviest energy demands a heavy anchor.\n\nSymptoms of Earth Imbalance:\n• Too much Earth (SW overloaded but NE also heavy): Stagnation, inertia, resistance to change, weight gain\n• Too little Earth (SW light, corner missing): Instability, anxiety, financial groundlessness, family power struggles",
          },
          {
            heading: "Activating Prithvi — Practical Methods",
            body: "1. Flooring: Natural stone or terracotta in SW amplifies Earth. Avoid synthetic carpets in SW — they block earth connection entirely.\n\n2. Furniture: Place your heaviest furniture (bookshelves, wardrobes, solid wood beds) in SW rooms. The Siddhas recommended the master bed to be 'immovable' — heavy enough that it takes 4 people to move.\n\n3. Colour: Earth tones (ochre, sienna, terracotta, chocolate brown) in SW rooms and walls directly activate Prithvi prana.\n\n4. Crystal: Yellow jasper, tiger's eye, or large chunks of raw hematite in the SW corner anchor the Earth field.\n\n5. The weight itself matters: A Siddha teacher once said — 'The SW room should feel like it would fall through the floor before any other room would.' That is the correct proportion of Earth energy.",
          },
          {
            heading: "Earth and the Human Body",
            body: "In Ayurveda and Siddha medicine, the Earth element governs: bones, teeth, nails, hair, skin, muscle tissue, and the sense of smell. Residents of homes with weak SW zones often report: lower back problems (the Prithvi zone of the spine), brittle nails and hair loss, low bone density (in elders), and a chronic sense of 'not being grounded' or 'not feeling at home.'\n\nThis is not coincidence — it is the Pancha Kosha system in action. The Annamaya Kosha (physical body) is composed of earth and water, and it is directly influenced by the Earth element quality of the primary sleeping space.",
          },
        ],
        practice: "Sit on the floor in the SW corner of your bedroom. Place both palms flat on the floor. Close your eyes and breathe slowly for 3 minutes. Notice: is there a sense of solidity, rootedness? Or does the energy feel thin, scattered? This is a direct reading of your SW Earth field. If it feels weak, begin by adding one heavy, natural object to this corner.",
        mantra: "ॐ पृथ्व्यै स्वाहा",
        secret: "Advanced Siddha Vastu texts describe 'Bhu Prana' — the specific prana emitted by undisturbed, ancient soil. Modern construction strips this by laying concrete foundations that cut off the building from the earth's pranic body. Homes built on bare earth (as in traditional Tamil Nadu) literally breathe through the floor. The remedy in modern buildings: a thick layer of natural, unsealed stone on SW floors, placed directly on the concrete, allows partial reconnection with the earth field below.",
      },
      {
        id: "p2",
        title: "Jala — Water Element & Pranic Memory",
        duration: "25 min",
        tier: "free",
        glyph: "ज",
        overview: "Water carries memory — proven by modern science and known by Siddhas for millennia. Every water body in your home is programming the field of your entire dwelling.",
        sections: [
          {
            heading: "Water Zones and Their Power",
            body: "Jala (Water) element concentrates in the North and Northeast zones. These are the zones of incoming energy — North for material abundance (Kubera), NE for cosmic intelligence (Brahma/Shiva). Water naturally flows, receives, and carries — which is why placing water features here amplifies the incoming flow of blessings.\n\nWater in wrong zones:\n• SE: Water extinguishes Agni — digestive disorders, financial fires that get put out\n• SW: Water weakens Earth stability — relationships become fluid and unstable\n• S: Water in the South is the most problematic placement — it activates Yama's zone and creates health crises\n\nThe Underground Water Rule: If underground water flows beneath your home in the correct direction (North to South within the plot), it amplifies the Kubera Nadi. If it flows against the Vastu grid, it creates 'Jala Dosha' — the single most common hidden cause of chronic family illness.",
          },
          {
            heading: "Masaru Emoto and the Siddha Teaching",
            body: "The Japanese researcher Masaru Emoto demonstrated that water forms different crystal structures depending on the words, music, and intentions directed at it. The Siddhas knew this 3,000 years ago — they called it 'Jalashabda Smriti' — the sound-memory of water.\n\nEvery Siddha Vastu home had a sacred water vessel — typically a copper Kalash (pot) — placed in the NE corner. Every morning, the householder would:\n1. Fill it with fresh water\n2. Hold it with both hands and chant the water mantra 21 times\n3. Place a tulsi leaf on the surface\n4. Leave it undisturbed until sunset\n\nThis water was then used for cooking and offered to the deities. The crystalline memory programmed into it carried into every meal and every prayer.\n\nIn your home: even a simple copper cup of fresh water, changed daily, placed in the NE corner with intention, begins to program the water element of your space.",
          },
          {
            heading: "Water Features — The Science of Placement",
            body: "Indoor water features (fountains, aquariums, bowls) are among the most powerful Vastu tools available. But their placement is critical:\n\nIdeal: North wall or NE corner. The water feature should flow toward the interior of the home (not away). If it has a pump, the outlet should face North or East.\n\nAquarium in North: Extremely powerful Kubera activation. The specific fish type matters — goldfish (gold representing Kubera's treasure), arowana (dragon energy — wealth), or any living, moving, brightly coloured fish. Minimum 9 fish.\n\nSizing: The water feature should be proportional to the room. A massive waterfall in a small apartment creates elemental overwhelm. A tiny bowl in a large open space has minimal effect. The Ayadi formula can calculate the exact auspicious volume.\n\nMaintenance: A dirty, stagnant, or broken water feature is worse than no water feature. Dead water carries Mrtyu Jala (death water) energy. Change water every Monday (Moon's day — water's planetary ruler).",
          },
        ],
        practice: "Place a copper or clay vessel filled with clean water in your NE corner today. Hold it in both hands, close your eyes, and set a clear intention — for your home to be a vessel of abundance and clarity. Notice over the next 7 days whether anything shifts in the quality of light or feeling in your NE zone.",
        mantra: "ॐ वरुणाय नमः",
        secret: "The most powerful water remedy in all of Siddha Vastu is the 'Pancha Tirtha Kalash' — a copper pot containing water from 5 sacred rivers (or failing that, 5 different natural springs). The combined water carries the pranic signature of 5 geographic power centres, creating a miniature multi-pilgrimage site in your NE corner. The Siddhas taught that the home of a householder who maintains this Kalash daily never falls into poverty — the five sacred rivers literally open five channels of grace.",
      },
      {
        id: "p3",
        title: "Agni — Fire & the Transformation Zone",
        duration: "25 min",
        tier: "free",
        glyph: "अ",
        overview: "Agni is not merely heat — it is the principle of transformation itself. How your home handles fire energy determines the health, digestion, and relational harmony of all who live within it.",
        sections: [
          {
            heading: "The Southeast — Agni's Domain",
            body: "The SE corner is sacred to Agni Deva — the fire deity, celestial priest, and transformer. Ruled by Venus, this zone governs: physical health and digestion, creativity and sensuality, financial metabolism (how quickly money flows through your hands), and the quality of relationships.\n\nThe kitchen must be placed in SE for this reason: every meal cooked in the Agni zone is cooked with the deity's blessing. The cook faces East (toward the rising sun) or South (toward the fire's natural draw). This is not religious instruction — it is physics: the SE kitchen receives the maximum morning solar energy, which carries the highest photon coherence of any time of day.",
          },
          {
            heading: "Agni Balance — Signs and Symptoms",
            body: "Too much Agni:\n• Arguments that escalate rapidly and without clear cause\n• Chronic skin conditions (Pitta in Ayurveda)\n• Financial overspending — money burns through\n• Hyperactivity, inability to rest\n\nToo little Agni:\n• Depression, lack of drive and motivation\n• Poor digestion — the internal Agni mirrors the external\n• Creative blocks — the fire of inspiration is weak\n• Financial stagnation — money comes but does not transform into assets\n\nSigns of balanced Agni in a home:\n• Meals are prepared and eaten with ease and joy\n• Disagreements resolve quickly without lingering resentment\n• Creative projects move from idea to completion\n• Physical energy is consistently available throughout the day",
          },
          {
            heading: "Dhuni — The Siddha Sacred Fire Practice",
            body: "The Siddhas maintained a Dhuni — a sacred fire — in their homes, ashrams, and meditation caves. This was not merely for warmth. The Dhuni served as:\n\n1. Pranic Anchor: A continuously maintained fire (even a candle) activates the Agni field of the entire space\n2. Space Purification: Burning specific woods and herbs (camphor, sandalwood, dried herbs) transmutes stagnant energy at a molecular level — proven by studies on camphor diffusion reducing airborne microbes by 94%\n3. Consciousness Interface: Agni is described as the 'tongue of the gods' — the medium through which cosmic intelligence enters the material world\n\nModern Dhuni Practice:\n• Light a ghee lamp in the SE kitchen every morning before cooking\n• Burn a piece of camphor after cooking — it neutralises cooking odours and resets the Agni field\n• On full moon and new moon: light a large ghee lamp and sit with it for 21 minutes in the SE zone",
          },
        ],
        practice: "For 7 days, light a single ghee lamp in your kitchen before cooking any meal. If you don't cook, light it at the start of each day. Notice: does your appetite change? Does the quality of your meals feel different? Do conflicts in the home increase or decrease? Journal the difference. Agni responds rapidly — you will notice changes within 3 days.",
        mantra: "ॐ अग्नये स्वाहा",
        secret: "The highest Siddha Agni secret: there are specific woods that, when burned, open different cosmic gateways. Sandalwood activates Surya (sun consciousness). Bilva wood opens Shiva's grace. Neem purifies negative astral entities. Mango wood accelerates wishes. The Siddhas mapped these correspondences precisely. In a modern home, even burning the essential oil of these woods (diffused at low heat — not synthetic) carries a diluted but real version of this activation.",
      },
      {
        id: "p4",
        title: "Vayu & Akasha — Air and Space Mastery",
        duration: "28 min",
        tier: "free",
        glyph: "व",
        overview: "Vayu (Air) and Akasha (Space) are the two most subtle elements — and the most misunderstood in modern Vastu. Together they determine the quality of consciousness that inhabits your home.",
        sections: [
          {
            heading: "Vayu — The Breath of the Home",
            body: "Air governs the NW zone and is ruled by the Moon. It is the element of movement, communication, support, and breath. Just as Pranayama is the science of breath for the body, Vastu Vayu is the science of breath for the building.\n\nA home that breathes correctly:\n• Has cross-ventilation that creates a figure-8 air flow pattern (N-to-S and E-to-W simultaneously)\n• Windows that open on at least 2 sides of each major room\n• No dead-air corners (corners that never receive air movement)\n• Air changes every 2-4 hours naturally without mechanical assistance\n\nWhen Vayu is blocked (poor ventilation, sealed windows, heavy curtains):\n• Prana becomes stagnant\n• Mental clarity decreases for all residents\n• Respiratory issues increase over time\n• The home literally holds stale emotions — arguments replay, unresolved feelings linger",
          },
          {
            heading: "Nadi Shodhana of the Home",
            body: "The Siddhas mapped the home's energy channels exactly as they mapped the body's Nadis. Just as the body has 72,000 Nadis, the home has energy pathways that correspond to hallways, doorways, windows, and staircases.\n\nThe main entrance is the Sushumna Nadi — the central channel. It must be clear, unobstructed, and ideally lit. A shoe rack directly facing the entrance blocks the Sushumna immediately.\n\nWindows are the Ida (left/feminine/moon) and Pingala (right/masculine/sun) nadis. Larger windows on the East and North = solar and lunar energies flowing freely. Blocked or small windows here = the home's breathing nadis are constricted.\n\nHallways are nerve channels. Narrow, dark hallways create energy constriction. Wide, bright hallways allow prana to flow freely throughout the building.",
          },
          {
            heading: "Akasha — The Space Within Space",
            body: "Akasha is the most refined element — pure space, pure consciousness, pure potential. It corresponds to the sense of hearing, the throat chakra, and the capacity for silence.\n\nThe Brahma Sthana (centre of home) is where Akasha concentrates. This is why it must be open — Akasha cannot be contained. When you place furniture, walls, or toilets at the Brahma Sthana, you compress consciousness itself.\n\nActivating Akasha:\n• The most powerful Akasha activator is silence. 20 minutes of complete silence at the Brahma Sthana each morning resets the entire home's field\n• Open-to-sky (courtyard) in the centre of a home is the ultimate Akasha activation — the ancient Tamil Tamil courtyard home (Nattukottai Chettiar style) was built around this principle\n• In modern apartments: a clear skylight, a large indoor plant with an open canopy, or even a round mirror (Akasha's geometric symbol) at the Brahma Sthana all partially activate this zone",
          },
        ],
        practice: "Open every window in your home simultaneously for exactly 20 minutes today. Walk slowly through each room as the air moves. Notice: which rooms feel most alive with the air moving through? Which feel most blocked or still? The rooms that feel most alive are your current pranic centres. The still rooms are your Vastu priorities for improvement.",
        mantra: "ॐ वायवे नमः · ॐ आकाशाय नमः",
        secret: "The Siddhas taught a secret practice called 'Vayu Dharana' — air holding. Once mastered in pranayama, the practitioner could 'hold' clean prana in a room through intention, creating a charged atmosphere that would persist for days. Modern practitioners can approximate this: after any group meditation or sacred ceremony in your home, immediately close all windows and doors for 1 hour. This 'seals' the elevated pranic atmosphere generated by the practice into the space's crystalline memory.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 3 — ASHTADISHA
  // ══════════════════════════════════════════════════════════
  {
    id: "ashtadisha",
    level: 3,
    title: "Ashtadisha Vidya",
    subtitle: "8 Directions — Deep Intelligence",
    tier: "prana",
    icon: "🧭",
    color: "#67E8F9",
    tagline: "Each direction is a portal. Learn the deity, element, and cosmic function of every axis.",
    lessons: [
      {
        id: "a1",
        title: "North & Northeast — Kubera and Ishanya",
        duration: "38 min",
        tier: "prana",
        glyph: "उ",
        overview: "The North-to-Northeast axis is the single most important directional axis in all of Vastu. Mastering these two zones unlocks both material abundance and cosmic intelligence.",
        sections: [
          {
            heading: "North — Kubera's Wealth Meridian",
            body: "North is governed by Kubera — the treasurer of the gods — and ruled by Mercury. It is the direction of incoming energy, both financial and informational. Mercury governs communication, commerce, intelligence, and quick movement — all qualities that, when strong in the North zone, create a thriving abundance field.\n\nThe Earth's magnetic field flows from South to North. This means the North face of any building is magnetically 'receiving' — it is the antenna direction. Information, opportunities, and abundance literally arrive from the North.\n\nKey North zone principles:\n• Must be lighter (less weight) than South zone — this is the cardinal rule\n• Ideal for water features — activates the Kubera Nadi\n• Should have the most windows and openings on the North wall\n• Green plants and mercury-coloured (silver, metallic green) accents amplify the field\n• Cash boxes, lockers, and financial documents kept in the North or facing North",
          },
          {
            heading: "Northeast — The Ishanya Portal",
            body: "NE is governed by Ishanya — a form of Shiva — and is where water (Jala) and space (Akasha) elements merge. Jupiter rules this direction, bringing wisdom, grace, and expansion. The NE is universally recognised as the most sacred direction in all Vastu systems.\n\nWhy NE is supreme:\n1. It receives the first light of sunrise — the most energetically charged photons of the day\n2. It is the convergence of the two most ascending directions (N-wealth and E-health)\n3. The Earth's EM field creates a natural vortex at the NE — measurable with sensitive equipment\n4. Spiritually, NE is the direction of Guru Parampara — all true teachers faced NE when transmitting\n\nAbsolute prohibitions for NE:\n• Toilet or bathroom (most common and devastating Dosha in modern homes)\n• Bedroom (creates spiritual confusion and recurring bad luck)\n• Kitchen (water extinguishes Agni and Agni pollutes the NE field)\n• Any heavy storage\n• Underground water tanks or septic systems",
          },
          {
            heading: "The Kubera Nadi Activation Protocol",
            body: "This is a complete activation sequence for the North-NE wealth axis:\n\nDay 1 — Clear: Remove all heavy, unnecessary items from the North and NE zones. Clean these areas thoroughly with salt water (one tablespoon sea salt per litre).\n\nDay 2 — Activate water: Place a copper Kalash with fresh water and a piece of turmeric root in the NE corner. Place a small bowl of uncooked green lentils (Mercury's grain) in the North zone.\n\nDay 3 — Energise: Place a Kubera Yantra on the North wall or inside your money storage area. Light a ghee lamp in the NE corner at sunrise.\n\nDay 7 — Anchor: Add a living green plant (money plant or jade plant) in the North. The plant's life force creates an ongoing pranic antenna for Kubera's energy.\n\nMaintain: Replace the Kalash water every Monday. Change the lentils every month. Keep the ghee lamp lit for 21 minutes every morning for 40 days to lock in the activation.",
          },
        ],
        practice: "Stand facing North in your home today. Close your eyes. Breathe 7 times slowly. Notice the quality of the energy. Now move to your NE corner and repeat. Most people report a distinctly different quality between these two zones — NE often feels lighter, more spacious, more elevated. This is the Ishanya field. Spend 10 minutes here in meditation daily for one week and observe what changes in your life.",
        mantra: "ॐ कुबेराय नमः · ॐ ईशानाय नमः",
        secret: "The highest secret of the NE portal: at the exact astronomical moment of sunrise on the morning of the spring equinox, the NE corner of any building becomes a temporary Tirtha — a crossing point between dimensions. The Siddhas would sit in deep meditation in the NE corner at this precise moment for exactly 48 minutes (the time it takes the sun to fully clear the horizon and stabilise its photon output). They described entering states in those 48 minutes that would take weeks of normal practice to reach. The spring equinox NE sunrise meditation is the most powerful location-time combination in all of Vastu.",
      },
      {
        id: "a2",
        title: "East, Southeast & South — Surya, Agni, Yama",
        duration: "35 min",
        tier: "prana",
        glyph: "पू",
        overview: "The East-to-South axis governs health, transformation, and the law of karma. These three directions require precision — mistakes here create some of the most persistent Vastu Doshas.",
        sections: [
          {
            heading: "East — Indra's Health Gateway",
            body: "East is governed by Indra — king of the gods — and ruled by the Sun. It is the direction of birth, renewal, and daily resurrection. Every sunrise is a cosmic re-creation, and the East wall of your home is the interface through which this renewal enters.\n\nEast zone principles:\n• Main entrance ideally faces East (or North) — allows sunrise prana to enter daily\n• Living room, dining room, or veranda ideal in East zone\n• Windows must be large and unobstructed — morning light is non-negotiable\n• The Tulsi plant placed at the East entrance activates Surya prana and purifies incoming energy\n• No tall trees or structures directly blocking the East — this is one of the most common and most serious Vastu Vedhas",
          },
          {
            heading: "Southeast — Agni's Transformation Zone",
            body: "SE is Agni's territory — ruled by Venus. The convergence of Fire and the planet of beauty, creativity, and relationship creates a uniquely powerful zone.\n\nKitchen in SE: The gold standard placement. The cook faces East. The gas/stove is on the SE wall. The sink is never immediately adjacent to the stove (water and fire must maintain distance — minimum 60cm separation).\n\nWhen the kitchen cannot be in SE:\n• Create an 'Agni Corner' in the SE of the available kitchen: place a small red candle here permanently\n• Use red and orange accent colours in the SE of the kitchen\n• Place a small Agni Yantra or image of Agni on the SE wall\n• Never place a mirror or reflective surface in the SE — it bounces and confuses the fire energy",
          },
          {
            heading: "South — Yama's Law and Ancestor Blessings",
            body: "South is the most misunderstood direction in modern Vastu. Western practitioners often teach 'never use South' — this is an oversimplification that misses the profound power of this direction.\n\nSouth is governed by Yama — lord of dharma and death — and ruled by Mars. Yama is not merely the god of death — he is the keeper of cosmic law, the accountant of karma, and the keeper of ancestral records. The South is where the blessings of your ancestors arrive.\n\nCorrect South zone use:\n• Store room, heavy machinery, or closed storage — ideal\n• Tall walls, fences, or structures on the South boundary = highly auspicious (creates protection)\n• Main door should NOT face South — this is the one absolute prohibition for most house types\n• Beds with head pointing South = excellent for deep sleep and longevity (you align with Yama's magnetic axis, which is calming, not dangerous)\n• Pitr Puja (ancestor offerings) done facing South — this is why: you are directing your gratitude exactly where ancestral consciousness resides",
          },
        ],
        practice: "On the next full moon, at any time during the day, face South. Close your eyes. Mentally invoke the presence of your ancestors — parents, grandparents, great-grandparents — as far back as you can imagine. Offer a glass of water by pouring it slowly toward the South (outdoors). This is a simplified Pitr Tarpana. The effect on your home's Southern field is immediate and measurable — many people report a feeling of 'heaviness lifting' in the South zone of their home after this practice.",
        mantra: "ॐ इन्द्राय नमः · ॐ अग्नये नमः · ॐ यमाय नमः",
        secret: "South-facing homes are not categorically inauspicious — this is a widespread misconception. The classical Vastu texts state that a South-facing home is auspicious for specific Jyotish Lagnas and specific professions (notably lawyers, judges, military officers, and surgeons — all Yama/Mars professions). What matters is the specific pada (Vastu Purusha square) on which the South door falls. Padas 1, 2, and 3 from the SW corner are inauspicious; padas 4 and 5 (the centre two) are auspicious for a South entrance. This is the complete teaching that most Vastu consultants don't know.",
      },
      {
        id: "a3",
        title: "Southwest, West & Northwest — Nairuti, Varuna, Vayu",
        duration: "32 min",
        tier: "prana",
        glyph: "न",
        overview: "The West-to-Southwest axis anchors the home's power, gains, and support systems. These three directions complete the compass mandala.",
        sections: [
          {
            heading: "Southwest — The Raja Gaddhi",
            body: "SW is governed by Nairuti and ruled by Rahu. It is the Earth element zone — heavy, stable, and powerfully anchored. The SW is called 'Raja Gaddhi' — the throne of the house lord.\n\nAbsolute rules for SW:\n• Must be the heaviest zone — most elevated floor level if possible (or at least same level as other zones)\n• Master bedroom belongs here exclusively — the head of household's energy anchors the entire home from this point\n• No openings (windows, doors, ventilation) in the extreme SW corner — energy must be sealed here\n• Storage of valuable items: safe, important documents, precious metals\n• The SW bedroom occupant commands natural authority in the home — whoever sleeps here holds power",
          },
          {
            heading: "West — Varuna's Harvest Zone",
            body: "West is governed by Varuna (water deity of karma and cosmic law) and ruled by Saturn. It is the direction of results — the harvest of all actions. The setting sun deposits the accumulated prana of the entire day into the West zone each evening.\n\nWest zone principles:\n• Children's rooms and study spaces are ideal here — Saturn's disciplined energy enhances focus\n• Dining room in the West: meals become rituals of receiving the day's harvest\n• Blue and grey tones activate Varuna's field\n• Metal objects and circular shapes amplify the West energy\n• No water features in the West (unless combined with careful Jyotish calculation)",
          },
          {
            heading: "Northwest — The Support Network Activator",
            body: "NW is governed by Vayu (air/moon) and ruled by the Moon. It is the zone of movement, guests, support systems, and the external support network — clients, helpers, employees, community.\n\nNW applications:\n• Guest bedroom in NW: guests arrive quickly, stay comfortably, and leave promptly — the Vayu energy prevents overstaying\n• Marketing and outreach activities facing NW: for entrepreneurs, this means positioning your desk or phone calls to face NW for customer-acquisition activities\n• Wind chimes in NW: their sound activates the Vayu field — use metal chimes (5 rods for the 5 elements)\n• White and cream tones activate NW correctly\n• The NW zone governs how quickly things move — stagnant NW = slow customers, sluggish business, delayed decisions",
          },
        ],
        practice: "Identify the SW room of your home. If you are the head of household and not sleeping here, consider: who is sleeping in this room? That person may be inadvertently holding the household authority — even if they are a child. For 30 days, make one conscious effort to assert your authority from the SW — even if it is just meditating in the SW corner for 10 minutes before making important decisions.",
        mantra: "ॐ नैऋतये नमः · ॐ वरुणाय नमः · ॐ वायवे नमः",
        secret: "The Siddha texts describe a rarely-taught practice called 'Disha Dharana' — direction absorption. The practitioner spends 8 consecutive days, each day meditating for 48 minutes facing one of the 8 directions. By the end of the 8 days, they have established a personal resonance with each directional deity. The result: an intuitive, embodied ability to sense directional energy imbalances in any space they enter. This is how Siddha Vastu masters diagnosed homes — not from a floor plan, but from their own energetic attunement.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 4 — ROOMS
  // ══════════════════════════════════════════════════════════
  {
    id: "rooms",
    level: 4,
    title: "Room-by-Room Alchemy",
    subtitle: "Transforming Every Space",
    tier: "prana",
    icon: "🏠",
    color: "#34D399",
    tagline: "Every room is a chakra of the home. Align them and the entire dwelling awakens.",
    lessons: [
      {
        id: "r1",
        title: "The Sacred Kitchen — Agni Temple",
        duration: "45 min",
        tier: "prana",
        glyph: "अन्न",
        overview: "The kitchen is not a utility room — it is the most important room in the home. Every meal is a yajna (sacred fire ritual). Every cook is a priest of Agni.",
        sections: [
          {
            heading: "The Complete Kitchen Vastu Blueprint",
            body: "Ideal placement: SE zone of the home. If unavailable, the NW kitchen is second best (acceptable with remedies). Never NE (water fights fire), never SW (drains Earth energy).\n\nCook's direction: Always East or South. The cook draws solar (East) or Yama's disciplinary (South) energy through their back as they cook — both appropriate for the transformation of food.\n\nStove placement: On the SE wall or as close to SE as possible. Never on the North wall (opposes Kubera) or directly facing the main entrance (fire energy hits the incoming prana head-on).\n\nSink placement: North or NE of the stove, never adjacent to it. Water and fire in direct contact create the Agni-Jala Dosha — the most common cause of kitchen conflict.\n\nRefrigerator: SW of the kitchen — Earth element stores and contains.\n\nKitchen door: Should not face the toilet door. This is extremely common in modern apartments and creates a direct pollution of the food preparation field.",
          },
          {
            heading: "The Morning Kitchen Activation Sequence",
            body: "The Siddhas taught a specific morning sequence before cooking:\n\n1. Light a ghee lamp in the SE corner of the kitchen (10 seconds)\n2. Wipe the stove with a cloth dampened with salt water (removes previous cooking energy — 30 seconds)\n3. Place a tulsi leaf near the cooking area (activates Vishnu's protective field over food — 10 seconds)\n4. Stand facing East, take 3 deep breaths, and set the intention: 'This food will nourish and heal all who eat it' (30 seconds)\n\nTotal time: Under 2 minutes. Effect: Every meal cooked after this becomes Sattvic prasad — food that nourishes not just the body but the Pranamaya Kosha (energy body) and Manomaya Kosha (mental body).\n\nThe Siddha master Thirumoolar taught that a household where the cook performs this ritual consistently for 40 days develops an atmosphere that he called 'Annapurna Sthana' — a place of infinite nourishment.",
          },
          {
            heading: "Colours, Materials, and Kitchen Alchemy",
            body: "Colours for SE kitchen: Red, orange, copper, terracotta — fire amplifiers. Avoid blue, black, or dark green — these suppress Agni.\n\nCountertop materials: Granite (excellent — earth amplifies fire when in correct zone), marble (acceptable — cooler, slightly Pitta-suppressing), quartz composite (neutral), stainless steel (amplifies — metallic Agni), synthetic laminate (avoid — deadens the food preparation field).\n\nCopper vessels: The Siddhas cooked in copper. This is now validated by antimicrobial research — copper kills 99.9% of bacteria within 2 hours. Energetically, copper is Agni's metal — it amplifies the transformation principle.\n\nSalt: Keep an open bowl of Himalayan pink salt in the kitchen. Salt absorbs negative energy from the space. Replace monthly.\n\nPlants: Avoid plants in the kitchen — they are water-element objects in a fire-element zone. The one exception is a tiny tulsi plant on the East windowsill — its Sattvic presence overrides the elemental conflict.",
          },
        ],
        practice: "Redesign your kitchen on paper using today's principles. Note: where is your stove? Which direction do you face when cooking? Where is your sink relative to your stove? What colour are your kitchen walls? For each misalignment you find, note one remedy you can implement this week without renovation. Most kitchens can be improved 60% without moving a single fixture.",
        mantra: "ॐ अन्नपूर्णायै नमः",
        secret: "The highest kitchen secret: the quality of food is determined more by the consciousness of the cook than by the quality of ingredients. The Siddhas called this 'Annamaya Samskara' — the impressioning of the food body. A cook who is angry, fearful, or distracted programs those frequencies into every molecule of the meal. Conversely, a cook who maintains a mantra practice, emotional stability, and gratitude creates food that has been documented by traditional practitioners to measurably improve the mood and health of those who eat it. Vastu creates the ideal environment for the second type of cook to emerge.",
      },
      {
        id: "r2",
        title: "The Bedroom — Consciousness Restoration Chamber",
        duration: "50 min",
        tier: "prana",
        glyph: "शय",
        overview: "We spend one-third of our lives in the bedroom. The quality of consciousness in this space determines the quality of cellular repair, dream intelligence, and morning energy for the remaining two-thirds.",
        sections: [
          {
            heading: "The Science of Sleep Direction",
            body: "Head pointing South: This is the optimal direction for deep sleep and longevity. You align your body's magnetic polarity (head = north pole of the body) with the Earth's south magnetic field — creating a state of magnetic coherence. Measurable effects: deeper slow-wave sleep, increased melatonin production, reduced morning cortisol spikes.\n\nHead pointing East: Second best. Aligns with sunrise energy — promotes spiritual insight, vivid and instructive dreams, and morning clarity. Ideal for students, meditators, and creative professionals.\n\nHead pointing West: Acceptable but produces mentally active, sometimes disturbing dreams. The setting-sun energy creates a subconscious processing mode that some find agitating.\n\nHead pointing North: The only absolute prohibition. The human body is a biological magnet — the iron in our blood is magnetically sensitive. Pointing the head North creates a repulsive magnetic relationship with Earth's North pole. Studies in neuroscience and traditional medicine consistently link North-sleeping with poor sleep quality, increased stress hormones, and over time, cognitive decline.",
          },
          {
            heading: "Bed Placement — The Complete Protocol",
            body: "The bed should not:\n• Share a wall with a toilet on the other side\n• Be placed directly below a beam (creates oppressive energy — especially dangerous if the beam runs lengthwise over the bed)\n• Be placed in the centre of the room (floating energy — no earth anchor)\n• Be placed with the foot of the bed facing the door (called the 'coffin position' in multiple traditions — the body's survival mechanism activates during sleep, disrupting rest)\n• Be positioned against the same wall as the main door\n\nThe bed should:\n• Have a solid wall behind the headboard (earth support for the head)\n• Be placed in the SW quadrant of the bedroom (SW of the room = Prithvi anchor)\n• Have space on both sides (not pushed against a wall — both partners need access)\n• Be made of natural materials — solid wood, not hollow or metal frames",
          },
          {
            heading: "Colours, Technology, and Bedroom Field",
            body: "Colours: Earthen pinks, warm whites, terracotta, deep blue, forest green. Avoid red (activates Agni-aggression), bright orange (hyperactive), or stark white (cold, clinical — activates Mercury's hypermental energy during sleep hours).\n\nMirrors: The most contentious bedroom Vastu element. The traditional rule: no mirror visible from the bed, especially not facing the bed directly. The reason: mirrors create a doubled energy field that disturbs sleep. If you have a mirrored wardrobe facing the bed, use a curtain or fabric panel to cover it at night.\n\nTechnology: Every electronic device emits an EMF field that disrupts melatonin production and creates biologically measurable sleep disturbance. Minimum 1 metre between any electronic device and the head. Ideally: phone on aeroplane mode or outside the bedroom. The bedroom is a Tamasic space during sleep — stillness, darkness, and silence are the Vastu requirements.",
          },
        ],
        practice: "Tonight, before sleeping, remove every electronic device from within 1 metre of your head. Check your head direction. If it's North, rotate 180 degrees. Notice the quality of your sleep and your morning energy. Do this for 7 nights and record the difference. The shift from North-sleeping to South or East-sleeping is one of the fastest-acting Vastu remedies available — many people report transformation within 3 nights.",
        mantra: "ॐ सोमाय नमः",
        secret: "The Siddha masters slept for only 3-4 hours per night without fatigue. The secret: they aligned their bed in the exact SW position, with head South, and before sleeping, performed a 21-breath pranayama that consciously released their awareness from the Manomaya Kosha (mental body). They entered deep Prajna (dreamless sleep) within minutes and recovered the equivalent of 8 hours of ordinary sleep in 4 hours. The Vastu alignment was the container that made this practice possible — the physical space supported the depth of surrender.",
      },
      {
        id: "r3",
        title: "The Puja Room — Quantum Field Stabiliser",
        duration: "55 min",
        tier: "prana",
        glyph: "ॐ",
        overview: "The puja room is not merely religious — it is the electromagnetic anchor of the entire home. When properly established and maintained, it creates a standing pranic wave that heals and protects every room.",
        sections: [
          {
            heading: "Sacred Space Architecture",
            body: "Placement: NE corner of the home is ideal — always. The puja room in NE creates the maximum convergence of spiritual energy (Ishanya's grace) with the incoming cosmic intelligence.\n\nIf NE is occupied: East zone is second best. North is acceptable. Never place a puja room in SW (power-draining), SE (Agni disturbs the deity energy), or South (Yama's influence creates fear-based practice rather than love-based devotion).\n\nSize: The Ayadi formula calculates the exact auspicious dimensions. The minimum is 2m × 2m. The Brahma Sthana (centre) of the puja room should itself be clear — a small raised platform (Pitha) for the deities, not a cluttered altar covering the entire floor.\n\nDoor: The puja room must have a door — this is not for privacy but to contain the pranic field generated during worship. An open puja niche (common in modern homes) generates energy that immediately dissipates. A closed room accumulates it.",
          },
          {
            heading: "Deity Placement and Sacred Geometry",
            body: "Facing direction of deities: The images or murtis must face either East or West. The worshipper then faces either East (very auspicious — both deity and devotee face the rising sun) or West.\n\nNever place deities facing South (toward Yama) or North (toward Kubera — material rather than spiritual energy).\n\nHeights: Deity images must be at eye level when seated. Below eye level = you dominate the deity energy (Tamasic). Above eye level = you are lifted but cannot see clearly (Rajasic). Eye level = direct communion (Sattvic).\n\nSpecific deity directions within the room:\n• Shiva Lingam: Centre or slightly West\n• Ganesha: Left side of altar, facing East\n• Lakshmi: North side of altar\n• Saraswati: East or NE of altar\n• Surya image: East facing\n• Ancestral photos: South wall of puja room — never mixed with deity images on the same wall",
          },
          {
            heading: "Sound Programming — The 40-Day Activation",
            body: "Sound is the most powerful activator of the puja room field. The Siddhas understood that mantras do not merely create psychological states — they generate specific standing wave patterns in the air that physically restructure the electromagnetic field of the space.\n\nThe 40-Day Activation Protocol:\n• Days 1-10: Chant Gayatri Mantra 108 times daily in the puja room at sunrise. This activates the Surya field — the foundational solar intelligence.\n• Days 11-20: Add the Maha Mrityunjaya Mantra 27 times. This creates a healing field.\n• Days 21-30: Add the Sri Suktam recitation once daily. This activates the Lakshmi abundance field.\n• Days 31-40: Add the Guru Stotram. This invites the Guru Parampara's blessing into the space.\n\nAfter 40 days, the puja room has been 'consecrated' through sound — it now radiates a self-sustaining pranic field. Guests entering the home without even seeing the puja room will often comment on the unusual sense of peace in the space.",
          },
        ],
        practice: "If you have a puja space (even a shelf), today place it in or as close to the NE of your home as possible. Light one ghee lamp. Chant OM 21 times facing East. Sit in silence for 5 minutes. This is the seed activation. Repeat daily. The puja room is the only Vastu element that grows stronger with use — unlike physical remedies that maintain, the puja room accumulates.",
        mantra: "ॐ नमः शिवाय · श्रीं महालक्ष्म्यै नमः",
        secret: "The Siddhas described a phenomenon called 'Puja Kshetra Vistara' — the expansion of the sacred field. A puja room maintained with daily sincere practice for 90 continuous days begins to radiate its field beyond the room's physical walls. By day 90, the entire NE quadrant of the home carries the puja room's frequency. By year 1, the entire home is affected. By 3 years, visitors report feeling something special about the property from outside the gate. This is not faith — it is the documented experience of practitioners across traditions.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 5 — ADVANCED ENERGY MAPPING
  // ══════════════════════════════════════════════════════════
  {
    id: "advanced",
    level: 5,
    title: "Advanced Energy Mapping",
    subtitle: "Invisible Forces & Dosha Diagnosis",
    tier: "siddha",
    icon: "⚡",
    color: "#D4AF37",
    tagline: "The most powerful Vastu corrections target forces invisible to the untrained eye.",
    lessons: [
      {
        id: "adv1",
        title: "Geopathic Stress — The Hidden Architect",
        duration: "60 min",
        tier: "siddha",
        glyph: "भू",
        overview: "Beneath every property runs an invisible network of geological forces. Where these forces intersect your sleeping position, they systematically disrupt biology, psychology, and spiritual practice.",
        sections: [
          {
            heading: "Hartmann and Curry Grid Lines",
            body: "German physician Ernst Hartmann identified a global grid of electromagnetic lines that criss-cross the Earth's surface at regular intervals — North-South lines every 2 metres, East-West lines every 2.5 metres. These Hartmann lines are created by the Earth's own electromagnetic field interacting with underground geological structures.\n\nWalter Curry later identified a second grid at 45-degree angles to Hartmann's, with 3-metre spacing. The crossings of these two grids are called 'Curry crossings' — the most geopathically active points.\n\nSleeping above a Hartmann or Curry crossing has been linked in European building biology research with:\n• Disrupted melatonin production (documented)\n• Significantly increased tumour incidence in sleeping positions above crossings (controversial but consistent across multiple studies)\n• Chronic sleep disorders\n• Relationship breakdown (both partners being chronically sleep-deprived increases conflict probability)\n\nThe Siddhas called these lines 'Naga Rekha' — serpent lines — and knew precisely which spots to avoid for sleeping, meditation, and sacred ritual.",
          },
          {
            heading: "Underground Water — The Most Potent Geopathic Force",
            body: "Underground water veins create the strongest geopathic stress of any natural force. The moving water creates a constant alternating electromagnetic field above the vein — like sleeping next to a low-frequency power line, except it runs 24 hours a day for decades.\n\nSymptoms specific to underground water geopathic stress (as opposed to Hartmann/Curry):\n• Animals: Cats seek out water-vein crossings (they are attracted to the energy). Dogs avoid them. If your cat consistently sleeps in one spot — move your bed away from it.\n• Plants: Most plants avoid water-vein crossings. If a particular plant always dies in one spot despite good care, that spot is likely above a vein.\n• Cracks: Walls above underground water veins develop hairline cracks that consistently reappear despite replastering.\n• The Siddha method: Sit quietly in each area of your bedroom floor for 3 minutes. The spot above a water vein will create a distinctly different sensation — sometimes a sense of heaviness, coolness, or unease.",
          },
          {
            heading: "Dowsing — The Siddha Detection Method",
            body: "Traditional Vastu practitioners used 'Vastu Dowsing' — a refined version of the global dowsing practice — to detect geopathic zones. The tools used:\n\nCopper L-rods: Two L-shaped copper rods held loosely in closed fists at waist height. Walk slowly North to South across the space. When crossing a Hartmann line, the rods will cross. When crossing a water vein, the rods will cross strongly and remain crossed for longer.\n\nPendulum: A copper, crystal, or lead pendulum over the floor plan can identify problem zones without physical presence in the space. The pendulum rotates clockwise over positive zones and counter-clockwise (or swings erratically) over geopathically stressed zones.\n\nNote: Dowsing requires practice. The first session is often unreliable. After 7-10 sessions, practitioners typically develop consistent and repeatable results. The Siddha tradition required a 21-day training protocol before a student was considered reliable in dowsing.",
          },
          {
            heading: "Crystal Grid Remedies for Geopathic Stress",
            body: "Once a geopathic zone is identified, a crystal grid can neutralise or redirect its influence:\n\nFor Hartmann/Curry crossings:\n• Place a large piece of black tourmaline directly on the floor above the crossing (or as close as furniture allows)\n• Add a clear quartz point aimed toward the crossing from each of the 4 cardinal directions (creating an X pattern)\n• Place a copper plate between the crystal and the floor\n\nFor underground water veins:\n• Six pieces of shungite (minimum 50g each) placed in a hexagonal pattern around the strongest point of the vein\n• One large obsidian sphere at the centre of the hexagon\n• This grid must be recharged monthly: remove stones, rinse in salt water, leave in morning sunlight for 3 hours, replace\n\nThe most powerful remedy: move the bed. If a geopathic crossing is identified beneath the bed, move the bed even 30-60 cm in any direction. This small physical change often resolves years of sleep problems within 2-3 nights.",
          },
        ],
        practice: "Observe your pets this week. Where does your cat consistently choose to sleep? Where does your dog refuse to sleep? These are your most reliable geopathic stress indicators. Map these spots on your floor plan. If your cat's preferred spot is within 1 metre of your bed — this is a significant finding that warrants investigation.",
        mantra: "ॐ भूमि देव्यै नमः",
        secret: "The Siddha masters had a practice called 'Bhu Samvada' — Earth communication. They would sit in full lotus on bare earth, place both palms on the ground, close their eyes, and ask the Earth directly: 'What runs beneath you here?' In the heightened state of pranic sensitivity developed through years of practice, they reported receiving clear information about underground water, mineral deposits, and geological faults. This was how ancient sacred sites were located — not by random choice, but by direct communion with the Earth consciousness.",
      },
      {
        id: "adv2",
        title: "The 27 Vastu Doshas — Complete Diagnostic System",
        duration: "70 min",
        tier: "siddha",
        glyph: "दो",
        overview: "Classical Vastu identifies 27 specific energetic defects. A certified Vastu practitioner can diagnose any home against this complete list and prescribe targeted remedies.",
        sections: [
          {
            heading: "Primary Doshas 1-9: Structural",
            body: "1. Vastu Vedha (Piercing): A sharp corner, tower, or pointed structure directly facing the main entrance from outside. Creates a continuous energetic arrow aimed at the home's receiving point.\n\n2. Dwar Dosha (Door Defect): Main door facing inauspicious direction, poorly placed, or of wrong dimensions. The entrance is the home's primary pranic interface — any defect here affects the entire system.\n\n3. Shula Dosha (Spear): A road, canal, or water body pointing directly at the home. The concentrated linear energy acts like a spear.\n\n4. Bhumi Dosha (Earth Defect): Plot-level issues: wrong shape, inauspicious soil, geopathic stress, previous negative use (cemetery, hospital, slaughterhouse).\n\n5. Angu Dosha (Measurement Defect): Rooms or buildings with inauspicious Ayadi dimensions — the proportion creates energetic discord.\n\n6. Stambha Dosha (Column Defect): Structural columns placed on Marma points (vital energy junctions) of the Vastu Purusha Mandala. The most common structural Dosha in commercial buildings.\n\n7. Kona Dosha (Corner Defect): Corners that are not true 90 degrees. Even 2-3 degrees of deviation creates a subtle but persistent distortion of the directional energy field.\n\n8. Graha Dosha (Ceiling Defect): Slanted or uneven ceilings over sleeping and meditation areas. Creates unequal pressure on the consciousness field.\n\n9. Nirmana Dosha (Construction Defect): Building begun on inauspicious Muhurta, or construction that interrupted religious festivals.",
          },
          {
            heading: "Primary Doshas 10-18: Elemental",
            body: "10. Agni Dosha: Kitchen in wrong zone, fire appliances in North or NE, open flames facing inauspicious directions.\n\n11. Jala Dosha: Water features in SE or SW, underground tanks in SE or SW, well below sleeping area.\n\n12. Vayu Dosha: Blocked ventilation, sealed windows, no cross-ventilation. The most common Dosha in modern urban apartments.\n\n13. Prithvi Dosha: SW zone lighter than NE zone (SW must always be heavier), missing SW corner.\n\n14. Akasha Dosha: Brahma Sthana (centre) blocked by walls, structural columns, heavy furniture, or toilet.\n\n15. Tamah Dosha: Insufficient natural light in any habitual living zone. Darkness accumulates Tamas — inertia, depression, stagnation.\n\n16. Rajah Dosha: Excessive activity, noise, or traffic near meditation, sleeping, or puja zones.\n\n17. Shabda Dosha: Persistent negative sounds (traffic, industrial noise, neighbour noise) entering from inauspicious directions.\n\n18. Gandha Dosha: Persistent negative smells from inauspicious directions or from within the home (drains, dampness, decay).",
          },
          {
            heading: "Primary Doshas 19-27: Functional and Subtle",
            body: "19. Dwar Vedha (Entrance Piercing): Something inside the home directly facing and visible from the main entrance — a wall, pillar, staircase, or toilet door. The incoming prana hits an obstacle immediately.\n\n20. Shayan Dosha (Sleep Defect): Bed in wrong zone or direction — the most individually impactful of all Doshas given that we spend 8 hours daily in sleeping position.\n\n21. Paka Dosha (Cooking Defect): Kitchen in wrong zone. As covered in depth — this affects digestion, health, and family harmony across all generations.\n\n22. Snan Dosha (Bathing Defect): Bathroom in NE or Brahma Sthana. The most common and devastating modern Vastu Dosha.\n\n23. Marma Dosha (Vital Point Defect): Heavy structures, drilling, or nailing through Marma points of the Vastu Mandala.\n\n24. Pitr Dosha (Ancestor Defect): Ancestor photos or memorial items mixed with deity images, or placed in inauspicious zones.\n\n25. Yantra Dosha (Sacred Geometry Defect): Improperly activated or incorrectly placed Yantras. An unactivated Yantra is neutral. An incorrectly placed Yantra can reverse its intended effect.\n\n26. Vriksha Dosha (Tree Defect): Large trees too close to the home in specific directions: tree shadow on main entrance, roots penetrating foundation, thorny trees in NE or North.\n\n27. Jyotish Dosha (Astrological Defect): The home's Vastu is architecturally acceptable but astrologically misaligned with the owner's birth chart — the most subtle and personalised of all Doshas.",
          },
        ],
        practice: "Print your floor plan and go through the 27 Doshas systematically. Check each one: is it present, absent, or unknown? Create three columns. After this audit, identify your top 3 most impactful present Doshas. Research one targeted remedy for each. A 3-Dosha correction creates more measurable change than 10 scattered remedies applied without systematic diagnosis.",
        mantra: "ॐ वास्तु पुरुषाय नमः · सर्व दोष निवारणाय नमः",
        secret: "Among the 27 Doshas, the ancient texts identify five as 'Mahā Dosha' — great defects that no remedy can completely neutralise; they can only be managed:\n1. Main door facing South (padas 1-3 from SW)\n2. Toilet in NE\n3. Bedroom in SE for the head of household\n4. Kitchen in SW\n5. Underground water tank in SE or SW\nIf your home has any of these, the honest teaching is: sell it. The Siddhas were direct — a Mahā Dosha home will always underperform, regardless of other remedies applied. This is the teaching most Vastu consultants never give because it is not what clients want to hear.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 6 — MANTRA REMEDIES
  // ══════════════════════════════════════════════════════════
  {
    id: "mantra",
    level: 6,
    title: "Mantra Remedy Systems",
    subtitle: "Sound as Vastu Correction",
    tier: "siddha",
    icon: "🔔",
    color: "#C8B4FF",
    tagline: "Sound restructures space. Before any physical remedy, program the field with vibration.",
    lessons: [
      {
        id: "m1",
        title: "Vastu Purusha Mantra — The Master Activation",
        duration: "50 min",
        tier: "siddha",
        glyph: "ॐ",
        overview: "The Vastu Purusha is a living consciousness. This lesson teaches the complete protocol for direct communion with the being of your home — the most powerful single Vastu practice available.",
        sections: [
          {
            heading: "The Vastu Purusha Mantra",
            body: "The classical Vastu Purusha mantra is:\n\nॐ वास्तोष्पते प्रतिजानीह्यस्मान् स्वावेशो अनमीवो भवा नः।\nयत्त्वेमहे प्रति तन्नो जुषस्व शं नो भव द्विपदे शं चतुष्पदे॥\n\n(Om Vāstoshpate Pratijānīhyasmān Svāvesha Anamīvo Bhavā Nah|\nYattvemahey Prati Tanno Joshasva Sham No Bhava Dvipade Sham Chatushpade||)\n\nTranslation: 'O Lord of the dwelling, acknowledge us. Be our welcome abode, free from disease. Whatever we ask of you, please grant. Be auspicious to our two-footed and four-footed beings.'\n\nThis Rig Vedic mantra directly addresses the Vastu Purusha as a living deity. The Siddhas taught that this mantra, when chanted with sincere bhakti, produces a vibratory signature that the Vastu Purusha responds to as a devotee's call to a master.",
          },
          {
            heading: "The 40-Day Home Activation Protocol",
            body: "This is the complete Siddha protocol for activating a new home or remedying an established one:\n\nPreparation:\n• Identify the Brahma Sthana (centre of home)\n• Place a small red cloth at the centre\n• On the cloth: a copper plate, a ghee lamp, and a small mound of raw rice\n\nDaily practice (40 days):\n• Time: Sunrise (Brahma Muhurta — 4:30-6am is ideal; any morning time is acceptable)\n• Sit facing East at the Brahma Sthana\n• Light the ghee lamp\n• Chant the Vastu Purusha mantra 108 times\n• Close with 3 rounds of OM\n• Leave the lamp burning for 20 minutes, then extinguish\n\nDay 40 completion:\n• Cook a sweet offering (payasam, kheer, or any sweet)\n• Offer it at the Brahma Sthana\n• Share with all who live in the home\n• The activation is complete — the home is now a consecrated Vastu Kshetra",
          },
        ],
        practice: "Begin the first day of the 40-day protocol today. Even if you cannot do the full sequence, sit at the Brahma Sthana, light a lamp, and chant the mantra 21 times. Commitment to the sequence matters more than perfection in any single session.",
        mantra: "ॐ वास्तोष्पते प्रतिजानीह्यस्मान् · स्वावेशो अनमीवो भवा नः",
        secret: "The Siddhas taught that the Vastu Purusha responds not just to mantra but to continuous human joy within the home. A house filled with laughter, music, shared meals, and genuine love develops a pranic strength that no Dosha can permanently compromise. The highest Vastu remedy is to become the kind of person whose presence uplifts every space they inhabit.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 7 — JYOTISH VASTU
  // ══════════════════════════════════════════════════════════
  {
    id: "jyotish",
    level: 7,
    title: "Jyotish Vastu",
    subtitle: "Planetary Grid & Cosmic Timing",
    tier: "akasha",
    icon: "⭐",
    color: "#FDE68A",
    tagline: "Your birth chart and your home are in constant dialogue. Master this conversation.",
    lessons: [
      {
        id: "j1",
        title: "Navagraha Grid — 9 Planets, 9 Zones",
        duration: "80 min",
        tier: "akasha",
        glyph: "ग्र",
        overview: "Each of the 9 Vedic planets rules a specific directional zone of your home. Strengthening the zone of your birth chart's ruling planet is the fastest Vastu upgrade available.",
        sections: [
          {
            heading: "The Planetary Directional Map",
            body: "The complete Navagraha directional assignment:\n\n☀️ Sun → East: Governs health, authority, and the father's energy. Activate with open windows, sunlight, and Surya Yantra.\n🌙 Moon → Northwest: Governs emotions, mother, and subconscious mind. Activate with water features, white flowers, and moonstone.\n♂️ Mars → South: Governs courage, property, and brothers. Activate with red flowers, copper objects, and the Mangal Yantra.\n☿ Mercury → North: Governs intelligence, communication, and business. Activate with green plants, copper vessels, and the Budha Yantra.\n♃ Jupiter → Northeast: Governs wisdom, grace, and children. Activate with yellow flowers, gold objects, and the Guru Yantra.\n♀️ Venus → Southeast: Governs beauty, relationships, and creative arts. Activate with floral arrangements, silver, and the Shukra Yantra.\n♄ Saturn → West: Governs discipline, longevity, and karma. Activate with blue sapphire, iron objects, and the Shani Yantra.\n☊ Rahu → Southwest: Governs foreign connections, unconventional paths. Activate with hessonite garnet and the Rahu Yantra.\n☋ Ketu → Centre (Brahma Sthana): Governs spiritual liberation and moksha. Activate with cat's eye crystal and open space.",
          },
          {
            heading: "Personal Planetary Vastu",
            body: "Step 1: Determine your Jyotish Lagna (Rising Sign). This requires your exact birth time, date, and location. Use a Vedic astrology calculator.\n\nStep 2: Find your Lagna lord (the planet that rules your Rising Sign).\n\nStep 3: Locate that planet's directional zone in your home. This is your personal power zone.\n\nStep 4: Strengthen that zone with the corresponding planet's colours, metals, and Yantra.\n\nExample: Lagna = Taurus (Vrishabha). Lagna Lord = Venus (Shukra). Venus zone = SE. Strengthen your SE with white and pink flowers, silver objects, floral patterns, and the Shukra Yantra. Within 90 days, the qualities of your Lagna lord (beauty, harmony, creative expression, relationship success) will measurably strengthen.\n\nStep 5: Identify your most challenging planet (the one creating the most difficulty in your chart — usually associated with the most difficult house or most difficult transit). The zone of that planet needs cleaning, remedying, and possibly a specific directional Dosha check.",
          },
        ],
        practice: "Calculate your Jyotish Lagna today (free at any Vedic astrology website — you need your birth time). Identify your Lagna lord. Go to that direction in your home and spend 10 minutes there in conscious awareness. Notice what the energy feels like. Then decide: what is one thing you can add to this zone to honour your Lagna lord?",
        mantra: "ॐ नवग्रहेभ्यो नमः",
        secret: "Saturn's Sade Sati (the 7.5-year period when Saturn transits over your natal Moon) creates Vastu challenges in the West zone of your home during its peak. The Siddhas prescribed a specific West-zone protocol during Sade Sati: a piece of raw iron (not polished) placed in the West corner, a blue sapphire in a copper dish, and the Shani Mantra chanted 19 times each Saturday. This does not eliminate Sade Sati's lessons — but it creates a Vastu container that allows the lessons to arrive as wisdom rather than catastrophe.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 8 — MASTERY
  // ══════════════════════════════════════════════════════════
  {
    id: "mastery",
    level: 8,
    title: "Paramanu Vastu Mastery",
    subtitle: "Quantum Consciousness & Transmission",
    tier: "akasha",
    icon: "∞",
    color: "#C8B4FF",
    tagline: "At the highest level, Vastu and the practitioner become one. The home mirrors the master.",
    lessons: [
      {
        id: "mas1",
        title: "The Living Yantra Home — Full Consecration",
        duration: "120 min",
        tier: "akasha",
        glyph: "∞",
        overview: "The culmination of all Vastu practice: transforming your home from a structure into a living Yantra — a geometric field of consciousness that activates all who enter it.",
        sections: [
          {
            heading: "What It Means to Live in a Yantra",
            body: "A Yantra is a geometric representation of cosmic intelligence — a physical mandala that, when properly activated, functions as a portal between ordinary consciousness and higher states. The great temples of South India — Chidambaram, Srirangam, Madurai Meenakshi — are giant Yantras built to human scale.\n\nYour home can become a personal Yantra. Not metaphorically — literally. When every element of the physical space (directions, proportions, materials, sounds, smells, colours, and daily rituals) is aligned with the underlying geometry of consciousness, the home begins to function as a self-activating field generator.\n\nSigns that a home has reached Yantra status:\n• Guests consistently report feeling peaceful, elevated, or unusually clear upon entering\n• Meditation sessions in the home are effortlessly deeper than elsewhere\n• Healing from illness is faster than medically expected\n• Synchronicities increase for all residents\n• Arguments become rare and resolve quickly\n• The space has a 'smell' — not of incense or food but a quality of aliveness",
          },
          {
            heading: "The 49-Day Consecration Sequence",
            body: "Week 1-2: Physical Preparation\n• Complete thorough cleaning of entire home with salt water\n• Remove all broken, unused, and synthetic objects\n• Repair everything that is broken (broken items carry incomplete energy)\n• Paint walls in elemental colours\n• Position all furniture according to Vastu principles\n\nWeek 3-4: Elemental Activation\n• Install all elemental remedies (water feature North, copper plate Brahma Sthana, crystal grid corners)\n• Begin daily Vastu Purusha mantra practice at Brahma Sthana\n• Perform a full Pancha Bhuta puja (fire, water, earth, air, space offering) at the puja room\n\nWeek 5-6: Sound Programming\n• Daily chanting of 8 directional deity mantras (one per direction, 21 repetitions each)\n• Install wind chimes in NW and crystal singing bowl in NE\n• Begin playing sacred music (Vedic chanting or 432 Hz tuned instruments) for minimum 2 hours daily\n\nWeek 7: Integration and Sealing\n• Day 43-48: Silent retreat in the home — minimal speech, no external visitors, continuous mantra and meditation\n• Day 49: Full Griha Puja (home ceremony) — invite a Vedic priest or perform simplified version yourself\n• Cook a feast and share with family and close friends — the shared meal at the completion seals the activated field into the social fabric of the home",
          },
          {
            heading: "Babaji's Teaching — The Formless Vastu",
            body: "Mahavatar Babaji, the deathless master of the Himalayas, transmitted this teaching to Lahiri Mahasaya and through the Kriya lineage to countless practitioners:\n\n'The most perfect Vastu is the purified heart. When the practitioner has removed enough ego obscuration, their own presence becomes the Yantra. Every space they inhabit is automatically transformed. The cave, the forest, the palace — all become temples in the presence of the realised soul.'\n\nThis is the ultimate teaching: all of Vastu Shastra, from the most basic plot selection to the most advanced Jyotish grid alignment, is pointing to a single truth — that sacred space is not created by exterior arrangement but by interior realisation. The elaborate external science of Vastu exists to support and accelerate the internal science of consciousness.\n\nAs Thirumoolar wrote in the Thirumantiram: 'The body is the temple, the soul is the deity dwelling within. The one who understands this needs no other temple.' The Siddha Vastu practitioner uses the external home as a training ground for realising this internal truth — until the need for the external scaffolding falls away completely.",
          },
        ],
        practice: "Sit at the centre of your home — the Brahma Sthana. Close your eyes. Place your hands on your heart. Ask yourself sincerely: 'What is the quality of consciousness I am bringing into this space each day?' Notice the answer without judgement. This self-inquiry is the highest Vastu practice. The home can only rise to the level of consciousness that inhabits it. The most powerful upgrade is you.",
        mantra: "ॐ सर्वे भवन्तु सुखिनः · सर्वे सन्तु निरामयाः",
        secret: "Babaji's final teaching on space: 'Wherever you place your full, undivided, loving attention — that place becomes sacred. This is the secret the temples are built to remind you of. You are the consecration. You are the ritual. You are the Yantra.' This is the ultimate transmission of Siddha Paramanu Vastu — the quantum level where the observer and the observed are one.",
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SiddhaVastuCurriculum() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : getTierRank(tier);
  const userTier: Tier =
    rank >= 3 ? "akasha" : rank >= 2 ? "siddha" : rank >= 1 ? "prana" : "free";
  const [selectedModule, setSelectedModule] = useState<Module>(MODULES[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(MODULES[0].lessons[0]);
  const [activeSection, setActiveSection] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // On narrow screens, close sidebar by default
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const accessibleLessons = MODULES.reduce(
    (sum, m) => sum + m.lessons.filter((l) => hasAccess(l.tier, userTier)).length,
    0
  );
  const completedCount = completedLessons.size;

  const selectLesson = (module: Module, lesson: Lesson) => {
    if (!hasAccess(lesson.tier, userTier)) return;
    setSelectedModule(module);
    setSelectedLesson(lesson);
    setActiveSection(0);
  };

  const markComplete = () => {
    setCompletedLessons((prev) => new Set([...prev, selectedLesson.id]));
    // Auto-advance to next
    const modIdx = MODULES.findIndex((m) => m.id === selectedModule.id);
    const lesIdx = selectedModule.lessons.findIndex((l) => l.id === selectedLesson.id);
    const nextLesson = selectedModule.lessons[lesIdx + 1];
    if (nextLesson && hasAccess(nextLesson.tier, userTier)) {
      setSelectedLesson(nextLesson);
      setActiveSection(0);
    } else if (MODULES[modIdx + 1]) {
      const nextMod = MODULES[modIdx + 1];
      if (hasAccess(nextMod.tier, userTier) && nextMod.lessons[0]) {
        setSelectedModule(nextMod);
        setSelectedLesson(nextMod.lessons[0]);
        setActiveSection(0);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes goldPulse { 0%,100% { box-shadow: 0 0 0 rgba(212,175,55,0); } 50% { box-shadow: 0 0 20px rgba(212,175,55,0.15); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 2px; }
        select option { background: #111; }
        button { font-family: inherit; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.5)",
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>

      {/* Back nav */}
      <button onClick={() => navigate("/siddha-portal")} style={{ position:"fixed", top:16, left:16, zIndex:200, background:"rgba(5,5,5,0.85)", backdropFilter:"blur(10px)", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", padding:"8px 14px", borderRadius:8 }}>← SIDDHA PORTAL</button>
          <div style={{ color: "#D4AF37", fontWeight: 900, fontSize: "15px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            SIDDHA VASTU
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", letterSpacing: "0.2em", fontWeight: 700 }}>
            {selectedModule.title} · {selectedLesson.title}
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#D4AF37", fontWeight: 900, fontSize: "16px", lineHeight: 1 }}>
              {completedCount}/{accessibleLessons}
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "8px", letterSpacing: "0.2em" }}>COMPLETE</div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.03)",
              border: "2px solid rgba(212,175,55,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg viewBox="0 0 36 36" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="2" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="#D4AF37" strokeWidth="2"
                strokeDasharray={`${accessibleLessons > 0 ? (completedCount / accessibleLessons) * 100 : 0} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontSize: "10px", color: "#D4AF37", fontWeight: 700, zIndex: 1 }}>
              {accessibleLessons > 0 ? Math.round((completedCount / accessibleLessons) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Tier selector */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {(["free", "prana", "siddha", "akasha"] as Tier[]).map((t) => (
            <button
              key={t}
              onClick={() => setUserTier(t)}
              title={TIER_LABEL[t]}
              style={{
                padding: "6px 10px",
                border: "none",
                cursor: "pointer",
                background: userTier === t ? TIER_COLOR[t] : "transparent",
                color: userTier === t ? "#050505" : "rgba(255,255,255,0.3)",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                transition: "all 0.15s ease",
              }}
            >
              {t === "free" ? "FREE" : t === "prana" ? "PF" : t === "siddha" ? "SQ" : "AI"}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ── SIDEBAR ── */}
        {sidebarOpen && (
          <div
            style={{
              width: "300px",
              flexShrink: 0,
              borderRight: "1px solid rgba(255,255,255,0.05)",
              overflowY: "auto",
              background: "rgba(255,255,255,0.01)",
            }}
          >
            {MODULES.map((mod) => {
              const modAccess = hasAccess(mod.tier, userTier);
              const isActive = selectedModule.id === mod.id;
              const modCompleted = mod.lessons.filter((l) => completedLessons.has(l.id)).length;

              return (
                <div key={mod.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {/* Module header */}
                  <div
                    onClick={() => modAccess && setSelectedModule(mod)}
                    style={{
                      padding: "14px 16px",
                      cursor: modAccess ? "pointer" : "default",
                      background: isActive ? "rgba(212,175,55,0.05)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "10px",
                        background: modAccess ? `${mod.color}15` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${modAccess ? `${mod.color}30` : "rgba(255,255,255,0.04)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}
                    >
                      {modAccess ? mod.icon : "🔒"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em" }}>
                          L{mod.level}
                        </span>
                        <span
                          style={{
                            fontSize: "7px",
                            fontWeight: 800,
                            letterSpacing: "0.15em",
                            color: TIER_COLOR[mod.tier],
                            background: `${TIER_COLOR[mod.tier]}15`,
                            padding: "1px 6px",
                            borderRadius: "100px",
                          }}
                        >
                          {mod.tier.toUpperCase()}
                        </span>
                      </div>
                      <div
                        style={{
                          color: modAccess ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                          fontSize: "12px",
                          fontWeight: 700,
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {mod.title}
                      </div>
                    </div>
                    {modAccess && (
                      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", flexShrink: 0 }}>
                        {modCompleted}/{mod.lessons.length}
                      </div>
                    )}
                  </div>

                  {/* Lessons */}
                  {isActive && modAccess && (
                    <div style={{ paddingBottom: "6px" }}>
                      {mod.lessons.map((lesson) => {
                        const lesAccess = hasAccess(lesson.tier, userTier);
                        const isActiveLesson = selectedLesson.id === lesson.id;
                        const isDone = completedLessons.has(lesson.id);

                        return (
                          <div
                            key={lesson.id}
                            onClick={() => lesAccess && selectLesson(mod, lesson)}
                            style={{
                              padding: "10px 16px 10px 24px",
                              cursor: lesAccess ? "pointer" : "default",
                              background: isActiveLesson ? "rgba(212,175,55,0.08)" : "transparent",
                              borderLeft: isActiveLesson ? "2px solid #D4AF37" : "2px solid transparent",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: isDone
                                  ? "#34D399"
                                  : isActiveLesson
                                  ? "rgba(212,175,55,0.2)"
                                  : "rgba(255,255,255,0.04)",
                                border: `1px solid ${isDone ? "#34D399" : isActiveLesson ? "#D4AF37" : "rgba(255,255,255,0.08)"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "9px",
                                flexShrink: 0,
                                marginTop: "1px",
                              }}
                            >
                              {isDone ? "✓" : lesAccess ? "▶" : "🔒"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  color: lesAccess
                                    ? isActiveLesson
                                      ? "#D4AF37"
                                      : "rgba(255,255,255,0.65)"
                                    : "rgba(255,255,255,0.2)",
                                  fontSize: "12px",
                                  fontWeight: isActiveLesson ? 700 : 500,
                                  lineHeight: 1.3,
                                }}
                              >
                                {lesson.title}
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", marginTop: "2px" }}>
                                {lesson.duration}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Stats footer */}
            <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", letterSpacing: "0.2em", marginBottom: "8px" }}>
                CURRICULUM STATS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { label: "MODULES", value: MODULES.length },
                  { label: "LESSONS", value: totalLessons },
                  { label: "ACCESSIBLE", value: accessibleLessons },
                  { label: "COMPLETED", value: completedCount },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "8px",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ color: "#D4AF37", fontWeight: 900, fontSize: "18px" }}>{value}</div>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "7px", letterSpacing: "0.2em" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LESSON CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
          {/* Lesson hero */}
          <div
            style={{
              padding: "40px 40px 32px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: `linear-gradient(135deg, ${selectedModule.color}08 0%, transparent 60%)`,
              animation: "fadeIn 0.4s ease",
            }}
          >
            <div style={{ maxWidth: "700px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.3em",
                    color: selectedModule.color,
                    background: `${selectedModule.color}15`,
                    padding: "3px 10px",
                    borderRadius: "100px",
                  }}
                >
                  LEVEL {selectedModule.level} · {TIER_LABEL[selectedLesson.tier]}
                </span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>
                  {selectedModule.title}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "20px",
                    background: `${selectedModule.color}15`,
                    border: `1px solid ${selectedModule.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontFamily: "serif",
                    color: selectedModule.color,
                    flexShrink: 0,
                  }}
                >
                  {selectedLesson.glyph}
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: "clamp(18px, 3vw, 28px)",
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      color: "rgba(255,255,255,0.92)",
                      lineHeight: 1.1,
                      marginBottom: "10px",
                    }}
                  >
                    {selectedLesson.title}
                  </h1>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      maxWidth: "560px",
                    }}
                  >
                    {selectedLesson.overview}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div
            style={{
              padding: "0 40px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              gap: "0",
              overflowX: "auto",
            }}
          >
            {[
              ...selectedLesson.sections.map((s, i) => ({ id: i, label: s.heading })),
              { id: selectedLesson.sections.length, label: "SADHANA PRACTICE" },
              ...(selectedLesson.mantra ? [{ id: selectedLesson.sections.length + 1, label: "MANTRA" }] : []),
              ...(selectedLesson.secret ? [{ id: selectedLesson.sections.length + 2, label: "SIDDHA SECRET" }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  padding: "14px 16px",
                  border: "none",
                  borderBottom: `2px solid ${activeSection === tab.id ? "#D4AF37" : "transparent"}`,
                  background: "transparent",
                  color: activeSection === tab.id ? "#D4AF37" : "rgba(255,255,255,0.3)",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  textTransform: "uppercase",
                }}
              >
                {typeof tab.label === "string" && tab.label.length > 25
                  ? tab.label.substring(0, 24) + "…"
                  : tab.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div style={{ padding: "40px", maxWidth: "740px", animation: "fadeIn 0.35s ease" }}>
            {activeSection < selectedLesson.sections.length ? (
              <div>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "rgba(255,255,255,0.88)",
                    marginBottom: "24px",
                  }}
                >
                  {selectedLesson.sections[activeSection].heading}
                </h2>
                <div>
                  {selectedLesson.sections[activeSection].body
                    .split("\n\n")
                    .map((para, i) => (
                      <p
                        key={i}
                        style={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: "15px",
                          lineHeight: 1.8,
                          marginBottom: "20px",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {para}
                      </p>
                    ))}
                </div>
              </div>
            ) : activeSection === selectedLesson.sections.length ? (
              <div>
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.4em",
                    color: "#34D399",
                    marginBottom: "16px",
                  }}
                >
                  🧘 SADHANA PRACTICE
                </div>
                <div
                  style={{
                    background: "rgba(52,211,153,0.06)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    borderRadius: "20px",
                    padding: "28px",
                  }}
                >
                  <p
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      fontSize: "15px",
                      lineHeight: 1.8,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {selectedLesson.practice}
                  </p>
                </div>
              </div>
            ) : activeSection === selectedLesson.sections.length + 1 && selectedLesson.mantra ? (
              <div>
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.4em",
                    color: "#C8B4FF",
                    marginBottom: "16px",
                  }}
                >
                  🔔 ACTIVATION MANTRA
                </div>
                <div
                  style={{
                    background: "rgba(200,180,255,0.06)",
                    border: "1px solid rgba(200,180,255,0.2)",
                    borderRadius: "20px",
                    padding: "40px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(20px, 4vw, 36px)",
                      fontFamily: "serif",
                      color: "#C8B4FF",
                      lineHeight: 1.6,
                      letterSpacing: "0.05em",
                      textShadow: "0 0 30px rgba(200,180,255,0.3)",
                    }}
                  >
                    {selectedLesson.mantra}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "16px" }}>
                    Chant 108 times · Brahma Muhurta (pre-dawn) is ideal
                  </div>
                </div>
              </div>
            ) : selectedLesson.secret ? (
              <div>
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.4em",
                    color: "#D4AF37",
                    marginBottom: "16px",
                  }}
                >
                  ∞ SIDDHA AKASHA SECRET
                </div>
                <div
                  style={{
                    background: "rgba(212,175,55,0.05)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    borderRadius: "20px",
                    padding: "28px",
                  }}
                >
                  <p
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      fontSize: "15px",
                      lineHeight: 1.8,
                      fontStyle: "italic",
                    }}
                  >
                    {selectedLesson.secret}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Navigation */}
            <div
              style={{
                marginTop: "48px",
                paddingTop: "32px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <button
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
                style={{
                  padding: "12px 20px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  color: activeSection === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: activeSection === 0 ? "not-allowed" : "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                ← PREV
              </button>

              {!completedLessons.has(selectedLesson.id) ? (
                <button
                  onClick={markComplete}
                  style={{
                    padding: "12px 28px",
                    background: "rgba(52,211,153,0.1)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    borderRadius: "12px",
                    color: "#34D399",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.15em",
                  }}
                >
                  ✓ MARK COMPLETE & CONTINUE
                </button>
              ) : (
                <div
                  style={{
                    padding: "12px 20px",
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    borderRadius: "12px",
                    color: "#34D399",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                  }}
                >
                  ✓ TRANSMISSION COMPLETE
                </div>
              )}

              <button
                onClick={() => {
                  const maxSection =
                    selectedLesson.sections.length +
                    (selectedLesson.mantra ? 1 : 0) +
                    (selectedLesson.secret ? 1 : 0);
                  setActiveSection(Math.min(maxSection, activeSection + 1));
                }}
                disabled={
                  activeSection >=
                  selectedLesson.sections.length +
                    (selectedLesson.mantra ? 1 : 0) +
                    (selectedLesson.secret ? 1 : 0)
                }
                style={{
                  padding: "12px 20px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  color:
                    activeSection >=
                    selectedLesson.sections.length +
                      (selectedLesson.mantra ? 1 : 0) +
                      (selectedLesson.secret ? 1 : 0)
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.5)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                NEXT →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
