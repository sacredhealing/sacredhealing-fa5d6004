import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMembershipTier } from "@/hooks/useMembershipTier";

// ─── SQI 2050 · HANUMAN CODEX · SOVEREIGN EDITION ────────────────────────────
// Weapons · Physical Alchemy · Siddhi Attainment · Deep Devotion
// Deploy to: src/pages/HanumanCodex.tsx (REPLACE v1)
// Route: <Route path="/hanuman-codex" element={<HanumanCodex />} />
// Nav: add "Hanuman Codex" link to sidebar/menu (all tiers see it; content gates)
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const TIER_ORDER: Record<string, number> = { free: 0, "prana-flow": 1, "siddha-quantum": 2, "akasha-infinity": 3 };
const TIER_LABELS: Record<string, string> = { free: "Free", "prana-flow": "Prana-Flow", "siddha-quantum": "Siddha-Quantum", "akasha-infinity": "Akasha-Infinity" };
const TIER_COLORS: Record<string, string> = { free: "#6B7280", "prana-flow": "#F97316", "siddha-quantum": "#22D3EE", "akasha-infinity": "#A855F7" };

// ══════════════════════════════════════════════════════════════════════════════
// DATA — WEAPONS OF HANUMAN
// ══════════════════════════════════════════════════════════════════════════════

