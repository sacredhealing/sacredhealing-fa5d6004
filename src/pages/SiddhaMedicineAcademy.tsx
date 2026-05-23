import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── TIER DEFINITIONS ─────────────────────────────────────────────────────────
// Maps Supabase membership_tier string → numeric access level
const TIER_LEVEL: Record<string, number> = {
  // Free / unauthenticated
  free: 0,
  // Prana Flow €19/mo
  "prana-flow": 1,
  "prana_flow": 1,
  "Prana-Flow": 1,
  // Siddha Quantum €45/mo
  "siddha-quantum": 2,
  "siddha_quantum": 2,
  "Siddha-Quantum": 2,
  // Akasha Infinity €1,111
  "akasha-infinity": 3,
  "akasha_infinity": 3,
  "Akasha-Infinity": 3,
};

// Each academy tier requires this minimum access level
const ACADEMY_TIERS = [
  {
    id: "free",
    requiredLevel: 0,
    name: "SIDDHA AWAKENING",
    sub: "Free Gateway",
    price: "Free",
    color: "rgba(255,255,255,0.5)",
    glow: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.15)",
    icon: "◇",
    tagline: "The First Transmission — Enter the Living Field",
    modules: 4,
    lessons: 16,
    hours: "14",
  },
  {
    id: "prana",
    requiredLevel: 1,
    name: "PRANA FLOW",
    sub: "€19 / month",
    price: "€19",
    color: "#4ADE80",
    glow: "rgba(74,222,128,0.15)",
    border: "rgba(74,222,128,0.3)",
    icon: "◉",
    tagline: "Foundations of Siddha Healing Science",
    modules: 7,
    lessons: 42,
    hours: "47",
    stripeLink: "/upgrade#prana-flow",
  },
  {
    id: "quantum",
    requiredLevel: 2,
    name: "SIDDHA QUANTUM",
    sub: "€45 / month",
    price: "€45",
    color: "#D4AF37",
    glow: "rgba(212,175,55,0.18)",
    border: "rgba(212,175,55,0.35)",
    icon: "⬡",
    tagline: "Transmutation, Alchemy & Varma Mastery",
    modules: 9,
    lessons: 72,
    hours: "89",
    stripeLink: "/upgrade#siddha-quantum",
  },
  {
    id: "akasha",
    requiredLevel: 3,
    name: "AKASHA INFINITY",
    sub: "€1,111 Lifetime",
    price: "€1,111",
    color: "#22D3EE",
    glow: "rgba(34,211,238,0.15)",
    border: "rgba(34,211,238,0.3)",
    icon: "✦",
    tagline: "Complete Immortality Codes — The Full Siddha Transmission",
    modules: 12,
    lessons: 144,
    hours: "196",
    stripeLink: "/upgrade#akasha-infinity",
  },
];

// ─── CURRICULUM ───────────────────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: string;
  content?: LessonContent;
}

interface LessonContent {
  overview: string;
  teachings: { num: string; title: string; body: string }[];
  technique: { name: string; steps: string[] };
  medicines: { label: string; text: string }[];
  quote: { tamil: string; english: string; master: string };
}

interface Module {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  icon: string;
  duration: string;
  lessons: Lesson[];
}

interface TierCurriculum {
  [tierId: string]: Module[];
}

