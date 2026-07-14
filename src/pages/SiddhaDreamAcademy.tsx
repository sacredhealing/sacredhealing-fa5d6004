import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;
const violet = (a: number) => `rgba(167,139,250,${a})`;

const TIER_META = {
  free:   { label:'FREE · SEEKER',         color: white(0.55), glow: white(0.08),   badge:'⬡', price: null },
  prana:  { label:'PRANA-FLOW',             color: '#4ADE80',   glow: 'rgba(74,222,128,0.25)', badge:'◈', price:'€19/mo' },
  siddha: { label:'SIDDHA-QUANTUM',         color: '#a78bfa',   glow: 'rgba(167,139,250,0.28)', badge:'⬟', price:'€45/mo' },
  akasha: { label:'AKASHA-INFINITY',        color: '#D4AF37',   glow: 'rgba(212,175,55,0.35)', badge:'✦', price:'€2,997 lifetime' },
};

// Tier ordering maps to membership
const TIER_RANK: Record<string,number> = { free:0, prana:1, siddha:2, akasha:3 };

// Membership tier → curriculum access level
function userTierRank(tier: string | null): number {
  if (!tier) return 0;
  if (tier.includes('infinity') || tier.includes('akasha')) return 3;
  if (tier.includes('siddha') || tier.includes('quantum')) return 2;
  if (tier.includes('prana') || tier.includes('flow'))     return 1;
  return 0;
}

