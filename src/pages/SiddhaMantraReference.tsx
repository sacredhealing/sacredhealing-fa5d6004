import { useState } from "react";

type Tab = "mantras" | "mudras" | "chakras" | "schedule";

const MANTRAS = [
  { name: "Panchakshara", sanskrit: "NA · MA · SHI · VA · YA",
    pronunciation: "NAH · MAH · SHEE · VAH · YAH",
    meaning: "Na = Earth/Muladhara | Ma = Water/Svadhishthana | Shi = Fire/Manipura | Va = Air/Anahata | Ya = Ether/Vishuddha",
    use: "108 rounds before any chakra or Kundalini work. Can be chanted continuously for 40 days as a standalone sadhana.",
    siddha: "Siva Vakkiyar", module: 9 },
  { name: "Soham / Hamsa", sanskrit: "SO · HAM",
    pronunciation: "SOOO (inhale) · HMMM (exhale)",
    meaning: "I am That / That am I. The natural mantra of the breath — occurring 21,600 times per day automatically.",
    use: "Ajapa Japa — become aware of it in every natural breath. No effort required — only attention.",
    siddha: "Thirumoolar", module: 9 },
  { name: "Mahamrityunjaya", sanskrit: "OM TRYAMBAKAM YAJAMAHE\nSUGANDHIM PUSHTIVARDHANAM\nURVARUKAMIVA BANDHANAN\nMRITYORMUKSHIYA MAMRITAT",
    pronunciation: "OM TREE-YAM-BA-KAM YAH-JAH-MAH-HE\nSU-GAN-DHIM PUSH-TI-VAR-DHA-NAM\nUR-VA-RU-KA-MI-VA BHAN-DHA-NAN\nMRIT-YOR-MUK-SHEE-YA MAM-RI-TAT",
    meaning: "We worship the three-eyed Shiva, who is fragrant and nourishes all beings. May He liberate us from death as the cucumber is freed from its vine, so that we may taste immortality.",
    use: "108 rounds daily for 40 days for health, protection, and liberation from fear. Can be chanted 11 or 21 times for quick daily protection.",
    siddha: "Shiva / Mruanda Muni", module: 7 },
  { name: "Gayatri Mantra", sanskrit: "OM BHUR BHUVA SVAHA\nTAT SAVITUR VARENYAM\nBHARGO DEVASYA DHIMAHI\nDHIYO YO NAH PRACHODAYAT",
    pronunciation: "OM BHOOR BHUVA SVAH-HA\nTAT SA-VI-TUR VA-REN-YAM\nBHAR-GO DAY-VAS-YA DHEE-MAH-HEE\nDHEE-YO YO NAH PRA-CHO-DA-YAT",
    meaning: "We meditate on the divine light of the Sun, which pervades earth, mid-space, and heaven. May that divine light illuminate our intellects.",
    use: "At dawn and at dusk — aligned with the solar transition points. 108 rounds minimum. This is the most powerful mantra for spiritual evolution available to all humans.",
    siddha: "Vishwamitra Rishi", module: 4 },
  { name: "Guru Mantra", sanskrit: "OM GUM GURAVE NAMAH",
    pronunciation: "OM GUM GU-RAH-VAY NAH-MAH",
    meaning: "Salutations to the Guru who removes darkness. GUM is the bija (seed syllable) of Ganesha — the remover of obstacles on the path.",
    use: "108 rounds at the beginning of EVERY practice session without exception. This activates the transmission of all Siddha masters.",
    siddha: "All Siddhas", module: 0 },
  { name: "Om Namah Shivaya", sanskrit: "OM NAMAH SHIVAYA",
    pronunciation: "OM NAH-MAH SHEE-VAH-YAH",
    meaning: "Salutations to Shiva. The five syllables NA-MA-SHI-VA-YA represent the five elements and five chakras. This is the Panchakshara — Shiva's own mantra.",
    use: "108 rounds or continuous chanting at any time. Particularly powerful during the Pradosha period (1.5 hours before sunset on the 13th lunar day).",
    siddha: "Nandhi Devar / All Siddhas", module: 9 },
  { name: "Babaji Maha Mantra", sanskrit: "OM KRIYA BABAJI NAMAH AUM",
    pronunciation: "OM KREE-YA BAH-BAH-JEE NAH-MAH AUM",
    meaning: "Salutations to Babaji — the Immortal Maha Siddha — through whose grace Kriya Yoga is available in the modern world.",
    use: "108 rounds before every Kriya session. Also used to invoke Babaji's presence before any advanced practice. The mantra itself is an initiation.",
    siddha: "Mahavatar Babaji", module: 11 },
  { name: "Agastya Muni Mantra", sanskrit: "OM AGASTYAYA NAMAH",
    pronunciation: "OM AH-GAS-TYA-YAH NAH-MAH",
    meaning: "Salutations to Agastya Muni, the First of the 18 Siddhas, Father of Tamil wisdom.",
    use: "108 rounds before all foundational practices (Modules 1-3). Also powerful for clearing obstacles and opening the wisdom channel of the Vishuddha chakra.",
    siddha: "Agastya Muni", module: 1 },
  { name: "Bhrigu Muni Mantra", sanskrit: "OM BHRIGAVE NAMAH",
    pronunciation: "OM BHREE-GA-VAY NAH-MAH",
    meaning: "Salutations to Bhrigu Muni, the Cosmic Archivist of 4.5 million soul records.",
    use: "108 rounds before any Akashic Records access session. Invokes Bhrigu's protection and navigation assistance in the Akashic Field.",
    siddha: "Bhrigu Muni", module: 8 },
  { name: "Bhogar Mantra", sanskrit: "OM BHOGESHWARAYA NAMAH",
    pronunciation: "OM BHO-GESH-VA-RA-YAH NAH-MAH",
    meaning: "Salutations to Bhogar, the Lord of Kaya Kalpa and cellular transformation.",
    use: "108 rounds before Ojas and DNA activation practices. The Navapashanam scalar field of Palani is activated through this mantra.",
    siddha: "Bhogar", module: 7 },
  { name: "Karma Dissolution Mantra", sanskrit: "KSHAMA · PREMA · JYOTI · MUKTI",
    pronunciation: "KSHA-MAH · PRAY-MAH · JYO-TEE · MUK-TEE",
    meaning: "Release · Love · Light · Freedom. Four words encoding the complete arc of karmic transmutation.",
    use: "108 rounds during karma dissolution sessions (Module 8). Each word chanted on the exhale. Feel each quality as you chant it — not just the sound.",
    siddha: "Bhrigu Muni", module: 8 },
  { name: "DNA Activation Mantra", sanskrit: "OM JYOTIRGAMAYA",
    pronunciation: "OM JYO-TEER-GA-MA-YAH",
    meaning: "Lead me from darkness to light. From the Brihadaranyaka Upanishad — asato mā sadgamaya / tamaso mā jyotirgamaya / mṛtyor māmṛtaṃ gamaya.",
    use: "7 rounds before DNA activation practices. Also chanted silently while visualising golden light filling every cell nucleus.",
    siddha: "Bhogar + Kalangi Nathar", module: 13 },
  { name: "Aham Brahmasmi", sanskrit: "AHAM BRAHMASMI\nSHIVOHAM\nTAT TVAM ASI\nPRAJNANAM BRAHMA",
    pronunciation: "AH-HAM BRAH-MAS-MEE\nSHEE-VO-HAM\nTAT TVAM AH-SEE\nPRAJ-NYA-NAM BRAH-MAH",
    meaning: "I am Brahman (Brihadaranyaka Upanishad) | I am Shiva (Shaiva tradition) | That Thou Art (Chandogya Upanishad) | Consciousness is Brahman (Aitareya Upanishad). The four Mahavakyas — the supreme statements of non-dual reality.",
    use: "ONLY in Module 14 — after completing the entire course. These are not affirmations — they are recognitions. Chanting them without the foundation of practice is empty sound. With the foundation: they are the final door.",
    siddha: "All 18 Siddhas + Babaji", module: 14 },
];