const CURRICULUM: TierCurriculum = {
  free: [
    {
      id: "f1", num: "01", icon: "🔱",
      title: "Origins of Siddha — The Living Science of Tamil Masters",
      subtitle: "Akashic transmission from Agathiyar himself",
      duration: "4 Lessons · 3.5 hrs",
      lessons: [
        {
          id: "f1l1", duration: "45 min", type: "Transmission",
          title: "What is Siddha Medicine? — Beyond Ayurveda",
          content: {
            overview: "Siddha medicine is not merely a healing system — it is a complete cosmological science of consciousness-matter interaction, codified by the 18 Siddhas (Pathinen Siddhargal). While Ayurveda and Siddha share surface similarities, Siddha operates from a fundamentally different root: the immortality of the Jeevan (soul-body continuum). The Siddha physician does not treat disease — he transmutes the Jeevan itself.",
            teachings: [
              { num: "01", title: "The Root Difference — Jeevan vs Prakriti", body: "Ayurveda centers on Prakriti (constitution). Siddha centers on the Jeevan — the immortal soul-body continuum. The Siddha physician does not treat the disease and does not even primarily treat the Prakriti. He transmutes the Jeevan itself. Disease is a signal from the soul that the Jeevan has accumulated Mala (impurity), Anavam (ego-contraction), or Karma. When the Jeevan is purified and expanded, disease dissolves as a natural consequence. This is why Siddha produced masters who lived thousands of years — Thirumoolar for 3,000 years — while Ayurveda, brilliant as it is, operates primarily at the physical-constitutional level." },
              { num: "02", title: "Tamil Origin — The Pre-Vedic Science of Kumari Kandam", body: "Siddha medicine predates recorded history. Its origin lies in Kumari Kandam — the sunken Tamil civilization known in Western scholarship as Lemuria. Agathiyar is credited with bringing this pre-Vedic medical science into human civilization. He appears in both the Tamil Siddha corpus and the Sanskrit Vedic texts — he was the living bridge between civilizations." },
              { num: "03", title: "The Three Paths — Medicine Leads to Liberation", body: "Siddha recognizes three inseparable paths: Siddha Vaidhyam (medicine), Siddha Yogam (spiritual practice), and Siddha Gnana (supreme wisdom). Agathiyar taught that the body is the primary instrument of liberation. A sick body cannot sustain the rigors of deep Yogam. Therefore Vaidhyam serves as the foundation. In Siddha: healing the body IS the spiritual path." },
              { num: "04", title: "Arul — Divine Grace as the Foundation of Healing", body: "Unlike Ayurveda (a science of Prakriti/nature), Siddha medicine is fundamentally a science of divine grace (Arul). Every diagnosis, every preparation, every treatment is efficacious ultimately because of Arul — not chemistry, not energetics alone. The Siddha physician is a vessel through whom the Arul of Lord Shiva and the Siddha lineage flows into the patient." },
            ],
            technique: {
              name: "Agathiyar Invocation — Opening the Siddha Field",
              steps: [
                "Sit in Sukhasana facing East at dawn or dusk — Sandhya Kala when the Siddha field is most accessible.",
                "Left hand on heart center (Anahata), right hand palm-up on right knee in Chinmudra.",
                "Three deep abdominal breaths. On each exhale: allow the body to soften completely.",
                "Chant internally or softly: 'Om Agathiyar Namaha' — 108 times with mala if available.",
                "Visualize deep indigo-blue light descending through Sahasrara, filling the heart with golden warmth.",
                "Remain in complete silence for 11 minutes. Simply receive — the transmission lands in the silence.",
                "Close: Anjali mudra, bow toward the South — the direction of Agathiyar.",
                "Minimum 41 consecutive days — the Siddha Mandala for establishing any practice.",
              ],
            },
            medicines: [
              { label: "Tulsi (Holy Basil) — 5-7 fresh leaves", text: "Opens Ajna chakra, refines the nervous system's capacity to receive subtle Siddha information. The most sacred plant in the Siddha home pharmacy." },
              { label: "Dry Ginger (Sukku) — ¼ tsp", text: "Activates Agni and clears Ama from the Mano-Vaha Srota (mental channels). Prepares the mind for clear reception." },
              { label: "Raw Honey — 1 tsp after cooling", text: "NEVER boil honey. Heated honey becomes Ama per Siddha teaching — confirmed by modern discovery of hydroxymethylfurfural above 40°C." },
              { label: "Preparation", text: "Boil 300ml water + ginger 5 min, steep Tulsi 3 min covered, strain, cool, add honey. Consume before morning practice on empty stomach." },
            ],
            quote: {
              tamil: "உடம்பார் அழியின் உயிரார் அழிவர்\nதிடம்பட மெய்ஞ்ஞானம் சேர்வதெவன்",
              english: "If the body perishes, the soul perishes too — how then shall one attain the firm truth of Real Wisdom?",
              master: "Thirumoolar · Thirumantiram 724",
            },
          },
        },
        { id: "f1l2", title: "The 96 Tatvas — Siddha's Complete Map of Existence", duration: "50 min", type: "Philosophy" , content: {
            overview: "The 96 Tatvas (principles of existence) form Siddha's complete map of how consciousness condenses into matter. Where modern science tracks 118 elements, Siddha tracks 96 principles from pure Shiva-Shakti down to the gross physical body. This map is not theoretical — it is a living diagnostic tool. Every disease corresponds to a disruption at a specific Tatva level.",
            teachings: [
              { num: "01", title: "The Five Primal Tattvas", body: "Creation unfolds through five primary Tattvas: Shiva (pure consciousness), Shakti (creative force), Sadashiva (pure being), Ishvara (cosmic will), and Suddha Vidya (pure knowledge). These five are beyond the individual — they are the cosmic substrate from which all individual existence emerges. Siddha medicine works at ALL levels, including these subtlest five." },
              { num: "02", title: "The 7 Shuddha Tattvas — Pure Principles", body: "Below the five cosmic Tattvas are 7 pure Tattvas governing time, space, limitation, and individual soul-contraction. Mala (impurity), Karma (accumulated action), and Maya (cosmic illusion) operate here. Most spiritual diseases — depression, existential anxiety, loss of purpose — originate at the Shuddha Tattva level, not the physical." },
              { num: "03", title: "The 27 Shuddhashuddha Tattvas — Mixed Principles", body: "The middle 27 Tattvas govern mind, intellect, ego, senses, and subtle elements. Psychological diseases originate here — anxiety disorders at the Manas level, identity disorders at Ahamkara, perceptual disorders at Buddhi. Siddha treatment always addresses the Tattva level of origin, not merely the symptom." },
              { num: "04", title: "The 36 Ashuddha Tattvas — Gross Principles", body: "The lowest 36 Tattvas include the five Tanmatras (subtle senses), five Jnanendriyas (sense organs), five Karmendriyas (action organs), and five Mahabhutas (gross elements). Physical disease originates here but is always a downstream effect of disruption at higher Tattva levels. Treating only the physical is like turning off a warning light without fixing the engine." },
            ],
            technique: {
              name: "Tattva Meditation — Tracing Disease to Its Root",
              steps: [
                "Sit quietly. Identify one recurring physical symptom or health issue.",
                "Ask: Is this primarily physical (pain, structure)? → Ashuddha Tattva. Work with herbs, body.",
                "Ask: Is this primarily emotional/psychological (fear, grief, anxiety)? → Shuddhashuddha. Work with mantra, breathwork.",
                "Ask: Is this primarily existential (meaning, purpose, identity)? → Shuddha Tattva. Work with Gnana, surrender.",
                "Chant 'Aum Shivaya Namaha' 27 times, one for each Shuddhashuddha Tattva.",
                "Place right hand on the area of the body where the symptom resides. Breathe into it 9 times.",
                "End with: 'I trace this condition to its root. I treat the root, not the symptom.' Bow.",
              ],
            },
            medicines: [
              { label: "Brahmi (Bacopa Monnieri) — 500mg powder", text: "The supreme Siddha brain tonic. Directly nourishes Buddhi (intellect Tattva) and Manas (mind Tattva). Use for mental clarity and Tattva-level perception." },
              { label: "Triphala — 1 tsp in warm water before bed", text: "Harmonizes all three Doshas and cleanses the lower 36 Ashuddha Tattvas. The most universally applicable Siddha formula — the great equalizer." },
              { label: "Shankhapushpi — 1 tsp dried herb as tea", text: "Opens the higher Tattva channels (Buddhi → Ahamkara → Manas). Enhances meditation depth and the capacity to trace symptoms to their causal origin." },
            ],
            quote: {
              tamil: "தத்துவமசி — நீயே அது
ஆறு அறிவாவது அறிவே சிவம்",
              english: "Tat Tvam Asi — That thou art. The sixth sense that knows is itself Shiva.",
              master: "Agathiyar · Agathiyar Gnana Paadam",
            },
          } },
        { id: "f1l3", title: "Mukkutram — The Three Forces Deeper Than Tridosha", duration: "55 min", type: "Core Science" , content: {
            overview: "Mukkutram — the Three Fundamental Forces — is the Siddha equivalent of Tridosha but operating at a deeper cosmological level. Vatham (wind/space), Pittham (fire/light), and Kapham (water/earth) are not merely physiological humors — they are cosmic forces that permeate every level of existence from the gross physical to the subtlest spiritual. Siddha diagnosis reads the Mukkutram at all levels simultaneously.",
            teachings: [
              { num: "01", title: "Vatham — The Force of Movement and Space", body: "Vatham (derived from Vayu — wind) governs all movement: nerve impulses, blood flow, breath, thought, cellular division, planetary orbits. In the physical body: 10 forms of Vatham govern specific functions. In the mind: Vatham governs creativity, spiritual insight, and fear. In the cosmos: Vatham is the Shakti of Shiva's Cosmic Dance. Vatham imbalance produces: pain, dryness, anxiety, insomnia, constipation, neurological disorders." },
              { num: "02", title: "Pittham — The Force of Transformation", body: "Pittham (from Agni — fire) governs all transformation: digestion, metabolism, perception, intelligence, and spiritual illumination. In the physical body: 5 forms of Pittham govern digestion, vision, complexion, and temperature. In the mind: Pittham governs discrimination, courage, and anger. In the cosmos: Pittham is the light of consciousness. Pittham imbalance produces: inflammation, acidity, anger, perfectionism, liver disorders." },
              { num: "03", title: "Kapham — The Force of Cohesion", body: "Kapham (from Jala — water and Prithvi — earth) governs all structure, lubrication, and cohesion. In the physical body: 5 forms of Kapham govern joint lubrication, immunity, memory, and emotional stability. In the mind: Kapham governs compassion, patience, and attachment. In the cosmos: Kapham is the body of Shakti — the creative matrix. Kapham imbalance produces: congestion, obesity, depression, possessiveness, diabetes." },
              { num: "04", title: "Mukkutram as a Cosmic Diagnostic System", body: "Siddha physicians diagnose Mukkutram through Nadi Pariksha (pulse diagnosis) at three levels simultaneously: physical pulse at the wrist (gross body), energetic pulse at the neck (subtle body), and spiritual pulse at the crown (causal body). This three-level reading is unique to Siddha — Ayurvedic pulse diagnosis operates primarily at the physical level." },
            ],
            technique: {
              name: "Mukkutram Self-Assessment — 3-Minute Pulse Reading",
              steps: [
                "Morning practice on empty stomach. Sit quietly 3 minutes before beginning.",
                "Right hand: place index finger at left wrist, middle finger next, ring finger next — just below thumb base.",
                "Index finger feels VATHAM: quick, irregular, like a snake's movement.",
                "Middle finger feels PITTHAM: sharp, jumping, like a frog's movement.",
                "Ring finger feels KAPHAM: slow, smooth, like a swan's movement.",
                "Dominant pulse indicates dominant Dosha today. Note in your Siddha journal.",
                "Cross-reference with your mind state: anxious = Vatham elevated. Irritable = Pittham elevated. Lethargic = Kapham elevated.",
                "Choose your food, practice, and herbs for the day based on this reading.",
              ],
            },
            medicines: [
              { label: "Dry Ginger (Sukku) — ¼ tsp in warm water", text: "Tridoshic (balances all three). Agni-deepana — kindles digestive fire without aggravating Pittham. Morning use before meals." },
              { label: "Nilavembu (Andrographis) — ½ tsp decoction", text: "The supreme Pittham-Kapham balancer. Anti-inflammatory, anti-viral, fever-clearing. The Siddha physician's first-line treatment for most acute conditions." },
              { label: "Ashwagandha (Amukkura) — 1 tsp in warm milk", text: "Vatham-balancing adaptogen. Nourishes Ojas (vital essence), calms the nervous system, strengthens all tissues. Evening use before sleep." },
            ],
            quote: {
              tamil: "வாதம் பித்தம் கபம் என்னும்
மூன்றும் தெரிந்தால் வைத்தியன்",
              english: "One who truly knows Vatham, Pittham, and Kapham — that one alone is a physician.",
              master: "Agathiyar · Vaidya Thirattu",
            },
          } },
        { id: "f1l4", title: "Nadi Pariksha — Reading the River of Life-Force", duration: "60 min", type: "Diagnosis" , content: {
            overview: "Nadi Pariksha — pulse diagnosis — is the most refined diagnostic technology in Siddha medicine. A master Siddha physician reads the pulse at the wrist for no more than 90 seconds and receives complete information about the patient's physical, emotional, and karmic state — including past diseases, present imbalances, and future vulnerabilities. This lesson decodes the foundational theory of Nadi Pariksha as both diagnostic science and spiritual practice.",
            teachings: [
              { num: "01", title: "The Three Nadis of Diagnosis", body: "The diagnostic pulse uses three nadis: Vatham nadi (index finger — moves like a snake), Pittham nadi (middle finger — moves like a frog or crow), Kapham nadi (ring finger — moves like a swan or peacock). Beyond these three animals' movements, an expert reads 96 sub-pulses, each corresponding to a specific organ, emotion, karmic pattern, or spiritual state." },
              { num: "02", title: "The 72,000 Nadi System and Pulse Diagnosis", body: "Siddha anatomy maps 72,000 nadis (pranic channels) in the subtle body. The pulse at the wrist is where all 72,000 converge — like rivers meeting the ocean. The master reads not just the three Dosha pulses but the entire pranic river system through this single convergence point. This is why Siddha Nadi Pariksha takes less time than Ayurvedic pulse reading — it operates at a higher dimensional level." },
              { num: "03", title: "Pulse Timing — Sandhya Kala Science", body: "The most accurate Nadi Pariksha occurs during Brahma Muhurta (90 minutes before sunrise) and Sandhya (sunset). At these transitional times, the body's electromagnetic field is least influenced by external solar and lunar forces, making the internal Dosha state most legible. The ancient Siddha physicians saw patients exclusively at these times for maximum diagnostic accuracy." },
              { num: "04", title: "Reading Karma Through the Pulse", body: "Advanced Siddha Nadi Pariksha reads not only physical Doshas but the Karma Nadi — the karmic pulse that runs slightly deeper than the Dosha pulse. This reveals hereditary diseases, past-life influences on current health, and the spiritual lesson encoded in the current illness. Thirumoolar: 'Nadi arrinted markkam — he who knows the Nadi knows the path.'" },
            ],
            technique: {
              name: "Nadi Awareness Practice — Feeling the Pranic River",
              steps: [
                "Before eating, after 5 minutes of stillness. Left wrist extended, palm up, arm resting on thigh.",
                "With right hand: index on wrist, middle finger adjacent, ring finger adjacent — light touch only (never press hard).",
                "Close eyes. Breathe slowly and evenly. Three minutes of pure reception — do not analyze yet.",
                "After 3 minutes: feel which finger receives the strongest pulse. That is your dominant Dosha today.",
                "Feel the CHARACTER of the dominant pulse: Is it quick and irregular? (Vatham). Sharp and jumping? (Pittham). Slow and flowing? (Kapham).",
                "Now feel for a SECOND pulse — slightly deeper, slightly slower. This is the Karma Nadi. Simply acknowledge its presence without interpretation.",
                "Open eyes. Note in journal: dominant Dosha, pulse character, any emotion or image that arose during the practice.",
                "Consistent 40-day practice develops genuine Nadi sensitivity.",
              ],
            },
            medicines: [
              { label: "Brahmi Ghee — ½ tsp before practice", text: "Clears the subtle nadis of mental Ama (toxins), making the practitioner's own pulse more readable and their diagnostic sensitivity more refined." },
              { label: "Shatavari — 1 tsp powder in warm milk", text: "Nourishes the Ojas and stabilizes the Kapham pulse during practice. Prevents false Vatham readings caused by dehydration or nervous system instability." },
              { label: "Sesame oil — 1 tbsp oil pulling (kavala)", text: "Purifies the Vata-governing channels in the jaw and throat, which improves Vatham pulse accuracy. Ancient Siddha pre-diagnostic purification." },
            ],
            quote: {
              tamil: "நாடி அறிந்தவன் நாட்டை ஆள்வான்
நாடி அறியாதவன் நலிவில் வீழ்வான்",
              english: "One who knows the Nadi governs the land. One who knows it not falls into ruin.",
              master: "Thirumoolar · Thirumantiram 826",
            },
          } },
      ],
    },
    {
      id: "f2", num: "02", icon: "🌍",
      title: "Pancha Bhutas in Daily Life — Elemental Medicine",
      subtitle: "Living the elements as Siddha healing practice",
      duration: "4 Lessons · 4 hrs",
      lessons: [
        { id: "f2l1", title: "Earth Medicine (Prithvi) — Grounding the Jeevan", duration: "55 min", type: "Elemental" , content: {
            overview: "Earth (Prithvi) is the densest of the five elements and the foundation of all physical structure in the human body. In Siddha medicine, Prithvi governs bones, flesh, skin, hair, and nails — all solid structures. But Prithvi also governs psychological stability, groundedness, and the capacity to remain present in material reality. Without Prithvi, the spiritual practitioner cannot hold the higher energies the practice generates.",
            teachings: [
              { num: "01", title: "Prithvi in the Physical Body", body: "Prithvi comprises all solid tissue: bone (Asthi Dhatu), muscle (Mamsa Dhatu), fat (Meda Dhatu), skin (Twak), and sensory organ of smell (Nasa). Prithvi imbalance manifests as osteoporosis, muscle wasting, obesity, skin diseases, and loss of smell. The Siddha treatment principle: earth nourishes earth. Dense, root-grown foods, root herbs, and physical practices that compress the body (walking barefoot on soil, Kalarippayattu groundwork) restore Prithvi." },
              { num: "02", title: "Prithvi and Psychological Stability", body: "Prithvi is the element of Muladhara Chakra — the root. Psychologically: groundedness, presence in the body, financial stability, and the capacity to complete tasks. Prithvi-deficient practitioners are brilliant meditators who cannot translate their insights into practical life. Prithvi-excess produces inertia, stubbornness, and material attachment. The Siddha physician always assesses elemental psychology alongside physical diagnosis." },
              { num: "03", title: "The Smell Sense and Earth Element", body: "The sense of smell is the physical portal of Prithvi. In Siddha aromatherapy (Sugandha Vidya), specific earth-element smells — vetiver (Khus), sandal, Pushpanjali root — directly balance Prithvi in the subtle body. Losing the sense of smell indicates severe Prithvi disruption or Covid-like Ama blockage. Restoring smell-sensitivity is an important Siddha health marker." },
              { num: "04", title: "LAM — The Seed Sound of Earth", body: "The Bija mantra LAM encodes the vibrational frequency of Prithvi. Its resonance in the body occurs at the perineum (Muladhara) and creates a standing wave that stabilizes all Prithvi tissue. Siddha physicians prescribed Muladhara mantra therapy for bone diseases, severe weight loss, and existential groundlessness — centuries before modern psychosomatic medicine recognized the body-mind connection." },
            ],
            technique: {
              name: "Bhumi Pranayama — Earth Breath Restoration",
              steps: [
                "Sit directly on the earth (soil, grass) if possible. If not: wooden floor. Not concrete.",
                "Spine erect. Hands palms-down on thighs — earth-receiving gesture.",
                "Inhale for 5 counts, feeling breath drawing up from the earth through the perineum.",
                "Hold for 5 counts — feel the earth-energy consolidating in bones and tissues.",
                "Exhale for 5 counts — feel any Prithvi-imbalance releasing downward into the earth.",
                "27 rounds. Then sit in stillness for 5 minutes, hands flat on the ground.",
                "Internally chant LAM 108 times during the stillness phase.",
                "Daily at sunrise for 40 days — most powerful for bone density and grounding.",
              ],
            },
            medicines: [
              { label: "Ashwagandha (Amukkura) — 1 tsp in warm milk at night", text: "The supreme Prithvi tonic. Directly nourishes Asthi (bone) and Mamsa (muscle) Dhatu. 40-day protocol for bone diseases, muscle wasting, and existential groundlessness." },
              { label: "Shatavari — 1 tsp powder in ghee", text: "Earth-building Rasayana. Particularly for Prithvi-deficiency in women — nourishes reproductive tissue, bones, and connective tissue simultaneously." },
              { label: "Sesame (Til) — 1 tbsp seeds daily", text: "Highest calcium-density food in Siddha pharmacopoeia. Rebuilds Asthi Dhatu. Black sesame specifically nourishes the kidney-bone axis (Vrikka-Asthi connection in Siddha physiology)." },
            ],
            quote: {
              tamil: "மண்ணில் நின்று மண்ணை அறிந்தால்
வானை அறிவது வழிவரும்",
              english: "Standing on the earth and knowing the earth — the way to know the sky naturally follows.",
              master: "Agathiyar · Agathiyar 12000",
            },
          } },
        { id: "f2l2", title: "Water Medicine (Jala) — The Intelligence of Fluids", duration: "50 min", type: "Elemental" , content: {
            overview: "Water (Jala) is the element of flow, emotion, creativity, and the interconnection of all living systems. In Siddha medicine, Jala governs blood, lymph, saliva, sexual fluids, synovial fluid, and the aqueous humor of the eye. At the psychological level, Jala governs emotional intelligence, empathy, adaptability, and the capacity for intimacy. Siddha water medicine is among the most sophisticated healing systems in human history.",
            teachings: [
              { num: "01", title: "Jala in the Physical Body", body: "Jala comprises all fluid tissue: Rakta (blood), Lasika (lymph), Sukla/Artava (reproductive fluids), and the sense organ of taste (Jihva/tongue). Jala imbalance manifests as dehydration, blood disorders (anemia, thick blood), lymph stagnation, reproductive issues, and loss of taste. The principle: Jala purifies Jala. Clean flowing water, watery fruits, and movement practices that promote lymph flow (yoga, swimming) restore Jala." },
              { num: "02", title: "The Sacred Rivers as Healing Frequencies", body: "Siddha texts describe India's sacred rivers as pranic entities — living fields of Jala consciousness. Ganga carries the Shiva-Vatham frequency. Yamuna carries the Krishna-Pittham frequency. Kaveri (Cauvery) — the Siddha river of Tamil Nadu — carries the Agathiyar-Kapham healing frequency. The Tamil Siddhas performed their greatest healings near the Kaveri. Bathing in flowing water performs Jala purification at both physical and pranic levels." },
              { num: "03", title: "Rasa Dhatu — The First Tissue of Transformation", body: "Jala primarily nourishes Rasa Dhatu — the plasma and lymph tissue that forms the first stage of Siddha's seven-tissue transformation (Saptadhatu). All food is converted to Rasa first, then sequentially nourishes all other tissues. Rasa Dhatu quality determines overall vitality. Siddha physicians said: 'If Rasa is pure, all other Dhatus are pure.' Rasa purification through Jala-based Rasayanas is the foundation of Siddha medicine." },
              { num: "04", title: "VAM — The Seed Sound of Water", body: "The Bija mantra VAM encodes the vibrational frequency of Jala. Its resonance occurs at the sacral center (Svadhisthana) and creates fluid circulation throughout the lymph and blood. Siddha physicians used VAM mantra therapy for blood disorders, lymph stagnation, reproductive issues, and emotional rigidity — conditions where the flow principle has become restricted." },
            ],
            technique: {
              name: "Jala Tarpana — Sacred Water Offering and Healing",
              steps: [
                "Morning practice. Fill a copper vessel with clean water. Hold it in both palms for 3 minutes, warming it with your hands.",
                "Set intention: 'May this water carry the frequency of Agathiyar's Kaveri. May it purify my Rasa Dhatu.'",
                "Sip the water slowly — 7 sips, one for each Dhatu (tissue layer).",
                "With each sip: feel the water entering the relevant tissue: Rasa (plasma), Rakta (blood), Mamsa (muscle), Meda (fat), Asthi (bone), Majja (marrow), Sukla/Artava (reproductive).",
                "After sipping: stand and pour a small offering of water on the ground. 'Kaveri Namaha — I honor the sacred river.'",
                "Internally chant VAM 27 times while feeling water circulating through your lymph system.",
                "This practice increases Rasa Dhatu quality when done 40 consecutive days.",
              ],
            },
            medicines: [
              { label: "Chandraprabha Vati — 2 tablets with warm water", text: "The supreme Jala-harmonizing formula. Purifies Rasa and Rakta Dhatu simultaneously. Clears Ama from the lymphatic system." },
              { label: "Coriander seed water — 1 tsp seeds soaked overnight", text: "Cooling Jala medicine for Pittham-excess in blood. Strain and drink morning water. Ancient Siddha kidney-cooling formula." },
              { label: "Amla (Nelli) — 2 fresh or 1 tsp powder", text: "The supreme Rasa Dhatu nourisher. Highest natural vitamin C in Siddha pharmacopoeia. Builds Ojas while purifying Rakta Dhatu." },
            ],
            quote: {
              tamil: "நீரில்லா இடத்தில் நிலம் இல்லை
காரணமில்லா இடத்தில் காரியமில்லை",
              english: "Without water there is no earth. Without cause there is no effect.",
              master: "Thiruvalluvar · Thirukkural 20",
            },
          } },
        { id: "f2l3", title: "Fire Medicine (Agni) — The Solar Body Within", duration: "55 min", type: "Elemental" , content: {
            overview: "Fire (Agni/Theyu) is the transformative element — it converts food to tissue, experience to wisdom, matter to energy, and the individual soul back to the universal consciousness. In Siddha medicine, Agni is the single most important physiological force. A Siddha physician's primary assessment is always: how is this patient's Agni? Everything else follows from this.",
            teachings: [
              { num: "01", title: "The Seven Levels of Agni in Siddha Medicine", body: "Siddha identifies seven levels of digestive fire: Jataragni (master digestive fire in stomach), and six Bhutagnis (element-specific fires that complete tissue transformation in each Dhatu). When Jataragni is strong, all seven fires function. When Jataragni is weak (Mandagni), all seven weaken — tissue formation becomes incomplete, Ama (undigested metabolic waste) accumulates. Most chronic diseases begin with Mandagni." },
              { num: "02", title: "Ama — Undigested Matter Across All Levels", body: "Ama is Siddha medicine's most important disease concept. Physical Ama: undigested food metabolites that clog tissue channels (Srotas). Mental Ama: unprocessed emotional experiences stored in tissue (what modern psychology calls somatic trauma). Karmic Ama: unresolved karmas crystallized in tissue as hereditary disease patterns. The Siddha physician treats Ama at all three levels simultaneously — this is why the healing is total." },
              { num: "03", title: "Theyu (Fire) and the Sense of Vision", body: "Agni governs the sense of sight — both physical vision and intuitive perception. Siddha ophthalmology treats eye diseases through systemic Agni regulation, not just local eye treatment. Poor vision in Siddha is often a Pittham-Agni dysregulation that begins in the liver (Liver governs the fire-sense of sight). Bright golden or yellow vision in meditation indicates Agni at the Ajna Chakra is fully activated." },
              { num: "04", title: "RAM — The Seed Sound of Fire", body: "The Bija mantra RAM encodes the vibrational frequency of Agni. Its resonance occurs at the solar plexus (Manipura Chakra) and kindles digestive and metabolic fire throughout the body. Siddha physicians used RAM mantra therapy for digestive weakness, metabolic disorders, and spiritual dullness. Kapalabhati pranayama combined with RAM mantra chanting is the fastest Agni-activation technology in the entire Siddha system." },
            ],
            technique: {
              name: "Agni Mudra and Kapalabhati — Fire Activation",
              steps: [
                "Morning on empty stomach. Sit in Vajrasana (kneeling pose) — this posture directly activates Jataragni.",
                "Form Agni Mudra: fold ring finger to palm, press with thumb. Other fingers extended. Both hands.",
                "Begin Kapalabhati: 27 sharp exhales. Inhale is passive. Focus awareness at navel.",
                "After 27 pumps: full inhale, hold, apply Mula Bandha (perineal lock) and Jalandhara Bandha (chin lock).",
                "Hold for 15-30 seconds. Feel heat building at solar plexus.",
                "Release bandhas. Exhale slowly. Repeat 3 rounds of 27.",
                "After: chant RAM internally 108 times while maintaining awareness at Manipura.",
                "Feel the fire spreading through digestive system. End with 5 minutes stillness.",
              ],
            },
            medicines: [
              { label: "Trikatu (Sukku, Milagu, Thippili) — ¼ tsp in honey", text: "The supreme Agni-kindling formula. Dry ginger (Sukku) + Black pepper (Milagu) + Long pepper (Thippili). Destroys Ama without aggravating Pittham. Before meals for digestive weakness." },
              { label: "Chitrak (Plumbago) root — 1 tsp decoction", text: "Deepana (Agni-kindler) and Pachana (Ama-digester) in one herb. Siddha physicians called it 'the fire herb' — use with caution in Pittham-excess conditions." },
              { label: "Cumin (Jeeragam) water — 1 tsp seeds boiled 5 min", text: "The mildest Agni-activator. Safe for all Doshas. Morning use. The first Siddha recommendation for sluggish digestion and post-illness recovery." },
            ],
            quote: {
              tamil: "அனலும் அனிலமும் ஆன உடல் உண்மை
ஞானாக்கினி நீக்கும் சகல வினையே",
              english: "The body made of fire and wind — the fire of wisdom burns away all karmas.",
              master: "Thirumoolar · Thirumantiram 725",
            },
          } },
        { id: "f2l4", title: "Air and Space — Vayu-Akasha Medicine", duration: "50 min", type: "Elemental" , content: {
            overview: "Air (Vayu/Kaal) and Space (Akasha/Aether) are the two subtlest elements, governing movement, communication, consciousness, and the infinite field from which all other elements emerge. In Siddha medicine, Vayu and Akasha together govern the nervous system, all forms of subtle energy movement, sound, and the highest states of consciousness. Mastery of these elements is the gateway to Siddha Yoga and the immortality sciences.",
            teachings: [
              { num: "01", title: "Vayu in the Body — 10 Forms of Prana", body: "Siddha identifies 10 forms of Vayu: Prana (inhalation, chest), Apana (elimination, pelvis), Samana (digestion, navel), Udana (ascension, throat), Vyana (circulation, whole body), and five sub-Vayus (Naga, Kurma, Krikara, Devadatta, Dhananjaya) governing specific reflexes and functions. The Siddha physician assesses which Vayu is disturbed by observing the patient's breathing pattern, movement quality, and vocal tone before asking a single question." },
              { num: "02", title: "Akasha — The Source Element", body: "Akasha (Space/Ether) is not empty — it is the fullest element. It contains all other elements in potential. In Siddha medicine, Akasha governs the body's cavities (chest, abdomen, sinuses), the sense of hearing, and the Sushumna Nadi — the central pranic channel. Disease in the Akasha element manifests as a sense of internal emptiness, chronic loneliness, autoimmune conditions (the body attacking its own space), and spiritual isolation." },
              { num: "03", title: "YAM and HAM — Seeds of Air and Space", body: "YAM (Vayu bija) resonates at Anahata (heart) — the air chakra. HAM (Akasha bija) resonates at Vishuddha (throat) — the space chakra. Together they govern: cardiac rhythm and respiratory rhythm (YAM), vocal truth and communication clarity (HAM). Siddha physicians used these two mantras for heart disease, respiratory conditions, thyroid disorders, and all communication-related diseases." },
              { num: "04", title: "The Panchamahabhutas as Living Intelligence", body: "The five elements are not inert forces — they are living intelligences with consciousness. Earth intelligence: patience and endurance. Water intelligence: adaptability and empathy. Fire intelligence: transformation and clarity. Air intelligence: creative intelligence and spiritual insight. Space intelligence: omniscience and liberation. The Siddha physician cultivates a direct relationship with each element as a living teacher." },
            ],
            technique: {
              name: "Panchabhutha Pranayama — Five Element Breath",
              steps: [
                "Sit comfortably, spine erect. 5 rounds for each element, 25 breaths total.",
                "EARTH (LAM): Inhale slowly for 4 counts drawing energy up from below the feet. Exhale 4. Feel solidity in bones.",
                "WATER (VAM): Inhale 4, feel fluid movement in blood and lymph. Exhale 4 releasing all rigidity.",
                "FIRE (RAM): Inhale 4 through the nose feeling warmth at navel igniting. Exhale through mouth like breathing fire.",
                "AIR (YAM): Inhale deeply into the heart. Pause. Exhale 4 feeling the heart expand outward in all directions.",
                "SPACE (HAM): Inhale 4, feel the breath dissolving into infinite space. Hold 4. Exhale 4 becoming the space itself.",
                "After 25 breaths: sit in perfect stillness for 11 minutes. Feel all five elements in perfect harmony.",
                "This practice purifies all Pancha Maha Bhuta imbalances simultaneously.",
              ],
            },
            medicines: [
              { label: "Vacha (Acorus Calamus) — ¼ tsp with honey", text: "The premier Vayu-space nervine in Siddha medicine. Opens and purifies the Akasha in the sinuses and brain cavities. Used for neurological conditions, memory loss, and Vayu-Akasha imbalances in the mind." },
              { label: "Mulethi (Yashtimadhu/Athimadhuram) — ½ tsp in warm water", text: "The voice herb — heals Akasha element in the throat. Siddha teachers took this daily to maintain Vishuddha clarity for transmission. Soothes the respiratory Akasha element simultaneously." },
              { label: "Ghee (Sarpi) — 1 tsp on empty stomach morning", text: "The supreme Vayu and Akasha tonic. Lubricates all bodily spaces, nourishes nerve tissue, and creates the subtle physical substrate for higher spiritual states. Siddha immortality science begins with ghee." },
            ],
            quote: {
              tamil: "ஆகாயம் காற்று அனல் நீர் மண் ஐந்தும்
யோகியின் உடலில் யோகமாய் நிற்கும்",
              english: "Space, air, fire, water, earth — these five stand as Yoga within the Yogi's body.",
              master: "Agathiyar · Agathiyar Gnana 200",
            },
          } },
      ],
    },
    {
      id: "f3", num: "03", icon: "🌱",
      title: "First 10 Sacred Herbs — Consciousness-Activated Plants",
      subtitle: "The complete beginner Siddha pharmacopoeia",
      duration: "4 Lessons · 3.5 hrs",
      lessons: [
        { id: "f3l1", title: "Kadukkai — The King of Siddha Herbs & 7-Day Protocol", duration: "60 min", type: "Pharmacology" , content: {
            overview: "Siddha diagnosis (Siddha Nidanam) is an eight-fold examination (Ashta Sthana Pariksha) that reads the complete human being — body, mind, and soul — in a single clinical encounter. The eight examination points are: Nadi (pulse), Mutra (urine), Malam (stool), Jihva (tongue), Sabda (voice/sound), Sparsha (touch/skin), Neta (eyes), and Mukha (face). Together these eight portals reveal the complete disease picture without a single laboratory test.",
            teachings: [
              { num: "01", title: "Nadi Pariksha — The Complete Pulse Reading", body: "Already introduced in Module 1, Nadi reading at this level goes deeper: reading not just the three Dosha pulses but the Karma Nadi (karmic pulse) and the Jeevan Nadi (soul pulse). The soul pulse reveals whether the disease has a spiritual origin — a past-life trauma, an ancestral pattern, or a spiritual lesson the soul has chosen. This level of diagnosis is unique to Siddha and cannot be replicated by any other medical system." },
              { num: "02", title: "Mutra and Malam Pariksha — Reading the Exits", body: "Urine and stool examination reveals the state of Agni and the efficiency of the body's elimination systems. Siddha urine diagnosis: first-morning midstream urine observed in sunlight after adding sesame oil. The oil's movement pattern reveals the dominant Dosha. Siddha stool diagnosis reads color, consistency, frequency, and smell to map the Mala (waste) production of each Dhatu (tissue)." },
              { num: "03", title: "Jihva, Sabda, Sparsha — Tongue, Voice, Touch", body: "Tongue: coating color maps the Dosha state of each organ. White coating = Kapham excess. Yellow/green = Pittham. Dark/dry = Vatham. Voice: thin, cracking voice indicates Vatham. Sharp, cutting voice indicates Pittham. Deep, slow voice indicates Kapham. Skin touch: dry, rough, cold skin indicates Vatham. Hot, oily, reddish indicates Pittham. Cold, oily, pale indicates Kapham." },
              { num: "04", title: "Neta and Mukha — Eyes and Face as Body Maps", body: "The eyes are the window to the Jeevan (soul-body continuum). Siddha eye diagnosis reads: sclera color, iris pattern, pupil response, and the emotional quality of the gaze. The face is a complete body map: forehead = large intestine, nose = heart and lungs, cheeks = liver and spleen, jaw = reproductive organs, chin = kidneys. Face mapping gives an instant overview of all organ systems simultaneously." },
            ],
            technique: {
              name: "Ashta Sthana Self-Examination — Morning Diagnostic Protocol",
              steps: [
                "First thing upon waking, before eating. Natural light essential.",
                "NADI: Three minutes of pulse reading as learned in Module 1.",
                "JIHVA: Extend tongue to mirror. Note: coating (color, thickness, location), moisture level, any cracks or discoloration.",
                "NETA: Look at eyes in mirror. Whites: yellow tinge = Pittham/liver. Red vessels = Pittham-Vatham. Pale = Kapham/anemia.",
                "MUKHA: Scan forehead, cheeks, nose, jaw, chin for any breakouts, discoloration, or asymmetry.",
                "SABDA: Speak 'Om' three times. Note the quality — is your voice clear, resonant, cracking, or congested?",
                "SPARSHA: Run hands over forearms. Note skin quality — dry/rough (Vatham), warm/oily (Pittham), cool/smooth (Kapham).",
                "Journal all eight observations. Over 40 days you will see patterns that reveal your constitutional imbalance.",
              ],
            },
            medicines: [
              { label: "Tongue scraper — copper preferred", text: "Copper has natural antimicrobial properties. Morning tongue scraping removes overnight Ama from the tongue surface, which left in place re-enters the digestive system. Reduces Kapham coating within 2 weeks of daily practice." },
              { label: "Triphala eye wash — ½ tsp powder in boiled cooled water, strained", text: "Ancient Siddha eye cleansing formula. Removes Pittham accumulation from the eyes, clarifies vision, and purifies the Neta-Nadi diagnostic portal." },
              { label: "Neem (Vembu) twig — for teeth and gum health", text: "Siddha dentistry used neem twigs to clean teeth. Neem's bitter taste (Tikta rasa) reduces Kapham and Pittham in the oral cavity, improving the accuracy of Jihva diagnosis by removing pathological coating." },
            ],
            quote: {
              tamil: "நோயை அறிந்து மருந்து கொள்வோர்
ஆயுளோடு அன்பாய் இருப்பார்",
              english: "Those who understand the disease before taking medicine live long and with love.",
              master: "Agathiyar · Agathiyar Vaidyam 2000",
            },
          } },
        { id: "f3l2", title: "Nellikkai, Tulsi, Vembu — The Sacred Trinity", duration: "55 min", type: "Pharmacology" , content: {
            overview: "Siddha constitutional theory (Udal Thathu Ilakkanam) identifies seven tissue types (Sapta Dhatu) and their sequential interdependence. Understanding your primary tissue weakness is the key to Siddha preventive medicine — the most sophisticated aspect of this ancient system. Prevention in Siddha is not vaccination — it is the cultivation of such Ojas (vital essence) that disease cannot take root.",
            teachings: [
              { num: "01", title: "Sapta Dhatu — The Seven Tissue Transformation Chain", body: "Food enters the body and is transformed sequentially through seven tissue types: Rasa (plasma/lymph) → Rakta (blood) → Mamsa (muscle) → Meda (fat/adipose) → Asthi (bone) → Majja (marrow/nerve tissue) → Sukla/Artava (reproductive tissue). Each transformation takes approximately 5 days, making the complete Sapta Dhatu cycle 35 days. This is why Siddha medicine requires minimum 40 days for any treatment to show deep results." },
              { num: "02", title: "Ojas — The Supreme Essence of All Seven Tissues", body: "When all seven Dhatus are optimally nourished, the final product is Ojas — the supreme vital essence. Ojas is the physical substrate of immunity, spiritual luminosity, and longevity. A person with abundant Ojas radiates health, attracts others unconsciously, and resists disease effortlessly. Ojas depletion — through sexual excess, chronic stress, poor diet, and excessive fasting — is the foundation of all serious diseases in Siddha medicine." },
              { num: "03", title: "Mala — The Three Primary Wastes", body: "Each Dhatu transformation produces both a refined essence (Sara) and a waste product (Mala). The three primary Malas are: Mutra (urine), Malam (stool), and Sveda (sweat). In Siddha medicine, healthy waste production is as important as healthy tissue formation. A Siddha physician who does not ask about daily urination, defecation, and perspiration has not completed the diagnosis." },
              { num: "04", title: "Srotas — The Channel System of Siddha Physiology", body: "Siddha physiology maps 14 primary Srotas (channels) corresponding to each Dhatu's nutrition and waste system plus additional channels for mind, water, and food. Srota blockage (Srotaavarodha) is the immediate mechanism of all disease. Ama accumulates in Srotas, blocking the flow of Vayu (energy) and nutrients. Siddha treatment is fundamentally Srota-opening (Sroto-shodhana) — clearing the channels at the relevant level." },
            ],
            technique: {
              name: "Ojas Building — The 40-Day Sapta Dhatu Restoration",
              steps: [
                "This is a 40-day protocol, not a single practice. Begin on a Monday or on the new moon.",
                "Days 1-5 (Rasa restoration): Drink 2 liters warm water daily. Add pomegranate or fresh coconut water.",
                "Days 6-10 (Rakta restoration): Add beets, pomegranate, amla, iron-rich leafy greens.",
                "Days 11-15 (Mamsa restoration): Add protein — lentils, ghee, sesame. Gentle yoga daily.",
                "Days 16-20 (Meda restoration): Add quality fats — ghee, coconut, avocado, sesame.",
                "Days 21-25 (Asthi restoration): Add sesame, ashwagandha, yoga with weight-bearing poses.",
                "Days 26-30 (Majja restoration): Add Brahmi, ghee, Shatavari, meditation 30 min daily.",
                "Days 31-40 (Sukla/Artava + Ojas): Reduce output of all kinds. Rest more. Deepen spiritual practice.",
              ],
            },
            medicines: [
              { label: "Chyavanprash — 1 tsp morning", text: "The supreme Ojas-building Rasayana. 49 herbs in a base of Amla, ghee, and honey. The single most important Siddha preventive medicine for Ojas restoration." },
              { label: "Ashwagandha + Shatavari + Kapikacchu — equal parts, 1 tsp in warm milk", text: "The three supreme Ojas-builders. Combined: rebuilds all seven Dhatus and specifically maximizes Sukla/Artava (reproductive essence) from which Ojas derives." },
              { label: "Saffron milk (Kumkuma paal) — 3 strands in warm milk at night", text: "Nourishes all seven Dhatus simultaneously. The most sattvic tissue-nourisher. Particularly valuable during illness recovery when Ojas is depleted." },
            ],
            quote: {
              tamil: "உடல் நலமும் உள்ளம் நலமும்
ஒரே வழியில் ஒன்றாய் வரும்",
              english: "Physical health and inner health — they come together on the same path.",
              master: "Thiruvalluvar · Thirukkural 941",
            },
          } },
        { id: "f3l3", title: "Brahmi, Ashwagandha, Shankhapushpi — Brain Medicines", duration: "55 min", type: "Pharmacology" , content: {
            overview: "Siddha psychology (Mano Vidya) is a complete science of consciousness that was never separated from physical medicine. In the Siddha view, the mind (Manas) is a subtle physical organ — not a non-material entity. It is made of the finest form of Akasha and Vayu. Mental disease is physical disease at the subtle body level. This non-dualistic understanding makes Siddha psychosomatic medicine 3,000 years ahead of modern integrative psychiatry.",
            teachings: [
              { num: "01", title: "Manas, Buddhi, Ahamkara — The Three Minds", body: "Siddha recognizes three mental functions: Manas (the receiving/processing mind — like RAM in a computer), Buddhi (the discriminating intellect — like the processor), and Ahamkara (the ego-sense — the user believing the computer is 'theirs'). Mental diseases originate in each: anxiety and racing thoughts = Manas disorder. Poor judgment = Buddhi disorder. Ego-driven compulsions = Ahamkara disorder. Treatment targets the specific mental faculty involved." },
              { num: "02", title: "The Three Gunas and Mental Health", body: "Sattva (clarity, harmony), Rajas (passion, activity, restlessness), and Tamas (inertia, heaviness, dullness) are the three qualities of mind. Optimal mental health is predominantly Sattvic. Rajasic excess = anxiety, aggression, compulsion. Tamasic excess = depression, addiction, apathy. Siddha mental medicine always identifies the dominant Guna imbalance before prescribing treatment. The greatest Siddha mental intervention is Satsang — company of Sattvic beings." },
              { num: "03", title: "Emotions as Ama — Stored in the Body", body: "Siddha medicine recognized centuries before modern somatic therapy that unprocessed emotions become physical tissue — stored as Ama in the Srotas. Grief stored in the lungs weakens Rasa Dhatu. Anger stored in the liver disrupts Rakta Dhatu and Pittham. Fear stored in the kidneys weakens Asthi Dhatu and Vatham. The Siddha physician always asks: 'What happened in your life 6-12 months before this disease appeared?'" },
              { num: "04", title: "Siddha Psychotherapy — The 5 Technologies", body: "Siddha medicine uses five psychotherapeutic technologies: Mantra (sound medicine for Manas), Yantra (visual focus for Buddhi), Tantra (ritual engagement for Ahamkara), Pranayama (breath medicine for emotional Ama), and Gnana (wisdom for identity-level transformation). A complete Siddha mental treatment uses all five simultaneously — addressing all three mental faculties through multiple sensory portals simultaneously." },
            ],
            technique: {
              name: "Emotion Ama Release — Siddha Somatic Practice",
              steps: [
                "Choose one persistent emotion that has been present for weeks or months.",
                "Sit quietly. Place hands on the area of the body where you feel this emotion most strongly.",
                "Identify the emotion precisely: Is it grief? Fear? Anger? Shame? A combination?",
                "Breathe into the body area for 3 minutes without trying to change anything.",
                "Now identify the THOUGHT that accompanies this emotion. What does it say?",
                "Ask: 'Is this thought absolutely, permanently true?' Sit with the question.",
                "Chant the appropriate Dosha mantra for the emotion: Grief/Kapham = OM HRIM. Fear/Vatham = OM HRUM. Anger/Pittham = OM HREEM.",
                "108 repetitions. Let the mantra vibrate in the body area where the emotion is stored.",
                "End: 'I release this Ama from my [body area]. I restore the [emotion] to its pure form: Compassion/Trust/Clarity.'",
              ],
            },
            medicines: [
              { label: "Brahmi (Bacopa) + Shankhapushpi — equal parts, 1 tsp in ghee", text: "The supreme Siddha brain tonic for Manas and Buddhi. Reduces Rajas-anxiety, lifts Tamas-depression, and cultivates Sattva. 90-day protocol for significant psychiatric conditions." },
              { label: "Jatamansi (Spikenard) — ½ tsp powder in warm milk at night", text: "The supreme Siddha sedative and nervous system restorative. Transforms Rajas to Sattva during sleep. Non-addictive. Safe for long-term use. The Siddha alternative to pharmaceutical sleep medicine." },
              { label: "Rose water (Panneer Jal) — sip throughout the day", text: "Sattvic heart-opener. Reduces Pittham-anger stored in Rakta Dhatu. The most gentle and universally applicable Siddha mental medicine. The taste itself opens Anahata Chakra." },
            ],
            quote: {
              tamil: "மனமே மருந்து மனமே நஞ்சு
மனமே மனிதனின் உயிர்த்துணை",
              english: "The mind is medicine. The mind is poison. The mind is the companion of the human soul.",
              master: "Agathiyar · Gnana Agathiyam",
            },
          } },
        { id: "f3l4", title: "Seenthil, Keelanelli, Thippili — The Deep Cleansers", duration: "50 min", type: "Pharmacology" , content: {
            overview: "Siddha Ahara Niyamam (Dietary Science) is among the most precise nutritional sciences in human history. Unlike modern nutrition which analyzes molecules, Siddha dietary science reads food by its Rasa (taste), Guna (quality), Virya (energy), and Vipaka (post-digestive effect) — four attributes that determine exactly how each food transforms in the body. This system allows a Siddha physician to prescribe food with the precision of a pharmacist.",
            teachings: [
              { num: "01", title: "Shad Rasa — The Six Tastes as Medicine", body: "Siddha recognizes six tastes: Sweet (Inippu), Sour (Pulippu), Salty (Uvarppu), Pungent (Kaarpu), Bitter (Kasappu), Astringent (Thuvarpu). Each taste affects the three Doshas specifically: Sweet reduces Vatham and Pittham, increases Kapham. Sour reduces Vatham, increases Pittham and Kapham. Salty reduces Vatham, increases Pittham and Kapham. Pungent reduces Kapham, increases Vatham and Pittham. Bitter reduces Pittham and Kapham, increases Vatham. Astringent reduces Pittham and Kapham, increases Vatham." },
              { num: "02", title: "Satmya — Individual Dietary Compatibility", body: "The most sophisticated Siddha dietary concept: Satmya (compatibility). A food that is theoretically good for your Dosha may not be compatible with YOUR specific constitution, your current season, your current health state, or even your current emotional state. Siddha physicians say: 'Food eaten with joy is medicine. The same food eaten with grief is poison.' The state in which food is eaten is as important as what is eaten." },
              { num: "03", title: "Seasonal Eating — Ritucharya in Siddha", body: "Siddha seasonal medicine prescribes specific dietary adjustments for each of the six Tamil seasons (Kaar, Koothir, Munpani, Pinpani, Ilavenil, Muthuvenil). Summer intensifies Pittham — reduce pungent, sour, salty; increase sweet, bitter, cooling. Monsoon increases Vatham — reduce raw foods; increase warm cooked foods, ghee, sesame. Winter increases Kapham — reduce sweet, sour; increase pungent, bitter, light foods." },
              { num: "04", title: "The Nine Forbidden Food Combinations", body: "Siddha medicine identifies specific food combinations that create Ama (toxic metabolic waste) even when the individual foods are healthy: milk with fish, milk with sour fruits, honey with ghee in equal proportions (golden ratio — unequal is fine), cold water after oily food, fruit with cooked food, milk with alcohol, raw with cooked simultaneously, fish with dairy, banana with milk. These combinations overwhelm the body's processing capacity, creating Ama regardless of Dosha type." },
            ],
            technique: {
              name: "Siddha Mindful Eating Ritual — Ahara Puja",
              steps: [
                "Before eating: Wash hands. Sit — never eat standing or in front of screens.",
                "Observe the plate for 30 seconds: note the colors (each color is an element), the aromas.",
                "Offer the food: 'Annapoorne Sadapoorne Shankara Pranavalllabhe — I offer this to the divine who nourishes all.'",
                "First bite: take it in silence. Chew until completely liquid — minimum 32 chews.",
                "Eat slowly — the stomach sends fullness signals after 20 minutes. Stop at 75% capacity.",
                "After eating: sit quietly 5 minutes. Place right hand on abdomen. Feel the Agni at work.",
                "Walk slowly 100 steps — Siddha post-meal 'Shatapavali' that prevents Ama formation.",
                "Note in your Siddha journal how this meal affects your energy 2 hours later.",
              ],
            },
            medicines: [
              { label: "Buttermilk (Moru) with curry leaves and cumin — after lunch", text: "The ideal Siddha post-lunch drink. Thin buttermilk (not yogurt or thick lassi) enhances Agni, reduces Ama formation, cools Pittham, and aids Rasa Dhatu formation. The single most beneficial dietary addition in Siddha medicine." },
              { label: "Ginger + lime + black salt — before meals", text: "The Siddha pre-meal Agni activator. Sliced fresh ginger, squeeze of lime, pinch of rock salt. Kindles digestive fire, stimulates digestive enzyme production, and prevents Ama accumulation from the meal ahead." },
              { label: "Turmeric (Manjal) — ¼ tsp in everything", text: "The universal Siddha kitchen medicine. Anti-Ama, anti-Pittham, anti-Kapham. Purifies Rakta Dhatu (blood). The single most powerful dietary medicine in the Siddha system. Non-negotiable daily use." },
            ],
            quote: {
              tamil: "உண்பது நாழி உறங்குவது யாமம்
திண்பது கைப்பிடி செய்வது சிறிதே",
              english: "Eat a measure, sleep a watch of the night, hold tight what is firm — act with precision and restraint.",
              master: "Thiruvalluvar · Thirukkural 943",
            },
          } },
      ],
    },
    {
      id: "f4", num: "04", icon: "☀️",
      title: "Siddha Lifestyle (Pathyam) — Daily Codes for Immortality",
      subtitle: "The daily protocol taught by the 18 Siddhas",
      duration: "4 Lessons · 3 hrs",
      lessons: [
        { id: "f4l1", title: "Pathyam — The Complete Dietary Code of Immortality", duration: "65 min", type: "Lifestyle" , content: {
            overview: "Dinacharya (Daily Routine) is the most powerful preventive medicine in the Siddha system. A perfectly executed Dinacharya eliminates 80% of lifestyle diseases before they can take root. The Siddha masters discovered that the body's tissues, organs, and doshic rhythms follow precise 24-hour cycles aligned with the sun, moon, and planetary movements. Living in sync with these cycles is itself the highest Siddha medicine.",
            teachings: [
              { num: "01", title: "Brahma Muhurta — The Sacred Hour Before Sunrise", body: "Brahma Muhurta (3:40-5:36 AM) is the 96-minute window before sunrise when the earth's electromagnetic field is at its most coherent, prana is most abundant in the atmosphere, and the mind is most receptive to the subtlest energies. Rising during Brahma Muhurta and beginning spiritual practice gives the practitioner advantages that are physiologically measurable: cortisol is at its natural peak (without stress), melatonin transitions cleanly, and the brain shifts from delta to theta to alpha in a natural wave that maximizes intuitive capacity." },
              { num: "02", title: "The Siddha Morning Sequence — Prabhata Karma", body: "Ideal Siddha morning: Wake Brahma Muhurta → Sit 5 minutes in darkness (acknowledge Shiva/Shakti) → Drink warm water (Ushapana — 'dawn drink') → Tongue scraping → Oil pulling (Kavala) → Nasal rinse (Jala Neti) → Abhyanga (self-massage) → Warm water bath → Pranayama (30 min) → Meditation (20+ min) → Light breakfast. This complete sequence requires 2.5-3 hours but the health advantage over a lifetime is incalculable." },
              { num: "03", title: "The Siddha Sleep Protocol — Nidra Niyamam", body: "Siddha sleep science: optimal sleep is 10 PM-5 AM (7 hours). The critical Siddha insight: the body performs its deepest tissue repair between 10 PM and 2 AM when Kapham governs and anabolic hormones peak. Sleeping after 11 PM sacrifices the most regenerative portion of the sleep cycle. Siddha physicians identified insomnia as primarily a Vatham disorder and prescribed: warm sesame oil applied to soles of feet, Jatamansi herb in warm milk, and sleeping on the left side to activate the right (solar) nostril and slow the mind." },
              { num: "04", title: "Seasonal Routine — Ritucharya", body: "Beyond daily routine, Siddha medicine prescribes seasonal adjustments (Ritucharya) that modify diet, practice, sleep time, and sexual activity according to the six Tamil seasons. The key principle: each season strengthens one Dosha. The Siddha practitioner proactively reduces the season's dominant Dosha through counter-measures before it causes disease. This preventive doshic management is why traditional Siddha communities had remarkably low rates of seasonal illness." },
            ],
            technique: {
              name: "Abhyanga — The Siddha Self-Massage Protocol",
              steps: [
                "Daily, ideally before morning bath. Use sesame oil (Vatham), coconut oil (Pittham), or mustard oil (Kapham-Vatham) according to your constitution.",
                "Warm the oil by placing the bottle in hot water for 5 minutes.",
                "Begin at scalp: massage oil into scalp with fingertips in circular motions. 108 rotations.",
                "Face: gentle upward strokes. Neck: long downward strokes to the heart.",
                "Arms: long strokes toward the heart on straight portions. Circular over joints.",
                "Chest and abdomen: clockwise circular movements (direction of digestion).",
                "Back: long upward strokes along the spine.",
                "Legs and feet: long strokes toward the heart. Circular over knees and ankles. Feet last — press all marma (vital) points.",
                "Rest 10-15 minutes allowing oil to absorb. Warm water bath. Note: never rush immediately into cold air.",
              ],
            },
            medicines: [
              { label: "Sesame oil (Nalla Ennai) — for Vatham constitution", text: "The supreme Siddha oil — warming, nourishing, Vatham-pacifying. Daily Abhyanga with sesame oil is the single most impactful Siddha lifestyle medicine. 40 days transforms skin texture, joint health, and nervous system stability." },
              { label: "Brahmi oil — for scalp and head", text: "Brahmi-infused sesame or coconut oil for scalp massage specifically. Reduces Vatham in the head, improves sleep, enhances memory and mental clarity. Weekly head oil (Thalai Ennai) is non-negotiable in Siddha medicine." },
              { label: "Ushapana — warm water on rising", text: "The first Siddha medicine each day: 300-500ml warm (not boiling) water on waking. Flushes the kidneys, activates the lymph, softens overnight Ama, and begins the body's thermal activation before any food or stimulant." },
            ],
            quote: {
              tamil: "காலை எழுந்திரு கடவுளை நினை
மாலை இறங்கும் முன் மருந்தை உண்",
              english: "Rise at dawn and remember the Divine. Take your medicine before evening descends.",
              master: "Agathiyar · Vaidya Sastra",
            },
          } },
        { id: "f4l2", title: "Sleep, Breath, and Seasonal Alignment", duration: "55 min", type: "Lifestyle" , content: {
            overview: "The Marma system — Siddha's map of 108 vital energy points on the body — is one of the most powerful healing technologies in human history. Marma points are anatomical locations where Vayu (life force), tissue, and bone or joint converge. Stimulating a Marma point either releases blocked energy (healing) or disrupts functioning (Kalarippayattu combat). This module teaches the foundational Marma theory and the daily practice of five accessible, safe Marma points.",
            teachings: [
              { num: "01", title: "The 108 Marma Points — Why 108?", body: "108 is a sacred number in Siddha cosmology: 12 zodiac signs × 9 planets = 108. The 108 Marma points correspond to the 108 junctions in the cosmic body of Shiva-Shakti — each point in the human body is a miniature replica of a cosmic junction point. Of the 108, 12 are Maha Marma (supreme vital points) — stimulation of these with sufficient force causes immediate death. This is the military science behind Kalarippayattu. Healing uses the same points with gentle, precise pressure." },
              { num: "02", title: "Sira, Snayu, Asthi, Sandhi, Mamsa — The 5 Marma Types", body: "Marma points are classified by the tissue at their center: Sira (blood vessel) Marmas govern fluid flow. Snayu (tendon/ligament) Marmas govern structural flexibility. Asthi (bone) Marmas govern structural stability. Sandhi (joint) Marmas govern movement and energy transmission. Mamsa (muscle) Marmas govern strength and contraction. Treatment approach differs for each type — pressing a Sira Marma increases blood flow; pressing a Sandhi Marma releases joint restriction and improves Prana circulation." },
              { num: "03", title: "Marma and the Nadi System", body: "Each Marma point sits at the intersection of multiple Nadis (pranic channels). This is why Marma therapy is simultaneously physical (affects tissue) and energetic (affects Nadi flow). The five most accessible daily Marma points: Brahmarandhra (crown — Sahasrara activation), Sthapani (third eye — Ajna activation), Hridaya (heart center — Anahata activation), Nabhi (navel — Manipura activation), Talahridaya (sole of foot — grounding and kidney activation)." },
              { num: "04", title: "Varma Kalai — The Combat Science of Marma", body: "Varma Kalai (Tamil martial Marma science) is the complete military application of the 108 vital points. Kalarippayattu and Silambam practitioners learn to both strike and heal these points. The same knowledge that can disable an opponent can heal a patient — only the intention, pressure, and direction differ. Siddha physicians in ancient Tamil Nadu were also trained warriors. The same master who healed also protected. This integration of healing and combat distinguishes Siddha from all other medical systems." },
            ],
            technique: {
              name: "Five Daily Marma Points — Morning Activation Protocol",
              steps: [
                "After Abhyanga, before meditation. Gentle sustained pressure — never dig or rub hard.",
                "BRAHMARANDHRA (Crown): Middle finger pad at the very crown of the skull. Gentle circular clockwise pressure for 90 seconds. Feel warmth or tingling. Activates Sahasrara, improves sleep if done at night.",
                "STHAPANI (Third Eye): Index finger between eyebrows, gentle sustained pressure. 90 seconds. Feel pressure behind the eyes. Activates Ajna, improves intuition and clarity.",
                "HRIDAYA (Heart Marma): Open palm over heart center. Gentle clockwise circular massage. 90 seconds. Feel warmth spreading. Activates Anahata, opens compassion.",
                "NABHI (Navel Marma): Three finger widths below navel. Gentle clockwise circular pressure. 90 seconds. Feel warmth in lower abdomen. Activates Manipura, strengthens Agni.",
                "TALAHRIDAYA (Sole — both feet): Press center of each sole firmly with opposite thumb. 90 seconds each. Grounds all the energy activated above.",
                "Complete sequence: 9 minutes total. Daily practice for 40 days noticeably changes energy quality, sleep depth, and intuitive capacity.",
              ],
            },
            medicines: [
              { label: "Mahamasha oil — for Marma point massage", text: "Traditional Siddha oil for Marma therapy containing 28 herbs. Most effective when used as the oil applied during Marma point work. Penetrates deep tissue and enhances Nadi flow restoration." },
              { label: "Eucalyptus oil — 2 drops in carrier oil for nasal Marma", text: "The nasal Marmas (Phana points) respond strongly to aromatherapy. Eucalyptus opens the nasal Nadis and activates the Ajna Marma from below. Use before Pranayama for maximum benefit." },
              { label: "Castor oil — soles of feet before sleep", text: "Ancient Siddha Marma therapy for the Talahridaya (sole) Marma. Castor oil penetrates deeply, stimulates the kidney reflex points, and induces profound sleep. Wrap feet in cotton socks after application." },
            ],
            quote: {
              tamil: "வர்மம் அறிந்தவன் வாழ்வை அறிந்தான்
மர்மம் அறிந்தவன் மரணம் வெல்வான்",
              english: "One who knows Varma knows life. One who knows the secret (Marma) conquers death.",
              master: "Konganar Siddhar · Varma Sutram",
            },
          } },
        { id: "f4l3", title: "Brahma Muhurta — The Sacred Morning Protocol", duration: "60 min", type: "Practice" , content: {
            overview: "Siddha yoga (Siddha Yogam) is not the same as mainstream yoga. It is a complete science of consciousness transformation developed by the 18 Tamil Siddhas — specifically designed to produce Jivanmukti (liberation while alive) and Siddha Deham (the immortal body). Its central practices — Kaya Kalpa, Muppu, Pranayama, and Kundalini activation — are radically different from modern postural yoga and operate at the cellular and soul levels simultaneously.",
            teachings: [
              { num: "01", title: "The Three Pillars of Siddha Yoga", body: "Siddha Yogam rests on three pillars: Udal (body cultivation through Kaya Kalpa and Muppu), Ullam (mind cultivation through Gnana — wisdom practices), and Uyir (soul cultivation through direct Shiva experience — Shiva Anubhava). Western yoga has largely reduced this three-pillar system to the first pillar only — body cultivation. The Siddhas taught that body cultivation without simultaneous soul cultivation produces sophisticated disease rather than liberation." },
              { num: "02", title: "Kaya Kalpa — The Science of Body Immortalization", body: "Kaya (body) Kalpa (transformation into a new aeon of existence) is the Siddha technology for physically transforming the body at the cellular level — upgrading its capacity to sustain higher and higher states of consciousness without breaking down. Kaya Kalpa includes: specific herbal protocols (Rasayana), controlled sun exposure (Surya Kalpa), pranayama sequences, mantra, and extended meditation. Bhogar Siddhar's samadhi body, preserved in Palani Hill, is the living evidence." },
              { num: "03", title: "Muppu — The Siddha Universal Medicine", body: "Muppu (literally 'three salts') is the supreme Siddha catalytic formula — not a medicine itself but an enhancer that transforms any herb into a Rasayana. Its composition: Uppu (rock salt — earth element crystallized), Chunnam (shell ash — fire-transformed calcium), and Kallu Uppu (stone salt — minerals of the mountain). Muppu, added to any Siddha formula, makes the medicine 'Jeevanmuktha' — capable of simultaneously healing the body and liberating the soul." },
              { num: "04", title: "The Siddha Approach to Aging — Anti-Aging as Spiritual Science", body: "Modern anti-aging medicine targets cell senescence, telomere length, and mTOR pathways. Siddha anti-aging (Kayasiddhi) targets Ojas — the biofield that sustains all cellular processes. When Ojas is abundant, telomeres repair naturally, senescent cells are cleared by the body's own intelligence, and mitochondrial efficiency increases without external intervention. The Siddha insight: Ojas is the master regulator that modern longevity science is discovering through molecular biology." },
            ],
            technique: {
              name: "Kaya Kalpa Initiation — The Daily Golden Practice",
              steps: [
                "Before sunrise. This practice is the minimum Kaya Kalpa foundation — not the complete advanced system.",
                "5 minutes Surya Namaskar (Sun Salutation) — aligns the body's electromagnetic field with solar Prana.",
                "5 minutes Kapalabhati at 2 breaths per second — cellular oxygenation and Agni activation.",
                "10 minutes Nadi Shodhana with Kumbhaka — Sushumna activation and Ojas cultivation.",
                "15 minutes Dhyana (meditation) — Turiya state access for cellular repair signaling.",
                "1 tsp Ashwagandha + 1 tsp Shatavari + ghee — immediately after practice.",
                "Exposure to morning sun (pre-9 AM) on skin for 20 minutes — Vitamin D synthesis and Surya Prana absorption.",
                "Journal one insight from meditation — converts the spiritual download into actionable Gnana.",
              ],
            },
            medicines: [
              { label: "Aruna Rasayana — ½ tsp morning", text: "Traditional Siddha Rasayana for Kaya Kalpa initiation: equal parts Amla, Ashwagandha, Shatavari, Guduchi in honey. The foundational Ojas-building formula for beginning the Kaya Kalpa path." },
              { label: "Copper water (Tamra Jal) — 300ml morning", text: "Store water overnight in a copper vessel. Copper ionizes the water, creating a natural antimicrobial and microbiome-enhancing drink. Siddha medicine's simplest Kaya Kalpa foundation — used for 3,000+ years." },
              { label: "Navayasa Churna — as prescribed", text: "Iron-rich Siddha formula for rebuilding Ojas in Rakta Dhatu deficiency. Essential for practitioners with anemia, fatigue, or prior blood loss. Works synergistically with the Kaya Kalpa morning protocol." },
            ],
            quote: {
              tamil: "காயம் கனியும் கலப்பை தெரிந்தால்
யோகம் வருமே உலகில் அறிந்தால்",
              english: "When one knows the formula that ripens the body — Yoga arises and the world becomes known.",
              master: "Bhogar Siddhar · Bhogar 7000",
            },
          } },
        { id: "f4l4", title: "Behavioral Pathyam — Emotion as Medicine", duration: "50 min", type: "Psychology" , content: {
            overview: "Siddha Spiritual Medicine (Siddha Tharuvam) addresses the deepest layer of human disease — the Karmic-Spiritual body. This is where Siddha medicine most radically differs from all modern systems: it recognizes that some diseases cannot be healed by any physical or even psychological intervention because they originate in the Jeevan's (soul's) karmic trajectory. For these conditions, the Siddha physician becomes a spiritual guide, not a medical practitioner.",
            teachings: [
              { num: "01", title: "Karma Vikadhi — Karmic Disease", body: "Siddha medicine identifies three types of disease by origin: Swabhavika (constitutional — from birth Prakriti), Agantuka (exogenous — from external causes), and Karma Vikadhi (karmic — from accumulated soul-actions across lifetimes). Karma Vikadhi cannot be healed by herbs alone. It requires: recognition of the karmic pattern, deliberate actions to neutralize it (Karma Yoga), specific mantra and ritual (Tantra), and ultimately — Gnana (wisdom) to dissolve the identification that created the karma." },
              { num: "02", title: "The Siddha Physician's Four Roles", body: "The Siddha physician serves four roles simultaneously: Vaidhya (medical physician — treating Swabhavika and Agantuka disease), Guru (spiritual teacher — guiding through Karma Vikadhi), Jyotishi (Vedic astrologer — reading the planetary karmas affecting health), and Tantriki (ritual specialist — performing specific Siddha rituals to neutralize karmic disease patterns). A Siddha physician who can fulfill only the first role is a herbalist. All four roles are needed for complete healing." },
              { num: "03", title: "Jothidam (Jyotish) in Siddha Medicine", body: "Siddha medicine and Vedic astrology (Jothidam in Tamil) are inseparable sciences. The birth chart reveals the karmic blueprint of the Jeevan — including hereditary disease tendencies (hereditary karma through planetary positions), timing of disease onset (Dasha periods), and the specific Mantra-Yantra-Tantra prescriptions most effective for this Jeevan's healing. The Nadi Leaf Readings (Agastya Nadi) are the most advanced form of this integrated Siddha-Jothidam diagnostic system." },
              { num: "04", title: "Siddha Healing Mantras — The Five Supreme Formulas", body: "Five mantras form the pharmaceutical basis of Siddha spiritual medicine: Panchakshara (NA-MA-SHI-VA-YA) — balances Pancha Mahabutha and cures physical Mala. Shadakshara (OM-NA-MA-SHI-VA-YA) — adds OM to reach the Shuddha Tattva level. Ashtakshara (OM-NA-MO-NA-RA-YA-NA-YA) — Vishnu's eight-syllable formula for Karma-clearing. Moola Mantra (OM-SAT-CHIT-ANANDA-PARABRAHMA) — direct soul medicine for Karma Vikadhi. Guru Mantra (OM-GUM-GURAVE-NAMAHA) — activates all other mantras by invoking the lineage transmission." },
            ],
            technique: {
              name: "Karma Shodhana — Karmic Cleansing Practice",
              steps: [
                "Full moon or new moon — most powerful times for Karma Shodhana.",
                "Prepare: ghee lamp, incense (frankincense or sandal), fresh flowers, copper vessel of water.",
                "Sit facing east. Light lamp. Three Pranayama breaths to center.",
                "Speak aloud: 'I acknowledge the karmic patterns in my life that have contributed to [state the condition or life pattern].'",
                "Chant Panchakshara (NA-MA-SHI-VA-YA) 108 times with Mala. Visualize each syllable as an element purifying the corresponding body layer.",
                "Visualize golden light descending from above. Feel it dissolving the karmic Ama stored in [body area of condition].",
                "Speak: 'I release this karma from my Jeevan with full understanding of its teaching. I am free to heal.'",
                "Pour the copper water on the earth outside. The earth receives the released karma for transformation.",
              ],
            },
            medicines: [
              { label: "Navagraha Puja — monthly as Saturn or Rahu transit", text: "Specific offerings to the nine planetary deities that govern karmic disease patterns. Saturn governs chronic conditions, bones, and nervous system. Rahu governs mysterious conditions, addiction, and neurological puzzles. Timing Siddha medicine with planetary transits dramatically enhances efficacy." },
              { label: "Pancha Gavya — five cow products as Siddha tonic", text: "Cow's milk, ghee, curd, urine (Gomutra), and dung (purified) — the five traditional purifiers of karmic body. Gomutra specifically is used in Ayurveda and Siddha for difficult karmic diseases. Modern research confirms its antimicrobial and immune-modulating properties." },
              { label: "Vibuthi (Sacred ash) — applied to forehead, throat, chest", text: "Ash from sacred fires carries the Shiva frequency that transmutes karmic Ama directly. Thiruvannamalai Vibuthi is considered most potent. Applied at the three primary Marma areas: Ajna (wisdom), Vishuddha (truth), Anahata (heart-karma)." },
            ],
            quote: {
              tamil: "கர்மம் கடினம் கடந்தவர் எவரோ
தர்மம் வழியில் தவறாமல் நடந்தார்",
              english: "Those who crossed the hardness of Karma — they walked without deviation on the path of Dharma.",
              master: "Agathiyar · Karma Kandham",
            },
          } },
      ],
    },
  ],
  prana: [
    { id: "p1", num: "01", icon: "🌿", title: "Complete Siddha Herbal Pharmacopoeia — 64 Sacred Plants", subtitle: "The full Gunapadam plant transmission", duration: "6 Lessons · 6 hrs", lessons: [{ id: "p1l1", title: "Gunapadam — The Living Science of Herbal Properties", duration: "60 min", type: "Pharmacology" , content: {
            overview: "The Siddha Herbal Pharmacopoeia (Gunapadam) contains 1,000+ medicinal plants catalogued by taste, quality, potency, and post-digestive effect. This first Prana-Flow module introduces the 21 most essential Siddha medicinal plants — the physician's complete emergency toolkit. These 21 plants, properly prepared and used, address 80% of the conditions a Siddha physician encounters in daily practice.",
            teachings: [
              { num: "01", title: "Gunapadam — The Classification Science", body: "Gunapadam classifies every substance by six parameters: Suvai (taste — the six Rasas), Thanmai (quality/Guna), Pirivu (post-digestive effect/Vipaka), Viriyam (energetic potency — heating or cooling), Seyal (action — the herb's specific therapeutic activity), and Neekkam (the conditions it removes). This six-parameter system allows precise prescription: the same symptom in two patients with different constitutions receives different herbs." },
              { num: "02", title: "The King of Siddha Herbs — Nelli (Amla)", body: "Amla (Phyllanthus emblica / Indian Gooseberry) is the supreme Siddha herb — a Tridoshic Rasayana that simultaneously balances all three Doshas, nourishes all seven Dhatus, and builds Ojas. It contains the highest natural source of Vitamin C and multiple polyphenols that modern research confirms as anti-inflammatory, anti-cancer, anti-aging, and neuroprotective. Daily Amla use is non-negotiable in Siddha medicine." },
              { num: "03", title: "The 18 Siddha Master Herbs — One Per Siddha", body: "Each of the 18 Tamil Siddhas is associated with one supreme medicinal plant: Agathiyar — Agathi (Sesbania grandiflora); Thirumoolar — Brahmi (Bacopa monnieri); Bhogar — Nochi (Vitex negundo); Pulippani — Sida species; Konganar — Vilwam (Aegle marmelos); Machamuni — Vilvam species. These 18 plants form the core Siddha pharmacy. Each plant carries the energetic signature of its associated Siddha master." },
              { num: "04", title: "Fresh vs. Dried vs. Processed — Potency Hierarchies", body: "Siddha pharmacology recognizes a precise potency hierarchy: Fresh herb > dried herb > decoction > powder > tablet > extract. The most potent preparation is the one closest to the living plant. The most convenient but least potent is the tablet. Modern Siddha medicine primarily uses tablets and powders — a necessary compromise for accessibility, but understanding the potency hierarchy allows the practitioner to adjust dosage accordingly." },
            ],
            technique: {
              name: "Prana Herb Walk — Plant Consciousness Practice",
              steps: [
                "Once weekly: 30-minute walk in any natural setting — park, forest, garden.",
                "Walk slowly, without phone, in receptive awareness.",
                "When you feel drawn to a plant — any plant — stop.",
                "Observe: color, texture, smell, growth pattern. Ask internally: 'What quality does this plant embody?'",
                "If safe and legal: gently touch a leaf. Feel the texture. Release. Thank the plant.",
                "Note the sensation in your body: warmth (Pittham response), calmness (Kapham response), tingling (Vatham response).",
                "Research the plant's Siddha or Ayurvedic qualities. Discover if your body-response matched the classical description.",
                "This practice develops the direct plant-consciousness sensing that was the primary Siddha pharmacological method.",
              ],
            },
            medicines: [
              { label: "Nelli (Amla) — 2 fresh or 1 tsp powder daily", text: "Non-negotiable daily Siddha herb. Start today, continue for life. Best: fresh fruit on empty stomach. Second best: powder in warm water. Never cook amla — heat destroys Vitamin C and key polyphenols." },
              { label: "Tulsi (Holy Basil) — 5-7 leaves, chewed or as tea", text: "The most sacred Siddha home herb. Daily use: antiviral, adaptogenic, nervine. Each part used differently: leaves for respiratory and nervous system, roots for fever, seeds for cooling." },
              { label: "Nilavembu Kudineer — 60ml decoction, morning empty stomach", text: "The supreme Siddha immune-system formula. 9 herbs. The most clinically validated Siddha formula — used successfully in Tamil Nadu for dengue fever. Now confirmed effective for multiple viral conditions." },
            ],
            quote: {
              tamil: "மூலிகை மூலம் மோட்சம் காண்பார்
ஆலிகை அறிந்தோர் அழியார் என்றும்",
              english: "Through herbs one finds liberation. Those who know the plant-science never perish.",
              master: "Agathiyar · Gunapadam",
            },
          } },{ id: "p1l2", title: "The 21 Siddha Rasayanas — Immortality Preparations", duration: "75 min", type: "Alchemy" , content: {
            overview: "The 21 Siddha Rasayanas are preparations that simultaneously nourish the body, refine the mind, and accelerate spiritual evolution. Unlike ordinary medicines that treat disease, Rasayanas transform the underlying constitutional capacity of the Jeevan. Each Rasayana targets a specific Dhatu while building Ojas — the supreme vital essence — as its ultimate product.",
            teachings: [
              { num: "01", title: "Chyavanprash — The Universal Rasayana", body: "This 49-herb formula in Amla base is the single most clinically validated ancient Rasayana. Modern research confirms immunomodulatory, antioxidant, and cardioprotective effects. It works on all seven Dhatus simultaneously, making it the physician's first Rasayana prescription for any condition involving depleted Ojas. Named after the Siddha Chyavana who regained youth through its preparation." },
              { num: "02", title: "The Seven Dhatu-Specific Rasayanas", body: "Each Dhatu has its supreme Rasayana: Rasa — Guduchi (pure lymph-plasma builder). Rakta — Punarnava (blood-rejuvenator, liver tonic). Mamsa — Ashwagandha (muscle and anabolic tissue). Meda — Guggulu (fat-tissue metabolizer and joint lubricator). Asthi — Laksha (bone-builder, fracture healer). Majja — Brahmi (nerve tissue). Sukla/Artava — Shatavari and Kapikacchu (reproductive essence and Ojas)." },
              { num: "03", title: "Anupana — The Vehicle That Determines Destination", body: "The same herb delivered in different vehicles reaches completely different tissues: ghee carries to nerve tissue and deep structures; honey carries to the upper body and head; warm water carries to all Dhatus generally; milk carries to reproductive tissue and Ojas. Ashwagandha in ghee reaches the nerves; the same herb in milk reaches the reproductive tissue. Mastering Anupana doubles clinical efficacy of any Rasayana without changing the herb." },
              { num: "04", title: "Shodhana Before Rasayana — The Non-Negotiable Sequence", body: "The supreme Siddha principle: Rasayana given to an unpurified body is wasted. Ama blocks the Srotas through which Rasayana must penetrate to reach the Dhatu level. Seven-day minimum Shodhana before any serious Rasayana protocol: dietary restriction, Triphala evening, warm liquids only, gentle Virechana if indicated. After Shodhana, the same Rasayana dose produces three to five times the clinical effect." },
            ],
            technique: {
              name: "40-Day Rasayana Morning Protocol",
              steps: [
                "Choose one Rasayana matched to your weakest Dhatu based on your self-assessment.",
                "Take 30-60 minutes after waking, before food, with appropriate Anupana for your target tissue.",
                "Sit in stillness for 10 minutes after taking — allow absorption without digestive competition.",
                "Visualize golden light penetrating specifically to the target Dhatu.",
                "Track four daily Ojas markers: energy level, mental clarity, skin luminosity, sleep depth.",
                "Maintain consistent timing — same time daily. Erratic timing reduces Rasayana efficacy significantly.",
                "Avoid: excessive cold water, heavy food within 2 hours, sexual activity in the first 21 days.",
                "At Day 40: assess all four Ojas markers. If all four improved, continue. If partial: adjust Rasayana selection.",
              ],
            },
            medicines: [
              { label: "Chyavanprash — 1-2 tsp morning with warm milk", text: "Begin here. Safe for all constitutions. Daily for minimum 90 days to see full Ojas restoration. Winter use is most powerful — cold months accelerate the Kapham-Ojas building the formula produces." },
              { label: "Guduchi (Tinospora cordifolia) — 1 tsp powder in water", text: "The universal Rasayana herb. Agathiyar called it Amrita — the nectar of immortality in plant form. Rebuilds Rasa Dhatu while clearing Ama simultaneously — the only herb that cleanses and nourishes at the same moment." },
              { label: "Shatavari — 1 tsp in warm milk at night", text: "The supreme Rasayana for women and for all practitioners rebuilding Ojas after Pittham-depleting conditions. Night use maximizes tissue absorption during the Kapha-dominant sleep hours when anabolic processes peak." },
            ],
            quote: {
              tamil: "ரசாயனம் உண்டவர் இளமை பெறுவார்\nமூப்பும் நோயும் மொட்டில் நிற்கும்",
              english: "Those who take Rasayana attain youth — old age and disease halt at the threshold.",
              master: "Agathiyar · Agathiyar Vaidhyam 1500",
            },
          } },{ id: "p1l3", title: "Plant Consciousness — Communicating with Herbs", duration: "55 min", type: "Advanced" , content: {
            overview: "Plant consciousness science is the most radical aspect of Siddha pharmacology. The Siddha masters did not study plants through chemistry alone — they communicated with plants directly, receiving therapeutic information through expanded states of consciousness. This lesson presents the Siddha science of plant intelligence and practical methods for developing direct botanical sensitivity.",
            teachings: [
              { num: "01", title: "Plants as Conscious Beings — The Siddha View", body: "Tamil Siddha cosmology recognizes plants as Jeevas — beings with consciousness operating at the Manomaya Kosha level. Each plant species has a Devata (presiding intelligence) and a specific healing mandate. Agathiyar received the Gunapadam not through laboratory testing but through direct communication with plant Devas during samadhi states — creating a pharmacopoeia of extraordinary accuracy that modern research increasingly validates." },
              { num: "02", title: "The Osmosis Method — Siddha Plant Research", body: "The primary Siddha method of plant research: enter meditative stillness; hold the fresh plant in both hands; release all conceptual knowing; allow the plant's intelligence to transmit its properties directly. Multiple Siddhas independently verified the same plant properties through this method — creating a peer-review system of consciousness. This multi-practitioner cross-verification is why the Gunapadam's clinical accuracy exceeds what would be statistically possible from empirical trial alone." },
              { num: "03", title: "Plant Devas and the Eight Direction Medicines", body: "Each compass direction has a presiding plant Devata: East — Tulsi. West — Shatavari. North — Ashwagandha. South — Nilavembu. Northeast — Brahmi. Southeast — Nochi. Southwest — Seenthil. Northwest — Amla. Harvesting from the directionally appropriate plant aligns the harvest with its presiding cosmic intelligence, measurably increasing therapeutic potency according to the Siddha oral tradition." },
              { num: "04", title: "Pathyam for the Practitioner — Living With Plant Consciousness", body: "To develop genuine plant consciousness sensitivity: eat only plant-based food for 40 days to establish direct cellular contact with plant intelligence. Spend minimum one hour daily with growing plants. Talk to plants in the garden. Approach each medicinal plant with the same respect given to a Guru. The Siddha teaching: the plant teaches when approached as teacher. This is not metaphor — experienced botanists consistently report that prolonged intimate contact with a plant species produces intuitive knowledge of its properties that precedes formal study." },
            ],
            technique: {
              name: "Plant Communion — Developing Siddha Botanical Sensitivity",
              steps: [
                "Choose one medicinal plant — from your garden or a fresh living specimen from a market.",
                "Sit with the plant at dawn or dusk — the transitional hours when plant energy is highest.",
                "Hold the plant. Close your eyes. Three slow breaths releasing all you already know about this plant.",
                "Ask silently: What do you heal? What do you need? When should you be used?",
                "Remain completely receptive for 10 minutes. Note: images, body sensations, emotions, words, colors.",
                "Open eyes. Write immediately without editing the received impressions.",
                "Research the plant's classical Siddha properties. Compare with what was received during communion.",
                "Over 40 consecutive days of this practice, direct plant intelligence perception becomes increasingly reliable.",
              ],
            },
            medicines: [
              { label: "Tulsi (Holy Basil) — your primary plant teacher", text: "Begin plant consciousness practice with Tulsi — the most spiritually responsive plant in the Siddha pharmacopoeia. Grow it yourself. Water it daily with intention. Observe it weekly. It will teach what no text can about the relationship between plant intelligence and human healing." },
              { label: "Fresh ginger root — held during practice", text: "Ginger's warming penetrating intelligence is the most physically perceptible to beginning plant consciousness practitioners. Hold a fresh ginger root during early communion practices — its Agni quality is immediately felt by most as warmth in the hands, making it the ideal entry point for sensory development." },
              { label: "Brahmi leaves — 2 fresh leaves chewed before practice", text: "Fresh Brahmi chewed 10 minutes before plant communion opens the Manas (receiving mind) and Buddhi (discerning intellect) — the two cognitive faculties required for accurate plant intelligence reception. Establishes the neural receptivity that makes the practice productive." },
            ],
            quote: {
              tamil: "மூலிகை மண்ணில் வாழும் மருத்துவன்\nசூலம் ஏந்தியவன் சொற்படி செய்யும்",
              english: "The herb is the physician who lives in the soil — it acts according to the word of the Trident-bearer.",
              master: "Agathiyar · Gunapadam Mooligai",
            },
          } },{ id: "p1l4", title: "Planetary Herb Timing — Maximum Potency Harvesting", duration: "60 min", type: "Astro-Medicine" , content: {
            overview: "Siddha astro-pharmacology (Nakshatra Aushadha Vidya) is the science of harvesting herbs at precise astronomical moments to maximize therapeutic potency. Each medicinal plant contains a specific planetary intelligence maximized when harvested under its corresponding planet's influence. Timing transforms an ordinary herb into a Rasayana-grade medicine.",
            teachings: [
              { num: "01", title: "The Nine Planets and Their Medicinal Plants", body: "Sun — Bael (Vilwam): harvest Sundays at sunrise. Moon — Shatavari, Lotus: harvest Mondays at full moon. Mars — Nochi, turmeric: harvest Tuesdays. Mercury — Brahmi, Shankhapushpi: harvest Wednesdays. Jupiter — Ashwagandha, Amla: harvest Thursdays. Venus — Rose, Shatavari: Fridays. Saturn — Sesame, Triphala: Saturdays. Rahu — Gulancha: eclipse times. Ketu — Vidari: eclipse completion. The planetary intelligence of the herb is amplified when harvested during its ruling planet's time." },
              { num: "02", title: "The 27 Nakshatras as Harvest Windows", body: "Each of the 27 Nakshatra lunar mansions corresponds to a therapeutic category. Ashwini Nakshatra — ruled by the divine Ashwini Kumars, physicians of the gods — is the most powerful harvest window for all healing herbs generally. Any herb harvested when the moon transits Ashwini carries enhanced healing intelligence. Pushya Nakshatra is traditionally used for harvesting Ojas-building Rasayana herbs — the nutritive moon mansion." },
              { num: "03", title: "Lunar Phase and Plant Potency", body: "Full moon: maximum Jala element in plants. Stems and leaves most potent. Roots least potent. New moon: maximum Prithvi element. Roots, tubers, and bark most potent. Waxing moon: Prana moving upward in plants — above-ground parts increasing in potency. Waning moon: Prana descending — root medicines increasing in potency. This cycle determines whether bark, root, leaf, or seed should be harvested for maximum therapeutic intelligence." },
              { num: "04", title: "Brahma Muhurta — The Daily Harvest Window", body: "Beyond lunar cycles, optimal daily harvest occurs at Brahma Muhurta (90 min before sunrise) and Sandhya (30 min before and after sunset). During these transitional periods, the electromagnetic differential between earth and atmosphere drives maximum Prana into plant tissue. Herbs harvested at these times contain measurably more essential oil content and higher pharmacological potency than the same plant harvested at noon." },
            ],
            technique: {
              name: "Nakshatra Harvest Practice — Amplifying Your Medicine",
              steps: [
                "Obtain a Panchanga (Vedic almanac) — available free online for any location. Learn to read the daily Nakshatra.",
                "Note which herbs you currently use. Match each herb to its planetary ruler from the list above.",
                "Plan to harvest or purchase fresh herbs on their corresponding planetary day.",
                "For purchased dried herbs: hold them and chant the planetary seed mantra 9 times to re-attune. Sun-HRAM. Moon-SHREEM. Mars-KROOM. Mercury-BROOM. Jupiter-GREEM. Venus-DREEM. Saturn-PREEM.",
                "Store herbs on the correspondingly charged day: full moon for leaf and stem herbs; new moon for root herbs.",
                "At minimum: harvest any herb you grow during Brahma Muhurta — this single adjustment produces noticeable potency increase.",
                "Observe over 40 days whether timed herbs produce different therapeutic results than untimed.",
              ],
            },
            medicines: [
              { label: "Ashwagandha on Thursday at Jupiter hour — for maximum Ojas", text: "Jupiter governs Ashwagandha. Harvested or initiated on Thursday during Jupiter's first hour after sunrise: maximum Ojas-building potency. Jupiter's intelligence of expansion and nourishment is fully expressed in the plant at this moment." },
              { label: "Amla on Thursday or Ashwini Nakshatra day", text: "The supreme herb under the supreme healing Nakshatra. Amla harvested or purchased and initiated during Ashwini carries the divine physicians' intelligence amplified. For serious Rasayana protocols, always synchronize Amla with Ashwini." },
              { label: "Tulsi on Sunday at sunrise", text: "Solar herb harvested at solar moment. The essential oil content of Tulsi is measurably highest during Sunday sunrise. Harvest, dry, and use this Tulsi for the most elevated respiratory and nervous system treatment." },
            ],
            quote: {
              tamil: "நட்சத்திர நேரம் நலம் தரும்\nமருந்துக்கு மணம் மிகவும் வரும்",
              english: "The Nakshatra hour brings wellness — to the medicine comes maximum fragrance and power.",
              master: "Konganar · Nadi Nool",
            },
          } },{ id: "p1l5", title: "The 12 Shodhana Herbs — Complete Detox System", duration: "65 min", type: "Detoxification" , content: {
            overview: "Shodhana — systematic purification of body, mind, and subtle energy channels — is the essential prerequisite for all advanced Siddha treatment. Without proper Shodhana, the most potent Rasayana cannot penetrate to the tissue level because Srotas are blocked with Ama. The 12 primary Shodhana herbs are not gentle cleansers — they are precise instruments targeting specific Ama deposits at specific tissue levels.",
            teachings: [
              { num: "01", title: "Kadukkai — The Shodhana King", body: "Haritaki (Terminalia chebula) simultaneously balances all three Doshas — rare among all herbs. Different preparations produce different effects: with rock salt it clears Vatham; with sugar it clears Pittham; with ginger it clears Kapham; with ghee it builds Ojas while purifying. The same herb tuned by Anupana becomes four different medicines. This adaptability makes Kadukkai the single most versatile herb in the Siddha pharmacopoeia." },
              { num: "02", title: "The Five Siddha Shodhana Methods", body: "Vamana (therapeutic emesis): clears Kapham from the upper digestive tract. Virechana (therapeutic purgation): clears Pittham from the liver and intestines — the most commonly used. Nasya (nasal administration): clears Prana channels in the head — most important for neurological and psychiatric conditions. Basti (medicated enema): clears Vatham from the colon — most powerful Vatham treatment. Raktamoksha (blood purification): clears Rakta Dhatu toxins through leeches or blood-letting (clinical settings only)." },
              { num: "03", title: "The Tridosha Purification Sequence", body: "Optimal Shodhana sequence: Days 1-3 — prepare Ama for release through dietary restriction and warm liquids only. Days 4-7 — Vatham Shodhana: castor oil Virechana, Vatham-clearing herbs. Days 8-12 — Pittham Shodhana: Triphala Virechana, cooling herbs. Days 13-17 — Kapham Shodhana: dry heating diet, Kapham-clearing herbs. Days 18-21 — post-Shodhana Rasayana phase to rebuild what was cleared. This full sequence is the classical Pancha Karma preparation." },
              { num: "04", title: "The 12 Primary Shodhana Herbs", body: "Complete Siddha Shodhana pharmacopoeia: Kadukkai (Haritaki) — master cleanser. Nellikkai (Amla) — blood purifier. Thanrikkai (Bibhitaki) — Kapham-Rakta cleanser. Nilavembu — fever and viral Ama. Vilvam — digestive Ama and Pittham. Eranda (castor) — Vatham and intestinal Ama. Senna — bowel Ama. Nochi — neurological Ama. Punarnava — kidney and edema Ama. Manjishta — skin and lymph Ama. Brahmi — mental Ama. Guduchi — systemic immune Ama. Together these twelve address every tissue level and every Dosha combination." },
            ],
            technique: {
              name: "7-Day Siddha Mini Shodhana — Home Purification Protocol",
              steps: [
                "Days 1-2 PREPARATION: Reduce food by 30 percent. Eat only warm easily digestible foods — soups, kitchari, steamed vegetables. No raw food, dairy, or meat.",
                "Day 3 OLEATION: 1 tbsp warm sesame ghee on empty stomach morning. Signals the body to begin releasing Ama from deep tissues into the digestive tract.",
                "Day 4 VATHAM: Triphala 2 tsp in warm water before bed — gentle overnight Vatham-Ama release through the colon.",
                "Day 5 PITTHAM: Guduchi 1 tsp in coconut water morning. Neem leaf tea midday. Coriander seed water evening.",
                "Day 6 KAPHAM: Trikatu half tsp with honey before meals. Light dry diet — no dairy, minimal oil.",
                "Day 7 REBUILDING: Chyavanprash 2 tsp morning. Begin Rasayana of choice. Light Pathyam diet continues 7 more days.",
                "Contraindications: pregnancy, acute fever, severe weakness — consult Siddha physician before Shodhana.",
              ],
            },
            medicines: [
              { label: "Triphala — 1-2 tsp in warm water before bed", text: "The three-fruit formula is the most balanced Shodhana formula — simultaneously tridoshic. Begin any Shodhana protocol here. Safe for daily long-term maintenance Shodhana. The cornerstone of the Siddha preventive medicine pharmacy." },
              { label: "Nilavembu Kudineer — 60ml decoction on empty stomach", text: "The premier acute Shodhana formula for viral and inflammatory Ama. Nine herbs. Highly bitter — the bitter taste specifically targets Pittham-based Ama in blood and lymph. Non-negotiable during any fever or infection. Most clinically validated Siddha formula." },
              { label: "Castor oil (Eranda) — 1-2 tsp in warm milk for Vatham Shodhana", text: "The supreme single-herb Vatham Virechana agent. Take at night — gentle overnight release of Vatham-based intestinal Ama. Continue with light diet next day. The most important periodic Shodhana for Vatham-dominant conditions." },
            ],
            quote: {
              tamil: "தூய்மை இல்லா உடலில்\nமருந்தும் விஷமாகும்",
              english: "In a body without purity, even medicine becomes poison.",
              master: "Agathiyar · Shodhana Vidhim",
            },
          } },{ id: "p1l6", title: "Decoctions, Powders, Ferments — Preparation Mastery", duration: "70 min", type: "Preparation" , content: {
            overview: "Siddha pharmaceutical preparation determines how the same herb transforms completely depending on whether it is used fresh, dried, decocted, powdered, fermented, or calcined. The six primary preparation methods each unlock different therapeutic compounds and deliver them to different tissue levels. Mastering preparation science allows a single well-chosen herb to be as precise as a complex formula.",
            teachings: [
              { num: "01", title: "Svarasa — Fresh Juice, Maximum Prana", body: "Fresh-pressed plant juice contains the highest Prana and complete enzymatic intelligence of the plant but is unstable, lasting only hours. Preparation: crush fresh plant material in cloth and press. Never blend with metal blades — destroys electromagnetic charge. Use immediately. Primary applications: acute conditions where maximum potency is needed. Svarasa retains the living plant Devata — all other preparations contain the plant's memory rather than its living intelligence." },
              { num: "02", title: "Kashayam — Decoction, the Clinical Workhorse", body: "The Siddha decoction concentrates water-soluble therapeutics by boiling herbs down to one-quarter original volume. Standard protocol: 16 parts water to 1 part dried herb, boil uncovered until reduced to 4 parts, strain, drink warm within 2 hours. Vessel material matters: copper increases Pittham-clearing properties; clay increases earth-element grounding; iron increases Rakta Dhatu-building capacity. Kashayam is the most versatile and reliable Siddha preparation method." },
              { num: "03", title: "Chooranam — Powder, Versatile and Storable", body: "Dried and powdered herbs have 60-70 percent of fresh herb potency but are stable for 1-3 years and allow precise dosing. Preparation: dry completely in shade — never direct sun, which destroys essential oils. Powder in stone mortar, not metal grinder. Sieve through fine cloth. Store in glass or clay — never plastic. The Anupana (vehicle) determines where in the body the powder acts — mastering Anupana makes Chooranam as precise as Svarasa." },
              { num: "04", title: "Leham and Pakkuvam — Confection and Fermentation", body: "Leham (confection) combines herb powders with ghee, honey, or jaggery into paste — precise dosing, excellent palatability, targeted Dhatu delivery based on carrier. Pakkuvam (fermented medicine) is herbs fermented in natural sugars for 30-90 days, producing enzymatic transformation that creates new therapeutic compounds not present in the original herbs. Aristhas and Asavas are classical examples — the fermentation process significantly enhances bioavailability compared to the unfermented herb." },
            ],
            technique: {
              name: "Classical Kashayam Preparation — The Daily Decoction Practice",
              steps: [
                "Choose one herb or formula — Triphala, Nilavembu, Tulsi, or any classical Siddha formula.",
                "Measure: 1 part dried herb to 16 parts water. Example: 10g herb in 160ml water.",
                "Bring to boil in copper or clay pot preferred, stainless steel acceptable, never aluminum or non-stick.",
                "Boil uncovered, stirring occasionally, until liquid reduces to one-quarter: approximately 40ml from 160ml.",
                "While decocting: chant the herb's mantra or sit in awareness acknowledging the plant's intelligence concentrating.",
                "Strain through fine cloth. Drink warm — never reheat Kashayam, which becomes Ama after cooling.",
                "Take on empty stomach unless specifically contraindicated for that particular herb.",
                "Observe over 7 days: which symptoms improve? This direct observation IS Siddha pharmaceutical science.",
              ],
            },
            medicines: [
              { label: "Tulsi Kashayam — 40ml morning, immune maintenance", text: "Simplest daily Kashayam: 5-7 fresh Tulsi leaves in 160ml water reduced to 40ml. The Kashayam unlocks Tulsi constituents unavailable in fresh leaf form. For chronic conditions Kashayam is superior; for acute conditions Svarasa is superior." },
              { label: "Triphala Kashayam — stronger than powder for active Shodhana", text: "Triphala as Kashayam has significantly greater purifying effect than Triphala powder — the decoction process extracts tannins and polyphenols not water-soluble at room temperature. Use for active purification phases, not daily maintenance." },
              { label: "Ashwagandha Ksheerapaka — milk decoction for maximum Ojas", text: "Simmer herb in 4 parts milk plus 16 parts water until water evaporates, leaving medicated milk. This carries fat-soluble ashwagandha compounds directly to the nervous system and reproductive tissue — impossible to achieve with water decoction alone." },
            ],
            quote: {
              tamil: "சாத்திரம் தெரிந்து செய்யும் மருந்தே\nஆத்திரம் தீர்க்கும் அற்புத மருந்து",
              english: "The medicine made with scriptural knowledge — that is the miraculous medicine that ends all suffering.",
              master: "Agathiyar · Pharmaceutical Vidhi",
            },
          } }] },
    { id: "p2", num: "02", icon: "⚡", title: "Varma Shastra — The 108 Vital Points of Power", subtitle: "Foundation transmission of Siddha's secret healing system", duration: "6 Lessons · 7 hrs", lessons: [{ id: "p2l1", title: "Varma — The 108 Vital Points of Living Power", duration: "75 min", type: "Varma" , content: {
            overview: "Varma Shastra — the science of the 108 vital points in combat and healing — is the crown jewel of Siddha medical knowledge. This first Varma module introduces the complete theoretical framework: the classification of the 108 points by danger level, element, and therapeutic application. This knowledge took traditional Siddha practitioners 7-12 years to master under direct transmission. SQI presents the foundational science with the essential safety protocols.",
            teachings: [
              { num: "01", title: "The 108 Varma Points — Classification System", body: "The 108 Varma points are classified by danger: 12 Padu Varma (immediately fatal if struck), 96 Todu Varma (require medical intervention if struck). Further classified by element: 25 Agni Varma (fire-governing points), 25 Vayu Varma (air-governing), 25 Jala Varma (water-governing), 25 Prithvi Varma (earth-governing), 8 Akasha Varma (space-governing). Treatment approach differs completely by element type — a Jala Varma injury requires warming treatment; an Agni Varma injury requires cooling." },
              { num: "02", title: "Varma and Kalarippayattu — The Warrior-Healer Tradition", body: "Kalarippayattu (Kerala) and Silambam (Tamil Nadu) are martial arts built entirely on Varma knowledge. The warrior strikes vital points to disable; the Varma physician restores function by stimulating the same points in sequence. A student of Varma Kalai first learns to heal — then learns to strike. The healing knowledge comes before the combat knowledge because the master teaches: one who cannot heal has no right to harm. This ethical sequence is built into the transmission itself." },
              { num: "03", title: "Prana Flow Through Varma Points", body: "Each Varma point is a Nadi junction — a place where multiple pranic channels converge and cross. When a junction is blocked (by injury, emotional trauma, Ama, or karmic pattern), the entire pranic stream downstream is affected. Varma therapy works by unblocking these junctions using: controlled pressure, specific hand gestures (Mudra applied to points), herbal oil preparations, percussion sounds (Thattu Varma — percussion healing), and mantra vibration." },
              { num: "04", title: "The Five Access Methods in Varma Healing", body: "Siddha Varma therapy uses five access methods: Kai Varma (hand pressure), Kol Varma (stick pressure with Silambam stick), Varmam Marundhu (herbal oil applied to point), Thattu Varma (percussion therapy), and Oli Varma (sound/mantra therapy). The most refined practitioners use Oli Varma — pure sound application — without any physical contact. The Siddha master applying the sound frequency of HAM or RAM to a specific Varma point demonstrates the ultimate integration of mantra and medicine." },
            ],
            technique: {
              name: "Three Healing Varma Points — Safe Daily Practice",
              steps: [
                "These three points are safe for all practitioners: Brahmarandhra (crown), Hridaya (heart), Talahridaya (sole).",
                "Use clean sesame or Mahamasha oil on fingers.",
                "BRAHMARANDHRA: Thumb and forefinger of both hands at crown. Gentle clockwise pressure increasing slowly. 2 minutes. Releases: headache, insomnia, spiritual disconnection.",
                "HRIDAYA VARMA (4 finger-widths below left nipple): Middle finger pressure. Gentle circular. 2 minutes. Releases: emotional congestion, grief stored in Rakta Dhatu, chest tension.",
                "TALAHRIDAYA (center of each sole): Thumb pressure, firm but not painful. 2 minutes each foot. Releases: all downward-moving Vayu disorders, grounding, kidney activation.",
                "After: 5 minutes supine. Feel the pranic redistribution through the body.",
                "NEVER attempt other Varma points without direct Guru transmission.",
              ],
            },
            medicines: [
              { label: "Karpuradi oil (Camphor oil) — for Varma massage", text: "Traditional Siddha Varma therapy oil. Camphor penetrates deeply to the Nadi junctions. Simultaneously warming (penetrates Vatham blocks) and cooling (reduces Pittham inflammation). Used before and after Varma therapy." },
              { label: "Nochi (Vitex negundo) leaf compress — for joint Varma points", text: "Fresh Nochi leaves heated in sesame oil, applied to joint Varma points (knees, shoulders, spine). The supreme Siddha treatment for joint Varma injuries and arthritis. Bogar Siddhar's signature healing preparation." },
              { label: "Thippili (Long pepper) + Sukku (Dry ginger) decoction", text: "Internal Vayu-clearing formula for Varma-injury recovery. When a Varma point is accidentally struck, this formula clears the pranic stagnation that results, preventing it from solidifying into chronic blockage." },
            ],
            quote: {
              tamil: "வர்மம் வல்லவன் வாழ்வைக் காப்பான்
வர்மம் இல்லாதவன் வாழ்வை இழப்பான்",
              english: "The master of Varma protects life. One without Varma knowledge loses life.",
              master: "Konganar · Varma Odivu Murivu Saaram",
            },
          } },{ id: "p2l2", title: "The 12 Paddu Varmam — Lethal and Healing Points", duration: "90 min", type: "Advanced Varma" , content: {
            overview: "The 12 Paddu Varmam are the most dangerous and most therapeutically potent of all 108 Varma points. Each point, if struck forcefully, can cause immediate or delayed disruption of life force. The same points, stimulated with precise therapeutic intention, produce the most powerful healing responses in the Varma system. This lesson presents their clinical therapeutic applications with essential safety protocols.",
            teachings: [
              { num: "01", title: "Why Dangerous Points Are Most Healing", body: "The Paddu Varmam are dangerous precisely because they are locations of maximum Prana concentration — where multiple Nadi streams converge at major physiological junctions. A strike disrupts this convergence catastrophically. A therapeutic touch — the right pressure at the right angle for the right duration — creates a sudden release of blocked Prana that can resolve conditions other treatments cannot touch. The same force, same location, radically different intention and application." },
              { num: "02", title: "The 12 Paddu Varmam Locations and Primary Applications", body: "Crown (Brahmarandhra): migraines, insomnia, spiritual disconnection. Back of neck (Nila Varma): cervical conditions, brainstem vertigo. Both temples (Kodiya): bilateral headaches, cognitive fog. Larynx (Kuthirai): voice disorders, thyroid conditions. Solar plexus (Ull Kuzhi): shock recovery, adrenal exhaustion. Navel (Payir): all digestive disorders unresponsive to herbs. Behind knees (Moottukkal bilateral): lower body circulation, nerve conditions. Three spinal Paddu points along thoracic, lumbar, and sacral Sushumna: spinal disc conditions and neurological compression." },
              { num: "03", title: "Thadaval and Nokku Varma — Contact and Distance Treatment", body: "Advanced Varma practitioners work in two modes: Thadaval (contact therapy — precise finger pressure) and Nokku Varma (distance therapy — projecting Prana to the Varma point without physical contact). Nokku Varma is the highest expression — the practitioner's trained awareness is the instrument, not the physical hand. This capacity requires minimum 7-12 years of daily Varma practice to develop reliably and reproducibly." },
              { num: "04", title: "Safety Non-Negotiables in Paddu Varmam Work", body: "Absolute rules: Never apply more than sustained gentle pressure to any Paddu point without direct Guru transmission. Never apply Paddu Varma therapy during active fever, acute infection, or mental instability. Always use appropriate oil — never dry contact. Always perform post-treatment stabilization (Dashamula Kashayam internally, Bala oil externally). When in doubt about a point's location, do not proceed — the cost of uncertainty is too high in Paddu Varmam practice." },
            ],
            technique: {
              name: "Nila Varma Self-Release — Safe Cervical Tension Protocol",
              steps: [
                "This is one of the safest Paddu Varmam for self-application when used correctly.",
                "Sit in a chair with spine erect. Head in neutral position — neither forward nor back.",
                "Place both thumbs at the base of the skull at the groove where skull meets cervical spine (occipital ridge).",
                "Apply gentle sustained upward and slightly inward pressure — not digging, not rubbing. Pure sustained contact.",
                "Hold for 60-90 seconds. Breathe normally. You may feel warmth, tingling, pressure release, or a wave of relaxation.",
                "Slowly release and lower head forward 30 degrees for 30 seconds.",
                "Return to neutral. Sit for 5 minutes in stillness.",
                "Contraindicated: active cervical injury, active high blood pressure, pregnancy. Any dizziness — stop immediately.",
              ],
            },
            medicines: [
              { label: "Karpuradi oil (camphor in sesame) — for Varma preparation", text: "Applied 10 minutes before Varma therapy. Camphor opens the Nadi channels at treatment points, increasing therapeutic penetration. The Siddha practitioner's standard Varma preparation oil for Pittham-type conditions." },
              { label: "Bala oil — for post-treatment application", text: "Bala (Sida cordifolia) in sesame oil base. Applied after Paddu Varma therapy to nourish and stabilize the disturbed Nadi junctions. Prevents post-treatment Vatham aggravation — the most common side effect when aftercare is neglected." },
              { label: "Dashamula decoction — 60ml after Varma treatment", text: "Ten-root formula. The post-treatment Vatham stabilizer. Any significant Varma therapy disturbs Vatham — Dashamula immediately rebalances all ten Vayus agitated during stimulation of deep Nadi junctions." },
            ],
            quote: {
              tamil: "பதினாறு வர்மம் படுகாயமாம்\nஒதுங்கி நடந்தால் உடல் காப்பாகும்",
              english: "Sixteen Varmam cause deep wounds — walk with care and the body remains protected.",
              master: "Konganar · Varma Odivu Murivu Saaram 1",
            },
          } },{ id: "p2l3", title: "Self-Varma Practice — Daily Activation Protocol", duration: "60 min", type: "Practice" , content: {
            overview: "Daily Varma self-practice is the foundation of Siddha preventive medicine for the practitioner-physician. The tradition holds that any physician who does not maintain their own Nadi clarity cannot accurately diagnose or treat another's Nadi system. This lesson presents the complete daily self-Varma protocol used by practicing Siddha physicians to maintain their healing capacity.",
            teachings: [
              { num: "01", title: "The Physician's Daily Obligation — Atma Shodhana", body: "Every Siddha physician performs Atma Shodhana (self-purification) before treating any patient: morning Pranayama to clear their own Nadis, Varma self-activation to open their own Prana channels, and invocation connecting to the Siddha lineage through Guru Mantra. A physician who skips their own practice is like a surgeon who doesn't wash hands — the treatment becomes contaminated by the practitioner's own Dosha imbalances." },
              { num: "02", title: "The 9-Point Morning Varma Activation Sequence", body: "Daily self-practice uses 9 points in a precise sequence: Brahmarandhra (crown), Sthapani (third eye), Phana (both nostrils), Shankha (both temples), Hridaya (heart), Nabhi (navel), Kati (lower back/sacrum), Gulpha (both ankles), Talahridaya (both soles). This sequence takes 9 minutes and activates the complete Sushumna channel from crown to root while establishing the day's pranic current." },
              { num: "03", title: "Reading Your Own Nadi Through Self-Varma", body: "An advanced application: as you activate each point, note its quality. Warmth indicates Pittham. Coolness indicates Vatham. Heaviness indicates Kapham. Pain indicates Ama at that Nadi junction. Tingling indicates Prana beginning to flow through a previously blocked channel. This real-time feedback from your own body is the Siddha physician's most reliable daily diagnostic instrument." },
              { num: "04", title: "Evening Varma — Sealing the Day's Energy", body: "The evening Varma sequence is the inverse of morning: begin at the soles and move upward, ending at Brahmarandhra. The upward direction in morning draws Prana up through the day. The downward evening direction seals and grounds the day's accumulated Prana. Missing the evening Varma is like leaving a door open overnight — the day's pranic gains leak during sleep." },
            ],
            technique: {
              name: "9-Minute Morning Varma Activation — Daily Protocol",
              steps: [
                "After oil pulling and before Pranayama. Seated, spine erect. Apply 2-3 drops warm sesame oil to fingertips.",
                "BRAHMARANDHRA: Crown of head. Both middle fingers. Gentle clockwise circles. 60 seconds.",
                "STHAPANI: Between eyebrows. Index finger. Sustained gentle pressure. 60 seconds.",
                "PHANA: Both sides of nostrils. Both thumbs simultaneously. Light inward-and-upward pressure. 60 seconds.",
                "HRIDAYA: Heart center. Open palm. Gentle clockwise pressure. 60 seconds.",
                "NABHI: 3 finger-widths below navel. Three-finger pressure. Gentle clockwise. 60 seconds.",
                "KATI: Both thumbs at sacrum dimples. Sustained pressure. 60 seconds.",
                "TALAHRIDAYA: Both soles. Thumb-press center. Firm pressure. 60 seconds each foot.",
                "Close: 3 deep breaths feeling Prana flowing from crown through all activated points to soles.",
              ],
            },
            medicines: [
              { label: "Sesame oil — daily Abhyanga and Varma activation medium", text: "Non-negotiable daily Varma self-practice oil. Sesame penetrates 7 tissue layers, nourishes the Nadi sheaths, and carries Vatham-balancing warming quality that keeps Nadi channels supple and responsive throughout the day." },
              { label: "Mahanarayan oil — for joint Varma points", text: "When applying the Varma sequence to joint areas, use Mahanarayan oil instead of plain sesame. This classical 50-herb formula specifically nourishes Sandhi Varma points and prevents Vatham accumulation in joint channels over time." },
              { label: "Brahmi oil — for crown and third-eye Varma points", text: "For Brahmarandhra and Sthapani specifically: Brahmi-infused oil maximizes the intelligence-enhancing and sleep-deepening effects of these two points. Apply and massage minimum 5 minutes for full effect." },
            ],
            quote: {
              tamil: "தன்னை அறிந்தவன் தானே வைத்தியன்\nமுன்னை அறிந்தவன் முறையாய் வாழ்வான்",
              english: "One who knows himself is his own physician — one who knows the origin lives in right order.",
              master: "Agathiyar · Self-Knowledge Sutra",
            },
          } },{ id: "p2l4", title: "Varma for Pain — Clinical Applications", duration: "70 min", type: "Clinical" , content: {
            overview: "Varma therapy for pain management is one of the most immediately impactful clinical applications of the Varma system. Unlike pharmaceutical pain management which suppresses pain signals without addressing their cause, Varma pain therapy releases the Nadi blockage generating the pain signal — resolving both symptom and origin simultaneously. This lesson covers the six most common pain conditions and their Varma protocols.",
            teachings: [
              { num: "01", title: "Pain as Blocked Prana — The Siddha Model", body: "In Siddha medicine, pain is the signal of Prana attempting to flow through a blocked Nadi junction. The pain is not the enemy — it is the messenger. Blocking the pain signal silences the messenger without clearing the roadblock. Varma therapy clears the Nadi blockage, allowing Prana to flow — pain resolves because its cause resolves. This is why Varma pain relief often simultaneously improves conditions seemingly unrelated to the treated area." },
              { num: "02", title: "Headache Varma Protocol — Three Primary Points", body: "Tension headache (Vatham): bilateral Shankha Varma (temples) plus Nila Varma (occipital base). Migraine (Pittham): Sthapani (third eye) plus cooling oil (coconut with camphor). Cluster headache (Vatham-Pittham): Brahmarandhra plus Phana (nostrils). Application: 90 seconds sustained pressure on each point with appropriate oil. Significant relief in 3-7 minutes for most headache types. For chronic migraine: daily Nila Varma self-treatment for 40 consecutive days." },
              { num: "03", title: "Back Pain Protocol — Spinal Varma Points", body: "Lower back (Vatham): Kati Varma (sacral dimples bilateral) plus Nitamba (gluteal points). Upper back and neck: Nila Varma plus bilateral Amsa Phalaka (between shoulder blades). Disc-related: spinal Paddu points (trained practitioner only) plus Dashamula Kashayam internally. Application: warm Mahanarayan oil, 90-second sustained pressure each point. 3-5 sessions of 30 minutes typically resolves chronic muscular back pain." },
              { num: "04", title: "Arthritic Joint Pain — The Sandhi Varma Protocol", body: "Arthritis is a Vatham-Ama condition — blocked Nadi junctions at the joint level combined with Ama accumulation in the synovial space. Treatment: primary Sandhi Varma points surrounding the affected joint plus internal Guggulu Rasayana plus Vatham-reducing diet. The combination of local Varma therapy (clearing Nadi blockage) with internal Rasayana (clearing Ama) is significantly more effective than either alone." },
            ],
            technique: {
              name: "Headache Emergency Varma — 7-Minute Relief Protocol",
              steps: [
                "At headache onset — do not wait for it to fully develop.",
                "Apply 2 drops camphor plus coconut oil mix to both index fingers.",
                "SHANKHA VARMA: Both temples simultaneously. Index and middle fingers. Gentle sustained circular pressure. 90 seconds.",
                "NILA VARMA: Both thumbs at occipital base. Upward pressure. 90 seconds.",
                "STHAPANI: Single index finger between eyebrows. Hold for 90 seconds — do not rotate, just hold.",
                "PHANA: Both thumbs on either side of nose bridge, gentle pressure toward center. 60 seconds.",
                "Lie down. Cold compress for Pittham headache, warm compress for Vatham headache on forehead.",
                "If Vatham: ginger tea. If Pittham: coriander or rose water. Rest 15 minutes.",
              ],
            },
            medicines: [
              { label: "Camphor plus coconut oil — for Pittham headaches", text: "The premier Pittham-headache topical. Applied to temples and forehead. Cooling, penetrating, Pittham-reducing. For migraine: also apply to soles of feet to draw Pittham downward from the head." },
              { label: "Warm sesame oil with dry ginger — for Vatham headaches", text: "Warm sesame oil with ginger for Vatham tension headaches. Warmth penetrates the Nadi constriction and ginger's Agni-quality dissolves the Vatham-cold causing the constriction. Apply to temples and Nila Varma point." },
              { label: "Nirgundi (Nochi) oil — for joint pain Varma support", text: "Vitex negundo in sesame oil base. Bogar's signature joint pain formula. Anti-inflammatory at the Nadi junction level. Applied warm to arthritic joints before Varma therapy — dramatically increases therapeutic penetration." },
            ],
            quote: {
              tamil: "வலி வரும் இடம் வர்மம் இருக்கும்\nவர்மம் தீர்ந்தால் வலியும் தீரும்",
              english: "Where pain comes, Varmam is there — when Varmam is resolved, the pain resolves.",
              master: "Konganar · Varma Vidhim",
            },
          } },{ id: "p2l5", title: "Varma Oils and Herbal Support", duration: "55 min", type: "Medicine" , content: {
            overview: "Varma therapy requires specific herbal oil preparations that enhance therapeutic penetration and protect the practitioner from the pranic discharge occurring when blocked Nadi junctions are released. This lesson covers the seven classical Siddha Varma oils — their composition, preparation, and precise therapeutic applications.",
            teachings: [
              { num: "01", title: "Why Oil Is Non-Negotiable in Varma Therapy", body: "Dry-contact Varma stimulation risks creating micro-tears in the subtle Nadi sheath at the treatment point — temporarily worsening conditions and creating new Vatham disturbances. Oil creates a conductive medium allowing therapeutic pressure to transfer into the Nadi junction without friction. Additionally, each classical Varma oil contains herbs specifically chosen to address the Dosha disturbance being treated — the oil is not lubricant but the second component of treatment." },
              { num: "02", title: "The Seven Classical Siddha Varma Oils", body: "Karpuradi Oil: camphor base for Pittham Varma conditions (inflammation, fever, heat). Mahamasha Oil: 28-herb base for Vatham Varma (pain, stiffness, paralysis). Bala Oil: Sida cordifolia for general Nadi nourishment after treatment. Nirgundi Oil: Vitex negundo for joint Varma conditions. Murivenna Oil: trauma healing for Varma injury treatment. Pinda Oil: marrow-nourishing for deep bone-level Varma conditions. Chandrabala Oil: cooling moon-quality for Sthapani and Brahmarandhra treatments." },
              { num: "03", title: "Preparing Medicated Oil — Taila Paka Method", body: "Classical Siddha oil preparation: 1 part herb paste plus 4 parts liquid plus 1 part base oil. Mix herb paste and liquid, add oil, heat slowly until all water evaporates — test by dropping oil on cold water (stays intact without spreading when ready). Strain and store in glass. A properly prepared Taila Paka oil has 3-5 year therapeutic shelf life. Commercially available oils vary widely — traditionally prepared are significantly superior." },
              { num: "04", title: "The Practitioner's Protection Protocol", body: "When stimulating a Paddu or Todu Varma point, a discharge of the patient's blocked Prana flows into the practitioner's hands and through their own Nadi system. Without protection, this accumulates as a Vatham disturbance over time. Protection measures: wash hands thoroughly in cold water after treatment; apply camphor oil to own Hridaya Varma after each patient; maintain strong personal daily Varma practice as the primary protection." },
            ],
            technique: {
              name: "Simple Home Varma Oil Preparation",
              steps: [
                "Base: plain sesame oil as the most universally applicable for Vatham conditions.",
                "Add: 5g crushed fresh ginger, 3g camphor, 5 curry leaves to 100ml sesame oil.",
                "Heat on very low flame for 15 minutes — do NOT boil. Maintain below 70 degrees Celsius.",
                "Stir continuously. Oil will become fragrant and slightly golden.",
                "Strain through cloth when slightly cooled. Store in glass jar.",
                "This home preparation has approximately 70 percent of efficacy of classical Karpuradi oil.",
                "Use within 6 months. Store away from sunlight.",
                "For Pittham Varma conditions: replace ginger with equal parts fresh coriander seed and fennel.",
              ],
            },
            medicines: [
              { label: "Mahamasha oil — primary Varma therapy oil for Vatham", text: "The classical 28-herb Mahamasha oil available from traditional Siddha pharmacies. Non-negotiable for serious Varma practice. The single most effective commercial preparation for Vatham-Nadi conditions. Apply warm before every treatment." },
              { label: "Coconut oil with camphor — for Pittham Varma and head points", text: "Two percent camphor in coconut oil: 20 drops camphor essential oil per 100ml coconut oil. Cooling and penetrating. For all head Varma points and any Pittham-condition Varma work." },
              { label: "Castor oil — for Vatham-dominant chronic pain Varma", text: "Pure castor oil applied to arthritic joints and chronic Vatham-pain Varma points before therapy. The most penetrating of all base oils — reaches deep joint and bone-level Nadi junctions. Mix 50-50 with sesame for daily use." },
            ],
            quote: {
              tamil: "எண்ணெய் இல்லா வர்மம் வெறும்\nஆண்மை இல்லா வாள் போல் ஆகும்",
              english: "Varma without oil is like a sword without steel — form without power.",
              master: "Pulippani Siddhar · Varma Sutra",
            },
          } },{ id: "p2l6", title: "Varma for Consciousness — 5 Spiritual Vital Points", duration: "65 min", type: "Advanced" , content: {
            overview: "The five Spiritual Varma points represent the highest application of the Varma system — not for physical healing but for direct activation of states of consciousness associated with liberation, Samadhi, and the awakening of Kundalini Shakti. These points are the physical interface between the gross body and the Sushumna Nadi through which Kundalini ascends.",
            teachings: [
              { num: "01", title: "The Five Spiritual Varma Points", body: "Brahmarandhra (crown): Sahasrara gateway — where Jeevan merges with Para Brahman. Sthapani (third eye): Ajna chakra interface — where individual Buddhi contacts Cosmic Intelligence. Hridaya (heart center): Anahata midpoint — where love dissolves ego boundaries. Muladhara Varma (perineum): Kundalini's dwelling place — the sleeping serpent's chamber. Brahma Nadi (navel center): the Brahma Granthi — the first of three knots Kundalini must pierce." },
              { num: "02", title: "Prerequisites for Spiritual Varma", body: "Spiritual Varma cannot be safely applied without proper preparation. Prerequisites: minimum 40 days daily Pranayama (Nadi purification), established meditation practice producing pratyahara, Sattvic diet for minimum 21 days, absence of active grief or psychological instability, and ideally direct Guru transmission. Applied to unprepared practitioners, Spiritual Varma can temporarily destabilize rather than elevate consciousness." },
              { num: "03", title: "Sthapani Varma — The Accessible Spiritual Point", body: "The Sthapani point (between the eyebrows at the Ajna Chakra) is the most accessible for safe spiritual Varma self-application. Gentle sustained pressure on Sthapani during meditation creates: increased blood flow to the prefrontal cortex, pressure on the frontal sinus creating a mild CSF pulse, activation of the pineal gland's piezoelectric response, and for those with established practice — direct activation of the Ajna Chakra's inner vision faculty." },
              { num: "04", title: "Kundalini Safety — The Siddha Teaching", body: "The Siddha masters are unanimous: premature Kundalini activation through physical Varma stimulation at the Muladhara without proper preparation is dangerous. The spinal canal must be clear of Ama, the Nadi system purified, the mind stable, and the physical body strong. Given these conditions, Muladhara Varma stimulation during Mula Bandha practice is safe and progressive. Without these conditions, it creates fire without a vessel — energy without the capacity to hold it." },
            ],
            technique: {
              name: "Sthapani Dharana — Third Eye Varma in Meditation",
              steps: [
                "Perform minimum 15 minutes Pranayama first — Nadi Shodhana with Kumbhaka.",
                "Sit in comfortable meditation posture, spine erect.",
                "Apply 1 drop Brahmi oil or sandal paste to the Sthapani point between the eyebrows.",
                "Place index finger of right hand at the point — gentle sustained contact, not pressing hard.",
                "Khechari Mudra: tongue pressed to soft palate.",
                "Eyes: gently rotate upward and inward toward Ajna — without strain.",
                "Hold this configuration for 11 minutes without movement. Observe what arises: light, color, pressure, expansion, imagery.",
                "Release. Sit in complete stillness for 5 minutes receiving the state. Journal immediately.",
              ],
            },
            medicines: [
              { label: "Sandalwood paste — for Sthapani Varma activation", text: "Pure sandalwood paste applied to the third eye point before Sthapani Dharana practice. Sandalwood's sattvic cooling quality opens the Pittham-governed third eye channel without overstimulating. Non-negotiable for daily Ajna Varma activation." },
              { label: "Brahmi ghee — half tsp before spiritual Varma practice", text: "The neural lubricant for Sushumna Nadi activity. Consumed 30 minutes before spiritual Varma practice reduces neurological friction as higher-frequency consciousness states move through the neural substrate." },
              { label: "Shatavari plus Brahmi plus Ashwagandha — for Kundalini preparation", text: "The three-herb Ojas-building formula that creates the stable physiological foundation required for safe Kundalini arousal. Take for minimum 40 days before any dedicated Muladhara Varma or Kundalini activation practice." },
            ],
            quote: {
              tamil: "ஆஞ்ஞையில் ஒளி தோன்றும் நாளில்\nவாஞ்சை எல்லாம் வழியில் அமைந்திடும்",
              english: "On the day light appears in Ajna — all desires find their right path.",
              master: "Thirumoolar · Thirumantiram 1820",
            },
          } }] },
    { id: "p3", num: "03", icon: "👁️", title: "Ettavidha Pariksha — 8 Methods of Siddha Diagnosis", subtitle: "Reading the body as a Siddha physician", duration: "6 Lessons · 6 hrs", lessons: [{ id: "p3l1", title: "Nadi, Naa, Niram — Pulse, Tongue, and Color Reading", duration: "70 min", type: "Diagnosis" , content: {
            overview: "Siddha Rasayana science — the preparation of immortality medicines — is among the most sophisticated pharmacological systems in human history. The Rasayanas are not ordinary herbal medicines but alchemically transformed preparations that operate simultaneously on the physical body, the pranic body, and the karmic body. This module introduces the eight supreme Siddha Rasayanas and their preparation principles.",
            teachings: [
              { num: "01", title: "What Makes a Rasayana — The Four Criteria", body: "A Rasayana (Rejuvenation preparation) must meet four criteria: Ayushkara (life-extending), Medhakara (intelligence-enhancing), Balakar (strength-giving), and Vyadhikshamatva-kara (immunity-building). These four qualities reflect the four levels at which a Rasayana operates: physical (life extension), cognitive (intelligence), vital (strength), and defensive (immunity). An herb that meets only one or two criteria is a medicine. One that meets all four is a Rasayana." },
              { num: "02", title: "The Seven Dhatu Rasayanas — One Per Tissue", body: "Siddha identifies seven supreme Rasayanas, one for each Dhatu: Rasa Dhatu — Guduchi (Tinospora cordifolia). Rakta Dhatu — Manjishta (Rubia cordifolia). Mamsa Dhatu — Ashwagandha (Withania somnifera). Meda Dhatu — Guggulu (Commiphora mukul). Asthi Dhatu — Shatavari (Asparagus racemosus). Majja Dhatu — Brahmi (Bacopa monnieri). Sukla/Artava Dhatu — Kapikacchu (Mucuna pruriens). The physician selects the Rasayana for the patient's weakest Dhatu — the tissue-level bottleneck." },
              { num: "03", title: "Shodhana — Purification Before Rasayana", body: "The supreme Siddha principle: Rasayana given to an unpurified body is wasted. The body must first be cleansed of Ama at all levels before a Rasayana can penetrate to the tissue level. Therefore all classical Siddha Rasayana protocols begin with 7-21 days of Shodhana (purification): dietary restriction, Triphala cleansing, fasting, and specific Virechana (purging) herbs. Only after Shodhana is complete does the Rasayana phase begin." },
              { num: "04", title: "Siddha Alchemical Preparations — Parpam and Chendooram", body: "The most powerful Siddha Rasayanas are not herbal but mineral-metallic: Parpam (ash preparations from metals and minerals calcined with herbal juice 7-21 times) and Chendooram (red/orange sulphide preparations). Gold Parpam (Swarna Parpam), Mercury Parpam (Parada Parpam), and Iron Parpam (Ayasya Parpam) are the most potent. These preparations — when properly made by a Siddha master — concentrate the cosmic element into a bioavailable form that transforms tissues at the genetic level." },
            ],
            technique: {
              name: "Rasayana Reception Practice — Preparing the Body to Receive",
              steps: [
                "This technique prepares the system for any Rasayana by maximizing its cellular absorption.",
                "Three days before beginning any Rasayana: reduce food intake by 25%. Eat only easily digestible warm foods.",
                "Each morning: Triphala churna 1 tsp in warm water before bed — clears Ama from intestines.",
                "Day of first Rasayana dose: wake before sunrise. Pranayama 15 minutes.",
                "Take Rasayana in the prescribed form (usually in ghee or honey on empty stomach).",
                "Immediately after: 11 minutes of silent meditation with awareness at the relevant Dhatu location.",
                "No breakfast for 60-90 minutes. Allow the Rasayana to enter the tissues undisturbed.",
                "Log the first week's subtle changes: energy quality, sleep depth, skin luminosity, mental clarity.",
              ],
            },
            medicines: [
              { label: "Chyavanprash — 1-2 tsp morning on empty stomach", text: "The most universally applicable Siddha-Ayurvedic Rasayana. 49 herbs in Amla base with ghee and honey. Rebuilds Ojas, enhances immunity, nourishes all seven Dhatus simultaneously. The safe entry-point for all Rasayana protocols." },
              { label: "Brahma Rasayana — ½ tsp with ghee", text: "Agathiyar's supreme Rasayana for Majja Dhatu (nerve tissue and marrow). Contains Brahmi, Ashwagandha, Shatavari, and 12 other herbs in a ghee-honey base. The premier Siddha formula for neurological restoration and anti-aging of the nervous system." },
              { label: "Amalaki Rasayana — 1 tsp Amla powder + ghee + honey", text: "The simplest complete Rasayana. Amla in ghee and honey meets all four Rasayana criteria. Begin here before progressing to more complex formulas. Safe for all constitutions." },
            ],
            quote: {
              tamil: "இளமையை நிலைக்கச் செய்வோம்
குளமையை நிலைக்கச் செய்வோம்
மூலிகை மூலம் முக்தி பெறுவோம்",
              english: "Let us stabilize youth. Let us stabilize coolness. Through herbs let us attain liberation.",
              master: "Agathiyar · Rasavada Vidhi",
            },
          } },{ id: "p3l2", title: "Mozhi, Kan, Sparisam — Voice, Eyes, and Touch", duration: "65 min", type: "Diagnosis" , content: {
            overview: "Voice (Mozhi), eyes (Kan), and touch (Sparisham) complete the second half of the Siddha eight-fold examination. These three diagnostic modalities operate at subtler levels than pulse and tongue — they read the Sukshma Sharira as much as the physical body. A master Siddha physician can complete a full Mozhi-Kan-Sparisham examination in the first 90 seconds of a patient encounter, before a single word of history is spoken.",
            teachings: [
              { num: "01", title: "Mozhi Pariksha — Voice as Complete Diagnostic Window", body: "Vatham voice: thin, crackling, rapid, intermittent — like wind through dry leaves. Pittham voice: sharp, cutting, mid-pitched, definitive, occasionally heated. Kapham voice: deep, slow, musical, resonant, slightly wet. Beyond Dosha: grief creates a caught quality in the throat; suppressed anger creates flat monotone; fear creates rising pitch at sentence endings. The Siddha physician listens to these qualities before listening to the words — receiving the Dosha picture before the narrative begins." },
              { num: "02", title: "Kan Pariksha — The Eyes as Complete Body Map", body: "Five dimensions: Sclera — yellow tinge indicates liver Pittham; red vessels indicate Rakta Dhatu heat; pale indicates Kapham-anemia. Iris — color distribution indicates constitutional type. Conjunctiva — moisture level indicates Rasa Dhatu quality. Pupil response — slow dilation indicates Kapham; hyper-reactive indicates Vatham; fixed indicates extreme Pittham. Gaze quality — unfocused (Kapham), piercing (Pittham), darting (Vatham) — reveals the dominant mental Dosha." },
              { num: "03", title: "Sparisham Pariksha — Diagnostic Touch", body: "The physician's right hand rests on the patient's forearm for 30 seconds before the formal pulse reading. Skin temperature: hot (Pittham), cool (Vatham or Kapham). Skin texture: dry/rough (Vatham), oily/smooth (Pittham), cool/damp (Kapham). Subcutaneous tissue tone: depleted (low Ojas), excessive (Kapham or Meda excess). Perspiration presence indicates Agni level. A physician with developed Sparisham sensitivity diagnoses the Dosha state before the formal examination begins." },
              { num: "04", title: "Integrating the Three Subtle Diagnostics", body: "Pattern recognition: deep voice plus cool moist skin plus damp conjunctiva equals Kapham dominant. Sharp voice plus yellow sclera plus hot dry skin equals Pittham excess. Thin crackling voice plus dry skin plus darting eyes equals Vatham dominant. Contradictory patterns reveal mixed conditions requiring the most experienced clinical judgment. The integration of all three subtle diagnostics with Nadi and Jihva creates a five-stream diagnostic picture of extraordinary precision." },
            ],
            technique: {
              name: "Mozhi-Kan-Sparisham Self-Assessment",
              steps: [
                "Morning, after tongue and pulse assessment. Natural light essential for Kan examination.",
                "MOZHI: Record your voice in a voice memo. Speak a neutral sentence. Listen back noting pitch, speed, moisture quality, any cracking or flatness.",
                "KAN: Stand before mirror in natural light. Examine each eye: sclera color and vessel pattern, lower eyelid color pulled gently down, pupil size in moderate light.",
                "SPARISHAM: With left hand resting on a flat surface, use right hand fingers to lightly assess temperature of forearm, texture running 3 fingers from elbow to wrist, moisture level.",
                "Cross-reference all three with your Nadi pulse reading from earlier in the morning practice.",
                "Write: My Mozhi indicates blank. My Kan indicates blank. My Sparisham indicates blank. The convergent picture is blank.",
                "Consistency across all assessments equals reliable Dosha picture. Contradictions indicate further investigation needed.",
              ],
            },
            medicines: [
              { label: "Triphala eye wash — for daily Kan Pariksha clarity", text: "Daily Triphala eye wash removes accumulated Pittham from the conjunctival surface, restoring the accuracy of the Kan diagnostic window. Boil quarter tsp Triphala in 200ml water, strain through cloth, cool to body temperature, wash eyes gently." },
              { label: "Yashtimadhu (Mulethi) — for Mozhi diagnostic preparation", text: "Licorice root soothes the Vishuddha channel, clearing Kapham accumulation that would distort the voice diagnostic. A Siddha physician who practices vocal hygiene with Yashtimadhu develops significantly more nuanced Mozhi diagnostic sensitivity over time." },
              { label: "Neem oil — for standardizing Sparisham diagnostic surface", text: "Neem oil applied to the forearm creates a neutral sensory surface for the Sparisham reading by removing environmental substances that would confound the Dosha-based temperature and texture reading." },
            ],
            quote: {
              tamil: "கண்ணால் கண்டவை ஆயிரம் சொல்லும்\nகையால் தொட்டவை ஆழமாய் சொல்லும்",
              english: "What the eyes see, a thousand words tell — what the hand touches speaks more deeply still.",
              master: "Agathiyar · Nidana Parishodhana",
            },
          } },{ id: "p3l3", title: "Malam, Moothiram — Stool and Urine Analysis", duration: "75 min", type: "Diagnosis" , content: {
            overview: "Malam (stool) and Moothiram (urine) examination constitute the most direct diagnostic windows into Agni and the Mala systems. In Siddha medicine, the quality of elimination is a precise mirror of tissue metabolism — what comes out reveals everything about what is happening inside. This lesson presents the complete examination system including the classical Sesame Oil Float Test.",
            teachings: [
              { num: "01", title: "Malam Pariksha — Stool Examination in Full", body: "Siddha stool examination reads: Frequency — 1-3 times daily is normal; less indicates Vatham; more indicates Pittham. Color: brown equals normal; yellow-green equals Pittham and liver stress; grey-pale equals Kapham and poor fat metabolism; black-tarry equals Ama in blood (serious); mucus indicates intestinal Ama. Consistency: hard or pellet equals Vatham; loose and burning equals Pittham; heavy and mucoid equals Kapham. Smell: intensely foul indicates deep Ama; odorless indicates Kapham; acidic-burning indicates Pittham." },
              { num: "02", title: "The Sesame Oil Float Test — Classical Moothiram Pariksha", body: "Collect first-morning midstream urine in a white vessel. Add one drop of sesame oil. Observe in sunlight. Oil spreads evenly and quickly: Vatham disturbance. Oil forms a ring at edges: Pittham disturbance. Oil sinks and beads: Kapham disturbance. Oil forms snake-like patterns: Vatham-Pittham combination. Multiple droplets scattered: multiple Dosha disturbance. The pattern's progression direction toward the examiner indicates positive prognosis; away indicates challenging prognosis." },
              { num: "03", title: "Urine Color as Organ Map", body: "Siddha urine color diagnosis: pale or clear equals Kapham, dehydration, or low Agni. Deep yellow equals Pittham excess and liver stress. Orange equals high Pittham and possible jaundice. Red or pink equals Rakta Dhatu in urine — serious, kidney involvement. Cloudy white equals urinary Ama or infection. Foamy equals protein loss and kidney Dhatu depletion. Green-blue equals severe Pittham-bile disturbance. Dark brown equals severe dehydration or Rakta Dhatu burning." },
              { num: "04", title: "Frequency and Timing — What Normal Looks Like", body: "Siddha normal parameters: urine — 4-6 times daily, 150-200ml per urination, light yellow, clear, mild odor, complete emptying. Stool — 1-2 times daily preferably morning after waking, formed but not hard, sinking but not sticky, complete elimination with minimal wiping required (Agni-complete digestion leaves minimal residue). Any deviation from these parameters is clinically significant and demands inquiry into its Dosha origin." },
            ],
            technique: {
              name: "Morning Mala-Moothiram Assessment — 10-Minute Protocol",
              steps: [
                "Keep a small white ceramic cup and a bottle of sesame oil by the toilet for 7 days of assessment.",
                "First morning urination: collect 30ml of midstream urine in the white cup.",
                "Observe color immediately before adding oil. Note in journal.",
                "Add one drop sesame oil. Observe for 60 seconds in natural light.",
                "Note oil behavior: spread (Vatham), ring (Pittham), sink (Kapham), pattern (combination).",
                "Empty cup. Assess stool when it occurs noting color, consistency, frequency, completeness.",
                "Cross-reference Mala and Moothiram assessment with morning Nadi reading for a complete picture.",
                "7 consecutive days reveals the chronic Dosha pattern more reliably than a single diagnostic session.",
              ],
            },
            medicines: [
              { label: "Triphala — before bed for Malam normalization", text: "The single most effective formula for normalizing all three Mala parameters. Vatham constipation: 2 tsp with warm water. Pittham loose stool: 1 tsp with cooling Anupana such as aloe juice. Kapham mucoid stool: half tsp with ginger and honey." },
              { label: "Punarnava (Boerhavia diffusa) — for Moothiram normalization", text: "The supreme Siddha kidney tonic and diuretic. Normalizes urine production, clears urinary Ama, reduces protein in urine. The first herb prescribed for any Moothiram abnormality. Safe long-term. Available as fresh root decoction or dried powder." },
              { label: "Gokshura (Tribulus terrestris) — for urinary Vatham", text: "For incomplete urination, post-void dribble, or scanty urine output: Gokshura 1 tsp in coconut water daily. Specifically addresses Vatham in the urinary channel — the most common urinary Dosha pattern in sedentary practitioners." },
            ],
            quote: {
              tamil: "மலம் மூத்திரம் பார்த்தல் மருத்துவம்\nகலங்காது அறிந்தோர் கலை வல்லோர்",
              english: "Examining stool and urine is medicine — those who know this without confusion are masters of the art.",
              master: "Agathiyar · Nidana Vidhi",
            },
          } },{ id: "p3l4", title: "Integrating the 8 Methods — Complete Clinical Reading", duration: "80 min", type: "Clinical" , content: {
            overview: "Complete clinical reading (Poorna Pariksha) is the integration of all eight Siddha examination methods into a coherent unified diagnostic picture — the final step from information gathering to treatment planning. This lesson teaches the integration algorithm used by master Siddha physicians to synthesize eight streams of diagnostic data into a single precise treatment driver.",
            teachings: [
              { num: "01", title: "The Three-Layer Integration Framework", body: "Master Siddha physicians organize the eight examination points into three layers: Gross body layer (Sthula Sharira) — Nadi, Malam, Moothiram. Subtle body layer (Sukshma Sharira) — Jihva, Sparisham, Neta. Causal body layer (Karana Sharira) — Sabda patterns, Mukha. Treatment addresses all three layers, but the entry point is always the layer where the primary disturbance is located — determining whether to start with herbs, mantra, or both." },
              { num: "02", title: "The Diagnostic Hierarchy — When Findings Contradict", body: "When examination findings contradict each other (Nadi shows Vatham but tongue shows Pittham), apply the resolution hierarchy: Nadi takes precedence over all others. Jihva takes precedence over urine and stool. Moothiram takes precedence over Malam. When Nadi and Jihva contradict: the patient has a mixed Dosha condition requiring both Doshas addressed simultaneously. This is the most common presentation in modern clinical practice." },
              { num: "03", title: "The Agni Assessment — The Master Key", body: "The single most important integrative question: is this patient's Agni adequate? Regardless of which Dosha is dominant, treatment success depends on Agni sufficiency. Weak Agni means prescribed medicine will not be absorbed regardless of its quality. Test: does the patient digest food within 4 hours without bloating or heaviness? Does the tongue have significant coating? Are Mala parameters abnormal? If yes to any: address Agni first before any Rasayana." },
              { num: "04", title: "Writing the Siddha Diagnosis — The Three-Sentence Summary", body: "A complete Siddha diagnosis is expressed in three sentences: Sentence 1 — Primary Dosha disturbance with specific Nadi, tongue, and skin findings. Sentence 2 — Tissue and channel involvement: the primary Dhatu affected with secondary Srota involvement. Sentence 3 — Psychosomatic component: the emotion or pattern localized at the relevant chakra or organ. This three-sentence structure drives complete treatment planning across physical, energetic, and karmic levels." },
            ],
            technique: {
              name: "Complete Self-Diagnosis — The 20-Minute Siddha Clinical Protocol",
              steps: [
                "Set aside 20 minutes. Gather: mirror, white cup, sesame oil, journal.",
                "Minutes 1-3: NADI. Three-minute pulse assessment as per Module 1. Record dominant Dosha.",
                "Minutes 4-6: JIHVA. Tongue examination. Record coating color, thickness, location, moisture, cracks.",
                "Minutes 7-9: NETA plus MUKHA. Eye examination and facial scan. Record sclera color and facial zone observations.",
                "Minutes 10-12: SPARISHAM plus SABDA. Touch your forearm and record skin quality. Record your voice quality from morning.",
                "Minutes 13-15: MOOTHIRAM from morning assessment. Record color and oil test result.",
                "Minutes 16-18: INTEGRATION. Write the three-sentence Siddha diagnosis based on today's complete data.",
                "Minutes 19-20: TREATMENT DECISION. Based on the diagnosis: one dietary change, one herb, one practice for today.",
              ],
            },
            medicines: [
              { label: "Trikatu — Agni activation first when integration reveals weakness", text: "When integration reveals Agni deficiency — the most common finding — Trikatu before all else. Quarter tsp in honey before meals for 7 days. Restores the absorption capacity that makes all subsequent medicines effective." },
              { label: "Guduchi (Tinospora) — the integration medicine for complex pictures", text: "When the diagnosis shows multiple Dosha involvement, Guduchi is the tridoshic bridge — simultaneously addressing all three without agitating any. The physician's default prescription when the picture is complex and confusing." },
              { label: "Shatavari plus Ashwagandha — for depleted Ojas underlying complex pictures", text: "When the integrated diagnosis shows depleted Ojas underlying a multi-Dosha picture, these two create the stable foundation from which Dosha-specific treatment then proceeds more effectively." },
            ],
            quote: {
              tamil: "அஷ்ட ஸ்தானம் அறிந்தவன் ஆளும்\nவைத்திய ரகசியம் வாய்க்கும் அவனுக்கே",
              english: "One who knows the eight examination stations governs — to that one the secret of medicine is granted.",
              master: "Agathiyar · Ashta Sthana Vidhim",
            },
          } },{ id: "p3l5", title: "Aura and Subtle Body Reading in Siddha", duration: "60 min", type: "Advanced" , content: {
            overview: "Subtle body reading (Sukshma Sharira Pariksha) extends diagnosis beyond the physical examination into the pranic field, emotional body, and auric envelope of the patient. This lesson introduces the foundational framework and basic practices for developing subtle diagnostic capacity — the extension of clinical sensitivity that distinguishes the Siddha physician from the herbalist.",
            teachings: [
              { num: "01", title: "The Three Subtle Bodies in Siddha Anatomy", body: "Beyond the physical: Sukshma Sharira (subtle body) — the Prana body made of Nadi channels and chakra centers. Karana Sharira (causal body) — the seed body containing karmic impressions and the soul's blueprint. Jeevan (the immortal soul continuum) — the consciousness that inhabits and eventually transcends all three bodies. Disease originates in the subtle or causal body first; the physical manifests it last. Reading the subtle body catches diseases before they fully manifest physically." },
              { num: "02", title: "Sensing the Tejas Field — The Entry-Level Subtle Diagnosis", body: "The human energy field in Siddha is described as Tejas-Prana-Ojas — three concentric layers extending beyond the physical body. Tejas (1-2 cm from skin): corresponds to the etheric body. Prana field (5-20 cm): carries the Nadi pattern. Ojas field (30-60 cm): reflects overall vitality and spiritual luminosity. Diminished Ojas field below 15 cm in any direction indicates serious depletion requiring Rasayana intervention — a diagnosis accessible to anyone with basic hand sensitivity." },
              { num: "03", title: "Emotional Ama Mapping — The Most Practical Subtle Diagnosis", body: "The most practically accessible subtle body diagnosis is emotional Ama mapping. Each organ area carries specific emotional memory: Liver (right side under ribcage) — anger and resentment. Lungs (chest) — grief and loss. Kidneys (lower back) — fear and insecurity. Heart center — heartbreak and isolation. Navel — power struggles and shame. The Siddha physician places a hand 10 cm above these areas and senses which carries the densest emotional Ama — this becomes the first treatment priority." },
              { num: "04", title: "Three Development Stages of Subtle Reading Capacity", body: "Stage 1: Sensing temperature differentials in the pranic field — achievable in 40 days of daily practice. Stage 2: Sensing texture and density variations — achievable in 3-6 months. Stage 3: Seeing color and form directly — typically 1-3 years. The development begins by holding your hands 5 cm above your own skin in stillness and sensing temperature differences. Areas of heat anomaly correlate with Pittham-Ama deposits; cool anomalies with Vatham-Prana deficiency." },
            ],
            technique: {
              name: "Tejas Field Sensing — Introduction to Subtle Body Diagnosis",
              steps: [
                "Sit quietly for 5 minutes of Pranayama to sensitize the nervous system.",
                "Rub palms together briskly for 30 seconds. Slowly separate to 5 cm apart. Feel the warmth and pressure between them.",
                "This is your first direct experience of Tejas — the vehicle of subtle body diagnosis.",
                "Now hold your left hand 5 cm above your right forearm. Eyes closed. Move the hand slowly.",
                "Note any temperature variations, areas of increased or decreased density, tingling, magnetic sensation.",
                "Move to your own abdomen, chest, and head in the same way. 30 seconds in each area.",
                "Mark in journal where you sensed the strongest Tejas activity and where the weakest.",
                "Over 40 days of daily practice, these readings become increasingly reliable and clinically meaningful.",
              ],
            },
            medicines: [
              { label: "Brahmi ghee — daily for developing subtle body sensitivity", text: "The nervous system lubricant for pranic field perception. Daily half tsp Brahmi ghee over 40 days measurably increases sensitivity of proprioceptive and pranic perceptual systems. The Siddha physician's tool for developing subtle diagnostic capacity." },
              { label: "Ashwagandha plus Brahmi — for the practitioner's sensing development", text: "This combination for the practitioner builds the stable sensitized nervous system required for reliable subtle body reading. Strong Ojas is the foundation; refined Tejas is the instrument. Both require consistent practice with these two herbs." },
              { label: "Sandalwood paste — applied to palm chakras before subtle practice", text: "The minor chakras in the center of each palm are the primary organs of subtle body reading. Sandal paste applied before practice opens and sensitizes these diagnostic organs for more refined pranic field perception." },
            ],
            quote: {
              tamil: "சூக்கும உடல் சொல்வதை கேட்பவன்\nஸ்தூல உடல் நோயை முன்னே காண்பான்",
              english: "One who listens to what the subtle body says — sees the gross body's disease before it arrives.",
              master: "Thirumoolar · Thirumantiram 2456",
            },
          } },{ id: "p3l6", title: "Karmic Disease Diagnosis — Reading the Uyir Layer", duration: "70 min", type: "Advanced" , content: {
            overview: "Karmic disease diagnosis (Karma Vikadhi Nidana) is the most advanced aspect of Siddha clinical practice. This lesson presents the precise framework for distinguishing constitutional disease (Swabhavika), environmental disease (Agantuka), and karmic disease (Karma Vikadhi) — including the specific diagnostic signs that differentiate these categories and the unique treatment approach each requires.",
            teachings: [
              { num: "01", title: "Three Origins of Disease — The Definitive Siddha Classification", body: "Swabhavika (constitutional): arises from birth Prakriti and is managed, not cured. Agantuka (exogenous): arises from external causes — infection, injury, environmental toxin, poor diet. Fully curable with appropriate treatment. Karma Vikadhi (karmic): arises from accumulated karmic impressions across this and previous lifetimes. The most challenging because the root cause is not physical. Distinguishing these three is the first and most critical diagnostic step — prescribing Rasayana for a Karma Vikadhi condition is like applying paint to a structural crack." },
              { num: "02", title: "Diagnostic Signs of Karma Vikadhi Disease", body: "A disease has karmic origin when: it began suddenly without apparent physical cause; it persists despite appropriate treatment; all eight diagnostic parameters show inconsistency with no clear Dosha picture; it appears at significant karmic timing (Sade Sati, Rahu-Ketu axis years); multiple family members share the same condition without shared environmental cause; the patient reports a recurring dream pattern that began with the disease; the patient intuitively feels the disease has a meaning or teaching." },
              { num: "03", title: "Past-Life Disease Patterns — The Siddha Reading", body: "Siddha masters identified specific disease-karma correspondences: Chronic skin diseases often originate from past-life Ahimsa violations. Blindness or severe eye conditions often originate from willful blindness to dharma violations. Paralysis often from past-life use of power to immobilize others. Chronic respiratory from suppression of truth (Vishuddha karma). These correspondences indicate the karmic territory within which the healing work must occur — not deterministic but directionally accurate." },
              { num: "04", title: "The Treatment Protocol for Karma Vikadhi", body: "Karma Vikadhi treatment requires four simultaneous interventions: Medical (herbs and physical treatment to manage symptoms and support the Jeevan during the karmic process), Astrological (timing treatments to planetary transits and performing remedial Pujas during challenging Dasha periods), Mantra-Yantra-Tantra (specific Siddha ritual prescriptions for the karmic pattern identified), and Gnana (wisdom practices helping the patient understand and extract the dharmic teaching from the disease, which accelerates resolution)." },
            ],
            technique: {
              name: "Karma Vikadhi Self-Assessment — The Seven Questions",
              steps: [
                "Written contemplation practice. Prepare paper and at least 45 minutes of uninterrupted time.",
                "Question 1: When exactly did this condition begin? What was happening in your life in the 3-6 months before?",
                "Question 2: Has this condition resisted appropriate treatment? For how long?",
                "Question 3: Do any family members share this condition? Any generational patterns?",
                "Question 4: What does this condition prevent you from doing that you most want to do? This points to the karmic teaching area.",
                "Question 5: If this condition had a message for you, what would it say?",
                "Question 6: What have you learned about yourself through having this condition?",
                "Question 7: If this condition resolved tomorrow, what would you do differently in your life?",
                "Review your answers. The pattern revealed IS the karmic teaching. The treatment is living that teaching.",
              ],
            },
            medicines: [
              { label: "Karma-clearing Puja materials — ghee lamp, neem incense, Vibuthi", text: "The physical materials for Karma Vikadhi treatment. Weekly Puja with these elements during appropriate Siddha timing (full moon, Shivaratri, patient's birth star day) addresses the causal body layer of the disease. These are precise vibrational interventions at the Karana Sharira level." },
              { label: "Navagraha herbs — taken during appropriate planetary transitions", text: "Nine planetary herbs taken during challenging Dasha and transit periods. Sun (Bael), Moon (Shatavari), Mars (Nochi), Mercury (Brahmi), Jupiter (Ashwagandha), Venus (Rose and Shatavari), Saturn (Sesame), Rahu (Gulancha), Ketu (Vidari). Timing herb intake to planetary transits creates the physical-karmic medicine bridge." },
              { label: "Guduchi (Amrita) — the karmic disease adjuvant", text: "Guduchi means the one who protects — daily Guduchi during Karma Vikadhi conditions creates a stable physical platform from which the karmic work can proceed without the physical body collapsing under the pressure of the transformation process." },
            ],
            quote: {
              tamil: "கர்மம் என்னும் வினை கடினமானது\nதர்மம் என்னும் மருந்தால் தீரும்",
              english: "Karma — accumulated action — is hard. It is healed by the medicine called Dharma.",
              master: "Agathiyar · Karma Gnanam",
            },
          } }] },
    { id: "p4", num: "04", icon: "🥗", title: "Advanced Siddha Dietary Medicine", subtitle: "Food as alchemical medicine — the complete system", duration: "6 Lessons · 5 hrs", lessons: [{ id: "p4l1", title: "The 6 Tastes as Medicine — Complete Suvai System", duration: "60 min", type: "Nutrition" , content: {
            overview: "The Six Tastes system (Arusuvai) is the foundational grammar of Siddha nutritional medicine. Every food substance is analyzed through its Suvai (taste) profile, which determines precisely how it affects the three Doshas, which Dhatus it nourishes, and what disease conditions it treats or creates. Mastering Shad Rasa converts every meal into clinical medicine.",
            teachings: [{ num: "01", title: "Sweet and Sour — The Two Building Tastes", body: "Sweet (Inippu) nourishes Ojas, builds all Dhatus, and reduces Vatham and Pittham. Excess creates Kapham, obesity, and diabetes. Sources: whole grains, root vegetables, ghee, dates. Essential in convalescence and Ojas depletion. Sweet from complex carbohydrates is Sattvic; from refined sugar it is Tamasic. Sour (Pulippu) kindles Agni, improves digestion, nourishes Rakta Dhatu, reduces Vatham. Excess creates Pittham excess and acid conditions. Sources: buttermilk, tamarind, citrus, amla." },
              { num: "02", title: "Salty and Pungent — The Stimulating Tastes", body: "Salty (Uvarppu) enhances all flavors, promotes digestion, and pacifies Vatham. Rock salt is preferred — contains 84 minerals vs commercial salt's 2. Excess creates hypertension. Pungent (Kaarpu) kindles Agni, clears Kapham, promotes circulation. Excess causes Vatham-Pittham aggravation. Sources: ginger, black pepper, chili, garlic. These two tastes are primary tools of Agni activation in Siddha dietary medicine." },
              { num: "03", title: "Bitter and Astringent — The Cleansing Tastes", body: "Bitter (Kasappu) reduces Pittham and Kapham, detoxifies blood, reduces fever. Excess depletes all tissues. Sources: neem, turmeric, bitter gourd. Astringent (Thuvarpu) reduces Pittham and Kapham, heals wounds, tones tissues. Excess creates Vatham excess and constipation. Sources: unripe fruits, banana peel, pomegranate skin, green tea. Together bitter and astringent are the primary Ama-clearing tastes." },
              { num: "04", title: "The Six-Taste Meal Architecture", body: "The goal in every Siddha meal: include at least five of the six tastes. Dosha adjustment: Vatham types increase sweet and sour, reduce pungent and bitter. Pittham types increase sweet and bitter, reduce sour and pungent. Kapham types increase pungent and bitter, reduce sweet. The six tastes working together create complete nutritional medicine — no supplementation required when all six are present in appropriate proportion to the individual's Dosha state." }],
            technique: { name: "Six-Taste Daily Incorporation — The Siddha Meal Architecture", steps: ["SWEET: grains such as rice and roti, root vegetables, dairy — the bulk of the meal.",
                "SOUR: buttermilk, tamarind in sambar, a squeeze of lime — small but present at every meal.",
                "SALTY: rock salt cooked into food — never added from a shaker after cooking.",
                "PUNGENT: fresh ginger grated into cooking, black pepper on everything, appropriate heat in curry.",
                "BITTER: small amount of bitter gourd, turmeric in every dish, neem chutney at least weekly.",
                "ASTRINGENT: pomegranate seeds, green vegetables, small piece of raw banana with meals.",
                "Adjust according to Dosha: Vatham increase sweet and sour. Pittham increase sweet and bitter. Kapham increase pungent and bitter."] },
            medicines: [{ label: "Rock salt — replace all commercial refined salt immediately", text: "The 84 trace minerals in rock salt maintain electrolyte balance at a level impossible with refined salt. The single most impactful simple dietary intervention with zero cost and immediate benefit." },
              { label: "Turmeric — quarter tsp in everything cooked", text: "Anti-inflammatory, Pittham-Kapham reducing, Ama-clearing, and Rakta Dhatu purifying. Non-negotiable in every Siddha kitchen meal." },
              { label: "Tamarind — small amount in daily cooking", text: "The premier Siddha sour taste medicine containing tartaric acid, B vitamins, and antioxidants. Avoid in Pittham-dominant patients and those with active acid conditions." }],
            quote: { tamil: "ஆறு சுவை அறிந்தோர் நோயிலா வாழ்வார்", english: "Those who know the six tastes live without disease.", master: "Agathiyar · Suvai Vidhim" }
          } },{ id: "p4l2", title: "Virudhahara — Food Incompatibilities and Disease", duration: "65 min", type: "Clinical" , content: {
            overview: "Virudhahara — food incompatibilities — is Siddha medicine's most practical contribution to daily life. Specific food combinations create Ama even when individual foods are perfectly healthy. Mastering the nine primary incompatibilities immediately reduces inflammatory load and eliminates 40-60 percent of common chronic conditions without any herbal intervention.",
            teachings: [{ num: "01", title: "The Science Behind Virudhahara", body: "Modern gastroenterology supports many classical Virudhahara observations: milk plus fish creates a Maillard reaction producing advanced glycation end-products. Fruit plus cooked food creates competitive fermentation in the intestine. Hot plus cold simultaneously creates thermal shock disrupting digestive enzyme function. Honey heated above 60 degrees Celsius creates hydroxymethylfurfural, a cytotoxic compound. Siddha discovered these mechanisms through observational clinical science across centuries." },
              { num: "02", title: "The Nine Primary Incompatibilities", body: "1. Milk plus fish or meat — protein precipitation and Ama. 2. Milk plus sour fruits — protein curdling in stomach. 3. Honey plus ghee in equal proportions — toxic (unequal is medicinal). 4. Cold liquids with oily food — congeals fat and prevents digestion. 5. Fruit with cooked food — fermentation. 6. Milk plus alcohol. 7. Radish plus milk. 8. Banana plus milk — one of the most Kapham-creating combinations. 9. Fish plus dairy. Violations create measurable increases in inflammatory markers over 4-6 weeks." },
              { num: "03", title: "Temperature Incompatibilities — The Never Simultaneous Rule", body: "No cold water immediately after hot food — 30-minute minimum gap. No ice cream or cold drinks with meals. No cold milk immediately after hot food. No cold fruit as dessert to a hot meal. The stomach maintains 37-40 degrees for optimal enzyme function. Cold foods cause local temperature drops that directly inhibit pepsin and amylase — the two most critical early digestive enzymes." },
              { num: "04", title: "Satmya — Individual Compatibility Overrides Universal Rules", body: "If a person has eaten a forbidden combination daily for their entire life and thrives — that combination has become Satmya (compatible) for that person. Forcing removal of a lifelong Satmya combination causes more disturbance than maintaining it. The Virudhahara rules apply most strongly to new dietary introductions and to individuals with low Agni — not as absolute rules for everyone." }],
            technique: { name: "Virudhahara Elimination — 21-Day Incompatibility Reset", steps: ["Day 1: Audit your current diet. Write down every common food combination you eat regularly.",
                "Cross-reference with the nine primary incompatibilities. Circle any violations.",
                "Eliminate ONE violation per week — do not try to change everything simultaneously.",
                "Week 1 priority: separate fruit from cooked meals by minimum 30 minutes before or 2 hours after.",
                "Week 2: Eliminate cold liquids with oily food. Drink warm or room-temperature water with meals.",
                "Week 3: Address the highest-impact remaining violation for your specific conditions.",
                "Assessment at Day 21: note changes in digestion — bloating, gas, heaviness after meals, energy levels.",
                "These three removals alone produce measurable digestive improvement in 85 percent of practitioners."] },
            medicines: [{ label: "Hingvastak Churna — quarter tsp with first bite of meal", text: "The Siddha antidote for mild Virudhahara effects. Hing (asafoetida) plus 7 herbs applied at the start of meals containing mild incompatibilities dramatically reduces Ama formation." },
              { label: "CCF tea (Cumin-Coriander-Fennel) — after incompatible meals", text: "Equal parts cumin, coriander, and fennel seeds boiled in water. The triple-action Agni booster that metabolizes the mixed signals of an incompatible meal. Drink 150ml warm 30 minutes after any meal causing digestive discomfort." },
              { label: "Ajwain plus rock salt — for acute Ama from incompatible foods", text: "Immediate relief: half tsp Ajwain plus pinch rock salt chewed directly, followed by warm water. Ajwain's powerful Agni-kindling quality rapidly clears acute Ama. The Siddha emergency digestive prescription." }],
            quote: { tamil: "விரோத உணவு வீண் மருந்தாகும்", english: "Incompatible food becomes useless medicine.", master: "Agathiyar · Pathyam Vidhim" }
          } },{ id: "p4l3", title: "Seasonal Diet — Adjusting for Cosmic Cycles", duration: "55 min", type: "Seasonal" , content: {
            overview: "Ritucharya — seasonal dietary adjustment — is Siddha's most elegant preventive medicine system. The human body shifts its Dosha balance, Agni strength, and tissue requirements with every seasonal transition. Eating the same diet year-round while seasons change is like wearing the same clothing regardless of temperature.",
            teachings: [{ num: "01", title: "The Six Tamil Seasons", body: "Tamil Siddha medicine uses six seasons: Kaar Kaalam (July-August, monsoon onset) — Vatham accumulates. Koothir Kaalam (September-October) — Vatham peaks, Pittham begins rising. Munpani Kaalam (November-December) — Kapham begins building. Pinpani Kaalam (January-February) — Kapham peaks, Agni is strongest. Ilavenil Kaalam (March-April) — Pittham rising, Kapham liquefying. Muthuvenil Kaalam (May-June, summer peak) — Pittham peaks, Vatham begins." },
              { num: "02", title: "Winter — The Supreme Rasayana Season", body: "Pinpani Kaalam (deep winter) is the supreme Rasayana season. Kapham is dominant, Agni is at its annual peak (cold weather drives internal fire), and the body's anabolic capacity is highest. Traditional Siddha families begin their annual Chyavanprash, Ashwagandha, and Shatavari protocols in November and continue through February. The Ojas built in winter sustains the body through the depleting summer heat." },
              { num: "03", title: "Summer — The Cooling and Reducing Season", body: "Muthuvenil Kaalam requires the most radical dietary adjustment. Pittham peaks — without dietary modification most Pittham-dominant conditions peak simultaneously. Summer Siddha diet: maximum hydration with coconut water and rose water. Cooling vegetables: cucumber, ash gourd, ridge gourd. Minimal spices. Maximum sweet and bitter tastes. No alcohol or fermented foods. Replace all warm drinks with room-temperature drinks — not cold (which creates Ama) but cool." },
              { num: "04", title: "Monsoon — The Virechana and Detox Season", body: "Kaar Kaalam (monsoon onset) is the traditional Siddha Virechana (purification) season. The rain cools summer's Pittham excess while simultaneously causing Vatham accumulation from variable temperatures and dampness. The body has maximum accumulated metabolic waste from summer. Traditional Siddha families perform their annual Virechana during monsoon with Castor oil or Triphala." }],
            technique: { name: "Seasonal Diet Transition — The Four Key Adjustments", steps: ["Note your current season and its dominant Dosha from the six-season system above.",
                "DOMINANT DOSHA REDUCTION: For the season's dominant Dosha, reduce its aggravating tastes by 30 percent.",
                "Summer and Pittham: Reduce sour, salty, pungent. Increase sweet, bitter, astringent.",
                "Winter and Kapham: Reduce sweet, sour, salty. Increase pungent, bitter, astringent.",
                "Monsoon and Vatham: Reduce pungent, bitter, astringent. Increase sweet, sour, salty.",
                "TIMING: Eat larger meals when Agni is strongest — noon in summer, morning in winter.",
                "TEMPERATURE: Match food temperature to season inverse — warm foods in cold seasons, cool-temperature foods in summer.",
                "Implement ONE change per week to prevent digestive shock from abrupt dietary transitions."] },
            medicines: [{ label: "Chyavanprash — winter Rasayana protocol October through February", text: "Begin October 1. Take 1-2 tsp daily. The winter Rasayana protocol is the single most impactful annual health practice. The Ojas stored in winter directly determines summer resilience and immunity strength." },
              { label: "Amla juice or fresh Amla — daily in summer", text: "The premier summer food-medicine. Amla's post-digestive effect becomes sweet making it Pittham-reducing despite its sour taste. Maximum Vitamin C for summer oxidative stress." },
              { label: "Castor oil plus warm milk — monsoon annual Virechana", text: "Traditional annual monsoon purification: half to 1 tsp castor oil in warm milk before bed one night per month during monsoon. The gentlest annual Virechana creating the clean slate for the subsequent Rasayana season." }],
            quote: { tamil: "ருதுவுக்கு ஏற்ற உணவை உண்பவன் ரோகம் அற்று ஆயுளோடு வாழ்வான்", english: "One who eats according to the season lives long and disease-free.", master: "Agathiyar · Ritucharya Sutra" }
          } },{ id: "p4l4", title: "Fasting as Medicine — Siddha Upavasa Protocols", duration: "70 min", type: "Therapeutic" , content: {
            overview: "Siddha fasting science (Upavasa Vidhim) is a precisely calibrated physiological event with specific timing, duration, and breaking protocols. This lesson presents the five primary Siddha fasting modalities and their specific clinical indications, including critical safety information about who should not fast.",
            teachings: [{ num: "01", title: "Upavasa — The Literal Meaning as Medical Principle", body: "Upavasa literally means dwelling near — specifically, dwelling near the Divine. Siddha fasting is not primarily physical detoxification but a state of heightened receptivity achieved through strategic reduction of the digestive burden. When digestion pauses, the body's intelligence redirects to repair, and the mind's attention redirects toward subtler perceptions drowned out by the noise of digestion." },
              { num: "02", title: "The Five Siddha Fasting Methods", body: "1. Ekadashi Fast (11th lunar day) — water and fruit only; standard Kapham-Pittham reduction. 2. Full Moon Fast — light fruit diet; for emotional Ama release and Ojas consolidation. 3. Intermittent Siddha Fast — 16-hour eating window; daily Agni calibration. 4. Virechana Fast — 2-3 day preparation for therapeutic purgation. 5. Kayakalpa Fast — extended 7-21 day supervised fast on Rasayana drinks and light milk; the most advanced Kaya Kalpa acceleration technique." },
              { num: "03", title: "Breaking the Fast — The Most Critical Phase", body: "Breaking the fast incorrectly destroys all benefits. The absolute rule: break any fast first with warm water — minimum 500ml. Then fresh juice of easily digestible fruit such as coconut water or pomegranate. Then minimum 2 hours later warm thin soup or Kashayam. Then minimum 4 hours after soup light semi-solid food. Normal meals resume only after 24 hours of progressive breaking. Breaking with solid food immediately after a fast creates severe Agni shock." },
              { num: "04", title: "Contraindications — Who Should Not Fast", body: "Siddha medicine prohibits fasting in: pregnancy, active lactation, severe emaciation, active fever, children under 12, severe Vatham conditions such as extreme anxiety or insomnia, bleeding disorders, and any condition requiring continuous medication timing. Fasting worsens Vatham — the most common Dosha imbalance in modern sedentary lifestyle. Vatham-dominant people need modified fasting: mono-diet of kitchari only rather than complete food restriction." }],
            technique: { name: "Ekadashi Fast — The Universal Monthly Siddha Protocol", steps: ["Identify the next Ekadashi (11th lunar day, occurring twice monthly) using any Panchanga or Hindu calendar app.",
                "DAY BEFORE: eat lightly. Last meal before sunset. No meat, heavy food, or stimulants.",
                "FAST DAY: water, coconut water, fresh fruit juice only. Herbal teas permitted — ginger, tulsi, coriander.",
                "MENTAL PRACTICE: reduce all non-essential activity. Use digestive energy for meditation, mantra, or contemplation.",
                "EVENING OF FAST: warm turmeric milk is allowed — light liquid easily processed.",
                "BREAKING THE FAST next morning: warm water 500ml. Then fresh fruit. Then kitchari at noon. Normal meals resume next day.",
                "Monthly Ekadashi fast is the single most powerful preventive health practice in the Siddha-Vedic tradition."] },
            medicines: [{ label: "Pippali plus honey — to maintain Agni during extended fasting", text: "Pippali kindles Agni without requiring food substrate — allowing Agni to remain active clearing Ama while the digestive system rests. Quarter tsp in honey during any fast longer than 24 hours." },
              { label: "Ashwagandha in warm milk — for Vatham types needing modified fasting", text: "Vatham types: instead of complete fasting, take Ashwagandha in warm milk twice daily on fast days. Milk provides a grounding substrate and Ashwagandha provides Ojas support." },
              { label: "Ginger plus coriander plus fennel water — the universal fast drink", text: "Equal parts ginger, coriander seed, and fennel boiled in water. Maintains Agni, reduces Ama, and prevents Vatham aggravation. Drink 1 liter throughout the fasting day." }],
            quote: { tamil: "உபவாசம் உடலின் துப்புரவு ஆத்மாவின் தெளிவின் வாசல்", english: "Fasting is the cleansing of the body — the doorway to the clarity of the soul.", master: "Agathiyar · Upavasa Vidhi" }
          } },{ id: "p4l5", title: "The Siddha Kitchen — Spice Medicine Preparation", duration: "75 min", type: "Practical" , content: {
            overview: "The Siddha kitchen is not merely where food is prepared — it is a pharmacy, a laboratory, and a temple. Every spice is a medicine. The Siddha physician who teaches a patient to cook correctly teaches them to medicate themselves three times daily, 365 days per year — the most potent long-term prescription available.",
            teachings: [{ num: "01", title: "The Five Sacred Kitchen Spices", body: "Five spices form the Siddha physician's kitchen pharmacy: Turmeric (Manjal) — anti-inflammatory and Rakta Dhatu purifier used daily. Cumin (Jeeragam) — Agni kindler and carminative used every meal. Black mustard (Kadugu) — Vatham-pacifier and microbiome preserver in tadka. Fenugreek (Venthayam) — blood sugar regulator and digestive tonic three times weekly. Asafoetida (Perungayam) — the supreme Vatham-destroyer and Agni kindler in small amount in every cooked dish." },
              { num: "02", title: "The Siddha Tadka — The Science of Spice Blooming", body: "Thalikka (blooming spices in oil) is pharmaceutical not merely culinary. When spices are bloomed in ghee at precise temperatures: essential oils are released and become fat-soluble, dramatically increasing bioavailability. Dosha-affecting compounds become amplified. The ghee carries these compounds to fat-soluble tissues including the nervous system that water-soluble preparations cannot reach. This is why Siddha food-medicine uses a spiced ghee base — for pharmaceutical delivery." },
              { num: "03", title: "Rasam — The Complete Digestive Medicine", body: "Tamil Rasam is one of the most clinically sophisticated functional foods ever developed: tamarind (Agni kindler), tomato (Rakta Dhatu nourisher), black pepper (Kapham clearer and bioavailability enhancer), cumin (carminative), mustard (Vatham balancer), asafoetida (intestinal Vatham destroyer), turmeric (anti-inflammatory), ghee tadka (delivery medium), and curry leaves (liver tonic and blood sugar balancer). Consumed daily Rasam provides more clinical benefit than most vitamin supplements." },
              { num: "04", title: "Sacred Kitchen Practices", body: "The Siddha tradition prescribes: cook with full presence — the emotional state of the cook transfers into the food. Use copper or clay vessels — both add therapeutic trace elements. Never cook in anger or grief — stress chemistry affects food chemistry during preparation. Chant the Panchakshara or Gayatri while cooking. Offer a portion to the sacred flame before eating. These practices convert daily cooking into continuous Siddha healing practice." }],
            technique: { name: "Siddha Master Rasam — The Daily Digestive Medicine Preparation", steps: ["Soak 1 small piece tamarind (10g) in 200ml warm water for 10 minutes. Extract juice.",
                "In a copper or steel pot: heat 1 tsp ghee. Add half tsp black mustard — wait until it pops.",
                "Add half tsp cumin, a pinch of asafoetida, 8 curry leaves, 2 dried red chilies. 30 seconds.",
                "Add tamarind water plus 200ml more water. Bring to simmer.",
                "Add quarter tsp turmeric, half tsp freshly ground black pepper, rock salt to taste.",
                "Add 2 crushed garlic cloves and 1 chopped tomato. Simmer 8 minutes.",
                "Final: a squeeze of fresh lime off heat. Handful of fresh coriander leaves.",
                "Drink as digestive cup 30 minutes after meals. Daily consumption for 40 days measurably improves all digestive parameters."] },
            medicines: [{ label: "Asafoetida (Perungayam) — non-negotiable kitchen medicine", text: "The most immediately effective Vatham-destroyer in the kitchen. A mere pinch bloomed in ghee converts any vegetable dish into a carminative anti-bloating medicine. Specific for intestinal gas, spastic colon, and all Vatham-type digestive disorders." },
              { label: "Ghee (Nei) — the Siddha cooking medium of choice", text: "Not butter, not vegetable oil — ghee. The Anupana properties of ghee carry all fat-soluble medicinal compounds from spices to the deepest tissue layers. Cooking in vegetable oils instead of ghee compromises the pharmaceutical delivery system of every meal." },
              { label: "Curry leaves (Karuveppilai) — daily kitchen medicine", text: "Fresh or frozen — not dried. Bloomed in ghee at the start of cooking: powerful liver tonic, blood sugar regulator, Rakta Dhatu builder, and nerve tonic. The most underestimated of all Siddha kitchen medicines." }],
            quote: { tamil: "சமையலறை சித்த மருந்தரை சமைக்கும் கை மருத்துவன் கை", english: "The kitchen is the Siddha pharmacy — the cooking hand is the physician's hand.", master: "Agathiyar · Kitchen Sutra" }
          } },{ id: "p4l6", title: "Diet for Specific Conditions — Clinical Pathyam", duration: "80 min", type: "Clinical" , content: {
            overview: "Clinical Pathyam — the therapeutic diet for specific diseases — is the most practical application of Siddha nutritional science. This lesson presents the complete Pathyam protocols for the most common conditions encountered in modern Siddha practice: digestive disorders, diabetes, arthritis, and skin diseases.",
            teachings: [{ num: "01", title: "Digestive Disorders — Agni-Centered Pathyam", body: "All digestive conditions begin with Agni assessment. Mandagni (weak fire): warm easily digestible foods, Trikatu before meals, small frequent meals, no raw food. Vishama Agni (irregular fire): Vatham-reducing diet, sesame oil Abhyanga daily, consistent meal timing. Tikshna Agni (sharp fire): cooling diet, coconut water, bitter vegetables, no spicy food. For any digestive condition: no Virudhahara, warm liquids only, thorough chewing minimum 20 chews per bite." },
              { num: "02", title: "Diabetes — The Siddha Dietary Protocol", body: "Siddha diabetes diet: eliminate all refined carbohydrates and commercial sugars. Reduce but do not eliminate complex carbohydrates. Emphasize bitter taste (bitter gourd daily, neem, turmeric) and astringent taste (fenugreek, pomegranate, green vegetables). Essential foods: fenugreek seeds soaked overnight then eaten morning, bitter gourd juice 30ml morning. The Siddha clinical observation: diabetes is a Kapham-Meda Dhatu disorder — treat the Kapham and the blood sugar normalizes." },
              { num: "03", title: "Arthritis — Ama-Clearing Pathyam", body: "Arthritis is Vatham plus Ama. Required dietary elimination: all nightshades (tomato, potato, eggplant, bell pepper — contain solanine aggravating arthritic inflammation). No sour fermented foods. No cold food or drinks ever. No raw vegetables except small amounts for fiber. Essential additions: warm sesame oil in cooking, turmeric plus ginger plus black pepper, Guggulu internally. Elimination of nightshades alone produces significant improvement in 60-70 percent of arthritis patients within 40 days." },
              { num: "04", title: "Skin Diseases — Rakta Shodhana Pathyam", body: "All skin diseases originate in Rakta Dhatu Dosha — Pittham-Ama in the blood expressing through the skin. Skin Pathyam: eliminate all fermented foods. No spicy food. No alcohol. Minimize meat, eggs, excessive salt. Essential: neem (internal and external), Manjishta (the most specific blood purifier in Siddha), Guduchi, Amla. The internal diet change is the primary treatment — external treatment without internal Rakta Shodhana produces only temporary improvement." }],
            technique: { name: "40-Day Clinical Pathyam Protocol — Self-Implementation", steps: ["Step 1: Identify your primary condition from the four covered in this lesson.",
                "Step 2: Write the three most important foods to remove from your diet for this condition.",
                "Step 3: Write the three most important foods to add.",
                "Step 4: Commit to these six changes for 40 consecutive days — no negotiation and no exceptions.",
                "Step 5: Track four daily markers: energy (1-10), digestion quality, symptom level, sleep quality.",
                "Step 6: At Days 14, 28, and 40 review the tracking data and note the trend.",
                "Step 7: The 40-day assessment determines whether to continue, intensify, or modify the protocol.",
                "The Siddha principle: any Pathyam showing zero improvement at 40 days needs a diagnostic review."] },
            medicines: [{ label: "Fenugreek (Venthayam) — non-negotiable for diabetes Pathyam", text: "1 tbsp seeds soaked overnight in 200ml water. Drain and eat seeds plus drink the water morning on empty stomach. 40-day protocol: fasting blood glucose reduction of 15-25 percent in Type 2 diabetes patients on Siddha Pathyam." },
              { label: "Neem leaf plus Guduchi — for skin and blood purification Pathyam", text: "Equal parts neem leaf powder and Guduchi powder, half tsp each in warm water morning on empty stomach. The Rakta Shodhana baseline prescription for all skin disease Pathyam. Safe for 90-day continuous use." },
              { label: "Guggulu — for arthritis and Ama disorders", text: "The supreme Siddha Ama-clearing Rasayana for joint conditions. 2 tablets standard extract after meals twice daily for 90 days. Non-negotiable for arthritis Pathyam." }],
            quote: { tamil: "பத்தியம் இல்லாமல் மருந்து வீண் பத்தியம் ஒன்றே போதும் சிலருக்கு", english: "Without Pathyam medicine is wasted — for some, Pathyam alone is sufficient.", master: "Agathiyar · Pathyam Sutra" }
          } }] },
    { id: "p5", num: "05", icon: "📿", title: "Thirumoolar's Thirumantiram — Healing Through the 3000 Verses", subtitle: "Direct transmission from the immortal Siddha", duration: "6 Lessons · 7 hrs", lessons: [{ id: "p5l1", title: "The Thirumantiram — 3000 Verses of Immortal Medicine", duration: "75 min", type: "Scripture" },{ id: "p5l2", title: "Tantra 1-2 — Body as Temple, Temple as Body", duration: "70 min", type: "Philosophy" },{ id: "p5l3", title: "Tantra 3 — Complete Yoga as Medical Science", duration: "80 min", type: "Yoga" },{ id: "p5l4", title: "Tantra 4 — Mantra as Physical Medicine", duration: "75 min", type: "Mantra" },{ id: "p5l5", title: "Tantra 6 — Direct Medical Teaching from Thirumoolar", duration: "90 min", type: "Medicine" },{ id: "p5l6", title: "Tantra 8-9 — Liberation Medicine — The Highest Teaching", duration: "85 min", type: "Liberation" }] },
    { id: "p6", num: "06", icon: "🧘", title: "Siddha Yoga — The Original Posture Science", subtitle: "Before Hatha Yoga — the Siddha body cultivation system", duration: "6 Lessons · 6 hrs", lessons: [{ id: "p6l1", title: "Siddha Yoga vs Modern Hatha — The Original System", duration: "65 min", type: "History" },{ id: "p6l2", title: "Asanas as Varma Activation — Postures as Medicine", duration: "70 min", type: "Therapeutics" },{ id: "p6l3", title: "Pranayama Complete — All 8 Classical Techniques", duration: "90 min", type: "Pranayama" },{ id: "p6l4", title: "Bandha and Mudra — Locks, Seals, Energy Direction", duration: "75 min", type: "Advanced" },{ id: "p6l5", title: "Dharana and Dhyana — Concentration as Medicine", duration: "70 min", type: "Meditation" },{ id: "p6l6", title: "Samadhi as Healing — The Fourth State Medicine", duration: "60 min", type: "Liberation" }] },
    { id: "p7", num: "07", icon: "🔊", title: "Mantra Medicine — Sound as Healing Technology", subtitle: "The vibrational pharmacopoeia of the Siddhas", duration: "6 Lessons · 6 hrs", lessons: [{ id: "p7l1", title: "Physics of Sacred Sound — Siddha Nada Science", duration: "65 min", type: "Sound Science" },{ id: "p7l2", title: "The 5 Prana Mantras — Healing the Vital Forces", duration: "70 min", type: "Mantra" },{ id: "p7l3", title: "Bija Mantras for Each Chakra — Vibrational Pharmacology", duration: "75 min", type: "Mantra" },{ id: "p7l4", title: "Siddha Kirtans — Devotional Sound as Deep Medicine", duration: "60 min", type: "Bhakti" },{ id: "p7l5", title: "Mantras for Specific Diseases — Clinical Sound Medicine", duration: "80 min", type: "Clinical" },{ id: "p7l6", title: "Creating Healing Sound Environments — Nada Brahman", duration: "65 min", type: "Advanced" }] },
  ],
  quantum: [
    { id: "q1", num: "01", icon: "♾️", title: "Kayakalpa — The Science of Physical Immortality", subtitle: "The crown jewel of Siddha medicine — complete transmission", duration: "8 Lessons · 10 hrs", lessons: [{ id: "q1l1", title: "Kayakalpa — The 7 Methods of Physical Immortality", duration: "90 min", type: "Master Teaching" },{ id: "q1l2", title: "Ojas, Vindu, Amrita — The Immortality Physiology", duration: "85 min", type: "Physiology" },{ id: "q1l3", title: "Year 1 Foundation — The Complete Shodhana System", duration: "90 min", type: "Protocol" },{ id: "q1l4", title: "Herbal Kayakalpa — The 41-Herb Sequential Protocol", duration: "95 min", type: "Pharmacology" },{ id: "q1l5", title: "Pranayama Kayakalpa — Kumbhaka as Immortality Practice", duration: "80 min", type: "Pranayama" },{ id: "q1l6", title: "Mantra Kayakalpa — 7 Cellular Transformation Mantras", duration: "75 min", type: "Mantra" },{ id: "q1l7", title: "Dhyana Kayakalpa — Thuriya State as Anti-Aging Medicine", duration: "80 min", type: "Meditation" },{ id: "q1l8", title: "Bogar's Navabashanam — The Living Archaeological Evidence", duration: "70 min", type: "History" }] },
    { id: "q2", num: "02", icon: "⚗️", title: "Muppu — The Three Sacred Salts of Alchemy", subtitle: "The most secret preparation in Siddha tradition", duration: "8 Lessons · 8 hrs", lessons: [{ id: "q2l1", title: "Muppu — The Most Secret Preparation in Siddha", duration: "90 min", type: "Alchemy" },{ id: "q2l2", title: "Kallar Uppu — The Moon Salt in Full Detail", duration: "75 min", type: "Preparation" },{ id: "q2l3", title: "Vediyuppu — The Sun Salt in Full Detail", duration: "75 min", type: "Preparation" },{ id: "q2l4", title: "Pooneer Uppu — The Fire Salt in Full Detail", duration: "75 min", type: "Preparation" },{ id: "q2l5", title: "The Combination Protocol — Timing, Ratios, Mantra", duration: "90 min", type: "Advanced" },{ id: "q2l6", title: "Muppu in Clinical Use — Administration and Observation", duration: "80 min", type: "Clinical" },{ id: "q2l7", title: "Muppu and Modern Science — Research Findings", duration: "70 min", type: "Science" },{ id: "q2l8", title: "Muppu Variations Across Lineages", duration: "65 min", type: "Comparative" }] },
    { id: "q3", num: "03", icon: "💫", title: "Advanced Varma — 12 Lethal & 96 Healing Points", subtitle: "Secret Varma knowledge transmitted from Agathiyar", duration: "8 Lessons · 9 hrs", lessons: [{ id: "q3l1", title: "The 12 Paddu Varmam — Complete Master Transmission", duration: "120 min", type: "Master Varma" },{ id: "q3l2", title: "Clinical Varma for Chronic Disease", duration: "90 min", type: "Clinical" },{ id: "q3l3", title: "Varma and Karma — Releasing Stored Traumatic Imprints", duration: "85 min", type: "Advanced" },{ id: "q3l4", title: "Varma for Consciousness — Spiritual Vital Points", duration: "80 min", type: "Spiritual" },{ id: "q3l5", title: "Varma Kalai — The Martial Art of Vital Points", duration: "75 min", type: "Martial" },{ id: "q3l6", title: "Emergency Varma — Acute Injury and Crisis Treatment", duration: "70 min", type: "Emergency" },{ id: "q3l7", title: "Varma and Nadi Shodhana — Combined Protocol", duration: "80 min", type: "Integration" },{ id: "q3l8", title: "Distance Varma — Advanced Transmission", duration: "75 min", type: "Advanced" }] },
    { id: "q4", num: "04", icon: "🜔", title: "Rasa Vaitham — Siddha Mercury Alchemy", subtitle: "The purification and therapeutic use of metals and minerals", duration: "8 Lessons · 8 hrs", lessons: [{ id: "q4l1", title: "Rasa Vaitham — The Complete Metal Medicine System", duration: "90 min", type: "Alchemy" },{ id: "q4l2", title: "Parada (Mercury) — Purification in 18 Stages", duration: "85 min", type: "Mercury" },{ id: "q4l3", title: "Swarna Bhasma — Gold Ash Medicine", duration: "80 min", type: "Gold" },{ id: "q4l4", title: "Loha Bhasma — Iron Ash and Blood Medicine", duration: "75 min", type: "Iron" },{ id: "q4l5", title: "Tamra Bhasma — Copper Ash for Liver and Bile", duration: "70 min", type: "Copper" },{ id: "q4l6", title: "Rajata Bhasma — Silver Ash for Brain and Nerves", duration: "70 min", type: "Silver" },{ id: "q4l7", title: "Navabashanam — The 9-Poison Preparation", duration: "90 min", type: "Advanced Alchemy" },{ id: "q4l8", title: "Clinical Use of Parpam — Dosing Protocols", duration: "80 min", type: "Clinical" }] },
    { id: "q5", num: "05", icon: "🌟", title: "The 18 Siddhas — Individual Transmissions & Specialties", subtitle: "Deep darshan of each master's unique gift", duration: "8 Lessons · 10 hrs", lessons: [{ id: "q5l1", title: "Thirumoolar — The 3000-Year Immortal Physician", duration: "90 min", type: "Master Teaching" },{ id: "q5l2", title: "Bogar — The Mercury Alchemist of Palani", duration: "90 min", type: "Master Teaching" },{ id: "q5l3", title: "Konganar — Master of Nadi Jyotish and Varma", duration: "85 min", type: "Master Teaching" },{ id: "q5l4", title: "Ramadevar — The Breath Master and Sufi Siddha", duration: "85 min", type: "Master Teaching" },{ id: "q5l5", title: "Machamuni and Gorakhnath — The Nath Connection", duration: "80 min", type: "Master Teaching" },{ id: "q5l6", title: "Kudambai and the Feminine Siddhas", duration: "80 min", type: "Master Teaching" },{ id: "q5l7", title: "Pambatti — Serpent Wisdom and Kundalini Medicine", duration: "75 min", type: "Master Teaching" },{ id: "q5l8", title: "Patanjali, Dhanvantri, Nandidevar — The Final Three", duration: "80 min", type: "Master Teaching" }] },
    { id: "q6", num: "06", icon: "🕉️", title: "Gnana Marga — Siddha's Path of Pure Wisdom", subtitle: "The cognitive-liberation medicine of the Siddhas", duration: "8 Lessons · 8 hrs", lessons: [{ id: "q6l1", title: "Gnana as Medicine — Wisdom Destroying Disease at Root", duration: "85 min", type: "Philosophy" },{ id: "q6l2", title: "4 Gnana Steps — Viveka, Vairagya, Mumuksha, Shad-Sampat", duration: "80 min", type: "Practice" },{ id: "q6l3", title: "Anavam — Ego-Contraction as Root of All Disease", duration: "75 min", type: "Diagnosis" },{ id: "q6l4", title: "Gnana Practice — Daily Liberation Medicine", duration: "70 min", type: "Practice" },{ id: "q6l5", title: "The Gnana Siddhas — Masters of Pure Wisdom Medicine", duration: "80 min", type: "Masters" },{ id: "q6l6", title: "Thuriya State — Medicine of the 4th State", duration: "85 min", type: "Advanced" },{ id: "q6l7", title: "Gnana and Physical Health — The Direct Connection", duration: "75 min", type: "Clinical" },{ id: "q6l8", title: "Liberation as the Ultimate Healing — Final Teaching", duration: "80 min", type: "Completion" }] },
    { id: "q7", num: "07", icon: "🌸", title: "Siddha Tantra & Shakti Medicine", subtitle: "Divine feminine healing science of the Tamil tradition", duration: "8 Lessons · 9 hrs", lessons: [{ id: "q7l1", title: "Shakti Medicine — The Divine Feminine Healing System", duration: "85 min", type: "Tantra" },{ id: "q7l2", title: "The 64 Tantras — Siddha Tantra Classification", duration: "80 min", type: "Classification" },{ id: "q7l3", title: "Kundalini as Medicine — Safe Activation Protocol", duration: "90 min", type: "Kundalini" },{ id: "q7l4", title: "Chakra Medicine — Healing Through Energy Centers", duration: "85 min", type: "Chakra" },{ id: "q7l5", title: "Shakti Mudras — 18 Healing Hand Gestures", duration: "75 min", type: "Mudra" },{ id: "q7l6", title: "Dasha Mahavidyas — 10 Wisdom Goddesses as Medicine", duration: "80 min", type: "Advanced" },{ id: "q7l7", title: "Panchadashi Mantra — The Supreme Shakti Medicine", duration: "85 min", type: "Mantra" },{ id: "q7l8", title: "Siddha Sexual Alchemy — Transmutation Science", duration: "75 min", type: "Alchemy" }] },
    { id: "q8", num: "08", icon: "🧠", title: "Siddha Psychiatry — Healing the Mind-Soul Interface", subtitle: "Mano Roga — the ancient Siddha approach to mental medicine", duration: "8 Lessons · 8 hrs", lessons: [{ id: "q8l1", title: "Mano Roga — Siddha's Complete Mental Medicine System", duration: "90 min", type: "Mental Medicine" },{ id: "q8l2", title: "The 6 Enemies — Kama, Krodha, Lobha, Moha, Mada, Matsarya", duration: "80 min", type: "Psychology" },{ id: "q8l3", title: "Grief, Trauma, and the Mano-Vaha Srota", duration: "85 min", type: "Trauma" },{ id: "q8l4", title: "Herbs for the Mind — The Complete Mano-Roga Pharmacopoeia", duration: "80 min", type: "Pharmacology" },{ id: "q8l5", title: "Mantra for Mental Disease — Sound Psychiatry", duration: "75 min", type: "Mantra" },{ id: "q8l6", title: "Varma for Mental Conditions — Vital Points for the Mind", duration: "80 min", type: "Clinical" },{ id: "q8l7", title: "Ancestral Mental Patterns — Karma and Mental Health", duration: "85 min", type: "Advanced" },{ id: "q8l8", title: "Integration — Complete Siddha Mental Health Protocol", duration: "75 min", type: "Protocol" }] },
    { id: "q9", num: "09", icon: "🪐", title: "Siddha Astrology-Medicine Integration (Jyotisha-Vaidya)", subtitle: "Planetary medicine and cosmic timing in healing", duration: "8 Lessons · 8 hrs", lessons: [{ id: "q9l1", title: "Planetary Medicine — Cosmic Timing in Siddha Healing", duration: "80 min", type: "Astro-Medicine" },{ id: "q9l2", title: "The 9 Planets as 9 Body Systems", duration: "75 min", type: "Correspondence" },{ id: "q9l3", title: "Nakshatra Medicine — 27 Lunar Mansions as Healing Times", duration: "80 min", type: "Lunar Medicine" },{ id: "q9l4", title: "Birth Chart and Disease Prediction", duration: "85 min", type: "Prediction" },{ id: "q9l5", title: "Gemstone and Metal Medicine — Planetary Remedies", duration: "75 min", type: "Remedies" },{ id: "q9l6", title: "Muhurta — Auspicious Timing for Treatments", duration: "70 min", type: "Timing" },{ id: "q9l7", title: "Nadi Jyotish — Pulse and Planetary Connection", duration: "80 min", type: "Integration" },{ id: "q9l8", title: "Complete Jyotisha-Vaidya Case Studies", duration: "85 min", type: "Clinical" }] },
  ],
  akasha: [
    { id: "a1", num: "01", icon: "♾️", title: "Complete Kayakalpa Mastery — The Full 3-Year System", subtitle: "The unabridged immortality transmission", duration: "12 Lessons · 18 hrs", lessons: [{ id: "a1l1", title: "Year 1 — Shodhana: The Complete Purification Protocol", duration: "120 min", type: "Infinity Transmission" },{ id: "a1l2", title: "Year 2 — Rasayana: The Regeneration Phase in Full", duration: "120 min", type: "Infinity Transmission" },{ id: "a1l3", title: "Year 3 — Kayasiddhi: Body Transformation and Maintenance", duration: "120 min", type: "Infinity Transmission" },{ id: "a1l4", title: "The Kaveri Ritual — Annual Cosmic Recalibration", duration: "90 min", type: "Ritual" },{ id: "a1l5", title: "Clinical Markers — Tracking Kayakalpa Progress", duration: "75 min", type: "Clinical" },{ id: "a1l6", title: "Muppu Integration Throughout the 3 Years", duration: "90 min", type: "Alchemy" },{ id: "a1l7", title: "Pranayama Progression — Year by Year Kumbhaka Development", duration: "95 min", type: "Pranayama" },{ id: "a1l8", title: "Diet of the Kayakalpa Practitioner — Complete Annual Plan", duration: "80 min", type: "Nutrition" },{ id: "a1l9", title: "Troubleshooting — Managing the Healing Crisis Safely", duration: "70 min", type: "Clinical" },{ id: "a1l10", title: "The 9 Signs of Successful Kayakalpa", duration: "65 min", type: "Assessment" },{ id: "a1l11", title: "Modern Biomarker Monitoring for Kayakalpa", duration: "60 min", type: "Science" },{ id: "a1l12", title: "Living the Immortal Life — Integration into Daily Existence", duration: "75 min", type: "Integration" }] },
    { id: "a2", num: "02", icon: "🕉️", title: "Siddha Deekshai — The Initiation Science", subtitle: "Receiving, holding, and transmitting Siddha shakti", duration: "12 Lessons · 14 hrs", lessons: [{ id: "a2l1", title: "Deekshai — The Physics of Spiritual Initiation", duration: "90 min", type: "Initiation" },{ id: "a2l2", title: "The 5 Types of Deekshai — Complete Classification", duration: "85 min", type: "Classification" },{ id: "a2l3", title: "90-Day Deekshai Preparation Protocol", duration: "80 min", type: "Preparation" },{ id: "a2l4", title: "What Deekshai Does — The Physiological Reality", duration: "85 min", type: "Physiology" },{ id: "a2l5", title: "Recognizing a Qualified Master — The 7 Signs", duration: "70 min", type: "Discernment" },{ id: "a2l6", title: "Post-Deekshai Integration — The 41-Day Protocol", duration: "75 min", type: "Integration" },{ id: "a2l7", title: "Transmitting Deekshai — Becoming a Channel of Grace", duration: "80 min", type: "Advanced" },{ id: "a2l8", title: "Deekshai in Daily Life — Maintaining the Initiated State", duration: "70 min", type: "Lifestyle" },{ id: "a2l9", title: "Shaktipat — The Highest Form of Deekshai", duration: "85 min", type: "Advanced" },{ id: "a2l10", title: "Lineage and Its Importance — Why Transmission Matters", duration: "75 min", type: "Philosophy" },{ id: "a2l11", title: "Case Studies in Deekshai — Documented Transmissions", duration: "70 min", type: "Evidence" },{ id: "a2l12", title: "The Future of Deekshai — SQI 2050 Transmission", duration: "80 min", type: "Future" }] },
    { id: "a3", num: "03", icon: "✦", title: "Complete 18 Siddhas System — Every Master, Every Gift", subtitle: "Living Darshan transmission of all 18 Pathinen Siddhargal", duration: "12 Lessons · 20 hrs", lessons: [{ id: "a3l1", title: "Agathiyar — The First Siddha, Father of All Medicine", duration: "120 min", type: "Master Darshan" },{ id: "a3l2", title: "Thirumoolar — The 3000-Year Living Text", duration: "110 min", type: "Master Darshan" },{ id: "a3l3", title: "Bogar — The Mercury Alchemist of Palani", duration: "110 min", type: "Master Darshan" },{ id: "a3l4", title: "Konganar — Master of Nadi Jyotish and Varma", duration: "100 min", type: "Master Darshan" },{ id: "a3l5", title: "Ramadevar — The Breath Master and Sufi Siddha", duration: "100 min", type: "Master Darshan" },{ id: "a3l6", title: "Machamuni and Gorakhnath — The Nath Connection", duration: "100 min", type: "Master Darshan" },{ id: "a3l7", title: "Kudambai and the Feminine Siddhas", duration: "95 min", type: "Master Darshan" },{ id: "a3l8", title: "Pambatti — Serpent Wisdom and Kundalini Medicine", duration: "90 min", type: "Master Darshan" },{ id: "a3l9", title: "Patanjali — Yoga Sutras as Siddha Medicine", duration: "95 min", type: "Master Darshan" },{ id: "a3l10", title: "Dhanvantri — The Divine Physician Avatar", duration: "90 min", type: "Master Darshan" },{ id: "a3l11", title: "The Remaining 8 Siddhas — Complete Darshan", duration: "110 min", type: "Master Darshan" },{ id: "a3l12", title: "Mahavatar Babaji — The Living Bridge Between All Traditions", duration: "120 min", type: "Master Darshan" }] },
    { id: "a4", num: "04", icon: "🌙", title: "Nadi Jyotish & Siddha Astro-Medicine", subtitle: "The complete Nadi leaf system and cosmic medicine", duration: "12 Lessons · 14 hrs", lessons: [{ id: "a4l1", title: "Nadi Jyotish — Reading the Cosmic Akashic Records", duration: "100 min", type: "Oracle" },{ id: "a4l2", title: "The Palm Leaf Preparation — How Nadi Leaves Are Made", duration: "85 min", type: "History" },{ id: "a4l3", title: "Vaitheeswaran Koil — The Living Oracle Center", duration: "80 min", type: "Pilgrimage" },{ id: "a4l4", title: "Reading Your Own Nadi Leaf — What to Expect", duration: "75 min", type: "Practical" },{ id: "a4l5", title: "Medical Prescriptions from Nadi — Clinical Analysis", duration: "90 min", type: "Clinical" },{ id: "a4l6", title: "Karma Mapping Through Nadi — Past Life Disease Roots", duration: "85 min", type: "Karma" },{ id: "a4l7", title: "Future Health Prediction Through Nadi", duration: "80 min", type: "Prediction" },{ id: "a4l8", title: "Integrating Nadi Reading with Clinical Practice", duration: "75 min", type: "Integration" },{ id: "a4l9", title: "Agathiyar's Continuing Medical Transmission", duration: "90 min", type: "Transmission" },{ id: "a4l10", title: "Siddha Pulse and the Nadi Leaf — Comparison", duration: "80 min", type: "Comparison" },{ id: "a4l11", title: "Training Nadi Sensitivity for Oracle Work", duration: "75 min", type: "Training" },{ id: "a4l12", title: "The Future of Nadi Oracle — SQI 2050 Vision", duration: "70 min", type: "Future" }] },
    { id: "a5", num: "05", icon: "⚗️", title: "Complete Muppu — All Preparations & Secrets", subtitle: "The complete three-salt system in its entirety", duration: "12 Lessons · 12 hrs", lessons: [{ id: "a5l1", title: "Complete Muppu System — All Lineage Variations", duration: "120 min", type: "Alchemy" },{ id: "a5l2", title: "Step-by-Step Kallar Uppu Purification", duration: "90 min", type: "Preparation" },{ id: "a5l3", title: "Step-by-Step Vediyuppu Purification", duration: "90 min", type: "Preparation" },{ id: "a5l4", title: "Step-by-Step Pooneer Uppu Purification", duration: "90 min", type: "Preparation" },{ id: "a5l5", title: "The Complete Combination — Full Ratio and Mantra Transmission", duration: "120 min", type: "Secret Teaching" },{ id: "a5l6", title: "Muppu Storage, Potency, and Shelf Life", duration: "75 min", type: "Practical" },{ id: "a5l7", title: "Muppu for Specific Conditions — Clinical Guide", duration: "85 min", type: "Clinical" },{ id: "a5l8", title: "Advanced Muppu — The Agathiyar Variations", duration: "95 min", type: "Advanced" },{ id: "a5l9", title: "Muppu and Rasa Vaitham — Metal Alchemy Integration", duration: "90 min", type: "Integration" },{ id: "a5l10", title: "Muppu Quality Assessment — Testing Your Preparation", duration: "70 min", type: "Assessment" },{ id: "a5l11", title: "Modern Science Analysis of Muppu", duration: "75 min", type: "Science" },{ id: "a5l12", title: "Teaching Muppu — Transmission Protocol for Teachers", duration: "80 min", type: "Teaching" }] },
    { id: "a6", num: "06", icon: "🎵", title: "Siddha Sound Medicine — Nada Brahman Complete System", subtitle: "The full vibrational healing pharmacopoeia", duration: "12 Lessons · 16 hrs", lessons: [{ id: "a6l1", title: "Nada Brahman — Complete Vibrational Healing System", duration: "90 min", type: "Sound" },{ id: "a6l2", title: "72 Melakarta Scales as Therapeutic Frequencies", duration: "85 min", type: "Music Medicine" },{ id: "a6l3", title: "Raga Medicine — 72 Musical Medicines for 72 Conditions", duration: "90 min", type: "Raga Therapy" },{ id: "a6l4", title: "Cymatics and Siddha Sound — Modern Validation", duration: "80 min", type: "Science" },{ id: "a6l5", title: "Healing Audio Production — SQI Methodology", duration: "85 min", type: "Production" },{ id: "a6l6", title: "Binaural Beats and Siddha Nada — The Integration", duration: "80 min", type: "Technology" },{ id: "a6l7", title: "Siddha Instruments — Veena, Mridangam, Nadaswaram", duration: "75 min", type: "Instruments" },{ id: "a6l8", title: "Creating Temple Sound Environments", duration: "70 min", type: "Environment" },{ id: "a6l9", title: "Sound Medicine for Specific Diseases", duration: "85 min", type: "Clinical" },{ id: "a6l10", title: "Mantra Recording — Sacred Protocol for Audio", duration: "80 min", type: "Production" },{ id: "a6l11", title: "Scalar Wave Technology and Nada Brahman", duration: "75 min", type: "Advanced Technology" },{ id: "a6l12", title: "SQI 2050 Sound Healing Platform — Complete Vision", duration: "70 min", type: "Future" }] },
    { id: "a7", num: "07", icon: "⚡", title: "Advanced Varma — The 18 Marma & 108 Varma Master Map", subtitle: "Complete Varma transmission including all lethal points", duration: "12 Lessons · 18 hrs", lessons: [{ id: "a7l1", title: "The Complete Varma Master Map — Infinity Transmission", duration: "120 min", type: "Master Varma" },{ id: "a7l2", title: "12 Paddu Varmam — Complete Clinical Protocols", duration: "110 min", type: "Lethal Points" },{ id: "a7l3", title: "Advanced Thaduvu Varmam — Deep Massage Protocol", duration: "95 min", type: "Advanced" },{ id: "a7l4", title: "Varma and Consciousness — Transcendental Activation", duration: "90 min", type: "Spiritual" },{ id: "a7l5", title: "Varma Kalai Combat Science — Self-Defense Protocols", duration: "85 min", type: "Martial" },{ id: "a7l6", title: "Distance Varma — Healing Without Touch", duration: "80 min", type: "Advanced" },{ id: "a7l7", title: "Varma and Kayakalpa — The Integration Protocol", duration: "85 min", type: "Integration" },{ id: "a7l8", title: "Emergency Varma First Aid — Complete Protocol", duration: "80 min", type: "Emergency" },{ id: "a7l9", title: "Children's Varma — Safe Pediatric Applications", duration: "75 min", type: "Pediatric" },{ id: "a7l10", title: "Varma for Women — Specific Female Protocols", duration: "80 min", type: "Women's Health" },{ id: "a7l11", title: "Teaching Varma — Transmission Protocol for Teachers", duration: "85 min", type: "Teaching" },{ id: "a7l12", title: "Varma 2050 — Future of Vital Point Medicine", duration: "75 min", type: "Future" }] },
    { id: "a8", num: "08", icon: "🌿", title: "Living Plant Medicine — Siddha Plant Consciousness System", subtitle: "Communicating with and receiving medicine from plants", duration: "12 Lessons · 12 hrs", lessons: [{ id: "a8l1", title: "Communicating with Plants — The Siddha Science", duration: "90 min", type: "Advanced Botany" },{ id: "a8l2", title: "Plant Devas — Intelligence Within the Plant Kingdom", duration: "85 min", type: "Plant Intelligence" },{ id: "a8l3", title: "Growing Medicine — The Sacred Siddha Garden", duration: "80 min", type: "Cultivation" },{ id: "a8l4", title: "Seasonal Harvesting — Complete Lunar Calendar", duration: "75 min", type: "Timing" },{ id: "a8l5", title: "Fresh vs Dried — Prana Preservation Techniques", duration: "70 min", type: "Preservation" },{ id: "a8l6", title: "The 64 Herbs in Full — Plant Consciousness Profiles", duration: "90 min", type: "Pharmacopoeia" },{ id: "a8l7", title: "Rare and Protected Siddha Plants — Ethical Sourcing", duration: "75 min", type: "Ethics" },{ id: "a8l8", title: "Preparing Plants with Consciousness — Full Protocol", duration: "80 min", type: "Preparation" },{ id: "a8l9", title: "Plant and Patient Matching — The Art of Prescription", duration: "85 min", type: "Clinical" },{ id: "a8l10", title: "Wildcrafting and Forest Medicine in Siddha", duration: "75 min", type: "Field Practice" },{ id: "a8l11", title: "Urban Plant Medicine — Siddha for City Practitioners", duration: "70 min", type: "Modern" },{ id: "a8l12", title: "The Future of Plant Medicine — Biodynamic Siddha", duration: "75 min", type: "Future" }] },
    { id: "a9", num: "09", icon: "🜔", title: "Complete Rasa Vaitham — Full Metal Alchemy", subtitle: "The full metal transmutation science", duration: "12 Lessons · 14 hrs", lessons: [{ id: "a9l1", title: "Rasa Vaitham Complete — Mercury Alchemy Master Teaching", duration: "120 min", type: "Alchemy" },{ id: "a9l2", title: "Shodhana — The 18-Stage Mercury Purification", duration: "100 min", type: "Purification" },{ id: "a9l3", title: "Marana — Metal Death and Ash Preparation", duration: "95 min", type: "Advanced" },{ id: "a9l4", title: "The 8 Primary Parpam — Complete Clinical Guide", duration: "90 min", type: "Clinical" },{ id: "a9l5", title: "Bogar's Navabashanam — Complete Analysis", duration: "90 min", type: "Advanced" },{ id: "a9l6", title: "Gold Medicine — Swarna Bhasma Complete Protocol", duration: "85 min", type: "Gold" },{ id: "a9l7", title: "Testing Parpam Quality — Classical Methods", duration: "80 min", type: "Quality Control" },{ id: "a9l8", title: "Parpam in Clinical Practice — Dosing Protocols", duration: "85 min", type: "Clinical" },{ id: "a9l9", title: "Modern Analysis of Parpam — Nanotechnology Connection", duration: "80 min", type: "Science" },{ id: "a9l10", title: "Safety Protocols — Managing Parpam Administration", duration: "75 min", type: "Safety" },{ id: "a9l11", title: "Rasa Vaitham and Kayakalpa — The Integration", duration: "85 min", type: "Integration" },{ id: "a9l12", title: "The Future of Siddha Alchemy — Quantum Preparation", duration: "75 min", type: "Future" }] },
    { id: "a10", num: "10", icon: "🌟", title: "Siddha Healer Certification — Becoming a Living Instrument", subtitle: "The path to authentic Siddha practice", duration: "12 Lessons · 20 hrs", lessons: [{ id: "a10l1", title: "Becoming a Living Instrument of Siddha Healing", duration: "120 min", type: "Certification" },{ id: "a10l2", title: "Ethics and Responsibility of the Siddha Physician", duration: "85 min", type: "Ethics" },{ id: "a10l3", title: "The Siddha Physician's Daily Practice — Complete Protocol", duration: "90 min", type: "Lifestyle" },{ id: "a10l4", title: "Building Your Siddha Pharmacy — What You Need", duration: "80 min", type: "Practical" },{ id: "a10l5", title: "Patient Intake and Case-Taking — Complete System", duration: "85 min", type: "Clinical" },{ id: "a10l6", title: "Treatment Planning — Integrating All Systems", duration: "90 min", type: "Clinical" },{ id: "a10l7", title: "Documentation and Tracking — Clinical Records", duration: "70 min", type: "Administrative" },{ id: "a10l8", title: "Charging for Siddha Services — Ethical Pricing", duration: "65 min", type: "Business" },{ id: "a10l9", title: "Building a Siddha Practice in the Modern World", duration: "75 min", type: "Business" },{ id: "a10l10", title: "Teaching Siddha — Transmission Without Distortion", duration: "80 min", type: "Teaching" },{ id: "a10l11", title: "Community Healing with Siddha Medicine", duration: "75 min", type: "Community" },{ id: "a10l12", title: "Certification Assessment and Completion", duration: "90 min", type: "Assessment" }] },
    { id: "a11", num: "11", icon: "📜", title: "Agathiyar's Complete Medical Texts — Original Translations", subtitle: "Direct access to the source texts with commentary", duration: "12 Lessons · 18 hrs", lessons: [{ id: "a11l1", title: "Agathiyar 12000 — Reading the Original Tamil", duration: "120 min", type: "Scripture" },{ id: "a11l2", title: "Agathiyar Gunapadam — Complete Herbal Text", duration: "100 min", type: "Scripture" },{ id: "a11l3", title: "Agathiyar Muppu Shastra — The Definitive Text", duration: "110 min", type: "Scripture" },{ id: "a11l4", title: "Agathiyar Kayakalpa — Immortality Text Complete", duration: "105 min", type: "Scripture" },{ id: "a11l5", title: "Agathiyar Nadi Pariksha — Pulse Text Complete", duration: "95 min", type: "Scripture" },{ id: "a11l6", title: "Agathiyar Vaidhya Kaaviyam — Medical Poetry", duration: "90 min", type: "Scripture" },{ id: "a11l7", title: "Bogar 7000 — The Alchemist's Complete Text", duration: "100 min", type: "Scripture" },{ id: "a11l8", title: "Thirumantiram Medical Verses — Complete Compilation", duration: "95 min", type: "Scripture" },{ id: "a11l9", title: "Konganar's Nadi Texts — The Jyotish-Medicine Bridge", duration: "90 min", type: "Scripture" },{ id: "a11l10", title: "Sattamuni's Gnana Texts — Liberation Medicine", duration: "85 min", type: "Scripture" },{ id: "a11l11", title: "Ramadevar's Pranayama Texts — Complete Breath Science", duration: "90 min", type: "Scripture" },{ id: "a11l12", title: "Translation Methodology — Reading Siddha Texts Correctly", duration: "80 min", type: "Method" }] },
    { id: "a12", num: "12", icon: "🚀", title: "Siddha 2050 — The Future of Consciousness Medicine", subtitle: "Integrating ancient Siddha with quantum biology and SQI technology", duration: "12 Lessons · 16 hrs", lessons: [{ id: "a12l1", title: "Ancient Siddha meets Quantum Biology — The Integration", duration: "90 min", type: "Future" },{ id: "a12l2", title: "Scalar Wave Technology and Siddha Healing Fields", duration: "85 min", type: "Technology" },{ id: "a12l3", title: "AI-Assisted Nadi Pariksha — SQI Technology", duration: "80 min", type: "Technology" },{ id: "a12l4", title: "Digital Rasayana — Sound Medicine Production at Scale", duration: "75 min", type: "Production" },{ id: "a12l5", title: "Siddha Pharmacology and Nanotechnology", duration: "80 min", type: "Science" },{ id: "a12l6", title: "Virtual Temple Technology — SQI Sacred Sites", duration: "75 min", type: "Technology" },{ id: "a12l7", title: "Global Siddha Education — The Akasha Academy Vision", duration: "70 min", type: "Vision" },{ id: "a12l8", title: "Siddha and Longevity Science — The Convergence", duration: "80 min", type: "Science" },{ id: "a12l9", title: "Consciousness Medicine — Beyond All Known Systems", duration: "85 min", type: "Advanced" },{ id: "a12l10", title: "The Living Transmission — Keeping Siddha Pure", duration: "75 min", type: "Ethics" },{ id: "a12l11", title: "Your Role in the Siddha 2050 Vision", duration: "70 min", type: "Purpose" },{ id: "a12l12", title: "Final Transmission — The Complete Siddha Blessing", duration: "90 min", type: "Completion" }] },
  ],
};

