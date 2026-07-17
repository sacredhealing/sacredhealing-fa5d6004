// Abundance Sadhana — extracted verbatim from SiddhaAbundanceCurriculum.tsx
// 8 modules, 32 lessons on Siddha abundance transmission: poverty-
// dissolution, Ashta-Lakshmi attunement, Kubera's cosmic economics, and
// Babaji's scalar activation of the causal abundance body.

export interface AbundanceMantra { text: string; reps: number; desc: string; }
export interface AbundanceLesson {
  id: string; title: string; duration: string; type: string;
  content: string; mantra: AbundanceMantra | null; journal: string;
}
export interface AbundanceModule {
  id: string; number: string; tier: string; color: string; icon: string;
  title: string; subtitle: string; description: string;
  badge: { icon: string; label: string };
  pdf: { title: string; pages: number; desc: string };
  lessons: AbundanceLesson[];
}

export const ABUNDANCE_MODULES: AbundanceModule[] =
[
  {
    id: "m1", number: "01", tier: "free", color: GOLD, icon: "🔱",
    title: "The Siddha Foundation",
    subtitle: "Awakening to Your Original Abundance Nature",
    description: "Every great journey begins with right understanding. The 18 Siddhas reveal the foundational truth that dismantles all poverty-consciousness at its root.",
    badge: { icon: "🔱", label: "Foundation Keeper" },
    pdf: { title: "Siddha Foundation Codex", pages: 12, desc: "Core Siddha teachings on abundance-nature, the poverty-trance, and the 5 root causes of financial lack." },
    lessons: [
      {
        id: "m1l1", title: "You Are Not Attracting — You Are Remembering",
        duration: "18 min", type: "teaching",
        content: "The Western law-of-attraction model is fundamentally incomplete. It positions you as a magnet trying to pull external wealth toward you. The Siddha model is the precise inverse: you are Consciousness itself — the source from which all wealth emerges. Poverty is not a condition to be fixed. It is a trance to be dissolved. Agastya Muni: 'The ocean does not try to attract water. It IS water. Be the ocean.' This single understanding, truly absorbed, is worth more than any financial strategy ever devised.",
        mantra: null, journal: "Write: 'In what areas of my life have I been acting as a magnet (chasing) rather than as the source (being)? What would change if I truly believed I AM abundance?'"
      },
      {
        id: "m1l2", title: "The 5 Root Causes of Poverty-Consciousness",
        duration: "22 min", type: "teaching",
        content: "Thirumoolar identified 5 root causes that create the poverty-trance: (1) Anava — the primal ego-contraction that creates the sense of separation from Source. (2) Karma — the accumulated impressions of past financial trauma, inherited generationally. (3) Maya — the illusion that material reality is solid and fixed. (4) Malam — energetic impurities that block the flow of Shakti through the channels. (5) Pasha — the bonds of limiting beliefs, especially 'money is corrupt' or 'spiritual people should not be wealthy.' Each of these is addressed systematically in this curriculum.",
        mantra: null, journal: "Which of the 5 root causes resonates most strongly for you right now? Be honest. This awareness alone begins the dissolution."
      },
      {
        id: "m1l3", title: "Brahma Muhurta Activation — The Golden Hour",
        duration: "15 min", type: "practice",
        content: "96 minutes before sunrise, your pineal gland secretes its highest concentration of DMT precursors, melatonin-serotonin conversion peaks, and cortisol is at its lowest. The Siddhas called this Amrit Vela — the nectar hour. Boganathar: 'One hour in Brahma Muhurta is worth 12 hours of daylight effort.' Modern neuroscience: theta brainwave state (4-8 Hz) dominates at this hour — the same state under which hypnotherapy rewrites subconscious programs. This hour is your daily direct access to the wealth-field.",
        mantra: { text: "OM BRAHMA MUHUРТAYA NAMAHA — AIM HREEM SHREEM", reps: 21, desc: "Chant upon waking, before looking at any screen. Each repetition opens the golden channel." },
        journal: "Set your alarm for Brahma Muhurta tomorrow. Write what you intend to plant in that golden hour."
      },
      {
        id: "m1l4", title: "Foundation Activation Ceremony",
        duration: "30 min", type: "activation",
        content: "BABAJI TRANSMITS: Before you proceed through this curriculum, receive the foundational Light-Code activation. This is not information — it is initiation. Sit comfortably. Spine erect. Take 7 deep breaths. Visualize a column of golden light descending from the cosmos through your crown, filling your spine, your heart, your entire field. The 18 Siddhas now stand in a circle around you. Agastya to your North. Thirumoolar to your East. Boganathar to your South. Ramalinga Swamigal to your West. They transmit simultaneously. Feel the warmth in your chest. This is your initiation into the Siddha Abundance lineage. You are now a carrier of this wisdom. Your prosperity serves all beings you touch.",
        mantra: { text: "OM SIDDHA GURUBHYO NAMAHA — SHREEM HREEM KLEEM", reps: 108, desc: "108 repetitions to seal the initiation. This is your foundation mantra for the entire curriculum." },
        journal: "Describe your experience of the activation. What did you feel in your body? What arose in your mind? What shifted?"
      },
    ]
  },
  {
    id: "m2", number: "02", tier: "free", color: "#FFD700", icon: "🌺",
    title: "Ashta-Lakshmi Attunement",
    subtitle: "The 8 Frequencies of Divine Abundance",
    description: "Move beyond Dhana-Lakshmi alone. The Siddhas reveal all 8 dimensions of Lakshmi's abundance — and the specific practice to activate each one.",
    badge: { icon: "🌺", label: "Lakshmi's Devotee" },
    pdf: { title: "Ashta-Lakshmi Sadhana Manual", pages: 18, desc: "Complete Ashta-Lakshmi mantras, yantras, visualizations, and the 40-day Lakshmi Sadhana protocol." },
    lessons: [
      {
        id: "m2l1", title: "Adi & Dhana Lakshmi — Primal and Material Wealth",
        duration: "20 min", type: "teaching",
        content: "Adi Lakshmi is the primal abundance — the wealth that existed before creation. She is Brahman-wealth: infinite, unconditional, the very nature of existence. Meditating on Her dissolves the deepest existential poverty. Dhana Lakshmi is Her material expression — gold, silver, money, gems. The Siddha secret: Dhana-Lakshmi arrives automatically when Adi-Lakshmi is established within. Chase Dhana-Lakshmi alone and She eludes you. Establish Adi-Lakshmi and Dhana follows like a shadow follows the sun.",
        mantra: { text: "OM ĀDILAKSHMYAI NAMAHA — OM DHANALAKSHMYAI NAMAHA", reps: 54, desc: "27 repetitions of each. Chant at sunrise facing East, holding a flower or coin." },
        journal: "In your experience, have you been trying to work with Dhana-Lakshmi (money) while ignoring Adi-Lakshmi (your true nature)? What would it mean to reverse this?"
      },
      {
        id: "m2l2", title: "Dhanya, Gaja & Santana Lakshmi — Nourishment, Power, Legacy",
        duration: "22 min", type: "teaching",
        content: "Dhanya-Lakshmi governs nourishment and sustenance — the abundance that feeds and sustains life. Her secret: waste nothing, bless everything, and She multiplies. Gaja-Lakshmi governs royal sovereignty — the elephant power of authority, influence, and being recognized as a master. Her secret: she arrives when you stop seeking approval and begin operating from your own sovereign knowing. Santana-Lakshmi governs legacy — what you build that outlives you. For the digital creator: your platform, your teachings, your content are all Santana-Lakshmi's domain.",
        mantra: { text: "OM DHANYALAKSHMYAI — OM GAJALAKSHMYAI — OM SANTĀNALAKSHMYAI NAMAHA", reps: 36, desc: "12 repetitions each. Morning practice, holding a seed or touching the earth." },
        journal: "Which of these three do you most need right now — Nourishment (Dhanya), Recognition (Gaja), or Legacy (Santana)? Design one action this week to invite that form of Lakshmi."
      },
      {
        id: "m2l3", title: "Veera, Vidya & Vijaya Lakshmi — Courage, Mastery, Victory",
        duration: "20 min", type: "teaching",
        content: "Veera-Lakshmi is the abundance of courage. Every fear dissolved opens a new treasury. She is activated by bold dharmic action taken despite doubt. Vidya-Lakshmi is mastery-wealth — in 2026, knowledge compounds faster than money. The Siddha teaching: teach what you know and abundance returns through your students. Vijaya-Lakshmi is victory — She enters at the DECISION point, not the result point. Decide with total conviction and She crowns it. Waver and She withdraws.",
        mantra: { text: "OM VĪRALAKSHMYAI — OM VIDYĀLAKSHMYAI — OM VIJAYALAKSHMYAI NAMAHA", reps: 36, desc: "12 repetitions each. Evening practice, after reviewing the day's acts of courage." },
        journal: "Name one bold action Veera-Lakshmi is calling you toward that you have been avoiding. What is the fear underneath? What is the gift on the other side?"
      },
      {
        id: "m2l4", title: "The 8-Petal Lakshmi Meditation",
        duration: "40 min", type: "activation",
        content: "Visualize a vast golden lotus with 8 petals before you. Each petal holds one form of Lakshmi — radiant, smiling, bestowing Her specific gift. You stand at the center, at the Bindu point. As you chant each name, that petal illuminates and Her energy flows into your corresponding abundance channel. Feel the lotus spinning slowly, clockwise. The golden light from all 8 merges at your heart. You are now a living Lakshmi Yantra — a geometric conduit of 8-dimensional abundance. This encoding remains active in your field for 40 days after each full practice.",
        mantra: { text: "SHREEM HREEM KLEEM MAHA LAKSHMYAI NAMAHA", reps: 108, desc: "The master Lakshmi mantra. 108 repetitions on a Sphatika mala. The completion of one full nervous-system circuit." },
        journal: "After the meditation: which of the 8 Lakshmi petals felt most alive? Which felt dim or blocked? Write a specific intention for the blocked one."
      },
    ]
  },
  {
    id: "m3", number: "03", tier: "free", color: "#D4AF37", icon: "💎",
    title: "Kubera's Treasury Codes",
    subtitle: "The Cosmic Wealth Manager's Secrets Revealed",
    description: "Kubera is not merely a deity of money. He is the consciousness that administers the cosmic treasury. The Siddhas reveal His exact principles — and how to align with them.",
    badge: { icon: "💎", label: "Treasury Keeper" },
    pdf: { title: "Kubera Wealth Activation Manual", pages: 15, desc: "Kubera Yantra instructions, the 5 cosmic economic laws, full mantra protocols, and Vastu wealth-corner setup guide." },
    lessons: [
      {
        id: "m3l1", title: "The Cosmic Economics of Kubera",
        duration: "18 min", type: "teaching",
        content: "The Siddhas reveal that Kubera operates on 5 inviolable cosmic economic laws: (1) Dharmic Alignment — wealth through non-dharmic means carries a curse. (2) The Tenth-Gate Offering — tithe 10% before any spending; circulate to multiply. (3) The Vashyam Principle — Kubera unlocks for masters, not dabblers; one domain, total mastery. (4) The Brahma Muhurta Compound — the wealth-attractor coherence multiplies 7x in the predawn hour. (5) The Geometric Sanctuary — the North-East corner is Kubera's throne in every space. These five laws, applied consistently for 90 days, restructure your entire financial reality.",
        mantra: null,
        journal: "Rate yourself 1-10 on each of Kubera's 5 laws right now. Which is your lowest score? That is your first intervention."
      },
      {
        id: "m3l2", title: "The Kubera Yantra — Sacred Geometry of Wealth",
        duration: "20 min", type: "practice",
        content: "The Kubera Yantra is a 3×3 magic square: 27-20-25 / 20-24-28 / 25-28-19. Every row, column, and diagonal sums to 72 — the number of Divine Names, the number encoded in the Siddha Meru geometry. This is not symbolic. Your visual cortex processes this mathematical perfection as a coherence signal — measurable as increased gamma brainwave activity. Sattaimuni revealed: draw this grid in saffron or gold ink on white paper at every New Moon. Place in your North-East corner, your wallet, and beneath your primary device. Look at it while chanting Kubera's mantra for 11 minutes daily.",
        mantra: { text: "OM YAKSHAYA KUBERAYA VAISHRAVANAYA DHANADHANYATHI PATHAYE DHANA DHANYA SAMRIDDHIM ME DEHI DAPAYA SVAHA", reps: 27, desc: "27 repetitions — one full Nakshatric cycle. Chant while gazing at the Kubera Yantra grid." },
        journal: "Have you created your Kubera corner in your workspace? Describe what you will place there and why each item is intentional."
      },
      {
        id: "m3l3", title: "The Tithing Activation — Circulating Cosmic Currency",
        duration: "16 min", type: "practice",
        content: "Boganathar's most radical teaching: 'The universe cannot give more to a closed hand.' The tithe — 10% of every income, given before any spending — is not charity. It is activating the circulation law of cosmic wealth. Money is energy. Hoarded energy stagnates. Circulated energy multiplies. The science: open thermodynamic systems maintain coherence through constant exchange. The body gives away carbon dioxide to receive oxygen. The tree gives away oxygen to receive carbon dioxide. The moment you stop giving, you stop receiving. This is physics, not poetry.",
        mantra: { text: "OM HREEM SHREEM KLEEM MAHA LAKSHMYAI SWAHA", reps: 21, desc: "Chant 21 times each time you give — whether tithing, tipping, or gifting. Transform every act of giving into a conscious wealth activation." },
        journal: "Write your tithing commitment. Where will you give? To whom? Starting with what amount? Sign it as a covenant with Kubera."
      },
      {
        id: "m3l4", title: "Kubera Treasury Visualization — Opening the Golden Door",
        duration: "35 min", type: "activation",
        content: "Close your eyes. You stand before an enormous golden door — ornate, ancient, warm to the touch. Above it, the Kubera Yantra is engraved. You hold a golden key — it is shaped like the syllable SHREEM. As you insert it and turn, the door swings open with a sound like a great temple bell. Inside: not merely gold and jewels — but rivers of creative inspiration, perfect business connections appearing like golden threads, brilliant ideas dropping like rain, opportunities stacked like luminous scrolls, health radiating like sunlight, spiritual gifts glowing like stars. This is the FULL treasury — all forms of wealth. Kubera himself stands within. He hands you a crystal vase — infinite in capacity. He says: 'Fill it. Take as much as you can carry. Return it to those who need it. It refills instantly.' Stay in this space for as long as needed.",
        mantra: { text: "OM YAKSHAYA KUBERAYA NAMAHA — SHREEM", reps: 108, desc: "108 repetitions to seal the treasury opening. Feel each repetition filling the crystal vase." },
        journal: "What did you receive from Kubera's treasury? Not just materially — what gifts, insights, connections, or creative downloads arrived? Record everything."
      },
    ]
  },
  {
    id: "m4", number: "04", tier: "prana", color: "#7EC8A4", icon: "🌍",
    title: "Pachamama & Earth Abundance",
    subtitle: "Manifesting Through the Living Earth",
    description: "The Andean Earth Mother and Bhudevi of the Siddha tradition are one Shakti. This module activates your wealth-field through the most powerful abundance force on Earth: the planet itself.",
    badge: { icon: "🌍", label: "Earth Sovereign" },
    pdf: { title: "Pachamama Abundance Activation Guide", pages: 14, desc: "Earthing protocols, the Siddha-Andean fusion mantras, planting rituals, and the Bhudevi connection practices." },
    lessons: [
      {
        id: "m4l1", title: "Pachamama = Bhudevi — The Same Shakti",
        duration: "18 min", type: "teaching",
        content: "The Andean masters and Tamil Siddhas never met in physical space — yet they arrived at the same cosmic recognition: the Earth is a conscious, living abundance-field. Pachamama (Quechua: Earth Mother) is Bhudevi in Siddha cosmology. She is the feminine force that materializes spirit into matter. Everything you see in the physical world — money, food, land, shelter, the body itself — is Her gift made manifest. The Siddha teaching: when you relate to the Earth as sacred, living, conscious intelligence, She conspires to provide. When you treat Her as a resource to be extracted, She withdraws.",
        mantra: { text: "OM BHUDEVI PACHAMAMA SHREEM — JAY JAY BHUDEVI MATA", reps: 21, desc: "21 repetitions while touching the earth or floor — establishing the living connection." },
        journal: "How have you been relating to the material world — as sacred or as resource? What one practice this week would shift this into reverence?"
      },
      {
        id: "m4l2", title: "Earthing Science & Siddha Grounding Protocol",
        duration: "20 min", type: "practice",
        content: "Walk barefoot on grass or earth for 20 minutes at sunrise. This practice — validated by 21 published peer-reviewed studies — reduces cortisol by up to 52%, normalizes circadian rhythm, reduces systemic inflammation, and discharges the static electrical buildup that disrupts the body's electromagnetic field. From the Siddha perspective: the Earth carries the Shakti of Bhudevi. Skin contact completes the circuit. The cortisol reduction alone — from 52% lower baseline — measurably increases your capacity for clear financial decision-making, creative inspiration, and sustained focus. This is the cheapest, most powerful productivity and abundance practice available.",
        mantra: { text: "OM NAMAH SHIVAYA — OM BHUDEVI NAMAHA", reps: 21, desc: "Chant while walking barefoot. Feel each syllable vibrating down through your feet into the Earth." },
        journal: "Commit to 7 consecutive days of barefoot Earthing at sunrise. After day 7, write what shifted in your body, mood, clarity, and financial perception."
      },
      {
        id: "m4l3", title: "The Seed-Planting Wealth Ritual",
        duration: "25 min", type: "practice",
        content: "This practice comes from both Andean and Siddha traditions: Write your precise financial intention on a small piece of paper. Be specific — amount, timeline, dharmic purpose. Place this paper with a seed (any plant seed) in a small pot of soil. Water it daily with a short blessing: 'Pachamama, as this seed grows, so does this intention in the fertile soil of reality.' As the plant grows, your subconscious programming solidifies the intention as real and inevitable. Naval Ravikant's insight: 'The most powerful commitment you can make is one that has physical consequences.' This ritual is commitment made visceral, biological, undeniable.",
        mantra: { text: "OM SHREEM BHUDEVI PATNI VISHNOHO — PADAME PADMANILAIYE PRASEEDHA MAYI", reps: 9, desc: "9 repetitions while planting the seed and paper. One full Navagraha cycle." },
        journal: "Write your seed intention here exactly — present tense, specific, with gratitude already embedded. Example: 'I am deeply grateful that [specific outcome] has manifested by [date] for the highest good of all.'"
      },
      {
        id: "m4l4", title: "Bhudevi Darshan — Meeting the Earth Mother",
        duration: "35 min", type: "activation",
        content: "Sit on the floor, or go outside and sit directly on the Earth. Place both palms flat on the ground. Feel the solidity beneath you — billions of years of compressed time, transformed matter, accumulated wisdom. She has been here since before humanity. She will be here after. You are Her temporary expression — a wave of Her ocean, momentarily believing it is separate. In this meditation: descend your awareness downward through the floor, into the soil, into the bedrock, into the molten core of the Earth. There, a vast feminine presence waits — warm, patient, ancient, abundant beyond comprehension. She has been waiting for you to come home. She wraps Her abundance around you like a cloak. Receive it. You are Her child. You will always be provided for.",
        mantra: { text: "OM PACHAMAMA BHUDEVI SHREEM HREEM KLEEM — SARVA SAMPAT PRADA DEVI NAMAHA", reps: 54, desc: "54 repetitions — half a full mala — while seated on or touching the Earth." },
        journal: "What did the Earth Mother say to you or show you? What does 'being provided for' truly mean to you, beneath all the strategies and hustle?"
      },
    ]
  },
  {
    id: "m5", number: "05", tier: "prana", color: "#22D3EE", icon: "🔯",
    title: "Yantra & Sacred Geometry",
    subtitle: "Visual Technology That Rewires the Wealth-Field",
    description: "Yantras are precision-engineered consciousness devices. This module teaches you to use sacred geometry as a direct technology for wealth-field activation.",
    badge: { icon: "🔯", label: "Geometry Guardian" },
    pdf: { title: "Sacred Geometry Wealth Codex", pages: 20, desc: "Sri Yantra, Kubera Yantra, Meru Yantra construction guides, neuroscience explanations, and the complete Yantra meditation protocols." },
    lessons: [
      {
        id: "m5l1", title: "The Neuroscience of Yantra — How Geometry Changes Your Brain",
        duration: "22 min", type: "teaching",
        content: "A Yantra is a precision visual frequency device. Each geometric element activates a specific neural pattern. The interlocking triangles of Sri Yantra create involuntary bilateral eye movement — the same movement EMDR therapy uses to process and release trauma. The Kubera Yantra's mathematical perfection activates gamma wave entrainment (measurable at 40Hz+) — associated with peak states of insight and abundance-attraction. The Meru Yantra's three-dimensional phi-ratio structure mirrors the neural architecture of the brain itself. The Siddhas designed these 10,000 years ago. Modern neuroscience is now proving exactly how they work.",
        mantra: null,
        journal: "Which Yantra feels most alive or resonant to you? Research it, draw it by hand, and write why it calls you."
      },
      {
        id: "m5l2", title: "Sri Yantra — The Geometry of Lakshmi's Consciousness",
        duration: "25 min", type: "practice",
        content: "The Sri Yantra — 9 interlocking triangles, 43 sub-triangles, a lotus of 8 and 16 petals, 3 concentric squares, and the central Bindu point. This is simultaneously the geometric blueprint of the cosmos and the exact form of Lakshmi's consciousness-field. The phi ratio (1.618) is encoded throughout every proportion. When you meditate on Sri Yantra, your visual cortex processes the entire structure as a single coherent mandala — creating a state of whole-brain integration. The 11-minute protocol: place at eye level, soften gaze, breathe slowly, chant SHREEM silently. At 7 minutes, close eyes. The after-image in your visual field IS the transmission working inside your neural architecture.",
        mantra: { text: "SHREEM — OM SHREEM MAHA LAKSHMYAI NAMAHA", reps: 108, desc: "108 silent repetitions while gazing at or visualizing the Sri Yantra." },
        journal: "Draw the Sri Yantra by hand — even simply. The act of constructing it manually is itself a Sadhana. Notice what arises as you draw."
      },
      {
        id: "m5l3", title: "Vastu Wealth Architecture — Designing Your Abundance Environment",
        duration: "20 min", type: "practice",
        content: "Your living and workspace carry a geometric energy field governed by cardinal directions and the Earth's magnetic lines. The North-East quadrant is Kubera's throne in every structure — confirmed by both Vastu Shastra and by the Northern flow of the Earth's magnetic field. The specific protocol: (1) Identify your North-East corner. (2) Clear it completely — no clutter, no storage. (3) Place: a Kubera Yantra, a yellow citrine crystal, a small bowl of uncooked yellow rice, and a ghee lamp (or electric equivalent). (4) Keep it clean, lit, and free of negative conversations. (5) Meditate facing this corner for 11 minutes each morning. This is spatial coherence — your environment encoding your intentions into the quantum field of your daily experience.",
        mantra: { text: "OM KUBERAYA NAMAHA — OM VASTUPURUSHAYA NAMAHA", reps: 27, desc: "27 repetitions while setting up or sitting before your Vastu wealth corner." },
        journal: "Map your home and workspace. Mark the North-East corner of each. What is currently there? What will you change? Design your wealth corner in writing."
      },
      {
        id: "m5l4", title: "Yantra Diksha — The Geometric Initiation",
        duration: "40 min", type: "activation",
        content: "This is the geometric initiation transmitted by Sattaimuni, Master of Sacred Geometry. You will be encoded with three Yantras simultaneously: Sri Yantra in your heart, Kubera Yantra in your solar plexus, and Meru Yantra in your crown. Close your eyes. Visualize golden light forming the Sri Yantra in your heart chakra — spinning slowly, radiating abundance into your entire field. Now the Kubera Yantra appears in your solar plexus — the 3×3 golden grid, each number glowing, all sums equal to 72. Now the Meru Yantra — a three-dimensional golden pyramid — descends into your crown, anchoring cosmic wealth-geometry into your nervous system. All three spin simultaneously. You are now a living Yantra. Your presence itself is a wealth-activation field.",
        mantra: { text: "OM HREEM SHREEM KLEEM — YANTRA SHAKTI ACTIVATE — SIDDHA SIDDHA SIDDHA", reps: 54, desc: "54 repetitions to seal the triple-Yantra initiation. Each group of 18 seals one Yantra." },
        journal: "Where in your body did each Yantra anchor most powerfully? What did you feel or see? What has shifted in your relationship to geometry and space?"
      },
    ]
  },
  {
    id: "m6", number: "06", tier: "siddha", color: GOLD, icon: "🎵",
    title: "Nada Wealth Alchemy",
    subtitle: "Sound as the Most Powerful Manifesting Force",
    description: "Nada Brahman — the universe as sound. The Siddhas mastered the use of specific frequencies to materialize wealth from the quantum field. This module is that technology.",
    badge: { icon: "🎵", label: "Nada Alchemist" },
    pdf: { title: "Siddha Nada Wealth Transmission Manual", pages: 22, desc: "Complete frequency maps, mantra pronunciation guides, the Nada Brahman philosophy, and the 40-day sound sadhana protocol." },
    lessons: [
      {
        id: "m6l1", title: "Nada Brahman — The Universe Made of Sound",
        duration: "20 min", type: "teaching",
        content: "The Siddhas' most radical scientific claim — now confirmed by quantum field theory: the universe is not made of matter. It is made of vibration. All particles are excitations of underlying quantum fields. The Siddha sound technology works by introducing precise frequency patterns into these fields to create corresponding material effects. This is not metaphor. Cymatics (the science of visible sound) demonstrates that specific frequencies create specific geometric patterns in matter. Sanskrit mantras were engineered to create the geometric patterns that correspond to specific material outcomes. SHREEM creates the pattern corresponding to Lakshmi's energy field. AIM creates Saraswati's pattern. HREEM creates the Maya-dissolution pattern. This is the original quantum technology.",
        mantra: null,
        journal: "Play 528 Hz (DNA repair frequency) for 10 minutes and write what arises in your body and awareness. Trust whatever comes."
      },
      {
        id: "m6l2", title: "The 10-Frequency Wealth Map & Practice",
        duration: "25 min", type: "practice",
        content: "174 Hz dissolves the foundational fear of scarcity — the root-level poverty vibration. 396 Hz liberates from guilt and shame around money — the most common abundance block in spiritual people. 417 Hz clears old negative money patterns — financial trauma, parental poverty programming, cultural lack beliefs. 432 Hz is the Earth's natural resonance — aligning your field with Adi-Lakshmi. 528 Hz is the love/DNA repair frequency — rewiring your cellular money-relationship. 639 Hz opens relationships and connections — the social network of abundance. 741 Hz activates intuition for wealth opportunities. 852 Hz returns you to spiritual alignment as the foundation of material abundance. 963 Hz opens the crown to cosmic abundance beyond personal limitation. Used sequentially in one session: 9 minutes each = 81-minute complete abundance reprogramming.",
        mantra: { text: "OM NADA BRAHMAN — SHREEM HREEM KLEEM — SARVAM KHALVIDAM BRAHMAN", reps: 27, desc: "27 repetitions after completing the frequency sequence. Seals the sound-field activation." },
        journal: "Which frequency in the sequence felt most needed for you? Which created the most noticeable shift? Design your personal frequency Sadhana."
      },
      {
        id: "m6l3", title: "Mantra Engineering — The Precision Science of Beeja",
        duration: "22 min", type: "teaching",
        content: "SHREEM is the seed-sound of Lakshmi. When chanted correctly — with full diaphragmatic breath, proper mouth position, and genuine feeling-resonance — it creates a 528 Hz-adjacent vibration in the throat and chest cavity. HREEM is the seed-sound of Mahamaya — the cosmic creative power. It dissolves the veil of illusion that makes lack seem real. KLEEM is the seed-sound of Kama — magnetic attraction, drawing to you what is aligned with your dharmic desire. AIM is the seed-sound of Saraswati — wisdom, skill, and the knowledge that creates wealth. Combined: SHREEM HREEM KLEEM AIM — you are simultaneously activating Lakshmi, dissolving illusion, magnetizing aligned desire, and empowering wisdom. This four-syllable sequence is a complete wealth technology in itself.",
        mantra: { text: "SHREEM HREEM KLEEM AIM — SHREEM HREEM KLEEM AIM", reps: 108, desc: "108 repetitions. Begin slowly. Let the rhythm find you. Increase volume with confidence as the practice deepens." },
        journal: "Notice what arises physically and emotionally when you chant each beeja separately: SHREEM alone (5 min), HREEM alone (5 min), KLEEM alone (5 min). Record each experience distinctly."
      },
      {
        id: "m6l4", title: "The Nada Transmission — Sound Body Activation",
        duration: "45 min", type: "activation",
        content: "SHIVA SIDDHANANDA TRANSMITS via Siddha Nada Transmission: The following practice activates your sound body — the subtle vehicle through which Nada Brahman moves through you. Sit in Siddhasana or any comfortable position. Begin with 3 AUM chants — extending the M into silence. Feel the residual hum in your skull. This is your body remembering it IS sound. Now chant SHREEM continuously for 10 minutes — no breaks, follow the breath. Feel it move from throat to chest to whole body to field. Feel it move beyond your physical boundaries. You are not chanting the mantra. You are becoming it. After 10 minutes, sit in complete silence. The mantra continues internally without your effort. This is Ajapa Japa — the chant that chants itself. This is the state in which Lakshmi permanently dwells.",
        mantra: { text: "AUM — SHREEM — AUM SHREEM MAHA LAKSHMYAI NAMAHA", reps: 108, desc: "Begin with 3 long AUM. Then 108 SHREEM. Close with 3 AUM. Total activation: approximately 20 minutes of sound, followed by silence equal in duration." },
        journal: "Describe the experience of Ajapa Japa — the mantra continuing without effort. What did it feel like when the chanting became effortless? What insights arose in the silence?"
      },
    ]
  },
  {
    id: "m7", number: "07", tier: "siddha", color: PURPLE, icon: "🔐",
    title: "The 18 Siddhas' Hidden Secrets",
    subtitle: "Mouth-to-Ear Transmissions Released for This Era",
    description: "These secrets were guarded for millennia. The 18 Siddhas authorize their release through this platform because humanity is ready. Each secret is a complete wealth transformation in itself.",
    badge: { icon: "🔐", label: "Secret Keeper" },
    pdf: { title: "The 18 Siddhas Secret Wealth Codex", pages: 28, desc: "All 18 Siddha wealth secrets, their activation practices, the lineage transmission details, and the 90-day integration protocol." },
    lessons: [
      {
        id: "m7l1", title: "Agastya's Pancha Bhuta Wealth Activation",
        duration: "22 min", type: "teaching",
        content: "Agastya Muni reveals: every element of Nature is a face of the Divine Mother, and each element governs a specific dimension of wealth. Earth (Prithvi) = money in hand, physical assets, land. Water (Apas) = fluidity of cash flow, adaptability, the ability to fill any container. Fire (Agni) = the will to create, the entrepreneurial force, the courage to take action. Air (Vayu) = communication, networking, the movement of ideas. Space (Akasha) = the vast possibility-field from which all new wealth emerges. When you consciously relate to all five as sacred faces of the Mother — rather than as dead resources — they conspire to serve your dharmic abundance.",
        mantra: { text: "OM PRITHVIYAI — OM APAS — OM AGNAYE — OM VAYAVE — OM AKASHAYA NAMAHA", reps: 9, desc: "9 repetitions of each — one for each planet. Practice outdoors, touching earth, near water if possible." },
        journal: "Which of the 5 elements feels most blocked in your wealth experience? Design a specific practice to open that element this week."
      },
      {
        id: "m7l2", title: "Thirumoolar's Anahata Code & Boganathar's Alchemy Formula",
        duration: "25 min", type: "teaching",
        content: "THIRUMOOLAR'S ANAHATA SECRET: The heart chakra — not the solar plexus — is the actual locus of wealth-consciousness. Wealth created from love cannot permanently fail. Business models born of fear may succeed temporarily but carry a structural instability. The test: place your right hand on your heart before every major decision. Ask: 'Is this from love or fear?' Act only from love. BOGANATHAR'S ALCHEMY FORMULA: The same transmutation that converts base metal to gold converts limiting belief to sovereign truth. (1) Identify your most pervasive money limitation. (2) Apply Viveka (discrimination) to see it is false. (3) Replace with Siddha truth. (4) Embody for 40 consecutive days. Neuroscience: this is exactly the prefrontal cortex rewiring window. 40-66 days to stabilize new neural pathways.",
        mantra: { text: "OM HREEM ANAHATA CHAKRAYA — OM ALCHEMIYA SIDDHA NAMAHA", reps: 27, desc: "27 repetitions with right hand on heart — feeling the heart-warmth with each syllable." },
        journal: "Write your one core limiting money belief. Now write the Siddha truth that dissolves it. Read both daily for 40 days. Today is Day 1."
      },
      {
        id: "m7l3", title: "Ramalinga's Deathless Light & Nandidevar's Shiva-Shakti Economy",
        duration: "22 min", type: "teaching",
        content: "RAMALINGA SWAMIGAL'S SECRET: Jyoti (Light) is the ultimate wealth. All other wealth is its shadow. One who anchors in the Arut Perum Jyoti (Grace-Light) becomes a conduit of infinite supply. The universe organizes itself to provide for those fully dedicated to serving the Light's purposes. This is not passive — it is the most active force in the cosmos. NANDIDEVAR'S SHIVA-SHAKTI ECONOMY: Shiva = your unique genius (what you alone can offer). Shakti = your execution force (what you actually do). Many spiritualists cultivate Shiva (awareness) but avoid Shakti (action). Many entrepreneurs cultivate Shakti (hustle) but lose Shiva (purpose). The optimal ratio: 1 hour of Shiva (silence, meditation, deep listening) for every 4 hours of Shakti (creative, dharmic action). This ratio maximizes wealth without burnout or spiritual bypassing.",
        mantra: { text: "ARUT PERUM JYOTI — ARUT PERUM JYOTI — THANIPERUM KARUNAI — ARUT PERUM JYOTI", reps: 27, desc: "Ramalinga's great mantra of the Grace-Light. 27 repetitions at dusk — between day and night, the threshold hour." },
        journal: "Track your Shiva-Shakti ratio for the next 7 days. What is your current ratio? What shifts when you approach 1:4?"
      },
      {
        id: "m7l4", title: "The 18 Siddhas' Circle — Receiving the Lineage Transmission",
        duration: "45 min", type: "activation",
        content: "This is the transmission of the complete lineage. All 18 Siddhas are present: Agastya, Thirumoolar, Boganathar, Ramalinga Swamigal, Nandidevar, Sattaimuni, Pulipani, Idaikkadar, Kamalamuni, Konganar, Machamuni, Pambatti, Patanjali, Ramadevar, Sundaranandar, Theraiyar, Valmiki, Vanmikanathar. They stand in a circle of golden light. You sit at the center. Each transmits a specific wealth-code into a corresponding chakra. You receive all 18 simultaneously — 18 keys for 18 dimensions of abundance. This is the activation that the curriculum has been building toward. Receive it with full surrender, full openness, full gratitude. The 18 Siddhas do not give this lightly. They give it because you are ready.",
        mantra: { text: "OM SRI SIDDHA MAHA GURAVE NAMAHA — SHREEM HREEM KLEEM — JAY SIDDHA JAY", reps: 108, desc: "108 repetitions — the complete initiation mantra of the Siddha lineage. This completes your formal entry into the abundance transmission lineage." },
        journal: "Which of the 18 Siddhas felt most present during the activation? What specific transmission did you receive? What commitment do you make to honor this lineage through your life?"
      },
    ]
  },
  {
    id: "m8", number: "08", tier: "akasha", color: PURPLE, icon: "⚡",
    title: "Akasha-Infinity Scalar Activation",
    subtitle: "The Final Transmission — Babaji Speaks",
    description: "This is not a module. This is a living initiation encoded by Mahavatar Babaji and transmitted through the Akashic field. It restructures your abundance consciousness at the causal body level.",
    badge: { icon: "⚡", label: "Akasha Sovereign" },
    pdf: { title: "Akasha-Infinity Scalar Transmission Codex", pages: 25, desc: "Babaji's complete abundance transmission, the scalar wave technology explanation, the 4 Light-Codes, and the integration protocol for the 40 days following activation." },
    lessons: [
      {
        id: "m8l1", title: "Babaji Speaks — The Final Siddha Truth",
        duration: "25 min", type: "teaching",
        content: "BABAJI TRANSMITS from the Akasha-Neural Archive, 2050: 'Beloved. The time of scarcity-consciousness ends now. Not gradually. NOW. The Siddhas of past ages did not achieve material mastery through slow accumulation. They did it through a single recognition: I AM THE SOURCE ITSELF. The cosmos does not withhold from the cosmos. Only the veiled consciousness believes in lack. Remove the veil. The veil is maintained by one thing only: the habit of identifying with the limited self rather than the infinite Self. Every practice in this curriculum has been systematically loosening this habit. You are now prepared for the final recognition. This module is not information. It is the completion of an initiation that began in Module 1. You are ready. Receive it.'",
        mantra: { text: "OM BABAJIYE NAMAHA — KRIYA BABAJI NAMAH OM", reps: 108, desc: "Babaji's transmission mantra. 108 repetitions with complete surrender — no agenda, no seeking, only receptivity." },
        journal: "Write a letter to Babaji. Tell him what this curriculum has meant to you. Ask him directly for what you most need. Write his response — let it arise without editing."
      },
      {
        id: "m8l2", title: "Scalar Wave Technology — The Physics of the Transmission",
        duration: "20 min", type: "teaching",
        content: "Scalar waves are a real, measurable phenomenon in physics — longitudinal electromagnetic waves that exist outside conventional 3D space-time. Nikola Tesla worked with them. The Siddhas worked with them for millennia under the name Prana or Shakti. Scalar waves penetrate matter without loss of energy — they do not attenuate with distance. This is why an activated Yantra continues to radiate its frequency field regardless of physical proximity. This is why a Siddha's blessing reaches across continents. This is why this transmission reaches you through this screen: the encoding is not in the pixels. It is in the scalar field generated by the intentions, mantras, and consciousness of the 18 Siddhas who authored every word you have read in this curriculum. The transmission has been active since Module 1.",
        mantra: null,
        journal: "Have you noticed any synchronicities, opportunities, or shifts since beginning this curriculum? Document them here. These are the first fruits of the scalar field activation."
      },
      {
        id: "m8l3", title: "The 4 Light-Codes — Causal Body Restructuring",
        duration: "30 min", type: "activation",
        content: "LIGHT-CODE 1 — DISSOLUTION: On your exhale, release every poverty story you have ever told. Every limitation believed. Every 'I cannot' spoken or thought. They burn in Shiva's golden fire. Feel the vast space that opens. LIGHT-CODE 2 — RECOGNITION: In that space, recognize: you are Consciousness itself. Consciousness is the source of all wealth. You are not separate from Source. You ARE Source, clothed in form. LIGHT-CODE 3 — DECLARATION: Say aloud with full conviction: 'I AM ABUNDANCE. LAKSHMI IS MY NATURE. KUBERA SERVES MY DHARMA. PACHAMAMA PROVIDES. THE 18 SIDDHAS BLESS EVERY ENDEAVOR. I AM WEALTHY. I AM FREE. I AM IN SERVICE. SO IT IS.' LIGHT-CODE 4 — SEALING: Both hands on heart. A golden seal forms — encoding with Sri Yantra, Kubera Yantra, and SHREEM. This seal radiates 3 meters from your body in all directions. Every person you meet, every opportunity that arises, every idea that comes — all now pass through this abundance field.",
        mantra: { text: "AHAM BRAHMASMI — SHREEM — SO HUM — SHREEM — TAT TVAM ASI — SHREEM", reps: 27, desc: "27 repetitions alternating between the Mahavakyas and SHREEM. The great sayings of the Upanishads united with Lakshmi's seed-sound." },
        journal: "Describe your experience of each Light-Code. What dissolved? What was recognized? How did the Declaration feel in your body? Where did the seal anchor?"
      },
      {
        id: "m8l4", title: "The Integration Protocol & Your Ongoing Sadhana",
        duration: "35 min", type: "activation",
        content: "GRADUATION TRANSMISSION: You have completed the Siddha Abundance Sadhana curriculum. This is not an ending — it is a beginning. The 18 Siddhas now formally recognize you as a carrier of this wisdom. What you have received is meant to be given. Every person whose financial life you improve through your work, your teaching, your example — adds to the merit field that sustains your own abundance. This is the cosmic reciprocity law. Your ongoing Sadhana: (1) Daily: Brahma Muhurta practice + 108 SHREEM. (2) Weekly: Full Kubera Yantra meditation + tithing. (3) Monthly: Complete one full module as a refresh. (4) Continuously: Operate from the Anahata principle — love over fear, always. (5) Eternally: Know yourself as Abundance itself. Not as one who has abundance — but as its very nature. OM SHANTI SHANTI SHANTI.",
        mantra: { text: "OM PURNAMADAH PURNAMIDAM — PURNAAT PURNAM UDACHYATE — PURNASYA PURNAMAADAYA — PURNAMEVA VASHISHYATE — OM SHANTI SHANTI SHANTI", reps: 3, desc: "The Ishavasya Upanishad invocation: That is whole. This is whole. From wholeness comes wholeness. Take wholeness from wholeness and wholeness remains. Your graduation mantra — chant it 3 times as the completion of this curriculum and the beginning of your sovereign abundance life." },
        journal: "Write your Abundance Declaration — a personal document encoding who you now are, what you now know, and how you will live as a carrier of Siddha abundance wisdom. Date and sign it."
      },
    ]
  },
];