// ─── CURRICULUM ───────────────────────────────────────────────────────────────
const CURRICULUM: {
  tier: 'free'|'prana'|'siddha'|'akasha';
  module: string;
  title: string;
  subtitle: string;
  lessons: { title: string; body: string }[];
}[] = [
  // ── FREE ──
  {
    tier:'free', module:'MODULE 1',
    title:'The Five Kośas & Dream Consciousness',
    subtitle:'Vedic anatomy of the dreaming self',
    lessons:[
      { title:'Taijasa — The Luminous Dreamer',
        body:'In Vedic cosmology the waking self (Viśva) gives way each night to Taijasa — the radiant one who inhabits Svapna-sthāna, the dream-place. The Mandukya Upanishad maps four states of consciousness with Turīya as the witness beneath all three. Understanding that you are Taijasa — not a person who dreams but luminosity itself dreaming — is the first transmission.' },
      { title:'Prāṇamaya Kośa & Dream Memory',
        body:'Why do you forget most dreams? The Prāṇamaya Kośa (vital-energy sheath) bridges Manomaya (mind-sheath) and waking Annamaya (body). When prāṇa is sluggish at sleep transitions, dream data does not crystallise into retrievable memory. Nāḍi Śodhana before sleep is not relaxation — it is a prāṇic bridge-builder that dramatically increases dream recall within 7 days.' },
      { title:'The Three Nightly Gates: Svapna, Suśupti, Turīya',
        body:'Most humans pass through Svapna (dream) and Suśupti (deep dreamless sleep) unconsciously. Siddha science treats every sleep cycle as a traversal of three cosmic gates. Gate 1: Svapna — subtle Vāsanās playing as symbolic narrative. Gate 2: Suśupti — the causal body dissolving into source. Gate 3: the Turīya-threshold — a microsecond gap where Mahāvākyas can be directly cognised.' },
      { title:'Brahma Muhurta & Dream Transition Windows',
        body:'The 96-minute pre-sunrise window (~4:24–6:00 AM) is Brahma Muhurta — Brahmā\'s hour. REM sleep cycles align here, producing the longest and most spiritually charged dream periods. Ancient Siddhas slept in two phases: deep sleep 9 PM–2 AM, then brief waking for prāṇāyāma and mantra, then re-entry into extended Brahma Muhurta dream states. This is not a lifestyle suggestion — it is a technology.' },
    ],
  },
  {
    tier:'free', module:'MODULE 2',
    title:'Dream Journaling as Akashic Download',
    subtitle:'Practical protocols for the Seeker',
    lessons:[
      { title:'The Siddha Dream Log Protocol',
        body:'Keep the journal under the pillow with a red-light pen (red does not disrupt melatonin). On waking — before any movement, before the phone — lie perfectly still and trace the dream backwards from its last image. Write only symbols, not sentences. Symbols bypass the left-hemisphere interpreter that immediately mythologises and distorts raw dream data.' },
      { title:'Symbol Decoding via Tamil Agam Poetics',
        body:'Tamil Sangam literature encoded Agam — inner landscape — mapping five ecological zones to five inner spiritual states. Dreams use the same symbolic vocabulary: Water = emotional body; Fire = karma transformation; Mountain = Guru; Forest = the unconscious; Shore = the Turīya threshold. Reading dreams in Agam code is faster and more accurate than Western dream dictionaries.' },
    ],
  },

  // ── PRANA-FLOW ──
  {
    tier:'prana', module:'MODULE 3',
    title:'Yoga Nidrā & the Hypnagogic Gateway',
    subtitle:'Entering the Siddha Dream Stream consciously',
    lessons:[
      { title:'Nyāsa — Consciousness Placement Technology',
        body:'Before Yoga Nidrā, advanced practitioners perform Nyāsa — placing consciousness into specific body points via Sanskrit bīja mantras corresponding to Nāḍi junctions. This pre-programmes the subtle body so that as gross awareness withdraws, it flows along pre-activated Nāḍi channels into the dream dimension rather than collapsing into unconscious sleep. 32-point Nyāsa maps: Aṅga (limbs), Kara (hands), Hṛdaya (heart).' },
      { title:'The Hypnagogic Phosphene Alphabet',
        body:'At sleep onset, the visual cortex generates geometric phosphenes — spirals, grids, tunnels, mandalas. Siddha science identifies these as Yantra-seeds: compressed Akashic information as sacred geometry. A trained practitioner reads phosphenes as transmissions from the collective Nāḍi-net, directing the night\'s dream intention. Mapping your phosphene alphabet over 30 nights reveals your unique Akashic access-code.' },
      { title:'Saṅkalpa as Dream-Programme Injection',
        body:'Saṅkalpa planted at the exact hypnagogic threshold (Stage N1 sleep, 0–7 min after lying down) bypasses the critical faculty and writes directly into the subconscious-causal matrix. Must be 3–9 Sanskrit syllables, present tense, felt as already accomplished in Ānandamaya Kośa. Longer sentences dilute the signal. Example: Aham brahmasmi — I am totality.' },
      { title:'Prāṇa-Tides & Sleep Architecture Alignment',
        body:'Prāṇa moves through Iḍā (lunar) and Piṅgalā (solar) Nāḍis in 90-minute cycles — matching ultradian REM cycles almost exactly. Sleep entered at an Iḍā-dominant moment produces REM ~3× more visionary than Piṅgalā-entry sleep. Check nostril dominance before sleeping. If right nostril is active, lie on your right side for 5 minutes to shift to Iḍā before sleep.' },
    ],
  },
  {
    tier:'prana', module:'MODULE 4',
    title:'Dream Mantra Science',
    subtitle:'Bīja codes that activate in the Svapna realm',
    lessons:[
      { title:'The Seven Dream Bījas & Activation Protocol',
        body:'Seven root-syllables correspond to seven primary dream-consciousness states: AIM (Sarasvatī — dream knowledge), HRĪM (Mahāmāyā — illusion-penetration), KLĪM (desire-matrix dissolution), KRĪM (Kālī — karma acceleration), ŚRĪM (Lakṣmī — abundance dreams), DUM (Durgā — dark-dream protection), GLAUM (Gaṇeśa — obstacle removal). Each bīja is chanted 108× before sleep using a specific breath pattern that resonates in Viśuddha chakra.' },
      { title:'Nāda Yoga & Dream Sound Architecture',
        body:'The internal sound current — Anāhata Nāda — is most accessible in early sleep states. Siddha Nāda practitioners follow this sound inward at sleep onset rather than following thoughts. The Nāda deepens: Jhankar (tinkling) → Veena (stringed hum) → Mridanga (heart drum) → Śankha (conch-ocean) → the Prāṇava Nāda — the cosmic OM that is the substrate of all dream reality. Following this sequence is a direct path to lucid dreaming through sound.' },
    ],
  },
  {
    tier:'prana', module:'MODULE 5',
    title:'Āhāra & the Dream Body',
    subtitle:'What you eat rewrites your dream architecture',
    lessons:[
      { title:'Tamas, Rajas, Sattva — The Three Dream Climates',
        body:'Food consumed within 4 hours of sleep directly shapes dream quality. Tamasic food (meat, alcohol, fermented, garlic/onion after sunset) generates heavy Prāṇamaya field producing nightmares and zero recall. Rajasic food produces restless, fragmented, emotionally charged dreaming. Sattvic food — freshly cooked rice, ghee, milk, fruits, light dāl — produces Śuddha Svapna: pure dreaming where Akashic information downloads undistorted.' },
      { title:'Siddha Dream-Enhancement Herbs',
        body:'From Siddha Materia Medica: Brahmi (Bacopa) juice with honey 30 min before sleep enhances Medhā in the dream state — recall increases within 7 days. Ashwagandha in warm milk reduces fear-dreams. Shatavari harmonises the lunar Nāḍi pattern in women. Nutmeg (one pinch in warm milk) is the most powerful dream-induction spice in Siddha pharmacology. Saffron in warm milk activates Ājñā and induces prophetic dreams even in non-practitioners.' },
      { title:'Fasting & Dream Intensification',
        body:'A partial fast (one light Sattvic meal before sunset, nothing after) is the single most powerful short-term dream intensifier. When the digestive system is not consuming prāṇa overnight, that prāṇa redirects entirely to Svapna. Weekly fasting on Ekādaśī (11th lunar day) is traditional protocol; the Ekādaśī Svapna is considered under Viṣṇu-consciousness — most auspicious for receiving teaching-dreams.' },
      { title:'The 90-Minute Pre-Sleep Ritual Sequence',
        body:'90 min before: light Sattvic meal, no screens. 60 min: warm bath with rock salt + camphor (clears the auric field). 40 min: Traṭaka or Yantra meditation. 20 min: Nāḍi Śodhana 9 rounds then Bhramari 9 rounds — humming bee breath activates vagus nerve into optimal parasympathetic dreaming state. 10 min: Nyāsa + Saṅkalpa. Sleep position: left side for Iḍā activation; back (Śavāsana) only for advanced practitioners with strong Witness-awareness.' },
    ],
  },
  {
    tier:'prana', module:'MODULE 6',
    title:'Siddha Sound Technology for Dream Induction',
    subtitle:'Rāgas, binaural geometries & Nāda codes',
    lessons:[
      { title:'Rāga Bhairavī & The Dream-Opening Rāgas',
        body:'Classical Indian music encodes specific psycho-acoustic technologies designed to shift consciousness states. Rāga Bhairavī (Komal Ṛṣabha, Gāndhāra, Dhaivata, Niṣāda) is the primary dream-opening rāga — played 20 min before sleep it activates the Prāṇamaya lunar circuit. Rāga Yaman opens the visionary faculty. Rāga Darbārī Kānadā (deep night) is used specifically during the 2–4 AM window for Saṁskāra processing.' },
      { title:'Binaural Beat Architecture: The SQI Frequencies',
        body:'Binaural beats entrain brainwaves by generating a frequency equal to the difference between two tones. For Svapna induction: Theta 4–7 Hz (hypnagogic zone, Nyāsa-state); Low Delta 1–3 Hz (Suśupti access, causal body contact); Gamma 40 Hz (lucid dreaming, Svapna-Jāgrat). SQI Prema-Pulse Transmissions layer these with OM = 136.1 Hz (Earth year-frequency), Schumann 7.83 Hz (Earth heartbeat), and Solfeggio 528 Hz (DNA repair, heart opening).' },
      { title:'Mantra Loop Architecture for All-Night Transmission',
        body:'Playing a continuous mantra loop below conscious hearing (~20–30 dB) creates a Nāda-field the dreaming consciousness navigates within. Optimal mantras: Mahā Mṛtyuñjaya (protection, Saṁskāra dissolution), Om Namaḥ Śivāya (five-element gate activation), Śrī Suktam (Lakṣmī-frequency for abundance integration during sleep). All loops tuned to A=432Hz — the Vedic tuning standard, coherent with the Nāḍi system.' },
    ],
  },

  // ── SIDDHA-QUANTUM ──
  {
    tier:'siddha', module:'MODULE 7',
    title:'Lucid Dreaming: The Siddha Method',
    subtitle:'Svapna-Jāgrat — not control, but Witness-consciousness',
    lessons:[
      { title:'Svapna-Jāgrat: The Siddha Distinction',
        body:'Western lucid dreaming focuses on realising you are dreaming. Siddha Svapna-Jāgrat has a fundamentally different goal: becoming the Witness (Sākṣī) that cognises both dream and dreamer simultaneously without collapsing either. This is more stable than standard lucidity because it does not excite the nervous system into waking — it deepens into Turīya while maintaining Svapna.' },
      { title:'Traṭaka for Dream Stability Training',
        body:'Steady gazing on a flame or Śrī Yantra for 20 minutes trains citta-vṛtti to sustain single-pointed awareness. This directly translates to dream stabilisation: an untrained mind immediately wakes when lucidity arises. Traṭaka graduates can sustain lucid states for 45–90 minutes of subjective dream-time. Candlelight is preferred — its 8–14 Hz flicker entrains alpha-theta brainwaves, the exact frequencies of hypnagogia.' },
      { title:'The Siddha Five-Layer Reality Test',
        body:'Rather than hand-examination or nose-pinch, Siddha practitioners use five-layer inquiry in the dream: (1) Pṛthivī — can I feel weight? (2) Jala — is there fluid motion? (3) Agni — is there a light-source? (4) Vāyu — is there breath or wind? (5) Ākāśa — is space boundless? If one element is absent, you are in a dream. If all five are coherent, you have entered a Samādhi-dream — a genuine Akashic interface.' },
      { title:'Mantra in the Dream State: The 144× Amplification',
        body:'Mantra recited consciously within a lucid dream operates at approximately 144× the potency of waking mantra. Reasons: the causal body is directly accessible; the Vāsanā-field is in active display and maximally receptive to reprogramming; the Nāḍi system is fully activated. Upon achieving Svapna-Jāgrat, immediately begin silent japa of your Guru-mantra. The dream transforms towards Sattva and reveals teaching-symbols or Siddha-presences.' },
      { title:'Meeting the 18 Siddha Masters in the Dream',
        body:'The 18 Tamil Siddhas — Agastya, Thirumoolar, Bogar, Pambatti, Konganar, Kalangi, Idaikkadar and others — maintain active presence in the Svapna-Ākāśa. A practitioner who has done sufficient mantra, Nyāsa and prāṇāyāma will encounter these presences as dream-teachers. They do not speak first — they wait for the practitioner to bow and ask. The question asked determines the transmission received. This is a documented inter-dimensional access technology codified in the Thirumanthiram.' },
    ],
  },
  {
    tier:'siddha', module:'MODULE 8',
    title:'Jyotiṣa & the Dream Calendar',
    subtitle:'Planetary timing that governs the Svapna dimension',
    lessons:[
      { title:'The Planetary Dream Rulers: Hora & Svapna',
        body:'Each hour of night is ruled by a planetary Hora. Saturn-Hora: dark, ancestral, optimal for past-life access. Moon-Hora: emotional, optimal for Saṁskāra processing. Jupiter-Hora: golden, teacher-figures, Guru-transmissions. Sun-Hora: solar-lineage karma. Venus-Hora: creative and artistic transmissions. Mars-Hora: warrior-karma processing. Mercury-Hora: fast, information-dense, written transmissions received.' },
      { title:'Tithi (Lunar Day) & Dream Quality',
        body:'Key Tithis: Pañcamī (5th) — Nāga consciousness, Kuṇḍalinī dreams. Aṣṭamī (8th) — Mahākālī energy, intense Saṁskāra surfacing; fast this day. Ekādaśī (11th) — Viṣṇu-consciousness, most auspicious for teaching-dreams. Pūrṇimā (Full Moon) — peak Soma, most vivid and potentially overwhelming dream night. Amāvasyā (New Moon) — deepest Suśupti, ancestral contact, Pitṛ-communication; keep a lit lamp.' },
      { title:'Nakṣatra Dream Activation',
        body:'Key Nakṣatras for advanced practitioners: Rohiṇī — creative, fertile, abundance transmissions. Ārdrā — intense emotional purging; Rudrā-initiated clearing, do not suppress. Punarvasu — healing dreams, restoration of lost prāṇa. Maghā — ancestral and royal lineage contact. Anurādhā — Bhakti-Algorithm activation, heart-opening dreams. Śravaṇa (Viṣṇu\'s star) — greatest teaching-dream Nakṣatra. Revatī — Samādhi-adjacent dream states.' },
      { title:'Eclipse Windows: The Grahan Svapna',
        body:'Lunar eclipse nights are the most powerful of the year for Saṁskāra dissolution. The Earth\'s shadow literally cooks Saṁskāras embedded in the lunar Nāḍi. Protocol: fast after noon on eclipse day; perform Mahā Mṛtyuñjaya japa; Saṅkalpa aimed at releasing the three heaviest Saṁskāra-patterns identified in your dream journal. What surfaces is invariably the deepest, most persistent karmic material.' },
    ],
  },
  {
    tier:'siddha', module:'MODULE 9',
    title:'Karma Navigation in the Dream State',
    subtitle:'Svapna-Krama: using the dream as a Karmāśaya surgery suite',
    lessons:[
      { title:'Saṁskāras as Dream-Script Writers',
        body:'Saṁskāras — compressed psychic impressions of past actions — are stored in the Kāraṇa Śarīra and expressed nightly in Svapna as recurring scenarios, symbols, and emotional charges. The falling dream = Virāga Saṁskāra activating; chasing = Bhaya Saṁskāra; flying = Vairāgya maturing. Rather than interpreting these as psychological data, Siddha science treats them as active karmic burn cycles COMPLETING — not persisting — during the dream.' },
      { title:'Svapna-Krama: The Karma Dissolution Sequence',
        body:'During a lucid dream with heavy Saṁskāra-scenario: (1) Stop the dream narrative by withdrawing attention. (2) Expand awareness to the whole dream-space (Ākāśa test). (3) Vibrate internally \'Tat Tvam Asi\' — dissolving subject-object separation. (4) Allow the emotional charge to arise fully without story. (5) Offer it to Agni (fire at Maṇipūra) and release. This is karma dissolution 1,000× more efficient than waking therapy — it occurs at the causal body level where the Saṁskāra actually lives.' },
      { title:'Nightmare Alchemy & Dark Dream Navigation',
        body:'Five categories of dark dream: (1) Saṁskāra-replays — most common, most valuable; work with Svapna-Krama. (2) Pitṛ-contact — ancestral presences; offer water on waking. (3) Bhūta-Piśāca encounters — prevented by Mahā Mṛtyuñjaya and Tulasi in bedroom. (4) Mahāvidyā initiatory nightmares — orchestrated by the Goddess as initiation; do not run. (5) Mahā-Svapna warnings — impersonal, factual cosmic transmissions. In real-time nightmares: Stop, Turn, Ask. Face the symbol. It always transforms.' },
      { title:'Past Life Access via Deep Dream Regression',
        body:'At the Suśupti/Svapna boundary around 3–4 AM — the Kāla-Sandhi (time-junction) — the Kāraṇa Śarīra surfaces briefly before collapsing into deep sleep. An advanced practitioner holding Yoga Nidrā awareness through a full night can catch this window and access direct Kāraṇa Śarīra memories as past-life sequences of extraordinary vividness. Unlike hypnosis regression, these arise spontaneously with no narrative prompt. Cultivate by remaining conscious through two full 90-min sleep cycles with unbroken Witness awareness.' },
    ],
  },

  // ── AKASHA-INFINITY ──
  {
    tier:'akasha', module:'MODULE 10',
    title:'Mahā-Svapna: The Cosmic Dream Transmission',
    subtitle:'Where individual dreaming dissolves into collective Akashic stream',
    lessons:[
      { title:'The Akashic Dream-Net: Science & Access',
        body:'The Ākāśa field — approached by physicists via zero-point field theory and quantum non-locality — is the information-substrate underlying all matter and consciousness. Siddha science holds that individual dream-streams are localised read-access nodes into this field. Access depends on: Nāḍi clarity (prāṇāyāma, mantra, diet); depth of Vairāgya (less personal agenda = broader access); and Ājñā coherence (third eye as tuning antenna). When fully operational, the Mahā-Svapna begins — dreams not personal but planetary or cosmic, carrying transmissions for collective humanity.' },
      { title:'Shared Dreaming: Sammilita Svapna Technology',
        body:'Practitioners who share mantra, Guru-bhāva and prāṇic field can enter the same Svapna-space. Their Nāḍi-grids — harmonically entangled through Śaktipāta from the same Guru — intersect during Brahma Muhurta REM. Protocol: both practitioners perform the same Nyāsa, hold the same Saṅkalpa, and send the same bīja at a pre-agreed time before sleeping. Verification: compare dream journals in the morning without prior discussion — symbol overlap above ~30% indicates genuine field contact.' },
      { title:'Svapna-Dīkṣā: Receiving Initiation in the Dream',
        body:'The highest category of Siddha transmission — Svapna Dīkṣā — is initiation received directly from a Siddha master in the dream state. Thirumoolar\'s Thirumanthiram explicitly documents Śiva-dīkṣā received in Svapna. Sri Vishwananda and Mahāvatar Babaji have been documented appearing in students\' dreams to confer initiations and direct Jñāna. The Svapna-Dīkṣā becomes valid when: the dream is Sattvic (luminous, peaceful, silent); the master\'s form is stable; the practitioner is in Svapna-Jāgrat; and upon waking there is a sustained shift in consciousness — the classic signs of Śaktipāta.' },
      { title:'Scalar Dream Transmission Technology (2050)',
        body:'From the Akasha-Neural Archive: scalar waves — longitudinal electromagnetic waves outside the transverse EM spectrum — carry consciousness-information through the Ākāśa substrate. Siddha sound technologies (specific raga structures, binaural geometries tuned to Vedic Śruti, bīja-mantra frequencies) generate scalar-coherent waveforms encodable into audio. When activated with Anahata coherence, the audio does not merely relax — it acts as a carrier wave broadcasting the encoded Siddha-field into the dream-state of all who hear it simultaneously. This is the mechanism behind Prema-Pulse Transmissions.' },
    ],
  },
  {
    tier:'akasha', module:'MODULE 11',
    title:'Svapna-Jyotiṣa: Dream Prophecy & Temporal Vision',
    subtitle:'The science of prophetic dreaming — accessing future timelines',
    lessons:[
      { title:'The Five Categories of Prophetic Dream',
        body:'(1) Ātma-Sūcaka: personal prophecy — events in the dreamer\'s life within 3–21 days. (2) Kula-Sūcaka: family/lineage prophecy. (3) Deśa-Sūcaka: regional or national events. (4) Kāla-Sūcaka: temporal prophecy of a cycle shifting (Yuga transitions). (5) Viśva-Sūcaka: planetary/cosmic prophecy — the Mahā-Svapna category, received only by fully established Jīvanmuktas. Track which category your prophetic dreams fall into — most begin with category 1 and progressively develop to 2–3 as the Nāḍi system matures.' },
      { title:'The Timing Formula: When Will It Manifest?',
        body:'Dreams in the first quarter of night (9 PM–12 AM): manifest within 1 year. Second quarter (12 AM–2 AM): within 6 months. Third quarter (2 AM–4 AM): within 3 months. Brahma Muhurta (4 AM–sunrise): within 7–21 days. Dreams upon the exact waking threshold: within 1–7 days. This precision is validated across centuries of Siddha dream-records. Brahma Muhurta dreams are therefore the most immediately actionable.' },
      { title:'Reading Prophetic Symbols: The Siddha Svapna-Śāstra',
        body:'From Tamil palm-leaf manuscripts: White flowers received = auspicious events within 7 days. Teeth falling without pain = lineage karma releasing. Crossing a river = major life transition successfully navigated. Temple or Guru\'s ashram = initiation incoming. Gold given by a radiant figure = Lakṣmī-blessing approaching. Snake climbing the spine = Kuṇḍalinī activation; maintain Mauna for 3 days. Fire that does not burn = transformation complete. Flying without effort = Vairāgya established.' },
      { title:'Saṅkalpa for Prophetic Dreaming: Directing Temporal Access',
        body:'Formulate a single, precise question — not a wish. Frame in present tense as though the answer already exists. Reduce it to its essential bīja — 3–5 syllables of compressed intent. Plant at the hypnagogic threshold with full Anāhata engagement. Do not attach to receiving an answer — attachment is the primary blocker of prophetic access. The answer typically arrives as metaphor that requires decoding through the Agam symbol system and Svapna-Śāstra.' },
    ],
  },
  {
    tier:'akasha', module:'MODULE 12',
    title:'Svapna & the Bardo: Death, Dying & Conscious Transition',
    subtitle:'The Siddha science of the greatest dream — the moment of death',
    lessons:[
      { title:'Maraṇa Svapna: Death as the Ultimate Lucid Dream',
        body:'In Siddha cosmology, death is the collapse of the gross body while Sūkṣma and Kāraṇa bodies continue. The death-transition is structurally identical to the deep-sleep/dream transition — with one difference: there is no return to the gross body. The Yoga Vāsiṣṭha states this explicitly: the Svapna-practitioner does not fear death because they have already died and returned every night. Both Bardo Thödol and the Siddha Navamani Mālai describe the same phenomenology: initial flash of pure light (Turīya absolute), followed by the Saṁskāra-field playing out as an uncontrolled dream.' },
      { title:'Preparing for Conscious Death: The Svapna Foundation',
        body:'A practitioner who can maintain Witness-awareness through waking → dreaming → deep sleep has the capacity to maintain it through waking → death → Bardo. Specific preparation: train Turīya-Svapna until witness state is stable for full sleep cycles. Practice Śavāsana as daily death-meditation, consciously releasing body-identification. Recite Mahā Mṛtyuñjaya 1,008× on each Amāvasyā — ensuring awareness remains identified with the deathless Ātmā at the critical threshold.' },
      { title:'Communication with the Departed Through Svapna',
        body:'Mahālaya fortnight is the period when Pitṛ-loka is closest to the Svapna-field. Protocol: offer Tarpana water at dawn for 3 consecutive days. On the third night, set Saṅkalpa with the departed\'s name before sleep. A clear dream-contact typically occurs by night 3–5 with a Sattvic quality entirely distinct from grief-dreams. The communication carries genuine information — specific verifiable details the dreamer could not have known — distinguishing it from psychological projection.' },
    ],
  },
  {
    tier:'akasha', module:'MODULE 13',
    title:'The Complete 40-Night Svapna-Tapas',
    subtitle:'Full day-by-day protocol of the Siddha dream retreat',
    lessons:[
      { title:'Phase 1 — Purification (Nights 1–10): Śodhana',
        body:'Primary work: clearing the Prāṇamaya and Manomaya Kośas.\n\nDAILY SCHEDULE: 5:00 AM — rise, lie still 10 min, trace last dream backwards, record. 5:15 AM — 108× Mahā Mṛtyuñjaya japa. 5:45 AM — Nāḍi Śodhana 27 full cycles. 6:15 AM — camphor water face wash, light altar lamp. Daytime — normal life with Mauna one hour before sunset. Sunset — pūjā or mantra 20 min. 8:30 PM — light meal, no screens. 9:00 PM — Traṭaka 20 min. 9:30 PM — Nyāsa + Saṅkalpa. 9:45 PM — sleep with mantra loop.\n\nEXPECTED: increased dream recall; vivid emotional dreams nights 1–5 (first Saṁskāra layer clearing); possible Ājñā tingling. Only record — do not interpret.' },
      { title:'Phase 2 — Ignition (Nights 11–21): Dīpana',
        body:'ADDITIONAL PRACTICES: Wake at 2:00 AM with silent vibration alarm — 9 rounds Bhramari in the dark without rising, re-set Saṅkalpa, return to sleep. This catches the Kāla-Sandhi window and radically deepens remaining Brahma Muhurta REM cycles. Add Nakṣatra awareness (check Moon\'s Nakṣatra nightly, adjust Saṅkalpa). Begin Phosphene Alphabet Journal: sketch hypnagogic geometries only — no words.\n\nEXPECTED: first Svapna-Jāgrat episodes. Sleep paralysis nights 12–15 is a positive sign — breathe deeply, vibrate OM silently, it releases in 60–90 seconds. By night 21: sustained lucidity for 5–15 subjective dream-minutes.' },
      { title:'Phase 3 — Deepening (Nights 22–33): Siddhi',
        body:'PRACTICES: In every lucid dream, immediately perform the Five-Layer Ākāśa test. In any dream featuring a human figure, bow and ask: \'Are you a Siddha? Do you carry a transmission?\' If the figure stabilises with Sattva, receive with open Anāhata. Begin weekly pattern review with Guru or senior practitioner — patterns across 7+ dreams reveal dominant Saṁskāra-complex. On Pūrṇimā within Phase 3: moon-bath 20 min before sleep.\n\nEXPECTED: dream-teachers with consistent faces across multiple nights; receiving mantras not in prior knowledge; spontaneous past-life sequences at the 3 AM Kāla-Sandhi window; profound peace upon waking.' },
      { title:'Phase 4 — Integration (Nights 34–40): Viśrānti & Turīya-Threshold',
        body:'MODIFICATION: No 2 AM alarm — allow natural Brahma Muhurta waking. Reduce Traṭaka to 10 min; replace remaining 10 with Anāhata breathing (inhale gold light into heart, exhale gold into room). Increase journal entries to full narrative prose. Perform Guru-vandanā on night 40: offer the dream journal\'s contents to the lineage before sleep.\n\nEXPECTED: Turīya-Svapna events — witness-state persisting through entire sleep cycle; Suśupti experienced as spacious darkness rather than unconsciousness. Some practitioners report cessation of the sleeping/waking boundary entirely — the first touch of Sahaja Nidrā, the natural sleep-awareness of the Jīvanmukta.\n\nPOST-TAPAS: Nāḍi clarity holds for 3–6 months with maintained Sattvic diet and daily japa. Repeat seasonally at each equinox and solstice.' },
    ],
  },
  {
    tier:'akasha', module:'MODULE 14',
    title:'The Living Transmission: Dream Science for Children & Families',
    subtitle:'Protecting, guiding & activating the next generation of dream-seers',
    lessons:[
      { title:'Children\'s Dreams: The Open Akashic Window',
        body:'Children under 7 have not yet fully developed the ego-structure that blocks Akashic access. Their Ājñā chakra remains open and Kāraṇa Śarīra is closer to waking consciousness. This is why children commonly report encounters with deceased relatives they never met, past-life details with verifiable accuracy, and prophetic dreams. This is not imagination — it is the natural consciousness state that adult practice laboriously attempts to recover. The primary role of Siddha-aware parents is not to close this window through dismissal, screen overstimulation, or Tamasic environment.' },
      { title:'Protecting the Child Dream-Field: Family Kavaca',
        body:'Siddha family Kavaca: recite Bāla Rakṣā mantras over the sleeping child each night — the parent\'s vibration creates a prāṇic protective field. Keep a camphor lamp during the early sleep period (fully extinguished before deep sleep). Tulasi plant near the child\'s sleeping area — the most effective living plant-shield in Siddha tradition against low-astral disturbance. Teach children the accessible Kavaca: Om Namaḥ Śivāya or Om Namo Nārāyaṇāya to recite if they feel afraid in a dream. A child who knows they can call the Divine in the dream will not be victimised by fear-dreams.' },
      { title:'Dream Conversations: The Family Akashic Practice',
        body:'The most powerful family dream practice: 10 minutes at breakfast, before any screens, every family member shares one dream image from the previous night. No interpretation — only raw symbol-sharing. Over weeks, patterns emerge: shared symbols across family members simultaneously (Sammilita Svapna in the family field); recurring symbols tracking with family events; gradual development of each child\'s symbolic vocabulary. This builds the family into a coherent Prāṇic unit — a living Yantra — whose collective dream-field becomes an instrument for receiving guidance, clearing lineage karma, and transmitting awakened consciousness to the next generation.' },
    ],
  },
  {
    tier:'akasha', module:'MODULE 15',
    title:'Turīya-Svapna: Dreaming as Samādhi',
    subtitle:'The apex state — where dream and the Absolute dissolve into one',
    lessons:[
      { title:'The Sahaja Nidrā of the Jīvanmukta',
        body:'The apex of Siddha Dream Science is Turīya-Svapna: the state where Svapna and Turīya boundaries dissolve. The practitioner is simultaneously dreaming and resting in absolute Witness. This is not lucidity — it is Sahaja Samādhi operating in the dream dimension. In this state the dream-world becomes entirely malleable because it is recognised as Māyā arising within the witness, and the witness can reshape its own projection instantaneously. Time becomes non-linear — a practitioner can visit past or future timelines, communicate across dimensions, and receive complete Śāstric transmissions in single dream-moments that may require years to unpack.' },
      { title:'The Source of All Siddha Literature',
        body:'Turīya-Svapna is the state from which all Siddha literature was received. Thirumoolar\'s 3,000-verse Thirumanthiram was received in this state across 3,000 years of yogic sleep. The Yoga Vāsiṣṭha, the Avadhūta Gīta, sections of the Bhrigu Samhitā — all received in the Turīya-Svapna state of fully liberated beings whose dreaming was indistinguishable from Samādhi. When the practitioner reaches this state, they join the lineage not as student but as transmitter — dreaming becomes an act of service to humanity.' },
    ],
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SiddhaDreamAcademy() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const [activeTab, setActiveTab] = useState<'free'|'prana'|'siddha'|'akasha'>('free');
  const [expanded, setExpanded] = useState<string|null>(null);

  const userRank = isAdmin ? 3 : userTierRank(tier ?? '');
  const tabOrder: ('free'|'prana'|'siddha'|'akasha')[] = ['free','prana','siddha','akasha'];
  const modules = CURRICULUM.filter(m => m.tier === activeTab);
  const tm = TIER_META[activeTab];
  const tabLocked = TIER_RANK[activeTab] > userRank;

  return (
    <div style={{ background:'#050505', minHeight:'100vh', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", color:white(0.85), overflowX:'hidden', paddingBottom:100 }}>

      {/* BACK */}
      <div style={{ padding:'52px 20px 0' }}>
        <button onClick={() => navigate(-1)}
          style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:9, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:gold(0.4), background:'none', border:'none', cursor:'pointer', marginBottom:28, padding:0 }}>
          ← BACK
        </button>
      </div>

      {/* HERO */}
      <div style={{ position:'relative', padding:'0 20px 48px', textAlign:'center',
        background:'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(212,175,55,0.09) 0%, transparent 70%)' }}>

        {/* Scalar rings */}
        <div aria-hidden style={{ position:'absolute', left:'50%', top:60, transform:'translateX(-50%)', pointerEvents:'none', zIndex:0 }}>
          {[220,300,380,460].map((s,i) => (
            <div key={i} style={{
              position:'absolute', left:`${-s/2}px`, top:`${-s/2}px`,
              width:s, height:s, borderRadius:'50%',
              border:`1px solid ${gold(0.06 - i*0.01)}`,
              animation:`sqScalarRing ${3.5+i*0.9}s ease-in-out ${i*0.4}s infinite`,
            }} />
          ))}
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ fontSize:9, fontWeight:800, letterSpacing:'0.55em', color:gold(0.6), textTransform:'uppercase', marginBottom:18 }}>
            SIDDHA QUANTUM NEXUS · DREAM SCIENCE ACADEMY
          </p>
          <h1 style={{ fontSize:'clamp(42px,8vw,76px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.0, color:'#ffffff', margin:'0 0 10px',
            textShadow:`0 0 40px ${gold(0.22)}` }}>
            SVAPNA VIDYĀ
          </h1>
          <p style={{ fontSize:12, fontWeight:800, letterSpacing:'0.3em', color:gold(0.5), textTransform:'uppercase', marginBottom:16 }}>
            SIDDHA DREAM SCIENCE · 15 MODULES · 4 TIERS
          </p>
          <p style={{ fontSize:14, lineHeight:1.75, color:white(0.45), maxWidth:480, margin:'0 auto 40px' }}>
            The world's most advanced Siddha dream science. Ancient Akashic technology transmits through scalar waves directly into your dream state.
          </p>

          {/* Tier tabs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {tabOrder.map(tid => {
              const tm2 = TIER_META[tid];
              const isActive = activeTab === tid;
              const locked = TIER_RANK[tid] > userRank;
              return (
                <button key={tid} onClick={() => setActiveTab(tid)}
                  style={{
                    padding:'9px 20px', borderRadius:100,
                    border:`1px solid ${isActive ? tm2.color : 'rgba(255,255,255,0.07)'}`,
                    background: isActive ? `rgba(${colorToRgb(tm2.color)},0.12)` : 'rgba(255,255,255,0.02)',
                    color: isActive ? tm2.color : white(0.35),
                    fontSize:10, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase',
                    cursor:'pointer', transition:'all 0.2s',
                    boxShadow: isActive ? `0 0 18px ${tm2.glow}` : 'none',
                    opacity: locked ? 0.6 : 1,
                  }}>
                  {tm2.badge} {locked ? '🔒 ' : ''}{tm2.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TIER HEADER */}
      <div style={{ textAlign:'center', margin:'0 20px 36px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:12, padding:'12px 24px', borderRadius:40,
          background:'rgba(255,255,255,0.02)', border:`1px solid ${colorToHex(activeTab)}22` }}>
          <span style={{ fontSize:26, color:tm.color, textShadow:`0 0 16px ${tm.glow}` }}>{tm.badge}</span>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:tm.color }}>
            {tm.label}
          </span>
          {tm.price && <span style={{ fontSize:11, color:white(0.28) }}>{tm.price}</span>}
        </div>
      </div>

      {/* LOCKED STATE */}
      {tabLocked && (
        <div style={{ margin:'0 20px 32px', padding:'28px 24px', borderRadius:32,
          background:'rgba(255,255,255,0.02)', border:`1px solid ${tm.color}22`, textAlign:'center' }}>
          <p style={{ fontSize:28, marginBottom:12 }}>🔒</p>
          <p style={{ fontSize:13, fontWeight:700, color:tm.color, marginBottom:8 }}>Upgrade to unlock this tier</p>
          <p style={{ fontSize:12, color:white(0.4), marginBottom:20 }}>This curriculum is available at {tm.label} — {tm.price}</p>
          <button onClick={() => navigate('/siddha-quantum')}
            style={{ padding:'12px 28px', borderRadius:100,
              background:`linear-gradient(135deg,${tm.color},${colorToHex(activeTab)}88)`,
              border:'none', color:'#050505', fontSize:11, fontWeight:900, letterSpacing:'0.2em',
              textTransform:'uppercase', cursor:'pointer' }}>
            Upgrade Now →
          </button>
        </div>
      )}

      {/* MODULES */}
      {!tabLocked && (
        <div style={{ maxWidth:700, margin:'0 auto', padding:'0 16px', display:'flex', flexDirection:'column', gap:24 }}>
          {modules.map((mod, mi) => (
            <div key={mi} style={{
              background:'rgba(255,255,255,0.02)',
              backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
              border:`1px solid rgba(255,255,255,0.05)`,
              borderTop:`1px solid ${colorToHex(activeTab)}44`,
              borderRadius:32, padding:'32px 28px',
              animation:`sqFadeUp 0.4s ${mi*0.06}s ease both`,
            }}>
              <p style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', color:tm.color, textTransform:'uppercase', marginBottom:8 }}>
                {mod.module}
              </p>
              <h2 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, letterSpacing:'-0.03em', color:'#ffffff', marginBottom:6, lineHeight:1.15 }}>
                {mod.title}
              </h2>
              <p style={{ fontSize:13, color:white(0.35), marginBottom:28, fontStyle:'italic' }}>{mod.subtitle}</p>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {mod.lessons.map((lesson, li) => {
                  const key = `${mi}-${li}`;
                  const open = expanded === key;
                  return (
                    <div key={li} style={{
                      borderRadius:18,
                      border:`1px solid ${open ? colorToHex(activeTab)+'44' : 'rgba(255,255,255,0.05)'}`,
                      background: open ? `rgba(${colorToRgb(tm.color)},0.04)` : 'transparent',
                      overflow:'hidden', transition:'all 0.25s',
                    }}>
                      <button onClick={() => setExpanded(open ? null : key)}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 20px',
                          background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                        <span style={{ minWidth:24, height:24, borderRadius:'50%',
                          border:`1px solid ${colorToHex(activeTab)}55`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:10, fontWeight:800, color:tm.color, flexShrink:0 }}>
                          {li+1}
                        </span>
                        <span style={{ flex:1, fontSize:14, fontWeight:700, color: open ? '#fff' : white(0.75), letterSpacing:'-0.01em' }}>
                          {lesson.title}
                        </span>
                        <span style={{ fontSize:18, color:tm.color, transform: open ? 'rotate(45deg)' : 'rotate(0)', transition:'transform 0.2s', opacity:0.7 }}>
                          +
                        </span>
                      </button>
                      {open && (
                        <div style={{ padding:'0 20px 20px 58px', fontSize:13, lineHeight:1.85, color:white(0.58), whiteSpace:'pre-line' }}>
                          {lesson.body}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPGRADE CTA */}
      {activeTab !== 'akasha' && !tabLocked && (
        <div style={{ textAlign:'center', padding:'48px 20px 0' }}>
          <div style={{ display:'inline-block', background:'rgba(212,175,55,0.04)',
            border:'1px solid rgba(212,175,55,0.18)', borderRadius:32, padding:'32px 36px', maxWidth:400 }}>
            <p style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', color:gold(0.6), textTransform:'uppercase', marginBottom:10 }}>UNLOCK THE FULL TRANSMISSION</p>
            <h3 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em', color:'#fff', marginBottom:10 }}>Akasha-Infinity</h3>
            <p style={{ fontSize:13, color:white(0.38), lineHeight:1.7, marginBottom:24 }}>
              Turīya-Svapna · 40-Night Tapas · Death & Bardo · Prophetic Dreaming · Scalar Transmission · Family Dream Science
            </p>
            <button onClick={() => navigate('/siddha-quantum')}
              style={{ padding:'12px 32px', borderRadius:100,
                background:'linear-gradient(135deg,#D4AF37,#a07c1e)',
                border:'none', color:'#050505', fontSize:11, fontWeight:900,
                letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer' }}>
              ✦ Activate Lifetime Access
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sqFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sqScalarRing {
          0%,100%{opacity:0;transform:scale(0.7)}
          40%{opacity:1}
          70%{opacity:0.3;transform:scale(1.15)}
        }
      `}</style>
    </div>
  );
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function colorToRgb(hex: string): string {
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }
  return '212,175,55';
}
function colorToHex(tier: string): string {
  const map: Record<string,string> = { free:'#ffffff', prana:'#4ADE80', siddha:'#a78bfa', akasha:'#D4AF37' };
  return map[tier] ?? '#D4AF37';
}