// ─── TIER-TO-CURRICULUM MAP ───────────────────────────────────────────────────
const TIER_CURRICULUM_MAP: Record<string, string[]> = {
  free:    ["free"],
  prana:   ["free", "prana"],
  quantum: ["free", "prana", "quantum"],
  akasha:  ["free", "prana", "quantum", "akasha"],
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SiddhaMedicineAcademy = () => {
  const navigate = useNavigate();

  // ── Real membership gating ───────────────────────────────────────────────
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const userTierLevel = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const userTierKey = userTierLevel >= 3 ? "akasha" : userTierLevel >= 2 ? "quantum" : userTierLevel >= 1 ? "prana" : "free";
  const loadingTier = false;

  // ── Navigation state ──────────────────────────────────────────────────────
  const [activeTierId, setActiveTierId]       = useState<string>(userTierKey);
  const [activeModuleId, setActiveModuleId]   = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<"teach" | "tech" | "med" | "quote">("teach");

  // Tier is derived from useMembership — no Supabase fetch needed

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeTierDef   = ACADEMY_TIERS.find(t => t.id === activeTierId)!;
  const visibleCurricIds = TIER_CURRICULUM_MAP[activeTierId] ?? ["free"];
  const visibleModules: Module[] = visibleCurricIds.flatMap(k => CURRICULUM[k] ?? []);
  const activeModule    = visibleModules.find(m => m.id === activeModuleId) ?? null;
  const activeLesson    = activeModule?.lessons.find(l => l.id === activeLessonId) ?? null;
  const safeLevel = isNaN(userTierLevel) ? 0 : userTierLevel;
  const isLocked = (tier: typeof ACADEMY_TIERS[0]) => tier.requiredLevel > safeLevel;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const selectTier = (tierId: string) => {
    const tier = ACADEMY_TIERS.find(t => t.id === tierId)!;
    if (isLocked(tier)) return; // locked — do nothing (paywall shows below)
    setActiveTierId(tierId);
    setActiveModuleId(null);
    setActiveLessonId(null);
    setActiveTab("teach");
  };

  const selectModule = (modId: string) => {
    setActiveModuleId(modId);
    setActiveLessonId(null);
    setActiveTab("teach");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectLesson = (lesId: string) => {
    setActiveLessonId(lesId);
    setActiveTab("teach");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (activeLessonId) { setActiveLessonId(null); return; }
    if (activeModuleId) { setActiveModuleId(null); return; }
    navigate("/siddha-portal");
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  if (loadingTier) {
    return (
      <div style={styles.loadWrap}>
        <div style={styles.loadDot} />
        <span style={styles.loadText}>Accessing Akasha-Neural Archive...</span>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Stars */}
      <div style={styles.stars} aria-hidden>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            ...styles.star,
            width:  `${Math.random() * 2 + 0.5}px`,
            height: `${Math.random() * 2 + 0.5}px`,
            left:   `${Math.random() * 100}%`,
            top:    `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
            animationDuration: `${Math.random() * 4 + 2}s`,
            animationDelay:    `${Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {(activeModuleId || activeLessonId) && (
              <button onClick={goBack} style={styles.backBtn}>← BACK</button>
            )}
            <div>
              <div style={styles.headerTag}>SQI 2050 · Akasha-Neural Archive</div>
              <div style={styles.headerTitle}>Siddha Medicine Academy</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={styles.liveDot} />
            <span style={styles.liveLabel}>Siddha Transmission Active</span>
          </div>
        </div>
      </div>

      {/* Tier tabs */}
      <div style={styles.tierBar}>
        <div style={styles.tierBarInner}>
          {ACADEMY_TIERS.map(tier => {
            const locked  = isLocked(tier);
            const active  = tier.id === activeTierId;
            return (
              <button
                key={tier.id}
                onClick={() => selectTier(tier.id)}
                style={{
                  ...styles.tierTab,
                  borderColor: active ? tier.border : "rgba(255,255,255,0.07)",
                  boxShadow:   active ? `0 0 28px ${tier.glow}` : "none",
                  opacity:     locked ? 0.5 : 1,
                  cursor:      locked ? "not-allowed" : "pointer",
                }}
              >
                <span style={{ fontSize: 18, display: "block", marginBottom: 4, color: locked ? "rgba(255,255,255,.3)" : tier.color }}>{tier.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "-.01em", color: locked ? "rgba(255,255,255,.35)" : "#fff", display: "block", marginBottom: 2 }}>{tier.name}</span>
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".4em", textTransform: "uppercase" as const, color: locked ? "rgba(255,255,255,.25)" : tier.color, display: "block", marginBottom: 6 }}>
                  {locked ? "🔒 " : ""}{tier.sub}
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>
                  {tier.modules} Mods · {tier.lessons} Lessons
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* ── PAYWALL for locked tier ── */}
        {isLocked(activeTierDef) && (
          <div style={styles.paywall}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{activeTierDef.icon}</div>
            <div style={{ fontSize: 11, letterSpacing: ".5em", fontWeight: 800, textTransform: "uppercase" as const, color: activeTierDef.color, marginBottom: 12 }}>
              {activeTierDef.name} — Locked
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.04em", color: "#fff", marginBottom: 16 }}>
              {activeTierDef.modules} Modules · {activeTierDef.lessons} Lessons · {activeTierDef.hours} Hours
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.5)", maxWidth: 480, lineHeight: 1.7, margin: "0 auto 32px" }}>
              {activeTierDef.tagline}. Upgrade your membership to unlock the full transmission.
            </p>
            <button
              onClick={() => navigate("/siddha-quantum")}
              style={{ ...styles.upgradeBtn, borderColor: activeTierDef.border, color: activeTierDef.color, boxShadow: `0 0 30px ${activeTierDef.glow}` }}
            >
              Upgrade to {activeTierDef.name} — {activeTierDef.price}
            </button>
          </div>
        )}

        {/* ── LESSON VIEW ── */}
        {!isLocked(activeTierDef) && activeLesson && (
          <LessonView lesson={activeLesson} tierColor={activeTierDef.color} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* ── MODULE VIEW (lesson list) ── */}
        {!isLocked(activeTierDef) && !activeLesson && activeModule && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={styles.contentHeader}>
              <div style={{ fontSize: 9, letterSpacing: ".5em", fontWeight: 800, textTransform: "uppercase" as const, color: activeTierDef.color, marginBottom: 6 }}>
                Module {activeModule.num} · {activeModule.duration}
              </div>
              <h1 style={styles.h1}>{activeModule.title}</h1>
              <p style={styles.subtitle}>{activeModule.subtitle}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {activeModule.lessons.map((les, i) => (
                <div key={les.id} onClick={() => selectLesson(les.id)} style={styles.lessonRow}>
                  <div style={{ ...styles.lessonNum, borderColor: `${activeTierDef.color}33`, background: `${activeTierDef.color}11` }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: activeTierDef.color }}>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{les.title}</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={styles.lessonType}>{les.type}</span>
                      <span style={{ color: "rgba(255,255,255,.15)", fontSize: 9 }}>·</span>
                      <span style={styles.lessonDur}>{les.duration}</span>
                    </div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,.2)", fontSize: 18 }}>→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TIER OVERVIEW (module grid) ── */}
        {!isLocked(activeTierDef) && !activeLesson && !activeModule && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={styles.contentHeader}>
              <div style={{ fontSize: 9, letterSpacing: ".5em", fontWeight: 800, textTransform: "uppercase" as const, color: activeTierDef.color, marginBottom: 8 }}>
                {activeTierDef.sub} · {activeTierDef.modules} Modules · {activeTierDef.lessons} Lessons · {activeTierDef.hours} Hours
              </div>
              <h1 style={styles.h1}>{activeTierDef.name}</h1>
              <p style={styles.subtitle}>{activeTierDef.tagline}</p>
            </div>
            <div style={styles.moduleGrid}>
              {visibleModules.map(mod => (
                <div key={mod.id} onClick={() => selectModule(mod.id)} style={styles.moduleCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <span style={{ fontSize: 26 }}>{mod.icon}</span>
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".4em", textTransform: "uppercase" as const, color: activeTierDef.color, background: `${activeTierDef.color}14`, border: `1px solid ${activeTierDef.color}33`, padding: "3px 10px", borderRadius: 12 }}>
                      MOD {mod.num}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 5, letterSpacing: "-.01em", lineHeight: 1.3 }}>{mod.title}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginBottom: 12 }}>{mod.subtitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)", fontWeight: 600 }}>{mod.lessons.length} lessons · {mod.duration.split("·")[1]?.trim()}</span>
                    <span style={{ fontSize: 9, letterSpacing: ".3em", color: activeTierDef.color, fontWeight: 700, textTransform: "uppercase" as const }}>Open →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes twinkle { 0%,100% { opacity: .15; } 50% { opacity: .9; } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: .5; } 50% { transform: scale(1.2); opacity: 1; } }
      `}</style>
    </div>
  );
};

// ─── LESSON VIEW ─────────────────────────────────────────────────────────────
interface LessonViewProps {
  lesson: Lesson;
  tierColor: string;
  activeTab: "teach" | "tech" | "med" | "quote";
  setActiveTab: (t: "teach" | "tech" | "med" | "quote") => void;
}

const LessonView = ({ lesson, tierColor, activeTab, setActiveTab }: LessonViewProps) => {
  const c = lesson.content;
  const tabs: { id: "teach" | "tech" | "med" | "quote"; label: string; icon: string }[] = [
    { id: "teach", label: "DEEP TEACHING", icon: "◈" },
    { id: "tech",  label: "TECHNIQUE",    icon: "◉" },
    { id: "med",   label: "MEDICINE",     icon: "⚗" },
    { id: "quote", label: "MASTER QUOTE", icon: "✦" },
  ];

  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      {/* Lesson header */}
      <div style={{ ...styles.glassCard, border: `1px solid ${tierColor}22`, boxShadow: `0 0 50px ${tierColor}18`, marginBottom: 20, position: "relative" as const, overflow: "hidden" }}>
        <div style={{ position: "absolute" as const, top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${tierColor}, transparent)` }} />
        <div style={{ fontSize: 9, letterSpacing: ".5em", fontWeight: 800, textTransform: "uppercase" as const, color: tierColor, marginBottom: 6 }}>
          {lesson.type} · {lesson.duration}
        </div>
        <h1 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 900, letterSpacing: "-.04em", color: "#fff", marginBottom: 16, lineHeight: 1.1 }}>
          {lesson.title}
        </h1>
        {c && <p style={{ fontSize: 14, color: "rgba(255,255,255,.52)", lineHeight: 1.85, maxWidth: 800 }}>{c.overview}</p>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" as const }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "8px 16px", borderRadius: 16,
            border: `1px solid ${activeTab === tab.id ? `${tierColor}44` : "rgba(255,255,255,.07)"}`,
            background: activeTab === tab.id ? `${tierColor}10` : "rgba(255,255,255,.02)",
            color: activeTab === tab.id ? tierColor : "rgba(255,255,255,.38)",
            fontSize: 8, fontWeight: 800, letterSpacing: ".4em", textTransform: "uppercase" as const,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "teach" && c && (
        <div>
          <SectionLabel />
          {c.teachings.map(t => (
            <div key={t.num} style={{ ...styles.glassCard, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div style={styles.numBadge}>{t.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#D4AF37", letterSpacing: "-.01em", margin: 0 }}>{t.title}</h3>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(255,255,255,.6)", paddingLeft: 42, margin: 0 }}>{t.body}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "tech" && c && (
        <div style={{ background: "rgba(34,211,238,.03)", border: "1px solid rgba(34,211,238,.12)", borderRadius: 22, padding: 28 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(34,211,238,.1)", border: "1px solid rgba(34,211,238,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>◉</div>
            <div>
              <div style={{ fontSize: 7, letterSpacing: ".45em", fontWeight: 800, textTransform: "uppercase" as const, color: "#22D3EE" }}>Practice Protocol</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{c.technique.name}</div>
            </div>
          </div>
          {c.technique.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(34,211,238,.07)", border: "1px solid rgba(34,211,238,.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#22D3EE", flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,.6)", margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "med" && c && (
        <div style={{ background: "rgba(74,222,128,.03)", border: "1px solid rgba(74,222,128,.12)", borderRadius: 22, padding: 28 }}>
          <div style={{ fontSize: 7, letterSpacing: ".45em", fontWeight: 800, textTransform: "uppercase" as const, color: "#4ADE80", marginBottom: 18 }}>Herbal Preparation</div>
          {c.medicines.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "rgba(74,222,128,.04)", borderRadius: 11, border: "1px solid rgba(74,222,128,.07)", marginBottom: 8 }}>
              <div style={{ color: "#4ADE80", fontSize: 11, marginTop: 2, flexShrink: 0 }}>▸</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,.55)" }}>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "quote" && c && (
        <div style={{ background: "linear-gradient(135deg,rgba(212,175,55,.07),rgba(212,175,55,.02))", border: "1px solid rgba(212,175,55,.2)", borderRadius: 26, padding: "48px 40px", textAlign: "center" as const }}>
          <div style={{ fontSize: 14, color: "rgba(212,175,55,.5)", fontStyle: "italic", lineHeight: 1.8, marginBottom: 20, fontFamily: "serif", whiteSpace: "pre-line" as const }}>{c.quote.tamil}</div>
          <div style={{ fontSize: "clamp(15px,2.2vw,21px)", fontWeight: 700, color: "#fff", lineHeight: 1.55, maxWidth: 600, margin: "0 auto 24px", letterSpacing: "-.01em" }}>"{c.quote.english}"</div>
          <div style={{ display: "inline-block", padding: "6px 20px", background: "rgba(212,175,55,.09)", borderRadius: 18, border: "1px solid rgba(212,175,55,.2)", fontSize: 8, letterSpacing: ".5em", fontWeight: 800, textTransform: "uppercase" as const, color: "#D4AF37" }}>
            — {c.quote.master}
          </div>
        </div>
      )}

      {/* No content yet */}
      {!c && (
        <div style={{ ...styles.glassCard, textAlign: "center" as const, padding: "56px 40px" }}>
          <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.3 }}>◈</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.35)" }}>Full lesson content in transmission preparation</div>
          <div style={{ fontSize: 11, color: "rgba(212,175,55,.4)", marginTop: 8 }}>This lesson is part of the complete module curriculum</div>
        </div>
      )}
    </div>
  );
};

const SectionLabel = () => (
  <div style={{ fontSize: 8, letterSpacing: ".55em", fontWeight: 800, textTransform: "uppercase" as const, color: "#D4AF37", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
    Core Teachings
    <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,.15)" }} />
  </div>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    background: "#050505",
    minHeight: "100vh",
    fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
    color: "rgba(255,255,255,.82)",
    overflowX: "hidden",
    position: "relative",
  },
  stars: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" },
  star: {
    position: "absolute", borderRadius: "50%",
    background: "rgba(212,175,55,.6)",
    animation: "twinkle 3s ease-in-out infinite",
  },
  loadWrap: {
    background: "#050505", minHeight: "100vh",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
  },
  loadDot: {
    width: 12, height: 12, borderRadius: "50%", background: "#D4AF37",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  loadText: { fontSize: 11, letterSpacing: ".5em", fontWeight: 700, textTransform: "uppercase", color: "rgba(212,175,55,.5)" },
  header: {
    position: "sticky", top: 0, zIndex: 100,
    borderBottom: "1px solid rgba(255,255,255,.06)",
    backdropFilter: "blur(40px)", background: "rgba(5,5,5,.88)",
    padding: "0 24px",
  },
  headerInner: {
    maxWidth: 1300, margin: "0 auto",
    display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
  },
  headerTag: { fontSize: 8, letterSpacing: ".55em", color: "#D4AF37", fontWeight: 800, textTransform: "uppercase" },
  headerTitle: { fontSize: 18, fontWeight: 900, letterSpacing: "-.04em", color: "#fff" },
  backBtn: {
    background: "none", border: "none", color: "rgba(255,255,255,.4)",
    cursor: "pointer", fontSize: 11, letterSpacing: ".05em", fontFamily: "inherit",
    padding: "4px 0",
  },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", animation: "pulse 2s infinite" },
  liveLabel: { fontSize: 8, letterSpacing: ".4em", color: "rgba(255,255,255,.35)", fontWeight: 700, textTransform: "uppercase" },
  tierBar: { background: "rgba(5,5,5,.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)", position: "relative", zIndex: 10 },
  tierBarInner: { maxWidth: 1300, margin: "0 auto", display: "flex", gap: 8, padding: "14px 24px", flexWrap: "wrap" },
  tierTab: {
    flex: 1, minWidth: 170, padding: "14px 16px",
    borderRadius: 18, border: "1px solid rgba(255,255,255,.07)",
    background: "rgba(255,255,255,.02)", backdropFilter: "blur(30px)",
    textAlign: "left", fontFamily: "inherit", transition: "all .25s",
  },
  body: { maxWidth: 1300, margin: "0 auto", padding: "28px 24px 80px", position: "relative", zIndex: 5 },
  paywall: {
    textAlign: "center", padding: "80px 24px",
    background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
    borderRadius: 28,
  },
  upgradeBtn: {
    display: "inline-block", padding: "14px 36px",
    borderRadius: 20, border: "1px solid",
    background: "transparent", fontSize: 12,
    fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase",
    cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
  },
  contentHeader: { paddingBottom: 24, marginBottom: 24 },
  h1: { fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 900, letterSpacing: "-.04em", color: "#fff", lineHeight: 1.1, marginBottom: 10 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,.4)", fontStyle: "italic" },
  moduleGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 },
  moduleCard: {
    background: "rgba(255,255,255,.02)", backdropFilter: "blur(30px)",
    border: "1px solid rgba(255,255,255,.06)", borderRadius: 22,
    padding: 22, cursor: "pointer", transition: "all .3s",
  },
  lessonRow: {
    display: "flex", alignItems: "center", gap: 16,
    padding: "15px 18px", borderRadius: 15,
    border: "1px solid rgba(255,255,255,.04)",
    cursor: "pointer", transition: "all .2s",
    background: "rgba(255,255,255,.02)", marginBottom: 6,
  },
  lessonNum: {
    width: 34, height: 34, borderRadius: 10,
    border: "1px solid", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  lessonType: { fontSize: 8, letterSpacing: ".35em", color: "rgba(255,255,255,.35)", fontWeight: 700, textTransform: "uppercase" },
  lessonDur:  { fontSize: 8, color: "rgba(255,255,255,.3)", fontWeight: 600, letterSpacing: ".15em" },
  glassCard: {
    background: "rgba(255,255,255,.02)", backdropFilter: "blur(30px)",
    border: "1px solid rgba(255,255,255,.06)", borderRadius: 22, padding: 26,
  },
  numBadge: {
    width: 28, height: 28, borderRadius: 8,
    background: "rgba(212,175,55,.1)", border: "1px solid rgba(212,175,55,.22)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, fontWeight: 900, color: "#D4AF37",
    marginRight: 10, flexShrink: 0,
  },
};

export default SiddhaMedicineAcademy;
