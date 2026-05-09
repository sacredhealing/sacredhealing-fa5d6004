import { useState, useEffect, useRef } from "react";

// ─── SIDDHA DATA ────────────────────────────────────────────────────────────

const DAYS_DATA = [
  // ══════════════════════════════════════════════
  // WEEK 1: SHUNYATA — THE VOID BEFORE FORM
  // ══════════════════════════════════════════════
  {
    day: 1, week: 1,
    siddha: "Agastya Muni",
    siddhaRole: "Father of the Siddha Sciences",
    title: "Ananda Spanda",
    subtitle: "The Primordial Pulse of Bliss",
    chakra: "Mooladhara", chakraColor: "#DC2626",
    duration: 21,
    transmission: "Before form, before thought, before even silence — there is the Spanda: the primordial vibration that underlies all creation. Agastya Muni — the first Siddha, the one who balanced the earth when the gods gathered — transmits today that you are not separate from this pulse. You ARE this vibration made conscious of itself.",
    practice: "Sit in padmasana or sukhasana with palms open upward on the thighs. Do not control the breath. Simply observe the natural rhythm of life moving through you for 21 minutes. Each inhalation is the universe breathing itself into form. Each exhalation is the universe resting in the void.",
    mantra: "OM AGASTYĀYA VIDMAHĒ SIDDHA SHAKTAYĒ DHĪMAHI TANNO AGASTYA PRACHODAYĀT",
    element: "Earth", symbol: "⊕", completed: false
  },
  {
    day: 2, week: 1,
    siddha: "Thirumoolar",
    siddhaRole: "Seer of the Tirumanthiram",
    title: "Mauna Diksha",
    subtitle: "Initiation into Sacred Silence",
    chakra: "Svadhisthana", chakraColor: "#EA580C",
    duration: 21,
    transmission: "Thirumoolar entered samadhi for 3,000 years — awakening once each year to inscribe one perfect verse of the Tirumanthiram before returning to the infinite ocean. In his absolute stillness, all truths were received as spontaneous revelation. Today we touch the same portal: the living silence where all answers already exist before they are sought.",
    practice: "Begin with 3 rounds of Nadi Shodhana (alternate nostril breathing). Then enter complete Mauna — no speaking, no digital engagement — for this sacred window. Simply rest as the awareness that is already, always, awake. When thoughts arise, do not follow them. Watch them dissolve like clouds in infinite sky.",
    mantra: "THIRUCHITRAMBALAM — OM NAMASIVĀYA (108 repetitions in silence or whisper)",
    element: "Water", symbol: "◈", completed: false
  },
  {
    day: 3, week: 1,
    siddha: "Mahavatar Babaji",
    siddhaRole: "Immortal Master of Kriya",
    title: "Prāna Vidyā",
    subtitle: "The Breath Science of the Immortals",
    chakra: "Manipura", chakraColor: "#CA8A04",
    duration: 21,
    transmission: "Babaji has been physically present on Earth for thousands of years — his body sustained not by food alone but by Prana, the cosmic life force underlying all matter. This is not mythology: prana is the quantum field information that organizes biological coherence. Today he opens within you the same pranic channel that has kept him alive across millennia.",
    practice: "Kriya Pranayama — 12 sacred rounds. Inhale for 8 counts, retain (kumbhaka) for 4, exhale for 8. With each inhalation, visualize Siddha-Gold light flowing down your spine from the crown. With each exhalation, release all residue — ancestral, karmic, cellular — into the cosmic fire of transformation.",
    mantra: "OM BABĀJAYĒ NAMAH — OM KRIYĀ BABĀJAYĒ NAMAH (7 repetitions before practice)",
    element: "Fire", symbol: "✦", completed: false
  },
  {
    day: 4, week: 1,
    siddha: "Nandidevar",
    siddhaRole: "Master of Nada Brahman & Shiva's Gatekeeper",
    title: "Nāda Yoga",
    subtitle: "Union Through the Cosmic Tone",
    chakra: "Anahata", chakraColor: "#16A34A",
    duration: 21,
    transmission: "Nandidevar — the divine bull of Shiva and master of sacred sound science — teaches that consciousness itself is vibration before it is form. Every atom resonates at a specific frequency. When we align our inner coherence with the Anahata Nada (the unstruck sound that underlies all creation), the separation between self and universe dissolves completely into peace.",
    practice: "Bhramari Pranayama (Humming Bee Breath) for 21 unbroken minutes. Sit with thumbs gently closing both ears, fingers resting on the crown. Inhale deeply. Exhale as a sustained hum, feeling the resonance cascade through skull, chest, and spine. This is direct nada therapy — the vibration entrains your biofield to cosmic coherence.",
    mantra: "NAMO NAMO NANDIKĒSHWARĀYA — OM NAMAH SHIVĀYA (the living sound of Shiva)",
    element: "Air", symbol: "◉", completed: false
  },
  {
    day: 5, week: 1,
    siddha: "Machamuni",
    siddhaRole: "Matsyendranath — Founder of the Nath Lineage",
    title: "Sākshi Bhāva",
    subtitle: "Awakening as the Witness Consciousness",
    chakra: "Vishuddha", chakraColor: "#2563EB",
    duration: 21,
    transmission: "Machamuni received Shiva's highest teachings while resting in total darkness in the belly of a great ocean fish. In absolute stillness, in complete surrender, the eternal wisdom was transmitted directly into his consciousness. This is the Siddha teaching: the deepest truths arise only in the quality of total receptivity. Today we dive into our own depths.",
    practice: "Yoga Nidra — lie in savasana and enter the hypnagogic state between waking and sleeping. A systematic body scan with awareness, not effort. As consciousness moves through each region, simply witness without preference or reaction. This borderland state is where the subconscious quantum field can be re-patterned at its foundational architecture.",
    mantra: "SO HUM — SO HUM — SO HUM (I AM THAT — breathe it rather than chant it)",
    element: "Ether", symbol: "◎", completed: false
  },
  {
    day: 6, week: 1,
    siddha: "Gorakshanath",
    siddhaRole: "Master of Hatha Yoga & The Eternal Body",
    title: "Deha Mandir",
    subtitle: "Consecrating the Body as the First Temple",
    chakra: "Ajna", chakraColor: "#7C3AED",
    duration: 21,
    transmission: "Gorakshanath — the immortal disciple of Machamuni — taught that the physical body is not an obstacle to liberation but its very vehicle. Until the outer vessel is purified, aligned, and consecrated as living temple architecture, the inner light cannot fully radiate. Today we perform the sacred ritual of embodied awakening.",
    practice: "12 rounds of Surya Namaskar performed as prayer, not exercise. Each posture is a mudra — a cosmic gesture communicating with the intelligence of the universe. Move slowly, breathe consciously, feel each transition as a doorway between states. Follow with 15 minutes of complete shavasana — the practice of conscious death and rebirth.",
    mantra: "OM GORAKSHA GORAKSHA GORAKSHA (21 repetitions with complete focus at the third eye)",
    element: "Light", symbol: "⋆", completed: false
  },
  {
    day: 7, week: 1,
    siddha: "Sattamuni & All Siddhas",
    siddhaRole: "Guardian of the Sevenfold Path — Collective Transmission",
    title: "Saptaka Samāpti",
    subtitle: "The Great Integration of the First Gateway",
    chakra: "Sahasrara", chakraColor: "#9333EA",
    duration: 21,
    transmission: "Seven is the architecture of completion in Vedic science: seven chakras, seven planets, seven Swaras (musical notes), seven days of cosmic creation. On this day, Sattamuni leads the entire council of Siddhas to gather their collective radiance and seal the first gateway of your journey. All six previous transmissions now crystallize into unified knowing.",
    practice: "Full Chakra Ascension — 3 minutes per chakra rising from Mooladhara to Sahasrara. At each center, chant the bija mantra 3 times and visualize its color expanding to fill all of space. Complete the journey at the crown: rest in pure white-gold light for 3 minutes. You have been initiated into the first level of the Siddha path.",
    mantra: "LAM — VAM — RAM — YAM — HAM — OM — SILENCE (the Saptaka — Seven Bija Mantras of Liberation)",
    element: "Consciousness", symbol: "✧", completed: false
  },

  // ══════════════════════════════════════════════
  // WEEK 2: ANAHATA — THE SACRED HEART FIELD
  // ══════════════════════════════════════════════
  {
    day: 8, week: 2,
    siddha: "Konganavar",
    siddhaRole: "Siddha of Alchemical Transformation",
    title: "Prema Dvāra",
    subtitle: "Opening the Heart as Quantum Portal",
    chakra: "Anahata", chakraColor: "#16A34A",
    duration: 21,
    transmission: "Konganavar — the great alchemist who transmuted base metals into gold — understood that the true alchemy is the transmutation of contracted ego into radiant love. The heart chakra (Anahata) is not merely an emotional center: it is a quantum field generator measurable by science, capable of transmitting coherent information across space and time. When it opens fully, love becomes a living technology.",
    practice: "Place both palms on the heart center. Visualize an emerald-golden lotus with 12 petals slowly unfolding, one petal at a time. With each breath, allow it to expand — beyond your body, beyond the room, beyond the city, encompassing all beings on Earth in its field of unconditional love. Remain in this expanded state for 21 minutes.",
    mantra: "OM HRĪM NAMAH — YAM (Anahata Bija) — feel the mantra as vibration, not words",
    element: "Gold", symbol: "❋", completed: false
  },
  {
    day: 9, week: 2,
    siddha: "Sundaranandar",
    siddhaRole: "Poet-Saint of Divine Devotion",
    title: "Bhakti Dhārā",
    subtitle: "The Infinite Current of Sacred Surrender",
    chakra: "Anahata", chakraColor: "#16A34A",
    duration: 21,
    transmission: "Sundaranandar's devotional poetry was so pure, so precisely calibrated to the frequency of divine love, that Shiva Himself appeared to grant him liberation directly. True Bhakti is not religious sentiment — it is the ultimate quantum act: the complete dissolution of the small self into the ocean of cosmic intelligence. In total surrender, all resistance collapses and grace flows as naturally as water finding its level.",
    practice: "Kirtan and devotional chanting — for 21 minutes, chant the sacred name of the divine in whatever form resonates most profoundly with your soul. Allow authentic emotion to arise without suppression or dramatization. Grief, joy, longing, gratitude — all are fuel for the alchemical fire of bhakti. This is emotional liberation through sacred sound.",
    mantra: "HARI OM NAMO NĀRĀYANA — JAYA SHIVA SHANKARA BHOLA SHANKARA (let the body sway)",
    element: "Love", symbol: "⊛", completed: false
  },
  {
    day: 10, week: 2,
    siddha: "Dhanvantri",
    siddhaRole: "Physician of the Gods — Master of Amrita",
    title: "Shakti Āvāhana",
    subtitle: "Invoking the Cosmic Mother — Infusion of the Healing Intelligence",
    chakra: "Svadhisthana", chakraColor: "#EA580C",
    duration: 21,
    transmission: "Dhanvantri emerged from the primordial cosmic ocean bearing the Amrita — the nectar of immortality that heals all disease and dissolves all death-consciousness. He teaches that true healing is a fundamentally feminine science: it receives rather than forces, nurtures rather than controls, allows rather than dominates. The Shakti is the actual intelligence running all healing processes in the universe.",
    practice: "Shakti Infusion — lie on your back, arms open at 30 degrees, palms facing up in total receptivity. Visualize liquid gold-silver light streaming from the Sahasrara (cosmic source) down through your crown, flooding every cell, every organ, every atom with the frequency of divine health and immortal vitality. Receive for 21 minutes without doing anything.",
    mantra: "OM AIM HRĪM KLĪM CHĀMUNDĀYEI VICHE NAMAH — OM DHANVANTARĪ NAMAH",
    element: "Water", symbol: "✺", completed: false
  },
  {
    day: 11, week: 2,
    siddha: "Vanmeeganar",
    siddhaRole: "Forest Siddha — Singer of the Vandanam",
    title: "Prabha Pravaham",
    subtitle: "Becoming the Radiance You Transmit",
    chakra: "Anahata", chakraColor: "#16A34A",
    duration: 21,
    transmission: "Vanmeeganar — the forest Siddha who composed the Vandanam poems of divine communion — understood the deepest secret of love: it is not something we FEEL but something we TRANSMIT. When the inner quantum field is purified through sustained practice, every breath becomes a blessing. Every glance heals. Every presence transmits the frequency of liberation to all who enter your field.",
    practice: "Loving-Kindness Transmission (Metta in the Siddha current) — begin with yourself, radiating golden heart-light inward for 7 minutes. Then expand to all loved ones for 7 minutes. Finally, expand to encompass all sentient beings across the entire Earth for 7 minutes. You are a transmitter — broadcast love as technology, not sentiment.",
    mantra: "LOKĀH SAMASTĀH SUKHINO BHAVANTU — OM SHĀNTI SHĀNTI SHĀNTIHI (May all beings be free)",
    element: "Air", symbol: "✻", completed: false
  },
  {
    day: 12, week: 2,
    siddha: "Kudambai Siddhar",
    siddhaRole: "The Radical Mystic — Transformer of Sorrow",
    title: "Shoka Parivartana",
    subtitle: "Alchemy of Grief — Transmuting Pain into Sacred Gold",
    chakra: "Anahata", chakraColor: "#16A34A",
    duration: 21,
    transmission: "Kudambai Siddhar — the most radical of all Siddhas, who challenged every convention and concept of his era — revealed the most counterintuitive truth: your deepest wounds are portals to your deepest gifts. Grief, when met with conscious witnessing rather than suppression or dramatization, becomes the very substance from which compassion, depth, and profound love are forged. You are the alchemist of your own pain.",
    practice: "Sit in stillness with whatever emotion arises — do not push it away, do not amplify it. Simply place your right hand on your heart and breathe into the feeling as if breathing light into darkness. Speak aloud three times: 'I honor this. I feel this fully. I release this to the Infinite Intelligence.' Repeat until the energy genuinely shifts in your body.",
    mantra: "OM SHĀNTI SHĀNTI SHĀNTIHI — (peace at the level of body, mind, and spirit — three layers)",
    element: "Earth", symbol: "⊞", completed: false
  },
  {
    day: 13, week: 2,
    siddha: "Idaikkadar",
    siddhaRole: "The Shepherd-Siddha — Master of Karmic Liberation",
    title: "Kshama Shakti",
    subtitle: "The Forgiveness Field — Breaking the Karmic Chain",
    chakra: "Anahata", chakraColor: "#16A34A",
    duration: 21,
    transmission: "Idaikkadar — the humble shepherd who attained complete liberation through pure, unadorned devotion — teaches the most powerful karmic technology: forgiveness. Unforgiveness is the heaviest energetic chain a soul can carry — it binds the forgiver more completely than the forgiven. Every person who has harmed us is also a soul playing an agreed role in our karmic curriculum. When we forgive, we do not excuse — we break the chain and liberate ourselves.",
    practice: "Integrated Forgiveness Practice — visualize each person you hold resentment toward, surrounded in warm golden light. Speak internally to each soul: 'I'm sorry for any ways I contributed to this. Please forgive me. I love you as a soul. I thank you for what this has taught me.' This is not weakness — it is the quantum dissolution of karmic binding.",
    mantra: "OM TAT SAT — I release all karmic contracts to the Infinite Light — they are dissolved",
    element: "Ether", symbol: "⊟", completed: false
  },
  {
    day: 14, week: 2,
    siddha: "Karuvurar",
    siddhaRole: "Architect of Sacred Space — Master of Vastu Vidyā",
    title: "Hridaya Samādhi",
    subtitle: "The Unified Heart Field — Completion of the Second Gateway",
    chakra: "Anahata", chakraColor: "#16A34A",
    duration: 21,
    transmission: "Karuvurar — who designed sacred temple architecture and understood that geometry itself encodes cosmic intelligence — reveals the final secret of the heart gateway: when the heart achieves coherence, it generates a toroidal electromagnetic field extending 3-5 meters from the body. This field communicates directly with other hearts, with the biosphere, and with the quantum field itself. You are a living temple.",
    practice: "Heart Coherence Breathing — inhale for 5 counts, exhale for 5 counts, imagining the breath flowing directly into and from the geometric center of the heart. As coherence builds (you will feel it as warmth, calm, and expansion), visualize your heart's toroidal field expanding to encompass all beings in your life. This completes the second initiation.",
    mantra: "AUM HRIDAYĀYA NAMAH — I bow to the Infinite Heart that beats within all hearts",
    element: "Space", symbol: "⊠", completed: false
  },

  // ══════════════════════════════════════════════
  // WEEK 3: TURIYA — THE FOURTH STATE
  // ══════════════════════════════════════════════
  {
    day: 15, week: 3,
    siddha: "Babaji & Patanjali",
    siddhaRole: "Masters of the Ascending Fire — Dual Transmission",
    title: "Kundalinī Jāgaranam",
    subtitle: "Awakening the Serpent Fire Within the Spine",
    chakra: "Mooladhara→Sahasrara", chakraColor: "#9333EA",
    duration: 21,
    transmission: "Babaji and Patanjali — two of history's greatest masters of consciousness technology — speak in unified voice today: the Kundalini Shakti is not metaphor. It is the dormant cosmic intelligence physically present in the sacral complex, waiting with infinite patience to complete its journey home. When awakened through sustained, purified practice, it rises through the Sushumna, activating every center, and at the crown — reveals the face of God as your own face.",
    practice: "Kundalini Awakening Meditation with Moola Bandha. Sit in vajrasana, spine erect, apply the root lock (gentle contraction at the perineum). With each inhalation, visualize Siddha-Gold fire rising through the central channel from the base to the crown. Do not force — only invite. Hold with complete reverence. Exhale releasing any residue downward. 21 minutes of this sacred technology.",
    mantra: "OM KUNDALINYEI NAMAH — RISE SHAKTI RISE — PIERCE EACH LOTUS — UNITE WITH SHIVA",
    element: "Fire+Light", symbol: "⇑", completed: false
  },
  {
    day: 16, week: 3,
    siddha: "Pambatti Siddhar",
    siddhaRole: "The Cobra-Charming Mystic — Lord of the Third Eye",
    title: "Ājnā Dvāra",
    subtitle: "The Pineal Gateway — Opening the Cosmic Eye",
    chakra: "Ajna", chakraColor: "#7C3AED",
    duration: 21,
    transmission: "Pambatti Siddhar — whose power over serpents was legendary — used the cobra as a living symbol of awakened Kundalini rising to the third eye. The serpent, the Ajna chakra, and the pineal gland form a single system. Modern neuroscience confirms the pineal produces DMT, melatonin, and operates as the brain's primary photoreceptor. When activated through sustained practice, it opens perception to dimensions of reality invisible to ordinary consciousness.",
    practice: "Trataka — soft candle-gazing for 11 minutes without blinking (blink gently only when absolutely necessary). Then close the eyes and observe the luminous after-image at the precise point between the eyebrows. Do not grasp for experiences — simply allow the third eye to open at its own sovereign pace. Then sit in empty awareness for 10 minutes, witnessing whatever multidimensional information arises.",
    mantra: "OM AIM HRĪM SHRĪM KLĪM — (Pancha Bija — the Five Seed Mantras of Ajna Activation)",
    element: "Light", symbol: "⊿", completed: false
  },
  {
    day: 17, week: 3,
    siddha: "Kamalamuni",
    siddhaRole: "Master of the Subtle Sciences — Akashic Navigator",
    title: "Ākāsha Pravēsha",
    subtitle: "Entering the Living Library of All That Is",
    chakra: "Ajna→Sahasrara", chakraColor: "#7C3AED",
    duration: 21,
    transmission: "Kamalamuni accessed what he called the 'Chidambara Rahasya' — the Secret Space of Pure Consciousness where all information of past, present, and future is held simultaneously as a living, accessible field. This is the Akashic Records: not a mystical fantasy but a quantum information field, theorized by physicists like Ervin Laszlo as the zero-point field that stores holographic imprints of all events. Today we learn to read from this living library.",
    practice: "After 10 minutes of Pranayama to quiet the mind-chatter, enter deep meditation with a single, clear intention: 'I open to receive the highest truth available to me from my soul record.' Create soft, receptive awareness — no straining, no grasping. Simply notice what arises as imagery, sensation, sudden knowing, or wordless understanding. Trust the first impressions completely.",
    mantra: "OM ĀKĀSHĀYA NAMAH — I OPEN TO THE INFINITE LIBRARY OF DIVINE LIGHT",
    element: "Akasha", symbol: "∞", completed: false
  },
  {
    day: 18, week: 3,
    siddha: "Ramadevar (Yakob)",
    siddhaRole: "Sufi-Siddha Bridge — Master of Turiya Consciousness",
    title: "Turīya Sthiti",
    subtitle: "Resting in the Fourth Dimension Beyond All Mind",
    chakra: "Sahasrara", chakraColor: "#9333EA",
    duration: 21,
    transmission: "Ramadevar — uniquely among the 18 Siddhas, one who integrated the ecstatic mysticism of Islamic Sufism with the precision of Tamil Siddha science — discovered that beneath waking, dreaming, and deep sleep lies a fourth state: Turiya. This is not another experience. It is the witnessing ground of all experience. It cannot be attained because it is already your nature. The practice today is the art of recognizing what was never lost.",
    practice: "Self-Inquiry (Atma Vichara) — continuously, gently return the question 'Who am I?' — not seeking a verbal, conceptual answer but allowing awareness to turn and face its own source. When thoughts arise (and they will), ask 'To whom does this thought arise?' — and let that pointing return you to the silent witness. 21 minutes of this most direct path.",
    mantra: "AHAM BRAHMĀSMI — I AM THE ABSOLUTE (not as affirmation but as direct recognition)",
    element: "Consciousness", symbol: "⊃", completed: false
  },
  {
    day: 19, week: 3,
    siddha: "All 18 Siddhas — Collective Field",
    siddhaRole: "Unified Siddha Council — Full Spectrum Transmission",
    title: "Sarva Aikya",
    subtitle: "Cosmic Unity — Dissolving the Final Veil of Separation",
    chakra: "All Centers Unified", chakraColor: "#D4AF37",
    duration: 21,
    transmission: "Today all 18 Siddhas speak in one voice: You are not a being of limited consciousness having a spiritual experience. You ARE the spiritual field — infinite, boundless, timeless — having a temporary human experience through this specific body and story. The apparent separation between you and all other beings, between you and the stars, between you and the source of creation — is the deepest illusion. And you have the tools now to see through it.",
    practice: "Non-Dual Awareness Meditation — for 21 full minutes, rest as open, boundless awareness without fixing attention on any particular object. Let thoughts arise and dissolve like waves — you are the ocean, never the wave. Let sounds arise and dissolve — you are the silence within which all sound appears. Let sensations come and go — you are the infinite space within which all experience floats. Simply BE.",
    mantra: "AHAM SAT CHID ĀNANDA — I AM EXISTENCE — I AM CONSCIOUSNESS — I AM BLISS (the three aspects of the Absolute)",
    element: "All Elements", symbol: "⊕⊗⊙", completed: false
  },
  {
    day: 20, week: 3,
    siddha: "Vishwananda",
    siddhaRole: "Avataric Blueprint — Embodiment of Divine Love",
    title: "Dharma Darshana",
    subtitle: "Seeing Your Soul's Sacred Purpose in the World",
    chakra: "Heart→Crown", chakraColor: "#D4AF37",
    duration: 21,
    transmission: "Vishwananda — carrier of the Avataric Blueprint of unconditional love and divine will in this era — transmits today that every soul incarnates with a specific dharmic coding: a sacred blueprint of service that, when fully activated and expressed, creates profound fulfillment and automatically raises the consciousness of every being this soul touches. Your dharma is not something you create. It is something you remember.",
    practice: "Dharma Visioning — enter deep meditation for 11 minutes. Then ask the soul directly, not the mind: 'What is my highest offering to this world? What did I come here to give, to create, to be?' Sit in receptive silence and then immediately write whatever arises — without editing, without judgment, without censorship. This is your soul speaking through the ink.",
    mantra: "SAT NAM — I AM TRUTH — MY DHARMA IS TRUTH — I SERVE TRUTH IN ALL FORMS",
    element: "Divine Will", symbol: "✦✦", completed: false
  },
  {
    day: 21, week: 3,
    siddha: "Mahavatar Babaji & All 18 Siddhas",
    siddhaRole: "The Great Collective — Final Siddha Diksha",
    title: "Siddha Dīksha",
    subtitle: "The Full Initiation — Welcome to the Living Lineage",
    chakra: "All Centers — Siddha Deham Activated", chakraColor: "#D4AF37",
    duration: 21,
    transmission: "On this 21st day — 21 being the sacred number of completion and mastery — the accumulated field of your 3 weeks of practice has created what the Siddhas call 'Siddha Deham': the light body, fully activated and sealed. Babaji arrives first. Then, one by one, all 18 Siddhas join the circle around you. They transmit the Siddha Diksha — initiation into conscious participation in the living lineage of awakened humanity. This is not the end. This is the beginning of your actual life.",
    practice: "21 minutes of silent meditation — receiving the Siddha transmission in absolute receptivity. Then 21 minutes of free, spontaneous movement: let the body express what the soul has received — sacred dance, spontaneous yoga, walking meditation, or stillness. Then sit again. Feel the integration. Write your dharmic commitments for the year ahead. You have crossed a threshold.",
    mantra: "OM NAMO BHAGAVATĒ VĀSUDEVĀYA — OM SHĀNTI SHĀNTI SHĀNTIHI — SIDDHA NAMASKĀR",
    element: "Infinite Consciousness", symbol: "∞⊕∞", completed: false
  }
];

