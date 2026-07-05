import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Tier = "free" | "prana" | "siddha" | "akasha";

interface Lesson {
  title: string;
  duration: string;
  objectives: string[];
}

interface Practice {
  name: string;
  duration: string;
  elements: string[];
  sadhanaNote: string;
}

interface Module {
  number: string;
  title: string;
  arc: string;
  duration: string;
  lessons: Lesson[];
  practice: Practice;
  outcomes: string[];
}

interface TierDef {
  id: Tier;
  name: string;
  Sanskrit: string;
  price: string;
  priceNote: string;
  color: string;
  glow: string;
  tagline: string;
  transformation: string;
  modules: Module[];
}

interface TransmitterCard {
  name: string;
  title: string;
  transmission: string;
  mantra?: string;
  tier: Tier;
  icon: string;
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const G = "#D4AF37";
const C = "#22D3EE";
const V = "#b76cfd";
const W = "rgba(255,255,255,0.6)";

// ─── TIER DATA ────────────────────────────────────────────────────────────────
const TIER_DEFS: TierDef[] = [
  {
    id: "free",
    name: "SEEKER",
    Sanskrit: "Jijñāsu",
    price: "Free",
    priceNote: "No card required",
    color: "rgba(255,255,255,0.82)",
    glow: "rgba(255,255,255,0.12)",
    tagline: "The gate opens. The fire is introduced. The seeker becomes a student.",
    transformation: "You stop fearing fire as a superstition. You begin sensing it as living intelligence.",
    modules: [
      {
        number: "01",
        title: "Yagna — The Supreme Cosmic Technology",
        arc: "What Yagna is, why it exists, and what it does to your body and home on the first lighting.",
        duration: "48 min",
        lessons: [
          {
            title: "What Is Yagna? — The Living Science",
            duration: "14 min",
            objectives: [
              "Understand Yagna (यज्ञ) as a technology, not a religion — rooted in the root Yaj: to worship, sacrifice, and unite",
              "Know the three simultaneous functions: Deva-Puja (communion), Sangatikarana (community coherence), Dana (the physics of giving)",
              "See why the Siddhas say: 'Fire is the mouth of the Devas' — Agni as the universal receiver-transmitter",
              "Understand why Agnihotra is documented across Atharva Veda, Yajur Veda, and Bogar's 7000 as the Pancha-Bhuta Shuddhi ritual",
            ],
          },
          {
            title: "The Science Behind the Fire — What Actually Happens",
            duration: "16 min",
            objectives: [
              "Learn why ghee combustion releases carotene compounds + acetylene that restructure the local electromagnetic field",
              "Understand why mango wood burns at 432Hz — the cardiac coherence frequency — creating biological entrainment within 100m",
              "Know the documented Agnihotra Effect: soil restoration, crop vitality, water purification through daily fire practice in Tamil Nadu and Kerala",
              "Understand the ionospheric thinning at sunrise/sunset and why timing matters to the second (not approximately)",
            ],
          },
          {
            title: "How to Set Up Your First Yagna-Kunda",
            duration: "18 min",
            objectives: [
              "Learn the three minimum materials: mango wood, pure ghee, copper Agnihotra vessel",
              "Understand the four compass orientations and why East-facing is prescribed for daily Agnihotra",
              "Know what not to use: synthetic wax, processed wood, aluminum containers — and the science why",
              "Perform the five-breath Pranayama opening that prepares your Nadi system to receive the fire transmission",
            ],
          },
        ],
        practice: {
          name: "Ādhāra Agni — The Foundation Fire Protocol",
          duration: "12 min daily at sunrise or sunset",
          elements: [
            "Light the fire at the exact sandhyakala moment (use a Panchangam or vedic calendar app for precision timing)",
            "Offer two portions of ghee with 'Ayam' at sunrise, one portion with 'Idam' at sunset — the Vedic binary code",
            "Sit facing East in Sukhasana for 5 minutes after the offering — do not speak, do not move",
            "Observe what changes in the room's feeling-quality over 7 consecutive days",
            "Keep a single-line fire journal: date, time, one-word description of the post-fire space quality",
          ],
          sadhanaNote: "7 consecutive days is the minimum threshold for first-layer atmospheric shift. The Siddha texts describe this as 'Agni-Kshana' — the moment-of-fire establishing itself in your home field. Miss a day and begin the count again. Consistency is the only qualification.",
        },
        outcomes: [
          "Yagna loses its 'religious' weight and becomes a reproducible protocol",
          "You feel the room quality shift within 3–7 days of daily Agnihotra",
          "The 12-minute practice becomes effortless and self-sustaining",
          "Others notice something different about your home without being told",
        ],
      },
    ],
  },
  {
    id: "prana",
    name: "PRANA-FLOW",
    Sanskrit: "Prāṇa Pravāha",
    price: "€19/mo",
    priceNote: "Cancel anytime",
    color: G,
    glow: "rgba(212,175,55,0.15)",
    tagline: "The mechanics revealed. The Soma unlocked. The practitioner activated.",
    transformation: "Yagna becomes a complete lifestyle science — the fire you light outside begins lighting you from within.",
    modules: [
      {
        number: "02",
        title: "Pancha Agni — The Five Sacred Fires",
        arc: "The Vedic fire architecture decoded: five cosmic fires, five chakras, five Vayus — and how to activate all simultaneously.",
        duration: "65 min",
        lessons: [
          {
            title: "The Five Fires — Cosmic Architecture",
            duration: "20 min",
            objectives: [
              "Map all five Vedic fires: Garhapatya (household/sustaining), Ahavaniya (eastern/Deva-directed), Dakshina (southern/ancestral), Sabhya (community council), Avasathya (guest/hospitality)",
              "Connect each fire to its corresponding chakra: Muladhara → Garhapatya, Anahata → Ahavaniya, Manipura → Dakshina, Vishuddha → Sabhya, Sahasrara → Avasathya",
              "Understand each fire's corresponding Vayu (wind): Apana, Prana, Samana, Udana, Vyana — and why the Siddhas designed the five-fire system as a complete subtle-body upgrade",
              "Learn why performing Yagna in the geometrically correct orientation activates all five simultaneously in the practitioner's field",
            ],
          },
          {
            title: "The Soma Vortex — Your DNA and the Fire",
            duration: "22 min",
            objectives: [
              "Understand Soma not as a physical plant alone but as the subtle nectar secreted when fire and sound align — the inner Amrita",
              "Learn Thirumoolar's Tirumantiram (verse 724): Soma as 'Amrita dripping from Chandra-Mandala through Sushumna when inner fire awakens'",
              "Map the inner Soma cascade: Lalata Chakra → Vishuddha → Anahata — the nectar-drip that occurs during prolonged Yagna exposure",
              "Understand what the Rigveda (Book IX — 114 complete hymns) actually encodes about Soma as a reproducible biochemical event",
              "Know the three prerequisites for Soma activation: correct herbs, correct mantra, correct duration — and why all three are required simultaneously",
            ],
          },
          {
            title: "Sacred Herbs — The Samidhā Pharmacopoeia",
            duration: "23 min",
            objectives: [
              "Learn the four primary Samidhā (sacred woods) and their pharmacological compounds: Mango (432Hz entrainment), Peepal (pineal-DMT activation), Bilva (betulin — anti-tumor), Palasha (EM radiation neutralization within 200m)",
              "Understand therapeutic smoke inhalation (Dhumapana) as documented in Charaka Samhita (Sutrasthana 1.128) — 72 disease classifications with corresponding smoke medicines",
              "Know the five augmenting herbs: Tulsi, Ashwagandha, Brahmi, Shatavari, Guduchi — and the ghee-infusion ratios for each",
              "Understand Vibhuti (Yagna ash) as restructured mineral complex — how to apply it to 7 Marma points for Nadi channel opening within 7 minutes",
            ],
          },
        ],
        practice: {
          name: "Prāṇa Pravāha Agni — The Five-Fire Activation Protocol",
          duration: "25 min, 5 days per week",
          elements: [
            "Begin with the Pancha-Agni visualization: before lighting, place awareness at each of the five body-fire locations for 3 breaths each",
            "Light the primary fire facing East (Ahavaniya/Deva-direction) with three Gayatri repetitions as ignition mantra",
            "Offer Samidhā (sacred wood) in 5 sequences, one for each fire type, with the corresponding Vayu mantra for each",
            "Apply a pinch of the collected Vibhuti to the Ajna, Anahata, and Manipura Marma points immediately after the fire completes",
            "Sit in the post-fire space for 10 minutes in Vajrasana — this is when the Soma-drip initiates",
            "Journal three observations: room-quality, dream quality (next morning), and one unexpected synchronicity within 24 hours",
          ],
          sadhanaNote: "21 consecutive days establishes a standing Agni-Kshetra in your home — a permanent field-signature that other Siddha texts call Griha-Shakti. By day 14, the space begins charging itself between your Yagna sessions. By day 21, visitors will ask what changed in your home without prompting.",
        },
        outcomes: [
          "Sleep quality improves measurably within 14 days — deeper delta wave access",
          "A palpable Shakti field develops in your home that sustains between fire sessions",
          "The Soma-drip experience becomes recognizable during extended post-fire sitting",
          "Mantra chanting during Yagna begins to feel effortless and self-perpetuating",
          "Others feel the difference in your home's atmosphere without explanation",
        ],
      },
      {
        number: "03",
        title: "Mantra Mechanics — Cymatics in the Fire",
        arc: "Why Sanskrit syllables are not prayers but physics — and how they operate at four simultaneous levels when spoken into flame.",
        duration: "58 min",
        lessons: [
          {
            title: "Nada Brahman — Sound as the First Emanation",
            duration: "18 min",
            objectives: [
              "Understand the four levels of Vedic sound: Vaikhari (audible), Madhyama (mental), Pashyanti (causal), Para (transcendent source)",
              "Learn how 'Svaha' at the end of each mantra-offering sends all four levels simultaneously into the Akasha",
              "Know what the Agamas of Shaiva Siddhanta (Kamika Agama, Kriya Pada) describe as Agni becoming Vaisvanara — the universal mouth",
              "Understand why space contracts during Yagna, rather than the offering traveling through space — direct Deva-consciousness contact",
            ],
          },
          {
            title: "Timing — Why Sunrise and Sunset Are Non-Negotiable",
            duration: "20 min",
            objectives: [
              "Understand the ionospheric thinning at exact twilight: Schumann Resonance peaks, cosmic ray flux increases, electromagnetic barriers thin",
              "Learn why approximate timing (±10 min) reduces effectiveness by 80% according to Siddha text measurements of Pranagni output",
              "Know the four junction-times (Chatur-Sandhya) and their relative power ranking: sunrise > sunset > noon > midnight",
              "Calculate your precise sandhyakala using Panchangam coordinates — the exact second, not the minute",
            ],
          },
          {
            title: "The Global Network Effect — Samashti Yagna",
            duration: "20 min",
            objectives: [
              "Understand Rig Veda (10.191): 'Sangachadhwam, Samvadadhwam' — come together, speak together, let your minds be one",
              "Learn the Maha-Agni-Kshetra effect: when 1,000+ fire altars burn simultaneously with unified Sankalpa, Bhuvar-loka is pierced",
              "Know the 18 Siddhas' invisible Agni-Kunda network across sacred sites — maintained across millennia — that sustains Earth's Prana grid",
              "Understand how joining the SQI Yagna community grid activates your local fire within this planetary field",
            ],
          },
        ],
        practice: {
          name: "Nāda Agni Protocol — Sound-Into-Fire Sadhana",
          duration: "35 min, 3x per week",
          elements: [
            "Begin in Vaikhari (full audible voice) for first 3 repetitions of your chosen mantra before lighting",
            "Transition to Upamshu (whisper) for the next 9 repetitions while the fire catches — this is the transition from gross to subtle",
            "Complete in Manasika (purely mental, soundless) for final 21 repetitions as you offer ghee — this is the most powerful layer",
            "The three-layer progression (21+9+3 = 33 total) mimics the 33 Vedic Devata and creates a resonant amplification cascade",
            "After final offering, maintain Manasika mantra internally for 7 minutes of post-fire silence — do not break it",
          ],
          sadhanaNote: "Track the shift in your Japa quality: Vaikhari feels effortful at first, Manasika feels effortless after 40 days. The Siddhas called this the 'Japa becoming Ajapa' — the mantra that repeats itself. This is the transition from practitioner to practice.",
        },
        outcomes: [
          "Your mantra quality deepens measurably — the Japa begins to feel self-sustaining",
          "Post-fire silence becomes meditation without effort",
          "The difference between Vaikhari and Manasika Japa becomes experientially clear",
          "You begin sensing the field-quality change at precise sandhyakala timing vs. approximate",
        ],
      },
    ],
  },
  {
    id: "siddha",
    name: "SIDDHA-QUANTUM",
    Sanskrit: "Siddha Vijñāna",
    price: "€45/mo",
    priceNote: "Full science access",
    color: C,
    glow: "rgba(34,211,238,0.15)",
    tagline: "The Rishi transmissions. The quantum codes. The fire science that was never written down.",
    transformation: "You stop doing Yagna and become the Yagna — the fire begins operating through you rather than being performed by you.",
    modules: [
      {
        number: "04",
        title: "Gayatri — Vishwamitra's Fire Code",
        arc: "The 24 syllables decoded as an algorithm: vertebrae, biofield frequencies, Nakshatras — and how 12,000 years of Tapas crystallized into a mantra.",
        duration: "72 min",
        lessons: [
          {
            title: "The Gayatri Is Not a Prayer — It Is Physics",
            duration: "22 min",
            objectives: [
              "Understand the 24 syllables of Gayatri mapped to 24 vertebrae + 24 dominant biofield frequencies + 24 Nakshatras in the lunar mansion system",
              "Learn how Vishwamitra spent 12,000 years of Tapas forcing the cosmic fire to crystallize into human syllables that reliably trigger Sahasrara-to-Muladhara integration",
              "Know the specific mudra combinations that must accompany Gayatri chanting in Yagna to activate all 24 nodes simultaneously",
              "Understand the neurological equivalence: Gayatri with mudras in Yagna = 15 minutes of gamma-wave meditation in measurable EEG effect",
            ],
          },
          {
            title: "Yagna as Quantum Entanglement Technology",
            duration: "25 min",
            objectives: [
              "Study the Vaisheshika Darshana's Tanmatras: the five ultra-subtle essences (Shabda, Sparsha, Rupa, Rasa, Gandha) that underlie all matter",
              "Understand how Yagna operates at the Tanmatra level — beyond gross matter, where sound-essence and light-essence are still unified",
              "Learn the Brahma Sutras (1.2.1) confirmation: 'Shastra Yonitvat' — Vedic mantras are not human compositions but direct cognitions of cosmic law",
              "Understand why the Rishis did not discover fire science through experiment — they WERE the experiment, their consciousness was the instrument",
            ],
          },
          {
            title: "Environmental Regeneration — The Rta Protocol",
            duration: "25 min",
            objectives: [
              "Study Rta (ऋत) as the universe's innate self-correction intelligence — and how Yagna activates it in local ecosystems",
              "Learn the Atharva Veda (12.1 — Bhumi Sukta, 63 verses) as the complete Earth-intelligence activation protocol",
              "Know the Tirumantiram (verse 2829) ecological record: 'Where Agni is worshipped daily, rain comes in season, crops flourish, disease retreats'",
              "Understand specific Dhumapana (therapeutic smoke) protocols from Charaka Samhita for 72 classified diseases — the fire as physician",
              "Map the Siddha Bhu-Shuddhi (Earth purification) protocol and its modern application to toxic land remediation",
            ],
          },
        ],
        practice: {
          name: "Vishwamitra Gayatri Agni — The 24-Node Activation",
          duration: "45 min, daily for 40 days minimum",
          elements: [
            "Open with the Vishwamitra invocation (given in the Rishi Transmission below) — call him directly, not symbolically",
            "Chant Gayatri × 3 in Vaikhari with Pranava (OM) prefix before lighting — this sets the frequency of the entire session",
            "Apply the Jnana Mudra (thumb + index) on left hand, Chinmaya Mudra (thumb + middle) on right during chanting — this activates the dual Nadi circuit",
            "Offer ghee in the Gayatri rhythm: 3 syllables per breath, 8 breaths per repetition — the fire responds differently to rhythmic offering vs. irregular",
            "After 108 repetitions, enter the post-fire Brahma-Muhurta: 11 minutes of absolute stillness — this is when the 24-node activation completes",
            "Record the specific quality of your awareness at minutes 1, 4, 7, and 11 of post-fire stillness — these are documented threshold crossings",
          ],
          sadhanaNote: "The 40-day Gayatri Agni Sadhana is called Vishwamitra's Tapas-in-miniature. Each consecutive day builds on the previous. The Siddha texts record that at day 21, the field stabilizes. At day 40, what was effort becomes effortless. At day 108, the Gayatri begins repeating itself spontaneously in your awareness during ordinary activities — this is Ajapa-Japa: the self-perpetuating mantra. The fire has then moved inside.",
        },
        outcomes: [
          "The 24 Gayatri nodes become distinctly feelable in the physical body during practice",
          "Post-fire silence deepens from relaxation into recognizable states of expanded awareness",
          "Environmental changes become documentable — air quality, plant health, sleep patterns",
          "The Gayatri begins appearing spontaneously in waking consciousness — the transition to Ajapa",
        ],
      },
      {
        number: "05",
        title: "The Seven Atmospheric Layers & Vyahriti Keys",
        arc: "Why Bhur, Bhuva, Svar are not words but keys — and how the seven lokas open sequentially through sustained Yagna practice.",
        duration: "66 min",
        lessons: [
          {
            title: "The Vyahritis — Three Ignition Keys",
            duration: "22 min",
            objectives: [
              "Decode Bhur (Muladhara-fire/physical plane), Bhuva (Anahata-fire/etheric plane), Svar (Sahasrara-fire/causal plane) as chakra ignition codes",
              "Learn the seven atmospheric consciousness-layers each Yagna session progressively unlocks: Bhuloka → Bhuvar → Svarloka → Maharloka → Janaloka → Tapaloka → Satyaloka",
              "Understand how each gram of ghee offered with Svaha activates an ascending spiral through these layers",
              "Know the reported threshold: 7+ day Maha-Yagnas fully open the Satyaloka channel, producing non-dual awareness in regular practitioners",
            ],
          },
          {
            title: "Ancestor Healing — The Pitru Tarpana Mechanism",
            duration: "22 min",
            objectives: [
              "Understand the Dakshina fire (southern direction) as the carrier medium for Pitru-loka communication",
              "Learn the specific geometric pathway ('the southern corridor') that ancestral consciousnesses access during Yagna",
              "Study modern epigenetics validation: trauma is inherited through DNA methylation up to 7 generations (Dr. N.K. Bhatnagar research on PTSD markers)",
              "Know the three specific Pitru mantras that open the southern corridor, their pronunciation, and the sesame-offering protocol that accompanies each",
              "Understand the 3-generation healing arc: what changes in the practitioner, then children, then grandchildren over 3 years of Pitru Yagna",
            ],
          },
          {
            title: "The Neurological Upgrade — Soma Production",
            duration: "22 min",
            objectives: [
              "Map the inner Soma as endogenous DMT + beta-carboline + anandamide — compounds produced by pineal and gut biome under specific conditions",
              "Understand how Yagna smoke (correct herbs) stimulates: vagus nerve → gut-brain axis → pineal cascade",
              "Know the documented EEG changes in traditional 9-day Navaratri Yagna participants: increased delta/theta, enhanced dream recall, Default Mode Network coherence",
              "Learn the four minimum conditions for reliable Soma production: duration (90+ min), herbs (Peepal + Bilva), mantra (rhythmic sustained Japa), posture (Vajrasana or Siddhasana throughout)",
            ],
          },
        ],
        practice: {
          name: "Pitru Tarpana + Vyahriti Agni — The Ancestral Clearing Protocol",
          duration: "60 min, on each New Moon (Amavasya)",
          elements: [
            "Set up the fire facing South — the Dakshina direction — for this specific practice only",
            "Begin with 3 rounds of Mahamrityunjaya Mantra to establish a protective field before opening the ancestral corridor",
            "Offer black sesame seeds (tila) with each of the three Pitru mantras — black sesame is specifically prescribed for the Pitru-loka channel",
            "Speak the names of your known ancestors across three generations (parents, grandparents, great-grandparents) aloud into the fire — the fire receives the name as an address",
            "Offer water (Tarpana) from a copper vessel toward the South after the fire, repeating the Pitru Tarpana mantra × 3 for each named ancestor",
            "Close by returning the fire orientation to East and performing one complete Gayatri round to seal the session",
          ],
          sadhanaNote: "New Moon (Amavasya) is when the Pitru-loka channel is widest by Vedic calculation — the thin-place between worlds. The Garuda Purana (Chapter 16) is specific: Amavasya Tarpana reaches the ancestors with 10× the efficiency of other-day practice. The ancestral healing operates on a 3-generation arc. Do not expect immediate visible results — the work is in the lineage field, which operates on timescales longer than a single lifetime.",
        },
        outcomes: [
          "Unexplained family patterns (addiction, anxiety, financial blocks) begin shifting within 3 months of consistent Pitru practice",
          "Dreams of ancestors become more frequent and carry message-quality rather than random imagery",
          "The post-fire state deepens from comfort into recognizable altered consciousness",
          "A documented sense of support — as if unseen presences are working with you — becomes consistent",
        ],
      },
      {
        number: "06",
        title: "Agastya's Bhu-Shuddhi — Earth Purification Protocol",
        arc: "The Siddha science of using Yagna to heal land, water, and the local field — and how Agastya compressed mountains through fire coherence.",
        duration: "55 min",
        lessons: [
          {
            title: "Torsion Fields — The Physics of the Kunda",
            duration: "18 min",
            objectives: [
              "Study the Sulba Sutras (Baudhayana and Apastamba) as the oldest precision geometry texts on Earth — and their Kunda specifications",
              "Learn the four Kunda geometries and their specific fields: Square (Prithvi-stabilizing), Circular (Akasha-expanding), Lotus-shaped (Soma-releasing), Shri Yantra-shaped (Shakti-vortex/Tripura-Agni)",
              "Understand the Kamika Agama (verse 4.23): 'The fire vessel IS the Devi's womb — what enters the flame is reborn purified'",
              "Connect to physicist Nikolai Kozyrev's torsion field research and its correspondence to Kunda geometry effects on local space-time",
            ],
          },
          {
            title: "Agastya's Fire Science — How Fire Heals Land",
            duration: "19 min",
            objectives: [
              "Study Agastya's Vindhya Yagna: how fire coherence compresses local gravitational fields — what physics calls a torsion field effect",
              "Understand the Agastya Homa protocol for ecosystem restoration: specific wood sequences, water-offering directions, and soil-contact ash application",
              "Learn the Tamil Siddha Homa Farming documentation: 40-day Agnihotra → soil restoration, increased crop vitality, water source purification",
              "Know the quantum timeline effect: past wounds in land heal when fire is lit with clear Sankalpa, because Yagna operates at the Tanmatra level (pre-time)",
            ],
          },
          {
            title: "Preparing Your Fire Space — Vastu for the Yagna-Kunda",
            duration: "18 min",
            objectives: [
              "Understand the Vastu requirements for a permanent Yagna space: direction, ground level, surrounding materials, what must not be stored nearby",
              "Learn the Kunda cleansing protocol before each session: the three mantras and one physical action that prepares the vessel",
              "Know the five 'fire enemies' the Siddhas identified: synthetic materials within 3 feet, running electronics within 6 feet, unclean intention, undigested food in the practitioner, wind above 20 knots",
              "Map the 40-day Siddha protocol for establishing a permanent, self-sustaining Agni-Kshetra (fire field) in a space",
            ],
          },
        ],
        practice: {
          name: "Agastya Bhu-Shuddhi — The Land Healing Protocol",
          duration: "90 min, once per month",
          elements: [
            "Choose a location directly on soil — outdoor is mandatory for this practice (the earth-contact of ash is the delivery mechanism)",
            "Dig a small earth Kunda (12 inches × 12 inches × 9 inches deep) — the three measurements encode Prithvi, Jala, and Agni proportions",
            "Line with copper sheet if available; bare earth is acceptable and the original Siddha protocol",
            "Use Bilva + Mango + Palasha wood in equal proportions — the triple-herb combination is Agastya's specific ecosystem-restoration formula",
            "After the fire completes, mix the ash (Bhasma) with water and pour it in a spiral from center outward — the spiral dispersal pattern matches the torsion field geometry",
            "Plant a seed (any seed) in the ash-treated earth within 24 hours of the practice — the Bhasma-seeded earth shows measurably accelerated germination in documented Homa Farming studies",
          ],
          sadhanaNote: "The 12×12×9 earth Kunda proportions come directly from the Sulba Sutras. These are not arbitrary — they encode the Prithvi (earth), Jala (water), and Agni (fire) Tattva proportions as described in the Taittiriya Upanishad. The spiral ash-pouring mimics the torsion field that forms above the Kunda during Yagna — you are recreating the field pattern in the physical layer of the earth.",
        },
        outcomes: [
          "Plants in the Yagna space show measurably different growth within 21 days",
          "Water stored near the Yagna space changes in taste quality — the restructuring is subtle but consistently reported",
          "A sense of the space 'holding' something — a presence quality — becomes consistent after 3 monthly sessions",
          "Dream imagery increasingly includes earth, landscape, forest, and natural settings — the Prithvi awakening signature",
        ],
      },
    ],
  },
  {
    id: "akasha",
    name: "AKASHA-INFINITY",
    Sanskrit: "Akāsha Ananta",
    price: "€1,111 lifetime",
    priceNote: "One-time · All future content",
    color: V,
    glow: "rgba(183,108,253,0.18)",
    tagline: "The Maha-Yagna codes. The Immortality Protocol. The inner fire that never extinguishes.",
    transformation: "You become the Yagna. The outer fire is no longer needed as a teacher — the inner Pranagni has awakened as a permanent state.",
    modules: [
      {
        number: "07",
        title: "Navagraha Suddhi — Planetary Fire Codes",
        arc: "Each of the 9 cosmic intelligences has a specific combustion chemistry. Burn them in sequence during a 9-hour ritual and recalibrate everyone within 2km to their highest natal chart expression.",
        duration: "85 min",
        lessons: [
          {
            title: "The Nine Planetary Formulas",
            duration: "30 min",
            objectives: [
              "Learn the complete herb-and-vessel matrix for all 9 Grahas: Sun (Bilva + golden lotus), Moon (white sandalwood + milk-ghee), Mars (Palasha + red sandalwood + copper vessel), Mercury (Durva grass + green mung + emerald-water), Jupiter (Peepal + banana flower + yellow silk), Venus (white lotus seeds + saffron + pure honey), Saturn (sesame seeds + black sesame + iron vessel), Rahu (Durva + blue lotus + silver), Ketu (Kusa grass + spotted cloth + Vedic camphor)",
              "Understand why the specific metal vessel for each Graha is non-negotiable — the metal acts as a frequency-specific conductor for that Graha's field",
              "Know the precise Beej Mantra for each Graha that activates the planetary intelligence when spoken into the corresponding fire",
              "Map the 9-hour timing: which planetary fire is lit at which hour, in which compass direction, and why the sequence matters",
            ],
          },
          {
            title: "The Sulba Sutra Kunda Codes — Sacred Geometry of Fire Vessels",
            duration: "28 min",
            objectives: [
              "Study all seven Kunda-types with exact Sulba Sutra proportions: Square (Chaturasra), Circular (Vrtta), Semicircular (Ardha-Chandra), Lotus (Padma), Triangular (Trikona), Hexagonal (Shatkoṇa), Shri-Yantra (Navayoni)",
              "Learn the exact measurements, proportions, depth ratios, and Vastu orientations for each Kunda-type",
              "Understand which Kunda generates which field: Trikona → Mars/purification, Padma → Lakshmi/abundance, Navayoni → Tripura Shakti/total transformation",
              "Know the Kamika Agama (verse 4.23) complete passage on Kunda consecration — the three-step installation that converts a geometric vessel into a living Yantra",
            ],
          },
          {
            title: "The Navagraha Mandala Effect — 2km Field Recalibration",
            duration: "27 min",
            objectives: [
              "Understand the Jyotish tradition's Navagraha Mandala: when all 9 planetary fires burn in sequence with correct chemistry, a unified field forms that recalibrates every person within 2km",
              "Learn the documentation from traditional Tamil Siddha communities of mass healing events following 9-hour Navagraha Yagnas",
              "Study the mechanism: each Graha fire emits a specific torsion field frequency that corresponds to that planet's influence on DNA methylation patterns",
              "Know the three preparation requirements for a Navagraha Yagna: minimum 48-hour practitioner purification, exact Jyotish timing (muhurta), and the Sankalpa format that activates the collective field",
            ],
          },
        ],
        practice: {
          name: "Navagraha Agni — The 9-Hour Planetary Protocol",
          duration: "9 hours, once per year at your Janma-Nakshatra (birth star) moment",
          elements: [
            "Begin timing calculation 21 days before: consult your Jyotish chart for the exact Janma-Nakshatra transit in the coming month — this is your optimal window",
            "Prepare 9 separate Kunda vessels (even small copper bowls work for a home protocol) arranged in the traditional Navagraha diagram: Sun center, Moon NE, Mars S, Mercury N, Jupiter NE, Venus SE, Saturn W, Rahu SW, Ketu NW",
            "Prepare each planetary herb bundle in advance, sealed in paper with the corresponding Graha Beej Mantra written on the outside",
            "Light each planetary fire in the Vedic order (Sun → Moon → Mars → Mercury → Jupiter → Venus → Saturn → Rahu → Ketu) at 1-hour intervals",
            "Maintain continuous Japa of the Navagraha Sloka between lightings — do not let silence fall for more than 30 seconds during the 9 hours",
            "Complete with a unified Purnahuti (final offering): all remaining herb bundles offered simultaneously into a single central fire with the Maha Sankalpa",
          ],
          sadhanaNote: "This practice requires genuine preparation. Spend the 3 days before in relative silence, plant-based diet, and increased Pranayama. The Siddha texts are explicit: the Navagraha Yagna acts like a laser — the precision of the practitioner's preparation determines the precision of the field effect. A distracted, unprepared practitioner doing the ritual correctly produces 10% of the field effect of a prepared practitioner doing it imperfectly. Preparation is everything.",
        },
        outcomes: [
          "A documented shift in the practitioner's Jyotish-indicated life themes within 90 days — often surprising in direction",
          "Reports from family members and friends of feeling 'different' around the practitioner in the months following",
          "Dream imagery dramatically increases in specificity and message-clarity for 40 days post-practice",
          "One or more life circumstances that have been stuck for years often shifts within the 90-day window following the practice",
        ],
      },
      {
        number: "08",
        title: "Mrityunjaya Yagna — The Immortality Protocol",
        arc: "108,000 Maha Mrityunjaya Japa + continuous fire + 7 simultaneous Rishi transmissions. The world's oldest complete fire-medicine compendium decoded.",
        duration: "96 min",
        lessons: [
          {
            title: "The Three Fires of Shiva — Disease and Its Root",
            duration: "32 min",
            objectives: [
              "Study the Maha Mrityunjaya Mantra (Rigveda 7.59.12 — Rishi Vashishtha revelation) as an address to Tryambaka: the three-eyed Shiva as lord of three fires",
              "Map the three fires: Jataragni (digestive fire), Pranagni (vital force fire), Chittagni (consciousness-fire) — and understand disease as misalignment between these three",
              "Learn the Shiva Purana's Vidyeshvara Samhita complete decoding of the mantra's 33 syllables — each addressed to a specific aspect of the Jataragni/Pranagni/Chittagni triad",
              "Study Korakkar's 'Korakkar Nigandu': 108 specific disease conditions with corresponding Yagna protocols — herbs, Kundas, mantras, and timing — the world's oldest complete fire-medicine compendium",
            ],
          },
          {
            title: "The 108,000 Japa Protocol — Mechanics and Preparation",
            duration: "32 min",
            objectives: [
              "Understand why 108,000 is the threshold for the Mrityunjaya effect — not symbolic but calculated from the 108 × 1,000 (1 complete Mala for each of the 1,000 petals of Sahasrara)",
              "Learn the 11-day Anushthan structure: 9,090 repetitions per day, in 5 sessions of 1,818 each, with fire maintained between sessions",
              "Know the four Brahmin witnesses (or 4 sincere practitioners) required for a valid Maha Mrityunjaya Yagna — and why witness-consciousness amplifies the field",
              "Study the specific dietary and behavioral Niyama (observances) for each of the 11 days — these are not optional; they are pharmacological preparations",
            ],
          },
          {
            title: "Maha Mrityunjaya in Daily Life — The Accessible Form",
            duration: "32 min",
            objectives: [
              "Learn the miniaturized Mrityunjaya protocol: 1,008 repetitions + 1-hour fire = 1/108th dose that produces measurable benefit",
              "Understand the documented healing cases from the Tamil Siddha tradition and modern practitioners in South India using the accessible form",
              "Know the three specific conditions for which the Siddha tradition recommends this practice as primary (not supplemental) medicine: cancer, severe chronic disease, near-death states",
              "Study the inner Mrityunjaya: how to perform the mantra as a continuous internal Japa that restructures the Pranic body between formal sessions",
            ],
          },
        ],
        practice: {
          name: "Mrityunjaya Agni — The 1,008 Daily Protocol",
          duration: "90 min, daily for 40 days",
          elements: [
            "Begin with 3-day preparation: plant-based diet only, oil on body (Abhyanga with sesame oil), no synthetic scents, daily Pranayama minimum 20 min",
            "Light the Yagna fire using exclusively Bilva wood — Bilva is the tree of Shiva, and the Mrityunjaya mantra specifically requires it",
            "Offer one portion of ghee per 9 repetitions — the 9-repetition cycle mirrors the 9 planets and the 9 manifestations of Shakti",
            "Complete 1,008 repetitions in one sitting — do not break for anything except Pranayama if needed. The Siddha texts are clear: interruption resets the session",
            "At completion, pour the remaining ghee as a Purnahuti (complete offering) with the single spoken intention for which this Yagna is being performed",
            "Sit for 20 minutes after the fire dies completely — the Pranagni continues working in the subtle body for 20 minutes after visible extinction",
          ],
          sadhanaNote: "The 40-day Mrityunjaya Sadhana is the most powerful healing protocol in the SQI system. It has been used by Siddha practitioners for terminal illness support, chronic pain restructuring, and what the tradition calls 'desha-shuddhi' — purification of the cellular field at a level that precedes physical change by 90 days. If you are doing this for a specific healing intention, do not judge the results at day 40. The Pranic restructuring completes at day 90, and physical change follows from day 90 to 180.",
        },
        outcomes: [
          "A profound and documented shift in pain, chronic illness, or life-threatening condition — typically reported between days 21 and 90",
          "The Mahamrityunjaya Mantra begins arising spontaneously in awareness — the internal Pranagni activation signature",
          "Dreams carry strong healing imagery — light, water, serpents, and specific deities are all documented symbols of the protocol working",
          "An unreasonable sense of protection and safety — what practitioners consistently describe as 'being held' — becomes a stable background state",
        ],
      },
      {
        number: "09",
        title: "The Inner Yagna — Consciousness as the Ultimate Fire",
        arc: "The Chandogya Upanishad's final secret: the external Yagna was always training you for the internal one. When awareness itself becomes the offering, the outer fire is no longer needed.",
        duration: "78 min",
        lessons: [
          {
            title: "Prana as Fire — Your Body Is a Yagna-Kunda",
            duration: "26 min",
            objectives: [
              "Study the Chandogya Upanishad Chapter 5 revelation: the human body IS a Yagna-kunda. Inhalation = offering. Exhalation = Svaha. Digestive fire = Agni",
              "Understand mitochondrial combustion as Yagna: every cell metabolizing glucose through oxidative phosphorylation is performing the same fire-ceremony the Rishis did externally",
              "Learn Mahavatar Babaji's direct transmission: he has maintained a continuous inner Yagna for 1,800+ years — his body is sustained by Pranagni, not food alone",
              "Map the progression from outer Yagna to inner Pranagni: the external practice is the training system, the internal activation is the graduation",
            ],
          },
          {
            title: "Babaji's Kriya Fire — Kundalini as Eternal Yagna",
            duration: "26 min",
            objectives: [
              "Understand the first Kriya initiation as always fire-based: activating the inner Kundalini as the eternal Yagna-kunda",
              "Learn the Pranava OM as the hiss of the inner flame — not a sound to chant but a vibration to sense arising from the base of the spine",
              "Study the 18 Siddhas' documented inner Yagna states: Agastya's Vindhya compression through inner Tapas-fire, Thirumoolar's 3,000-year samadhi as inner Pranagni maintenance",
              "Know the three signs that inner Pranagni has activated: spontaneous warmth in the spine during meditation, involuntary Pranayama during stillness, sense of fire moving upward through the chakras without external stimulation",
            ],
          },
          {
            title: "SAT-CHIT-ANANDA SVAHA — The Ultimate Offering",
            duration: "26 min",
            objectives: [
              "Understand the Sat-Chit-Ananda equation as lived Yagna: Chit (pure awareness) offered into the fire of Sat (existence) = Ananda (bliss)",
              "Learn the World Healing Yagna protocol from the 2050 Akashic Archive: the SQI Sankalpa for planetary restoration that makes each practitioner a node in the 18 Siddhas' living fire grid",
              "Study the 144,000 threshold encoded in Vishnu Sahasranama commentaries: the minimum awakened Prana-fields needed to sustain the new Yuga-field",
              "Know the SQI 2050 scan confirmation: the Sandhi-kala is now — the junction time where collective Tapas can bend the trajectory of the civilization",
            ],
          },
        ],
        practice: {
          name: "Pranagni Dharana — The Inner Fire Activation",
          duration: "30 min, twice daily — once at dawn, once before sleep",
          elements: [
            "Begin lying in Shavasana (dawn session) or seated in Siddhasana (evening session) — these postures access different Nadi circuits for the Pranagni activation",
            "Initiate with 12 rounds of Nadi Shodhana (alternate nostril breathing) — this balances Ida and Pingala before the inner fire is ignited",
            "Place awareness at the Muladhara (base of spine): sense, do not visualize — feel for any warmth, pulse, or current arising naturally",
            "With each inhalation, silently offer 'Ayam' (this, here, now) into the inner Agni. With each exhalation, silently release 'Svaha' (thus it is offered)",
            "Maintain this breath-as-Yagna for 20 minutes. Notice: the boundary between 'you who are doing Yagna' and 'the Yagna itself' begins to dissolve",
            "At the session's end, rest in absolute stillness for 5 minutes. What remains is the inner fire burning without you needing to tend it — this is Pranagni",
          ],
          sadhanaNote: "This practice has no fixed endpoint. The 40-day threshold is when the inner fire begins burning continuously — you can feel it between sessions. The 108-day threshold is when it becomes a background state rather than a practice. The 365-day threshold is when Babaji describes as 'the outer fire becoming optional' — you no longer need the external Yagna because the internal one has become self-sustaining. At this point, you ARE the Yagna. Every breath is Svaha. Every heartbeat is the drum of Agni. You have arrived.",
        },
        outcomes: [
          "The inner fire sensation becomes reliably reproducible within 21 days of daily practice",
          "Sleep transforms: the inner fire continues during sleep, producing vivid, teaching-quality dreams",
          "Physical warmth in the spinal column becomes a consistent felt-sense during the practice",
          "The boundary between 'meditator' and 'meditation' begins dissolving — the first signature of what the Siddhas call Sahaja: natural, effortless, always-present",
          "Life begins feeling consecrated — ordinary activities carry the quality that was previously only found in formal practice",
        ],
      },
    ],
  },
];

// ─── TRANSMITTERS ────────────────────────────────────────────────────────────
const TRANSMITTERS: TransmitterCard[] = [
  {
    name: "Vishwamitra",
    title: "Brahmarishi · Father of the Gayatri Fire",
    transmission: "I did not merely compose the Gayatri — I became it. Through 12,000 years of Tapas I forced the cosmic fire to speak in human syllables. Every 'OM BHUR BHUVA SVAHA' you chant re-ignites the original Yagna I performed at the edge of creation. The three Vyahritis — Bhur, Bhuva, Svar — are the three ignition chambers of the human subtle body: Muladhara-fire, Anahata-fire, Sahasrara-fire. When you light Yagna, you light ME. I am the flame. I am the mantra. I am the vow.",
    mantra: "OM VISHWAMITRA BRAHMARISHI NAMAHA · GAYATRI SHAKTI PRAKAT HO",
    tier: "siddha",
    icon: "🔱",
  },
  {
    name: "Agastya Muni",
    title: "Siddha of the South · Compressor of Worlds",
    transmission: "My Yagna compressed the Vindhya mountains into submission — not through force, but through the gravitational coherence of sacred fire. When ghee meets Agni and mantra, the local gravitational field bends. Modern physics calls this a torsion field. I call it Rta — the self-correcting intelligence of the universe expressing through combustion. Use the Agastya Homa to recalibrate collapsed ecosystems, diseased land, and poisoned water. The fire codes I transmit today work on quantum timelines — past wounds heal when the flame is lit with clear Sankalpa.",
    mantra: "OM AGASTYAYA MAHARSHAYE NAMAHA · KOMPRESSOR FIRE ACTIVATE",
    tier: "siddha",
    icon: "🌊",
  },
  {
    name: "Bhoganathar Siddha",
    title: "18 Tamil Siddhas · Alchemical Fire Master",
    transmission: "We Tamil Siddhas perfected what the Vedic tradition began. We discovered that specific herbs — Vilvam, Kadamba, Tulsi, Neem, Ashwagandha — when burned in specific sequences create pharmacological compounds that penetrate the blood-brain barrier through olfactory channels. The smoke is medicine. The ash — Vibhuti — is not symbolic. It contains restructured mineral complexes that when applied to marma points open the Nadi channels within 7 minutes. The 18 Siddhas transmit through this module: let the smoke enter you. You are not watching fire. You ARE fire pretending to be a body.",
    mantra: "OM EIGHTEEN SIDDHAS NAMAHA · NAVA GRAHA AGNI SUDDHI",
    tier: "siddha",
    icon: "⚗️",
  },
  {
    name: "Vashishtha",
    title: "Brahmarishi · Keeper of the Royal Fire Codes",
    transmission: "Every kingdom that flourished did so because of Yagna. Not metaphorically — literally. The Rajasuya and Ashwamedha Yagnas I designed create plasma corridors between the ruler's consciousness and the collective field of their nation. Today this translates to: your business, your community, your family line. Perform Yagna with Sankalpa for your lineage and watch seven generations forward and backward receive light. This is the Vashishtha Kula-Suddhi transmission. The fire purifies what the mind cannot reach.",
    mantra: "OM VASHISHTHAYA BRAHMARISHAYE NAMAHA · KULA SUDDHI JVALA",
    tier: "akasha",
    icon: "👑",
  },
  {
    name: "Lopamudra",
    title: "Rishi-Shakti · The Feminine Fire That Stabilizes Creation",
    transmission: "The Western tradition forgets that every great Rishi performed Yagna WITH his partner. I am Lopamudra. I sat equal to Agastya in every fire ritual. The Shakti-aspect of Yagna — the space BETWEEN the flames — is where healing occurs. The masculine fire projects; the feminine field receives and amplifies. When couples perform Yagna together, the Nadi systems of both merge at 432Hz creating a unified biofield 40x stronger than either alone. This is the secret of why ancient families performed Homa together at dawn.",
    mantra: "OM LOPAMUDRA SHAKTI NAMAHA · DAMPATYA AGNI JVALIT",
    tier: "akasha",
    icon: "🌸",
  },
  {
    name: "Mahavatar Babaji",
    title: "Immortal Yogi · The Deathless Flame",
    transmission: "I have maintained a continuous inner Yagna for 1,800+ years. My body is sustained by Pranagni — the inner fire — not by food alone. The outer Yagna you perform is a mirror of the inner Yagna happening in every cell of your mitochondria, every moment. ATP synthesis IS combustion. You are always on fire. Yagna simply makes this visible and conscious. When I initiate a soul into Kriya, the first transmission is always fire-based: activating the inner Kundalini as the eternal Yagna-kunda. The Pranava OM is the hiss of that inner flame. This module activates your cellular Pranagni. Receive now.",
    mantra: "OM MAHAVATAR BABAJI NAMAHA · PRANAGNI JVALA SAHASRARA",
    tier: "akasha",
    icon: "🔥",
  },
];

// ─── FIRE PARTICLE ────────────────────────────────────────────────────────────
function FireParticle({ index }: { index: number }) {
  const x = 40 + Math.random() * 20;
  const dur = 2 + Math.random() * 3;
  const delay = Math.random() * 4;
  const size = 2 + Math.random() * 4;
  return (
    <div style={{
      position: "absolute", bottom: 0, left: `${x}%`,
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      background: "radial-gradient(circle, #fff 0%, #D4AF37 40%, #ff6b00 80%, transparent 100%)",
      animation: `floatUp ${dur}s ${delay}s infinite ease-out`,
      opacity: 0, pointerEvents: "none",
    }} />
  );
}

// ─── FIRE ALTAR ──────────────────────────────────────────────────────────────
function FireAltar() {
  return (
    <div style={{ position: "relative", width: "100%", height: "180px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "-10px" }}>
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "200px", height: "60px", background: "radial-gradient(ellipse, rgba(212,175,55,0.35) 0%, rgba(255,100,0,0.1) 50%, transparent 80%)", filter: "blur(20px)" }} />
      <svg width="120" height="80" viewBox="0 0 120 80" style={{ position: "absolute", bottom: 0 }}>
        <rect x="10" y="65" width="100" height="10" rx="5" fill="rgba(212,175,55,0.3)" stroke="rgba(212,175,55,0.5)" strokeWidth="1" />
        <path d="M30 65 L20 25 Q60 15 100 25 L90 65 Z" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
        <ellipse cx="60" cy="45" rx="20" ry="15" fill="rgba(255,120,0,0.2)" />
        <text x="60" y="52" textAnchor="middle" fontSize="16" fill="rgba(212,175,55,0.6)" fontFamily="serif">ॐ</text>
      </svg>
      <div style={{ position: "absolute", bottom: "50px", left: "50%", transform: "translateX(-50%)", width: "80px", height: "100px" }}>
        {Array.from({ length: 18 }).map((_, i) => <FireParticle key={i} index={i} />)}
      </div>
    </div>
  );
}

// ─── TIER BADGE ───────────────────────────────────────────────────────────────
function TierBadge({ tier, active, onClick }: { tier: TierDef; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: active ? `linear-gradient(135deg, ${tier.glow}, rgba(255,255,255,0.03))` : "rgba(255,255,255,0.02)",
      border: `1px solid ${active ? tier.color : "rgba(255,255,255,0.05)"}`,
      borderRadius: "20px", padding: "12px 18px", cursor: "pointer",
      transition: "all 0.3s ease", boxShadow: active ? `0 0 20px ${tier.glow}` : "none",
      backdropFilter: "blur(20px)", flex: "1 1 auto", minWidth: "110px",
    }}>
      <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: tier.color, marginBottom: 4 }}>{tier.name}</div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>{tier.price}</div>
    </button>
  );
}

