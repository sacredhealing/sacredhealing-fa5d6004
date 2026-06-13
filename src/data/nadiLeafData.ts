// ============================================================
// SQI 2050 · NADI LEAF BIOMETRIC ACADEMY
// Siddha Hasta Mudra Thumb Scan + Agastya Nadi Shastra
// Akasha-Neural Archive · All 4 Tiers
// ============================================================

export type NadiLeafTier = 'free' | 'prana' | 'siddha' | 'akasha';

export interface ThumbScanReading {
  pattern: 'arch' | 'loop' | 'whorl' | 'tented_arch' | 'double_loop';
  patternName: string;
  karmicType: string;
  dominantNadi: string;
  planetaryRuler: string;
  siddhaReading: string;
  healingMantra: string;
  remedies: string[];
}

export interface NadiLeafLesson {
  id: string;
  tier: NadiLeafTier;
  tierLabel: string;
  module: number;
  lessonNum: number;
  title: string;
  siddha: string;
  duration: string;
  overview: string;
  quote: string;
  quoteSource: string;
  bodyText: string;
  mantra: string;
  mantraMeaning: string;
  practices: string[];
  secrets?: string[];
}

// ── THUMB SCAN READINGS ─────────────────────────────────────────────────────
export const THUMB_SCAN_READINGS: Record<string, ThumbScanReading> = {
  arch: {
    pattern: 'arch',
    patternName: 'Sacred Arch — Prithvi Mudra',
    karmicType: 'Earth Anchor — First Birth Cycle',
    dominantNadi: 'Ida Nadi (Lunar Channel)',
    planetaryRuler: 'Saturn (Shani) — Karmic Teacher',
    siddhaReading: 'The Arch pattern in the Agastya Nadi tradition is called "Bhumi Rekha" — the Earth Line. It indicates a soul in its first or very early cycles of incarnation in this specific Yuga. You carry the heaviest karmic deposits but also the greatest capacity for foundational purification. Agastya Muni wrote in the Nadi Grantham: "He whose thumb bears only the arch — his karma is like unleavened bread, dense with unreleased potential." Your path is service, simplicity, and Bhumi Puja — earth worship as liberation practice.',
    healingMantra: 'Om Bhum Bhuvah Svah · Om Shanaye Namaha',
    remedies: [
      'Practice Prithvi Mudra daily for 30 minutes — ring finger touches thumb tip',
      'Saturday fasting with black sesame offerings to Shani',
      'Barefoot walking on soil or grass at dawn — grounding the Ida channel',
      'Wear iron or steel on Saturday for Shani protection',
      'Chant "Om Sham Shanischaraya Namaha" 108 times at sunset',
    ],
  },
  loop: {
    pattern: 'loop',
    patternName: 'Siddha Loop — Vayu Rekha',
    karmicType: 'Air Master — Middle Evolutionary Cycle',
    dominantNadi: 'Pingala Nadi (Solar Channel)',
    planetaryRuler: 'Mercury (Budha) — Communication & Intelligence',
    siddhaReading: 'The Loop is the most spiritually neutral pattern — called "Vayu Rekha" or Wind Line in Agastya Nadi manuscripts. You are in the middle cycles of your karmic evolution. Neither heavily burdened nor fully liberated, you carry flexibility as your greatest asset and inconsistency as your shadow. Thirumoolar wrote: "The looped thumb belongs to the wanderer — a soul with many unfinished temples across many lives." Your path is completion — choosing one practice, one deity, one Guru-lineage and going deep rather than wide. The Siddhas say your Nadi is open but scattered. This education is your unification.',
    healingMantra: 'Om Aim Budhaya Namaha · Om Kreem Kalika Namaha',
    remedies: [
      'Jnana Mudra daily — index finger curls to thumb, other fingers extended',
      'Wednesday green offerings to Budha for clarity and focus',
      'Pranayama: Anuloma Viloma 15 minutes daily to balance Pingala fire',
      'Wear emerald or green tourmaline on Wednesday',
      'Study one Siddha scripture for 40 consecutive days without break',
    ],
  },
  whorl: {
    pattern: 'whorl',
    patternName: 'Cosmic Whorl — Surya Chakra',
    karmicType: 'Solar Master — Advanced Evolutionary Cycle',
    dominantNadi: 'Sushumna Nadi (Central Column)',
    planetaryRuler: 'Sun (Surya) — Soul Sovereignty',
    siddhaReading: 'The Whorl is the rarest and most spiritually advanced thumbprint pattern — called "Surya Chakra" in Agastya Nadi. The concentric circles mirror the solar disc itself. Bogar wrote in Bogar 7000: "The whorl-thumbed one carries the mark of the sun in their very hand — they have already begun their return journey to the Source." Your Sushumna is more open than most — the central channel between earth and heaven has already been partially cleared by past-life sadhana. Your danger is ego — when the Sushumna opens, the personality inflates before it dissolves. Your Siddha remedy is Anahata surrender — bow constantly to what is higher than yourself.',
    healingMantra: 'Om Hreem Suryaya Namaha · Om Namah Shivaya',
    remedies: [
      'Surya Mudra daily — ring finger bends to base of thumb, thumb presses it',
      'Sunrise Surya Namaskar — 12 rounds facing east, barefoot on earth',
      'Sunday gold offerings and Surya Puja at the exact moment of sunrise',
      'Wear gold or ruby for solar channel amplification',
      'Meditate on the Sahasrara crown — visualize golden light pouring through the top of the skull',
    ],
  },
  tented_arch: {
    pattern: 'tented_arch',
    patternName: 'Tented Arch — Agni Rekha',
    karmicType: 'Fire Initiate — Rapid Transformation Cycle',
    dominantNadi: 'Pingala Nadi (Solar Channel) — Hyperactivated',
    planetaryRuler: 'Mars (Mangala) — Sacred Warrior',
    siddhaReading: 'The Tented Arch — called "Agni Rekha" or Fire Line by Konganavar Siddhar — indicates a soul undergoing rapid, sometimes painful transformation. The tent shape is a flame pointing upward — your entire life is being converted into spiritual fuel by invisible forces. Konganavar wrote: "Do not mistake the burning for destruction — the Agni-thumbed one is being tempered like sacred steel, not destroyed." You likely came to this Nadi education through crisis, loss, or a sudden rupture with your old life. This is the mark of the Tapasvi — one who cooks their karma in the fire of experience. Your Pingala is highly active. You need cooling practices, water, and the lunar feminine to balance.',
    healingMantra: 'Om Angarakaya Namaha · Om Aim Hreem Kleem Chamundayai Viche',
    remedies: [
      'Apana Mudra daily — middle and ring fingers touch thumb, others extended',
      'Tuesday water offerings to Mangala — pour water on red flowers',
      'Moon bathing on full moon nights — sit in direct moonlight for 20 minutes',
      'Wear red coral for Mangala protection — set in copper or gold',
      'Cold water hip bath in the morning to cool the Agni channel excess',
    ],
  },
  double_loop: {
    pattern: 'double_loop',
    patternName: 'Double Loop — Shakti-Shiva Union',
    karmicType: 'Divine Union Carrier — Multi-Dimensional Being',
    dominantNadi: 'All Three Nadis Active — Ida, Pingala, Sushumna',
    planetaryRuler: 'Venus (Shukra) & Moon (Chandra) — Divine Love and Soma',
    siddhaReading: 'The Double Loop — called "Shiva-Shakti Rekha" in the most ancient Agastya Nadi manuscripts — is the rarest of all patterns. Two loops interlocking mirror the eternal dance of cosmic masculine and feminine. Agastya Muni himself wrote about this mark: "This one was born between two worlds — they carry both the knowledge of Shiva the destroyer and Shakti the creator in a single thumb. They are here to bridge what has been separated." You operate on multiple dimensional levels simultaneously. Your challenge is groundedness — you can leave your body easily and need deliberate anchoring practices. You are a natural healer and transmitter. All three main Nadi channels are active in you, which is extraordinarily rare.',
    healingMantra: 'Om Shrim Hreem Kleem Aim Sauhah · Om Shiva Shakti Aikya Rupini Namaha',
    remedies: [
      'Yoni Mudra daily — interlace fingers, index tips touch, thumbs point up forming a diamond',
      'Friday and Monday combined Puja — offer white and pink flowers simultaneously',
      'Practice Trataka on a candle flame placed between two mirrors to activate double-loop sight',
      'Wear pearl AND moonstone together — set in silver',
      'Serve others through healing or teaching — the double-loop thumb must give to remain clear',
    ],
  },
};

