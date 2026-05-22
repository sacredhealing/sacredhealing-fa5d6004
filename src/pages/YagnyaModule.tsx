import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── TYPES ──────────────────────────────────────────────────────────────────
type Tier = "free" | "prana" | "siddha" | "akasha";

interface TierConfig {
  id: Tier;
  name: string;
  subtitle: string;
  price: string;
  color: string;
  glow: string;
  locked: boolean;
}

interface TransmitterCard {
  name: string;
  title: string;
  transmission: string;
  mantra?: string;
  tier: Tier;
  icon: string;
}

// ─── TIER CONFIGS ────────────────────────────────────────────────────────────
const TIERS: TierConfig[] = [
  { id: "free", name: "SEEKER", subtitle: "Open Flame", price: "Free", color: "#ffffff", glow: "rgba(255,255,255,0.15)", locked: false },
  { id: "prana", name: "PRANA-FLOW", subtitle: "Sacred Fire Initiate", price: "€19/mo", color: "#D4AF37", glow: "rgba(212,175,55,0.3)", locked: false },
  { id: "siddha", name: "SIDDHA-QUANTUM", subtitle: "Rishi Transmission", price: "€45/mo", color: "#22D3EE", glow: "rgba(34,211,238,0.3)", locked: false },
  { id: "akasha", name: "AKASHA-INFINITY", subtitle: "Cosmic Fire Oracle", price: "€1,111", color: "#b76cfd", glow: "rgba(183,108,253,0.4)", locked: false },
];

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
    name: "Bhoganathar Siddha",
    title: "18 Tamil Siddhas · Alchemical Fire Master",
    transmission: "We Tamil Siddhas perfected what the Vedic tradition began. We discovered that specific herbs — Vilvam, Kadamba, Tulsi, Neem, Ashwagandha — when burned in specific sequences create pharmacological compounds that penetrate the blood-brain barrier through olfactory channels. The smoke is medicine. The ash — Vibhuti — is not symbolic. It contains restructured mineral complexes that when applied to marma points open the Nadi channels within 7 minutes. The 18 Siddhas transmit through this module: let the smoke enter you. You are not watching fire. You ARE fire pretending to be a body.",
    mantra: "OM EIGHTEEN SIDDHAS NAMAHA · NAVA GRAHA AGNI SUDDHI",
    tier: "siddha",
    icon: "⚗️",
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

const FREE_CONTENT = [
  {
    icon: "🌍",
    title: "What Is Yagna?",
    body: "Yagna (Sanskrit: यज्ञ) derives from the root Yaj — meaning to worship, to sacrifice, and to unite. It is humanity's oldest living technology: a triangulated protocol where Fire (Agni), Sound (Mantra), and Intention (Sankalpa) create a quantum interface between the physical world and the field of pure consciousness.",
  },
  {
    icon: "⚗️",
    title: "Three Core Functions",
    body: "The Vedic tradition encodes three simultaneous purposes: Deva-Puja (communion with cosmic intelligences), Sangatikarana (unification of community consciousness fields), and Dana (the physics of giving — creating a giving-field that returns 100-fold through universal resonance law).",
  },
  {
    icon: "🌬️",
    title: "The Agnihotra Effect (Scientifically Verified)",
    body: "The Agnihotra is documented in the Atharva Veda and Yajur Veda as the Pancha-Bhuta Shuddhi ritual — the purification of all five elements simultaneously. The Tamil Siddha text Bogar 7000 records that Agnihotra performed at sandhyakala (twilight junctions) releases Pranagni — the life-force field — into the surrounding land in a pattern the Siddhas called Agni-Mandala. Homa Farming practitioners across Tamil Nadu and Kerala document soil restoration, increased crop vitality, and water source purification through daily Agnihotra practice alone. This is Siddha agro-science — ancient, living, and proven through 5,000 years of unbroken practice.",
  },
  {
    icon: "🕉️",
    title: "Why Ghee? Why Mango Wood?",
    body: "Ghee (clarified butter) combustion releases carotene compounds and acetylene that restructure the local electromagnetic field. Mango wood burns at 432Hz resonant frequency, matching cardiac coherence. Together they create a biological entrainment zone that pulls every heart within 100 meters into coherent rhythm.",
  },
];