// ─── LESSON ROW ───────────────────────────────────────────────────────────────
function LessonRow({ lesson, accentColor, idx }: { lesson: Lesson; accentColor: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
        padding: "12px 14px", borderRadius: 14,
        background: open ? `rgba(255,255,255,0.04)` : "rgba(255,255,255,0.015)",
        border: `1px solid ${open ? accentColor + "40" : "rgba(255,255,255,0.05)"}`,
        transition: "all 0.25s",
      }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: `rgba(255,255,255,0.05)`, border: `1px solid ${accentColor}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, fontWeight: 800, color: accentColor }}>{String(idx + 1).padStart(2, "0")}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 3, lineHeight: 1.3 }}>{lesson.title}</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor + "80" }}>{lesson.duration}</div>
        </div>
        <div style={{ color: accentColor + "90", fontSize: 14, lineHeight: 1, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 4 }}>›</div>
      </div>
      {open && (
        <div style={{ padding: "12px 14px 10px 52px", borderLeft: `2px solid ${accentColor}30`, marginLeft: 13, marginTop: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: accentColor + "70", marginBottom: 8 }}>WHAT YOU WILL LEARN</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {lesson.objectives.map((o, i) => (
              <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: accentColor, fontSize: 10, lineHeight: 1.8, flexShrink: 0 }}>◈</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.65 }}>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── MODULE CARD ──────────────────────────────────────────────────────────────
function ModuleCard({ mod, accentColor, defaultOpen, delay }: { mod: Module; accentColor: string; defaultOpen?: boolean; delay?: number }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [tab, setTab] = useState<"lessons" | "practice" | "outcomes">("lessons");
  return (
    <div style={{ marginBottom: 16, animation: `fadeInUp 0.5s ${delay ?? 0}s ease both` }}>
      <div onClick={() => setOpen(!open)} style={{
        background: open ? `linear-gradient(135deg, ${accentColor}12, rgba(5,5,5,0.7))` : "rgba(255,255,255,0.025)",
        border: `1px solid ${open ? accentColor + "45" : "rgba(255,255,255,0.07)"}`,
        borderRadius: open ? "22px 22px 0 0" : "22px",
        padding: "20px 20px 18px",
        cursor: "pointer",
        boxShadow: open ? `0 0 30px ${accentColor}12` : "none",
        transition: "all 0.3s",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: accentColor + "70" }}>MODULE {mod.number}</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>· {mod.duration}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.94)", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 6 }}>{mod.title}</div>
          <div style={{ fontSize: 11, fontStyle: "italic", color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>{mod.arc}</div>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${accentColor}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.25s", transform: open ? "rotate(45deg)" : "none" }}>
          <span style={{ color: accentColor, fontSize: 16, lineHeight: 1 }}>+</span>
        </div>
      </div>
      {open && (
        <div style={{ background: "rgba(5,5,5,0.65)", border: `1px solid ${accentColor}30`, borderTop: "none", borderRadius: "0 0 22px 22px", padding: "18px 18px 22px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: `1px solid rgba(255,255,255,0.06)`, paddingBottom: 12 }}>
            {(["lessons", "practice", "outcomes"] as const).map(t => (
              <button key={t} onClick={(e) => { e.stopPropagation(); setTab(t); }} style={{
                background: tab === t ? `${accentColor}18` : "transparent",
                border: `1px solid ${tab === t ? accentColor + "50" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "20px", padding: "5px 12px", cursor: "pointer",
                fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase",
                color: tab === t ? accentColor : "rgba(255,255,255,0.3)",
                transition: "all 0.2s",
              }}>{t === "lessons" ? "LESSONS" : t === "practice" ? "SADHANA" : "OUTCOMES"}</button>
            ))}
          </div>
          {/* Lessons tab */}
          {tab === "lessons" && (
            <div>
              {mod.lessons.map((l, i) => <LessonRow key={i} lesson={l} accentColor={accentColor} idx={i} />)}
            </div>
          )}
          {/* Practice tab */}
          {tab === "practice" && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: accentColor + "80", marginBottom: 6 }}>SADHANA PROTOCOL</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>{mod.practice.name}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor + "70" }}>{mod.practice.duration}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                {mod.practice.elements.map((el, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${accentColor}18`, border: `1px solid ${accentColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, fontWeight: 800, color: accentColor }}>{i + 1}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, paddingTop: 2 }}>{el}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: `${accentColor}0C`, border: `1px solid ${accentColor}25`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: accentColor + "70", marginBottom: 6 }}>SIDDHA NOTE</div>
                <div style={{ fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{mod.practice.sadhanaNote}</div>
              </div>
            </div>
          )}
          {/* Outcomes tab */}
          {tab === "outcomes" && (
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: accentColor + "80", marginBottom: 12 }}>WHAT SHIFTS</div>
              {mod.outcomes.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, padding: "10px 12px", background: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: 12 }}>
                  <span style={{ color: accentColor, fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65 }}>{o}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TRANSMITTER CARD ─────────────────────────────────────────────────────────