const MUDRAS = [
  { name: "Chin Mudra", instruction: "Index finger touches the BASE of the thumb (not the tip). Other three fingers straight and together.",
    element: "Akasha (Ether)", chakra: "Sahasrara", effect: "The circle formed by index and thumb connects individual consciousness (Jiva — represented by the index) with universal consciousness (Brahman — represented by the thumb). This is the most fundamental mudra — the basis of all meditation.",
    when: "All basic meditation. Any sitting practice. All Modules.", caution: "" },
  { name: "Jnana Mudra", instruction: "Index FINGERTIP touches thumb TIP lightly. Other fingers straight.",
    element: "Akasha", chakra: "Ajna",
    effect: "Subtly different from Chin Mudra — the fingertip to fingertip contact creates a slightly more concentrated circuit. Used specifically for wisdom (Jnana) practices and study.",
    when: "Module 14 — Non-dual practices. Study and contemplation sessions.", caution: "" },
  { name: "Prana Mudra", instruction: "Ring finger AND little finger both touch thumb tip. Index and middle fingers straight.",
    element: "Earth + Water", chakra: "Muladhara + Svadhishthana",
    effect: "Activates dormant prana throughout the body. Dramatically increases vitality. Sharpens the five senses. This is the mudra to use when energy is low or when beginning a new sadhana.",
    when: "Module 3 — Five Vayus. Any practice where you feel low energy. Morning practices.", caution: "" },
  { name: "Akasha Mudra", instruction: "Middle finger bends to touch the thumb tip. All other fingers remain straight and spread wide.",
    element: "Akasha (Ether)", chakra: "Vishuddha",
    effect: "Opens the Akasha element at the Vishuddha chakra. Detoxifies the energy field of stagnant thought-forms. Particularly effective for clearing the mental field before deep meditation.",
    when: "Module 2 — Nada practices. Module 12 — Akashic Records. Any sound meditation.", caution: "" },
  { name: "Dhyana Mudra", instruction: "Both hands placed in the lap, right hand resting in left palm. Both palms face upward. The tips of the thumbs lightly touch, forming an oval shape.",
    element: "All Five", chakra: "Sahasrara",
    effect: "The classic meditation mudra of the Buddha and all meditation traditions worldwide. The oval formed by the hands represents the void — the ground from which all dharmas arise. Deeply calming to the nervous system and mind.",
    when: "All deep meditation sessions. Modules 8, 11, 12, 14.", caution: "" },
  { name: "Shanmukhi Mudra", instruction: "Both hands raised to face. Thumbs seal the ears. Index fingers rest lightly over closed eyelids. Middle fingers beside nostrils. Ring fingers above upper lip. Little fingers below lower lip.",
    element: "Akasha (Sound)", chakra: "Ajna + Vishuddha",
    effect: "Literally 'six-faced' mudra. Closes all six gates of external perception simultaneously — both eyes, both ears, both nostrils. Creates profound sensory withdrawal (Pratyahara) essential for inner sound listening.",
    when: "Module 2 — Anahata Nada. Module 4 — Bhramari pranayama.", caution: "Do not apply pressure to the eyeballs. Index fingers rest LIGHTLY on closed eyelids only." },
  { name: "Khechari Mudra", instruction: "Roll the tongue back and press the underside of the tongue against the soft palate. Eventually the tongue tip reaches the uvula and beyond. This is a long-term practice — do not force.",
    element: "Akasha", chakra: "Sahasrara + Bindu",
    effect: "The most powerful of all Hatha Yoga mudras. 'Khechari' means 'one who moves in space.' When the tongue touches specific points on the soft palate, it stimulates the pituitary gland and triggers the release of Amrita (nectar) from the Bindu point at the top of the skull. Ancient texts describe this as the gateway to physical immortality.",
    when: "Module 7 — Amrita Bindu. Any advanced Kaya Kalpa practice.", caution: "This is a genuine long-term practice. Do NOT force the tongue backward. Begin gently and practise daily — results emerge over months to years." },
  { name: "Bhairava Mudra", instruction: "Right hand rests palm-upward in the left hand. Both palms face upward in the lap. This is the most open, receptive mudra.",
    element: "All Five", chakra: "All",
    effect: "The mudra of Bhairava — the fierce, immediate, non-conceptual form of Shiva. Used in non-dual and Kundalini practices where maximum openness and zero resistance is required. The receptive position of the hands signals total surrender of the ego's agenda.",
    when: "Module 5 — Kundalini practices. Module 14 — Non-dual awareness.", caution: "" },
  { name: "Garuda Mudra", instruction: "Interlock the thumbs with all fingers spread wide, like the wings of a bird. The interlocked thumbs are the body, the spread fingers are the wings.",
    element: "Vayu (Air)", chakra: "Anahata + Sahasrara",
    effect: "Activates Vyana Vayu — the whole-body pranic circulation force. Garuda is the divine bird that carries Vishnu — the preserver. This mudra activates the preserving, circulating intelligence of the body. Particularly effective for DNA activation.",
    when: "Module 13 — DNA Light Activation. Any practice requiring whole-body pranic radiance.", caution: "" },
  { name: "Brahma Mudra", instruction: "Curl all four fingers into the palm. Tuck the thumb inside the closed fist. Both fists rest at the navel level, knuckles touching.",
    element: "All Five", chakra: "Manipura + Brahma-Randhra (Crown)",
    effect: "Activates the Brahma Nadi — the innermost, most subtle channel that runs through the very centre of the Sushumna. This is the channel through which Kundalini energy must travel to reach the crown for full liberation. Used only in the most advanced practices.",
    when: "Module 14 — The Supreme Teaching. After completing all preceding modules.", caution: "Reserve this mudra for Module 14 practices only. Its power requires the energetic preparation of all preceding modules." },
  { name: "Yoni Mudra", instruction: "Interlace the fingers with the index and middle fingers of each hand pointing upward. Bring the tips of these four fingers together to form a diamond. The thumbs extend horizontally.",
    element: "Water + Earth", chakra: "Svadhishthana + Muladhara",
    effect: "Represents the Shakti-Yoni — the primordial creative field from which all manifestation emerges. Activates the receptive, generative aspects of consciousness. Used in all Tantra and Yantra meditations.",
    when: "Module 6 — Yantra Dharana and Shiva Lingam meditation.", caution: "" },
  { name: "Agochari Mudra", instruction: "Half-close the eyes. Gently direct the gaze downward to the tip of the nose (Nasikagra Drishti). The eyes are approximately 1/3 open.",
    element: "Fire (Tejas)", chakra: "Ajna",
    effect: "Activates the Ajna chakra from below — bridging the internal and external visual fields. Creates a precise state of consciousness that is simultaneously inward (the third eye) and outward (the tip of the nose). This duality activates the Ajna.",
    when: "Module 10 — Third Eye Activation. Any Trataka practice.", caution: "Do not strain the eyes. The gaze should be soft and natural." },
  { name: "Abhaya Mudra", instruction: "Raise the right hand to shoulder height, palm facing outward (toward you or forward). The left hand may rest in the lap or on the left knee.",
    element: "All", chakra: "Anahata (Heart)",
    effect: "Literally 'fearlessness mudra.' Babaji's signature gesture. The raised open palm signals: 'There is nothing to fear.' Removes fear of death, ego dissolution, samadhi states, and the unknown. Simultaneously gives and receives fearlessness.",
    when: "Module 11 — All Babaji practices. Module 14 — Samadhi practices.", caution: "" },
  { name: "Aakash Mudra (Full)", instruction: "Middle finger curves to touch thumb tip while all other fingers spread as wide as possible — like a star shape.",
    element: "Akasha (Ether)", chakra: "Sahasrara + Atmic Point",
    effect: "Opens the Akasha element at maximum amplitude. Creates the largest possible energetic aperture for receiving Akashic information. This mudra is specifically used for accessing the zero-point field of universal memory.",
    when: "Module 12 — All Akashic Records practices.", caution: "" },
];