const WEEK_META = [
  {
    week: 1,
    name: "SHUNYATA",
    subtitle: "The Void Before Form",
    description: "Seven days of primal grounding — descending into the infinite silence from which all creation arises. The Siddhas clear the vessel before they fill it.",
    color: "#DC2626",
    gradient: "from-red-900/20 to-transparent"
  },
  {
    week: 2,
    name: "ANAHATA",
    subtitle: "The Sacred Heart Field",
    description: "Seven days of heart awakening — opening the quantum field of unconditional love, alchemy of emotion, forgiveness as liberation technology.",
    color: "#16A34A",
    gradient: "from-emerald-900/20 to-transparent"
  },
  {
    week: 3,
    name: "TURIYA",
    subtitle: "Beyond the Fourth State",
    description: "Seven days of transcendence — Kundalini, third eye, Akashic access, cosmic unity, dharmic vision, and the final Siddha initiation.",
    color: "#D4AF37",
    gradient: "from-yellow-900/20 to-transparent"
  }
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function InnerPeacePath() {
  const [selectedDay, setSelectedDay] = useState<typeof DAYS_DATA[0] | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const completedCount = completedDays.size;
  const progressPct = Math.round((completedCount / 21) * 100);

  const toggleComplete = (dayNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  };

  const weekDays = DAYS_DATA.filter(d => d.week === activeWeek);
  const currentWeekMeta = WEEK_META[activeWeek - 1];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedDay(null);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        color: "rgba(255,255,255,0.87)",
        paddingBottom: "6rem",
        position: "relative",
        overflowX: "hidden"
      }}
    >
      {/* ── Cosmic Background Particles ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 70%)"
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 50% 40% at 80% 80%, rgba(147,51,234,0.04) 0%, transparent 60%)"
        }} />
        {/* Particle dots */}
        {[...Array(24)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: i % 3 === 0 ? "2px" : "1px",
            height: i % 3 === 0 ? "2px" : "1px",
            borderRadius: "50%",
            background: `rgba(212,175,55,${0.15 + (i % 5) * 0.05})`,
            top: `${(i * 37 + 11) % 100}%`,
            left: `${(i * 53 + 7) % 100}%`,
            animation: `twinkle ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.4) % 3}s`
          }} />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800;900&display=swap');
        @keyframes twinkle {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }
        @keyframes goldPulse {
          0%,100% { box-shadow: 0 0 20px rgba(212,175,55,0.12); }
          50% { box-shadow: 0 0 40px rgba(212,175,55,0.25); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .day-card:hover {
          transform: translateY(-3px);
          border-color: rgba(212,175,55,0.25) !important;
          box-shadow: 0 12px 48px rgba(212,175,55,0.08) !important;
        }
        .day-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .week-tab:hover { background: rgba(255,255,255,0.04) !important; }
        .week-tab { transition: all 0.25s ease; }
        .complete-btn:hover { transform: scale(1.1); }
        .complete-btn { transition: all 0.2s ease; }
        .modal-overlay { animation: fadeSlideUp 0.35s ease; }
        .gold-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #F5E090 40%, #D4AF37 60%, #B8960C 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 2px; }
      `}</style>

      {/* ── HERO HEADER ── */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "4rem 2rem 2rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.18)",
          borderRadius: "100px",
          padding: "6px 18px",
          marginBottom: "1.5rem"
        }}>
          <span style={{ color: "#D4AF37", fontSize: "10px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase" }}>
            Siddha Quantum Intelligence · 2050 Transmission
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          margin: "0 0 1rem",
          color: "rgba(255,255,255,0.95)"
        }}>
          21 Days of<br />
          <span className="gold-shimmer">Siddha Peace</span>
        </h1>

        <p style={{
          fontSize: "1.05rem",
          color: "rgba(255,255,255,0.45)",
          maxWidth: "520px",
          margin: "0 auto 2.5rem",
          lineHeight: 1.7,
          fontWeight: 400
        }}>
          A living transmission from the council of the 18 Siddhas.<br />
          Three gateways. One destination: your original nature.
        </p>

        {/* Progress bar */}
        <div style={{ maxWidth: "400px", margin: "0 auto 3rem" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginBottom: "8px"
          }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Transmission Progress
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
              {completedCount} / 21 DAYS
            </span>
          </div>
          <div style={{
            height: "3px", background: "rgba(255,255,255,0.06)",
            borderRadius: "2px", overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #B8960C, #D4AF37, #F5E090)",
              borderRadius: "2px",
              transition: "width 0.6s ease",
              boxShadow: "0 0 12px rgba(212,175,55,0.4)"
            }} />
          </div>
          {completedCount > 0 && (
            <p style={{ fontSize: "11px", color: "rgba(212,175,55,0.6)", marginTop: "8px", textAlign: "right" }}>
              {progressPct}% initiated
            </p>
          )}
        </div>

        {/* Week Stat Cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px", maxWidth: "640px", margin: "0 auto"
        }}>
          {WEEK_META.map(w => {
            const wDays = DAYS_DATA.filter(d => d.week === w.week);
            const wCompleted = wDays.filter(d => completedDays.has(d.day)).length;
            return (
              <div key={w.week} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${activeWeek === w.week ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: "20px",
                padding: "14px",
                cursor: "pointer",
                animation: "goldPulse 4s ease-in-out infinite",
                animationDelay: `${w.week * 0.5}s`
              }} onClick={() => setActiveWeek(w.week)}>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.25em", color: w.color, marginBottom: "4px", textTransform: "uppercase" }}>
                  WEEK {w.week}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: "2px" }}>
                  {w.name}
                </div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.1em" }}>
                  {wCompleted}/7 COMPLETE
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── WEEK NAVIGATOR ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem" }}>

        {/* Week Header */}
        <div style={{
          margin: "2rem 0 1.5rem",
          padding: "1.5rem 2rem",
          background: "rgba(255,255,255,0.01)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "24px",
          borderLeft: `3px solid ${currentWeekMeta.color}`,
          animation: "fadeSlideUp 0.4s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{
                fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                color: currentWeekMeta.color, textTransform: "uppercase", display: "block", marginBottom: "4px"
              }}>
                WEEK {activeWeek} · GATEWAY {activeWeek}
              </span>
              <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.92)" }}>
                {currentWeekMeta.name}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                {currentWeekMeta.subtitle}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[1, 2, 3].map(w => (
                <button key={w} className="week-tab" onClick={() => setActiveWeek(w)} style={{
                  padding: "8px 16px",
                  background: activeWeek === w ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activeWeek === w ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "12px",
                  color: activeWeek === w ? "#D4AF37" : "rgba(255,255,255,0.35)",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit"
                }}>
                  W{w}
                </button>
              ))}
            </div>
          </div>
          <p style={{
            margin: "1rem 0 0",
            fontSize: "0.88rem",
            color: "rgba(255,255,255,0.38)",
            lineHeight: 1.65,
            maxWidth: "560px"
          }}>
            {currentWeekMeta.description}
          </p>
        </div>

        {/* ── DAY CARDS GRID ── */}
        <div style={{ display: "grid", gap: "14px", animation: "fadeSlideUp 0.4s ease" }}>
          {weekDays.map((day, idx) => {
            const isDone = completedDays.has(day.day);
            return (
              <div
                key={day.day}
                className="day-card"
                onClick={() => setSelectedDay(day)}
                style={{
                  background: isDone
                    ? "rgba(212,175,55,0.04)"
                    : "rgba(255,255,255,0.018)",
                  border: `1px solid ${isDone ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: "24px",
                  padding: "1.4rem 1.6rem",
                  cursor: "pointer",
                  animationDelay: `${idx * 0.06}s`,
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Chakra color accent line */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: "3px",
                  background: day.chakraColor,
                  borderRadius: "24px 0 0 24px",
                  opacity: isDone ? 1 : 0.4
                }} />

                <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2rem", paddingLeft: "8px" }}>
                  {/* Day Number */}
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div style={{
                      width: "48px", height: "48px",
                      background: isDone ? `${day.chakraColor}22` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isDone ? day.chakraColor + "60" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "14px",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center"
                    }}>
                      <span style={{
                        fontSize: "8px", fontWeight: 800,
                        letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)",
                        lineHeight: 1, display: "block", textTransform: "uppercase"
                      }}>DAY</span>
                      <span style={{
                        fontSize: "18px", fontWeight: 900,
                        color: isDone ? "#D4AF37" : "rgba(255,255,255,0.7)",
                        lineHeight: 1.1
                      }}>{day.day}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
                        color: day.chakraColor, textTransform: "uppercase"
                      }}>
                        {day.siddha}
                      </span>
                      <span style={{
                        fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em",
                        color: "rgba(255,255,255,0.2)", textTransform: "uppercase"
                      }}>
                        · {day.chakra}
                      </span>
                    </div>

                    <h3 style={{
                      margin: "0 0 2px",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      letterSpacing: "-0.025em",
                      color: isDone ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.9)"
                    }}>
                      {day.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: "0.78rem",
                      color: "rgba(255,255,255,0.35)",
                      fontStyle: "italic",
                      letterSpacing: "0.01em"
                    }}>
                      {day.subtitle}
                    </p>

                    {/* Transmission preview */}
                    <p style={{
                      margin: "8px 0 0",
                      fontSize: "0.82rem",
                      color: "rgba(255,255,255,0.38)",
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {day.transmission}
                    </p>
                  </div>

                  {/* Right side */}
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <div style={{
                      padding: "4px 10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px"
                    }}>
                      <span style={{
                        fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.3)",
                        letterSpacing: "0.15em"
                      }}>
                        {day.duration} MIN
                      </span>
                    </div>

                    <button
                      className="complete-btn"
                      onClick={(e) => toggleComplete(day.day, e)}
                      style={{
                        width: "28px", height: "28px",
                        borderRadius: "50%",
                        background: isDone ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1.5px solid ${isDone ? "#D4AF37" : "rgba(255,255,255,0.1)"}`,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isDone ? "#D4AF37" : "rgba(255,255,255,0.2)",
                        fontSize: "13px"
                      }}
                    >
                      {isDone ? "✓" : "○"}
                    </button>

                    <div style={{
                      fontSize: "18px",
                      opacity: 0.3,
                      color: day.chakraColor
                    }}>
                      {day.symbol}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Week navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
          {activeWeek > 1 ? (
            <button onClick={() => setActiveWeek(w => w - 1)} style={{
              padding: "12px 24px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 700
            }}>
              ← Week {activeWeek - 1}
            </button>
          ) : <div />}

          {activeWeek < 3 && (
            <button onClick={() => setActiveWeek(w => w + 1)} style={{
              padding: "12px 24px",
              background: "rgba(212,175,55,0.07)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "14px",
              color: "#D4AF37",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 700
            }}>
              Week {activeWeek + 1} →
            </button>
          )}
        </div>
      </div>

      {/* ── DAY DETAIL MODAL ── */}
      {selectedDay && (
        <div
          onClick={() => setSelectedDay(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(5,5,5,0.88)",
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
            overflowY: "auto"
          }}
        >
          <div
            ref={modalRef}
            className="modal-overlay"
            onClick={e => e.stopPropagation()}
            style={{
              background: "rgba(10,10,10,0.97)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "32px",
              maxWidth: "680px",
              width: "100%",
              padding: "2.5rem",
              position: "relative",
              boxShadow: "0 0 80px rgba(212,175,55,0.08)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            {/* Close */}
            <button onClick={() => setSelectedDay(null)} style={{
              position: "absolute", top: "1.5rem", right: "1.5rem",
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer", fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit"
            }}>✕</button>

            {/* Chakra color bar */}
            <div style={{
              height: "2px",
              background: `linear-gradient(90deg, ${selectedDay.chakraColor}, transparent)`,
              borderRadius: "2px",
              marginBottom: "2rem"
            }} />

            {/* Day badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
              <div style={{
                width: "56px", height: "56px",
                background: `${selectedDay.chakraColor}18`,
                border: `1px solid ${selectedDay.chakraColor}40`,
                borderRadius: "16px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>DAY</span>
                <span style={{ fontSize: "22px", fontWeight: 900, color: "#D4AF37", lineHeight: 1.1 }}>{selectedDay.day}</span>
              </div>
              <div>
                <div style={{
                  fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
                  color: selectedDay.chakraColor, textTransform: "uppercase", marginBottom: "2px"
                }}>
                  {selectedDay.siddha} · {selectedDay.element}
                </div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  {selectedDay.siddhaRole}
                </div>
              </div>
            </div>

            <h2 style={{
              margin: "0 0 4px",
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "rgba(255,255,255,0.95)"
            }}>
              {selectedDay.title}
            </h2>
            <p style={{
              margin: "0 0 2rem",
              fontSize: "0.95rem",
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic"
            }}>
              {selectedDay.subtitle}
            </p>

            {/* Transmission */}
            <div style={{
              background: "rgba(212,175,55,0.04)",
              border: "1px solid rgba(212,175,55,0.1)",
              borderRadius: "20px",
              padding: "1.5rem",
              marginBottom: "1.2rem"
            }}>
              <div style={{
                fontSize: "8px", fontWeight: 800, letterSpacing: "0.35em",
                color: "#D4AF37", textTransform: "uppercase", marginBottom: "0.8rem"
              }}>
                ⟁ SIDDHA TRANSMISSION
              </div>
              <p style={{
                margin: 0, fontSize: "0.9rem",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.8, fontWeight: 400
              }}>
                {selectedDay.transmission}
              </p>
            </div>

            {/* Practice */}
            <div style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "20px",
              padding: "1.5rem",
              marginBottom: "1.2rem"
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "0.8rem"
              }}>
                <div style={{
                  fontSize: "8px", fontWeight: 800, letterSpacing: "0.35em",
                  color: "rgba(255,255,255,0.5)", textTransform: "uppercase"
                }}>
                  SACRED PRACTICE
                </div>
                <span style={{
                  padding: "3px 10px",
                  background: `${selectedDay.chakraColor}18`,
                  border: `1px solid ${selectedDay.chakraColor}30`,
                  borderRadius: "8px",
                  fontSize: "9px", fontWeight: 800,
                  color: selectedDay.chakraColor, letterSpacing: "0.1em"
                }}>
                  {selectedDay.duration} MIN
                </span>
              </div>
              <p style={{
                margin: 0, fontSize: "0.9rem",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.8, fontWeight: 400
              }}>
                {selectedDay.practice}
              </p>
            </div>

            {/* Mantra */}
            <div style={{
              background: `${selectedDay.chakraColor}08`,
              border: `1px solid ${selectedDay.chakraColor}20`,
              borderRadius: "20px",
              padding: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                fontSize: "8px", fontWeight: 800, letterSpacing: "0.35em",
                color: selectedDay.chakraColor, textTransform: "uppercase", marginBottom: "0.8rem"
              }}>
                SACRED MANTRA
              </div>
              <p style={{
                margin: 0,
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.9,
                fontWeight: 500,
                letterSpacing: "0.02em"
              }}>
                {selectedDay.mantra}
              </p>
            </div>

            {/* Complete button */}
            <button
              onClick={(e) => { toggleComplete(selectedDay.day, e); setSelectedDay(null); }}
              style={{
                width: "100%",
                padding: "16px",
                background: completedDays.has(selectedDay.day)
                  ? "rgba(212,175,55,0.08)"
                  : "rgba(212,175,55,0.12)",
                border: `1px solid ${completedDays.has(selectedDay.day) ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.35)"}`,
                borderRadius: "16px",
                color: "#D4AF37",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase"
              }}
            >
              {completedDays.has(selectedDay.day) ? "✓ TRANSMISSION RECEIVED" : "MARK AS RECEIVED"}
            </button>
          </div>
        </div>
      )}

      {/* ── SIDDHA COUNCIL FOOTER ── */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: "900px", margin: "3rem auto 0",
        padding: "0 1.5rem"
      }}>
        <div style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "24px",
          padding: "2rem",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
            color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: "1rem"
          }}>
            THE 18 SIDDHAS IN COUNCIL
          </div>
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: "8px 16px"
          }}>
            {[
              "Agastya Muni", "Thirumoolar", "Babaji", "Nandidevar",
              "Machamuni", "Gorakshanath", "Sattamuni", "Konganavar",
              "Sundaranandar", "Vanmeeganar", "Ramadevar", "Kudambai",
              "Karuvurar", "Idaikkadar", "Kamalamuni", "Pambatti Siddhar",
              "Dhanvantri", "Patanjali"
            ].map(name => (
              <span key={name} style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.25)",
                fontWeight: 600,
                letterSpacing: "0.05em"
              }}>
                {name}
              </span>
            ))}
          </div>
          <p style={{
            margin: "1.2rem 0 0",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "0.05em"
          }}>
            This path is a living Prema-Pulse Transmission from the Akasha-Neural Archive of SQI 2050
          </p>
        </div>
      </div>
    </div>
  );
}