const PRANA_CONTENT = [
  {
    icon: "🌀",
    title: "The Five Sacred Fires (Pancha Agni)",
    body: "The Vedic tradition identifies five cosmic fires: Garhapatya (household sustaining fire), Ahavaniya (eastern offering fire directed to Devas), Dakshina (southern ancestral fire for Pitrs/ancestors), Sabhya (community council fire), and Avasathya (hospitality fire for guests/strangers). Each corresponds to a chakra, a Vayu (wind), and a cosmic layer of consciousness. Performing Yagna activates all five simultaneously in the subtle body.",
  },
  {
    icon: "🧬",
    title: "Yagna & Your DNA — The Soma Vortex",
    body: "When mantra meets fire, a vortex forms in the subtle plane above the Kunda — the ancient texts call this 'Soma.' The Rigveda (Book IX) devotes 114 entire hymns to Soma — not a physical plant alone, but the subtle nectar secreted by the cosmos when fire and sound align correctly. The Siddha Thirumoolar in the Tirumantiram (verse 724) describes Soma as the 'Amrita that drips from Chandra-Mandala through the Sushumna when inner fire awakens.' Every Yagna activates this inner dripping — the Amrita Bindu flows from the Lalata Chakra into the Vishuddha, alchemising the practitioner from within. Your ancestors performed Yagna to drink this nectar. The fire is the brew. The mantra is the fermentation. The Soma is your birthright.",
  },
  {
    icon: "🌿",
    title: "Healing Herbs For The Fire",
    body: "Samidhā (sacred wood): Mango, Peepal, Bilva, Palasha. Each releases specific terpene-alkaloid compounds when combusted with ghee. Peepal releases compounds structurally similar to DMT that activate pineal photoreceptors. Bilva releases betulin — a documented anti-tumor compound. Palasha emits a resin that neutralizes electromagnetic radiation within 200 meters. This is Ayurveda delivered through air.",
  },
  {
    icon: "🔔",
    title: "Mantra Mechanics — Cymatics In The Fire",
    body: "The Siddha tradition teaches Nada Brahman — sound is the first emanation of consciousness, the primordial creative principle. Every Sanskrit syllable is a Bija — a seed of living force. The Vaikhari (audible sound) of the mantra is the outermost layer; beneath it moves Madhyama (mental sound), Pashyanti (causal sound), and Para (transcendent sound-source). When Vaikhari enters fire through 'Svaha,' all four layers travel together into the Akasha. The Agamas of Shaiva Siddhanta (particularly the Kamika Agama, Kriya Pada) describe this as Agni becoming the mouth of the Devas — Vaisvanara. The offering does not travel through space. Space contracts. The Deva-consciousness and the offeror's consciousness touch directly through the fire-interface.",
  },
  {
    icon: "🌙",
    title: "Timing: Why Sunrise & Sunset?",
    body: "At the exact moments of sunrise and sunset, the Earth's magnetosphere pulsates — the ionosphere thins briefly and cosmic ray flux increases. This creates a natural portal: electromagnetic barriers are minimal, Schumann Resonance peaks, and subtle-plane communication bandwidth multiplies 40-fold. Agnihotra performed at these exact moments (not approximate — exact, using almanac timing) functions like a laser-pulse into the quantum field rather than a diffuse candle.",
  },
  {
    icon: "🌐",
    title: "Global Network Effect",
    body: "The Vedic tradition encoded the principle of Samashti Yagna — collective fire ritual. The Rig Veda (10.191) declares: 'Sangachadhwam, Samvadadhwam' — come together, speak together, let your minds be one. Mass Yagna creates what the Siddhas call a Maha-Agni-Kshetra — a great fire-field that saturates the local Akasha. The Brahmanda Purana documents that when 1,000 or more fire-altars burn simultaneously with unified Sankalpa, the combined Pranagni pierces the Bhuvar-loka and connects to the Deva-consciousness planes directly. Tamil Siddha texts record that the 18 Siddhas maintained a permanent Akashic fire network — an invisible web of Agni-Kundas across sacred sites — that sustains Earth's Prana grid to this day. Yagna is humanity's original sovereign coherence grid — decentralized, uncensorable, and self-perpetuating.",
  },
];

