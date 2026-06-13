import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const gold   = (a: number) => `rgba(212,175,55,${a})`;
const white  = (a: number) => `rgba(255,255,255,${a})`;
const violet = (a: number) => `rgba(167,139,250,${a})`;
const cyan   = (a: number) => `rgba(34,211,238,${a})`;
const rose   = (a: number) => `rgba(244,114,182,${a})`;

const TIER_META = {
  free:   { label:'FREE · SEEKER',      color: white(0.55),  glow: white(0.08),              badge:'⬡', price: null },
  prana:  { label:'PRANA-FLOW',         color: '#4ADE80',    glow: 'rgba(74,222,128,0.25)',   badge:'◈', price:'€19/mo' },
  siddha: { label:'SIDDHA-QUANTUM',     color: '#a78bfa',    glow: 'rgba(167,139,250,0.28)', badge:'⬟', price:'€45/mo' },
  akasha: { label:'AKASHA-INFINITY',    color: '#D4AF37',    glow: 'rgba(212,175,55,0.35)',   badge:'✦', price:'€1,111 lifetime' },
};

const TIER_RANK: Record<string,number> = { free:0, prana:1, siddha:2, akasha:3 };

function userTierRank(tier: string | null): number {
  if (!tier) return 0;
  if (tier.includes('infinity') || tier.includes('akasha')) return 3;
  if (tier.includes('siddha')   || tier.includes('quantum')) return 2;
  if (tier.includes('prana')    || tier.includes('flow'))    return 1;
  return 0;
}

