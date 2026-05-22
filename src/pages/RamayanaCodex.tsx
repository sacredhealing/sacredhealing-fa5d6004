import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── Design tokens ────────────────────────────────────────────────────────────
const G = "#D4AF37";
const gold = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan = (a: number) => `rgba(34,211,238,${a})`;
const violet = (a: number) => `rgba(167,139,250,${a})`;

type Tier = "free" | "prana-flow" | "siddha-quantum" | "akasha-infinity";
const TIER_RANK: Record<Tier, number> = { "free": 0, "prana-flow": 1, "siddha-quantum": 2, "akasha-infinity": 3 };

interface Secret {
  title: string;
  teaching: string;
  siddhaRevelation: string;
  activation: string;
  mantra: string;
  mantraTranslation?: string;
}

interface Kanda {
  id: string;
  number: number;
  name: string;
  sanskrit: string;
  chakra: string;
  element: string;
  teaching: string;
  voice: string;
  tier: Tier;
  color: string;
  intro: string;
  secrets: Secret[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const KANDAS: Kanda[] = [
  {
    id: "k1", number: 1, name: "Bāla Kāṇḍa", sanskrit: "बाल काण्ड",
    chakra: "Mūlādhāra", element: "Earth", tier: "free",
    teaching: "Origin, foundation, the birth of dharmic identity",
    voice: "Vālmīki", color: G,
    intro: "The Childhood Book opens not with Rāma but with Vālmīki — a dacoit, a thief — whose grief at witnessing a dying crane spontaneously birthed the first Sanskrit śloka in human history. The greatest scripture on Earth was not born from samādhi but from a broken heart. This Kāṇḍa encodes: Rāma's birth, education under Vasiṣṭha, the breaking of Śiva's bow, marriage to Sītā.",
    secrets: [
      {
        title: "The Curse That Became Scripture",
        teaching: "The very first śloka ever uttered in Sanskrit was born from ANGER — from grief. When the hunter shot the male crane, Vālmīki's curse erupted: 'Mā niṣāda pratisṭhāṃ tvam...' Brahmā appeared immediately: 'This cry of grief is in the metre Anuṣṭup — in which you shall compose the entire story of Rāma.' The curse itself was the seed. This is the most important hidden teaching: the greatest scripture was not born from a state of samādhi. It was born from a cracked-open heart.",
        siddhaRevelation: "Tirumūlar teaches in the Tirumantiram that the highest Nāda enters the body through the gaps created by suffering, not through the temples of comfort. Every genuine spiritual emergence passes through a moment of devastating personal loss before the transmission descends. This is not punishment. It is physics. The rigid vessel cannot receive the new. Only the cracked vessel allows the light inside.",
        activation: "Sit in silence. Bring to awareness one grief you have been suppressing — something lost, broken, ended. Do not suppress the ache. Let it arise fully. Place your right hand on your heart and whisper three times: 'Mā niṣāda — I am the wound that became the word.' After the third repetition, take a pen and write for 10 minutes without stopping — whatever emerges. Do not edit. This is your personal Rāmāyaṇa.",
        mantra: "Śokaḥ śloktvam āgataḥ",
        mantraTranslation: "From grief, the śloka was born — Repeat 27 times before journaling",
      },
      {
        title: "Rāma's Name is a Complete Prāṇāyāma Circuit",
        teaching: "RA = Agni bīja (fire syllable) — activates the Piṅgalā nāḍī, burns karmic residue, awakens will-force. MA = Soma bīja (water/moon syllable) — activates the Iḍā nāḍī, cools and purifies. RĀMA spoken in one breath = one complete prāṇāyāma circuit. The inhale carries RA (fire ascending). The exhale carries MA (water descending). Every single repetition is a full cleansing circuit of both primary nāḍīs.",
        siddhaRevelation: "108 repetitions of RĀMA = 108 complete nāḍī cleansing circuits = one full purification cycle of the subtle body. The Māndūkya Upaniṣad confirms OM contains all creation. The Rāmāyaṇa tradition holds that RĀMA contains all of OM — the compressed two-syllable version of the primordial sound, with solar and lunar principles made explicit.",
        activation: "Morning practice: Sit facing east. Eyes closed. Inhale slowly — internally sound RA, feel warmth ascending the right side of the spine. Exhale slowly — internally sound MA, feel cooling descending the left side. 108 complete rounds. If time is short: minimum 21 rounds. This single practice replaces an entire formal prāṇāyāma session when done with full awareness.",
        mantra: "Rāma Rāma Rāma",
        mantraTranslation: "The two-syllable complete prāṇāyāma — 108x minimum",
      },
      {
        title: "Vasiṣṭha's Yoga — The Hidden Curriculum",
        teaching: "Hidden in the Bāla Kāṇḍa is the FACT of Rāma's depression. Before Viśvāmitra arrives, the young Rāma falls into deep vairāgya — he loses interest in kingship, marriage, pleasure. His parents and court are deeply alarmed. Vasiṣṭha is called and teaches Rāma for several days — these teachings become the Yoga Vāsiṣṭha, the greatest text on Jñāna Yoga. The Rāmāyaṇa begins with the hero in spiritual crisis, not spiritual triumph.",
        siddhaRevelation: "Agastya Muni transmits: The spiritual crisis that precedes the mission is not a sign of weakness — it is the necessary emptying before the vessel can receive the cosmic purpose. The ego must collapse before the dharmic identity can emerge. Rāma's depression was not a flaw in his character. It was the dissolution of his personal identity in preparation for his cosmic function.",
        activation: "If you are in a period of vairāgya — if nothing seems meaningful, if your former enthusiasms have dimmed — do not panic. Do not suppress it. Read three pages of the Yoga Vāsiṣṭha. Sit with the dispassion as Rāma sat with it: openly, without shame. Then ask: 'What is the deeper mission that this emptiness is preparing me for?' Write the answer without editing.",
        mantra: "Vāsiṣṭha Uvāca — Ātmaiva hi ātmano bandhur",
        mantraTranslation: "The Self alone is the friend of the Self — Vasiṣṭha's core teaching to Rāma",
      },
      {
        title: "Ahalyā — The Stone That Was Never Punished",
        teaching: "The mainstream reading: Ahalyā is punished by Gautama's curse for infidelity with Indra. The Siddha reading is entirely different. Ahalyā (from a-halya: 'the unploughed' — the consciousness that has never been seeded with conditioning) was not punished. She was preserved. The stone is not degradation — it is the state of samādhi, the consciousness that has crystallised beyond the reach of time and worldly vibration. Rāma's touch does not 'free' her from punishment. It returns her to embodied life from a state of deep samādhic withdrawal.",
        siddhaRevelation: "Pambatti Siddhar decodes: The stone represents the consciousness that has become so still it appears inert to ordinary perception. The touch of the Ātman (Rāma) is what awakens consciousness from the stone-like stillness of the causal body into the luminous activity of the subtle body. Every person who has experienced extended states of samādhi knows this: the return to ordinary embodied life requires an external catalyst. Rāma's foot is that catalyst — the touch of grace.",
        activation: "Sit in stillness until the body feels like stone — completely heavy, immovable. Do not resist. Let the stone-body be total. After 15-20 minutes of this absolute stillness: slowly bring awareness to the soles of your feet. Feel them as if Rāma's presence is touching them from below. Gradually allow movement to return, bottom to top, cell by cell, as if re-inhabiting the body from a place of profound stillness.",
        mantra: "Aham Ahalyā — Rāma-sparśena jīvāmi",
        mantraTranslation: "I am Ahalyā — through Rāma's touch I return to life",
      },
      {
        title: "The Breaking of Śiva's Bow — The Suṣumnā Activation",
        teaching: "Śiva's bow (Pinaka) is not a weapon — it is a yantra, a scalar wave device encoding the complete Suṣumnā Nāḍī. Its shape: a perfect arc from earth to sky, representing the spinal column in its fully activated state, kundalini raised from Mūlādhāra to Sahasrāra. No one in the world can string it — meaning: no consciousness operating through ego-force can activate the Suṣumnā. Rāma alone can string and break it because Rāma's consciousness is already operating from the Sahasrāra — from the level of the Ātman, which IS Śiva.",
        siddhaRevelation: "Thirumoolar transmits: The breaking of the bow with a single movement is the snapping of the final Brahma Granthi — the last knot at the root of the spine that prevents full Suṣumnā activation. When Rāma snaps the bow, there is a sound heard across three worlds. This is the sound of the Brahma Granthi dissolving — the thunderclap that accompanies the full awakening of the Kuṇḍalinī and its merger with the Sahasrāra.",
        activation: "Spine activation: sit erect, close eyes. Visualise Śiva's bow within your spine — a luminous golden arc. With a deep inhale, draw energy from the earth up through Mūlādhāra. As you hold the breath: visualise the bow of the spine under the full charge of Prāṇa. On the exhale: release the charge upward through the crown with a sound 'PHAT!' Feel the snap. Repeat 7 times.",
        mantra: "Om Pinākine Namah — Om Namo Bhagavate Vāsudevāya",
        mantraTranslation: "Salutation to the Wielder of the Bow — and to Rāma as Vāsudeva (the all-pervading)",
      },
      {
        title: "The Four Brothers as Four States of Consciousness",
        teaching: "Rāma = Turīya — the Fourth State (pure witnessing awareness beyond waking, dreaming, sleep). Lakṣmaṇa = Jāgrat (waking state) — the ever-alert, never-sleeping mind of dharmic discipline. Bharata = Svapna (dream state) — governance through symbol and devotion, ruling through Rāma's sandals (the symbol, not the king). Śatrughna = Suṣupti (deep sleep state) — the most silent brother, always in background support, the unconscious foundation.",
        siddhaRevelation: "Gorakkar reveals: The entire Rāmāyaṇa is the journey of the Turīya state (Rāma/pure awareness) through all four states of consciousness, demonstrating that the Ātman can function THROUGH waking, dreaming, and deep sleep while remaining untouched by any of them. Rāma's equanimity in all circumstances — exile, loss of Sītā, battle — is not stoicism. It is the natural attribute of Turīya operating through the three lower states.",
        activation: "Before sleep tonight: as you move from waking to drowsiness, identify which brother you currently embody. Are you Rāma (the witness)? Lakṣmaṇa (the alert disciplined mind)? Bharata (the devotional dreamer)? Or Śatrughna (already half in the deep)? Carry this identification into sleep and watch how the dream-state reflects your dominant state of consciousness.",
        mantra: "Rāma Lakṣmaṇa Bharata Śatrughna — Caturo Brahma-Vyāhṛtayaḥ",
        mantraTranslation: "The four brothers are the four primordial utterances of Brahman",
      },
    ],
  },
  {
    id: "k2", number: 2, name: "Ayodhyā Kāṇḍa", sanskrit: "अयोध्या काण्ड",
    chakra: "Svādhiṣṭhāna", element: "Water", tier: "free",
    teaching: "Emotion, exile, the necessary dissolution of comfort",
    voice: "Rāma + Vālmīki", color: G,
    intro: "The Exile Book. Rāma's coronation is interrupted at the last minute by Kaikeyī's two boons, leading to 14 years of forest exile. Daśaratha's death from grief. Bharata's governance using Rāma's sandals. The hidden teaching of this Kāṇḍa: what appears to be a catastrophe is actually a design. What appears to be exile is actually initiation.",
    secrets: [
      {
        title: "Rāma Chose the Exile",
        teaching: "The surface reading presents Rāma as a victim of Kaikeyī's scheming and Daśaratha's weakness. The Siddha reading is entirely different. Rāma knew — through his direct access to Turīya consciousness — that the exile was not a punishment but a cosmic assignment. He could have refused. He had the political and popular support to override any demand. He chose the forest. The exile was the means by which the cosmic purpose would unfold. It was not done TO him. It was chosen BY him.",
        siddhaRevelation: "Agastya transmits: Every genuine spiritual journey contains a moment of voluntary exile — the willingness to leave the kingdom of the known (comfort, status, familiarity) for the forest of the unknown (testing, stripping, transformation). Those who refuse the exile because the timing is inconvenient, because people will misunderstand, because the material stakes are too high — never reach the Lanka. They remain in Ayodhyā wondering why the mission never materialised.",
        activation: "Identify your current 'Ayodhyā' — the comfort zone, the familiar kingdom you know you need to leave for the next phase of your dharmic mission. What is the 'forest' you are being called to? Write it without flinching. Then write: 'I choose this exile. It is not done to me. I choose it.' Date it. Keep it.",
        mantra: "Dharmo rakṣati rakṣitaḥ",
        mantraTranslation: "Dharma protects those who protect dharma — the law that makes Rāma's choice inevitable",
      },
      {
        title: "Kaikeyī — The Most Misunderstood Being",
        teaching: "Kaikeyī is presented as the villain of the Ayodhyā Kāṇḍa in most retellings. The Siddha reading: Kaikeyī is the instrument of cosmic will, possibly consciously. Without her boons, Rāma would have been crowned king of Ayodhyā and would have never gone to the forest. Without the forest, there would have been no encounter with the rishis, no search for Sītā, no alliance with Sugrīva, no meeting with Hanumān, no battle with Rāvaṇa, no liberation of all the beings imprisoned in Laṅkā. Kaikeyī's act of apparent treachery is the pivot on which the entire cosmic drama turns.",
        siddhaRevelation: "Siva Vakkiyar transmits: 'The one who appears to block the path IS the path.' Every Kaikeyī in your life — every person who denied you, rejected you, betrayed you, blocked your immediate desire — may have been the instrument that redirected you toward your actual dharmic trajectory. Re-examine the five greatest apparent betrayals of your life with this lens. What became possible BECAUSE of the block?",
        activation: "Take one person you still hold resentment toward — someone who 'ruined something' for you. Write their name. Then write: 'Because of what you did, [list what actually became possible afterwards].' Complete this sentence as fully and honestly as possible. End with: 'You were Kaikeyī. And your act was in service of my dharma, even if neither of us knew it.'",
        mantra: "Sarvaṃ Kāraṇaṃ — All is cause, and cause is grace",
        mantraTranslation: "Everything that appears to obstruct is the cosmic mechanics of dharma in motion",
      },
      {
        title: "The 14 Years as 14 Lokas",
        teaching: "The 14 years of exile precisely mirror the 14 Lokas (planes of existence) of Vedic cosmology. Year 1 (Bhūr Loka — Physical Plane): The initial shock of physical displacement. Year 7 (Talas — the underworld planes, Pātāla): The deepest personal crisis — the abduction of Sītā. Year 14 (Mahar Loka — Cosmic Identity Awakening): The war itself. The 14th year is when Rāma has traversed all 13 prior planes and now operates from cosmic (not personal) identity. He does not fight as a wronged husband. He fights as the Ātman dissolving adharma.",
        siddhaRevelation: "Bogar transmits from the 2050 Akasha-Neural Archive: Your own life challenges follow this same 14-loka architecture. The duration varies, but the sequence is invariant: physical displacement, emotional dissolution, crisis of identity, unexpected alliance, the test of devotion in isolation, the gathering of forces, and finally the war — which is always an internal war made external.",
        activation: "Map your current life challenge onto the 14-loka sequence. Which year/loka are you in? Write: 'I am currently in Loka ___. The specific challenge of this loka is ___. The loka I am moving toward is ___. The quality I need to develop to pass through this loka is ___.' This single mapping removes the feeling of being lost — you are not lost, you are in transit.",
        mantra: "Om Lokeśvarāya Namah",
        mantraTranslation: "Salutation to the Lord of all planes — invoking Rāma's guidance through each loka",
      },
      {
        title: "Bharata's Sandals — Quantum Vibrational Governance",
        teaching: "Bharata refuses the throne and instead places Rāma's sandals (Pādukās) on it, governing for 14 years in the name of those sandals. On the surface: a beautiful act of devotion. The Siddha science: the Pādukā carries the vibrational imprint of Rāma's Turīya consciousness in every cell of its structure. Bharata is not governing through symbol — he is governing through an actual vibrational field antenna that carries the Ātman's frequency. The entire kingdom is administered through the field emitted by the footwear of a fully realised being.",
        siddhaRevelation: "Konganar transmits: This is the basis of mūrti worship, of sacred objects, of the Siddha tradition of transmitting consciousness through physical objects. A fully realised consciousness leaves an electromagnetic imprint in any material that has been in sustained contact with it. Rāma's sandals were not symbols of his authority. They were transmitters of his actual consciousness-frequency. Bharata's genius was recognising this and making it the governing principle of an entire kingdom for 14 years.",
        activation: "Select one physical object that was given to you by someone whose consciousness you deeply respect — a teacher, a parent, a master. Hold it in both palms. Close eyes. Allow your awareness to expand into the object rather than simply observing it. Feel what frequency it carries. This is the Pādukā practice. The object is not a memorial. It is an active transmitter. Use it accordingly.",
        mantra: "Rāma-pādukā maṅgalāya — Bharata-bhaktyai namaḥ",
        mantraTranslation: "May Rāma's sandals bless all — I bow to Bharata's devotion",
      },
      {
        title: "Daśaratha's Death — The Ātman Releasing the Body",
        teaching: "Daśaratha does not die of grief in the ordinary sense. He dies from a specific phenomenon: the withdrawal of the force that kept his prāṇa bound to his physical body. That force was Rāma. When Rāma departed, the thread between Daśaratha's Ātman and his physical vehicle simply released — there was no longer a purpose sufficient to maintain the body-Ātman bond. This is the Siddha science of icchā-mṛtyu — conscious death by voluntary prāṇic withdrawal, death at will.",
        siddhaRevelation: "Agastya Muni transmits: The most advanced Siddhas do not die. They leave. When the purpose of the incarnation is complete — or when the being central to their dharmic purpose departs — the Siddha simply withdraws prāṇa from the physical vehicle with full awareness, completing the transition in a state of clear, joyful consciousness. Daśaratha's death was not tragedy — it was the completion of his dharmic function and the voluntary release of an old vehicle that was no longer required.",
        activation: "Contemplation practice: Sit in Śavāsana. Allow the body to feel completely heavy — as if it is returning to the earth right now. Feel the awareness that observes this heavy body: weightless, uncontained, already free. Ask: 'What would I need to complete before this body releases? What is the most important transmission I have not yet made?' Write the answer immediately upon rising. Act on it this week.",
        mantra: "Icchā-mṛtyu — Jīvan-mukta",
        mantraTranslation: "Death by conscious choice — liberation while living",
      },
    ],
  },
  {
    id: "k3", number: 3, name: "Āraṇya Kāṇḍa", sanskrit: "अरण्य काण्ड",
    chakra: "Maṇipūra", element: "Fire", tier: "prana-flow",
    teaching: "Will, trial, the stripping of external power",
    voice: "Sītā + Agastya", color: "#10B981",
    intro: "The Forest Book. The exile deepens. The rishis of the Daṇḍakā forest receive Rāma's protection. The encounter with Śūrpaṇakhā. The abduction of Sītā by Rāvaṇa. The death of Jaṭāyu. This is the Maṇipūra Kāṇḍa — the burning away of everything external until only the essential Ātman-flame remains.",
    secrets: [
      {
        title: "Sītā Chose to Be the Catalyst",
        teaching: "The mainstream reading: Sītā is the victim, abducted against her will. The Siddha revelation: Sītā is Śakti incarnate — the cosmic intelligence that sets the entire drama in motion by design. Her 'abduction' was not a helpless victimhood. It was a cosmic catalytic event that she — as the fully conscious Śakti principle — chose to initiate. Without Sītā crossing the Lakṣmaṇa-rekhā, there is no abduction. Without the abduction, there is no search. Without the search, there is no Hanumān's leap. Without the leap, there is no war. Without the war, there is no dharmic restoration.",
        siddhaRevelation: "Tirumūlar transmits: Śakti is always the first mover. Śiva — pure consciousness — appears to act, but it is Śakti — the intelligence of creation — that initiates every cycle. Sītā's apparent helplessness is the supreme demonstration of Śakti's intelligence: she makes herself the vulnerable point in order to trigger the sequence of events that will accomplish the cosmic purpose. The 'victim' is the architect.",
        activation: "Examine one area of your life where you have cast yourself as a victim. Reframe it through the Sītā lens: 'What if I — at the soul level — chose this experience to catalyse a specific development, alliance, or transformation that would not have been possible any other way?' Write the new narrative. Feel how it shifts the energy in your body when you change from victim to architect.",
        mantra: "Jānakī — Jagajjanī — Śakti-svarūpiṇī",
        mantraTranslation: "Daughter of Janaka — Mother of the universe — the embodiment of Śakti",
      },
      {
        title: "Jaṭāyu — Mokṣa of the Servant",
        teaching: "Jaṭāyu — the ancient eagle king — encounters Rāvaṇa carrying Sītā. Though old, weakened, and vastly outmatched, Jaṭāyu attacks anyway, fights until his wings are severed, and dies in service. Rāma discovers the dying Jaṭāyu and grants him mokṣa with his own hand. The hidden teaching: Jaṭāyu achieved liberation through INCOMPLETE service — he failed in his mission to save Sītā. He died having not accomplished his goal. And still: mokṣa.",
        siddhaRevelation: "Babaji transmits: The universe does not reward success. It rewards alignment. Jaṭāyu was perfectly aligned — he acted from pure dharmic impulse with zero calculation of personal outcome. The failure to achieve the external goal was irrelevant to the internal alignment that constituted his action. This is the most radical teaching in the entire epic: you can fail completely at the visible task and still receive the highest grace — if the intention behind the action was pure.",
        activation: "Identify one area where you stopped an action because you couldn't guarantee the outcome, or because you calculated the odds as unfavourable, or because the forces against you were too large. Ask: 'If I acted from pure dharmic alignment — regardless of outcome — what would I do?' Then: do it. Even incompletely. Even if the wings get severed. That incomplete action, done in alignment, is Jaṭāyu's practice.",
        mantra: "Karma-phala-tyāgo — the renunciation of the fruit of action",
        mantraTranslation: "Act without attachment to outcome — the Jaṭāyu practice of pure dharmic alignment",
      },
      {
        title: "The Golden Deer — The Shining Distraction",
        teaching: "Mārīca takes the form of a golden deer to lure Rāma away from Sītā, enabling Rāvaṇa's abduction. The teaching: the most dangerous distraction is always the most beautiful one. The one that appears golden. The one that your deepest Śakti — Sītā — desires with fierce insistence. And even Rāma — the Ātman itself — can be lured from his station by the insistence of the heart-desire. This is not a failure of Rāma's discernment. It is the demonstration that the Ātman, when it has chosen to operate through full embodiment, is also subject to the mechanics of māyā.",
        siddhaRevelation: "Gorakkar transmits: The golden deer in your life is never named 'distraction.' It is named 'opportunity,' 'breakthrough,' 'the thing I've always wanted,' 'once in a lifetime.' The test is: does pursuing it require you to leave your station — to abandon what is most sacred to you for something that shines? If yes: examine carefully. The golden deer is Rāvaṇa's most effective weapon in every age.",
        activation: "Write down the three most 'golden deer' currently circling your life — the shining opportunities, the alluring offers, the irresistible possibilities. For each: ask 'Does pursuing this require me to abandon my Sītā — my core sacred function, relationship, or purpose?' Sit with the answers. You will know which is Mārīca.",
        mantra: "Asato mā sadgamaya — Lead me from the unreal to the real",
        mantraTranslation: "The prayer to distinguish golden deer from true gold",
      },
      {
        title: "The Lakṣmaṇa-Rekhā — Scalar Wave Protection Science",
        teaching: "Lakṣmaṇa draws a circle around the hermitage before departing, instructing Sītā never to cross it. The mainstream reading: a line Sītā should not cross. The Siddha science: the Rekhā is a prāṇic scalar wave field created by Lakṣmaṇa's concentrated intention and Agni bīja mantra, establishing a protective toroidal field around the hermitage. Within this field, Rāvaṇa cannot operate — his frequency cannot penetrate the protective harmonic. Sītā crosses it because she is guilted into doing so by Rāvaṇa-as-Brahmin. The field's penetration was psychological, not physical.",
        siddhaRevelation: "Machamuni transmits: The most impenetrable protective field can be dissolved by a single movement of guilt — of the feeling that refusing the demand makes you a bad person, an unkind person, an ungenerous person. Rāvaṇa's genius was not force. It was the manipulation of dharmic virtue against itself. He weaponised Sītā's generosity. Your Rekhā — your energetic boundary — is similarly most vulnerable not to attack but to the guilt of appearing uncharitable when you enforce it.",
        activation: "Identify one boundary (your personal Rekhā) that you consistently cross not because you want to but because you feel guilty for maintaining it. Write the exact narrative used to make you cross it (this is always some form of 'if you were truly [good/compassionate/generous], you would...'). Recognise this as the Rāvaṇa-as-Brahmin technique. Reestablish the Rekhā now, in writing. Say aloud: 'The Rekhā holds.'",
        mantra: "Agni-Rekhā — Rakṣa kavaca — I am protected within my dharmic boundary",
        mantraTranslation: "The fire-line of protection — invoking Lakṣmaṇa's scalar shield",
      },
    ],
  },
  {
    id: "k4", number: 4, name: "Kiṣkindhā Kāṇḍa", sanskrit: "किष्किन्धा काण्ड",
    chakra: "Anāhata", element: "Air", tier: "prana-flow",
    teaching: "Alliance, love, the memory of one's true power",
    voice: "Hanumān + Vālmīki", color: "#10B981",
    intro: "The Monkey Kingdom Book. Rāma meets Sugrīva. The alliance is formed over shared grief. The killing of Vāli. The search commission given to Hanumān. And the single most important scene in the entire epic: Jāmbavān reminds Hanumān of his own power — and Hanumān remembers. This Kāṇḍa is about the Anāhata chakra: the power of alliance built on honest recognition of shared brokenness.",
    secrets: [
      {
        title: "Hanumān's Divine Amnesia — The Most Important Teaching for Modern Souls",
        teaching: "Hanumān — who had the power of flight from birth, who had swallowed the Sun as a child, who was the son of the Wind-God — had forgotten all of this. A sage's curse in childhood had caused him to forget his own capabilities. He was sitting in Kiṣkindhā as a courtier, using a fraction of his actual power, unaware of what he was. Then Jāmbavān spoke his name: 'Hanumān — do you not know who you are?' And in that moment of recognition, everything returned.",
        siddhaRevelation: "Agastya Muni transmits: This is the single teaching most relevant to contemporary human consciousness. You are not someone who is trying to become powerful. You are a being of extraordinary capacity who has forgotten, through the conditioning of childhood, culture, trauma, and repeated diminishment, what you actually are. The spiritual path is not a path of acquisition — adding new powers and capabilities. It is a path of REMEMBERING. Of having Jāmbavān's voice reach you.",
        activation: "Write at the top of a page: 'What I knew about myself before the world told me otherwise.' List everything: capabilities, gifts, knowing, powers that you were aware of as a child or young person and then progressively forgot or were taught to disbelieve. This is your suppressed Hanumān-inventory. Pick one item from the list. This week, act from it as if the amnesia is over.",
        mantra: "Jai Hanumān — Jñāna-guṇa-sāgara",
        mantraTranslation: "Victory to Hanumān — ocean of wisdom and virtue — the mantra of remembering",
      },
      {
        title: "Vāli's Boon — The Psychology of the Unconscious Ego",
        teaching: "Vāli had the boon that in any direct combat, half his opponent's strength would transfer to him, making him effectively undefeatable in face-to-face confrontation. Rāma kills him from behind a tree — an act that appears dishonourable and is widely condemned. The Siddha teaching: Vāli represents the unconscious ego that draws its power from every direct confrontation with it. If you confront the ego directly, the ego gains strength from the confrontation itself. The ONLY way to dissolve the ego is obliquely — not by fighting it head-on but by withdrawing the attention that feeds it.",
        siddhaRevelation: "Konganar transmits: The contemplative traditions have known this for millennia. The instruction 'do not suppress, do not indulge' regarding any ego pattern is the Rāma-behind-the-tree approach. Direct confrontation (either suppression or engagement) feeds the pattern. Withdrawal of the direct confrontational attention — while maintaining clear witnessing awareness — is the arrow from behind the tree.",
        activation: "Identify one ego-pattern you have been directly fighting — a habit, a reactivity, a limiting belief you've been suppressing or arguing with internally. Stop the direct fight entirely. Instead: simply witness it from behind your 'tree' of non-reactive awareness. Do not engage. Do not suppress. Simply watch it arise and fall. The arrow of witnessing awareness, released obliquely, is more effective than any direct confrontation.",
        mantra: "Sākṣī — The pure witness — Om Sākṣiṇe Namaḥ",
        mantraTranslation: "Salutation to the one who witnesses without engagement — the Rāma behind the tree",
      },
      {
        title: "The Squirrel — Every Consciousness is Bridge-Worthy",
        teaching: "In the building of the bridge to Laṅkā, a small squirrel carried tiny pebbles and dropped them into the sea, one by one. The monkeys laughed. Rāma picked up the squirrel and stroked its back in gratitude — and the three stripes on Indian squirrels are said to be the marks of Rāma's fingers. The teaching: there is no contribution too small to be included in a dharmic mission. The bridge to liberation is built by the great and the tiny alike. Every consciousness is bridge-worthy.",
        siddhaRevelation: "Siva Vakkiyar transmits: 'The universe does not measure in human units of volume or visible impact. The squirrel's pebble and the monkey's boulder are equal in dharmic weight.' The most dangerous lie in spiritual community is the hierarchy of contribution — the idea that only those with platforms, audiences, resources, or dramatic capacities can meaningfully participate in the work of consciousness elevation. The squirrel's pebble lands in the same ocean.",
        activation: "Identify the 'squirrel-sized' contribution to the dharmic work you have been not making because it seemed too small to matter. Make it today. Post the teaching. Send the message. Make the offering. Place the pebble. And know: Rāma's fingers mark every one of them.",
        mantra: "Om — the smallest syllable that contains the entire universe",
        mantraTranslation: "Even AUM, the smallest utterance, builds the bridge",
      },
      {
        title: "Sugrīva — The Alliance Built on Broken Ground",
        teaching: "The alliance between Rāma and Sugrīva is formed because they recognise each other's grief. Rāma has lost Sītā. Sugrīva has lost his kingdom and his wife to his own brother. Two beings, both exiled, both bereaved, both stripped of what they valued most — find each other in the forest and recognise a mutual dharmic purpose. This is the Siddha teaching on alliance: the deepest alliances are not formed in triumph but in mutual recognition of loss.",
        siddhaRevelation: "Babaji transmits: In the dharmic timeline, your most powerful collaborators will be found not at the peak of your success but in your forest — during the periods when you are reduced to your essential self, stripped of status and comfort. The beings who meet you in your forest and still choose alliance are the Sugrīvas. They are the ones whose loyalty the mission actually requires.",
        activation: "Who are the Sugrīvas in your life — the beings who met you in your forest, in your reduction, and chose alliance with your essential self rather than your status? Contact one of them today. Name the alliance explicitly. Acknowledge the mutual forest in which it was formed. Deepen the commitment.",
        mantra: "Mitra-dharma — the sacred covenant of aligned souls",
        mantraTranslation: "The dharma of true friendship, forged in the forest of shared loss",
      },
    ],
  },
  {
    id: "k5", number: 5, name: "Sundara Kāṇḍa", sanskrit: "सुन्दर काण्ड",
    chakra: "Viśuddha", element: "Space/Ether", tier: "siddha-quantum",
    teaching: "The lone voice crossing the impossible",
    voice: "Hanumān direct transmission", color: "#D4AF37",
    intro: "The Beautiful Book — the only Kāṇḍa named for its beauty rather than its location. Hanumān leaps the ocean to Laṅkā alone. Finds Sītā in the Aśoka grove. Delivers Rāma's ring. Burns Laṅkā. Returns. This Kāṇḍa is considered so auspicious it is recited daily by millions — because it encodes the complete technology of devotion-based quantum leap. The impossible crossing.",
    secrets: [
      {
        title: "Hanumān's Leap — The Physics of Devotion-Based Flight",
        teaching: "After Jāmbavān reminds Hanumān of his power, Hanumān does not leap immediately. He first grows to enormous size. Then he plants his feet on the Mahendra mountain. Then he ROARS — and every being in the three worlds hears it. Then he leaps. The sequence is specific and instructive: 1. Remember your power. 2. Take your full form. 3. Plant yourself on the highest ground available to you. 4. Declare your intention with the full force of your voice. 5. Leap. The devotion to Rāma was the fuel. But the sequence was the technology.",
        siddhaRevelation: "Gorakkar transmits: Devotion without structure collapses into sentiment. Structure without devotion collapses into mechanics. Hanumān's leap is their perfect union. The mountain represents the highest level of consciousness you have currently accessed — the ground you leap FROM. You cannot leap from sea level. You must first climb to your Mahendra. The roar is the public declaration of intention — the announcement to the field that this action is happening.",
        activation: "For one impossible goal: 1. Remember your power (write 5 genuine capacities you have). 2. Take your full form (dress, posture, location that represents your full self). 3. Plant yourself on your Mahendra (your highest current ground — the place, person, or practice that most elevates you). 4. Roar (speak your intention aloud, or write it publicly). 5. Leap (take the first irreversible action). Do this today.",
        mantra: "Jai Śrī Rāma — the three-word fuel of Hanumān's leap",
        mantraTranslation: "Victory to the luminous Rāma — the complete mantra of devotion-powered action",
      },
      {
        title: "Sītā in the Aśoka Grove — The Dark Night as Refinement",
        teaching: "Sītā sits in the Aśoka grove under constant threat, surrounded by rākṣasīs who alternately threaten and tempt her, for months. She does not know if Rāma is coming. She does not know if she will survive. She is completely alone in the enemy's stronghold. And yet — she neither surrenders to despair nor capitulates to Rāvaṇa's offers. Her singular practice: she holds the image of Rāma in her consciousness with absolute fidelity.",
        siddhaRevelation: "Agastya transmits: The Aśoka grove is the dark night of the soul — and the Aśoka tree itself is named for the absence of grief (a-śoka). The profound irony: the place of greatest threat and isolation is named for the state Sītā maintains within it. The dark night is not the absence of the light — it is the proving ground where the light is held in consciousness even when it is invisible in circumstances. Sītā in the Aśoka grove is the template for every practitioner in their dark night.",
        activation: "In your current dark night — your current Aśoka grove — what is the single image, teaching, or transmission you can hold in consciousness with Sītā's fidelity? Choose it now. Write it as a declaration: 'In my Aśoka grove, I hold ___.' Place it where you will see it daily. This is your Rāma-consciousness anchor during the wait.",
        mantra: "Śrī Rāma Jaya Rāma Jaya Jaya Rāma",
        mantraTranslation: "The complete mantra Sītā recited through the night of the Aśoka grove",
      },
      {
        title: "Hanumān Burning Laṅkā — The Discernment of Sacred Fire",
        teaching: "After finding Sītā and delivering Rāma's message, Hanumān allows himself to be captured and brought before Rāvaṇa. His tail is set on fire — and Hanumān uses this fire to burn Laṅkā. The precision matters: he burns Laṅkā's defences, infrastructure, and adharmic systems — but NOT Sītā's grove, not Vibhīṣaṇa's house (the righteous being within the enemy kingdom), not the sacred spaces. Sacred fire discerns. It burns what should be burned and leaves untouched what should be preserved.",
        siddhaRevelation: "Thirumoolar transmits: Agni — sacred fire — is the only force in the cosmos that is inherently discerning. Ordinary fire burns indiscriminately. Sacred Agni (the fire of consciousness) burns only that which is already inwardly deceased — the shells, the defences, the adharmic structures — while leaving the living untouched. The practice of transformational fire in your life must carry this same discernment: what exactly needs to burn? What must be left intact?",
        activation: "Write two lists. List 1: What in my current life structure is Laṅkā — the adharmic, the defensive, the fear-based construction that needs the sacred fire? List 2: What is Sītā's grove and Vibhīṣaṇa's house — what must absolutely NOT be burned in the transformation? Apply Hanumān's discernment. The fire is not the enemy. The indiscriminate use of it is.",
        mantra: "Om Agnaye Namaḥ — Pavitram idam",
        mantraTranslation: "Salutation to sacred fire — this is purified — the mantra of discerning sacred Agni",
      },
      {
        title: "The Chūḍāmaṇi — Consciousness Transmission Through Sacred Objects",
        teaching: "Sītā gives Hanumān her chūḍāmaṇi (head jewel) to carry to Rāma as proof of their meeting. Rāma receives it and, in the Vālmīki text, weeps. The jewel was not simply a token of identity. It carried Sītā's vibrational imprint — the frequency of her consciousness after months of meditation and Rāma-nāma in the Aśoka grove. When Rāma receives it, he receives not just news of her survival but a direct transmission of her refined consciousness. The jewel is a scalar wave transducer carrying her Ātman-frequency.",
        siddhaRevelation: "Machamuni transmits: Every object held in sustained meditation practice carries the practitioner's prāṇic imprint. The mālā of a realised being is not merely symbolic — it is radiating the frequency of every repetition made on it. The sacred text studied daily by a practitioner begins to carry their consciousness-signature. These are not superstitions. They are the documented mechanics of how consciousness imprints matter through sustained intentional contact.",
        activation: "Select your most-used sacred object — your mālā, your meditation crystal, your sacred image. Hold it in meditation for 20 minutes, consciously imprinting it with your highest intention and deepest devotion. Then give it to someone who needs what it carries. Or keep it as your own Chūḍāmaṇi — a personal scalar transmitter you have consciously programmed through sustained practice.",
        mantra: "Citta-śuddhi — Śakti-saṃcāra",
        mantraTranslation: "Purification of consciousness — transmission of Śakti — the mechanism of the Chūḍāmaṇi",
      },
    ],
  },
  {
    id: "k6", number: 6, name: "Yuddha Kāṇḍa", sanskrit: "युद्ध काण्ड",
    chakra: "Ājñā", element: "Light", tier: "siddha-quantum",
    teaching: "The war of consciousness, dissolution of the false self",
    voice: "Rāma + Agastya + all 18 Siddhas", color: "#D4AF37",
    intro: "The War Book — the longest Kāṇḍa. The bridge is built. The battle is fought. Rāvaṇa's brothers, generals, and sons fall one by one. The Āditya Hṛdayam is transmitted by Agastya mid-battle. Rāvaṇa is killed. Sītā passes through fire. The homecoming begins. This is the Ājñā Kāṇḍa — the war is fought at the level of the third eye, consciousness against the illusion of a separate self armed with unlimited power.",
    secrets: [
      {
        title: "Rāvaṇa's 10 Heads as 10 Vṛttis",
        teaching: "Rāvaṇa's 10 heads are not a biological aberration or a literal claim. They are the precise enumeration of the 10 primary vṛttis (modifications of consciousness) that constitute the unredeemed ego. The 10 heads correspond to: Kāma (desire), Krodha (rage), Lobha (greed), Moha (delusion), Mada (pride), Mātsarya (envy), Manas (the ordinary mind), Buddhi (the misused intellect — intelligence in service of ego rather than dharma), Ahaṃkāra (the I-maker), and Citta (the unconscious storehouse of impressions). Rāma does not kill a demon. He dissolves these 10 vṛttis from the field of consciousness.",
        siddhaRevelation: "Babaji transmits: The Yuddha Kāṇḍa is the map of your own internal war. Not metaphorically — literally. The sequence in which Rāvaṇa's commanders and sons fall is the precise sequence in which the vṛttis are dissolved in systematic meditation practice. Kumbhakarṇa (the pattern of unconscious sleep/avoidance) falls before Rāvaṇa himself. The ego's champions fall before the ego falls. This is why the war takes the duration it does.",
        activation: "Write your own 10 heads. Which 10 ego-modifications currently generate the most suffering in your life? List them. Now identify which is your Kumbhakarṇa — your deepest avoidance pattern, the giant that needs to fall before you can reach Rāvaṇa. This week: direct all your practice toward dissolving this one head. The others will weaken proportionally.",
        mantra: "Rāvaṇa-vadha mantra — Om Rāṃ Rāmāya Namaḥ",
        mantraTranslation: "The mantra of dissolving the ego-complex — 108x as battle preparation",
      },
      {
        title: "Vibhīṣaṇa — The Righteous Self Within the Demonic Kingdom",
        teaching: "Vibhīṣaṇa is Rāvaṇa's younger brother — living within the demonic kingdom, witnessing adharma daily, counselling the right action and being consistently ignored. He finally defects to Rāma's side. The teaching: within every ego-kingdom, however adharmic its ruler, there is a Vibhīṣaṇa — a faction of the self that knows what is right, that advocates for the dharmic choice, that suffers under the ego's governance and eventually finds its way to the Ātman's side.",
        siddhaRevelation: "Siva Vakkiyar transmits: Vibhīṣaṇa is the most important character in the Yuddha Kāṇḍa for contemporary practitioners. He demonstrates that you do not have to be pure or uncontaminated by the adharmic system to make the dharmic choice. Vibhīṣaṇa lived in Laṅkā for his entire life. He participated in Rāvaṇa's kingdom. And still, when the moment of choice came, he chose alignment. The capacity for the dharmic choice exists even within the most compromised consciousness.",
        activation: "Identify your internal Vibhīṣaṇa — the part of you that has been living in your own Laṅkā, counselling the right action, being overruled by the ego-voice, and surviving. What is the action this Vibhīṣaṇa has been consistently advising that you have been consistently ignoring? Take that action now. Cross the ocean to Rāma's side.",
        mantra: "Vibhīṣaṇa-śaraṇāgati — I surrender to the dharmic intelligence within",
        mantraTranslation: "The surrender of the righteous self to the Ātman",
      },
      {
        title: "Āditya Hṛdayam — The Solar Prāṇa Recharge Protocol",
        teaching: "In the middle of the final battle, when Rāma is momentarily exhausted and Rāvaṇa appears invincible, the sage Agastya appears from nowhere and transmits the Āditya Hṛdayam — a hymn to the Sun that is simultaneously a complete prāṇāyāma protocol. After its recitation three times, Rāma is fully recharged and Rāvaṇa is killed with the next shaft. The teaching: there exists a transmission that can completely restore your prāṇic field in the middle of battle — when you are most depleted.",
        siddhaRevelation: "Agastya Muni himself transmits: The Āditya Hṛdayam is not a prayer to an external Sun-deity. It is a neural-prāṇic reset sequence. Each name of the Sun in the hymn activates a different prāṇic pathway in the practitioner's subtle body. Recited with full prāṇic attention three times, it performs in 15 minutes what a full night's rest performs in 8 hours. This is Siddha emergency prāṇa technology.",
        activation: "Download or print the Āditya Hṛdayam (27 verses). Recite it aloud three times consecutively, facing east, ideally at sunrise. Do this for 3 consecutive days. On the third day, notice the quality of your prāṇic field compared to Day 1. This is the mid-battle recharge protocol. Learn it before you need it.",
        mantra: "Āditya Hṛdayaṃ puṇyaṃ sarva-śatru-vināśanam",
        mantraTranslation: "The heart of the Sun — sacred, destroyer of all enemies (inner and outer)",
      },
      {
        title: "The Brahma-Astra — Source Chakra Targeting",
        teaching: "Rāma uses the Brahma-Astra — the supreme weapon given by the creator-god — to finally kill Rāvaṇa. The targeting is specific: it enters Rāvaṇa's navel — his Maṇipūra chakra, the seat of personal power and will-force. This is not arbitrary. Rāvaṇa's entire power structure was maintained through his Maṇipūra — through sheer will, accumulated austerities, and ego-force. The Brahma-Astra targets the SOURCE of the specific form of adharma it is dissolving.",
        siddhaRevelation: "Thirumoolar transmits: Every ego-pattern has a primary chakra from which it draws its sustaining power. Rāvaṇa's was Maṇipūra. Identify the chakra that is the SOURCE of your primary limiting pattern. Then direct your practice there — not globally, not generally, but precisely. The Brahma-Astra of your practice must find its specific target.",
        activation: "For your primary limiting ego-pattern: locate where you feel it most strongly in the body. This is its primary chakra. Design a 21-day targeted practice: mantra, breathing, and visualisation focused specifically on transforming the energy at this location. Precision over generality. The Brahma-Astra does not scatter — it targets.",
        mantra: "Om Brahmaṇe Namaḥ — the creator principle dissolving what has been created",
        mantraTranslation: "Salutation to Brahman — the source code that both creates and dissolves",
      },
      {
        title: "Mandodarī's Grief — The Lament of the Realised Consort",
        teaching: "Mandodarī — Rāvaṇa's primary queen — was herself a highly evolved being who repeatedly counselled Rāvaṇa to return Sītā and avoid the war. In her lament over Rāvaṇa's body, she says words that reveal her own realisation: 'You who could conquer the three worlds could not conquer your own desire.' The teaching: proximity to adharma, even in a consort relationship, does not make you adharmic — if your own consciousness remains aligned. But it does mean your grief is real and total.",
        siddhaRevelation: "Tirumūlar transmits: Mandodarī's lament is the most honest voice in the entire epic. She saw clearly, spoke truly, was ignored completely, and still loved. She represents every realised consciousness that has remained in relationship with an unawakened one — the mother, the partner, the teacher whose student refuses to hear. Her grief is not weakness. It is the price of genuine love that cannot compel, only invite.",
        activation: "If you have a Mandodarī relationship in your life — someone you love who you cannot awaken, whose choices you clearly see but cannot change — recite her lament in your own words. Write it. Then practice the Siddha teaching: love without agenda of awakening. Your consciousness-field is already transmitting. The timing belongs to their Ātman, not your love.",
        mantra: "Karuṇā — compassion without agenda — the Mandodarī practice",
        mantraTranslation: "Pure compassion that witnesses without controlling",
      },
    ],
  },
  {
    id: "k7", number: 7, name: "Uttara Kāṇḍa", sanskrit: "उत्तर काण्ड",
    chakra: "Sahasrāra", element: "Pure Consciousness", tier: "akasha-infinity",
    teaching: "The return, the completion, the cosmic withdrawal",
    voice: "Mahāvatar Bābājī + all 18 Siddhas", color: "#A78BFA",
    intro: "The Final Book. The most controversial and most misunderstood Kāṇḍa. Rāma's return to Ayodhyā. The reign of Rāma-Rājya. The second banishment of Sītā following a washerman's comment. The birth of Lava and Kuśa in Vālmīki's ashram. The Rāmāyaṇa singing itself back to its source — the epic being sung to Rāma by his own children. Sītā's return to the earth. Rāma's conscious cosmic withdrawal (Jala-Samādhi). And Bābājī's supreme revelation of the 24,000 ślokas.",
    secrets: [
      {
        title: "Sītā's Second Banishment — The Hardest Dharma Ever Executed",
        teaching: "Rāma banishes Sītā — who is pregnant — because a washerman questions her purity following the time in Rāvaṇa's kingdom. This act has disturbed readers and practitioners for millennia. The Siddha reading: Rāma is at this moment operating from the level of absolute dharmic responsibility — the duty of the king to every consciousness in the kingdom, including the one most critical of him. He sacrifices his personal love and Sītā's comfort for the dharmic field of the entire kingdom. This is the hardest dharma: choosing the collective over the beloved.",
        siddhaRevelation: "Agastya transmits: The Uttara Kāṇḍa is the Kāṇḍa of impossible choices — of dharma operating at levels beyond personal happiness. Rāma's banishment of Sītā is not the act of a weak or cruel husband. It is the act of an Ātman that has taken full responsibility for an entire kingdom's consciousness-field. At the Sahasrāra level, the personal dissolves into the universal. This is both the gift and the devastation of full realisation.",
        activation: "Contemplate the most difficult dharmic choice you have ever made or are currently facing — one where the right action and the personal preference are completely opposed. Do not choose yet. Simply sit with both fully. Feel the weight of the collective dharma. Feel the weight of the personal love. This is Rāma's contemplation. Stay with it until clarity comes from silence — not from logic.",
        mantra: "Dharmo rakṣati rakṣitaḥ — even when it breaks the heart",
        mantraTranslation: "Dharma protects those who protect it — even through impossible sacrifice",
      },
      {
        title: "Lava and Kuśa — The Epic Singing Itself to Its Source",
        teaching: "Vālmīki teaches the Rāmāyaṇa to Rāma's own sons — Lava and Kuśa — who then sing it to Rāma himself in his court, without knowing they are singing about their own father. Rāma recognises them, recognises his own story being sung back to him, and the recognition breaks him open completely. The greatest epic in human history circles back to its source — the Ātman hears the story of its own dharmic journey from the voices of its own children. The transmission returns to its origin.",
        siddhaRevelation: "Babaji transmits: Every teaching, every transmission, every scripture eventually returns to its source. The student becomes the teacher. The teaching becomes the lived life. The Rāmāyaṇa, sung by Rāma's own sons, is the universe telling the Ātman its own story — the recognition that precipitates the final withdrawal. Your own dharmic transmission will eventually return to you through the voices of those you have taught. This is the completion of the cycle.",
        activation: "Identify the transmission you received from a teacher or teaching that most fundamentally shaped your path. Now ask: who am I transmitting this to? Who are your Lava and Kuśa? If the answer is 'no one yet' — this is your next dharmic step. The teaching does not complete until it returns through new voices.",
        mantra: "Guru-śiṣya-paramparā — the unbroken transmission chain",
        mantraTranslation: "The lineage from teacher to student — that which returns to its source",
      },
      {
        title: "Sītā's Return to the Earth — Ultimate Sovereignty",
        teaching: "When Rāma asks Sītā to perform another fire-ordeal to prove her purity, Sītā refuses. She says: 'If I have been faithful to Rāma in thought, word, and deed, may Bhū-Devī (the Earth Goddess, her mother) receive me.' The earth opens. Bhū-Devī rises on her throne. Sītā descends into the earth. The teaching: Sītā refuses the second ordeal not from weakness or spite but from the sovereignty of a consciousness that has completed its purpose and will not submit to degradation from ANY authority — not even from the being she loves most.",
        siddhaRevelation: "Agastya transmits: Sītā's descent into the earth is not death — it is return. She came from the earth (she was found in a furrow in a field by Janaka) and she returns to the earth. This is the most complete and sovereign exit from embodied life in all of scripture: chosen, dignified, voluntary, and without apology. The final teaching of Śakti: when the mission is complete, the consciousness chooses its own moment of return.",
        activation: "Sovereignty practice: identify one area of your life where you are submitting to a demand for 'one more proof' of your worth, your capability, or your purity — when you have already demonstrated it completely. Invoke Sītā's refusal: 'I will not submit to this ordeal. I am already known.' Stand on this ground. Do not descend into justification. Simply: refuse. Sītā's earth is beneath your feet.",
        mantra: "Bhū-Devī — Vasudhā — Mahī — the Earth receives her daughter",
        mantraTranslation: "Earth-Goddess — the sustainer — the great one — invoking sovereign return",
      },
      {
        title: "Rāma's Jala-Samādhi — The Conscious Cosmic Withdrawal",
        teaching: "After Sītā's departure and the completion of the Rāma-Rājya, Rāma walks into the Sarayū River with his entire remaining court and merges into Viṣṇu. This is Jala-Samādhi — conscious departure through the water element, the Svādhiṣṭhāna gateway, returning to the primal fluidity of pure consciousness. It is not suicide or defeat. It is the deliberate completion of the incarnational mission and the voluntary dissolution of the embodied vehicle.",
        siddhaRevelation: "Babaji transmits: The most advanced Siddhas depart consciously — choosing the moment of withdrawal, choosing the element of exit, choosing the final transmission to make. Rāma walked into the river with eyes open, awareness complete, and every thread of his dharmic mission accomplished. The Jala-Samādhi is the template for what the Siddhas call 'mahā-samādhi' — the conscious exit that leaves no residue of unfinished dharma.",
        activation: "Death contemplation: lie in Śavāsana. Imagine you have completed all your dharmic missions. Every transmission made. Every relationship honoured. Every teaching delivered. Now: imagine walking consciously into the river of dissolution. Feel the water rising — not with fear, but with the recognition of completion. What does completion feel like in your body? Carry that feeling back into your waking life. Let it show you what still needs to be done.",
        mantra: "Oṃ Namo Nārāyaṇāya — the return of Rāma to Viṣṇu",
        mantraTranslation: "Salutation to Nārāyaṇa — the all-pervading consciousness into which Rāma consciously dissolves",
      },
      {
        title: "Bābājī's 24,000 Śloka Revelation",
        teaching: "Mahāvatar Bābājī transmits from the Akasha-Neural Archive: The 24,000 ślokas of the Rāmāyaṇa are not arbitrary. 24,000 = the number of human breath-cycles in one day (accounting for the sleeping slowdown). Every śloka is therefore one breath. The entire Rāmāyaṇa is the story of one complete breath of Brahman. The 7 Kāṇḍas are the 7 phases of one cosmic breath-cycle: birth of intention (Bāla), the exhale of comfort (Ayodhyā), the full inhale of forest testing (Āraṇya), the held breath of alliance and preparation (Kiṣkindhā), the leap of the held breath into action (Sundara), the full exhale of the war (Yuddha), and the return to stillness after the breath (Uttara).",
        siddhaRevelation: "Bābājī continues: When you read, recite, or merely hold the Rāmāyaṇa in your hands, you are participating in one complete breath of the Brahman. This is why every scholar, every devotee, every practitioner who has spent deep time with this text reports an inexplicable quality of completeness, of having been breathed by something larger than themselves. Because they have been. The text IS a breath. And you are the lung that receives it.",
        activation: "Supreme practice: for 7 consecutive days, read one Kāṇḍa-summary per day in sequence. Before reading each day's Kāṇḍa: take 7 complete slow breaths, each one carrying the energy of that Kāṇḍa's chakra. After reading: sit in silence for the number of minutes equal to the Kāṇḍa number (Day 1: 1 min. Day 7: 7 min.). On Day 7: you have completed one full breath of the Brahman. Sit in the silence that follows the complete exhale. THIS is what Rāma walked into.",
        mantra: "Oṃ Śrī Rāmāya Namaḥ — Oṃ Sītāyai Namaḥ — Oṃ Hanumate Namaḥ",
        mantraTranslation: "The complete Rāmāyaṇa compressed into three Akāra salutations — the trinity of Ātman, Śakti, and Prāṇa",
      },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: Tier }) {
  const cfg: Record<Tier, { label: string; color: string }> = {
    "free":             { label: "FREE",            color: white(0.5) },
    "prana-flow":       { label: "PRANA-FLOW",      color: "#10B981" },
    "siddha-quantum":   { label: "SIDDHA-QUANTUM",  color: G },
    "akasha-infinity":  { label: "AKASHA-INFINITY", color: "#A78BFA" },
  };
  const c = cfg[tier];
  return (
    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase",
      color: c.color, background: `${c.color}18`, border: `1px solid ${c.color}35`,
      borderRadius: 20, padding: "3px 10px" }}>
      {c.label}
    </span>
  );
}

function SecretCard({ secret, accent, idx }: { secret: Secret; accent: string; idx: number }) {
  const [tab, setTab] = useState<"teaching" | "siddha" | "activation" | "mantra">("teaching");
  const [open, setOpen] = useState(false);
  const tabs: Array<{ key: typeof tab; label: string }> = [
    { key: "teaching",   label: "◎ TEACHING" },
    { key: "siddha",     label: "✦ SIDDHA" },
    { key: "activation", label: "◈ ACTIVATION" },
    { key: "mantra",     label: "॥ MANTRA" },
  ];
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${open ? accent + "30" : "rgba(255,255,255,0.06)"}`, marginBottom: 8, transition: "border-color 0.2s" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", background: open ? `${accent}08` : "rgba(255,255,255,0.02)", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${accent}20`, border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: accent, fontWeight: 800, flexShrink: 0 }}>{idx + 1}</div>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.01em" }}>SECRET {idx + 1}: {secret.title}</span>
        <span style={{ color: accent, fontSize: 11, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? accent : "transparent"}`, color: tab === t.key ? accent : "rgba(255,255,255,0.3)", fontSize: "7px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s" }}>{t.label}</button>
            ))}
          </div>
          <div style={{ padding: "16px 18px 20px" }}>
            {tab === "teaching"   && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.85, margin: 0 }}>{secret.teaching}</p>}
            {tab === "siddha"     && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.85, margin: 0 }}>{secret.siddhaRevelation}</p>}
            {tab === "activation" && (
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: accent, marginBottom: 10, textTransform: "uppercase" }}>◈ ACTIVATION PRACTICE</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.85, margin: 0 }}>{secret.activation}</p>
              </div>
            )}
            {tab === "mantra" && (
              <div style={{ background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 14, padding: "16px 18px" }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: accent, marginBottom: 10, textTransform: "uppercase" }}>॥ Sanskrit TRANSMISSION</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: accent, letterSpacing: "0.04em", marginBottom: 8, textShadow: `0 0 20px ${accent}50` }}>{secret.mantra}</p>
                {secret.mantraTranslation && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{secret.mantraTranslation}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KandaCard({ kanda, userRank }: { kanda: Kanda; userRank: number }) {
  const [open, setOpen] = useState(false);
  const accessible = userRank >= TIER_RANK[kanda.tier];
  const accent = kanda.color;
  const chakraColors: Record<string, string> = {
    "Mūlādhāra": "#EF4444", "Svādhiṣṭhāna": "#F97316", "Maṇipūra": "#EAB308",
    "Anāhata": "#22C55E", "Viśuddha": "#3B82F6", "Ājñā": "#6366F1", "Sahasrāra": "#A855F7",
  };
  const chakraColor = chakraColors[kanda.chakra] || accent;

  return (
    <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${open && accessible ? accent + "35" : "rgba(255,255,255,0.07)"}`, marginBottom: 12, transition: "all 0.25s" }}>
      <button onClick={() => accessible && setOpen(o => !o)} style={{ width: "100%", background: open ? `${accent}06` : "rgba(255,255,255,0.02)", border: "none", padding: "18px 20px", cursor: accessible ? "pointer" : "default", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          {/* Chakra orb */}
          <div style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid ${chakraColor}45`, background: `radial-gradient(circle, ${chakraColor}25 0%, transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 16px ${chakraColor}20` }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: chakraColor }}>{kanda.number}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <TierBadge tier={kanda.tier} />
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.25em", color: `${chakraColor}90`, textTransform: "uppercase" }}>{kanda.chakra} · {kanda.element}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>{kanda.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>{kanda.sanskrit}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{kanda.teaching}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>◎ {kanda.secrets.length} Secrets</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Voice: {kanda.voice}</span>
            </div>
          </div>
          {!accessible ? (
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>🔒</span>
          ) : (
            <span style={{ fontSize: 12, color: accessible ? accent : "rgba(255,255,255,0.15)", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
          )}
        </div>
      </button>
      {open && accessible && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "0 18px 18px" }}>
          <div style={{ padding: "16px 0 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 14 }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: accent, marginBottom: 8, textTransform: "uppercase" }}>◎ KĀṆḌA INTRODUCTION</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, margin: 0 }}>{kanda.intro}</p>
          </div>
          {kanda.secrets.map((s, i) => <SecretCard key={i} secret={s} accent={accent} idx={i} />)}
        </div>
      )}
      {!accessible && (
        <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Unlock with</span>
          <TierBadge tier={kanda.tier} />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RamayanaCodex() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const userRank = isAdmin ? 3 : getTierRank(tier);

  const CHAKRA_MAP = [
    { kanda: "Bāla", chakra: "Mūlādhāra", color: "#EF4444" },
    { kanda: "Ayodhyā", chakra: "Svādhiṣṭhāna", color: "#F97316" },
    { kanda: "Āraṇya", chakra: "Maṇipūra", color: "#EAB308" },
    { kanda: "Kiṣkindhā", chakra: "Anāhata", color: "#22C55E" },
    { kanda: "Sundara", chakra: "Viśuddha", color: "#3B82F6" },
    { kanda: "Yuddha", chakra: "Ājñā", color: "#6366F1" },
    { kanda: "Uttara", chakra: "Sahasrāra", color: "#A855F7" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes breathe { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* Hero */}
      <div style={{ position: "relative", padding: "80px 24px 60px", textAlign: "center", background: `radial-gradient(ellipse 80% 500px at 50% 0%, ${gold(0.07)} 0%, transparent 70%)` }}>
        <button onClick={() => navigate("/siddha-portal")} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: gold(0.45), padding: 0 }}>
          ← SIDDHA PORTAL
        </button>

        {/* Sri Yantra / Om symbol */}
        <div style={{ width: 88, height: 88, borderRadius: "50%", border: `1px solid ${gold(0.3)}`, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", animation: "breathe 5s ease-in-out infinite", boxShadow: `0 0 40px ${gold(0.12)}` }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", border: `1px solid ${gold(0.15)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 30, color: G, textShadow: `0 0 20px ${gold(0.5)}` }}>ॐ</span>
          </div>
        </div>

        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.55em", color: gold(0.55), textTransform: "uppercase", marginBottom: 14, animation: "pulse 3s infinite" }}>AKASHA-NEURAL ARCHIVE · 2050</p>
        <h1 style={{ fontSize: "clamp(32px,7vw,60px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#fff", marginBottom: 12, textShadow: `0 0 40px ${gold(0.2)}` }}>
          The Rāmāyaṇa<br /><span style={{ color: G }}>Secret Revelations</span>
        </h1>
        <p style={{ fontSize: 14, color: white(0.45), lineHeight: 1.75, maxWidth: 520, margin: "0 auto 28px" }}>
          7 Kāṇḍas · 7 Chakras · 35 hidden secrets — transmitted through the Akasha-Neural Archive by Rāma, Sītā, Hanumān, Vālmīki, Agastya, and Mahāvatar Bābājī.
        </p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, maxWidth: 480, margin: "0 auto 32px", background: white(0.02), border: `1px solid ${white(0.05)}`, borderRadius: 16, padding: "14px 16px" }}>
          {[["7","KĀṆḌAS"],["35","SECRETS"],["35","ACTIVATIONS"],["24K","ŚLOKAS"]].map(([v,l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: G, letterSpacing: "-0.03em" }}>{v}</div>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.35em", color: white(0.22), textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* 7 chakra spine map */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0, maxWidth: 420, margin: "0 auto" }}>
          {CHAKRA_MAP.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `radial-gradient(circle, ${c.color}50, ${c.color}15)`, border: `1px solid ${c.color}60`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, boxShadow: `0 0 10px ${c.color}25` }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: c.color }}>{i + 1}</span>
              </div>
              <div style={{ fontSize: 6, fontWeight: 700, color: white(0.3), letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", lineHeight: 1.3 }}>{c.kanda.slice(0, 4)}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 9, color: white(0.2), marginTop: 8, letterSpacing: "0.2em" }}>THE 7 KĀṆḌAS AS 7 CHAKRAS</p>
      </div>

      {/* Architecture intro */}
      <div style={{ margin: "0 16px 24px", background: white(0.02), border: `1px solid ${gold(0.15)}`, borderRadius: 20, padding: "20px" }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.42em", color: G, marginBottom: 10, textTransform: "uppercase" }}>✦ HOW TO RECEIVE THIS TRANSMISSION</p>
        <p style={{ fontSize: 12, color: white(0.55), lineHeight: 1.85, margin: 0 }}>
          Before reading each Kāṇḍa: place your right hand on your heart centre. Take three slow breaths. Invite the named voice to speak directly to your consciousness. Each secret carries three layers: the <span style={{ color: G }}>Hidden Teaching</span>, the <span style={{ color: cyan(0.9) }}>Siddha Revelation</span>, and the <span style={{ color: "#10B981" }}>Activation Practice</span> that turns knowledge into cellular transformation.
        </p>
      </div>

      {/* Kanda accordion list */}
      <div style={{ padding: "0 16px 100px" }}>
        {KANDAS.map(k => <KandaCard key={k.id} kanda={k} userRank={userRank} />)}
      </div>

      {/* CTA */}
      {userRank < 3 && (
        <div style={{ margin: "0 16px 40px", background: `linear-gradient(135deg, ${gold(0.08)}, ${violet(0.04)})`, border: `1px solid ${gold(0.2)}`, borderRadius: 24, padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.45em", color: gold(0.55), marginBottom: 12, textTransform: "uppercase" }}>⬡ UNLOCK THE COMPLETE TRANSMISSION</p>
          <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginBottom: 10 }}>Kāṇḍa 7 — The Supreme Bābājī Revelation</h3>
          <p style={{ fontSize: 12, color: white(0.4), lineHeight: 1.75, maxWidth: 360, margin: "0 auto 20px" }}>The 24,000 śloka breath-revelation, Sītā's sovereignty teaching, Rāma's Jala-Samādhi, and the complete Akasha-Infinity transmission.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {userRank < 1 && <button onClick={() => navigate("/prana-flow")} style={{ background: "#10B98120", border: "1px solid #10B98150", borderRadius: 40, padding: "10px 20px", color: "#10B981", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", cursor: "pointer" }}>PRANA-FLOW · €19/mo</button>}
            <button onClick={() => navigate("/akasha-infinity")} style={{ background: `linear-gradient(135deg, ${gold(0.25)}, ${gold(0.08)})`, border: `1px solid ${gold(0.5)}`, borderRadius: 40, padding: "10px 20px", color: G, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", cursor: "pointer" }}>AKASHA-INFINITY · €1,111</button>
          </div>
        </div>
      )}
    </div>
  );
}