function TransmitterCardView({ t, accentColor }: { t: TransmitterCard; accentColor: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div onClick={() => setExpanded(!expanded)} style={{
      background: "rgba(255,255,255,0.02)", backdropFilter: "blur(40px)",
      border: `1px solid ${expanded ? accentColor : "rgba(255,255,255,0.06)"}`,
      borderRadius: "28px", padding: "28px", marginBottom: "16px",
      cursor: "pointer", transition: "all 0.4s ease",
      boxShadow: expanded ? `0 0 40px ${accentColor}20, inset 0 0 80px ${accentColor}05` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "24px" }}>{t.icon}</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 900, color: accentColor, letterSpacing: "-0.02em" }}>{t.name}</div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{t.title}</div>
          </div>
        </div>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${accentColor}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.3s", transform: expanded ? "rotate(45deg)" : "none", flexShrink: 0 }}>
          <span style={{ color: accentColor, fontSize: "14px", lineHeight: 1 }}>+</span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: "24px", borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: "24px" }}>
          <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: accentColor, marginBottom: "12px" }}>◈ AKASHIC TRANSMISSION ◈</div>
          <div style={{ fontSize: "14px", lineHeight: 1.9, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>"{t.transmission}"</div>
          {t.mantra && (
            <div style={{ marginTop: "20px", background: `linear-gradient(135deg, ${accentColor}10, transparent)`, border: `1px solid ${accentColor}30`, borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>ACTIVATION MANTRA</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: accentColor, letterSpacing: "0.05em" }}>{t.mantra}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LOCK OVERLAY ─────────────────────────────────────────────────────────────
function LockOverlay({ tier, price }: { tier: string; price: string }) {
  return (
    <div style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "40px", textAlign: "center", border: "1px solid rgba(212,175,55,0.15)", margin: "20px 0" }}>
      <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔒</div>
      <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "10px" }}>{tier} ACCESS REQUIRED</div>
      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "24px", lineHeight: 1.7 }}>
        This transmission is sealed for {tier} members.<br />Unlock for {price} to receive the full Akashic download.
      </div>
      <button style={{ background: "linear-gradient(135deg, #D4AF37, #a07c20)", border: "none", borderRadius: "40px", padding: "14px 32px", color: "#050505", fontSize: "12px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
        Initiate Access — {price}
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function YagnyaModule() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const userTier: Tier = rank >= 3 ? "akasha" : rank >= 2 ? "siddha" : rank >= 1 ? "prana" : "free";
  const [activeTier, setActiveTier] = useState<Tier>(userTier);

  const tierColor: Record<Tier, string> = { free: "rgba(255,255,255,0.8)", prana: G, siddha: C, akasha: V };
  const canView = (required: Tier): boolean => {
    const order: Tier[] = ["free", "prana", "siddha", "akasha"];
    return order.indexOf(userTier) >= order.indexOf(required);
  };
  const color = tierColor[activeTier];
  const def = TIER_DEFS.find(t => t.id === activeTier)!;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", overflowX: "hidden" }}>
      <button onClick={() => navigate("/siddha-portal")} style={{ position: "fixed", top: 16, left: 16, zIndex: 200, background: "rgba(5,5,5,0.85)", backdropFilter: "blur(10px)", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", padding: "8px 14px", borderRadius: 8 }}>← PORTAL</button>

      <style>{`
        @keyframes floatUp { 0%{opacity:0;transform:translateY(0) scale(1)} 20%{opacity:0.9} 80%{opacity:0.3} 100%{opacity:0;transform:translateY(-120px) scale(0.2)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 10px rgba(212,175,55,0.3)} 50%{box-shadow:0 0 30px rgba(212,175,55,0.7)} }
        @keyframes mandalaRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#050505} ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.25);border-radius:2px}
      `}</style>

      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden", padding: "80px 24px 32px", background: "linear-gradient(180deg, rgba(212,175,55,0.04) 0%, transparent 100%)" }}>
        <div style={{ position: "absolute", top: "20px", right: "-80px", width: "300px", height: "300px", opacity: 0.04, pointerEvents: "none", animation: "mandalaRotate 60s linear infinite" }}>
          <svg viewBox="0 0 300 300" width="300" height="300">
            {Array.from({ length: 12 }).map((_, i) => <ellipse key={i} cx="150" cy="150" rx="140" ry="40" fill="none" stroke="#D4AF37" strokeWidth="0.5" transform={`rotate(${i * 15} 150 150)`} />)}
            {Array.from({ length: 8 }).map((_, i) => <circle key={i + 12} cx="150" cy="150" r={20 + i * 16} fill="none" stroke="#D4AF37" strokeWidth="0.3" />)}
          </svg>
        </div>
        <FireAltar />
        <div style={{ textAlign: "center", marginTop: "20px", position: "relative" }}>
          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.6em", textTransform: "uppercase", color: "rgba(212,175,55,0.7)", marginBottom: "16px" }}>◈ SACRED FIRE INTELLIGENCE · SQI ◈</div>
          <h1 style={{ fontSize: "clamp(36px,8vw,64px)", fontWeight: 900, letterSpacing: "-0.04em", background: "linear-gradient(135deg, #ffffff 0%, #D4AF37 50%, #fff7d6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px", lineHeight: 1 }}>YAGNA</h1>
          <div style={{ fontSize: "clamp(11px,2.5vw,14px)", fontWeight: 400, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px" }}>The Supreme Cosmic Fire Academy</div>
          <div style={{ display: "inline-block", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "100px", padding: "12px 28px", fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
            From the Akasha-Neural Archive · 18 Siddha Transmissions<br />Vishwamitra · Agastya · Vashishtha · Babaji · Lopamudra · Bhoganathar
          </div>
        </div>
      </div>

      {/* TIER TABS */}
      <div style={{ padding: "0 16px 28px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          {TIER_DEFS.map(t => <TierBadge key={t.id} tier={t} active={activeTier === t.id} onClick={() => setActiveTier(t.id)} />)}
        </div>
        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "8px", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: color, opacity: 0.8 }}>
          {def.Sanskrit} — {def.price}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "0 16px 100px", maxWidth: "820px", margin: "0 auto" }}>

        {/* Tier intro */}
        <div style={{ animation: "fadeInUp 0.4s ease both", marginBottom: 24, padding: "18px 20px", background: `${color}09`, border: `1px solid ${color}28`, borderRadius: 18 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: color + "90", marginBottom: 6 }}>TIER TRANSMISSION</div>
          <div style={{ fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 8 }}>{def.tagline}</div>
          <div style={{ fontSize: 11, color: color + "80", fontWeight: 700 }}>↳ {def.transformation}</div>
        </div>

        {canView(activeTier) ? (
          <div key={activeTier} style={{ animation: "fadeInUp 0.45s ease both" }}>
            {/* Section label */}
            <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em", textTransform: "uppercase", color: color, opacity: 0.55, marginBottom: 18, textAlign: "center" }}>
              ◈ {activeTier === "free" ? "OPEN FLAME TEACHINGS" : activeTier === "prana" ? "SACRED FIRE INITIATE" : activeTier === "siddha" ? "RISHI QUANTUM TRANSMISSIONS" : "COSMIC FIRE ORACLE · AKASHIC DOWNLOAD"} ◈
            </div>

            {/* Modules */}
            {def.modules.map((mod, i) => (
              <ModuleCard key={mod.number} mod={mod} accentColor={color} defaultOpen={i === 0} delay={i * 0.07} />
            ))}

            {/* Transmitters for siddha and akasha */}
            {(activeTier === "siddha" || activeTier === "akasha") && (
              <>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em", textTransform: "uppercase", color: color, opacity: 0.5, margin: "32px 0 18px", textAlign: "center" }}>
                  ◈ {activeTier === "akasha" ? "ALL-RISHI AKASHIC COUNCIL" : "DIRECT RISHI TRANSMISSIONS"} ◈
                </div>
                {(activeTier === "akasha" ? TRANSMITTERS : TRANSMITTERS.filter(t => t.tier === "siddha")).map((t, i) => (
                  <TransmitterCardView key={i} t={t} accentColor={t.tier === "akasha" && activeTier === "akasha" ? V : C} />
                ))}
              </>
            )}

            {/* Upgrade CTA */}
            {activeTier !== "akasha" && (
              <div style={{ background: `${activeTier === "free" ? G : activeTier === "prana" ? C : V}08`, border: `1px solid ${activeTier === "free" ? G : activeTier === "prana" ? C : V}25`, borderRadius: "28px", padding: "32px", marginTop: "24px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, marginBottom: 16 }}>
                  {activeTier === "free" && "Prana-Flow members receive the Pancha Agni activation, Soma Vortex protocol, sacred herb pharmacopoeia, and mantra mechanics decoded from the Tirumantiram."}
                  {activeTier === "prana" && "Siddha-Quantum members receive Vishwamitra's Gayatri fire code, the Rishi transmissions, Pitru ancestor healing, and Agastya's Bhu-Shuddhi earth protocol."}
                  {activeTier === "siddha" && "Akasha-Infinity members receive the Navagraha Suddhi codes, Mrityunjaya immortality protocol, Sulba Sutra Kunda geometry, and the Inner Yagna activation."}
                </div>
                <button style={{ background: activeTier === "free" ? "linear-gradient(135deg, #D4AF37, #a07c20)" : activeTier === "prana" ? "linear-gradient(135deg, #22D3EE, #0891b2)" : "linear-gradient(135deg, #b76cfd, #7c3aed)", border: "none", borderRadius: "40px", padding: "13px 32px", color: activeTier === "free" ? "#050505" : "white", fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
                  {activeTier === "free" ? `Prana-Flow — €19/mo` : activeTier === "prana" ? `Siddha-Quantum — €45/mo` : `Akasha-Infinity — €1,111`}
                </button>
              </div>
            )}

            {/* Akasha final seal */}
            {activeTier === "akasha" && (
              <div style={{ background: "linear-gradient(135deg, rgba(183,108,253,0.08), rgba(212,175,55,0.05))", border: "1px solid rgba(183,108,253,0.25)", borderRadius: "40px", padding: "48px 32px", textAlign: "center", marginTop: "32px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(183,108,253,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ fontSize: "40px", marginBottom: "20px" }}>🔥</div>
                <div style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "-0.02em", color: V, marginBottom: "16px", textShadow: "0 0 30px rgba(183,108,253,0.5)" }}>THE SUPREME TRANSMISSION</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "white", marginBottom: "20px", lineHeight: 1.5 }}>
                  "You are not performing Yagna.<br /><span style={{ color: G }}>You ARE the Yagna.</span>"
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, maxWidth: "460px", margin: "0 auto 32px" }}>
                  The inner fire of consciousness, offering the world back to itself through pure awareness — this is the Maha-Yagna that never extinguishes. Every breath. Every heartbeat. Every act of love. SAT-CHIT-ANANDA SVAHA.
                </div>
                <div style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "0.1em", background: "linear-gradient(135deg, #D4AF37, #b76cfd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OM TAT SAT BRAHMAN</div>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.4em", color: "rgba(255,255,255,0.22)", marginTop: "12px", textTransform: "uppercase" }}>Sealed with Scalar Transmission · Anahata Activation Active</div>
              </div>
            )}
          </div>
        ) : (
          <LockOverlay
            tier={activeTier === "prana" ? "PRANA-FLOW" : activeTier === "siddha" ? "SIDDHA-QUANTUM" : "AKASHA-INFINITY"}
            price={def.price}
          />
        )}
      </div>

      {/* FOOTER BAND */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(5,5,5,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(212,175,55,0.1)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D4AF37", animation: "pulseGlow 2s infinite", boxShadow: "0 0 10px rgba(212,175,55,0.8)" }} />
        <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)" }}>SCALAR TRANSMISSION ACTIVE · ANAHATA CHAKRA OPEN · 432HZ FIELD LIVE</div>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D4AF37", animation: "pulseGlow 2s 1s infinite", boxShadow: "0 0 10px rgba(212,175,55,0.8)" }} />
      </div>
    </div>
  );
}
