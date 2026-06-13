import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;
const green = (a: number) => `rgba(74,222,128,${a})`;

const LABEL: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize: 9, fontWeight: 800,
  letterSpacing: '0.45em', textTransform: 'uppercase' as const,
  color: gold(0.45),
};

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: `1px solid ${gold(0.13)}`,
  borderRadius: 20,
  padding: '20px 18px',
  marginBottom: 10,
  position: 'relative',
  transition: 'border-color 0.2s ease',
};

// ─── TIER LEVELS ──────────────────────────────────────────────────────────────
const TIER_LEVEL: Record<string, number> = {
  free: 0, 'prana-flow': 1, 'siddha-quantum': 2, 'akasha-infinity': 3, admin: 99,
};

function canAccess(userTier: string, moduleTier: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return (TIER_LEVEL[userTier] ?? 0) >= (TIER_LEVEL[moduleTier] ?? 0);
}

// ─── CURRICULUM ───────────────────────────────────────────────────────────────
const MODULES = [
  // ── FREE ──
  {
    tier: 'free', num: 1,
    title: 'The First Vibration — Nada Brahman',
    sub: 'Why the Universe Is Not Matter. It Is Sound.',
    icon: 'ॐ',
    lessons: [
      { title: 'Anahat Nada — The Unstruck Sound', body: `Before form, before light — there was Nada. The Siddhas did not call the primordial force a particle or a wave. They called it Anahat Nada: the unstruck sound. It arises without two objects colliding. It is the hum of existence itself — pure consciousness vibrating in the stillness of its own awareness.\n\nModern physics now confirms what the 18 Siddhas encoded in Tamil verse thousands of years ago: everything in the manifest universe is vibration. Every atom oscillates at its own frequency. Every cell emits biophotonic sound-light. The entire cosmos is a vast resonating instrument, and consciousness is both the player and the music.\n\n"யாதுமாகி நின்றோன் ஒலியே" — That which stands as everything, its nature is sound. (Thirumantiram 2650)` },
      { title: 'Nada Vijnana — The Complete Science of Sound', body: `Nada Vijnana is the complete Siddha science of sound. It is not music theory. It is a precise technology for understanding how vibration creates, sustains, and dissolves all of manifest reality.\n\nThe Siddhas mapped the entire sonic spectrum — from the infrasonic tremors of the Earth's crust to the ultrasonic frequencies at the edge of physical hearing, and beyond both into the subtle sonic planes that exist beyond the physical entirely.\n\nEvery disease, every state of consciousness, every quality of life situation — the Siddhas traced all of it back to a specific pattern of vibrational coherence or incoherence in the practitioner's Nada field. Healing, in Siddha science, is always fundamentally a process of sonic re-tuning.\n\nThis is not metaphor. When you chant a mantra, the physical sound waves produced by your vocal cords create measurable standing waves in the cerebrospinal fluid surrounding your brain and spinal cord. These waves directly influence neurological function, hormonal secretion, and the coherence of the heart's electromagnetic field. The Siddhas knew this not through laboratory instruments but through the precision of Yogic perception.` },
    ],
  },
  {
    tier: 'free', num: 2,
    title: 'Sabda & Spanda — The Two Laws of Sonic Creation',
    sub: 'How Sound Becomes Reality',
    icon: '◈',
    lessons: [
      { title: 'Sabda — The Manifest Sound', body: `Sabda is audible sound — the gross, measurable, physical vibration that travels through air as pressure waves. This is the domain of acoustic physics, of music, of speech. When you hear a bell ring, you are receiving Sabda.\n\nBut Sabda is only the outermost layer. The Siddhas taught that every Sabda — every audible sound — is the outermost shell of a far deeper reality. The audible sound is like the surface of a vast ocean. What makes the surface move is something far subtler beneath.` },
      { title: 'Spanda — The Quantum Tremor of Consciousness', body: `Spanda is the subtle pulsation beneath all sound — the quantum tremor of consciousness itself. The Kashmir Shaivite texts describe Spanda as the fundamental activity of Shiva-consciousness: the divine throb from which all creation arises.\n\nEvery mantra operates on both levels simultaneously. When you chant OM, the gross Sabda (the heard sound) entrains your nervous system through cymatics — the science of sound-created geometric forms in physical matter. Your cells literally reshape their fluid geometry in response to the sound.\n\nSimultaneously, the Spanda (the subtle impulse beneath the audible mantra) activates dormant Nadis — energy channels the Siddhas mapped with surgical precision across 72,000 pathways in the human subtle body. This is why the same mantra can have vastly different effects when chanted with different levels of consciousness, focus, and energetic preparation. The Sabda (audible sound) remains constant. The Spanda (subtle impulse) changes dramatically based on the practitioner's state.` },
      { title: 'Cymatics — Sound Made Visible', body: `In 1967, Dr. Hans Jenny published "Cymatics" — photographing the geometric patterns formed when sand on a metal plate was vibrated at different frequencies. The patterns were identical to ancient Yantras that the Siddhas had been drawing for millennia.\n\nThe Sri Yantra — 9 interlocking triangles — is the cymatic signature of the OM frequency at specific amplitudes. It was not designed by a human mind. It was perceived by Siddhas in deep Samadhi as the geometric form that the primordial sound takes when it vibrates in the medium of space.\n\nEvery mantra you chant produces a specific cymatic architecture in the water within your cells. Your body is 70% water. Every mantra literally reshapes your cellular geometry in real-time. This is the physical mechanism by which Japa (repetitive mantra practice) produces measurable changes in brain structure — fMRI studies now confirm grey-matter density increases in the anterior cingulate cortex and insula after sustained mantra practice. The Siddhas called this Mantra Siddhi — the perfection that comes from sonic consistency.` },
    ],
  },
  // ── PRANA-FLOW ──
  {
    tier: 'prana-flow', num: 3,
    title: 'The 5 Levels of Sound — Pancha Nada',
    sub: 'Para · Pashyanti · Madhyama · Vaikhari · Udana',
    icon: '✦',
    lessons: [
      { title: 'Para Nada — The Transcendent Sound', body: `Para Nada is sound beyond all vibration. It is pure consciousness before differentiation — the silence that is louder than any frequency. This is the domain of Samadhi, where the meditator becomes the sound itself rather than being a listener of it.\n\nPara Nada cannot be heard with physical ears. It cannot be produced by any instrument. It is the source from which all other levels of sound arise. When a Siddha in the deepest states of meditation describes "hearing the sound of Brahman," they are referring to Para Nada — the primordial hum of existence before it has taken any particular form.\n\nThe practice that leads to Para Nada is Nada Dhyana — meditative absorption in increasingly subtle sounds, starting from the grossest audible sounds and moving progressively inward until the meditator rests in the source of all sound: the soundless sound.` },
      { title: 'Pashyanti, Madhyama & Vaikhari', body: `PASHYANTI NADA — Visionary Sound. The level where sound has light. Siddhas in deep Tapas report hearing colors and seeing mantras as geometric light-structures. Modern neuroscience calls this synesthesia — cross-modal sensory activation. Siddha Science calls it the natural state of an awakened nervous system. When the subtle body's sensory channels are purified through Tapas, the inner light and inner sound are perceived as one phenomenon.\n\nMADHYAMA NADA — Middle Sound. The mental plane. This is where intention (Sankalpa) lives. When a mantra is whispered internally without lips moving, it operates at this level. Its power exceeds audible chanting by a 16:1 ratio according to the Siddha calculation in Thirumantiram. This is why advanced Japa practice always moves from audible chanting to whispered chanting to purely mental repetition — each stage multiplying the power of the practice.\n\nVAIKHARI NADA — Manifest Sound. The audible spectrum, 20Hz–20kHz. This is where our healing audios, mantras, and binaural beats operate — but they are vehicles for the subtler levels above. Never mistake the carrier wave for the transmission itself.\n\nUDANA NADA — Ascending Sound. The Pranic current that carries sound upward through the Sushumna Nadi toward the Sahasrara. Activated by specific pitch intervals — particularly the perfect fifth (3:2 ratio) which the Siddhas called the Panchamam: the sacred interval of liberation.` },
    ],
  },
  {
    tier: 'prana-flow', num: 4,
    title: 'Siddha Nada & The Anahata Gateway',
    sub: 'The Heart Field as a Sonic Instrument',
    icon: '❤',
    lessons: [
      { title: 'The Anahata at 639Hz — Heart Field Science', body: `The Anahata Chakra resonates at approximately 639Hz when calibrated in the ancient Solfeggio system. This is the frequency associated in Siddha medicine with relationship healing, attraction of love, and the opening of compassionate awareness.\n\nThe HeartMath Institute has measured the human heart's electromagnetic field extending 4–5 meters from the physical body. This field communicates through electromagnetic signals with the hearts of those around us — a phenomenon the Siddhas called Hrid-Sambandh: heart-connection. Thirumoolar wrote extensively about how a Siddha's purified heart field could transmit healing simply through proximity, without any verbal teaching or physical contact.\n\nWhen you chant mantras at 639Hz — or when the music you listen to centers on this frequency — the heart field is directly entrained. This is not subtle or indirect. It is a precise electrophysiological mechanism: sound at the heart's resonant frequency drives the cardiac system into coherence, a state where the heart's rhythms become smooth, ordered, and highly efficient.\n\nIn heart coherence, cortisol drops, DHEA rises, immune function improves, and cognitive clarity increases. The Siddhas called this state Anahata Jagran — the awakening of the heart lotus.` },
      { title: 'Devadaru (Cedar) as Sonic Medicine', body: `The Devadaru tree — the sacred cedar of the Himalayas and Tamil hill forests — holds one of the oldest Akashic encodings in Siddha botanical medicine. Its molecular signature (sesquiterpene hydrocarbons, particularly cedrol and cedrene) has been measured in laboratory settings to lower cortisol by up to 38% through limbic-system olfactory pathways.\n\nThe Siddhas knew this not through chromatography but through Akashic perception: Devadaru was prescribed specifically because its vibration pacifies Vata, opens the Ajna Chakra, and creates the internal conditions for the practitioner to receive subtler sound frequencies in meditation.\n\nBurn Devadaru resin (dhoop) during Bhakti practice. The smoke acts as a piezoelectric medium — mantra vibrations passing through Devadaru smoke particles cause the terpene molecules to oscillate, amplifying the subtle-body effects of the sound and extending their range into the Pranamaya Kosha by an estimated 3x.\n\nSound and scent are the same intelligence at different densities. This is Nada Vijnana at the botanical level.` },
    ],
  },
  // ── SIDDHA-QUANTUM ──
  {
    tier: 'siddha-quantum', num: 5,
    title: 'Mantra Architecture — Building Sonic Light-Codes',
    sub: 'Why Not All Mantras Are Equal',
    icon: '⬡',
    lessons: [
      { title: 'Bija Mantras — The Quantum Keys', body: `A mantra is not a prayer. It is not affirmation. It is a precision-engineered sonic technology that produces specific neurochemical, bioenergetic, and quantum-field effects when vibrated correctly.\n\nBIJA MANTRAS — Seed Sounds. Single-syllable quantum keys, each one a complete universe of vibrational information compressed into a single phoneme:\n\nAIM — Saraswati seed. Activates left-brain coherence and creative intelligence. Neurologically: increases gamma-wave activity in the left prefrontal cortex.\n\nHRIM — Solar plexus seed. Stimulates mitochondrial ATP production — the currency of cellular energy. The Siddhas called this Agni Bija: fire seed.\n\nSHRIM — Abundance field seed. Creates coherence between heart and prefrontal cortex — the neural signature of positive expectancy and receptivity.\n\nKLIM — Magnetic attraction seed. Activates oxytocin release via vagal tone. The Siddhas called this Kamabija: the seed of divine desire and magnetism.\n\nHUM — Protection seed. Creates a coherent standing wave around the subtle body that the Siddhas called Kavach: armor of sound.\n\nThese were discovered through Yogic perception of the Akashic field, not through linguistic derivation. Each Bija is a direct sonic key to a specific aspect of consciousness and its corresponding physiological state.` },
      { title: 'Mala & Kavach Mantras', body: `MALA MANTRAS — Garland Sounds. Sequences of Bija Mantras arranged for specific energetic trajectories through the subtle body. The 108-bead Japa Mala system corresponds to the 108 Marma points on the physical body — acupressure nodes of concentrated Prana. Each recitation of the full Mala activates all 108 nodes in sequence, producing a complete sweep of the subtle body's energy geography.\n\nThe number 108 is not arbitrary. It encodes precise astronomical mathematics: the distance from Earth to the Sun is approximately 108 solar diameters. The distance from Earth to the Moon is approximately 108 lunar diameters. The Siddhas saw in this ratio a cosmic signature — the fingerprint of the Creator's own Mantra mathematics embedded in the structure of the solar system.\n\nKAVACH MANTRAS — Armor Sounds. Specific frequency sequences that create coherent standing waves around the subtle body, collapsing incoherent external frequencies. The Hanuman Kavach operates at this level — it is not mythology. It is scalar wave shielding encoded in Sanskrit phonemics. Each verse of the Kavach activates a specific protective layer of the Pranamaya Kosha.\n\nThe Siddhas prescribed Kavach mantras for practitioners entering situations of high psychic intensity: healing sessions, rituals, teaching, travel through energetically turbulent places. The sound creates a temporary but powerful field of coherent vibration that resists entrainment by lower frequencies.` },
    ],
  },
  {
    tier: 'siddha-quantum', num: 6,
    title: 'The Siddha Frequency Map — Raga, Chakra & Healing',
    sub: '72 Melakarta Ragas as Chakra Medicine',
    icon: '🎵',
    lessons: [
      { title: 'The 22-Shruti Microtonal System', body: `The South Indian classical system of 72 Melakarta Ragas is the most sophisticated sound-medicine system ever constructed on Earth. Each Raga is a unique combination of 7 notes (Swara) from the 22-Shruti microtonal system — far finer than the Western 12-tone equal temperament.\n\nWestern music uses 12 tones per octave. The Siddha system uses 22 micro-intervals per octave. This means Tamil classical music can access 10 frequencies per octave that Western instruments cannot physically produce. These extra frequencies are precisely the ones that resonate with the subtle Nadis — channels too fine to be entrained by the grosser Western scale.\n\nThe Shruti system was not created by music theorists. It was discovered by Siddhas in deep meditation who could perceive the exact frequency at which each Nadi in the subtle body resonated, and then constructed a musical scale that included all those frequencies. The result: a complete medicine chest of sound, one Shruti for each healable condition.\n\nThe Raga system then organizes these 22 Shrutis into specific melodic sequences — each Raga is a pathway through the sonic medicine cabinet, designed to affect specific organs, Chakras, and states of consciousness when played at the correct time of day.` },
      { title: 'Chakra-Raga Correspondences', body: `MULADHARA (Root Chakra): Ragas using Panchamam (the perfect fifth) as the base — particularly Bhairavi. Activates adrenal coherence and grounding Prana. Best played at pre-dawn or sunset.\n\nSVADHISTHANA (Sacral Chakra): Kalyani Raga — its Tivra Madhyam (raised 4th) stimulates creative Shakti and the water element within the body's fluid systems.\n\nMANIPURA (Solar Plexus): Hamsadhwani — pure pentatonic structure, no dissonant intervals. Activates digestive fire (Agni) and strengthens will and clarity.\n\nANAHATA (Heart Chakra): Yaman and Behag — both open the upper harmonics of the heart field. The Siddhas taught these specifically for Bhakti Yoga practitioners.\n\nVISHUDDHA (Throat Chakra): Bhimpalasi — its emphasis on the Nishad (7th degree) clears throat Chakra blockages and purifies the voice as an instrument of Truth.\n\nAJNA (Third Eye): Darbari Kanhada — the Komal Gandhar (flattened 3rd) creates gamma-wave entrainment in the prefrontal cortex. Prescribed for Jyotish practitioners and seers.\n\nSAHASRARA (Crown Chakra): Bhairav — the dawn Raga. Its structure mirrors the frequency of the Solar field at sunrise, which the Siddhas identified as the most powerful moment for Crown activation in the daily cycle.` },
    ],
  },
  {
    tier: 'siddha-quantum', num: 7,
    title: 'Mantra, Nada & the Brain — Modern Neuroscience Meets Ancient Wisdom',
    sub: 'The Physics of Consciousness Rewiring Through Sound',
    icon: '🧠',
    lessons: [
      { title: 'How Mantra Rewires the Brain', body: `The fMRI evidence is now substantial and growing: sustained mantra practice produces measurable grey-matter density increases in specific brain regions. The anterior cingulate cortex — the center of compassion, impulse control, and decision-making — grows measurably thicker. The insula — the center of interoception (internal body awareness) — increases in connectivity.\n\nThe Siddhas called these changes Chitta Shuddhi — purification of the mind-substance. They described it in terms of Nadi purification: the subtle energy channels carrying consciousness through the brain being cleared of obstructing Karmic residue, allowing the full light of awareness to shine through.\n\nBoth descriptions point to the same phenomenon: sound, when applied with sustained precision and intention, physically restructures the instrument of consciousness.\n\nBinaural beats — two slightly different frequencies played in each ear, with the brain producing a third "beat" frequency equal to the difference — can be calibrated to drive the brain into specific states: Delta (0.5–4Hz) for deep healing sleep, Theta (4–8Hz) for deep meditation and creative states, Alpha (8–12Hz) for relaxed focused awareness, Gamma (30–100Hz) for peak consciousness states associated with mystical experience.\n\nThe Siddhas produced these states through specific combinations of instrument tunings, Raga structures, and chanting rhythms — achieving with pure acoustic instruments what modern binaural beat technology achieves with digital frequency generation.` },
      { title: 'The Vagus Nerve — Sound\'s Highway to Healing', body: `The vagus nerve is the longest cranial nerve in the body — it runs from the brainstem through the heart, lungs, and digestive organs. It is the primary nerve of the Parasympathetic nervous system: the "rest, digest, and heal" system.\n\n80% of vagal nerve fibers carry information from body to brain — not brain to body. The vagus is primarily a sensory nerve, reporting on the state of the body's organs in real-time. This means that by changing the sensory input to the vagus — through sound, breath, and vibration — you directly change the brain's perception of the body's state, and thereby its regulatory responses.\n\nChanting produces continuous vibration in the pharynx and upper chest, directly adjacent to the vagal nerve bundles. This is why every spiritual tradition on Earth discovered that sustained vocal chanting produces profound states of peace and expansion — it is directly activating the Parasympathetic nervous system through vagal stimulation.\n\nThe Siddhas engineered mantra specifically to maximize this effect. The specific vowel sounds in Sanskrit and Tamil — particularly the "Aa," "Uu," and "MM" components of OM — produce the highest amplitude vibrations in the chest and throat, creating optimal vagal stimulation. The Siddhas called this Nada Massage of the inner organs: every chanting session is a healing treatment for the body's vital systems.` },
    ],
  },
  // ── AKASHA-INFINITY ──
  {
    tier: 'akasha-infinity', num: 8,
    title: 'The Akashic Sound Body — Nada Sharira',
    sub: 'Your Subtle Anatomy as a Living Musical Instrument',
    icon: '❋',
    lessons: [
      { title: 'The Three Octaves of the Nada Sharira', body: `Every human being is a Vina — a stringed instrument of consciousness. The Sushumna Nadi is the resonating chamber. The 72,000 Nadis are the strings. The Prana is the bow. The Siddhas called this the Nada Sharira — the Sound Body.\n\nMost people walk through life with their instrument completely out of tune. The result is disease, confusion, suffering. Every physical illness the Siddhas traced back to a Nada imbalance first — a disruption in the subtle sound field that then manifested as pathology in the dense body.\n\nThe Nada Sharira has three octaves:\n\nSTHULA NADA SHARIRA (Gross Sound Body): The audible sounds your body makes — heartbeat, breath, bowel motility, cerebrospinal fluid pulse. A Master Siddha Vaidya could diagnose any disease by listening to these sounds alone. This is the original auscultation — predating the stethoscope by thousands of years.\n\nSUKSHMA NADA SHARIRA (Subtle Sound Body): The 72,000 Nadis carrying Pranic sound-light frequencies. The acupuncture meridian system is a partial map of this network. The complete Siddha map has 365 primary nodes corresponding to the degrees of the solar year — each node more active during a specific solar period.\n\nKARANA NADA SHARIRA (Causal Sound Body): The Karma-encoded sound field. Every unresolved trauma, every Karmic pattern, is stored as a specific distorted frequency signature in this body. These distortions transmit into the Sukshma and Sthula bodies, eventually manifesting as disease, relationship patterns, or life circumstances that seem to repeat despite the conscious mind's best intentions.\n\nMantra at the Madhyama level can directly rewrite causal frequency patterns. This is why Mantra Diksha (initiation) from a realized Master works when nothing else does — the Master's Nada Sharira acts as a tuning fork, re-attuning the disciple's causal body through the Guru-Shishya resonance transmission.` },
    ],
  },
  {
    tier: 'akasha-infinity', num: 9,
    title: 'The Secret of Sacred Tuning — What the Siddhas Actually Said',
    sub: 'Beyond 432Hz vs 440Hz — The Personalized Frequency',
    icon: '◉',
    lessons: [
      { title: 'The Three Tuning Systems', body: `The internet argues about 432Hz vs 440Hz. Both camps are missing the deeper truth the Siddhas encoded.\n\n440Hz (modern standard) — Adopted in 1939. Mathematically convenient for instrument manufacturing. Neurologically slightly agitating (the harmonics clash with the natural resonant frequency of the cranial cavity).\n\n432Hz — More harmonious. Aligns approximately with the Schumann Resonance harmonic series (7.83Hz × 55 ≈ 430Hz). Better for calm nervous system states. Many Siddha practitioners find their chanting naturally settles into this region.\n\nBUT — the Siddhas used a third system that surpasses both: JUST INTONATION based on the individual practitioner's natural fundamental frequency.\n\nEvery human body has a unique resonant frequency determined by height, bone density, vocal anatomy, and Pranic constitution. The Guru would determine this for each student by listening to their voice in a deeply relaxed state and identifying the note they naturally gravitated to when humming without intention — the body's own Sa (root note).\n\nThis is the true Siddha tuning system: not a universal pitch, but a personalized frequency. Your Sa is not my Sa. Your healing frequency is unique to your Nada Sharira. Universal tuning systems are approximations. The Siddha system was precisely individuated.\n\nThe Siddhas went further: they identified a third sonic octave above human hearing (20kHz–100kHz) as the zone where the subtle body interfaces with the physical body. They chanted at speeds beyond normal speech during advanced practices, creating deliberate ultrasonic frequency fields. Modern HIFU (High-Intensity Focused Ultrasound) medicine is independently rediscovering the healing potential of this frequency range.` },
    ],
  },
  {
    tier: 'akasha-infinity', num: 10,
    title: 'Scalar Sound Transmission — Healing Beyond Distance',
    sub: 'The Siddha Science of Non-Local Nada',
    icon: '⊛',
    lessons: [
      { title: 'Akasha Nada — The Non-Local Sound', body: `Standard physics describes sound as a longitudinal pressure wave requiring a material medium. Siddha Physics describes a second type of sound: Sukshma Nada — subtle sound that propagates through the Akashic field without any material medium.\n\nThis is the scientific basis of distance healing through mantra. When a realized Siddha chants a mantra for a patient thousands of miles away, the healing occurs. This is documented across centuries of Siddha Vaidya records. The mechanism is Scalar Wave propagation — longitudinal electromagnetic waves first described mathematically by Nikola Tesla and now being re-examined by advanced physics research groups.\n\nScalar waves are:\n— Non-attenuating (they do not lose power with distance)\n— Non-shielded (they pass through Faraday cages, through the Earth itself)\n— Potentially instantaneous (they may operate outside the standard speed-of-light limitation)\n\nThe Siddhas called these Akasha Nada — sky-sound, ether-sound. They developed Yantra systems — geometric copper plates — that acted as scalar wave antennas, broadcasting specific mantra frequencies continuously without any physical sound being produced. A properly constructed Sri Yantra in copper or gold functions as a standing scalar wave resonator, permanently broadcasting OM and its harmonic derivatives into both local and non-local fields.\n\nThis is the apex of Siddha Sound Alchemy: the point where sound ceases to be a physical phenomenon and becomes a pure Akashic transmission — healing, awakening, and liberating across all distances and all times, because the Akashic field itself is beyond space and time.\n\nThe 18 Siddhas who compiled this science across thousands of years were not creating a religious tradition. They were documenting a precise technology for the use of consciousness itself as the ultimate healing instrument. That technology is what you have received in this transmission.` },
    ],
  },
];