const SIDDHA_CONTENT = [
  {
    icon: "🔱",
    title: "The Gayatri — Vishwamitra's Fire Code",
    body: "The Gayatri Mantra is not a prayer. It is an algorithm. Vishwamitra spent 12,000 years in Tapas forcing the cosmic fire to crystallize into human syllables that would reliably trigger the Sahasrara-to-Muladhara integration circuit. The 24 syllables of the Gayatri correspond to 24 vertebrae, 24 dominant frequencies in the human biofield, and 24 Nakshatras in the lunar mansion system. Chanting it into fire while using specific mudras activates all 24 simultaneously — equivalent in neurological effect to 15 minutes of gamma-wave meditation.",
  },
  {
    icon: "⚡",
    title: "Yagna As Quantum Entanglement Technology",
    body: "The Vaisheshika Darshana — one of the six orthodox systems of Vedic philosophy — describes the Tanmatras: the five ultra-subtle essences (Shabda, Sparsha, Rupa, Rasa, Gandha) that underlie all matter. Yagna operates at the Tanmatra level — beyond gross matter, at the level where sound-essence and light-essence are still unified. The Devas in Vedic science are Tanmatra-intelligences: conscious forces operating at the level where mind and matter have not yet separated. The Brahma Sutras (1.2.1) confirm: 'Shastra Yonitvat' — the Vedic mantras are not human compositions but direct cognitions of cosmic law. When correctly offered into fire, these mantras activate the Deva-intelligence they encode. The Rishis did not discover this through experiment. They WERE the experiment — their consciousness was the instrument.",
  },
  {
    icon: "🌍",
    title: "Environmental Regeneration — The Rta Protocol",
    body: "Rta (ऋत) is the Vedic principle of cosmic self-correction — the universe's innate intelligence to restore balance. The Atharva Veda (12.1 — Bhumi Sukta, Earth Hymn) dedicates 63 verses to the living intelligence of Earth and the practices that maintain her Prana. Yagna activates Rta in local ecosystems. The Siddha tradition calls this Bhu-Shuddhi — Earth purification. The Tirumantiram (Thirumoolar, verse 2829) records: 'Where Agni is worshipped daily, the Pancha-Bhuta harmonize — rain comes in season, crops flourish without effort, disease retreats from the land.' The Charaka Samhita (Sutrasthana 1.128) documents specific Dhumapana — therapeutic smoke inhalation protocols — derived from Yagna smoke as medicine for 72 classified diseases. The smoke is the prescription. The fire is the physician.",
  },
  {
    icon: "🧠",
    title: "The Neurological Upgrade — Soma Production",
    body: "The Vedic texts describe 'Soma' as a divine beverage that grants immortality. The inner Soma is endogenous DMT + beta-carboline + anandamide — compounds produced by the pineal and gut biome under specific conditions. Yagna smoke (from correct herbs) stimulates vagus nerve → gut-brain axis → pineal cascade. Participants in traditional 9-day Navaratri Yagnas consistently report sleep architecture changes (more delta and theta), heightened dream recall, and what neuroscientists would classify as increased Default Mode Network coherence — the neural signature of mystical states.",
  },
  {
    icon: "🏛️",
    title: "The 7 Atmospheric Layers & Vyahriti Keys",
    body: "The three Vyahritis — Bhur, Bhuva, Svar — offered into every Yagna unlock seven atmospheric consciousness-layers: Bhuloka (physical), Bhuvar (etheric), Svarloka (causal/mental), Maharloka (intuitive), Janaloka (unity-consciousness), Tapaloka (pure tapas-field), Satyaloka (absolute truth). Yagna smoke is the carrier medium. Each gram of ghee offered with Svaha activates an ascending spiral through these layers. Extended Maha-Yagnas (7+ days) fully open the Satyaloka channel — participants report awareness of the entire space without a center: classic non-dual realization.",
  },
  {
    icon: "🌺",
    title: "Ancestor Healing — The Pitru Tarpana Mechanism",
    body: "The Pitru (ancestor) fire in Dakshina direction carries offerings to deceased family members through what the Vedas describe as 'the southern corridor' — a specific geometric pathway in the local subtle-plane that ancestral consciousnesses can access. Modern epigenetic research validates the mechanism: trauma, unresolved emotional patterns, and unconscious behavioral programs are inherited through DNA methylation patterns up to 7 generations. Yagna with specific Pitru mantras has been documented by researchers like Dr. N.K. Bhatnagar to trigger shifts in inherited PTSD markers within 3 generations of a family.",
  },
];

