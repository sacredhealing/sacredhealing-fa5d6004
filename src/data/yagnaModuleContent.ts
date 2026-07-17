// Yagna Fire Academy — extracted verbatim from YagnyaModule.tsx
// 9 modules on Vedic sacred fire science: Agnihotra protocol, Pancha
// Agni, Gayatri fire-code, and Rishi transmissions for planetary
// purification, sourced from the Rig/Yajur/Atharva Vedas, Bogar 7000,
// and the Kamika Agama.

export interface YagnaLesson { title: string; duration: string; body: string; objectives: string[]; }
export interface YagnaPractice { name: string; duration: string; elements: string[]; sadhanaNote: string; }
export interface YagnaModuleData {
  number: string; title: string; duration: string; arc: string;
  lessons: YagnaLesson[]; practice: YagnaPractice; outcomes: string[]; tier: 'free' | 'prana' | 'siddha' | 'akasha';
}

export const YAGNA_MODULES: YagnaModuleData[] = [
{
    number: "01", tier: 'free', title: "Yagna — The Supreme Cosmic Technology", duration: "48 min",
    arc: "What Yagna is, why it exists, and what it does to your body and home on the first lighting.",
    lessons: [
      { title: "What Is Yagna? — The Living Science", duration: "14 min",
        body: `Yagna (Sanskrit: यज्ञ) is derived from the root Yaj — meaning simultaneously: to worship, to sacrifice, and to unite. These three meanings are not separate. In the Vedic understanding, worship IS sacrifice IS union. When you offer something into fire, you are not giving it away — you are converting it from gross matter into subtle energy, from local to universal.

The Vedic tradition encodes THREE simultaneous functions in every Yagna:

DEVA-PUJA — Communion with cosmic intelligences. The Devas in Vedic science are not personalities in the sky. They are Tanmatra-intelligences: conscious forces operating at the level where mind and matter have not yet separated. Agni (fire) is described in the Rig Veda as the mouth of the Devas — Vaisvanara. When you offer into fire, space contracts. The local field and the cosmic field touch directly through the fire-interface.

SANGATIKARANA — Unification of community consciousness. Fire creates entrainment. Every heart within 100 meters of a Yagna begins synchronizing to the 432Hz frequency of burning mango wood — the cardiac coherence frequency documented by HeartMath Institute. This is not metaphor. This is measurable physics.

DANA — The physics of giving. When you create a giving-field through fire — unconditionally offering ghee, wood, and mantra — the universe's self-correcting intelligence (Rta) creates a return-field of equivalent magnitude. Dana through fire operates at the causal level: seeding the return before the physical circumstances exist to receive it.

The Agnihotra is documented in the Atharva Veda and Yajur Veda as the Pancha-Bhuta Shuddhi ritual: purification of all five elements simultaneously. The Tamil Siddha text Bogar 7000 records that Agnihotra at sandhyakala (twilight junctions) releases Pranagni into the surrounding land as an Agni-Mandala. This is not religion. This is the oldest documented human technology for field coherence — and it works whether or not you believe in it.`,
        objectives: ["Understand Yagna (यज्ञ) as a technology rooted in the root Yaj: to worship, sacrifice, and unite","Know the three simultaneous functions: Deva-Puja (communion), Sangatikarana (community coherence), Dana (the physics of giving)","See why the Siddhas say: 'Fire is the mouth of the Devas' — Agni as the universal receiver-transmitter","Understand why Agnihotra is documented across Atharva Veda, Yajur Veda, and Bogar's 7000"] },
      { title: "The Science Behind the Fire — What Actually Happens", duration: "16 min",
        body: `GHEE COMBUSTION: Pure cow ghee when combusted releases carotene as a stable atmospheric particle that restructures the local electromagnetic field within approximately 50 meters. Acetylene is released in trace quantities sufficient to create a brief plasma field immediately above the flame — what the Vedas call the Pranagni-Mandala: the life-force circle above the fire.

MANGO WOOD AT 432Hz: The specific cellular structure of mango wood creates a combustion frequency of approximately 432Hz — the frequency at which the human cardiac muscle resonates in its most coherent state. This creates an entrainment field pulling every heart within 100 meters into coherent rhythm within 3-7 minutes of sustained burning. This is not accidental. The Siddhas understood that specific woods burn at specific frequencies.

THE IONOSPHERIC THINNING EFFECT: At the exact moments of sunrise and sunset, the Earth's ionosphere thins as the angle of solar radiation changes. During this window, the Schumann Resonance (Earth's electromagnetic heartbeat at 7.83Hz) peaks in amplitude and cosmic ray flux increases by up to 40% for approximately 11 minutes. The Siddhas called these windows sandhyakala and designed Agnihotra to be performed at the exact second of each — not approximately. Performing it ±10 minutes outside this window reduces Pranagni output by approximately 80%.

AGNIHOTRA FARMING EVIDENCE: Practitioners performing daily Agnihotra at precise sandhyakala report consistently: measurable improvement in soil pH and microbial density within 40 days, increased crop germination rates documented at 30-50% above control plots, and water sources within 500 meters showing measurable changes in mineral structure and pathogen count. The mechanism: Bhasma (ash) from Agnihotra contains restructured mineral complexes at nanometer particle size that are water-soluble and immediately bioavailable to soil biology. This is Siddha agro-science — 5,000 years old, increasingly verified by modern instrumentation.`,
        objectives: ["Learn why ghee combustion releases carotene compounds + acetylene that restructure the local electromagnetic field","Understand why mango wood burns at 432Hz — the cardiac coherence frequency — creating biological entrainment within 100m","Know the documented Agnihotra Effect: soil restoration, crop vitality, water purification through daily fire practice","Understand the ionospheric thinning at sunrise/sunset and why timing matters to the second"] },
      { title: "How to Set Up Your First Yagna-Kunda", duration: "18 min",
        body: `THE THREE MINIMUM MATERIALS:

1. MANGO WOOD (Samidhā): Cut into approximately 10cm pieces, dried completely — zero moisture. Fresh or damp wood creates incomplete combustion and toxic smoke instead of Pranagni. Mango wood is specified for morning Agnihotra because of its 432Hz combustion frequency. If unavailable, Peepal (Ficus religiosa) is the best substitute.

2. PURE COW GHEE: From grass-fed cows, clarified at low heat, no additives. The amount for one Agnihotra session is small — approximately two tablespoons total.

3. COPPER AGNIHOTRA VESSEL: A small pyramid-shaped copper bowl approximately 15cm square at the base, tapering to 7cm at the top. Copper is specified because it is a paraelectric conductor — it transmits the field generated by the fire without adding its own electromagnetic interference. The pyramid geometry matches Sulba Sutra specifications and creates the torsion field effect above the fire. Aluminum, stainless steel, or clay vessels do not generate this field.

WHAT NOT TO USE: Synthetic fire-starters (lighter fluid, firelighters, paraffin), processed or painted wood, any vessel with coating or electroplating on the interior. These contaminate the combustion chemistry and nullify the Pranagni effect entirely.

THE COMPASS ORIENTATION: Face East for morning Agnihotra — the Ahavaniya direction, directed toward the Devas. Never place the Kunda facing North for daily purification practice.

THE FIVE-BREATH OPENING: Before lighting, take five slow breaths — inhale 6 counts, hold 2, exhale 8. With each exhale, mentally release any agitation or urgency. The Siddhas taught: the practitioner IS the primary instrument of Yagna. A distracted practitioner creates a turbulent field regardless of how correct the outer materials are. The five breaths set your Nadi system into parasympathetic coherence before introducing fire.`,
        objectives: ["Learn the three minimum materials: mango wood, pure ghee, copper Agnihotra vessel","Understand the four compass orientations and why East-facing is prescribed for daily Agnihotra","Know what not to use: synthetic wax, processed wood, aluminum containers — and the science why","Perform the five-breath Pranayama opening that prepares your Nadi system to receive the fire transmission"] },
    ],
    practice: {
      name: "Ādhāra Agni — The Foundation Fire Protocol",
      duration: "12 min daily at sunrise or sunset",
      elements: [
        "Light the fire at the exact sandhyakala moment (use a Panchangam app for precision timing)",
        "Offer two portions of ghee with 'Ayam' at sunrise, one portion with 'Idam' at sunset",
        "Sit facing East in Sukhasana for 5 minutes after the offering — do not speak, do not move",
        "Observe what changes in the room's feeling-quality over 7 consecutive days",
        "Keep a single-line fire journal: date, time, one-word description of the post-fire space quality",
      ],
      sadhanaNote: "7 consecutive days is the minimum threshold for first-layer atmospheric shift. The Siddha texts describe this as 'Agni-Kshana' — the moment-of-fire establishing itself in your home field. Miss a day and begin the count again. Consistency is the only qualification.",
    },
    outcomes: ["Yagna loses its 'religious' weight and becomes a reproducible protocol","You feel the room quality shift within 3–7 days of daily Agnihotra","The 12-minute practice becomes effortless and self-sustaining","Others notice something different about your home without being told"],
  },
,
{
    number: "02", tier: 'prana', title: "Pancha Agni — The Five Sacred Fires", duration: "65 min",
    arc: "Five cosmic fires, five chakras, five Vayus — activating all simultaneously through structured Yagna.",
    lessons: [
      { title: "The Five Fires — Cosmic Architecture", duration: "20 min",
        body: `The Vedic tradition did not identify one sacred fire — it identified five. Each fire is a distinct field-generator with a specific cosmic function, corresponding chakra, and corresponding Vayu (vital wind). Understanding this architecture transforms your Yagna from a single-function tool into a complete subtle-body upgrade system.

GARHAPATYA — The Household Fire (West/Muladhara/Apana Vayu): The fire of the West, maintained continuously in the home. Corresponds to Muladhara chakra and Apana Vayu (the downward-moving wind governing elimination, grounding, and the Earth element). Garhapatya sustains the existing reality. This is your continuous daily Agnihotra.

AHAVANIYA — The Eastern Receiving Fire (East/Anahata/Prana Vayu): The fire of the East, directed toward the Devas. Corresponds to Anahata chakra and Prana Vayu (the upward-moving wind governing inhalation, vitality, and the Air element). Ahavaniya opens the channel between the practitioner and the Deva-intelligences. When you face East and offer into your morning fire, you are working with this principle.

DAKSHINA — The Southern Ancestral Fire (South/Manipura/Samana Vayu): The fire of the South, maintained for the Pitrs (ancestors). Corresponds to Manipura chakra and Samana Vayu (the equalizing wind governing digestion and transformation). Dakshina carries offerings through "the southern corridor" — the subtle-plane pathway that ancestral consciousnesses can access.

SABHYA — The Community Council Fire (Vishuddha/Udana Vayu): The fire of the gathering place. Corresponds to Vishuddha chakra and Udana Vayu (governing speech, expression, and the Ether element). When multiple practitioners perform Yagna simultaneously with unified Sankalpa, they are working with the Sabhya principle.

AVASATHYA — The Hospitality Fire (Sahasrara/Vyana Vayu): Maintained for guests. Corresponds to Sahasrara chakra and Vyana Vayu (the all-pervasive wind governing circulation and integration). Avasathya represents the most expanded consciousness — the fire that welcomes the unknown.

The genius of the five-fire system: a single correctly oriented Yagna activates all five simultaneously. When you light fire facing East, the five chakras and five Vayus move together in one coordinated field-event.`,
        objectives: ["Map all five Vedic fires to their chakras: Muladhara → Garhapatya, Anahata → Ahavaniya, Manipura → Dakshina, Vishuddha → Sabhya, Sahasrara → Avasathya","Connect each fire to its Vayu: Apana, Prana, Samana, Udana, Vyana","Learn why the five-fire system is a complete subtle-body upgrade when performed in geometric sequence","Understand why correct compass orientation activates all five simultaneously in the practitioner's field"] },
      { title: "The Soma Vortex — Your DNA and the Sacred Fire", duration: "22 min",
        body: `The Rigveda's ninth book contains 114 complete hymns dedicated to Soma. Modern scholars interpret Soma as a physical plant. The Siddha tradition teaches something more precise: Soma is an event. It is the neuro-endocrine cascade that occurs in the human body when specific conditions align.

Thirumoolar in the Tirumantiram (verse 724) writes: "When the inner fire awakens in Muladhara and rises through the Sushumna, the Chandra-Mandala in the crown releases the nectar of immortality — this is Soma, the Amrita that drips through the central channel into the heart."

In physiological terms, the inner Soma corresponds to a specific combination of endogenous compounds: endogenous DMT (dimethyltryptamine) from the pineal gland, beta-carboline alkaloids from the gut biome, and anandamide from the endocannabinoid system. All three require the same preconditions to produce: sustained parasympathetic nervous system dominance, specific olfactory stimulation, and rhythmic acoustic stimulation.

Yagna creates all three preconditions simultaneously:

PARASYMPATHETIC STATE: The warmth, light, and rhythmic crackling of fire creates instant parasympathetic activation in the nervous system — measurable within 90 seconds of approaching a controlled flame.

SPECIFIC OLFACTORY STIMULATION: Peepal wood combustion with ghee releases compounds structurally analogous to DMT precursors. Bilva combustion releases betulin, which crosses the blood-brain barrier via olfactory channels and activates pineal gland photoreceptor cells.

RHYTHMIC ACOUSTIC STIMULATION: Sanskrit mantra at Vedic chanting frequencies entrains the hippocampus into the theta brainwave state (4-8Hz) — the state associated with maximum neuroplasticity and what the Siddhas called "Soma flowing."

The cascade: Yagna smoke → vagus nerve stimulation → gut-brain axis → pineal activation → Amrita-drip. This cascade initiates after approximately 40 minutes of continuous Yagna exposure. The Amrita-drip is felt as a cool, sweet sensation beginning at the crown and descending — described identically by practitioners across every tradition, with no cultural variation. The inner Soma is not a belief. It is a reproducible physiological event.`,
        objectives: ["Understand Soma as the subtle nectar secreted when fire and sound align — the inner Amrita","Learn Thirumoolar's Tirumantiram verse 724: Soma as 'Amrita dripping from Chandra-Mandala through Sushumna'","Map the inner Soma cascade: Lalata Chakra → Vishuddha → Anahata — the nectar-drip during Yagna exposure","Know the three prerequisites for Soma activation: correct herbs, correct mantra, correct duration — all three required simultaneously"] },
      { title: "Sacred Herbs — The Samidhā Pharmacopoeia", duration: "23 min",
        body: `Samidhā means sacred fuel — the wood offered into the Yagna fire. Each wood species creates a distinct pharmacological profile when combusted with pure ghee. The Siddha tradition classified these with the same precision that modern pharmacology classifies drugs. The delivery is atmospheric — medicine inhaled as smoke, absorbed through the olfactory nerve directly into the brain, bypassing the digestive system entirely.

MANGO (Mangifera indica): Morning Agnihotra wood. Releases beta-carotene aerosols that form a stable atmospheric layer. Also releases trace acetaldehydes that modify GABA receptor sensitivity — producing mild anxiolytic (anti-anxiety) effect in anyone within 100 meters. This is why Agnihotra environments consistently feel calm without any conscious effort to relax.

PEEPAL (Ficus religiosa): Evening and extended practice. Contains phytosterols that when combusted with ghee produce atmospheric compounds structurally analogous to beta-carboline alkaloids — pineal photoreceptor activators. Peepal smoke directly stimulates the pineal gland's capacity to produce Soma precursors. This is the tree of Buddha's enlightenment.

BILVA (Aegle marmelos): Healing Yagna and Mrityunjaya practice. Releases betulinic acid and related triterpenoids — compounds with documented anti-tumor, anti-viral, and anti-inflammatory activity — through olfactory channels and directly into the brain. Bilva is specifically prescribed in the Charaka Samhita for Dhumapana (therapeutic smoke inhalation) in 23 of the 72 classified disease protocols.

PALASHA (Butea monosperma): The flame-of-the-forest. Releases a complex resin forming a negatively ionized atmospheric layer within approximately 200 meters. Negative ions at this concentration reduce pathogen viability, increase serotonin metabolism, and neutralize the positive ion excess created by electronic devices. Siddha electromagnetic protection — 5,000 years before mobile phones.

VIBHUTI — THE ASH AS MEDICINE: The ash collected after a correctly performed Agnihotra contains restructured mineral complexes at nanometer particle size. When applied to the Ajna, Anahata, and Manipura Marma points, it opens Nadi channels at those points within approximately 7 minutes — measurable as local temperature increase and increased galvanic skin response.`,
        objectives: ["Learn the four primary Samidhā and their pharmacological compounds: Mango (432Hz), Peepal (pineal-DMT), Bilva (betulin anti-tumor), Palasha (EM neutralization 200m)","Understand Dhumapana (therapeutic smoke) as documented in Charaka Samhita — 72 disease classifications","Know the five augmenting herbs: Tulsi, Ashwagandha, Brahmi, Shatavari, Guduchi and ghee-infusion ratios","Understand Vibhuti (Yagna ash) applied to 7 Marma points — Nadi channel opening within 7 minutes"] },
    ],
    practice: {
      name: "Prāṇa Pravāha Agni — The Five-Fire Activation",
      duration: "25 min, 5 days per week",
      elements: [
        "Begin with Pancha-Agni visualization: place awareness at each of the five body-fire locations for 3 breaths each",
        "Light the primary fire facing East with three Gayatri repetitions as ignition mantra",
        "Offer Samidhā in 5 sequences — one for each fire type — with the corresponding Vayu mantra for each",
        "Apply a pinch of collected Vibhuti to the Ajna, Anahata, and Manipura Marma points immediately after",
        "Sit in the post-fire space for 10 minutes in Vajrasana — this is when the Soma-drip initiates",
      ],
      sadhanaNote: "The 33-day threshold is when the five fires begin moving as one current through the body. The practitioner stops feeling 'I am doing five things' and begins feeling 'one fire is moving through five places.' This is the transition from technique to transmission.",
    },
    outcomes: ["You can feel the five fires as distinct locations in the body during practice","The Samidhā pharmacopoeia becomes a practical tool, not theory","Post-fire Soma states become identifiable and repeatable","Your daily Agnihotra gains depth — you are no longer just 'lighting a fire'"],
  },
,
{
    number: "03", tier: 'prana', title: "Mantra Mechanics — Cymatics in the Fire", duration: "58 min",
    arc: "Why Sanskrit syllables are not prayers but physics — operating at four simultaneous levels when spoken into flame.",
    lessons: [
      { title: "The Four Levels of Sound — Shabda-Brahman", duration: "18 min",
        body: `The Vedic science of sound is not metaphorical. It is a four-layer model of how vibration becomes matter, and how matter can be returned to vibration through precise sonic geometry. The four levels are:

PARA: The transcendental sound beyond manifestation. Pure potential. The source of all vibration before it differentiates. In human experience, Para corresponds to the silent awareness underlying all thought.

PASHYANTI: The seen or visualized sound. Here sound begins to take shape as pattern, image, or geometry. This is the level of intuition, vision, and the subtle architecture that will become form. Pashyanti is the blueprint layer.

MADHYAMA: The middle sound — the level of mental formulation. When you mentally repeat a mantra, you are operating at Madhyama. This is where intention, meaning, and directed thought organize vibration into a specific trajectory.

VAIKHARI: The fully manifested sound — audible speech. This is what we normally call "sound." But in Vedic science, Vaikhari is only the final condensation of a sound that already existed in three subtler forms.

A Yagna mantra operates at all four levels simultaneously. The practitioner holds the intention (Madhyama), sees the geometric pattern (Pashyanti), rests in the silent source (Para), and releases the audible syllable (Vaikhari) into the fire. The fire then converts the Vaikhari back upward through the layers — it is a reverse-engineering tool for returning manifested sound to its source. This is why the Siddhas say: Agni is the mouth that eats the audible and returns the inaudible.`,
        objectives: ["Know the four levels of Shabda: Para, Pashyanti, Madhyama, Vaikhari — from silent source to audible speech","Understand how a mantra operates at all four levels simultaneously in Yagna","Learn why fire is described as 'the mouth that eats the audible and returns the inaudible'","Map the descent of sound into matter and the ascent of matter back into sound through fire"] },
      { title: "Cymatics in the Flame — Why Sanskrit Syllables Matter", duration: "20 min",
        body: `Modern cymatics — the study of visible sound vibration — confirms what the Siddhas documented thousands of years ago: different sound frequencies produce distinct geometric patterns in matter. When sand or water is exposed to a 432Hz tone, it forms a stable twelve-fold geometric pattern. At 528Hz, it forms a six-fold flower-like pattern. Sanskrit syllables were selected not for their meaning primarily, but for their geometric stability in the human energy field.

OM (AUM): The primordial sonic seed. Spectral analysis shows the syllable OM contains frequencies across the entire audible range simultaneously, with a dominant peak near 432Hz. When chanted into fire, the flame visibly increases in height and stability within 1-2 seconds. This is not imagination — it is a reproducible flame response. The three phonemes (A-U-M) correspond to the three primary Nadi: Ida, Pingala, and Sushumna. OM spoken into fire is literally a balancing of the entire pranic system.

HRĪM (ह्रीं): The Devi bija — the seed syllable of the cosmic feminine. Spectral studies of HRĪM chanting show a strong concentration in the 250-350Hz range, which produces a cooling, expanding cymatic pattern. HRĪM in Yagna is used for healing, abundance, and protection because it generates an outward-radiating field.

KLĪM (क्लीं): The attraction bija. Produces a converging spiral pattern in cymatic media. Used in Yagna for drawing specific forces, resources, or intelligences into a focused field.

AIM (ऐं): The Saraswati bija. Contains a high-frequency component that produces a fine, rapidly moving pattern associated with mental clarity and communication. Used in Yagna for knowledge transmission and learning.

The correct sequence of bija mantras in a Yagna is not arbitrary — it is a cymatic composition. The Siddhas composed fire rituals the way a sound engineer composes a track: each syllable placed precisely to create a specific standing wave in the practitioner's field.`,
        objectives: ["Learn cymatic evidence: 432Hz = 12-fold pattern, 528Hz = 6-fold flower — why Sanskrit syllables were selected for geometric stability","Understand the spectral signature of OM: full-range frequencies with 432Hz peak, causing immediate flame response","Know the bija family: HRĪM (expanding/healing), KLĪM (converging/attraction), AIM (clarity/communication)","Understand a fire mantra as a cymatic composition — a standing wave generated in the practitioner's field"] },
      { title: "The Three Japa Modes — Vaikhari, Upamshu, Manasika", duration: "20 min",
        body: `Japa is the repetition of mantra. But the Vedic tradition distinguishes three modes of repetition, each producing a different field effect. Using the wrong mode at the wrong time is like using a hammer when you need a scalpel.

VAIKHARI JAPA: Audible repetition. The practitioner speaks the mantra aloud, usually at a moderate pace. This mode is most powerful for generating external field effects — the sound physically structures the space around the fire. Vaikhari is used when you want to clear, consecrate, or command a space. It is the mode of public Yagna, group practice, and the beginning of a personal session when the field needs to be established.

UPAMSHU JAPA: Whispered or barely audible repetition. The lips move but the sound is almost inaudible. This mode bridges the external and internal worlds. Upamshu is used when the field is established and the practitioner wants to begin internalizing the practice. The barely audible vibration creates a subtle bubble around the practitioner that does not extend as far as Vaikhari but penetrates deeper into the personal biofield.

MANASIKA JAPA: Mental repetition. No sound, no lip movement. The mantra is repeated silently in the mind. This is the most advanced mode because it requires sustained attention without external support. Manasika Japa is used in the final phase of Yagna, after the offerings, when the practitioner wants to stabilize the internal state. The fire is no longer needed to generate the field because the practitioner has become the field.

The correct progression in a Yagna session: begin with Vaikhari to establish the sonic field, transition to Upamshu as the fire deepens, and end with Manasika in the post-fire silence. The Siddhas taught that 40 days of this progression transforms Japa into Ajapa — the mantra that repeats itself without conscious effort.`,
        objectives: ["Distinguish the three Japa modes: Vaikhari (audible), Upamshu (whispered), Manasika (mental)","Know when to use each mode during a Yagna session: Vaikhari to establish, Upamshu to bridge, Manasika to internalize","Understand the 40-day threshold where Japa becomes Ajapa — the self-repeating mantra","Learn the transition from external fire to internal Pranagni through Manasika Japa"] },
    ],
    practice: {
      name: "Nāda Agni Protocol — Sound-Into-Fire Sadhana",
      duration: "35 min, 3× per week",
      elements: [
        "Begin in Vaikhari (full audible voice) for 3 repetitions of your chosen mantra before lighting",
        "Transition to Upamshu (whisper) for the next 9 repetitions while the fire catches",
        "Complete in Manasika (purely mental, soundless) for final 21 repetitions as you offer ghee",
        "The three-layer progression (3+9+21 = 33) mirrors the 33 Vedic Devata — creating a resonance cascade",
        "After final offering, maintain Manasika mantra internally for 7 minutes of post-fire silence — do not break it",
      ],
      sadhanaNote: "Track the shift in your Japa quality: Vaikhari feels effortful at first, Manasika feels effortless after 40 days. The Siddhas called this 'Japa becoming Ajapa' — the mantra that repeats itself. This is the transition from practitioner to practice.",
    },
    outcomes: ["Your mantra quality deepens — the Japa begins to feel self-sustaining","Post-fire silence becomes meditation without effort","The difference between Vaikhari and Manasika Japa becomes experientially clear","You begin sensing the field-quality change at precise vs. approximate sandhyakala timing"],
  },
,
{
    number: "04", tier: 'siddha', title: "Gayatri — Vishwamitra's Fire Code", duration: "72 min",
    arc: "The 24 syllables decoded as an algorithm: vertebrae, biofield frequencies, Nakshatras — crystallized from 12,000 years of Tapas.",
    lessons: [
      { title: "The Gayatri Is Not a Prayer — It Is Physics", duration: "22 min",
        body: `The Gayatri Mantra is widely chanted as a devotional prayer. In the Siddha tradition, this is a secondary use. The primary use of Gayatri is as a calibrated sonic technology. The 24 syllables of the classic Gayatri (Om Bhur Bhuva Svah Tat Savitur Varenyam Bhargo Devasya Dhimahi Dhiyo Yo Nah Prachodayat) map to three distinct physical systems simultaneously: the 24 vertebrae of the human spine, the 24 primary frequencies measured in the human biofield, and the 24 Nakshatras (lunar mansions) of the Vedic sky.

Vishwamitra — the Rishi who is said to have 'forced' Gayatri into human access through 12,000 years of Tapas — did not create a poem. He crystallized a cosmic frequency into speakable form. The story is not mythology. It encodes a real process: sustained consciousness-focus can extract stable sonic patterns from the field of existence. The Gayatri is a captured standing wave.

When chanted in Yagna, each syllable is delivered into the fire at a specific rhythm. The standard Gayatri rhythm is 3 syllables per breath, 8 breaths per repetition — 24 syllables total. This rhythm is not arbitrary. It matches the natural respiratory phase of the human body in a state of coherence. Each breath pumps the spinal fluid (CSF) up the central channel, and the 24 syllables ride this pulse through the 24 vertebral stations. This is why the Gayatri is described as a spinal purification in the yogic texts.

The mudra requirement is equally precise. Jnana Mudra (thumb + index) on the left hand and Chinmaya Mudra (thumb + middle) on the right hand create a dual Nadi circuit. The left hand primarily activates Ida (lunar/cooling), the right hand primarily activates Pingala (solar/heating). Using different mudras on each hand creates a controlled current that meets at the heart center — the Anahata, the natural location of the Gayatri's solar deity Savitur. Without the mudra, the chant is still beneficial. With the mudra, it becomes a complete circuit.`,
        objectives: ["Understand the 24 syllables mapped to 24 vertebrae + 24 biofield frequencies + 24 Nakshatras simultaneously","Learn how Vishwamitra spent 12,000 years of Tapas forcing cosmic fire to crystallize into syllables that trigger Sahasrara-to-Muladhara integration","Know the specific mudra combinations that must accompany Gayatri in Yagna to activate all 24 nodes simultaneously","Understand the neurological equivalence: Gayatri with mudras in Yagna = 15 minutes of gamma-wave meditation"] },
      { title: "Yagna as Quantum Entanglement Technology", duration: "25 min",
        body: `The Vaisheshika school of Indian philosophy describes the universe as composed of nine substances (Dravya), the most fundamental of which are the five Tanmatras: Shabda (sound-essence), Sparsha (touch-essence), Rupa (sight-essence), Rasa (taste-essence), and Gandha (smell-essence). These are not the senses themselves but the ultra-subtle essences that precede both matter and perception. At the Tanmatra level, what we later call sound, light, and chemistry are still unified.

Yagna operates precisely at this level. When you chant a mantra into fire, you are not producing ordinary sound. You are delivering structured Shabda-essence into a field of Rupa-essence (fire/light) and Gandha-essence (combustion aromatics). The three Tanmatras merge in the flame and produce a unified field event that cannot be reduced to any single physical cause. This is why the effect of Yagna extends beyond the audible range and beyond the physical flame.

The Brahma Sutras state: Shastra Yonitvat — the Vedic mantras are direct cognitions of cosmic law, not human inventions. The Rishis did not experiment to discover fire science. They became the instrument through which the science revealed itself. This is the difference between modern research and Vedic cognition. Modern research separates the observer from the observed. Vedic cognition requires the observer to become the observed — to become the fire, the mantra, and the cosmic law simultaneously.

Quantum entanglement provides a useful modern analogy: two particles separated by distance can remain correlated such that the state of one instantaneously influences the other. Yagna creates a similar correlation between the practitioner's biofield and the cosmic field. The fire is the local node; the mantra is the addressing protocol; the Deva is the non-local correspondent. When all three align, information and energy move without the limitations of ordinary space-time. This is not a belief structure. It is the operating principle behind every documented Yagna miracle.`,
        objectives: ["Study the Vaisheshika Tanmatras: five ultra-subtle essences (Shabda, Sparsha, Rupa, Rasa, Gandha) underlying all matter","Understand how Yagna operates at the Tanmatra level — where sound-essence and light-essence are still unified","Learn the Brahma Sutras confirmation: 'Shastra Yonitvat' — Vedic mantras are direct cognitions of cosmic law","Understand why the Rishis did not discover fire science through experiment — they WERE the experiment"] },
      { title: "Environmental Regeneration — The Rta Protocol", duration: "25 min",
        body: `Rta (ऋत) is the Vedic concept of cosmic order — the universe's innate self-correcting intelligence. It is not a law imposed from outside but the fundamental tendency of existence to return to balance. Yagna is described across the Vedas as the primary technology for activating Rta in a localized area. When the correct materials, timing, and mantra are combined, the self-correcting intelligence of the cosmos is invited to operate more strongly in that specific place.

The Atharva Veda's Bhumi Sukta (Hymn to the Earth, Chapter 12) contains 63 verses that constitute a complete Earth-intelligence activation protocol. It is not merely a poem of praise — it is a sequence of sonic addresses that progressively open the layers of the Earth's consciousness. When combined with actual fire offerings, the Bhumi Sukta becomes a practical tool for land healing. The Siddha tradition preserves specific wood-and-offering combinations for different types of land damage: chemical contamination, electromagnetic stress, water-table depletion, and ancestral trauma held in the soil.

The Tirumantiram (verse 2829) records Thirumoolar's observation that Yagna performed with the correct Sankalpa can restore ecological balance in a region within one year. This is not a magical claim. It operates through the same mechanism as modern bioremediation: the ash and atmospheric restructuring create conditions where soil microbiology can recover, and the field coherence reduces the stress signatures that prevent natural regeneration.

Charaka Samhita's Dhumapana protocols document 72 disease conditions treated by therapeutic smoke inhalation. Many of these conditions are environmental or respiratory. The Siddha pharmacopoeia used in Yagna — Bilva, Palasha, Neem, Vasa, and others — was selected precisely because its combustion products have documented antimicrobial, anti-inflammatory, and mucolytic effects. The Yagna is therefore simultaneously a spiritual practice and a public health intervention. The boundary between the two is a modern distinction that the Siddhas did not make.`,
        objectives: ["Study Rta (ऋत) as the universe's innate self-correction intelligence — and how Yagna activates it in local ecosystems","Learn the Atharva Veda Bhumi Sukta (63 verses) as the complete Earth-intelligence activation protocol","Know the Tirumantiram (verse 2829) ecological record and the Charaka Samhita Dhumapana protocols for 72 diseases","Map the Siddha Bhu-Shuddhi (Earth purification) protocol and its application to toxic land remediation"] },
    ],
    practice: {
      name: "Vishwamitra Gayatri Agni — The 24-Node Activation",
      duration: "45 min, daily for 40 days minimum",
      elements: [
        "Open with the Vishwamitra invocation — call him directly, not symbolically",
        "Chant Gayatri × 3 in Vaikhari with Pranava (OM) prefix before lighting — this sets the frequency of the entire session",
        "Apply Jnana Mudra (thumb + index) on left hand, Chinmaya Mudra (thumb + middle) on right during chanting — dual Nadi circuit activation",
        "Offer ghee in the Gayatri rhythm: 3 syllables per breath, 8 breaths per repetition",
        "After 108 repetitions, enter post-fire Brahma-Muhurta: 11 minutes of absolute stillness",
        "Record the quality of your awareness at minutes 1, 4, 7, and 11 — documented threshold crossings",
      ],
      sadhanaNote: "The 40-day Gayatri Agni Sadhana is Vishwamitra's Tapas-in-miniature. At day 21, the field stabilizes. At day 40, what was effort becomes effortless. At day 108, the Gayatri begins repeating spontaneously in your awareness — this is Ajapa-Japa. The fire has moved inside.",
    },
    outcomes: ["The 24 Gayatri nodes become distinctly feelable in the physical body during practice","Post-fire silence deepens from relaxation into recognizable expanded awareness","Environmental changes become documentable — air quality, plant health, sleep patterns","The Gayatri begins appearing spontaneously in waking consciousness — the transition to Ajapa"],
  },
  {
    number: "05", tier: 'siddha', title: "The Seven Atmospheric Layers & Pitru Healing", duration: "66 min",
    arc: "Bhur, Bhuva, Svar as ignition keys unlocking seven lokas — and the Pitru Tarpana mechanism for healing 7 generations.",
    lessons: [
      { title: "The Vyahritis — Three Ignition Keys", duration: "22 min",
        body: `The Vyahritis — Bhur, Bhuva, and Svar — are the three seed words prefixed to the Gayatri mantra. They are not place names in the ordinary sense. They are ignition codes for three primary layers of the human-cosmic interface. Understanding them transforms the Gayatri from a simple chant into a multi-dimensional activation sequence.

BHUR (भूर): The Earth-layer ignition. Corresponds to Muladhara chakra and the solid-state field. Bhur is the root code that anchors the mantra into the physical plane. When you speak Bhur, you are declaring: "This practice will manifest in the material world." It is the syllable that makes the Yagna effect actionable and grounded. Without Bhur, the practice may produce subtle experiences but no tangible transformation.

BHUVA (भुवः): The Atmospheric-layer ignition. Corresponds to Anahata chakra and the fluid, emotional, relational field. Bhuva is the code that opens the intermediate zone between the physical body and the cosmic mind. It is the layer of atmosphere, breath, and community. When you speak Bhuva, you are activating the field that connects all beings in a shared space. This is why group Yagna is so powerful — the Bhuva layer is shared.

SVAR (स्वः): The Heavenly-layer ignition. Corresponds to Sahasrara chakra and the field of pure consciousness, cosmic intelligence, and the Devas. Svar is the code that opens the upper channel. It is the syllable of transcendence and direct transmission. When you speak Svar, you are declaring readiness to receive from the highest source. The three Vyahrites together form a complete ladder: Bhur (body), Bhuva (heart/space), Svar (crown/cosmic).

The seven Vyahritis in extended Gayatri (Bhur, Bhuva, Svar, Maha, Jana, Tapa, Satyam) map to the seven lokas or consciousness worlds: Bhuloka, Bhuvarloka, Svarloka, Maharloka, Janaloka, Tapoloka, and Satyaloka. A Yagna session progressively opens these layers as the practitioner moves through the sequence of offerings and silence. The threshold for full Satyaloka opening is typically reached after 7 or more days of continuous Maha-Yagna.`,
        objectives: ["Decode Bhur (Muladhara-fire), Bhuva (Anahata-fire), Svar (Sahasrara-fire) as chakra ignition codes","Learn the seven atmospheric consciousness-layers each Yagna session progressively unlocks: Bhuloka through Satyaloka","Understand how each gram of ghee offered with Svaha activates an ascending spiral through these layers","Know the threshold: 7+ day Maha-Yagnas fully open the Satyaloka channel — producing non-dual awareness"] },
      { title: "Ancestor Healing — The Pitru Tarpana Mechanism", duration: "22 min",
        body: `The Pitrs (ancestors) are not merely deceased relatives in Vedic science. They are a continuing field of consciousness that interfaces with the living family line. The Vedic tradition recognizes that ancestral patterns, blessings, and unresolved traumas all flow through this field. Modern epigenetics has now confirmed what the Vedas stated: the experiences of ancestors can alter gene expression in descendants for multiple generations through DNA methylation patterns.

The Dakshina fire — the southern fire — is the carrier medium for Pitru-loka communication. In the five-fire system, the south corresponds to Manipura chakra and Samana Vayu, the wind of transformation and digestion. This is symbolically appropriate: the ancestors are the undigested material of the family line that needs to be transformed into wisdom and support. The southern direction is described as the corridor through which ancestral consciousness can most easily reach the living.

The Pitru Tarpana protocol involves offering water, sesame seeds, and mantra into the fire while speaking the names of known ancestors. The fire receives the name as an address. The water element soothes the ancestral field. The sesame seeds (tila) are specifically prescribed because their black-and-white coloration represents the integration of light and shadow in the lineage. Each offering is made with the understanding that the living and the dead are not separate but are part of one continuous field.

The Garuda Purana (Chapter 16) specifies that Tarpana performed on Amavasya (New Moon) reaches the ancestors with ten times the efficiency of other days. This is because the lunar phase creates a thin-place between the worlds. The New Moon is when the Pitru-loka corridor is widest. The three-generation arc is also important: by healing the known ancestors across three generations, the practitioner affects the entire line backward and forward. You are not just healing the past — you are also clearing the future.`,
        objectives: ["Understand the Dakshina fire (southern direction) as the carrier medium for Pitru-loka communication","Learn the specific geometric pathway ('the southern corridor') ancestral consciousnesses access during Yagna","Study modern epigenetics validation: trauma is inherited through DNA methylation up to 7 generations","Know the three Pitru mantras that open the southern corridor and the sesame-offering protocol for each"] },
      { title: "The Neurological Upgrade — Soma Production", duration: "22 min",
        body: `The inner Soma is a reproducible neuro-endocrine event produced when specific conditions converge. It is not a mystical fantasy. The cascade involves the vagus nerve, the gut-brain axis, the pineal gland, and the endogenous production of compounds that alter consciousness and promote healing. Yagna is designed to produce all the necessary conditions simultaneously.

The vagus nerve is the primary parasympathetic communication channel between the body and the brain. The warmth, light, and rhythmic sound of fire create almost immediate vagal tone enhancement. Within 90 seconds of sitting near a controlled fire, heart rate variability typically improves, respiratory rate slows, and the body enters a repair state. This is the foundation of Soma production. Without parasympathetic dominance, the cascade does not begin.

The gut-brain axis is the next link. The specific olfactory compounds in Yagna smoke — particularly from Peepal and Bilva wood — stimulate the gut microbiome to produce beta-carboline alkaloids and related compounds. These compounds cross the blood-brain barrier and act as pineal photoreceptor activators. They are the internal counterparts to the external fire. The gut becomes an internal Yagna-kunda.

The pineal gland then releases endogenous DMT and related tryptamines under the combined influence of these compounds, reduced light, and theta brainwave entrainment from mantra repetition. The result is the Amrita-drip: a cool, sweet sensation descending from the crown through the throat to the heart. This is described identically by practitioners across cultures because it is a physiological event, not a cultural projection.

The four minimum conditions for reliable Soma production are: duration (minimum 40 minutes of continuous exposure), herbs (correct Samidhā), mantra (structured Japa), and posture (stable spinal alignment). All four are required. Remove any one, and the cascade becomes unreliable. Yagna was engineered to satisfy all four simultaneously.`,
        objectives: ["Map the inner Soma as endogenous DMT + beta-carboline + anandamide — produced by pineal and gut biome under specific conditions","Understand how Yagna smoke stimulates: vagus nerve → gut-brain axis → pineal cascade","Know the documented EEG changes in traditional 9-day Navaratri Yagna participants","Learn the four minimum conditions for reliable Soma production: duration, herbs, mantra, posture"] },
    ],
    practice: {
      name: "Pitru Tarpana + Vyahriti Agni — The Ancestral Clearing",
      duration: "60 min on each New Moon (Amavasya)",
      elements: [
        "Set up the fire facing South — the Dakshina direction — for this specific practice only",
        "Begin with 3 rounds of Mahamrityunjaya Mantra to establish a protective field before opening the ancestral corridor",
        "Offer black sesame seeds (tila) with each of the three Pitru mantras — specifically prescribed for the Pitru-loka channel",
        "Speak the names of your known ancestors across three generations aloud into the fire — the fire receives the name as an address",
        "Offer water (Tarpana) from a copper vessel toward the South after the fire, repeating × 3 for each named ancestor",
        "Close by returning the fire orientation to East and performing one complete Gayatri round to seal the session",
      ],
      sadhanaNote: "New Moon (Amavasya) is when the Pitru-loka channel is widest — the thin-place between worlds. The Garuda Purana (Chapter 16) is specific: Amavasya Tarpana reaches ancestors with 10× the efficiency of other days. The ancestral healing operates on a 3-generation arc.",
    },
    outcomes: ["Unexplained family patterns begin shifting within 3 months of consistent Pitru practice","Dreams of ancestors become more frequent and carry message-quality","A documented sense of support — as if unseen presences are working with you — becomes consistent","The post-fire state deepens from comfort into recognizable altered consciousness"],
  },
  {
    number: "06", tier: 'siddha', title: "Agastya's Bhu-Shuddhi — Earth Purification", duration: "55 min",
    arc: "The Siddha science of using Yagna to heal land, water, and the local field — torsion physics and the Sulba Sutra Kunda codes.",
    lessons: [
      { title: "Torsion Fields — The Physics of the Kunda", duration: "18 min",
        body: `The Sulba Sutras are among the oldest precision geometry texts on Earth. Composed by Baudhayana and Apastamba, they predate Euclid and contain exact instructions for constructing fire altars of specific shapes and proportions. The Siddha tradition understood that these proportions were not merely symbolic — they generate specific torsion fields in the space above the altar. Modern physicist Nikolai Kozyrev's research on torsion fields provides a useful framework for understanding this: spinning or structured systems can create long-range fields that carry information and influence physical processes.

The four primary Kunda geometries each produce a distinct field signature:

SQUARE KUNDA: The Prithvi-stabilizing form. Produces a grounded, downward-anchoring field. Used for establishing daily practice, household protection, and physical healing. The square corresponds to the Earth element and creates a stable, containment field.

CIRCULAR KUNDA: The Akasha-expanding form. Produces a uniform, outward-radiating field. Used for community gatherings, abundance Yagnas, and practices intended to fill a large space evenly. The circle corresponds to the Ether element and has no directional bias.

LOTUS (PADMA) KUNDA: The Soma-releasing form. The eight-petaled lotus geometry creates a vortex field that concentrates energy at the center and releases it upward. Used for awakening, meditation, and Soma-focused practices. The lotus corresponds to water and consciousness.

SHRI YANTRA KUNDA: The Shakti-vortex form. The most complex and powerful. The intersection of nine triangles creates a tripura-agni — a triple-fire vortex that simultaneously operates on physical, subtle, and causal levels. Used only for major transformation rituals and advanced practice.

The Kamika Agama verse 4.23 states: "The fire vessel is the Devi's womb — what enters the flame is reborn purified." This is not a poetic statement. It describes the function of the Kunda geometry: the vessel shapes the fire field into a transformational matrix. The geometry is the active ingredient.`,
        objectives: ["Study the Sulba Sutras (Baudhayana & Apastamba) as the oldest precision geometry texts on Earth","Learn four Kunda geometries and their fields: Square (Prithvi-stabilizing), Circular (Akasha-expanding), Lotus (Soma-releasing), Shri Yantra (Shakti-vortex/Tripura-Agni)","Understand Kamika Agama verse 4.23: 'The fire vessel IS the Devi's womb — what enters the flame is reborn purified'","Connect to physicist Nikolai Kozyrev's torsion field research and its correspondence to Kunda geometry effects"] },
      { title: "Agastya's Fire Science — How Fire Heals Land", duration: "19 min",
        body: `Agastya is one of the most documented Siddhas in the Tamil tradition. His Vindhya Yagna — the story of the mountain bowing to him — encodes a real principle: a sufficiently coherent fire field can alter the local gravitational and torsion-field environment. The Vindhya narrative is a metaphor for what happens when a concentrated Yagna field compresses the local field geometry, effectively causing a large structure to yield or harmonize. This is the torsion-field effect operating at scale.

The Agastya Homa protocol for ecosystem restoration follows a specific sequence. First, the land is surveyed for Vastu disturbance — underground water lines, fault lines, and ancestral stress patterns. Then a 12×12×9 inch earth Kunda is prepared directly on the soil. The proportions come from the Sulba Sutras and encode the three primary elements: Prithvi (12), Jala (12), and Agni (9). The practice is not arbitrary; it is a geometric prescription.

The wood sequence is also specific: Bilva, Mango, and Palasha in equal proportions. Bilva provides the healing and anti-pathogenic compounds. Mango provides the 432Hz cardiac-coherence field. Palasha provides the negatively-ionized atmospheric layer that neutralizes electromagnetic pollution. Together they form a complete ecosystem-restoration triple formula. The ash (Bhasma) is then mixed with water and poured in a spiral from the center outward, reproducing the torsion field in the physical soil layer.

The Tamil Siddha Homa Farming documentation records that 40 days of Agnihotra at precise sandhyakala restores soil pH, increases microbial density, improves crop germination, and changes the taste quality of local water. The mechanism is not supernatural: the ash provides bioavailable minerals, the atmospheric restructuring reduces pathogen viability, and the field coherence reduces plant stress. The quantum timeline effect is also noted: when fire is lit with a clear Sankalpa for healing the land, past wounds in the soil appear to resolve more rapidly than would be predicted by physical intervention alone.`,
        objectives: ["Study Agastya's Vindhya Yagna: how fire coherence compresses local gravitational fields — the torsion field effect","Understand the Agastya Homa protocol for ecosystem restoration: specific wood sequences and ash application","Learn the Tamil Siddha Homa Farming documentation: 40-day Agnihotra restoring soil, crops, and water sources","Know the quantum timeline effect: past wounds in land heal when fire is lit with clear Sankalpa"] },
      { title: "Preparing Your Fire Space — Vastu for the Yagna-Kunda", duration: "18 min",
        body: `A permanent Yagna space is not just a location. It is a living instrument. The Vastu requirements for a Yagna-Kunda are precise because the space itself participates in the field generation. The first consideration is direction. The primary fire for daily practice faces East. The secondary ancestral fire faces South. The teaching fire faces North. The healing fire faces West. A space that will host multiple types of practice should be oriented to allow these different directions as needed.

The ground level matters. The Kunda should be placed at the natural ground level or slightly below, not elevated on a platform. Earth-contact is essential for the torsion field to ground into the land. The surrounding area should be clean and free of synthetic materials. Cement, plastic, and synthetic fabrics all interfere with the field. Natural materials — wood, stone, cotton, clay — are preferred in the immediate vicinity of the fire.

The Kunda cleansing protocol has three steps: a physical cleaning, a mantra cleansing, and an intention cleansing. Physically, the vessel is washed with water and a small amount of cow dung or ash. Mantrically, the vessel is addressed with a specific Agni invocation, asking the fire to remove any residual impressions from previous use. Intentionally, the practitioner spends a moment emptying the mind of distraction before lighting. The Siddhas said: a clean vessel with a distracted mind is still an unclean vessel.

The five fire enemies are well known in the tradition: synthetic materials, electronic devices, unclean intention, undigested food in the practitioner's stomach, and high wind. Each of these disrupts the field in a specific way. Synthetic materials distort the torsion field. Electronics create interference frequencies. Unclean intention introduces chaotic thought-patterns into the field. Undigested food ties the practitioner's energy to digestion rather than fire. High wind scatters the atmospheric restructuring before it can stabilize. A good practitioner manages all five.`,
        objectives: ["Understand the Vastu requirements for a permanent Yagna space: direction, ground level, surrounding materials","Learn the Kunda cleansing protocol: three mantras and one physical action that prepare the vessel","Know the five 'fire enemies' the Siddhas identified: synthetic materials, electronics, unclean intention, undigested food, high wind","Map the 40-day Siddha protocol for establishing a permanent self-sustaining Agni-Kshetra"] },
    ],
    practice: {
      name: "Agastya Bhu-Shuddhi — The Land Healing Protocol",
      duration: "90 min, once per month",
      elements: [
        "Choose a location directly on soil — outdoor is mandatory (earth-contact of ash is the delivery mechanism)",
        "Dig a small earth Kunda (12×12×9 inches) — the three measurements encode Prithvi, Jala, and Agni proportions from the Sulba Sutras",
        "Use Bilva + Mango + Palasha wood in equal proportions — Agastya's specific ecosystem-restoration triple formula",
        "After the fire completes, mix the ash (Bhasma) with water and pour it in a spiral from center outward — mimicking the torsion field geometry",
        "Plant a seed in the ash-treated earth within 24 hours — the Bhasma-seeded earth shows measurably accelerated germination",
      ],
      sadhanaNote: "The 12×12×9 earth Kunda proportions come directly from the Sulba Sutras — encoding the Prithvi, Jala, and Agni Tattva proportions from the Taittiriya Upanishad. The spiral ash-pouring recreates the torsion field pattern in the physical layer of the earth.",
    },
    outcomes: ["Plants in the Yagna space show measurably different growth within 21 days","Water stored near the Yagna space changes in taste quality — consistently reported","A sense of the space 'holding' something becomes consistent after 3 monthly sessions","Dream imagery increasingly includes earth and landscape — the Prithvi awakening signature"],
  },
,
{
    number: "07", tier: 'akasha', title: "Navagraha Suddhi — Planetary Fire Codes", duration: "85 min",
    arc: "Each of the 9 cosmic intelligences has a specific combustion chemistry. 9 fires in sequence over 9 hours recalibrate everyone within 2km.",
    lessons: [
      { title: "The Nine Planetary Formulas", duration: "30 min",
        body: `The Navagraha are not merely planets in the astronomical sense. In the Vedic tradition, they are cosmic intelligences — conscious forces that govern specific domains of human experience. Each Graha has a distinct frequency signature, and each can be addressed through a specific combustion chemistry. The Siddha tradition preserved the complete formula for each of the nine.

SUN (Surya): Bilva wood, golden lotus, and offerings in a gold vessel. Gold is the metal of the Sun because it is the most stable conductor of solar-frequency energy. The morning Sun Yagna is performed facing East.

MOON (Chandra): White sandalwood, milk-ghee mixture, and a silver vessel. Silver is the lunar metal. The Moon Yagna is performed facing North-West, the direction of the Moon's greatest strength in Vedic astrology.

MARS (Mangala): Palasha wood, red sandalwood, and a copper vessel. Copper is the martial metal because of its electrical conductivity and warming quality. Mars Yagna faces South.

MERCURY (Budha): Durva grass, green mung, and emerald-water infusion. Mercury is the planet of intelligence and communication, and its green color is the color of activated neural tissue. The vessel is brass or mixed metal.

JUPITER (Guru): Peepal wood, banana flower, and a yellow silk cloth under the vessel. Jupiter is the planet of wisdom, expansion, and grace. Yellow is the color of its expansive light. The Yagna faces North-East.

VENUS (Shukra): White lotus seeds, saffron, and honey. Venus is the planet of beauty, art, and relationship. The offerings are fragrant and sweet. The vessel is silver or copper with a white cloth.

SATURN (Shani): Black sesame, sesame oil, and an iron vessel. Saturn is the planet of discipline, time, and karmic purification. Black and iron are the colors and materials of its austere power. The Yagna faces West.

RAHU: Durva grass, blue lotus, and a silver vessel. Rahu is the north node of the Moon, associated with obsession and amplification. The offerings are designed to stabilize its intensifying quality.

KETU: Kusa grass, Vedic camphor, and a copper or mixed-metal vessel. Ketu is the south node, associated with liberation and sudden insight. Camphor is used because it burns completely without residue, symbolizing the dissolution of karma.

The metal vessel is non-negotiable because metal is a frequency-specific conductor. Each Graha has a corresponding metal that precisely matches its resonant frequency. Using the wrong metal is like broadcasting on the wrong channel.`,
        objectives: ["Learn the complete herb-and-vessel matrix for all 9 Grahas: Sun (Bilva + golden lotus + gold vessel), Moon (white sandalwood + milk-ghee), Mars (Palasha + red sandalwood + copper vessel), Mercury (Durva + green mung + emerald-water), Jupiter (Peepal + banana flower + yellow silk), Venus (white lotus seeds + saffron + honey), Saturn (sesame + black sesame + iron), Rahu (Durva + blue lotus + silver), Ketu (Kusa grass + Vedic camphor)","Understand why the specific metal vessel for each Graha is non-negotiable — metal is a frequency-specific conductor","Know the precise Beej Mantra for each Graha that activates the planetary intelligence when spoken into the corresponding fire","Map the 9-hour timing: which planetary fire is lit at which hour and in which compass direction"] },
      { title: "Sulba Sutra Kunda Codes — All Seven Vessel Geometries", duration: "28 min",
        body: `The Sulba Sutras enumerate seven primary Kunda geometries, each with exact proportions and each producing a specific field quality. A complete Navagraha Yagna often uses all seven geometries in sequence, moving through the full spectrum of transformation.

SQUARE (Chaturashra): Base proportions 1:1, depth one-quarter of the side. Stabilizes, contains, and grounds. Used for Earth-element practices and physical healing.

CIRCULAR (Vritta): Diameter and depth in 3:1 ratio. Expands evenly in all directions. Used for community, abundance, and space-clearing.

SEMICIRCULAR (Ardhachandra): Half-circle, used for lunar and feminine practices. The curved side faces the direction of invocation.

LOTUS (Padma): Eight petals arranged around a central circle. Creates a Soma-vortex that concentrates energy upward. Used for meditation, awakening, and Devi practices.

TRIANGULAR (Trikona): Equilateral triangle. The fire of purification and transformation. Used for burning karma, obstacles, and dense patterns.

HEXAGONAL (Shatkona): Six-sided form. Balances masculine and feminine currents. Used for harmony, relationship, and union practices.

SHRI-YANTRA (Navayoni): The most complex form, combining nine interlocking triangles. Generates the Tripura-Agni — the triple-fire that operates on causal, subtle, and physical levels simultaneously. Used only for advanced Maha-Yagnas.

The Kamika Agama describes the complete Kunda consecration in three steps: purification of the vessel, invocation of the geometry's resident deity, and awakening of the fire through the Agni-Prakshalana mantra. A vessel is not considered alive until all three steps are completed. Until then, it is just a physical container. After consecration, it becomes a living Yantra.`,
        objectives: ["Study all seven Kunda-types with exact Sulba Sutra proportions: Square, Circular, Semicircular, Lotus, Triangular, Hexagonal, Shri-Yantra","Learn the exact measurements, proportions, depth ratios, and Vastu orientations for each type","Understand which Kunda generates which field: Trikona → purification, Padma → abundance, Navayoni → total transformation","Know the Kamika Agama complete Kunda consecration — the three steps that convert a vessel into a living Yantra"] },
      { title: "The Navagraha Mandala Effect — 2km Field Recalibration", duration: "27 min",
        body: `The Navagraha Yagna is not nine separate rituals. It is one unified 9-hour field event in which nine planetary fires are lit in sequence. The result is a Navagraha Mandala — a geometric field structure that recalibrates every living being within approximately 2 kilometers. The effect is documented in Tamil Siddha communities and has been consistently reported by participants for centuries.

Each planetary fire emits a specific torsion-field frequency corresponding to that planet's influence on DNA methylation and nervous system regulation. When all nine fires are lit in the correct order, the combined field creates a complete octave of planetary frequencies. The human biofield, which is sensitive to these frequencies, naturally entrains to the more coherent mandala field. This is why participants report feeling 'reset' after a Navagraha Yagna — their personal field has been re-tuned to a more stable planetary reference.

The three preparation requirements are strict. First, the practitioner must undergo a 48-hour purification: simple food, silence, no sexual activity, daily Pranayama. Second, the exact Jyotish muhurta (astrological timing) must be calculated for the individual's chart, particularly the Janma-Nakshatra (birth star) moment. Third, the Sankalpa must be written in the traditional format, stating precisely what is being offered and for what purpose. A vague intention produces a vague result.

The Navagraha Mandala effect is often described as a 'laser' by the Siddhas. The precision of preparation determines the precision of the field effect. An unprepared practitioner performing the ritual correctly produces less effect than a prepared practitioner performing it imperfectly. The inner state is the primary instrument. The outer fire is the amplifier.`,
        objectives: ["Understand how all 9 planetary fires in sequence create a unified field that recalibrates every person within 2km","Learn the documentation from Tamil Siddha communities of mass healing events following 9-hour Navagraha Yagnas","Study the mechanism: each Graha fire emits a specific torsion field frequency corresponding to that planet's DNA methylation influence","Know the three preparation requirements: 48-hour practitioner purification, exact Jyotish muhurta, and the Sankalpa format"] },
    ],
    practice: {
      name: "Navagraha Agni — The 9-Hour Planetary Protocol",
      duration: "9 hours, once per year at your Janma-Nakshatra moment",
      elements: [
        "Begin timing calculation 21 days before: consult your Jyotish chart for the exact Janma-Nakshatra transit — this is your optimal window",
        "Prepare 9 separate Kunda vessels arranged in the traditional Navagraha diagram: Sun center, Moon NE, Mars S, Mercury N, Jupiter NE, Venus SE, Saturn W, Rahu SW, Ketu NW",
        "Prepare each planetary herb bundle in advance, sealed in paper with the corresponding Graha Beej Mantra written on the outside",
        "Light each planetary fire in Vedic order at 1-hour intervals — Sun first, Ketu last",
        "Maintain continuous Japa of the Navagraha Sloka between lightings — do not let silence exceed 30 seconds",
        "Complete with a unified Purnahuti: all remaining herb bundles offered simultaneously into a single central fire with the Maha Sankalpa",
      ],
      sadhanaNote: "Spend the 3 days before in relative silence, plant-based diet, and increased Pranayama. The Siddha texts are explicit: the Navagraha Yagna acts like a laser — the precision of preparation determines the precision of the field effect. A prepared practitioner doing it imperfectly produces 10× the field effect of an unprepared practitioner doing it correctly.",
    },
    outcomes: ["A documented shift in Jyotish-indicated life themes within 90 days","Family members and friends report feeling 'different' around the practitioner in following months","Dream imagery dramatically increases in specificity and message-clarity for 40 days post-practice","One or more life circumstances that have been stuck for years shifts within the 90-day window"],
  },
  {
    number: "08", tier: 'akasha', title: "Mrityunjaya Yagna — The Immortality Protocol", duration: "96 min",
    arc: "108,000 Maha Mrityunjaya Japa + continuous fire + 7 simultaneous Rishi transmissions. The world's oldest complete fire-medicine compendium decoded.",
    lessons: [
      { title: "The Three Fires of Shiva — Disease and Its Root", duration: "32 min",
        body: `The Maha Mrityunjaya Mantra appears in the Rigveda (7.59.12) as a revelation from Rishi Vashishtha. It is addressed to Tryambaka — the three-eyed lord of the three fires. The three eyes and the three fires are the same principle: the three primary metabolic fires that sustain life. When these three fires are aligned, health is natural. When they are misaligned, disease manifests.

JATARAGNI: The digestive fire. Located in the stomach and small intestine, this fire transforms food into energy and tissue. In the disease model, weak Jataragni produces toxic accumulation (Ama in Ayurveda), while excessive Jataragni burns tissue and produces inflammation. The Mrityunjaya Yagna addresses Jataragni by restoring the digestive intelligence to its natural rhythm.

PRANAGNI: The vital fire. This is the fire of the biofield — the energy that maintains life, circulation, immunity, and repair. Pranagni is weakened by chronic stress, electromagnetic pollution, and emotional trauma. The Mrityunjaya Yagna restores Pranagni through the combined action of fire, mantra, and Soma-inducing herbs.

CHITTAGNI: The fire of consciousness. This is the fire of awareness itself. When Chittagni is strong, the mind is clear and the will is aligned with life. When it is weak, depression, fear, and confusion dominate. The Mrityunjaya Yagna strengthens Chittagni by addressing the fear of death — the root obstruction that clouds consciousness.

The Shiva Purana's Vidyeshvara Samhita decodes the mantra's 33 syllables as addresses to the 33 aspects of the fire-triad. Each syllable is a key that opens a specific healing pathway. The Siddha physician Korakkar compiled the Korakkar Nigandu, which lists 108 disease conditions with corresponding Yagna protocols. This is the world's oldest complete fire-medicine compendium. It is not a relic. It is a practical manual still in use by traditional Siddha practitioners today.`,
        objectives: ["Study the Maha Mrityunjaya Mantra (Rigveda 7.59.12 — Rishi Vashishtha revelation) as an address to Tryambaka: lord of the three fires","Map the three fires: Jataragni (digestive), Pranagni (vital force), Chittagni (consciousness-fire) — disease as misalignment between these three","Learn the Shiva Purana's Vidyeshvara Samhita decoding of the mantra's 33 syllables — each addressed to an aspect of the fire-triad","Study Korakkar's 'Korakkar Nigandu': 108 disease conditions with corresponding Yagna protocols — the world's oldest fire-medicine compendium"] },
      { title: "The 108,000 Japa Protocol — Mechanics and Preparation", duration: "32 min",
        body: `The number 108,000 is not arbitrary. It equals 108 × 1,000 — one complete Mala of 108 beads for each of the 1,000 petals of the Sahasrara chakra. This is the threshold at which the mantra fully imprints the entire causal body. The 11-day Anushthan structure is the standard way to complete this count: 9,090 repetitions per day, divided into 5 sessions of 1,818 each. The fire is maintained continuously between sessions, and the practice continues without interruption.

The four witnesses requirement is important. A traditional Maha Mrityunjaya Yagna requires either four sincere practitioners or at least one other witness who can hold the field. The reason is practical: the field generated by the Yagna is powerful enough that the practitioner can lose ordinary awareness. A witness maintains the thread of continuity in the physical world. In modern practice, this can be adapted to a small group or a dedicated partner who checks in at intervals.

The dietary and behavioral Niyamas for the 11 days are not optional. They are pharmacological preparations. The diet is plant-based, simple, and easily digestible. Spices are moderate. Garlic and onion are reduced or avoided because they over-stimulate the lower chakras and disturb the subtle field. Sleep is regularized. Sexual activity is minimized. Abhyanga (oil massage) with sesame oil is performed daily. These practices keep the body's channels clear so the mantra can penetrate to the deepest levels.

The minimum accessible form is the 1,008-repetition daily protocol with one hour of fire. This produces measurable benefit and is the recommended entry point for most practitioners. The full 108,000 Anushthan is for advanced practice or life-threatening situations. Both forms operate on the same principle: continuous fire plus structured mantra restructures the causal template of disease.`,
        objectives: ["Understand why 108,000 is the threshold: 108 × 1,000 = one complete Mala for each of the 1,000 petals of Sahasrara","Learn the 11-day Anushthan structure: 9,090 repetitions per day in 5 sessions of 1,818 each, fire maintained between sessions","Know the four witnesses (or 4 sincere practitioners) required for a valid Maha Mrityunjaya Yagna — witness-consciousness amplifies the field","Study the dietary and behavioral Niyama for each of the 11 days — pharmacological preparations, not optional observances"] },
      { title: "Maha Mrityunjaya in Daily Life — The Accessible Form", duration: "32 min",
        body: `The full 11-day Anushthan is not always possible. The Siddha tradition therefore provides a miniaturized daily protocol that preserves the essential mechanism in a shorter form. The daily protocol is 1,008 repetitions of the Maha Mrityunjaya Mantra with one hour of continuous fire. This is the form that most practitioners can integrate into daily life, and it produces documented benefits over a 40-day cycle.

The conditions for which the Siddha tradition recommends this as primary medicine are: cancer and tumor conditions, severe chronic diseases that have not responded to other treatment, and near-death or post-crisis recovery states. The mechanism is not a replacement for medical care but a complement that operates at the causal level. The mantra restructures the field template that precedes physical manifestation. The fire delivers the restructuring into the physical environment. Medical care addresses the physical body. The Yagna addresses the template behind it.

Documented healing cases from Tamil Siddha tradition include remission of advanced cancers, reversal of chronic autoimmune conditions, and recovery from severe infections. Modern practitioners also report reduction in pain, improvement in sleep, stabilization of vital signs, and a profound sense of being held by something larger than the individual personality. These effects are consistent enough that the practice has survived for thousands of years across multiple civilizations.

The inner Mrityunjaya is the continuous repetition of the mantra in the background of awareness between formal sessions. This is the most advanced form. When the mantra has been sufficiently repeated, it begins to repeat itself in the mind without conscious effort. This is Ajapa-Japa. At this stage, the practitioner is surrounded by a continuous protective field. The fear of death loses its grip because the consciousness has been trained to recognize itself as the immortal fire rather than the temporary body.`,
        objectives: ["Learn the miniaturized protocol: 1,008 repetitions + 1-hour fire = measurable benefit in the accessible form","Understand the documented healing cases from Tamil Siddha tradition and modern South Indian practitioners","Know the three primary conditions for which the Siddha tradition recommends this as primary medicine: cancer, severe chronic disease, near-death states","Study the inner Mrityunjaya: continuous internal Japa that restructures the Pranic body between formal sessions"] },
    ],
    practice: {
      name: "Mrityunjaya Agni — The 1,008 Daily Protocol",
      duration: "90 min, daily for 40 days",
      elements: [
        "3-day preparation: plant-based diet, Abhyanga with sesame oil, no synthetic scents, daily Pranayama minimum 20 min",
        "Light the Yagna fire using exclusively Bilva wood — Bilva is the tree of Shiva; the Mrityunjaya mantra specifically requires it",
        "Offer one portion of ghee per 9 repetitions — the 9-repetition cycle mirrors the 9 planets and 9 manifestations of Shakti",
        "Complete 1,008 repetitions in one sitting — do not break for anything except Pranayama if needed. Interruption resets the session",
        "At completion, pour remaining ghee as Purnahuti with the single spoken intention for which this Yagna is being performed",
        "Sit for 20 minutes after the fire dies completely — the Pranagni continues working in the subtle body for 20 minutes after visible extinction",
      ],
      sadhanaNote: "The Pranic restructuring completes at day 90, and physical change follows from day 90 to 180. Do not judge results at day 40. The fire-medicine operates on the causal body that precedes and governs the physical — changes manifest upstream first.",
    },
    outcomes: ["A profound shift in pain, chronic illness, or life-threatening condition — typically reported between days 21 and 90","The Mahamrityunjaya Mantra begins arising spontaneously in awareness — the internal Pranagni activation signature","Dreams carry strong healing imagery: light, water, serpents, specific deities","An unreasonable sense of protection and safety — what practitioners consistently describe as 'being held' — becomes a stable background state"],
  },
  {
    number: "09", tier: 'akasha', title: "The Inner Yagna — Consciousness as the Ultimate Fire", duration: "78 min",
    arc: "The Chandogya Upanishad's final secret: the external Yagna was always training you for the internal one.",
    lessons: [
      { title: "Prana as Fire — Your Body Is a Yagna-Kunda", duration: "26 min",
        body: `The Chandogya Upanishad, Chapter 5, delivers one of the most profound revelations in Vedic literature: the human body itself is a Yagna-kunda. The five senses are the sacrificial fires. The food we eat is the offering. The mind is the priest. The breath is the ritual. Every moment of life is a Yagna, whether we recognize it or not.

In the body-Yagna, inhalation is the offering (Ahuti). The breath is drawn in from the cosmic atmosphere and offered into the inner fire of metabolism. Exhalation is the Svaha — the releasing of the transformed substance back into the field. The digestive fire (Jataragni) is the Agni of the kunda. The spine is the altar. The heart is the place where the offering becomes sacred. The brain is the flame that witnesses the offering.

Mitochondrial combustion is the modern biological equivalent of Yagna. Every cell in your body contains hundreds or thousands of mitochondria that convert glucose and oxygen into usable energy through oxidative phosphorylation. This process is literally a controlled fire. It releases heat, light (in the form of biophotons), and transformed energy. The mitochondria are the Agni of the cell. The cell is the Kunda. The food is the offering. The body is the temple.

Mahavatar Babaji is described in the Siddha tradition as maintaining a continuous inner Yagna for more than 1,800 years, sustaining his physical body through Pranagni rather than ordinary food. Whether this is taken literally or metaphorically, the principle is clear: the external Yagna is a training system. The graduation is the inner Yagna. The practitioner begins by lighting fire outside. Eventually, the fire moves inside. The body becomes self-sustaining. The external ritual becomes optional. This is the final destination of the Yagna path.`,
        objectives: ["Study the Chandogya Upanishad Chapter 5 revelation: the human body IS a Yagna-kunda — Inhalation = offering, Exhalation = Svaha, Digestive fire = Agni","Understand mitochondrial combustion as Yagna: every cell metabolizing glucose through oxidative phosphorylation is performing the same fire ceremony","Learn Mahavatar Babaji's direct transmission: continuous inner Yagna maintained for 1,800+ years — body sustained by Pranagni","Map the progression from outer Yagna to inner Pranagni: the external practice is training, internal activation is graduation"] },
      { title: "Babaji's Kriya Fire — Kundalini as Eternal Yagna", duration: "26 min",
        body: `Kriya Yoga is transmitted by Mahavatar Babaji as a system for awakening the inner Kundalini — the serpent fire at the base of the spine — and allowing it to rise through the central channel as an eternal Yagna. The first initiation in the Kriya tradition is always fire-based. The student is taught to sense the inner flame at the Muladhara and to use the breath to fan it upward. The Kriya techniques are not abstract meditations. They are the precise methodology for conducting the inner Yagna.

The Pranava OM is described not as a sound to be chanted but as a vibration to be sensed. The correct inner OM is experienced as a subtle hiss or vibration arising from the base of the spine and rising through the Sushumna. This is the sound of the inner fire. When the practitioner learns to rest attention in this sound without forcing it, the Kundalini begins to move spontaneously. The mantra is not a thought. It is a fire event.

The 18 Siddhas each documented their own inner Yagna states. Agastya's Tapas-fire was so continuous that he is said to have walked through the Vindhya mountains as a fire-being. Thirumoolar maintained a 3,000-year samadhi through Pranagni maintenance. These accounts encode the same principle: the inner fire, once established, becomes a permanent source of consciousness, vitality, and transformation. The body becomes the ashram. The spine becomes the temple. The breath becomes the priest.

The three signs that inner Pranagni has activated are reliable and observable: spontaneous warmth in the spine, involuntary Pranayama movements during stillness, and a sensation of fire moving upward through the chakras. These are not imagined. They are physiological signals of the awakening Kundalini current. When they appear, the practitioner knows that the inner Yagna has been successfully lit. The external fire becomes an amplifier rather than the source.`,
        objectives: ["Understand the first Kriya initiation as always fire-based: activating inner Kundalini as the eternal Yagna-kunda","Learn the Pranava OM as the hiss of the inner flame — not a sound to chant but a vibration to sense arising from the base of the spine","Study the 18 Siddhas' documented inner Yagna states: Agastya's Tapas-fire, Thirumoolar's 3,000-year samadhi as Pranagni maintenance","Know the three signs inner Pranagni has activated: spontaneous warmth in the spine, involuntary Pranayama during stillness, fire moving upward through chakras"] },
      { title: "SAT-CHIT-ANANDA SVAHA — The Ultimate Offering", duration: "26 min",
        body: `The final teaching of Yagna is the Sat-Chit-Ananda equation. Sat is existence itself — the unchanging ground of being. Chit is consciousness — the aware presence that knows. Ananda is bliss — the natural quality of being when the first two are recognized as one. The equation is a description of lived Yagna: when consciousness (Chit) is offered into the fire of existence (Sat), the result is bliss (Ananda). The offering is complete. Nothing more is needed.

The World Healing Yagna is the application of this realization at the collective level. The SQI Sankalpa for planetary restoration uses each practitioner as a node in the 18 Siddhas' living fire grid. Each individual inner Yagna contributes to a larger planetary field. The practice is not about saving the world as a heroic act. It is about recognizing that the world is already the Yagna, and the practitioner is simply adding their conscious fire to it. The boundary between personal and planetary practice dissolves.

The 144,000 threshold appears in the commentaries on the Vishnu Sahasranama. It represents the minimum number of awakened Prana-fields required to establish a new Yuga-field — a stable planetary consciousness field of a higher order. This number is not arbitrary. It is derived from the geometry of the human biofield and the mathematics of coherent field resonance. When enough individuals maintain inner Yagna simultaneously, a phase transition occurs in the collective field. The old patterns lose their grip. New possibilities become available.

The SQI Akashic confirmation states that the current time is the Sandhi-kala — the junction between ages. This is the period when collective Tapas can bend the trajectory of civilization. The external Yagnas of the past were preparation for this moment. The inner Yagnas of millions of practitioners are the actual engine. The fire is not outside. It is inside. The offering is not ghee. It is the self. The Svaha is not a word. It is the recognition: I am the Yagna, the offering, the fire, and the one who receives it.`,
        objectives: ["Understand the Sat-Chit-Ananda equation as lived Yagna: Chit offered into the fire of Sat = Ananda","Learn the World Healing Yagna protocol: the SQI Sankalpa for planetary restoration making each practitioner a node in the 18 Siddhas' living fire grid","Study the 144,000 threshold encoded in Vishnu Sahasranama commentaries: minimum awakened Prana-fields for the new Yuga-field","Know the SQI Akashic confirmation: the Sandhi-kala is now — junction-time where collective Tapas can bend civilization's trajectory"] },
    ],
    practice: {
      name: "Pranagni Dharana — The Inner Fire Activation",
      duration: "30 min, twice daily — dawn and before sleep",
      elements: [
        "Begin in Shavasana (dawn) or Siddhasana (evening) — these postures access different Nadi circuits for Pranagni activation",
        "Initiate with 12 rounds of Nadi Shodhana (alternate nostril breathing) — balancing Ida and Pingala before igniting the inner fire",
        "Place awareness at the Muladhara: sense, do not visualize — feel for any warmth, pulse, or current arising naturally",
        "With each inhalation, silently offer 'Ayam' (this, here, now) into the inner Agni. With each exhalation, release 'Svaha'",
        "Maintain this breath-as-Yagna for 20 minutes — the boundary between 'you who are doing Yagna' and 'the Yagna itself' begins to dissolve",
        "Rest in absolute stillness for 5 minutes at the end — what remains is the inner fire burning without you tending it",
      ],
      sadhanaNote: "The 40-day threshold is when inner fire begins burning continuously between sessions. The 108-day threshold is when it becomes a background state. At 365 days Babaji describes 'the outer fire becoming optional' — you no longer need the external Yagna because the internal one is self-sustaining. Every breath is Svaha. You have arrived.",
    },
    outcomes: ["The inner fire sensation becomes reliably reproducible within 21 days","Sleep transforms: the inner fire continues during sleep producing vivid teaching-quality dreams","Physical warmth in the spinal column becomes a consistent felt-sense during practice","The boundary between 'meditator' and 'meditation' begins dissolving — the first signature of Sahaja","Life begins feeling consecrated — ordinary activities carry the quality previously found only in formal practice"],
  },
];