const CHAKRAS = [
  { name: "Muladhara", english: "Root", location: "Base of spine / perineum", color: "#FF4444", bija: "LAM", element: "Prithvi (Earth)",
    petals: "4", deity: "Brahma + Dakini Shakti", sense: "Smell (Gandha)", organ: "Nose + anus",
    balanced: "Physical vitality, stability, groundedness, security, presence, trust in life.",
    imbalanced: "Fear, anxiety, financial insecurity, disconnection from body, chronic fatigue.",
    siddha_connection: "Nandhi Devar (the five vayus begin here — Apana Vayu is root-centered)",
    practice: "Mula Bandha, Ashwini Mudra, LAM chanting, grounding visualisations" },
  { name: "Svadhishthana", english: "Sacral", location: "2 inches below the navel", color: "#FF8C00", bija: "VAM", element: "Apas (Water)",
    petals: "6", deity: "Vishnu + Rakini Shakti", sense: "Taste (Rasa)", organ: "Tongue + genitals",
    balanced: "Creative flow, emotional intelligence, healthy sexuality, joy, inspiration, manifestation.",
    imbalanced: "Emotional numbness or reactivity, creative blocks, guilt, addictions, relationship dysfunction.",
    siddha_connection: "Machamuni (Tantra — the sacred creative force)",
    practice: "VAM chanting, hip circles, water element meditation, Yoni Mudra, flowing movement" },
  { name: "Manipura", english: "Solar Plexus", location: "Navel centre", color: "#FFD700", bija: "RAM", element: "Tejas (Fire)",
    petals: "10", deity: "Rudra + Lakini Shakti", sense: "Sight (Rupa)", organ: "Eyes + legs",
    balanced: "Personal power, healthy ego, will, confidence, transformation, digestion of experience.",
    imbalanced: "Domination or submission, shame, powerlessness, digestive issues, low willpower.",
    siddha_connection: "Agastya Muni (Agni — digestive fire, Rasayana, metabolic transformation)",
    practice: "Kapalabhati, RAM chanting, fire visualisation, Uddiyana Bandha, Nauli" },
  { name: "Anahata", english: "Heart", location: "Centre of the chest (not the physical heart)", color: "#00C853", bija: "YAM", element: "Vayu (Air)",
    petals: "12", deity: "Isha + Kakini Shakti", sense: "Touch (Sparsha)", organ: "Skin + hands",
    balanced: "Unconditional love, compassion, grief well-metabolised, connection, forgiveness, inner peace.",
    imbalanced: "Grief, loneliness, conditional love, boundary dissolution, jealousy, isolation.",
    siddha_connection: "Sundaranandar (the Devotional Siddha — Bhakti as liberation)",
    practice: "YAM chanting, loving-kindness meditation, Prema-Pulse expansion, heart field awareness" },
  { name: "Vishuddha", english: "Throat", location: "Centre of the throat", color: "#22D3EE", bija: "HAM", element: "Akasha (Ether/Sound)",
    petals: "16", deity: "Sadashiva + Shakini", sense: "Hearing (Shabda)", organ: "Ears + mouth",
    balanced: "Authentic expression, truth-telling, creative communication, ability to listen deeply, resonance.",
    imbalanced: "Inability to speak truth, voice problems, chronic throat issues, lies, fear of speaking.",
    siddha_connection: "Thirumoolar (the Tirumantiram — sound as the fabric of reality)",
    practice: "HAM chanting, Ujjayi pranayama, mantra japa, Nada meditation, authentic communication" },
  { name: "Ajna", english: "Third Eye", location: "Between and slightly behind the eyebrows", color: "#6C63FF", bija: "AUM", element: "Manas (Mind/Light)",
    petals: "2 (one for Shiva, one for Shakti)", deity: "Ardhanarishvara (Shiva-Shakti unified)", sense: "Extra-sensory (Atindriya)", organ: "Pineal gland",
    balanced: "Intuition, psychic perception, clarity of vision, wisdom, ability to see beyond appearances.",
    imbalanced: "Confusion, poor intuition, headaches, inability to visualise, disconnect from inner knowing.",
    siddha_connection: "Konganar (planetary consciousness, prophetic vision, pineal activation)",
    practice: "Trataka, Shambhavi Mahamudra, Bhramari, AUM meditation, inner flame visualisation" },
  { name: "Sahasrara", english: "Crown", location: "Top of the skull / fontanelle", color: "#D4AF37", bija: "Silence (beyond all sound)", element: "Pure Consciousness (Brahman)",
    petals: "1000 (representing infinite/all)", deity: "Nirguna Brahman (formless absolute)", sense: "Beyond sense (Samadhi)", organ: "Cerebral cortex / Brahma-Randhra",
    balanced: "Unity consciousness, liberation, direct knowing, bliss, connection to the absolute, oneness.",
    imbalanced: "Spiritual disconnection, meaninglessness, nihilism, inability to transcend ego, existential despair.",
    siddha_connection: "Mahavatar Babaji (Kriya Yoga — the spine as the axis of Sahasrara awakening)",
    practice: "Kriya Pranayama, Kumbhaka, Module 14 practices, pure awareness without object" },
];