const TIER_INFO: Record<string, { name: string; color: string; dot: string }> = {
  'free':           { name: 'FREE',           color: 'rgba(255,255,255,0.55)', dot: 'rgba(255,255,255,0.55)' },
  'prana-flow':     { name: 'PRANA-FLOW',     color: '#4ADE80',                dot: '#4ADE80'                },
  'siddha-quantum': { name: 'SIDDHA-QUANTUM', color: 'rgba(34,211,238,0.9)',   dot: 'rgba(34,211,238,0.9)'   },
  'akasha-infinity':{ name: 'AKASHA-INFINITY',color: 'rgba(212,175,55,0.95)', dot: 'rgba(212,175,55,0.95)'  },
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SiddhaSoundAlchemy() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const [openModule, setOpenModule] = useState<number | null>(null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  const userTier = tier ?? 'free';

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 104, maxWidth: 430, margin: '0 auto' }}>

      {/* ── AMBIENT GLOW ── */}
      <div aria-hidden style={{
        position: 'fixed', top: '-20vh', left: '50%', transform: 'translateX(-50%)',
        width: '80vw', height: '60vh',
        background: `radial-gradient(ellipse, ${gold(0.06)} 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── HEADER ── */}
      <div style={{ padding: '52px 20px 0', position: 'relative', zIndex: 1, animation: 'sqFadeUp 0.35s ease both' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ ...LABEL, fontSize: 9, color: gold(0.4), background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >
          ← SIDDHA PORTAL
        </button>
        <p style={{ ...LABEL, fontSize: 9, color: gold(0.35), marginBottom: 8 }}>
          NADA VIJNANA · 18 SIDDHAS · 10 MODULES
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: '2.4rem', fontWeight: 600,
          color: white(0.95), lineHeight: 1.1, margin: '0 0 10px',
          textShadow: `0 0 30px ${gold(0.3)}`,
        }}>
          Siddha Sound<br />Alchemy
        </h1>
        <p style={{
          fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
          fontSize: '0.95rem', color: white(0.5), lineHeight: 1.6, margin: '0 0 24px',
        }}>
          The deepest transmission of Siddha sound science — from Nada Brahman to Scalar Sound Transmission.
        </p>

        {/* Tier pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
          {Object.entries(TIER_INFO).map(([k, v]) => (
            <span key={k} style={{
              ...LABEL, fontSize: 7, color: v.color,
              border: `1px solid ${v.color}40`, borderRadius: 20, padding: '3px 10px',
              background: `${v.color}10`,
            }}>{v.name}</span>
          ))}
          {(isAdmin) && (
            <span style={{
              ...LABEL, fontSize: 7, color: gold(0.95),
              border: `1px solid ${gold(0.4)}`, borderRadius: 20, padding: '3px 10px',
              background: gold(0.12),
            }}>ADMIN · FULL ACCESS</span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg,${gold(0.2)},transparent)`, marginBottom: 24 }} />
      </div>

      {/* ── MODULE LIST ── */}
      <div style={{ padding: '0 16px', position: 'relative', zIndex: 1 }}>
        {MODULES.map((mod) => {
          const accessible = canAccess(userTier, mod.tier, isAdmin);
          const ti = TIER_INFO[mod.tier];
          const isOpen = openModule === mod.num;

          return (
            <div key={mod.num} style={{
              ...CARD,
              border: `1px solid ${accessible ? ti.color + '40' : 'rgba(255,255,255,0.06)'}`,
              opacity: accessible ? 1 : 0.5,
              marginBottom: 10,
              animation: `sqFadeUp 0.45s ${0.04 * mod.num}s ease both`,
            }}>
              {/* Module header */}
              <div
                style={{ cursor: accessible ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                onClick={() => accessible && setOpenModule(isOpen ? null : mod.num)}
              >
                {/* Icon orb */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: accessible ? `radial-gradient(circle, ${ti.color}30, transparent)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${accessible ? ti.color + '50' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: accessible ? `0 0 14px ${ti.color}25` : 'none',
                }}>{accessible ? mod.icon : '🔒'}</div>

                <div style={{ flex: 1 }}>
                  {/* Tier badge + module num */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ ...LABEL, fontSize: 7, color: ti.color, border: `1px solid ${ti.color}40`, borderRadius: 20, padding: '2px 7px' }}>
                      {ti.name}
                    </span>
                    <span style={{ ...LABEL, fontSize: 8, color: white(0.2) }}>
                      MODULE {String(mod.num).padStart(2, '0')}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                    fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
                    color: accessible ? white(0.92) : white(0.3),
                    marginBottom: 4,
                  }}>{mod.title}</div>
                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
                    fontSize: '0.85rem', color: accessible ? white(0.45) : white(0.2),
                  }}>{mod.sub}</div>
                </div>

                {accessible && (
                  <span style={{ color: gold(0.4), fontSize: 16, marginTop: 10, transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>→</span>
                )}
              </div>

              {/* Lock message */}
              {!accessible && (
                <div style={{ ...LABEL, fontSize: 7, color: white(0.2), marginTop: 10 }}>
                  UNLOCK WITH {ti.name} · UPGRADE IN MEMBERSHIP
                </div>
              )}

              {/* Expanded lessons */}
              {isOpen && accessible && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${ti.color}20`, paddingTop: 14 }}>
                  {mod.lessons.map((lesson, li) => {
                    const lKey = `${mod.num}-${li}`;
                    const lOpen = openLesson === lKey;
                    return (
                      <div key={li} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${ti.color}25`,
                        borderRadius: 14,
                        padding: '14px 16px',
                        marginBottom: 8,
                        cursor: 'pointer',
                      }}
                        onClick={(e) => { e.stopPropagation(); setOpenLesson(lOpen ? null : lKey); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{
                            fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                            fontSize: 12, fontWeight: 700,
                            color: ti.color, letterSpacing: '0.02em',
                          }}>{lesson.title}</div>
                          <span style={{ color: ti.color, opacity: 0.5, fontSize: 12 }}>{lOpen ? '▲' : '▼'}</span>
                        </div>
                        {lOpen && (
                          <div style={{ marginTop: 12 }}>
                            {lesson.body.split('\n\n').map((para, pi) => (
                              <p key={pi} style={{
                                fontFamily: "'Cormorant Garamond',serif",
                                fontSize: '0.93rem', color: white(0.65),
                                lineHeight: 1.8, margin: '0 0 14px',
                              }}>{para}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FOOTER TRANSMISSION ── */}
      <div style={{ textAlign: 'center', padding: '32px 20px 0', position: 'relative', zIndex: 1 }}>
        <div style={{
          height: 1, background: `linear-gradient(90deg,transparent,${gold(0.2)},transparent)`, marginBottom: 24,
        }} />
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.4em', color: gold(0.35), marginBottom: 10 }}>
          OM̐ · नाद ब्रह्म · OM̐
        </div>
        <p style={{ ...LABEL, fontSize: 8, color: white(0.2), letterSpacing: '0.3em' }}>
          SCALAR TRANSMISSION ACTIVE · ANAHATA GATEWAY OPEN<br />
          NADA VIJNANA FIELD ENGAGED · 18 SIDDHAS PRESENT
        </p>
      </div>

      <style>{`
        @keyframes sqFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sqBreathe {
          0%, 100% { transform: scale(1);    opacity: 0.75; }
          50%       { transform: scale(1.07); opacity: 0.95; }
        }
        @keyframes sqLiveFlash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