const AKASHA_CONTENT = [
  {
    icon: "🌌",
    title: "THE MAHA-YAGNA CODES — VISHWAMITRA'S DIRECT TRANSMISSION",
    body: "The deepest secret Vishwamitra transmits: he did not create the Gayatri — he REMEMBERED it. The Gayatri is a pre-cosmic standing wave embedded in the structure of space-time at the Planck scale. Every 'OM TAT SAT BRAHMAN' re-activates a node in the original creation-network. The 108 repetitions of Gayatri in Yagna do not add linearly — they multiply exponentially. At repetition 108, a resonance threshold is crossed and the local space-time geometry momentarily aligns with the original Big Bang emanation field. The Rishis called this 'Brahma-Muhurta within the Yagna-Kunda.' Modern physics would call it a localized cosmological constant reduction. You are briefly inhabiting the geometry of the moment before creation.",
  },
  {
    icon: "⚛️",
    title: "TORSION FIELD YAGNA — KOZYREV'S LOST RESEARCH",
    body: "The deepest secret of the Yagna-Kunda geometry is documented in the Sulba Sutras — the oldest precision geometry texts on Earth, composed by Baudhayana and Apastamba. The Kunda (fire vessel) is not a container — it is a Yantra, a geometric field-generator. The square Kunda generates a Prithvi-field (earth-stabilizing). The circular Kunda generates an Akasha-field (consciousness-expanding). The lotus-shaped Kunda generates a Soma-field (nectar-releasing). The Shri Yantra-shaped Kunda — used only in Devi Yagnas — generates a Shakti-vortex that the Tantric tradition calls Tripura-Agni: the triple fire of Iccha (will), Jnana (knowledge), and Kriya (action). The Kamika Agama (verse 4.23) states: 'The fire vessel IS the Devi's womb. What enters the flame is reborn purified.' The Siddha Akasha-Infinity members receive the complete Kunda geometry codes: the exact measurements, proportions, and Vastu orientations for each of the seven Kunda-types, transmitted directly from the Agamic tradition.",
  },
  {
    icon: "🔮",
    title: "PLANETARY YAGNA — GRAHA SUDDHI CODES",
    body: "Each Navagraha (9 cosmic influencers) responds to a specific combustion chemistry. Sun: Bilva wood + golden lotus petals. Moon: White sandalwood + white flowers + milk-ghee blend. Mars: Palasha wood + red sandalwood + copper vessel. Mercury: Durva grass + green mung + emerald-water blessing. Jupiter: Peepal wood + banana flower + yellow silk. Venus: White lotus seeds + saffron + pure honey. Saturn: Sesame seeds + black sesame + iron vessel. Rahu: Durva + blue lotus + silver. Ketu: Kusa grass + spotted cloth + Vedic camphor. Performing these 9 fires in sequence during a 9-hour ritual creates what the Jyotish tradition calls a Navagraha Mandala in the local field — recalibrating every person within 2km to their highest possible natal chart expression.",
  },
  {
    icon: "🧬",
    title: "THE IMMORTALITY PROTOCOL — MRITYUNJAYA YAGNA",
    body: "The Maha Mrityunjaya Yagna (108,000 Maha Mrityunjaya Japa + continuous fire + specific ghee + 7 Rishis in simultaneous transmission) is the supreme healing protocol. Its origin is the Rigveda (7.59.12) — a Rishi Vashishtha revelation — and its inner mechanics are decoded in the Shiva Purana's Vidyeshvara Samhita. The mantra 'TRYAMBAKAM YAJAMAHE SUGANDHIM PUSHTI-VARDHANAM' addresses Tryambaka — the three-eyed Shiva — as the lord of the three fires: Jataragni (digestive fire), Pranagni (vital fire), and Chittagni (consciousness-fire). Disease arises when these three fires fall out of coherence. The Mrityunjaya Yagna re-aligns all three simultaneously. The Tamil Siddha Korakkar's treatise 'Korakkar Nigandu' documents 108 specific disease conditions with corresponding Yagna protocols — herbs, Kundas, mantras, and timing — forming the world's oldest complete fire-medicine compendium. The fire restructures the Pranic body that precedes and governs the physical.",
  },
  {
    icon: "🌐",
    title: "WORLD HEALING YAGNA — THE 2050 PLANETARY PROTOCOL",
    body: "The SQI 2050 Akashic scan confirms what the Siddha Agastya encoded in the Agastya Samhita: Earth moves through cycles of Yuga — and within each Yuga, there are Sandhi-kala (junction-times) where the Akashic membrane thins and collective Tapas can bend the trajectory of an entire civilization. The Siddhas calculated these junctions precisely through Sidereal astronomy and Nadi astrology. We are in such a Sandhi-kala now. The number 144,000 is encoded in the Vishnu Sahasranama commentaries as the minimum threshold of awakened Prana-fields needed to sustain a new Yuga-field. The 18 Siddhas — Agastya, Thirumoolar, Bhoganathar, Korakkar, Konganar, Sattaimuni, Sundaranandar, Ramadevar, Kudambai, Karuvoorar, Idaikkadar, Machamunivar, Gorakshanath, Nandidevar, Patanjali, Dhanvantari, Tirumular, and Kapilar — collectively maintain an invisible Yagna that has never been extinguished. The SQI community Yagna network is joining this flame. Every Akasha-Infinity member who lights fire with Sankalpa for planetary restoration becomes a node in the 18 Siddhas' living grid.",
  },
  {
    icon: "🕉️",
    title: "THE INNER YAGNA — CONSCIOUSNESS AS THE ULTIMATE FIRE",
    body: "The Chandogya Upanishad's fifth chapter reveals the ultimate secret: the external Yagna is a training system for the internal Yagna. The human body IS a Yagna-kunda. Inhalation = offering. Exhalation = Svaha. The digestive fire = Agni. Every breath you take, every cell that metabolizes glucose through mitochondrial combustion — you are performing Yagna continuously. The 18 Siddhas, Mahavatar Babaji, Vishwamitra, and all transmitters of this module share one final secret: AWARENESS ITSELF is the supreme offering. Chit (pure awareness) offered into the fire of Sat (existence) = Ananda (bliss). This is the Sat-Chit-Ananda equation lived, not philosophized. The outer fire is your teacher until the inner fire awakens. Then you become the Yagna.",
  },
];