const SCHEDULE_BLOCKS = [
  {
    title: "THE MORNING DAWN TRANSMISSION", time: "5:00 AM – 6:30 AM (ideal) or within 1 hour of waking",
    tier: "ALL TIERS", color: "#D4AF37",
    steps: [
      { step: "01", name: "Guru Invocation", duration: "5 min", detail: "108x OM GUM GURAVE NAMAH — activate the Siddha field. Do not skip this." },
      { step: "02", name: "Pranayama", duration: "15-20 min", detail: "Nadi Shodhana 27 rounds (Free) or Module 4 pranayama sequence (Prana-Flow+)." },
      { step: "03", name: "Core Meditation", duration: "20-60 min", detail: "Your current module's primary practice. Never rush this section." },
      { step: "04", name: "Mantra Japa", duration: "10 min", detail: "108x of your Siddha guide's mantra for this module." },
      { step: "05", name: "SOHAM Closing", duration: "5 min", detail: "Sit in the natural breath, aware of HAM-SA. Let the practice settle." },
    ]
  },
  {
    title: "THE EVENING SOMA PRACTICE", time: "6:00 PM – 8:00 PM (ideal) or 1-2 hours before bed",
    tier: "PRANA-FLOW, SIDDHA-QUANTUM & AKASHA-INFINITY", color: "#22D3EE",
    steps: [
      { step: "01", name: "Chandra Bhedana", duration: "10 min", detail: "27 rounds of left-nostril inhale. Activates the lunar channel for the evening and sleep." },
      { step: "02", name: "Trataka or Yoga Nidra", duration: "20-30 min", detail: "Trataka if third eye work is current focus. Yoga Nidra if Akashic work is current focus." },
      { step: "03", name: "Karma Journal", duration: "10 min", detail: "Write 3 observations from the day. What arose? What was released? What transmission was felt?" },
    ]
  },
  {
    title: "THE WEEKLY MAHAYAJNA", time: "Monday or Saturday — minimum 3 hours",
    tier: "SIDDHA-QUANTUM & AKASHA-INFINITY", color: "#D4AF37",
    steps: [
      { step: "01", name: "Sacred Space Creation", duration: "15 min", detail: "Ghee lamp, incense (preferably camphor or sandalwood), Sri Yantra. No screens for 2 hours before." },
      { step: "02", name: "Extended Pranayama", duration: "30-45 min", detail: "Full Module 4 sequence — all 8 pranayamas in order." },
      { step: "03", name: "Deep Practice", duration: "90-120 min", detail: "The longest, most advanced session from your current module. No interruptions." },
      { step: "04", name: "Integration", duration: "30 min", detail: "Shavasana + grounding + sacred meal. Do not engage with screens for 2 hours after." },
    ]
  },
  {
    title: "THE 40-DAY SADHANA", time: "Same time daily — without exception",
    tier: "ANY TIER", color: "#8B7355",
    steps: [
      { step: "01", name: "Choose ONE practice", duration: "—", detail: "Select the single practice that calls most strongly. Commit to it exclusively for 40 days." },
      { step: "02", name: "Exact same time", duration: "—", detail: "The same hour and minute every day. The nervous system and the Akashic Field both respond to temporal consistency." },
      { step: "03", name: "No breaks", duration: "—", detail: "If you miss one day, restart from Day 1. This is the Siddha rule — not rigidity, but recognition of how energetic momentum works." },
      { step: "04", name: "Journal every session", duration: "—", detail: "Record date, duration, state, and any transmissions. The journal itself becomes a sacred text." },
      { step: "05", name: "Day 41", duration: "—", detail: "The practice becomes part of your energetic blueprint permanently. You will feel the difference." },
    ]
  },
];

