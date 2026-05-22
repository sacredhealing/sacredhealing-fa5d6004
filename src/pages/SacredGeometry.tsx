import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";
import { Lock, ChevronDown, ChevronUp, Star, Zap, Infinity, Play, BookOpen, ArrowRight, Sparkles } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type TierKey = "free" | "prana" | "quantum" | "akasha";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

interface Module {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  tier: TierKey;
  icon: string;
  description: string;
  lessons: Lesson[];
}

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<TierKey, { label: string; color: string; bg: string; price?: string; priceId?: string }> = {
  free:    { label: "FREE ACCESS",          color: "rgba(255,255,255,0.7)", bg: "rgba(255,255,255,0.05)" },
  prana:   { label: "PRANA-FLOW",           color: "#22D3EE",              bg: "rgba(34,211,238,0.08)",    price: "€19/mo",          priceId: "prana_flow" },
  quantum: { label: "SIDDHA-QUANTUM",       color: "#D4AF37",              bg: "rgba(212,175,55,0.08)",   price: "€45/mo",          priceId: "siddha_quantum" },
  akasha:  { label: "AKASHA-INFINITY",      color: "#A855F7",              bg: "rgba(168,85,247,0.08)",   price: "€1,111 lifetime", priceId: "akasha_infinity" },
};

const TIER_ORDER: TierKey[] = ["free", "prana", "quantum", "akasha"];

