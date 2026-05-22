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
        { id: "f1l2", title: "The 96 Tatvas — Siddha's Complete Map of Existence", duration: "50 min", type: "Philosophy" },
        { id: "f1l3", title: "Mukkutram — The Three Forces Deeper Than Tridosha", duration: "55 min", type: "Core Science" },
        { id: "f1l4", title: "Nadi Pariksha — Reading the River of Life-Force", duration: "60 min", type: "Diagnosis" },
      ],
    },
    {
      id: "f2", num: "02", icon: "🌍",
      title: "Pancha Bhutas in Daily Life — Elemental Medicine",
      subtitle: "Living the elements as Siddha healing practice",
      duration: "4 Lessons · 4 hrs",
      lessons: [
        { id: "f2l1", title: "Earth Medicine (Prithvi) — Grounding the Jeevan", duration: "55 min", type: "Elemental" },
        { id: "f2l2", title: "Water Medicine (Jala) — The Intelligence of Fluids", duration: "50 min", type: "Elemental" },
        { id: "f2l3", title: "Fire Medicine (Agni) — The Solar Body Within", duration: "55 min", type: "Elemental" },
        { id: "f2l4", title: "Air and Space — Vayu-Akasha Medicine", duration: "50 min", type: "Elemental" },
      ],
    },
    {
      id: "f3", num: "03", icon: "🌱",
      title: "First 10 Sacred Herbs — Consciousness-Activated Plants",
      subtitle: "The complete beginner Siddha pharmacopoeia",
      duration: "4 Lessons · 3.5 hrs",
      lessons: [
        { id: "f3l1", title: "Kadukkai — The King of Siddha Herbs & 7-Day Protocol", duration: "60 min", type: "Pharmacology" },
        { id: "f3l2", title: "Nellikkai, Tulsi, Vembu — The Sacred Trinity", duration: "55 min", type: "Pharmacology" },
        { id: "f3l3", title: "Brahmi, Ashwagandha, Shankhapushpi — Brain Medicines", duration: "55 min", type: "Pharmacology" },
        { id: "f3l4", title: "Seenthil, Keelanelli, Thippili — The Deep Cleansers", duration: "50 min", type: "Pharmacology" },
      ],
    },
    {
      id: "f4", num: "04", icon: "☀️",
      title: "Siddha Lifestyle (Pathyam) — Daily Codes for Immortality",
      subtitle: "The daily protocol taught by the 18 Siddhas",
      duration: "4 Lessons · 3 hrs",
      lessons: [
        { id: "f4l1", title: "Pathyam — The Complete Dietary Code of Immortality", duration: "65 min", type: "Lifestyle" },
        { id: "f4l2", title: "Sleep, Breath, and Seasonal Alignment", duration: "55 min", type: "Lifestyle" },
        { id: "f4l3", title: "Brahma Muhurta — The Sacred Morning Protocol", duration: "60 min", type: "Practice" },
        { id: "f4l4", title: "Behavioral Pathyam — Emotion as Medicine", duration: "50 min", type: "Psychology" },
      ],
    },
  ],
  prana: [
    { id: "p1", num: "01", icon: "🌿", title: "Complete Siddha Herbal Pharmacopoeia — 64 Sacred Plants", subtitle: "The full Gunapadam plant transmission", duration: "6 Lessons · 6 hrs", lessons: [{ id: "p1l1", title: "Gunapadam — The Living Science of Herbal Properties", duration: "60 min", type: "Pharmacology" },{ id: "p1l2", title: "The 21 Siddha Rasayanas — Immortality Preparations", duration: "75 min", type: "Alchemy" },{ id: "p1l3", title: "Plant Consciousness — Communicating with Herbs", duration: "55 min", type: "Advanced" },{ id: "p1l4", title: "Planetary Herb Timing — Maximum Potency Harvesting", duration: "60 min", type: "Astro-Medicine" },{ id: "p1l5", title: "The 12 Shodhana Herbs — Complete Detox System", duration: "65 min", type: "Detoxification" },{ id: "p1l6", title: "Decoctions, Powders, Ferments — Preparation Mastery", duration: "70 min", type: "Preparation" }] },
    { id: "p2", num: "02", icon: "⚡", title: "Varma Shastra — The 108 Vital Points of Power", subtitle: "Foundation transmission of Siddha's secret healing system", duration: "6 Lessons · 7 hrs", lessons: [{ id: "p2l1", title: "Varma — The 108 Vital Points of Living Power", duration: "75 min", type: "Varma" },{ id: "p2l2", title: "The 12 Paddu Varmam — Lethal and Healing Points", duration: "90 min", type: "Advanced Varma" },{ id: "p2l3", title: "Self-Varma Practice — Daily Activation Protocol", duration: "60 min", type: "Practice" },{ id: "p2l4", title: "Varma for Pain — Clinical Applications", duration: "70 min", type: "Clinical" },{ id: "p2l5", title: "Varma Oils and Herbal Support", duration: "55 min", type: "Medicine" },{ id: "p2l6", title: "Varma for Consciousness — 5 Spiritual Vital Points", duration: "65 min", type: "Advanced" }] },
    { id: "p3", num: "03", icon: "👁️", title: "Ettavidha Pariksha — 8 Methods of Siddha Diagnosis", subtitle: "Reading the body as a Siddha physician", duration: "6 Lessons · 6 hrs", lessons: [{ id: "p3l1", title: "Nadi, Naa, Niram — Pulse, Tongue, and Color Reading", duration: "70 min", type: "Diagnosis" },{ id: "p3l2", title: "Mozhi, Kan, Sparisam — Voice, Eyes, and Touch", duration: "65 min", type: "Diagnosis" },{ id: "p3l3", title: "Malam, Moothiram — Stool and Urine Analysis", duration: "75 min", type: "Diagnosis" },{ id: "p3l4", title: "Integrating the 8 Methods — Complete Clinical Reading", duration: "80 min", type: "Clinical" },{ id: "p3l5", title: "Aura and Subtle Body Reading in Siddha", duration: "60 min", type: "Advanced" },{ id: "p3l6", title: "Karmic Disease Diagnosis — Reading the Uyir Layer", duration: "70 min", type: "Advanced" }] },
    { id: "p4", num: "04", icon: "🥗", title: "Advanced Siddha Dietary Medicine", subtitle: "Food as alchemical medicine — the complete system", duration: "6 Lessons · 5 hrs", lessons: [{ id: "p4l1", title: "The 6 Tastes as Medicine — Complete Suvai System", duration: "60 min", type: "Nutrition" },{ id: "p4l2", title: "Virudhahara — Food Incompatibilities and Disease", duration: "65 min", type: "Clinical" },{ id: "p4l3", title: "Seasonal Diet — Adjusting for Cosmic Cycles", duration: "55 min", type: "Seasonal" },{ id: "p4l4", title: "Fasting as Medicine — Siddha Upavasa Protocols", duration: "70 min", type: "Therapeutic" },{ id: "p4l5", title: "The Siddha Kitchen — Spice Medicine Preparation", duration: "75 min", type: "Practical" },{ id: "p4l6", title: "Diet for Specific Conditions — Clinical Pathyam", duration: "80 min", type: "Clinical" }] },
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
  const userTierLevel = isAdmin ? 3 : getTierRank(tier);
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
  const isLocked        = (tier: typeof ACADEMY_TIERS[0]) => tier.requiredLevel > userTierLevel;

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