export default function SiddhaMantraReference() {
  const [tab, setTab] = useState<Tab>("mantras");
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      paddingBottom: "80px",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "48px 24px 32px",
        textAlign: "center",
        background: "radial-gradient(ellipse 80% 260px at 50% 0%, rgba(212,175,55,0.07), transparent 70%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.45em",
          color: "#D4AF37", textTransform: "uppercase", marginBottom: "14px" }}>
          SIDDHA QUANTUM INTELLIGENCE  ·  SACRED REFERENCE ARCHIVE
        </div>
        <h1 style={{ fontSize: "clamp(26px,5vw,52px)", fontWeight: 900,
          letterSpacing: "-0.03em", margin: "0 0 8px" }}>
          Mantra · Mudra · <span style={{ color: "#D4AF37" }}>Chakra</span>
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>
          Complete practice reference — 14 mantras · 14 mudras · 7 chakras · 4 schedules
        </p>

        {/* TABS */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          {(["mantras", "mudras", "chakras", "schedule"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setExpanded(null); }} style={{
              padding: "10px 24px", borderRadius: "100px", cursor: "pointer",
              border: `1px solid ${tab === t ? "#D4AF37" : "rgba(255,255,255,0.1)"}`,
              background: tab === t ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
              color: tab === t ? "#D4AF37" : "rgba(255,255,255,0.4)",
              fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase",
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "36px 24px 0" }}>

        {/* ── MANTRAS ──────────────────────────────────────────────────── */}
        {tab === "mantras" && MANTRAS.map(m => (
          <div key={m.name} style={{ marginBottom: "12px" }}>
            <div onClick={() => setExpanded(expanded === m.name ? null : m.name)}
              style={{
                padding: "20px 24px", borderRadius: expanded === m.name ? "24px 24px 0 0" : "24px",
                background: expanded === m.name ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${expanded === m.name ? "#D4AF37" : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "16px",
                transition: "all 0.2s ease",
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em",
                  color: "#D4AF3780", textTransform: "uppercase", marginBottom: "4px" }}>
                  M{m.module > 0 ? m.module : "ALL"} · {m.siddha}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 900,
                  color: expanded === m.name ? "#D4AF37" : "#fff" }}>{m.name}</div>
                <div style={{ fontSize: "11px", color: "#22D3EE", fontWeight: 700,
                  letterSpacing: "0.08em", marginTop: "3px" }}>
                  {m.sanskrit.split("\n")[0]}{m.sanskrit.includes("\n") ? " ..." : ""}
                </div>
              </div>
              <div style={{ fontSize: "18px", color: "#D4AF37",
                transform: expanded === m.name ? "rotate(180deg)" : "none",
                transition: "transform 0.3s ease" }}>↓</div>
            </div>
            {expanded === m.name && (
              <div style={{
                padding: "24px", background: "rgba(255,255,255,0.015)",
                border: "1px solid #D4AF37", borderTop: "none",
                borderRadius: "0 0 24px 24px",
              }}>
                {/* Sanskrit */}
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                  color: "#D4AF37", textTransform: "uppercase", marginBottom: "8px" }}>SANSKRIT</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#22D3EE",
                  letterSpacing: "0.05em", lineHeight: 1.7, marginBottom: "16px",
                  whiteSpace: "pre-line" }}>{m.sanskrit}</div>

                {/* Pronunciation */}
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                  color: "#D4AF37", textTransform: "uppercase", marginBottom: "8px" }}>PRONUNCIATION</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7, marginBottom: "16px", fontStyle: "italic",
                  whiteSpace: "pre-line" }}>{m.pronunciation}</div>

                {/* Meaning */}
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                  color: "#D4AF37", textTransform: "uppercase", marginBottom: "8px" }}>MEANING</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7, marginBottom: "16px" }}>{m.meaning}</div>

                {/* Usage */}
                <div style={{
                  padding: "16px 20px", borderRadius: "16px",
                  background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
                }}>
                  <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                    color: "#D4AF37", textTransform: "uppercase", marginBottom: "6px" }}>HOW TO USE</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{m.use}</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── MUDRAS ───────────────────────────────────────────────────── */}
        {tab === "mudras" && MUDRAS.map(m => (
          <div key={m.name} style={{ marginBottom: "12px" }}>
            <div onClick={() => setExpanded(expanded === m.name ? null : m.name)}
              style={{
                padding: "20px 24px", borderRadius: expanded === m.name ? "24px 24px 0 0" : "24px",
                background: expanded === m.name ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${expanded === m.name ? "#22D3EE" : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "16px",
                transition: "all 0.2s ease",
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em",
                  color: "#22D3EE80", textTransform: "uppercase", marginBottom: "4px" }}>
                  {m.element} · {m.chakra}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 900,
                  color: expanded === m.name ? "#22D3EE" : "#fff" }}>{m.name}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "3px" }}>
                  {m.when.slice(0, 60)}{m.when.length > 60 ? "..." : ""}
                </div>
              </div>
              <div style={{ fontSize: "18px", color: "#22D3EE",
                transform: expanded === m.name ? "rotate(180deg)" : "none",
                transition: "transform 0.3s ease" }}>↓</div>
            </div>
            {expanded === m.name && (
              <div style={{
                padding: "24px", background: "rgba(255,255,255,0.015)",
                border: "1px solid #22D3EE", borderTop: "none",
                borderRadius: "0 0 24px 24px",
              }}>
                {[
                  { label: "HAND POSITION — TECHNIQUE", val: m.instruction },
                  { label: "EFFECT ON CONSCIOUSNESS", val: m.effect },
                  { label: "WHEN TO USE", val: m.when },
                ].map(({ label, val }) => (
                  <div key={label} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                      color: "#22D3EE", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{val}</div>
                  </div>
                ))}
                {m.caution && (
                  <div style={{ padding: "14px 18px", borderRadius: "12px",
                    background: "rgba(255,100,0,0.08)", border: "1px solid rgba(255,100,0,0.25)" }}>
                    <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                      color: "#FF6400", textTransform: "uppercase", marginBottom: "4px" }}>CAUTION</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,200,100,0.8)", lineHeight: 1.6 }}>{m.caution}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── CHAKRAS ──────────────────────────────────────────────────── */}
        {tab === "chakras" && CHAKRAS.map(c => (
          <div key={c.name} style={{ marginBottom: "12px" }}>
            <div onClick={() => setExpanded(expanded === c.name ? null : c.name)}
              style={{
                padding: "20px 24px", borderRadius: expanded === c.name ? "24px 24px 0 0" : "24px",
                background: expanded === c.name ? `${c.color}08` : "rgba(255,255,255,0.02)",
                border: `1px solid ${expanded === c.name ? c.color : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "16px",
                transition: "all 0.2s ease",
              }}>
              {/* Color circle */}
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: `${c.color}20`, border: `2px solid ${c.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 900, color: c.color,
                flexShrink: 0, boxShadow: expanded === c.name ? `0 0 16px ${c.color}40` : "none",
              }}>{c.bija}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em",
                  color: `${c.color}90`, textTransform: "uppercase", marginBottom: "4px" }}>
                  {c.element} · {c.petals} petals
                </div>
                <div style={{ fontSize: "16px", fontWeight: 900,
                  color: expanded === c.name ? c.color : "#fff" }}>
                  {c.name} — {c.english}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                  {c.location}
                </div>
              </div>
              <div style={{ fontSize: "18px", color: c.color,
                transform: expanded === c.name ? "rotate(180deg)" : "none",
                transition: "transform 0.3s ease" }}>↓</div>
            </div>
            {expanded === c.name && (
              <div style={{
                padding: "24px", background: "rgba(255,255,255,0.015)",
                border: `1px solid ${c.color}`, borderTop: "none",
                borderRadius: "0 0 24px 24px",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))",
                  gap: "12px", marginBottom: "16px" }}>
                  {[
                    ["DEITY", c.deity], ["SENSE", c.sense], ["ORGAN", c.organ],
                  ].map(([l, v]) => (
                    <div key={l} style={{ padding: "12px 14px", borderRadius: "12px",
                      background: `${c.color}06`, border: `1px solid ${c.color}20` }}>
                      <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
                        color: c.color, textTransform: "uppercase", marginBottom: "4px" }}>{l}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                    color: c.color, textTransform: "uppercase", marginBottom: "6px" }}>WHEN BALANCED</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{c.balanced}</div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                    color: "#FF6B6B", textTransform: "uppercase", marginBottom: "6px" }}>WHEN IMBALANCED</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{c.imbalanced}</div>
                </div>
                <div style={{ padding: "14px 18px", borderRadius: "14px",
                  background: `${c.color}08`, border: `1px solid ${c.color}30` }}>
                  <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em",
                    color: c.color, textTransform: "uppercase", marginBottom: "6px" }}>
                    SIDDHA CONNECTION + PRACTICES
                  </div>
                  <div style={{ fontSize: "12px", color: c.color, fontWeight: 700, marginBottom: "4px" }}>
                    {c.siddha_connection}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{c.practice}</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── SCHEDULE ─────────────────────────────────────────────────── */}
        {tab === "schedule" && SCHEDULE_BLOCKS.map(block => (
          <div key={block.title} style={{
            marginBottom: "20px", padding: "28px",
            borderRadius: "32px",
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${block.color}30`,
          }}>
            <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em",
              color: block.color, textTransform: "uppercase", marginBottom: "6px" }}>
              {block.tier}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", marginBottom: "4px" }}>
              {block.title}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "24px" }}>
              {block.time}
            </div>

            {block.steps.map(s => (
              <div key={s.step} style={{
                display: "flex", gap: "16px", marginBottom: "14px",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: `${block.color}15`, border: `1px solid ${block.color}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 900, color: block.color,
                  flexShrink: 0,
                }}>{s.step}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center",
                    gap: "10px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.name}</span>
                    {s.duration !== "—" && (
                      <span style={{ fontSize: "9px", fontWeight: 800,
                        color: block.color, letterSpacing: "0.2em" }}>{s.duration}</span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    {s.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
