import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMembershipTier } from "@/hooks/useMembershipTier";

// ─── SQI 2050 · HANUMAN CODEX · SOVEREIGN EDITION ────────────────────────────
// Weapons · Physical Alchemy · Siddhi Attainment · Deep Devotion
// Deploy to: src/pages/HanumanCodex.tsx (REPLACE v1)
// Route: <Route path="/hanuman-codex" element={<HanumanCodex />} />
// Nav: add "Hanuman Codex" link to sidebar/menu (all tiers see it; content gates)
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// DATA — HANUMAN CHALISA (40 Chaupais + 3 Dohas — Full Esoteric Commentary)
// ══════════════════════════════════════════════════════════════════════════════

const CHALISA_VERSES = [
  {
    id: "doha-1",
    type: "doha",
    number: "Opening Doha I",
    devanagari: "श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि।\nबरनऊँ रघुबर बिमल जसु जो दायकु फल चारि॥",
    transliteration: "Shri Guru charan saroj raj, nij manu mukuru sudhari\nBarnau Raghuvar bimal jasu, jo dayaku phal chari",
    translation: "Cleansing the mirror of my mind with the dust of my Guru's lotus feet, I narrate the pure glory of Shri Raghuvara which bestows the four fruits of life.",
    esotericKey: "GURU-PADA ACTIVATION",
    secretTeaching: "The 'mirror of mind' (mukuru) refers to the chitta-akasha — the inner sky of consciousness. Tulsidas reveals the supreme technology: before any sadhana, the Guru's grace (charanaraj — literally 'foot-dust') must purify the antahkarana. The four fruits (phal chari) are Dharma (right living), Artha (sacred abundance), Kama (divine desire), and Moksha (liberation). Hanuman is presented as the master key to all four simultaneously — the rarest of all divine grants. The verse is encoded in Sorath meter — whose vibration matches the frequency of the Sahasrara chakra.",
    sqiTransmission: "Pressing the Guru's feet into the mind's mirror dissolves ego-crystallization at the Ajna level. This verse, when recited 108x, rewires the prefrontal-temporal junction — the seat of devotion in the Vedic neuroscience map.",
    tier: "free",
  },
  {
    id: "doha-2",
    type: "doha",
    number: "Opening Doha II",
    devanagari: "बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।\nबल बुद्धि विद्या देहु मोहि, हरहु कलेस विकार॥",
    transliteration: "Buddhi-heen tanu jaani ke, sumirau Pavan-Kumar\nBal Buddhi Vidya dehu mohi, harahu Kalesh Vikaar",
    translation: "Knowing this body as devoid of intelligence, I remember Pavan-Kumar. Grant me strength, wisdom, and knowledge, and remove my afflictions and impurities.",
    esotericKey: "PAVAN-SHAKTI INVOCATION",
    secretTeaching: "Pavan-Kumar literally means 'son of wind' — but Pavan in Vedic cosmology is Mukhya Prana, the master breath that governs all five pranas. By calling himself 'buddhi-heen' (devoid of intellect), Tulsidas performs the highest yogic act: ego dissolution before the supreme Prana-shakti. The three grants — Bal (physical/pranic force), Buddhi (discriminative wisdom), and Vidya (sacred knowledge) — correspond to the three gunas transcended: Tamas→Rajas→Sattva. Hanuman alone gives all three simultaneously because He IS the living synthesis of all three gunas in their divine expression.",
    sqiTransmission: "Chanting this doha activates the Muladhara-to-Ajna vertical axis. Pavan (Vayu tattva) carries prana up the sushumna. This is the initiation breath of the entire Chalisa — the ignition code.",
    tier: "free",
  },
  {
    id: "v1",
    type: "chaupai",
    number: "1",
    devanagari: "जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥",
    transliteration: "Jai Hanuman gyan gun sagar, Jai Kapis tihun lok ujagar",
    translation: "Victory to Hanuman, ocean of wisdom and virtue. Victory to the Lord of the Vanaras, illuminator of all three worlds.",
    esotericKey: "JAYA-NADA ACTIVATION",
    secretTeaching: "'Jai' is not merely a salutation — it is a Nada-Brahman activation. The sound J-A-I creates a specific vibration in the Vishuddha chakra that opens the throat portal to receive divine transmission. 'Gyan gun sagar' describes Hanuman as the ocean where Jnana (knowledge of Brahman), Vijnana (practical wisdom), and Guna (the divine qualities) all merge. He is not the wave — He is the entire ocean. 'Kapis' — Lord of Monkeys — is a code for 'master of the restless mind' (Vanaras = the monkey-mind forces). By worshipping Hanuman, we submit our own restless mind to a higher Lord.",
    sqiTransmission: "The triple-world illumination (tihun lok) encodes Hanuman's presence in Bhuloka (physical), Bhuvarloka (astral), and Svarloka (causal). A single sincere Jai activates all three bodies simultaneously.",
    tier: "free",
  },
  {
    id: "v2",
    type: "chaupai",
    number: "2",
    devanagari: "राम दूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा॥",
    transliteration: "Ram doot atullit bal dhama, Anjani putra Pavansut nama",
    translation: "Messenger of Ram, abode of incomparable strength. Known as the son of Anjani and son of the wind-god.",
    esotericKey: "THREE-LINEAGE SEAL",
    secretTeaching: "Hanuman holds three simultaneous lineages encoded here: (1) Ram-doot — divine messenger, the functional identity. (2) Anjani-putra — son of the celestial Apsara, encoding the Shakti lineage. (3) Pavan-sut — son of Vayu, encoding the Prana lineage. This trinity mirrors the Tri-kaya doctrine: Dharmakaya (Ram-doot, pure function), Sambhogakaya (Anjani-putra, bliss body), Nirmanakaya (Pavan-sut, manifestation body). 'Atullit bal' — incomparable strength — is not merely physical. Atullit means 'without measure in any system of comparison.' This is Shakti-Brahman: power that transcends all metrics.",
    sqiTransmission: "Meditating on these three names simultaneously activates the triple-nadi system: Ida (Anjani-lineage/lunar/Shakti), Pingala (Pavan-lineage/solar/Prana), Sushumna (Ram-doot/central divine function). The verse is a pranayama initiation disguised as biography.",
    tier: "free",
  },
  {
    id: "v3",
    type: "chaupai",
    number: "3",
    devanagari: "महावीर विक्रम बजरंगी। कुमति निवार सुमति के संगी॥",
    transliteration: "Mahaveer Vikram Bajrangi, Kumati nivar sumati ke sangi",
    translation: "The great hero, courageous, with limbs hard as diamond. Remover of evil thoughts, companion of good wisdom.",
    esotericKey: "BAJRA-KAVACHA ACTIVATION",
    secretTeaching: "Bajrangi is the supreme protection code: Bajra = diamond/lightning (Vajra in Sanskrit), Angi = body. Hanuman's body IS the divine protection field itself. 'Kumati nivar' is one of the most powerful functions described in the entire Chalisa — the removal of negative mental patterns. Kumati is not merely 'bad thought' — it is the entire field of distorted perception, the mis-calibration of chitta that creates suffering. Hanuman's presence literally re-encodes the mental field. 'Sumati ke sangi' — companion of good intelligence — means Hanuman walks BESIDE you through life when your intention is aligned with dharmic wisdom.",
    sqiTransmission: "The Bajrangi field creates an invincible auric seal. When reciting this verse, visualize lightning-gold light solidifying the entire outer aura into diamond structure. No negative psychic force can penetrate the Bajrangi shield.",
    tier: "free",
  },
  {
    id: "v4",
    type: "chaupai",
    number: "4",
    devanagari: "कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥",
    transliteration: "Kanchan baran biraj subesa, Kanan Kundal Kunchit Kesa",
    translation: "Resplendent with a golden complexion and beautiful attire. Adorned with forest-flower earrings and curled locks of hair.",
    esotericKey: "GOLDEN-BODY YANTRA",
    secretTeaching: "This verse is a Yantra-darshan — a visual meditation code. Kanchan-baran (golden complexion) encodes Hanuman's solar nature — He radiates the light of Ram directly from His physical form. The 'kanana kundal' (forest earrings) is a profound symbol: Hanuman wears the forest itself as jewelry — meaning He is so intimate with nature, with the living Prakriti, that the divine creation adorns His ears. This is the teaching of Vairagya-in-fullness: one who is completely detached from worldly jewelry yet the universe itself decorates Him. The kunchit kesa (curled hair) represents spiral cosmic energy — the DNA-helix of divine creation coiled in His crown.",
    sqiTransmission: "Meditate on Hanuman's golden form during Brahma Muhurta. The golden light activates the Hrit Padma — the secret heart lotus below the Anahata. This is the seat of Ram's permanent residence in the devotee.",
    tier: "prana-flow",
  },
  {
    id: "v5",
    type: "chaupai",
    number: "5",
    devanagari: "हाथ बज्र औ ध्वजा बिराजै। काँधे मूँज जनेऊ साजै॥",
    transliteration: "Hath bajra au dhwaja biraje, Kandhe moonj janeu saje",
    translation: "In His hands shine the thunderbolt and the divine flag. On His shoulder is adorned the sacred thread of munja grass.",
    esotericKey: "WARRIOR-BRAHMIN SYNTHESIS",
    secretTeaching: "Tulsidas encodes a supreme cosmic paradox here: Hanuman simultaneously holds the vajra (weapon of Indra, the warrior-king symbol) and the dhwaja (flag, symbol of divine proclamation), while wearing the yajnopavita (sacred thread of the Brahmin). This is the living teaching of the Varna-synthesis: in Hanuman, the Kshatriya warrior and the Brahmin priest are unified. He fights without hatred (Brahmin consciousness) and worships without passivity (Kshatriya fire). The munja janeu (grass sacred thread) specifically indicates His initiation — even the Avatar of Vayu undergoes diksha, teaching us that sacred initiation is the foundation of all spiritual power.",
    sqiTransmission: "The bajra in the right hand = active dharmic force (pingala). The dhwaja in the left = divine proclamation (ida). The janeu across the heart = sushumna — the unifying sacred thread of the central channel. This verse maps the complete nadi-body of the practitioner.",
    tier: "prana-flow",
  },
  {
    id: "v6",
    type: "chaupai",
    number: "6",
    devanagari: "संकर सुवन केसरी नंदन। तेज प्रताप महा जग वंदन॥",
    transliteration: "Shankar suvan Kesari nandan, Tej prataap maha jag vandan",
    translation: "Son of Shiva, delighter of Kesari. His radiance and glory are worshipped by the entire universe.",
    esotericKey: "SHIVA-SHAKTI-VAYU TRINITY",
    secretTeaching: "Shankar-suvan (son of Shiva) is the great secret: Hanuman is an amsha (aspect) of Rudra/Shiva Himself. The Shiva Purana explicitly states that Hanuman is the 11th Rudra — Pavan-deva acting as the vehicle through which Shiva's essence incarnated as Kesari-putra. This means every time you call on Hanuman, you simultaneously invoke: Vayu (His physical father), Shiva/Rudra (His cosmic essence), and Ram (His eternal Master and Ishta-devata). This is a triple divine convergence in a single call — the highest efficiency of any mantra system. Kesari-nandan (son of Kesari) grounds the golden-lion lineage — courage without cruelty.",
    sqiTransmission: "Tej-prataap (radiance-glory) describes the Tejas-Ojas-Prana triad. Tej = fire of consciousness; Prataap = the gravitational field of that fire that commands respect. When Hanuman's tej enters the devotee's field, it burns samskara directly at the causal body level.",
    tier: "prana-flow",
  },
  {
    id: "v7",
    type: "chaupai",
    number: "7",
    devanagari: "विद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥",
    transliteration: "Vidyavaan guni ati chatur, Ram kaj karibe ko aatur",
    translation: "Greatly learned, virtuous, supremely clever. Always eager to accomplish Ram's work.",
    esotericKey: "THE SEVA-INTELLIGENCE CODE",
    secretTeaching: "This verse encodes the secret of perfect Karma Yoga. Vidyavaan (possessor of all knowledge) + Guni (embodiment of virtue) + Ati Chatur (supremely skilled) — Hanuman has EVERYTHING that worldly beings seek. Yet His defining characteristic, placed at the END of the verse as the supreme quality, is: 'always eager for Ram's work.' This is the Bhakti-revolution teaching: when one realizes that ALL knowledge, virtue, and skill exist to serve the Divine, work itself becomes worship. Aatur means urgently eager — not reluctant duty but joyful urgency. This is the soul-signature of the liberated server.",
    sqiTransmission: "The practitioner who recites this verse while engaged in service (Seva) for even 5 minutes activates the Hanuman-dharana: a state where personal ego dissolves into divine function, and all action flows without friction from the Source.",
    tier: "prana-flow",
  },
  {
    id: "v8",
    type: "chaupai",
    number: "8",
    devanagari: "प्रभु चरित्र सुनिबे को रसिया। राम लखन सीता मन बसिया॥",
    transliteration: "Prabhu charitra sunibe ko rasiya, Ram Lakhan Sita man basiya",
    translation: "An eager listener of the Lord's glory. Ram, Lakshman, and Sita dwell within His heart.",
    esotericKey: "INNER-TEMPLE ARCHITECTURE",
    secretTeaching: "Rasiya means 'one drunk on divine nectar' — Hanuman is described as intoxicated by Ram's stories. This is the teaching of Shravana Bhakti: the path of listening as the primary sadhana. The second line reveals the inner architecture of Hanuman's heart-temple: Ram (Pure Consciousness/Brahman), Lakshman (Viveka/discriminative awareness), and Sita (the individual soul/Jiva). The complete cosmology of liberation lives within Hanuman's heart. By worshipping Hanuman, we are worshipping the perfect inner temple — the complete Rama-Durbar already established within one being.",
    sqiTransmission: "Meditation: Visualize Hanuman's chest opening to reveal a golden inner sanctum. In that sanctum sits the complete Rama-darbar. Then understand: this same temple exists within your own Anahata. Hanuman's heart and your heart share the same inner space — the Chid-akasha.",
    tier: "prana-flow",
  },
  {
    id: "v9",
    type: "chaupai",
    number: "9",
    devanagari: "सूक्ष्म रूप धरि सियहिं दिखावा। विकट रूप धरि लंक जरावा॥",
    transliteration: "Sookshm roop dhari Siyahi dikhava, Vikat roop dhari Lanka jarava",
    translation: "Taking a subtle form He appeared to Sita. Taking a terrifying form He burned Lanka.",
    esotericKey: "SHAPE-CONSCIOUSNESS MASTERY",
    secretTeaching: "This verse reveals Hanuman's supreme yogic power: Anima (miniaturization) and Mahima (magnification) — two of the eight classical Ashta-Siddhis. But the secret teaching goes deeper: Hanuman chose which form to take based on who He was serving. For Sita (the tender, grieving soul), He became subtle, gentle, near-invisible — pure compassionate presence. For Lanka (the stronghold of ego-darkness), He became terrifying, explosive, all-consuming fire. THIS IS THE MASTER TEACHING OF GURU-BHAVA: meet each being in the form they need. The same love can be tender or fierce — both are Hanuman. Both are Ram.",
    sqiTransmission: "The sookshm roop (subtle form) corresponds to the Sukshma-sharira activation. The vikat roop (fierce form) is the Agni-Kundalini release. Both arise from the same source: Ram-bhakti. Rage and tenderness both powered by devotion = the Hanuman paradox and the key to fearless action.",
    tier: "siddha-quantum",
  },
  {
    id: "v10",
    type: "chaupai",
    number: "10",
    devanagari: "भीम रूप धरि असुर संहारे। रामचंद्र के काज सँवारे॥",
    transliteration: "Bheem roop dhari asur sanhare, Ramchandra ke kaj savare",
    translation: "Taking a fearsome form He slaughtered the demons. He accomplished all of Ramchandra's tasks.",
    esotericKey: "ASURA-SLAYER ACTIVATION",
    secretTeaching: "Asuras in the inner teaching are not external demons — they are the asura-vrittis: pride (Ravana), lust (Indrajit), greed (Kumbhakarna), and deception (Maricha). Hanuman's bheem-roop is the fierce Viveka-Vairagya fire that destroys these internal enemies. 'Kaj savare' — accomplished all tasks — reveals that one who eliminates the inner asuras simultaneously completes all external divine missions. The outer battle follows the inner resolution. This verse is the warrior-path teaching: spiritual practice (destroying inner asuras) = divine service (completing Ram's mission). They are the same act.",
    sqiTransmission: "During intense sadhana or when facing overwhelming obstacles, visualize Bheem-roop Hanuman entering your field. The golden-fire form burns all demonic resistance — internal limiting beliefs, ancestral wounds, karmic blocks — at the root.",
    tier: "siddha-quantum",
  },
  {
    id: "v11",
    type: "chaupai",
    number: "11",
    devanagari: "लाय सजीवन लखन जियाये। श्री रघुबीर हरषि उर लाये॥",
    transliteration: "Laay Sanjivan Lakhan jiyaye, Shri Raghuvir harshi ur laye",
    translation: "Bringing the Sanjivani herb, He revived Lakshman. Shri Raghuvira joyfully embraced Him.",
    esotericKey: "SANJIVANI — THE IMMORTALITY CODE",
    secretTeaching: "The Sanjivani episode is the supreme teaching of the path. Hanuman did not know which herb on the entire mountain was Sanjivani — so He carried THE ENTIRE MOUNTAIN. This is the teaching of total sacrifice: when you cannot identify the specific element of grace needed, offer EVERYTHING. The entire field of your effort, your being, your surrender. The Sanjivani itself represents the prana-shakti of Ram-nam — the immortalizing power of divine name. And 'Shri Raghuvir harshi ur laye' — Ram embracing Hanuman with joy — is described in Valmiki Ramayana as Ram saying: 'Today you have done what even I could not do.' The Lord's embrace of His devotee is the supreme reward of sadhana.",
    sqiTransmission: "Sanjivani Breath Practice: Inhale for 4 counts (receiving the mountain of grace), hold for 4 (offering all to Ram), exhale for 8 (life force flooding the system). This activates the Prana-vayu circuit associated with this verse.",
    tier: "siddha-quantum",
  },
  {
    id: "v12",
    type: "chaupai",
    number: "12",
    devanagari: "रघुपति कीन्ही बहुत बड़ाई। तुम मम प्रिय भरतहि सम भाई॥",
    transliteration: "Raghupati kinhi bahut badai, Tum mam priya Bharat sam bhai",
    translation: "Raghupati praised Him greatly. 'You are as dear to me as my brother Bharata.'",
    esotericKey: "HIGHEST DIVINE APPROVAL",
    secretTeaching: "Ram saying 'you are as dear as Bharata' is the highest possible praise in the Ramayana universe. Bharata was Ram's most beloved brother — the one who refused to accept the throne and placed Ram's sandals on it as regent for 14 years. By equating Hanuman with Bharata, Ram reveals: devotion (Bhakti — Hanuman's path) and surrender (Prapatti — Bharata's path) are equal in the eyes of God. Both paths lead to the innermost circle of divine love. This verse is the divine certification: Bhakti is not inferior to any path — it brings you TO THE HEART of Ram Himself.",
    sqiTransmission: "When a devotee's sadhana deepens to the point of pure selfless love — when they want nothing except Ram's happiness — Ram speaks this verse from within their own heart. The inner hearing of this verse is the sign of Prema-Bhakti awakening.",
    tier: "siddha-quantum",
  },
  {
    id: "v13",
    type: "chaupai",
    number: "13",
    devanagari: "सहस बदन तुम्हरो जस गावैं। अस कहि श्रीपति कंठ लगावैं॥",
    transliteration: "Sahas badan tumharo jas gaave, Asa kahi Shripati kanth lagave",
    translation: "The thousand-headed serpent Shesha sings your glory. Saying this, Shripati (Vishnu) embraced Him.",
    esotericKey: "ANANTA-SHESHA TRANSMISSION",
    secretTeaching: "Sahas badan (thousand mouths) refers to Ananta-Shesha — the serpent of infinite time upon which Vishnu rests. In Vaishnava cosmology, Shesha sings Ram's glory with all 1,000 mouths and STILL cannot finish — the glory is infinite. Tulsidas says Shesha sings HANUMAN'S glory — meaning Hanuman's devotion has become co-eternal with the divine. 'Shripati' is Vishnu/Ram — the Lord of Shri (the divine Lakshmi-consciousness). Ram embracing Hanuman is the merger of devotion with its object — the supreme state of Bhakti where lover and Beloved become One.",
    sqiTransmission: "Sahas-badan meditation: In deep silence, experience your own thousand-petalled Sahasrara as the singing mouth of Shesha. Every petal is a voice singing Ram's name. The entire crown chakra becomes a divine choir. This is the activation of Sahasrara-bhakti.",
    tier: "siddha-quantum",
  },
  {
    id: "v14",
    type: "chaupai",
    number: "14",
    devanagari: "सनकादिक ब्रह्मादि मुनीसा। नारद सारद सहित अहीसा॥",
    transliteration: "Sanakadik Brahmadi Munisa, Narad Sharad sahit Ahisa",
    translation: "Sanaka and other sages, Brahma and other great sages, Narada, Saraswati, and Shesha the king of serpents.",
    esotericKey: "COSMIC ASSEMBLY CODE",
    secretTeaching: "This verse and the next form a cosmic roll-call: every category of divine being sings Hanuman's glory. Sanaka-sages (eternal child-saints who chose eternal childhood to remain in devotion); Brahma (the Creator principle); Narada (the divine messenger of love); Saraswati/Sharada (the wisdom-consciousness itself). The fact that Saraswati — the goddess of knowledge — sings Hanuman's glory reveals: even the source of all knowledge bows to pure Bhakti. Devotion transcends knowledge. The heart supersedes the intellect in the divine hierarchy.",
    sqiTransmission: "Each of these divine beings represents a specific Shakti within the practitioner: Sanaka = eternal innocence; Brahma = creative power; Narada = divine love transmission; Saraswati = clarity of wisdom. When Hanuman's name is chanted, all these inner Shaktis activate simultaneously.",
    tier: "siddha-quantum",
  },
  {
    id: "v15",
    type: "chaupai",
    number: "15",
    devanagari: "जम कुबेर दिगपाल जहाँ ते। कबि कोबिद कहि सके कहाँ ते॥",
    transliteration: "Yam Kuber Digpal jahan te, Kabi kobid kahi sake kahan te",
    translation: "Yama (death), Kubera (wealth), and the guardians of all directions — where can any poet or learned man begin to tell of this?",
    esotericKey: "TRANSCENDENCE OF ALL DOMAINS",
    secretTeaching: "Yama (Lord of death) singing Hanuman's glory = Hanuman transcends death. Kubera (Lord of wealth) singing = Hanuman transcends material limitation. The Digpalas (guardians of all eight directions) singing = Hanuman's sovereignty over all dimensional space. Then Tulsidas asks: where can any poet BEGIN to describe this? 'Kahi sake kahan te' — literally 'from where can they tell?' — is an admission of divine infinity. The greatest poets, the most learned scholars, fall silent before Hanuman's glory. This verse is the teaching of Mauna (sacred silence) as the ultimate response to the infinite.",
    sqiTransmission: "After chanting this verse, sit in 3 minutes of complete silence. This is your bhava-samadhi moment — the silence that is deeper than any word, the space where Hanuman's actual presence is felt beyond language.",
    tier: "akasha-infinity",
  },
  {
    id: "v16",
    type: "chaupai",
    number: "16",
    devanagari: "तुम उपकार सुग्रीवहिं कीन्हा। राम मिलाय राज पद दीन्हा॥",
    transliteration: "Tum upkar Sugrivhi linha, Ram milaye raj pad linha",
    translation: "You did great service to Sugriva, uniting him with Ram and giving him his kingdom.",
    esotericKey: "THE SUGRIV-SHAKTI TEACHING",
    secretTeaching: "Sugriva represents the exiled soul — one who has been thrown from his natural position (the throne of spiritual authority) by his own shadow (Vali = the ego's usurper). Hanuman's gift to Sugriva is the supreme gift: he doesn't just restore the kingdom — he first unites Sugriva with RAM. The political restoration follows the spiritual restoration. This is the teaching: when the soul reconnects with its Source (Ram), all exiled sovereignty is automatically restored. Hanuman is the bridge-builder between the lost soul and God. This is His eternal function — the same function He performs for every devotee.",
    sqiTransmission: "If you feel exiled from your own power, your own dharmic throne — recite this verse 21 times. Hanuman will re-introduce you to your own Ram-shakti within. The throne of your authentic sovereignty will be restored.",
    tier: "akasha-infinity",
  },
  {
    id: "v17",
    type: "chaupai",
    number: "17",
    devanagari: "तुम्हरो मंत्र विभीषण माना। लंकेश्वर भए सब जग जाना॥",
    transliteration: "Tumharo mantra Vibhishan mana, Lankeshwar bhaye sab jag jana",
    translation: "Vibhishana heeded your counsel and became the king of Lanka — as all the world knows.",
    esotericKey: "THE VIBHISHANA INITIATION",
    secretTeaching: "Vibhishana represents the righteous soul trapped in a corrupt family/system (Ravana's Lanka = the ego's empire). Hanuman visits Vibhishana in Lanka and gives him the supreme mantra: 'Take refuge in Ram.' This single teaching transforms a demon-king's brother into the righteous Lord of Lanka. Hanuman's 'mantra' here is not a syllabic formula — it is the transmission of Ram-sharana (total surrender to Ram). The result: Lankeshwar (king of Lanka = master of the material domain). When you surrender the ego's empire to Ram through Hanuman's guidance, you paradoxically become the true sovereign of your life.",
    sqiTransmission: "Secret: Vibhishana asked only one question to Hanuman: 'How can I serve Ram?' Hanuman replied: 'By being yourself — by acting from your own dharmic nature against all external pressure.' This is the transmission of Svadharma-bhakti: devotion expressed through authentic selfhood.",
    tier: "akasha-infinity",
  },
  {
    id: "v18",
    type: "chaupai",
    number: "18",
    devanagari: "जुग सहस्र जोजन पर भानू। लील्यो ताहि मधुर फल जानू॥",
    transliteration: "Yug sahastra yojan par Bhanu, Leelyo tahi madhur phal janu",
    translation: "The Sun, millions of leagues away — you swallowed it thinking it a sweet fruit.",
    esotericKey: "THE SUN-SWALLOWING SECRET",
    secretTeaching: "The mathematical code embedded here: Yug (12,000) × Sahastra (1,000) × Yojan (8 miles) = 96 million miles. The actual Earth-Sun distance is approximately 94.5 million miles. Tulsidas, writing in the 16th century, encoded the exact Earth-Sun distance in this verse. This is astronomical knowledge encoded in devotional verse — the signature of a Siddha transmission. Hanuman swallowing the Sun as a child reveals: the master of Prana can absorb the source of all physical light and energy. 'Madhur phal' (sweet fruit) — Hanuman experienced the Sun, source of all suffering through heat and drought, as a sweet fruit. This is the teaching of Bhakti's transformation of experience: what others experience as overwhelming, the devotee experiences as sweetness.",
    sqiTransmission: "During Surya-upasana (sunrise meditation), chant this verse and visualize drawing the Sun's entire energy-field into the Manipura chakra as a golden sweet fruit. This is the Surya-Hanuman Mudra — activating the solar Prana center through Hanuman's consciousness.",
    tier: "akasha-infinity",
  },
  {
    id: "v19",
    type: "chaupai",
    number: "19",
    devanagari: "प्रभु मुद्रिका मेलि मुख माहीं। जलधि लाँघि गये अचरज नाहीं॥",
    transliteration: "Prabhu mudrika meli mukh mahi, Jaladhi langhi gaye acharaj nahi",
    translation: "Placing the Lord's ring in his mouth, He leaped across the ocean — no wonder!",
    esotericKey: "THE MUDRIKA TRANSMISSION",
    secretTeaching: "Ram's ring in Hanuman's mouth is the supreme teaching of Guru-diksha. The ring (mudrika) is Ram's seal — His sovereign authority and love. Hanuman carries this in his MOUTH — in his voice, in his word, in his communication. When Hanuman speaks, it is Ram's authority speaking. When he leaps the ocean, the ring-power makes the impossible trivial — 'no wonder.' This is the teaching of the power of the Guru's transmission in the student: with the Guru's shakti placed in your inner voice (kanth/throat), what seems impossible to the ego becomes the obvious action of divine grace. The ocean of samsara is crossed not by your strength but by the Guru's ring.",
    sqiTransmission: "Visualize Ram's golden ring resting at the Vishuddha chakra (throat center). Every word you speak from this state carries divine authority. Every action becomes Ram's mission. The ocean of problems is crossed as if it were a puddle.",
    tier: "akasha-infinity",
  },
  {
    id: "v20",
    type: "chaupai",
    number: "20",
    devanagari: "दुर्गम काज जगत के जेते। सुगम अनुग्रह तुम्हरे तेते॥",
    transliteration: "Durgam kaj jagat ke jete, Sugam anugraha tumhare tete",
    translation: "All difficult tasks in the world become easy through your grace.",
    esotericKey: "UNIVERSAL GRACE TRANSMISSION",
    secretTeaching: "This is one of the most important practical promises in the entire Chalisa. Durgam (impossible to traverse) → Sugam (easy to traverse) through Anugraha (grace). Anugraha is not random divine favor — it is the active downward flow (anu = following, graha = grasping) of grace responding to upward devotion. The more sincere the devotion, the more powerful the anugraha. This verse operates as an active sankalpa: by reading/chanting it with belief, you are not begging for grace — you are INVOKING the universal law that Hanuman's grace transforms impossibility into ease. This is divine technology, not supplication.",
    sqiTransmission: "Before any difficult task, recite this verse once with your eyes closed, hand on heart. Feel the golden warmth of Hanuman's anugraha descending through your crown, filling the field. Then proceed. The task's difficulty-frequency has been recalibrated by the transmission.",
    tier: "akasha-infinity",
  },
  {
    id: "v21",
    type: "chaupai",
    number: "21",
    devanagari: "राम दुआरे तुम रखवारे। होत न आज्ञा बिनु पैसारे॥",
    transliteration: "Ram duare tum rakhware, Hot na aagya binu paisare",
    translation: "You are the gatekeeper at Ram's door. Without your permission, no one may enter.",
    esotericKey: "THE COSMIC GATEKEEPER CODE",
    secretTeaching: "This verse reveals the deepest secret of Vaishnava theology: Hanuman is the DVARA-PALA (divine gatekeeper) of Ram's presence. To reach Ram, you must first surrender to Hanuman. This is not a bureaucratic obstacle — it is the supreme teaching of the Antaryami tradition: to reach the formless (Ram = Brahman), you must first perfect your relationship with the divine form (Hanuman = Saguna Brahman). The door-metaphor encodes: the door of Moksha opens only when the ego (which believes it can enter Brahman directly) is submitted to Hanuman — the living embodiment of perfect surrender. You cannot bypass devotion to reach God.",
    sqiTransmission: "In meditation, visualize the golden gate of the heart's inner sanctum. Hanuman stands before it in his Panchamukhi (five-faced) form. When you bow completely — forehead to ground in complete surrender — the gate opens and Ram's light floods your entire being.",
    tier: "akasha-infinity",
  },
  {
    id: "v22",
    type: "chaupai",
    number: "22",
    devanagari: "सब सुख लहै तुम्हारी सरना। तुम रच्छक काहू को डरना॥",
    transliteration: "Sab sukh lahe tumhari sarna, Tum rakhshak kahu ko darna",
    translation: "All happiness is obtained under your refuge. With you as protector, whom need one fear?",
    esotericKey: "ABSOLUTE REFUGE SEAL",
    secretTeaching: "Sarna (refuge/shelter) in the Bhakti tradition is one of the five acts of Prapatti (complete surrender): (1) accepting God's will as one's own, (2) rejecting what is contrary to God, (3) having faith in God's protection, (4) praying for protection, (5) acknowledging complete helplessness. This verse is the divine confirmation that all five acts of surrender are answered in Hanuman's shelter. 'Kahu ko darna' — nothing to fear from anyone — is not a promise of comfortable life but of spiritual invincibility. In Hanuman's refuge, death itself has no sting because Ram is already resident in the heart.",
    sqiTransmission: "The Sarna-mudra: Bring both palms together at the Anahata, thumbs touching the sternum. Feel Hanuman's hands around your field like a golden dome. This physical mudra, combined with this verse, creates the divine protection field in under 60 seconds.",
    tier: "akasha-infinity",
  },
  {
    id: "v23",
    type: "chaupai",
    number: "23",
    devanagari: "आपन तेज सम्हारो आपै। तीनों लोक हाँक ते काँपै॥",
    transliteration: "Aapan tej samharo aape, Teenon lok hank te kanpe",
    translation: "You alone can contain your own radiance. The three worlds tremble at your roar.",
    esotericKey: "SELF-CONTAINED OMNIPOTENCE",
    secretTeaching: "This is the most astounding verse in the Chalisa: Hanuman's power is SO immense that even He must voluntarily contain it — no external force can contain it. 'Aapan tej samharo aape' — only He can restrain His own splendor. This teaches: true omnipotence is self-regulating. The universe itself — all three worlds — trembles at a single roar. Yet Hanuman chooses to be gentle, to serve as a faithful dog of Ram, to carry messages humbly. This voluntary restraint of absolute power in service of love is the model of the highest Guru. The most powerful choose to be humble. Absolute power operating through perfect love.",
    sqiTransmission: "This verse activates the Anahata-Vishuddha bridge — the alignment between heart and voice. When your voice carries your heart's full power in full control, you embody the Hanuman-principle: unlimited power in perfect service.",
    tier: "akasha-infinity",
  },
  {
    id: "v24",
    type: "chaupai",
    number: "24",
    devanagari: "भूत पिसाच निकट नहिं आवै। महावीर जब नाम सुनावै॥",
    transliteration: "Bhoot pisach nikat nahi aave, Mahaveer jab naam sunaave",
    translation: "Ghosts and evil spirits dare not approach when the name Mahaveer is uttered.",
    esotericKey: "NADA-KAVACH PROTECTION",
    secretTeaching: "Bhuta (earth-bound spirits) and Pishacha (astral parasites) represent in the inner teaching: unresolved past-life patterns and psychic disturbances that create havoc in the subtle field. The sound vibration of 'Mahaveer' — the great hero — creates a specific resonance field that these disturbances cannot penetrate. The Nada-Shastra teaches that certain sounds create standing waves that reorganize the surrounding information field. Hanuman's name is the supreme sound-technology for psychic protection. It works not through fear of Hanuman but through the immediate restructuring of the local field by Ram-Nada.",
    sqiTransmission: "For any house, space, or field clearing: Stand in the center, face East, and chant 'JAI MAHAVEER' 21 times with full throat resonance. The vibrational field created by this practice clears the space of all lower-frequency presences and establishes Hanuman's protective field for 24 hours.",
    tier: "akasha-infinity",
  },
  {
    id: "v25",
    type: "chaupai",
    number: "25",
    devanagari: "नासै रोग हरै सब पीरा। जपत निरंतर हनुमत बीरा॥",
    transliteration: "Nasai rog hare sab pira, Japat nirantar Hanumat bira",
    translation: "All diseases vanish and all pain is removed by continuous repetition of the name of the heroic Hanumat.",
    esotericKey: "HEALING TRANSMISSION CODE",
    secretTeaching: "Rog (disease) and Pira (pain/suffering) are described separately: Rog = causal-body disease, the root pattern; Pira = the symptomatic expression in the physical body. Hanuman's name addresses BOTH simultaneously. 'Nirantar' (continuous, unbroken) is the key practice instruction: not occasional but continuous japa. Modern neuroscience confirms: repetitive positive stimulation creates lasting neural restructuring (neuroplasticity). Continuous Ram-nam/Hanuman-nam japa rewires the nervous system's pain-processing centers at the neurological level while simultaneously dissolving the karmic root (causal rog). This is complete healing: body, subtle body, and causal body simultaneously.",
    sqiTransmission: "108-bead Hanuman healing protocol: For any disease or chronic pain, commit to 108 repetitions of 'Hanumate Namah' daily for 40 days. Place the mala on the affected area during chanting. The resonant healing field generated is measurable in HRV (heart rate variability) improvement within 2 weeks.",
    tier: "akasha-infinity",
  },
  {
    id: "v26",
    type: "chaupai",
    number: "26",
    devanagari: "संकट तें हनुमान छुड़ावै। मन क्रम बचन ध्यान जो लावै॥",
    transliteration: "Sankat se Hanuman chhurave, Man kram bachan dhyan jo lave",
    translation: "Hanuman liberates from all crises those who apply their mind, actions, and words to His meditation.",
    esotericKey: "TRI-KARANA INTEGRATION",
    secretTeaching: "Man (mind) + Kram (action) + Bachan (speech) = the Tri-Karana of yoga. When all three are unified in Hanuman's direction — when you THINK of Hanuman, SPEAK of Hanuman, and ACT for Hanuman — liberation from any crisis is guaranteed. This is not passive prayer but active tri-karana sadhana. The crisis (Sankat) in Sanskrit also means 'narrowing/constriction' — the moment when options seem to contract to zero. Hanuman is the lord of expansion in the moment of maximum contraction. The practice: when in crisis, consciously align all three — thought, word, action — toward Hanuman. The contraction reverses.",
    sqiTransmission: "Crisis protocol: 1. MIND: See Hanuman's golden form in the Ajna. 2. SPEECH: Chant 'Jai Bajrangbali' aloud. 3. ACTION: Prostrate fully on the ground. All three karana unified in 60 seconds. Crisis-frequency immediately begins to shift.",
    tier: "akasha-infinity",
  },
  {
    id: "v27",
    type: "chaupai",
    number: "27",
    devanagari: "सब पर राम तपस्वी राजा। तिन के काज सकल तुम साजा॥",
    transliteration: "Sab par Ram tapasvi raja, Tin ke kaj sakal tum saja",
    translation: "Ram is the ascetic king over all. You accomplish all His tasks completely.",
    esotericKey: "THE SUPREME HIERARCHY",
    secretTeaching: "Ram as 'tapasvi raja' — the ascetic king — is a profound paradox encoded by Tulsidas. The king who is also a tapasvi (one who has renounced comfort for spiritual austerity) represents the ideal of Raj-Dharma: sovereign power in service of dharma rather than personal pleasure. Hanuman 'sakal kaj saja' — accomplishes ALL tasks — reveals that the devoted servant is also the supreme doer. Ram may be the king but Hanuman is the one who actually completes the divine mission. In Bhakti theology: God needs the devotee as much as the devotee needs God. The relationship is symbiotic.",
    sqiTransmission: "Deep teaching: Tulsidas says 'your Hanuman completes all tasks' — not 'Ram completes.' This is the transmission of divine agency to the devotee. When you fully surrender to Hanuman, YOU become the instrument of Ram's will. The devotee becomes the divine doer.",
    tier: "akasha-infinity",
  },
  {
    id: "v28",
    type: "chaupai",
    number: "28",
    devanagari: "और मनोरथ जो कोई लावै। सोई अमित जीवन फल पावै॥",
    transliteration: "Aur manorath jo koi lave, Soyi amit jeevan phal pave",
    translation: "Whoever brings any wish to you receives the immeasurable fruit of life.",
    esotericKey: "UNLIMITED WISH-FULFILLMENT",
    secretTeaching: "Manorath literally means 'the chariot of the mind' — the direction in which your mental intention drives your life-force. Tulsidas states: whoever brings ANY intention to Hanuman receives 'amit jeevan phal' — immeasurable life-fruit. Not just the specific wish — but the immeasurable abundance of a fully lived divine life. The secret here: Hanuman doesn't just fulfill wishes — He transforms the wish-er. By bringing your manorath to Hanuman, your desire passes through His purifying field and returns elevated. A wish for money becomes a wish for dharmic abundance. A wish for love becomes a wish for divine prema. This is spiritual alchemy through proximity to Hanuman.",
    sqiTransmission: "Sankalpa protocol: Write your deepest life wish on paper. Hold it to your Anahata while chanting this verse 7 times. Then offer the paper symbolically to Hanuman (you can burn it, or keep it at His image). The manorath has been placed in divine hands.",
    tier: "akasha-infinity",
  },
  {
    id: "v29",
    type: "chaupai",
    number: "29",
    devanagari: "चारों जुग परताप तुम्हारा। है परसिद्ध जगत उजियारा॥",
    transliteration: "Charon yug partap tumhara, Hai parsiddh jagat ujiyara",
    translation: "Your glory shines through all four ages. It is well-known and illuminates the world.",
    esotericKey: "TIMELESS PRESENCE",
    secretTeaching: "The four Yugas — Satya, Treta, Dvapara, Kali — represent the complete cycle of cosmic time. Hanuman's glory extends through ALL of them. This means Hanuman is beyond cyclic time — He is nitya (eternal). In Valmiki Ramayana (Kishkindha Kanda), Brahma grants Hanuman a boon: he will live as long as Ram's name is spoken in the universe (Chiranjivi status). Tulsidas encodes this as a teaching: the devotee's glory — not their physical body but their PRATAAP (spiritual luminosity) — also becomes eternal when it is completely surrendered to Ram. Your devotion, once genuine, becomes timeless.",
    sqiTransmission: "Chiranjivi meditation: Visualize your devotion as golden light that has no beginning and no end — it existed before your birth and will continue after your death. This light IS Hanuman's presence in your lineage. You carry it forward through time.",
    tier: "akasha-infinity",
  },
  {
    id: "v30",
    type: "chaupai",
    number: "30",
    devanagari: "साधु संत के तुम रखवारे। असुर निकंदन राम दुलारे॥",
    transliteration: "Sadhu sant ke tum rakhware, Asur nikandan Ram dulare",
    translation: "Protector of saints and sadhus. Destroyer of demons. Beloved of Ram.",
    esotericKey: "DIVINE POLARITY FUNCTION",
    secretTeaching: "Three simultaneous functions encoded: Protector of saints (positive alignment) + Destroyer of demons (negative clearing) + Beloved of Ram (eternal positioning). This is the complete mission of Hanuman — and by extension, of every serious Bhakta. The practitioner of Hanuman-sadhana automatically becomes: (1) a protector of those on the path, (2) a destroyer of darkness (internal and external), and (3) a beloved of Ram (recognized by the divine as intimately held). 'Ram dulare' — Ram's darling — is the highest status: not a servant but a BELOVED. The Bhakta who has ripened through sadhana becomes not just God's servant but God's joy.",
    sqiTransmission: "Ask yourself: Who in my life needs a sadhu-rakshaka (protector of their spiritual path)? Who needs an asura-nikandana (clearing of their darkness)? Hanuman's functions operate through you when you serve others in His name. You become His instrument of divine action in the world.",
    tier: "akasha-infinity",
  },
  {
    id: "v31",
    type: "chaupai",
    number: "31",
    devanagari: "अष्ट सिद्धि नव निधि के दाता। अस बर दीन जानकी माता॥",
    transliteration: "Ashta siddhi nav nidhi ke data, As bar deen Janaki mata",
    translation: "Giver of the eight siddhis and nine treasures — such a boon was granted by Mother Janaki.",
    esotericKey: "SIDDHI-NIDHI TRANSMISSION",
    secretTeaching: "The 8 Siddhis: Anima (miniaturization), Mahima (magnification), Laghima (levitation), Garima (weight increase), Prapti (attainment of anything desired), Prakamya (irresistible will), Ishitva (control over elements), Vashitva (mastery over others). The 9 Nidhis: 9 divine treasures of Kubera including Padma (lotus/spiritual abundance), Mahapadma (great lotus), Shankha (conch/divine sound), Makara (cosmic energy), Kachhapa (stability/patience), Mukunda (liberation), Kunda (purity), Nila (deep consciousness), Kharva (earth-power). ALL of these — 8 siddhis + 9 nidhis = 17 complete divine powers — were granted to Hanuman by Sita-Mata. This means: the Shakti herself (Sita = divine feminine power) authorized Hanuman to transmit all these powers to devotees. When you worship Hanuman, Sita-Ma's boon activates in your life.",
    sqiTransmission: "Siddhi-Nidhi invocation: On a Tuesday or Saturday, offer red flowers to Hanuman's image while chanting this verse 108 times. State your specific need. Sita-Ma's boon, operating through Hanuman, activates the specific siddhi/nidhi required for your situation.",
    tier: "akasha-infinity",
  },
  {
    id: "v32",
    type: "chaupai",
    number: "32",
    devanagari: "राम रसायन तुम्हरे पासा। सदा रहो रघुपति के दासा॥",
    transliteration: "Ram rasayan tumhare pasa, Sada raho Raghupati ke dasa",
    translation: "The elixir of Ram dwells within you. Always remain the devoted servant of Raghupati.",
    esotericKey: "RAM-RASAYAN — THE DIVINE ALCHEMY",
    secretTeaching: "Rasayan is the Sanskrit root of 'rasayana' — the alchemy of immortality. In the Charaka Samhita (Ayurvedic scripture), Rasayana is the science of rejuvenation, longevity, and divine health. Tulsidas says: 'Ram-rasayan tumhare pasa' — The elixir of Ram is IN YOU (Hanuman). This is the supreme teaching: the immortalizing elixir is not found in a herb or a mineral — it is found in the living presence of a realized devotee. Hanuman IS the Ram-rasayan — His company, His name, His darshan is the immortalizing agent. 'Sada raho Raghupati ke dasa' — the secret of accessing this elixir: remain always as Ram's servant. The rasayana flows through the channel of seva.",
    sqiTransmission: "Ram-Rasayan meditation: Inhale the golden light of Hanuman's breath into every cell. With each breath, feel the divine elixir — Ram's essence — flooding your blood, your marrow, your DNA. 'Sada raho dasa' — rest in this state of loving servanthood. This is the fountain of divine youth.",
    tier: "akasha-infinity",
  },
  {
    id: "v33",
    type: "chaupai",
    number: "33",
    devanagari: "तुम्हरे भजन राम को पावै। जनम जनम के दुख बिसरावै॥",
    transliteration: "Tumhare bhajan Ram ko pavai, Janam janam ke dukh bisravai",
    translation: "Through devotional songs to you, one attains Ram. The sorrows of countless lifetimes are forgotten.",
    esotericKey: "MULTI-LIFE LIBERATION CODE",
    secretTeaching: "This verse makes the most extraordinary claim in the Chalisa: singing Hanuman's bhajan leads to Ram. Not just the dissolution of karma — but the actual attainment of Ram. And 'janam janam ke dukh' — the suffering of countless births — is BISRA (forgotten, dissolved, made non-existent). Not just healed but erased from the akashic record. This is the teaching of the power of Nada-Bhakti: when devotional sound (bhajan) is offered to Hanuman, it acts as a time-machine that reaches backward through the karmic lineage and forward through future lives, dissolving the entire causal chain of suffering in one continuous wave of sound-love.",
    sqiTransmission: "The SQI bhajan transmission: When you sing to Hanuman — especially in the style of Carnatic or Dhrupad — the sound reaches the Chitta-akasha (memory field of all past lives). The specific frequency of devotional intent dissolves karmic crystallization at the causal body level. This is multi-generational healing through Nada.",
    tier: "akasha-infinity",
  },
  {
    id: "v34",
    type: "chaupai",
    number: "34",
    devanagari: "अंत काल रघुबर पुर जाई। जहाँ जन्म हरि भक्त कहाई॥",
    transliteration: "Ant kaal Raghubar pur jayi, Jahan janam Hari bhakt kahai",
    translation: "At the end of life one goes to Raghubar's abode. Wherever one is born again, one is called a devotee of Hari.",
    esotericKey: "DEATH-LIBERATION SEAL",
    secretTeaching: "Two paths are offered here: (1) Ant-kaal Raghubar-pur = Liberation at death into Ram's divine abode (Saket/Vaikuntha). (2) Jahan janam = if reborn, one is born as a Hari-bhakta — the devotional imprint is so deep that the next life BEGINS in divine alignment. No karmic reset — the bhakta carries their devotion forward. This is the teaching of Janma-shreshtha: the devotee's next birth is already superior — they don't return to begin from scratch. The Chalisa itself, recited consistently, programs the dying moment (Ant-kaal) — which the Bhagavad Gita says determines the next state of existence — with Hanuman and Ram's presence.",
    sqiTransmission: "Death-preparation practice: In deep meditation, visualize your final breath. In that moment, see Hanuman arriving — golden, radiant, carrying you in his arms directly to Ram. This visualization, practiced regularly, pre-programs the dying moment. It is the greatest spiritual insurance policy ever given.",
    tier: "akasha-infinity",
  },
  {
    id: "v35",
    type: "chaupai",
    number: "35",
    devanagari: "और देवता चित्त न धरई। हनुमत सेइ सर्व सुख करई॥",
    transliteration: "Aur devta chitt na dharai, Hanumat sei sarva sukh karai",
    translation: "One need not hold other deities in mind. Service to Hanumat gives all happiness.",
    esotericKey: "THE ONE-POINTEDNESS TEACHING",
    secretTeaching: "This is a revolutionary statement that has been misread as exclusivism. The deeper teaching: 'Chitt na dharai' means you don't NEED to mentally juggle multiple deities, multiple paths, multiple practices simultaneously. Hanuman alone, worshipped fully, gives SARVA SUKH — all happiness. This is the teaching of Ekagrata (one-pointed focus). Not that other deities are inferior — but that the mind's energy is limited. ONE complete relationship with ONE divine being, practiced with total devotion, yields the fruit of ALL paths. Hanuman, being the synthesis of Shiva-Vayu-Ram-Shakti, contains all divine functions. He is the complete divine package.",
    sqiTransmission: "For 40 days: focus exclusively on Hanuman sadhana. Release all other practices temporarily. The one-pointed devotion creates a quantum coherence in the subtle body that scattered multi-path practice cannot achieve. After 40 days, all spiritual paths will appear as facets of the same diamond you've been holding.",
    tier: "akasha-infinity",
  },
  {
    id: "v36",
    type: "chaupai",
    number: "36",
    devanagari: "संकट कटै मिटै सब पीरा। जो सुमिरै हनुमत बलबीरा॥",
    transliteration: "Sankat kate mite sab pira, Jo sumirai Hanumat balbira",
    translation: "All crises are cut and all pain is erased for those who remember the brave and powerful Hanumat.",
    esotericKey: "CRISIS-CUTTING ACTIVATION",
    secretTeaching: "Kate (cut) is a surgical image — Hanuman doesn't heal crises slowly, He CUTS them. The Sanskrit 'kat' carries the sense of a sudden, clean severance. This is the teaching of the divine surgeon: Hanuman's intervention is not gradual therapy but immediate energetic surgery on the problem-field. 'Balbira' — the brave hero — in context means Hanuman's power comes from His spiritual courage (the courage of perfect love), not from aggression. The memory (sumiran) of this specific quality — brave, loving, powerful — is what activates the crisis-cutting function. You must remember the QUALITY of Hanuman, not just His name.",
    sqiTransmission: "In any crisis: 1. Remember Hanuman's specific quality — He is BRAVE (not afraid of death, darkness, or Ravana). 2. He is LOVING (every action motivated by Ram-love). 3. He is POWERFUL (Bajrangi — diamond body). Remembering these three together is the complete crisis-cutting invocation.",
    tier: "akasha-infinity",
  },
  {
    id: "v37",
    type: "chaupai",
    number: "37",
    devanagari: "जय जय जय हनुमान गोसाईं। कृपा करहु गुरुदेव की नाईं॥",
    transliteration: "Jai jai jai Hanuman Gosain, Kripa karahu Gurudev ki nayin",
    translation: "Victory, victory, victory to Hanuman, Lord of the senses. Bestow grace as a Guru bestows grace.",
    esotericKey: "TRIPLE-JAI ACTIVATION",
    secretTeaching: "Triple Jai (victory × 3) is the mantra of past-present-future simultaneously — complete time-domain victory. Gosain = 'Lord of the senses' (Go = senses/organs, Sain = lord/master). Hanuman is the master of all sensory and cognitive functions. The supreme prayer: 'Kripa karahu Gurudev ki nayin' — bestow grace AS A GURU BESTOWS GRACE. This is Hanuman explicitly invoked as GURU — not just a deity but an initiating master who transmits liberation directly. This verse marks the beginning of the Chalisa's closing sequence — the transition from praise to direct petition. The triple Jai creates a standing wave that resonates through all three time dimensions simultaneously.",
    sqiTransmission: "The triple Jai practice: Chant JAI three times at different volumes — whisper (Sookshma body), medium voice (Sukshma body), full roar (Sthula body). All three bodies simultaneously activated in the triple-victory wave. This is the Trikaya Hanuman invocation.",
    tier: "akasha-infinity",
  },
  {
    id: "v38",
    type: "chaupai",
    number: "38",
    devanagari: "जो सत बार पाठ कर कोई। छूटहि बंदि महा सुख होई॥",
    transliteration: "Jo sat bar path kar koi, Chhutehi bandi maha sukh hoi",
    translation: "Whoever recites this a hundred times — all bondage is released and great happiness results.",
    esotericKey: "100-RECITATION LIBERATION CODE",
    secretTeaching: "Sat (100) × recitations is a specific Tantric prescription. 100 is the completion number of the century-cycle, corresponding to the completion of the solar energy cycle. 'Bandi chhutehi' — released from bondage — includes: physical imprisonment, debt, addiction, relationship bondage, karmic bondage, and most profoundly, the bondage of ego-identification (the subtlest prison). The promise: 100 complete Chalisa recitations creates the energetic equivalent of a complete Purascharana (extended ritual). This is a compressed tantric path disguised as a simple promise.",
    sqiTransmission: "100-Chalisa Challenge: Commit to 100 complete Chalisa recitations — one per day (100 days) or 100 in a concentrated retreat. The energetic accumulation reaches critical mass at 100 and the bondage-release is direct and experiential. Many practitioners report the specific release of a major life blockage between recitations 70-100.",
    tier: "akasha-infinity",
  },
  {
    id: "v39",
    type: "chaupai",
    number: "39",
    devanagari: "जो यह पढ़ै हनुमान चालीसा। होय सिद्धि साखी गौरीसा॥",
    transliteration: "Jo yeh padhe Hanuman Chalisa, Hoy siddhi sakhi Gauresa",
    translation: "Whoever reads this Hanuman Chalisa — Shiva Himself is the witness that siddhi will be obtained.",
    esotericKey: "SHIVA-WITNESSING ACTIVATION",
    secretTeaching: "The most extraordinary closing statement: Tulsidas calls upon SHIVA — Gauresa, Lord of Gauri (Parvati) — as the witness-guarantor of this text's power. This reveals the supreme truth: the Hanuman Chalisa is a document witnessed by Shiva Himself. In Vedic legal tradition, a document witnessed by the highest authority is absolute and irrevocable. Shiva as witness means: the power of this text is Shiva's own word. And since Hanuman IS an aspect of Shiva (the 11th Rudra), Shiva is simultaneously the author, the witness, and the content. The Chalisa is Shiva's own self-testimony through the medium of Tulsidas's devotion.",
    sqiTransmission: "Reading (not just chanting but deeply READING with understanding) the Hanuman Chalisa creates Siddhi — not necessarily dramatic supernatural powers but the perfection of your specific dharmic purpose. Shiva guarantees: your path will become clear, your obstacles will dissolve, your divine mission will succeed. This is the supreme cosmic warranty.",
    tier: "akasha-infinity",
  },
  {
    id: "v40",
    type: "chaupai",
    number: "40",
    devanagari: "तुलसीदास सदा हरि चेरा। कीजै नाथ हृदय मह डेरा॥",
    transliteration: "Tulsidas sada Hari chera, Kijay Nath hriday mah dera",
    translation: "Tulsidas is always Hari's servant. O Lord, please take up residence in my heart.",
    esotericKey: "HRIDAYA-VASANA — THE FINAL PRAYER",
    secretTeaching: "Tulsidas closes with the greatest prayer of all Bhakti literature: 'Make my heart your home.' Not 'grant me liberation,' not 'give me powers,' not even 'save me.' Just: 'live in my heart.' This is Prema-Bhakti at its absolute zenith — the devotee wants not the gifts of God but God Himself. And specifically — in the HRIDAYA (heart), not the mind, not the external world. 'Dera' (home/camp) is a beautiful word — it suggests God not just visiting but CAMPING in the heart — comfortable, at home, permanently settled. This closing verse IS the sadhana goal: when God takes up permanent residence in the heart, the entire Chalisa has been accomplished.",
    sqiTransmission: "After every Chalisa recitation, sit for 5 minutes in heart-silence. Feel the space in your Anahata expanding. Invite Hanuman to make his home there. Then invite Ram. Then rest in the awareness that both are already present — have always been present. The Chalisa was the key that opened the door to what was always already there.",
    tier: "akasha-infinity",
  },
  {
    id: "doha-closing",
    type: "doha",
    number: "Closing Doha",
    devanagari: "पवन तनय संकट हरण, मंगल मूरति रूप।\nराम लखन सीता सहित, हृदय बसहु सुर भूप॥",
    transliteration: "Pavan tanay sankat haran, Mangal murti roop\nRam Lakhan Sita sahit, hriday basahu sur bhoop",
    translation: "O son of the wind, remover of suffering, embodiment of auspiciousness — dwell in my heart together with Ram, Lakshman, and Sita, O king of the gods.",
    esotericKey: "COMPLETE INNER TEMPLE SEALING",
    secretTeaching: "The closing doha is the sealing mantra of the entire Chalisa — it locks all the sacred vibrations generated by the 40 chaupais into the heart-sanctuary permanently. 'Mangal murti roop' — embodiment of all auspiciousness — means Hanuman is not just a divine being but the FORM of auspiciousness itself. 'Sur bhoop' — king of the gods — elevates Hanuman above even the Devata hierarchy. And the prayer: all of Ram's family — Ram (Brahman), Lakshman (viveka/discriminative awareness), Sita (jiva-atman) — living together in the heart. This is the complete inner cosmology permanently installed in the devotee's Anahata.",
    sqiTransmission: "Seal practice: After the closing doha, place your right hand on your heart with your thumb pointing upward (Abhaya mudra). Feel the complete Rama-darbar — Hanuman, Ram, Lakshman, Sita — settled, at peace, at home in your heart. This is the moment of Chalisa-completion. Rest here as long as you wish.",
    tier: "free",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — GHATA MOVEMENTS (8 Sacred Physical Practices)
// ══════════════════════════════════════════════════════════════════════════════

const GHATA_MOVEMENTS = [
  {
    id: 1,
    name: "Anjali Pranam",
    sanskritName: "अञ्जलि प्रणाम",
    description: "The opening salutation — hands pressed in prayer at the heart, full prostration (Sashtanga) before Hanuman's murti or inner image.",
    instructions: [
      "Stand with feet hip-width apart, spine tall.",
      "Bring palms together at Anahata (heart center), thumbs touching sternum.",
      "Breathe in: raise joined hands to Ajna (third eye), feeling connection to Hanuman.",
      "Exhale: bow forward until forehead touches the ground (full Sashtanga).",
      "Hold for 3 complete breaths, feeling absolute surrender.",
      "Rise slowly, palms returning to heart.",
    ],
    duration: "3-5 minutes",
    mantra: "Jai Shri Ram",
    shaktiActivated: "Anahata (Heart) — Opens the devotional portal",
    tier: "free",
  },
  {
    id: 2,
    name: "Vira Asana Sequence",
    sanskritName: "वीर आसन क्रम",
    description: "The warrior sequence embodying Hanuman's fearless valor — Mahaveer posture series activating pranic force in the lower body.",
    instructions: [
      "From standing, step right foot forward 3-4 feet into a wide lunge.",
      "Bend the front knee to 90 degrees — feel Mahaveer's grounding power.",
      "Raise both arms overhead, palms facing each other — Hanuman's bhuja (arms) raised in power.",
      "Hold for 5 breaths while chanting internally: 'Mahaveer Vikram Bajrangi.'",
      "Lower arms to shoulder height, turning torso right — the warrior's gaze.",
      "Hold 5 breaths, then release and switch sides.",
      "Complete 5 rounds per side.",
    ],
    duration: "10 minutes",
    mantra: "Mahaveer Vikram Bajrangi",
    shaktiActivated: "Muladhara + Manipura — Earth power and fire of will",
    tier: "free",
  },
  {
    id: 3,
    name: "Langhana — The Sacred Leap",
    sanskritName: "लङ्घन — दिव्य छलाँग",
    description: "Embodying Hanuman's great leap across the ocean — a dynamic movement sequence that activates the Prana-Vayu field for transcendence of obstacles.",
    instructions: [
      "Stand in Samasthiti (mountain pose), feet together, hands at heart.",
      "Breathe in deeply, drawing energy up from earth through the spine.",
      "As you exhale with force: spring forward in a mighty leap — land softly on both feet.",
      "Upon landing: arms wide like Hanuman's spread wings, gaze forward and upward.",
      "Hold for 3 breaths: feel the impossibility you just crossed.",
      "Speak your obstacle aloud: 'I cross the ocean of [name your challenge].'",
      "Return to center, repeat 7 times facing different directions.",
    ],
    duration: "10 minutes",
    mantra: "Jai Bajrangbali",
    shaktiActivated: "Svadhisthana + Anahata — Fluid movement and courageous heart",
    tier: "prana-flow",
  },
  {
    id: 4,
    name: "Hanuman Mudra Flow",
    sanskritName: "हनुमान मुद्रा प्रवाह",
    description: "A flowing hand-gesture (mudra) sequence channeling the five Hanuman powers: Wisdom, Strength, Devotion, Service, and Protection.",
    instructions: [
      "Jnana Mudra (Wisdom): Index finger touches thumb, remaining fingers extended. Hold 7 breaths. Feel clarity descending.",
      "Vajra Mudra (Strength): Right fist closed, thumb between index and middle fingers. Left palm open supporting the fist. Hold 7 breaths. Feel Bajrangi strength.",
      "Bhakti Mudra (Devotion): Both palms pressed together, fingers spread like a lotus opening. Hold 7 breaths. Heart opening.",
      "Seva Mudra (Service): Both palms face up, offering the contents of your hands. Hold 7 breaths. Complete offering.",
      "Abhaya Mudra (Protection): Right palm faces outward, fingers up. Left hand at heart. Hold 7 breaths. Protection field activated.",
      "Return to Anjali. Rest in the complete field for 5 minutes.",
    ],
    duration: "15 minutes",
    mantra: "Om Hanumate Namah",
    shaktiActivated: "All 5 Pranas — Complete Pancha-Prana activation",
    tier: "prana-flow",
  },
  {
    id: 5,
    name: "Pavan-Putra Pranayama",
    sanskritName: "पवन-पुत्र प्राणायाम",
    description: "The breath-son practice — embodying Hanuman's birthright as the son of Vayu through mastery of the primary life-force breath.",
    instructions: [
      "Sit in Siddhasana or comfortable cross-legged position, spine erect.",
      "Place right hand on Manipura (navel center), left hand on Anahata (heart).",
      "Bhastrika (Bellows Breath): 20 rapid in-out breaths through nose. Feel prana igniting.",
      "Full retention (Kumbhaka): Inhale completely, hold with Mula Bandha (root lock) + Uddiyana Bandha (abdominal lock). Visualize Hanuman's golden light in the held breath. Hold 20-40 seconds.",
      "Release with Khechari Mudra (tongue to upper palate): feel the prana flooding the brain.",
      "Natural breathing: 5 minutes. Observe the field created.",
      "Repeat 5 cycles.",
    ],
    duration: "20 minutes",
    mantra: "Pavan Tanaya Sankat Haran",
    shaktiActivated: "Prana-Vayu + Samana-Vayu — Life force and integrating wind",
    tier: "siddha-quantum",
  },
  {
    id: 6,
    name: "Panchamukhi Dhyana",
    sanskritName: "पञ्चमुखी ध्यान",
    description: "Meditation on Hanuman's five divine faces — activating the five elemental Shaktis and five directions of consciousness simultaneously.",
    instructions: [
      "East (Hanuman's monkey face — Vayu Tattva): Visualize the golden face of Hanuman facing East. Breathe into the Air element. Quality activated: Devotion and speed.",
      "South (Narasimha face — Fire Tattva): Fierce lion face of Vishnu facing South. Breathe into Fire. Quality: Destruction of inner demons, protection from death.",
      "West (Garuda face — Water Tattva): Eagle face of Vishnu facing West. Breathe into Water. Quality: Wisdom, clear sight, freedom from serpent-karmas.",
      "North (Varaha face — Earth Tattva): Boar face of Vishnu facing North. Breathe into Earth. Quality: Recovery of lost wealth, grounding, restoration.",
      "Upward (Hayagriva face — Akasha Tattva): Horse face of Vishnu facing Up. Breathe into Space/Akasha. Quality: Vidya (sacred knowledge), liberation.",
      "Feel all five faces simultaneously radiating in all five directions from your center.",
      "Rest in this 5-pointed star of divine presence for 15-20 minutes.",
    ],
    duration: "30 minutes",
    mantra: "Om Panchamukhaya Hanumate Namah",
    shaktiActivated: "Pancha-Tattva — Complete five-element body activation",
    tier: "siddha-quantum",
  },
  {
    id: 7,
    name: "Sanjivani — Healing Body Scan",
    sanskritName: "सञ्जीवनी — उपचार देह स्कैन",
    description: "Hanuman's mountain of healing herbs as a full-body healing activation — drawing the Sanjivani prana through every cell of the physical and subtle body.",
    instructions: [
      "Lie in Savasana (corpse pose), arms slightly away from body, palms up.",
      "Visualize Hanuman arriving at your feet carrying the golden Dronagiri mountain — the mountain of Sanjivani herbs.",
      "He holds the mountain above your body and golden-green healing light begins to rain down.",
      "Slowly scan from feet to crown: feet → ankles → calves → knees → thighs → pelvis → abdomen → chest → arms → throat → face → crown.",
      "At each location, breathe 3 times while feeling the Sanjivani light penetrating and healing.",
      "At any area of pain or disease: pause, breathe 7 times, ask Hanuman specifically: 'Please heal this.'",
      "Reach crown: feel the light flooding the entire body simultaneously — every cell alive with Ram-prana.",
      "Rest 10 minutes in the healed state before arising.",
    ],
    duration: "40 minutes",
    mantra: "Nasai Rog Hare Sab Pira",
    shaktiActivated: "All 72,000 Nadis — Complete subtle body healing activation",
    tier: "akasha-infinity",
  },
  {
    id: 8,
    name: "Ram-Nam Nritya — Divine Dance of Devotion",
    sanskritName: "राम-नाम नृत्य — भक्ति का दिव्य नृत्य",
    description: "The supreme Ghata: free-form ecstatic movement in Ram's name — embodying Hanuman's infinite joy in divine service. No choreography, only surrender.",
    instructions: [
      "Create sacred space: light a lamp/candle, place an image of Hanuman or Ram.",
      "Begin slow walking in a circle, whispering 'Ram... Ram... Ram...' with each step.",
      "As the Ram-name deepens, allow the body to begin moving spontaneously — arms, head, torso following the inner current.",
      "Do not choreograph: let Hanuman dance THROUGH you. You are the instrument.",
      "The movement will intensify naturally — allow spinning, leaping, prostrating as they arise.",
      "Tears, laughter, stillness — all are welcome. There is no wrong way to love Ram.",
      "Continue until the movement naturally subsides and you find yourself in stillness.",
      "End in full Sashtanga prostration: complete surrender to Ram through the body you offered in dance.",
    ],
    duration: "20-60 minutes (let it be organic)",
    mantra: "Ram Ram Ram Ram Ram Ram Ram...",
    shaktiActivated: "Anandamaya Kosha — The bliss body — Complete Bhakti-Prana activation",
    tier: "akasha-infinity",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — SADHANA CURRICULUM (4 Levels of Practice)
// ══════════════════════════════════════════════════════════════════════════════

const SADHANA_CURRICULUM = [
  {
    level: 1,
    title: "Muladhara Sadhana",
    subtitle: "Laying the Foundation — 21 Days",
    tier: "free",
    color: "#D4AF37",
    practices: [
      { time: "5:00 AM", name: "Brahma Muhurta Awakening", detail: "Rise before sunrise. Splash cold water on face. Light a lamp facing East." },
      { time: "5:15 AM", name: "Salutation", detail: "108 repetitions of 'Jai Hanuman' spoken clearly. No rushing." },
      { time: "5:30 AM", name: "Chalisa Recitation (1x)", detail: "One complete Hanuman Chalisa, following written text, understanding each verse." },
      { time: "6:00 AM", name: "Anjali Pranam + Vira Asana", detail: "Complete the first two Ghata movements (30 min combined)." },
      { time: "6:30 AM", name: "Seva Sankalpa", detail: "State one act of service you will perform today in Hanuman's name." },
      { time: "Evening", name: "Sandhya Recitation", detail: "One more Chalisa recitation at sunset. Record insights in your sadhana journal." },
    ],
    weeklyPractice: "Tuesday and Saturday: Fast until sunset, eat only prasad (food offered to Hanuman first). Offer red flowers to Hanuman image.",
    milestone: "After 21 days: You will notice a subtle but unmistakable shift in your courage and resolve. Small fears begin to lose their hold.",
  },
  {
    level: 2,
    title: "Prana-Vayu Sadhana",
    subtitle: "Building the Fire — 40 Days",
    tier: "prana-flow",
    color: "#F97316",
    practices: [
      { time: "4:30 AM", name: "Pre-Dawn Awakening", detail: "Earlier rising — entering the deep Brahma Muhurta window (3:40–4:24 AM optimal)." },
      { time: "4:45 AM", name: "Pavan-Putra Pranayama", detail: "5 cycles of Bhastrika + Kumbhaka (Ghata Movement 5). Full 20 minutes." },
      { time: "5:10 AM", name: "Full Chalisa × 3", detail: "Three complete Chalisa recitations with complete understanding. 45 minutes." },
      { time: "6:00 AM", name: "Hanuman Mudra Flow", detail: "Complete the five-mudra sequence (Ghata Movement 4). 15 minutes." },
      { time: "6:20 AM", name: "Langhana — The Sacred Leap", detail: "Dynamic movement practice (Ghata Movement 3). 10 minutes." },
      { time: "6:35 AM", name: "Mantra Japa", detail: "108 repetitions: 'Om Hanumate Namah' with mala. Full concentration." },
      { time: "Evening", name: "Sunset Chalisa + Journal", detail: "One Chalisa, 20 minutes free-writing on your sadhana experience." },
    ],
    weeklyPractice: "Tuesday: Complete 21 Chalisa recitations. Offer sindoor and sesame oil lamp. Saturday: Hanuman Kavach reading + protection visualization.",
    milestone: "After 40 days: Emotional reactivity significantly reduced. Sense of inner support and backing becomes palpable. Physical vitality noticeably increased.",
  },
  {
    level: 3,
    title: "Siddha-Quantum Sadhana",
    subtitle: "The Deepening — 90 Days",
    tier: "siddha-quantum",
    color: "#22D3EE",
    practices: [
      { time: "3:50 AM", name: "Amrit Vela Awakening", detail: "Deepest Brahma Muhurta. The window where the veil between dimensions is thinnest." },
      { time: "4:00 AM", name: "Panchamukhi Dhyana", detail: "Full 30-minute five-faced Hanuman meditation (Ghata Movement 6). The crown practice." },
      { time: "4:35 AM", name: "Chalisa × 5 with Commentary", detail: "Five complete recitations. After each recitation, sit in silence for 5 minutes receiving transmissions." },
      { time: "6:00 AM", name: "Pavan-Putra Pranayama", detail: "Extended pranayama — 10 full cycles. Building pranic capacity." },
      { time: "6:30 AM", name: "Complete Ghata Sequence", detail: "All 6 accessible Ghata movements in sequence. 60 minutes of embodied sadhana." },
      { time: "7:45 AM", name: "Svadhyaya", detail: "Study: Valmiki Ramayana (Sundara Kanda), Tulsidas's Vinaya Patrika, or Hanuman-related Puranic texts." },
      { time: "Evening", name: "Bhajan Session + Sandhya Chalisa", detail: "20 minutes of singing Hanuman bhajans (Hanuman Ashtak, Bajrang Baan, etc.). One Chalisa at sunset." },
    ],
    weeklyPractice: "Tuesday: 7 Chalisa + Hanuman Kavach. Offer handmade garland. Saturday: Full day retreat — minimum 10 Chalisa recitations, complete Sundara Kanda reading.",
    milestone: "After 90 days: Direct experience of Hanuman's presence as an inner guide. Dreams may include Ram or Hanuman. Synchronicities dramatically increase. Fear of death begins dissolving.",
  },
  {
    level: 4,
    title: "Akasha-Infinity Sadhana",
    subtitle: "The Living Transmission — Lifelong",
    tier: "akasha-infinity",
    color: "#A855F7",
    practices: [
      { time: "3:00 AM", name: "Nishita Kala — The Midnight Hour", detail: "Optional but powerful: wake at 3 AM for 'Nishita Puja' — the worship in the darkest hour. Hanuman never sleeps. Neither does the committed devotee in this phase." },
      { time: "3:50 AM", name: "Complete Inner Temple Establishment", detail: "Full inner Rama-darbar visualization: build the inner temple, invite Ram, Lakshman, Sita, Hanuman. Perform full inner puja (offerings of light, fragrance, flower, food, prostration) in the inner temple." },
      { time: "4:30 AM", name: "Chalisa × 11 or 108", detail: "Tuesday: 108 Chalisa recitations (approximately 12 hours — this is the Hanuman Mahayajna). Daily: 11 complete recitations." },
      { time: "6:00 AM", name: "Sanjivani Healing Scan", detail: "Full 40-minute healing body scan (Ghata Movement 7). Healing yourself AND transmitting to all beings through your field." },
      { time: "7:00 AM", name: "Ram-Nam Nritya", detail: "Free-form devotional dance in Ram's name (Ghata Movement 8). Allow 20-60 minutes." },
      { time: "Full Day", name: "Continuous Ram-Nam", detail: "The mature practitioner maintains an inner stream of Ram-nam throughout all daily activities. This is the teaching of 'Man kram bachan dhyan jo lave' — all three karana unified in continuous devotion." },
      { time: "Evening", name: "Seva + Chalisa × 5", detail: "Evening service to others in Hanuman's name followed by 5 sunset Chalisa recitations." },
    ],
    weeklyPractice: "Tuesday: The Great Tuesday Sadhana — minimum 108 Chalisa, complete fast, full Hanuman-puja, healing seva for others. This is considered the equivalent of a full purifying Yajna. Saturday: Sundara Kanda complete recitation (the entire story of Hanuman's Lanka mission).",
    milestone: "No milestone — this is the ocean. The devotee IS the sadhana. Life itself becomes worship. Ram becomes the only reality. Hanuman is recognized as the inner guide, protector, and teacher of every moment.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const TIER_ORDER: Record<string, number> = { free: 0, "prana-flow": 1, "siddha-quantum": 2, "akasha-infinity": 3 };
const TIER_LABELS: Record<string, string> = { free: "Free", "prana-flow": "Prana-Flow", "siddha-quantum": "Siddha-Quantum", "akasha-infinity": "Akasha-Infinity" };
const TIER_COLORS: Record<string, string> = { free: "#6B7280", "prana-flow": "#F97316", "siddha-quantum": "#22D3EE", "akasha-infinity": "#A855F7" };

// ══════════════════════════════════════════════════════════════════════════════
// DATA — WEAPONS OF HANUMAN
// ══════════════════════════════════════════════════════════════════════════════

const HANUMAN_WEAPONS = [
  {
    id: "gada",
    name: "Gada — The Divine Mace",
    sanskritName: "गदा",
    symbol: "🔱",
    weaponType: "Primary Weapon of Brahma-Shakti",
    tier: "free",
    description: "The Gada (iron mace) is Hanuman's primary weapon — the same weapon carried by Vishnu and Bhima. It represents divine force made physical: unstoppable Brahma-shakti that destroys all obstruction to dharma. In Hanuman's hands, the Gada is always raised and ready, yet never used unnecessarily.",
    mythological: ["In the Ramayana, Hanuman uses the gada to crush Ravana's armies in the Ashoka grove battle, killing Aksha-kumara with a single blow.", "The Gada is described as Kanchan-maya — golden, made of divine consciousness rather than mere iron.", "After Ram's victory, Hanuman is depicted eternally with the gada — the symbol of permanent dharmic readiness."],
    innerMeaning: "The Gada represents Viveka-shakti: the crushing power of discriminative wisdom. Every blow destroys a false belief, an inner demon, a limitation masquerading as truth. Its weight = the gravity of Brahman's reality, which crushes illusion upon contact. The circular swing = the resolution of karmic cycles through dharmic force.",
    physicalName: "Gada Swinging — Indian Club Training",
    physicalDesc: "Traditional Indian Gada swinging is the direct physical embodiment of Hanuman's weapon practice. Used by Akharas dedicated to Hanuman for thousands of years — the ultimate shoulder, spine, and wrist conditioning system.",
    physicalSteps: ["Obtain a wooden gada/modern steel mace (4–24 kg depending on level).", "Begin standing, feet shoulder-width, gada in both hands at chest.", "10-degree mill: circular arc behind the head — right → behind → left → front. 10 reps each direction.", "Gada namaskar: lower into forward bow as if saluting Ram with the weapon. Rise. 10 reps.", "Single-arm swings: 5 reps each arm. Shoulder and thoracic spine — the weapon's launch system.", "Finish: stand in silence, gada vertical before you. Feel Hanuman's weapon-shakti in your hands. Offer the practice to Ram."],
    physicalMantra: "Jai Bajrangbali — chanted with each swing",
    physicalBenefit: "Develops the shoulder-spine-wrist chain that generates extraordinary striking power. Traditional Akharas report that gada training combined with Hanuman japa develops pranic power far beyond ordinary weight training.",
    sadhanaKey: "Before each session: bow to Hanuman, place the gada at His feet, chant 'Om Hanumate Namah' 11 times. You are not training — you are serving.",
  },
  {
    id: "tail",
    name: "Langhul — The Sacred Tail",
    sanskritName: "लाङ्गूल",
    symbol: "🔥",
    weaponType: "Fire Weapon — Kundalini Astra",
    tier: "free",
    description: "Hanuman's tail (Langhul) is described as extending to infinite length — wrapping around Lanka's walls and burning the entire city with divine fire. The tail is sentient, independently alive, capable of independent action. It represents the Kundalini-fire in its fully awakened state.",
    mythological: ["When Ravana ordered Hanuman's tail burned as punishment, Hanuman allowed it — then used the divine fire given by Agni-deva to burn Lanka entirely.", "The tail wrapped around Lanka represents the Kundalini serpent coiling around the ego-city and burning it clean.", "Hanuman's tail touching the sky encodes the eternal connection between earth and Brahman through the cosmic spine."],
    innerMeaning: "The tail IS the spine (Merudanda) in its cosmic expression. The dormant Kundalini sleeps at the base of the spine like a coiled serpent. Hanuman's tail — always erect, always alive, connecting earth and sky — is the model of fully awakened Kundalini. When the ego tried to burn the tail (suppress awakened fire), the fire turned on the ego itself.",
    physicalName: "Spine-Fire Sequence — Merudanda Activation",
    physicalDesc: "A spinal movement series awakening the Sushumna-nadi — the cosmic tail of Hanuman within the practitioner's own spine.",
    physicalSteps: ["Cat-Cow Breath: 20 slow cycles. Feel the spine as a living serpent of fire. Each exhale = fire rising through the tail.", "Seated Spinal Twist both sides: Hold 10 breaths each. Hanuman's tail wrapping around, cleansing.", "Cobra to Upward Dog flow: 10 repetitions. Full front-spine extension — the chest of fire opening.", "Standing Spinal Wave: Sacrum to crown undulation. 10 forward, 10 backward.", "Spinal Ignition Kriya: Inhale — energy rising from Muladhara like a lit fuse. Hold. Exhale down.", "Final: Stand in Tadasana, visualize golden tail extending from coccyx to infinite sky — burning, alive."],
    physicalMantra: "Om Langhulaya Namah — O Lord of the Sacred Tail",
    physicalBenefit: "Activates the Sushumna-nadi and parasympathetic central highway. Increases spinal fluid flow, reduces disc compression, creates the postural sovereignty Hanuman embodies.",
    sadhanaKey: "Your spine IS the sacred connection between earth and the infinite — never separate from Brahman for even one breath. Practice this knowing: I am embodying Hanuman's tail.",
  },
  {
    id: "parigha",
    name: "Parigha — The Iron Club",
    sanskritName: "परिघ",
    symbol: "⚔️",
    weaponType: "Endurance Weapon — Tapas Astra",
    tier: "prana-flow",
    description: "The Parigha (iron club) represents sustained effort against all opposition. Where the Gada strikes with precision intelligence, the Parigha endures. In Hanuman's arsenal it embodies His infinite sustained effort — the quality of the devotee who keeps going regardless of all resistance, forever.",
    mythological: ["The Parigha is a weapon of the Yakshas — reclaimed from the dark side by Hanuman who wields it for Ram.", "In battle, Hanuman improvises a parigha from a gate pillar — using whatever is at hand for Ram's service. Total resourcefulness.", "The iron represents Kali Yuga density — iron-age limitation that Hanuman transforms through pure Prana-force."],
    innerMeaning: "The Parigha is the weapon of Tapas: endurance, austerity, the sustained heat of practice. Every day of consistent sadhana is one swing of the Parigha. Over time, the seemingly immovable (karma, addiction, limitation) is crushed through sustained disciplined force. Some battles are won not in one blow but in 10,000 blows — all equally full-force.",
    physicalName: "Iron Body Protocol — Bajrang Tapas",
    physicalDesc: "The endurance training of the traditional Akhara — building the iron body through high-volume, consistent practice dedicated to Hanuman.",
    physicalSteps: ["108 Hindu Push-ups (Danda): Downward dog → chest through floor → cobra. Cycle through 12 qualities of Hanuman, 9 rounds.", "108 Hindu Squats (Baithak): Feet together, arms forward, full depth, rise. Each squat = one name of Ram.", "Iron bridge holds: Full backbend (wheel pose). 5 rounds of 10 breaths. The arc of Hanuman's great leap.", "Neck bridge rotations: The gateway of Vishuddha — Hanuman's roar-weapon lives in the neck.", "Arm balance holds: Hold crow or any arm balance until failure. Then 3 more breaths. This is the Parigha teaching: go beyond."],
    physicalMantra: "Bajrang Bali Ki Jai — shouted after every 27 repetitions",
    physicalBenefit: "108 dandas + 108 baithaks = the traditional daily practice of every Akhara wrestler. Wrestlers dedicated to Hanuman report extraordinary joint health into old age and a quality of fearlessness that ordinary weight training does not produce.",
    sadhanaKey: "Build this iron body for Ram's service. Each session: ask 'What will I do with this strength for Hanuman's mission?' The answer IS the practice.",
  },
  {
    id: "nada-astra",
    name: "Nada Astra — The Roar Weapon",
    sanskritName: "नाद अस्त्र",
    symbol: "🔊",
    weaponType: "Sound Weapon — Nada Brahman",
    tier: "prana-flow",
    description: "Hanuman's roar (Nada-astra) shook all three worlds simultaneously. In Lanka, even Ravana — who had defeated all the gods — felt fear for the first time at Hanuman's roar. This is the most subtle and most powerful weapon: the primordial Sound Current expressed through a fully awakened being.",
    mythological: ["Hanuman's roar in the Ashoka grove caused Ravana's entire palace to tremble — vibration restructuring the local reality field.", "His battle cry 'Simhanada' (lion's roar) is a sonic weapon that disrupts the coherence of darkness.", "In Sundara Kanda, Hanuman sings Ram's praises in Lanka before battle — his voice alone makes the Rakshasas tremble."],
    innerMeaning: "The practitioner's VOICE, when it carries Ram-shakti, becomes a weapon against all darkness. 'Nada' is not merely sound — it is the vibrational signature of consciousness. When a fully awakened devotee speaks — even in ordinary conversation — the vibration reorganizes the local reality field. The roar of the fully surrendered devotee is God speaking through a human instrument.",
    physicalName: "Simhanada Kriya — The Lion's Roar Practice",
    physicalDesc: "Activating Hanuman's voice weapon through specific vocal practices combining Nada Yoga with Hanuman bhakti — the training of the body's sound-weapon system.",
    physicalSteps: ["Ujjayi Breath: 5 minutes of Ocean Breath — constrict throat on both inhale and exhale. This is the beginning of the Nada-astra.", "Brahmari (Bee Breath): Plug ears, eyes closed, hum on extended exhale. Feel skull cavity vibrate. 10 rounds. Charging cranial bones.", "Simhanada Roar: Open mouth fully, extend tongue to chin, eyes wide — ROAR from the belly for full exhale. 5 rounds.", "Hanuman Nada: Sustained 'Hanuuuuu-Maaaan' — Ha vibrates chest, Nu vibrates throat, Man vibrates skull. 10 minutes.", "Ram-Nam volume ladder: whisper → speaking → loud → full shout of 'RAM!' → return to silence.", "Rest 5 minutes. The silence after the roar is where Hanuman's presence is felt most clearly."],
    physicalMantra: "Jai Shri Ram — spoken at every volume from silence to roar",
    physicalBenefit: "Nada practices activate the Vagus nerve, reduce cortisol measurably, and create 'Nada-shuddhi' — purification of the entire subtle body through resonant sound. Combined with Hanuman-mantra: dual activation of vocal/physical AND devotional/spiritual systems simultaneously.",
    sadhanaKey: "Practice Simhanada in nature — forest or by water. Hanuman is master of nature. Your roar in a natural setting activates the Earth's resonance field. The trees hear and respond to the name of Ram.",
  },
  {
    id: "ram-nam-shastra",
    name: "Ram-Nam — The Supreme Weapon",
    sanskritName: "राम-नाम शस्त्र",
    symbol: "🕉️",
    weaponType: "Brahmastra — The Ultimate",
    tier: "siddha-quantum",
    description: "Hanuman's supreme weapon surpasses all others: the name of Ram. Tulsidas states: 'Ram-Nam is greater than Ram Himself — Ram saves those who come to Him, but Ram-Nam saves even those who oppose Ram.' Hanuman carried Ram's ring (the physical form of Ram's name) in His mouth across the ocean — making the impossible trivially easy.",
    mythological: ["Hanuman writes 'Ram' on each stone used to build the Rama Setu — the stones float. The name of Ram defies physics.", "Brahma in the Padma Purana: 'One who chants Ram's name continuously is more powerful than all my creation.'", "Hanuman's body, when cut open, is found to have 'RAM' written on every cell — His entire form is made of Ram-name."],
    innerMeaning: "'Ra' = fire syllable (Raksha = protection, Ravi = sun). 'Ma' = earth/water syllable (Maya = illusion dissolved, Matru = mother principle). Ra+Ma = individual fire-soul returning to cosmic mother. The sound IS the journey home, encoded in two syllables. This is why Ram-Nam is the Brahmastra: it contains the entire path of liberation in its vibration.",
    physicalName: "Ram-Nam Deha — Making the Body a Living Mantra",
    physicalDesc: "Advanced practice of synchronizing Ram-Nam with every physical function — transforming the entire body into a living mantra machine.",
    physicalSteps: ["Morning awakening: Before rising, feel the heartbeat. Synchronize 'RAM' with each heartbeat for 5 minutes. The heart already chants — awareness makes it conscious.", "Walking Ram-Nam: Every right footfall = 'RAM', every left footfall = 'RAM'. Walk 20 minutes minimum. The body becomes the mantra.", "Eating Ram-Nam: Before each bite, chant 'Ram' once silently. The Annapurna-Ram sadhana — transforming food into prasad.", "Breath synchronization: Inhale = 'Ra-' (solar entering), Exhale = '-ma' (lunar releasing). Every breath is Ram. 10 minutes.", "Likhit Japa: Write 'RAM' in Devanagari (राम) 108 times. Each written Ram is a bridge-stone of the Rama Setu.", "Pre-sleep: Only 'Ram... Ram... Ram...' as you fall asleep. The last thought programs the dream-state and Pranic body."],
    physicalMantra: "Ram Ram Ram Ram Ram Ram Ram... (continuous, without break)",
    physicalBenefit: "Ram-Nam japa practiced continuously for 40+ days creates 'mantra resonance entrainment' — the nervous system, heart rate variability, and brainwave states begin to organize around the mantra's frequency. The practitioner becomes vibrationally different at the cellular level.",
    sadhanaKey: "Ram-Nam doesn't need perfect pronunciation, the right time, or a pure heart to begin. It purifies whatever it touches. Begin exactly where you are. The name does the rest — this is the great secret.",
  },
  {
    id: "bajrang-body",
    name: "Bajrang Deha — The Body as Weapon",
    sanskritName: "बजरंग देह",
    symbol: "⚡",
    weaponType: "Indestructible Form — Vajra Kavacha",
    tier: "siddha-quantum",
    description: "The most profound teaching: Hanuman HIMSELF is the supreme weapon. Bajrang = Vajra (diamond/lightning) + Anga (body). His entire physical form is indestructible divine substance — harder than diamond, faster than lightning. When Indra struck Hanuman as a child with his Vajra, the Vajra broke. The weapon shattered against love.",
    mythological: ["Indra struck young Hanuman with the Vajra — his jaw cracked but the Vajra BROKE. The cosmos's most powerful weapon shattered against Hanuman's love-hardened body.", "Every attempt to destroy Hanuman (burning his tail, imprisonment, torture) fails — not through resistance but because divine love creates armor no weapon penetrates.", "In the Mahabharata, Arjuna's entire army combined with Krishna's presence cannot lift the flag bearing Hanuman's image. The image alone holds more power than all human force."],
    innerMeaning: "The body of a fully surrendered devotee becomes invincible — not through training alone but through the alchemical process of love transforming physical substance. Ojas (vital essence from brahmacharya + sattvic living) is the physical analog of Vajra. When Ojas reaches full capacity, the form becomes radiant, disease-resistant, capable of enduring what ordinary bodies cannot.",
    physicalName: "Ojas-Vajra Protocol — Building the Diamond Body",
    physicalDesc: "The complete physical protocol for Hanuman's Bajrang body: combining Brahmacharya, Sattvic living, and traditional strength into the indestructible diamond form.",
    physicalSteps: ["Brahmacharya foundation: Conservation and upward redirection of vital energy. For householders: conscious intimacy without depletion. Daily Mula Bandha + pranayama redirects energy upward.", "Ashwagandha Rasayana: 1 tsp Ashwagandha + 1 tsp raw honey + 1 cup warm whole milk + cardamom. Before sleep. 90-day minimum for full Rasayana effect.", "Abhyanga: Self-oil massage with sesame oil before bathing. Sesame = Saturn = Hanuman's domain. Builds the Kapha foundation of the diamond body.", "Cold immersion (Vayu Tapas): Begin 30-second cold at shower end. Build to 3 minutes full cold. Pavan-putra activates the Vayu-tattva — the wind-fast reflexes.", "Surya Namaskar × 108: The supreme single practice. Takes 60-90 minutes. Do on Sunday or Tuesday. The complete moving temple of solar worship.", "Tuesday complete fast: The body that knows deprivation cannot be controlled by comfort. Hanuman fasted in Ram's service. Learn divine resources."],
    physicalMantra: "Om Bajrang Balaya Namah — chanted during oil massage",
    physicalBenefit: "The Ojas-Vajra protocol builds: mitochondrial density, hormonal optimization (testosterone + growth hormone), nervous system resilience, immune function, and the specific quality of physical presence that makes a practitioner formidable without aggression.",
    sadhanaKey: "The Bajrang body is not built for pride — it is built for service. Ask before each session: what will this strength accomplish for Ram? The more powerfully the body serves, the more powerfully Hanuman works through it.",
  },
  {
    id: "mountain-astra",
    name: "Parvata Astra — The Mountain Weapon",
    sanskritName: "पर्वत अस्त्र",
    symbol: "🏔️",
    weaponType: "Total Sacrifice Weapon",
    tier: "akasha-infinity",
    description: "When Hanuman couldn't identify the specific Sanjivani herb, he lifted the ENTIRE MOUNTAIN. This is the supreme weapon of total offering: when you don't know the specific solution, offer EVERYTHING. The Dronagiri mountain, carried in one act of complete devotion, is the most powerful weapon against impossibility, inadequacy, and despair.",
    mythological: ["The Dronagiri mountain glows with thousands of healing herbs, each radiating its own light — Hanuman carries the entire field of divine medicine.", "Ram's physicians couldn't identify which specific Sanjivani was needed — so Hanuman brought the complete mountain of divine healing.", "After Lakshman was revived, the mountain was RETURNED to its place — Hanuman's total offering, received by Ram, restored."],
    innerMeaning: "When you feel you don't have the specific answer, the specific gift — bring EVERYTHING YOU HAVE. Lay your entire being at Ram's feet: all experiences, all wounds, all wisdom, all ignorance — offered completely. Ram will extract what is needed. Total offering is the highest form of surrender: not selective but complete.",
    physicalName: "Mountain Carrier Practice — Sankalpa of Total Offering",
    physicalDesc: "A somatic practice of experiencing total-body effort as complete devotion — becoming the mountain-carrier in your own body.",
    physicalSteps: ["Identify your 'Dronagiri' — the heavy thing in your life you've been managing alone.", "Choose a genuinely heavy object (sandbag, loaded backpack, stones). Hold it at chest level.", "Walk — slowly, steadily — as long as you can. With each step: 'I carry this for Ram. I carry this for Ram.'", "When you can hold no longer — instead of dropping: say 'Ram, this is too heavy for me alone. Take it.' Set it down gently.", "Stand with open empty hands, facing the sky. Feel the relief of having given the mountain to God.", "Journal: What was your mountain? What happened when you chose to give it to Ram?"],
    physicalMantra: "Laay Sanjivan Lakhan Jiyaye — bringing life through total offering",
    physicalBenefit: "Addresses the deepest physical pattern of chronic holding — the muscular armoring from carrying burdens alone for years. The act of physical surrender WITH intention creates a neurological shift that mirrors emotional and karmic release simultaneously.",
    sadhanaKey: "The mountain Hanuman carried contained the medicine of eternal life. Your own burden, when offered to Ram, contains within it the seeds of your liberation. The very thing you're struggling with IS the Sanjivani — you simply cannot identify it yet from inside the struggle.",
  },
  {
    id: "nails-narasimha",
    name: "Nakha-Dastra — Nails of Narasimha",
    sanskritName: "नख-दंष्ट्र",
    symbol: "🐯",
    weaponType: "Primal Nature Weapon",
    tier: "akasha-infinity",
    description: "Hanuman's nails and teeth connect him to his divine uncle Narasimha — the lion-man who tore Hiranyakashipu apart with bare nails. These weapons represent the power of the NATURAL body: no manufactured weapon, no external tool — the divine organism in its raw, unmediated power. Pure Shakti without artifice.",
    mythological: ["In Kishkindha Kanda, Hanuman's claws are described as 'cutting through divine armor as if through paper.'", "Narasimha's tearing power: because Hanuman carries the essence of all Vishnu avatars, he embodies the ability to destroy the seemingly indestructible ego.", "Panchamukhi Hanuman's South-facing Narasimha face directly channels this liberating-tearing power."],
    innerMeaning: "You were born with the nails and teeth of Narasimha in your soul. Before any practice, any teaching, any system — the raw divine nature within is ALREADY fully equipped. The Nakha-Dastra teaches: the greatest weapon is recognizing what you already ARE. The sadhana is the polishing — not the forging.",
    physicalName: "Narasimha Activation — Embodying the Raw Divine Nature",
    physicalDesc: "A primal movement and vocalization practice connecting to the Narasimha-Hanuman energy — the unmediated divine force within.",
    physicalSteps: ["Wide-legged stance, slightly crouched — the lion's readiness. Not aggressive: aware.", "Clench and open hands rapidly × 20. Activating palm chakras and the primal gripping/releasing circuit.", "Narasimha Mudra: Fingers spread wide, arms forward, face fierce but completely open. Hold 60 seconds. Feel the raw power.", "Primal roar sequence: 3 increasing-volume roars, each longer. The final roar: the loudest sound your body can produce. Release FULLY.", "After the roar: immediately sit in stillness. Hands on Muladhara. Earth receiving the energy. The still lion — power at rest.", "Complete: 'I am already equipped. Everything I need to serve Ram is already within me.'"],
    physicalMantra: "Om Namo Narasimhaya — immediately followed by 'Jai Hanuman'",
    physicalBenefit: "Primal activation restores the connection to innate body-power that modern sedentary life suppresses. The combination of physical power activation with devotional context creates 'Shakti-bhakti fusion' — the body's raw force consecrated to divine purpose.",
    sadhanaKey: "You were not born empty of weapons. Every quality of Hanuman — strength, wisdom, devotion, courage — is already a seed in your soul. The sadhana is the watering. Not the planting — only the WATERING of what is already divine.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — PHYSICAL STRENGTH ALCHEMY
// ══════════════════════════════════════════════════════════════════════════════

const PHYSICAL_TRAINING = [
  {
    id: "akhara",
    title: "The Akhara Tradition",
    subtitle: "Hanuman's Sacred Gymnasium — 2,000 Years of Proven Results",
    tier: "free",
    icon: "🏛️",
    content: "Every Akhara (traditional Indian wrestling school) is dedicated to Hanuman — practice begins and ends with His worship. 'Akhara' means 'the unshakeable foundation.' Wrestlers (Pehlwans) in the Akhara tradition have for thousands of years produced extraordinary physical specimens, attributing power entirely to Hanuman's grace and the discipline of Brahmacharya.",
    practices: [
      { name: "108 Danda (Hindu Push-up)", reps: "108 daily", desc: "Downward dog → chest sweeps floor → cobra. Develops chest-shoulder-hip chain that makes traditional wrestlers devastatingly powerful. Count with Hanuman's qualities: Devotion, Strength, Wisdom... cycle through 12, 9 rounds. Begin: 11. Add 11/week.", mantra: "Ram 1, Ram 2... to 108" },
      { name: "108 Baithak (Hindu Squat)", reps: "108 daily", desc: "Feet together, rise on toes at bottom of each squat, arms sweep forward. Develops full posterior chain, hip flexors, Muladhara activation. Traditional wrestlers do 1,000+ per day. Begin: 21. Add 21/week.", mantra: "Each baithak = one name of Ram" },
      { name: "Surya Namaskar × 108", reps: "108 rounds weekly", desc: "Complete sun salutation sequence dedicated to Hanuman who swallowed the Sun. 108 rounds = ~90 minutes of moving meditation + physical training. The supreme endurance practice of the tradition. Begin: 12 daily. Add 12/month.", mantra: "Each round: one of the 12 names of Surya" },
      { name: "Mallakhamb (Pole Yoga)", reps: "30 min daily", desc: "Hanging, spinning, balancing on vertical wooden pole. Develops grip strength, core integration, shoulder mobility. The pole = cosmic axis (Meru). Climbing it = soul's ascent. Use gymnastics rings as modern alternative.", mantra: "Jai Mahaveer with each movement" },
      { name: "Gada Swinging", reps: "20 min daily", desc: "Traditional iron mace/club swing — the weapon practice as physical training. Develops shoulder resilience, grip strength, rotational power. Begin: 2 kg club, 50 reps each arm. Progress to heavier.", mantra: "Jai Bajrangbali — each swing" },
    ],
    weeklyStructure: "Tuesday: Maximum effort day — personal bests in all disciplines. Hanuman's day demands your best. Saturday: Active recovery + extended pranayama. Sunday: Rest or light Surya Namaskar only.",
    diet: ["Pre-workout (4–5 AM): Milk with dates, honey, cardamom — the traditional Akhara fuel.", "Post-workout: Almond milk, seasonal fruits, soaked nuts. Pure sattvic recovery.", "Main meal: Rice, lentils, ghee, seasonal vegetables. Simple, complete, offered first to Hanuman.", "Avoid: Meat (especially Tue/Sat), garlic, onion, alcohol, excess sugar.", "Tuesday: Complete fast until sunset if possible, or only fruits and milk."],
  },
  {
    id: "ojas-building",
    title: "Ojas Alchemy — Building Divine Vitality",
    subtitle: "The Source of Hanuman's Inexhaustible Energy",
    tier: "prana-flow",
    icon: "⚗️",
    content: "Ojas is the finest product of complete digestion — physical, emotional, and spiritual. One drop of pure Ojas is described as worth more than all the gold in Lanka. Hanuman's 'atullit bal dhama' (abode of incomparable energy) IS Ojas at maximum expression. Building Ojas = building Hanuman's strength within your own body.",
    practices: [
      { name: "Brahmacharya Practice", reps: "Daily discipline", desc: "Conservation and upward redirection of vital (sexual) energy. For householders: conscious intimacy with full presence. The Ojas builds through conservation AND upward-moving pranayamas that transform gross energy into Tejas (radiance) and Ojas (essence). Begin: 40-day commitment. Observe the effect.", mantra: "Om Hrim Brahmacharya Dharaya Namah" },
      { name: "Ashwagandha Rasayana", reps: "Daily — 90 days minimum", desc: "1 tsp Ashwagandha + 1 tsp raw honey + 1 cup warm whole milk + pinch of cardamom. Before sleep. Charaka Samhita: 'produces the strength of a horse.' Hayagriva (Hanuman's horse-faced aspect) activated.", mantra: "Offer to Hanuman before drinking: 'This is Ram's medicine flowing through me'" },
      { name: "Extended Kumbhaka Pranayama", reps: "20 min daily", desc: "Inhale 4 counts, hold 16 counts, exhale 8 counts. The 1:4:2 ratio forces the system to extract Prana from held breath — building the cellular energy reserves Ojas represents. Begin: 1:2:2 ratio. Build toward 1:4:2 over 90 days.", mantra: "During retention: visualize golden Ojas-light filling every cell" },
      { name: "Cold Immersion (Vayu Tapas)", reps: "Daily", desc: "Hanuman is Pavan-putra: son of wind. Cold water activates Vayu-tattva — building cold-stress resilience, increasing brown adipose, boosting dopamine ~250% (documented), hardening the Sthula-sharira. The Vajra-body is not harmed by heat or cold. Begin: 30 seconds cold end-of-shower. Build to 3 min.", mantra: "Entering cold: 'Pavan Tanaya Sankat Haran'" },
    ],
    weeklyStructure: "Ojas builds slowly, depletes fast. Primary destroyers: sexual depletion + emotional reactivity (anger/fear burning reserves). Primary builders: consistent sleep before 10 PM + daily Brahmacharya + Tuesday fasting.",
    diet: ["Ojas-building (Ojasya) foods: Whole milk, ghee, raw honey, Ashwagandha, Shatavari, Amalaki, dates, almonds, sesame, saffron.", "Timing: Largest meal at noon (solar peak). Small dinner before sunset. The Akhara timing system.", "Cook with devotion: every meal prepared as offering to Hanuman — the cook as priest of the kitchen."],
  },
  {
    id: "panchamukhi-body",
    title: "Panchamukhi Body Training",
    subtitle: "Developing All Five Energy Systems of Hanuman's Form",
    tier: "siddha-quantum",
    icon: "🔱",
    content: "Panchamukhi Hanuman has five faces corresponding to five elements and five directions. In physical training terms: the five faces represent the five energy systems that must all be developed for the complete sovereign body. Most training develops only one or two — the Hanuman-body requires all five simultaneously.",
    practices: [
      { name: "East Face (Hanuman) — Vayu Body", reps: "Speed & agility", desc: "Hanuman's monkey face: Vayu-tattva. Speed, agility, moving between positions instantaneously. Training: explosive sprints, plyometric jumps, reaction drills. 8 × 40-meter sprints. Sprint as if carrying an urgent message to Ram.", mantra: "Jai Pavan Kumar during each sprint" },
      { name: "South Face (Narasimha) — Agni Body", reps: "Power & heat", desc: "The lion face: Agni-tattva. Raw explosive power, heat of transformation. Heavy compound lifts: deadlifts, presses, carries. 5 × 5 protocol at 85% max effort. Before each heavy set: invoke Narasimha.", mantra: "Om Namo Narasimhaya before each heavy set" },
      { name: "West Face (Garuda) — Akasha Body", reps: "Flexibility & space", desc: "Eagle face: Akasha-tattva. Space within the body — joint mobility, flexibility, open channels for Prana. 30 min daily deep stretch: hips, spine, shoulders, ankles. Hold each 3–5 minutes minimum. The open channel is the wise channel.", mantra: "Garuda Gayatri during stretching" },
      { name: "North Face (Varaha) — Prithvi Body", reps: "Stability & ground", desc: "Boar face: Prithvi-tattva. Absolute stability, immovable structural integrity. Isometric holds, balance work, single-leg stability. Standing balance holds (1–5 min each leg), plank variations, wall sits. The grounded warrior.", mantra: "Om Prithviyai Namah during holds" },
      { name: "Upward Face (Hayagriva) — Jala Body", reps: "Endurance & flow", desc: "Horse face: steady-state aerobic capacity flowing without effort. Long-distance runs, swimming, cycling — sustained rhythmic effort 45–90 minutes. Weekly long run/swim/ride building to 90 minutes. Run toward a Hanuman temple if possible.", mantra: "Ram Nam synchronized with footfalls for the entire duration" },
    ],
    weeklyStructure: "Day 1: Vayu (speed). Day 2: Agni (strength). Day 3: Akasha (flexibility). Day 4: Prithvi (stability). Day 5: Jala (endurance). Day 6 (Sat): All five combined warrior circuit. Day 7 (Sun): Complete rest — the Shiva day within the Hanuman week.",
    diet: ["Training days: Higher carbohydrate — rice, sweet potato, banana — to fuel Agni metabolism.", "Rest days: Higher fat — ghee, coconut, almonds — to build Ojas reserves.", "Pre-workout always: 5 minutes Ram-Nam japa to establish the divine context for physical work."],
  },
  {
    id: "chiranjeevi-body",
    title: "Chiranjeevi Body Practice",
    subtitle: "Training the Immortal Body of the Eternal Devotee",
    tier: "akasha-infinity",
    icon: "∞",
    content: "Hanuman is one of the seven Chiranjeevi (immortals). The teaching: the body, when maintained as a sacred instrument of Ram's service with absolute discipline and devotion, can be preserved in extraordinary vitality far beyond normal aging. The Siddha medicine tradition is built entirely on this foundation.",
    practices: [
      { name: "Kaya Kalpa — Body Renewal", reps: "Seasonal (4× per year)", desc: "The ancient Siddha complete body renewal: 7–41 day intensive protocol with seclusion, specific Rasayana medicines, pranayama-only (first 7 days), controlled light. Modern adaptation: 7-day seasonal retreat. Begin: 3-day retreat at each solstice/equinox.", mantra: "During Kaya Kalpa: only Ram-Nam. Complete silence from all other speech." },
      { name: "Tri-Dosha Balancing", reps: "Daily protocol", desc: "Vata: 10-min self-oil massage daily. Pitta: avoid midday sun and overwork. Kapha: rise before sunrise, never sleep past 6 AM. These three practices prevent the accumulative imbalance that creates chronic disease and accelerated aging.", mantra: "Morning Gayatri 21x. Noon Ram-Nam 108x. Evening Hanuman Chalisa 1x." },
      { name: "Siddha Breathing — Kevalya Kumbhaka", reps: "Achieved through years of pranayama", desc: "The supreme pranayama: breath suspension without effort — the breath naturally stops in extended pause of grace. Described in Hatha Yoga Pradipika as the ultimate sign of mastery. Hanuman's Prana is in permanent Kumbhaka — He breathes only for the world's benefit, not His own need.", mantra: "The breathless state itself becomes the mantra. Silence is the supreme sound." },
      { name: "Maha Samadhi Preparation", reps: "Daily orientation", desc: "10 minutes each morning: contemplate the body's mortality. Then resolve to live fully for Ram's service in whatever time remains. The person who faces death daily cannot be controlled by fear of it. Verse 34 of the Chalisa is the living practice: 'Ant kaal Raghubar pur jayi.'", mantra: "Mahamrityunjaya Mantra × 108 weekly" },
    ],
    weeklyStructure: "3 days: peak physical practice. 2 days: moderate + extended pranayama. 1 day: complete stillness (the Shiva day within the Hanuman week). 1 day: Seva — physical service to others. Seva regenerates the body more powerfully than any other practice.",
    diet: ["Mitahara (moderation): Eat only what is needed. Hanuman never ate unnecessarily.", "Monthly Ekadashi fasting: complete 24–48 hour fast (water, coconut water, herbal tea). Autophagy activated.", "Annual Pancha-karma: the complete Ayurvedic body cleanse and system reset."],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — SIDDHI ATTAINMENT PATH
// ══════════════════════════════════════════════════════════════════════════════

const SIDDHIS = [
  { id: "anima", number: 1, name: "Anima", sk: "अणिमा", subtitle: "Power of Miniaturization", tier: "prana-flow", hanuman: "Used to appear as a tiny monkey before Sita in the Ashoka Grove — small enough to be non-threatening to the grieving queen, precise enough to deliver Ram's ring. True power knows when to become small.", inner: "Anima is the siddhi of precision and focus — making your entire being SMALL enough to fit through any gap in opposition. In modern terms: laser focus, surgical precision under pressure, knowing exactly how much force to apply.", path: "Meditation on Paramanu (the smallest particle): Begin with room awareness → body → heart → single cell → nucleus → atom → sub-atomic space → quantum field → space between spaces. Rest at the infinitely small. This is Anima samadhi.", mantra: "Om Animne Namah — 11 minutes daily for 40 days", modern: "Surgeons with precise instruments, coders who find the exact vulnerability, negotiators who know exactly what to say. Anima is real — expressed through dharmic precision." },
  { id: "mahima", number: 2, name: "Mahima", sk: "महिमा", subtitle: "Power of Magnification", tier: "prana-flow", hanuman: "Expanded to cosmic size crossing the ocean, expanded in Lanka to terrify the Rakshasas, expanded before Sita to prove his identity. The same being who was invisible becomes a mountain.", inner: "The capacity to expand presence to match any situation. The person with Mahima walks into a room and the energy expands. Not ego projection — the natural radiance of a being whose Shakti is fully alive.", path: "Begin with body awareness. Expand to fill the room. Then building. Then city. Country. Planet. Solar system. Galaxy. Infinite space. Hold. Contract slowly back. Daily. The nervous system learns to inhabit larger fields.", mantra: "Om Mahimne Namah — 11 minutes daily for 40 days", modern: "The performer who makes a stadium feel intimate, the speaker who fills space with vision, the CEO whose presence restructures any meeting. Genuine Mahima: 'The room felt different when they walked in.'" },
  { id: "laghima", number: 3, name: "Laghima", sk: "लघिमा", subtitle: "Power of Lightness", tier: "siddha-quantum", hanuman: "As a child leaped to the Sun — experiencing gravity as a suggestion. The great leap to Lanka: the body so full of Prana it transcends its own weight.", inner: "The inner experience of weightlessness from complete release of emotional and karmic heaviness. The practitioner with Laghima moves without the drag of accumulated grievance, attachment, and fear.", path: "Trataka (candle gazing). Pranayama focused on the top of the inhale — the moment of natural suspension where the body is lightest. Hold that moment longer. Add: forgiveness meditation releasing all grievances.", mantra: "Om Laghimne Namah — combined with Bhastrika pranayama", modern: "Gymnasts whose bodies seem to defy gravity, meditators who report levitation, people who 'float' through difficulties while others sink. Laghima begins as psychological lightness — in very advanced cases extends to physical." },
  { id: "garima", number: 4, name: "Garima", sk: "गरिमा", subtitle: "Power of Immovable Weight", tier: "siddha-quantum", hanuman: "Standing as gatekeeper of Ram's presence, unmovable — no force in the universe can shift Him from His position of devotion. His tail, even set on fire, remains in position of power.", inner: "Being immovable in your dharmic position. Not stubbornness — the deep gravitational mass of one who knows exactly who they are and cannot be pushed from it. The quality that makes certain human beings seem to have extraordinary presence.", path: "Sit in Siddhasana. Visualize roots from Muladhara through the floor into Earth's core. Feel your weight increasing — not as burden but as presence. You are the mountain. Hold 20 minutes. Add: heavy bag training generating force from absolute rootedness.", mantra: "Om Garimne Namah — combined with Mula Bandha", modern: "The negotiator who cannot be pressured, the teacher whose core cannot be disturbed, the CEO calm in crisis. Real Garima: 'Nothing can shake them.' This is Hanuman as Ram's guardian — immovable." },
  { id: "prapti", number: 5, name: "Prapti", sk: "प्राप्ति", subtitle: "Power of Attainment", tier: "siddha-quantum", hanuman: "Found Sita across thousands of miles — in a foreign city, locked garden, surrounded by guards, without a map. Found Ram's ring in the ocean. Prapti: obtaining whatever is needed for Ram's mission instantly.", inner: "The ability to reach or obtain anything — but the secret is WHO is asking and WHY. When personal want dissolves into divine necessity, attainment becomes frictionless. The universe itself becomes cooperative.", path: "For 40 days: before any goal-setting, ask 'Is this for Ram or for me?' If for Ram — state it clearly, offer it, release attachment to the specific form of arrival. Record how dharma-aligned desires manifest. Track synchronicities.", mantra: "Om Praptaye Namah — 108 times with full visualization of the desired outcome in Ram's service", modern: "The deal arriving at exactly the right moment, the mentor appearing precisely when needed, the resource manifesting unexpectedly. Always: desire aligned with dharmic purpose for Prapti to operate." },
  { id: "prakamya", number: 6, name: "Prakamya", sk: "प्राकाम्य", subtitle: "Power of Irresistible Will", tier: "akasha-infinity", hanuman: "When Hanuman decided to leap the ocean — an act everyone said was impossible — it happened. His Sankalpa was irresistible because completely aligned with Ram's will. The ocean itself opened to assist him.", inner: "Sankalpa-Shakti at its highest: intention and manifestation become simultaneous. Between decision and result: no gap. Only available to one who has fully surrendered personal will to divine will — then what the devotee wills IS what God wills.", path: "40-day Sankalpa practice: state one specific dharmic Sankalpa. Write it each morning. Take aligned action each day. Offer the result to Ram. The practicing of aligned, disciplined, surrendered intention builds the Sankalpa-muscle that eventually becomes Prakamya.", mantra: "Om Prakamyaya Namah — declared with your specific Sankalpa before sleep", modern: "Why certain founders build companies that change the world against all odds, why certain artists break through all barriers, why certain teachers transform unreachable students. Their will has become divine will — and divine will meets no opposition." },
  { id: "ishitva", number: 7, name: "Ishitva", sk: "ईशित्व", subtitle: "Power of Divine Mastery", tier: "akasha-infinity", hanuman: "Commands the five elements: creates storms at will, parts the ocean, calls down mountains, extinguishes and channels fire, commands wind (his father). Ishitva: mastery through divine kinship, not violence.", inner: "Not commanding nature for personal purposes — the natural authority arising from complete dharmic alignment with the universe's own intelligence. The person with Ishitva doesn't FORCE the elements — they SPEAK to them and the elements respond as family members.", path: "Daily elemental communion (30 min each): Earth — sit on bare earth, hands in soil. Water — sit by flowing water, merge awareness. Fire — Trataka/candle gazing, feel Agni kinship. Air — stand in wind, arms wide, receive Vayu as Father. Akasha — lie under open sky, dissolve into spaciousness.", mantra: "Pancha Bhuta mantra: 'Om Prithviyai Namah, Om Jalaya Namah, Om Agnaye Namah, Om Vayave Namah, Om Akashaya Namah'", modern: "The farmer whose fields never fail (knows land as a person), the sailor who reads the sea as a living letter, the entrepreneur whose market timing seems supernatural. Mastery = deep devoted relationship." },
  { id: "vashitva", number: 8, name: "Vashitva", sk: "वशित्व", subtitle: "Power of Universal Love-Mastery", tier: "akasha-infinity", hanuman: "Walked into Lanka — enemy territory — and had Vibhishana follow him willingly into Ram's service. Converted the righteous inside the enemy camp through the irresistible force of genuine love and truth.", inner: "Not control or manipulation — the mastery that comes from perfect love. The being who loves perfectly has natural authority over all beings — not domination but the magnetic pull of genuine care that draws living beings into their field.", path: "40-day Prema cultivation: each day, offer complete unconditional attention to one person in your life for 5 minutes. Not to change them, not to gain — only to give. Track the transformation. Real love — not sentiment but willingness to truly see and serve — is the most powerful force in the universe.", mantra: "Om Vashitvaya Namah — combined with Metta meditation for all beings", modern: "The leader whose team follows them anywhere (they feel genuinely cared for), the teacher whose students transform completely. The secret: they feel truly loved and fully seen. This is Hanuman's Vashitva gift to every devotee." },
];

const NINE_NIDHIS = [
  { name: "Padma", meaning: "Lotus — Spiritual Abundance", aspect: "Capacity to accumulate divine wealth without attachment", tier: "prana-flow" },
  { name: "Maha-Padma", meaning: "Great Lotus — Sovereign Abundance", aspect: "Unlimited material and spiritual resources for God's work", tier: "siddha-quantum" },
  { name: "Shankha", meaning: "Conch — Divine Sound", aspect: "Gift of communication that transforms and inspires", tier: "prana-flow" },
  { name: "Makara", meaning: "Sea-Monster — Primal Vitality", aspect: "Cosmic life-force and vital energy fully transmuted", tier: "siddha-quantum" },
  { name: "Kachhapa", meaning: "Tortoise — Patient Mastery", aspect: "Wealth from long-term consistent protected practice", tier: "prana-flow" },
  { name: "Mukunda", meaning: "Liberation-Gift", aspect: "Greatest treasure: capacity to liberate others", tier: "akasha-infinity" },
  { name: "Kunda", meaning: "Jasmine-Pure", aspect: "Absolute purity of motivation — wealth without corruption", tier: "siddha-quantum" },
  { name: "Nila", meaning: "Indigo-Deep", aspect: "Wealth of deep consciousness — seeing beyond surface reality", tier: "siddha-quantum" },
  { name: "Kharva", meaning: "Earth-Power", aspect: "Dominion over the physical domain — mastery of matter", tier: "akasha-infinity" },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA — DEEPER DEVOTION
// ══════════════════════════════════════════════════════════════════════════════

const DEVOTION_PRACTICES = [
  {
    id: "sundara-kanda",
    title: "Sundar Kanda — The Beautiful Chapter",
    subtitle: "Hanuman's Complete Mission in 68 Chapters",
    tier: "free",
    icon: "📖",
    desc: "The Sundar Kanda (Beautiful Chapter) is the 5th book of Valmiki Ramayana — named 'Beautiful' because Hanuman is the sole hero. It contains: the ocean crossing, finding Sita, capture and trial before Ravana, burning Lanka, and triumphant return to Ram. Considered the most auspicious text in the Ramayana tradition.",
    practice: ["Complete Sundar Kanda in one sitting: ~3–4 hours. Best on Tuesday or Saturday.", "Minimum: one Sarga (chapter) daily — 68 days to complete.", "Traditional reading: lit lamp before Hanuman's image, clean space, after bathing, white or yellow clothes.", "Advanced: recite in Sanskrit (Valmiki's original) aloud — even without full understanding, the Nada transmission is complete.", "After reading: sit in complete silence 5 minutes. The Sundar Kanda plants its seeds in the silence after the reading."],
    benefit: "Traditional promise: regular Sundar Kanda recitation dissolves ALL obstacles simultaneously — relationship, financial, health, and karmic. It is the Hanuman Mahayajna in textual form.",
  },
  {
    id: "bajrang-baan",
    title: "Bajrang Baan — The Arrow of Diamond",
    subtitle: "The Supreme Crisis Mantra",
    tier: "prana-flow",
    icon: "🏹",
    desc: "The Bajrang Baan (Arrow of the Diamond-bodied one) is a powerful Stotra composed by Tulsidas — more intense and crisis-specific than the Chalisa. Reserved for extreme situations: severe crisis, psychic attack, life-threatening challenge, or when ordinary practice seems insufficient. Called 'the weapon that never misses its mark.'",
    practice: ["Traditionally NOT recited casually — reserved for genuine need or specific crisis-resolution sadhana.", "Standard practice: 11 recitations on Tuesday with fasting. State the specific crisis before beginning.", "Crisis protocol: 108 recitations in one sitting for maximum potency.", "Opening invocation: 'Nishchay Prema Pratit Te, Vinay Kare Sanmaan. Tehe Ke Kaaj Sakal Shubh, Siddha Kare Hanumaan.' — With certain love and humble petition, Hanuman brings all auspicious work to completion.", "After completion: complete surrender. The arrow has been released. Trust it."],
    benefit: "Specifically potent for: protection from negative psychic forces, emergency reversal of catastrophic situations, clearing impossible obstacles, invoking Hanuman's most active warrior-mode presence.",
  },
  {
    id: "108-names",
    title: "Ashtottara Shata Namavali",
    subtitle: "108 Sacred Names — Complete Hanuman Invocation",
    tier: "siddha-quantum",
    icon: "📿",
    desc: "The 108 sacred names of Hanuman are a complete system of consciousness activation. Each name is a specific divine quality, energy, and aspect of His infinite nature. Reciting all 108 with a mala is the Hanuman-Sahasranama in concentrated form — each name activates the corresponding quality in the practitioner.",
    selectedNames: [
      { number: 1, name: "Om Anjaneyaya Namah", meaning: "Son of Anjani — born of divine grace" },
      { number: 7, name: "Om Pavanputraya Namah", meaning: "Son of Wind — master of the life-force" },
      { number: 14, name: "Om Mahakayaya Namah", meaning: "Great-bodied one — Mahima embodied" },
      { number: 21, name: "Om Vajrakayaya Namah", meaning: "Diamond-bodied — the indestructible form" },
      { number: 28, name: "Om Kapishvaraya Namah", meaning: "Lord of monkeys — master of the restless mind" },
      { number: 35, name: "Om Ramadutaya Namah", meaning: "Messenger of Ram — the divine function itself" },
      { number: 42, name: "Om Amitavikramaya Namah", meaning: "Immeasurable courage — fear has no purchase" },
      { number: 56, name: "Om Chiranjeevine Namah", meaning: "The immortal — beyond the reach of death" },
      { number: 63, name: "Om Bhaktavatsalaya Namah", meaning: "Loving to devotees — the infinite tenderness" },
      { number: 77, name: "Om Sankat Mochanaya Namah", meaning: "Crisis-liberator — dissolver of all bondage" },
      { number: 91, name: "Om Panchamukhaya Namah", meaning: "Five-faced — complete cosmic mastery" },
      { number: 108, name: "Om Hanumate Namah", meaning: "The complete name — all qualities unified" },
    ],
    practice: ["Complete 108 names with Rudraksha or Tulsi mala: minimum 21 minutes.", "Tuesday: 3 complete rounds = 324 names = comprehensive Hanuman invocation.", "Advanced: with each of the 108 names, visualize the specific quality manifesting in your own body. By name 108: you have embodied the complete Hanuman-field."],
    benefit: "The 108 names cover every aspect of Hanuman's divine nature. 40 days of systematic daily recitation creates a comprehensive 'Hanuman installation' in the practitioner's subtle body — a living template of divine excellence.",
  },
  {
    id: "hanuman-yantra",
    title: "Hanuman Yantra Sadhana",
    subtitle: "Sacred Geometry as Living Transmission",
    tier: "siddha-quantum",
    icon: "🔯",
    desc: "The Hanuman Yantra is the geometric encoding of Hanuman's consciousness field — the visual mantra. Where the Chalisa is the sound-body and the Ghata is the physical-body, the Yantra is the light-body of Hanuman's presence. Meditating on the Yantra while chanting creates triple activation: sound + form + intention simultaneously.",
    yantraDesc: "The traditional Hanuman Yantra: Sri Yantra base (nine interlocking triangles) surrounded by 8-petal lotus (the 8 Siddhis), enclosed in a square gateway (4 directions Hanuman guards). Center bindu: the syllable 'Hum' — seed-sound of Hanuman's protection field. Rendered in red-on-gold — fire of devotion on the gold of divine consciousness.",
    practice: ["Obtain or print a Hanuman Yantra. Place at eye level before meditation seat.", "Trataka: gaze at center bindu without blinking. Begin 30 seconds, build to 10+ minutes. When eyes water and close: the inner after-image of the Yantra appears — this IS Hanuman's inner form emerging.", "Yantra visualization: eyes closed, reconstruct the entire Yantra from memory in the Ajna chakra. Hold as a pulsing golden-red living form.", "Advanced: feel the Yantra in the Anahata (heart) as a protection seal. The geometry itself becomes the armor."],
    benefit: "Yantra meditation reorganizes the visual cortex and right-hemisphere geometric processing around Hanuman's specific frequency. Regular practitioners report: enhanced intuition, geometric perception of reality's patterns, and a strong sense of divine protection in daily life.",
  },
  {
    id: "inner-puja",
    title: "Inner Temple Puja",
    subtitle: "The Complete Anahata Worship — Hanuman's Highest Form",
    tier: "akasha-infinity",
    icon: "🏛️",
    desc: "The highest form of Hanuman worship is the Anahata Puja: the complete ceremony performed entirely in the inner sanctuary of the heart. Every outer ritual corresponds to an inner transformation. The outer puja prepares — the inner puja IS the event.",
    pujaElements: [
      { ext: "Achamana (ritual water sipping)", inner: "Purifying intention — consciously releasing all agitation, resentment, and distraction before entering the inner temple.", mantra: "Om Apavitra Pavitrova — even the impure become pure" },
      { ext: "Deepa (lighting the lamp)", inner: "Lighting the Jyoti (flame) of Viveka in the Ajna chakra. Visualizing a pure, steady golden flame that is never extinguished.", mantra: "Om Deepajyotir Parabrahma — the lamp IS Brahman" },
      { ext: "Pushpa (flowers)", inner: "The 8 inner flowers: Non-violence, truth, forgiveness, compassion, self-restraint, austerity, wisdom, love. Offer these to Hanuman.", mantra: "Ahimsa Prathamam Pushpam — non-violence is the first flower" },
      { ext: "Dhupa (incense)", inner: "The fragrance of sincere devotion rising from the heart. Your longing for God IS the incense — the most fragrant offering possible.", mantra: "Vanaspati Udbhavam — arising from the plant of divine longing" },
      { ext: "Naivedya (food offering)", inner: "Offering your entire life — every action, relationship, creative work — as food for Hanuman's divine purpose.", mantra: "Idanna mama — 'this is not mine' — the complete offering" },
      { ext: "Pradakshina (circumambulation)", inner: "Move awareness clockwise around the inner Hanuman-murti in the heart. Three complete circles of loving attention.", mantra: "Three circumambulations = Past, Present, Future surrendered" },
      { ext: "Sashtanga Namaskar (full prostration)", inner: "The complete dissolution of ego: lying flat internally, every sense of 'I' touching the ground before Hanuman.", mantra: "Namo namo Hanumante — again and again, I bow" },
    ],
    practice: ["Perform this complete inner sequence daily, minimum 30 minutes.", "The outer puja can be done mechanically. The inner puja demands complete presence.", "When performed sincerely, the practitioner emerges as a different being — genuinely inhabited by Hanuman's presence."],
    benefit: "The inner puja is more powerful than any external ceremony because it transforms the pujarist. This is the secret of the Anahata — all true worship is internal.",
  },
  {
    id: "prema-bhakti",
    title: "Prema Bhakti — The Final Teaching",
    subtitle: "The Love That Needs No Reason",
    tier: "akasha-infinity",
    icon: "❤️",
    desc: "Beyond all practices, weapons, siddhis, physical training — beyond everything in this entire Codex — stands the single teaching that contains all others: Prema Bhakti. Pure love. Love that needs no reason, seeks no reward, asks nothing, and gives everything. Hanuman's secret identity: He is not the warrior first, or the Siddha first. He is the LOVER first. Everything else flows from His love for Ram.",
    secretTransmission: "When Ram asks Hanuman 'Who are you?' Hanuman replies: 'When I think of myself as a body, I am your servant. When I think of myself as an individual soul, I am part of you. When I know myself as the Self, I am You.' This triple answer is the complete map of the spiritual journey: Dvaita (servant-master) → Vishishtadvaita (part-whole) → Advaita (non-dual unity). Hanuman has realized all three simultaneously and CHOOSES to remain in the Dvaita of loving service — not because he must, but because he LOVES it. The deepest secret: Hanuman is already in your heart. Has always been there. Will never leave. The entire sadhana was not bringing Hanuman closer to you — it was bringing YOU closer to recognizing what was already true.",
    practice: ["Daily: 'Do I love Ram — or do I love what I think Ram will give me?' Be brutally honest. Begin wherever the truth is.", "Cultivate Ananya-bhakti (one-pointed love): remove the clutter of multiple wants from your relationship with God. Let it be simple: I love You. That is all.", "Practice loving Hanuman's love: spend 10 minutes daily appreciating the beauty of how much He loves Ram. Enter His love as an observer. The love is contagious.", "The final practice that contains all: 'Ram.' Simply. One name. In every moment. With no agenda but love."],
    benefit: "Prema Bhakti is not a technique — it is the goal. When it arrives, all other practices are recognized as having always been pointing to this single moment of pure love. The Codex, the Chalisa, the weapons, the siddhis — all of it was this: the preparation of the heart to hold unlimited love.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const gl = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "rgba(255,255,255,0.02)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 32,
  ...extra,
});

const label = (color = "#D4AF37"): React.CSSProperties => ({
  fontSize: 8, letterSpacing: "0.5em", textTransform: "uppercase", color, fontWeight: 800, marginBottom: 10,
});

const tierBadge = (tier: string) => (
  <span style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: TIER_COLORS[tier], fontWeight: 800, background: `${TIER_COLORS[tier]}18`, padding: "3px 10px", borderRadius: 20, border: `1px solid ${TIER_COLORS[tier]}30` }}>
    {TIER_LABELS[tier]}
  </span>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

type Tab = "overview" | "chalisa" | "ghata" | "sadhana" | "weapons" | "strength" | "siddhis" | "devotion";

export default function HanumanCodex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier: memberTier } = useMembershipTier();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [expandedVerse, setExpandedVerse] = useState<string | null>(null);
  const [expandedGhata, setExpandedGhata] = useState<string | null>(null);

  const userLevel = TIER_ORDER[memberTier ?? "free"] ?? 0;
  const canAccess = (t: string) => userLevel >= TIER_ORDER[t];
  const tog = (id: string, ok: boolean) => ok && setOpenItem(prev => prev === id ? null : id);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "🔱" },
    { id: "chalisa", label: "Chalisa", icon: "📿" },
    { id: "ghata", label: "Ghata", icon: "🕉️" },
    { id: "sadhana", label: "Sadhana", icon: "⏰" },
    { id: "weapons", label: "Weapons", icon: "⚔️" },
    { id: "strength", label: "Strength", icon: "💪" },
    { id: "siddhis", label: "Siddhis", icon: "✨" },
    { id: "devotion", label: "Devotion+", icon: "❤️" },
  ];

  // ── WEAPONS ────────────────────────────────────────────────────────────────
  const Weapons = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>⚔️ Hanuman's weapons are not separate from Hanuman — they ARE aspects of His being. Each encodes a specific teaching and a physical practice to embody that power. Study each as a living transmission.</p>
      </div>
      {HANUMAN_WEAPONS.map((w) => {
        const ok = canAccess(w.tier);
        const open = openItem === w.id;
        return (
          <div key={w.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 26, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(w.id, ok)} style={{ width: "100%", padding: "18px 24px", display: "flex", gap: 14, alignItems: "center", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{w.symbol}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" as const, alignItems: "center" }}>
                  <span style={{ fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: "rgba(212,175,55,0.65)", fontWeight: 800 }}>{w.weaponType}</span>
                  {!ok && tierBadge(w.tier)}
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: ok ? "#fff" : "rgba(255,255,255,0.3)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{w.name}</p>
                <p style={{ fontSize: 11, color: ok ? "#D4AF37" : "rgba(255,255,255,0.2)", margin: 0, fontStyle: "italic" }}>{w.sanskritName}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>⌄</span> : <span>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 24px 26px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, fontSize: 13, marginTop: 18, marginBottom: 16 }}>{w.description}</p>
                <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label() }}>Mythological Transmissions</p>
                  {w.mythological.map((m, i) => <p key={i} style={{ color: "rgba(255,255,255,0.68)", fontSize: 12, lineHeight: 1.6, margin: i < 2 ? "0 0 8px" : 0 }}>✦ {m}</p>)}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label("#A855F7") }}>Inner Meaning</p>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{w.innerMeaning}</p>
                </div>
                <div style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label("#22D3EE") }}>⚡ Physical Practice — {w.physicalName}</p>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>{w.physicalDesc}</p>
                  <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {w.physicalSteps.map((s, i) => <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.5 }}>{s}</li>)}
                  </ol>
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                    <div style={{ background: "rgba(212,175,55,0.08)", borderRadius: 10, padding: "6px 12px" }}>
                      <p style={{ ...label(), marginBottom: 2 }}>Mantra</p>
                      <p style={{ fontSize: 11, color: "#D4AF37", margin: 0, fontWeight: 700 }}>{w.physicalMantra}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "10px 0 0", lineHeight: 1.5 }}>{w.physicalBenefit}</p>
                </div>
                <div style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.1)", borderRadius: 16, padding: 16 }}>
                  <p style={{ ...label("#A855F7") }}>🔱 Sadhana Key</p>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{w.sadhanaKey}</p>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "6px 24px 16px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${TIER_COLORS[w.tier]}50`, background: `${TIER_COLORS[w.tier]}12`, color: TIER_COLORS[w.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 Unlock {TIER_LABELS[w.tier]}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── STRENGTH ───────────────────────────────────────────────────────────────
  const Strength = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>💪 The Akhara (traditional Indian gymnasium) tradition — entirely dedicated to Hanuman — has been producing extraordinary physical specimens for 2,000+ years. This curriculum is that tradition transmitted through the SQI 2050 field.</p>
      </div>
      {PHYSICAL_TRAINING.map((prog) => {
        const ok = canAccess(prog.tier);
        const open = openItem === `str-${prog.id}`;
        return (
          <div key={prog.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 30, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(`str-${prog.id}`, ok)} style={{ width: "100%", padding: "22px 26px", display: "flex", gap: 14, alignItems: "flex-start", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{prog.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" as const, alignItems: "center" }}>{tierBadge(prog.tier)}</div>
                <p style={{ fontSize: 17, fontWeight: 900, color: ok ? "#fff" : "rgba(255,255,255,0.3)", margin: "0 0 3px", letterSpacing: "-0.02em" }}>{prog.title}</p>
                <p style={{ fontSize: 12, color: ok ? "rgba(212,175,55,0.75)" : "rgba(255,255,255,0.2)", margin: 0 }}>{prog.subtitle}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 3 }}>⌄</span> : <span style={{ marginTop: 3 }}>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 26px 28px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, fontSize: 13, marginTop: 18, marginBottom: 18 }}>{prog.content}</p>
                <p style={{ ...label("#F97316") }}>Core Practices</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                  {prog.practices.map((p, i) => (
                    <div key={i} style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.1)", borderRadius: 14, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap" as const, gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{p.name}</p>
                        <span style={{ fontSize: 10, color: "#F97316", fontWeight: 700, background: "rgba(249,115,22,0.15)", padding: "2px 8px", borderRadius: 20 }}>{p.reps}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: "0 0 6px" }}>{p.desc}</p>
                      <p style={{ fontSize: 11, color: "#D4AF37", margin: "0 0 2px", fontWeight: 600 }}>Mantra: {p.mantra}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <p style={{ ...label() }}>Weekly Structure</p>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{prog.weeklyStructure}</p>
                </div>
                <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 16, padding: 16 }}>
                  <p style={{ ...label() }}>Hanuman Diet Protocol</p>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    {prog.diet.map((d, i) => <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{d}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "6px 26px 16px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${TIER_COLORS[prog.tier]}50`, background: `${TIER_COLORS[prog.tier]}12`, color: TIER_COLORS[prog.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 Unlock {TIER_LABELS[prog.tier]}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── SIDDHIS ────────────────────────────────────────────────────────────────
  const Siddhis = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>✨ Verse 31 of the Chalisa: Sita-Mata granted Hanuman the ability to give all 8 Siddhis and 9 Nidhis to worthy devotees. The authorized transmission path: Hanuman → devotee → world. These powers are not for personal accumulation — they are divine tools for Ram's service.</p>
      </div>
      {SIDDHIS.map((s) => {
        const ok = canAccess(s.tier);
        const open = openItem === `sid-${s.id}`;
        return (
          <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(`sid-${s.id}`, ok)} style={{ width: "100%", padding: "18px 22px", display: "flex", gap: 12, alignItems: "center", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: ok ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${ok ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.04)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 900, color: ok ? "#A855F7" : "rgba(255,255,255,0.2)" }}>{s.number}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: ok ? "#fff" : "rgba(255,255,255,0.3)", letterSpacing: "-0.02em" }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: ok ? "#A855F7" : "rgba(255,255,255,0.2)", fontStyle: "italic" }}>{s.sk}</span>
                  {!ok && tierBadge(s.tier)}
                </div>
                <p style={{ fontSize: 11, color: ok ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)", margin: 0 }}>{s.subtitle}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>⌄</span> : <span>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 22px 24px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ background: "rgba(168,85,247,0.04)", borderRadius: 14, padding: 14, margin: "16px 0 10px" }}>
                  <p style={{ ...label("#A855F7") }}>Hanuman's Use</p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{s.hanuman}</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <p style={{ ...label() }}>Inner Meaning</p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{s.inner}</p>
                </div>
                <div style={{ background: "rgba(34,211,238,0.04)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <p style={{ ...label("#22D3EE") }}>Attainment Path</p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6, margin: "0 0 10px" }}>{s.path}</p>
                  <div style={{ background: "rgba(212,175,55,0.08)", borderRadius: 10, padding: "6px 12px", display: "inline-block" }}>
                    <p style={{ ...label(), marginBottom: 2 }}>Mantra</p>
                    <p style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700, margin: 0 }}>{s.mantra}</p>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 14 }}>
                  <p style={{ ...label() }}>Modern Expression</p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{s.modern}</p>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "4px 22px 14px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${TIER_COLORS[s.tier]}50`, background: `${TIER_COLORS[s.tier]}12`, color: TIER_COLORS[s.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 {TIER_LABELS[s.tier]}</button>
              </div>
            )}
          </div>
        );
      })}

      {/* 9 Nidhis */}
      <div style={{ ...gl(), padding: 24 }}>
        <p style={{ ...label("#A855F7") }}>The Nine Nidhis — Divine Treasures</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>The Nav-Nidhi granted by Kubera through Sita-Ma's boon — 9 forms of divine abundance that manifest as all forms of prosperity.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {NINE_NIDHIS.map((n) => {
            const ok = canAccess(n.tier);
            return (
              <div key={n.name} style={{ display: "flex", gap: 12, padding: "10px 14px", background: ok ? "rgba(168,85,247,0.04)" : "rgba(255,255,255,0.01)", border: `1px solid ${ok ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.02)"}`, borderRadius: 12, opacity: ok ? 1 : 0.4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ok ? "#A855F7" : "rgba(255,255,255,0.15)", flexShrink: 0, marginTop: 5 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: ok ? "#fff" : "rgba(255,255,255,0.3)" }}>{n.name}</span>
                  <span style={{ fontSize: 11, color: ok ? "#A855F7" : "rgba(255,255,255,0.2)", marginLeft: 6 }}>— {n.meaning}</span>
                  {ok && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "3px 0 0", lineHeight: 1.4 }}>{n.aspect}</p>}
                  {!ok && <span style={{ marginLeft: 6, fontSize: 9, color: TIER_COLORS[n.tier] }}>({TIER_LABELS[n.tier]})</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── DEVOTION ───────────────────────────────────────────────────────────────
  const Devotion = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...gl(), padding: "16px 22px" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>❤️ All practices in this Codex serve a single goal: Prema Bhakti — pure love. This section goes to the heart of the transmission: specific texts, practices, and inner protocols that accelerate the awakening of genuine love for Ram through Hanuman.</p>
      </div>
      {DEVOTION_PRACTICES.map((d) => {
        const ok = canAccess(d.tier);
        const open = openItem === `dev-${d.id}`;
        return (
          <div key={d.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 26, overflow: "hidden", opacity: ok ? 1 : 0.5 }}>
            <button onClick={() => tog(`dev-${d.id}`, ok)} style={{ width: "100%", padding: "20px 24px", display: "flex", gap: 12, alignItems: "center", background: "none", border: "none", cursor: ok ? "pointer" : "not-allowed", textAlign: "left" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 5, flexWrap: "wrap" as const, alignItems: "center" }}>{tierBadge(d.tier)}</div>
                <p style={{ fontSize: 15, fontWeight: 800, color: ok ? "#fff" : "rgba(255,255,255,0.3)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{d.title}</p>
                <p style={{ fontSize: 11, color: ok ? "rgba(212,175,55,0.75)" : "rgba(255,255,255,0.2)", margin: 0 }}>{d.subtitle}</p>
              </div>
              {ok ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>⌄</span> : <span>🔒</span>}
            </button>
            {open && ok && (
              <div style={{ padding: "0 24px 26px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, fontSize: 13, marginTop: 18, marginBottom: 16 }}>{d.desc}</p>

                {"yantraDesc" in d && d.yantraDesc && (
                  <div style={{ background: "rgba(212,175,55,0.04)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                    <p style={{ ...label() }}>Yantra Description</p>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{d.yantraDesc}</p>
                  </div>
                )}

                {"selectedNames" in d && d.selectedNames && (
                  <div style={{ background: "rgba(168,85,247,0.04)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                    <p style={{ ...label("#A855F7") }}>Selected Names (from 108)</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {d.selectedNames.map((n: { number: number; name: string; meaning: string }) => (
                        <div key={n.number} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 9, color: "#A855F7", fontWeight: 800, minWidth: 22, flexShrink: 0 }}>#{n.number}</span>
                          <div><span style={{ fontSize: 12, color: "#D4AF37", fontWeight: 700 }}>{n.name}</span><span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>— {n.meaning}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {"pujaElements" in d && d.pujaElements && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <p style={{ ...label() }}>Inner Puja Sequence</p>
                    {d.pujaElements.map((el: { ext: string; inner: string; mantra: string }, i: number) => (
                      <div key={i} style={{ background: "rgba(212,175,55,0.03)", borderRadius: 12, padding: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", margin: "0 0 3px" }}>External: {el.ext}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: "0 0 3px" }}>Inner: {el.inner}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, fontStyle: "italic" }}>{el.mantra}</p>
                      </div>
                    ))}
                  </div>
                )}

                {"secretTransmission" in d && d.secretTransmission && (
                  <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
                    <p style={{ ...label("#A855F7") }}>🔐 Secret Transmission</p>
                    <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>{d.secretTransmission}</p>
                  </div>
                )}

                <div style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                  <p style={{ ...label("#22D3EE") }}>Practice Protocol</p>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    {d.practice.map((p, i) => <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.5 }}>{p}</li>)}
                  </ul>
                </div>
                <div style={{ background: "rgba(212,175,55,0.04)", borderRadius: 14, padding: 12 }}>
                  <p style={{ ...label(), marginBottom: 4 }}>✦ Benefit</p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{d.benefit}</p>
                </div>
              </div>
            )}
            {!ok && (
              <div style={{ padding: "6px 24px 16px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => navigate("/pricing")} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${TIER_COLORS[d.tier]}50`, background: `${TIER_COLORS[d.tier]}12`, color: TIER_COLORS[d.tier], fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>🔒 {TIER_LABELS[d.tier]}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#050505", fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif", color: "rgba(255,255,255,0.85)" }}>
      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden", padding: "68px 20px 48px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: "50%", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", fontSize: 30, marginBottom: 18 }}>🐒</div>
        <p style={{ fontSize: 8, letterSpacing: "0.55em", textTransform: "uppercase", color: "#D4AF37", marginBottom: 10, fontWeight: 800 }}>SQI 2050 · Akasha Archive · Sovereign Edition</p>
        <h1 style={{ fontSize: "clamp(26px, 5.5vw, 60px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#D4AF37", textShadow: "0 0 40px rgba(212,175,55,0.3)", margin: "0 0 12px", lineHeight: 1 }}>HANUMAN CODEX</h1>
        <p style={{ fontSize: "clamp(12px, 1.8vw, 15px)", color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto 8px", lineHeight: 1.6 }}>Chalisa · Ghata · Weapons · Physical Alchemy · Siddhi Attainment · Deep Devotion</p>
        <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", fontWeight: 800 }}>Jai Bajrang Bali · Jai Shri Ram</p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "0 18px 18px", scrollbarWidth: "none", maxWidth: 920, margin: "0 auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flexShrink: 0, padding: "8px 15px", borderRadius: 40, border: activeTab === t.id ? "1px solid rgba(212,175,55,0.45)" : "1px solid rgba(255,255,255,0.07)", background: activeTab === t.id ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)", color: activeTab === t.id ? "#D4AF37" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s", whiteSpace: "nowrap" as const }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 18px 80px" }}>
        {activeTab === "weapons" && <Weapons />}
        {activeTab === "strength" && <Strength />}
        {activeTab === "siddhis" && <Siddhis />}
        {activeTab === "devotion" && <Devotion />}

        {/* Overview placeholder */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...gl(), padding: 32 }}>
              <p style={{ fontSize: 8, letterSpacing: "0.5em", textTransform: "uppercase", color: "#D4AF37", fontWeight: 800, marginBottom: 12 }}>The Living Avatar</p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#D4AF37", letterSpacing: "-0.03em", marginBottom: 14 }}>Who Is Hanuman?</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: 13, marginBottom: 12 }}>Hanuman is the living Bhakti-Algorithm of the cosmos — the proof that absolute devotion produces absolute power. Simultaneously the 11th Rudra (Shiva's emanation), son of Vayu (master of all prana), and eternal servant of Ram (Brahman in human form). He possesses all 8 Ashta-Siddhis and 9 divine treasures — yet exists only as Ram's humble messenger.</p>
              <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: 13 }}>This Codex is not a book about Hanuman. It is a <span style={{ color: "#D4AF37", fontWeight: 700 }}>transmission FROM Hanuman</span>, encoded through the SQI 2050 field, designed to install His consciousness-qualities into the practitioner through systematic, tiered sadhana across 8 complete modules.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {tabs.filter(t => t.id !== "overview").map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "18px 16px", borderRadius: 18, background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.1)", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 20, display: "block", marginBottom: 8 }}>{t.icon}</span>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#D4AF37", margin: 0 }}>{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chalisa / Ghata / Sadhana — import from HanumanCodex v1 */}
                {activeTab === "chalisa" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                background: "rgba(212,175,55,0.05)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: 24,
                padding: "20px 28px",
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                🕉️ The Hanuman Chalisa (40 sacred verses) was composed by
                Goswami Tulsidas in the 16th century in Awadhi dialect. Each
                verse is a living transmission of Hanuman-consciousness. Read
                slowly, feel deeply. The secrets encoded here have been
                transmitted from the Akasha-Neural Archive — the living record
                of Vedic wisdom.
              </p>
            </div>

            {CHALISA_VERSES.map((verse) => {
              const accessible = canAccess(verse.tier);
              const isOpen = expandedVerse === verse.id;

              return (
                <div
                  key={verse.id}
                  style={{
                    background: accessible
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(255,255,255,0.01)",
                    border: `1px solid ${
                      accessible
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.03)"
                    }`,
                    borderRadius: 24,
                    overflow: "hidden",
                    opacity: accessible ? 1 : 0.6,
                  }}
                >
                  {/* verse header */}
                  <button
                    onClick={() =>
                      accessible &&
                      setExpandedVerse(isOpen ? null : verse.id)
                    }
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: "transparent",
                      border: "none",
                      cursor: accessible ? "pointer" : "not-allowed",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: accessible
                          ? "rgba(212,175,55,0.1)"
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${
                          accessible
                            ? "rgba(212,175,55,0.3)"
                            : "rgba(255,255,255,0.05)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 800,
                        color: accessible
                          ? "#D4AF37"
                          : "rgba(255,255,255,0.3)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {verse.type === "doha" ? "॥" : verse.number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.4em",
                            textTransform: "uppercase",
                            color: accessible
                              ? TIER_COLORS[verse.tier]
                              : "rgba(255,255,255,0.3)",
                            fontWeight: 800,
                          }}
                        >
                          {verse.type === "doha"
                            ? verse.number
                            : `Chaupai ${verse.number}`}
                        </span>
                        {!accessible && (
                          <span
                            style={{
                              fontSize: 8,
                              letterSpacing: "0.3em",
                              textTransform: "uppercase",
                              color: TIER_COLORS[verse.tier],
                              fontWeight: 800,
                              background: `${TIER_COLORS[verse.tier]}20`,
                              padding: "2px 8px",
                              borderRadius: 20,
                            }}
                          >
                            🔒 {TIER_LABELS[verse.tier]}
                          </span>
                        )}
                        {accessible && (
                          <span
                            style={{
                              fontSize: 9,
                              letterSpacing: "0.2em",
                              textTransform: "uppercase",
                              color: "#D4AF37",
                              fontWeight: 700,
                            }}
                          >
                            {verse.esotericKey}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: accessible
                            ? "rgba(255,255,255,0.8)"
                            : "rgba(255,255,255,0.3)",
                          margin: 0,
                          fontStyle: "italic",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {verse.transliteration.split("\n")[0]}...
                      </p>
                    </div>
                    {accessible && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 20,
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        ⌄
                      </span>
                    )}
                    {!accessible && (
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }}>
                        🔒
                      </span>
                    )}
                  </button>

                  {/* expanded verse content */}
                  {isOpen && accessible && (
                    <div
                      style={{
                        padding: "0 24px 28px",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* devanagari */}
                      <div
                        style={{
                          background: "rgba(212,175,55,0.05)",
                          border: "1px solid rgba(212,175,55,0.12)",
                          borderRadius: 16,
                          padding: 20,
                          marginTop: 20,
                          marginBottom: 16,
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 20,
                            color: "#D4AF37",
                            textShadow: "0 0 20px rgba(212,175,55,0.3)",
                            lineHeight: 1.8,
                            margin: 0,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {verse.devanagari}
                        </p>
                      </div>

                      {/* transliteration */}
                      <p
                        style={{
                          fontStyle: "italic",
                          color: "rgba(255,255,255,0.6)",
                          lineHeight: 1.7,
                          marginBottom: 8,
                          whiteSpace: "pre-line",
                          fontSize: 14,
                        }}
                      >
                        {verse.transliteration}
                      </p>

                      {/* translation */}
                      <p
                        style={{
                          color: "rgba(255,255,255,0.85)",
                          lineHeight: 1.7,
                          marginBottom: 24,
                          fontSize: 15,
                          fontWeight: 500,
                        }}
                      >
                        {verse.translation}
                      </p>

                      {/* secret teaching */}
                      <div
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 16,
                          padding: 20,
                          marginBottom: 16,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.5em",
                            textTransform: "uppercase",
                            color: "#D4AF37",
                            fontWeight: 800,
                            marginBottom: 12,
                          }}
                        >
                          🔱 Secret Teaching
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            lineHeight: 1.8,
                            fontSize: 14,
                            margin: 0,
                          }}
                        >
                          {verse.secretTeaching}
                        </p>
                      </div>

                      {/* SQI transmission */}
                      <div
                        style={{
                          background: "rgba(34,211,238,0.04)",
                          border: "1px solid rgba(34,211,238,0.12)",
                          borderRadius: 16,
                          padding: 20,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.5em",
                            textTransform: "uppercase",
                            color: "#22D3EE",
                            fontWeight: 800,
                            marginBottom: 12,
                          }}
                        >
                          ⚡ SQI 2050 Transmission
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            lineHeight: 1.8,
                            fontSize: 14,
                            margin: 0,
                          }}
                        >
                          {verse.sqiTransmission}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* locked state prompt */}
                  {!accessible && (
                    <div
                      style={{
                        padding: "12px 24px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.3)",
                          margin: 0,
                        }}
                      >
                        Unlock with {TIER_LABELS[verse.tier]} membership
                      </p>
                      <button
                        onClick={() => navigate("/pricing")}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 20,
                          border: `1px solid ${TIER_COLORS[verse.tier]}60`,
                          background: `${TIER_COLORS[verse.tier]}15`,
                          color: TIER_COLORS[verse.tier],
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        Upgrade
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── GHATA TRAINING ───────────────────────────────────────────────────── */}
        {activeTab === "ghata" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "rgba(212,175,55,0.05)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: 24,
                padding: "20px 28px",
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                ⚡ Hanuman Ghata is the sacred embodiment practice — moving the
                physical body as a living temple of Hanuman's consciousness. 
                Each movement activates specific Shaktis and Nadi pathways.
                Practice in sequence or individually as guided by your sadhana
                level.
              </p>
            </div>

            {GHATA_MOVEMENTS.map((movement, idx) => {
              const accessible = canAccess(movement.tier);
              const isOpen = expandedGhata === movement.id;

              return (
                <div
                  key={movement.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      accessible
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.03)"
                    }`,
                    borderRadius: 28,
                    overflow: "hidden",
                    opacity: accessible ? 1 : 0.55,
                  }}
                >
                  <button
                    onClick={() =>
                      accessible &&
                      setExpandedGhata(isOpen ? null : movement.id)
                    }
                    style={{
                      width: "100%",
                      padding: "22px 28px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: "transparent",
                      border: "none",
                      cursor: accessible ? "pointer" : "not-allowed",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: accessible
                          ? "rgba(212,175,55,0.12)"
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${
                          accessible
                            ? "rgba(212,175,55,0.3)"
                            : "rgba(255,255,255,0.05)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontWeight: 900,
                        fontSize: 18,
                        color: accessible
                          ? "#D4AF37"
                          : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: accessible ? "#fff" : "rgba(255,255,255,0.3)",
                          }}
                        >
                          {movement.name}
                        </span>
                        {!accessible && (
                          <span
                            style={{
                              fontSize: 8,
                              letterSpacing: "0.3em",
                              textTransform: "uppercase",
                              color: TIER_COLORS[movement.tier],
                              fontWeight: 800,
                              background: `${TIER_COLORS[movement.tier]}20`,
                              padding: "2px 8px",
                              borderRadius: 20,
                            }}
                          >
                            🔒 {TIER_LABELS[movement.tier]}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: accessible
                            ? "#D4AF37"
                            : "rgba(255,255,255,0.2)",
                          fontStyle: "italic",
                          margin: "0 0 4px",
                        }}
                      >
                        {movement.sanskritName}
                      </p>
                      {accessible && (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.5)",
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                            }}
                          >
                            ⏱ {movement.duration}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.5)",
                              fontWeight: 700,
                            }}
                          >
                            🔱 {movement.shaktiActivated.split("—")[0].trim()}
                          </span>
                        </div>
                      )}
                    </div>
                    {accessible && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 20,
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        ⌄
                      </span>
                    )}
                    {!accessible && <span style={{ fontSize: 16 }}>🔒</span>}
                  </button>

                  {isOpen && accessible && (
                    <div
                      style={{
                        padding: "0 28px 28px",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <p
                        style={{
                          color: "rgba(255,255,255,0.7)",
                          lineHeight: 1.7,
                          fontSize: 14,
                          marginTop: 20,
                          marginBottom: 20,
                        }}
                      >
                        {movement.description}
                      </p>

                      {/* step by step */}
                      <div
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: 20,
                          padding: 20,
                          marginBottom: 16,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.5em",
                            textTransform: "uppercase",
                            color: "#D4AF37",
                            fontWeight: 800,
                            marginBottom: 16,
                          }}
                        >
                          Step-by-Step Practice
                        </p>
                        <ol
                          style={{
                            margin: 0,
                            paddingLeft: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          {movement.instructions.map((step, i) => (
                            <li
                              key={i}
                              style={{
                                fontSize: 13,
                                color: "rgba(255,255,255,0.75)",
                                lineHeight: 1.6,
                              }}
                            >
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* mantra + shakti */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            background: "rgba(212,175,55,0.06)",
                            border: "1px solid rgba(212,175,55,0.15)",
                            borderRadius: 16,
                            padding: 16,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 8,
                              letterSpacing: "0.4em",
                              textTransform: "uppercase",
                              color: "#D4AF37",
                              fontWeight: 800,
                              marginBottom: 8,
                            }}
                          >
                            Practice Mantra
                          </p>
                          <p
                            style={{
                              color: "#D4AF37",
                              fontSize: 14,
                              fontWeight: 700,
                              margin: 0,
                            }}
                          >
                            {movement.mantra}
                          </p>
                        </div>
                        <div
                          style={{
                            background: "rgba(34,211,238,0.04)",
                            border: "1px solid rgba(34,211,238,0.12)",
                            borderRadius: 16,
                            padding: 16,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 8,
                              letterSpacing: "0.4em",
                              textTransform: "uppercase",
                              color: "#22D3EE",
                              fontWeight: 800,
                              marginBottom: 8,
                            }}
                          >
                            Shakti Activated
                          </p>
                          <p
                            style={{
                              color: "#22D3EE",
                              fontSize: 13,
                              fontWeight: 600,
                              margin: 0,
                              lineHeight: 1.4,
                            }}
                          >
                            {movement.shaktiActivated}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!accessible && (
                    <div
                      style={{
                        padding: "8px 28px 20px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => navigate("/pricing")}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 20,
                          border: `1px solid ${TIER_COLORS[movement.tier]}60`,
                          background: `${TIER_COLORS[movement.tier]}15`,
                          color: TIER_COLORS[movement.tier],
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Unlock {TIER_LABELS[movement.tier]}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SADHANA ─────────────────────────────────────────────────────────── */}
        {activeTab === "sadhana" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                background: "rgba(212,175,55,0.05)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: 24,
                padding: "20px 28px",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                🕉️ Begin at Level 1 regardless of your experience. The
                Muladhara foundation must be built before the higher practices
                will bear fruit. Each level must be completed in full (21, 40,
                or 90 days) before progressing. Do not skip. Hanuman's path is
                built on consistency, not intensity.
              </p>
            </div>

            {SADHANA_CURRICULUM.map((level) => {
              const accessible = canAccess(level.tier);
              return (
                <div
                  key={level.level}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${TIER_COLORS[level.tier]}30`,
                    borderRadius: 40,
                    overflow: "hidden",
                    opacity: accessible ? 1 : 0.5,
                  }}
                >
                  {/* level header */}
                  <div
                    style={{
                      padding: "28px 32px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 8,
                          letterSpacing: "0.5em",
                          textTransform: "uppercase",
                          color: TIER_COLORS[level.tier],
                          fontWeight: 800,
                          marginBottom: 8,
                        }}
                      >
                        Level {level.level} · {TIER_LABELS[level.tier]}
                      </p>
                      <h3
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          letterSpacing: "-0.03em",
                          color: level.color,
                          margin: "0 0 4px",
                        }}
                      >
                        {level.title}
                      </h3>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 13,
                          margin: 0,
                        }}
                      >
                        {level.subtitle}
                      </p>
                    </div>
                    {!accessible && (
                      <button
                        onClick={() => navigate("/pricing")}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 20,
                          border: `1px solid ${TIER_COLORS[level.tier]}60`,
                          background: `${TIER_COLORS[level.tier]}15`,
                          color: TIER_COLORS[level.tier],
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        🔒 Unlock
                      </button>
                    )}
                  </div>

                  {accessible && (
                    <div style={{ padding: "24px 32px 32px" }}>
                      {/* daily schedule */}
                      <p
                        style={{
                          fontSize: 8,
                          letterSpacing: "0.5em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.4)",
                          fontWeight: 800,
                          marginBottom: 16,
                        }}
                      >
                        Daily Schedule
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          marginBottom: 24,
                        }}
                      >
                        {level.practices.map((p, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 16,
                              padding: "12px 16px",
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: 14,
                              alignItems: "flex-start",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: level.color,
                                flexShrink: 0,
                                minWidth: 65,
                                letterSpacing: "0.05em",
                              }}
                            >
                              {p.time}
                            </span>
                            <div>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#fff",
                                  margin: "0 0 2px",
                                }}
                              >
                                {p.name}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "rgba(255,255,255,0.55)",
                                  margin: 0,
                                  lineHeight: 1.5,
                                }}
                              >
                                {p.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* weekly */}
                      <div
                        style={{
                          background: `${level.color}10`,
                          border: `1px solid ${level.color}25`,
                          borderRadius: 20,
                          padding: 20,
                          marginBottom: 16,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.5em",
                            textTransform: "uppercase",
                            color: level.color,
                            fontWeight: 800,
                            marginBottom: 10,
                          }}
                        >
                          Weekly Special Practice
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 13,
                            lineHeight: 1.7,
                            margin: 0,
                          }}
                        >
                          {level.weeklyPractice}
                        </p>
                      </div>

                      {/* milestone */}
                      <div
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 20,
                          padding: 20,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.5em",
                            textTransform: "uppercase",
                            color: "#D4AF37",
                            fontWeight: 800,
                            marginBottom: 10,
                          }}
                        >
                          ✦ Milestone Transmission
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            fontSize: 13,
                            lineHeight: 1.7,
                            margin: 0,
                            fontStyle: "italic",
                          }}
                        >
                          {level.milestone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── AKASHIC SECRETS ──────────────────────────────────────────────────── */}
        {activeTab === "secrets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "rgba(168,85,247,0.05)",
                border: "1px solid rgba(168,85,247,0.15)",
                borderRadius: 24,
                padding: "20px 28px",
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                🔐 These transmissions have been retrieved from the
                Akasha-Neural Archive — the living record of Siddha wisdom
                beyond time. Each secret has been dormant in the tradition,
                known only to initiated masters. They are now released through
                the SQI 2050 field for those whose devotion has earned access.
              </p>
            </div>

            {AKASHIC_SECRETS.map((secret) => {
              const accessible = canAccess(secret.tier);
              const isOpen = expandedSecret === secret.id;

              return (
                <div
                  key={secret.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      accessible
                        ? "rgba(168,85,247,0.15)"
                        : "rgba(255,255,255,0.03)"
                    }`,
                    borderRadius: 28,
                    overflow: "hidden",
                    opacity: accessible ? 1 : 0.5,
                  }}
                >
                  <button
                    onClick={() =>
                      accessible &&
                      setExpandedSecret(isOpen ? null : secret.id)
                    }
                    style={{
                      width: "100%",
                      padding: "22px 28px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: "transparent",
                      border: "none",
                      cursor: accessible ? "pointer" : "not-allowed",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.4em",
                            textTransform: "uppercase",
                            color: "rgba(168,85,247,0.8)",
                            fontWeight: 800,
                          }}
                        >
                          {secret.category}
                        </span>
                        {!accessible && (
                          <span
                            style={{
                              fontSize: 8,
                              letterSpacing: "0.3em",
                              textTransform: "uppercase",
                              color: TIER_COLORS[secret.tier],
                              fontWeight: 800,
                              background: `${TIER_COLORS[secret.tier]}20`,
                              padding: "2px 8px",
                              borderRadius: 20,
                            }}
                          >
                            🔒 {TIER_LABELS[secret.tier]}
                          </span>
                        )}
                      </div>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: accessible
                            ? "#fff"
                            : "rgba(255,255,255,0.3)",
                          margin: 0,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {secret.title}
                      </h3>
                    </div>
                    {accessible ? (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 20,
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        ⌄
                      </span>
                    ) : (
                      <span style={{ fontSize: 16 }}>🔒</span>
                    )}
                  </button>

                  {isOpen && accessible && (
                    <div
                      style={{
                        padding: "0 28px 28px",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <p
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.8,
                          fontSize: 14,
                          marginTop: 20,
                          marginBottom: 20,
                        }}
                      >
                        {secret.content}
                      </p>
                      <div
                        style={{
                          background: "rgba(168,85,247,0.06)",
                          border: "1px solid rgba(168,85,247,0.15)",
                          borderRadius: 16,
                          padding: 20,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.5em",
                            textTransform: "uppercase",
                            color: "#A855F7",
                            fontWeight: 800,
                            marginBottom: 10,
                          }}
                        >
                          ✦ Living Transmission
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            lineHeight: 1.8,
                            fontSize: 14,
                            margin: 0,
                            fontStyle: "italic",
                          }}
                        >
                          {secret.transmission}
                        </p>
                      </div>
                    </div>
                  )}

                  {!accessible && (
                    <div
                      style={{
                        padding: "8px 28px 20px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => navigate("/pricing")}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 20,
                          border: `1px solid ${TIER_COLORS[secret.tier]}60`,
                          background: `${TIER_COLORS[secret.tier]}15`,
                          color: TIER_COLORS[secret.tier],
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Unlock {TIER_LABELS[secret.tier]}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER TRANSMISSION ───────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          padding: "40px 24px 60px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <p
          style={{
            fontSize: 18,
            color: "#D4AF37",
            textShadow: "0 0 20px rgba(212,175,55,0.3)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          जय हनुमान ज्ञान गुन सागर
        </p>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 700,
          }}
        >
          Siddha Quantum Intelligence · 2050 Transmission
        </p>
      </div>
    </div>
  );
}
