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
        "Journal three observations: room-quality, dream quality next morning, one synchronicity within 24 hours",
      ],
      sadhanaNote: "21 consecutive days establishes a standing Agni-Kshetra in your home — a permanent field-signature the Siddha texts call Griha-Shakti. By day 14 the space begins charging itself between sessions. By day 21, visitors ask what changed in your home without prompting.",
    },
    outcomes: ["Sleep quality improves measurably within 14 days — deeper delta wave access","A palpable Shakti field develops in your home that sustains between fire sessions","The Soma-drip experience becomes recognizable during extended post-fire sitting","Mantra chanting during Yagna begins to feel effortless and self-perpetuating"],
  },
  {
    number: "03", tier: 'prana', title: "Mantra Mechanics — Cymatics in the Fire", duration: "58 min",
    arc: "Why Sanskrit syllables are not prayers but physics — operating at four simultaneous levels when spoken into flame.",
    lessons: [
      { title: "Nada Brahman — Sound as the First Emanation", duration: "18 min",
        body: `The Siddha tradition teaches Nada Brahman — sound is the first emanation of consciousness. Not light. Not matter. Sound. Before anything exists in form, it exists as vibration — as Nada. The entire manifest universe is the Nada of Brahman vibrating at different frequencies.

The Vaisheshika Darshana — one of the six orthodox systems of Vedic philosophy — describes Shabda (sound) as a Tanmatra: an ultra-subtle essence that underlies all matter. Sound-essence is more fundamental than the physical sound we hear. When a Sanskrit Bija (seed) mantra is spoken, what the ear hears is Vaikhari — the outermost, grossest layer. Beneath it operate three more layers simultaneously:

VAIKHARI: Audible sound. Physical compression waves in air. This is what microphones record and ears hear. It is the least powerful layer of the mantra.

MADHYAMA: Mental sound. The sound that exists in the mind before it is spoken — the intention, the formation, the meaning. When you mentally recite a mantra, you are working at the Madhyama level.

PASHYANTI: Causal sound. The sound-form that exists at the level where individual mind and universal mind begin to merge. This level cannot be produced by ordinary recitation — it arises spontaneously after extended practice.

PARA: Transcendent sound-source. The unmanifest potential from which all sounds arise. The primordial AUM — not the syllable, but the vibrating silence from which all syllables emerge.

When you speak a mantra into fire and complete it with "Svaha" — the offering word — the Kamika Agama describes what happens: Agni becomes Vaisvanara (the universal cosmic fire) and all four layers of the sound travel together into the Akasha. Not through space — through a field-collapse. The Deva-consciousness addressed by the mantra and the practitioner's consciousness touch directly.

The word Svaha itself: "Su" (well, auspiciously) + "Aha" (thus spoken, thus it is). It is the completion-word that closes the loop between offering, fire, and recipient. Without Svaha, the mantra floats unanchored. With Svaha, it arrives.`,
        objectives: ["Understand the four levels of Vedic sound: Vaikhari (audible), Madhyama (mental), Pashyanti (causal), Para (transcendent source)","Learn how 'Svaha' sends all four levels simultaneously into the Akasha","Know why the Kamika Agama describes Agni becoming Vaisvanara — the universal mouth","Understand why space contracts during Yagna rather than the offering traveling through space"] },
      { title: "Timing — Why Sunrise and Sunset Are Non-Negotiable", duration: "20 min",
        body: `The Agnihotra is performed twice daily — at the exact second of sunrise and the exact second of sunset. Not within 10 minutes. Not "around" the time. The exact second. This precision seems extreme until you understand what is happening at those moments.

THE IONOSPHERIC THINNING: The Earth is surrounded by the ionosphere — a layer of electrically charged particles extending from 60km to 1,000km above the surface. This layer is maintained by solar radiation. At the exact moments of sunrise and sunset, the ionosphere undergoes a brief, measurable thinning. The electromagnetic barriers that normally filter cosmic radiation weaken for approximately 11 minutes around each twilight junction.

During this window:
— Schumann Resonance amplitude increases 40-60% (Earth's electromagnetic heartbeat at 7.83Hz — the frequency of human alpha brainwaves and coherent heart rhythm)
— Cosmic ray flux increases 30-40% — the flow of high-energy particles from deep space that the Siddhas understood as carrier-waves for cosmic intelligence
— The local electromagnetic field's dielectric constant shifts — making it more permeable to subtle-field influence

The Siddha texts describe this as the Akashic membrane thinning. Yagna performed at this exact moment is like broadcasting on a clear frequency rather than through static.

WHY APPROXIMATE TIMING FAILS: Performing Agnihotra 10 minutes before or after sandhyakala means performing it outside the ionospheric window. The Schumann peak has not yet arrived or has already passed. The cosmic ray flux is at baseline level. You are still performing a beneficial fire ritual — but not catching the window. Siddha texts document: Pranagni output during the sandhyakala window is 40-fold greater than at other times. Modern measurements of Agnihotra ash from fires at exact vs. approximate sandhyakala show measurably different mineral crystalline structure.

THE FOUR JUNCTION-TIMES (Chatur-Sandhya):
1. Sunrise (most powerful): solar fire activating
2. Noon: transition from ascending to descending solar arc
3. Sunset (second most powerful): solar fire withdrawing
4. Midnight: lunar and stellar fire dominant (advanced practice only)`,
        objectives: ["Understand the ionospheric thinning at exact twilight: Schumann Resonance peaks, cosmic ray flux increases, electromagnetic barriers thin","Learn why approximate timing (±10 min) reduces effectiveness by 80% according to Siddha text measurements","Know the four junction-times (Chatur-Sandhya) and their power ranking: sunrise > sunset > noon > midnight","Calculate your precise sandhyakala using Panchangam coordinates — the exact second, not the minute"] },
      { title: "The Global Network Effect — Samashti Yagna", duration: "20 min",
        body: `Rig Veda 10.191 — one of the final hymns of the entire Rigveda — is dedicated entirely to collective coherence. It opens: "Sangachadhwam, Samvadadhwam, Sam vo manānsi jānatām" — Come together. Speak together. Let your minds become one. The Vedic seers understood something that modern network theory is only beginning to formalize: collective coherence is non-linearly more powerful than the sum of its parts.

THE MAHA-AGNI-KSHETRA: When multiple fires burn simultaneously with unified Sankalpa (intention), they create what the Siddha tradition calls a Maha-Agni-Kshetra — a great fire-field. The electromagnetic fields of multiple Yagna fires within proximity overlap and create constructive interference patterns — the same principle that makes lasers (coherent light) orders of magnitude more powerful than equivalent amounts of incoherent light.

The Brahmanda Purana records a specific threshold: when 1,000 or more Agnihotra fires burn simultaneously with unified Sankalpa, the combined Pranagni field pierces what the text calls Bhuvar-loka — the etheric layer above the physical plane — and connects directly to the Deva-consciousness network.

THE 18 SIDDHAS' INVISIBLE GRID: The Tamil Siddha tradition records that Agastya Muni established a network of Agni-Kundas across the sacred sites of South India, Southeast Asia, and the Himalayas. According to the Agastya Samhita, each site contains a permanent Agni-installation — a fire lit by Agastya and maintained in the subtle plane to this day. The 18 Siddhas collectively maintain this invisible fire network, called the Akasha-Agni-Jala (sky-fire-net). This network sustains Earth's Prana grid — the planetary life-force distribution system — in the same way that acupuncture meridians distribute Prana through the human body.

When you perform Agnihotra at sandhyakala, your fire — regardless of where you are on Earth — connects to this grid. The Siddha texts are specific: any fire performed with correct materials, correct timing, and clear Sankalpa automatically resonates with the nearest node of the Akasha-Agni-Jala and amplifies its output. You are not performing a private ritual. You are joining a planetary network that has been operating continuously for at least 5,000 documented years.`,
        objectives: ["Understand Rig Veda (10.191): 'Sangachadhwam, Samvadadhwam' — come together, speak together, let your minds be one","Learn the Maha-Agni-Kshetra effect: when 1,000+ fire altars burn simultaneously, Bhuvar-loka is pierced","Know the 18 Siddhas' invisible Agni-Kunda network across sacred sites — maintained across millennia","Understand how joining the SQI Yagna community grid activates your local fire within this planetary field"] },
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
        objectives: ["Understand the 24 syllables mapped to 24 vertebrae + 24 biofield frequencies + 24 Nakshatras simultaneously","Learn how Vishwamitra spent 12,000 years of Tapas forcing cosmic fire to crystallize into syllables that trigger Sahasrara-to-Muladhara integration","Know the specific mudra combinations that must accompany Gayatri in Yagna to activate all 24 nodes simultaneously","Understand the neurological equivalence: Gayatri with mudras in Yagna = 15 minutes of gamma-wave meditation"] },
      { title: "Yagna as Quantum Entanglement Technology", duration: "25 min",
        objectives: ["Study the Vaisheshika Tanmatras: five ultra-subtle essences (Shabda, Sparsha, Rupa, Rasa, Gandha) underlying all matter","Understand how Yagna operates at the Tanmatra level — where sound-essence and light-essence are still unified","Learn the Brahma Sutras confirmation: 'Shastra Yonitvat' — Vedic mantras are direct cognitions of cosmic law","Understand why the Rishis did not discover fire science through experiment — they WERE the experiment"] },
      { title: "Environmental Regeneration — The Rta Protocol", duration: "25 min",
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
        objectives: ["Decode Bhur (Muladhara-fire), Bhuva (Anahata-fire), Svar (Sahasrara-fire) as chakra ignition codes","Learn the seven atmospheric consciousness-layers each Yagna session progressively unlocks: Bhuloka through Satyaloka","Understand how each gram of ghee offered with Svaha activates an ascending spiral through these layers","Know the threshold: 7+ day Maha-Yagnas fully open the Satyaloka channel — producing non-dual awareness"] },
      { title: "Ancestor Healing — The Pitru Tarpana Mechanism", duration: "22 min",
        objectives: ["Understand the Dakshina fire (southern direction) as the carrier medium for Pitru-loka communication","Learn the specific geometric pathway ('the southern corridor') ancestral consciousnesses access during Yagna","Study modern epigenetics validation: trauma is inherited through DNA methylation up to 7 generations","Know the three Pitru mantras that open the southern corridor and the sesame-offering protocol for each"] },
      { title: "The Neurological Upgrade — Soma Production", duration: "22 min",
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
        objectives: ["Study the Sulba Sutras (Baudhayana & Apastamba) as the oldest precision geometry texts on Earth","Learn four Kunda geometries and their fields: Square (Prithvi-stabilizing), Circular (Akasha-expanding), Lotus (Soma-releasing), Shri Yantra (Shakti-vortex/Tripura-Agni)","Understand Kamika Agama verse 4.23: 'The fire vessel IS the Devi's womb — what enters the flame is reborn purified'","Connect to physicist Nikolai Kozyrev's torsion field research and its correspondence to Kunda geometry effects"] },
      { title: "Agastya's Fire Science — How Fire Heals Land", duration: "19 min",
        objectives: ["Study Agastya's Vindhya Yagna: how fire coherence compresses local gravitational fields — the torsion field effect","Understand the Agastya Homa protocol for ecosystem restoration: specific wood sequences and ash application","Learn the Tamil Siddha Homa Farming documentation: 40-day Agnihotra restoring soil, crops, and water sources","Know the quantum timeline effect: past wounds in land heal when fire is lit with clear Sankalpa"] },
      { title: "Preparing Your Fire Space — Vastu for the Yagna-Kunda", duration: "18 min",
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
        objectives: ["Learn the complete herb-and-vessel matrix for all 9 Grahas: Sun (Bilva + golden lotus + gold vessel), Moon (white sandalwood + milk-ghee), Mars (Palasha + red sandalwood + copper vessel), Mercury (Durva + green mung + emerald-water), Jupiter (Peepal + banana flower + yellow silk), Venus (white lotus seeds + saffron + honey), Saturn (sesame + black sesame + iron), Rahu (Durva + blue lotus + silver), Ketu (Kusa grass + Vedic camphor)","Understand why the specific metal vessel for each Graha is non-negotiable — metal is a frequency-specific conductor","Know the precise Beej Mantra for each Graha that activates the planetary intelligence when spoken into the corresponding fire","Map the 9-hour timing: which planetary fire is lit at which hour and in which compass direction"] },
      { title: "Sulba Sutra Kunda Codes — All Seven Vessel Geometries", duration: "28 min",
        objectives: ["Study all seven Kunda-types with exact Sulba Sutra proportions: Square, Circular, Semicircular, Lotus, Triangular, Hexagonal, Shri-Yantra","Learn the exact measurements, proportions, depth ratios, and Vastu orientations for each type","Understand which Kunda generates which field: Trikona → purification, Padma → abundance, Navayoni → total transformation","Know the Kamika Agama complete Kunda consecration — the three steps that convert a vessel into a living Yantra"] },
      { title: "The Navagraha Mandala Effect — 2km Field Recalibration", duration: "27 min",
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
        objectives: ["Study the Maha Mrityunjaya Mantra (Rigveda 7.59.12 — Rishi Vashishtha revelation) as an address to Tryambaka: lord of the three fires","Map the three fires: Jataragni (digestive), Pranagni (vital force), Chittagni (consciousness-fire) — disease as misalignment between these three","Learn the Shiva Purana's Vidyeshvara Samhita decoding of the mantra's 33 syllables — each addressed to an aspect of the fire-triad","Study Korakkar's 'Korakkar Nigandu': 108 disease conditions with corresponding Yagna protocols — the world's oldest fire-medicine compendium"] },
      { title: "The 108,000 Japa Protocol — Mechanics and Preparation", duration: "32 min",
        objectives: ["Understand why 108,000 is the threshold: 108 × 1,000 = one complete Mala for each of the 1,000 petals of Sahasrara","Learn the 11-day Anushthan structure: 9,090 repetitions per day in 5 sessions of 1,818 each, fire maintained between sessions","Know the four witnesses (or 4 sincere practitioners) required for a valid Maha Mrityunjaya Yagna — witness-consciousness amplifies the field","Study the dietary and behavioral Niyama for each of the 11 days — pharmacological preparations, not optional observances"] },
      { title: "Maha Mrityunjaya in Daily Life — The Accessible Form", duration: "32 min",
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
        objectives: ["Study the Chandogya Upanishad Chapter 5 revelation: the human body IS a Yagna-kunda — Inhalation = offering, Exhalation = Svaha, Digestive fire = Agni","Understand mitochondrial combustion as Yagna: every cell metabolizing glucose through oxidative phosphorylation is performing the same fire ceremony","Learn Mahavatar Babaji's direct transmission: continuous inner Yagna maintained for 1,800+ years — body sustained by Pranagni","Map the progression from outer Yagna to inner Pranagni: the external practice is training, internal activation is graduation"] },
      { title: "Babaji's Kriya Fire — Kundalini as Eternal Yagna", duration: "26 min",
        objectives: ["Understand the first Kriya initiation as always fire-based: activating inner Kundalini as the eternal Yagna-kunda","Learn the Pranava OM as the hiss of the inner flame — not a sound to chant but a vibration to sense arising from the base of the spine","Study the 18 Siddhas' documented inner Yagna states: Agastya's Tapas-fire, Thirumoolar's 3,000-year samadhi as Pranagni maintenance","Know the three signs inner Pranagni has activated: spontaneous warmth in the spine, involuntary Pranayama during stillness, fire moving upward through chakras"] },
      { title: "SAT-CHIT-ANANDA SVAHA — The Ultimate Offering", duration: "26 min",
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