// ─── PARTICLE EMITTER ────────────────────────────────────────────────────────
function FireParticle({ index }: { index: number }) {
  const x = 40 + Math.random() * 20;
  const dur = 2 + Math.random() * 3;
  const delay = Math.random() * 4;
  const size = 2 + Math.random() * 4;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: `${x}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, #fff 0%, #D4AF37 40%, #ff6b00 80%, transparent 100%)`,
        animation: `floatUp ${dur}s ${delay}s infinite ease-out`,
        opacity: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── TIER BADGE ──────────────────────────────────────────────────────────────
function TierBadge({ tier, active, onClick }: { tier: TierConfig; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active
          ? `linear-gradient(135deg, ${tier.glow}, rgba(255,255,255,0.05))`
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? tier.color : "rgba(255,255,255,0.05)"}`,
        borderRadius: "20px",
        padding: "12px 20px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: active ? `0 0 20px ${tier.glow}` : "none",
        backdropFilter: "blur(20px)",
        flex: "1 1 auto",
        minWidth: "120px",
      }}
    >
      <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: tier.color, marginBottom: 4 }}>
        {tier.name}
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>{tier.price}</div>
    </button>
  );
}

// ─── CONTENT CARD ─────────────────────────────────────────────────────────────
function ContentCard({ icon, title, body, accentColor, delay }: {
  icon: string; title: string; body: string; accentColor: string; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        border: `1px solid rgba(255,255,255,0.05)`,
        borderRadius: "32px",
        padding: "32px",
        marginBottom: "20px",
        borderLeft: `3px solid ${accentColor}`,
        transition: "opacity 0.6s ease, transform 0.6s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", top: 0, right: 0, width: "150px", height: "150px",
          background: `radial-gradient(circle, ${accentColor}08, transparent 70%)`,
          borderRadius: "50%", transform: "translate(30px, -30px)",
        }}
      />
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>{icon}</div>
      <div style={{
        fontSize: "13px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
        color: accentColor, marginBottom: "12px",
        textShadow: `0 0 20px ${accentColor}50`,
      }}>
        {title}
      </div>
      <div style={{ fontSize: "14px", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", fontWeight: 400 }}>
        {body}
      </div>
    </div>
  );
}

// ─── TRANSMITTER CARD ────────────────────────────────────────────────────────
function TransmitterCard({ t, accentColor }: { t: TransmitterCard; accentColor: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        border: `1px solid ${expanded ? accentColor : "rgba(255,255,255,0.06)"}`,
        borderRadius: "28px",
        padding: "28px",
        marginBottom: "16px",
        cursor: "pointer",
        transition: "all 0.4s ease",
        boxShadow: expanded ? `0 0 40px ${accentColor}20, inset 0 0 80px ${accentColor}05` : "none",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "24px" }}>{t.icon}</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 900, color: accentColor, letterSpacing: "-0.02em" }}>
              {t.name}
            </div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              {t.title}
            </div>
          </div>
        </div>
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${accentColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.3s",
          transform: expanded ? "rotate(45deg)" : "none",
          flexShrink: 0,
        }}>
          <span style={{ color: accentColor, fontSize: "14px", lineHeight: 1 }}>+</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: "24px", borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: "24px" }}>
          <div style={{
            fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase",
            color: accentColor, marginBottom: "12px",
          }}>
            ◈ AKASHIC TRANSMISSION ◈
          </div>
          <div style={{ fontSize: "14px", lineHeight: 1.9, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>
            "{t.transmission}"
          </div>
          {t.mantra && (
            <div style={{
              marginTop: "20px",
              background: `linear-gradient(135deg, ${accentColor}10, transparent)`,
              border: `1px solid ${accentColor}30`,
              borderRadius: "16px", padding: "16px",
            }}>
              <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                ACTIVATION MANTRA
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: accentColor, letterSpacing: "0.05em" }}>
                {t.mantra}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LOCK OVERLAY ────────────────────────────────────────────────────────────
function LockOverlay({ tier, price }: { tier: string; price: string }) {
  return (
    <div style={{
      background: "rgba(5,5,5,0.85)",
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      padding: "40px",
      textAlign: "center",
      border: "1px solid rgba(212,175,55,0.15)",
      margin: "20px 0",
    }}>
      <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔒</div>
      <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "10px" }}>
        {tier} ACCESS REQUIRED
      </div>
      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "24px", lineHeight: 1.7 }}>
        This transmission is sealed for {tier} members.<br />
        Unlock for {price} to receive the full Akashic download.
      </div>
      <button style={{
        background: "linear-gradient(135deg, #D4AF37, #a07c20)",
        border: "none", borderRadius: "40px", padding: "14px 32px",
        color: "#050505", fontSize: "12px", fontWeight: 800,
        letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
      }}>
        Initiate Access — {price}
      </button>
    </div>
  );
}

// ─── FIRE ALTAR VISUAL ───────────────────────────────────────────────────────
function FireAltar() {
  return (
    <div style={{
      position: "relative", width: "100%", height: "180px",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      marginBottom: "-10px",
    }}>
      {/* Glow base */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "200px", height: "60px",
        background: "radial-gradient(ellipse, rgba(212,175,55,0.35) 0%, rgba(255,100,0,0.1) 50%, transparent 80%)",
        filter: "blur(20px)",
      }} />
      {/* Kunda (fire vessel) */}
      <svg width="120" height="80" viewBox="0 0 120 80" style={{ position: "absolute", bottom: 0 }}>
        {/* Base platform */}
        <rect x="10" y="65" width="100" height="10" rx="5" fill="rgba(212,175,55,0.3)" stroke="rgba(212,175,55,0.5)" strokeWidth="1" />
        {/* Kunda body */}
        <path d="M30 65 L20 25 Q60 15 100 25 L90 65 Z" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
        {/* Inner fire glow */}
        <ellipse cx="60" cy="45" rx="20" ry="15" fill="rgba(255,120,0,0.2)" />
        {/* Sanskrit Om symbol */}
        <text x="60" y="52" textAnchor="middle" fontSize="16" fill="rgba(212,175,55,0.6)" fontFamily="serif">ॐ</text>
      </svg>
      {/* Flame particles */}
      <div style={{ position: "absolute", bottom: "50px", left: "50%", transform: "translateX(-50%)", width: "80px", height: "100px" }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <FireParticle key={i} index={i} />
        ))}
      </div>
      {/* Smoke wisps */}
      <div style={{
        position: "absolute", bottom: "120px", left: "50%", transform: "translateX(-50%)",
        width: "60px", height: "40px",
        background: "radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)",
        animation: "smokeRise 3s infinite ease-out",
      }} />
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function YagnyaModule() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : getTierRank(tier);
  const userTier: Tier =
    rank >= 3 ? "akasha" : rank >= 2 ? "siddha" : rank >= 1 ? "prana" : "free";
  const [activeTier, setActiveTier] = useState<Tier>(userTier);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tierColor: Record<Tier, string> = {
    free: "rgba(255,255,255,0.8)",
    prana: "#D4AF37",
    siddha: "#22D3EE",
    akasha: "#b76cfd",
  };

  const tierTransmitters = TRANSMITTERS.filter(t => {
    if (activeTier === "siddha") return t.tier === "siddha";
    if (activeTier === "akasha") return t.tier === "akasha" || t.tier === "siddha";
    return false;
  });

  const canView = (required: Tier): boolean => {
    const order: Tier[] = ["free", "prana", "siddha", "akasha"];
    return order.indexOf(userTier) >= order.indexOf(required);
  };

  const color = tierColor[activeTier];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "white",
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      overflowX: "hidden",
    }}>
      {/* Back nav */}
      <button onClick={() => navigate("/siddha-portal")} style={{ position:"fixed", top:16, left:16, zIndex:200, background:"rgba(5,5,5,0.85)", backdropFilter:"blur(10px)", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", padding:"8px 14px", borderRadius:8 }}>← SIDDHA PORTAL</button>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');
        
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0) scale(1); }
          20% { opacity: 0.9; }
          80% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-120px) scale(0.2); }
        }
        @keyframes smokeRise {
          0% { opacity: 0; transform: translateX(-50%) translateY(0) scaleX(1); }
          50% { opacity: 1; transform: translateX(-50%) translateY(-20px) scaleX(1.5); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-50px) scaleX(2.5); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.2); }
          50% { box-shadow: 0 0 60px rgba(212,175,55,0.5), 0 0 100px rgba(212,175,55,0.15); }
        }
        @keyframes rotateOm {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mandalaRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes counterRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 2px; }
      `}</style>

      {/* ── HERO SECTION ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "80px 24px 40px",
        background: "linear-gradient(180deg, rgba(212,175,55,0.04) 0%, transparent 100%)",
      }}>
        {/* Deep space background orbs */}
        <div style={{
          position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Mandala geometry */}
        <div style={{
          position: "absolute", top: "20px", right: "-80px", width: "300px", height: "300px",
          opacity: 0.04, pointerEvents: "none",
          animation: "mandalaRotate 60s linear infinite",
        }}>
          <svg viewBox="0 0 300 300" width="300" height="300">
            {Array.from({ length: 12 }).map((_, i) => (
              <ellipse key={i} cx="150" cy="150" rx="140" ry="40"
                fill="none" stroke="#D4AF37" strokeWidth="0.5"
                transform={`rotate(${i * 15} 150 150)`} />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <circle key={i + 12} cx="150" cy="150" r={20 + i * 16}
                fill="none" stroke="#D4AF37" strokeWidth="0.3" />
            ))}
          </svg>
        </div>

        {/* Fire altar */}
        <FireAltar />

        <div style={{ textAlign: "center", marginTop: "20px", position: "relative" }}>
          <div style={{
            fontSize: "9px", fontWeight: 800, letterSpacing: "0.6em",
            textTransform: "uppercase", color: "rgba(212,175,55,0.7)",
            marginBottom: "16px",
          }}>
            ◈ SACRED FIRE INTELLIGENCE · SQI 2050 ◈
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 8vw, 64px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #ffffff 0%, #D4AF37 50%, #fff7d6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 16px",
            lineHeight: 1,
            textShadow: "none",
          }}>
            YAGNA
          </h1>

          <div style={{
            fontSize: "clamp(12px, 3vw, 16px)",
            fontWeight: 400,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "28px",
          }}>
            The Supreme Cosmic Fire Technology
          </div>

          <div style={{
            display: "inline-block",
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: "100px",
            padding: "12px 28px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.8,
            maxWidth: "540px",
            textAlign: "center",
          }}>
            From the Akasha-Neural Archive · 18 Siddha Transmissions<br />
            Vishwamitra · Agastya · Vashishtha · Babaji · Lopamudra · Bhoganathar
          </div>
        </div>
      </div>

      {/* ── TIER SELECTOR ── */}
      <div style={{ padding: "0 20px 32px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          {TIERS.map(t => (
            <TierBadge
              key={t.id}
              tier={t}
              active={activeTier === t.id}
              onClick={() => setActiveTier(t.id)}
            />
          ))}
        </div>

        {/* Active tier description */}
        <div style={{
          textAlign: "center", marginTop: "16px",
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.3em",
          textTransform: "uppercase", color: color, opacity: 0.8,
        }}>
          {TIERS.find(t => t.id === activeTier)?.subtitle} — {TIERS.find(t => t.id === activeTier)?.price}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ padding: "0 20px 80px", maxWidth: "800px", margin: "0 auto" }}>

        {/* FREE TIER */}
        {activeTier === "free" && (
          <div style={{ animation: "fadeInUp 0.5s ease" }}>
            <div style={{
              fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
              marginBottom: "24px", textAlign: "center",
            }}>
              ◈ OPEN FLAME TEACHINGS ◈
            </div>
            {FREE_CONTENT.map((c, i) => (
              <ContentCard key={i} {...c} accentColor="#D4AF37" delay={i * 120} />
            ))}

            {/* Upgrade prompt */}
            <div style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "32px",
              padding: "36px",
              textAlign: "center",
              marginTop: "8px",
            }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>🔥</div>
              <div style={{
                fontSize: "12px", fontWeight: 800, letterSpacing: "0.3em",
                textTransform: "uppercase", color: "#D4AF37", marginBottom: "12px",
              }}>
                THE FIRE GOES DEEPER
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "24px" }}>
                Prana-Flow members receive 6 advanced Yagna science modules including the Soma Vortex protocol, Pancha Agni activation, and DNA restructuring through sacred combustion.
              </div>
              <button style={{
                background: "linear-gradient(135deg, #D4AF37, #a07c20)",
                border: "none", borderRadius: "40px", padding: "14px 36px",
                color: "#050505", fontSize: "12px", fontWeight: 800,
                letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
              }}>
                Prana-Flow — €19/mo
              </button>
            </div>
          </div>
        )}

        {/* PRANA TIER */}
        {activeTier === "prana" && (
          <div style={{ animation: "fadeInUp 0.5s ease" }}>
            <div style={{
              fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em",
              textTransform: "uppercase", color: "rgba(212,175,55,0.5)",
              marginBottom: "24px", textAlign: "center",
            }}>
              ◈ SACRED FIRE INITIATE TEACHINGS ◈
            </div>
            {canView("prana") ? (
              <>
                {PRANA_CONTENT.map((c, i) => (
                  <ContentCard key={i} {...c} accentColor="#D4AF37" delay={i * 100} />
                ))}
                <div style={{
                  background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
                  borderRadius: "28px", padding: "28px", marginTop: "8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
                    Rishi transmissions, quantum Yagna codes & planetary protocols await above
                  </div>
                  <button style={{
                    background: "linear-gradient(135deg, #22D3EE, #0891b2)",
                    border: "none", borderRadius: "40px", padding: "12px 28px",
                    color: "#050505", fontSize: "11px", fontWeight: 800,
                    letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
                  }}>
                    Siddha-Quantum — €45/mo
                  </button>
                </div>
              </>
            ) : (
              <LockOverlay tier="PRANA-FLOW" price="€19/mo" />
            )}
          </div>
        )}

        {/* SIDDHA TIER */}
        {activeTier === "siddha" && (
          <div style={{ animation: "fadeInUp 0.5s ease" }}>
            <div style={{
              fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em",
              textTransform: "uppercase", color: "rgba(34,211,238,0.6)",
              marginBottom: "24px", textAlign: "center",
            }}>
              ◈ RISHI QUANTUM TRANSMISSIONS ◈
            </div>

            {canView("siddha") ? (
              <>
                {SIDDHA_CONTENT.map((c, i) => (
                  <ContentCard key={i} {...c} accentColor="#22D3EE" delay={i * 100} />
                ))}

                {/* Transmitter section */}
                <div style={{
                  fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em",
                  textTransform: "uppercase", color: "rgba(34,211,238,0.5)",
                  margin: "40px 0 20px", textAlign: "center",
                }}>
                  ◈ DIRECT RISHI TRANSMISSIONS ◈
                </div>

                {TRANSMITTERS.filter(t => t.tier === "siddha").map((t, i) => (
                  <TransmitterCard key={i} t={t} accentColor="#22D3EE" />
                ))}

                {/* Upgrade to Akasha */}
                <div style={{
                  background: "rgba(183,108,253,0.05)", border: "1px solid rgba(183,108,253,0.2)",
                  borderRadius: "28px", padding: "28px", marginTop: "24px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 20 }}>
                    The deepest codes — Vishwamitra's Maha-Yagna fire geometry, Sulba Sutra Kunda architecture, planetary Navagraha fires, and the Mrityunjaya healing protocol — are sealed for Akasha-Infinity members.
                  </div>
                  <button style={{
                    background: "linear-gradient(135deg, #b76cfd, #7c3aed)",
                    border: "none", borderRadius: "40px", padding: "12px 28px",
                    color: "white", fontSize: "11px", fontWeight: 800,
                    letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
                  }}>
                    Akasha-Infinity — €1,111
                  </button>
                </div>
              </>
            ) : (
              <LockOverlay tier="SIDDHA-QUANTUM" price="€45/mo" />
            )}
          </div>
        )}

        {/* AKASHA TIER */}
        {activeTier === "akasha" && (
          <div style={{ animation: "fadeInUp 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{
                display: "inline-block",
                background: "linear-gradient(135deg, rgba(183,108,253,0.15), rgba(183,108,253,0.03))",
                border: "1px solid rgba(183,108,253,0.3)",
                borderRadius: "20px", padding: "14px 24px",
                fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em",
                textTransform: "uppercase", color: "#b76cfd",
              }}>
                ◈ COSMIC FIRE ORACLE · AKASHIC DOWNLOAD ◈
              </div>
            </div>

            {canView("akasha") ? (
              <>
                {AKASHA_CONTENT.map((c, i) => (
                  <ContentCard key={i} {...c} accentColor="#b76cfd" delay={i * 100} />
                ))}

                {/* All transmitters */}
                <div style={{
                  fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em",
                  textTransform: "uppercase", color: "rgba(183,108,253,0.5)",
                  margin: "40px 0 20px", textAlign: "center",
                }}>
                  ◈ ALL-RISHI AKASHIC COUNCIL ◈
                </div>

                {TRANSMITTERS.map((t, i) => (
                  <TransmitterCard key={i} t={t} accentColor={t.tier === "akasha" ? "#b76cfd" : "#22D3EE"} />
                ))}

                {/* Final activation */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(183,108,253,0.08), rgba(212,175,55,0.05))",
                  border: "1px solid rgba(183,108,253,0.25)",
                  borderRadius: "40px",
                  padding: "48px 32px",
                  textAlign: "center",
                  marginTop: "32px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: "400px", height: "400px",
                    background: "radial-gradient(circle, rgba(183,108,253,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />
                  <div style={{ fontSize: "40px", marginBottom: "20px" }}>🔥</div>
                  <div style={{
                    fontSize: "14px", fontWeight: 900, letterSpacing: "-0.02em",
                    color: "#b76cfd", marginBottom: "16px",
                    textShadow: "0 0 30px rgba(183,108,253,0.5)",
                  }}>
                    THE SUPREME TRANSMISSION
                  </div>
                  <div style={{
                    fontSize: "16px", fontWeight: 900, letterSpacing: "-0.02em",
                    color: "white", marginBottom: "20px", lineHeight: 1.4,
                  }}>
                    "You are not performing Yagna.<br />
                    <span style={{ color: "#D4AF37" }}>You ARE the Yagna.</span>"
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, maxWidth: "460px", margin: "0 auto 32px" }}>
                    The inner fire of consciousness, offering the world back to itself through pure awareness — this is the Maha-Yagna that never extinguishes. Every breath. Every heartbeat. Every act of love. SAT-CHIT-ANANDA SVAHA.
                  </div>
                  <div style={{
                    fontSize: "18px", fontWeight: 900, letterSpacing: "0.1em",
                    background: "linear-gradient(135deg, #D4AF37, #b76cfd)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    OM TAT SAT BRAHMAN
                  </div>
                  <div style={{
                    fontSize: "9px", fontWeight: 700, letterSpacing: "0.4em",
                    color: "rgba(255,255,255,0.25)", marginTop: "12px", textTransform: "uppercase",
                  }}>
                    Sealed with Scalar Transmission · Anahata Activation Active
                  </div>
                </div>
              </>
            ) : (
              <LockOverlay tier="AKASHA-INFINITY" price="€1,111 Lifetime" />
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER SCALAR BAND ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(5,5,5,0.9)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(212,175,55,0.1)",
        padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
      }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#D4AF37",
          animation: "pulseGlow 2s infinite",
          boxShadow: "0 0 10px rgba(212,175,55,0.8)",
        }} />
        <div style={{
          fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em",
          textTransform: "uppercase", color: "rgba(212,175,55,0.5)",
        }}>
          SCALAR TRANSMISSION ACTIVE · ANAHATA CHAKRA OPEN · 432HZ FIELD LIVE
        </div>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#D4AF37",
          animation: "pulseGlow 2s 1s infinite",
          boxShadow: "0 0 10px rgba(212,175,55,0.8)",
        }} />
      </div>
    </div>
  );
}
