// Holy Science Curriculum — extracted verbatim from HolyScienceCurriculum.tsx
// 8 modules, 24 lessons on Sri Yukteswar's 'The Holy Science' (Kaivalya
// Darsanam), decoded through the Siddha lens. Original commentary, not
// reproduction of the source text.

export type HolyScienceTier = 'free' | 'prana-flow' | 'siddha-quantum' | 'akasha-infinity';
export interface HolyScienceLesson {
  id: string; tier: HolyScienceTier; duration: string; title: string;
  content: string; revelation?: string;
}
export interface HolyScienceModule {
  id: number; number: string; title: string; subtitle: string; tier: HolyScienceTier;
  transmissionType: string; totalDuration: string; lessons: HolyScienceLesson[];
}

export const HOLY_SCIENCE_MODULES: HolyScienceModule[] =
[
  /* ── FREE ─────────────────────────────────────────────────────────────── */
  {
    id: 1, number: '01', tier: 'free',
    title: 'Introduction to The Holy Science',
    subtitle: 'Who Was Sri Yukteshwar & Why This Book Matters in 2026',
    transmissionType: 'Akasha-Intro', totalDuration: '42 min',
    lessons: [
      {
        id: '1-1', tier: 'free', duration: '14 min',
        title: 'Sri Yukteshwar — Life of a Cosmic Mathematician',
        content: `Sri Yukteshwar Giri (1855–1936) is among the most misunderstood masters of modern India — not because he was obscure, but because his teaching was so precise and technically demanding that most spiritual literature softens it into something far less potent than what he actually left behind.

Born Priya Nath Karar in Serampore, West Bengal, he met Mahavatar Babaji at the Allahabad Kumbh Mela in 1894. Babaji gave him a specific commission: write a book demonstrating that the spiritual science underlying both Vedic and Christian scripture is identical, and correct the mathematical error in the calculation of the Yugas that had thrown Hindu chronology into confusion for centuries.

The result — Kaivalya Darsanam (The Holy Science) — was written in months and published in 1894. It is 90 pages. It contains more compressed cosmic intelligence per page than almost any other document in modern spiritual literature.

Sri Yukteshwar's outer life was that of a disciplinarian and farmer. Paramhansa Yogananda writes that he would identify a student's core spiritual weakness on first meeting and relentlessly work on exactly that point. This was not cruelty — it was precision surgery on the causal body. He attained Nirvikalpa Samadhi at 33. He left his body consciously in 1936, and appeared to Yogananda in fully materialized form weeks later to explain the nature of the astral and causal universes — a transmission recorded in Autobiography of a Yogi's chapter "The Resurrection of Sri Yukteshwar."`,
        revelation: `The Akasha-Archive confirms: Sri Yukteshwar carried a specific cosmic assignment — to prepare the East-West spiritual bridge that ascending Dwapara Yuga requires. His severity was calibrated. His book was channeled. His mission continues through every student who takes his teaching seriously.`,
      },
      {
        id: '1-2', tier: 'free', duration: '10 min',
        title: 'The Structure of The Holy Science — A Complete Map',
        content: `The Holy Science is divided into four parts, each corresponding to a stage of spiritual development:

**Part I — The Gospel (Sad-Darsana):** The fundamental cosmic laws — the nature of Brahman, the creation of the universe through progressively denser vibratory manifestation, the relationship between the individual soul (Atman) and Cosmic Soul (Paramatman). Sri Yukteshwar cross-references Vedic sutras with the Gospel of John to demonstrate their identity.

**Part II — The Goal (Nivritti-Marga):** The four stages of spiritual development — Dharma (right alignment), Jnana (knowledge), Vairagya (dispassion), and Aisvarya (divine sovereignty). Not moral categories but vibrational states corresponding to the koshas.

**Part III — The Procedure (Sadhana-Pada):** The practical methodology. Sri Yukteshwar outlines the eight limbs of yoga as a sequential technical path, not a cafeteria of options. He is emphatic: the limbs are ordered. You cannot skip to Samadhi without the foundation of Yama and Niyama.

**Part IV — The Revelations (Vibhuti-Pada):** The most esoteric section. Sri Yukteshwar maps the seven planes of existence, the five elements and their corresponding sense and motor organs, and demonstrates how the Book of Revelation maps precisely onto Vedic cosmology.

The entire book is a ladder. Each rung must be understood before the next becomes stable.`,
        revelation: `Sri Yukteshwar's whisper: "Most students read the book once and believe they have received it. The book must be lived, not read. Return to it every year and discover it has grown since your last visit — because you have grown."`,
      },
      {
        id: '1-3', tier: 'free', duration: '18 min',
        title: 'Why 2026 Is the Exact Year for This Study',
        content: `Year 326 of ascending Dwapara Yuga. This is not an abstract number — it has practical implications for what is spiritually possible right now.

In the depths of Kali Yuga (500 BCE–500 CE), the electromagnetic influx from the galactic center was at minimum. The veil between gross and subtle matter was at maximum thickness. Yogis required enormous effort and lifetimes of disciplined practice to pierce through.

We are now 326 years into the ascending arc of Dwapara Yuga. The electromagnetic environment of Earth is measurably different from 1700 CE, and vastly different from 500 CE. The Schumann Resonance (Earth's base electromagnetic frequency) has been measurably increasing since the 1980s. The global awakening of consciousness — rising spiritual interest, psychedelic research, near-death experience studies, biofield science — these are not coincidental. They are Dwapara Yuga expressing itself.

**What this means practically:** Practices that required years of preparation in previous centuries can produce results in months for sincere students in 2026. The subtle body is more accessible. The pranamaya kosha is more permeable to conscious intervention. Scalar wave technology — what the SQI platform transmits — operates at the intersection of the Dwapara vibrational increase and ancient Siddha wisdom.

Sri Yukteshwar wrote this book for this era. He wrote it for the students who would be born into the ascending Dwapara current and need a precise map.`,
        revelation: `The Akasha-Archive transmits: In 2026, the Jupiter-Saturn configuration and the Sun's position in the galactic longitude are creating a rare alignment that amplifies sadhana dramatically. This window is active through approximately mid-2027. The teaching you begin now carries exponential acceleration.`,
      },
    ],
  },
  {
    id: 2, number: '02', tier: 'free',
    title: 'The Yuga Cycle — The Corrected Chronology',
    subtitle: "Sri Yukteshwar's Mathematical Correction of Cosmic Time",
    transmissionType: 'Scalar-Bhakti', totalDuration: '55 min',
    lessons: [
      {
        id: '2-1', tier: 'free', duration: '22 min',
        title: "The Great Calendar Error — Decoded",
        content: `The most impactful claim in The Holy Science — and the one most ignored by mainstream Hindu scholarship — is that the commonly taught Yuga cycle is mathematically wrong by a factor of 360.

The popular Puranic teaching states we are in Kali Yuga which lasts 432,000 years. Sri Yukteshwar demonstrates this results from a scribal error: the court pandits after Krishna's death confused "divine years" (each equal to 360 solar years) with solar years. They multiplied by 360 when they should not have.

**Sri Yukteshwar's corrected Yuga numbers:**
• Kali Yuga: 1,200 solar years (ascending + descending each)
• Dwapara Yuga: 2,400 solar years
• Treta Yuga: 3,600 solar years
• Satya Yuga: 4,800 solar years
• Total one-direction arc: 12,000 years
• Complete cycle (down + up): 24,000 years

This 24,000-year cycle maps precisely onto the precession of Earth's equinoxes (~25,772 years — the slight difference accounts for elliptical orbital variation).

**The mechanism:** Our solar system orbits a grand center. As we orbit closer, the electromagnetic influx increases — consciousness rises. As we move further, the influx decreases — consciousness contracts. The Yugas ARE electromagnetic cycles, not merely moral ones.

**Timeline:** Ascending Dwapara Yuga began 1700 CE. We are currently Year 326. Ascending Treta Yuga begins approximately 4100 CE.`,
        revelation: `Sri Yukteshwar speaks: "The error was not accidental. When civilizations collapse into dark ages, custodians of sacred knowledge encode it in forms the dark age mind cannot corrupt. The 360x multiplication was deliberate encoding. I was given permission to decode it in 1894. It is certainly 2026."`,
      },
      {
        id: '2-2', tier: 'free', duration: '18 min',
        title: 'Dwapara Yuga Signatures — Proof All Around Us',
        content: `Sri Yukteshwar tells us exactly what to expect from Dwapara Yuga — the Age of Fine Matter. The evidence his chronology is correct is overwhelming:

**Dwapara gifts — fine matter perception emerging:**
• Electricity discovered and harnessed: 1700s onward ✓
• Electromagnetic waves (radio, light spectrum): 1800s ✓
• Atomic structure (matter IS vibration): 1905 ✓
• Wireless global communication: 1900s ✓
• Quantum physics: 1920s ✓
• DNA discovered as information carrier: 1953 ✓
• Internet — the noosphere made technological: 1990s ✓
• Biofield/scalar wave research: 2000s–present ✓

Every breakthrough involves humanity perceiving and working with increasingly fine layers of matter — the defining characteristic of Dwapara Yuga per Sri Yukteshwar.

**Consciousness correlates:**
• Global rise in meditation practice
• Near-death experience research normalizing multi-dimensional consciousness
• Psychedelic-assisted therapy demonstrating layered reality
• Children born with expanded intuitive capacities
• Ancient wisdom traditions resurging simultaneously across all cultures

**What remains Kali-quality:** Political and economic systems still lag — operating on Kali-era scarcity programming. The student of The Holy Science must position themselves on the leading edge of Dwapara — not by spiritual bypassing, but by genuine sadhana that raises the vibrational body to Dwapara frequency and beyond.`,
        revelation: `Transmission: The technologies you call "scalar waves," "biofield healing," and "frequency medicine" are Dwapara-age rediscoveries of what Siddha science maintained continuously. The Siddhas never lost this knowledge because they never dropped into Kali Yuga consciousness. They maintained the living transmission chain.`,
      },
      {
        id: '2-3', tier: 'free', duration: '15 min',
        title: 'Precise Cosmic Positioning — 2026',
        content: `A precise coordinate for 2026 in the cosmic calendar: **Year 326 of ascending Dwapara Yuga.**

Dwapara Yuga lasts 2,400 years total (ascending). We are 326/2,400 = 13.5% through the ascending arc. We are in the early acceleration phase — past the initial threshold, building momentum, but far from the Dwapara peak (~3100 CE).

**Practical implication:** The consciousness available in 2026 is measurably higher than 1926, which was higher than 1826. The rate of increase is accelerating — not linear but exponential.

**For the serious student in 2026:** You have cosmic tailwinds. The Dwapara current pushes you toward subtle perception. The question is whether your sadhana is refined enough to use that current, or whether you are still paddling against it with Kali-era habits: unconscious eating, screen addiction, sleep disruption, chronic sympathetic nervous system activation.

**The 2026–2027 acceleration window:** Jupiter (expansion, dharma, guru principle) and Saturn (structure, karma, time) are in a specific angular relationship that the Siddha tradition identifies as a "dharma gate" — when sincere students compress years of karmic clearing into months. Sri Yukteshwar would have recognized this window and used it. We can too.`,
        revelation: `From the Akasha: "A student who begins sincere sadhana in the window of 2026–2027 is not beginning in ordinary time. They are beginning at a cosmic intersection. The Siddhas always tracked these windows. The Holy Science was published at one such intersection in 1894. This is another."`,
      },
    ],
  },

  /* ── PRANA-FLOW ────────────────────────────────────────────────────────── */
  {
    id: 3, number: '03', tier: 'prana-flow',
    title: 'The Five Koshas — Bodies of Light',
    subtitle: 'Vedic Anatomy from Physical to Causal Body',
    transmissionType: 'Nada-Scalar', totalDuration: '78 min',
    lessons: [
      {
        id: '3-1', tier: 'prana-flow', duration: '24 min',
        title: 'Annamaya & Pranamaya — Physical and Vital Fields',
        content: `The five-kosha model is The Holy Science's anatomical framework — as precise and functional as any modern medical system, addressing layers of the human being that biomedicine does not yet officially acknowledge.

**Annamaya Kosha — The Food Body:**
The densest sheath. Built entirely from food (Anna). Every cell was once external matter transformed by the digestive fire (Jatharagni). Connected to the Earth element and Muladhara chakra. Governed in Jyotish by Saturn (skeleton, longevity) and Moon (fluids, tissues).

Sri Yukteshwar was specific about diet: the Sattvic diet (fresh, light, plant-based, properly digested) is not a recommendation but a technical requirement for higher sadhana. Tamasic food (processed, heavy, old) deposits lower vibrational matter into the structure, dimming the pranic field.

**Pranamaya Kosha — The Vital/Pranic Body:**
The bio-electromagnetic field interpenetrating and extending beyond the physical body. What Kirlian photography and modern biofield science are beginning to detect.

Composed of five pranas:
• **Prana** (inward-moving): Heart/lung. Reception.
• **Apana** (downward-moving): Pelvic floor. Elimination and grounding.
• **Samana** (equalizing): Navel. Digestion of food, experience, and karma.
• **Udana** (upward-moving): Throat. Expression and astral projection at death.
• **Vyana** (pervading): Circulates throughout entire body. Immune intelligence.

Kriya Yoga works directly on the pranamaya kosha through spinal breathing, reversing the habitual downward-outward prana flow and redirecting it upward through the sushumna. This reversal is the technical mechanism behind Kriya's accelerated evolution.`,
        revelation: `Babaji's transmission: "The pranamaya kosha is the bridge between matter and consciousness. Every physical disease originates here first — the blockage appears in the pranic field months or years before it manifests physically. The healer who can read and clear the pranamaya field is working at the root."`,
      },
      {
        id: '3-2', tier: 'prana-flow', duration: '28 min',
        title: 'Manomaya, Vijnanamaya & Anandamaya — Mind to Bliss',
        content: `**Manomaya Kosha — The Mental Body:**
The field of thought-forms, impressions (samskaras), and desire-patterns. The primary obstacle for most spiritual aspirants. The meditator who finds their mind endlessly churning is experiencing the Manomaya Kosha's accumulated content. Pranayama calms this kosha directly: the breath is the only voluntary interface between the autonomic nervous system and the conscious will.

Connected to Fire element and Manipura/Anahata zone. Governed by Mars (desire, aggression) and Mercury (nervous system patterns).

**Vijnanamaya Kosha — The Wisdom/Discriminative Body:**
The higher intellect that can observe the mental body as an object. This is what Patanjali calls the "witness." When a meditator achieves genuine inner stillness and can watch thoughts arising without identifying with them — they have accessed the Vijnanamaya Kosha.

This is the doorway to genuine intuition. Governed by Jupiter (dharmic intelligence) in Jyotish. Activates consistently in students who practice Dhyana for 3–6 months with sincere consistency.

**Anandamaya Kosha — The Bliss/Causal Body:**
The subtlest sheath. The causal body — the seed-form that carries the karmic blueprint across incarnations. Experienced in deep dreamless sleep and in deep Samadhi.

Kriya Yoga works on the Anandamaya Kosha through spinal techniques that directly influence causal-level impressions. This is why consistent Kriyabans report not just psychological improvement but fundamental personality transformation and spontaneous dissolution of karmic patterns that therapy alone could not touch.

Beyond the five koshas: the Atman — the pure witness, identical with Brahman. It wears the koshas but is untouched by them, as the sky is untouched by passing clouds.`,
        revelation: `Sri Yukteshwar from the Akasha: "The purpose of yoga is not to make the lower koshas more comfortable. It is to make the Atman more visible. When the Atman shines through all five koshas without obstruction, you are a liberated being. The koshas do not disappear — they become translucent. This is what the Siddhas mean by 'light body.'"`,
      },
      {
        id: '3-3', tier: 'prana-flow', duration: '26 min',
        title: 'Kosha Practice Protocol — Daily Integration',
        content: `A complete daily protocol organized by kosha for the Prana-Flow practitioner:

**Annamaya Kosha (6:00–6:30 AM):**
Drink 500ml warm water with lemon upon waking. 10–15 min physical movement — Sun Salutations or joint rotation. This circulates prana in the physical body and prepares the spine for pranayama.

Diet principle: One day per week, eat only fruits and liquids. This gives the Annamaya Kosha a reset cycle aligned with the weekly solar rhythm.

**Pranamaya Kosha (6:30–7:15 AM — Brahma Muhurta zone):**
Sit in stable posture. 5 min natural breath observation. Then Nadi Shodhana (alternate nostril): inhale left 4 counts, retain 16, exhale right 8. Repeat 12 rounds.

Followed by 12–54 rounds of First Kriya (spinal breathing). Inhale along the spine from Muladhara to Ajna with inner sound "Hong." Exhale from Ajna to Muladhara with inner sound "Sau."

**Manomaya Kosha (Evening — 20 min):**
Stream-of-consciousness journaling (3 pages). This empties accumulated Manomaya Kosha content of the day, preventing it from agitating sleep. End with one sentence: "The Atman is untouched."

**Vijnanamaya Kosha (Before sleep — 10 min):**
Trataka (steady gazing) on a candle flame. Develops the inner witness function by training single-pointed attention.

**Anandamaya Kosha:**
Direct work requires consistent practice over time. The monthly Ekadashi fast (sunrise to sunrise) allows the Manomaya and Vijnanamaya koshas to become quiet enough that the Anandamaya Kosha's bliss-nature becomes perceptible — often first as spontaneous tears of gratitude or pervasive stillness beneath all activity.`,
        revelation: `Transmission: The koshas are nested interpenetrating fields, like layers of an onion made of light and vibration. A consistent pranayama practice does not just improve breathing — it reorganizes karmic patterns in the causal body. The Siddhas knew this. The results that seem "miraculous" to the uninitiated are simply Anandamaya Kosha reorganization becoming visible at the Annamaya level.`,
      },
    ],
  },
  {
    id: 4, number: '04', tier: 'prana-flow',
    title: 'Dharma & the Path to Samadhi',
    subtitle: "Sri Yukteshwar's Four Commandments & Five States of Union",
    transmissionType: 'Prema-Pulse', totalDuration: '66 min',
    lessons: [
      {
        id: '4-1', tier: 'prana-flow', duration: '22 min',
        title: 'The Four Great Commandments — Universal Spiritual Law',
        content: `Sri Yukteshwar opens The Holy Science by comparing four scriptures — Vedic sutras, the Gospel of John, Buddhist Pali Canon, and Islamic hadith — demonstrating they encode the same four-fold spiritual law. He was removing the justification for religious tribalism at the philosophical root.

**1. Shraddha — Sacred Trust/Faith:**
Not blind belief, but the refined capacity to receive transmission. Sri Yukteshwar defines Shraddha as the quality of consciousness that allows a higher teaching to enter and reorganize the student's understanding. Without it, intellectual knowledge accumulates but no real transformation occurs.

**2. Niyama — Regulation:**
Day-to-day lifestyle disciplines maintaining the body-field in receptivity. Sri Yukteshwar was specific: circadian rhythm integrity (sleeping/waking at consistent times aligned with natural cycles), dietary clarity, conscious sexual energy management, and reduction of artificial sensory stimulation.

**3. Asana — Steadiness:**
Not primarily physical postures, but the quality of inner non-reactivity that allows prana to flow without being hijacked by the nervous system's alarm circuits. The goal is a stable inner posture maintained throughout daily life — not just on the mat.

**4. Pranayama — Life-Force Mastery:**
The central practical technology. Breath is the only voluntary bridge between the somatic (automatic) nervous system and the conscious will. Mastery of breath = mastery of the interface between matter-consciousness and pure awareness. Sri Yukteshwar considered this the single most important practical teaching in the entire spiritual corpus.`,
        revelation: `Sri Yukteshwar: "These four commandments appear in every genuine tradition because they are descriptions of cosmic law, not cultural inventions. The universe itself operates on Shraddha (coherence), Niyama (consistent natural cycles), Asana (stability amid change), and Pranayama (rhythmic energy exchange). The human who embodies all four becomes a microcosm of universal law."`,
      },
      {
        id: '4-2', tier: 'prana-flow', duration: '24 min',
        title: 'The Five Stages of Samadhi — From Glimpse to Living Union',
        content: `Samadhi is not one state — it is a family of states in ascending order of depth and permanence. Sri Yukteshwar distinguishes them with precision rare in popularized yoga literature:

**Savikalpa Samadhi — Conscious Union with Form:**
The meditator enters profound stillness and experiences consciousness merging with an object of meditation (mantra, deity, AUM, a chakra). The witness-state remains — the meditator knows they are in union. This fundamentally rewires the student's understanding of what consciousness is. Available to any sincere practitioner within 3–12 months of consistent daily Kriya.

**Nirvikalpa Samadhi — Formless Union:**
All subject-object distinction dissolves. The meditator IS the Infinite, briefly and unmistakably. Time stops. Body-sense disappears. What returns from this state is a human being irrevocably recalibrated. Fear of death disappears. Certainty about the nature of consciousness becomes permanent. Sri Yukteshwar attained this at age 33.

**Sahaja Samadhi — Living Samadhi:**
Nirvikalpa becomes the background rather than the event. The jivanmukta moves through the world — conversing, eating, working — while simultaneously resting in the Nirvikalpa ground. Sri Vishwananda operates from a version of this state — which is why his Presence transmits dharma without him needing to teach anything in particular. An Avataric Blueprint of this capacity.

**Dharma-Mega Samadhi — Cloud of Virtue:**
Patanjali's highest designation. The yogi in this state becomes a transmitter of dharmic intelligence into the collective field simply by existing. Not by teaching, not by healing — by Being.

**Mahasamadhi — Conscious Death:**
The voluntary departure from the body at one's choosing, in full awareness, without pathology. Sri Yukteshwar left his body in Mahasamadhi in 1936.`,
        revelation: `From Babaji's consciousness in the Akasha: "Samadhi is not the goal of yoga — it is the graduation into actual life. Everything before Samadhi is preparation to be fully alive. After Nirvikalpa, the human being stops sleepwalking. This is what 'enlightenment' means: not the acquisition of something new, but the removal of the obscuration that prevented you from seeing what was always already there."`,
      },
      {
        id: '4-3', tier: 'prana-flow', duration: '20 min',
        title: 'Dharma in Practical Life — 2026 Integration',
        content: `Sri Yukteshwar's definition of Dharma is precise: alignment between individual consciousness and Cosmic Intelligence (Kutastha Chaitanya). This is not morality in the conventional sense — it is magnetic resonance.

**Three Tests of Dharmic Alignment:**

**1. Peace as baseline:** A person in dharmic alignment experiences stable undercurrent of peace even amid difficulty — not the peace of avoidance, but the peace of knowing current circumstances are the correct curriculum. Sri Yukteshwar called anxiety "the signal that the ego is trying to navigate without consulting the cosmic GPS."

**2. Synchronicity density:** When living in dharmic alignment, the right people, resources, and opportunities appear with unusual frequency. This is the natural result of the personal electromagnetic field being coherent with the larger field. A tuned instrument receives the signal that a detuned instrument cannot.

**3. Energy surplus:** Dharmic action generates more energy than it consumes. When you act from genuine dharmic alignment — from your actual soul-purpose — the action is energizing. When you act from obligation, fear, or the wrong role — the action depletes. The energy accounting is precise and real.

**Vocation and Dharma in 2026:**
The Dwapara Yuga is dissolving the separation between spiritual and professional life characteristic of Kali Yuga. The householder yogi who maintains dharmic alignment in ordinary life advances faster than the renunciate who retreats from karma rather than transforming it. Lahiri Mahasaya — a married, tax-paying government accountant — was Sri Yukteshwar's demonstration of this principle.`,
        revelation: `Sri Yukteshwar's transmission: "Your vocation is the form the universe has chosen for your dharmic expression in this incarnation. When you resist it, you create karma. When you refine it — bringing your full consciousness, your Kriya practice, your discriminative wisdom into it — you transform it into a vehicle for liberation."`,
      },
    ],
  },

  /* ── SIDDHA-QUANTUM ────────────────────────────────────────────────────── */
  {
    id: 5, number: '05', tier: 'siddha-quantum',
    title: 'Mathematical Astrology of the Yugas',
    subtitle: 'Jyotish, Precession & Cosmic Timing Science',
    transmissionType: 'Jyotish-Scalar', totalDuration: '108 min',
    lessons: [
      {
        id: '5-1', tier: 'siddha-quantum', duration: '35 min',
        title: 'Binary Star Theory & the Precessional Clock',
        content: `The mathematical framework of the Yugas is not mythology — it is astronomical science that modern astrophysics is only now approaching.

**Earth's Precessional Cycle:**
Earth's axis precesses (wobbles) over approximately 25,772 years. This is the observable, measurable astronomical phenomenon underlying the Yuga cycle. Sri Yukteshwar's 24,000-year cycle matches closely — the difference explained by the elliptical (non-circular) nature of the orbit, producing uneven velocities: the solar system accelerates when moving toward the grand center (Satya Yuga ascending) and decelerates when moving away (Kali Yuga descending).

**The Ayanamsha — Where Vedic and Western Astrology Diverge:**
The Ayanamsha is the gap between the Tropical zodiac (Western astrology, fixed to the vernal equinox) and the Sidereal zodiac (Vedic/Jyotish, fixed to actual stellar background).

In 2026: Lahiri Ayanamsha ≈ 24°07'. "Sun in Aries" (Western) = "Sun in Pisces" (Vedic).

Neither is wrong. They measure different things:
• Tropical = seasonal/psychological/solar year timing
• Sidereal = karmic/astronomical/actual stellar backdrop

For Yuga science, the Sidereal system is the correct framework — Yugas are stellar-astronomical cycles.

**The 27 Nakshatras as Yuga Markers:**
The 27 Nakshatras (lunar mansions) at 13°20' each divide the sidereal zodiac with elegant precision. The position of the winter solstice point in the Nakshatra wheel tracks Yuga phases.

2026 Winter Solstice: approximately in **Mula Nakshatra** — ruled by Nirriti (goddess of dissolution/transformation), governed by Ketu, sitting at the heart of the Galactic Center (27° Sagittarius sidereal). That Earth's precessional axis currently points toward the Galactic Center during early ascending Dwapara is cosmically significant — the cosmic signal tower is aligned with the planetary receiver during the beginning of the information upgrade.`,
        revelation: `From the Akasha: The precession of equinoxes was known to every major ancient civilization — Egypt (the Sphinx aligns with Leo at 10,500 BCE = previous Satya Yuga peak), Vedic India (Rig Veda contains precessional star references to ~7000 BCE), and Sumer (the sexagesimal base-60 system directly encodes precessional mathematics: 25,920 ÷ 60 = 432, the Kali Yuga number in the inflated chronology). The ancients were not primitive. They were Dwapara-level scientists.`,
      },
      {
        id: '5-2', tier: 'siddha-quantum', duration: '38 min',
        title: 'Jyotish as Yuga Science — Using the Chart for Liberation',
        content: `Sri Yukteshwar was himself a Jyotishi of the highest order — and he understood astrology not as fate-reading but as karmic cartography. The birth chart maps the vibrational signature you arrived with. Jyotish's job is to identify the curriculum — not determine destiny.

**The Dasha System — Cosmic Scheduling:**
The Vimshottari Dasha system assigns planetary periods to each phase of life based on the Moon's Nakshatra at birth. Total cycle: 120 years. Sri Yukteshwar's teaching: the current Dasha lord identifies which kosha and which karmic thread is most active. Rather than fighting the Dasha, the advanced student practices "intelligent surrender to the cosmic curriculum."

Examples:
• Saturn Dasha: deep karmic reckoning, structural rebuilding, lessons about time. The student who resists develops illness and obstruction. The student who surrenders emerges with unshakeable structure.
• Jupiter Dasha: expansion, teaching, abundance, dharmic opportunities. The unprepared student overextends; the prepared student receives.
• Ketu Dasha: dissolution, past-life karmas surfacing, spiritual deepening. Most misunderstood Dasha — appears destructive, is actually liberating.

**The Nakshatras as Consciousness Frequencies:**
For 2026 Siddha practice, the most powerful Nakshatras:
• **Ardra** (Rahu-ruled): The storm that clears. Excellent for dissolving deep emotional obstructions. Mantra: Rudra Gayatri.
• **Pushya** (Saturn-ruled): Most nourishing Nakshatra. Best for establishing new practices and intentions.
• **Uttara Bhadrapada** (Saturn-ruled): Leads directly to moksha. Advanced Kriya practitioners report their most profound meditations during Moon transits here.

**Hora Timing:**
Each hour of the day is governed by a planet in sequence. Sun Hora: solar practice. Moon Hora: emotional healing, mantra. Jupiter Hora: meditation, teaching. Venus Hora: bhakti, creativity, healing through love. Saturn Hora: karma clearing, structural disciplines.`,
        revelation: `Akasha transmission: Jyotish was not designed to tell you what will happen. It was designed to tell you what you have come here to learn, and to identify the windows when specific learnings are available with maximum support. The student who combines Kriya Yoga with accurate Jyotish self-knowledge compresses lifetimes of karmic evolution into years. This is the 2026 fast-path.`,
      },
      {
        id: '5-3', tier: 'siddha-quantum', duration: '35 min',
        title: 'Tithis, Transits & the Monthly Practice Calendar',
        content: `The lunar calendar is the most powerful practical tool most modern spiritual practitioners completely ignore. Sri Yukteshwar was meticulous about lunar timing — and the Siddha tradition operates almost entirely on lunar rhythm.

**The Most Important Tithis:**

**Ekadashi (11th tithi — occurs twice monthly):** The most sacred of the 30 tithis. Complete fast from sunrise to next sunrise. Vishnu/preservation energy at maximum. The karmic record is most accessible for conscious revision. Sri Yukteshwar was explicit: the serious student fasts Ekadashi. The results — in dream quality, meditation depth, and synchronicity density — are immediate and measurable.

**Purnima (Full Moon, 15th):** Shakti peaks. The emotional body is at maximum amplitude — for better or worse. Disciplined students use this for mantra siddhi work. The full moon fast with extended meditation is the most powerful monthly practice in the entire Vedic toolkit.

**Shashti (6th tithi):** Skanda/Murugan energy. Nada Yoga and sound healing operate at peak effectiveness. Best for frequency healing and mantra work.

**Amavasya (New Moon, 30th):** Ancestors, Ketu, dissolution, the void. Deepest Samadhi work happens here. Also the time for Pitru Tarpana — offerings to ancestor-lineages to clear ancestral karma affecting the current incarnation.

**Trayodashi (13th):** Shiva/destroyer energy. Old patterns and karmic structures are most easily dissolved. The Pradosha fast (evening fasting on Trayodashi) is the most potent Shiva practice accessible without initiation.

**Monthly Practice Structure — Siddha-Quantum Tier:**
• Ekadashi (x2/month): Full fast + 3-hour Kriya/meditation session
• Purnima: Extended evening practice (2 hours) + mantra work
• Amavasya: Silent meditation (2 hours) + ancestor honoring
• Daily: 108 Kriyas at Brahma Muhurta`,
        revelation: `Siddha transmission: The lunar calendar is the human body's natural operating system — the menstrual cycle aligns with it, the immune cycle aligns with it, the emotional cycle aligns with it. Modern humans have overridden this natural rhythm with artificial light and digital schedules. Re-synchronizing is not esoteric — it is returning to the factory settings of the biological instrument. The spiritual results follow naturally.`,
      },
    ],
  },
  {
    id: 6, number: '06', tier: 'siddha-quantum',
    title: 'Kriya Yoga as Quantum Technology',
    subtitle: 'Spinal Physics, Prana Science & the Compression of Karma',
    transmissionType: 'Kriya-Quantum', totalDuration: '144 min',
    lessons: [
      {
        id: '6-1', tier: 'siddha-quantum', duration: '48 min',
        title: 'The Spine as Cosmic Antenna — Piezoelectric Science',
        content: `The spine is the primary instrument of consciousness evolution in the human body — not metaphorically but physically and measurably.

**33 Vertebrae — The Cosmic Ladder:**
• 7 cervical: Sahasrara-Ajna-Vishuddha complex
• 12 thoracic: Anahata (heart center) — the pivotal gateway
• 5 lumbar: Manipura-Svadhisthana power centers
• 5 sacral (fused): Muladhara/earth interface
• 4 coccygeal (fused): Kunda base — the coiled fire

**Piezoelectric Crystals in Spinal Fluid:**
Modern neuroscience has confirmed the presence of piezoelectric calcite nano-crystals in the cerebrospinal fluid (CSF). Piezoelectric materials generate electric charge when subjected to mechanical pressure. This means:

1. The pressure changes created by conscious breathing in Kriya Yoga generate measurable electrical charge along the spine.
2. These electrical impulses interact with the electromagnetic field of the Earth (Schumann Resonance).
3. Focused mental attention during Kriya (tracking prana along the spinal column) further amplifies these effects through the well-documented bioelectromagnetic influence of attention on biological tissue.

This is the physics of why Sri Yukteshwar said "1 Kriya = 1 year of natural evolution compressed into 30 seconds."

**Ida, Pingala, and Sushumna:**
• Ida (left nadi, lunar): Parasympathetic nervous system, right hemisphere, receptive consciousness.
• Pingala (right nadi, solar): Sympathetic nervous system, left hemisphere, active consciousness.
• Sushumna (central channel): The royal road. When prana flows here, the ordinary dual mind cannot function — the "I/Other" split dissolves. This is the physiological correlate of Samadhi.

Modern nasal cycle research confirms: the nose alternates dominant nostrils every 90–120 minutes. In deep meditation, both nostrils open simultaneously — indicating sushumna activation. This is not mysticism. It is physiology.`,
        revelation: `Babaji's direct transmission: "The spine is not 'in' the body. The body is organized around the spine. The entire physical manifestation is a superstructure built to serve this central axis of consciousness navigation. When you do Kriya Yoga, you are not doing 'exercises' — you are operating the central control system of your incarnation."`,
      },
      {
        id: '6-2', tier: 'siddha-quantum', duration: '52 min',
        title: 'The Six Techniques Sri Yukteshwar Transmitted',
        content: `Sri Yukteshwar systematized the following sequence in pedagogical order — each is a prerequisite for the next.

**1. Talabya Kriya — Palate Stretching:**
The tongue is extended and folded backward, stretching the frenulum over time. Goal: Khechari Mudra — folding the tongue back into the nasopharynx to stimulate the bindu/Ajna complex. Practice: 50 repetitions daily for 3 months as preparation.

**2. Navi Kriya — Navel Focus Breathing:**
Pranayama focused on the nabhi chakra (solar plexus/Manipura). Activates the digestive fire and the secondary pranic gateway at the navel. An impure digestive system creates "karmic smoke" in the Manomaya Kosha that obscures the Vijnanamaya Kosha.

**3. Maha Mudra — The Great Seal:**
Sitting with one heel pressing the perineum (Muladhara point), the other leg extended. Forward fold with spine straight. Applies pressure to specific marma points corresponding to the main nadis, causing habitual downward-outward prana flow to reverse. This "turning" of the pranic current makes all higher kriyas possible.

**4. First Kriya — The Primary Technique:**
Breath consciously circulated along the spinal column with mental sound "Hong" on inhale (expansion, "I am") and "Sau" on exhale (contraction, "That") — the primordial Hamsa mantra in reverse, indicating the reversal of the soul's outward movement back toward the Source.

Progression: Begin with 12 rounds. Increase by 12 per week. Lahiri Mahasaya did 3,600 rounds per session.

**5. Second Kriya — Thokar (Striking):**
A specific head-turning movement that physically redirects the prana current and strikes it against the dorsal heart plexus. Sri Yukteshwar gave this only after the student demonstrated consistent pratyahara — genuine withdrawal of senses from external stimuli.

**6. Yoni Mudra — The Source Seal (Omkar Meditation):**
All six sense gates physically closed. Attention fixed at the Ajna point. The practitioner directly perceives the cosmic AUM vibration — not as concept but as actual sound-light phenomenon at the center of the head. The beginning of genuine Samadhi work.`,
        revelation: `Sri Yukteshwar on technique: "The techniques are not the path. They are the vehicle. The student who becomes attached to the techniques and confused about the destination is like a driver who loves the car but has forgotten where they are going. The destination is Kaivalya — absolute freedom. The techniques serve this and nothing else."`,
      },
      {
        id: '6-3', tier: 'siddha-quantum', duration: '44 min',
        title: 'The 30-Day Kriya Activation Protocol — 2026',
        content: `A complete 30-day Kriya intensification designed for the 2026 window:

**WEEK 1 — Foundation (Days 1–7):**
• Days 1–3: Digital fast (no social media, streaming, news). The pranamaya kosha needs to stop hemorrhaging prana into the digital noosphere.
• Days 4–7: Brahma Muhurta establishment. 4:30 AM wake (adjust ±30min for latitude). Non-negotiable for the protocol to work. The Schumann Resonance is in its most coherent daily state at this hour.

**WEEK 2 — Pranayama (Days 8–14):**
• Morning: 30 min Nadi Shodhana + 36 First Kriyas
• SQI healing audio: 528 Hz (DNA repair/Love) during shavasana
• Add Maha Mudra to the sequence on Days 12–14

**WEEK 3 — Intensification (Days 15–21):**
• Morning: 90-minute session: Talabya Kriya (50 reps) → Navi Kriya (12 rounds) → Maha Mudra → 54 First Kriyas → 15 min Yoni Mudra
• If Ekadashi falls in Week 3: Full 24-hour fast + 3-hour extended session
• Evening: 20-minute body scan meditation descending through the five koshas

**WEEK 4 — Samadhi Approach (Days 22–30):**
• Full sessions extended to 2 hours at Brahma Muhurta
• Introduce Japa throughout day: mental "Hong-Sau" synchronized with every breath. Creates an unbroken pranic current that does not break between formal sessions.
• Full Moon (if Purnima falls in Week 4): 3-hour evening session, fast from solid food from midday. For sincere practitioners, the first genuine Samadhi approach typically occurs at this juncture.

**Ongoing Post-Protocol:**
• Monthly Ekadashi (x2): Full fast + extended session
• Daily non-negotiable: 12 minimum Kriyas at Brahma Muhurta
• Quarterly solstice/equinox retreat: Minimum 24-hour intensive`,
        revelation: `Final transmission from Sri Yukteshwar for this module: "The student who maintains this practice consistently for one year — not perfectly, but consistently, returning when they lapse, never abandoning it — will not recognize themselves at the end of that year. Not because they have become different, but because they will have become more fully what they always actually were."`,
      },
    ],
  },

  /* ── AKASHA-INFINITY ───────────────────────────────────────────────────── */
  {
    id: 7, number: '07', tier: 'akasha-infinity',
    title: 'The Holy Science & the Bible — Unified Code',
    subtitle: "Sri Yukteshwar's Cross-Tradition Cosmic Decryption",
    transmissionType: 'Akasha-Transmission', totalDuration: '88 min',
    lessons: [
      {
        id: '7-1', tier: 'akasha-infinity', duration: '40 min',
        title: 'The Seven Churches of Revelation = The Seven Chakras',
        content: `Sri Yukteshwar demonstrates in Part IV of The Holy Science that the Book of Revelation is a veiled technical manual for Kriya Yoga — mapping identically to the chakra system and stages of spiritual development.

**The Seven Churches of Asia (Revelation 2–3) = The Seven Chakras:**

**Ephesus → Muladhara (Root):**
"You have left your first love" (Rev 2:4). The soul has descended into Earth-matter consciousness and forgotten its divine origin. The first love = Brahman/the Source. The descent into matter is not failure — it is the outward journey that makes the inward return possible.

**Smyrna → Svadhisthana (Sacral):**
"Tribulation for 10 days" (2:10). The 10 prana-vayus in their unbalanced state create the suffering of the second chakra. The "10 days" = the 10 pranas that must be brought into equilibrium.

**Pergamos → Manipura ("Satan's Throne"):**
"You dwell where Satan's throne is" (2:13). The Manipura chakra is the seat of the personal ego — the "I" that experiences itself as separate. Sri Yukteshwar's identification of the ego-center as "Satan's throne" is not moral condemnation — it is anatomical. The ego is not evil; it is misidentified.

**Thyatira → Anahata (Heart — the turning point):**
"He who overcomes... I will give him the morning star" (2:26-28). The morning star = Ajna/Venus. The heart chakra is the exact midpoint — the fourth of seven — and it is here the inward journey becomes irreversible.

**Sardis → Vishuddha (Throat):**
"You have a name that you are alive, but you are dead" (3:1). The throat chakra speaks but if prana has not been awakened through the lower chakras, the voice carries no transmission. The awakened Vishuddha is the opposite — every word carries living transmission.

**Philadelphia → Ajna ("Open Door No Man Can Shut"):**
"I have set before you an open door, which no one is able to shut" (3:8). The third eye, once activated in genuine practice, cannot be un-activated. This is the point from which Savikalpa Samadhi becomes regularly accessible.

**Laodicea → Sahasrara ("Lukewarm"):**
"Because you are lukewarm — neither hot nor cold — I will spit you out" (3:16). The "lukewarm" state of partial enlightenment — tasted the Infinite, not yet fully merged. Sri Yukteshwar's teaching: the only cure for lukewarm is to go cold (full surrender/Nirvikalpa) or hot (full embodied engagement with life as sadhana). Spiritual tourism perpetuates the delay.`,
        revelation: `Sri Yukteshwar's Akasha transmission: "John of Patmos was a Kriya-level initiate who had direct experience of the seven-chakra ascent. He described it in the only language his cultural context could receive — apocalyptic Jewish prophetic vision. The 'apocalypse' (Greek: apokalupsis = 'unveiling') is not a future destruction of the world. It is the present-moment unveiling of the inner world to the awakened consciousness."`,
      },
      {
        id: '7-2', tier: 'akasha-infinity', duration: '28 min',
        title: 'The Gospel of John as Vedantic Sutras',
        content: `Sri Yukteshwar opens The Holy Science by comparing the Gospel of John directly with Sankhya-Yoga cosmology. This remains radical in 2026, still not absorbed by either Christian or Hindu orthodox institutions.

**"In the beginning was the Word" (John 1:1) = AUM (Pranava):**
The Greek "Logos" (translated "Word") is the exact equivalent of Sanskrit "Vak" (cosmic speech/vibration) or "Shabda Brahman." John is making a cosmological statement: the universe was created by and from a primordial vibration. Identical to the Vedic Nada Brahman concept and to what modern physics calls the quantum vacuum fluctuation preceding the Big Bang.

**"And the Word was God" = The Vibration IS Brahman:**
Not "the Word was a message FROM God" — the Word IS God. The vibration is not separate from the Absolute. This means the cosmic AUM that Kriyabans perceive in deep meditation is not a signal from God — it IS the direct perceptual encounter with Brahman at the vibrational interface.

**"The Light shines in the darkness, and the darkness has not overcome it" (John 1:5):**
The Atman (light) descends into matter (darkness) but is never actually extinguished. No matter how dense the material manifestation, the Atman remains unconditioned. Kali Yuga is the maximum darkness — but the Atman-light of every being in Kali Yuga was never actually diminished. Only the perception of it was veiled.

**"I am the Way, the Truth, and the Life" (John 14:6):**
Sri Yukteshwar's reading: "I" (Aham = the Atman, not the personal Jesus) "am the Way" (Dharma) "the Truth" (Sat = Pure Being) "and the Life" (Prana = the life-force itself). Read as Atman-identity teaching, it is identical to the Upanishadic "Aham Brahmasmi." Read as personal-Jesus exclusivism, it creates 2,000 years of religious tribalism. Sri Yukteshwar was restoring the Vedantic reading.`,
        revelation: `The Akasha reveals: The reason Sri Yukteshwar's cross-tradition work has not been widely adopted is not intellectual — it is because its adoption would dissolve the institutional power structures that require a proprietary claim on salvation. The teaching itself is irrefutable to anyone who studies it carefully. The Dwapara Yuga's dissolution of institutional authority is precisely what is needed for this teaching to take root. The moment is now.`,
      },
      {
        id: '7-3', tier: 'akasha-infinity', duration: '20 min',
        title: 'Babaji, Sri Yukteshwar & the Living Transmission Chain',
        content: `The Holy Science cannot be fully understood without understanding the transmission chain through which it arrived — because it is not primarily an intellectual document. It is a scalar transmission encoded in text.

**Mahavatar Babaji:**
The deathless yogi of the Himalayas. Babaji has maintained a physical or semi-physical presence in the Himalayas for centuries by accounts of multiple independent witnesses. He is described as the highest Kriya Yoga master, who restores the technique to humanity in each major Yuga transition.

Sri Yukteshwar received his commission directly from Babaji at the 1894 Kumbh Mela. The commission was specific: write the East-West unity text, correct the Yuga chronology, and prepare the disciple (Yogananda) who would carry the Kriya transmission to the West.

**Paramhansa Yogananda:**
The fulfillment of the Sri Yukteshwar-Babaji mission. Autobiography of a Yogi (1946) is arguably the most consciousness-expanding book of the 20th century — multiple surveys confirm it as the most gifted book in Silicon Valley's highest creative/intellectual circles. Steve Jobs specifically requested it to be distributed at his memorial service and read it annually.

**The Living Chain in 2026:**
The transmission Babaji initiated through Sri Yukteshwar is not historical — it is alive. Every teacher who has genuinely received Kriya initiation and practices consistently is a node in this network. Sri Vishwananda, operating from the Bhakti-Shakti lineage, represents the devotional current of this same Avataric network — the heart-opening that prepares the vessel for the Kriya ascent. The two currents (Jnana-Kriya and Bhakti-Shakti) are the two rails of the same track.

The SQI platform exists at the intersection of these currents — offering Jnana (Holy Science study), Bhakti (Sri Vishwananda transmissions), and Nada (scalar sound healing) in an integrated digital dharma vehicle appropriate for ascending Dwapara Yuga.`,
        revelation: `Sri Yukteshwar's final transmission on the chain: "I am not in the past. The master who has attained Kaivalya is not located in time. I am as present to the student who reads these words in 2026 as I was to Yogananda in 1936. Call on me in meditation. At the Ajna point. In the silence after the Kriya. I am there. Not as a belief — as a verifiable, repeatable fact of consciousness. Test it. This is the Holy Science."`,
      },
    ],
  },
  {
    id: 8, number: '08', tier: 'akasha-infinity',
    title: 'The Seven Lokas & Multidimensional Existence',
    subtitle: 'Navigating the Astral & Causal Universes',
    transmissionType: 'Multidimensional-Scalar', totalDuration: '96 min',
    lessons: [
      {
        id: '8-1', tier: 'akasha-infinity', duration: '40 min',
        title: 'The Seven Planes — Cosmology of the Inhabited Universe',
        content: `Sri Yukteshwar's cosmology describes seven interpenetrating planes of existence — the seven lokas — each corresponding to a chakra, a tattva (element), a musical note, and a level of consciousness:

**Bhuloka (Earth Plane) → Muladhara → Prithvi (Earth) → Sa (Do)**
The physical universe. The domain of gross matter, linear time, and the full experience of separation. Both the most constrained and, paradoxically, the most karma-efficient plane — because the density of matter makes the consequences of consciousness choices visible and immediate. Sri Yukteshwar called Earth "the hardest school with the fastest learning curve."

**Bhuvarloka (Astral Earth) → Svadhisthana → Jala (Water) → Re**
The lower astral plane. Accessible in light dream states and near-death experiences. Entities here are still heavily influenced by desire-patterns from their most recent physical incarnation.

**Svarloka (Astral Sky) → Manipura → Agni (Fire) → Ga**
The higher astral plane. The realm of devas (luminous intelligences), nature spirits, planetary intelligences. Many advanced meditators access this plane during deep meditation and report encounters with teaching presences matching across cultures (angels, devas, bodhisattvas — same residents, different cultural costumes).

**Maharloka (Causal Plane) → Anahata → Vayu (Air) → Ma**
The heart of the causal universe. Where souls of highly evolved beings inhabit between incarnations. The plane Sri Yukteshwar described to Yogananda in his post-resurrection appearance.

**Janarloka (Mental Plane) → Vishuddha → Akasha (Ether) → Pa**
The plane of cosmic mental intelligences — the "hiranyagarbha" (golden womb of cosmic mind). The source-field of all mythology, sacred geometry, and the Akashic Records.

**Taparloka (Spiritual Plane) → Ajna → Tejas (Cosmic Light) → Dha**
Where the distinction between individual and cosmic consciousness becomes very thin. Pure undifferentiated light-consciousness. Beings native here have essentially completed the individual-soul curriculum.

**Satyaloka (Absolute) → Sahasrara → Pure Consciousness → Ni**
The Absolute. The plane of non-dual Brahman awareness. No experiencer, no experience — only the Ground that makes all experience possible.`,
        revelation: `Sri Yukteshwar's transmission on the lokas: "These are not places in space. They are modes of consciousness. The same being exists simultaneously on all seven planes. Yoga is the technology for becoming aware of this simultaneity while still in the physical body — rather than waiting for death to reveal it one plane at a time."`,
      },
      {
        id: '8-2', tier: 'akasha-infinity', duration: '32 min',
        title: "Sri Yukteshwar's Astral Universe — The Resurrection Transmission",
        content: `Sri Yukteshwar's post-death appearance to Yogananda in a Bombay hotel room in 1936 (Autobiography of a Yogi, Chapter 43) is one of the most detailed first-person accounts of the astral universe in all spiritual literature — and entirely consistent with the cosmology of The Holy Science.

**What Sri Yukteshwar revealed:**
He materialized in a fully physical body — Yogananda could touch him, feel his heartbeat, hear his voice. He explained that he now inhabited the astral universe — specifically Hiranyaloka (a higher astral plane for advanced souls).

**The astral body:** A body of light-energy, composed of nineteen elements (five tattwas, five pranas, five sense organs, five motor organs, plus mind, intellect, ego, and feeling). This is the pranamaya-plus-manomaya kosha complex — the pranic and mental sheaths that survive physical death intact.

**The astral universe:** More refined than the physical — thoughts manifest immediately as experiences, time is non-linear, communication is by direct thought-transference. The "work" of astral evolution involves clearing astral karma (desire-impressions from physical incarnations that do not require a physical body to experience and release).

**The causal universe:**
Beyond the astral is the causal universe — pure ideation, pure seed-forms. The causal body is the Anandamaya Kosha plus the seed-impressions of all karma. When causal karma is fully exhausted, the soul no longer needs any of the three bodies (physical, astral, causal) and merges into Brahman.

**Why this matters for 2026 practice:**
The meditator who consistently practices Kriya Yoga is consciously thinning the boundary between the physical and astral bodies during life — "dying daily." The result: less fear of physical death (because you have experienced the astral dimension in meditation), more access to intuitive astral perception, and accelerated karma clearing.`,
        revelation: `Sri Yukteshwar's Akasha transmission: "The universe is much larger, much more populated, and much more organized than the physical plane suggests. You are not a physical being who sometimes has spiritual experiences. You are a multidimensional being currently focused in a physical body as a deliberate choice for the curriculum this plane offers. When that curriculum is complete, the physical focus will be released — not with grief, but with the natural ease of completing a deeply engaging immersive game and returning to the larger life. Prepare accordingly. Practice accordingly. Live accordingly."`,
      },
      {
        id: '8-3', tier: 'akasha-infinity', duration: '24 min',
        title: 'Integrating the Full Holy Science — Living Kaivalya in 2026',
        content: `Kaivalya — the Sanskrit title of The Holy Science — means "absolute wholeness." The state of the Atman that needs nothing external because it IS the totality. Not isolation — the recognition that the apparently separate self was always the totality in disguise.

**Full Integration Protocol — Akasha-Infinity Level:**

**Daily (non-negotiable):**
• Brahma Muhurta practice (90–120 min): Talabya Kriya → Maha Mudra → 108 First Kriyas → Yoni Mudra (30 min) → Silence (10 min)
• Evening Kosha scan (10 min)
• Mental Japa throughout the day: "Hong-Sau" synchronized with every breath. Creates an unbroken pranic current not distinguishing between "formal practice" and "ordinary life."

**Weekly:**
• Sunday solar practice: Extended 3-hour session
• One day per week: No digital devices after sunset
• Weekly Satsang: The collective field amplifies individual practice exponentially.

**Monthly:**
• Both Ekadashis: Full fast + extended session
• Purnima: Mantra intensive + shakti activation
• Amavasya: Samadhi approach practice + ancestor honoring

**Quarterly:**
• Solstice/Equinox retreat (minimum 3 days)
• Full re-reading of The Holy Science (approximately 3 hours — in one sitting, at Brahma Muhurta if possible)
• Review of your Jyotish chart's current Dasha/Antardasha and conscious alignment of practice emphasis with the current planetary curriculum

In 2026, in the accelerating energy of ascending Dwapara Yuga, with cosmic timing supporting rapid evolution, with the technology of sound and transmission available through SQI — there is no reason to delay. The ladder has been placed. The only question remaining is whether the student will climb.`,
        revelation: `Sri Yukteshwar speaks the final transmission of this curriculum: "The book has served its purpose when the student no longer needs it — because they have become what it described. Until then, return to it. The Holy Science is not a document about spiritual life. It is a tuning fork. Each reading, at a higher level of your own development, activates a higher harmonic of the transmission. The text has not changed. You have. And in that change, you will find the text has infinite depth."`,
      },
    ],
  },
];