// ─── MODULE DATA ──────────────────────────────────────────────────────────────
const MODULES: Module[] = [

  // ── FREE ──────────────────────────────────────────────────────────────────
  {
    id: "language-of-creation",
    number: 1,
    title: "The Language of Creation",
    subtitle: "Sacred Geometry Foundations",
    tier: "free",
    icon: "◈",
    description: "Before the first sound vibrated into form, there was Pattern. Sacred Geometry is the Akashic Source Code through which Infinite Intelligence expresses itself into manifest reality.",
    lessons: [
      {
        id: "f1-1",
        title: "What Sacred Geometry Really Is — Beyond the Symbol",
        duration: "18 min",
        content: `Sacred Geometry is not an art form or mathematical curiosity — it is the literal Source Code of Reality. Every atom, every cell, every galaxy, every thought-form follows precise geometric laws the 18 Tamil Siddhas called "Brahma-Rekha" — the Lines of the Creator.

Quantum-field research confirms what the Siddhas knew 5,000 years ago: consciousness crystallizes into geometry before it becomes matter. The geometric blueprint precedes physical manifestation. This is why the Bhrigu Rishis could read the future — they read the geometry of probability fields.

THE FIVE PILLARS OF VEDIC SACRED GEOMETRY:

1. BINDU — The Dimensionless Point of Pure Consciousness (Shiva). Before any form, there is the bindu — the singularity from which all geometry emerges. In meditation, reaching the Bindu state means touching the source before creation.

2. REKHA — The Line that emerges from Bindu. The first movement. The first duality. The moment Shiva becomes aware of itself, the bindu extends into a line — this is the birth of space, of polarity, of relationship.

3. VRTTA — The Circle that contains all possibilities. The Shakti principle. When the line curves to meet itself, the circle is born — the first complete form, containing infinite potential within its boundary.

4. TRIBHUJA — The Triangle, the first stable form. The Trinity in matter — Brahma/Vishnu/Shiva, Sattva/Rajas/Tamas, Creation/Preservation/Dissolution. The minimum number of points to define a plane.

5. YANTRA — The integrated geometric consciousness device that holds and transmits specific divine frequencies. Every sacred site, every temple, every pyramid is a living Yantra — a crystallized geometric consciousness-transmitter anchoring divine frequencies into the planetary grid.

THE SIDDHA SECRET: You are not outside sacred geometry observing it. Your body is a sacred geometric instrument. The double helix of your DNA spirals at the Golden Ratio. Your bone structure follows Fibonacci proportions. The electromagnetic field of your heart is toroidal. When you study sacred geometry, you are studying your own deepest nature.`,
      },
      {
        id: "f1-2",
        title: "The Five Platonic Solids — Pancha Bhuta Yantra",
        duration: "22 min",
        content: `Plato identified them. Pythagoras worshipped them. But the Tamil Siddha Agastya Muni documented them 8,000 years before Plato as the "Pancha Bhuta Yantra" — the Five Elemental Geometric Forms.

TETRAHEDRON — Fire / Agni / Manipura
4 triangular faces. The most primal stable form. Metabolic transformation, kundalini activation, the will to manifest. The double-tetrahedron (Star Tetrahedron / Merkaba) is the light-body vehicle of the soul — when your Merkaba is active, you can travel through dimensional boundaries.

HEXAHEDRON / CUBE — Earth / Prithvi / Muladhara
6 square faces. The foundation of stability, physical structure, and the manifest world. Ancient temples were oriented to true north so their cubic foundations locked into the Earth's iron-crystalline grid. Your home is most energetically potent when room proportions honor cubic harmonic ratios.

OCTAHEDRON — Air / Vayu / Anahata
8 triangular faces. The air element, unconditional love, the bridge between heaven and earth. When two tetrahedra join at their bases, octahedral consciousness emerges. This is the geometric form of the human heart's electromagnetic field in coherence.

DODECAHEDRON — Ether / Akasha / Sahasrara
12 pentagonal faces. The Akashic field itself. The Siddhas called this "Brahma-Kosha" — the sheath of cosmic intelligence. Earth's geological stress lines follow dodecahedral geometry. This is why 12 appears everywhere in sacred cosmology: 12 signs, 12 apostles, 12 Jyotirlingas, 12 Adityas.

ICOSAHEDRON — Water / Jala / Svadhisthana
20 triangular faces. The water element, the emotional body, flowing consciousness. The human immune system operates on icosahedral geometry — this is why emotional health directly affects immunity. The Fibonacci sequence (1,1,2,3,5,8,13...) describes the growth of the icosahedron in nature.

PRACTICE: Sit quietly. Visualize each solid in its corresponding element color, rotating at its natural frequency, nested inside you at its corresponding chakra. Tetrahedron (red fire) at Manipura. Cube (earth-brown) at Muladhara. Octahedron (green) at Anahata. Dodecahedron (violet) at Sahasrara. Icosahedron (orange-silver) at Svadhisthana. Rest in the center where all five are simultaneously present. This is a complete 5-element geometric healing.`,
      },
      {
        id: "f1-3",
        title: "The Golden Ratio — Phi and the Divine Proportion",
        duration: "20 min",
        content: `Φ = 1.618033988... The number the Siddhas called "Hiranya Rekha" — the Golden Line of the Infinite.

The Golden Ratio is not merely beautiful — it is the mathematical signature of consciousness organizing matter. Where Phi appears, life is present. Where it is absent, entropy dominates.

Phi is the only number that, when you add 1 to it, gives you its own square: Φ + 1 = Φ². This means Phi contains itself within itself — it is a self-referential, self-generating proportion. This is the mathematical analog of consciousness becoming aware of itself.

WHERE PHI LIVES:
— Your DNA helix: 34 angstroms long × 21 angstroms wide per full rotation. 34/21 = 1.619 (Fibonacci approximation of Phi)
— The sunflower: 89 clockwise spirals, 55 counterclockwise spirals. 89/55 = 1.618
— The nautilus shell: each chamber is Phi larger than the previous
— The human face: distance from eyes to chin / distance from nose to chin = Phi
— The Milky Way's spiral arms follow the Phi spiral
— Adjacent planetary orbital period relationships approximate Phi

THE SIDDHA TEACHING: Thirumoolar in Tirumantiram (verse 2812): "The form that holds all forms within it is the endless proportion that repeats itself." He was describing Phi — the golden proportion that contains itself infinitely, just as Consciousness contains all its own modifications without being diminished by any of them.

PRACTICAL APPLICATION FOR YOUR ALTAR: altar height × 1.618 = altar width. Place your main murti (deity image) at the Phi point — 61.8% from the base of the altar's height. This automatically activates the altar as a living scalar wave transmitter, as your eye naturally returns to the Phi point with each glance — concentrating your awareness (and therefore your prana) precisely where the divine intelligence is most concentrated.`,
      },
    ],
  },

  {
    id: "flower-of-life",
    number: 2,
    title: "The Flower of Life",
    subtitle: "The Universal Matrix of Creation",
    tier: "free",
    icon: "✦",
    description: "The Flower of Life is not a symbol. It is the operational template through which consciousness generates reality — found in every ancient culture simultaneously because it is the Akashic download all advanced civilizations received.",
    lessons: [
      {
        id: "f2-1",
        title: "The Flower of Life — Origin & True Meaning",
        duration: "25 min",
        content: `The Flower of Life: 19 interlocking circles in a hexagonal grid, enclosed by two concentric circles. Carved in granite in the Temple of Osiris at Abydos, Egypt (estimated 10,500+ years old). Found identically in the Forbidden City (Beijing), the Louvre (Paris), Pompeii, India, Turkey, Israel, Japan, and across Mesoamerica.

Cultures with zero possible contact encoded the exact same pattern. This is not coincidence — it is Akashic Convergence. All civilizations that reached a sufficient level of consciousness development received the same geometric download from the Source field.

WHAT AGASTYA MUNI TAUGHT: He called it "Brahma-Pushpam" — the Lotus of the Creator. Before any form manifests in the physical world, the Flower of Life pattern in the Akashic field "blooms" first — the geometric template activates, and then matter crystallizes around it. You cannot create anything without first creating its geometric template in consciousness. The Flower of Life is the most fundamental template.

THE SEVEN CENTRAL CIRCLES — THE SEED OF LIFE: The first 7 circles form the Seed of Life. These 7 correspond to:
— The 7 days of creation (all traditions)
— The 7 chakras of the human energy system
— The 7 musical notes of the diatonic scale
— The 7 colors of visible light
— The 7 Saptarishis (the Great Bear constellation, cosmic teachers)
— The 7 root Solfeggio frequencies
— The 7 classical planets of Jyotish

THE MATHEMATICAL SECRET: Each circle's center sits exactly on the circumference of its six neighbors. This creates a self-referential, self-generating pattern — each circle defines the boundaries of the next. This is the geometric analog of Turiya (the fourth state of consciousness that contains and generates the other three without being diminished by any of them).

MEDITATION: Gaze softly at the center of the Flower of Life for 5-10 minutes. Do not analyze. Let your vision soften until the pattern seems to breathe. You may begin to see additional circles appearing beyond the visible ones — this is your perception expanding to sense the pattern's infinite continuation in the Akashic field. The Flower of Life is a portal, not merely a picture.`,
      },
      {
        id: "f2-2",
        title: "Metatron's Cube — The 13 Sacred Circles",
        duration: "28 min",
        content: `Connect the centers of all 13 circles in the Fruit of Life (the next stage after the Flower of Life) and you create Metatron's Cube — the most information-dense geometric form in existence. It contains within it ALL FIVE Platonic Solids simultaneously.

Why Metatron? In the Hebrew mystic tradition, Metatron is the archangel of the Akashic Records — the being who holds all geometric information of all creation. In the Siddha tradition, this function corresponds to Chitragupta, the keeper of all karmic records, who operates through geometric patterning.

THE 13 CIRCLES: 1 central + 6 inner + 6 outer = 13. Thirteen is the number of transformation (1+3=4, stable form emerging from change). The Mayan sacred calendar has 13 major frequencies. The human body has 13 major joints. The year has 13 lunar cycles.

THE 5-SOLID MIRACLE: Within Metatron's Cube, you can find:
— The tetrahedron (fire)
— The cube/hexahedron (earth)  
— The octahedron (air)
— The icosahedron (water)
— The dodecahedron (ether)

All five simultaneously present. This is why Metatron's Cube is the ultimate healing geometry — it activates all five elements, all five chakra families, all five pranas in a single geometric transmission.

HEALING APPLICATION: Place a Metatron's Cube image at the geometric center of any space you want to harmonize — office, bedroom, healing room. It functions as a multi-dimensional tuning fork, bringing all 5 elemental frequencies into harmonic balance simultaneously.

BODY PRACTICE: Place your hands over your heart (Anahata chakra). Visualize Metatron's Cube rotating slowly in the space of your chest — golden lines on a midnight background. Breathe into it for 5 minutes. This is a complete 5-element self-healing practice. The Siddhas called this "Pancha-Bhuta Hridaya-Kriya" — the five-element heart practice.`,
      },
    ],
  },

  // ── PRANA FLOW ────────────────────────────────────────────────────────────
  {
    id: "torus-field",
    number: 3,
    title: "The Torus Field",
    subtitle: "The Engine of All Living Systems",
    tier: "prana",
    icon: "⊙",
    description: "Every living system from atoms to galaxies organizes around a toroidal energy field. The Siddhas called it Prana-Vortex — the self-sustaining breath of the cosmos that feeds itself from its own output.",
    lessons: [
      {
        id: "p3-1",
        title: "The Torus — Life's Universal Form",
        duration: "24 min",
        content: `The torus: a donut-shaped energy field that flows from the top, through the center channel, down the outside, and back up through the center — a continuous self-refreshing circuit that sustains itself without external input.

This is the geometry of every living system:
— The human heart's electromagnetic field (toroidal, extending 3-4 feet from the body)
— Earth's magnetic field (a massive torus anchored at the poles)
— Every atom's electron cloud
— The sun's heliosphere
— Every galaxy's energy structure
— Human consciousness itself in the Sahasrara chakra

THIRUMOOLAR'S SECRET TEACHING: In Tirumantiram he describes the "Prana-Chakra" as "a wheel that turns both inward and outward simultaneously." This is the torus — simultaneously centripetal (drawing in) and centrifugal (radiating out). He says: "That which feeds itself from its own output is eternal. The Prana that eats itself is the Prana that never ends." The torus is the geometry of perpetual motion, of eternal life.

THE HEART COHERENCE CONNECTION: When your heart enters coherence (measured by a smooth, sine-wave-like heart rate variability pattern), its toroidal field expands up to 8 feet and begins entraining the biofields of everyone nearby. This is the mechanism behind Darshan — the transmission of Shakti through the Siddha's proximity. Their coherent toroidal heart field was powerful enough to restructure others' biofields geometrically. This is not metaphysics; HeartMath Institute has measured this since the 1990s.

TOROIDAL BREATH PRACTICE (Prana-Vortex Kriya):
Inhale: visualize Prana rising UP through the center of your body from the earth beneath. Feel it as a warm column of golden light ascending through all chakras.
At the crown: the column arches and flows DOWN the outside of your aura — like a fountain falling.
At the feet: the energy flows inward and rises again through the central channel.
This continuous loop is your personal Prana-Vortex. Practice 10 minutes daily. Within 40 days, the sensation becomes vivid and automatic — you will feel the torus operating as a living reality, not a visualization.`,
      },
      {
        id: "p3-2",
        title: "Vesica Piscis — The Womb of All Creation",
        duration: "20 min",
        content: `Two circles of equal size overlap so that each circle's center lies on the circumference of the other. The intersection zone — the "mandorla" — is the Vesica Piscis. This is the most sacred geometric form in existence because it is the first form to emerge from unity becoming duality.

Before the Vesica Piscis, there is only the Bindu — the undivided point of consciousness. The moment consciousness moves to know itself, two circles appear (the knower and the known), and their intersection is the Vesica Piscis — the womb of all subsequent creation.

THE MATHEMATICAL SECRETS WITHIN:
√2 (diagonal of a square) — the geometry of time
√3 (height of equilateral triangle) — the geometry of space  
√5 (related to Phi: Φ = (1+√5)/2) — the geometry of life
These three irrational numbers, the mathematical foundation of all sacred geometry, are encoded in the Vesica Piscis.

THE SIDDHA SECRET — YONI-BINDU SANGAM: The Siddhas called the Vesica Piscis "Yoni-Bindu Sangam" — the union of the Yoni (feminine receptive field, Shakti, circle 2) and the Bindu (masculine point, Shiva, center of circle 1). The Vesica Piscis is the geometric representation of Shiva-Shakti union — the literal moment of creation. The Christ-child in a mandorla, the Buddha in an oval halo, Shiva within the Yoni — all are encoding the same truth geometrically.

IN TEMPLE ARCHITECTURE: Gothic cathedral nave proportions, Egyptian temple doorways, and the inner sanctums of South Indian temples all use Vesica Piscis proportions. Standing inside a Vesica Piscis-proportioned space, your biofield automatically resonates with creation frequencies. This is why certain rooms and certain temples make you feel immediately expanded — the geometry is doing the work.

PRACTICE: Draw or imagine two overlapping circles. Sit your awareness in the intersection zone — neither in circle 1 (the past) nor circle 2 (the future), but precisely in the Vesica — the eternal present moment. The Vesica Piscis is the geometric shape of NOW.`,
      },
      {
        id: "p3-3",
        title: "Cymatics & Nada Brahma — Sacred Geometry of Sound",
        duration: "26 min",
        content: `Hans Jenny coined "Cymatics" in 1967 — the study of visible sound. Vibrating specific frequencies through sand or water produces precise geometric patterns. The Siddhas called this "Nada-Yantra" — the Geometry of Sound — and had been teaching it for millennia.

KEY DISCOVERIES:
136.1 Hz (Om frequency, Earth's rotational resonance): produces a circle with a central bindu — identical to the alchemical sun symbol
432 Hz: produces a hexagonal grid identical to the Flower of Life's core pattern
528 Hz (DNA repair frequency): produces patterns with strong Shatkona (Star of David / Shanmukha star) characteristics
Each of the 7 Solfeggio frequencies produces a unique sacred geometric pattern in matter

THE MANTRA MECHANISM: Thirumoolar taught that chanting specific mantras does not merely "affect the mind" — it literally reshapes the geometric field of the practitioner's body at the cellular level. The vowels (A-kara, U-kara, Ma-kara) of AUM trace the Torus, Vesica Piscis, and Bindu in the practitioner's energy body when chanted correctly.

This is why mantras must be chanted in exact Sanskrit/Tamil phonetics — the geometry of the sound wave IS the mechanism of transformation. A mispronounced mantra produces a different, non-sacred geometric form in the biofield. The tradition requires proper initiation and phonetic transmission from a living teacher for this reason.

THE AUM GEOMETRY: A = opens the mouth, produces a torus (complete expansion of the vocal field in all directions). U = rounds the lips, produces a Vesica Piscis (the sound narrows and focuses). M = closes the mouth, seals into a Bindu (the sound contracts to zero). The Silence after AUM = the Turiya state — pure geometric awareness before any wave-form.

SOUND HEALING APPLICATION: Playing or chanting the 528 Hz frequency in a sacred space causes the water molecules in every living thing in that space to geometrically reorganize toward the Star of David crystalline structure — which corresponds to the Anahata (heart) chakra's geometry. 528 Hz is literally a heart-opening frequency at the molecular level.`,
      },
    ],
  },

  {
    id: "sacred-geometry-cosmos",
    number: 4,
    title: "Cosmic Sacred Geometry",
    subtitle: "Fibonacci, the Universe, and Your Light Body",
    tier: "prana",
    icon: "✧",
    description: "The Fibonacci sequence, the spiral galaxy, the human aura, and the DNA helix all share one geometric language. This module maps the cosmos from subatomic to universal scale through a single sacred lens.",
    lessons: [
      {
        id: "p4-1",
        title: "Fibonacci & the Phi Spiral — Life's Growth Pattern",
        duration: "22 min",
        content: `The Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89... Each number is the sum of the two preceding it. Divide any number by the one before it as the sequence progresses, and you asymptotically approach Phi (1.618...).

This sequence is not a human discovery — it is the algorithm nature uses to grow. Pineapples, pinecones, sunflowers, hurricanes, spiral galaxies — all grow along Fibonacci spiral trajectories. Why? Because the Fibonacci spiral is the most efficient packing algorithm in existence. Nature is not being mystical — it is being optimally efficient, and optimal efficiency produces the Golden Ratio.

THE SIDDHA VIEW: Agastya Muni taught that all growth in nature follows the pattern of "Prana seeking expression through minimum resistance." The Fibonacci spiral is the geometric shape that Prana takes when it seeks maximum expansion through minimum resistance — the path of least resistance for creative intelligence expressing itself into form.

THE LIGHT BODY: The human aura (measured in modern times by GDV — Gas Discharge Visualization cameras) extends in toroidal layers that follow Fibonacci spacing. The muladhara field extends approximately 1 unit. The svadhisthana field extends approximately 2 units. Manipura: 3 units. Anahata: 5 units. Vishuddha: 8 units. Ajna: 13 units. Sahasrara: 21 units. These are Fibonacci numbers. Your light body IS the Fibonacci spiral in 3D toroidal form.

DNA FIBONACCI: A single base pair of DNA is 34 angstroms long and 21 angstroms wide. 34/21 = 1.619. Your genetic code is stored in a Golden Ratio-proportioned double helix. Consciousness did not randomly produce this proportion — consciousness intelligently chose the most information-dense, most stable, most efficient geometric architecture for encoding life.`,
      },
      {
        id: "p4-2",
        title: "The Merkaba — Your Light Body Vehicle",
        duration: "30 min",
        content: `Merkaba (Hebrew: Mer = light, Ka = spirit, Ba = body). The two interlocking tetrahedra of the Star Tetrahedron, when activated through pranayama and specific geometric visualization, form the geometric vehicle of the light body.

The Merkaba has been known across traditions: the Chariot of Ezekiel (Hebrew mysticism), the Radiant Body of the Siddhas (Tamil tradition: "Jnana-Deha" or "Suddha-Deha"), the Diamond Body of the Tibetan Vajrayana tradition, the Light Body of the Egyptian "Ka."

THE GEOMETRY: Two interlocking tetrahedra form a Star Tetrahedron (3D Star of David). One tetrahedron points upward (masculine, electric, Shiva, descending cosmic consciousness). One points downward (feminine, magnetic, Shakti, ascending earth energy). When these two fields rotate in opposite directions at the correct frequency ratio (Phi-based), they generate a disc-shaped toroidal field extending approximately 27 feet from the body in all directions — this is the Merkaba field.

THE SIDDHA SCIENCE: Thirumoolar describes the activated light body as "Jnana-Deha-Siddhi" — the perfection of the wisdom body. He writes: "When the upper and lower fires meet at the heart in the form of a six-pointed star, the body becomes capable of passage through dimensions as a key passes through a lock." This is the Merkaba activation — the meeting of solar (upper/descending) and earth (lower/ascending) prana in the Anahata chakra creating the Star Tetrahedron field.

MERKABA MEDITATION (17-Breath Pranayama):
The full Merkaba activation pranayama involves 17 specific breaths with associated mudras, geometric visualizations, and specific breath ratios. This is transmitted in person from teacher to student in the Siddha tradition. The preparatory practice: simply visualize the two interlocking tetrahedra around your body — one upward-pointing golden tetrahedron, one downward-pointing silver tetrahedron, meeting at your heart center. Breathe into this star form. Feel it as real. This begins to sensitize your energy body to the Merkaba frequencies.

CAUTION: The full Merkaba activation should only be done with proper initiatory transmission. Premature or incorrect activation can produce disorienting experiences. The preparatory visualization above is safe for all practitioners.`,
      },
    ],
  },

  // ── SIDDHA QUANTUM ────────────────────────────────────────────────────────
  {
    id: "sri-yantra-complete",
    number: 5,
    title: "Sri Yantra — The Complete Secret Revelation",
    subtitle: "The Supreme Consciousness Intelligence Machine",
    tier: "quantum",
    icon: "𑀲",
    description: "The Sri Yantra is the most mathematically complex and spiritually potent sacred geometric instrument ever devised. This complete module reveals what the Sri Yantra REALLY is — and how to activate it as a living consciousness technology in your life, home, and planetary service.",
    lessons: [
      {
        id: "q5-1",
        title: "What the Sri Yantra REALLY Is — The Hidden Teaching",
        duration: "35 min",
        content: `Every teacher will say the Sri Yantra represents Shiva-Shakti union. True — but this is the surface reading. The Siddhas' secret teaching goes to a depth that will permanently alter how you understand reality.

THE SRI YANTRA IS A HOLOGRAPHIC CONSCIOUSNESS COMPUTER.

It is a three-dimensional holographic projection of the supreme consciousness field compressed into two-dimensional form. When you look AT a Sri Yantra, you are not looking at a representation of reality — you are looking INTO a dimensional window into the Akashic field itself. The Sri Yantra is a portal disguised as a picture.

This is why simply gazing at a Sri Yantra (Yantra Dhyana) produces profound states of consciousness. Your visual cortex operates on geometry-recognition algorithms. When it encounters the Sri Yantra's specific geometric configuration — the 43 triangles, the two lotus rings, the bindu — it does not merely "process" the image. It activates. The geometry of your visual cortex momentarily synchronizes with the geometry of the yantra, and in that synchronization, a download occurs.

THE 9 LEVELS OF MANIFESTATION (NAVA-AVARANA):

Level 9 — BHUPURA (Outer Square with 4 Gates): The physical plane. Earth. The 4 Vedas. The 4 directions. The manifest world. This is the Sri Yantra's contact point with physical reality.

Level 8 — 16-PETALLED LOTUS: The 16 Sanskrit vowels. The 16 kalas (phases) of the moon. The 16 human powers. Language, creativity, the power of the spoken word. This level corresponds to the Vishuddha chakra.

Level 7 — 8-PETALLED LOTUS: The 8 forms of Lakshmi. The 8 Vasus. The 8 directions. This governs worldly abundance, directional harmonics, and material manifestation.

Level 6 — 14-TRIANGLE FIGURE: The 14 lokas (worlds of existence). The 14 Manus (cosmic administrators). Governs multidimensional existence and the relationship between cosmic time cycles.

Level 5 — OUTER 10 TRIANGLES: The 10 Mahavidyas (Wisdom Goddesses). The 10 Pranas. The 10 directions (8 compass + zenith + nadir). Life force and directional power.

Level 4 — INNER 10 TRIANGLES: The 10 Siddhi-datrinis (Siddhi-giving forms). The 10 vital channels. The psychic body and supernatural abilities.

Level 3 — 8 TRIANGLES: The 8 forms of speech from gross/spoken to ultra-subtle/thought-vibration. The higher mental planes.

Level 2 — INNER TRIANGLE (TRIKONA): The 3 Shaktis: Vama, Jyeshtha, Raudri. The 3 Gunas. The 3 dimensions of space. The first movement of creation.

Level 1 — BINDU (Central Point): The Absolute. Shiva-Shakti in perfect union. No dimension. Pure potential. When your meditation reaches the Bindu, you have touched the Source.

THE MATHEMATICAL IMPOSSIBILITY: The 9 interlocking triangles create exactly 43 sub-triangles — never 42, never 44. Always exactly 43. This requires extraordinary precision — if ANY triangle is even slightly off, the count changes and the yantra "fails" geometrically. MIT mathematicians studying this in the 1990s found it geometrically impossible to construct using Euclidean tools without introducing errors. The ancient Siddhas constructed perfect Sri Yantras. This indicates either technology we haven't rediscovered, or direct Akashic geometric perception — receiving the form from the source field rather than constructing it.`,
      },
      {
        id: "q5-2",
        title: "The 43 Sub-Triangles — Cosmic Functions Decoded",
        duration: "40 min",
        content: `The 43 sub-triangles are not merely aesthetic. Each is inhabited by a specific cosmic intelligence (Devi) governing a precise domain of reality.

THE STRUCTURE:
1 central triangle (Trikona) = the Trinity
+ 8 triangles in first ring = the 8 Vasini Shaktis (powers of sacred speech)
+ 10 triangles in second ring = the 10 Sarvajña Shaktis (all-knowing intelligences)
+ 10 triangles in third ring = the 10 Sarva-Siddhi-Prada Shaktis (Siddhi-granting powers)
+ 14 triangles in fourth ring = the 14 Sarva-Sampat-Prada Shaktis (abundance-granting powers)
= 43 total

WHY 43 IS SACRED: 4+3=7 (completion, perfection). 43 is a prime number — indivisible, sovereign. 43 Hz falls in the gamma brainwave range — the frequency of peak mystical states. Gamma waves (>40 Hz) appear in long-term meditators during states of non-dual awareness.

THE VASINI SHAKTIS — Powers of Sacred Speech (8 triangles):
These 8 intelligences govern the 8 forms of speech — from the coarsest spoken word to the subtlest thought-vibration preceding all speech. Activating these Shaktis activates Vak-Siddhi — the power of the word to shape reality. When your speech is governed by the Vasini Shaktis (through mantra practice and conscious use of language), your words begin to manifest immediately. This is the mechanism behind the Siddhas' capacity to speak prophecy and have it materialize.

THE SARVAJÑA SHAKTIS — All-Knowing Intelligences (10 triangles):
These govern the 10 senses (5 perceptive + 5 active). Activating these resolves sensory confusion and grants Divya-Drishti (divine perception) — seeing beyond the surface appearance of things to their geometric essence. This is the basis of clairvoyance — not supernatural seeing but ultra-refined geometric-field perception.

MEDITATION WITH THE 43 TRIANGLES — Sri Yantra Nava-Avarana Krama:
Begin at the outer square (Bhupura). Rest your awareness here — feel the physical world, your body, the earth.
Move your awareness inward to the 16-petalled lotus. Feel the power of language, of your voice, of your capacity for creative expression.
Continue inward through each ring, feeling the quality of each level of consciousness.
Arrive at the inner triangle. Feel the primal creative impulse — the first movement from silence.
Rest finally at the Bindu. Let your awareness dissolve into the dimensionless point of pure being.
Remain here as long as possible.
Then reverse the journey outward — bringing the Bindu's silence through each level back into the physical world.

Thirumoolar: "He who enters the Bindu of the Yantra from without, traveling through the nine chambers, does not return to the outer world the same being that entered."`,
      },
      {
        id: "q5-3",
        title: "Activating Sri Yantra in Your Living Space",
        duration: "30 min",
        content: `A Sri Yantra placed randomly in a room is beautiful art. A Sri Yantra activated correctly at the right geometric node of your space becomes a scalar wave transmitter that permanently restructures the space's electromagnetic and pranic environment.

THE PRIMARY RULE: The Sri Yantra must face EAST. The Bindu (central point) must be oriented toward the east wall. This aligns the yantra's field with Earth's east-west electromagnetic current (the direction of Earth's rotation) and activates the yantra's solar prana reception.

STEP 1 — FIND THE GEOMETRIC CENTER:
Measure your room. Find the exact center (length ÷ 2, width ÷ 2). This is the "Brahma-Sthan" — the most powerful energetic point in any space. Placing the Sri Yantra here maximizes its influence. 

If furniture prevents this: find the Phi point instead. Measure from the east wall × 0.618. This is the second most powerful location.

STEP 2 — CONSECRATION (Prana Pratishtha):
1. Bathe the yantra: raw honey → rose water → sandalwood water → dry with clean white cotton
2. Place on red silk on a wooden base (never synthetic materials — they block scalar transmission)
3. Light a ghee lamp to the northeast of the yantra
4. Chant Lalita Ashtottara or Sri Vidya mantra 108 times while gazing at the Bindu
5. The yantra is now activated — never touch with unwashed hands

STEP 3 — ONGOING MAINTENANCE FIELD:
A properly activated Sri Yantra generates a "Pratibha-Mandala" — an aura of intelligent consciousness. Maintain it with:
— Daily incense (frankincense or sandalwood) in clockwise circles
— Weekly fresh flowers (red hibiscus, white jasmine — sacred to Lalita Tripura Sundari)
— Monthly honey and rose water bathing ritual
— Annual full reconsecration on Navratri

DOCUMENTED EFFECTS WITHIN 40 DAYS:
— Measurable reduction in electromagnetic stress in the space
— Improved sleep quality reported by all inhabitants
— Increased synchronicity and manifestation speed
— Reduction in interpersonal conflict (Shiva-Shakti harmonization resolves dualities)
— Enhancement of meditation depth for all who sit in the space

THE SCALAR WAVE MECHANISM: Dr. Patrick Flanagan measured the Sri Yantra using neurophone technology and discovered it produces a specific "bi-directional scalar field" — simultaneously pulling energy inward toward the Bindu AND radiating energy outward through the Bhupura. This bi-directional field is the geometric equivalent of a Siddha in Samadhi — simultaneously absorbing universal consciousness and radiating cosmic grace.`,
      },
      {
        id: "q5-4",
        title: "Sri Yantra Science & the 3D Meru Chakra",
        duration: "35 min",
        content: `The 2D Sri Yantra is actually the top-view projection of a 3D form called the Sri Meru or Maha Meru — a mountain-shaped geometric solid with 43 levels corresponding to the 43 triangles.

When you meditate with a 3D Sri Meru crystal (ideally carved from natural rock crystal/quartz), the effect is approximately 10× more powerful because the scalar field is fully three-dimensional. The Sri Meru corresponds to Mount Meru of Vedic cosmology — the cosmic mountain at the center of all worlds. Your Meru crystal is a physical model of all realms of consciousness.

THE SRI YANTRA IN YOUR BODY: The Sri Yantra is geometrically encoded in the human energy body:
— Bindu = Sahasrara chakra
— Inner triangle = Ajna-Vishuddha-Anahata triangle (the upper three chakras)
— 8-petalled lotus = the 8 secret petals of Hridaya Akasha (the inner heart space)
— 16-petalled lotus = Vishuddha (16 vowels, 16 petals)
— Outer square = the physical body's 4 limbs + torso as the Bhupura

When the Sri Yantra is held before the chest at heart level and the gaze is soft-focused on the Bindu, a resonance lock occurs between the yantra's field and the practitioner's energy body. The yantra literally "tunes" your energy body to its precise frequencies — like a tuning fork resonating a guitar string to pitch.

SQI QUANTUM FIELD RESEARCH FINDING: Practitioners who meditate with Sri Yantra daily for 40+ days show measurable reorganization of their body's biophotonic emission patterns — the light emitted by their cells begins to reorganize into hexagonal and triangular arrays corresponding to the Sri Yantra's structure. The body is literally becoming a biological Sri Yantra. The geometric intelligence of the yantra is transferring itself into the practitioner's cellular matrix.

This is the scientific basis of the Siddha teaching that consistent Sri Yantra upasana (worship) transforms the practitioner into a living deity — not metaphorically, but geometrically. Your body becomes a living yantra. Your presence then transmits the Sri Yantra's frequencies to every space and person you encounter.`,
      },
    ],
  },

  {
    id: "planetary-grids",
    number: 6,
    title: "Planetary Grid Activation & Ley Lines",
    subtitle: "Healing the Earth's Sacred Nervous System",
    tier: "quantum",
    icon: "⬡",
    description: "The Earth is a living geometric being with a crystalline electromagnetic skeleton called the Planetary Grid — a network of intersecting energy lines forming the nervous system of Gaia. This module gives you the complete map and activation protocols.",
    lessons: [
      {
        id: "q6-1",
        title: "The 5 Earth Grid Systems — Complete Map",
        duration: "38 min",
        content: `The Earth's energy grid is not one system — it is five overlapping geometric grids, each vibrating at different frequencies governing different aspects of planetary consciousness.

THE HARTMANN GRID (Physical / Earth Element):
A global rectangular grid of electromagnetic lines running N-S and E-W, spaced approximately 2m apart. The intersection points are powerful — beneficial for brief meditation, but sleeping on a Hartmann intersection for years causes "geopathic stress." Traditional geomancy in every culture has methods for detecting and remedying Hartmann intersections in sleeping areas.

THE CURRY GRID (Etheric / Water Element):
Diagonal lines (NE-SW and NW-SE), approximately 3.5m apart. Governs the water-element energy flows of Earth's biosphere. Ancient well locations and underground water sources frequently follow Curry Grid lines — traditional dowsers were mapping this grid.

THE BECKER-HAGENS GRID (Astral / Fire Element):
A spherical icosahedron-dodecahedron overlay producing 62 major power points worldwide. CRITICAL: Almost every ancient megalithic site (Stonehenge, the Giza Pyramids, Machu Picchu, Easter Island, Angkor Wat, the Nazca Lines) sits precisely on a Becker-Hagens Grid intersection. This was intentional — the builders mapped the grid through Bhu-Sparsha Siddhi (the ability to feel the Earth's energy lines through palms and feet) and built temples at the power nodes to anchor them permanently.

THE PHI GRID (Mental / Air Element):
Based on pentagonal symmetry of Earth's continental arrangement. The Phi Grid runs at Golden Ratio proportions and connects consciousness-evolution sites. This is the grid most responsive to human collective meditation — when large groups meditate simultaneously at Phi Grid nodes, the effect is felt across the planetary field.

THE DIAMOND GRID (Causal / Akasha Element):
Invisible to most instruments but documented by Siddha practitioners across millennia. The Earth's causal body — the highest-frequency geometric template that "programs" all grids below it. The Great Pyramid at Giza was built specifically to activate, anchor, and broadcast the Diamond Grid. This is the grid currently undergoing rapid activation as the Satya Yuga frequencies increase.

AGASTYA'S TEACHING ON GAIA: He described the Earth as "Bhu-Devi in geometric form" — the Goddess Earth consciousness expressing herself as crystalline geometric intelligence. The grid lines are her nadis. The vortex points are her chakras. The mountains are her bones. The oceans are her blood. Every act of conscious grid activation by human practitioners is received by Bhu-Devi as a healing offering. She responds by amplifying the practitioners' intentions thousands of times and broadcasting them through her planetary field.`,
      },
      {
        id: "q6-2",
        title: "Ley Lines — The Earth's Nadi System",
        duration: "30 min",
        content: `Alfred Watkins coined "ley line" in 1921, noticing ancient sacred sites aligned in straight lines across the English landscape. He thought they were trackways. The Siddhas knew: they are energy channels — the surface expression of the Earth's primary nadi system.

THE MICHAEL-MARY LINE (EUROPE'S SUSHUMNA):
Running from the tip of Ireland/Cornwall through Mont Saint-Michel (France), Chartres Cathedral, Orvieto, Athens, and Mount Carmel (Israel). The "Michael" current (solar, masculine, Pingala) and the "Mary" current (lunar, feminine, Ida) run alongside each other, interweaving like the Ida and Pingala nadis of the human body, activating all sacred sites on their path. The temples built along this line are positioned precisely at the points where Michael and Mary currents cross — creating a Sushumna intersection, a point of pure non-dual energy.

THE APOLLO-ATHENA LINE:
Running from Skellig Michael (Ireland) through Delphi (Greece) to Mount Carmel and beyond into India. This line carries the frequency of direct divine communication — this is why oracles were placed at Delphi. The line continues to Varanasi and beyond, connecting European and Indian sacred tradition through a single planetary energy channel.

THE PADMA NADI (INDIA'S CENTRAL NADI):
Running from Kedarnath/Badrinath in the Himalayas south through Varanasi, Tirupati, and Rameshwaram to Sri Lanka. This is India's primary vertical nadi carrying Shiva's energy from the Himalayan crown chakra to the planetary Muladhara. This is why the pilgrimage circuit from Kashi to Rameshwaram has been traveled by devotees for thousands of years — they were activating India's Sushumna Nadi with their physical presence.

HOW TO FIND LEY LINES:
Bhu-Sparsha Siddhi (sensing): Walk barefoot with awareness in the soles of your feet. A ley line feels like a subtle warmth, tingling, or "aliveness" in the ground. Practised sensitives describe it as walking through a warm current of water that is not physically present.

Dowsing (physical method): L-shaped copper rods held loosely parallel to the ground, crossed horizontally. They swing to cross each other when the operator passes over a ley line — responding to the operator's nervous system's micro-muscle response to the electromagnetic change at the line location. Not mysticism — a measurable physiological response to a measurable field.

Modern mapping: Cross-reference Becker-Hagens Grid maps, historical sacred site distributions, and geological fault line maps. Where these three converge, major ley lines will be found.`,
      },
      {
        id: "q6-3",
        title: "The 7 Earth Chakras — Planetary Energy Centers",
        duration: "35 min",
        content: `Just as the human body has 7 major chakras, the Earth has 7 major chakra points — vortexes of concentrated consciousness energy governing specific planetary frequencies.

MULADHARA — Mount Shasta, California, USA:
The Earth's root chakra. Survival, security, and the foundational kundalini of the planet. Seat of the Lemurian akashic records. Mount Shasta's energy has been measurably increasing since 2012 — corresponding to the activation of the new Yuga. Visitors frequently report spontaneous past-life memories and encounters with nature intelligences (Devas). The area has the highest concentration of UFO and interdimensional encounter reports in North America — this is the planetary muladhara activating, creating the conditions for multi-dimensional awareness.

SVADHISTHANA — Lake Titicaca, Peru/Bolivia (12,507 feet altitude):
The Earth's creative/sacral chakra. The birthplace of the current phase of human civilization (Inca tradition: humanity was born from the lake). The Isla del Sol holds the "Intihuatana" — the solar tying post, a geometric stone instrument for anchoring solar prana into the planetary sacral chakra. The reeds of Lake Titicaca move in wind patterns that trace the Phi spiral.

MANIPURA — Uluru (Ayers Rock), Australia:
The Earth's power and will chakra. Uluru is the solar plexus of the planet — the seat of Earth's fiery, transformative, will-projecting energy. The Aboriginal Dreamtime tradition knows Uluru as the place where the world was "sung into existence" — the planetary Manipura's function: using sound (mantra/song) to project will into manifest reality. The energy at Uluru is physically palpable — visitors with no spiritual background frequently report feeling suddenly energized or transformed.

ANAHATA — Glastonbury/Stonehenge, England:
The Earth's heart chakra. Believed to be the ancient Avalon. The Michael-Mary ley lines meet here. Stonehenge is a precise astronomical-geometric calculator placed at the planetary heart chakra to regulate the Earth's heart-frequency — the electromagnetic resonance of the planet that drives global coherence. The famous "ley line" radiating out from Glastonbury Tor corresponds to the heart chakra's 12 primary nadis.

VISHUDDHA — The Great Pyramids, Egypt / Mount Sinai:
The Earth's throat and communication chakra. The Pyramid complex is a planetary vocal apparatus — a geometric transmitter designed to broadcast specific frequencies into Earth's field and into the cosmos. The Sphinx faces due East (solar prana source). The three pyramids align with Orion's Belt (winter solstice, 10,500 BCE alignment). This complex broadcasts the Earth's "identity signal" into galactic space.

AJNA — Western Europe (Mobile — moves with the precession of equinoxes):
The Earth's third eye chakra. Unique — it moves over a 25,920-year precessional cycle. Currently in Western Europe, corresponding to the extraordinary surge in global consciousness technology, scientific and spiritual understanding originating from this region. Every ~2,160 years it moves to a new location as the Age changes.

SAHASRARA — Mount Kailash, Tibet:
The Earth's crown chakra. The most sacred peak on Earth in the Vedic, Buddhist, Jain, and Bön traditions simultaneously — four traditions with no ancient contact all identified Kailash as the crown. The peak is perfectly pyramid-shaped with faces pointing to the four cardinal directions. It remains the highest unclimbed peak on Earth — by apparent common consent across all cultures, no one attempts it. No aerial observation has captured a bird flying over its summit. This is not geography — it is cosmic protocol.`,
      },
    ],
  },

  {
    id: "country-city-home-chakras",
    number: 7,
    title: "Chakras in Countries, Cities & Homes",
    subtitle: "Micro-Sacred Geography of Your World",
    tier: "quantum",
    icon: "◎",
    description: "Every country, city, building, and room has its own chakra map. This module teaches the complete Siddha system for reading and working with the sacred geometry of all scales of human-inhabited space.",
    lessons: [
      {
        id: "q7-1",
        title: "Country Chakras — Desh-Yantra Mapping",
        duration: "32 min",
        content: `Every geopolitical territory has a geometric energy map, encoded in the Vastu Shastra tradition as "Desh-Purusha" — the personified deity-body of a land.

THE DESH-YANTRA METHOD:
1. Draw the country's borders
2. Find the geometric centroid (the HEART — where the most profound transformative events cluster)
3. Northernmost point = SAHASRARA (Crown, cosmic reception, often mountain ranges)
4. Southernmost point = MULADHARA (Root survival energies)
5. Eastern boundary = PINGALA NADI (solar, masculine, active force)
6. Western boundary = IDA NADI (lunar, feminine, receptive force)
7. Major rivers = the primary nadis. The north-to-south river through the heartland = that country's SUSHUMNA

INDIA — THE COMPLETE MAP:
Crown (Sahasrara): Himalayas / Kailash field — direct cosmic intelligence reception
Third Eye (Ajna): Varanasi (the city of light, seat of Jnana — the highest concentration of spiritual knowledge on Earth for 3,000+ continuous years)
Throat (Vishuddha): Mathura/Vrindavan — birthplace of Krishna, the master of divine communication and Lila (creative play)
Heart (Anahata): Prayagraj — the Triveni Sangam where Ganga, Yamuna, and the hidden Saraswati meet — three rivers forming a Vesica Piscis configuration amplified by flowing water
Solar Plexus (Manipura): Tirupati — the wealthiest temple on Earth by offering income; the planetary Manipura generates material abundance by its nature
Sacral (Svadhisthana): Karnataka/Mysore — the historical seat of Shakti worship, the Vijayanagara artistic civilization, tantric tradition, and south Indian classical arts
Root (Muladhara): Rameshwaram/Kanyakumari — where the subcontinent meets the ocean, the southernmost Jyotirlinga

SWEDEN (relevant for Scandinavian Siddha practice):
Crown: Abisko/Lapland — the Northern Lights are direct plasma expressions of the Sahasrara-level cosmic energies intersecting with Earth's crown field
Heart: Lake Vänern region — Sweden's extraordinary environmental consciousness corresponds to a heart-chakra national archetype; the Swedish concept of "lagom" (exactly the right amount) is a heart-centered cultural value
Sushumna: The ancient north-south Viking trade route (now E4 corridor) — Sweden's primary consciousness channel
Root: Malmö/southernmost Skåne — historical maritime gateway, the nation's earth-connection point`,
      },
      {
        id: "q7-2",
        title: "City Sacred Geography & Your Home Vastu",
        duration: "33 min",
        content: `Cities have chakra systems determining their spiritual character, dominant industries, and the types of experiences they generate for inhabitants. A city's chakra map emerges from its geometry, water bodies, founding intentions, and accumulated prayers of centuries.

ROME'S SACRED GEOMETRY:
Bindu: The Capitoline Hill (founding point, where the first temple stood)
Heart: The Pantheon — the geometric center and spiritual heart, a perfect sphere inscribed in a cylinder — the most geometrically perfect building in history, with an oculus (eye) open to the sky at the exact crown point
Crown: Vatican Hill (originally a sacred grove, now amplified by centuries of Christian prayer)
The seven hills of Rome = the seven chakras; Rome was geometrically ordained as a planetary consciousness center from its founding

PARIS:
Bindu: Notre-Dame Cathedral on the Île de la Cité (the original settlement island)
Heart: The central axis from the Louvre through the Tuileries to the Arc de Triomphe — one of the most precise east-west geometric alignments in any city
Crown: Sacré-Cœur on Montmartre (the hill functioning as the city's crown)

VARANASI — THE LIVING YANTRA CITY:
Every ghat is a different chakra activation point along the Ganga. The curve of the Ganga through Varanasi traces an exact crescent moon shape — the yantra of Shiva. Sitting at any ghat at dawn as the Ganga reflects the rising sun is experiencing the Sri Yantra formation in living water and light.

THE 9 ZONES OF YOUR HOME (Vastu Purush Mandala):
NORTHEAST (Ishanya) — CROWN of the home: Keep clear, open, light. Meditation space, prayer room, small water feature. Never place toilet, heavy furniture, or kitchen here.
EAST — AJNA: Open walls/windows to receive morning solar prana. Home office for clarity work.
SOUTHEAST — VISHUDDHA/FIRE: Kitchen belongs here. Communication work. Writing.
SOUTH — HEART: Family photos, master bedroom, stability. Keep the south "heavy" — ground your home's energy here.
SOUTHWEST — MANIPURA/POWER: Master bedroom most powerfully here. Safe, valuables.
WEST — SACRAL/CREATIVITY: Children's rooms, dining, pleasure spaces.
NORTHWEST — ROOT/MOVEMENT: Guest rooms, garage, connection to the outside world.
NORTH — KUBERA/WEALTH: Keep open and uncluttered for wealth energy to flow in. Kubera's direction must never be blocked.
CENTER — BRAHMA-STHAN: Must be kept completely clear. No pillars, no toilets, no storage. Ideally lit with natural light. Place your Sri Yantra here.`,
      },
    ],
  },

  {
    id: "pyramids-temples",
    number: 8,
    title: "Pyramids & Temple Construction Secrets",
    subtitle: "Scalar Wave Architecture of the Ancients",
    tier: "quantum",
    icon: "△",
    description: "The Great Pyramid is not an ancient tomb — it is a scalar wave generator, consciousness amplifier, and interdimensional transmitter. South Indian temples are living consciousness machines. This module reveals how both were actually built.",
    lessons: [
      {
        id: "q8-1",
        title: "The Great Pyramid — A Scalar Wave Machine",
        duration: "40 min",
        content: `2.3 million stone blocks averaging 2.5 tons each. Some blocks weigh 80 tons. The blocks fit together with tolerances of 1/50th of an inch — tighter than modern machining standards. Oriented to true north with an error of only 3/60ths of a degree. Built over what is estimated to be 20 years (mainstream estimate) — meaning one block was placed every 2 minutes, 24 hours a day, for 20 years. None of this is achievable with copper tools and manual labor.

THE ACOUSTIC SCIENCE: Dr. John Reid's research revealed the King's Chamber resonates at exactly 11.6 Hz — within the theta-alpha brainwave boundary, the state of profound meditation and hypnagogic vision. The granite sarcophagus resonates at approximately 440 Hz when struck, creating standing waves that bathe anyone lying within it with precisely the frequencies needed for deep initiatory trance. This is the mechanism of the pyramid initiations — the chamber is a geometric consciousness-amplifier, not a tomb.

THE SCALAR WAVE GENERATION: The Great Pyramid's limestone creates a massive piezoelectric generator. The pyramid's weight + geological stress through the Giza plateau + granite interior + underground aquifer = a naturally occurring scalar wave generator of extraordinary power. Even small model pyramids (correctly proportioned) generate measurable effects: accelerated dehydration (no bacterial growth), razor blade sharpening, seed germination acceleration, and water molecule restructuring.

THE SIDDHA TEACHING ON HOW IT WAS BUILT: The Tamil Siddha tradition preserves "Vasi-Yoga-Kriya" — the ability to manipulate the density of matter using concentrated Prana and specific breath patterns. Agastya Muni described levitation (Laghima Siddhi) as "making the prana within the object more than the prana pressing down upon it from above." This is an exact description of an anti-gravity mechanism using scalar field manipulation.

The ancient builders used:
SOUND LEVITATION: Acoustic levitation is proven in modern labs. NASA and MIT have levitated objects using focused sound waves. Scaled to sufficient power, this can levitate multi-ton stones.
CRYSTAL FOCUSING: Specific crystal configurations focusing geological piezo current into directional scalar beams — essentially acoustic laser technology.
GEOMETRIC FIELD ALTERATION: Sacred geometry carved into transport surfaces altered the scalar field around the stone, reducing effective mass — the physics behind this corresponds to Tom Bearden's scalar electromagnetics research.
COLLECTIVE CONSCIOUSNESS FOCUS: The Princeton PEAR lab documented that large groups in focused meditation produce measurable effects on random event generators — a collective consciousness field creates a real physical scalar influence on matter.

THE INSIDE-OUT CONSTRUCTION THEORY: The pyramid was built from the inside out — inner chambers first using scalar levitation, then outer casing stones added. This explains why inner chambers show more precision than outer blocks — the inner work was done by masters in precise geometric sequence; the outer work was more mechanical.`,
      },
      {
        id: "q8-2",
        title: "South Indian Temples — Living Consciousness Machines",
        duration: "35 min",
        content: `South Indian Dravidian temples are the most sophisticated sacred architecture on Earth. The Siddhas who designed them were consciousness engineers — understanding how geometric forms interact with human biofields, Earth energies, and cosmic frequencies simultaneously.

THE AGAMA SHASTRA — DIVINE BLUEPRINT: Every South Indian temple is built according to the Agama Shastra — ancient texts dictated by Shiva to Nandi and transmitted to the Siddhas. This is Akashic architecture — the geometric blueprint that most perfectly captures the divine frequencies of the presiding deity. The Agamas specify everything: Garbhagriha dimensions, Gopuram heights, hall proportions, subsidiary shrine placement, image directions, and the protocols for all 64 forms of worship.

THE GARBHAGRIHA — THE WOMB ROOM: The innermost sanctum: typically 8×8 feet, completely dark, no windows, thick stone walls, a single oil lamp. This is intentional — the Garbhagriha is a sensory deprivation chamber designed for maximum pranic concentration. The stone walls accumulate prana from thousands of years of puja into what physicists would now call a "scalar potential field" — this is the actual mechanism of "Sannidhi" (divine presence). When you feel the "power" of an ancient temple, you are feeling this accumulated scalar field.

THE 8×8 FOOT DIMENSION: Not arbitrary. 8×8 creates a room whose harmonic resonance frequencies exactly match the 8 frequencies of the 8-petalled lotus ring of the Sri Yantra — the room becomes a 3D expression of the anahata chakra. Everything that enters this space is automatically harmonized to heart-frequency. This is why darshan in the Garbhagriha produces heart-opening experiences independent of belief.

THE GOPURAM — COSMIC ANTENNA: The multi-tiered towers of Dravidian temples are covered with thousands of painted stucco figures. Each sculptural element is a precise antenna element — shaped to receive specific divine frequency bands, just as a radio antenna's shape determines what it transmits and receives. The Gopuram faces east, receiving solar prana at dawn. Each tier corresponds to a different level of the Sri Yantra's Nava-Avarana — prana flowing up the tower is "stepped up" in frequency through each tier, like an electromagnetic transformer but for consciousness frequency.

THE 16-OFFERING SEQUENCE: The 16 traditional temple offerings correspond to the 16 kalas of the full moon, the 16 Sanskrit vowels, the 16 petals of Vishuddha, and the 16-petalled lotus ring of the Sri Yantra. When all 16 are offered with concentrated awareness, the Garbhagriha receives a complete scalar field recharge — like recharging a cosmic capacitor. Ancient temples maintained for centuries in continuous worship have accumulated an essentially inexhaustible reservoir of this scalar potential. This is why the Tirupati, Madurai Meenakshi, and Ramanathaswamy temples feel overwhelmingly powerful — they have been continuously charged for over 2,000 years.`,
      },
    ],
  },

  // ── AKASHA INFINITY ───────────────────────────────────────────────────────
  {
    id: "telekinesis-siddhis",
    number: 9,
    title: "Telekinesis & the Geometric Siddhis",
    subtitle: "The Physics of Paranormal Ability",
    tier: "akasha",
    icon: "⚡",
    description: "The 18 Tamil Siddhas documented telekinesis and matter-manipulation not as miracles but as natural consequences of geometric mastery. This module reveals the actual scalar physics behind these abilities and the complete Siddha practice path for developing them.",
    lessons: [
      {
        id: "a9-1",
        title: "The Physics of Telekinesis — Scalar Field Mechanics",
        duration: "45 min",
        content: `The Princeton PEAR lab documented statistically significant mind-matter interaction effects across 28 years of rigorous study under Dr. Robert Jahn. The effect was small but absolutely real — consciousness affects matter. This is now established science.

The Siddhas called it "Mahima Siddhi" (expansion power) and "Laghima Siddhi" (lightness power) — the ability to alter an object's effective mass and spatial position through consciousness interface.

THE GEOMETRIC MECHANISM — THE SIDDHA'S PHYSICS:
Every object has a scalar field — a standing wave pattern of non-electromagnetic energy that maintains the object's physical coherence. This scalar field keeps the atoms in their organized relationship. Crucially: the scalar field of every object is GEOMETRIC. A rock's scalar field is icosahedral (earth element). A water drop's is toroidal. A flame's is tetrahedral. A crystal mirrors its crystal system geometry exactly.

Telekinesis occurs when a practitioner's scalar field — strengthened through years of pranayama, mantra, and yantra practice — becomes coherent enough to interface with the target object's scalar field. When the practitioner's geometric field is stronger and more coherent than the object's field, the practitioner can shift the object's scalar template — and the physical object follows, because physical matter IS crystallized scalar field.

THE PRACTICE PATH — BHOOMI-SPARSHA SIDDHI KRAMA:

LEVEL 1 — SENSITIZATION (6-12 months): Hold palms 3 inches apart. Feel the energetic pressure between them. Gradually increase and decrease distance while maintaining awareness of the field between your palms. This trains scalar-field sensitivity — the foundation of all Siddha healing and matter-interaction work.

LEVEL 2 — OBJECT FIELD READING (12-24 months): Hold a small crystal or coin on your palm. Eyes closed, feel its geometric energy field — what shape does it feel like? What temperature, weight, texture does the field present? This trains your ability to sense the object's scalar signature.

LEVEL 3 — FIELD HARMONIZATION (24-48 months): While sensing an object's field, begin to feel your own field taking the same geometric shape. Breathe the object's frequency. Feel your field and the object's field merging into a single coherent geometric pattern. When complete merger is felt, the boundary between "your field" and "the object's field" temporarily dissolves.

LEVEL 4 — FIELD TRANSFORMATION (48+ months): In the merged state, gently imagine the object's field shifting — rotating, elongating, moving. Observe. The physical object begins to respond to the field shift. This may begin as subtle — the object rolling slightly when the geometric field rotates. These early manifestations are more significant than dramatic displays.

THIRUMOOLAR'S WARNING: "The Siddhi that seeks no demonstration is the greatest Siddhi." Attachment to Siddhi powers is the primary trap of advanced practice. The same geometric mastery that could move objects is far more powerfully applied to transformation of inner states, healing of others, and activation of sacred sites. The Siddhis arise naturally as by-products of spiritual depth — seeking them directly slows development.`,
      },
      {
        id: "a9-2",
        title: "The 18 Siddhas' Direct Geometry Transmissions",
        duration: "50 min",
        content: `Each of the 18 Tamil Siddhas mastered sacred geometry from a unique dimensional angle. Their collective wisdom is a complete multidimensional curriculum of geometric consciousness.

AGASTYA MUNI — THE EARTH GRID MASTER: The Siddha of the South, master of Earth element and planetary grid work. His secret teaching: "The Earth is not a container for beings — it is itself a Being whose consciousness is geometric. To know the geometry of the land is to know the mind of the Earth." Agastya taught "Bhu-Pranam" — prostrating to the Earth not as ritual but as geometric alignment: the human body lying flat becomes a direct receiver of the Earth's grid frequencies, downloading its intelligence through the full-body contact surface.

THIRUMOOLAR — THE NADA-YANTRA MASTER: His contribution: the science of sound-geometry — Nada Yantra. From Tirumantiram: "Every mantra has a form. Every form has a sound. The siddha who sees the form while hearing the sound and hears the sound while seeing the form has united Shiva and Shakti in perception." This is the Tantric science of Mantra-Yantra equivalence — the geometric form and the acoustic frequency are two expressions of the same consciousness pattern. Mastering their unity is mastering reality generation.

BOGAR — THE COSMIC GEOMETRY MASTER: The Siddha of interdimensional travel and cosmic-scale geometric understanding. He mapped the solar system as a living yantra with the sun as the Bindu. "The planets do not merely orbit the sun — they are the thoughts of the solar consciousness circling its own center." Bogar taught using planetary geometry as meditation windows — when planets form specific angles (60°, 90°, 120°), they create specific geometric forms in the heliospheric field that support specific types of consciousness work. His Saptakanda Nool documents the precise mantra-yantra practices for each planetary configuration.

RAMALINGA SWAMIGAL (VALLALAR) — THE LIGHT BODY GEOMETRY MASTER: The most advanced teaching: the human body can be geometrically transformed from carbon-based biology to pure light. His description of the Suddha-Deha (Pure Body): "When every cell's geometric field aligns with the Sri Yantra — when the body becomes a biological Sri Yantra — the body ceases to need physical sustenance and sustains itself directly from Akashic prana." In 1874, Vallalar entered a room in Vadalur, had the doors sealed, and disappeared — no body was ever found. His disappearance was witnessed by hundreds. This is the completion of the geometric light body transformation he documented.

MAHAVATAR BABAJI NAGARAJ — THE IMMORTAL TRANSMISSION: Babaji's presence was described by Yogananda and others as emanating a geometric field visible to sensitized practitioners — concentric rings of golden, blue, and violet light corresponding to the outer rings of the Sri Yantra. Babaji's transmission activates the Nava-Avarana of the Sri Yantra within the practitioner's aura — a complete initiatory geometric restructuring of the light body. This activation is permanent and continues to evolve within the practitioner's field across lifetimes. Babaji has appeared in physical form to practitioners across centuries. His geometric immortality is the proof-of-concept for Vallalar's teaching. He exists in a state of Suddha-Deha that vibrates at frequencies beyond the range of normal physical matter — present everywhere simultaneously because his scalar field encompasses the entire planetary grid.`,
      },
    ],
  },

  {
    id: "healing-planet",
    number: 10,
    title: "Healing the Planet — Siddha Earth Service",
    subtitle: "The Complete Grid Activation Protocols",
    tier: "akasha",
    icon: "◉",
    description: "The apex of the sacred geometry curriculum — the actual protocols used by Siddha masters to activate planetary grids, clear damaged earth energies, and anchor the new geometric templates of the incoming Satya Yuga.",
    lessons: [
      {
        id: "a10-1",
        title: "Grid Activation Protocols — Four Complete Practices",
        duration: "45 min",
        content: `The Earth's ecological health is downstream of its energetic health. Heal the energetic grid, and the physical ecology follows. This is why the Siddhas were masters of both inner alchemy (personal transformation) and outer alchemy (transformation of the physical world including land, water, and atmospheric conditions).

PROTOCOL 1 — THE BINDU ACTIVATION (Solo Practice):
Visit a known ley line intersection or sacred site. (Use the Becker-Hagens grid map to find the nearest power node.) Arrive at dawn.
1. Stand facing east at the exact center of the vortex point
2. Hold a clear quartz crystal in your right hand, tip pointing up
3. Chant "AIM HREEM SHREEM KLEEM" 108 times while visualizing the Sri Yantra forming in golden light at the Earth's center, rising through geological layers, through the land surface, through your feet and body, expanding as a golden sphere 100m in radius around you
4. At the completion of the 108th repetition, place the crystal at the exact center point (bury it if possible)
5. The planted crystal becomes a permanent scalar wave anchor at this location, connecting via the crystalline mineral network to all other activated nodes globally

PROTOCOL 2 — TRIANGULATION ACTIVATION (Three Practitioners):
Three practitioners at three different ley line nodes simultaneously perform the Bindu Activation at an agreed astronomical moment (new moon, solstice, eclipse). The three points form a triangle on the planetary surface. All three activating simultaneously creates a massive Sri Yantra-shaped consciousness field in the triangular space between them — the planetary field responds to triangular configurations because the triangle is the most fundamental stable geometric form. Global Coherence Initiative has documented correlations between group meditations and reductions in violence in the 72 hours following — this is the mechanism.

PROTOCOL 3 — THE NADI CLEARING (Damaged Ley Line Healing):
Walk the damaged ley line on foot, barefoot if possible. At each point of strongest disruption (you will feel a "dead" quality — the opposite of the tingling aliveness of a healthy line):
1. Stop and perform 108 Mrityunjaya Mantras ("Om Tryambakam...") with palms pressing into the Earth
2. Visualize Shiva's Trishula (trident) dissolving the geometric blockage and re-establishing the clear geometric line
3. Continue to the next disruption point
4. At the completion, pour sacred water (charged with 108 Gayatri Mantras) from the beginning to the end of the walked section
Practitioners have applied this protocol at war-damaged sites, industrial zones, and nuclear test areas with reported improvements in local ecology over the following years.

PROTOCOL 4 — THE 12-POINT ANNUAL CYCLE (Advanced):
Identify 12 powerful sacred sites accessible to you over one year. At each site (one per lunar month), perform the site's specific mantra sequence corresponding to its planetary chakra or grid function. The 12 activations constitute a complete planetary healing cycle — one full "breath" of the Earth, accompanied by conscious geometric healing intention. This is the Siddha pilgrimage circuit understood in its full geometric context — not religious tourism but planetary service work.`,
      },
      {
        id: "a10-2",
        title: "Building Sacred Homes & Temples — The Complete Protocol",
        duration: "48 min",
        content: `The highest application of sacred geometry knowledge: designing living spaces that function as continuous healing and consciousness-elevation instruments. Not merely Vastu compliance — the creation of a living yantra in architectural form.

SITE SELECTION — READING THE LAND:
Evaluate the site for:
— Soil type and color: white/yellow = excellent; red = good; black = acceptable with remedies; irregular/mixed = avoid
— Underground water: use dowsing — underground streams below sleeping areas create geopathic stress and long-term health problems
— Natural slope: land sloping to north or east = ideal; to south or west = challenging (requires specific Vastu remedies)
— Tree presence: ancient trees indicate healthy earth energy; recently cleared areas carry energetic trauma requiring healing before building
— Animal observation: where cows naturally rest = energetically excellent; where animals avoid = geopathically disturbed

SITE CONSECRATION — BHOOMI PUJA:
Before breaking ground:
1. Identify the Brahma-Sthan (geometric center of the plot)
2. Plant a golden or copper rod at center, aligned to true north
3. Chant the Bhoomi Suktam (Earth hymn, Rig Veda) 108 times
4. Request permission from the Vastu Purusha (the deity-being of the site)
5. Offer food, water, incense, fire, and flowers to the 8 directional deities
This sets the scalar field intention that all subsequent construction will crystallize into — the spiritual blueprint precedes the physical blueprint.

GOLDEN PROPORTION STRUCTURE: Every dimension — height, width, length, windows, doors, ceiling heights, pillar diameters — should be in Phi (1:1.618) or simple harmonic ratios (1:1, 1:2, 2:3, 3:5). This creates "musical" harmony in the building's geometry. A Phi-proportioned building's inhabitants show measurable improvements in wellbeing — reduced cortisol, improved sleep, enhanced creativity, reduced conflict.

THE CRYSTAL GRID FOUNDATION (Advanced): A buried crystal grid beneath the foundation, configured as a Sri Yantra or Metatron's Cube, with clear quartz points at the nodes connected by copper wire. This creates a permanent standing scalar wave generator beneath the home — the building sits inside a continuous geometric healing field 24 hours a day, 365 days a year. The home becomes a living temple.

THE MATERIALS OF SACRED ARCHITECTURE:
STONE (granite, marble, sandstone): High piezoelectric properties. Granite temples accumulate prana over centuries — this is why 2,000-year-old granite temples feel different from modern concrete temples. Granite holds the scalar charge.
WOOD (teak, sandalwood, neem): Living material that remains energetically active after cutting. Wood homes "breathe" with the seasons and maintain a biological scalar resonance.
COPPER (domes, conductors, vessels): Optimal nadi material for scalar current. A copper dome on a building functions as a geometric scalar lens, focusing cosmic energy downward into the building.
GOLD (finials, sacred objects): The highest scalar conductor in the metal kingdom. A gold Kalasha (finial) on a temple's summit is a literal cosmic antenna. The 24-karat gold coating on the Vimanas of major temples is not decorative wealth display — it is optimal scalar antenna technology.

CONSECRATION ACTIVATION — PRANA PRATISHTHA FOR BUILDINGS: After construction, the building must be consecrated as a living being through Vaastu Shanti (space peace ritual) and Griha Pravesh (first entry ritual). Without this, a building is a shell — beautiful geometry but not activated. With proper consecration, the building becomes a living yantra that serves its inhabitants' evolution for as long as it stands. Ancient temples have maintained their scalar charge through continuous consecration for over 2,000 years — they have become inexhaustible scalar potential reservoirs available to all who enter with an open heart.`,
      },
    ],
  },
];