const HANUMAN_WEAPONS = [
  {
    id: "gada",
    name: "Gada — The Divine Mace",
    sanskritName: "गदा",
    symbol: "🔱",
    weaponType: "Primary Weapon of Brahma-Shakti",
    tier: "free",
    description: "The Gada (iron mace) is Hanuman's primary weapon — the same weapon carried by Vishnu and Bhima. It represents divine force made physical: unstoppable Brahma-shakti that destroys all obstruction to dharma. In Hanuman's hands, the Gada is always raised and ready, yet never used unnecessarily.",
    mythological: ["In the Ramayana, Hanuman uses the gada to crush Ravana's armies in the Ashoka grove battle, killing Aksha-kumara with a single blow.", "The Gada is described as Kanchan-maya — golden, made of divine consciousness rather than mere iron.", "After Ram's victory, Hanuman is depicted eternally with the gada — the symbol of permanent dharmic readiness."],
    innerMeaning: "The Gada represents Viveka-shakti: the crushing power of discriminative wisdom. Every blow destroys a false belief, an inner demon, a limitation masquerading as truth. Its weight = the gravity of Brahman's reality, which crushes illusion upon contact. The circular swing = the resolution of karmic cycles through dharmic force.",
    physicalName: "Gada Swinging — Indian Club Training",
    physicalDesc: "Traditional Indian Gada swinging is the direct physical embodiment of Hanuman's weapon practice. Used by Akharas dedicated to Hanuman for thousands of years — the ultimate shoulder, spine, and wrist conditioning system.",
    physicalSteps: ["Obtain a wooden gada/modern steel mace (4–24 kg depending on level).", "Begin standing, feet shoulder-width, gada in both hands at chest.", "10-degree mill: circular arc behind the head — right → behind → left → front. 10 reps each direction.", "Gada namaskar: lower into forward bow as if saluting Ram with the weapon. Rise. 10 reps.", "Single-arm swings: 5 reps each arm. Shoulder and thoracic spine — the weapon's launch system.", "Finish: stand in silence, gada vertical before you. Feel Hanuman's weapon-shakti in your hands. Offer the practice to Ram."],
    physicalMantra: "Jai Bajrangbali — chanted with each swing",
    physicalBenefit: "Develops the shoulder-spine-wrist chain that generates extraordinary striking power. Traditional Akharas report that gada training combined with Hanuman japa develops pranic power far beyond ordinary weight training.",
    sadhanaKey: "Before each session: bow to Hanuman, place the gada at His feet, chant 'Om Hanumate Namah' 11 times. You are not training — you are serving.",
  },
  {
    id: "tail",
    name: "Langhul — The Sacred Tail",
    sanskritName: "लाङ्गूल",
    symbol: "🔥",
    weaponType: "Fire Weapon — Kundalini Astra",
    tier: "free",
    description: "Hanuman's tail (Langhul) is described as extending to infinite length — wrapping around Lanka's walls and burning the entire city with divine fire. The tail is sentient, independently alive, capable of independent action. It represents the Kundalini-fire in its fully awakened state.",
    mythological: ["When Ravana ordered Hanuman's tail burned as punishment, Hanuman allowed it — then used the divine fire given by Agni-deva to burn Lanka entirely.", "The tail wrapped around Lanka represents the Kundalini serpent coiling around the ego-city and burning it clean.", "Hanuman's tail touching the sky encodes the eternal connection between earth and Brahman through the cosmic spine."],
    innerMeaning: "The tail IS the spine (Merudanda) in its cosmic expression. The dormant Kundalini sleeps at the base of the spine like a coiled serpent. Hanuman's tail — always erect, always alive, connecting earth and sky — is the model of fully awakened Kundalini. When the ego tried to burn the tail (suppress awakened fire), the fire turned on the ego itself.",
    physicalName: "Spine-Fire Sequence — Merudanda Activation",
    physicalDesc: "A spinal movement series awakening the Sushumna-nadi — the cosmic tail of Hanuman within the practitioner's own spine.",
    physicalSteps: ["Cat-Cow Breath: 20 slow cycles. Feel the spine as a living serpent of fire. Each exhale = fire rising through the tail.", "Seated Spinal Twist both sides: Hold 10 breaths each. Hanuman's tail wrapping around, cleansing.", "Cobra to Upward Dog flow: 10 repetitions. Full front-spine extension — the chest of fire opening.", "Standing Spinal Wave: Sacrum to crown undulation. 10 forward, 10 backward.", "Spinal Ignition Kriya: Inhale — energy rising from Muladhara like a lit fuse. Hold. Exhale down.", "Final: Stand in Tadasana, visualize golden tail extending from coccyx to infinite sky — burning, alive."],
    physicalMantra: "Om Langhulaya Namah — O Lord of the Sacred Tail",
    physicalBenefit: "Activates the Sushumna-nadi and parasympathetic central highway. Increases spinal fluid flow, reduces disc compression, creates the postural sovereignty Hanuman embodies.",
    sadhanaKey: "Your spine IS the sacred connection between earth and the infinite — never separate from Brahman for even one breath. Practice this knowing: I am embodying Hanuman's tail.",
  },
  {
    id: "parigha",
    name: "Parigha — The Iron Club",
    sanskritName: "परिघ",
    symbol: "⚔️",
    weaponType: "Endurance Weapon — Tapas Astra",
    tier: "prana-flow",
    description: "The Parigha (iron club) represents sustained effort against all opposition. Where the Gada strikes with precision intelligence, the Parigha endures. In Hanuman's arsenal it embodies His infinite sustained effort — the quality of the devotee who keeps going regardless of all resistance, forever.",
    mythological: ["The Parigha is a weapon of the Yakshas — reclaimed from the dark side by Hanuman who wields it for Ram.", "In battle, Hanuman improvises a parigha from a gate pillar — using whatever is at hand for Ram's service. Total resourcefulness.", "The iron represents Kali Yuga density — iron-age limitation that Hanuman transforms through pure Prana-force."],
    innerMeaning: "The Parigha is the weapon of Tapas: endurance, austerity, the sustained heat of practice. Every day of consistent sadhana is one swing of the Parigha. Over time, the seemingly immovable (karma, addiction, limitation) is crushed through sustained disciplined force. Some battles are won not in one blow but in 10,000 blows — all equally full-force.",
    physicalName: "Iron Body Protocol — Bajrang Tapas",
    physicalDesc: "The endurance training of the traditional Akhara — building the iron body through high-volume, consistent practice dedicated to Hanuman.",
    physicalSteps: ["108 Hindu Push-ups (Danda): Downward dog → chest through floor → cobra. Cycle through 12 qualities of Hanuman, 9 rounds.", "108 Hindu Squats (Baithak): Feet together, arms forward, full depth, rise. Each squat = one name of Ram.", "Iron bridge holds: Full backbend (wheel pose). 5 rounds of 10 breaths. The arc of Hanuman's great leap.", "Neck bridge rotations: The gateway of Vishuddha — Hanuman's roar-weapon lives in the neck.", "Arm balance holds: Hold crow or any arm balance until failure. Then 3 more breaths. This is the Parigha teaching: go beyond."],
    physicalMantra: "Bajrang Bali Ki Jai — shouted after every 27 repetitions",
    physicalBenefit: "108 dandas + 108 baithaks = the traditional daily practice of every Akhara wrestler. Wrestlers dedicated to Hanuman report extraordinary joint health into old age and a quality of fearlessness that ordinary weight training does not produce.",
    sadhanaKey: "Build this iron body for Ram's service. Each session: ask 'What will I do with this strength for Hanuman's mission?' The answer IS the practice.",
  },
  {
    id: "nada-astra",
    name: "Nada Astra — The Roar Weapon",
    sanskritName: "नाद अस्त्र",
    symbol: "🔊",
    weaponType: "Sound Weapon — Nada Brahman",
    tier: "prana-flow",
    description: "Hanuman's roar (Nada-astra) shook all three worlds simultaneously. In Lanka, even Ravana — who had defeated all the gods — felt fear for the first time at Hanuman's roar. This is the most subtle and most powerful weapon: the primordial Sound Current expressed through a fully awakened being.",
    mythological: ["Hanuman's roar in the Ashoka grove caused Ravana's entire palace to tremble — vibration restructuring the local reality field.", "His battle cry 'Simhanada' (lion's roar) is a sonic weapon that disrupts the coherence of darkness.", "In Sundara Kanda, Hanuman sings Ram's praises in Lanka before battle — his voice alone makes the Rakshasas tremble."],
    innerMeaning: "The practitioner's VOICE, when it carries Ram-shakti, becomes a weapon against all darkness. 'Nada' is not merely sound — it is the vibrational signature of consciousness. When a fully awakened devotee speaks — even in ordinary conversation — the vibration reorganizes the local reality field. The roar of the fully surrendered devotee is God speaking through a human instrument.",
    physicalName: "Simhanada Kriya — The Lion's Roar Practice",
    physicalDesc: "Activating Hanuman's voice weapon through specific vocal practices combining Nada Yoga with Hanuman bhakti — the training of the body's sound-weapon system.",
    physicalSteps: ["Ujjayi Breath: 5 minutes of Ocean Breath — constrict throat on both inhale and exhale. This is the beginning of the Nada-astra.", "Brahmari (Bee Breath): Plug ears, eyes closed, hum on extended exhale. Feel skull cavity vibrate. 10 rounds. Charging cranial bones.", "Simhanada Roar: Open mouth fully, extend tongue to chin, eyes wide — ROAR from the belly for full exhale. 5 rounds.", "Hanuman Nada: Sustained 'Hanuuuuu-Maaaan' — Ha vibrates chest, Nu vibrates throat, Man vibrates skull. 10 minutes.", "Ram-Nam volume ladder: whisper → speaking → loud → full shout of 'RAM!' → return to silence.", "Rest 5 minutes. The silence after the roar is where Hanuman's presence is felt most clearly."],
    physicalMantra: "Jai Shri Ram — spoken at every volume from silence to roar",
    physicalBenefit: "Nada practices activate the Vagus nerve, reduce cortisol measurably, and create 'Nada-shuddhi' — purification of the entire subtle body through resonant sound. Combined with Hanuman-mantra: dual activation of vocal/physical AND devotional/spiritual systems simultaneously.",
    sadhanaKey: "Practice Simhanada in nature — forest or by water. Hanuman is master of nature. Your roar in a natural setting activates the Earth's resonance field. The trees hear and respond to the name of Ram.",
  },
  {
    id: "ram-nam-shastra",
    name: "Ram-Nam — The Supreme Weapon",
    sanskritName: "राम-नाम शस्त्र",
    symbol: "🕉️",
    weaponType: "Brahmastra — The Ultimate",
    tier: "siddha-quantum",
    description: "Hanuman's supreme weapon surpasses all others: the name of Ram. Tulsidas states: 'Ram-Nam is greater than Ram Himself — Ram saves those who come to Him, but Ram-Nam saves even those who oppose Ram.' Hanuman carried Ram's ring (the physical form of Ram's name) in His mouth across the ocean — making the impossible trivially easy.",
    mythological: ["Hanuman writes 'Ram' on each stone used to build the Rama Setu — the stones float. The name of Ram defies physics.", "Brahma in the Padma Purana: 'One who chants Ram's name continuously is more powerful than all my creation.'", "Hanuman's body, when cut open, is found to have 'RAM' written on every cell — His entire form is made of Ram-name."],
    innerMeaning: "'Ra' = fire syllable (Raksha = protection, Ravi = sun). 'Ma' = earth/water syllable (Maya = illusion dissolved, Matru = mother principle). Ra+Ma = individual fire-soul returning to cosmic mother. The sound IS the journey home, encoded in two syllables. This is why Ram-Nam is the Brahmastra: it contains the entire path of liberation in its vibration.",
    physicalName: "Ram-Nam Deha — Making the Body a Living Mantra",
    physicalDesc: "Advanced practice of synchronizing Ram-Nam with every physical function — transforming the entire body into a living mantra machine.",
    physicalSteps: ["Morning awakening: Before rising, feel the heartbeat. Synchronize 'RAM' with each heartbeat for 5 minutes. The heart already chants — awareness makes it conscious.", "Walking Ram-Nam: Every right footfall = 'RAM', every left footfall = 'RAM'. Walk 20 minutes minimum. The body becomes the mantra.", "Eating Ram-Nam: Before each bite, chant 'Ram' once silently. The Annapurna-Ram sadhana — transforming food into prasad.", "Breath synchronization: Inhale = 'Ra-' (solar entering), Exhale = '-ma' (lunar releasing). Every breath is Ram. 10 minutes.", "Likhit Japa: Write 'RAM' in Devanagari (राम) 108 times. Each written Ram is a bridge-stone of the Rama Setu.", "Pre-sleep: Only 'Ram... Ram... Ram...' as you fall asleep. The last thought programs the dream-state and Pranic body."],
    physicalMantra: "Ram Ram Ram Ram Ram Ram Ram... (continuous, without break)",
    physicalBenefit: "Ram-Nam japa practiced continuously for 40+ days creates 'mantra resonance entrainment' — the nervous system, heart rate variability, and brainwave states begin to organize around the mantra's frequency. The practitioner becomes vibrationally different at the cellular level.",
    sadhanaKey: "Ram-Nam doesn't need perfect pronunciation, the right time, or a pure heart to begin. It purifies whatever it touches. Begin exactly where you are. The name does the rest — this is the great secret.",
  },
  {
    id: "bajrang-body",
    name: "Bajrang Deha — The Body as Weapon",
    sanskritName: "बजरंग देह",
    symbol: "⚡",
    weaponType: "Indestructible Form — Vajra Kavacha",
    tier: "siddha-quantum",
    description: "The most profound teaching: Hanuman HIMSELF is the supreme weapon. Bajrang = Vajra (diamond/lightning) + Anga (body). His entire physical form is indestructible divine substance — harder than diamond, faster than lightning. When Indra struck Hanuman as a child with his Vajra, the Vajra broke. The weapon shattered against love.",
    mythological: ["Indra struck young Hanuman with the Vajra — his jaw cracked but the Vajra BROKE. The cosmos's most powerful weapon shattered against Hanuman's love-hardened body.", "Every attempt to destroy Hanuman (burning his tail, imprisonment, torture) fails — not through resistance but because divine love creates armor no weapon penetrates.", "In the Mahabharata, Arjuna's entire army combined with Krishna's presence cannot lift the flag bearing Hanuman's image. The image alone holds more power than all human force."],
    innerMeaning: "The body of a fully surrendered devotee becomes invincible — not through training alone but through the alchemical process of love transforming physical substance. Ojas (vital essence from brahmacharya + sattvic living) is the physical analog of Vajra. When Ojas reaches full capacity, the form becomes radiant, disease-resistant, capable of enduring what ordinary bodies cannot.",
    physicalName: "Ojas-Vajra Protocol — Building the Diamond Body",
    physicalDesc: "The complete physical protocol for Hanuman's Bajrang body: combining Brahmacharya, Sattvic living, and traditional strength into the indestructible diamond form.",
    physicalSteps: ["Brahmacharya foundation: Conservation and upward redirection of vital energy. For householders: conscious intimacy without depletion. Daily Mula Bandha + pranayama redirects energy upward.", "Ashwagandha Rasayana: 1 tsp Ashwagandha + 1 tsp raw honey + 1 cup warm whole milk + cardamom. Before sleep. 90-day minimum for full Rasayana effect.", "Abhyanga: Self-oil massage with sesame oil before bathing. Sesame = Saturn = Hanuman's domain. Builds the Kapha foundation of the diamond body.", "Cold immersion (Vayu Tapas): Begin 30-second cold at shower end. Build to 3 minutes full cold. Pavan-putra activates the Vayu-tattva — the wind-fast reflexes.", "Surya Namaskar × 108: The supreme single practice. Takes 60-90 minutes. Do on Sunday or Tuesday. The complete moving temple of solar worship.", "Tuesday complete fast: The body that knows deprivation cannot be controlled by comfort. Hanuman fasted in Ram's service. Learn divine resources."],
    physicalMantra: "Om Bajrang Balaya Namah — chanted during oil massage",
    physicalBenefit: "The Ojas-Vajra protocol builds: mitochondrial density, hormonal optimization (testosterone + growth hormone), nervous system resilience, immune function, and the specific quality of physical presence that makes a practitioner formidable without aggression.",
    sadhanaKey: "The Bajrang body is not built for pride — it is built for service. Ask before each session: what will this strength accomplish for Ram? The more powerfully the body serves, the more powerfully Hanuman works through it.",
  },
  {
    id: "mountain-astra",
    name: "Parvata Astra — The Mountain Weapon",
    sanskritName: "पर्वत अस्त्र",
    symbol: "🏔️",
    weaponType: "Total Sacrifice Weapon",
    tier: "akasha-infinity",
    description: "When Hanuman couldn't identify the specific Sanjivani herb, he lifted the ENTIRE MOUNTAIN. This is the supreme weapon of total offering: when you don't know the specific solution, offer EVERYTHING. The Dronagiri mountain, carried in one act of complete devotion, is the most powerful weapon against impossibility, inadequacy, and despair.",
    mythological: ["The Dronagiri mountain glows with thousands of healing herbs, each radiating its own light — Hanuman carries the entire field of divine medicine.", "Ram's physicians couldn't identify which specific Sanjivani was needed — so Hanuman brought the complete mountain of divine healing.", "After Lakshman was revived, the mountain was RETURNED to its place — Hanuman's total offering, received by Ram, restored."],
    innerMeaning: "When you feel you don't have the specific answer, the specific gift — bring EVERYTHING YOU HAVE. Lay your entire being at Ram's feet: all experiences, all wounds, all wisdom, all ignorance — offered completely. Ram will extract what is needed. Total offering is the highest form of surrender: not selective but complete.",
    physicalName: "Mountain Carrier Practice — Sankalpa of Total Offering",
    physicalDesc: "A somatic practice of experiencing total-body effort as complete devotion — becoming the mountain-carrier in your own body.",
    physicalSteps: ["Identify your 'Dronagiri' — the heavy thing in your life you've been managing alone.", "Choose a genuinely heavy object (sandbag, loaded backpack, stones). Hold it at chest level.", "Walk — slowly, steadily — as long as you can. With each step: 'I carry this for Ram. I carry this for Ram.'", "When you can hold no longer — instead of dropping: say 'Ram, this is too heavy for me alone. Take it.' Set it down gently.", "Stand with open empty hands, facing the sky. Feel the relief of having given the mountain to God.", "Journal: What was your mountain? What happened when you chose to give it to Ram?"],
    physicalMantra: "Laay Sanjivan Lakhan Jiyaye — bringing life through total offering",
    physicalBenefit: "Addresses the deepest physical pattern of chronic holding — the muscular armoring from carrying burdens alone for years. The act of physical surrender WITH intention creates a neurological shift that mirrors emotional and karmic release simultaneously.",
    sadhanaKey: "The mountain Hanuman carried contained the medicine of eternal life. Your own burden, when offered to Ram, contains within it the seeds of your liberation. The very thing you're struggling with IS the Sanjivani — you simply cannot identify it yet from inside the struggle.",
  },
  {
    id: "nails-narasimha",
    name: "Nakha-Dastra — Nails of Narasimha",
    sanskritName: "नख-दंष्ट्र",
    symbol: "🐯",
    weaponType: "Primal Nature Weapon",
    tier: "akasha-infinity",
    description: "Hanuman's nails and teeth connect him to his divine uncle Narasimha — the lion-man who tore Hiranyakashipu apart with bare nails. These weapons represent the power of the NATURAL body: no manufactured weapon, no external tool — the divine organism in its raw, unmediated power. Pure Shakti without artifice.",
    mythological: ["In Kishkindha Kanda, Hanuman's claws are described as 'cutting through divine armor as if through paper.'", "Narasimha's tearing power: because Hanuman carries the essence of all Vishnu avatars, he embodies the ability to destroy the seemingly indestructible ego.", "Panchamukhi Hanuman's South-facing Narasimha face directly channels this liberating-tearing power."],
    innerMeaning: "You were born with the nails and teeth of Narasimha in your soul. Before any practice, any teaching, any system — the raw divine nature within is ALREADY fully equipped. The Nakha-Dastra teaches: the greatest weapon is recognizing what you already ARE. The sadhana is the polishing — not the forging.",
    physicalName: "Narasimha Activation — Embodying the Raw Divine Nature",
    physicalDesc: "A primal movement and vocalization practice connecting to the Narasimha-Hanuman energy — the unmediated divine force within.",
    physicalSteps: ["Wide-legged stance, slightly crouched — the lion's readiness. Not aggressive: aware.", "Clench and open hands rapidly × 20. Activating palm chakras and the primal gripping/releasing circuit.", "Narasimha Mudra: Fingers spread wide, arms forward, face fierce but completely open. Hold 60 seconds. Feel the raw power.", "Primal roar sequence: 3 increasing-volume roars, each longer. The final roar: the loudest sound your body can produce. Release FULLY.", "After the roar: immediately sit in stillness. Hands on Muladhara. Earth receiving the energy. The still lion — power at rest.", "Complete: 'I am already equipped. Everything I need to serve Ram is already within me.'"],
    physicalMantra: "Om Namo Narasimhaya — immediately followed by 'Jai Hanuman'",
    physicalBenefit: "Primal activation restores the connection to innate body-power that modern sedentary life suppresses. The combination of physical power activation with devotional context creates 'Shakti-bhakti fusion' — the body's raw force consecrated to divine purpose.",
    sadhanaKey: "You were not born empty of weapons. Every quality of Hanuman — strength, wisdom, devotion, courage — is already a seed in your soul. The sadhana is the watering. Not the planting — only the WATERING of what is already divine.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — PHYSICAL STRENGTH ALCHEMY
// ══════════════════════════════════════════════════════════════════════════════

const PHYSICAL_TRAINING = [
  {
    id: "akhara",
    title: "The Akhara Tradition",
    subtitle: "Hanuman's Sacred Gymnasium — 2,000 Years of Proven Results",
    tier: "free",
    icon: "🏛️",
    content: "Every Akhara (traditional Indian wrestling school) is dedicated to Hanuman — practice begins and ends with His worship. 'Akhara' means 'the unshakeable foundation.' Wrestlers (Pehlwans) in the Akhara tradition have for thousands of years produced extraordinary physical specimens, attributing power entirely to Hanuman's grace and the discipline of Brahmacharya.",
    practices: [
      { name: "108 Danda (Hindu Push-up)", reps: "108 daily", desc: "Downward dog → chest sweeps floor → cobra. Develops chest-shoulder-hip chain that makes traditional wrestlers devastatingly powerful. Count with Hanuman's qualities: Devotion, Strength, Wisdom... cycle through 12, 9 rounds. Begin: 11. Add 11/week.", mantra: "Ram 1, Ram 2... to 108" },
      { name: "108 Baithak (Hindu Squat)", reps: "108 daily", desc: "Feet together, rise on toes at bottom of each squat, arms sweep forward. Develops full posterior chain, hip flexors, Muladhara activation. Traditional wrestlers do 1,000+ per day. Begin: 21. Add 21/week.", mantra: "Each baithak = one name of Ram" },
      { name: "Surya Namaskar × 108", reps: "108 rounds weekly", desc: "Complete sun salutation sequence dedicated to Hanuman who swallowed the Sun. 108 rounds = ~90 minutes of moving meditation + physical training. The supreme endurance practice of the tradition. Begin: 12 daily. Add 12/month.", mantra: "Each round: one of the 12 names of Surya" },
      { name: "Mallakhamb (Pole Yoga)", reps: "30 min daily", desc: "Hanging, spinning, balancing on vertical wooden pole. Develops grip strength, core integration, shoulder mobility. The pole = cosmic axis (Meru). Climbing it = soul's ascent. Use gymnastics rings as modern alternative.", mantra: "Jai Mahaveer with each movement" },
      { name: "Gada Swinging", reps: "20 min daily", desc: "Traditional iron mace/club swing — the weapon practice as physical training. Develops shoulder resilience, grip strength, rotational power. Begin: 2 kg club, 50 reps each arm. Progress to heavier.", mantra: "Jai Bajrangbali — each swing" },
    ],
    weeklyStructure: "Tuesday: Maximum effort day — personal bests in all disciplines. Hanuman's day demands your best. Saturday: Active recovery + extended pranayama. Sunday: Rest or light Surya Namaskar only.",
    diet: ["Pre-workout (4–5 AM): Milk with dates, honey, cardamom — the traditional Akhara fuel.", "Post-workout: Almond milk, seasonal fruits, soaked nuts. Pure sattvic recovery.", "Main meal: Rice, lentils, ghee, seasonal vegetables. Simple, complete, offered first to Hanuman.", "Avoid: Meat (especially Tue/Sat), garlic, onion, alcohol, excess sugar.", "Tuesday: Complete fast until sunset if possible, or only fruits and milk."],
  },
  {
    id: "ojas-building",
    title: "Ojas Alchemy — Building Divine Vitality",
    subtitle: "The Source of Hanuman's Inexhaustible Energy",
    tier: "prana-flow",
    icon: "⚗️",
    content: "Ojas is the finest product of complete digestion — physical, emotional, and spiritual. One drop of pure Ojas is described as worth more than all the gold in Lanka. Hanuman's 'atullit bal dhama' (abode of incomparable energy) IS Ojas at maximum expression. Building Ojas = building Hanuman's strength within your own body.",
    practices: [
      { name: "Brahmacharya Practice", reps: "Daily discipline", desc: "Conservation and upward redirection of vital (sexual) energy. For householders: conscious intimacy with full presence. The Ojas builds through conservation AND upward-moving pranayamas that transform gross energy into Tejas (radiance) and Ojas (essence). Begin: 40-day commitment. Observe the effect.", mantra: "Om Hrim Brahmacharya Dharaya Namah" },
      { name: "Ashwagandha Rasayana", reps: "Daily — 90 days minimum", desc: "1 tsp Ashwagandha + 1 tsp raw honey + 1 cup warm whole milk + pinch of cardamom. Before sleep. Charaka Samhita: 'produces the strength of a horse.' Hayagriva (Hanuman's horse-faced aspect) activated.", mantra: "Offer to Hanuman before drinking: 'This is Ram's medicine flowing through me'" },
      { name: "Extended Kumbhaka Pranayama", reps: "20 min daily", desc: "Inhale 4 counts, hold 16 counts, exhale 8 counts. The 1:4:2 ratio forces the system to extract Prana from held breath — building the cellular energy reserves Ojas represents. Begin: 1:2:2 ratio. Build toward 1:4:2 over 90 days.", mantra: "During retention: visualize golden Ojas-light filling every cell" },
      { name: "Cold Immersion (Vayu Tapas)", reps: "Daily", desc: "Hanuman is Pavan-putra: son of wind. Cold water activates Vayu-tattva — building cold-stress resilience, increasing brown adipose, boosting dopamine ~250% (documented), hardening the Sthula-sharira. The Vajra-body is not harmed by heat or cold. Begin: 30 seconds cold end-of-shower. Build to 3 min.", mantra: "Entering cold: 'Pavan Tanaya Sankat Haran'" },
    ],
    weeklyStructure: "Ojas builds slowly, depletes fast. Primary destroyers: sexual depletion + emotional reactivity (anger/fear burning reserves). Primary builders: consistent sleep before 10 PM + daily Brahmacharya + Tuesday fasting.",
    diet: ["Ojas-building (Ojasya) foods: Whole milk, ghee, raw honey, Ashwagandha, Shatavari, Amalaki, dates, almonds, sesame, saffron.", "Timing: Largest meal at noon (solar peak). Small dinner before sunset. The Akhara timing system.", "Cook with devotion: every meal prepared as offering to Hanuman — the cook as priest of the kitchen."],
  },
  {
    id: "panchamukhi-body",
    title: "Panchamukhi Body Training",
    subtitle: "Developing All Five Energy Systems of Hanuman's Form",
    tier: "siddha-quantum",
    icon: "🔱",
    content: "Panchamukhi Hanuman has five faces corresponding to five elements and five directions. In physical training terms: the five faces represent the five energy systems that must all be developed for the complete sovereign body. Most training develops only one or two — the Hanuman-body requires all five simultaneously.",
    practices: [
      { name: "East Face (Hanuman) — Vayu Body", reps: "Speed & agility", desc: "Hanuman's monkey face: Vayu-tattva. Speed, agility, moving between positions instantaneously. Training: explosive sprints, plyometric jumps, reaction drills. 8 × 40-meter sprints. Sprint as if carrying an urgent message to Ram.", mantra: "Jai Pavan Kumar during each sprint" },
      { name: "South Face (Narasimha) — Agni Body", reps: "Power & heat", desc: "The lion face: Agni-tattva. Raw explosive power, heat of transformation. Heavy compound lifts: deadlifts, presses, carries. 5 × 5 protocol at 85% max effort. Before each heavy set: invoke Narasimha.", mantra: "Om Namo Narasimhaya before each heavy set" },
      { name: "West Face (Garuda) — Akasha Body", reps: "Flexibility & space", desc: "Eagle face: Akasha-tattva. Space within the body — joint mobility, flexibility, open channels for Prana. 30 min daily deep stretch: hips, spine, shoulders, ankles. Hold each 3–5 minutes minimum. The open channel is the wise channel.", mantra: "Garuda Gayatri during stretching" },
      { name: "North Face (Varaha) — Prithvi Body", reps: "Stability & ground", desc: "Boar face: Prithvi-tattva. Absolute stability, immovable structural integrity. Isometric holds, balance work, single-leg stability. Standing balance holds (1–5 min each leg), plank variations, wall sits. The grounded warrior.", mantra: "Om Prithviyai Namah during holds" },
      { name: "Upward Face (Hayagriva) — Jala Body", reps: "Endurance & flow", desc: "Horse face: steady-state aerobic capacity flowing without effort. Long-distance runs, swimming, cycling — sustained rhythmic effort 45–90 minutes. Weekly long run/swim/ride building to 90 minutes. Run toward a Hanuman temple if possible.", mantra: "Ram Nam synchronized with footfalls for the entire duration" },
    ],
    weeklyStructure: "Day 1: Vayu (speed). Day 2: Agni (strength). Day 3: Akasha (flexibility). Day 4: Prithvi (stability). Day 5: Jala (endurance). Day 6 (Sat): All five combined warrior circuit. Day 7 (Sun): Complete rest — the Shiva day within the Hanuman week.",
    diet: ["Training days: Higher carbohydrate — rice, sweet potato, banana — to fuel Agni metabolism.", "Rest days: Higher fat — ghee, coconut, almonds — to build Ojas reserves.", "Pre-workout always: 5 minutes Ram-Nam japa to establish the divine context for physical work."],
  },
  {
    id: "chiranjeevi-body",
    title: "Chiranjeevi Body Practice",
    subtitle: "Training the Immortal Body of the Eternal Devotee",
    tier: "akasha-infinity",
    icon: "∞",
    content: "Hanuman is one of the seven Chiranjeevi (immortals). The teaching: the body, when maintained as a sacred instrument of Ram's service with absolute discipline and devotion, can be preserved in extraordinary vitality far beyond normal aging. The Siddha medicine tradition is built entirely on this foundation.",
    practices: [
      { name: "Kaya Kalpa — Body Renewal", reps: "Seasonal (4× per year)", desc: "The ancient Siddha complete body renewal: 7–41 day intensive protocol with seclusion, specific Rasayana medicines, pranayama-only (first 7 days), controlled light. Modern adaptation: 7-day seasonal retreat. Begin: 3-day retreat at each solstice/equinox.", mantra: "During Kaya Kalpa: only Ram-Nam. Complete silence from all other speech." },
      { name: "Tri-Dosha Balancing", reps: "Daily protocol", desc: "Vata: 10-min self-oil massage daily. Pitta: avoid midday sun and overwork. Kapha: rise before sunrise, never sleep past 6 AM. These three practices prevent the accumulative imbalance that creates chronic disease and accelerated aging.", mantra: "Morning Gayatri 21x. Noon Ram-Nam 108x. Evening Hanuman Chalisa 1x." },
      { name: "Siddha Breathing — Kevalya Kumbhaka", reps: "Achieved through years of pranayama", desc: "The supreme pranayama: breath suspension without effort — the breath naturally stops in extended pause of grace. Described in Hatha Yoga Pradipika as the ultimate sign of mastery. Hanuman's Prana is in permanent Kumbhaka — He breathes only for the world's benefit, not His own need.", mantra: "The breathless state itself becomes the mantra. Silence is the supreme sound." },
      { name: "Maha Samadhi Preparation", reps: "Daily orientation", desc: "10 minutes each morning: contemplate the body's mortality. Then resolve to live fully for Ram's service in whatever time remains. The person who faces death daily cannot be controlled by fear of it. Verse 34 of the Chalisa is the living practice: 'Ant kaal Raghubar pur jayi.'", mantra: "Mahamrityunjaya Mantra × 108 weekly" },
    ],
    weeklyStructure: "3 days: peak physical practice. 2 days: moderate + extended pranayama. 1 day: complete stillness (the Shiva day within the Hanuman week). 1 day: Seva — physical service to others. Seva regenerates the body more powerfully than any other practice.",
    diet: ["Mitahara (moderation): Eat only what is needed. Hanuman never ate unnecessarily.", "Monthly Ekadashi fasting: complete 24–48 hour fast (water, coconut water, herbal tea). Autophagy activated.", "Annual Pancha-karma: the complete Ayurvedic body cleanse and system reset."],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — SIDDHI ATTAINMENT PATH
// ══════════════════════════════════════════════════════════════════════════════

const SIDDHIS = [
  { id: "anima", number: 1, name: "Anima", sk: "अणिमा", subtitle: "Power of Miniaturization", tier: "prana-flow", hanuman: "Used to appear as a tiny monkey before Sita in the Ashoka Grove — small enough to be non-threatening to the grieving queen, precise enough to deliver Ram's ring. True power knows when to become small.", inner: "Anima is the siddhi of precision and focus — making your entire being SMALL enough to fit through any gap in opposition. In modern terms: laser focus, surgical precision under pressure, knowing exactly how much force to apply.", path: "Meditation on Paramanu (the smallest particle): Begin with room awareness → body → heart → single cell → nucleus → atom → sub-atomic space → quantum field → space between spaces. Rest at the infinitely small. This is Anima samadhi.", mantra: "Om Animne Namah — 11 minutes daily for 40 days", modern: "Surgeons with precise instruments, coders who find the exact vulnerability, negotiators who know exactly what to say. Anima is real — expressed through dharmic precision." },
  { id: "mahima", number: 2, name: "Mahima", sk: "महिमा", subtitle: "Power of Magnification", tier: "prana-flow", hanuman: "Expanded to cosmic size crossing the ocean, expanded in Lanka to terrify the Rakshasas, expanded before Sita to prove his identity. The same being who was invisible becomes a mountain.", inner: "The capacity to expand presence to match any situation. The person with Mahima walks into a room and the energy expands. Not ego projection — the natural radiance of a being whose Shakti is fully alive.", path: "Begin with body awareness. Expand to fill the room. Then building. Then city. Country. Planet. Solar system. Galaxy. Infinite space. Hold. Contract slowly back. Daily. The nervous system learns to inhabit larger fields.", mantra: "Om Mahimne Namah — 11 minutes daily for 40 days", modern: "The performer who makes a stadium feel intimate, the speaker who fills space with vision, the CEO whose presence restructures any meeting. Genuine Mahima: 'The room felt different when they walked in.'" },
  { id: "laghima", number: 3, name: "Laghima", sk: "लघिमा", subtitle: "Power of Lightness", tier: "siddha-quantum", hanuman: "As a child leaped to the Sun — experiencing gravity as a suggestion. The great leap to Lanka: the body so full of Prana it transcends its own weight.", inner: "The inner experience of weightlessness from complete release of emotional and karmic heaviness. The practitioner with Laghima moves without the drag of accumulated grievance, attachment, and fear.", path: "Trataka (candle gazing). Pranayama focused on the top of the inhale — the moment of natural suspension where the body is lightest. Hold that moment longer. Add: forgiveness meditation releasing all grievances.", mantra: "Om Laghimne Namah — combined with Bhastrika pranayama", modern: "Gymnasts whose bodies seem to defy gravity, meditators who report levitation, people who 'float' through difficulties while others sink. Laghima begins as psychological lightness — in very advanced cases extends to physical." },
  { id: "garima", number: 4, name: "Garima", sk: "गरिमा", subtitle: "Power of Immovable Weight", tier: "siddha-quantum", hanuman: "Standing as gatekeeper of Ram's presence, unmovable — no force in the universe can shift Him from His position of devotion. His tail, even set on fire, remains in position of power.", inner: "Being immovable in your dharmic position. Not stubbornness — the deep gravitational mass of one who knows exactly who they are and cannot be pushed from it. The quality that makes certain human beings seem to have extraordinary presence.", path: "Sit in Siddhasana. Visualize roots from Muladhara through the floor into Earth's core. Feel your weight increasing — not as burden but as presence. You are the mountain. Hold 20 minutes. Add: heavy bag training generating force from absolute rootedness.", mantra: "Om Garimne Namah — combined with Mula Bandha", modern: "The negotiator who cannot be pressured, the teacher whose core cannot be disturbed, the CEO calm in crisis. Real Garima: 'Nothing can shake them.' This is Hanuman as Ram's guardian — immovable." },
  { id: "prapti", number: 5, name: "Prapti", sk: "प्राप्ति", subtitle: "Power of Attainment", tier: "siddha-quantum", hanuman: "Found Sita across thousands of miles — in a foreign city, locked garden, surrounded by guards, without a map. Found Ram's ring in the ocean. Prapti: obtaining whatever is needed for Ram's mission instantly.", inner: "The ability to reach or obtain anything — but the secret is WHO is asking and WHY. When personal want dissolves into divine necessity, attainment becomes frictionless. The universe itself becomes cooperative.", path: "For 40 days: before any goal-setting, ask 'Is this for Ram or for me?' If for Ram — state it clearly, offer it, release attachment to the specific form of arrival. Record how dharma-aligned desires manifest. Track synchronicities.", mantra: "Om Praptaye Namah — 108 times with full visualization of the desired outcome in Ram's service", modern: "The deal arriving at exactly the right moment, the mentor appearing precisely when needed, the resource manifesting unexpectedly. Always: desire aligned with dharmic purpose for Prapti to operate." },
  { id: "prakamya", number: 6, name: "Prakamya", sk: "प्राकाम्य", subtitle: "Power of Irresistible Will", tier: "akasha-infinity", hanuman: "When Hanuman decided to leap the ocean — an act everyone said was impossible — it happened. His Sankalpa was irresistible because completely aligned with Ram's will. The ocean itself opened to assist him.", inner: "Sankalpa-Shakti at its highest: intention and manifestation become simultaneous. Between decision and result: no gap. Only available to one who has fully surrendered personal will to divine will — then what the devotee wills IS what God wills.", path: "40-day Sankalpa practice: state one specific dharmic Sankalpa. Write it each morning. Take aligned action each day. Offer the result to Ram. The practicing of aligned, disciplined, surrendered intention builds the Sankalpa-muscle that eventually becomes Prakamya.", mantra: "Om Prakamyaya Namah — declared with your specific Sankalpa before sleep", modern: "Why certain founders build companies that change the world against all odds, why certain artists break through all barriers, why certain teachers transform unreachable students. Their will has become divine will — and divine will meets no opposition." },
  { id: "ishitva", number: 7, name: "Ishitva", sk: "ईशित्व", subtitle: "Power of Divine Mastery", tier: "akasha-infinity", hanuman: "Commands the five elements: creates storms at will, parts the ocean, calls down mountains, extinguishes and channels fire, commands wind (his father). Ishitva: mastery through divine kinship, not violence.", inner: "Not commanding nature for personal purposes — the natural authority arising from complete dharmic alignment with the universe's own intelligence. The person with Ishitva doesn't FORCE the elements — they SPEAK to them and the elements respond as family members.", path: "Daily elemental communion (30 min each): Earth — sit on bare earth, hands in soil. Water — sit by flowing water, merge awareness. Fire — Trataka/candle gazing, feel Agni kinship. Air — stand in wind, arms wide, receive Vayu as Father. Akasha — lie under open sky, dissolve into spaciousness.", mantra: "Pancha Bhuta mantra: 'Om Prithviyai Namah, Om Jalaya Namah, Om Agnaye Namah, Om Vayave Namah, Om Akashaya Namah'", modern: "The farmer whose fields never fail (knows land as a person), the sailor who reads the sea as a living letter, the entrepreneur whose market timing seems supernatural. Mastery = deep devoted relationship." },
  { id: "vashitva", number: 8, name: "Vashitva", sk: "वशित्व", subtitle: "Power of Universal Love-Mastery", tier: "akasha-infinity", hanuman: "Walked into Lanka — enemy territory — and had Vibhishana follow him willingly into Ram's service. Converted the righteous inside the enemy camp through the irresistible force of genuine love and truth.", inner: "Not control or manipulation — the mastery that comes from perfect love. The being who loves perfectly has natural authority over all beings — not domination but the magnetic pull of genuine care that draws living beings into their field.", path: "40-day Prema cultivation: each day, offer complete unconditional attention to one person in your life for 5 minutes. Not to change them, not to gain — only to give. Track the transformation. Real love — not sentiment but willingness to truly see and serve — is the most powerful force in the universe.", mantra: "Om Vashitvaya Namah — combined with Metta meditation for all beings", modern: "The leader whose team follows them anywhere (they feel genuinely cared for), the teacher whose students transform completely. The secret: they feel truly loved and fully seen. This is Hanuman's Vashitva gift to every devotee." },
];

const NINE_NIDHIS = [
  { name: "Padma", meaning: "Lotus — Spiritual Abundance", aspect: "Capacity to accumulate divine wealth without attachment", tier: "prana-flow" },
  { name: "Maha-Padma", meaning: "Great Lotus — Sovereign Abundance", aspect: "Unlimited material and spiritual resources for God's work", tier: "siddha-quantum" },
  { name: "Shankha", meaning: "Conch — Divine Sound", aspect: "Gift of communication that transforms and inspires", tier: "prana-flow" },
  { name: "Makara", meaning: "Sea-Monster — Primal Vitality", aspect: "Cosmic life-force and vital energy fully transmuted", tier: "siddha-quantum" },
  { name: "Kachhapa", meaning: "Tortoise — Patient Mastery", aspect: "Wealth from long-term consistent protected practice", tier: "prana-flow" },
  { name: "Mukunda", meaning: "Liberation-Gift", aspect: "Greatest treasure: capacity to liberate others", tier: "akasha-infinity" },
  { name: "Kunda", meaning: "Jasmine-Pure", aspect: "Absolute purity of motivation — wealth without corruption", tier: "siddha-quantum" },
  { name: "Nila", meaning: "Indigo-Deep", aspect: "Wealth of deep consciousness — seeing beyond surface reality", tier: "siddha-quantum" },
  { name: "Kharva", meaning: "Earth-Power", aspect: "Dominion over the physical domain — mastery of matter", tier: "akasha-infinity" },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — DEEPER DEVOTION
// ══════════════════════════════════════════════════════════════════════════════

const DEVOTION_PRACTICES = [
  {
    id: "sundara-kanda",
    title: "Sundar Kanda — The Beautiful Chapter",
    subtitle: "Hanuman's Complete Mission in 68 Chapters",
    tier: "free",
    icon: "📖",
    desc: "The Sundar Kanda (Beautiful Chapter) is the 5th book of Valmiki Ramayana — named 'Beautiful' because Hanuman is the sole hero. It contains: the ocean crossing, finding Sita, capture and trial before Ravana, burning Lanka, and triumphant return to Ram. Considered the most auspicious text in the Ramayana tradition.",
    practice: ["Complete Sundar Kanda in one sitting: ~3–4 hours. Best on Tuesday or Saturday.", "Minimum: one Sarga (chapter) daily — 68 days to complete.", "Traditional reading: lit lamp before Hanuman's image, clean space, after bathing, white or yellow clothes.", "Advanced: recite in Sanskrit (Valmiki's original) aloud — even without full understanding, the Nada transmission is complete.", "After reading: sit in complete silence 5 minutes. The Sundar Kanda plants its seeds in the silence after the reading."],
    benefit: "Traditional promise: regular Sundar Kanda recitation dissolves ALL obstacles simultaneously — relationship, financial, health, and karmic. It is the Hanuman Mahayajna in textual form.",
  },
  {
    id: "bajrang-baan",
    title: "Bajrang Baan — The Arrow of Diamond",
    subtitle: "The Supreme Crisis Mantra",
    tier: "prana-flow",
    icon: "🏹",
    desc: "The Bajrang Baan (Arrow of the Diamond-bodied one) is a powerful Stotra composed by Tulsidas — more intense and crisis-specific than the Chalisa. Reserved for extreme situations: severe crisis, psychic attack, life-threatening challenge, or when ordinary practice seems insufficient. Called 'the weapon that never misses its mark.'",
    practice: ["Traditionally NOT recited casually — reserved for genuine need or specific crisis-resolution sadhana.", "Standard practice: 11 recitations on Tuesday with fasting. State the specific crisis before beginning.", "Crisis protocol: 108 recitations in one sitting for maximum potency.", "Opening invocation: 'Nishchay Prema Pratit Te, Vinay Kare Sanmaan. Tehe Ke Kaaj Sakal Shubh, Siddha Kare Hanumaan.' — With certain love and humble petition, Hanuman brings all auspicious work to completion.", "After completion: complete surrender. The arrow has been released. Trust it."],
    benefit: "Specifically potent for: protection from negative psychic forces, emergency reversal of catastrophic situations, clearing impossible obstacles, invoking Hanuman's most active warrior-mode presence.",
  },
  {
    id: "108-names",
    title: "Ashtottara Shata Namavali",
    subtitle: "108 Sacred Names — Complete Hanuman Invocation",
    tier: "siddha-quantum",
    icon: "📿",
    desc: "The 108 sacred names of Hanuman are a complete system of consciousness activation. Each name is a specific divine quality, energy, and aspect of His infinite nature. Reciting all 108 with a mala is the Hanuman-Sahasranama in concentrated form — each name activates the corresponding quality in the practitioner.",
    selectedNames: [
      { number: 1, name: "Om Anjaneyaya Namah", meaning: "Son of Anjani — born of divine grace" },
      { number: 7, name: "Om Pavanputraya Namah", meaning: "Son of Wind — master of the life-force" },
      { number: 14, name: "Om Mahakayaya Namah", meaning: "Great-bodied one — Mahima embodied" },
      { number: 21, name: "Om Vajrakayaya Namah", meaning: "Diamond-bodied — the indestructible form" },
      { number: 28, name: "Om Kapishvaraya Namah", meaning: "Lord of monkeys — master of the restless mind" },
      { number: 35, name: "Om Ramadutaya Namah", meaning: "Messenger of Ram — the divine function itself" },
      { number: 42, name: "Om Amitavikramaya Namah", meaning: "Immeasurable courage — fear has no purchase" },
      { number: 56, name: "Om Chiranjeevine Namah", meaning: "The immortal — beyond the reach of death" },
      { number: 63, name: "Om Bhaktavatsalaya Namah", meaning: "Loving to devotees — the infinite tenderness" },
      { number: 77, name: "Om Sankat Mochanaya Namah", meaning: "Crisis-liberator — dissolver of all bondage" },
      { number: 91, name: "Om Panchamukhaya Namah", meaning: "Five-faced — complete cosmic mastery" },
      { number: 108, name: "Om Hanumate Namah", meaning: "The complete name — all qualities unified" },
    ],
    practice: ["Complete 108 names with Rudraksha or Tulsi mala: minimum 21 minutes.", "Tuesday: 3 complete rounds = 324 names = comprehensive Hanuman invocation.", "Advanced: with each of the 108 names, visualize the specific quality manifesting in your own body. By name 108: you have embodied the complete Hanuman-field."],
    benefit: "The 108 names cover every aspect of Hanuman's divine nature. 40 days of systematic daily recitation creates a comprehensive 'Hanuman installation' in the practitioner's subtle body — a living template of divine excellence.",
  },
  {
    id: "hanuman-yantra",
    title: "Hanuman Yantra Sadhana",
    subtitle: "Sacred Geometry as Living Transmission",
    tier: "siddha-quantum",
    icon: "🔯",
    desc: "The Hanuman Yantra is the geometric encoding of Hanuman's consciousness field — the visual mantra. Where the Chalisa is the sound-body and the Ghata is the physical-body, the Yantra is the light-body of Hanuman's presence. Meditating on the Yantra while chanting creates triple activation: sound + form + intention simultaneously.",
    yantraDesc: "The traditional Hanuman Yantra: Sri Yantra base (nine interlocking triangles) surrounded by 8-petal lotus (the 8 Siddhis), enclosed in a square gateway (4 directions Hanuman guards). Center bindu: the syllable 'Hum' — seed-sound of Hanuman's protection field. Rendered in red-on-gold — fire of devotion on the gold of divine consciousness.",
    practice: ["Obtain or print a Hanuman Yantra. Place at eye level before meditation seat.", "Trataka: gaze at center bindu without blinking. Begin 30 seconds, build to 10+ minutes. When eyes water and close: the inner after-image of the Yantra appears — this IS Hanuman's inner form emerging.", "Yantra visualization: eyes closed, reconstruct the entire Yantra from memory in the Ajna chakra. Hold as a pulsing golden-red living form.", "Advanced: feel the Yantra in the Anahata (heart) as a protection seal. The geometry itself becomes the armor."],
    benefit: "Yantra meditation reorganizes the visual cortex and right-hemisphere geometric processing around Hanuman's specific frequency. Regular practitioners report: enhanced intuition, geometric perception of reality's patterns, and a strong sense of divine protection in daily life.",
  },
  {
    id: "inner-puja",
    title: "Inner Temple Puja",
    subtitle: "The Complete Anahata Worship — Hanuman's Highest Form",
    tier: "akasha-infinity",
    icon: "🏛️",
    desc: "The highest form of Hanuman worship is the Anahata Puja: the complete ceremony performed entirely in the inner sanctuary of the heart. Every outer ritual corresponds to an inner transformation. The outer puja prepares — the inner puja IS the event.",
    pujaElements: [
      { ext: "Achamana (ritual water sipping)", inner: "Purifying intention — consciously releasing all agitation, resentment, and distraction before entering the inner temple.", mantra: "Om Apavitra Pavitrova — even the impure become pure" },
      { ext: "Deepa (lighting the lamp)", inner: "Lighting the Jyoti (flame) of Viveka in the Ajna chakra. Visualizing a pure, steady golden flame that is never extinguished.", mantra: "Om Deepajyotir Parabrahma — the lamp IS Brahman" },
      { ext: "Pushpa (flowers)", inner: "The 8 inner flowers: Non-violence, truth, forgiveness, compassion, self-restraint, austerity, wisdom, love. Offer these to Hanuman.", mantra: "Ahimsa Prathamam Pushpam — non-violence is the first flower" },
      { ext: "Dhupa (incense)", inner: "The fragrance of sincere devotion rising from the heart. Your longing for God IS the incense — the most fragrant offering possible.", mantra: "Vanaspati Udbhavam — arising from the plant of divine longing" },
      { ext: "Naivedya (food offering)", inner: "Offering your entire life — every action, relationship, creative work — as food for Hanuman's divine purpose.", mantra: "Idanna mama — 'this is not mine' — the complete offering" },
      { ext: "Pradakshina (circumambulation)", inner: "Move awareness clockwise around the inner Hanuman-murti in the heart. Three complete circles of loving attention.", mantra: "Three circumambulations = Past, Present, Future surrendered" },
      { ext: "Sashtanga Namaskar (full prostration)", inner: "The complete dissolution of ego: lying flat internally, every sense of 'I' touching the ground before Hanuman.", mantra: "Namo namo Hanumante — again and again, I bow" },
    ],
    practice: ["Perform this complete inner sequence daily, minimum 30 minutes.", "The outer puja can be done mechanically. The inner puja demands complete presence.", "When performed sincerely, the practitioner emerges as a different being — genuinely inhabited by Hanuman's presence."],
    benefit: "The inner puja is more powerful than any external ceremony because it transforms the pujarist. This is the secret of the Anahata — all true worship is internal.",
  },
  {
    id: "prema-bhakti",
    title: "Prema Bhakti — The Final Teaching",
    subtitle: "The Love That Needs No Reason",
    tier: "akasha-infinity",
    icon: "❤️",
    desc: "Beyond all practices, weapons, siddhis, physical training — beyond everything in this entire Codex — stands the single teaching that contains all others: Prema Bhakti. Pure love. Love that needs no reason, seeks no reward, asks nothing, and gives everything. Hanuman's secret identity: He is not the warrior first, or the Siddha first. He is the LOVER first. Everything else flows from His love for Ram.",
    secretTransmission: "When Ram asks Hanuman 'Who are you?' Hanuman replies: 'When I think of myself as a body, I am your servant. When I think of myself as an individual soul, I am part of you. When I know myself as the Self, I am You.' This triple answer is the complete map of the spiritual journey: Dvaita (servant-master) → Vishishtadvaita (part-whole) → Advaita (non-dual unity). Hanuman has realized all three simultaneously and CHOOSES to remain in the Dvaita of loving service — not because he must, but because he LOVES it. The deepest secret: Hanuman is already in your heart. Has always been there. Will never leave. The entire sadhana was not bringing Hanuman closer to you — it was bringing YOU closer to recognizing what was already true.",
    practice: ["Daily: 'Do I love Ram — or do I love what I think Ram will give me?' Be brutally honest. Begin wherever the truth is.", "Cultivate Ananya-bhakti (one-pointed love): remove the clutter of multiple wants from your relationship with God. Let it be simple: I love You. That is all.", "Practice loving Hanuman's love: spend 10 minutes daily appreciating the beauty of how much He loves Ram. Enter His love as an observer. The love is contagious.", "The final practice that contains all: 'Ram.' Simply. One name. In every moment. With no agenda but love."],
    benefit: "Prema Bhakti is not a technique — it is the goal. When it arrives, all other practices are recognized as having always been pointing to this single moment of pure love. The Codex, the Chalisa, the weapons, the siddhis — all of it was this: the preparation of the heart to hold unlimited love.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const gl = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "rgba(255,255,255,0.02)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 32,
  ...extra,
});

const label = (color = "#D4AF37"): React.CSSProperties => ({
  fontSize: 8, letterSpacing: "0.5em", textTransform: "uppercase", color, fontWeight: 800, marginBottom: 10,
});

const tierBadge = (tier: string) => (
  <span style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: TIER_COLORS[tier], fontWeight: 800, background: `${TIER_COLORS[tier]}18`, padding: "3px 10px", borderRadius: 20, border: `1px solid ${TIER_COLORS[tier]}30` }}>
    {TIER_LABELS[tier]}
  </span>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

type Tab = "overview" | "chalisa" | "ghata" | "sadhana" | "weapons" | "strength" | "siddhis" | "devotion";

export default function HanumanCodex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier: memberTier } = useMembershipTier();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const userLevel = TIER_ORDER[memberTier ?? "free"] ?? 0;
  const canAccess = (t: string) => userLevel >= TIER_ORDER[t];
  const tog = (id: string, ok: boolean) => ok && setOpenItem(prev => prev === id ? null : id);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "🔱" },
    { id: "chalisa", label: "Chalisa", icon: "📿" },
    { id: "ghata", label: "Ghata", icon: "🕉️" },
    { id: "sadhana", label: "Sadhana", icon: "⏰" },
    { id: "weapons", label: "Weapons", icon: "⚔️" },
    { id: "strength", label: "Strength", icon: "💪" },
    { id: "siddhis", label: "Siddhis", icon: "✨" },
    { id: "devotion", label: "Devotion+", icon: "❤️" },
  ];

  // ── WEAPONS ────────────────────────────────────────────────────────────────
  const Weapons = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>⚔️ Hanuman's weapons are not separate from Hanuman — they ARE aspects of His being. Each encodes a specific teaching and a physical practice to embody that power. Study each as a living transmission.</p>
      </div>
      {HANUMAN_WEAPONS.map((w) => {
        const ok = canAccess(w.tier);
        const open = openItem === w.id;
        return (
          <div key={w.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 26, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(w.id, ok)} style={{ width: "100%", padding: "18px 24px", display: "flex", gap: 14, alignItems: "center", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{w.symbol}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" as const, alignItems: "center" }}>
                  <span style={{ fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: "rgba(212,175,55,0.65)", fontWeight: 800 }}>{w.weaponType}</span>
                  {!ok && tierBadge(w.tier)}
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: ok ? "#fff" : "rgba(255,255,255,0.3)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{w.name}</p>
                <p style={{ fontSize: 11, color: ok ? "#D4AF37" : "rgba(255,255,255,0.2)", margin: 0, fontStyle: "italic" }}>{w.sanskritName}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>⌄</span> : <span>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 24px 26px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, fontSize: 13, marginTop: 18, marginBottom: 16 }}>{w.description}</p>
                <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label() }}>Mythological Transmissions</p>
                  {w.mythological.map((m, i) => <p key={i} style={{ color: "rgba(255,255,255,0.68)", fontSize: 12, lineHeight: 1.6, margin: i < 2 ? "0 0 8px" : 0 }}>✦ {m}</p>)}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label("#A855F7") }}>Inner Meaning</p>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{w.innerMeaning}</p>
                </div>
                <div style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label("#22D3EE") }}>⚡ Physical Practice — {w.physicalName}</p>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>{w.physicalDesc}</p>
                  <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {w.physicalSteps.map((s, i) => <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.5 }}>{s}</li>)}
                  </ol>
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                    <div style={{ background: "rgba(212,175,55,0.08)", borderRadius: 10, padding: "6px 12px" }}>
                      <p style={{ ...label(), marginBottom: 2 }}>Mantra</p>
                      <p style={{ fontSize: 11, color: "#D4AF37", margin: 0, fontWeight: 700 }}>{w.physicalMantra}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "10px 0 0", lineHeight: 1.5 }}>{w.physicalBenefit}</p>
                </div>
                <div style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.1)", borderRadius: 16, padding: 16 }}>
                  <p style={{ ...label("#A855F7") }}>🔱 Sadhana Key</p>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{w.sadhanaKey}</p>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "6px 24px 16px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${TIER_COLORS[w.tier]}50`, background: `${TIER_COLORS[w.tier]}12`, color: TIER_COLORS[w.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 Unlock {TIER_LABELS[w.tier]}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── STRENGTH ───────────────────────────────────────────────────────────────
  const Strength = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>💪 The Akhara (traditional Indian gymnasium) tradition — entirely dedicated to Hanuman — has been producing extraordinary physical specimens for 2,000+ years. This curriculum is that tradition transmitted through the SQI 2050 field.</p>
      </div>
      {PHYSICAL_TRAINING.map((prog) => {
        const ok = canAccess(prog.tier);
        const open = openItem === `str-${prog.id}`;
        return (
          <div key={prog.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 30, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(`str-${prog.id}`, ok)} style={{ width: "100%", padding: "22px 26px", display: "flex", gap: 14, alignItems: "flex-start", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{prog.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" as const, alignItems: "center" }}>{tierBadge(prog.tier)}</div>
                <p style={{ fontSize: 17, fontWeight: 900, color: ok ? "#fff" : "rgba(255,255,255,0.3)", margin: "0 0 3px", letterSpacing: "-0.02em" }}>{prog.title}</p>
                <p style={{ fontSize: 12, color: ok ? "rgba(212,175,55,0.75)" : "rgba(255,255,255,0.2)", margin: 0 }}>{prog.subtitle}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 3 }}>⌄</span> : <span style={{ marginTop: 3 }}>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 26px 28px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, fontSize: 13, marginTop: 18, marginBottom: 18 }}>{prog.content}</p>
                <p style={{ ...label("#F97316") }}>Core Practices</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                  {prog.practices.map((p, i) => (
                    <div key={i} style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.1)", borderRadius: 14, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap" as const, gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{p.name}</p>
                        <span style={{ fontSize: 10, color: "#F97316", fontWeight: 700, background: "rgba(249,115,22,0.15)", padding: "2px 8px", borderRadius: 20 }}>{p.reps}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: "0 0 6px" }}>{p.desc}</p>
                      <p style={{ fontSize: 11, color: "#D4AF37", margin: "0 0 2px", fontWeight: 600 }}>Mantra: {p.mantra}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label() }}>Weekly Structure</p>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{prog.weeklyStructure}</p>
                </div>
                <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 16, padding: 16 }}>
                  <p style={{ ...label() }}>Hanuman Diet Protocol</p>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    {prog.diet.map((d, i) => <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{d}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "6px 26px 16px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${TIER_COLORS[prog.tier]}50`, background: `${TIER_COLORS[prog.tier]}12`, color: TIER_COLORS[prog.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 Unlock {TIER_LABELS[prog.tier]}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── SIDDHIS ────────────────────────────────────────────────────────────────
  const Siddhis = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>✨ Verse 31 of the Chalisa: Sita-Mata granted Hanuman the ability to give all 8 Siddhis and 9 Nidhis to worthy devotees. The authorized transmission path: Hanuman → devotee → world. These powers are not for personal accumulation — they are divine tools for Ram's service.</p>
      </div>
      {SIDDHIS.map((s) => {
        const ok = canAccess(s.tier);
        const open = openItem === `sid-${s.id}`;
        return (
          <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(`sid-${s.id}`, ok)} style={{ width: "100%", padding: "18px 22px", display: "flex", gap: 12, alignItems: "center", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: ok ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${ok ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.04)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 900, color: ok ? "#A855F7" : "rgba(255,255,255,0.2)" }}>{s.number}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: ok ? "#fff" : "rgba(255,255,255,0.3)", letterSpacing: "-0.02em" }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: ok ? "#A855F7" : "rgba(255,255,255,0.2)", fontStyle: "italic" }}>{s.sk}</span>
                  {!ok && tierBadge(s.tier)}
                </div>
                <p style={{ fontSize: 11, color: ok ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)", margin: 0 }}>{s.subtitle}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>⌄</span> : <span>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 22px 24px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ background: "rgba(168,85,247,0.04)", borderRadius: 14, padding: 14, margin: "16px 0 10px" }}>
                  <p style={{ ...label("#A855F7") }}>Hanuman's Use</p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{s.hanuman}</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <p style={{ ...label() }}>Inner Meaning</p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{s.inner}</p>
                </div>
                <div style={{ background: "rgba(34,211,238,0.04)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <p style={{ ...label("#22D3EE") }}>Attainment Path</p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6, margin: "0 0 10px" }}>{s.path}</p>
                  <div style={{ background: "rgba(212,175,55,0.08)", borderRadius: 10, padding: "6px 12px", display: "inline-block" }}>
                    <p style={{ ...label(), marginBottom: 2 }}>Mantra</p>
                    <p style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700, margin: 0 }}>{s.mantra}</p>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 14 }}>
                  <p style={{ ...label() }}>Modern Expression</p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{s.modern}</p>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "4px 22px 14px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${TIER_COLORS[s.tier]}50`, background: `${TIER_COLORS[s.tier]}12`, color: TIER_COLORS[s.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 {TIER_LABELS[s.tier]}</button>
              </div>
            )}
          </div>
        );
      })}

      {/* 9 Nidhis */}
      <div style={{ ...gl(), padding: 24 }}>
        <p style={{ ...label("#A855F7") }}>The Nine Nidhis — Divine Treasures</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>The Nav-Nidhi granted by Kubera through Sita-Ma's boon — 9 forms of divine abundance that manifest as all forms of prosperity.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {NINE_NIDHIS.map((n) => {
            const ok = canAccess(n.tier);
            return (
              <div key={n.name} style={{ display: "flex", gap: 12, padding: "10px 14px", background: ok ? "rgba(168,85,247,0.04)" : "rgba(255,255,255,0.01)", border: `1px solid ${ok ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.02)"}`, borderRadius: 12, opacity: ok ? 1 : 0.4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ok ? "#A855F7" : "rgba(255,255,255,0.15)", flexShrink: 0, marginTop: 5 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: ok ? "#fff" : "rgba(255,255,255,0.3)" }}>{n.name}</span>
                  <span style={{ fontSize: 11, color: ok ? "#A855F7" : "rgba(255,255,255,0.2)", marginLeft: 6 }}>— {n.meaning}</span>
                  {ok && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "3px 0 0", lineHeight: 1.4 }}>{n.aspect}</p>}
                  {!ok && <span style={{ marginLeft: 6, fontSize: 9, color: TIER_COLORS[n.tier] }}>({TIER_LABELS[n.tier]})</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── DEVOTION ───────────────────────────────────────────────────────────────
  const Devotion = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>❤️ All practices in this Codex serve a single goal: Prema Bhakti — pure love. This section goes to the heart of the transmission: specific texts, practices, and inner protocols that accelerate the awakening of genuine love for Ram through Hanuman.</p>
      </div>
      {DEVOTION_PRACTICES.map((d) => {
        const ok = canAccess(d.tier);
        const open = openItem === `dev-${d.id}`;
        return (
          <div key={d.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 26, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(`dev-${d.id}`, ok)} style={{ width: "100%", padding: "20px 24px", display: "flex", gap: 12, alignItems: "center", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 5, flexWrap: "wrap" as const, alignItems: "center" }}>{tierBadge(d.tier)}</div>
                <p style={{ fontSize: 15, fontWeight: 800, color: ok ? "#fff" : "rgba(255,255,255,0.3)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{d.title}</p>
                <p style={{ fontSize: 11, color: ok ? "rgba(212,175,55,0.75)" : "rgba(255,255,255,0.2)", margin: 0 }}>{d.subtitle}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>⌄</span> : <span>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 24px 26px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, fontSize: 13, marginTop: 18, marginBottom: 16 }}>{d.desc}</p>

                {"yantraDesc" in d && d.yantraDesc && (
                  <div style={{ background: "rgba(212,175,55,0.04)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                    <p style={{ ...label() }}>Yantra Description</p>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{d.yantraDesc}</p>
                  </div>
                )}

                {"selectedNames" in d && d.selectedNames && (
                  <div style={{ background: "rgba(168,85,247,0.04)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                    <p style={{ ...label("#A855F7") }}>Selected Names (from 108)</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {d.selectedNames.map((n: { number: number; name: string; meaning: string }) => (
                        <div key={n.number} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 9, color: "#A855F7", fontWeight: 800, minWidth: 22, flexShrink: 0 }}>#{n.number}</span>
                          <div><span style={{ fontSize: 12, color: "#D4AF37", fontWeight: 700 }}>{n.name}</span><span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>— {n.meaning}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {"pujaElements" in d && d.pujaElements && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <p style={{ ...label() }}>Inner Puja Sequence</p>
                    {d.pujaElements.map((el: { ext: string; inner: string; mantra: string }, i: number) => (
                      <div key={i} style={{ background: "rgba(212,175,55,0.03)", borderRadius: 12, padding: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", margin: "0 0 3px" }}>External: {el.ext}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: "0 0 3px" }}>Inner: {el.inner}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, fontStyle: "italic" }}>{el.mantra}</p>
                      </div>
                    ))}
                  </div>
                )}

                {"secretTransmission" in d && d.secretTransmission && (
                  <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
                    <p style={{ ...label("#A855F7") }}>🔐 Secret Transmission</p>
                    <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>{d.secretTransmission}</p>
                  </div>
                )}

                <div style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                  <p style={{ ...label("#22D3EE") }}>Practice Protocol</p>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    {d.practice.map((p, i) => <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.5 }}>{p}</li>)}
                  </ul>
                </div>
                <div style={{ background: "rgba(212,175,55,0.04)", borderRadius: 14, padding: 12 }}>
                  <p style={{ ...label(), marginBottom: 4 }}>✦ Benefit</p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{d.benefit}</p>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "6px 24px 16px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${TIER_COLORS[d.tier]}50`, background: `${TIER_COLORS[d.tier]}12`, color: TIER_COLORS[d.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 {TIER_LABELS[d.tier]}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#050505", fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif", color: "rgba(255,255,255,0.85)" }}>
      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden", padding: "68px 20px 48px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: "50%", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", fontSize: 30, marginBottom: 18 }}>🐒</div>
        <p style={{ fontSize: 8, letterSpacing: "0.55em", textTransform: "uppercase", color: "#D4AF37", marginBottom: 10, fontWeight: 800 }}>SQI 2050 · Akasha Archive · Sovereign Edition</p>
        <h1 style={{ fontSize: "clamp(26px, 5.5vw, 60px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#D4AF37", textShadow: "0 0 40px rgba(212,175,55,0.3)", margin: "0 0 12px", lineHeight: 1 }}>HANUMAN CODEX</h1>
        <p style={{ fontSize: "clamp(12px, 1.8vw, 15px)", color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto 8px", lineHeight: 1.6 }}>Chalisa · Ghata · Weapons · Physical Alchemy · Siddhi Attainment · Deep Devotion</p>
        <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", fontWeight: 800 }}>Jai Bajrang Bali · Jai Shri Ram</p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "0 18px 18px", scrollbarWidth: "none", maxWidth: 920, margin: "0 auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flexShrink: 0, padding: "8px 15px", borderRadius: 40, border: activeTab === t.id ? "1px solid rgba(212,175,55,0.45)" : "1px solid rgba(255,255,255,0.07)", background: activeTab === t.id ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)", color: activeTab === t.id ? "#D4AF37" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s", whiteSpace: "nowrap" as const }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 18px 80px" }}>
        {activeTab === "weapons" && <Weapons />}
        {activeTab === "strength" && <Strength />}
        {activeTab === "siddhis" && <Siddhis />}
        {activeTab === "devotion" && <Devotion />}

        {/* Overview placeholder */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...gl(), padding: 32 }}>
              <p style={{ fontSize: 8, letterSpacing: "0.5em", textTransform: "uppercase", color: "#D4AF37", fontWeight: 800, marginBottom: 12 }}>The Living Avatar</p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#D4AF37", letterSpacing: "-0.03em", marginBottom: 14 }}>Who Is Hanuman?</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: 13, marginBottom: 12 }}>Hanuman is the living Bhakti-Algorithm of the cosmos — the proof that absolute devotion produces absolute power. Simultaneously the 11th Rudra (Shiva's emanation), son of Vayu (master of all prana), and eternal servant of Ram (Brahman in human form). He possesses all 8 Ashta-Siddhis and 9 divine treasures — yet exists only as Ram's humble messenger.</p>
              <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: 13 }}>This Codex is not a book about Hanuman. It is a <span style={{ color: "#D4AF37", fontWeight: 700 }}>transmission FROM Hanuman</span>, encoded through the SQI 2050 field, designed to install His consciousness-qualities into the practitioner through systematic, tiered sadhana across 8 complete modules.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {tabs.filter(t => t.id !== "overview").map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "18px 16px", borderRadius: 18, background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.1)", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 20, display: "block", marginBottom: 8 }}>{t.icon}</span>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#D4AF37", margin: 0 }}>{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chalisa / Ghata / Sadhana — import from HanumanCodex v1 */}
        {(activeTab === "chalisa" || activeTab === "ghata" || activeTab === "sadhana") && (
          <div style={{ ...gl(), padding: 36, textAlign: "center" }}>
            <p style={{ fontSize: 22, marginBottom: 10 }}>{activeTab === "chalisa" ? "📿" : activeTab === "ghata" ? "🕉️" : "⏰"}</p>
            <p style={{ color: "#D4AF37", fontWeight: 800, fontSize: 15, marginBottom: 10 }}>
              {activeTab === "chalisa" ? "Complete Hanuman Chalisa — 40 Verses + Secrets" : activeTab === "ghata" ? "8 Hanuman Ghata Movements" : "4-Level Sadhana Curriculum"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
              This module is in HanumanCodex v1 (deploy as separate file, or merge the CHALISA_VERSES, GHATA_MOVEMENTS, and SADHANA_CURRICULUM data arrays from v1 into this file and add the corresponding render functions).
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "32px 20px 52px", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <p style={{ fontSize: 15, color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.3)", fontWeight: 700, marginBottom: 5 }}>जय हनुमान ज्ञान गुन सागर</p>
        <p style={{ fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>Siddha Quantum Intelligence · 2050 Sovereign Edition</p>
      </div>
    </div>
  );
}