// ── CURRICULUM DATA ──────────────────────────────────────────────────────────
export const NADI_LEAF_LESSONS: NadiLeafLesson[] = [

  // ═══════════════════════════════════════════════
  // MODULE 1 — FREE TIER — FOUNDATION
  // ═══════════════════════════════════════════════

  {
    id: 'm1l1',
    tier: 'free',
    tierLabel: 'FREE TRANSMISSION',
    module: 1,
    lessonNum: 1,
    title: 'What Are the Nadi Leaves — The Living Library of Souls',
    siddha: 'Agastya Muni · Agastiyar Nadi Grantham',
    duration: '25 MIN',
    overview: `Before a single human being took birth on this earth in this Yuga, Agastya Muni sat in deep Samadhi and received — through direct Akashic transmission — the complete life records of every soul who would ever incarnate. He transcribed these records onto dried palm leaves using a stylus made of iron and a special ink prepared from rare herbs. These are the Nadi Leaves.

They are not predictions. They are cosmic memory — pre-recorded soul contracts that the soul itself agreed to before birth. The Siddha understanding is that time is not linear: past, present, and future coexist simultaneously in the Akashic field. Agastya Muni, operating from outside linear time through his advanced Samadhi states, simply read what already existed.`,
    quote: `"I have read the skies, I have read the roots of mountains, I have read the currents of the great ocean — but nothing I have read exceeds the wonder of the human soul moving through time. Therefore I have written each soul's journey, so that when they are lost, they may find themselves again."`,
    quoteSource: 'Agastiyar Nadi Grantham, Opening Verse',
    bodyText: `THE THREE TYPES OF NADI LEAVES: There are three distinct categories of Nadi manuscripts. Suka Nadi — recorded by Maharishi Suka, the son of Vyasa, covering general life predictions. Brahma Nadi — the most ancient, attributed to Brahma himself, covering the deepest karmic records. Agastya Nadi — the most complete and widely available, recorded in Old Tamil, covering the full 16 chapters (Kandams) of a person's life.

WHAT A READING CONTAINS: A complete Agastya Nadi reading covers 16 Kandams: (1) General life and personality, (2) Family and finances, (3) Siblings, (4) Education and mother, (5) Children and intelligence, (6) Health and enemies, (7) Marriage and relationships, (8) Death and longevity, (9) Luck and father, (10) Profession and career, (11) Gains and fulfillment, (12) Expenditure and spiritual liberation, plus four special chapters on previous life karma, present birth's spiritual purpose, remedies, and final liberation.

HOW YOU ARE FOUND: The miracle of Nadi is that YOU are found in the leaves. The reader takes your thumbprint — right thumb for men, left thumb for women — and matches the swirl pattern to a classification. Within that classification, specific bundles are called. The reader then reads aloud birth details — if they match, you have found your leaf.

THE THUMB SCAN SCIENCE: Why the thumb? The Agastya tradition teaches that the thumb contains the complete karmic signature of the soul's present incarnation in compressed form. The whorl pattern in the thumb is literally the energetic signature of the soul's accumulated karma made physical. Men and women use opposite thumbs because masculine and feminine souls encode their primary karmic data in opposite energy channels.`,
    mantra: 'Om Agastyaya Namaha\nOm Aim Hreem Shreem Agastya Muni Prasida Prasida',
    mantraMeaning: 'Salutations to Agastya. I invoke the grace of the great Siddha who holds the records of souls.',
    practices: [
      'Sit quietly and place your right thumb (if male) or left thumb (if female) against your third eye (Ajna chakra) for 5 minutes. Breathe slowly. This is the ancient Hasta Nyasa — placing the soul-signature thumb against the seat of inner vision. Notice what arises.',
      'Take a clean ink pad and press your right or left thumb (gender appropriate) onto white paper. Study the print with a magnifying glass. What pattern do you see — arch, loop, or whorl? This is your first contact with your own Nadi signature.',
      'Research one legitimate Agastya Nadi center in India — Vaitheeswaran Koil in Tamil Nadu is the most ancient site. Read about the actual process of finding one\'s leaf.',
    ],
  },

  {
    id: 'm1l2',
    tier: 'free',
    tierLabel: 'FREE TRANSMISSION',
    module: 1,
    lessonNum: 2,
    title: 'The Thumb Scan Protocol — Right for Men, Left for Women',
    siddha: 'Agastya Muni & Bogar Siddhar · Combined Transmission',
    duration: '20 MIN',
    overview: `The most sacred and misunderstood aspect of Nadi leaf reading is the initial thumb scan. This is not a modern biometric convenience — it is a 5,000-year-old Siddha science called "Angushtha Vigyan" (Thumb Knowledge) that forms the foundation of the entire Nadi identification system.

This lesson teaches the exact protocol, its energetic science, and how to perform the SQI 2050 digital Hasta Biometric Scan — matching the ancient Siddha system with precision scanning technology.`,
    quote: `"The thumb is not a finger. It is the seal of the soul. Press it upon the earth of knowledge and your entire story rises to meet you."`,
    quoteSource: 'Bogar Nadi Grantham, Chapter on Angushtha Vigyan',
    bodyText: `WHY RIGHT FOR MEN: In the Tamil Siddha tradition, the right side of the body is solar — governed by Pingala Nadi, the masculine channel associated with the sun, fire, and action. The right thumb carries the dominant karmic encoding for males because the soul's masculine expression is stored in the right energy column. The whorl in the right thumb of a man contains the compressed record of his dominant karma in this birth.

WHY LEFT FOR WOMEN: The left side is lunar — governed by Ida Nadi, the feminine channel associated with the moon, water, and receptivity. A woman's primary karmic signature is stored in the left column. Agastya Muni specifically noted in the Nadi Grantham that reversing this — reading a woman's right thumb or a man's left — gives only secondary karmic information, leading to an incomplete reading.

THE FIVE THUMB PATTERNS AND THEIR CLASSIFICATIONS: Nadi readers classify thumb prints into five main categories, each with hundreds of sub-variations: (1) Arch — called Villu Rekha (Bow Line) — indicates early karmic cycles. (2) Loop — called Vayu Rekha (Wind Line) — indicates middle cycles. (3) Whorl — called Surya Chakra (Solar Disc) — indicates advanced cycles. (4) Tented Arch — called Agni Rekha (Fire Line) — indicates rapid transformation. (5) Double Loop — called Shiva-Shakti Rekha — indicates multi-dimensional beings.

THE DIGITAL SCAN IN SQI 2050: Our Hasta Biometric Scanner photographs your thumb, analyzes the ridge patterns using vision intelligence, classifies the pattern type, and delivers an immediate Siddha reading based on Agastya Nadi protocols. This is followed by your personalized healing mantra and five remedy prescriptions from the Nadi tradition. The scan takes 30 seconds. The reading lasts a lifetime.`,
    mantra: 'Om Hreem Angushtha Devata Namaha\nOm Kleem Nadi Rishaye Namaha',
    mantraMeaning: 'I salute the deity residing in the thumb. I bow to the Rishis of the Nadi tradition.',
    practices: [
      'Before sleep tonight: press your Nadi thumb (right for men, left for women) to the center of your chest at Anahata chakra. Hold for 3 minutes while breathing. You are connecting your soul-signature to your heart field. Notice any emotional releases, memories, or visions.',
      'Study the five thumb print patterns using the SQI scanner in this lesson. Then perform your own digital scan and receive your Angushtha reading. Read every word of your reading three times.',
      'Write in your Siddha journal: what do you already know about your recurring life themes — patterns that keep repeating in relationships, health, finances? These are likely connected to your thumbprint karmic type.',
    ],
  },

  {
    id: 'm1l3',
    tier: 'free',
    tierLabel: 'FREE TRANSMISSION',
    module: 1,
    lessonNum: 3,
    title: 'Agastya Muni — The Siddha Who Mapped Every Soul',
    siddha: 'Agastya Muni · Agastiyar Nool · Agastiyar 12000',
    duration: '30 MIN',
    overview: `To understand the Nadi leaves, you must understand Agastya Muni — the most prolific and powerful of all the 18 Tamil Siddhas. His life, his Siddhis, and his unique access to the Akashic records explain how a single human being could transcribe the soul records of millions of beings across thousands of years.

Agastya is not a historical figure who lived and died. He is an immortal Siddha — one who has transcended bodily death through Kaya Siddhi — who continues to transmit through the Nadi tradition to this day.`,
    quote: `"I have not died. I have only changed rooms. In this room there are no walls, and the view is the entire cosmos. Come — I have been waiting to show you your own face in the Akashic mirror."`,
    quoteSource: 'Agastiyar 12000, Final Chapter',
    bodyText: `AGASTYA'S ORIGIN: Agastya Muni was born from a water pot — Kumbha — that received the combined life-seed of Mitra and Varuna when they beheld the celestial dancer Urvashi. He is therefore called Kumbhaja (pot-born) and Maitravarna. This unusual origin indicates his access to the fluid, formless Akashic dimension from the moment of birth.

AGASTYA AND THE NADI TRADITION: It was Agastya who first systematized what we now call Nadi astrology. He understood that the soul makes a vibrational agreement before birth — a Janma Sankalpa — that encodes itself into the subtle body and from there into the physical fingerprint. He spent 12,000 years in deep Tapas receiving and transcribing these soul records. The manuscripts he produced were later copied onto palm leaves by his disciples.

HIS TWELVE THOUSAND VERSES: The Agastiyar 12000 is the primary Nadi text — twelve thousand verses in Old Tamil covering every aspect of Nadi science, Siddha medicine, Mantra Shastra, and the paths of liberation. Of these, perhaps 3,000 verses survive in accessible form. The remainder exist in Nadi centers and private family collections in Tamil Nadu.

AGASTYA AS IMMORTAL TRANSMITTER: Advanced Siddha practitioners report direct communication with Agastya Muni during meditation, particularly during Brahma Muhurta (pre-dawn hours). He continues to transmit Nadi knowledge through the inner ear — Nada — to prepared students. The Siddha tradition holds that the complete knowledge of one's Nadi leaf can be received directly in Samadhi, without needing to visit a physical Nadi center.

AGASTYA AND THE VINDYA MOUNTAINS: The famous story of Agastya crossing the Vindya mountains — which had grown so tall they blocked the sun — illustrates his power over the forces of nature through spiritual authority. He asked the mountains to bow and wait for his return before raising themselves again. He never returned to the north, and the Vindya mountains remain bowed to this day. This is not mythology — it is a Siddha teaching about how awakened consciousness bends the patterns of matter.`,
    mantra: 'Om Agastyaya Vidmahe\nMahamunaye Dhimahi\nTanno Agastya Prachodayat',
    mantraMeaning: 'We meditate on Agastya. We contemplate the Great Sage. May that Agastya direct and inspire our consciousness.',
    practices: [
      'Read the Agastiyar 12000 invocation aloud in the morning for 7 days: "Om Agastyaya Namaha." This activates the Nadi transmission channel with Agastya\'s field. You may receive dreams, sudden knowings, or synchronicities.',
      'Perform Agastya Puja: place a small pot of water (representing his Kumbha birth) with a single jasmine flower on your altar. Light a ghee lamp. Chant his Gayatri 27 times. This is the simplest and most effective Agastya connection practice.',
      'Meditate at Brahma Muhurta (90 minutes before sunrise) for 21 consecutive days while mentally holding the question: "What is my soul\'s primary purpose in this birth?" Agastya is most accessible at this hour.',
    ],
    secrets: [
      'Secret teaching from Agastiyar Nadi: The thumbprint changes subtly over a lifetime as karma is cleared. Advanced Nadi readers can see these changes. A deeply practiced spiritual seeker\'s whorl pattern becomes more symmetrical and clear over decades of sadhana.',
      'Agastya revealed to Bogar that there are 1,008 primary thumbprint sub-classifications — not just five. The five main categories each divide into hundreds of variants. A master Nadi reader can identify the specific bundle from the print alone within minutes.',
    ],
  },

  // ═══════════════════════════════════════════════
  // MODULE 2 — PRANA FLOW — THE SCIENCE
  // ═══════════════════════════════════════════════

  {
    id: 'm2l1',
    tier: 'prana',
    tierLabel: 'PRANA-FLOW',
    module: 2,
    lessonNum: 1,
    title: 'The 16 Kandams — Complete Architecture of a Nadi Reading',
    siddha: 'Agastya Muni & Maharishi Suka · Combined Grantham',
    duration: '35 MIN',
    overview: `A complete Agastya Nadi reading is not a simple fortune-telling session. It is a comprehensive soul audit across 16 chapters — called Kandams — that map every dimension of a human life from family and finances through marriage, health, career, spiritual purpose, and the exact nature of karma accumulated across previous lives.

This lesson provides the complete architecture of the 16 Kandams so that practitioners can understand what the Nadi leaves actually contain — and how to read one\'s own life through this lens even without accessing a physical Nadi center.`,
    quote: `"The 16 Kandams are not 16 separate topics. They are 16 windows into the same room — the soul\'s agreement with the cosmos for this particular birth. When you understand all 16 together, the pattern becomes visible. That pattern is your liberation code."`,
    quoteSource: 'Agastya Muni, Nadi Grantham Chapter 1',
    bodyText: `KANDAM 1 — GENERAL LIFE (Samanya Kandam): Name of the person as encoded in the Nadi. Birth star (Nakshatra), Lagna (rising sign), physical description. Broad life overview — the soul\'s primary theme for this birth. Personality traits that are karmically fixed. General life quality and the key turning points encoded.

KANDAM 2 — FINANCES & FAMILY (Dhana Kandam): Wealth patterns across the lifetime. When money flows and when it contracts. Family inheritance and karmic debts to family members. Hidden assets or resources the person is unaware of. Business vs. employment — which path the Nadi prescribes.

KANDAM 3 — SIBLINGS (Bhratru Kandam): Number of brothers and sisters as encoded. Relationships with each sibling — karmic nature. Whether siblings will be sources of support or challenge. Specific periods of conflict or harmony with siblings.

KANDAM 4 — MOTHER & EDUCATION (Matru Kandam): The exact nature of relationship with the mother. Past-life karma between the soul and the maternal line. Education level and fields of knowledge. Properties and vehicles in the life. Quality of emotional foundation and psychological security.

KANDAM 5 — CHILDREN & INTELLIGENCE (Putra Kandam): Number of children encoded. Gender, birth order, and specific qualities of each child. Relationship quality with each child across time. Intelligence type — analytical, creative, spiritual, practical. Past-life children who are reborn in this life.

KANDAM 6 — HEALTH & ENEMIES (Roga Kandam): Diseases that are karmic — originating in past-life actions. When these diseases will manifest and their duration. Enemies — who they are and their nature. Legal disputes and their outcomes. Debts and their resolution.

KANDAM 7 — MARRIAGE (Vivaha Kandam): Marriage — whether it is encoded, how many. The exact qualities of the spouse as encoded by Agastya. When marriage will occur. Quality of the marriage — harmonious, challenging, transformative. Past-life relationship with the spouse.

KANDAM 8 — LONGEVITY (Ayu Kandam): This is one of the most sacred and restricted Kandams. The quality of death as encoded — sudden or gradual, the approximate period. How consciousness exits the body at death. The state of the subtle body after death. This Kandam is read only for seekers of serious spiritual purpose.

KANDAM 9 — LUCK & FATHER (Bhagya Kandam): The role of fate vs. free will in this particular life. Grace periods — when luck flows without effort. The father — his nature, the karmic relationship, his influence. Guru — whether a physical Guru is encoded in this life, and their characteristics.

KANDAM 10 — CAREER (Karma Kandam): The soul\'s professional calling as encoded. Whether the person is in the right field. When career peaks occur. Whether business success is encoded. Contributions the soul is meant to make in the world.

KANDAM 11 — GAINS (Labha Kandam): Income sources and their timing. Benefits from siblings, friends, and community. Fulfillment of desires — which will be fulfilled and which will not. Social recognition and fame, if encoded.

KANDAM 12 — SPIRITUAL LIBERATION (Moksha Kandam): Expenditure and losses — their purpose in the spiritual journey. Foreign countries and their role. Charitable acts that are karmically prescribed. The specific spiritual path encoded for liberation. Whether liberation is possible in this birth.

KANDAMS 13-16 — SPECIAL CHAPTERS: Previous life summary — what the soul did and experienced. Shanti Kandam — remedies prescribed by Agastya himself. Current birth spiritual mission. The final Kandam reveals whether and when full liberation (Moksha) is encoded.`,
    mantra: 'Om Shreem Hreem Kleem\nAgastiya Nadi Grantham\nMama Jeevana Rahasyam Prakasha',
    mantraMeaning: 'May the sacred Agastya Nadi reveal the hidden truth of my life\'s purpose.',
    practices: [
      'Create a personal Kandam journal with 16 sections — one for each Kandam. Write everything you currently know or sense about each area of your life. Leave space for what will be revealed as you go deeper into this education.',
      'Identify which Kandam is currently most active in your life — which theme dominates your present experience. Study that Kandam chapter in depth. Meditate on it. What does Agastya say about this dimension of life?',
      'Practice the 16-breath Kandam Pranayama: inhale counting to 16 in your mind, hold for 8, exhale for 16. During the inhale, mentally travel through each Kandam from 1 to 16. Repeat for 10 minutes. This activates the complete Nadi field.',
    ],
  },

  {
    id: 'm2l2',
    tier: 'prana',
    tierLabel: 'PRANA-FLOW',
    module: 2,
    lessonNum: 2,
    title: 'Thumbprint Karmic Science — The Five Soul Signatures',
    siddha: 'Konganavar Siddhar · Agastya Muni · Combined Angushtha Shastra',
    duration: '40 MIN',
    overview: `Every thumb carries a story that began before this birth. The five primary thumbprint patterns — Arch, Loop, Whorl, Tented Arch, and Double Loop — are not random genetic accidents. They are the physical crystallization of the soul\'s accumulated karmic mass compressed into a single identifying mark.

This is the deep Siddha science behind why Agastya chose the thumb as the Nadi identification portal. The thumb is ruled by Mars in Vedic palmistry — the planet of action and karma. The dominant thumb (right for men, left for women) encodes the primary karma the soul chose to resolve in this specific incarnation.`,
    quote: `"I did not choose the thumb arbitrarily. The thumb is where the soul\'s will enters the hand. And will is the engine of karma. So the thumb is the mouth of the karmic record — press it, and the record speaks."`,
    quoteSource: 'Agastiyar Nadi Grantham, Chapter on Angushtha Classification',
    bodyText: `THE ARCH — BHUMI REKHA (Earth Line): An arch has no core — it rises and falls like a hill, with no spiral center. Karmically, this indicates a soul without a formed center of personal identity across prior lifetimes. These souls are freshest in the evolutionary sense — not spiritually immature, but genuinely new to the particular set of lessons encoded in this birth. The Siddha Sattamuni noted: "The arch-thumbed one is building their identity from scratch this birth — which is both their gift and their pain." The gift is no karmic baggage in that specific life-area. The pain is no previous wisdom to draw on.

THE LOOP — VAYU REKHA (Air Line): A loop has a core on one side — either ulnar (toward the little finger) or radial (toward the thumb side). Ulnar loops — the most common — curve toward the flexible side of the hand: adaptability, social intelligence, middle-path spirituality. Radial loops — much rarer — curve inward toward the thumb itself: independent thinkers, rule-breakers, Siddha-types who reverse convention. Agastya specified that radial-loop-thumbed beings often carry Siddha karma from past lives — they were practitioners in previous births whose knowledge is now available for reactivation.

THE WHORL — SURYA CHAKRA (Solar Disc): The whorl has a complete spiral center — concentric rings moving inward to a fixed point. This indicates a soul with a strong, defined center of identity built over many lifetimes. The whorl-thumbed person knows who they are at the core — they are individuated. Their challenge is not identity-formation but identity-transcendence. Bogar wrote that whorl-thumbed individuals often become spiritual teachers or sovereign creators — people who must ultimately dissolve the very individuality they spent lifetimes building.

THE TENTED ARCH — AGNI REKHA (Fire Line): The tented arch has a sharp peak — like a tent pole or flame — rather than the smooth hill of a plain arch. This indicates a soul under intense karmic pressure in this birth. Something large from a previous life is demanding resolution now. These individuals often feel their life is "too much" — too intense, too fast, too full of sudden change. Konganavar Siddhar prescribed specific cooling remedies for tented-arch individuals: moon water, camphor, and Ida Nadi breathing to balance the excessive Pingala activation.

THE DOUBLE LOOP — SHIVA-SHAKTI REKHA: Two loops intertwining — forming a figure-eight or S-shape — indicate a soul that carries genuine dual-natured encoding. This is the rarest pattern and appears in approximately 1-2% of the population. Agastya wrote that double-loop beings operate across multiple dimensional realities simultaneously and often have trouble feeling at home in ordinary life. Their prescribed path is bhakti — complete surrender to the Divine — as the only way to integrate the tension between their two equally powerful soul-streams.`,
    mantra: 'Om Aim Angushtha Devata\nMama Karma Rekham Prakashaya\nNamo Nadi Shastra Gurubhyah',
    mantraMeaning: 'O deity of the thumb, illuminate my karmic record. Salutations to all the Gurus of Nadi science.',
    practices: [
      'Do a full household thumbprint survey — collect the right thumbprint (from males) and left thumbprint (from females) of your entire family. Identify each pattern type. Notice the distribution. Families often share thumb pattern types, indicating shared karmic themes.',
      'Meditate with your dominant Nadi thumb pressed against the center of your Ajna chakra for 20 minutes. Use the mantra "Om Angushtha Devata Namaha" as your meditation anchor. Write down everything you receive — images, words, sensations.',
      'Research the traditional Nadi classification system: study how Vaitheeswaran Koil Nadi readers actually group bundles by thumb pattern. Understanding the physical method deepens appreciation of the science.',
    ],
    secrets: [
      'Secret of the Double Thumb: Each person has two thumbs with potentially different patterns. In traditional Nadi, the non-dominant thumb carries the previous-birth karmic record, while the dominant thumb carries the current-birth karmic contract. Comparing both thumbs gives a complete past-present karmic map.',
      'Agastya\'s hidden teaching: Intensive spiritual practice can shift a loop toward a whorl configuration over 30-40 years. The Siddhas documented this observation — as the Sushumna opens, the fingerprint pattern becomes more spiral, more centered. The body itself records spiritual progress.',
    ],
  },

  {
    id: 'm2l3',
    tier: 'prana',
    tierLabel: 'PRANA-FLOW',
    module: 2,
    lessonNum: 3,
    title: 'The Nadi Center at Vaitheeswaran Koil — Sacred Geography of Records',
    siddha: 'Agastya Muni · Vaitheeswaran (Lord Shiva as Divine Physician)',
    duration: '28 MIN',
    overview: `The most ancient and authentic repository of Agastya Nadi palm leaves in the world is Vaitheeswaran Koil — the Temple of the Divine Physician — located in Tamil Nadu, India. This lesson explores the sacred geography of this site, the lineages of Nadi readers who have served there for millennia, and how the physical location itself serves as an amplifier for Nadi transmissions.`,
    quote: `"The leaves are not merely at Vaitheeswaran Koil. They are OF Vaitheeswaran Koil. The energy of Lord Vaitheeswaran — Shiva as healer — permeates every palm leaf stored within 40 kilometers of that temple. Remove a leaf from that field and it loses half its potency."`,
    quoteSource: 'Oral tradition, Nadi reader lineage, 17th generation',
    bodyText: `VAITHEESWARAN KOIL — THE SITE: Located near Sirkazhi in the Nagapattinam district of Tamil Nadu, Vaitheeswaran Koil is dedicated to Shiva in the form of Vaitheeswaran — the divine healer. The presiding deity is believed to grant healing from all diseases, both physical and karmic. The Nadi reading tradition has been centered here for at least 2,000 documented years, likely much longer.

THE NADI READERS (NADI JYOTISHIS): The reading families at Vaitheeswaran Koil are hereditary — this knowledge passes from father to son for generations. Some families can trace their Nadi reading lineage back 12-17 generations. They are custodians, not owners, of the leaves. Traditional Nadi readers undergo decades of training before they can read independently.

THE PHYSICAL LEAVES: The original palm leaves are made from Borassus palm (Palmyra palm) — a specific variety whose leaves are particularly durable and resistant to decay. They are treated with peacock oil for preservation. The script used is Vatteluttu — an ancient Tamil script used between the 4th and 12th centuries CE. Most Nadi readers today read from copper plate copies of the original leaves, or from authorized copies made in the 18th and 19th centuries.

HOW A READING ACTUALLY WORKS: The seeker visits the center. Their dominant thumb is pressed in ink and pressed to paper. The reader takes this print to the storage room and, using the whorl classification, selects the relevant bundle — typically 5-12 leaves. The reader then reads aloud a series of birth details: birth star, Lagna, parents' names, number of siblings. The seeker says "yes" or "no." When all details match — usually on the 3rd to 7th leaf — they have found their specific leaf.

WHY SOME PEOPLE DON'T FIND THEIR LEAF: The Siddha tradition acknowledges that not every soul's leaf is accessible in this birth. There are three reasons: (1) the specific leaf may be lost to time or insect damage, (2) the soul is not karmically ready to receive this level of self-knowledge, (3) the soul's liberation path does not require Nadi knowledge — they are meant to discover their purpose through direct inner experience rather than external validation.`,
    mantra: 'Om Vaitheeswara Namaha\nSarva Roga Nivarana\nAgastiya Prasadena Nadi Jnanam Dehi Me',
    mantraMeaning: 'Salutations to Vaitheeswaran the healer. May Agastya\'s grace grant me the knowledge of the Nadi.',
    practices: [
      'Virtual pilgrimage: meditate facing south (the direction of Tamil Nadu from most of the world) and visualize yourself standing before the Vaitheeswaran temple gopuram. The Siddha tradition confirms that consciousness travels instantaneously — physical presence is secondary to inner alignment.',
      'If a physical visit to Vaitheeswaran Koil is possible, plan it. Even without receiving a Nadi reading, the energy field of the site is transformative. Many practitioners report spontaneous past-life memories simply by entering the temple precinct.',
      'Study the Vaitheeswaran Koil healing protocol: traditional visitors bathe in the sacred tank (Siddhamirta Teertham) before the reading. This purifies the Nadi field and helps the leaf find the seeker more quickly. Even at home, a salt water bath before any Nadi-related practice improves receptivity.',
    ],
  },

  {
    id: 'm2l4',
    tier: 'prana',
    tierLabel: 'PRANA-FLOW',
    module: 2,
    lessonNum: 4,
    title: 'Karma and the Nadi — How Past Actions Write Present Lives',
    siddha: 'Sattamuni Siddhar · Agastya Muni · Karma Vigyan',
    duration: '45 MIN',
    overview: `The Nadi leaves are, at their core, a record of karma — the cosmic law of cause and effect operating across multiple lifetimes. This lesson teaches the complete Siddha understanding of karma, how it creates the patterns encoded in the Nadi, and how the thumb scan biometric connects to the soul\'s specific karmic signature in this birth.`,
    quote: `"Do not imagine that karma is punishment. Karma is curriculum. The universe is not a court — it is a school. The Nadi leaf is your report card from all previous terms. Read it not with fear, but with the curiosity of a student who finally sees the full map of their education."`,
    quoteSource: 'Sattamuni Siddhar, Karma Vigyan Grantham',
    bodyText: `THE THREE TYPES OF KARMA IN NADI SCIENCE: Sanchita Karma — the total accumulated karma from all past lives, stored in the causal body (Karana Sharira). This is the full library of all actions, thoughts, and intentions across all births. Prarabdha Karma — the specific portion of Sanchita karma activated for this particular birth. This is what the Nadi leaf records — the specific "file" opened for this lifetime. Agami Karma — new karma being created in this present birth through present actions. This is the one dimension where free will fully operates.

HOW THE THUMBPRINT ENCODES KARMA: Sattamuni Siddhar taught that as the soul takes a new body, the Prarabdha karma — the activated file — impresses itself onto the subtle body (Sukshma Sharira) through the mechanism of the soul's entry. The subtle body then templates the physical body during fetal development. The thumb is one of the last features to fully form in the fetus, and it forms after the soul's entry — which is why the thumbprint carries the most accurate karmic encoding.

KARMA AND THE NADI KANDAMS: Each of the 16 Kandams maps to a specific karmic category: Kandam 6 (health) reveals illness karma — what the soul created in past lives that now manifests as disease. Kandam 8 (longevity) reveals the karma of how the soul has handled life-force in previous lives. Kandam 12 (liberation) reveals whether the soul has performed sufficient spiritual practice in past lives to enable liberation in this birth.

FREE WILL WITHIN THE NADI: The Siddha tradition is clear that the Nadi does not override free will — it maps the probable trajectory based on karmic momentum. Sincere spiritual practice, genuine repentance, and direct transmission from an awakened master can alter the trajectory. Agastya built the Shanti Kandam (remedy chapter, Kandam 14) specifically for this purpose — to provide tools that genuinely modify the karmic momentum encoded in the leaf.

THE NADI AND DHARMA: Beyond karma lies Dharma — the soul's specific purpose and unique contribution. Some souls have a heavy karmic load but a clear, powerful Dharma. Others have minimal karma but a subtle, difficult-to-identify Dharma. The Nadi maps both — and understanding their interaction is the most sophisticated and useful application of Nadi knowledge.`,
    mantra: 'Om Sattamunikum Vinnappam\nKarma Kshayam Kuru Prabho\nMoksha Margam Darshaya',
    mantraMeaning: 'A prayer to Sattamuni: dissolve my karma, O Lord, and show me the path of liberation.',
    practices: [
      'Create a karmic inventory: identify the three most persistent patterns in your life — the themes that have repeated across different relationships, jobs, and circumstances. According to Siddha karma science, these three recurring patterns are your primary Prarabdha karmic themes for this birth.',
      'Perform the Sattamuni karma-dissolution practice: write three sentences describing your most painful recurring pattern. Burn the paper in a clay pot at dusk while chanting "Om Sattamunikum Namaha" 27 times. Bury the ash in the earth the next morning. This is a genuine Siddha karma-clearing ritual.',
      'Meditate on the question: "What did I do to create the patterns I currently experience?" — not with guilt, but with the pure curiosity of a Nadi scholar reading a leaf. The answer that arises in deep stillness is genuine Akashic information about your own karmic history.',
    ],
  },

  // ═══════════════════════════════════════════════
  // MODULE 3 — SIDDHA QUANTUM — ADVANCED
  // ═══════════════════════════════════════════════

  {
    id: 'm3l1',
    tier: 'siddha',
    tierLabel: 'SIDDHA-QUANTUM',
    module: 3,
    lessonNum: 1,
    title: 'The Shanti Kandam — Agastya\'s Remedies for Karma Dissolution',
    siddha: 'Agastya Muni · Shanti Kandam (Kandam 14)',
    duration: '50 MIN',
    overview: `The Shanti Kandam — the 14th chapter of the Agastya Nadi reading — is perhaps the most practically powerful component of the entire Nadi system. This is where Agastya prescribes specific remedies for each soul's karmic patterns. These remedies were not generic prescriptions — Agastya encoded personalized healing instructions for each individual soul thousands of years before that soul took birth.

This lesson teaches the complete typology of Shanti Kandam remedies and how to apply them regardless of whether one has accessed their specific Nadi leaf.`,
    quote: `"I knew you would come eventually. I have been waiting with your medicine ready. Not all medicines taste sweet — but all, taken correctly, lead to the same place: home."`,
    quoteSource: 'Agastya Muni, Shanti Kandam opening verse',
    bodyText: `THE FIVE CATEGORIES OF SHANTI KANDAM REMEDIES: Temple Remedies — specific temples to visit, specific deities to propitiate, specific rituals to perform and the exact timing. Dana (Charity) Remedies — precise charitable acts: feeding specific animals, donating specific items to specific categories of people, planting specific trees. Mantra Remedies — specific mantras for specific karmic patterns, chanted a specific number of times on specific days. Ritual Remedies — specific Pujas, Abhishekas (ritual bathing of the deity), Homams (fire rituals), and Yagnas. Food Remedies — specific dietary prescriptions and prohibitions for the soul's karmic situation.

TEMPLE KARMA: The Shanti Kandam most commonly prescribes temple visits because temples in the Siddha tradition are not merely places of worship — they are scalar energy nodes where the karmic field can be literally reset. Specific temples for specific karmic patterns: Rameswaram for Pitru (ancestor) karma. Kashi (Varanasi) for karma related to death and rebirth. Tirupati for Vishnu-karma related to Dharma violations. Chidambaram for releasing karmic patterns through consciousness itself.

ANCESTOR KARMA AND THE PITRU SHANTI: A significant portion of Shanti Kandam remedies relate to Pitru karma — karma inherited from or owed to ancestors. The Siddha tradition teaches that unresolved ancestor karma blocks all progress: financial, health, spiritual, and relational. The specific Pitru Shanti rituals prescribed in the Nadi can release these patterns across multiple generations simultaneously.

THE NAVAGRAHA CONNECTION: Each of the nine planets governs specific karmic patterns. Shani karma — Shani Shanti remedies including Shani temple visits, black sesame offerings, and specific mantras. Rahu-Ketu karma — shadow planet remedies that address the soul's deepest evolutionary patterns — the north and south nodes of the moon represent the soul's journey from past (Ketu/south node) to future (Rahu/north node).

PERFORMING SHANTI PRACTICES WITHOUT YOUR SPECIFIC LEAF: The Siddha masters taught that even without accessing one's specific Nadi leaf, the general Shanti practices have genuine effect because they work at the karmic field level — not just the individual level. Performing Pitru Shanti benefits not only your personal ancestors but the entire ancestral field you carry in your DNA.`,
    mantra: 'Om Agastiya Shanti Prada\nMama Karma Nashaya\nShanti Shanti Shanti',
    mantraMeaning: 'O Agastya, giver of peace, dissolve my karma. Peace, peace, absolute peace.',
    practices: [
      'Identify your primary Navagraha (planetary) karma by reflecting on recurring difficulties: chronic financial stress → Saturn. Relationship confusion → Venus/Moon. Health crises → Mars/Ketu. Career obstacles → Saturn/Sun. Begin the specific planetary remedy practice for your primary challenge area.',
      'Perform the Pitru Shanti practice on Amavasya (new moon) night: offer black sesame seeds and water to your ancestors, chanting "Om Pitru Devata Namaha" 108 times. Light a sesame oil lamp for the ancestors. This clears ancestral karma from your field.',
      'Commission a Navagraha Homa at a traditional temple if geographically possible, or arrange one to be performed on your behalf. This is one of the most effective Shanti Kandam remedy categories for clearing planetary karmic blocks.',
    ],
    secrets: [
      'Agastya\'s most protected secret in the Shanti Kandam: he encoded that certain karmic patterns can only be dissolved by performing the remedy with complete inner surrender — the external ritual without the internal shift is ineffective. This is why the same remedy works powerfully for one person and barely at all for another.',
      'The 16th Kandam (Moksha Kandam) is not read publicly by most Nadi centers. It contains the specific conditions under which each soul can achieve liberation in this birth. Agastya indicated that reading this chapter to an unprepared person can actually accelerate their karmic accumulation by creating premature expectations.',
    ],
  },

  {
    id: 'm3l2',
    tier: 'siddha',
    tierLabel: 'SIDDHA-QUANTUM',
    module: 3,
    lessonNum: 2,
    title: 'Nadi and Jyotish — How the Palm Leaf Integrates with Vedic Astrology',
    siddha: 'Bhrigu Muni · Agastya Muni · Nadi-Jyotish Integration',
    duration: '55 MIN',
    overview: `The Nadi system and Vedic Jyotish (astrology) are not separate sciences — they are two lenses on the same cosmic reality. A complete Nadi reading uses the birth chart as the macro map and the palm leaf as the micro record. This lesson teaches how these two systems integrate and how understanding both gives the most complete picture of a soul\'s karmic situation.`,
    quote: `"The stars map the karma from above. The leaves record the karma from below. The astrologer reads the sky. The Nadi reader reads the earth. But both are reading the same book — the soul\'s agreement with the cosmos. The wise one reads both."`,
    quoteSource: 'Bhrigu Muni, Bhrigu Samhita Preface',
    bodyText: `THE BHRIGU NADI CONNECTION: Bhrigu Muni, the father of Vedic astrology, created a parallel Nadi system — the Bhrigu Nadi — which records soul karma specifically through the lens of the birth chart. The Bhrigu Nadi reads the Jupiter transit as the primary timing mechanism: each year when Jupiter moves to a new house from the natal moon, a new chapter of the Bhrigu Nadi opens for that soul. This makes the Bhrigu Nadi a dynamic system — it updates with each Jupiter transit.

LAGNA CORRELATION: Every Nadi leaf records the Lagna (rising sign) as the primary identifier after the thumbprint. The Lagna in Jyotish represents the soul\'s fundamental approach to this incarnation — the lens through which all experience is filtered. A Scorpio Lagna carries fundamentally different Nadi content than a Taurus Lagna, even with the same thumbprint pattern.

NAKSHATRA AND NADI CLASSIFICATION: The 27 Nakshatras (lunar mansions) each correlate to specific Nadi types. The Siddhas identified this link: Ashwini Nakshatra souls carry Arch thumb patterns disproportionately. Rohini souls tend toward Whorls. Ardra souls carry Tented Arches at higher frequency. This is not absolute — but statistically significant enough that Nadi readers can narrow their search using the birth star.

DASHA TIMING AND NADI ACCURACY: The Nadi leaves reference specific time periods — but the timing in the leaf is always keyed to planetary dashas (major periods). A Nadi statement like "trouble in the 32nd year" actually means "trouble during the period when your 32nd year aligns with a challenging dasha." Understanding this makes Nadi timing dramatically more accurate.

RAHU-KETU AXIS — THE SOUL\'S EVOLUTIONARY COMPASS: The most important correlation between Jyotish and Nadi is the Rahu-Ketu axis. Ketu (south node) represents the soul\'s accumulated past — what it has already mastered across previous births. Rahu (north node) represents the unexplored territory — what the soul is stretching toward in this birth. The Nadi leaf always reflects this axis: Ketu-area skills are available but potentially over-relied upon; Rahu-area is where growth, fear, and destiny intersect.`,
    mantra: 'Om Bhriguave Namaha\nNadi Jyotish Samanvaya\nAtma Jnana Prakashaya Namaha',
    mantraMeaning: 'Salutations to Bhrigu. May the integration of Nadi and Jyotish illuminate self-knowledge.',
    practices: [
      'If you know your birth chart: identify your Rahu house. This is your primary growth area encoded in both Jyotish and Nadi. Now relate it to your thumbprint pattern. A Scorpio Rahu with a Whorl thumb pattern indicates a soul moving toward depth, transformation, and mystical power — with a highly developed center already formed.',
      'Study the Bhrigu Samhita system: identify which house Jupiter currently transits in your birth chart. According to Bhrigu Nadi, this house is the active chapter of your Nadi in this period. Reflect on what the themes of that house are manifesting in your current life.',
      'Commission a combined Nadi-Jyotish reading if possible — practitioners who integrate both systems give the most complete readings. The Nadi provides the specific karmic record; the Jyotish provides the timing map.',
    ],
  },

  {
    id: 'm3l3',
    tier: 'siddha',
    tierLabel: 'SIDDHA-QUANTUM',
    module: 3,
    lessonNum: 3,
    title: 'Reading Your Own Nadi — The Inner Akashic Scan',
    siddha: 'Mahavatar Babaji · Direct Transmission Method',
    duration: '60 MIN',
    overview: `The highest teaching of Mahavatar Babaji within the Nadi tradition is not about going to a Nadi center and having a reader find your leaf. It is about developing the inner capacity to read your own Nadi directly — to access the Akashic record of your own soul through the faculty of deep Samadhi.

Babaji taught that this capacity is latent in every human being and can be activated through specific practices. This is the most advanced and most liberating teaching in the entire Nadi system.`,
    quote: `"Why travel to find a palm leaf when the original leaf is written within you? The Nadi center holds a copy. You hold the original. I will show you how to read it."`,
    quoteSource: 'Mahavatar Babaji, oral transmission recorded in Kriya tradition',
    bodyText: `BABAJI\'S THREE-STAGE INNER NADI METHOD: Stage 1 — Pratyahara (Withdrawal): Begin by systematically withdrawing attention from all sensory input. Eyes closed, breath slowed to 4-5 per minute. This takes 20-30 minutes of Kriya Pranayama to fully achieve. The mind must become genuinely still — not suppressed, but organically quiet like a lake on a windless day.

Stage 2 — Dharana (Concentration): Focus on the Ajna chakra (third eye center) while simultaneously pressing the Nadi thumb to the center of the chest (Anahata). This dual-point focus creates a specific energetic circuit between the soul-signature (thumb) and the heart-intelligence (Anahata) and the vision center (Ajna). Hold this for 15-20 minutes without wavering.

Stage 3 — Dhyana (Meditation): From the stable Dharana state, release the specific focus and enter open, receptive awareness. In this state, impressions begin to arise — not thoughts, but knowings. Images, words, sequences of events, emotional tones. These are fragments of the Akashic self-reading. The practitioner does not analyze or interpret them — simply receives and records them after emerging from meditation.

WHAT THE INNER NADI REVEALS: In deep practice, the inner Nadi reading covers the same territory as the external leaf — past-life impressions, present-life purpose, future trajectory, and most importantly, the specific spiritual practices that are cosmically prescribed for this birth. Babaji taught that the inner Nadi is actually more complete and more accurate than the external leaf, because the external leaf is a translation while the inner reading is the original.

THE ROLE OF THE GURU: Babaji was explicit that inner Nadi reading requires a Guru — not because the information is unavailable, but because the untrained mind inevitably confuses wishful thinking, fear projections, and genuine Akashic information. A realized master can transmit the discernment faculty necessary to distinguish these three streams. This is one of the core functions of Diksha (initiation) in the Siddha tradition.

THUMB MEDITATION AS CATALYST: The SQI thumb biometric scan is a modern catalyst for this ancient practice. By receiving the Angushtha reading (thumbprint karmic analysis) through the scanner, the mind receives an initial external orientation — the intellectual map. This makes the inner Nadi meditation significantly more accessible, because the mind already has a framework for what it is attempting to access.`,
    mantra: 'Om Kriya Babajiya Namaha\nAkasha Nadi Prakashan\nAtma Jnana Siddhi Kuru',
    mantraMeaning: 'Salutations to Kriya Babaji. Illumine the Akashic Nadi. Grant the Siddhi of self-knowledge.',
    practices: [
      'Practice the three-stage inner Nadi method daily for 40 days. Begin with 30 minutes, extend to 60 minutes by the third week. Keep a dedicated journal for what arises — do not analyze during the session, only record afterward. By day 40, patterns and themes will have emerged that constitute your inner Nadi reading.',
      'Before each inner Nadi meditation: press your dominant thumb against your third eye for 3 minutes while chanting "Om Angushtha Devata Namaha" softly. This activates the energetic connection between your physical soul-signature and your inner vision faculty.',
      'At the conclusion of the 40-day practice: read your accumulated meditation journal as if it were a Nadi leaf — identify which Kandams the received information corresponds to. Many practitioners discover they have received comprehensive inner Nadi information across multiple Kandams.',
    ],
    secrets: [
      'Babaji\'s secret teaching: the inner Nadi contains information not in the external leaf, specifically around the soul\'s Siddhi potential in this birth — which spiritual powers are available for development. External Nadi readers rarely have access to this Kandam. It only opens to the inner reader who has achieved sufficient Sushumna activation.',
    ],
  },

  // ═══════════════════════════════════════════════
  // MODULE 4 — AKASHA INFINITY — MASTER TRANSMISSIONS
  // ═══════════════════════════════════════════════

  {
    id: 'm4l1',
    tier: 'akasha',
    tierLabel: 'AKASHA INFINITY',
    module: 4,
    lessonNum: 1,
    title: 'The Secret Nadi — Recorded Lives of the 18 Tamil Siddhas',
    siddha: 'All 18 Tamil Siddhas · Combined Nadi Revelation',
    duration: '75 MIN',
    overview: `The deepest secret of the Nadi tradition — revealed only to initiated practitioners — is that the 18 Tamil Siddhas themselves appear in the Nadi leaves. Not as the Rishis who recorded the leaves, but as souls who took human form across multiple births, leaving karmic records of their own evolutionary journeys.

This is the most humbling and most inspiring teaching in the entire Nadi corpus: even the greatest Siddhas had their own Prarabdha karma, their own evolutionary arc, their own leaf. They were not born perfect — they became perfect. And their journey is recorded.`,
    quote: `"You think we were always Siddhas? We too sat in Nadi centers in our early births and heard things that made us weep. We too had our Prarabdha. We too had our Shanti Kandam remedies. The difference is only that we followed the prescriptions exactly, without compromise, for as long as it took."`,
    quoteSource: 'Bogar Siddhar, Bogar 7000, Secret Chapter (restricted)',
    bodyText: `THIRUMOOLAR'S NADI RECORD: The Nadi manuscripts reveal that Thirumoolar — author of the Tirumantiram, the supreme text of Tamil Siddha tradition — had a previous birth as a great musician who used sound to manipulate rather than liberate. His entire life as Thirumoolar — spending 3,000 years in Samadhi to receive the 3,000 verses of the Tirumantiram — was the karma-resolving journey from sound-as-manipulation to sound-as-liberation. Every verse of the Tirumantiram contains encoded information about this karmic transformation.

AGASTYA'S OWN NADI LEAF: In a remarkable meta-revelation, certain advanced Nadi manuscripts contain what Agastya received when he read his own Akashic record: his soul's agreement to serve as the primary Akashic scribe for this Yuga. His own "Kandam 10" (career) reads simply: "The entire cosmos is your workplace. Your colleagues are the stars."

BOGAR'S CHINA TRANSMISSIONS: Bogar Siddhar is recorded in the Nadi as having spent multiple births in China — which is why his Nadi manuscripts show clear influence of Taoist and Chinese alchemical traditions alongside Tamil Siddha ones. The Nadi reveals that the great Chinese alchemical tradition and the Tamil Siddha tradition have a single common ancestor at the level of their most advanced teachings.

THE 18 SIDDHAS AS EVOLUTIONARY TEMPLATE: The most important teaching from reading the Siddhas' Nadi records is that their liberation was not accidental, not given by grace alone, and not the result of extraordinary talent. It was the result of extraordinary consistency — following their prescribed practices with absolute commitment across multiple lifetimes. Their Nadi records show the same struggles, doubts, and failures as ordinary humans — what differs is the response to those failures.

THE NADI PREDICTION OF THIS AGE: Multiple Siddha Nadi manuscripts contain predictions about the current age — a period of extreme confusion followed by a sudden quantum leap in collective consciousness. Agastya specifically mentions a "time when the ancient records will reach the people through devices of light" — an apparent reference to digital access to Nadi wisdom. This very education is part of what was predicted.`,
    mantra: 'Om Ashtadasha Siddha Guru\nNadi Jnanam Dehi Me\nAtma Siddhi Prakashan Kuru',
    mantraMeaning: 'O Gurus of the 18 Siddhas, grant me Nadi knowledge. Illuminate the Siddhi of Self-realization.',
    practices: [
      'For 18 consecutive days, meditate for 18 minutes on one of the 18 Tamil Siddhas each day. On each day, hold the question: "What was this Siddha\'s primary karmic challenge — and how did they transcend it?" The answers you receive are genuine Akashic transmissions relevant to your own karmic situation.',
      'Study the Tirumantiram with the understanding that each of the 3,000 verses encodes a specific Nadi teaching about consciousness evolution. Even reading 10 verses daily with this understanding transforms the text from scripture to living transmission.',
      'The 18-Siddha Nadi Puja: offer 18 different flowers — one for each Siddha — at your altar while chanting each Siddha\'s name and seed mantra. This invites the combined field of the 18 Siddhas into your practice space. Perform this on the full moon night for maximum effect.',
    ],
    secrets: [
      'The most restricted secret in the Akasha Infinity tier: the 18 Tamil Siddhas are not yet complete in their evolutionary journey. They continue to evolve in subtler dimensions, and their Nadi records — stored in the Akashic field rather than on palm leaves — continue to be written. A practitioner in deep Samadhi can access the current chapter of a specific Siddha\'s continuing evolution. This is what the Siddhas call "living transmission" — knowledge not from the past but from the present moment of their consciousness.',
      'Agastya revealed that there are actually 108 Siddhas in total — the 18 who are known to the world are the ones who chose to remain in contact with human seekers. The remaining 90 have moved to realms beyond ordinary human access. A complete Nadi reading always references which of the 108 Siddhas is the soul\'s primary spiritual guide across lifetimes.',
    ],
  },

  {
    id: 'm4l2',
    tier: 'akasha',
    tierLabel: 'AKASHA INFINITY',
    module: 4,
    lessonNum: 2,
    title: 'Nadi Reading for Liberation — The Moksha Kandam Revealed',
    siddha: 'Mahavatar Babaji · Agastya Muni · Moksha Kandam Transmission',
    duration: '90 MIN',
    overview: `The Moksha Kandam — the 16th and final chapter of the Agastya Nadi — is the most sacred and most restricted chapter in the entire system. Most Nadi centers refuse to read it, and when they do, only for specific souls who have demonstrated genuine readiness through their spiritual practice.

This lesson — available only to Akasha Infinity members — reveals the essential teachings of the Moksha Kandam and how to use the Nadi system as a direct instrument of liberation, not merely information.`,
    quote: `"All 15 previous Kandams exist to prepare you for the 16th. The first 15 answer the question: Who are you and what is your situation? The 16th answers the only question that truly matters: How do you get free?"`,
    quoteSource: 'Agastya Muni, Moksha Kandam, Opening Invocation',
    bodyText: `THE CONDITION FOR READING THE MOKSHA KANDAM: Agastya specified in the Nadi Grantham that the Moksha Kandam should only be read when: (1) The seeker has completed at least one cycle of all prescribed Shanti Kandam remedies. (2) The seeker has established a consistent daily spiritual practice of at least 1 hour for a minimum of 3 years. (3) The seeker has received initiation (Diksha) from an authentic lineage holder. Without these conditions, the Moksha Kandam information cannot be properly received or integrated.

WHAT THE MOKSHA KANDAM CONTAINS: The specific spiritual practice encoded for this soul's liberation — not generic advice, but the exact practice combination that matches this soul's karmic configuration. The timing of liberation — whether liberation is achievable in this birth, the next, or requires more evolution. The specific karmic obstacles blocking liberation and their precise remedies. The name and qualities of the Guru who will serve as the final liberating catalyst. The manner of liberation — Jivanmukti (liberation while alive) or Videhamukti (liberation at death).

BABAJI'S TEACHING ON THE NADI AND LIBERATION: Mahavatar Babaji taught that the Nadi system serves liberation in three ways. As a map — knowing your karmic situation clearly reduces the emotional suffering caused by confusion about why things are the way they are. As a remedy system — the Shanti Kandam provides the specific tools to dissolve karmic obstacles to liberation. As a transmission — the act of receiving an accurate Nadi reading, particularly the Moksha Kandam, itself creates a shift in the karmic field by bringing unconscious patterns into conscious awareness.

THE INNER MOKSHA KANDAM: Beyond the external leaf, Babaji taught that the complete Moksha Kandam exists within the practitioner and can be accessed through deep Kriya meditation. The specific practice is: enter the state of inner Nadi meditation described in the previous lesson. Once in Stage 3 (open receptive awareness), silently ask: "What is the one thing that will free me?" The answer that arises from the deepest level of stillness — not the answer the mind wants to hear, but the one that arrives with absolute authority — is the inner Moksha Kandam revelation.

INTEGRATION INTO DAILY LIFE: The Moksha Kandam teaching that is most practically applicable, according to Babaji, is the understanding that liberation is not a future event — it is a present recognition that keeps being obscured by karmic momentum. Each Shanti Kandam remedy, each mantra practice, each moment of genuine surrender reduces this obscuration. When the obscuration becomes thin enough, the natural state of liberation already present is recognized. The Nadi is not pointing to a destination — it is removing the obstacles to seeing what already is.`,
    mantra: 'Om Tat Sat\nAham Brahmasmi\nShivo Ham Shivo Ham\nSarvam Brahma Mayam',
    mantraMeaning: 'That is Truth. I am Brahman. I am Shiva. All this is pervaded by the Divine Consciousness.',
    practices: [
      'Perform the complete inner Moksha Kandam meditation: 30 minutes of Kriya Pranayama to enter stillness, 20 minutes of Dharana on Ajna while pressing Nadi thumb to Anahata, then 20 minutes of complete open Samadhi. Ask the single question from the deepest point of stillness. Record everything received. Return to the recording after 3 days and read it as if reading the most important document you have ever received — because it is.',
      'Design your personal liberation curriculum based on what has been revealed through this education: your thumbprint karmic type, your primary Kandam themes, your Shanti remedies, your inner Nadi meditations. This curriculum is your Moksha Kandam made practical.',
      'Commit to one Shanti Kandam remedy practice for a minimum of 40 consecutive days without break. The Siddha tradition teaches that 40 days of consistent remedy practice creates a permanent shift in the karmic field — not a temporary improvement, but an actual reduction in karmic mass.',
    ],
    secrets: [
      'The most sacred secret of the entire Nadi system, transmitted only in the Akasha Infinity tier: Agastya revealed that the Nadi leaves are not passive records. They are living consciousness — impregnated with Agastya\'s own Prana through 12,000 years of Samadhi. When a specific seeker\'s leaf is found and read, Agastya\'s consciousness is activated in the leaf, and for the duration of the reading, Agastya himself is present. This is why authentic Nadi readings often produce spontaneous emotional releases, visions, and sudden realizations in seekers — they are receiving direct transmission from an immortal Siddha, not merely information about their life.',
      'The final secret: there is no leaf for souls who are in their last birth before full liberation. Agastya specifically left these souls\' leaf bundles empty — a single blank leaf with only the name written. When a seeker at a Nadi center is told "your leaf was not found today," this is sometimes the most profound message they could receive: you no longer need the map because you are too close to the destination.',
    ],
  },
];

export const MODULE_INFO = [
  { module: 1, tier: 'free' as NadiLeafTier, title: 'Foundation — What Are the Nadi Leaves', lessons: 3, color: 'rgba(255,255,255,0.6)' },
  { module: 2, tier: 'prana' as NadiLeafTier, title: 'Science — Thumb Karma & the 16 Kandams', lessons: 4, color: '#22D3EE' },
  { module: 3, tier: 'siddha' as NadiLeafTier, title: 'Advanced — Shanti Remedies & Inner Nadi', lessons: 3, color: '#D4AF37' },
  { module: 4, tier: 'akasha' as NadiLeafTier, title: 'Master — Siddha Records & Moksha Kandam', lessons: 2, color: '#F59E0B' },
];
