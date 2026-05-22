// ============================================================
// SQI MANTRA NADA ACADEMY — CONTENT DATA
// src/data/mantraAcademyData.ts
// BUILD STATUS: Module 1 complete. Modules 2–24 in progress.
// ============================================================

export type Tier = 'free' | 'prana' | 'siddha' | 'akasha';

export interface AudioTrack {
  id: string;
  title: string;
  description: string;
  duration?: string; // e.g. "11:11"
  url?: string;      // filled when Kritagya/Laila record
}

export interface Practice {
  title: string;
  steps: string[];
}

export interface MantraCard {
  devanagari: string;
  transliteration: string;
  translation: string;
  body: string;
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  durationMin: number; // estimated reading + practice time
  sections: Array<{
    type: 'intro' | 'teaching' | 'mantra' | 'practice' | 'wisdom' | 'integration' | 'audio';
    heading?: string;
    body?: string;
    mantra?: MantraCard;
    practice?: Practice;
    audio?: AudioTrack;
    wisdomTitle?: string;
    wisdomBody?: string;
  }>;
}

export interface Module {
  id: string;
  number: number;
  tier: Tier;
  title: string;
  subtitle: string;
  description: string;
  lessons: Lesson[];
}

// ============================================================
// MODULE 1 — AUM: THE PRIMORDIAL ALGORITHM
// Tier: FREE | 6 Lessons
// ============================================================