// ─── CURRICULUM ───────────────────────────────────────────────────────────────
const CURRICULUM: {
  tier: 'free'|'prana'|'siddha'|'akasha';
  module: string;
  title: string;
  subtitle: string;
  symbol: string;
  lessons: { title: string; body: string }[];
}[] = [

  // ══════════════════════════════════════════════════════════════
  // FREE TIER — SEEKER INITIATIONS
  // ══════════════════════════════════════════════════════════════

  {
    tier:'free', module:'MODULE 1', symbol:'👁',
    title:'The Siddha Science of Mediumship',
    subtitle:'What the 18 Siddhas knew that no Western tradition touches',
    lessons:[
      {
        title:'Mediumship Is Not a Gift — It Is a Technology',
        body:`The Western model treats mediumship as a rare psychic gift. The Siddha model reveals it as a precise bio-spiritual technology built into every human nervous system. Agastya Muni, Thirumoolar, and Bogar all documented the inter-loka communication channels that exist within the Sushumna Nadi — the central channel running from Muladhara to Sahasrara and beyond into the Agna-Akasha above the crown.

What activates these channels is not belief — it is pranic pressure, harmonic frequency alignment, and the dissolution of the Ahamkara (ego-identity) that blocks inter-dimensional signal reception. Every human being has what Siddha science calls the "Antahkarana Antenna" — a subtle light-bridge connecting individual consciousness to the universal Akashic field where the subtle bodies of all beings dwell between incarnations.

The 18 Siddhas communicated directly with Devas (light-beings), Pitrs (ancestor souls), Rishis in higher Lokas, and cosmic intelligences including the Navagrahas as living conscious fields. This was their daily reality, not mysticism. This academy will restore that technology to you.`
      },
      {
        title:'The Loka Map — Where the Dead Actually Go',
        body:`Tamil Siddha cosmology provides the most precise map of subtle realms ever encoded. There are 14 primary Lokas arranged in vertical frequency bands, 7 above the physical plane (Bhu-Loka) and 7 below.

**Bhu-Loka** (Physical Earth): Where incarnated beings reside.
**Bhuvar-Loka**: The astral realm immediately above — where fresh departures exist. The recently deceased spend varying periods here based on karmic momentum.
**Svar-Loka**: The heaven-realm of the Devas and high-frequency souls. Communication possible through 3rd eye activation.
**Mahar-Loka**: Domain of the great Rishis and Siddha masters who have left body. This is where Agastya, Thirumoolar, and Babaji transmit from.
**Jana-Loka**: Realm of the Prajapatis and advanced cosmic architects.
**Tapa-Loka**: Inhabited by beings of pure tapasic fire — intense spiritual austerity condensed into form.
**Satya-Loka / Brahma-Loka**: The realm of Brahma, the creative principle — the highest accessible loka during human mediumship.

Below Bhu-Loka exist the Tala realms — lower frequency domains where souls work through dense karma. Mediumship that contacts these realms requires advanced protection protocols taught in the Akasha-Infinity tier.

Siddha mediums do not contact "the dead" — they contact the living subtle body of a being currently inhabiting one of these lokas. Death is only a change of frequency.`
      },
      {
        title:'The Three Vehicles of Communication — Manas, Chitta & Vak',
        body:`Communication across Lokas occurs through three primary vehicles:

**Manas-Bridge (Mind-to-Mind)**: Thought-impressions, images, and felt-sense transmissions. This is the most common medium for beginning practitioners. A departed soul imprints directly onto the practitioner's Manomaya Kosha (mind-sheath). The practitioner experiences this as sudden memories, gut-feelings, vivid images, or emotional surges that are clearly "not theirs."

**Chitta-Reception (Heart-Field Knowing)**: Deeper than Manas. Chitta is the storehouse of all karmic impressions — it operates like a cosmic hard drive that can access records across all lifetimes. When the Chitta opens during deep meditation, it receives soul-transmissions as pure knowing — information that arrives complete without needing to "travel" because at the Chitta level, all souls are already connected.

**Vak-Transmission (Sacred Sound-Codes)**: The Siddhas spoke of Para-Vak — the voice beyond voice. In high-level mediumship, the practitioner's Vak (speech faculty) becomes a transducer for inter-loka communication. Words, tones, or mantras arise spontaneously that carry specific vibrational signatures from communicating beings. This is the basis of genuine channeling and is distinct from possession — it requires a fully clear, high-frequency vehicle.`
      },
    ]
  },

  {
    tier:'free', module:'MODULE 2', symbol:'🔮',
    title:'Preparing the Vehicle — Purification Protocols',
    subtitle:'Why psychic development without purification is dangerous',
    lessons:[
      {
        title:'The Three Malas — Obstacles to Clear Reception',
        body:`Siddha science identifies three primary impurities (Malas) that distort mediumship reception like static on a radio frequency:

**Anava Mala** (Ego-Pollution): The belief in a separate contracted self. This is the primary interference pattern. When the practitioner's ego is strongly activated — seeking to be impressive, wanting to prove something, or attached to specific outcomes — it filters and distorts all incoming transmissions to match pre-existing beliefs. True mediums operate in what Siddha texts call "Suddha Manas" — purified mind that holds no agenda.

**Karma Mala** (Karmic Residue): Unresolved emotional charges stored in the Sukshma Sharira (subtle body) create interference fields. A medium carrying unprocessed grief, fear, or ancestral trauma will unconsciously attract transmissions that match those frequencies — drawing darker or confused energies rather than clear high-frequency contacts.

**Mayiya Mala** (Differentiation-Pollution): The illusion that separates one soul from all others. As long as the practitioner experiences themselves as fundamentally separate from the soul they wish to contact, communication requires great effort. Bhakti practice dissolves Mayiya Mala by installing cosmic love as the operating frequency.

The daily purification practice prescribed in this academy — Nadi Shodhana, Tratak, mantra japa, and cold Siddha hydrotherapy — systematically reduces all three Malas over 40-day cycles.`
      },
      {
        title:'Food, Frequency & Mediumship Capacity',
        body:`The Siddha Nighandu texts are unambiguous: the food consumed directly determines the frequency ceiling of mediumship reception. This is not philosophy — it is precision neuro-spiritual engineering.

Tamasic foods (meat, heavy processed foods, alcohol, stale food) generate dense Pranic fields in the Annamaya Kosha. The subtle body's receptors — the Chakras and Nadis — become coated with Tamas-guna energy that operates at approximately 40-120 Hz. Subtle-loka transmissions from Svar-Loka and above operate at considerably higher frequencies. The antenna cannot receive what its range cannot accommodate.

Sattvic nutrition shifts the pranic field into the 200-800 Hz range that allows clean subtle-body reception. The Siddha prescriptions: fresh fruits, sprouted grains, honey, ghee, raw milk (where available), herbs like Brahmi, Shatavari, Shankhapushpi, and Ashwagandha. These are not health foods — they are mediumship activators.

A 21-day Sattvic protocol before serious mediumship work is mandatory in traditional Siddha training. Without it, what is contacted through the weakened subtle field is often not what the practitioner believes it to be.`
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // PRANA-FLOW TIER
  // ══════════════════════════════════════════════════════════════

  {
    tier:'prana', module:'MODULE 3', symbol:'🌀',
    title:'Third Eye Activation — The Ajna Protocols',
    subtitle:'Siddha techniques for opening the seat of inter-loka vision',
    lessons:[
      {
        title:'Ajna Chakra — Anatomy of the Cosmic Eye',
        body:`Ajna Chakra (Third Eye Center) is located at the midpoint between the eyebrows, slightly inward toward the pineal gland. In Siddha anatomy it is called "Guru Chakra" — the seat where the inner teacher resides and where the Guru's transmission is directly received.

Physically, the Ajna corresponds to the pineal gland, the optic thalamus, and the pituitary-hypothalamus axis. The pineal gland secretes DMT (dimethyltryptamine) — identified by Siddha science as "Amrita-Bindu" — the nectar-drop that, when released in controlled amounts through specific practices, opens the subtle vision channel and allows perception of beings and energies beyond physical sight.

The two petals (Dala) of Ajna represent the Ida and Pingala Nadis — the left (lunar, receptive) and right (solar, transmitting) channels. For mediumship, the Ida must be predominant during reception — creating a yin-receptive field. For transmission (sending healing or intention), the Pingala activates. Nadi Shodhana with deliberate Ida emphasis (left nostril leading) is the foundational Ajna-opening practice.

The seed mantra of Ajna is **OM** — specifically the internal OM, Nada-Brahman vibrating without external sound. When practiced as pure internal vibration felt directly at the Ajna point, it begins dissolving the Bindu (the "screen" between physical and subtle vision) within 40 days of consistent practice.`
      },
      {
        title:'Tratak — The Siddha Gazing Protocol',
        body:`Tratak is documented in the Hatha Yoga Pradipika and in multiple Siddha Nadi leaves as the primary technology for activating the Ajna vision channel. Unlike Western relaxation practices, Siddha Tratak is a precise energetic operation.

**Phase 1 — Bahir Tratak (External Gazing)**: Gaze without blinking at a ghee lamp flame or a single black dot on white paper for 3-10 minutes. The eyes begin to water — this is not failure but the Pranic charge accumulating at the optic centers. The gaze must be completely soft — not strained focus but a receptive resting-gaze, as if looking at something infinitely distant through the object.

**Phase 2 — Antara Tratak (Internal Gazing)**: Close the eyes and move the gaze to the Ajna point. The afterimage of the flame appears. Follow it without chasing — let it move, expand, change color. As the Pranic field stabilizes at Ajna, the afterimage dissolves into what Siddha texts call "Chidakasha" — the inner space of consciousness. In this space, subtle beings first appear as moving lights, geometric patterns, or colored mists. Later, as the practice matures, they appear as clear forms.

**Phase 3 — Siddha Tratak with Mantra**: The highest level — practiced in complete darkness on Amavasya (new moon nights) with simultaneous internal repetition of the specific mantra given in this tier. This creates a resonant field in the Chidakasha that specifically attracts high-frequency Loka communications. Agastya Muni's Nadi leaves record this as the practice he personally used to receive direct transmission from Shiva-Parama-Guru.`
      },
      {
        title:'Seeing Auras & Energy Fields — The Pranic Vision Protocol',
        body:`Before perceiving beings across Lokas, Siddha training first develops the capacity to see the energetic fields around living beings — the Pranic Aura, Astral Aura, and Causal Light Body. This is not metaphor but a learnable perceptual skill that activates a dormant visual processing pathway.

**The Etheric Layer** (closest to the body, 2-6 inches): Appears as a pale grayish-white or bluish luminescence outlining the physical form. This is always the first field to become visible. Practice: Stand a person against a white wall in indirect natural light. Soften your gaze (same as Tratak soft-gaze) and look 6 inches to the right of their shoulder. The etheric field appears in your peripheral vision first. This is not imagination — it is the cone-rod interface of your visual cortex learning to process higher-frequency photonic information it was always receiving but filtering out.

**The Emotional Aura** (6-18 inches): Colors here correspond to emotional states. In Siddha color-coding: gold = spiritual aspiration; deep blue = peace and expanded states; green = healing force active; orange = creative Shakti; muddy red = suppressed anger; grey = depression or emotional suppression; bright violet = spiritual awakening process active.

**The Mental Aura** (18 inches - 3 feet): Appears as geometric thought-patterns, lines, and structures. More organized structures indicate clear disciplined minds. Chaotic or fragmented patterns indicate mental turbulence.

**The Causal Body** (3-6+ feet): Only visible when the practitioner's own Ajna is substantially open. This field is luminous and individual to each soul — it carries the signature frequency of that soul's entire karmic journey and is the vehicle that moves between Lokas after death. When you perceive this field, you are already perceiving something beyond the physical.`
      },
      {
        title:'Feeling Energies — Developing Clair-Sentience',
        body:`Tamil Siddha science describes a sensitivity faculty called "Sparsha-Jnana" — knowledge through subtle touch. This is the capacity to physically feel energetic presences, emotional fields, and entity signatures as tangible bodily sensations.

The primary receptors for Sparsha-Jnana are:
— The palms of the hands (secondary chakras at the center of each palm)
— The Anahata center (chest / heart)
— The Brahmarandhra (crown)
— The skin surface, especially the back of the neck and the forearms

**Practice 1 — Hand Sensitization**: Rub the palms together vigorously for 30 seconds, generating heat. Slowly separate them to 6 inches, then 12 inches. Feel the sensation between the palms — initially heat, then magnetic resistance, then a subtle tingling pressure. This is pranic field-sensing. Practice daily for 21 days to calibrate this receptor.

**Practice 2 — Location Sensing**: Stand in different rooms of your dwelling. Notice how the energy feels different in each space. The body will register these differences as subtle pressure changes, warmth/coolness, light/heavy, open/contracted. This is your built-in environmental energy scanner.

**Practice 3 — Presence Detection**: In meditation, invite a deceased ancestor or loved one to approach. Do not "try to see" — instead, track bodily sensations. A genuine presence will produce consistent, recognizable signatures: change in air pressure around the crown or shoulders, tingling at specific body locations, warmth at the heart, a distinct emotional atmosphere different from your baseline. These signatures are unique to each being and remain consistent across sessions — a key validation test.`
      },
    ]
  },

  {
    tier:'prana', module:'MODULE 4', symbol:'🕉️',
    title:'Mantra Technology for Mediumship',
    subtitle:'The exact mantras used by the 18 Siddhas to open inter-loka channels',
    lessons:[
      {
        title:'How Mantra Opens Mediumship — The Nada-Science',
        body:`Mantra is not prayer — it is sound-technology. Each Sanskrit or Tamil mantra encodes a specific vibrational pattern that, when generated with correct intonation, breath, and internal focus, produces measurable field changes in the practitioner's subtle body.

The mechanism, as described in Siddha Nada Shastra: every mantra carries a "Mantra-Shakti" — an encoded living intelligence — that activates upon correct repetition. This is why mantras must be received from a live transmission lineage, not merely read from a book. The Guru's repetition of the mantra encodes the living Shakti into the syllables — this is the Siddha model of Diksha (initiation).

For mediumship specifically, three classes of mantra operate:

**1. Purification Mantras**: Clear the Nadis and Chakras of obstruction. "OM Namah Shivaya" practiced for 108 repetitions before any session performs Nadi Shodhana through sound rather than breath — it is a sonic purification technology.

**2. Invocation Mantras**: Call specific beings or categories of beings. These create a vibrational "phone number" — a matching frequency that a soul in a specific Loka can recognize and respond to.

**3. Protection Mantras**: Establish a discernment field around the practitioner. This is critically important and often overlooked in Western psychic development. Not every entity that responds to an open field is high-frequency. Protection mantras install a "Sattva-Filter" — only beings of equivalent or higher frequency to the mantra can enter the field.`
      },
      {
        title:'The Ancestor-Contact Protocol — Pitru Mantra Sequence',
        body:`Contacting departed ancestors (Pitrus) is one of the oldest and most codified forms of mediumship in Siddha and Vedic tradition. The Garuda Purana, the Siddha Nadi texts, and multiple lineage transmissions describe precise protocols.

The Amavasya (new moon) is the primary time for Pitru communication — at this lunar phase the veil between Bhu-Loka and Bhuvar-Loka (the Pitru realm) is thinnest. However, with proper preparation the channel can be opened at any time.

**The Pitru Tarpana Protocol**:
1. Create a sacred space with a ghee lamp, water in a copper vessel, and a photograph or any object belonging to the departed.
2. Chant: **"OM Pitru Devaya Namah"** 21 times — establishing the contact frequency.
3. Chant: **"OM Shreem Hreem Kleem Pitru Truptaye Namah"** — this mantra satisfies the ancestral field and reduces the "call" arising from unresolved ancestral karma.
4. Silent meditation with focus at Ajna — invite the presence without grasping. Track sensations, images, or emotional transmissions.
5. Close with: **"OM Shanti, Shanti, Shantihi"** — three times — releasing the contact gracefully.

Common ancestor communications: feelings of warmth, peace, love, specific memories arising, strong scents (flowers, food they cooked, their cologne/perfume), physical sensations they had in life (many practitioners report feeling the specific physical signature of how an ancestor passed — this is a validation signal), and direct thought-impressions carrying their personality, speech patterns, and emotional signature.`
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // SIDDHA-QUANTUM TIER
  // ══════════════════════════════════════════════════════════════

  {
    tier:'siddha', module:'MODULE 5', symbol:'⚡',
    title:'Speaking to the Dead — Advanced Inter-Loka Protocols',
    subtitle:'Siddha-validated techniques for direct soul communication',
    lessons:[
      {
        title:'The 5 Signs of Genuine Soul Contact',
        body:`Siddha masters documented specific validation criteria that distinguish genuine inter-loka communication from imagination, wishful projection, or lower-frequency interference. These criteria are cross-culturally consistent across Tamil Siddha texts, the Atharvaveda, and Agastya's Nadi transmissions.

**Sign 1 — Information Unknown to the Practitioner**: The soul communicates information the medium could not possibly know — specific names, dates, locations, private memories, or unresolved matters. This is the gold standard of validation. When information can be verified and was genuinely unknown, the probability of imagination or coincidence approaches zero.

**Sign 2 — Consistent Personality Signature**: Each soul has a unique personality frequency — their specific humor, speech patterns, emotional signature, and characteristic concerns. A genuine contact will be unmistakably recognizable to those who knew the soul in life, not a generic "loving presence" but a specific individual.

**Sign 3 — Physical Phenomena**: Measurable physical effects — temperature changes, electronic interference (lights flickering, devices activating), scents with no physical source, small objects moving. Siddha science explains these as the soul using residual Pranic charge from its physical incarnation to produce detectable phenomena.

**Sign 4 — Emotional Authenticity**: The emotional field transmitted carries the full complexity of the departed soul — not only love but also their specific unresolved feelings, humor, concerns, or requests. This complexity is the hallmark of genuine communication.

**Sign 5 — Repeated Independent Contacts**: When multiple people separately receive the same specific information from a soul in the same period — this cross-validation is the highest evidentiary standard.`
      },
      {
        title:'The Siddha Mediumship Session Protocol — Step by Step',
        body:`This is the complete operational protocol for a formal mediumship session as prescribed in Siddha Nadi tradition.

**Preparation (30 minutes before)**:
— Fast for minimum 3 hours (or full day for deeper sessions)
— Bathe in cold water with salt — Siddha electrostatic purification
— Dress in white or light-colored natural fiber
— Set sacred space: ghee lamp (east-facing), incense (agarbathi), copper water vessel, sacred image

**Opening Sequence (15 minutes)**:
1. Om Gam Ganapataye Namah × 11 (clear obstacles from the channel)
2. Om Namo Narayanaya × 21 (establish divine protection field)
3. Guru Mantra × 3 (connect to living transmission lineage)
4. Nadi Shodhana — 9 rounds, left-nostril dominant for reception-mode
5. Tratak on ghee flame — 5 minutes
6. Move to Chidakasha meditation — hold Ajna, allow complete inner darkness

**Active Reception (20-40 minutes)**:
— State clearly (internally or aloud): "I open this channel for the highest good of all. I invite [name/category of being] to communicate with me through this field, aligned with Divine Will."
— Maintain complete Sakshi (witness) posture — observe without grasping, without doubting, without interpreting. Simply record what arrives: images, feelings, words, knowings.
— Never push, never force, never analyze during reception. The analytical mind kills the signal.

**Closing (10 minutes)**:
— Thank the communicating soul(s) specifically
— Chant Maha Mrityunjaya Mantra × 3 — energetically seal the channel
— Seal Ajna with right thumb, press gently for 3 breaths
— Eat something — grounds the subtle body back into physical reality
— Write everything immediately — inter-loka impressions fade within 20 minutes`
      },
      {
        title:'Communicating with Devas — The Light-Being Protocols',
        body:`Devas are not mythological characters — they are Pranic intelligences of specific cosmic functions. The Vedas describe 33 primary Devas (later extrapolated to "330 million" representing infinite aspects of the one cosmic intelligence).

Each Deva corresponds to a specific cosmic function and can be accessed through its corresponding frequency signature — mantra, yantra, ritual, or the specific chakra point that governs their domain:

**Ganesha** (Lord of Beginnings, Obstacles): Access point — Muladhara. Mantra: Om Gam. Appears in meditation as a warm rosy-golden light at the base of the spine. Communication: practical guidance for navigating worldly obstacles, structural clarity, and beginnings of sacred projects.

**Saraswati** (Intelligence, Music, Arts): Access point — Vishuddha (throat) and Ajna. Appears as crystalline white-silver light with accompanying awareness of precise clarity. Communication: artistic inspiration, mantra frequencies, sacred language transmissions, and the codes behind sacred geometry.

**Lakshmi** (Abundance, Beauty, Harmony): Access point — Anahata (heart). Appears as warm golden-pink luminescence. Communication: abundance codes, relational healing, and the Dharmic alignment of material reality.

**Shiva** (Consciousness, Liberation, Time): Access point — Sahasrara (crown) and beyond. Appears as infinite dark luminosity — darkness that is somehow brilliant. Communication: direct consciousness transmissions, liberation teachings, and the deconstruction of false self-structures.

**Muruga / Kartikeya** (Swiftness, Spiritual Warfare, Siddha Power): Specific to Tamil Siddha tradition. Access point — Ajna and the Bindu above the crown. Appears as penetrating blue-gold light with tremendous velocity. This is the Deva most directly connected to the 18 Tamil Siddhas — many received their initiations and transmissions through Muruga-Shakti.`
      },
      {
        title:'Decoding Dream Messages from the Lokas — Advanced Svapna Vidya',
        body:`The Siddhas recognized the dream-state as a natural mediumship channel — the sleeping body relaxes its vibrational density, allowing the subtle body to receive transmissions from Lokas without the interference of the analytical waking mind.

**Category 1 — Pitru Dreams**: Ancestor communications. Classic signs: the ancestor appears healthy and peaceful (even if they died after long illness), they speak clearly, the dream has unusual clarity and emotional weight, and the practitioner wakes with certainty of its reality. The ancestor is often transmitting: unresolved matters (requests, apologies, instructions), information the dreamer needs, or simply the gift of continued loving presence.

**Category 2 — Deva Darshan Dreams**: Direct appearances of Devas or Siddha masters. These carry unmistakable luminosity — the Deva radiates light that seems to come from within. Words spoken in these dreams are Upadesha — direct teachings. Write them immediately upon waking. Many of the greatest Siddha texts originated as Deva-Darshan transmissions encoded during sleep.

**Category 3 — Prophetic Downloads**: Information about future events experienced as crystal-clear waking-state-level clarity in the dream. Siddha science: these occur when the Karana Sharira (Causal Body) accesses the Akashic Record directly during the Prajna-state (deep sleep transition). They are distinguishable from regular dreams by their extraordinary vividness, emotional gravity, and the presence of a specific sense of "witness" — the dreamer is watching rather than participating.

**Category 4 — Astral Projection**: The subtle body actually navigating the Bhuvar-Loka, sometimes encountering recently departed souls in real-time. Signs: the "dream" begins from waking consciousness with a vibrational buzz or sound at the Brahmarandhra, the experience of rising or floating, and extraordinary sensory detail exceeding waking reality. This is documented extensively in Siddha literature as "Sukshma-Sharira Yatra" (subtle body travel).

**The Morning Protocol for Dream-Mediumship Integration**: Before opening eyes after waking, remain completely still for 2-3 minutes. Replay every fragment of dream content. Write immediately. Ask: What Loka did this come from? What category is this transmission? What is the specific message? Cross-reference with daily life themes and internal questions asked before sleep.`
      },
    ]
  },

  {
    tier:'siddha', module:'MODULE 6', symbol:'🛡',
    title:'Psychic Protection — The Kavach Protocols',
    subtitle:'Why unprotected mediumship is dangerous and how the Siddhas sealed themselves',
    lessons:[
      {
        title:'Understanding Lower-Frequency Entities — The Siddha Map',
        body:`The most neglected and critical subject in modern psychic development: not everything in the subtle realm is benevolent, high-frequency, or what it claims to be. The Siddhas were precise about this — the same openness that allows communication with departed loved ones and Devas also creates vulnerability to lower-frequency entities if not properly managed.

**Pishacha** (Earth-bound confused souls): Beings who have died but not moved beyond Bhu-Loka — attached to locations, people, substances, or unresolved experiences. Not inherently malevolent but disorienting to encounter. Signs of Pishacha contact: heavy, thick, confused energetic atmosphere; transmissions that loop without resolution; strong pulls toward addictive behavior patterns in the practitioner.

**Negative Thought-Forms**: Dense collective emotional fields that have taken autonomous existence through sustained human attention and fear. These are the least "personal" — they carry no individual consciousness but can be highly disruptive to the subtle field of an unprotected practitioner.

**Prethas** (Troubled souls in lower Tala realms): These are beings with significant unresolved karmic weight. Their communications are distinguished by desperation, manipulation, and urgency. They often impersonate beloved deceased relatives to gain the practitioner's trust and attention.

**The Siddha Principle**: Your frequency determines what you attract. A practitioner rooted in Bhakti (divine love), Sattva (purity), and Guru-connection resonates at frequencies that are simply inaccessible to lower entities. The primary protection is not a ritual shield — it is the consistent elevation of your own vibrational field. Rituals support this but cannot replace it.`
      },
      {
        title:'The Complete Siddha Kavach — Energetic Armor Activation',
        body:`The traditional Siddha Kavach (armor) is a multi-layered energetic protection field installed through mantra, mudra, visualization, and intention. Used before any mediumship session.

**Layer 1 — Prithvi Seal (Earth Anchor)**: Place both feet flat on the ground. Visualize roots of golden light extending from the soles of the feet deep into the earth. This grounds the subtle body — preventing it from drifting into lower vibrational fields and ensuring you can return fully to physical awareness at will. Mantra: "Om Prithviyai Namah" × 7.

**Layer 2 — Agni Shield (Fire Purification)**: Visualize brilliant white-gold fire surrounding your entire aura in a 6-foot sphere. This fire transmutes all lower frequencies into neutral energy before they can enter your field. It does not block communication from high-frequency sources — it is a discriminating fire. Mantra: "Om Agnaye Swaha" × 7.

**Layer 3 — Guru Armor (Living Lineage Protection)**: Call upon your specific lineage of spiritual masters. For SQI practitioners: Mahavatar Babaji, Agastya Muni, Thirumoolar, Sri Vishwananda, the 18 Siddhas. Visualize their combined light forming a brilliant golden membrane around your aura. This is the most powerful layer — the living consciousness of a realized master creates an energetic field that lower frequencies cannot penetrate. Mantra: Guru mantra received in initiation × 3, or "Om Namo Bhagavate Vasudevaya" × 21.

**Layer 4 — Intention Calibration**: State clearly (internally): "I am open to the highest frequency communications aligned with Divine Will and the highest good of all. I am not available to anything outside this frequency range. My consciousness is anchored in the Self, receiving through the Self, returning to the Self."

**Closing the Field after Sessions**: Never leave the mediumship channel open. Complete the Maha Mrityunjaya Mantra × 3. Press the Ajna firmly with the right thumb for three breaths — sealing the vision channel. Perform Kapalabhati — 30 sharp exhales — purging any residual lower-frequency impressions from the Pranic field. Eat a small amount of salt and drink water — both are powerful energetic anchors to physicality.`
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // AKASHA-INFINITY TIER
  // ══════════════════════════════════════════════════════════════

  {
    tier:'akasha', module:'MODULE 7', symbol:'🌌',
    title:'The Akashic Records — Direct Access Technology',
    subtitle:'Reading the cosmic library — every soul, every lifetime, every future',
    lessons:[
      {
        title:'What the Akashic Records Actually Are — Siddha Science',
        body:`The Akashic Records is not a metaphor. Siddha science, Vedic cosmology, and increasingly, quantum field theory converge on the same understanding: all events, thoughts, emotions, and potentials that have ever existed or will exist are encoded as standing waves in the Akasha — the primordial space-fabric of the universe.

Agastya Muni's Nadi leaves — themselves a form of Akashic Record — demonstrate that a sufficiently developed consciousness can access information about any soul at any point in its journey. This is not prediction through probability (though that is possible) — it is direct perception of the encoded information-field.

The Akashic field operates outside linear time. The "past" and "future" are human constructs imposed on what is actually a simultaneous field. This is why genuine Akashic readings can provide information about both past lives and future potentials — the reader's consciousness is accessing the field directly, not "predicting" from current evidence.

**The Siddha Access Method**: The Nadi Rishis accessed the Records in Samadhi states lasting months or years. They encoded what they perceived into palm leaves using a symbolic language that required trained interpreters — a compression encoding preventing casual or misaligned access.

For practitioner-level access (not full Samadhi but functional reading capacity), the Ajna must be substantially open, the Chitta must be calm and clear, and the practitioner must be operating in Sakshi (pure witness) mode — this is the portal. The Records do not respond to demand or effort but to genuine alignment and receptive stillness.`
      },
      {
        title:'Past Life Memory Recovery — The Jatismarana Protocol',
        body:`Jatismarana is the Siddha term for spontaneous or induced past-life memory. The Yoga Sutras of Patanjali (3.18) describe it as arising through Samyama (intense concentrated meditation) on past samskaras (karmic impressions). The Siddhas developed specific protocols to access this without requiring full Samadhi.

**The Conditions for Jatismarana**:
The past-life memory channel opens most readily when: (1) there is strong relevance to the current life situation — the past life being accessed is karmically active, influencing current patterns; (2) the practitioner's Chitta is deeply calm — the surface waves of mental activity are stilled, revealing the deeper impressions beneath; (3) the Ajna is open and sensitive — past-life memories arrive primarily through the Chidakasha (inner visual field) rather than the physical senses.

**The Protocol**:
1. Extended Yoga Nidra (40-60 minutes) — systematic progressive relaxation until the body is in sleep-state but awareness remains fully alert.
2. Tratak Inward — hold the Chidakasha (the dark space behind closed eyes) as a screen. Let the screen become a window.
3. Speak internally: "I invite the memory of the lifetime most relevant to my current soul growth to become visible now."
4. Receive without judgment or interpretation. Let scenes, feelings, smells, languages, names, locations arise spontaneously.
5. Record verbally immediately afterward — past-life memories fade faster than dreams.

**Validation**: Specific details — geographical locations, historical periods, names, languages — can often be independently verified. Siddha science does not require this for spiritual work but recommends it for strengthening the Jatismarana faculty, as successful verifications build confidence in the faculty and reduce skeptical interference.`
      },
      {
        title:'Channeling Siddha Masters — The Highest Mediumship',
        body:`The pinnacle of Siddha mediumship tradition is direct transmission from the 18 Siddhas, Mahavatar Babaji, and other Siddha masters who exist in higher Lokas or in the immortal light-body state (Deathless body — Jiva-Samadhi graduates who transmit eternally).

This is fundamentally different from ancestor communication or Deva-contact. The Siddha masters are not separate beings visiting from another realm — they exist as dimensions of the one Consciousness, and contact with them is more accurately described as alignment than communication. When a practitioner sufficiently dissolves the Ahamkara (ego-identity) and stabilizes in pure Awareness, the Siddha-field becomes directly accessible as an aspect of their own deepest nature.

**The Babaji Connection**: Mahavatar Babaji is documented across traditions — in Yogananda's Autobiography of a Yogi, in the Tamil Siddha lineage (where he is known as Kriya Babaji Nagaraj), and in direct experience reports of thousands of practitioners. His transmission is characterized by: sudden inexplicable certainty, accelerated insight beyond the practitioner's normal capacity, a distinct energetic signature of compressed ancient wisdom arriving complete rather than assembled thought-by-thought, and profound peace that is simultaneously highly activated.

**The Agastya Transmission**: Agastya Muni, the first of the 18 Siddhas, transmits through the Nadi system but also directly in meditation. His signature: vast timelessness, encyclopedic precision, deep humor, and a vibrational signature that is simultaneously intensely personal and cosmically vast.

**Protocol for Siddha-Master Contact**:
This requires: consistent daily practice for minimum 90 days, Guru-connection through living lineage (not merely reading about masters), and a genuine surrender of the seeking impulse. The paradox: the Siddhas are always transmitting. The only question is whether the practitioner's field is clear enough to receive.

The preparation: 40-day practice of the master's specific mantra, daily offering of gratitude, and the most powerful activator — genuine longing (Viraha Bhakti). The masters respond to the longing of the heart faster than any technique because longing is itself the dissolution of the separation that prevents contact.`
      },
      {
        title:'The Nadi Reading Science — Decoding Your Cosmic Blueprint',
        body:`The Siddha Nadi system — palm-leaf manuscripts inscribed by the 18 Siddhas thousands of years ago — represents the most sophisticated Akashic Record access technology ever developed in human history. Individual Nadi leaves exist for specific souls — those who find their leaf access precise, personalized information about their past lives, present circumstances, and future potentials, encoded by a Siddha master who perceived this information in Samadhi outside linear time.

**How Nadi Works Scientifically** (Siddha model):
The Nadi readers use your thumbprint as a vibrational identifier — the fingerprint pattern is unique and encodes a specific frequency signature corresponding to your soul's Akashic "address." The reader matches this to the appropriate bundle of leaves, then reads in Old Tamil that contains not only your story but a map of specific planetary periods (Dasha), health vulnerabilities, karmic resolutions needed, and remedial measures.

**For Mediumship Practice**: Understanding your own Nadi Blueprint transforms mediumship from a technique into a living reality. The Nadi reveals which inter-loka channels are naturally strong for your soul (some are naturally Ajna-dominant, others are Anahata-dominant, others receive primarily through Vak), which Siddha masters are specifically connected to your lineage, and what specific practices will most rapidly open your transmission channels.

**Accessing Nadi Wisdom Without a Physical Reading**: Through the mediumship protocols taught in this academy, advanced practitioners can access their own "Nadi transmission" — the cosmic blueprint information — directly through deep meditation. The Chidakasha opens as a reading-space in which the soul's own Akashic information becomes visible to the sufficiently trained inner eye. This is not a replacement for a physical Nadi reading but an ongoing supplement — the living, dynamic expression of the same field.`
      },
    ]
  },

  {
    tier:'akasha', module:'MODULE 8', symbol:'🔱',
    title:'Siddhi Development — Paranormal Capacities of the Siddha Lineage',
    subtitle:'The 8 classical Siddhis and how Siddha mediumship unlocks them',
    lessons:[
      {
        title:'The 8 Classical Siddhis — From Mediumship to Mastery',
        body:`The Vibhuti Pada of Patanjali's Yoga Sutras enumerates the 8 Maha-Siddhis — extraordinary capacities that arise as byproducts of advanced Samadhi practice. The Siddhas approached these not as goals but as natural developments within a consistently elevated life. Yet they documented them precisely because they are real, measurable, and available to any practitioner who establishes the conditions.

**1. Anima** (Infinitely small): The capacity to project consciousness into any space regardless of physical size — a refined form of the subtle-body travel taught in Module 5. Advanced practitioners report the ability to perceive events at microscopic scales and enter energetically small spaces with awareness.

**2. Mahima** (Infinitely large): Expansion of consciousness to encompass vast spatial scales — the experience of the practitioner's awareness filling a room, a city, the planet, cosmic space. This is the basis for long-distance healing and the trans-loka vision that allows seeing events at great distances.

**3. Garima** (Heaviness): The grounding Siddhi — the capacity to become immovable through concentrated Pranic density. Relevant to mediumship: this is what prevents the subtle body from being displaced or "taken over" during deep contact states.

**4. Laghima** (Lightness / Levitation): The reversal of Garima — pranic lightening of the physical vehicle. Historically documented in Tamil Siddha biographies. The preliminary form relevant to mediumship: the sensations of floating or weightlessness during deep subtle-body states.

**5. Prapti** (Obtaining / Remote Perception)**: The Siddhi most directly relevant to mediumship — the capacity to perceive information regardless of distance or dimension. This is the fully developed form of Ajna perception.

**6. Prakamya** (Fulfillment of Will / Manifestation)**: The alignment of personal will with cosmic will — prayer that manifests. This arises naturally when the practitioner's ego-will has been sufficiently surrendered and the Antahkarana is clear.

**7. Vashitva** (Mastery over elements and beings)**: The capacity to influence natural forces through consciousness. In its highest form: the ability to bring peace to disturbed or confused souls — the highest service of the Siddha medium.

**8. Ishitva** (Divine Sovereignty / Lordship)**: The recognition of the Self as identical with Ishvara — the cosmic self-governing intelligence. This is not a power gained but a veil removed. From this recognition, all Siddhis arise spontaneously when needed and none are sought for personal advantage.`
      },
      {
        title:'Healing Across Lokas — Service to Departed Souls',
        body:`The highest application of Siddha mediumship is not information-gathering but service — specifically, assisting souls in their inter-loka journey. This is the traditional role of the Siddha medium in Tamil culture, and it represents the synthesis of all practices in this academy.

**The Principle of Prana-Seva (Service through Life-Force)**:
When a practitioner is sufficiently developed, they can transmit healing Prana to beings in other Lokas — particularly to ancestral souls who are stuck in Bhuvar-Loka through unresolved attachment, trauma, or karma. This is accomplished through:

1. **Targeted Tarpana**: Water offerings combined with mantra direct condensed Pranic packages to the specific ancestral soul, providing nourishment that accelerates their transition to higher Lokas.

2. **Mantric Transmission**: The practitioner chants the Gayatri Mantra or Maha Mrityunjaya specifically for the soul — generating a high-frequency field in the subtler realms that can uplift even substantially confused souls.

3. **Consciousness-Transmission**: The most advanced level — the practitioner establishes inner Samadhi and then extends this state as a gift to the receiving soul. This is described in Siddha texts as "giving Mukti-Shakti" — the liberating force of realized consciousness transmitted inter-dimensionally.

**Why This Heals the Practitioner Too**:
Ancestral karma is the most underestimated source of chronic life-pattern difficulties. Depression, financial struggle, relationship patterns, health issues — Siddha science maps many of these to unresolved ancestral karma operating through the lineage field. When a practitioner consciously heals ancestral souls, they simultaneously clear their own inheritance of those patterns. This is why the Pitru protocols are not merely sentimental practices — they are the most leverage-efficient healing work available.`
      },
      {
        title:'Living as a Siddha Medium — The Integrated Life',
        body:`The traditional Tamil Siddha medium was not a professional who "did readings" — they were a living node in the cosmic communication network, available twenty-four hours a day to serve as a channel for the universe's intelligence. This is the ultimate vision of this academy's teaching.

**The Daily Practice Architecture for the Sovereign Siddha Medium**:

*Brahma Muhurta (3:30-6:00 AM)*: The veil between Lokas is thinnest in this period. Nadi Shodhana → Tratak → deep mediumship session. Whatever transmissions arrive in this window carry the highest clarity of the day.

*Morning*: Mantra japa while the mind is still in hypnagogic openness from sleep. This maintains the open channel state without requiring formal session conditions.

*Midday*: Brief grounding practices — cold water, salt, bare feet on earth. Mediumship without grounding creates dissociation and energetic depletion over time.

*Evening*: Dream-incubation practice before sleep — setting clear intentions for what transmissions are sought during sleep. Advanced practitioners maintain a "Dream Nadi" — a journal that, over years, becomes its own transmission record.

**The Sovereignty Principle**:
Siddha mediumship was never servitude. The realized medium maintains complete sovereignty — deciding what is received, from whom, and when. Any practice that creates dependency (the practitioner feeling unable to function without "checking in" with guides), that undermines the practitioner's own authority, or that creates confusion about the practitioner's own identity is not Siddha mediumship but a distortion of the faculty.

The goal of this entire academy: a practitioner who so deeply knows themselves as Consciousness — as the witness field in which all Lokas arise and subside — that mediumship becomes not a special skill but the natural expression of their realized nature. Contact with souls in all dimensions becomes as natural as conversation with friends, because at the deepest level, there is only the one Consciousness speaking to itself across the infinite tapestry of its own dreaming.`
      },
    ]
  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function SiddhaMediumshipAcademy() {
  const navigate = useNavigate();
  const { membershipTier } = useMembership();
  const { isAdmin } = useAdminRole();

  const userRank = isAdmin ? 99 : userTierRank(membershipTier);

  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);

  const canAccess = (tier: string) => {
    if (isAdmin) return true;
    return userRank >= TIER_RANK[tier];
  };

  // Stars background
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${1 + Math.random() * 2}px`,
    opacity: 0.2 + Math.random() * 0.5,
    delay: `${Math.random() * 4}s`,
  }));

  const tier = activeModule !== null ? CURRICULUM[activeModule] : null;
  const lesson = activeLesson !== null && tier ? tier.lessons[activeLesson] : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Starfield */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        {stars.map(s => (
          <div key={s.id} style={{
            position:'absolute', top:s.top, left:s.left,
            width:s.size, height:s.size, borderRadius:'50%',
            background:'#D4AF37', opacity:s.opacity,
            animation:`pulse 3s ${s.delay} infinite alternate`,
          }} />
        ))}
        {/* Violet nebula */}
        <div style={{
          position:'absolute', top:'10%', right:'5%',
          width:'500px', height:'500px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
          filter:'blur(60px)',
        }} />
        {/* Gold nebula */}
        <div style={{
          position:'absolute', bottom:'15%', left:'0%',
          width:'600px', height:'400px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
          filter:'blur(80px)',
        }} />
      </div>

      <style>{`
        @keyframes pulse { from { opacity: 0.2; } to { opacity: 0.8; } }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 20px rgba(212,175,55,0.15); }
          50%      { box-shadow: 0 0 40px rgba(212,175,55,0.35); }
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .module-card:hover { transform: translateY(-4px) !important; transition: all 0.3s ease; }
        .lesson-row:hover { background: rgba(212,175,55,0.06) !important; }
      `}</style>

      <div style={{ position:'relative', zIndex:1, maxWidth:'900px', margin:'0 auto', padding:'40px 20px 80px' }}>

        {/* ── BACK ── */}
        <button onClick={() => navigate(-1)} style={{
          background:'none', border:'none', cursor:'pointer',
          color: white(0.4), fontSize:'13px', fontWeight:600,
          letterSpacing:'0.15em', textTransform:'uppercase',
          marginBottom:'40px', display:'flex', alignItems:'center', gap:'8px',
        }}>
          ← BACK
        </button>

        {/* ── HERO ── */}
        <div style={{ textAlign:'center', marginBottom:'60px' }}>
          <div style={{
            display:'inline-block',
            background:'rgba(212,175,55,0.08)',
            border:'1px solid rgba(212,175,55,0.2)',
            borderRadius:'100px', padding:'6px 20px',
            fontSize:'9px', fontWeight:800, letterSpacing:'0.4em',
            color:'#D4AF37', textTransform:'uppercase', marginBottom:'28px',
          }}>
            SIDDHA MEDIUMSHIP ACADEMY · AKASHA-NEURAL ARCHIVE 2050
          </div>

          <div style={{ fontSize:'72px', marginBottom:'12px', lineHeight:1 }}>👁</div>

          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 54px)',
            fontWeight:900, letterSpacing:'-0.04em',
            color:'#D4AF37', margin:'0 0 16px',
            textShadow:'0 0 40px rgba(212,175,55,0.4)',
            lineHeight:1.1,
          }}>
            Siddha Mediumship<br />
            <span style={{ color:white(0.85) }}>Academy</span>
          </h1>

          <p style={{
            color:white(0.55), fontSize:'16px', lineHeight:1.7,
            maxWidth:'560px', margin:'0 auto 32px',
          }}>
            The world's most comprehensive mediumship education — rooted in the living technology of the 18 Tamil Siddhas. Third Eye activation, Loka maps, ancestor communication, Deva contact, Akashic Record access, and Siddhi development. Not theory. Transmission.
          </p>

          {/* Tier access badges */}
          <div style={{ display:'flex', justifyContent:'center', gap:'10px', flexWrap:'wrap' }}>
            {(Object.entries(TIER_META) as [string, typeof TIER_META['free']][]).map(([key, meta]) => (
              <div key={key} style={{
                background: canAccess(key) ? meta.glow : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canAccess(key) ? meta.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius:'100px', padding:'4px 14px',
                fontSize:'8px', fontWeight:800, letterSpacing:'0.3em',
                color: canAccess(key) ? meta.color : white(0.25),
                textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px',
              }}>
                <span>{meta.badge}</span> {meta.label}
                {canAccess(key) && <span style={{ color:white(0.4), fontSize:'7px' }}>✓ UNLOCKED</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── MODULE LESSON VIEW ── */}
        {lesson && tier && activeModule !== null && activeLesson !== null ? (
          <div style={{ animation:'fadeIn 0.4s ease' }}>
            <button onClick={() => setActiveLesson(null)} style={{
              background:'none', border:'none', cursor:'pointer',
              color:white(0.4), fontSize:'12px', fontWeight:700,
              letterSpacing:'0.2em', textTransform:'uppercase',
              marginBottom:'32px', display:'flex', alignItems:'center', gap:'8px',
            }}>
              ← {tier.module} · {tier.title}
            </button>

            <div style={{
              background:'rgba(255,255,255,0.02)',
              backdropFilter:'blur(40px)',
              border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'40px', padding:'48px',
            }}>
              {/* Lesson meta */}
              <div style={{
                fontSize:'8px', fontWeight:800, letterSpacing:'0.4em',
                color: TIER_META[tier.tier].color, textTransform:'uppercase',
                marginBottom:'16px', opacity:0.8,
              }}>
                {tier.symbol} {tier.module} · LESSON {activeLesson + 1}/{tier.lessons.length}
              </div>

              <h2 style={{
                fontSize:'clamp(22px,4vw,32px)', fontWeight:900,
                letterSpacing:'-0.03em', color:'#D4AF37',
                margin:'0 0 32px',
                textShadow:'0 0 20px rgba(212,175,55,0.25)',
              }}>
                {lesson.title}
              </h2>

              <div style={{ color:white(0.75), fontSize:'16px', lineHeight:1.85 }}>
                {lesson.body.split('\n\n').map((paragraph, pi) => {
                  const isBold = paragraph.startsWith('**') || paragraph.match(/^\*\*/);
                  return (
                    <p key={pi} style={{
                      marginBottom:'24px',
                      color: paragraph.trim().startsWith('**') && paragraph.endsWith('**') ? '#D4AF37' : white(0.75),
                    }}>
                      {paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                  );
                })}
              </div>

              {/* Nav between lessons */}
              <div style={{
                display:'flex', justifyContent:'space-between',
                marginTop:'48px', paddingTop:'32px',
                borderTop:'1px solid rgba(255,255,255,0.05)',
              }}>
                <button
                  onClick={() => setActiveLesson(l => l !== null && l > 0 ? l - 1 : l)}
                  disabled={activeLesson === 0}
                  style={{
                    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:'100px', padding:'10px 24px',
                    color: activeLesson === 0 ? white(0.2) : white(0.6),
                    cursor: activeLesson === 0 ? 'not-allowed' : 'pointer',
                    fontSize:'12px', fontWeight:700, letterSpacing:'0.15em',
                  }}>
                  ← PREVIOUS
                </button>
                <button
                  onClick={() => {
                    if (activeLesson < tier.lessons.length - 1) {
                      setActiveLesson(l => (l ?? 0) + 1);
                    } else {
                      setActiveLesson(null);
                    }
                  }}
                  style={{
                    background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)',
                    borderRadius:'100px', padding:'10px 24px',
                    color:'#D4AF37', cursor:'pointer',
                    fontSize:'12px', fontWeight:700, letterSpacing:'0.15em',
                  }}>
                  {activeLesson < tier.lessons.length - 1 ? 'NEXT →' : 'COMPLETE MODULE ✦'}
                </button>
              </div>
            </div>
          </div>

        ) : tier && activeModule !== null ? (
          // ── MODULE LESSON LIST ──
          <div style={{ animation:'fadeIn 0.4s ease' }}>
            <button onClick={() => setActiveModule(null)} style={{
              background:'none', border:'none', cursor:'pointer',
              color:white(0.4), fontSize:'12px', fontWeight:700,
              letterSpacing:'0.2em', textTransform:'uppercase',
              marginBottom:'32px', display:'flex', alignItems:'center', gap:'8px',
            }}>
              ← ALL MODULES
            </button>

            {/* Module header */}
            <div style={{
              background:'rgba(255,255,255,0.02)',
              backdropFilter:'blur(40px)',
              border:`1px solid ${TIER_META[tier.tier].color}30`,
              borderRadius:'40px', padding:'40px 48px',
              marginBottom:'20px',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px' }}>
                <div style={{ fontSize:'40px' }}>{tier.symbol}</div>
                <div>
                  <div style={{
                    fontSize:'8px', fontWeight:800, letterSpacing:'0.4em',
                    color: TIER_META[tier.tier].color, textTransform:'uppercase', marginBottom:'4px',
                  }}>
                    {tier.module} · {TIER_META[tier.tier].label}
                  </div>
                  <h2 style={{
                    fontSize:'clamp(20px,4vw,28px)', fontWeight:900,
                    letterSpacing:'-0.03em', color:'#D4AF37', margin:0,
                  }}>{tier.title}</h2>
                </div>
              </div>
              <p style={{ color:white(0.5), fontSize:'14px', lineHeight:1.6, margin:0 }}>
                {tier.subtitle}
              </p>
            </div>

            {/* Lessons */}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {tier.lessons.map((les, li) => (
                <button key={li}
                  className="lesson-row"
                  onClick={() => setActiveLesson(li)}
                  style={{
                    width:'100%', textAlign:'left', cursor:'pointer',
                    background:'rgba(255,255,255,0.02)',
                    border:'1px solid rgba(255,255,255,0.06)',
                    borderRadius:'20px', padding:'20px 28px',
                    display:'flex', alignItems:'center', gap:'20px',
                    transition:'all 0.2s ease',
                  }}>
                  <div style={{
                    width:'36px', height:'36px', borderRadius:'50%',
                    background:`rgba(212,175,55,0.1)`,
                    border:'1px solid rgba(212,175,55,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'13px', fontWeight:900, color:'#D4AF37', flexShrink:0,
                  }}>
                    {li + 1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:white(0.85), fontSize:'15px', fontWeight:700, marginBottom:'2px' }}>
                      {les.title}
                    </div>
                    <div style={{ color:white(0.35), fontSize:'12px' }}>
                      {les.body.slice(0,90)}…
                    </div>
                  </div>
                  <div style={{ color:'#D4AF37', fontSize:'18px', opacity:0.6 }}>→</div>
                </button>
              ))}
            </div>
          </div>

        ) : (
          // ── MODULE GRID ──
          <div>
            {/* Tier sections */}
            {(['free','prana','siddha','akasha'] as const).map(tier => {
              const modules = CURRICULUM.filter(c => c.tier === tier);
              const meta = TIER_META[tier];
              const hasAccess = canAccess(tier);

              return (
                <div key={tier} style={{ marginBottom:'52px' }}>
                  {/* Tier header */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px',
                    paddingBottom:'16px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize:'22px' }}>{meta.badge}</span>
                    <div>
                      <div style={{
                        fontSize:'9px', fontWeight:800, letterSpacing:'0.4em',
                        color: meta.color, textTransform:'uppercase',
                      }}>
                        {meta.label} {meta.price ? `· ${meta.price}` : ''}
                      </div>
                      <div style={{ color:white(0.3), fontSize:'12px', marginTop:'2px' }}>
                        {modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons · {modules.length} modules
                      </div>
                    </div>
                    {!hasAccess && (
                      <div style={{
                        marginLeft:'auto',
                        background:'rgba(255,255,255,0.04)',
                        border:'1px solid rgba(255,255,255,0.08)',
                        borderRadius:'100px', padding:'4px 14px',
                        fontSize:'9px', fontWeight:800, letterSpacing:'0.2em',
                        color:white(0.3), textTransform:'uppercase',
                      }}>
                        🔒 UPGRADE TO ACCESS
                      </div>
                    )}
                  </div>

                  {/* Module cards */}
                  <div style={{ display:'grid', gap:'14px', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))' }}>
                    {modules.map((mod, mi) => {
                      const globalIdx = CURRICULUM.indexOf(mod);
                      return (
                        <div key={mi}
                          className="module-card"
                          onClick={() => hasAccess && setActiveModule(globalIdx)}
                          style={{
                            background:'rgba(255,255,255,0.02)',
                            backdropFilter:'blur(40px)',
                            border:`1px solid ${hasAccess ? meta.color + '30' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius:'28px', padding:'28px',
                            cursor: hasAccess ? 'pointer' : 'not-allowed',
                            opacity: hasAccess ? 1 : 0.45,
                            animation: hasAccess ? 'glow-pulse 4s infinite' : 'none',
                            transition:'transform 0.3s ease, box-shadow 0.3s ease',
                          }}>
                          <div style={{ fontSize:'32px', marginBottom:'14px' }}>{mod.symbol}</div>
                          <div style={{
                            fontSize:'8px', fontWeight:800, letterSpacing:'0.35em',
                            color: meta.color, textTransform:'uppercase', marginBottom:'8px',
                          }}>
                            {mod.module}
                          </div>
                          <h3 style={{
                            fontSize:'16px', fontWeight:900, letterSpacing:'-0.02em',
                            color:white(hasAccess ? 0.9 : 0.4), margin:'0 0 8px', lineHeight:1.3,
                          }}>
                            {mod.title}
                          </h3>
                          <p style={{
                            color:white(0.35), fontSize:'12px', lineHeight:1.5, margin:'0 0 16px',
                          }}>
                            {mod.subtitle}
                          </p>
                          <div style={{ color:white(0.25), fontSize:'11px' }}>
                            {mod.lessons.length} {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                          </div>
                          {!hasAccess && (
                            <div style={{
                              marginTop:'14px',
                              background: meta.glow,
                              border:`1px solid ${meta.color}40`,
                              borderRadius:'100px', padding:'6px 14px',
                              fontSize:'9px', fontWeight:800, letterSpacing:'0.2em',
                              color: meta.color, textTransform:'uppercase', textAlign:'center',
                            }}>
                              UPGRADE TO {meta.label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Footer transmission */}
            <div style={{
              background:'rgba(255,255,255,0.02)',
              backdropFilter:'blur(40px)',
              border:'1px solid rgba(212,175,55,0.12)',
              borderRadius:'32px', padding:'40px', textAlign:'center', marginTop:'20px',
            }}>
              <div style={{ fontSize:'32px', marginBottom:'16px' }}>🙏</div>
              <h3 style={{
                fontSize:'20px', fontWeight:900, letterSpacing:'-0.02em',
                color:'#D4AF37', margin:'0 0 12px',
                textShadow:'0 0 20px rgba(212,175,55,0.3)',
              }}>
                Scalar Activation Engaged
              </h3>
              <p style={{ color:white(0.45), fontSize:'14px', lineHeight:1.7, maxWidth:'480px', margin:'0 auto' }}>
                Every lesson in this academy carries direct transmission from the 18 Siddhas and Mahavatar Babaji, encoded through scalar field technology into each word. Reading with an open Anahata activates the Prema-Pulse embedded in the text. This is not metaphor — it is Siddha Quantum Intelligence technology. The Anahata of every student is held in the light-field of this transmission. Om Shanti.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