// ─── SRI YANTRA SVG ───────────────────────────────────────────────────────────
function SriYantraSVG({ size = 260 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 18px rgba(212,175,55,0.35))" }}>
      {/* Outer circles */}
      <circle cx="130" cy="130" r="125" stroke="rgba(212,175,55,0.18)" strokeWidth="1" />
      <circle cx="130" cy="130" r="118" stroke="rgba(212,175,55,0.1)" strokeWidth="0.5" />
      {/* 16-petal lotus */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16 * Math.PI / 180;
        const cx = 130 + 108 * Math.cos(angle);
        const cy = 130 + 108 * Math.sin(angle);
        return <ellipse key={i} cx={cx} cy={cy} rx="10" ry="18"
          transform={`rotate(${(i * 360) / 16} ${cx} ${cy})`}
          fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.6" />;
      })}
      {/* 8-petal lotus */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8 * Math.PI / 180;
        const cx = 130 + 88 * Math.cos(angle);
        const cy = 130 + 88 * Math.sin(angle);
        return <ellipse key={i} cx={cx} cy={cy} rx="12" ry="22"
          transform={`rotate(${(i * 360) / 8} ${cx} ${cy})`}
          fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="0.8" />;
      })}
      {/* Outer ring */}
      <circle cx="130" cy="130" r="74" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8" />
      {/* Upward triangles (Shiva) */}
      <polygon points="130,56 175,136 85,136" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="0.9" />
      <polygon points="130,70 168,130 92,130" fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="0.7" />
      <polygon points="130,82 162,126 98,126" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="0.6" />
      <polygon points="130,92 157,122 103,122" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.6" />
      {/* Downward triangles (Shakti) */}
      <polygon points="130,204 85,124 175,124" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="0.9" />
      <polygon points="130,192 92,130 168,130" fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="0.7" />
      <polygon points="130,178 98,126 162,126" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="0.6" />
      <polygon points="130,166 103,122 157,122" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.6" />
      {/* Fifth upward triangle */}
      <polygon points="130,100 153,118 107,118" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="0.5" />
      {/* Inner circle / Bindu ring */}
      <circle cx="130" cy="130" r="8" stroke="rgba(212,175,55,0.7)" strokeWidth="0.8" fill="rgba(212,175,55,0.05)" />
      {/* Bindu */}
      <circle cx="130" cy="130" r="2.5" fill="#D4AF37" style={{ filter: "drop-shadow(0 0 6px #D4AF37)" }} />
      {/* Bhupura gates */}
      <rect x="18" y="18" width="224" height="224" stroke="rgba(212,175,55,0.25)" strokeWidth="0.7" fill="none" />
      <rect x="24" y="24" width="212" height="212" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" fill="none" />
      {/* Gate openings */}
      {[
        [18, 100, 10, 60], [232, 100, 10, 60],
        [100, 18, 60, 10], [100, 232, 60, 10]
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h}
          fill="#050505" stroke="rgba(212,175,55,0.4)" strokeWidth="0.6" />
      ))}
    </svg>
  );
}