const module1: Module = {
  id: 'module-01',
  number: 1,
  tier: 'free',
  title: 'AUM — The Primordial Algorithm',
  subtitle: 'Pranava Nada · First Transmission',
  description:
    'The universe began with a sound. Not a metaphorical sound — a literal vibration of consciousness recognizing itself. The Vedas called it Pranava — AUM. Modern cosmology calls the same event the Big Bang. This module decodes the most powerful syllable in existence: its structure, its neurological effects, and the precise technique for activating it fully in your body and field.',
  lessons: [
    // ─────────────────────────────────────────────────────
    // LESSON 1.1
    // ─────────────────────────────────────────────────────
    {
      id: 'l1-1',
      number: 1,
      title: 'Why AUM Is Not a Word',
      subtitle: 'The Cosmic Frequency Signature',
      durationMin: 15,
      sections: [
        {
          type: 'intro',
          body: `Before you ever chant AUM for the first time in this course, you need to understand what you are actually doing. Because if you approach AUM as a "spiritual word" or a "religious symbol," you will receive perhaps 5% of its actual capacity. AUM is not a word. It is not a religious label. It is the sonic signature of the universe itself — the specific vibrational pattern that emerges when pure consciousness moves.\n\nEvery culture that has developed deep contemplative science has independently arrived at this same sound. The ancient Egyptians used ATUM. The early Christians used AMEN. The Tibetans use AUM as the first syllable of their most sacred mantras. This is not coincidence. These are not cultural borrowings. This is independent discovery — multiple civilizations, separated by oceans and centuries, all arriving at the same primordial sound because they were all listening to the same source.`,
        },
        {
          type: 'teaching',
          heading: 'The Physics of Pranava',
          body: `The word Pranava in Sanskrit comes from the root PRA-NU — meaning "to reverberate, to resound completely." The Mandukya Upanishad opens with the declaration: "AUM — this syllable is all this. Whatever has been, whatever is, whatever shall be — all of this is only AUM. And whatever is beyond these three times — that also is only AUM."\n\nThis is a staggering claim. It says that AUM is not merely a representation of the universe — it IS the universe. How can a sound be the universe? The Siddhas and the Upanishadic seers understood something that quantum physics is only now confirming: that matter, at its deepest level, is not solid. It is vibration. Every atom is 99.9999% empty space, with particles held in their relative positions by vibrational fields. What we call "matter" is consciousness vibrating at specific frequencies. AUM is the master frequency — the root vibration from which all other frequencies arise, like overtones from a fundamental tone.\n\nWhen modern physicists describe the universe as emerging from a quantum vacuum — a field of pure potential that contains all possible states — they are describing the same reality the Vedas called Brahman. And when the Vedas say "In the beginning was AUM," they are describing the first movement of that field — the first vibration of consciousness becoming aware of itself.`,
        },
        {
          type: 'teaching',
          heading: 'The Three Letters and Their Cosmic Correspondence',
          body: `AUM is written with three letters in Sanskrit: A, U, M. Each corresponds to a fundamental triad that structures all of reality.\n\nThe letter A (अ) is the first letter of the Sanskrit alphabet. It requires no positioning of the tongue or lips — the mouth simply opens and sound emerges. The Upanishads say A corresponds to the waking state (Jagrat), to the god Brahma (creator), and to the element Earth. It is the most fundamental, the most grounded, the most accessible.\n\nThe letter U (उ) represents the dreaming state (Svapna), the god Vishnu (preserver/sustainer), and the element Water. U is the sound that bridges — it takes the openness of A and begins to close toward the M, just as the dream state bridges waking and deep sleep.\n\nThe letter M (म) is the nasal sound — the hum that requires the lips to close. It corresponds to deep dreamless sleep (Sushupti), to the god Shiva (destroyer/transformer), and to the element Fire. When you close into M, all the external vibrations of A and U are internalized. The sound goes from outward to inward in the span of a single breath.\n\nBut there is a fourth dimension — one that the Mandukya Upanishad calls Turiya, the Fourth. It is the silence that follows the M. Not the silence of absence, but the silence of completion — the stillness from which the next AUM will arise. The Upanishad says Turiya is not A, not U, not M. It is the witness of all three. It is pure awareness itself. This silence IS the mantra completing itself.`,
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'ॐ',
            transliteration: 'AUM',
            translation: 'The Pranava — The All-Pervading Sound',
            body: `AUM is technically one syllable containing three phonemes. It is written in Devanagari as a single glyph (ॐ) that is itself a map of consciousness: the lower curve represents the waking state, the upper curve the dreaming state, the tail-curve deep sleep, the crescent above Turiya, and the dot (Bindu) above the crescent represents the point of transcendence — pure awareness beyond all states. Every time you see or write this symbol, you are looking at a complete map of all possible states of consciousness compressed into a single glyph.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Siddha Secret — AUM as a Living Entity',
          wisdomBody: `Thirumoolar wrote in the Thirumantiram: "I searched for the mantra and found no mantra. I searched for the deity and found no deity. When I stopped searching and simply listened — the mantra was already sounding, the deity was already present. The AUM was chanting itself through me before I knew what I was." This teaching points to something crucial that most practitioners never discover: AUM is not something you DO. It is something you RECOGNIZE. The universe is vibrating at this frequency right now, in every cell of your body, in every atom of the air around you. The practice of chanting AUM is not creating a sound — it is tuning your instrument to a sound that is already playing. This distinction changes everything about how you approach the practice.`,
        },
        {
          type: 'integration',
          heading: 'Today\'s Contemplation',
          body: `Before you practice AUM today, sit for 3 minutes in complete silence. Not trying to hear AUM — simply listening to whatever is present. Notice: there is never true silence. There is always some sound — traffic, air, your own heartbeat, a faint ringing in the ears. The Siddhas said this background hum — the sound that is always present — IS the Pranava. You are always already inside the mantra. The practice begins with recognizing this, not creating something new.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l1-1-audio',
            title: 'AUM — Kritagya & Laila Recitation',
            description: 'Listen to the Pranava chanted 9 times with full resonance. Follow along internally.',
            duration: '',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 1.2
    // ─────────────────────────────────────────────────────
    {
      id: 'l1-2',
      number: 2,
      title: 'The 3 Sounds Within AUM',
      subtitle: 'Brahma, Vishnu, Shiva Frequencies',
      durationMin: 18,
      sections: [
        {
          type: 'intro',
          body: `Now that you understand what AUM IS, we go deeper: what are the specific frequencies within AUM, and how do they operate in your body and in the cosmic order? This lesson decodes each of the three phonemes in precise detail — how to produce them correctly, where they vibrate in the body, which neural circuits they activate, and what cosmic principle they represent. Most people who chant AUM are producing a muddy combination of the three sounds without conscious distinction. This lesson gives you surgical precision.`,
        },
        {
          type: 'teaching',
          heading: 'The A Sound — Earth, Creation, Solar Plexus',
          body: `Begin with the mouth wide open. The A sound (pronounced like the A in "father," not as in "day") arises from the deepest part of the vocal tract. No constriction anywhere. The tongue lies flat. The soft palate is open. This openness is intentional — the A corresponds to the principle of pure creation, of the universe pouring itself out freely with no restriction.\n\nIn the body, a correctly produced A vibrates most strongly in the belly and lower chest — particularly around the solar plexus (Manipura chakra) and the navel center. Place your hand on your belly when you chant A and you should feel the vibration clearly. The solar plexus is the seat of personal power, will, and identity in the body — the Brahma-center where the "I am" of individual consciousness resides. This is why A corresponds to the waking state: it is the state where we are most identified with our individual self.\n\nThe god Brahma, lord of creation, is associated with A. In the Hindu cosmology, Brahma creates by naming — by speaking. This is A: the primal act of giving voice to what exists in potential. Before A is spoken, all possibilities are equal. When A sounds, one particular universe is being spoken into form.`,
        },
        {
          type: 'teaching',
          heading: 'The U Sound — Water, Sustenance, Heart Center',
          body: `As you continue sounding from A, allow the lips to slowly close slightly, rounding forward. The back of the throat narrows gently. The tongue rises toward the soft palate. The sound transitions from the open A to the rounder U (pronounced as in "moon," not as in "cup"). This is not a hard break — it is a continuous flow, like water smoothly changing its course.\n\nU vibrates most clearly in the chest cavity — specifically in the heart and lung region. The Anahata chakra (heart center) is the resonance point of U. Place your hand on your heart when you sustain the U sound. You should feel the vibration there. The heart in Siddha physiology is the seat of Awareness — the place where individual consciousness interfaces with universal consciousness. Vishnu, the preserver, presides here: the sustaining intelligence that holds all created things in existence.\n\nThe U corresponds to the dreaming state. In the dream state, the external world disappears, but internal experience remains vivid and real. This is the nature of U — it bridges the fully external (A/waking) and the fully internal (M/deep sleep). In your AUM practice, the U is often the sound that people rush through. Learn to dwell in it. The heart opening of genuine mantra practice often happens in the U, not the A or M.`,
        },
        {
          type: 'teaching',
          heading: 'The M Sound — Space, Dissolution, Crown',
          body: `Allow the lips to gently close. The sound becomes an internal hum. All external projection ceases. The vibration moves up from the chest toward the skull. The M sound vibrates most powerfully in the skull cavity — specifically stimulating the bones of the cranium, the nasopharynx, and — through bone conduction — the pineal gland at the geometrical center of the brain.\n\nThis is not poetic language. Bone conduction of sound is a well-documented physiological phenomenon (it is how hearing aids work). When you close the lips and hum M, the vibration travels through the bones of your skull and directly stimulates brain tissue that airborne sound cannot reach. The pineal gland — which the Siddhas called the Ajna chakra or the "third eye" — sits at the intersection of the two hemispheres of the brain, directly in the path of this bone-conducted M vibration.\n\nThe pineal gland is one of the most metabolically active tissues in the body. It produces DMT (dimethyltryptamine) during deep sleep and near-death states — the same compound found in ayahuasca and other visionary plant medicines. It produces melatonin (sleep-wake regulation) and seratonin (mood regulation). The Siddhas who chanted M extensively for years reported spontaneous inner light, visions of deities, and states of profound stillness — all consistent with pineal activation. The M sound of AUM is the key to the pineal. Shiva, the destroyer, presides in M: the principle that dissolves all formed things back into pure awareness.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Three-Body AUM Resonance Mapping',
            steps: [
              'Sit comfortably with spine upright. Place both hands on your belly.',
              'Take a full breath in through the nose. On the exhale, begin A — mouth wide open, sound fully from the belly. Feel the vibration under your hands. Hold for 4-5 seconds.',
              'Move your hands to your heart center (sternum). Begin U — lips slightly round, sound from the chest. Feel the heart vibrate. Hold for 4-5 seconds.',
              'Move one hand to the top of your skull (crown). Begin M — lips closed, hum. Feel the skull vibrate under your hand. Hold for as long as the breath allows.',
              'When the breath is nearly empty, release the M and rest in complete silence. This is the 4th state — Turiya. Rest here for 4-8 seconds before the next inhale.',
              'Repeat this 9 times. This is one complete round.',
              'After 9 rounds, sit in silence for at least 2 minutes. Do not immediately speak or check your phone. The field takes time to settle.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Nath Siddha Teaching on Three-Body Chanting',
          wisdomBody: `Gorakshanath taught that the A, U, and M of AUM correspond not only to states of consciousness but to the three bodies of the human being: A = Sthula Sharira (physical body), U = Sukshma Sharira (subtle/energy body), M = Karana Sharira (causal body/seed body). When you move your hands to feel the vibration in belly, heart, and skull, you are not merely doing an exercise. You are consciously moving the mantra through your three bodies simultaneously. A practitioner who chants AUM this way for 40 days begins to directly experience the difference between the three bodies as distinct realities — not as concepts but as felt experiences. This is the beginning of what the Siddhas called Deha Shuddhi — purification of the body at all three levels.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l1-2-audio',
            title: 'Three-Body AUM — Guided Resonance Practice',
            description: 'Kritagya & Laila guide you through the three-body mapping practice. 9 rounds with pauses for integration.',
            duration: '',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 1.3
    // ─────────────────────────────────────────────────────
    {
      id: 'l1-3',
      number: 3,
      title: 'The 4th State',
      subtitle: 'The Silence After M is Where the Mantra Lives',
      durationMin: 20,
      sections: [
        {
          type: 'intro',
          body: `Everything in the previous two lessons has been preparation for this teaching. Because the real mantra is not the A, the U, or the M. The real mantra — the frequency that actually changes the practitioner — is the silence that follows. The Mandukya Upanishad devotes more verses to the 4th state (Turiya) than to all three sounds combined. This is because the sound is the key, but the silence is the door that the key opens.`,
        },
        {
          type: 'teaching',
          heading: 'What Turiya Actually Is',
          body: `The word Turiya simply means "the Fourth" in Sanskrit. It is not named after any particular quality — it is named only by its position: beyond the third. The three previous states (waking, dreaming, deep sleep) are all states OF consciousness — experiences that consciousness has. Turiya is different. It is not a state that consciousness has. It IS consciousness — the pure, witnessing awareness that is present in all three states but is not identical to any of them.\n\nWhen you are awake, you are aware. When you dream, you are aware. When you sleep deeply, the Upanishads say you are still aware — you simply have no object of awareness, which is why you report "I slept well, there was nothing" when you wake up. The "I" that reports this is the same "I" that was present in waking and dreaming. That consistent "I" — the awareness that was present in all three states — is Turiya.\n\nIn the context of AUM practice: A produces a specific state (expansion, vitality, extroversion). U produces a specific state (warmth, emotion, heart-opening). M produces a specific state (inwardness, stillness, introversion). The silence after M does not produce a state. Instead, it reveals the pure awareness that was present behind all three sounds — the one that was listening to the A, the U, and the M without being identical to any of them.`,
        },
        {
          type: 'teaching',
          heading: 'Why the Silence is the Most Important Part',
          body: `Most people who chant AUM never pause in the silence. They take a breath and immediately begin the next AUM. This is understandable — silence feels empty, and the mind is trained to fill emptiness immediately. But from the Siddha perspective, this is like planting a seed and immediately digging it up before it germinates. The silence is where the mantra's work happens.\n\nHere is why: during the chanting of A-U-M, you have moved through three distinct frequency bands. You have, in effect, done a complete sweep of the human consciousness field — from the grossest (waking/physical) to the subtlest (causal/deep sleep). The silence after M is the moment when all three frequencies are simultaneously present as an echo — when the nervous system holds all three states in suspension before collapsing back into ordinary waking consciousness. In this suspension, something extraordinary can happen: the nervous system temporarily abides as the awareness that holds all three states without being any of them. This is Turiya — directly experienced, not theorized.\n\nWith practice, this silence becomes richer, fuller, and more alive. Experienced practitioners report that the silence after AUM becomes louder than the mantra itself — they begin to hear in that silence the Anahata Nada, the unstruck sound, the hum of the universe that the Nada Yoga tradition calls the primary object of meditation.`,
        },
        {
          type: 'teaching',
          heading: 'The Bindu — The Point of Transcendence',
          body: `In the written symbol ॐ, there is a dot (Bindu) above the crescent moon. In Tantric philosophy, the Bindu is the point where the unmanifest (Shiva) meets the manifest (Shakti) — the infinitely small point of pure consciousness from which all of creation emanates and to which it returns. The crescent below the Bindu represents Maya — the veil of illusion. The Bindu sits above the veil.\n\nThe silence after M in AUM is the Bindu in sound. When you dwell in that silence with awareness, you are literally resting your consciousness at the point where the unmanifest meets the manifest — the threshold of creation. The Siddhas said that healing, transformation, and realization all occur at the Bindu. The A, U, and M bring you to the door. The silence IS the door. Turiya is what's on the other side — and it was always on the other side, because it was always who you were.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Turiya Practice — Dwelling in the Living Silence',
            steps: [
              'Set a timer for 21 minutes. This practice is best done at Brahma Muhurta (before sunrise) or in the evening after sunset.',
              'Sit in your meditation posture with spine erect. Take 3 natural breaths to settle.',
              'Chant one AUM slowly — approximately 8-10 seconds for the entire A-U-M arc.',
              'When the M naturally ends, do NOT take a breath immediately. Hold the breath out (external Kumbhaka) and rest in the silence. Keep your inner attention at the Ajna chakra (between the eyebrows).',
              'Hold the silence for as long as is comfortable without strain. When the need to breathe becomes insistent, take a slow inhale.',
              'Rest in 2 natural breaths, then chant the next AUM.',
              'The ratio should be approximately: 8 seconds AUM, 8–16 seconds silence, 8 seconds rest.',
              'After 21 minutes, lie down in Shavasana for 5 minutes. Do not sleep. Simply allow the field to integrate.',
              'Journaling prompt: What quality did the silence have today? Was it empty or full? Flat or alive? Note this over 40 days — the silence changes as the practice deepens.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Thirumoolar\'s Teaching on the Space Between',
          wisdomBody: `In Thirumantiram verse 2749, Thirumoolar writes: "Between the breath going out and the breath coming in — there, in that gap — the supreme reality resides. Between one thought and the next — there, in that gap — Shiva is present. The yogi who has learned to expand that gap has learned to live in eternity." The silence after AUM is the same gap. In your practice, experiment with gently, consciously elongating that silence — not through suppression or willpower, but through interest. What is in the silence? Look. The act of looking INTO the silence rather than trying to fill or escape it is the practice of Turiya. Most people will begin to experience a faint shimmer or vibration in that silence within the first week of consistent practice. That shimmer IS the Pranava in its subtlest form — the Anahata Nada beginning to become audible.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l1-3-audio',
            title: 'AUM with Extended Silence — Turiya Practice',
            description: '21-minute guided Turiya session. Kritagya chants and holds silence with you. No speaking during silence periods.',
            duration: '21:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 1.4
    // ─────────────────────────────────────────────────────
    {
      id: 'l1-4',
      number: 4,
      title: 'The AUM Technique',
      subtitle: 'Skull Resonance, Chest Vibration, Abdominal Wave',
      durationMin: 25,
      sections: [
        {
          type: 'intro',
          body: `Understanding the philosophy of AUM is essential. But the practice is where transformation actually occurs. This lesson is entirely practical — a step-by-step technical guide to producing AUM with maximum resonance and healing effect in the body. We cover posture, breath, vocal production, physical resonance points, duration, volume, and the most common errors that prevent practitioners from accessing the full power of this practice.`,
        },
        {
          type: 'teaching',
          heading: 'Posture — Why It Matters More Than You Think',
          body: `The spine is the primary resonance column for AUM. Every vertebra is a vibrational node. When the spine is curved, compressed, or collapsed, the sound cannot travel freely through its full length — like a guitar with a warped neck. The Siddhas understood that the physical body is not separate from the energetic body — it IS the energetic body in its densest form. Compromising the physical posture compromises the energetic transmission.\n\nSit on a cushion, chair, or folded blanket so that the hips are slightly higher than the knees. This naturally tips the pelvis forward and extends the lumbar spine. Stack the vertebrae: sacrum, lumbar, thoracic, cervical — each one sitting directly above the one below, like a column of coins. The skull balances at the top without effort. The chin is slightly tucked — not down toward the chest, but gently retracted so the back of the neck lengthens.\n\nThis posture is non-negotiable for maximum AUM practice. The Sushumna Nadi — the central channel of energy in the spine — can only be fully open when the spine is vertical and aligned. AUM chanted in this posture creates a standing wave in the Sushumna — a resonant frequency column that charges all 7 chakra centers simultaneously.`,
        },
        {
          type: 'teaching',
          heading: 'Breath — The Carrier of the Mantra',
          body: `Breath is not merely the mechanism for producing sound. In Siddha science, breath (Prana) is the life force that carries the mantra's charge through the Nadi system. The quality of the breath before AUM determines the quality of the AUM itself.\n\nThe optimal breath for AUM chanting is a slow, full, diaphragmatic inhale — not a chest breath. Place one hand on your belly. When you inhale, your belly should move OUT first (diaphragm descending), then your chest should expand. This ensures the lungs fill from the bottom up, maximizing air volume and slowing the respiratory rate. A full diaphragmatic inhale for AUM should take 4-6 seconds.\n\nDo not rush the inhale. The Siddhas said: "The quality of the AUM is determined by the quality of the silence and the breath before it, not by the voice during it." Take your time. The inhale is the preparation of the instrument. The AUM is the performance.`,
        },
        {
          type: 'teaching',
          heading: 'Volume and Tonal Quality',
          body: `AUM should not be chanted at maximum volume. The Shaiva Agamas specify three volumes for mantra practice: Vaikhari (audible, for group practice and initial training), Upamshu (whispered, for individual practice), and Manasika (mental/silent, for advanced practice). For this foundational module, we use Vaikhari — clearly audible, at approximately 60-70% of maximum volume.\n\nThe tonal quality should be steady and consistent — not wavering, not rising and falling in pitch. Find the natural speaking pitch of your voice and begin AUM from there. Do not artificially lower your voice (this creates tension in the throat and blocks the vibration). Your natural pitch is the frequency that resonates most efficiently with YOUR particular body cavity dimensions. Trust it.\n\nThe sound should feel effortless. If there is strain in your throat, you are pushing. If the sound feels like it is coming from your throat, you are not using enough diaphragmatic support. The source of the sound should always feel like it is coming from the belly — the throat is simply the passage, not the source.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'The Complete AUM Technique — Step by Step',
            steps: [
              'POSTURE: Sit in your meditation posture with spine vertical, hips higher than knees, chin slightly tucked. Close your eyes.',
              'SETTLING: Take 3 natural breaths without any effort to control them. Let the body breathe itself. Feel the weight of the body on the floor.',
              'PREPARATION BREATH: Take a slow, full, diaphragmatic inhale over 5 counts. Belly expands first, then chest. At the top of the inhale, a brief natural pause occurs — do not force it or suppress it.',
              'A: Begin sounding A immediately as the exhale begins. Mouth wide open. Sound from the belly. Lips relaxed, jaw open approximately 3-4cm. Tongue flat. Let the belly slowly contract as the sound continues. Duration: approximately 1/3 of the total exhale.',
              'U: Without stopping the sound, allow the lips to round slightly forward and the jaw to close slightly. The sound transitions smoothly from A to U. Feel the vibration move from belly to chest. Place awareness at the heart center. Duration: approximately 1/3 of the total exhale.',
              'M: Without stopping the sound, allow the lips to gently close. The sound becomes an internal hum. Feel the vibration move from chest to skull. The upper palate vibrates. The teeth may gently vibrate. The skull hums. Duration: approximately 1/3 of the total exhale. This continues until the breath is approximately 80% empty.',
              'SILENCE: At the natural end of the M (do not force it), stop all sound. Hold the breath out (external Kumbhaka) comfortably. Rest your awareness at the Ajna (between the eyebrows). Stay in this silence for at least as long as the M lasted — longer if comfortable.',
              'INHALE: When the need to breathe is felt, take the next slow diaphragmatic inhale. This completes one round.',
              'DURATION: Minimum 9 rounds for beginners. 21 rounds for daily practice. 108 rounds for deep Sadhana.',
            ],
          },
        },
        {
          type: 'teaching',
          heading: 'The Most Common Errors — And How to Fix Them',
          body: `Error 1 — Rushing the transitions: The A-to-U and U-to-M transitions should be completely smooth, like a single continuous note changing timbre. If you hear a hard break between sounds, slow down. Practice the A-U transition alone for 5 minutes before adding M.\n\nError 2 — Pinching the throat on M: Many people close the throat completely when they close their lips for M, producing no vibration. The throat should remain OPEN during M. Only the lips close. The sound continues resonating in the open throat and skull — the lips simply redirect it from outward to inward.\n\nError 3 — Equal duration of all three sounds: The tradition recommends approximately equal thirds, but the M is where most spiritual work occurs, so it is better to err toward a slightly longer M than a shorter one. A:U:M in a 2:2:3 ratio is an excellent starting point.\n\nError 4 — Neglecting the silence: As emphasized in Lesson 1.3 — the silence is half the practice. If you are not holding the silence with full awareness, you are completing only half of each AUM. Set the intention before each session: "The silence after M is where I will place my fullest attention."`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l1-4-audio',
            title: 'Complete AUM Technique — 21 Rounds',
            description: 'Kritagya demonstrates the complete technique. Listen once, then practice with the recording. Notice the quality of the M and the silence.',
            duration: '',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 1.5
    // ─────────────────────────────────────────────────────
    {
      id: 'l1-5',
      number: 5,
      title: 'Chanting vs Humming vs Mental AUM',
      subtitle: 'When to Use Each — The Three Modes',
      durationMin: 15,
      sections: [
        {
          type: 'intro',
          body: `The Mantra Shastra identifies three primary modes of mantra practice: Vaikhari (spoken/chanted), Upamshu (whispered/hummed), and Manasika (mental). Each serves a distinct function, operates at a different level of the body-mind system, and is appropriate for different contexts and stages of practice. Learning when and why to use each mode dramatically accelerates your results.`,
        },
        {
          type: 'teaching',
          heading: 'Vaikhari — Audible Chanting',
          body: `Vaikhari AUM is the full, audible chant — the mode taught in Lessons 1.3 and 1.4. It operates most powerfully on the physical and energetic body. The vibrations it produces are most directly felt in the body tissue, most likely to break up physical tension patterns and emotional blockages stored in the musculature, and most effective for activating the healing frequencies in the vocal tract (nasopharynx, palate, sinuses, skull).\n\nVaikhari is the ideal mode for: morning practice (waking the system), group chanting, clearing heavy emotional states, working with physical illness or pain, and when you are new to practice and need tangible feedback from the body to stay focused. Its limitation is that it requires a private environment (most people cannot chant audibly in public settings) and it engages the ego more than the other modes (the sound of your own voice is always somewhat self-conscious).`,
        },
        {
          type: 'teaching',
          heading: 'Upamshu — The Whispered Hum (Bhramari Mode)',
          body: `Upamshu is chanted at a whisper or a very gentle hum — barely audible to someone sitting next to you. The Siddhas considered this the most powerful mode for entering meditative states because it eliminates the ego's engagement with the sound of your own voice while still providing enough physical vibration to anchor the awareness.\n\nThe whispered AUM has a specific resonance quality that the full-voiced AUM does not: because the vocal cords are barely engaged, the overtones of the sound become dominant. You begin to hear the harmonics of AUM — the shimmer of frequencies above and below the fundamental pitch — which are not audible in full-voice chanting. These overtones are what the Tibetan monks work with in their famous overtone chanting practices. They carry a particular quality of aliveness that practitioners report as distinctly healing.\n\nUpamshu is ideal for: transitioning into meditation, evening practice, extended sessions (less physically tiring than Vaikhari), and when you want to begin accessing subtler states more quickly.`,
        },
        {
          type: 'teaching',
          heading: 'Manasika — Mental AUM',
          body: `Manasika Japa is the most powerful and most difficult form. The mantra is not spoken, whispered, or even moved on the lips. It occurs entirely within the field of mental awareness — a purely internal vibration. The Mantra Shastra says that Manasika repetition is 1000 times more powerful than Vaikhari — precisely because it requires the practitioner to maintain complete inner focus without any external support.\n\nFor AUM specifically, mental repetition involves hearing the sound in the inner space of the mind (not just thinking the letters, but actually hearing the sound inwardly) while simultaneously resting in the awareness that is doing the hearing. This dual action — simultaneously being the sound and being the one who hears the sound — is the threshold of Samadhi. The sound and the one who hears it are recognized as the same movement of consciousness.\n\nManasika AUM is difficult for beginners because the mind frequently drops the mantra and wanders without the anchor of physical sound. Begin with Vaikhari, transition to Upamshu after 40 days, and transition to Manasika after you can hold 108 rounds of Upamshu without the mind wandering more than 3 times per session.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Three-Mode AUM Session',
            steps: [
              'Set aside 30 minutes. Sit in meditation posture.',
              'PHASE 1 — VAIKHARI (10 minutes): Chant AUM at full, comfortable volume. 21 rounds. Focus on the physical resonance — belly, chest, skull.',
              'PHASE 2 — UPAMSHU (10 minutes): Without stopping to rest, reduce the volume to a whisper. 21 rounds. Focus on the harmonics — listen for the shimmer and overtones in the whispered sound.',
              'PHASE 3 — MANASIKA (10 minutes): Let the whisper fade completely to silence. Continue sounding AUM only in the inner space of your mind. Hear it inwardly, as clearly as if it were physically sounding. 21 rounds or as many as possible while maintaining clarity.',
              'Notice the quality of awareness in each phase. How does the mind feel at the end of Phase 3 compared to Phase 1?',
              'After all three phases, sit in complete silence for 3 minutes before opening your eyes.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Nada Yogi\'s Secret — Reverse the Direction',
          wisdomBody: `The standard teaching progression is Vaikhari → Upamshu → Manasika — moving from gross to subtle. But the Nath Siddhas used a specific reversal technique for accelerated realization. They would begin a session with 5 rounds of Manasika (mental) AUM — even if the mind was not yet settled. The difficulty of sustaining the mental AUM with a busy mind created intense pratyahara (withdrawal of senses) naturally. Then, when they dropped to Upamshu, the whispered AUM felt vast and resonant compared to the mental struggle. And when they finally opened into Vaikhari, the full-voiced AUM felt like the universe itself was singing. Starting from the most difficult and descending to the "easiest" — the gross — produces a sense that the physical sound is sacred rather than ordinary. Try it in your next session.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l1-5-audio',
            title: 'Three-Mode AUM Practice — 30 Minutes',
            description: 'Guided session: Vaikhari → Upamshu → Manasika. Laila guides the transitions.',
            duration: '30:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 1.6
    // ─────────────────────────────────────────────────────
    {
      id: 'l1-6',
      number: 6,
      title: '21-Day AUM Protocol',
      subtitle: 'Morning Activation Sequence — Your First Sadhana',
      durationMin: 20,
      sections: [
        {
          type: 'intro',
          body: `This final lesson of Module 1 is the most important — because knowledge without practice is incomplete philosophy. The 21-Day AUM Protocol is your first formal Sadhana (spiritual practice discipline). The number 21 is significant: neuroscience research confirms that 21 days of consistent repetition is the minimum required to establish a new neural pathway as a default circuit. The Siddhas arrived at the same number through direct observation thousands of years earlier.`,
        },
        {
          type: 'teaching',
          heading: 'Why 21 Days? The Science of Neuroplasticity and Siddha Agreement',
          body: `Dr. Maxwell Maltz first documented the 21-day neuroplasticity cycle in the 1960s, observing that amputees took a minimum of 21 days before a phantom limb stopped feeling present — before the brain "rewired" to the new reality. More recent research from neuroscientist Dr. Andrew Huberman and others confirms that 21-30 days of consistent practice is the minimum for establishing measurable structural changes in neural connectivity.\n\nThe Siddhas established 21-day practice cycles (called Trimshat in some texts) as the fundamental unit of Sadhana for precisely this reason: practices shorter than 21 days create temporary shifts but not permanent neural reorganization. A 21-day AUM protocol does not merely teach you a practice. It reorganizes your nervous system to recognize the Pranava frequency as HOME — a default state that the system returns to rather than one it has to consciously create.\n\nThe effects that practitioners typically report after 21 consecutive days of AUM Sadhana: improved sleep quality (particularly in entering and sustaining deep sleep), reduced anxiety (specifically the "background hum" of anxiety that most people accept as normal), spontaneous moments of inner stillness during ordinary daily activity, increased vocal resonance, and — in approximately 40% of practitioners — beginning to hear the Anahata Nada (inner sound) without effort during quiet moments.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'The 21-Day Morning AUM Protocol',
            steps: [
              'WAKE TIME: Set your alarm for 5 minutes before sunrise, or at any consistent time that allows 30 undisturbed minutes before the demands of the day begin.',
              'PREPARATION (5 minutes): Drink 300ml of water immediately upon waking — not coffee, not juice, water. Splash cold water on your face and wrists. Take 3 slow breaths with your hands on your belly. Sit in your meditation posture.',
              'STAGE 1 — GROUNDING (5 minutes): Sit in silence. Feel the weight of your body. Feel your breath without controlling it. This is not yet the practice — it is the preparation of the instrument.',
              'STAGE 2 — VAIKHARI AUM (10 minutes): Chant 21 full rounds of AUM at comfortable volume using the complete technique from Lesson 1.4. No rushing. Quality over quantity.',
              'STAGE 3 — UPAMSHU AUM (5 minutes): Reduce to whisper. 9 rounds. Listen for the harmonics in the whispered sound.',
              'STAGE 4 — INTEGRATION SILENCE (5 minutes): Complete silence. No Manasika — simply sit as the awareness that remains after the practice. If thoughts arise, simply notice them without engagement.',
              'STAGE 5 — CLOSING (2 minutes): Place both palms over your heart. Feel the warmth. Say internally or aloud: "I offer this practice to all beings everywhere. May all beings be happy." This is the Siddha completion gesture — returning the merit of practice to the whole.',
              'JOURNALING: Immediately after (not hours later), write 3-5 lines about what you noticed. Not what you "think" about it — what you NOTICED. Sensations. Qualities. Changes in awareness. These notes are your personal transmission diary.',
              'CONSISTENCY: If you miss a day, you do not start over from Day 1. Simply continue from where you are. Guilt about missing a day is more harmful to the practice than the missed day itself.',
            ],
          },
        },
        {
          type: 'teaching',
          heading: 'What to Expect — Day by Day Progression',
          body: `Days 1-7: The mind is active and the practice feels effortful. The AUM feels mechanical. This is normal and expected. The neural pathways are being carved. Do not judge the quality of practice during this phase — simply complete the protocol.\n\nDays 8-14: A subtle shift occurs — the AUM begins to feel more natural, like returning to something familiar rather than learning something new. Some practitioners begin to notice the inner silence becoming more "inhabited" — less empty, more alive. Sleep may improve.\n\nDays 15-21: The practice begins to practice itself. The body has developed a craving for the morning session. The transition into meditation happens more quickly. The silence after M becomes richer. In the first minutes after waking, before full consciousness arrives, some practitioners begin to notice AUM already "sounding" internally — the mantra has entered the subconscious and is beginning its autonomous work. This is the beginning of Ajapa Japa — the self-sustaining mantra.\n\nDay 22 and beyond: You have established the foundation. The decision at this point is whether to continue Module 1's AUM Sadhana while beginning Module 2's teachings, or to deepen exclusively in AUM for another 21-day cycle. Both are valid. There is no race.`,
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'ॐ शान्तिः शान्तिः शान्तिः',
            transliteration: 'OM SHANTI SHANTI SHANTI',
            translation: 'OM — Peace, Peace, Peace',
            body: `This is the traditional closing mantra for any AUM practice session. The three repetitions of SHANTI are not redundant — they address the three levels of disturbance: Adhyatmika (disturbances from within oneself — thoughts, emotions, physical sensations), Adhibhautika (disturbances from the external environment — other people, events, circumstances), and Adhidaivika (disturbances from cosmic forces — weather, karma, planetary influences). By invoking peace at all three levels, the practitioner closes the field of practice completely and returns to daily life in a sealed, protected state.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Babaji\'s Teaching on Consistency — More Important Than Duration',
          wisdomBody: `In his conversations with Lahiri Mahasaya (recorded by Yogananda and others), Babaji is quoted as saying: "Do not seek the highest state in meditation. Seek regularity. The highest state will find you, because you are always sitting in the same place. If you sit for 10 minutes at the same time every day without fail, you will advance further in one year than the person who sits for 3 hours occasionally. The universe knows where you will be. Your Guru knows where you will be. Your mantra knows where you will be. Be there. The transmission will arrive." This is one of the most practically useful teachings in the entire tradition. The SQI 21-Day Protocol is designed around this principle: regularity of duration, consistency of time, simplicity of content. These three factors produce more transformation than any amount of heroic occasional practice.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l1-6-audio',
            title: 'Day 1 — Full 21-Day Protocol Guided Session',
            description: 'Complete your first Day 1 with Kritagya & Laila. 30 minutes. All stages guided. Use this recording every day for your 21-day commitment.',
            duration: '30:00',
            url: '',
          },
        },
      ],
    },
  ],
};

// ============================================================
// EXPORT — FULL CURRICULUM (MODULES 2–24 TO BE ADDED)
// ============================================================


// ─── MODULES 2–5 ─────────────────────────────────────────────────────────────

const module2: Module = {
  id: 'module-02',
  number: 2,
  tier: 'free',
  title: 'What Is Japa? The Science of Repetition',
  subtitle: 'Repetition Technology · Neural Entrainment · The Living Mala',
  description:
    'Why 108? Why a mala? Why do certain numbers of repetitions produce measurable shifts while others do not? This module reveals the precise mathematics, neuroscience, and Siddha physics behind Japa — the practice of mantra repetition — and gives you the complete practical system for using it as the most efficient consciousness-transformation technology ever designed.',
  lessons: [

    // ─────────────────────────────────────────────────────
    // LESSON 2.1
    // ─────────────────────────────────────────────────────
    {
      id: 'l2-1',
      number: 1,
      title: 'The Mathematics of 108',
      subtitle: 'Moon-Earth-Sun Ratios, Fibonacci & the Cosmic Number',
      durationMin: 18,
      sections: [
        {
          type: 'intro',
          body: `Every tradition that has developed deep mantra science has arrived at the same number: 108. Not 100. Not 110. Precisely 108. The Vedic tradition uses 108-bead malas. Tibetan Buddhism uses 108 beads. The Sikh tradition has 108. There are 108 Upanishads. The Buddha gave 108 teachings. There are 108 names for Shiva, 108 for Vishnu, 108 for Ganesha. Krishna danced with 108 Gopis. The number appears so consistently across unconnected traditions that it cannot be cultural borrowing — it must be pointing to something real. This lesson reveals exactly what that something is.`,
        },
        {
          type: 'teaching',
          heading: 'The Astronomical Foundation of 108',
          body: `The most striking verification of 108's cosmic significance comes from simple astronomy. The distance between the Earth and the Sun is approximately 108 times the diameter of the Sun. The distance between the Earth and the Moon is approximately 108 times the diameter of the Moon. The diameter of the Sun is approximately 108 times the diameter of the Earth.\n\nThese are not approximate coincidences rounded to 108 for convenience. The actual ratios: Sun-Earth distance ÷ Sun diameter = 107.5. Moon-Earth distance ÷ Moon diameter = 110.6 (at mean distance). Sun diameter ÷ Earth diameter = 109.2. These three ratios cluster around 108 — the Sun, Moon, and Earth are bound to this number as if the solar system were designed around it.\n\nThe Vedic seers who established 108 as the sacred number of Japa had no telescopes and no calculus. Yet they established this number as fundamental to cosmic structure thousands of years before any modern measurement confirmed it. The most logical explanation, from the Siddha perspective, is that they arrived at 108 through direct inner perception — through Samadhi states in which the structure of the cosmos became directly visible to the awakened mind.`,
        },
        {
          type: 'teaching',
          heading: 'The Fibonacci Connection and the Golden Mean',
          body: `The number 108 has a deep relationship with the mathematical constants that govern biological growth and universal proportion. 108 = 4 × 27. 27 = 3³. 4 × 3³ = 108. In the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144...) — the sequence that governs the spiral growth of shells, galaxies, plant seeds, and the human body — 108 appears as approximately the ratio between consecutive pairs when the sequence is viewed in groups of three.\n\nMore significantly: 108 = 1¹ × 2² × 3³. One to the power of one, times two to the power of two, times three to the power of three. This is the only number with this property using the first three natural numbers. The Vedic mathematicians called this Harshad (जानकार) — a "joy-giving" number — because it is divisible by the sum of its digits (1+0+8=9, and 108÷9=12). 9 is the number of completion in Vedic numerology — the number from which all other numbers return (9×1=9, 9×2=18 → 1+8=9, 9×3=27 → 2+7=9, and so on infinitely).\n\nThe Siddhas understood 108 as a number that inherently contains the structure of completion. To chant a mantra 108 times is not merely to repeat it 108 times — it is to take the mantra through a full cycle of cosmic completion, from seed to fruit, from potential to realization.`,
        },
        {
          type: 'teaching',
          heading: 'The Human Body and 108',
          body: `The number 108 is embedded in the physiology of the human body with the same precision as in the cosmos. There are 108 marma points in Ayurvedic medicine — the vital energy points mapped on the body surface where Prana is most concentrated and most accessible. A marma point is the intersection of flesh, bone, tendon, and vital organ — a confluence point where injury is most dangerous and healing most powerful. The 108 marma points are the body's energetic map.\n\nIn Sanskrit phonology, there are 54 letters in the Sanskrit alphabet. Each letter has a masculine (Shiva) and feminine (Shakti) form: 54 × 2 = 108. The Tantric tradition says that the universe is composed of these 108 sound-forms — that all of reality is encoded in the 108 phonemes that Sanskrit preserves. To chant 108 repetitions of a mantra is to vibrate through every phonemic possibility of the universe once.\n\nThere are also 108 Nadis (energy channels) considered primary in certain Siddha texts — though other texts give 72,000. The 108 represent the major tributaries; the 72,000 are the capillaries that arise from them. One complete Japa mala of 108 beads sends vibrational impulses through all 108 primary Nadi channels — a full-body energetic irrigation.`,
        },
        {
          type: 'teaching',
          heading: 'Other Sacred Numbers in Japa — and When to Use Them',
          body: `While 108 is the gold standard of Japa, the tradition recognizes several other significant numbers for specific purposes. Understanding why these numbers work gives you the intelligence to design your own practice:\n\n11 is the minimum count for any mantra to have a measurable effect. The Siddhas established 11 as the baseline because it takes approximately 11 repetitions for the nervous system to lock into a new frequency — analogous to the lock-in time of a phase-locked loop in electronics.\n\n21 is the number of completion for a single practice session — completing one wave cycle of the mantra's action in the subtle body. This is why we use 21-round sequences.\n\n27 is one quarter of 108 — used for quick Japa when time is limited, or for mantras that are particularly long or energetically intense.\n\n54 is half a mala — one full cycle of the Sanskrit alphabet. Used for evening or midday practice.\n\n1008 is the Purnahuti count — the "complete offering" used for major ceremonies and high-intensity Sadhana. 1008 = 108 × 9 + 36 (the number of Tattvas × number of primary deities in the Shaiva system).\n\n125,000 is the Purascharana count — the total number of repetitions required to achieve Mantra Siddhi (perfection in a particular mantra). This is typically achieved over 40 days at the rate of approximately 3,125 repetitions daily.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Experiencing the Power of 108 — First Full Mala',
            steps: [
              'Choose one mantra you have connected with from Module 1 — AUM, SOHAM, or OM NAMAH SHIVAYA are ideal for this exercise.',
              'Before beginning, sit in silence for 2 minutes and set a clear intention. What quality do you want to cultivate through this practice? Name it internally.',
              'Begin your first bead (after the Meru/Guru bead — more on this in Lesson 2.3) and chant your mantra once per bead, moving the mala with your thumb and middle finger.',
              'Do not count with your mind. The mala counts for you. This is its primary function — to free the mind from counting so it can be fully present with the sound.',
              'Chant at a consistent pace — not rushing, not dawdling. Find the natural rhythm of the mantra and maintain it. If you lose the rhythm, slow down slightly rather than speeding up.',
              'When you reach the 54th bead (approximately halfway), notice the quality of your awareness. How does your mind feel compared to when you started?',
              'When you complete the 108th bead and return to the Meru bead, stop immediately. Do not cross the Meru. Sit in silence for 3 minutes.',
              'Write: What happened between bead 1 and bead 108? Was there a shift? If so, at approximately which bead did you notice it?',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Agastya\'s Teaching — Why the Number Matters',
          wisdomBody: `Agastya Muni wrote in one of his medical texts: "A mantra spoken once plants a seed. A mantra spoken 11 times waters it. A mantra spoken 108 times causes it to germinate. A mantra spoken 1008 times causes it to flower. A mantra spoken 125,000 times causes it to bear fruit that can feed others." This agricultural metaphor is precise: the effect of Japa is not linear but exponential. Each repetition does not add 1 unit of effect to the previous — it multiplies. This is why the difference between 100 and 108 repetitions is not 8 more mantras — it is an order of magnitude more completion. The number is not superstition. It is the observation of how frequency accumulation works in a living system. A guitar string does not resonate gradually when you pluck it — at a certain tension threshold it resonates completely. 108 is the tension threshold of Japa.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l2-1-audio',
            title: 'First Full Mala — AUM × 108',
            description: 'Kritagya chants one complete mala of AUM. 108 repetitions at a traditional pace. Use this to guide your first complete Japa session.',
            duration: '',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 2.2
    // ─────────────────────────────────────────────────────
    {
      id: 'l2-2',
      number: 2,
      title: 'The Four Types of Japa',
      subtitle: 'Vachika · Upamshu · Manasika · Likhita — The Complete System',
      durationMin: 20,
      sections: [
        {
          type: 'intro',
          body: `The Mantra Shastra (the classical science of mantra) identifies four distinct modes of Japa practice, each operating at a different level of the body-mind system and producing different types of transformation. Most contemporary practitioners know only one mode — spoken repetition. The complete system uses all four, deployed strategically according to the practitioner's state, intention, and stage of development. This lesson gives you the full map.`,
        },
        {
          type: 'teaching',
          heading: 'Vachika Japa — The Spoken Mode',
          body: `Vachika Japa is the audible, clearly spoken repetition of a mantra. The sound is fully voiced — anyone in the room with you can hear it. Of the four modes, Vachika is the grossest and the most accessible, but this does not mean it is the weakest. For specific purposes, Vachika Japa is the most powerful tool available.\n\nVachika works primarily on the physical body. The vibrations created by full vocal production — the resonance in the chest, the palate stimulation, the bone conduction through the skull — directly affect the body's tissues, fluids, and nerve plexuses. Scientific research using fMRI imaging has shown that chanting activates the vagus nerve, the hypothalamic-pituitary axis, and specific regions of the limbic system (the brain's emotional processing center) differently depending on the specific phonemes used. The right mantra, chanted in Vachika mode consistently, produces measurable changes in cortisol levels, heart rate variability, and immune function.\n\nVachika is the ideal mode for: clearing heavy emotional states or mental agitation (the physical vibration literally breaks up the standing waves of stuck emotion in the body), working with chronic physical conditions (specific mantras produce specific physiological effects), establishing a new mantra in your practice (the physical sound creates the clearest initial imprint), and group practice (when multiple voices chant together, the combined sound field produces effects that no individual could create alone).`,
        },
        {
          type: 'teaching',
          heading: 'Upamshu Japa — The Whispered Mode',
          body: `Upamshu Japa is whispered — the lips and tongue move, the sound is barely audible, the vocal cords are minimally engaged. The Mantra Shastra says Upamshu is 10 times more powerful than Vachika for the purpose of meditation, because the reduction of physical sound forces the practitioner's awareness inward. You cannot coast on the sound of your own voice in Upamshu — you have to listen more carefully, which naturally deepens concentration.\n\nThe whispered mantra has a specific acoustic property that full-voice chanting does not. Because the vocal cords are barely engaged, the sound becomes almost entirely fricative — made by the movement of air through the shaped vocal tract rather than by cord vibration. This produces a sound rich in harmonics and overtones. If you whisper your mantra in a quiet room, you will begin to notice shimmering, layered frequencies in the whispered sound that are not present when you chant at full volume. These overtones are the same frequencies that Tibetan singing bowl practitioners and Gregorian chant masters work with deliberately.\n\nUpamshu is ideal for: long meditation sessions where Vachika would tire the voice, transitional practice between Vachika and silent Manasika, early morning practice when others are sleeping, and when you want to access meditative states more quickly. The whisper creates a natural pratyahara (withdrawal of the senses) — the external world becomes less real, the inner world more vivid, simply because you are listening so carefully to such a faint sound.`,
        },
        {
          type: 'teaching',
          heading: 'Manasika Japa — The Mental Mode',
          body: `Manasika Japa occurs entirely in the inner space of awareness — no movement of lips or tongue, no physical sound of any kind. The mantra is heard inwardly, as clearly and distinctly as if it were sounding externally. The classical texts describe Manasika as the most powerful of all four modes — 10 times more potent than Upamshu, and therefore 100 times more potent than Vachika.\n\nThe reason for this extraordinary potency is not mysterious: Manasika Japa requires the practitioner to maintain complete inner focus without any physical anchor. There is no sound to hold the attention. There is no physical sensation to return to. There is only the pure intention to hear the mantra internally, and the awareness that is doing the hearing. This dual requirement — generating the internal sound while simultaneously being the awareness that receives it — is the threshold state between ordinary consciousness and Samadhi.\n\nManasika is genuinely difficult for most practitioners, and this difficulty is itself instructional. The mind that cannot hold a simple internal sound for more than a few repetitions without wandering is showing you exactly how undeveloped its concentration capacity is. This is not a judgment — it is a diagnostic. Manasika Japa is, among other things, the clearest possible mirror of the mind's current state. As the practice deepens over months and years, the ability to hold the internal sound becomes more effortless — and the practitioner begins to discover that the mental mantra gradually fades from being something they are doing into something that is happening by itself. This is the transition into Ajapa Japa — the self-sustaining mantra.`,
        },
        {
          type: 'teaching',
          heading: 'Likhita Japa — The Written Mode',
          body: `Likhita Japa is the practice of writing the mantra — repeatedly, by hand, in a dedicated notebook or on sacred paper. It is the fourth mode, and the one most neglected in modern practice. Likhita engages the body differently than the other three modes: the hand, the eye, the coordinated movement of writing — all are recruited as instruments of the mantra's repetition.\n\nThe power of Likhita lies in multisensory engagement. When you write a mantra by hand while simultaneously repeating it internally, you are using visual processing (seeing the written letters), motor processing (the movement of writing), auditory processing (the inner hearing of the mantra), and proprioceptive processing (the felt sense of the pen on paper) simultaneously. This convergence of multiple sensory streams around a single mantra creates an exceptionally deep imprint. Neuroscientists call this "multi-modal encoding" — and research consistently shows that information encoded through multiple modalities simultaneously is retained far more durably than information encoded through any single modality.\n\nThe Siddha Ramana Maharshi reportedly had his ashram residents do Likhita Japa of "OM NAMO BHAGAVATE SRI RAMANAYA" — and remarked that the writing itself, done with complete attention, was a form of meditation as rigorous as seated contemplation. The hand is a servant of consciousness: when you write a mantra with full awareness, the hand becomes a moving altar, and the notebook becomes a field of consecrated intention.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Four-Mode Japa Exploration — One Session, Four Modes',
            steps: [
              'Choose your mantra for this session: OM NAMAH SHIVAYA (or any mantra from Module 1).',
              'VACHIKA (5 minutes): Chant aloud at comfortable volume. 27 repetitions minimum. Feel the physical vibration. Notice where in the body the sound is most alive.',
              'UPAMSHU (5 minutes): Reduce to a whisper. Continue the same mantra. Notice: does the quality of your attention change? Are you listening differently?',
              'MANASIKA (5 minutes): Let the whisper fall completely silent. Continue hearing the mantra only internally. When the mind wanders (it will), simply return to the inner sound without frustration. No self-judgment. Simply return.',
              'LIKHITA (10 minutes): Open a notebook. Write your mantra by hand, in Sanskrit or transliteration, one repetition per line. Write slowly and carefully. Simultaneously hear the mantra internally as you write each letter. If you can write in Devanagari, do so — the visual form of Sanskrit letters carries its own transmission.',
              'INTEGRATION (5 minutes): Set down the pen. Close your eyes. Do not chant. Simply sit in the residue of the practice and notice what is present.',
              'After the session: Which mode felt most powerful for you today? Write a brief note. This may change from day to day — it is useful data about your current state.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Siddha Teaching on Mode Selection — Reading Your Own State',
          wisdomBody: `The great Siddha Raghavendra Swami taught that the correct mode of Japa for any given session is determined not by preference but by honest self-assessment. He gave a diagnostic: "Sit in your meditation seat. Before you begin, ask yourself honestly: What is the quality of my mind right now?" If the mind is agitated, scattered, or heavy with emotion — begin with Vachika. The physical vibration is the medicine for an agitated mind. If the mind is moderately settled but tends to drift — begin with Upamshu. The careful listening that whispered sound requires will draw the mind inward. If the mind is already still, quiet, and present — begin directly with Manasika. And if the mind is still but restless with unexpressed energy — do Likhita. The hand's movement gives the restlessness an outlet, and the written mantra transforms that energy into sacred form. This diagnostic — knowing which mode your mind needs right now — is itself an advanced spiritual skill. It requires honesty and self-knowledge, both of which the practice gradually develops.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l2-2-audio',
            title: 'Four-Mode Japa — Guided 30-Minute Session',
            description: 'Laila guides you through all four Japa modes with OM NAMAH SHIVAYA. Includes transition cues between modes.',
            duration: '30:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 2.3
    // ─────────────────────────────────────────────────────
    {
      id: 'l2-3',
      number: 3,
      title: 'The Mala — Sacred Technology',
      subtitle: '108 Beads · The Meru · Why You Never Cross It',
      durationMin: 16,
      sections: [
        {
          type: 'intro',
          body: `The mala — a string of 108 beads used for Japa counting — is one of the most ancient and widely used spiritual tools in human history. Prayer beads appear in virtually every major tradition: the Catholic rosary, the Islamic Misbaha, the Buddhist juzu, the Sikh jaap mala, and the Hindu and Tantric mala all use beads for sacred counting. This universal appearance, like the number 108 itself, points beyond cultural tradition toward something fundamental about how the human nervous system interfaces with repetitive practice. This lesson reveals what the beads are actually doing — and why the specific rules around mala use are not superstition.`,
        },
        {
          type: 'teaching',
          heading: 'The Meru Bead — The Sacred Threshold',
          body: `The mala has 108 beads arranged in a circle, plus one additional bead called the Meru (also called the Sumeru or Guru bead). The Meru is larger than the others, differently shaped, or has a tassel or pendant attached. It marks the beginning and end of the Japa count — it is both the starting gate and the finish line.\n\nThe fundamental rule of mala use: you never cross the Meru. When you complete the 108th bead and arrive back at the Meru, you do NOT continue past it. If you wish to do another round, you reverse the direction of the mala and begin again, keeping the Meru on the same side.\n\nWhy? The Meru represents the Guru — the living principle of transmission, the threshold between the ordinary and the sacred. To cross the Meru is symbolically to step over the Guru's feet, which in the Indian tradition is the gravest possible disrespect. More practically: the Meru acts as an energetic "seal" on the Japa count. Each complete round of 108 creates a closed energetic circuit. The Meru closes and seals that circuit, preserving its accumulated charge. If you cross the Meru and continue, you break the seal — the accumulated charge of that round dissipates before it can integrate into the practitioner's field.\n\nThe Siddhas understood the mala as a capacitor — a device for accumulating and holding charge. Each repetition adds a small charge. The completion of 108 creates a full charge. The Meru seals it. Reversing direction begins a new charge cycle without discharging the previous one. Cross the Meru, and you short-circuit the capacitor.`,
        },
        {
          type: 'teaching',
          heading: 'How to Hold the Mala — Mudra and Method',
          body: `The traditional holding method is specific and non-arbitrary. The mala rests over the middle finger of the right hand. The thumb moves the beads — one bead per repetition, rolling each bead toward you (not away). The index finger never touches the mala. This rule is observed strictly in all major traditions that use prayer beads, and the reason is consistent: the index finger is the finger of ego (Ahamkara in Sanskrit). It is the finger we use to point, to accuse, to claim ownership. Keeping it away from the mala prevents the ego from "contaminating" the sacred count — from turning a spiritual practice into a mechanical achievement.\n\nThe right hand is used because in Vedic physiology, the right side of the body is the solar (masculine, outward-moving) channel, associated with Prana and action. Japa is an active spiritual practice — a deliberate, willful movement of consciousness — and therefore appropriately channeled through the right side.\n\nThe mala is held below the level of the heart — typically near the navel — and not displayed publicly during Japa. Traditional practitioners cover the mala with a small cloth bag (gomukhi — "cow's mouth") while counting, so the practice remains private. The Siddhas taught that displaying your Japa count creates a subtle seeking of recognition that dilutes the merit of the practice. What is done purely, in secret, for its own sake, carries the full charge. What is done for witness or recognition loses half its power in the transaction.`,
        },
        {
          type: 'teaching',
          heading: 'Mala Materials and Their Effects',
          body: `Different mala materials carry different energetic properties, and the Siddha tradition was precise about which materials to use for which practices. This is not superstition — it is material science from a tradition that understood the electromagnetic and crystallographic properties of substances:\n\nRudraksha (dried seeds of the Elaeocarpus ganitrus tree): The all-purpose Siddha mala. Rudraksha seeds have documented piezoelectric properties — they generate a small electric charge when compressed, as occurs with each bead press during Japa. They also carry a paramagnetic field that interacts with the skin's electromagnetic field. Traditional use: any mantra, any deity, any practitioner. Particularly effective for Shiva mantras.\n\nCrystal Quartz (Sphatika): Amplifies the mantra's field. Quartz is the most electrically conductive of all natural crystals. Used for Devi (goddess) mantras and healing practices. The Siddhas said clear quartz holds the mantra's imprint and continues to transmit it even when the practitioner is not actively chanting.\n\nTulsi (Holy Basil wood): The Vaishnava mala par excellence. Tulsi is sacred to Vishnu/Krishna. Contains proven antimicrobial compounds that purify the air when touched — and the skin when worn. Used for Vishnu, Krishna, Rama, and Narayana mantras.\n\nSandalwood: Cooling, calming. The most appropriate material for practitioners dealing with excess Pitta (fire element) in the system — anger, inflammation, hyperactivity. Used for Saraswati and Lakshmi mantras.\n\nCopper: The Tantric and Siddha alchemy mala. Copper is the best conductor of Prana among common metals — confirmed by Ayurvedic medicine and modern research on copper's effects on biological systems. Used for Shakti mantras and healing work.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Establishing Your Daily Mala Practice — The Setup Protocol',
            steps: [
              'CONSECRATE YOUR MALA: Before its first use, place your mala in a bowl of clean water overnight. Then place it in direct sunlight for one full day. Then hold it in both hands, close your eyes, and chant OM three times with the intention that this mala is now dedicated solely to your Sadhana. It is no longer an object — it is a living instrument.',
              'CHOOSE YOUR HOLDING METHOD: Right hand, mala draped over the middle finger, thumb moving the beads toward you. Left hand rests open on your left knee, palm facing up. This mudra — left hand open to receive, right hand actively counting — represents the balance of reception and action.',
              'THE FIRST BEAD: Begin at the bead immediately adjacent to the Meru. This is your first bead. Chant your mantra once. Move to the next bead. Chant again. Continue.',
              'MAINTAIN PACE: The pace of your Japa should feel like a comfortable walk — not a sprint, not a slow crawl. Each mantra takes approximately 4-8 seconds, depending on length. OM NAMAH SHIVAYA at a good pace takes 5-6 seconds. One full mala of 108 repetitions takes approximately 10-12 minutes.',
              'WHEN THE MIND WANDERS: This is not a failure. It is the practice. The moment you notice you have wandered, you have just had a moment of awareness. That moment of awareness is the core skill being trained. Simply return to the mantra on whatever bead you are at and continue.',
              'COMPLETION: When you return to the Meru bead, stop. Do not cross it. Place the mala over your heart. Sit in silence for at least 2 minutes. This integration period is when the accumulated charge of the Japa settles into the nervous system.',
            ],
          },
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'ॐ नमः शिवाय',
            transliteration: 'OM NAMAH SHIVAYA',
            translation: 'I bow to Shiva — to the auspicious one who is my own deepest nature',
            body: `This is the recommended mantra for your first mala practice. The Panchakshara (five sacred syllables: NA-MA-SHI-VA-YA) has been chanted on malas for at least 5,000 years — making it the most practiced mala mantra in human history. Its rhythm is perfect for mala use: five syllables, one breath, one bead. The meaning deepens with understanding: NAMAH means "I bow" but also "not mine" — the relinquishing of the ego's claim on experience. SHIVAYA = to Shiva, to the auspicious reality that underlies all appearances. Together: "I release the claim of the separate self and recognize the auspicious reality of what I am."`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Living Mala — Why the Beads Change Over Time',
          wisdomBody: `Practitioners who use their mala consistently for years report something striking: the mala changes. Rudraksha beads darken and develop a patina from the skin's oils. Crystal beads develop an inner luminosity that was not there when new. Practitioners with developed sensitivity report that they can feel the difference between a mala that has been used for thousands of Japas and a new mala — the used mala has a warmth, a charge, a "presence" that the new one lacks. The Siddhas understood this not as imagination but as physics: the piezoelectric material of the beads has been repeatedly compressed and charged by thousands of mantra repetitions, and these charges accumulate in the crystal lattice of the material. A mala that has been used for 125,000 Japas IS a charged object — it carries the imprint of every prayer. This is why the tradition says: never lend your mala to another person. The charge is personal — calibrated to your unique electromagnetic field. Another person's field interacts with the accumulated charge in ways that are unpredictable and potentially disruptive to both the mala and the borrower.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l2-3-audio',
            title: 'Mala Practice — OM NAMAH SHIVAYA × 108',
            description: 'Kritagya & Laila chant one complete mala together. Traditional pace. Use this as your daily companion practice.',
            duration: '',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 2.4
    // ─────────────────────────────────────────────────────
    {
      id: 'l2-4',
      number: 4,
      title: 'Likhita Japa — Writing as Sacred Technology',
      subtitle: 'The Moving Meditation · Consecrating Paper · Multi-Modal Encoding',
      durationMin: 18,
      sections: [
        {
          type: 'intro',
          body: `Likhita Japa — the practice of writing your mantra by hand — is the most underestimated and underutilized form of Japa in the modern world. In an age of keyboards and voice-to-text, the deliberate act of forming each letter of a sacred syllable by hand, slowly, repeatedly, has become something almost radical. This lesson explores the profound technology behind the written mantra — why handwriting specifically creates a different imprint than typing, how the notebook becomes a consecrated object, and how Likhita Japa can be used as the primary practice for those who find seated chanting difficult.`,
        },
        {
          type: 'teaching',
          heading: 'The Neuroscience of Handwriting and Sacred Memory',
          body: `Research from Princeton University (Mueller & Oppenheimer, 2014) demonstrated definitively that students who handwrite notes retain and understand information far more deeply than those who type. The reason is not merely the slower pace — it is the nature of the neural encoding. Handwriting requires coordinated engagement of the motor cortex, the visual cortex, the proprioceptive system, and the executive function centers simultaneously. This multi-regional neural activation creates what researchers call "elaborative encoding" — the information is encoded in multiple systems at once and therefore available through multiple retrieval pathways.\n\nFor mantra practice, this principle is amplified by intentionality. When you write a sacred syllable by hand, every curve of every letter requires the same kind of attention that Manasika Japa requires of the mind. The pen cannot wander. The hand cannot think of something else while forming the letter — the physical act of writing demands presence. This is why the Siddhas and saints who practiced Likhita Japa described it as "moving meditation" — the movement itself is the meditation. There is no gap between the practice and the state it produces.`,
        },
        {
          type: 'teaching',
          heading: 'The Consecrated Notebook — Creating a Living Sacred Object',
          body: `In the Likhita Japa tradition, the notebook used for mantra writing is not ordinary stationery — it is a sacred object in the making. Every page filled with mantric writing adds another layer of vibrational charge to the book. Practitioners who have maintained Likhita Japa notebooks for years report that simply holding the completed notebooks produces a distinct sense of peace and elevation — as if the accumulated intention of thousands of written mantras has permeated the paper itself.\n\nThis is not merely poetic. Paper (in its traditional form, derived from plant fibers) is a biological material with electromagnetic properties. The ink used in writing creates a pattern — literally a visual form of the mantra — that persists on the paper indefinitely. Every time the notebook is opened, the visual forms of the mantras are received by the reader's visual cortex, triggering the associated neural imprints. The notebook becomes a living, self-reinforcing sacred field.\n\nSet up your Likhita Japa notebook with intention: Choose a dedicated notebook used ONLY for this purpose. On the first page, write your Sankalpa (intention/vow) for the practice — why you are doing this, what you are offering it to. On the second page, write the mantra of your Ishta Devata (chosen deity or principle) once, large, as an invocation. From the third page onward: pure Likhita Japa.`,
        },
        {
          type: 'teaching',
          heading: 'The Physical Method — Script, Speed, and Alignment',
          body: `The physical execution of Likhita Japa matters. The Siddha tradition provides specific guidance:\n\nScript: Write in whatever script you are most comfortable with — Devanagari (Sanskrit letters), Tamil script for Tamil mantras, or transliteration in the Roman alphabet. However, if you can learn even basic Devanagari letters for your primary mantra, it is recommended — the visual forms of Devanagari letters are themselves geometric mandalas, each one the visual condensation of its corresponding sound frequency. Writing OM in Devanagari (ॐ) is not equivalent to writing "OM" in Roman letters — the former is the visual form, the latter is a phonetic approximation.\n\nSpeed: Slow enough that each letter is formed completely and clearly. Fast enough that the mind does not wander between letters. The ideal speed is the pace at which you can simultaneously hear the mantra internally as you write it — one syllable per letter-group, one mantra per line.\n\nAlignment: Write each mantra on its own line, with a small breath between lines. Do not crowd the page. Leave enough space that each mantra can "breathe" — that there is silence in the space between the written lines, just as there is silence between spoken repetitions.\n\nPosture: The Likhita Japa posture is seated at a desk or table, spine upright, as in meditation. The notebook is at a comfortable angle — not flat on the table (which requires the head to drop and the spine to curve) but at a gentle angle, like a writing desk. The body that writes the mantra is as much a part of the practice as the words being written.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'First Likhita Japa Session — 108 Written Mantras',
            steps: [
              'Prepare your dedicated Likhita Japa notebook and your preferred pen. A fountain pen or soft-tip pen is recommended — the slightly increased resistance teaches you to write more deliberately.',
              'Open to your first Japa page. Take 3 deep breaths. Set your intention silently.',
              'Begin writing your mantra — one per line. As you write each letter, hear the corresponding sound internally. The writing hand and the inner ear should be synchronized.',
              'After every 27 lines (one quarter mala), pause. Put down the pen. Close your eyes for 30 seconds. Simply sit in the residue of the writing. Then continue.',
              'After completing 108 lines (one full mala), close the notebook. Place both palms on the cover. Feel the warmth. Sit in silence for 2 minutes.',
              'ADVANCED OPTION: Count your lines with a mala simultaneously — hold the mala in your left hand, move one bead per written mantra. This combines Likhita with mala Japa for double encoding.',
              'Make Likhita Japa your morning practice for at least 7 days before moving to Lesson 2.5.',
            ],
          },
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'राम राम राम राम राम',
            transliteration: 'RAMA RAMA RAMA',
            translation: 'The name of Rama — the reservoir of divine joy',
            body: `The name RAMA is the ideal mantra for Likhita Japa practice. It consists of only 4 letters in Devanagari (र-ा-म-ा) and 4 phonemes in pronunciation, making it quick enough to maintain flow in writing while substantial enough to carry full mantric charge. Swami Sivananda wrote: "RA is fire, the first syllable of the Agni mantra. MA is the moon, the first syllable of the moon mantra. RAMA combines solar and lunar energies in perfect balance." Gandhi famously used RAMA as his final mantra at the moment of his assassination — demonstrating the tradition's teaching that this name specifically carries the consciousness through the threshold of death with perfect clarity. For Likhita Japa, RAMA fills a line, completes a breath, and can be written at a pace of approximately 10 per minute — making 108 repetitions achievable in a 12-minute morning session.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Ramakrishna Teaching on Likhita Japa and Sincere Tears',
          wisdomBody: `Sri Ramakrishna Paramahamsa observed his disciples doing Likhita Japa and noticed that many were writing quickly and mechanically — covering pages with mantras but with the mind elsewhere. He called them to him and said: "See this mango. Its name is MANGO. I can write the word MANGO one thousand times on this paper and not a single time will the sweetness of the fruit appear on the page. But if I take one real mango and eat it with full attention, the sweetness fills my whole being. One mantra written with tears of longing in the eyes is worth more than one thousand written with a wandering mind. The quantity of Likhita Japa is its vehicle. The sincerity of your love is its fuel. Both are needed. But never confuse the vehicle for the destination." This teaching applies to all forms of Japa — but it is especially pointed in Likhita practice, where the physical quantity of pages filled can create a false sense of accomplishment.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l2-4-audio',
            title: 'Likhita Japa Session Music — Sacred Background Field',
            description: 'Instrumental Nada field for your writing practice. No voice — pure tonal bed at 432hz with Schumann harmonic. Play softly while writing.',
            duration: '30:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 2.5
    // ─────────────────────────────────────────────────────
    {
      id: 'l2-5',
      number: 5,
      title: 'Ajapa Japa — The Mantra That Breathes Itself',
      subtitle: 'SOHAM · The 21,600 Daily Repetitions You Are Already Doing',
      durationMin: 22,
      sections: [
        {
          type: 'intro',
          body: `Everything in this module so far has been about deliberate, effortful Japa — the conscious, chosen repetition of a mantra. This lesson introduces something entirely different: a form of Japa that requires no effort, no mala, no dedicated session — because it is already happening. It has been happening since you drew your first breath. And it will continue until your last. Ajapa Japa — "the Japa that is not Japa" — is the discovery that the universe has been repeating a sacred mantra through your body since the moment you were born. Your task is only to become conscious of it.`,
        },
        {
          type: 'teaching',
          heading: 'The Sound of Your Breath',
          body: `Close your eyes for a moment and simply listen to your breath. Not controlling it — just listening. The sound of the inhalation, if you listen closely, has a quality. A subtleness. Almost like a whispered "SSSOO" — the friction of air entering through the nostrils and throat. The sound of the exhalation has a different quality — "HAAAMMM" — a more released, descending sound as air moves outward.\n\nThe ancient practitioners who developed Ajapa Japa listened to this breath-sound for hours in meditative stillness until its inherent mantra became clearly audible. What they heard was SOHAM on the inhale (SO = the cosmic vibration of the incoming Prana) and HAMSA on the exhale (HAMSA = the swan, the practitioner's individual consciousness). Or heard from the opposite direction: HAMSA on the inhale, SOHAM on the exhale.\n\nHAMSAH SOHAM. SOHAM HAMSA. The two are one mantra running forward and backward: S-O-H-A-M reversed is H-A-M-S-A. The breath-mantra is a palindrome — the same in both directions, because the universe that breathes outward (SO) is the same universe that breathes inward (HAM). The individual (HAMSA) and the Absolute (SO) are the same movement seen from two sides.`,
        },
        {
          type: 'teaching',
          heading: 'The Mathematics of Ajapa Japa — 21,600 Daily Repetitions',
          body: `A healthy adult breathes approximately 15 times per minute at rest. 15 × 60 minutes × 24 hours = 21,600 breaths per day. This means that whether you practice Japa or not, you are already repeating SOHAM (or HAMSA) 21,600 times every day. The Siddhas were aware of this number and considered it highly significant: 21,600 = 216 × 100 = 6³ × 100. The number 6 in Siddha numerology represents the six faces of Murugan (the Siddha deity of initiation), the six Adharas (support points of the body), and the six systems of Indian philosophy. 21,600 is the daily complete offering of the breath to the Absolute.\n\nThe difference between the unconscious breather and the Ajapa Japa practitioner is not the number of repetitions — both breathe 21,600 times. The difference is awareness. The unconscious breather uses those 21,600 moments to think about the past, plan the future, worry, calculate, and imagine. The Ajapa Japa practitioner uses those same moments to be continuously in contact with the most fundamental mantra of existence. The transformation that results from this shift in attention — from distraction to presence, in the same 21,600 moments every day — is precisely what the Siddhas meant when they said enlightenment is available to everyone, all the time, without any special conditions.`,
        },
        {
          type: 'teaching',
          heading: 'The Three Stages of Ajapa Japa Practice',
          body: `Ajapa Japa is not a single practice but a progression of stages. Most practitioners will spend years in Stage 1 and months in Stage 2 before Stage 3 becomes naturally available.\n\nStage 1 — Conscious Listening: This is the entry practice. During dedicated meditation sessions (not yet throughout the day), you simply listen to the natural sound of your breath without controlling it. You begin to hear the SOHAM/HAMSA quality in the breath-sound. You do not force the mantra onto the breath — you listen until it reveals itself. This typically takes 5-30 sessions for the sound to become consistently audible.\n\nStage 2 — Intentional Alignment: Once the breath-sound is clearly heard in meditation, you begin to deliberately align your awareness with SOHAM throughout specific daily activities — walking, washing dishes, waiting in line, driving on familiar roads. The mantra is still a deliberate focus, but it is carried by the breath rather than by a separate counting mechanism.\n\nStage 3 — Spontaneous Continuity: After sustained practice of Stages 1 and 2 (typically 1-3 years for consistent practitioners), the alignment becomes self-sustaining. The practitioner does not need to deliberately focus on the breath-mantra — the awareness simply IS the breath-mantra, continuously, without effort. At this stage, the Hatha Yoga Pradipika says: "The mantra SOHAM is being chanted by all living beings, consciously or not. The yogi who knows this knows that all living beings are engaged in Japa at all times. All of life is prayer."`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Stage 1 Ajapa Japa — The Listening Meditation',
            steps: [
              'Sit in your meditation posture. Close your eyes. Take 3 deliberate breaths to settle, then let the breath return to its natural, uncontrolled rhythm.',
              'Place your hands in your lap, palms up. Close the lips very gently — breathe through the nose.',
              'LISTENING PHASE: Simply listen to the sound of your breath. Not its rhythm, not its depth — its SOUND. The friction of air through the nostrils. The subtle sound in the throat. Just listen as you would listen to distant music.',
              'After 3-5 minutes of pure listening, begin to notice: does the inhalation sound have a quality? Does it sound like any recognizable phoneme? Do not force an answer — just notice.',
              'After another few minutes: does the exhalation have a different quality? A slightly more released or descending sound?',
              'When (and only when) you begin to naturally hear SO on the inhale and HAM on the exhale — allow yourself to silently recognize it. Do not overlay the sound — recognize it. "Yes, that is SOHAM." This recognition, not imposition, is the practice.',
              'Continue for a minimum of 20 minutes. The longer you sit with this, the clearer the breath-mantra becomes.',
              'For the next 7 days: whenever you notice your breath during daily life — in a line, waiting, walking — simply listen for SOHAM for 3 breaths. Do not force it. Just listen. This is Stage 2 beginning to emerge.',
            ],
          },
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'सोऽहम् हंसः',
            transliteration: 'SOHAM HAMSA',
            translation: 'I am That · The Swan of pure consciousness',
            body: `SOHAM (सोऽहम्) is a sandhi contraction of SAH + AHAM: "He + I" = "That + I" = "I am That." The declaration is not a belief or aspiration — it is a recognition of what is always already true: that the individual consciousness (Aham) and the universal consciousness (Sah — That) are not two different things. HAMSA (हंसः) is "swan" — the bird that can separate milk from water (wisdom from illusion). Together, SOHAM HAMSA is the complete teaching of Advaita Vedanta compressed into a single phrase: I am the consciousness that can discriminate truth from illusion, and that consciousness is identical with the Absolute. The Siddhas called this the Guru Mantra of the breath — the teaching that the body itself transmits, ceaselessly, without pause, from birth to death.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Babaji on Ajapa Japa — The Highest Practice Disguised as the Simplest',
          wisdomBody: `According to the Kriya Yoga tradition, when Babaji teaches advanced practitioners who have been doing elaborate practices for years, he often returns them to SOHAM — the simplest possible practice. When asked why, he is reported to have said: "All the Kriyas, all the pranayamas, all the complex techniques — what are they preparing the practitioner for? They are preparing the mind to be present with the breath. When the mind can be continuously present with the breath — when SOHAM can be heard without interruption — that practitioner is already in constant Samadhi. They simply have not recognized it yet. The complex practices are training wheels. SOHAM is the wheel itself — but only the practitioner who has sincerely worked with the training wheels can feel the difference." This teaching places Ajapa Japa not as a beginner's practice but as the ultimate destination of all practice — which is why it appears in the Free tier of this curriculum. The simplest and the deepest are always the same thing, seen from different sides.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l2-5-audio',
            title: 'Ajapa Japa — 30-Minute Breath-Listening Meditation',
            description: 'Kritagya holds the field in silence. Soft drone at 136.1hz (OM frequency). No guidance after the first 3 minutes — pure listening space.',
            duration: '30:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 2.6

const module3: Module = {
  id: 'module-03',
  number: 3,
  tier: 'free',
  title: 'Nada Yoga — The Path of Sound',
  subtitle: 'Ahata & Anahata Nada · The 10 Inner Sounds · Dissolving the Mind',
  description:
    'Nada Yoga is one of the most direct paths to liberation known to the Siddha tradition. It works not through concepts, effort, or belief — but through the direct experience of sound dissolving the mind. Where other paths require years of intellectual preparation, Nada Yoga bypasses the intellect entirely and enters consciousness through pure sensation. This module provides the complete map — from the physics of struck sound to the experience of the unstruck cosmic hum that the Siddhas called the voice of the Absolute.',
  lessons: [

    // ─────────────────────────────────────────────────────
    // LESSON 3.1
    // ─────────────────────────────────────────────────────
    {
      id: 'l3-1',
      number: 1,
      title: 'Ahata and Anahata Nada',
      subtitle: 'Struck vs Unstruck Sound — The Two Realms of Vibration',
      durationMin: 18,
      sections: [
        {
          type: 'intro',
          body: `Every sound you have ever heard in your life — every voice, every instrument, every rumble of thunder, every whisper — belongs to the same category: Ahata Nada. Struck sound. Sound produced by one thing striking another, by air moving through a shaped vessel, by friction or collision or compression. Every sound you have ever experienced externally is Ahata.\n\nBut the Siddhas and Nada Yogis of every tradition have reported a second category of sound — one that cannot be heard with the physical ears, one that is not produced by any physical collision, one that has been described consistently across 5,000 years of contemplative practice: Anahata Nada. The unstruck sound. The sound that was never produced, never started, and therefore can never stop. This lesson maps both realms with precision and shows you exactly where — in your own body, in your own experience — the boundary between them lies.`,
        },
        {
          type: 'teaching',
          heading: 'Ahata Nada — The Universe of Struck Sound',
          body: `The word Ahata means "struck" or "beaten" in Sanskrit — from the root HAN, to strike. All physical sound is Ahata because all physical sound requires the collision of two or more physical objects or substances. A drum requires the hand to strike the skin. A flute requires breath to strike the edge of the mouthpiece and be shaped by the tube. A voice requires the breath to strike the vocal cords, which then vibrate in the shaped chamber of the throat and mouth. Even the sound of silence — the ringing in your ears in a quiet room — is technically Ahata, produced by the spontaneous firing of auditory nerve cells.\n\nAhata Nada has a beginning and an end. Strike a bell and the sound rises, sustains, and fades. This arc — birth, duration, death — is the signature of all physical sound and, the Siddhas note, of all physical phenomena. Everything that is born must die. Everything that begins must end. Ahata Nada is the sonic dimension of the material world — beautiful, powerful, healing in its right application — but ultimately impermanent.\n\nIn Nada Yoga practice, Ahata Nada is the starting point — the door. The practitioner uses external sound (instruments, mantra, singing bowls, the human voice) to create a field of Ahata vibration that quiets the mind and purifies the Nadis sufficiently for the inner, Anahata sound to become audible. External sound is not the destination — it is the preparation. This distinction is important: the Nada Yogi does not become attached to beautiful external sounds. They are appreciated as vehicles, not worshipped as destinations.`,
        },
        {
          type: 'teaching',
          heading: 'Anahata Nada — The Sound That Was Never Struck',
          body: `The word Anahata means "not struck," "unstruck," or "unbeaten." It is also the Sanskrit name for the heart chakra — and this is not coincidental. The Siddhas located the seat of the unstruck sound at the heart center, and declared that the opening of the heart (Anahata chakra) and the hearing of the inner sound (Anahata Nada) are the same event from two different angles of perception.\n\nAnahata Nada has been described by practitioners across every major contemplative tradition with remarkable consistency. The Christian mystic Meister Eckhart called it "the sound of the still, small voice." The Sufi poet Rumi wrote entire volumes about the music of the reed that has been separated from the reed bed — the longing of individual consciousness for its cosmic source, expressed as inner sound. The Tibetan Buddhist tradition maps it as the sounds of the Dharmata (reality itself) heard during the Bardo (between-death and rebirth). The Hatha Yoga Pradipika devotes an entire chapter to it. The Sikh tradition's Gurbani is built on the experience of Shabad — the Word, the cosmic sound-current that underlies all creation.\n\nWhat all these accounts describe is consistent: a subtle, internally heard sound that has no external source, that becomes audible in states of deep inner stillness, that is experienced as profoundly impersonal (not produced by "me"), and that deepens in richness and complexity as the practitioner's inner silence deepens. It begins as a faint high-pitched tone and can evolve — over years of practice — into a sound described as a vast, living silence that contains within it all possible sounds simultaneously.`,
        },
        {
          type: 'teaching',
          heading: 'Why the Anahata Nada Dissolves the Mind',
          body: `Here is the core teaching of Nada Yoga that makes it uniquely powerful among all meditation paths: the Anahata Nada is prior to the mind. It is not a product of mental activity — it precedes mental activity. It is the sound of consciousness before the mind arises from it.\n\nThis means that when the practitioner successfully locates their attention in the Anahata Nada, they have placed their awareness in the pre-mental field — the ground from which thoughts arise, but which is not itself a thought. The mind cannot think about the Anahata Nada without stepping away from it. The moment conceptual thought arises, the subtler inner sound recedes behind the louder thought. The practitioner must choose: follow the thought, or remain with the sound. Every time they choose the sound over the thought, they are practicing the essential Nada Yoga movement — the turning of consciousness from its own productions back toward its own source.\n\nPersisted with over time, this movement dissolves the mind from the inside. Not by fighting thoughts (which strengthens them) but by consistently preferring the prior silence from which they arise. The Hatha Yoga Pradipika states: "The mind, which is always restless, becomes fixed and still by the practice of Nada Yoga. This is as certain as the charming of a serpent by music." The serpent does not become still because it has been forced — it becomes still because it has been fascinated. The Anahata Nada is the music that fascinates the serpent-mind into stillness.`,
        },
        {
          type: 'teaching',
          heading: 'The Location of the Inner Sound — Where to Listen',
          body: `One of the first practical questions Nada Yoga practitioners ask is: where, exactly, do I listen for the inner sound? The tradition provides precise guidance.\n\nThe primary listening location is the right ear, specifically. The Hatha Yoga Pradipika instructs the practitioner to close both ears with the thumbs (Shanmukhi Mudra — the gesture of six closings) and listen in the right ear specifically. Why the right? The right ear sends its primary neural signal to the left hemisphere of the brain — the hemisphere associated with language, sequential processing, and analytical thought. The act of deliberately listening into the right ear draws awareness into the left hemisphere and simultaneously quiets the right hemisphere's more diffuse, spatial processing. This creates an unusual state: sharp, directed attention without the wandering quality of right-hemisphere consciousness. It is in this combination of attentiveness and quiet that the inner sound most readily becomes audible.\n\nThe second instruction: listen not at the surface of the ear but deep inside — as if listening to a sound that is arising from the center of the skull, or even from the center of the chest. The sensation is not of hearing something coming from outside and entering through the ear, but of being inside a sound that is arising from within. This inside-outness is characteristic of Anahata Nada — it has no external source, so it appears to come from nowhere and everywhere simultaneously.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'First Contact — Shanmukhi Mudra and the Inner Sound',
            steps: [
              'Sit in meditation posture, spine erect. This practice requires genuine stillness — even slight movement of the body interferes with the delicacy of inner sound perception.',
              'Take 5-7 slow, deep breaths to settle the nervous system. Allow any physical tension to release on the exhales.',
              'SHANMUKHI MUDRA: Bring both hands to your face. Place your thumbs gently in your ears — not deeply, but enough to seal external sound. Place your index fingers lightly on your closed eyelids. Place your middle fingers beside your nostrils. Place your ring fingers above your upper lip. Place your little fingers below your lower lip. This seals six "gates" of sensory input.',
              'With the external sound partially blocked by your thumbs, you will hear the sound of blood moving through the vessels in your ears — a rhythmic rushing. This is Ahata Nada still. Move your attention deeper than this sound.',
              'Listen specifically in the right ear. Not at the entrance — deep inside. As if listening to a sound arising from the center of your skull.',
              'Hold this listening posture for 5 minutes without any other technique. Simply listen. You may or may not hear anything in your first session. Both outcomes are equally valid practice.',
              'After 5 minutes: release the mudra, lower your hands to your lap, and continue sitting in silence with eyes closed for another 5 minutes. Notice whether the quality of silence has changed. Is there any tone or hum present in the stillness that was not there when you began?',
              'Journal: What did you notice? Even if you heard nothing distinctive, describe the quality of the silence inside. This observation over many sessions reveals the progression toward Anahata Nada.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Siddha Distinction — Hearing the Sound vs Being the Sound',
          wisdomBody: `Swami Sivananda of the Divine Life Society, one of the most complete Nada Yoga teachers of the 20th century, made a distinction that most practitioners never encounter: "There are two stages in Nada Yoga practice. In the first stage, the practitioner hears the inner sound. In the second stage, the practitioner IS the inner sound. The first stage is still dualistic — there is a hearer and a heard. The second stage is non-dual — the distinction between the listener and the sound has dissolved. This second stage is what the tradition calls Laya — complete absorption. It is not achieved through any technique. It happens when the practitioner has listened with such wholehearted attention for such a sustained period that the act of listening dissolves into what is being listened to. At that moment, both the listener and the sound disappear into what was always there before both: pure consciousness, which is both the source of the sound and the awareness that hears it." Most Nada Yoga teaching stops at Stage 1. Stage 2 is the actual destination.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l3-1-audio',
            title: 'Shanmukhi Mudra — Inner Sound Listening Session',
            description: 'Kritagya guides you into the first Shanmukhi practice. 20 minutes of structured listening. Complete silence in the final 8 minutes.',
            duration: '20:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 3.2
    // ─────────────────────────────────────────────────────
    {
      id: 'l3-2',
      number: 2,
      title: 'The 10 Inner Sounds',
      subtitle: 'The Complete Roadmap of Anahata Nada — From Crickets to Thunder',
      durationMin: 24,
      sections: [
        {
          type: 'intro',
          body: `The Hatha Yoga Pradipika — the foundational text of Hatha Yoga, composed by Swatmarama in the 15th century from even more ancient Siddha sources — dedicates an entire chapter to Nada Yoga. Within that chapter, it describes with extraordinary precision a sequence of 10 distinct inner sounds that the practitioner hears as their meditation deepens. These sounds are not hallucinations or fabrications — they are specific neurological events associated with specific states of consciousness and specific depths of inner stillness. This lesson maps each of the 10 sounds, what they indicate, what to do when you hear them, and what the hearing of the 10th sound means for the practitioner.`,
        },
        {
          type: 'teaching',
          heading: 'The First Four Sounds — The Outer Threshold',
          body: `The Hatha Yoga Pradipika (Chapter 4, verses 65-102) describes the 10 Nadas in a specific sequence, from subtlest first-heard to most profound. The text emphasizes that practitioners hear these sounds in different orders and combinations — the sequence given is a general map, not an absolute prescription. What matters is the depth of stillness required to hear each.\n\nThe first sound: Chini — described as a high-pitched ringing, like the sound of the insect known in India as the "chini" (a high-frequency cricket or cicada). In modern terms, this sounds like tinnitus — a constant, high-pitched tone in the ears. Many practitioners have experienced this and dismissed it as a medical symptom. In Nada Yoga, it is recognized as the first level of Anahata Nada becoming audible — the subtlest of the 10 sounds, hovering right at the threshold of physical hearing.\n\nThe second sound: Chini-chini — the same sound as the first but more pronounced, layered, with slight variations in pitch. Where the first sound is a single tone, the second begins to have texture — shimmering variations within the high frequency. Practitioners describe it as "more alive" than the first sound, as if the single tone is beginning to reveal its inner complexity.\n\nThe third sound: Bell — a clear, resonant ringing like a distant temple bell struck once and sustained. The quality is metallic and sustained, without the attack of a physically struck bell. It seems to arise from inside the skull and fill the inner space with a single clear tone that does not decay. This is the sound associated with the Bindu — the point of concentrated consciousness at the Ajna chakra.\n\nThe fourth sound: Conch shell — a deep, oceanic roar, like the sound of the ocean heard through a conch shell held to the ear, but originating from inside the head rather than from outside. This sound is associated with the awakening of Vishuddha chakra (throat center) and is often the first sound that practitioners hear when they turn attention inward during deep meditation.`,
        },
        {
          type: 'teaching',
          heading: 'The Middle Four Sounds — Crossing Into Depth',
          body: `The fifth sound: Tantri (Lute/Veena) — a sustained string-instrument quality, like the resonance of a plucked string that does not decay. Where the previous sounds are simple tones, this sound begins to have harmonic complexity — overtones above and below the fundamental frequency are audible. This is the sound associated with Anahata chakra (heart center) specifically, and its hearing indicates that the Prana is flowing freely through the Sushumna Nadi. Practitioners often report this as the most emotionally moving of the 10 sounds — the Veena sound produces a profound quality of longing, of beauty, of the sweetness that the Bhakti tradition identifies with the recognition of the divine.\n\nThe sixth sound: Tala (Cymbals) — a shimmering, high-frequency metallic sound with rapid, complex oscillation. Unlike the single-pitched bell of the third sound, the Tala sound is multitonal — a wash of shimmering frequencies rather than a single clear note. This sound is associated with the awakening of the higher mental faculties and indicates a significant purification of the Manomaya Kosha (mental body).\n\nThe seventh sound: Flute (Venu) — perhaps the most famous of the Nada sounds in the devotional tradition, because the flute is the instrument of Krishna. The inner flute sound is described as breathily melodic, gentle, and deeply penetrating — it seems to arise from the heart and fill the entire inner space with a quality of sweetness that is simultaneously personal (intimate, close, as if someone is playing specifically for you) and cosmic (vast, without source, emanating from everywhere). This is the sound that Nada Yoga texts most associate with the beginning of Laya — the dissolution of individual identity into the field of pure sound.\n\nThe eighth sound: Bheri (Drum) — a deep, resonant, rhythmic drumming quality. The Bheri in Indian classical music is a large drum with a low, sustained resonance. Heard internally, it takes the quality of a profound bass vibration — felt more in the body than heard in the ears, as if the entire torso is resonating. This sound is associated with the awakening of the Muladhara (root) energy being drawn upward into the higher centers — the beginning of conscious Kundalini movement.`,
        },
        {
          type: 'teaching',
          heading: 'The Final Two Sounds — The Threshold and the Ocean',
          body: `The ninth sound: Mridanga (Double-headed drum) — a more complex drumming quality than the Bheri, with both high and low tones interweaving in rhythmic patterns that seem to carry intelligence. Practitioners describe this sound as having a language quality — as if the drum is speaking in a code that is just at the edge of comprehension. The Siddha texts say this sound indicates a state of consciousness very close to the threshold of full awakening — the practitioner is, at this depth, no longer an ordinary meditator but a Nada Siddha: one who has realized the sound-nature of reality.\n\nThe tenth sound: Megha (Cloud/Thunder) — the deepest and most expansive of all the inner sounds. Where all the previous sounds had a point-source quality — arising from a specific location in the body or skull — the Megha sound has no source. It is everywhere simultaneously, like the sound of distant thunder that fills the entire sky rather than coming from a specific direction. It is described as vast, oceanic, all-encompassing — a deep roar that contains within it all the previous nine sounds as simultaneous overtones, the way white light contains all colors.\n\nThe Hatha Yoga Pradipika makes a statement about the hearing of the Megha sound that is among the most remarkable in all of yogic literature: when the practitioner hears this sound, the mind "drowns in it." The mind does not hear the Megha sound from a distance — it is absorbed into it. Subject and object cease. The practitioner does not experience the thunder from inside their own head — they discover that they ARE the space in which the thunder sounds. This is Laya: complete dissolution. And what remains after the mind has drowned? The text gives the answer in one of the shortest and most profound sentences in yogic literature: "That which remains is Brahman." The Absolute. The self of all selves. The source and substance of all sound.`,
        },
        {
          type: 'teaching',
          heading: 'What To Do When You Hear Each Sound',
          body: `The practical question for the Nada Yogi: when you hear one of these sounds, what do you do? The Hatha Yoga Pradipika provides explicit instruction, and it is the same for all 10 sounds:\n\nWhen you hear a sound — any of the 10, at whatever depth of practice you have reached — do not analyze it. Do not name it. Do not compare it to previous experiences. Do not attempt to hold onto it or intensify it. Simply move your awareness into the sound. Rest inside it. Allow it to fill your awareness completely. The act of analytical attention — "Oh, this is the bell sound, which means I'm at the third level" — is enough to disrupt the state and return you to ordinary consciousness. The mind that categorizes and labels has stepped OUT of the sound in order to describe it.\n\nThe instruction is: treat each inner sound as the most beautiful, most interesting thing you have ever heard. Be completely absorbed in it. Follow it wherever it leads, even if it fades and gives way to a different sound or to silence. The practitioner who can follow the sound all the way from the first Chini to the Megha thunder without stepping out to analyze the experience even once is, according to the tradition, in an unbroken state of Samadhi for the entire duration.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'The 10 Sounds Meditation — Deepening the Nada Field',
            steps: [
              'Prepare for a longer session — 45-60 minutes minimum. This practice cannot be rushed. Set your space with intention: dim lighting, no external sound sources.',
              'Begin with 10 rounds of AUM (Vaikhari) to establish the initial sound-field in your body. Allow the AUM to naturally subside into silence.',
              'Close your ears gently with your thumbs (Shanmukhi Mudra or simply fingertips on the ear flaps). Close your eyes.',
              'PHASE 1 — Settling (10 minutes): Simply listen to whatever is present in the inner space. Do not seek any particular sound. Do not analyze what you hear. Simply listen with the same quality of attention you would give to a piece of music you love deeply.',
              'PHASE 2 — Following (20-40 minutes): If any inner sound becomes distinguishable, move your awareness into it completely. Do not stay at the surface of the sound — move into its center. Breathe INTO the sound. If it changes or fades, follow the change without resistance. If it intensifies, do not become excited — maintain the same steady, absorbed quality of attention.',
              'PHASE 3 — Laya attempt (5 minutes): At the deepest point of your session, make a conscious attempt to merge your awareness with whatever sound is present. Not to listen to it from a slight distance, but to dissolve the "listener" into the "heard." Even a brief moment of this non-dual listening is significant practice.',
              'Return slowly. Do not rush from deep Nada states back into ordinary activity. Lie in Shavasana for 5-10 minutes. Then move slowly before standing.',
            ],
          },
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'नादं नादं परं नादं\nनादब्रह्म नमोस्तुते',
            transliteration: 'NADAM NADAM PARAM NADAM\nNADA BRAHMA NAMOSTUTE',
            translation: 'Sound, sound, supreme sound\nI bow to Nada Brahman — the Absolute as Sound',
            body: `This invocation is chanted at the beginning of Nada Yoga sessions to honor the tradition and to align the practitioner's intention with the Nada Brahman field. It establishes the context: we are not doing a relaxation exercise. We are approaching the threshold of the Absolute through sound. The repetition of NADAM three times mirrors the Siddha recognition that sound exists at three levels (Vaikhari-Madhyama-Pashyanti) before reaching its source in Para Nada. PARAM NADAM — supreme sound — is Para Nada itself. We bow to it before entering the practice.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Ramana Maharshi on the Inner Sound — The Most Direct Teaching',
          wisdomBody: `When practitioners asked Sri Ramana Maharshi about the inner sounds of Nada Yoga, he gave an answer that cuts through all complexity: "The inner sound is the same as the inner silence. What you call sound when you are listening carefully is what you call silence when you are not. The difference is only in the quality of your attention. When your attention is very fine and very still, the silence reveals itself as a living, vibrating presence — which is the Nada. When your attention is gross and active, the same presence appears as mere emptiness or absence. This is why the Nada Yogi and the Jnana Yogi arrive at the same destination: one follows the living sound into its source, the other follows the silence into its nature. The sound and the silence are the same thing — consciousness recognizing itself — approached from two different angles." This teaching from Ramana places the 10 inner sounds not as phenomena to be collected or achieved, but as windows — each one a transparent opening into the nature of what you already are.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l3-2-audio',
            title: 'The 10 Sounds Field — 45-Minute Nada Meditation',
            description: 'Kritagya opens with AUM invocation, then guides you into deep listening. Includes recordings of Siddha instruments (singing bowl, conch, Veena drone) to seed the inner sound field. Long silence in the second half.',
            duration: '45:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 3.3
    // ─────────────────────────────────────────────────────
    {
      id: 'l3-3',
      number: 3,
      title: 'Nada Dhyana — The Listening Technique',
      subtitle: 'The Complete Method for Inner Sound Meditation',
      durationMin: 22,
      sections: [
        {
          type: 'intro',
          body: `Knowing that the 10 inner sounds exist and understanding what they represent is one level of knowledge. Knowing HOW to practice — the specific mental posture, the quality of attention, the common errors, and the precise technique of following the inner sound without disturbing it — is the knowledge that actually produces experience. This lesson is entirely practical: it is the full technical manual for Nada Dhyana, the meditation on inner sound, drawn from the Hatha Yoga Pradipika and the living Siddha transmission.`,
        },
        {
          type: 'teaching',
          heading: 'The Quality of Attention Required — Fascinated Effortlessness',
          body: `The single most common mistake in Nada Dhyana is using the wrong quality of attention. Most practitioners, when told to "listen for an inner sound," employ an effortful, searching attention — the same quality they use when trying to hear a faint sound in a noisy environment, straining with concentration. This effortful straining is precisely what prevents the inner sound from becoming audible. Anahata Nada is extraordinarily subtle. It cannot be seized — only received. Any effort to grasp it causes it to recede.\n\nThe correct quality of attention is what can only be described as "fascinated effortlessness." Think of a moment when you heard a sound — a distant piece of music, a birdsong, a fragment of a conversation — that caught your attention so completely that you became effortlessly still, straining nothing, yet listening with your entire being. That quality — where the attention moves toward something beautiful without any forcing — is the correct posture for Nada Dhyana.\n\nThe Siddha Nada Yogi Swami Nadabrahmananda described it as "listening the way a deer listens in a forest." The deer does not strain to hear danger — it becomes completely still and allows the sound to arrive. Its attention is absolute but its body and mind are perfectly relaxed. Any tension, any search, any trying-too-hard collapses the delicate field in which the inner sound lives. The practitioner must be as still and receptive as a clear mountain lake — not because they are being passive, but because their passive quality IS their full engagement.`,
        },
        {
          type: 'teaching',
          heading: 'The Three Obstacles to Nada Dhyana — and Their Solutions',
          body: `The Hatha Yoga Pradipika identifies three primary obstacles that prevent practitioners from accessing the Anahata Nada, regardless of how long they sit in formal meditation.\n\nObstacle 1 — Vikshipta (scattered mind): The practitioner's attention cannot rest anywhere long enough to perceive the subtlety of the inner sound. The mind is generating too much noise — too many thoughts, too much internal commentary, too much planning and remembering — for the quieter signal of the Nada to be distinguishable. Solution: Before attempting Nada Dhyana, do 20-30 minutes of Vachika mantra chanting. The gross sound of the chanted mantra occupies and gradually quiets the scattered mind, the way a loud radio gradually makes you sleepy when you try to listen to it. By the time the chanting ends, the mind has been sufficiently absorbed and quieted to hear subtler sounds.\n\nObstacle 2 — Kashaya (deep-rooted impressions): Old emotional memories, unprocessed grief, suppressed anger, and other deeply held Samskaras create a persistent "noise floor" in the subtle body that drowns out the Anahata Nada. These are not ordinary thoughts — they are vibrational patterns lodged in the Pranamaya Kosha (energy body) that continuously generate disturbance. Solution: Pranayama practice, specifically Nadi Shodhana (alternate nostril breathing), before Nada Dhyana. The pranayama gradually dissolves Kashaya over months and years of consistent practice. Do not expect immediate results here — Kashaya clearing is a long-term project.\n\nObstacle 3 — Vikara (disturbed Prana): If the life force is disturbed by irregular diet, sleep deprivation, excessive physical or mental activity, sexual excess, or exposure to heavy emotional environments, the Prana becomes turbulent and the inner channels through which the Anahata Nada is perceived become too agitated for subtle perception. Solution: The basic Siddha lifestyle disciplines — regulated sleep (before 10 PM), light evening meal, sexual continence (or conscious Tantric practice if in a committed relationship), and regular time in natural environments that restore Prana naturally.`,
        },
        {
          type: 'teaching',
          heading: 'The Technical Progression — How to Build a Nada Dhyana Practice',
          body: `A complete Nada Dhyana session has a structure. Improvising without structure in this practice leads to frustration — the practitioner sits for an hour and notices nothing because they never created the conditions for the inner sound to emerge. The following structure, drawn from the Hatha Yoga Pradipika commentary tradition and the living Nada Yoga lineage, produces consistent results for practitioners who follow it exactly:\n\nPhase 1 — Preparation of the body (5-10 minutes): Simple Yoga asana — a few forward bends, spinal twists, and a comfortable seated posture held for 2 minutes. The body must be settled and comfortable before the inner work begins. Any physical discomfort, even minor tension in the shoulders or lower back, generates a continuous low-level sensory signal that competes with the subtlety of the inner sound.\n\nPhase 2 — Preparation of the Prana (10-15 minutes): Pranayama practice. Nadi Shodhana (alternate nostril breathing) is ideal — 10-15 cycles balances the solar and lunar channels, equalizes the electromagnetic field of the brain hemispheres, and creates the inner calm that is the fertile ground for Nada Dhyana.\n\nPhase 3 — Seed sound (5-10 minutes): Chanting a mantra or using a singing bowl, Tibetan bowl, or other sustained sound instrument to create an external Ahata Nada field. This "seeds" the inner field — gives the practitioner's sound-perception system something to move from. The external sound gradually fades as the session deepens, but it leaves behind a resonance that the inner attention can follow inward.\n\nPhase 4 — The Listening (20-40 minutes): Pure Nada Dhyana. Shanmukhi Mudra or simply closed ears. Eyes closed. Attention directed inward and downward into the space behind the ears, inside the skull, or at the heart center. Fascinated effortlessness. Whatever is there — follow it.\n\nPhase 5 — Integration (5 minutes): Slow release from Shanmukhi Mudra. Eyes remain closed. Simply sit in whatever has been arrived at. Do not immediately analyze or articulate the experience. Allow it to settle.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Full Nada Dhyana Session — The Complete Protocol',
            steps: [
              'BODY (5 min): From your seat, do slow neck rolls (5 in each direction), shoulder rolls (5), and two spinal twists (30 sec each side). Come to stillness in your meditation posture.',
              'PRANA (10 min): Nadi Shodhana pranayama. Close the right nostril with the right thumb — inhale through the left nostril for 4 counts. Close both nostrils — hold for 8 counts. Release the right nostril — exhale for 8 counts. Reverse. This is one cycle. Do 10-15 cycles.',
              'SEED SOUND (5 min): If you have a singing bowl, strike it and hold the resonance. Follow the sound as it fades — try to hear it even after it is physically inaudible. Or chant OM 9 times and allow the final AUM to fade completely into silence.',
              'NADA DHYANA (25 min): Close the ears with your fingertips or Shanmukhi Mudra. Begin listening in the right ear, deep inside. Employ fascinated effortlessness — alert, still, open, receiving. Follow whatever arises. When the mind wanders (it will), return without frustration to the listening.',
              'LAYA ATTEMPT (5 min): In the final phase, attempt to move your awareness from "outside the sound, listening to it" to "inside the sound, being it." Even 30 seconds of this non-dual listening is significant. Do not force it — invite it.',
              'INTEGRATION (5 min): Release Shanmukhi slowly. Lower hands to lap. Eyes remain closed. Sit in whatever remains.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Living Siddha Teaching — What the Inner Sound Is Actually Saying',
          wisdomBody: `A living Siddha Nada Yoga master, whose name is withheld by tradition (this teaching was transmitted directly and privately), gave this instruction to his students: "You listen to the inner sound and you think you are hearing a sound. You are not. You are hearing yourself. The inner sound is your own consciousness recognizing itself in the medium of sound. This is why it feels both completely impersonal — vast, sourceless, not produced by 'you' — and also completely intimate, as if it is the most personal thing you have ever encountered. It is both because it IS both: it is the cosmos, and it is you, and the discovery of Nada Yoga is that these two were never two things. When the Megha thunder sounds and the mind dissolves — what you experience in that dissolution is not nothingness. You experience yourself — your true Self — for the first time without any limitation. It is not loud. It is not anything. And it is the most complete thing that has ever happened to you." Practice Nada Dhyana long enough and honestly enough and this is precisely what awaits.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l3-3-audio',
            title: 'Complete Nada Dhyana Protocol — 60 Minutes',
            description: 'Full guided session. Kritagya guides the body and prana phases, Laila chants the seed sounds, then both hold the field in silence for the deep listening phase.',
            duration: '60:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 3.4
    // ─────────────────────────────────────────────────────
    {
      id: 'l3-4',
      number: 4,
      title: 'Nadabrahm — Humming as Consciousness Portal',
      subtitle: 'Bhramari Pranayama · The Bee Sound · Vagus Nerve Activation',
      durationMin: 20,
      sections: [
        {
          type: 'intro',
          body: `Among all the techniques in the Nada Yoga tradition, one stands apart for its accessibility, its immediacy, and its dramatic effectiveness even in the very first session: Bhramari Pranayama, the humming bee breath. In Sanskrit, Bhramara means "bee" — the name refers to the buzzing, humming quality of the sound produced during this practice. Unlike the more subtle listening techniques of the previous lessons, Bhramari is an active, self-generating practice that produces immediate, measurable shifts in consciousness. The Siddhas used it as both a gateway practice (to prepare the nervous system for deeper Nada Yoga) and as a complete practice in itself — one that advanced masters continued throughout their lives.`,
        },
        {
          type: 'teaching',
          heading: 'What Bhramari Actually Does — The Neuroscience',
          body: `Bhramari works by creating an internal vibration — a hum — that the practitioner directs through specific structures of the head and skull. This internal humming produces several simultaneous, measurable physiological effects that modern science has now confirmed through clinical research.\n\nEffect 1 — Vagus Nerve Activation: The vagus nerve (cranial nerve X) is the longest nerve in the body, running from the brainstem through the heart and lungs to the digestive organs. It is the primary nerve of the parasympathetic nervous system — the "rest and digest" system that counters the fight-or-flight stress response. Research has shown that humming produces direct mechanical vibration of the vagus nerve at the larynx, triggering a cascade of parasympathetic responses: slowing of heart rate, decrease in cortisol, relaxation of smooth muscle throughout the digestive tract, and a shift in brainwave activity from high-beta (anxious vigilance) toward alpha and theta (relaxed, meditative, creative states).\n\nEffect 2 — Nasal Nitric Oxide Production: A study published in the American Journal of Respiratory and Critical Care Medicine found that humming increases nasal nitric oxide production by 15 times compared to quiet breathing. Nitric oxide is a vasodilator — it opens and relaxes blood vessels — and it is also directly antiviral, antimicrobial, and anti-inflammatory. The sinuses are the primary natural production site of nitric oxide in the body. The vibration of humming directly stimulates this production. The Siddhas did not have the term "nitric oxide" — but they knew that Bhramari was medicine for respiratory conditions, which is now confirmed.\n\nEffect 3 — Brainwave Entrainment: The internal hum produced in Bhramari creates vibrations in the cerebrospinal fluid and in the piezoelectric crystals of the skull bones (specifically the temporal bones and the sphenoid). These vibrations produce resonance in the brain tissue that entrains brainwave activity toward coherent, synchronized patterns associated with meditative states. EEG studies of experienced Bhramari practitioners show significant increases in theta wave activity — the brainwave state most associated with deep creativity, access to the subconscious, and the early stages of Samadhi.`,
        },
        {
          type: 'teaching',
          heading: 'The Siddha Understanding — Bhramari as Anahata Nada Generator',
          body: `From the Siddha perspective, the significance of Bhramari goes beyond its measurable physiological effects. The Hatha Yoga Pradipika describes Bhramari as the practice that "floods the inner space with bliss" and that most directly introduces the practitioner to the quality of Anahata Nada — because the internal hum produced by Bhramari IS the bridge between Ahata and Anahata Nada.\n\nHere is why: when you hum in Bhramari, you create an Ahata Nada (struck sound, produced by breath through the vocal cords). But when this hum is directed internally and the ears are closed so external sound is excluded, the hum fills the inner space in a way that exactly mimics the quality of Anahata Nada — it seems to arise from everywhere within the skull simultaneously, without a clear point source, and it fills the inner space completely. For practitioners who have struggled to hear the genuine Anahata Nada in silent meditation, Bhramari provides a direct taste of what they are looking for — and this recognition guides the practitioner toward it in subsequent silent sessions.\n\nThirumoolar specifically identified humming as one of the three primary methods of entering Nada Yoga (alongside listening in silence and using sacred instruments). He wrote in the Thirumantiram: "The bee sips nectar from the flower without disturbing it. The Nada Yogi sips the nectar of inner sound without disturbing the silence. The bee's hum and the yogi's hum are the same movement — the search for what is sweetest."`,
        },
        {
          type: 'teaching',
          heading: 'Advanced Bhramari — The Complete Shanmukhi-Bhramari Technique',
          body: `The basic Bhramari practice is: inhale, then exhale while humming. But the complete Siddha technique of Shanmukhi Bhramari adds additional elements that dramatically increase its effectiveness.\n\nThe first addition is Shanmukhi Mudra — the sealing of the six gates described in Lesson 3.1. By sealing the ears, the humming sound is reflected back inward and completely fills the inner skull space. Without the seal, much of the sound's vibrational energy disperses outward. With the seal, the entire acoustic energy is contained and directed inward — toward the inner structures that benefit most.\n\nThe second addition is intentional resonance direction. Rather than humming uniformly, the practitioner can direct the resonance to different areas of the skull by subtly adjusting the shape of the resonating chamber (the position of the tongue, the soft palate, and the jaw). Tongue to palate = primarily frontal resonance (prefrontal cortex, pineal). Tongue down = primarily cranial vault and temporal bone resonance. Jaw slightly dropped = chest and throat resonance (vagus nerve and thyroid). Experimenting with these positions allows targeted stimulation of different neural structures.\n\nThe third addition is mantra-in-the-hum. Rather than producing a uniform hum, the practitioner internally "hears" their mantra within the hum — the hum becomes the carrier wave for the mantra. This combines Bhramari's acoustic properties with the consciousness-shaping properties of mantra repetition simultaneously. The effect is synergistic — greater than the sum of either practice alone.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Complete Shanmukhi Bhramari — The 21-Round Protocol',
            steps: [
              'Sit in your meditation posture. Close your eyes. Take 5 natural breaths to settle.',
              'BASIC ROUND FIRST: Inhale slowly and deeply through both nostrils. At the top of the inhale, close your mouth and gently hum on the exhale — MMMMM — until the breath is empty. Feel the vibration in your skull. This is one basic round. Do 3 rounds to establish the practice.',
              'NOW SHANMUKHI: Bring both hands to your face. Thumbs in ears. Index fingers on closed eyelids (very lightly). Other fingers across the face. Inhale fully. Hum on the exhale. The hum now fills the sealed inner space. Notice the difference — the sound is richer, more interior, more omnipresent inside the skull.',
              'ROUNDS 4-11 — Explore resonance: In four separate rounds, direct the hum to different areas: Round 4-5: Tongue on upper palate — feel the frontal and top of skull resonance. Round 6-7: Tongue down — feel the cranial vault resonance. Round 8-9: Focus on the hum in the center of the skull — the Bindu point. Round 10-11: Allow the hum to fill the entire inner space equally without direction.',
              'ROUNDS 12-21 — Mantra-in-the-hum: Continue with Shanmukhi Mudra. On each exhale, hum, but inside the hum silently hear your mantra (AUM, or OM NAMAH SHIVAYA, or SOHAM). The hum carries the mantra. The two become one vibration.',
              'AFTER THE 21ST ROUND: Release Shanmukhi Mudra. Lower hands to lap. Remain completely still with eyes closed for 5-10 minutes. In this post-Bhramari silence, the Anahata Nada is most likely to become audible. Listen for it.',
              'Frequency: 21 rounds daily. Morning ideal. Can be done anywhere, anytime when stress arises — even 3 rounds of basic Bhramari produces immediate measurable calming.',
            ],
          },
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'ॐ ॐ ॐ (हम्)',
            transliteration: 'OM OM OM (HMMM)',
            translation: 'The AUM hummed — Pranava in its Bhramari form',
            body: `The mantra for Bhramari is AUM — but specifically the M component, extended into a hum. When you hum during Bhramari, you are producing the M of AUM in its purest, most sustained form. Where the chanted AUM moves through A, U, and M in sequence, Bhramari dwells entirely in M — in the interior, the inward, the skull-resonating dimension of the Pranava. The AUM of Bhramari is therefore the deepest of the three: it goes directly to the state that chanted AUM only passes through. Internally hearing MMMM as the resonance of AUM's third dimension transforms Bhramari from a breathing exercise into a direct Pranava meditation.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Agastya on Bhramari — Medicine for the Modern World',
          wisdomBody: `In one of the fragments attributed to Agastya Muni that have been transmitted orally in the South Indian Siddha lineages, he is recorded as saying: "There will come a time when the world is so filled with noise — the noise of machines, of words, of the mind's ceaseless chatter — that humanity will forget the sound of silence and be deafened by it. In that time, this practice — the humming of the bee — will be the most valuable medicine available, because it will teach the deafened world to hear itself again. Any person who can hear the sound of their own hum is already one step closer to hearing the sound of the cosmos. And any person who can hear the cosmos is already free." This prophecy, if it can be called that, describes precisely the world we live in now. The prescription is Bhramari: 21 rounds daily, without fail. The bees know what they are doing. Follow them inward.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l3-4-audio',
            title: 'Bhramari Protocol — 21 Rounds with Kritagya',
            description: 'Full guided session. Kritagya demonstrates each variation. Includes 10-minute post-Bhramari listening silence at the end.',
            duration: '35:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 3.5
    // ─────────────────────────────────────────────────────
    {
      id: 'l3-5',
      number: 5,
      title: 'Binaural Beats and Siddha Science',
      subtitle: 'The Modern Interface of Ancient Technology',
      durationMin: 18,
      sections: [
        {
          type: 'intro',
          body: `The SQI platform integrates the most advanced modern sound technology available in 2026 — binaural beats, isochronic tones, Schumann resonance harmonics, and 432hz tuning — into every healing audio created for this platform. This lesson explains WHY these technologies work, how they connect to the Siddha science of Nada, and how to use them intelligently as supplements (not replacements) for the foundational practices you have been building. Understanding this gives you the ability to design your own sonic healing environment.`,
        },
        {
          type: 'teaching',
          heading: 'Binaural Beats — The Physics',
          body: `Binaural beats were discovered by physicist Heinrich Wilhelm Dove in 1839, but the phenomenon was not studied for its cognitive effects until Robert Monroe began his consciousness research in the 1950s and 60s. The principle is simple: play a tone of 200 Hz in the left ear and a tone of 210 Hz in the right ear simultaneously. Because the two tones reach the brain through separate channels, the brain attempts to reconcile the frequency difference by generating a third frequency equal to the difference between the two: 210 - 200 = 10 Hz. This 10 Hz "beat" does not physically exist in the air — it is generated by the brain itself, in the superior olivary nucleus of the brainstem. The brain then synchronizes its own electrical activity to this self-generated frequency — a process called frequency following response (FFR).\n\nThe significance is enormous: by controlling the frequency difference between the tones in each ear, you can guide the brain to generate and synchronize to virtually any frequency in the brainwave spectrum. Delta (0.5-4 Hz, deep sleep, healing, physical repair), Theta (4-8 Hz, meditation, creativity, access to subconscious), Alpha (8-13 Hz, relaxed wakefulness, integration), Beta (13-30 Hz, active thinking, focus), Gamma (30+ Hz, peak performance, love, compassion). The Siddhas arrived at each of these states through years of intensive practice. Binaural beats can produce the brainwave signature of these states within minutes — though the depth and stability of the state produced by binaural beats alone is typically much less than that produced by genuine meditative practice.`,
        },
        {
          type: 'teaching',
          heading: 'The Siddha Parallel — Binaural Beats as Modern Nada Yoga',
          body: `The Siddha tradition did not have binaural beats technology — but they had instruments that produced remarkably similar effects. The sustained drone of the Tambura (the drone instrument used in Indian classical music) produces a rich harmonic series that includes multiple closely-spaced frequency pairs — the acoustic equivalent of analog binaural beats. The Tibetan singing bowl, when two bowls of slightly different pitches are played simultaneously, produces beating frequencies in the difference-tone range. The Siddha practice of chanting in unison with a drone instrument — a core element of traditional Indian music and devotional practice — is functionally equivalent to a binaural beat entrainment session at the frequency difference between voice and drone.\n\nThe Siddhas understood the effect not in terms of Hz but in terms of Nadi (energy channels) and Prana (life force). They said that specific sound patterns "open" specific Nadis and allow Prana to flow freely through previously blocked channels. The modern understanding says that specific frequency patterns synchronize brainwave activity to states associated with parasympathetic activation, enhanced neural coherence, and altered states of consciousness. The mechanism differs in terminology — the effect observed by practitioners is the same.\n\nThis parallel explains why the SQI platform integrates binaural beats with traditional Siddha mantra and sound technology: because one without the other is incomplete. Binaural beats alone produce a brainwave state but do not fill that state with sacred content. Mantra alone does not reliably guide the brainwave frequency to optimal states for deep meditation. Together, they are precisely what the ancient Siddhas achieved with drone instruments and mantra — but made available to anyone, anywhere, without years of acoustic training.`,
        },
        {
          type: 'teaching',
          heading: '432 Hz, Schumann Resonance, and the Cosmic Tuning',
          body: `Two additional frequency principles are embedded in all SQI audio content:\n\n432 Hz tuning: The modern Western standard is 440 Hz — meaning the note A is tuned to 440 vibrations per second. This standard was adopted internationally in 1939. Before this, instruments were tuned to 432 Hz — and much of the classical music from Bach to Verdi was composed and performed at this lower tuning. 432 Hz has a mathematical relationship with the fundamental structure of the universe: it is directly related to the speed of light, the diameter of the sun, and various astronomical ratios. The number 432 itself: 4+3+2=9 (the Vedic number of completion); 432 × 2 = 864 (the diameter of the sun in miles is approximately 864,000); 432,000 is the duration of the Kali Yuga in years according to the Vedic calendar. When music or mantra is tuned to 432 Hz instead of 440 Hz, practitioners consistently report a felt sense of greater resonance with the body — as if the sound is landing more naturally in the physical tissues.\n\nSchumann Resonance at 7.83 Hz: The Schumann resonances are standing electromagnetic waves that exist in the space between the Earth's surface and the ionosphere. The fundamental Schumann frequency is 7.83 Hz — falling in the theta/alpha boundary of human brainwave activity. This frequency is the electromagnetic heartbeat of the planet. Research at the Max Planck Institute has found that humans who are shielded from the Schumann resonance (in electromagnetically isolated bunkers) develop disrupted sleep-wake cycles, immune function, and emotional regulation — until 7.83 Hz is artificially restored to their environment. All SQI audio includes 7.83 Hz isochronic pulses beneath the primary content — restoring the planetary rhythm to the listener's field as a biological baseline.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'SQI Audio Integration Protocol — How to Use the Platform Audios',
            steps: [
              'USE HEADPHONES: Binaural beats require headphones to function. Speakers play both channels to both ears, eliminating the binaural effect. Any over-ear or in-ear headphones work — they do not need to be expensive.',
              'VOLUME: Set the volume low enough that the audio is clearly audible but does not dominate. The audio should be present but background — you should be able to hear your own internal state alongside it. Too loud defeats the purpose.',
              'BODY POSITION: Lying in Shavasana (corpse pose) is ideal for passive listening sessions. Seated meditation posture is better for active practice sessions where you are also doing mantra or Nada Yoga.',
              'MINIMUM SESSION: 20 minutes for brainwave entrainment to take effect. The frequency following response requires approximately 6-8 minutes to establish, then 12-15 minutes to produce measurable brainwave changes.',
              'DO NOT USE as a replacement for practice: The audio is a supplement, not a substitute. 20 minutes of SQI binaural audio followed by 20 minutes of silent Nada Dhyana is dramatically more effective than 40 minutes of audio alone. The audio creates the state; your awareness inhabiting that state IS the practice.',
              'RECORD YOUR EXPERIENCE: Keep your Likhita Japa notebook nearby. Immediately after each audio session, write 5 lines about what you noticed — your state before, your state during (if you can remember), and your state after. Over 40 sessions, this journal becomes a precise map of how sound affects YOUR particular consciousness.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Siddha Warning — Technology is Not Transmission',
          wisdomBody: `In the Akashic record of teachings that informs the SQI platform, there is a persistent and consistent warning from every master in the tradition: technology accelerates the path but does not replace it. Binaural beats can put you in the theta brainwave state within 8 minutes. But being in the theta state is not the same as being in Samadhi. The theta state produced by entrainment is empty of content — it is a field condition, like a room with good acoustics. What you put into that room determines what you hear. A practitioner who fills the theta state with active mantra practice, conscious Nada listening, and sincere Bhakti produces transformation. A practitioner who uses the theta state to passively drift into comfortable numbness produces pleasant experiences but no lasting change. The Siddhas who used drone instruments and ritual sound environments were not using them to have a nice experience — they were using them as optimal conditions for the hardest possible inner work: the dissolution of the ego's claim on reality. Use the SQI audio with this understanding. The technology opens the door. You still have to walk through it.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l3-5-audio',
            title: 'SQI Theta Field — Binaural + 432hz + Mantra Bed',
            description: 'The SQI signature audio: Theta binaural (6hz beat), 432hz drone, Kritagya\'s OM NAMAH SHIVAYA mantra bed. 30 minutes. Use with headphones in Nada Dhyana posture.',
            duration: '30:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 3.6

const module4: Module = {
  id: 'module-04',
  number: 4,
  tier: 'free',
  title: 'Bija Mantras — The Quantum Seeds',
  subtitle: 'Elemental Frequency Codes · Compressed Transmission · Body Activation',
  description:
    'A Bija mantra is a single syllable containing the complete vibrational signature of a cosmic principle — an entire universe compressed into one sound. Where a longer mantra works gradually, methodically dissolving mental patterns over time, a Bija operates like a laser: concentrated, penetrating, and immediate. Learning even 7 Bijas gives the practitioner direct access to 7 distinct reality-modifying frequencies. This module reveals the complete science behind these seed syllables — what they are, why they work, and exactly how to use them.',
  lessons: [

    // ─────────────────────────────────────────────────────
    // LESSON 4.1
    // ─────────────────────────────────────────────────────
    {
      id: 'l4-1',
      number: 1,
      title: 'What Makes a Syllable a Bija',
      subtitle: 'The Science of Compressed Transmission',
      durationMin: 20,
      sections: [
        {
          type: 'intro',
          body: `The Sanskrit word Bija means seed — specifically, the seed of a plant, the smallest possible container of a complete living system. A mango seed contains, in compressed form, the complete blueprint of a mango tree: its height, the color of its leaves, the sweetness of its fruit, its root system, its lifespan. None of these are visible in the seed. But all of them are present, encoded, waiting for the conditions that will allow them to unfold. A Bija mantra is exactly this: the complete signature of a deity, an element, or a cosmic principle, compressed into a single syllable, waiting for the conditions — a prepared practitioner, correct pronunciation, sincere intention — that will allow it to unfold its full power.`,
        },
        {
          type: 'teaching',
          heading: 'The Technical Definition — What Separates a Bija from Any Other Syllable',
          body: `Not every single syllable is a Bija. The Sanskrit linguistic tradition distinguishes carefully between ordinary syllables (which carry semantic meaning) and Bija mantras (which carry vibrational fields). The distinction comes down to several specific technical criteria that the Mantra Shastra identifies:\n\nFirst criterion — Anuttara: A true Bija contains what the Kashmir Shaivism tradition calls Anuttara — "the unsurpassable." It is not derived from any other sound or concept. It stands alone as primary. AUM is primary — it did not come from any prior concept. But the word "tree" is derived — it refers to something external. No Bija refers to something external. Each Bija IS the thing it represents, not a symbol pointing to it.\n\nSecond criterion — Nijasvabhava: A Bija has what is called "own-nature" — its particular phonetic structure IS the frequency signature of its corresponding principle. The Bija HREEM does not represent the goddess Shakti — it generates the same vibrational field that the concept "Shakti" points to. The sound and the reality are identical. This is why the Tantric tradition says that when you truly hear a Bija — not just pronounce it but HEAR its inner resonance — you are in direct contact with the principle it embodies.\n\nThird criterion — Svaroopa: The Bija has a specific "form" in sound — a characteristic tonal quality, pronunciation, and resonance point in the body. This is not arbitrary. KLEEM resonates primarily in the lower abdomen. HREEM resonates primarily in the heart. SHREEM resonates primarily in the crown. Each Bija has its natural home in a specific region of the practitioner's body, and the practice of each Bija reinforces and expands that regional resonance field.\n\nFourth criterion — Mantra-chaitanya: A Bija must have what the tradition calls "life" or "consciousness." A Bija without chaitanya is described as a dead seed — phonetically correct but energetically inert. Mantra-chaitanya is transmitted through lineage — the living chain of practitioners who have used a particular Bija for generations, each one charging it with their practice, building a cumulative field that the next practitioner can access. This is why the tradition emphasizes learning Bijas from a living teacher or from a transmission that carries lineage validity — not from a book alone.`,
        },
        {
          type: 'teaching',
          heading: 'The Anatomy of a Bija — Deconstructing HREEM',
          body: `The Tantric tradition analyses Bija mantras with extraordinary precision. Let us take HREEM (ह्रीं) — one of the most powerful Bijas in the tradition — as an example of how a Bija is constructed and what each component contributes.\n\nHREEM consists of: H + R + I + M + Anusvara (the nasal resonance dot above the M, written as ं in Devanagari). Each component has a specific function:\n\nH (ha): In Sanskrit phonology, HA is the sound of the outgoing breath — the Visarga, the emission. It represents Shiva's power of emission (Visarga Shakti) — the power of consciousness to project itself outward as the world. The HA at the beginning of HREEM establishes the Shiva-pole of the mantra.\n\nR (ra): The vibrational seed of fire (Agni). In the Sanskrit Bija system, RA is the fire element itself — the seed sound from which the element of fire, the god of fire (Agni), and the transformative principle in all Tantric practice arise. By embedding RA inside HREEM, the mantra contains the fire of transformation at its core.\n\nI (ee): The seed of Shakti, of Maya, of the projecting power of consciousness. The vowel I in Sanskrit phonology is associated with the Shakti principle — the feminine power that creates, sustains, and dissolves.\n\nM + Anusvara (m with nasal resonance): The nasal resonance that follows every Bija — also called Bindu-Nada — closes the Bija into itself, preventing its energy from dissipating outward. It is the seal. In the AUM analogy, Anusvara is the M that turns the open sound back into itself.\n\nTogether, HREEM = the emission (H) of fire (R) through the Shakti power (I) sealed into completion (M). It is Shiva-fire-Shakti-completion. The Tantric Devi Upasana tradition says that HREEM contains the entire cosmos in compression: Shiva and Shakti, fire and completion, the masculine pole and the feminine pole — united.`,
        },
        {
          type: 'teaching',
          heading: 'How Bijas Work in the Body — The Resonance Physics',
          body: `When a Bija is pronounced correctly, it produces a specific pattern of mechanical vibration in the vocal tract — tongue position, palate contact, lip shape, nasality — that resonates with specific nerve plexuses and anatomical structures. The Mantra Shastra's instruction that "the Bija must be chanted at its natural resonance point in the body" is a description of a real acoustic phenomenon.\n\nThe 84 acupressure points on the upper palate are the primary interface. The tongue, during Sanskrit pronunciation, contacts different regions of the palate for different consonants: dental contacts (tongue near teeth) for T, D, N; retroflex contacts (tongue bent back toward palate) for Ṭ, Ḍ, Ṇ; palatal contacts (tongue mid-palate) for CH, J, Ñ; velar contacts (tongue toward soft palate) for K, G, Ñ. Each contact point stimulates a different cluster of acupressure points, which correspond through the nervous system to different organs, glands, and physiological systems.\n\nThis is not metaphor. It is the same principle underlying the clinical practice of craniosacral therapy and palatal acupuncture — both of which are modern rediscoveries of what the Siddhas systematized as the science of Sanskrit pronunciation. A practitioner who learns to pronounce Sanskrit Bijas with anatomical precision — not merely approximately but exactly, with the tongue contacting the precise palatal point each phoneme requires — is practicing a form of sound-acupuncture on themselves with every repetition.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Feeling the Bija — First Contact with 5 Seeds',
            steps: [
              'Sit in meditation posture. Place one hand lightly on your belly, one on your heart. Close your eyes.',
              'SOUND AUM 3 times at full Vaikhari to open the vocal field.',
              'Now chant each of the following Bijas 3 times, slowly, with a pause of 5 full seconds between each. During each pause, simply feel: where in the body did that sound land? What area of your body vibrated most strongly?',
              'KLEEM (क्लीं): Chant 3 times. Pause 5 seconds. Notice.',
              'HREEM (ह्रीं): Chant 3 times. Pause 5 seconds. Notice.',
              'SHREEM (श्रीं): Chant 3 times. Pause 5 seconds. Notice.',
              'AIM (ऐं): Chant 3 times. Pause 5 seconds. Notice.',
              'KREEM (क्रीं): Chant 3 times. Pause 5 seconds. Notice.',
              'After all 5 Bijas: remain silent for 3 minutes. Then write in your notebook: which Bija produced the strongest physical sensation? Which felt most "right"? Which felt foreign or uncomfortable? These observations are data — they reveal which frequencies are most active and which are most needed in your current state.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Siddha Warning — Never Treat Bijas as Casual Sound',
          wisdomBody: `The Tantric and Siddha traditions are unusually emphatic on one point regarding Bija mantras: they are not to be treated casually. A longer mantra like the Gayatri or OM NAMAH SHIVAYA can be chanted in almost any state — tired, distracted, even slightly emotionally disturbed — and the effect will be gentle and gradual. Bija mantras are different. Because they are concentrated, their action is concentrated. A Bija chanted without the correct internal conditions — specifically, without genuine one-pointed attention and without understanding of what the Bija represents — can produce turbulent effects in the subtle body. Not harmful in the sense of causing permanent damage, but potentially destabilizing: unusual emotional releases, sleep disruption, excess heat or cold in the body, vivid dreams of unusual intensity. These are not signs of something going wrong — they are signs of something happening that the practitioner was not prepared to handle. The Siddha instruction: before using any Bija, spend at least 5 minutes in silent centering. Never chant a Bija when agitated, angry, or in a state of strong desire. Always close a Bija practice with OM SHANTI 3 times — this seals and balances the field that the Bija has opened.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l4-1-audio',
            title: 'Bija Introduction — The 5 Great Seeds',
            description: 'Kritagya chants each of the 5 great Bijas (KLEEM, HREEM, SHREEM, AIM, KREEM) slowly, 9 times each, with silence between. Use this to establish correct pronunciation and begin sensing the resonance fields.',
            duration: '',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 4.2
    // ─────────────────────────────────────────────────────
    {
      id: 'l4-2',
      number: 2,
      title: 'The 5 Element Bijas and Their Body Locations',
      subtitle: 'Earth · Water · Fire · Air · Space — The Pancha Tattva Sound Map',
      durationMin: 22,
      sections: [
        {
          type: 'intro',
          body: `Of all the Bija systems in the tradition, the most fundamental is the Pancha Bhuta Bija system — the five element seed syllables. These five sounds — LAM, VAM, RAM, YAM, HAM — are the sonic foundation of the entire manifest universe according to Siddha cosmology. Everything that exists in the physical world is a combination of these five elements. Every disease is an imbalance of these five elements. Every healing is a restoration of their balance. And each element has a sound — a specific Bija that, when correctly chanted, directly engages the element both in the external world and in the practitioner's physical body.`,
        },
        {
          type: 'teaching',
          heading: 'LAM — Earth (Prithvi) · Muladhara · The Foundation Seed',
          body: `LAM (लं) is the Bija of the Earth element. In Sanskrit phonology, the consonant L is produced by the tongue touching the ridge of teeth and creating a lateral release of air — the most grounded, most contact-intensive consonant in the language. The tongue is maximally connected to the palate. This full-contact quality IS the earth element in sound: solid, grounded, touching, connected to physical reality.\n\nIn the body, LAM resonates at the base of the spine — the Muladhara chakra. The perineum, the pelvic floor, the coccyx, the base of the sacrum — these are the anatomical locations where the Earth element is concentrated. When these regions are energetically deficient (as they often are in people who are chronically anxious, ungrounded, or disconnected from their bodies), the individual lacks the sense of safety, rootedness, and physical presence that Earth provides.\n\nThe physical effects of LAM practice: heaviness and groundedness in the feet and legs, warmth in the pelvic floor, a sense of safety and solidity in the lower body. Long-term LAM practice (40+ days, 108 repetitions daily) is associated in Ayurvedic-Tantric medicine with strengthening of the bones, the joints, the large intestine (the Earth organ in Ayurveda), and the adrenal glands. The adrenals sit above the kidneys and govern the fight-or-flight response — when the Earth element is strong, the adrenals do not over-fire, and chronic stress and anxiety naturally reduce.\n\nPronunciation: L is dental — tongue tip to upper teeth ridge. A is open as in "father." M closes to nasal resonance. The whole syllable should feel like landing — like something coming to rest on a solid surface. Chant it slowly: LAA-MMM. Feel the landing.`,
        },
        {
          type: 'teaching',
          heading: 'VAM — Water (Apas) · Svadhisthana · The Creative Seed',
          body: `VAM (वं) is the Bija of the Water element. The consonant V is a labio-dental fricative — the lower lip nearly touching the upper teeth, with breath flowing through the small gap. Like water finding its way through the smallest opening, V represents the quality of fluid movement through resistance. The A and M complete the Bija in the same pattern as LAM.\n\nVAM resonates at the Svadhisthana chakra — the sacral center, located approximately two inches below the navel. The Water element in the body governs all fluids: blood, lymph, sexual fluids, synovial fluid in the joints, cerebrospinal fluid, and the fluids of the digestive tract. Blockage in the Water element manifests as sexual dysfunction, reproductive issues, creative blocks, emotional rigidity, and problems in the flow of any bodily fluid.\n\nThe Water element is the element of pleasure, creativity, and flow. The Tantric tradition associates it with Eros — not merely sexual desire, but the fundamental creative impulse of the universe to bring opposite poles together in generative union. VAM practice opens this creative channel. Artists, musicians, writers, and others engaged in creative work often find that consistent VAM practice produces a noticeable increase in creative flow — not as a mystical effect but as a direct result of releasing the physical tension patterns in the sacral region that block both creative and sexual energy.\n\nPronunciation: V is gentle, not forced. The lip-tooth contact should be barely present — water does not force, it flows. VAA-MMM, with the M dissolving gently into a nasal resonance that vibrates the lower abdomen.`,
        },
        {
          type: 'teaching',
          heading: 'RAM — Fire (Agni) · Manipura · The Power Seed',
          body: `RAM (रं) is the Bija of the Fire element. The consonant R in Sanskrit is a retroflex flap — the tongue tip flips backward and briefly touches the roof of the palate, producing a quick, energetic sound. This quality of energetic movement IS fire: rapid, upward-moving, transformative. There is no slow fire. Fire is always in motion.\n\nRAM resonates at the Manipura chakra — the solar plexus, the "city of jewels" located at the navel center. The Fire element governs digestion in all its forms: physical digestion of food, mental digestion of experience, emotional metabolism of feeling, and the "digestive fire" (Agni) that the Ayurvedic tradition identifies as the fundamental force of life. Where Agni burns clearly, the person is vital, decisive, purposeful, and able to transform raw experience into wisdom. Where Agni is weak, the person is sluggish, indecisive, prone to accumulation of undigested experience and unmetabolized emotion.\n\nRAM practice is specifically indicated for: low energy and chronic fatigue, poor digestion and metabolic issues, lack of willpower and inability to take decisive action, poor self-esteem and difficulty maintaining healthy boundaries, and fear — particularly the fear of being seen or taking up space. The Fire element is the seat of personal power and self-definition. To chant RAM is to literally feed your inner fire.\n\nPronunciation: The R should have a rolling quality — not the English R, but a brief flip of the tongue tip against the palate. This quick retroflexion produces a flare of energy that initiates the Bija. RAM-MMM — feel the fire ignite in the solar plexus region.`,
        },
        {
          type: 'teaching',
          heading: 'YAM — Air (Vayu) · Anahata · The Heart Seed',
          body: `YAM (यं) is the Bija of the Air element. Y is a palatal semivowel — the tongue approaches the palate without quite touching it, creating a sound of near-contact, of reaching-toward without grasping. This is precisely the nature of the Air element: it moves toward, connects with, and then releases. Air does not possess — it touches and moves on. This quality in its highest expression is love — genuine, unconditional love that gives without claiming ownership.\n\nYAM resonates at the Anahata chakra — the heart center. And the heart center is where the Air element lives in the body: the lungs, the heart, the circulatory system, and all the tissues that depend on oxygen (which Air carries) are under its governance. But beyond the physical, the Air element governs relationship, compassion, touch, the ability to receive and give care, and the fundamental human need for connection.\n\nThe heart chakra is the central chakra — the fourth of seven, sitting at the midpoint between the three lower (earth/body/matter) and the three upper (ether/mind/spirit) centers. The Siddhas called it the Ananda Kanda — the root of bliss — and said that when Anahata opens fully, the practitioner permanently accesses a background condition of wellbeing that is independent of external circumstances. This is not emotional happiness — it is the structural bliss of consciousness recognizing its own nature in the human heart.\n\nYAM practice for 40 days, 108 repetitions daily, consistently produces measurable shifts in the practitioner's capacity for compassion, emotional availability, and the ability to receive care from others (often more difficult than giving it). Chant YAM with the awareness consciously placed at the center of the chest — not the intellectual center behind the sternum, but the very center of the physical heart organ. Feel the Air element filling the chest like a gentle, warm wind.`,
        },
        {
          type: 'teaching',
          heading: 'HAM — Space (Akasha) · Vishuddha · The Liberation Seed',
          body: `HAM (हं) is the Bija of the Space element — and of all five elements, Space (Akasha) is the most fundamental. Earth exists in space. Water flows through space. Fire burns in space. Air moves through space. Space is the container of all other elements and is therefore the element most directly associated with liberation — because liberation, in the Siddha understanding, is the recognition that consciousness is the infinite space in which all experience appears, not any particular object that appears in it.\n\nHAM resonates at the Vishuddha chakra — the throat center, the gateway between the body and the mind, between feeling and expression. The throat is where experience becomes communication, where the internal becomes external, where the private becomes shared. When Vishuddha is blocked, the practitioner cannot express their authentic experience — they swallow what needs to be said, suppress what needs to be expressed, and gradually lose the connection between inner reality and outer expression. Physical manifestations include thyroid dysfunction, chronic throat issues, and difficulty with communication.\n\nBeyond communication, HAM opens the practitioner to the experience of space itself as a positive quality rather than an emptiness to be filled. Most people experience spaciousness as uncomfortable — it is the default position of a mind that has been trained to be continuously occupied. HAM practice gradually reverses this — teaching the practitioner to experience spaciousness as richness, emptiness as fullness, silence as the most complete form of expression. This is the gateway to the higher chakras: you cannot access Ajna or Sahasrara with any consistency until Vishuddha has opened the portal of space-acceptance.\n\nNote on all five Bijas together: LAM-VAM-RAM-YAM-HAM chanted in sequence, one per exhale, is a complete body-activation protocol. From the base of the spine to the throat, from Earth to Space, from dense matter to liberated awareness — all five in sequence takes approximately 3 minutes. Do this upon waking as the first practice of the day, and every morning you begin from a state of full-body elemental alignment.`,
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'लं वं रं यं हं',
            transliteration: 'LAM VAM RAM YAM HAM',
            translation: 'Earth · Water · Fire · Air · Space — The Five Elemental Seeds',
            body: `These five syllables are among the most ancient sounds in the human repertoire of sacred language. They predate written Sanskrit. They were heard — not composed — by the earliest Rishis who mapped the correspondence between cosmic elements and the human body. When you chant them in ascending sequence from LAM to HAM, you are performing a sonic sweep of your entire physical body from base to throat, feeding each elemental center with its own native frequency. The Siddha daily practice begins with this sequence every morning before any other mantra — because you cannot build a healthy practice on an unbalanced elemental foundation. LAM-VAM-RAM-YAM-HAM is the tuning of the instrument before the concert begins.`,
          },
        },
        {
          type: 'practice',
          practice: {
            title: 'The 5-Element Morning Activation — 15-Minute Protocol',
            steps: [
              'Immediately after waking and basic hygiene, sit in meditation posture. Place both hands on your knees, palms down (earth connection).',
              'Three deep breaths to establish presence.',
              'LAM × 9: Chant 9 rounds slowly. Between each round, feel the base of your spine and pelvic floor. On each round, consciously direct your awareness downward — into your feet, your legs, the physical density of your body.',
              'Move palms to belly. VAM × 9: Chant 9 rounds. Feel the sacral area, the lower abdomen. Between rounds, breathe into the belly.',
              'Move palms to solar plexus. RAM × 9: Chant 9 rounds. Feel the ignition of the navel center. Let each RAM build slightly more energy than the last.',
              'Move palms to heart center. YAM × 9: Chant 9 rounds. Soften the chest completely. Allow any armor around the heart to release. Let the Air element in.',
              'Move palms to throat. HAM × 9: Chant 9 rounds. Feel the throat opening like a clear channel. The vibration extends all the way up through the skull.',
              'SEQUENCE: Without pausing, chant LAM-VAM-RAM-YAM-HAM as one continuous ascending sequence, one per slow exhale. Do this 9 times in sequence. Each time, feel the energy moving up from the base of the spine to the throat.',
              'Sit in silence for 3 minutes. Feel the full body as an integrated elemental system — all 5 elements active, all 5 centers fed.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Agastya\'s Teaching — The Body as the Five Elements in Perfect Form',
          wisdomBody: `Agastya Muni taught that the human body is not made OF the five elements in the way that a table is made of wood. The human body IS the five elements achieving their most perfect, most conscious form of self-organization. Earth does not randomly arrange itself into bones and teeth — it achieves its highest expression there. Water does not randomly flow — it achieves its highest expression in blood, in tears, in the cerebrospinal fluid that bathes the brain. Fire does not merely burn — it achieves its highest expression in the metabolic fire of consciousness transforming food into thought. Air does not merely move — it achieves its highest expression in the breath that carries Prana, and in the love that moves between human beings. Space does not merely contain — it achieves its highest expression in the awareness that contains all experience without being any experience in particular. When you chant the five Bijas, you are not calling the elements into your body from outside. You are reminding the elements already present in your body what they are. This is Siddha medicine at its most fundamental: not adding something missing, but recognizing what was always already perfect.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l4-2-audio',
            title: 'Five Element Activation — LAM VAM RAM YAM HAM',
            description: 'Laila leads the complete 5-element morning practice. 9 rounds of each Bija with body-placement guidance, then 9 ascending sequences. 20 minutes.',
            duration: '20:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 4.3
    // ─────────────────────────────────────────────────────
    {
      id: 'l4-3',
      number: 3,
      title: 'The Chakra Bija Sequence',
      subtitle: 'LAM-VAM-RAM-YAM-HAM-AUM-Silence · Full Spectrum Activation',
      durationMin: 25,
      sections: [
        {
          type: 'intro',
          body: `Module 4 Lesson 4.2 covered the five elemental Bijas associated with chakras 1 through 5. But the complete Chakra Bija system has 7 stations — one for each major energy center. The 6th (Ajna) and 7th (Sahasrara) require separate treatment because they do not correspond to physical elements — they operate in a different dimensional register entirely. This lesson completes the full 7-chakra Bija map and delivers the complete activation sequence as a single coherent practice: the most comprehensive sound-healing protocol available without a formal initiation.`,
        },
        {
          type: 'teaching',
          heading: 'AUM for Ajna — The Third Eye and the Guru Principle',
          body: `The Ajna chakra — located between and slightly above the eyebrows, at the geometric center of the skull if projected inward — has the Bija AUM. Not a new Bija, but the same Pranava you learned in Module 1. The fact that AUM appears again here, at the 6th chakra, is not a repetition — it is a revelation.\n\nIn the chakra system, the first five chakras each have a unique elemental Bija because they operate in the dimension of the five elements — the manifest, physical world of earth, water, fire, air, and space. The 6th chakra — Ajna — is beyond elements. It is the chakra of direct perception, of the Guru principle, of the inner teacher. The Siddhas called it the chakra where the individual mind first directly perceives its connection with universal mind. It does not correspond to an element because it is already beyond the world those elements compose.\n\nAUM at Ajna is not chanted as the full A-U-M arc. It is chanted differently: as a very soft, almost inward OM — sometimes described as KSHAM in certain Tantric lineages. The technique is this: with eyes physically closed, direct the inner gaze upward and inward toward the Ajna point. Chant OM in Upamshu mode (barely whispered) or in pure Manasika (mentally). Feel the vibration not in the throat or chest, but specifically at the space between the eyebrows and its corresponding inner point at the pineal gland.\n\nThe pineal gland, at the center of the brain, is the physical correlate of the Ajna chakra. It is the most electromagnetically sensitive organ in the body, oriented like a compass toward the Earth's magnetic field. It produces melatonin, serotonin, and — in specific states — DMT. AUM vibration directed specifically to the Ajna point stimulates the pineal through bone conduction and is among the most consistently reported ways of producing what practitioners describe as "the third eye opening experience" — an inner light or luminosity perceived at the center of the visual field with eyes closed.`,
        },
        {
          type: 'teaching',
          heading: 'Silence for Sahasrara — The Crown and the End of Sound',
          body: `The 7th chakra — Sahasrara, the thousand-petaled lotus at the crown of the head — has no Bija. Not because none was assigned, but because Sahasrara is beyond sound. It is the dimension where the individual merges with the universal, where the Jiva (individual soul) recognizes itself as Atman (cosmic Self). And Atman, the Upanishads declare, is Brahman — the Absolute, which is beyond all sound, all form, all quality.\n\nThe "practice" for Sahasrara is not a technique at all. It is the complete cessation of all technique — the silence that remains after the last Bija of the sequence (AUM at Ajna) has dissolved. The practitioner does not chant anything for Sahasrara. They rest in the silence that is naturally present when all the other centers have been activated and brought into harmonic resonance. In that resonant silence, if the lower six chakras are genuinely balanced and open, an experience occurs that is not produced by any technique: a quality of expansion, of the boundary of the individual "self" becoming less solid, of the sense of being located inside a skull becoming less convincing. This is Sahasrara's first opening — not dramatic, not theatrical, but unmistakable to the practitioner who has not been told to expect it and who encounters it naturally.`,
        },
        {
          type: 'teaching',
          heading: 'The Resonance Cascade — Why the Sequence Matters',
          body: `The Chakra Bija sequence is not simply seven separate practices concatenated. When done correctly as a unified sequence, it produces what the Siddhas called a resonance cascade — a phenomenon in which the activation of each chakra, having received its native Bija frequency, amplifies the activation of the next. The physics analogy is harmonic resonance: when you tune a guitar string to perfect pitch, nearby strings of related pitch begin to vibrate sympathetically without being physically touched. The correctly tuned LAM-center sympathetically amplifies the VAM-center above it. The correctly tuned VAM-center amplifies the RAM-center above it. By the time the sequence reaches Ajna, the lower five centers are all vibrating in their natural frequencies — and the collective resonance field they generate makes the pineal activation of AUM-at-Ajna spontaneously deeper than it would be in isolation.\n\nThis is why the sequence must always ascend — from LAM to Silence — not be done in random order or reversed. The electromagnetic field of the body, like any electromagnetic system, responds to properly sequenced frequency sweeps in ways that no individual frequency alone can produce. The complete ascending Bija sequence is a scalar wave generator — building a coherent standing wave through the entire length of the Sushumna Nadi that, at its full activation, produces the state the tradition calls Kundalini Shaktipat — the spontaneous ascent of the life force through all centers simultaneously.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'The Complete 7-Chakra Bija Sequence — 40-Minute Practice',
            steps: [
              'Sit in padmasana or ardha-padmasana (cross-legged), spine erect. If needed, sit in a chair with feet flat on the floor — the vertical spine alignment is more important than the leg position.',
              'OPENING: Chant AUM 3 times at full Vaikhari. This establishes the overall field before you address specific centers.',
              'MULADHARA — LAM: Place both hands over the base of your spine (or on the thighs with awareness directed downward). Chant LAM 21 times. After each group of 7, pause for 2 breaths and feel the base of the spine.',
              'SVADHISTHANA — VAM: Hands to lower abdomen, below navel. Chant VAM 21 times. Feel the sacral center respond.',
              'MANIPURA — RAM: Hands to solar plexus. Chant RAM 21 times. Feel the ignition in the navel-fire center.',
              'ANAHATA — YAM: Both palms on the heart center. Chant YAM 21 times. Soften the chest. Allow any arising emotion — do not suppress it.',
              'VISHUDDHA — HAM: One hand on the throat, one on the heart. Chant HAM 21 times. Let the throat vibrate freely.',
              'AJNA — AUM (Upamshu): Lower both hands to your lap. Eyes directed up and in toward the space between the eyebrows. Whisper AUM 9 times, very softly, feeling the vibration at the pineal center. Then switch to Manasika — 12 more AUMs heard only internally.',
              'SAHASRARA — SILENCE: Release all technique. No mantra, no visualization, no intention. Simply sit. For 10 minutes, rest in the residue of the sequence. Do not try to have an experience. Simply be present in the silence.',
              'CLOSING: When you are ready, bring your palms together at the heart in Anjali Mudra. Bow forward. Then chant OM SHANTI SHANTI SHANTI 3 times to seal and balance the entire field.',
            ],
          },
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'लं वं रं यं हं ॐ ।',
            transliteration: 'LAM · VAM · RAM · YAM · HAM · AUM · SILENCE',
            translation: 'Earth · Water · Fire · Air · Space · Pure Awareness · The Absolute',
            body: `The complete 7-station Chakra Bija sequence. The period (।) at the end in Devanagari — the danda — represents the full stop, the completion. In the sequence, it represents the Silence after AUM — the natural completion of all sound into its source. This sequence is, in the Siddha understanding, a complete cosmological statement: it maps the journey of consciousness from its densest expression (Earth/body) through all intermediary stages to its most refined expression (pure awareness/Silence). Every morning, this sequence recapitulates the entire cosmological journey that took the universe billions of years — in 40 minutes.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Thirumoolar — Why the Chakras Are Not Wheels',
          wisdomBody: `The modern popular image of chakras as spinning wheels or colored discs is largely a 20th-century Western invention that has little relationship to the original Siddha and Tantric understanding. Thirumoolar in the Thirumantiram describes the chakras not as spinning discs but as Lotuses — flowers with varying numbers of petals that are either open (blooming) or closed (in bud) depending on the flow of Prana through the Sushumna Nadi. The petals of the lotus are the sounds — the syllables that the tradition assigns to each chakra (the Muladhara has 4 petals, each corresponding to a Sanskrit letter; the Ajna has 2 petals corresponding to HA and KSHAM; the Sahasrara has 1,000 petals corresponding to all the syllables of the Sanskrit language combined). The Bija mantra of each chakra is the sound that causes its petals to open — it is the sun to the flower. Without the Bija, the chakra remains in its natural closed or half-open state. With consistent Bija practice, it blooms fully. Thirumoolar writes: "When all the lotuses bloom simultaneously, the entire garden of the body is transformed. What was a place of suffering becomes a place of worship. What was limited becomes limitless. The body itself becomes the temple."`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l4-3-audio',
            title: 'Complete 7-Chakra Activation — Full 40-Minute Session',
            description: 'Kritagya & Laila lead the complete sequence together. Full guidance through all 7 stations including the 10-minute Sahasrara silence. Record this session as your primary weekly deep practice.',
            duration: '40:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 4.4
    // ─────────────────────────────────────────────────────
    {
      id: 'l4-4',
      number: 4,
      title: 'Combining Bijas — The Grammar of Power',
      subtitle: 'Compound Mantras · Sandhi Rules · Creating Your Own Mantra Field',
      durationMin: 20,
      sections: [
        {
          type: 'intro',
          body: `Individual Bija mantras are powerful. But the Tantric tradition goes further — it combines Bijas into compound sequences that produce multi-dimensional effects impossible to achieve with any single Bija alone. These compound mantras are not random collections. They follow a precise grammar — the grammar of cosmic intelligence — that determines which Bijas combine constructively and which combinations produce interference patterns that cancel or disturb the practitioner's field. This lesson teaches you to read that grammar and, ultimately, to compose your own mantric transmissions with intention and precision.`,
        },
        {
          type: 'teaching',
          heading: 'The Three Rules of Bija Combination',
          body: `The Mantra Shastra identifies three fundamental principles that govern how Bijas combine:\n\nRule 1 — Elemental Compatibility: Bijas are combined according to the elemental compatibility of their corresponding principles. The five elements in Ayurvedic and Siddha medicine have natural affinities: Earth and Water are compatible (water nourishes earth), Water and Air are compatible (air moves water), Fire and Space are compatible (fire opens space). Earth and Fire have a more complex relationship (fire can either warm or dry out earth). Earth and Air are the most energetically opposed of the five pairs. This elemental compatibility determines which Bijas reinforce each other when combined. LAM + VAM (Earth + Water) = a compound that grounds AND flows — good for emotional release in someone who is both stuck and dry. RAM + HAM (Fire + Space) = a compound that burns through limitation and opens awareness — very powerful, used with caution.

Rule 2 — The Sequence of Action: In a compound mantra, the Bija that appears first determines the direction and target of the mantra's action. The Bija that appears last determines the quality of its completion. Bijas in the middle modify and refine the action. The famous Tantric compound OM HREEM KLEEM CHAMUNDAYE VICHE is structured precisely this way: OM (Pranava — establishes cosmic context), HREEM (Shakti — the agent of action), KLEEM (attraction — the method), CHAMUNDAYE (the specific form of the Devi — the target), VICHE (cut/pierce — the quality of completion, the precision of the action). Every element has a grammatical function.\n\nRule 3 — The Sandhi (Junction) Principle: When two Bijas are placed in sequence, the junction between them has specific rules. The nasal resonance (Anusvara — the M at the end of most Bijas) must be completed before the next Bija begins. There is a pause — called the Sandhi — between Bijas in a compound that is as important as the sounds themselves. This pause is not silence in the sense of nothing happening. It is the moment when the field generated by the first Bija begins to merge with and prepare for the field of the second Bija. Rushing through the Sandhi collapses the compound mantra into a meaningless sequence of sounds.`,
        },
        {
          type: 'teaching',
          heading: 'The Great Tantric Compounds — Analysis and Application',
          body: `Three of the most widely used Bija compounds in the tradition serve as master examples:\n\nAIM HREEM KLEEM (ऐं ह्रीं क्लीं): This is the most fundamental Shakti compound — called the "Trika Bija" (triple seed) in the Sri Vidya tradition. AIM = Saraswati (wisdom, knowledge, discrimination). HREEM = Lakshmi (beauty, abundance, the heart's radiance). KLEEM = Kali (attraction, desire purified into devotion). Together they represent the complete Shakti — the three primary expressions of divine feminine power unified. This compound is chanted for overall Shakti awakening — the cultivation of wisdom (AIM), radiance (HREEM), and magnetic attraction (KLEEM) simultaneously. The sequence AIM → HREEM → KLEEM is an ascending arc: from the head (AIM/wisdom) to the heart (HREEM/love) to the belly (KLEEM/desire) — integrating the three centers of the upper body in one sound.\n\nHREEM SHREEM KLEEM (ह्रीं श्रीं क्लीं): Called the "Mahalakshmi Trikuta" — the three-peaked mantra of the great goddess of abundance. HREEM = the power that invokes. SHREEM = the quality of auspiciousness and prosperity. KLEEM = the magnetic attraction that draws toward the practitioner. This compound is used in prosperity practices — not for material greed, but for the cultivation of Lakshmi's true qualities: beauty, harmony, righteous wealth, and the quality of consciousness that generates abundance everywhere it goes.\n\nOM AIM HREEM KLEEM CHAMUNDAYE VICHE: The full Navarna Mantra (nine-syllabled) of Durga/Chamunda. This is one of the most powerful protective compounds in the tradition. Each syllable has a specific protective function — OM (universal), AIM (wisdom to see the enemy), HREEM (Shakti to face it), KLEEM (attraction of protection), CHAMUNDAYE (Chamunda — the fierce form of Devi who destroys the inner enemies of ego, anger, and illusion), VICHE (cut — the precision strike that severs the negative pattern at its root).`,
        },
        {
          type: 'teaching',
          heading: 'Creating Your Own Compound — A Practical Framework',
          body: `The advanced practitioner who has worked deeply with individual Bijas for at least one full Purascharana cycle (125,000 repetitions) of at least one Bija may begin to compose personal compound mantras. The framework for doing this is not arbitrary — it follows the same principles that govern all Tantric composition:\n\nStep 1 — Identify the intention: What quality or result are you working to cultivate? Be specific. Not "abundance" but "the confidence to charge appropriately for my work." Not "love" but "the capacity to receive care without deflecting it."\n\nStep 2 — Select the Bijas that correspond to the elements of your intention: Using the Bija reference (elemental Bijas, deity Bijas, force Bijas) identify the 2-4 Bijas that most directly address the components of your intention.\n\nStep 3 — Apply the sequence rule: The Bija that represents the initiating force goes first. The Bija that represents the quality of completion goes last. The Bija(s) in between represent the transformation.\n\nStep 4 — Test the compound in practice: Chant the compound 11 times in your next session. Observe: does it feel coherent? Does it feel like the Bijas are working together or against each other? The body knows immediately — a correctly assembled compound produces a sense of expansion and rightness. An incorrectly assembled compound produces subtle dissonance, sometimes experienced as mild discomfort or a sense of something being off.\n\nStep 5 — Do not publicize it: A personally composed mantra is not for sharing. It is intimate — calibrated to your specific karmic field and intention. Sharing it dilutes both the privacy and the personal charge.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'AIM HREEM KLEEM — Your First Compound Practice',
            steps: [
              'Sit in meditation posture. Close your eyes. Take 5 settling breaths.',
              'Spend 2 minutes in silence setting your intention for this session. The Trika Bija compound (AIM HREEM KLEEM) cultivates wisdom, radiance, and magnetic presence. Set the intention to activate these three qualities in yourself.',
              'Begin at Vaikhari. Chant AIM — HREEM — KLEEM as three distinct syllables, with a brief pause (the Sandhi) between each. The whole compound takes approximately 4-5 seconds at a measured pace. This is one repetition.',
              'Do 11 repetitions to establish the field. After the 11th, sit in silence for 30 seconds. Notice: is there a quality to the silence that was not there before you began?',
              'Continue for 27 total repetitions at Vaikhari. Then 27 at Upamshu (whispered). Then 9 at Manasika (mental only).',
              'After the final 9 mental repetitions: release all technique. Simply sit for 5 minutes in the field the compound has generated. You are not creating this field — you are recognizing it. AIM HREEM KLEEM is the field of integrated Shakti. It was always present. You have simply tuned your perception to it.',
              'CLOSING: Place palms over the heart. Feel the warmth. Chant OM SHANTI 3 times.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Bogar on Bija Composition — The Living Intelligence Within the Seed',
          wisdomBody: `Bogar Siddhar, the alchemist among the 18 Siddhas, taught that a correctly assembled Bija compound is not merely a phonetic formula — it is a living intelligence. He wrote: "When you place seed beside seed in the correct order, they do not merely add to each other — they converse. AIM speaks to HREEM and HREEM speaks to KLEEM and KLEEM speaks back to AIM, and in that conversation a new reality is born that none of the three could have created alone. This is the alchemy of Bija composition: the transformation of the base metals of ordinary consciousness into gold, through the precise arrangement of the seeds of cosmic intelligence. The alchemist does not create the gold — the gold was always in the metal. The alchemist creates the conditions for the metal to recognize its own golden nature." This teaching — that the compound mantra creates conditions for recognition rather than producing an external result — is the most important understanding for any practitioner who works with Bija combination.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l4-4-audio',
            title: 'AIM HREEM KLEEM — Trika Bija Practice Session',
            description: 'Kritagya & Laila chant the Trika Bija compound together: 27 Vaikhari, 27 Upamshu, 9 Manasika. Followed by 10-minute field integration silence.',
            duration: '35:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 4.5

const module5: Module = {
  id: 'module-05',
  number: 5,
  tier: 'free',
  title: 'Setting Up Your Sadhana Space',
  subtitle: 'Scalar Field Creation · Environmental Preparation · The Living Altar',
  description:
    'The Siddhas understood that the environment of practice is itself a technology. Direction, surface, timing, atmospheric conditions, materials, light, water, fire — every variable in the practice space contributes to or subtracts from the quality of the mantra field being generated. This module teaches you to design and consecrate a practice space that actively amplifies your Sadhana — turning ordinary domestic space into a living temple that holds and radiates the charge of every practice session conducted within it.',
  lessons: [

    // ─────────────────────────────────────────────────────
    // LESSON 5.1
    // ─────────────────────────────────────────────────────
    {
      id: 'l5-1',
      number: 1,
      title: 'Cardinal Directions and Their Mantra Assignments',
      subtitle: 'East for Solar · North for Shakti · The Cosmic Compass of Practice',
      durationMin: 16,
      sections: [
        {
          type: 'intro',
          body: `One of the first decisions a practitioner makes in establishing a Sadhana space is which direction to face. In most modern apartments and homes, this decision is made purely by room layout — the practitioner sits wherever there is floor space, facing whichever direction the wall happens to be. The Siddha and Vedic traditions consider this a significant oversight. Direction is not neutral. The Earth is a living electromagnetic system, and the four cardinal directions have specific energetic signatures that interact with mantra practice in measurable ways. Facing the correct direction for your specific practice type can be as significant as choosing the correct mantra.`,
        },
        {
          type: 'teaching',
          heading: 'The Science Behind Direction — Earth\'s Electromagnetic Architecture',
          body: `The Earth is a vast electromagnet — its iron core generates a magnetic field that extends tens of thousands of kilometers into space. This field is not uniform. It has a specific orientation (magnetic North and South poles), specific intensity variations by location, and specific directional properties that affect biological systems.\n\nResearch in bioelectromagnetics has established that the human body is sensitive to the Earth's magnetic field at extraordinarily low intensities. The pineal gland contains magnetite crystals — the same iron-based mineral that migrating birds use to navigate by the Earth's magnetic field. The human body's right-left symmetry is aligned developmentally with the Earth's magnetic field (this is why compass orientation affects the direction of cell division in developing embryos). The heart's electromagnetic field — the strongest in the body, measurable up to 3 meters from the body surface — aligns itself to the Earth's geomagnetic lines during deep meditation states.\n\nThe Vedic Vastu Shastra (the ancient Indian science of spatial design, cognate with Chinese Feng Shui) mapped these directional electromagnetic properties with extraordinary precision thousands of years before modern bioelectromagnetics. The specific directional assignments for mantra practice reflect genuine knowledge of how the Earth's electromagnetic field interacts with human physiology during states of heightened sensitivity — which is exactly what meditation and mantra practice create.`,
        },
        {
          type: 'teaching',
          heading: 'East — The Solar Direction for All General Practice',
          body: `East is the direction of sunrise — the direction from which the sun's electromagnetic radiation first reaches any given location on Earth each day. The Vedic tradition assigns East to Indra (king of the gods and ruler of solar energy), to the Brahmin (the priestly/spiritual principle), and to new beginnings, illumination, and the expansion of consciousness.\n\nFrom a physics perspective, facing East during morning practice means facing into the incoming solar radiation — positioning the body perpendicular to the sun's electromagnetic field as it first sweeps across the Earth's surface. The photoreceptors in the retina (even through closed eyelids) detect this incoming light and signal the pineal gland to begin the morning serotonin surge that naturally elevates mood, focus, and cognitive clarity. The Eastern direction in morning practice is therefore not merely symbolic — it harnesses the body's own solar-entrainment biology.\n\nFor Vedic practitioners, East is the default direction for all general mantra practice — Japa, Puja, Yantra meditation, and study. The Gayatri mantra (the solar transmission taught in Module 1, Lesson 1.6) is always chanted facing East, specifically toward the point on the horizon where the sun is rising. The Gayatri chanted facing East at sunrise creates what the tradition calls a Triveni — a triple convergence: the solar energy of the risen sun, the solar frequency of the mantra, and the practitioner's own solar intelligence (Buddhi) all aligned in the same direction simultaneously.`,
        },
        {
          type: 'teaching',
          heading: 'North — The Magnetic Direction for Shakti and Kundalini Work',
          body: `North is the direction of the Earth's magnetic North Pole — the direction toward which all compass needles point, the direction of the concentrated geomagnetic field. The Siddha tradition assigns North to Kubera (lord of wealth and the treasury of the cosmos), to Shakti practices, and to the movement of Prana upward through the Sushumna Nadi.\n\nFacing North aligns the practitioner's own electromagnetic field with the Earth's primary magnetic axis. For practices involving Kundalini activation, chakra work, and any mantra associated with Shakti (HREEM, KLEEM, SHREEM, KREEM, and all Devi mantras), North is the prescribed direction. The logic: the Earth's magnetic field runs from South Pole to North Pole in a specific pattern that, when the practitioner faces North, aligns with the body's own Sushumna channel running from the Muladhara at the base of the spine to the Sahasrara at the crown. Alignment of these two fields — the Earth's magnetic axis and the body's pranic axis — amplifies the upward movement of Prana during Kundalini-oriented practice.\n\nNorth is also the direction traditionally associated with Shiva (Pashupati — lord of the animals, the Siddha Shiva specifically) in the Siddha tradition. Thirumoolar always faced North for his deepest practices. The Chidambaram Nataraja temple in Tamil Nadu — the most sacred Siddha site in the world — is oriented so that the primary deity faces North. This is not architectural accident.`,
        },
        {
          type: 'teaching',
          heading: 'South · West · Northeast — The Complete Directional Map',
          body: `South is the direction of Yama — the lord of death, of dharmic reckoning, and of the ancestors. Facing South is prescribed for: ancestor rituals (Pitru Tarpana — offering water and prayers to deceased family members), certain Kali practices (the goddess associated with death and radical transformation), and times of deliberate confrontation with mortality as a spiritual practice. South is NOT recommended for daily Sadhana — its energetic signature is heavy, ponderous, and draws awareness downward rather than upward. The exception: practitioners doing deep grief work or shadow integration may intentionally face South temporarily.\n\nWest is associated with Varuna — the Vedic god of cosmic order, water, and the keeping of sacred vows. It is the direction of the setting sun, of completion and rest. West is prescribed for evening practices, for closing ceremonies, and for Japa done with the specific intention of releasing or completing something — the ending of a 40-day cycle, the release of a long-held grief, the completion of a commitment.\n\nNortheast (Ishanya) — the corner direction — is considered the most sacred of all directional positions in the Vastu tradition. It combines the solar energy of East with the magnetic energy of North in a diagonal that the Siddhas called the Guru direction — the direction from which divine grace (Anugraha) most readily descends. An altar placed in the Northeast corner of a room creates the maximum energetic benefit. Meditation facing Northeast combines the advantages of both East and North, making it particularly effective for practices that combine solar mantras with Shakti or Kundalini work.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Direction Mapping Your Space — The First Setup Step',
            steps: [
              'Download a compass app on your phone OR use a physical compass. Stand in the center of the room where you practice (or plan to practice).',
              'Identify true North, East, South, and West. Mark these with small pieces of tape on the floor or wall if helpful.',
              'Identify the Northeast corner — the corner between North and East walls. This is your primary altar location.',
              'Now sit facing East. Take 5 breaths. Notice the quality of your awareness. How does East feel?',
              'Rotate to face North. 5 breaths. Notice. How does North feel compared to East?',
              'Rotate to face South. 5 breaths. Most practitioners notice a subtle heaviness or downward pull facing South. This is not imagination.',
              'Rotate to face West. 5 breaths. Many notice a quality of completion or release.',
              'Return to face East or North — whichever felt most conducive. This will be your primary practice direction.',
              'In your Likhita Japa notebook, note which direction produced the clearest, most expansive quality of awareness for you. This becomes your default practice direction for all general Sadhana.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Siddha Teaching on Direction — Why the Cosmic Compass Is Internal',
          wisdomBody: `A senior Siddha practitioner in the Agastya lineage gave this teaching when asked about the importance of direction: "All these instructions about East and North and Northeast — they are training wheels. They are correct, and they work, and you should use them. But understand this: the realized Siddha has no preferred direction. For the Siddha who has recognized their own nature as consciousness, consciousness IS the East — it is always already facing the direction of its own light. The North IS consciousness — the magnetic field that all individual awareness is naturally drawn toward. The altar of the realized Siddha is not in the Northeast corner of their room. It is at the center of their chest, facing the infinite interior space of their own being. You begin with external directions because the internal compass is not yet reliable. When it becomes reliable — when you can sit in any direction and immediately access the same quality of inner stillness — you will understand that the directions were always pointing inward. The East was always your own illumined awareness. The North was always the magnetic pull of your own deepest nature."`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l5-1-audio',
            title: 'Direction Activation — Facing Each Direction with Kritagya',
            description: 'Kritagya guides you through a 5-minute practice in each of the four directions, with specific mantras for each. A complete directional attunement session for your new practice space.',
            duration: '25:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 5.2
    // ─────────────────────────────────────────────────────
    {
      id: 'l5-2',
      number: 2,
      title: 'The Kusha Mat and Sacred Surfaces',
      subtitle: 'Natural Fibers · Electromagnetic Boundaries · The Insulated Seat',
      durationMin: 15,
      sections: [
        {
          type: 'intro',
          body: `The surface on which you sit for meditation and mantra practice is not a comfort issue — it is an energetic engineering issue. The Siddha and Vedic traditions are among the most precise systems of knowledge on Earth in many domains, and on the question of the meditation seat they are unusually specific: the material of the seat, its thickness, whether it contacts the ground directly or is elevated, and whether it is made of living or processed material — all of these factors determine whether the practice space insulates, amplifies, or dissipates the pranic field generated during Sadhana.`,
        },
        {
          type: 'teaching',
          heading: 'Kusha Grass — The Gold Standard of Meditation Surfaces',
          body: `Kusha grass (Desmostachya bipinnata) is considered the most sacred of all grasses in the Vedic tradition. It appears in the Bhagavad Gita (Chapter 6, verse 11) as the prescribed seat for meditation: "In a clean spot, having established a firm seat neither too high nor too low, covered with cloth, deerskin, and kusha grass..." The sequence is specific — kusha grass as the base layer, deerskin or wool above it, cloth on top. This is not arbitrary tradition. Each layer has a specific energetic function.\n\nKusha grass has several documented physical properties that explain its traditional use. It is a natural insulator — its cellular structure contains air pockets that electrically insulate the meditator from the ground, preventing the discharge of the pranic field built during Sadhana. Think of it as spiritual grounding prevention: during meditation, you are accumulating a refined energetic charge. Contact with the Earth through a conductive surface (bare floor, synthetic mat) acts like a short circuit — the charge flows to ground rather than being retained in the practitioner's field. Kusha grass interrupts this drainage.\n\nKusha is also mildly piezoelectric — when compressed by the meditator's weight, it generates a tiny electrical signal. Over the course of an hour of Sadhana, with the body's weight continuously compressing the grass, this generates a gentle, low-level electromagnetic pulse that, according to Siddha understanding, activates the root chakra from below — complementing the LAM practice from above.\n\nIn modern practice, sourcing genuine Kusha grass can be difficult. The nearest functional equivalents in order of preference: a natural wool mat (wool has insulating properties similar to kusha), a cotton mat (adequate insulation, no piezoelectric property), a natural rubber mat with cotton cover (functional but less energetically ideal), and as a last resort, any natural-fiber mat (jute, bamboo, natural fiber cork). Synthetic materials — foam, plastic, PVC yoga mats — are the least appropriate because they conduct static electricity and discharge the pranic field during practice.`,
        },
        {
          type: 'teaching',
          heading: 'The Deerskin — What it Represents and Modern Alternatives',
          body: `The traditional Siddha meditation seat included a deerskin layer above the kusha grass. Deerskin has specific properties: it is a natural insulator with no static charge, it maintains consistent temperature (neither cold nor hot), and in the Vedic understanding, the deer as an animal carries qualities of gentleness, alertness, and sensitivity — qualities the practitioner wants in their meditative awareness.\n\nIn the modern world, using actual deerskin raises ethical questions that most practitioners will not want to navigate. The functional replacement is a square of natural wool felt — wool has the same insulating properties as deer hide, the same temperature-stability, and is equally effective as an electromagnetic boundary. A dense, natural wool blanket folded to create a firm, even surface of approximately 1-2 cm thickness serves the same function.\n\nWhat does NOT serve as a replacement: synthetic fleece, polyester blankets, or foam of any kind. These materials either conduct static, generate static during movement, or lack the specific organic matrix that creates the insulating boundary the tradition intends.`,
        },
        {
          type: 'teaching',
          heading: 'Height, Stability, and the Seat Geometry',
          body: `The Bhagavad Gita's instruction that the seat be "neither too high nor too low" reflects a genuine understanding of how the body's electromagnetic field interacts with the ground. A seat too close to the ground (directly on the floor) loses its insulating function — the body's field can still interact with the ground's field through the thin mat. A seat too high (a chair) elevates the body above the natural ground-energy that the practice is meant to work with — in high-chair sitting, the feet are off the ground and the lower chakras lack their natural earth-anchoring.\n\nThe ideal height is 8-15 cm (3-6 inches) above the ground — achievable with a folded blanket or meditation cushion (zafu) placed on top of the kusha/wool layers. At this height, the lower body is close enough to the Earth to receive its stabilizing influence, but elevated enough that the pranic field generated in the upper body is not continuously drained downward.\n\nStability matters equally. The Siddhas required a perfectly firm, non-wobbly seat for advanced practice because subtle internal perceptions (the Nada sounds, the sensations of Prana moving through the Nadis, the beginning states of Samadhi) are all extremely sensitive to physical movement and vibration. A seat that shifts or wobbles with every breath disrupts these subtle perceptions at the critical moments when they are becoming clear. Invest in a firm, high-quality meditation cushion as one of the most important pieces of practice equipment you own — it is used more frequently than almost any other tool in this curriculum.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Consecrating Your Meditation Seat — The One-Time Ceremony',
            steps: [
              'Assemble your seat: Kusha mat OR natural wool blanket as base layer. Natural wool felt square OR folded wool blanket as middle layer. Clean, natural-fiber cloth (cotton or silk) as top layer. Meditation cushion (zafu) centered on top.',
              'Place the assembled seat in your practice space facing your chosen direction (East or North from Lesson 5.1).',
              'Sit in your normal meditation posture on the new seat. Close your eyes. Take 5 deep breaths.',
              'Chant AUM 3 times, allowing the vibration to enter the seat and the space around it. With each AUM, consciously dedicate this seat to your practice.',
              'Speak this traditional Asana Mantra internally or aloud: "OM PRITHVI TVAYA DHRITAA LOKAA DEVI TVAM VISHNU DHRITAA SA MAAM DHAARAYA MAA BHAKTIM MAAM PUSHKALAM KURU" — "O Earth, you who support the worlds, you who are held by Vishnu, support me. Fill me with devotion. Make me complete." This is the traditional Sanskrit consecration of the meditation seat, addressing the Earth element directly.',
              'Remain seated in silence for 5 minutes. Feel the seat beneath you as now charged with intention and sacred function.',
              'IMPORTANT RULE going forward: once consecrated, your meditation seat is used ONLY for meditation and mantra practice. Never sit on it casually, to read, to watch screens, or for ordinary activities. The seat accumulates the charge of every practice session. Mixing ordinary activity with sacred practice use dilutes this accumulated charge and eventually turns the seat from an amplifier back into ordinary furniture.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'The Living Siddha Teaching on the Seat — Every Practice is Geological',
          wisdomBody: `A Siddha teacher in the Thirumoolar lineage gave this teaching about the meditation seat that has been passed down: "Every time you sit in your practice, you lay down one thin layer of sacred intention — the way the Earth lays down one thin layer of sediment in a year. One layer is invisible. But sit for ten years, and the layers become rock. Sit for twenty years, and the seat itself has become a Tirtha — a sacred crossing place. There are meditation seats in certain Indian ashrams that have not been moved for 200 years. Practitioners who sit on these seats for the first time report entering states of meditation in minutes that would normally take them an hour. The seat is not just a physical object. It has become a geological formation of concentrated practice energy. Your seat will become this, if you treat it with the same reverence you treat the mantra itself. Begin today."`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l5-2-audio',
            title: 'Asana Consecration — Seat Ceremony with Kritagya',
            description: 'Kritagya guides you through the complete seat consecration ceremony with the traditional Sanskrit mantras chanted in full. A one-time ceremony for your practice space.',
            duration: '15:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 5.3
    // ─────────────────────────────────────────────────────
    {
      id: 'l5-3',
      number: 3,
      title: 'Incense, Fire, and Atmospheric Alchemy',
      subtitle: 'Aromatic Compounds · Brainwave Science · The Fire of Transformation',
      durationMin: 18,
      sections: [
        {
          type: 'intro',
          body: `The use of incense, oil lamps, and fire in sacred practices predates written history in virtually every human culture. Archaeologists have found evidence of ritualized incense use in human settlements dating back 60,000 years. This universal, independent discovery — in cultures separated by oceans and millennia — is not superstition or primitive decoration. It reflects genuine observation of how specific atmospheric conditions alter consciousness. This lesson provides the scientific and spiritual explanation for why the atmosphere of your practice space matters and how to engineer it for maximum effect.`,
        },
        {
          type: 'teaching',
          heading: 'The Neurochemistry of Sacred Incense — Boswellic Acid and TRPV3',
          body: `Frankincense (Boswellia sacra) is the most universally sacred incense on Earth — used in ancient Egyptian, Jewish, Christian, Islamic, Hindu, and Buddhist sacred contexts. This universality has always pointed toward a genuine pharmacological effect, and in 2008, researchers at Johns Hopkins University and the Hebrew University identified the mechanism: Boswellic acid — the primary active compound in frankincense resin — activates the ion channel TRPV3 in the brain, producing anxiolytic effects (anxiety reduction) that are qualitatively different from pharmaceutical anxiolytics and without their side effects.\n\nMore significantly for our purposes: subsequent research found that burning frankincense increases the production of specific neurotransmitters associated with the emotional states that facilitate deep meditation — specifically reducing fear-based neural firing in the amygdala while increasing the availability of serotonin and GABA (the brain's primary calming neurotransmitter). The ancient priests who burned frankincense in temples were not merely making the space smell pleasant. They were engineering a specific neurochemical environment in the worship space — reducing the congregants' anxiety and fear responses, which are the primary obstacles to genuine devotion and genuine meditation.\n\nThe Siddha tradition used three primary incense compounds with documented neurological effects: Frankincense/Loban (Boswellia) for anxiety reduction and consciousness expansion, Sandalwood for cooling excess Pitta (heat/fire) in the system and deepening concentration, and Camphor for mental clarity and the purification of the atmospheric prana (camphor's antimicrobial properties literally purify the air as well as the energetic field).`,
        },
        {
          type: 'teaching',
          heading: 'Agarbatti vs Dhoop vs Resin — Types of Incense and Their Applications',
          body: `Not all incense is equal — and the type of incense, the method of burning, and the materials used dramatically affect both the neurological and energetic outcomes.\n\nAgarbatti (stick incense): The most common form. A bamboo stick coated with compressed incense material. The problem: most commercial stick incense contains synthetic fragrance compounds, artificial binders, and chemical accelerants that produce combustion byproducts more toxic than beneficial. The Siddha tradition specifically prohibits synthetic fragrances in sacred space — not for aesthetic reasons, but because synthetic aromatic compounds do not carry the same biologically active compounds as genuine plant resins and essential oils. When buying stick incense for Sadhana, look for: no bamboo core (the bamboo itself produces toxic combustion products), all-natural binding (honey, makko powder), single-plant or traditional blend compounds.\n\nDhoop (cone or paste incense burned on charcoal): The most potent and most traditional form. Pure resin or herb paste burned on a charcoal disc produces the highest concentration of active aromatic compounds per unit of combustion. This is the form used in all traditional Puja contexts. The strong smoke of dhoop is its feature, not a flaw — the tradition deliberately fills the sacred space with visible smoke, which has a specific visual effect on the meditator's visual cortex that facilitates closed-eye visualization.\n\nRaw resin (burned on charcoal or electric diffuser): Burning raw Frankincense tears, raw Sandalwood powder, or raw Myrrh on a charcoal disc produces the most chemically pure aromatic environment. The compounds are not mixed with any binder or carrier — it is pure plant medicine in vapor form. This is the most effective method for the neurochemical effects described above. An electric oil diffuser with pure essential oils is a cleaner modern alternative that produces similar neurochemical effects without combustion byproducts.\n\nFor the SQI practice space: begin each session by burning a small amount of Frankincense resin or natural Sandalwood incense. Light it before sitting down. Allow the aroma to establish itself in the space before you begin your first mantra. The olfactory system is the fastest sensory pathway to the limbic brain — the aroma reaches the neurological substrate of meditation faster than any sound or visual signal.`,
        },
        {
          type: 'teaching',
          heading: 'The Ghee Lamp — Light as Consciousness Technology',
          body: `The burning of a ghee lamp (Deepam or Diya) is one of the most ancient and universally practiced sacred acts. In the Siddha and Vedic traditions, the flame of a ghee lamp is not merely symbolic light — it is a genuine physical manifestation of Agni, the fire deity, and therefore a direct interface with the cosmic fire principle.\n\nGhee (clarified butter) as lamp fuel was not chosen arbitrarily. Burning ghee produces a specific spectrum of light and specific combustion byproducts that differ from any other fuel. Ghee combustion produces very little soot — the flame is exceptionally clean, producing primarily carbon dioxide and water vapor without the particulate matter that other natural fuels (mustard oil, coconut oil) produce in greater quantity. The flame of a ghee lamp is also uniquely steady — less responsive to subtle air currents than almost any other natural flame — which is why it was used as the object of Trataka (fixed-gaze meditation) in Siddha and yogic traditions. A flame that moves distracts; a flame that is nearly still becomes a perfect portal for single-pointed awareness.\n\nThe light spectrum of the ghee flame falls in the warm, golden range (approximately 2700-3000 Kelvin color temperature) — the same range as firelight that human eyes evolved to perceive over millions of years. This spectrum activates the retinal cone cells associated with warmth and safety while suppressing the blue-light photoreceptors that signal alertness and wakefulness. Meditating in the light of a ghee flame naturally shifts the practitioner's visual system toward the frequencies associated with deep rest and inner focus — without artificially suppressing consciousness the way pharmaceutical sleep aids do.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Creating the Atmospheric Field — Pre-Practice Space Preparation',
            steps: [
              'Establish a consistent pre-practice atmospheric preparation sequence. Do this every session before sitting — exactly the same sequence. The repetition trains the nervous system to recognize these stimuli as the signal that sacred practice is beginning, producing a Pavlovian deepening that increases in effectiveness over months.',
              'OPEN THE WINDOWS: Allow 2 minutes of fresh air into the space before closing for practice. Fresh air raises atmospheric oxygen and ionic content — both of which improve cognitive clarity and energy availability.',
              'LIGHT THE INCENSE: Place one stick or piece of resin incense in its holder in the Northeast corner (altar area). Light it, allow it to catch, and then blow out the flame — the incense should smolder, not burn with a flame. The smoke rises. Watch it for 30 seconds before sitting.',
              'LIGHT THE GHEE LAMP: Place your ghee lamp in the center of your altar space. Light it with a match (not a lighter — the tradition specifies that sacred fires are lit with natural materials, and most lighters use synthetic gas). Observe the flame for 30 seconds — allow your gaze to soften and the flame to become the entire field of your visual attention.',
              'SOUND THE SPACE: Strike a singing bowl OR chant AUM once at full Vaikhari into the room. This is not ceremonial — the sound wave physically clears stagnant air pockets and establishes the sonic baseline of the space.',
              'Now sit on your consecrated seat. The atmosphere has been prepared. You are entering a space that is now chemically, sonically, thermally, and energetically different from the ordinary room around it.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Thirumoolar on Fire — The Flame That Was Never Lit',
          wisdomBody: `Thirumantiram verse 1823: "The lamp that burns in the temple is lit by human hands. The lamp that burns in the heart was lit before the world began. The temple lamp goes out when the oil is finished. The heart lamp cannot go out because it has no oil — it burns on the fuel of pure awareness, which is inexhaustible. The wise practitioner lights the external lamp to be reminded of the internal one. The moment of lighting the ghee flame is the moment of remembering: there is already a light in here. It was here before I lit the lamp. It will be here after the lamp goes out. I am not creating light. I am recognizing it." This teaching transforms the act of lighting incense and lamps from a religious ritual into a genuine contemplative practice. Each time you light your practice space, practice this recognition: the light I am creating externally already exists internally. Let the external flame remind you of the internal one.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l5-3-audio',
            title: 'Space Preparation Ceremony — Complete Atmospheric Activation',
            description: 'Kritagya guides the full pre-practice space preparation: opening invocation, incense, lamp lighting, sound clearing, and the first 3 AUMs of the practice session. Use this at the beginning of any dedicated practice day.',
            duration: '15:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 5.4
    // ─────────────────────────────────────────────────────
    {
      id: 'l5-4',
      number: 4,
      title: 'Copper, Water, and Scalar Field Amplification',
      subtitle: 'The Kamandalu · Copper Science · Water as Pranic Memory',
      durationMin: 18,
      sections: [
        {
          type: 'intro',
          body: `Among all the physical tools of the Siddha practice space, two stand out for the depth of their scientifically verifiable properties: copper and water. These two substances appear in virtually every sacred tradition as primary instruments of purification, amplification, and the storage of spiritual energy. The Siddhas were not being poetic when they described copper vessels of water as pranic amplifiers. They were describing something real, documented by modern materials science and water memory research — though using a different vocabulary than modern science employs.`,
        },
        {
          type: 'teaching',
          heading: 'Copper — The Supreme Conductor of Prana',
          body: `Copper is the best natural conductor of electricity among commonly available metals — surpassed only by silver. Its atomic structure (29 electrons, with one loosely held outer electron) allows electrical charge to flow through it with minimal resistance. This makes copper the standard material for electrical wiring in all modern infrastructure. But the Siddhas knew this property thousands of years before the discovery of electrons — they knew it through direct observation of copper's effects on biological systems.\n\nAyurvedic medicine has used copper vessels for water storage for at least 5,000 years. Modern microbiology has confirmed why: copper ions released into water stored in copper vessels kill a broad spectrum of pathogenic bacteria, viruses, and fungi within 8 hours. A 2012 study published in the Journal of Health, Population and Nutrition found that water stored in copper vessels for 16 hours at room temperature showed no growth of pathogenic microorganisms including Salmonella, E. coli, and Cholera organisms — organisms that flourish in water stored in plastic, glass, or steel containers.\n\nBeyond antimicrobial properties, copper has documented effects on the human body through contact: wearing copper (particularly on the wrist, as in copper bracelets) has shown in several clinical studies to reduce inflammation markers and joint pain in arthritis. The mechanism is transdermal absorption of copper ions that participate in the synthesis of collagen and the superoxide dismutase enzyme (an important antioxidant). The Siddhas who prescribed copper mala beads, copper vessels for ritual water, and copper plates (Yantras engraved on copper) were working with genuine medicine — the physical and energetic properties of copper were not separable in Siddha understanding.`,
        },
        {
          type: 'teaching',
          heading: 'The Kamandalu — Water as Sacred Technology',
          body: `The Kamandalu (कमण्डलु) is the water vessel traditionally carried by Siddhas and Rishis — a small pot, often made of copper or a dried gourd, containing water that has been consecrated through Mantra and intention. In the iconography of every major Siddha and Rishi — Agastya, Thirumoolar, Patanjali, Durvasa, and many others — the Kamandalu appears as one of the two primary sacred instruments (the other being the staff/danda). It is not a canteen. It is a laboratory.\n\nThe water in the Kamandalu is charged with specific mantric frequencies through the practice of Mantra Jala — mantra water. The practitioner chants a specific mantra 108 times (or 27 times at minimum) while holding their palms over the water vessel, directing the sound toward the water. The water is then either consumed, used to sprinkle the practice space (Prokshana — purification by sprinkling), or used in Abhisheka (ritual bathing of a deity image or Yantra).\n\nDoes mantra-charged water have physically measurable properties different from uncharged water? The research of Dr. Masaru Emoto (though contested in its methodology, the directional findings have been partially replicated) suggested that water exposed to specific sound vibrations and intentions forms different crystalline structures when frozen. The Siddha tradition does not require this research to validate their use of Mantra Jala — they validated it through 5,000 years of observational clinical practice. But the convergence of modern research direction with ancient practice is noted.`,
        },
        {
          type: 'teaching',
          heading: 'Copper Vessels in Practice — How to Use Them',
          body: `The practical applications of copper in the Sadhana space:\n\nCopper Kamandalu or pitcher: Store your daily drinking water in a copper vessel overnight. Drink it in the morning before practice on an empty stomach. This is the most accessible and most immediately physiologically effective practice — the antimicrobial copper ions purify the digestive tract, and the morning Vata period (pre-dawn) is when the body most efficiently absorbs minerals.\n\nCopper plate Yantra: If you use a Sri Yantra or any other Yantra as a visual focus in your altar, copper is the traditional and most energetically effective material. Copper's conductivity creates a resonant field around the Yantra's geometric form that amplifies the mantric work done in its presence. Silicon (glass) and silver are the next most appropriate materials. Paper Yantras work but do not carry the same energetic amplification.\n\nCopper Mala: A mala of copper beads (sometimes alternated with Rudraksha) for specific Shakti and Tantric mantra practice. The continuous contact of the copper beads with the thumb generates a mild but consistent galvanic current — the skin's moisture acts as an electrolyte between the slightly different metals of the thumb's surface and the copper bead, creating the world's smallest battery with each touch. This galvanic current stimulates the acupressure point on the thumb associated with the Lung meridian (in Traditional Chinese Medicine) and with Prana (in Ayurveda) — the life force of the breath.\n\nCopper bowl for Abhisheka water: The bowl used for Abhisheka (sacred bathing of deity images with water, milk, honey, or other substances) should ideally be copper. The Abhisheka water, having been charged through contact with copper and the presence of the mantra chanted during the pouring, becomes itself a consecrated healing substance.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Mantra Jala — Creating Consecrated Practice Water',
            steps: [
              'Obtain a copper vessel — a copper cup, small pitcher, or Kamandalu. If copper is unavailable, use a clean glass vessel as a temporary measure.',
              'Fill the vessel with clean, filtered water. If using copper, fill it the evening before and allow the water to rest in the copper overnight (minimum 8 hours).',
              'The following morning: Place both palms around the vessel (not touching the water surface — hands cupped around the outside of the vessel). Close your eyes.',
              'Feel the vessel between your palms. Warm your hands around it for 30 seconds before beginning.',
              'Chant the Dhanvantari mantra (OM DHANVANTARAYE NAMAH) 27 times, directing the sound toward the water. Visualize healing golden light entering the water from your palms and from the sound of the mantra.',
              'OR: If working with a specific mantra for your 40-day practice, chant that mantra 27 times into the water instead.',
              'After the 27th repetition: bow to the water (literally lower your forehead toward the vessel — the act of bowing carries its own significance). Then drink the water slowly, with full awareness.',
              'The remaining consecrated water can be placed in a small bowl in your altar space. Before each practice session, take a small sip from this bowl as the first act of the session.',
            ],
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Agastya on Copper and Water — The Two Vessels',
          wisdomBody: `In the Agastya Samhita (one of the texts attributed to Agastya Muni, its authenticity contested by scholars but its teachings genuine within the living tradition), there is a remarkable passage: "The body is a copper vessel. The Prana is the water within it. The soul is the lamp that floats on that water. If the vessel is contaminated, the water is contaminated, and the lamp flickers and nearly goes out. If the vessel is purified — through mantra, through copper utensils, through the Ganges of right practice — the water becomes clear, and the lamp burns without motion. This is the meaning of Deha Shuddhi — purification of the body. It is not merely the purification of the body's physical tissues. It is the purification of the conductor, so that the pranic current flows without resistance, and the light of the soul becomes fully visible in the lamp of the face." The daily practice of drinking copper-stored water and creating Mantra Jala is therefore not a supplementary ritual — it is a core Deha Shuddhi practice. You are purifying the vessel so that what it carries can be seen.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l5-4-audio',
            title: 'Mantra Jala Ceremony — Creating Sacred Water',
            description: 'Laila guides the complete Mantra Jala practice. Includes the Dhanvantari mantra 27 times, the consecration prayer, and the morning water-drinking ritual. 15 minutes.',
            duration: '15:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 5.5
    // ─────────────────────────────────────────────────────
    {
      id: 'l5-5',
      number: 5,
      title: 'Creating Your Living Altar',
      subtitle: 'Yantra-Mantra-Tantra Resonance · The Sacred Geometry of Your Space',
      durationMin: 22,
      sections: [
        {
          type: 'intro',
          body: `An altar is not a decoration. It is not a display case for spiritual tourism objects collected from various traditions. In the Siddha understanding, an altar is a physical technology — a precisely designed field generator that maintains a specific energetic frequency in a given space, actively amplifying the practice of anyone who works within it. The difference between a well-designed Siddha altar and a shelf of random spiritual objects is like the difference between a resonant acoustic chamber and a room with no acoustic design. Both contain the same air. But what the sound does in each space is completely different.`,
        },
        {
          type: 'teaching',
          heading: 'The Three Levels of Altar — Choose Your Current Level',
          body: `The Siddha tradition does not prescribe a single altar design for all practitioners. It recognizes that different practitioners are at different stages of practice, have different spatial constraints, and are working with different lineage traditions. The teaching on altars therefore offers three levels — from minimum viable to complete — and recommends that practitioners begin at the level appropriate to their current stage:\n\nLevel 1 — The Minimal Altar: A single cloth (ideally red, yellow, or white natural fiber — silk, cotton, or wool) laid in the Northeast corner of your room. On this cloth: one image or statue of your Ishta Devata (chosen deity or teacher — it can be a printed photograph), one ghee lamp or beeswax candle, and one small copper or clay vessel of water. This is sufficient. Many of the greatest Siddhas practiced with less.\n\nLevel 2 — The Working Altar: The minimal altar plus: a Yantra of your primary deity or the Sri Yantra (the universal Yantra of the Divine Feminine, appropriate for any practitioner), your mala (placed respectfully on the altar when not in use), fresh flowers (changed every three days — wilted flowers on an altar are counterproductive, carrying the Pranic field of decay), incense holder, a small bowl of raw rice or sesame seeds (representing the offering of the Earth element), and a small mirror (representing the reflective nature of consciousness).\n\nLevel 3 — The Siddha Altar: The working altar plus: a complete set of ritual implements (Puja thali with bell, conch shell, Achamana spoon, Arghya vessel), copper Yantra plates for each of your primary mantras, a dedicated mala bag (gomukhi) for your practice mala, a collection of sacred substances (turmeric, kumkum, sandalwood paste, sacred ash/Vibhuti), photographs of all masters in your lineage, and — if you have received formal initiation — the items specific to your initiated practice.`,
        },
        {
          type: 'teaching',
          heading: 'The Geometry of Altar Arrangement — Why Placement Matters',
          body: `The placement of objects on the altar follows the same sacred geometry that governs the design of temples. In the Hindu temple, the primary deity always occupies the center, with subsidiary deities arranged at specific angular relationships that create a mandala — a sacred geometric field. The same principle applies to the personal altar.\n\nCenter: The Yantra or primary image/statue. This is the focal point — the energetic anchor of the entire altar field. Everything else is arranged in relationship to this center.\n\nRight of center (from the practitioner's perspective facing the altar): Masculine principle items — Shiva lingam, images of male deities, the fire (ghee lamp). The right side is the solar, masculine channel.\n\nLeft of center: Feminine principle items — Devi images, the water vessel, fresh flowers. The left side is the lunar, feminine channel.\n\nCenter-front (nearest to the practitioner): The offering items — rice, flowers, fruits. These are placed where the practitioner can easily offer them during Puja.\n\nBehind the Yantra or image (furthest from the practitioner): Nothing — the space behind the primary image should be clear or have only a background cloth. Objects cluttering behind the primary image create what Vastu calls "shadow energy" — patterns that interfere with the clean transmission from the image's center.\n\nThe height of the altar: The primary image or Yantra should be at approximately eye level when the practitioner is seated. Kneeling before a deity image placed at floor level is a gesture of humility but it is not energetically optimal for prolonged Sadhana — the upward gaze strains the neck and prevents the long, effortless sessions that deep practice requires.`,
        },
        {
          type: 'teaching',
          heading: 'The Charging Cycle — How the Altar Builds Power Over Time',
          body: `An altar does not begin at full power. Like a mala that must be used for thousands of Japas before it carries a significant charge, an altar accumulates its charge through consistent, sincere practice over time. The first week, it is an arrangement of objects. After one year of daily practice in front of it, it is something else entirely — a field generator with its own presence, capable of inducing specific states of awareness in anyone who enters the space with appropriate receptivity.\n\nThe charging mechanism is straightforward: every mantra chanted in front of the altar charges it. Every offering made sincerely charges it. Every Puja performed — even the simplest waving of incense and lighting of a lamp — charges it. Every tear of genuine devotion that falls in front of it charges it. Over months and years, the objects of the altar become saturated with this charge and begin to radiate it — the way a capacitor charged over time can subsequently power something much larger than its initial input would suggest.\n\nThis is why the tradition says: never move your altar unless absolutely necessary. A permanent altar accumulates charge in the space itself — not just in the objects. The floor beneath it, the wall behind it, the air in that specific corner — all become part of the charged field. Moving the altar resets this accumulated environmental charge to zero. If you must move your altar (due to relocation or renovation), perform a closing ceremony first: offer the fruits and flowers to flowing water, thank the lineage, and consciously close the field. Then perform a new opening ceremony at the new location.`,
        },
        {
          type: 'practice',
          practice: {
            title: 'Establishing Your Level 1 or 2 Altar — Step by Step',
            steps: [
              'CHOOSE YOUR LOCATION: Northeast corner of your practice room. Clear this area completely. Clean the floor with water to which a few drops of rose water or Ganga water (or any natural holy water) have been added.',
              'LAY THE ALTAR CLOTH: Place a natural-fiber cloth in your chosen color. Red for Shakti practices, white for Shiva or Advaita practices, yellow for Vishnu or Saraswati practices, saffron/orange for Guru practices. If uncertain, white is appropriate for any tradition.',
              'PLACE THE CENTER: Your primary image or Yantra goes at the center. This should be your Ishta Devata — the form of the divine that you are most genuinely drawn to. Not the most impressive image you own, not the one given to you by someone else — the one you actually want to see every morning.',
              'ADD THE FLAME: Place the ghee lamp to the right of center. Fill it with ghee. Place a cotton wick. The lamp is lit at the beginning of every practice session and extinguished at its end.',
              'ADD THE WATER: Place your copper water vessel to the left of center. Refill it with fresh consecrated water every morning before practice.',
              'ADD FRESH FLOWERS: Place whatever flowers are available and in good condition directly in front of the image. Even a single fresh flower is sufficient. Wilted flowers must be removed and replaced.',
              'OPENING CEREMONY: Sit before the newly established altar. Light the incense and lamp. Chant AUM 3 times. Speak your intention for this altar aloud: why you are creating it, which lineage you are aligning with, what practice it will support. Bow to the altar three times. The altar is now established.',
            ],
          },
        },
        {
          type: 'mantra',
          mantra: {
            devanagari: 'ॐ आं ह्रीं क्रों\nयं रं लं वं\nशं षं सं हं\nकं खं गं घं',
            transliteration: 'OM AIM HREEM KROM\n(Altar Invocation Seed Sequence)',
            translation: 'The invocation of all four directions, all five elements, and all three Shaktis into the altar space',
            body: `This compound is chanted once at the establishment of a new altar and once at the beginning of each new 40-day practice cycle to re-consecrate the space. It is not for daily use — it is a high-voltage activation mantra used only for space consecration. AIM (Saraswati — wisdom descends into this space), HREEM (Shakti — the living energy of the Goddess is present here), KROM (Kali's strike — all negative patterns in this space are dissolved). The letters that follow (YAM, RAM, LAM, VAM, SHAM, SSHAM, SAM, HAM, KAM, KHAM, GAM, GHAM) are the Bija seeds of the 12 solar months, inviting the full cycle of cosmic time to support the practice conducted in this space.`,
          },
        },
        {
          type: 'wisdom',
          wisdomTitle: 'Bogar on the Altar — The Temple Is the Body, the Body Is the Temple',
          wisdomBody: `Bogar Siddhar, whose alchemical understanding was perhaps the most sophisticated of all the 18 Siddhas, gave a teaching that cuts through any potential confusion about altar practice: "I have seen practitioners spend three hours arranging their altar and three minutes sitting in front of it. I have seen practitioners spend three minutes creating a simple space and three hours genuinely practicing. Of these two, the second is the Siddha and the first is the decorator. The altar does not create the practice. The practice creates the altar — gradually, over years, by the accumulation of genuine Sadhana. An altar in the Northeast corner of your room, without daily genuine practice in front of it, is furniture. The same simple cloth and one lamp, in front of which you have sat every morning for five years in genuine Sadhana — this is the holiest place on Earth at this moment. The sacredness is not in the objects. It is in the practitioner. The altar simply reflects back what you bring to it." Use the altar. But do not let the altar use you — do not let the preparation of the space become a substitute for the practice itself.`,
        },
        {
          type: 'audio',
          audio: {
            id: 'l5-5-audio',
            title: 'Altar Consecration — Opening Ceremony with Kritagya & Laila',
            description: 'The complete altar opening ceremony. Performed together by Kritagya & Laila at their own altar. Follow along at yours simultaneously. Includes all invocation mantras, the AIM HREEM KROM consecration, and the first Puja sequence.',
            duration: '25:00',
            url: '',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────
    // LESSON 5.6

export const ACADEMY_CURRICULUM: Module[] = [
  module1,
  module2,
  module3,
  module4,
  module5,
  // module6–24 — append as files arrive
];

export const TIER_CONFIG = {
  free: {
    label: 'Nada Bija',
    price: 'Free',
    color: '#6B7280',
    modules: [1, 2, 3, 4, 5, 6],
  },
  prana: {
    label: 'Prana-Flow',
    price: '€19/mo',
    color: '#10B981',
    modules: [7, 8, 9, 10, 11, 12],
  },
  siddha: {
    label: 'Siddha-Quantum',
    price: '€45/mo',
    color: '#D4AF37',
    modules: [13, 14, 15, 16, 17, 18],
  },
  akasha: {
    label: 'Akasha-Infinity',
    price: '€1,111',
    color: '#A78BFA',
    modules: [19, 20, 21, 22, 23, 24],
  },
};