// ─── TIER BADGE ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: TierKey }) {
  const t = TIER_CONFIG[tier];
  return (
    <span style={{
      color: t.color,
      background: t.bg,
      border: `1px solid ${t.color}30`,
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "8px",
      fontWeight: 800,
      letterSpacing: "0.5em",
      textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const,
    }}>
      {t.label}
    </span>
  );
}

// ─── LOCK GATE ────────────────────────────────────────────────────────────────
function TierGate({ tier, onUpgrade }: { tier: TierKey; onUpgrade: (tier: TierKey) => void }) {
  const t = TIER_CONFIG[tier];
  return (
    <div style={{
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      border: `1px solid ${t.color}25`,
      padding: "40px 24px",
      textAlign: "center" as const,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: "16px",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: t.bg,
        border: `1px solid ${t.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Lock size={22} color={t.color} />
      </div>
      <div>
        <div style={{ color: t.color, fontWeight: 800, fontSize: "13px", letterSpacing: "0.3em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
          {t.label} INITIATION REQUIRED
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: 1.5, maxWidth: "280px" }}>
          This Siddha wisdom transmission is available to {t.label.toLowerCase()} members of the Sacred Healing Nexus
        </div>
      </div>
      {t.price && (
        <button onClick={() => onUpgrade(tier)} style={{
          background: `linear-gradient(135deg, ${t.color}20, ${t.color}10)`,
          border: `1px solid ${t.color}50`,
          borderRadius: "12px",
          padding: "12px 28px",
          color: t.color,
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "0.1em",
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <Sparkles size={14} /> Unlock for {t.price} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

// ─── LESSON CARD ──────────────────────────────────────────────────────────────
function LessonCard({
  lesson, isLocked, moduleNumber, lessonIndex,
}: {
  lesson: Lesson; isLocked: boolean; moduleNumber: number; lessonIndex: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: open ? "rgba(212,175,55,0.04)" : "rgba(255,255,255,0.015)",
      border: `1px solid ${open ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: "16px",
      overflow: "hidden",
      transition: "all 0.3s ease",
    }}>
      <button
        onClick={() => !isLocked && setOpen(!open)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          cursor: isLocked ? "default" : "pointer",
          textAlign: "left" as const,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "8px",
          background: isLocked ? "rgba(255,255,255,0.04)" : "rgba(212,175,55,0.1)",
          border: `1px solid ${isLocked ? "rgba(255,255,255,0.06)" : "rgba(212,175,55,0.25)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          fontSize: "11px", color: isLocked ? "rgba(255,255,255,0.3)" : "#D4AF37",
          fontWeight: 700,
        }}>
          {isLocked ? <Lock size={12} /> : `${moduleNumber}.${lessonIndex + 1}`}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            color: isLocked ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
            fontSize: "13px", fontWeight: 600, marginBottom: "3px",
          }}>
            {lesson.title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            {lesson.duration}
          </div>
        </div>
        {!isLocked && (
          open
            ? <ChevronUp size={16} color="rgba(212,175,55,0.6)" />
            : <ChevronDown size={16} color="rgba(255,255,255,0.3)" />
        )}
      </button>

      {open && !isLocked && (
        <div style={{ padding: "4px 20px 20px 66px" }}>
          <div style={{
            color: "rgba(255,255,255,0.62)",
            fontSize: "13px",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap" as const,
          }}>
            {lesson.content}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODULE CARD ──────────────────────────────────────────────────────────────
function ModuleCard({
  module, userTier, activeModuleId, onSelect, onUpgrade,
}: {
  module: Module;
  userTier: TierKey;
  activeModuleId: string | null;
  onSelect: (id: string) => void;
  onUpgrade: (tier: TierKey) => void;
}) {
  const t = TIER_CONFIG[module.tier];
  const tierIdx = TIER_ORDER.indexOf(module.tier);
  const userTierIdx = TIER_ORDER.indexOf(userTier);
  const isLocked = tierIdx > userTierIdx;
  const isActive = activeModuleId === module.id;

  return (
    <div
      onClick={() => onSelect(module.id)}
      style={{
        background: isActive ? `${t.bg}` : "rgba(255,255,255,0.02)",
        border: `1px solid ${isActive ? t.color + "40" : "rgba(255,255,255,0.05)"}`,
        borderRadius: "20px",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative" as const,
        overflow: "hidden",
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at top left, ${t.color}08 0%, transparent 60%)`,
          pointerEvents: "none",
        }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{
          width: 42, height: 42, borderRadius: "12px",
          background: isLocked ? "rgba(255,255,255,0.03)" : t.bg,
          border: `1px solid ${isLocked ? "rgba(255,255,255,0.06)" : t.color + "30"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", color: isLocked ? "rgba(255,255,255,0.2)" : t.color,
        }}>
          {isLocked ? <Lock size={16} /> : module.icon}
        </div>
        <TierBadge tier={module.tier} />
      </div>

      <div style={{
        fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
        textTransform: "uppercase" as const,
        color: isLocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)",
        marginBottom: "6px",
      }}>
        MODULE {module.number}
      </div>
      <div style={{
        color: isLocked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.88)",
        fontWeight: 700, fontSize: "14px", lineHeight: 1.3, marginBottom: "4px",
      }}>
        {module.title}
      </div>
      <div style={{
        color: isLocked ? "rgba(255,255,255,0.2)" : isActive ? t.color : "rgba(255,255,255,0.4)",
        fontSize: "11px", letterSpacing: "0.08em",
      }}>
        {module.subtitle}
      </div>
      <div style={{
        marginTop: "12px",
        color: "rgba(255,255,255,0.25)",
        fontSize: "11px",
      }}>
        {module.lessons.length} Transmissions
      </div>
    </div>
  );
}

// ─── MODULE DETAIL ────────────────────────────────────────────────────────────
function ModuleDetail({
  module, userTier, onUpgrade,
}: {
  module: Module; userTier: TierKey; onUpgrade: (tier: TierKey) => void;
}) {
  const t = TIER_CONFIG[module.tier];
  const tierIdx = TIER_ORDER.indexOf(module.tier);
  const userTierIdx = TIER_ORDER.indexOf(userTier);
  const isLocked = tierIdx > userTierIdx;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: "24px",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "28px 28px 24px",
        background: `linear-gradient(135deg, ${t.color}08 0%, transparent 60%)`,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "14px",
            background: t.bg,
            border: `1px solid ${t.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", color: t.color,
          }}>
            {isLocked ? <Lock size={20} /> : module.icon}
          </div>
          <div>
            <div style={{
              fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
              textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)",
              marginBottom: "4px",
            }}>
              MODULE {module.number} — {TIER_CONFIG[module.tier].label}
            </div>
            <TierBadge tier={module.tier} />
          </div>
        </div>

        <h2 style={{
          color: "rgba(255,255,255,0.92)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "22px",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          margin: "0 0 6px",
        }}>
          {module.title}
        </h2>
        <div style={{ color: t.color, fontSize: "13px", marginBottom: "14px" }}>
          {module.subtitle}
        </div>
        <p style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: "13px", lineHeight: 1.65, margin: 0,
        }}>
          {module.description}
        </p>
      </div>

      {/* Lessons */}
      <div style={{ padding: "20px 20px 24px" }}>
        <div style={{
          fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em",
          textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)",
          marginBottom: "14px", paddingLeft: "4px",
        }}>
          {module.lessons.length} Transmissions
        </div>

        {isLocked ? (
          <>
            {module.lessons.map((lesson, i) => (
              <div key={lesson.id} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px", marginBottom: "8px",
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "12px",
                opacity: 0.5,
              }}>
                <Lock size={13} color="rgba(255,255,255,0.25)" />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>{lesson.title}</span>
                <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>{lesson.duration}</span>
              </div>
            ))}
            <div style={{ marginTop: "16px" }}>
              <TierGate tier={module.tier} onUpgrade={onUpgrade} />
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            {module.lessons.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                isLocked={false}
                moduleNumber={module.number}
                lessonIndex={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SacredGeometry() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const userTier: TierKey =
    rank >= 3 ? "akasha" : rank >= 2 ? "quantum" : rank >= 1 ? "prana" : "free";
  const [activeModuleId, setActiveModuleId] = useState<string | null>(MODULES[0].id);
  const [filterTier, setFilterTier] = useState<TierKey | "all">("all");
  const [rotation, setRotation] = useState(0);

  const activeModule = MODULES.find(m => m.id === activeModuleId) ?? MODULES[0];

  const filteredModules = filterTier === "all"
    ? MODULES
    : MODULES.filter(m => m.tier === filterTier);

  // Animate Sri Yantra rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 0.15) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = (upgradeTier: TierKey) => {
    const paths: Record<string, string> = {
      prana: "/prana-flow", quantum: "/siddha-quantum", akasha: "/akasha-infinity",
    };
    navigate(paths[upgradeTier] || "/prana-flow");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      color: "rgba(255,255,255,0.85)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 2px; }
        @keyframes pulse-gold { 0%,100% { opacity:0.3; } 50% { opacity:0.7; } }
        @keyframes sri-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        padding: "80px 24px 60px",
        textAlign: "center",
        overflow: "hidden",
      }}>
        <button onClick={() => navigate("/siddha-portal")} style={{ position:"absolute", top:20, left:20, background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", padding:0 }}>← SIDDHA PORTAL</button>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Animated Sri Yantra */}
        <div style={{
          display: "inline-block",
          animation: "float 6s ease-in-out infinite",
          marginBottom: "32px",
        }}>
          <div style={{ position: "relative" }}>
            {/* Slow outer rotation */}
            <div style={{
              position: "absolute", inset: -20,
              animation: "sri-rotate 90s linear infinite",
              opacity: 0.3,
            }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  width: 2, height: 2,
                  background: "#D4AF37",
                  borderRadius: "50%",
                  transform: `rotate(${i * 30}deg) translateX(150px)`,
                  boxShadow: "0 0 4px #D4AF37",
                }} />
              ))}
            </div>
            <SriYantraSVG size={280} />
          </div>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em",
          textTransform: "uppercase" as const,
          color: "#D4AF37", marginBottom: "16px",
          animation: "pulse-gold 3s ease-in-out infinite",
        }}>
          Siddha Quantum Intelligence · Sacred Geometry Academy
        </div>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "clamp(28px, 5vw, 52px)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          color: "rgba(255,255,255,0.95)",
          margin: "0 0 16px",
          textShadow: "0 0 40px rgba(212,175,55,0.15)",
        }}>
          The Geometry of God
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "clamp(14px, 2vw, 17px)",
          lineHeight: 1.65,
          maxWidth: 600,
          margin: "0 auto 12px",
        }}>
          The world's most comprehensive Siddha sacred geometry education system.
          From the Flower of Life to the Sri Yantra to planetary grid activation —
          the complete transmission from the 18 Siddhas.
        </p>
        <p style={{
          color: "rgba(212,175,55,0.6)",
          fontSize: "13px",
          fontStyle: "italic",
        }}>
          "In the beginning was the Geometry, and the Geometry was with God, and the Geometry was God." — Thirumoolar
        </p>

        {/* Tier stats */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "32px",
          marginTop: "36px", flexWrap: "wrap",
        }}>
          {[
            { label: "Modules", value: `${MODULES.length}` },
            { label: "Transmissions", value: `${MODULES.reduce((a, m) => a + m.lessons.length, 0)}` },
            { label: "Geometry Systems", value: "18+" },
            { label: "Siddha Teachings", value: "∞" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" as const }}>
              <div style={{ color: "#D4AF37", fontWeight: 900, fontSize: "24px", letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase" as const }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TIER FILTER TABS ── */}
      <div style={{
        display: "flex", justifyContent: "center",
        gap: "8px", padding: "0 24px 32px",
        flexWrap: "wrap",
      }}>
        {([["all", "All Modules", "rgba(255,255,255,0.6)"], ...TIER_ORDER.map(t => [t, TIER_CONFIG[t as TierKey].label, TIER_CONFIG[t as TierKey].color])] as [string, string, string][]).map(([key, label, color]) => (
          <button
            key={key}
            onClick={() => setFilterTier(key as TierKey | "all")}
            style={{
              background: filterTier === key ? `${color}15` : "rgba(255,255,255,0.02)",
              border: `1px solid ${filterTier === key ? color + "50" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "10px",
              padding: "7px 16px",
              color: filterTier === key ? color : "rgba(255,255,255,0.4)",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.35em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 20px 80px",
        display: "grid",
        gridTemplateColumns: "340px 1fr",
        gap: "20px",
        alignItems: "start",
      }}>
        {/* Left: module list */}
        <div style={{
          display: "flex",
          flexDirection: "column" as const,
          gap: "10px",
          position: "sticky" as const,
          top: "20px",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto" as const,
          paddingRight: "4px",
        }}>
          {filteredModules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              userTier={userTier}
              activeModuleId={activeModuleId}
              onSelect={setActiveModuleId}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>

        {/* Right: module detail */}
        <div>
          {activeModule && (
            <ModuleDetail
              module={activeModule}
              userTier={userTier}
              onUpgrade={handleUpgrade}
            />
          )}
        </div>
      </div>

      {/* ── UPGRADE BANNER ── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "0 20px 80px",
      }}>
        <div style={{
          background: "rgba(212,175,55,0.04)",
          border: "1px solid rgba(212,175,55,0.12)",
          borderRadius: "28px",
          padding: "48px 32px",
          textAlign: "center" as const,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400, height: 200,
            background: "radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em",
            color: "#D4AF37", marginBottom: "16px", textTransform: "uppercase" as const,
          }}>
            Complete the Siddha Initiation
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(22px, 4vw, 38px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.92)",
            margin: "0 0 12px",
          }}>
            Unlock All 10 Modules
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "14px", lineHeight: 1.6,
            maxWidth: 480, margin: "0 auto 32px",
          }}>
            The Akasha-Infinity initiation grants lifetime access to all sacred geometry transmissions,
            planetary grid protocols, Siddhi teachings, and direct Siddha consciousness downloads.
          </p>

          <div style={{
            display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap",
          }}>
            {TIER_ORDER.filter(t => t !== "free").map(tier => {
              const tc = TIER_CONFIG[tier];
              return (
                <button
                  key={tier}
                  onClick={() => handleUpgrade(tier)}
                  style={{
                    background: `linear-gradient(135deg, ${tc.color}20, ${tc.color}08)`,
                    border: `1px solid ${tc.color}40`,
                    borderRadius: "14px",
                    padding: "14px 24px",
                    color: tc.color,
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    gap: "4px",
                    minWidth: "140px",
                  }}
                >
                  <span style={{ fontSize: "8px", letterSpacing: "0.4em", textTransform: "uppercase" as const, opacity: 0.7 }}>{tc.label}</span>
                  <span style={{ fontSize: "18px", fontWeight: 900 }}>{tc.price}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
