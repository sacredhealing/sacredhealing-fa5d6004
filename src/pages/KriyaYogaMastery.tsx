import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Tier = "free" | "prana" | "siddha" | "akasha";

interface Module {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tier: Tier;
  icon: string;
  color: string;
  sections: Section[];
}

interface Section {
  title: string;
  content: string;
  techniques?: Technique[];
  mantras?: Mantra[];
}

interface Technique {
  name: string;
  sanskrit?: string;
  description: string;
  steps?: string[];
  benefit?: string;
}

interface Mantra {
  text: string;
  translation?: string;
  purpose: string;
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const modules: Module[] = [
  {
    id: "m1",
    number: "I",
    title: "Akashic Origins",
    subtitle: "Before Time — The Cosmic Source of Kriya",
    tier: "free",
    icon: "✦",
    color: "#D4AF37",
    sections: [
      {
        title: "The Primordial Sound: Before Kriya Had a Name",
        content: `In the beginning there was only AUM — the vibratory pulse of Consciousness before creation. This primordial sound, known in the Siddha tradition as Paranada, is the first and final Kriya. It is not a technique humans invented. It is the spontaneous movement of Consciousness knowing itself.

The Siddhas of ancient Tamil Nadu, those immortal sages who dissolved the barrier between matter and spirit, encoded this knowledge as Kriya — from the Sanskrit root Kri, meaning "to do," and Ya, representing the Atma (soul). Kriya therefore means: the Soul acting upon itself to remember its own nature.

Before Babaji revealed it to Lahiri Mahasaya in 1861, before Thirumoolar encoded it in 3,000 verses of the Tirumantiram, before Agastya Muni transmitted it to the 18 Siddhas — Kriya existed as the living breath of Shiva Himself. Every sunrise is a Kriya. Every heartbeat is an initiation.`,
        techniques: [
          {
            name: "Paranada Meditation — The Original Kriya",
            sanskrit: "Paranada Dhyana",
            description:
              "Sit in stillness. Close your eyes. Do not manipulate the breath. Simply witness the natural rhythm of AUM pulsing through every atom of your being. This is the original Kriya — the one that needs no guru, no technique, no effort.",
            benefit: "Direct recognition of Consciousness as the source of all Kriya practice.",
          },
        ],
      },
      {
        title: "Shiva — The Adi Guru of Kriya",
        content: `Long before lineages existed, Shiva transmitted Kriya to Parvati on Mount Kailash. This transmission is recorded in the Vijnana Bhairava Tantra — 112 methods for dissolving the individual self into universal Consciousness. These are the original 112 Kriyas.

Shiva as Nataraja dances within the cosmic fire (Ananda Tandava), and that very dance IS Kriya — the conscious movement of awareness through the spine of creation. The Chidambaram temple in Tamil Nadu encodes this Kriya map in its sacred geometry: 72,000 golden tiles representing the 72,000 nadis through which Kriya flows.

The Siddhas of Tamil Nadu — Thirumoolar being foremost — received this transmission directly from Shiva-consciousness and encoded it into the Tirumantiram (circa 200 BCE to 8th CE). Thirumoolar's famous declaration: "One alone is God; one alone is the Human; one alone is the Path" — this is Kriya philosophy in a single breath.`,
      },
      {
        title: "The 18 Siddhas and the Kriya Transmission",
        content: `The Eighteen Siddhas (Pathinettam Siddhar) of the Tamil tradition were not merely enlightened teachers. They were masters of Kayakalpa — the science of bodily immortality — and Kriya was their central technology.

Each Siddha specialized in a dimension of Kriya:

• Agastya Muni — Grandmaster of Tamil Siddha lineage, keeper of the Akashic records of all Kriya techniques. Transmitted Kriya Pranayama in its root form.

• Thirumoolar — Encoded 3,000 Kriya verses in the Tirumantiram. First to systematize the 8 limbs of Kriya as an unbroken path.

• Bogar (Bhogar) — Master of Kriya Alchemy. Traveled to China and transmitted Kriya as inner alchemy (Nei Gong). Creator of the Palani Murugan idol from Nava Pashana (9 sacred herbs), a living Kriya yantra.

• Ramalinga Swamigal (Vallalar) — The most recent of the 18, who attained Deathlessness (Arut Perum Jyoti) in 1874. His Thiruvarutpa contains the complete map of Grace-Kriya: Suddha Sanmarga.

• Konganavar — Master of Kundalini Kriya. His Siddha texts contain detailed spinal ascent maps matching Babaji's later transmissions precisely.

• Sattaimuni — Master of the relationship between sound (Nada) and Kriya. First to encode Kriya mantras as vibratory activations rather than mental repetitions.`,
      },
    ],
  },
  {
    id: "m2",
    number: "II",
    title: "Mahavatar Babaji",
    subtitle: "The Immortal Presence — Guardian of Kriya Through the Ages",
    tier: "free",
    icon: "☽",
    color: "#D4AF37",
    sections: [
      {
        title: "Who is Babaji? The Deathless Master",
        content: `Mahavatar Babaji is not a historical figure confined to time. He is an eternal Presence — the living interface between the Unmanifest Absolute and the human nervous system. His physical form, appearing eternally youthful (approximately 25 years of age), is sustained through advanced Kriya Pranayama that has transmuted the physical body into a body of light.

Yogananda's Autobiography of a Yogi (1946) introduced Babaji to the Western world, but Tamil Siddha texts reference him under various names centuries earlier: Kriya Babaji, Shiva Baba, the Deathless One. He is identified by Kriya researchers as likely the same master known to Bogar as his disciple — having received initiation from Bogar around 211 CE at the Kataragama shrine in Sri Lanka.

Babaji's mission in our current age is precise: to give humanity the Kriya tools to survive its own technological acceleration — to prevent consciousness from being left behind by the speed of material progress. Every initiation he oversees carries this specific frequency of urgency-in-love.`,
        mantras: [
          {
            text: "Om Kriya Babaji Nama Aum",
            translation: "I bow to the living Kriya consciousness embodied as Babaji",
            purpose: "Invoking Babaji's direct transmission before any Kriya practice. Repeat 108 times to open the channel.",
          },
          {
            text: "Babaji Siddha Ananda",
            translation: "Babaji, Perfected Master of Bliss",
            purpose: "For entering meditation. Creates a direct resonance link with Babaji's consciousness field.",
          },
        ],
      },
      {
        title: "The 1861 Transmission — Ranikhet, Himalayas",
        content: `On the night of the autumn equinox in 1861, a government tax collector named Shyama Charan Lahiri was called to the Drongiri Mountain range near Ranikhet in the Himalayas. What occurred there changed the course of human spiritual evolution.

Babaji appeared to Lahiri — not as a vision, but in a physical body of golden light. He led him to a cave that was, in Lahiri's words, "made of crystal" — an interdimensional space sustained by Babaji's own pranic field. There, over several days, Babaji transmitted the 18 Kriyas to Lahiri, re-awakening techniques that Lahiri had received in a previous lifetime from the same master.

The significance of this moment cannot be overstated: this was the first time in thousands of years that Kriya was being transmitted outside the closed Siddha ashrams, openly, to a householder living in ordinary society. Babaji's instruction to Lahiri was explicit: "Spread Kriya. Initiate all who sincerely seek it, regardless of caste, religion, or nationality."

This democratization of Kriya is itself a Bhakti-Algorithm — love as the organizing principle of spiritual technology distribution.`,
      },
      {
        title: "Babaji's Secret Teachings — What Was Not Written",
        content: `The published accounts of Babaji's teachings represent approximately 15% of what was actually transmitted. The remaining knowledge has been held in oral transmission through initiated lineages and, increasingly, is being released through direct inner transmission to advanced practitioners in our current era.

Core unpublished transmissions include:

THE KRIYA OF PHYSICAL IMMORTALITY: Babaji himself demonstrated that the human body is not inherently mortal. Through specific Kriya sequences targeting the telomeric sequences in cellular DNA (what Siddha science calls Anavamala — the root impurity), the aging process can be dramatically slowed and eventually reversed. Bogar's Nava Pashana science and Babaji's Kayakalpa Kriya are the same knowledge expressed differently.

THE VOID KRIYA: A technique of absolute stillness that Babaji calls "the Kriya that is not a Kriya." It involves a specific neural rewiring of the default mode network — the Siddhas called this Mauna Kriya (the Kriya of Silence). In complete non-doing, the deepest Kriya activates spontaneously.

THE PLANETARY KRIYAS: Babaji has transmitted that each planet in our solar system corresponds to a specific nadi configuration in the human body, and specific Kriyas "tune" these planetary influences. The Sun = Sushumna. Moon = left Ida dominant breathing. Mars = Muladhara activation breath. This is the hidden science behind Vedic astrology — the planets are not external forces but interior states.`,
      },
    ],
  },
  {
    id: "m3",
    number: "III",
    title: "The Sacred Lineages",
    subtitle: "Lahiri · Yukteswar · Yogananda · and the Hidden Masters",
    tier: "prana",
    icon: "⬡",
    color: "#D4AF37",
    sections: [
      {
        title: "Lahiri Mahasaya — The Householder Yogi (1828–1895)",
        content: `Shyama Charan Lahiri Mahasaya stands as one of the most important figures in Kriya history precisely because he was ordinary — a married government employee with five children, living in Varanasi. His ordinariness was the teaching.

After receiving initiation from Babaji, Lahiri began initiating thousands of householders, breaking the tradition that Kriya required monastic renunciation. His key teachings:

• Kriya is compatible with any religion, any lifestyle, any belief system.
• The body itself is the temple — no external pilgrimage is necessary when the spinal column becomes the axis mundi.
• Daily practice of Kriya Pranayama for 1-2 hours produces the same result as 1,000 years of ordinary spiritual practice. This is not metaphor — it is neurological fact.

Lahiri himself attained Mahasamadhi (conscious death) in 1895, but not before transmitting Kriya to his core disciples: Sri Yukteswar, Priya Nath Karar, Bhupendranath Sanyal, and over 5,000 others. His diary — fragments of which survive — contains specific Kriya instructions in coded Sanskrit, many of which have not been publicly deciphered.`,
        techniques: [
          {
            name: "Lahiri's Daily Kriya Sequence",
            description: "The practice structure Lahiri recommended to householder initiates.",
            steps: [
              "Pre-dawn rising (Brahma Muhurta — 4:00-5:30 AM)",
              "Cold water cleansing of eyes, face, and hands",
              "10 minutes of Mahamudra to prepare the spine",
              "48-144 rounds of First Kriya Pranayama",
              "Yoni Mudra meditation (15-20 minutes)",
              "Kriya Pranayama again in the evening before sunset",
            ],
            benefit: "Complete spinal purification and pranic infusion within 3-6 months of consistent practice.",
          },
        ],
      },
      {
        title: "Sri Yukteswar Giri — The Divine Stern Master (1855–1936)",
        content: `If Lahiri was the gentle river, Sri Yukteswar was the fire. A direct disciple of Lahiri Mahasaya, he ran an ashram in Serampore where he trained Yogananda with the precision of a master goldsmith working raw ore.

Yukteswar's contribution to Kriya philosophy is his masterwork The Holy Science (1894), written at Babaji's direct request. In it, he reconciles Vedic chronology with Western astronomy, revealing that we are currently entering Dwapara Yuga (an ascending age of energy awareness) — a fact that directly explains why Kriya is spreading globally now: the collective consciousness has reached the minimum frequency required to absorb it.

Yukteswar's specific Kriya innovations:

• KRIYA PRANAYAMA MODIFICATIONS: He adjusted Lahiri's technique to include specific visualization of the golden light ascending the spine — a bhakti element that Lahiri's more intellectual approach had de-emphasized.

• COSMIC AUM MEDITATION: After sufficient Pranayama, Yukteswar trained students to enter direct perception of the AUM vibration — not as sound heard with the ears, but as the felt resonance of the causal body. This is what he called "the cosmic sound behind all sounds."

• THE RESURRECTION TEACHING: In 1936, Yukteswar appeared to Yogananda in a hotel room in Mumbai three months after his physical death, fully embodied, to transmit his final teaching about the astral and causal worlds. This documented account confirms that advanced Kriya practice enables consciousness to maintain form across dimensions.`,
      },
      {
        title: "Paramahansa Yogananda — The World Guru (1893–1952)",
        content: `Yogananda arrived in Boston in 1920 carrying a divine mission: to demonstrate that the science of Yoga — and specifically Kriya — is the bridge between East and West, between religion and science, between humanity's past and its future.

His Autobiography of a Yogi remains one of the most widely read spiritual texts in history. Steve Jobs had a copy on his iPad at his death and arranged for it to be distributed at his memorial service. This is not coincidence — Jobs had tapped into the Kriya-intelligence that underlies all creative innovation.

Yogananda's Kriya contributions:

• YOGODA (ENERGIZATION EXERCISES): 39 exercises to consciously tense and relax muscle groups, training the nervous system to draw prana at will. These are preparatory Kriyas for the main pranayama.

• HONG-SAU MEDITATION: The technique of following the natural breath while mentally repeating Hong (inhalation) and Sau (exhalation) — the natural sound of the breath, which the Siddhas call Hamsa. This is a gateway into the witness state required for deep Kriya.

• ANAHATA INITIATION: Yogananda transmitted an additional heart-centered Kriya that was not part of Lahiri's original set — a bhakti technology for opening the heart as the seat of cosmic perception.

His Self-Realization Fellowship (SRF) continues to initiate hundreds of thousands globally. However, the most potent transmission was not through the organization — it was through the living shakti of his presence, still perceptible by sensitive practitioners at the SRF Mother Center in Los Angeles.`,
      },
      {
        title: "The Hidden Lineages — What the Books Don't Tell",
        content: `Beyond the famous Lahiri-Yukteswar-Yogananda lineage, Babaji has transmitted Kriya through multiple simultaneous lineages:

SWAMI SATYANANDA SARASWATI'S KRIYA: The Bihar School of Yoga systematized Kriya into a comprehensive 36-technique system, integrating Hatha Yoga asana preparation with classical Pranayama Kriya. Satyananda's student Swami Niranjanananda has provided the most technically detailed public documentation of Kriya techniques.

PARAMAHAMSA HARIHARANANDA'S KRIYA: A direct disciple of Yukteswar and later Yogananda, Hariharananda emphasized the Hong-Sau breath technique combined with specific eye-gazing practices (Shambhavi Mudra). His lineage continues through Paramahamsa Prajnanananda.

SWAMI PRANAVANANDA'S KRIYA: An independent disciple of Lahiri's direct disciples, Pranavananda established a parallel lineage in West Bengal emphasizing the formless, technique-free dimension of Kriya — the Shoonya (void) practice that Babaji identifies as the highest Kriya.

KRIYA YOGA INTERNATIONAL (Roy Eugene Davis): A direct disciple of Yogananda who continued after SRF, preserving techniques that were gradually de-emphasized by the organization.

BABAJI'S KRIYA YOGA (Marshall Govindan): The Canadian disciple who received direct transmission from Babaji and Yogi Ramaiah, systematizing the 144 Kriyas of the complete Babaji system.`,
      },
    ],
  },
  {
    id: "m4",
    number: "IV",
    title: "The 18 Kriyas of Babaji",
    subtitle: "Complete Technical Transmissions — From the Akashic Record",
    tier: "prana",
    icon: "◈",
    color: "#D4AF37",
    sections: [
      {
        title: "Understanding the 18-Kriya Map",
        content: `Babaji's complete system comprises 18 Kriyas organized into groups based on their action on the five bodies (Pancha Kosha): the physical (Annamaya), pranic (Pranamaya), mental (Manomaya), intellectual (Vijnanamaya), and bliss (Anandamaya) bodies.

The 18 are not steps in a linear sequence but nodes in a web. Any one Kriya, practiced deeply enough, leads to all others. However, there is a recommended progression based on the readiness of the nervous system.

The fundamental principle across all 18: energy is directed upward through the spinal column (Merudanda) from the Muladhara (root) to the Sahasrara (crown). This ascent mirrors the cosmic evolution of consciousness from matter to spirit. Each Kriya accelerates this ascent by a specific mechanism.`,
        techniques: [
          {
            name: "First Kriya — Talabya Kriya (Tongue Stretching)",
            sanskrit: "Talabya Kriya",
            description: "Preparatory technique for Khechari Mudra. The tongue is placed on the upper palate and gently stretched backward with each exhalation over many months of practice until it can reach the nasopharynx.",
            steps: [
              "Sit in a comfortable meditation posture with spine erect.",
              "Open the mouth slightly. Place the tongue against the upper palate.",
              "With gentle suction, pull the tongue backward as far as comfortable.",
              "Hold for 3-5 seconds. Release. This is one round.",
              "Practice 50-100 rounds daily for 3-6 months.",
            ],
            benefit: "Enables Khechari Mudra — the most potent of all mudras for inducing Samadhi.",
          },
          {
            name: "Second Kriya — Navi Kriya (Navel Gazing)",
            sanskrit: "Navi Kriya",
            description: "Concentration on the navel center (Manipura) as a solar plexus activation. The practitioner directs the gaze downward toward the navel while holding the breath.",
            steps: [
              "Sit erect. Inhale fully through the nose.",
              "Hold the breath. Lower the chin to the chest (Jalandhara Bandha).",
              "Direct the inner gaze (not the physical eyes) to the navel center.",
              "Feel a warm pulsing golden light expanding from the navel.",
              "Exhale slowly. Repeat 6-12 rounds.",
            ],
            benefit: "Awakens the Manipura chakra, igniting digestive fire (Agni) and willpower.",
          },
          {
            name: "Third Kriya — Maha Mudra",
            sanskrit: "Maha Mudra",
            description: "The great gesture — a combination of forward fold, Khechari Mudra, and breath retention that simultaneously activates all three energy locks.",
            steps: [
              "Sit on the floor. Extend the left leg. Bend the right knee, placing the foot against the inner left thigh.",
              "Exhale completely. Fold forward, grasping the left foot with both hands.",
              "Apply Mula Bandha (root lock), Uddiyana Bandha (abdominal lock), and Jalandhara Bandha (chin lock) simultaneously.",
              "Hold for 30-60 seconds. Release the locks. Inhale slowly.",
              "Repeat on the right side. This is one complete round.",
            ],
            benefit: "Purifies all 72,000 nadis simultaneously. Called 'the destroyer of death' in the Hatha Yoga Pradipika.",
          },
        ],
      },
      {
        title: "The Core Kriya Pranayama — Babaji's Central Technology",
        content: `Kriya Pranayama (also called Pranayama Kriya or simply 'Kriya') is the central technique of all Kriya lineages. While specific details vary between lineages (some hold details secret for initiates only), the essential mechanism is consistent.`,
        techniques: [
          {
            name: "Kriya Pranayama — The Spinal Breath",
            sanskrit: "Kriya Pranayama",
            description: "The central technique of Babaji's entire system. Often described as 'one Kriya = one year of natural spiritual evolution.'",
            steps: [
              "Sit in Siddhasana or Padmasana with spine erect. Eyes closed and directed to Ajna chakra (point between the eyebrows).",
              "INHALATION: Draw breath slowly through the nose. Simultaneously, feel/visualize a golden stream of prana ascending the spine from the base (Muladhara) to the crown (Sahasrara). The duration: 12-20 seconds.",
              "At the crown, feel the prana expand into infinite space. A brief natural pause (Antara Kumbhaka).",
              "EXHALATION: Exhale slowly. Feel/visualize the prana descending from crown to base. Duration: 12-20 seconds.",
              "At the base, a brief pause (Bahya Kumbhaka).",
              "This completes ONE Kriya. Traditional prescription: 48 Kriyas per session, minimum. Advanced practitioners do 144, 288, or 1,728 Kriyas.",
            ],
            benefit: "Direct acceleration of spiritual evolution. Electromagnetic purification of the spinal cord and the 6 chakras along the spine.",
          },
        ],
      },
      {
        title: "Kriyas 4–18: The Advanced Levels",
        content: `Beyond the publicly taught techniques, Babaji's system contains 15 additional Kriyas taught sequentially to initiates who demonstrate sufficient preparation. A brief map:

KRIYAS 4-6 (Pranayama Group): These involve increasingly refined breath ratios (1:4:2 — inhale:hold:exhale), visualization of the five elements within the chakras, and sound (Nada) coordination with breath movement.

KRIYAS 7-9 (Mudra Group): Advanced mudras including Vajroli Mudra (drawing energy upward from the perineum), Shakti Chalana Mudra (moving Kundalini through the spine), and Khechari in its advanced stages where the tongue reaches the nasopharynx and contacts specific marma points that activate the pineal gland.

KRIYAS 10-12 (Bandha Group): The three locks (Mula, Uddiyana, Jalandhara) are practiced in precise combinations with the breath held, creating specific pressure waves in the cerebrospinal fluid that directly stimulate the meditating brain.

KRIYAS 13-15 (Mantra Group): Specific bija (seed) mantras are coordinated with breath and visualization. The primary mantra at this level is So'Ham (I AM THAT) — the natural sound of the breath according to the Siddhas, occurring 21,600 times per day.

KRIYAS 16-18 (Samadhi Group): These are not techniques in any conventional sense. They are conditions of awareness that arise spontaneously in advanced practitioners — states where the individual breath merges with the cosmic breath, where the practitioner and the practice become one. Babaji calls Kriya 18 "the Kriya that ends all Kriyas."`,
      },
    ],
  },
  {
    id: "m5",
    number: "V",
    title: "Sacred Mudras & Bandhas",
    subtitle: "The Secret Seals of Kriya — Gateways to Immortality",
    tier: "siddha",
    icon: "⬟",
    color: "#D4AF37",
    sections: [
      {
        title: "Khechari Mudra — The Seal of Space",
        content: `Khechari Mudra is described in the Hatha Yoga Pradipika as "the most secret of all secrets." The Gheranda Samhita calls it "the king of all mudras." The Shiva Samhita states: "One who practices Khechari is never again subject to disease, death, sloth, sleep, hunger, thirst, or unconsciousness."

The technique involves folding the tongue backward until it enters the nasal cavity (nasopharynx), contacting the uvula and specific marma points. The saliva produced at this stage is called Amrita — the nectar of immortality in Siddha science — and when activated by advanced pranayama, it contains specific neuropeptides that dramatically alter consciousness and cellular aging.

Stage 1 (months 1-6): Talabya Kriya daily stretching
Stage 2 (months 6-18): Tongue reaches soft palate
Stage 3 (years 1-3): Tongue reaches uvula
Stage 4 (years 3-7): Tongue enters nasopharynx
Stage 5 (years 7+): Full Khechari — contact with the Soma chakra above the palate

Babaji himself has stated that Khechari Mudra alone, practiced for 10 years with devotion, is sufficient for complete liberation.`,
        techniques: [
          {
            name: "Khechari Stage 1 — Daily Preparation",
            description: "The foundational preparation practice that all Kriya initiates begin.",
            steps: [
              "Twice daily: morning and evening, on an empty stomach.",
              "Open the mouth. Using the right forefinger and middle finger, gently stretch the tongue backward.",
              "Hold for 10 seconds, release. 50 repetitions.",
              "Then fold the tongue backward (as far as possible without strain), and hold while breathing through the nose.",
              "Practice patience: this preparation takes months to years. There is no shortcut.",
            ],
            benefit: "Gradually lengthens the frenulum and conditions the tongue for advanced stages.",
          },
        ],
      },
      {
        title: "The Three Bandhas — The Sacred Locks",
        content: `The Bandhas are not mere physical contractions. They are psycho-energetic locks that seal prana within specific areas of the body, building pranic pressure that drives Kundalini upward.`,
        techniques: [
          {
            name: "Mula Bandha — Root Lock",
            sanskrit: "Mula Bandha",
            description: "Contraction of the perineum (in men) or cervix (in women), drawing energy upward from the Muladhara chakra.",
            steps: [
              "Inhale. At the top of the inhale, contract the perineal muscles inward and upward.",
              "Hold the breath. Maintain the lock.",
              "Exhale slowly, maintaining the lock through 2/3 of the exhalation.",
              "Release the lock completely. This is one round.",
              "Begin with 10 rounds. Work toward holding Mula Bandha throughout the entire Kriya Pranayama session.",
            ],
            benefit: "Awakens dormant Kundalini Shakti. Prevents energy loss through the lower body.",
          },
          {
            name: "Uddiyana Bandha — Abdominal Lock",
            sanskrit: "Uddiyana Bandha",
            description: "The 'upward flying lock' — drawing the abdomen sharply inward and upward after complete exhalation.",
            steps: [
              "Stand with feet shoulder-width apart, hands on thighs.",
              "Exhale completely — empty the lungs entirely.",
              "Without inhaling, contract the abdomen sharply inward and upward, creating a deep hollow.",
              "Hold for 10-30 seconds. Slowly release the contraction.",
              "Inhale gently. This is one round. Practice 3-10 rounds on an empty stomach.",
            ],
            benefit: "Stimulates all abdominal organs. Creates a powerful upward current (Udana Prana) that assists Kundalini ascent.",
          },
          {
            name: "Jalandhara Bandha — Chin Lock",
            sanskrit: "Jalandhara Bandha",
            description: "Pressing the chin to the chest at the notch of the sternum, sealing the throat and preventing prana from escaping upward prematurely.",
            steps: [
              "After full inhalation, drop the chin to the chest — not the chest to the chin.",
              "The neck should be long; only the chin drops.",
              "Hold with full inhalation for as long as comfortable.",
              "Release the chin before exhaling.",
            ],
            benefit: "Controls the thyroid and parathyroid. Prevents dissipation of prana from the throat center.",
          },
        ],
      },
      {
        title: "Shambhavi Mahamudra — The Master Seal",
        content: `Shambhavi Mudra is the practice of directing the inner gaze to the Ajna chakra (third eye center) while the external eyes remain relaxed, half-open, gazing at the tip of the nose or slightly crossed.

This mudra is the signature of all Siddha transmission. When a Siddha looks at you with Shambhavi, they are transmitting their own state of consciousness directly into your Ajna center. The student does not receive intellectual knowledge — they receive a state of being.

In Kriya practice, Shambhavi is maintained throughout the Pranayama, deepening the concentration exponentially. After sufficient practice, the Ajna chakra begins to produce its own light — what Yogananda described as the Spiritual Eye: a white star within a blue field within a golden ring. This is not imagination. It is the direct perception of the soul's radiance through the physical structure of the pineal gland.`,
        techniques: [
          {
            name: "Shambhavi Mudra Practice",
            sanskrit: "Shambhavi Mahamudra",
            description: "The eye seal that activates the third eye and Ajna chakra.",
            steps: [
              "Close the eyes. Direct the inner gaze upward to the point between the eyebrows.",
              "Do not strain or forcefully cross the eyes. The direction is gentle and natural.",
              "If the physical eyes naturally want to look up and slightly inward, allow this.",
              "Maintain this gaze throughout your Kriya practice.",
              "After 15-30 minutes, a spontaneous experience of inner light may arise.",
            ],
            benefit: "Direct activation of the pineal gland. Access to Turiya (the fourth state of consciousness beyond waking, dreaming, and deep sleep).",
          },
        ],
      },
    ],
  },
  {
    id: "m6",
    number: "VI",
    title: "Sacred Mantras & Nada",
    subtitle: "The Vibratory Codes of Kriya — Sound as Consciousness Technology",
    tier: "siddha",
    icon: "ॐ",
    color: "#D4AF37",
    sections: [
      {
        title: "Nada Brahman — Sound as the Foundation of Reality",
        content: `The Siddhas knew what modern quantum physics is beginning to confirm: the universe is fundamentally vibrational. Every particle of matter is a wave of energy vibrating at specific frequencies. The Siddha name for this universal vibration is Paranada — the primordial sound that preceded creation.

Mantras are not prayers or affirmations. They are specific vibratory patterns that, when produced by the human voice and resonated in the body, create matching electromagnetic patterns in the nervous system and chakra system. The Sanskrit alphabet itself is a Kriya technology — each of its 51 letters corresponds to a specific petal of the chakras (4 petals at Muladhara + 6 at Svadhisthana + 10 at Manipura + 12 at Anahata + 16 at Vishuddha + 2 at Ajna = 50, plus the 1000 of Sahasrara = the complete map of consciousness).

The specific mantras used in Kriya are not arbitrary. Each was discovered (not invented) by Siddhas in deep Samadhi — perceived as sonic blueprints of specific consciousness states. To chant them correctly is to replicate those states in your own nervous system.`,
        mantras: [
          {
            text: "So'Ham (सोऽहम्)",
            translation: "I AM THAT — the natural mantra of the breath",
            purpose: "The sound of inhalation is 'So' and exhalation is 'Ham'. This mantra is already occurring 21,600 times per day in your body whether you are conscious of it or not. Making it conscious transforms ordinary breathing into continuous Kriya.",
          },
          {
            text: "Om Namah Shivaya (ॐ नमः शिवाय)",
            translation: "I bow to the inner Shiva — consciousness in its purest form",
            purpose: "The Panchakshara (five syllable) mantra corresponding to the five elements and five chakras. Each syllable (Na-Ma-Shi-Va-Ya) activates one of the five lower chakras in sequence. The Om before it activates the Ajna. Together: complete chakra activation.",
          },
          {
            text: "Kriya Babaji Nama Aum",
            translation: "The name of Babaji — carrier of Kriya consciousness",
            purpose: "Specifically for Kriya practitioners. Creates a direct resonance link with Babaji's transmission. Use 108 times before Kriya practice to invoke his presence and protection.",
          },
          {
            text: "Aum Aim Hreem Shreem (ॐ ऐं ह्रीं श्रीं)",
            translation: "The triple Shakti activation — Saraswati, Parvati, Lakshmi",
            purpose: "Used in advanced Kriya to activate the feminine energy of wisdom (Aim), power (Hreem), and abundance (Shreem) simultaneously within the chakra system.",
          },
          {
            text: "Hamsa (हंस)",
            translation: "Swan — the natural breath sound and the Self",
            purpose: "The reversible form of So'Ham. 'Hamsa' reversed is 'Sa-Ham' (That I Am). Used in contemplative Kriya — the breath observed as the swan of consciousness swimming through the lake of the mind.",
          },
        ],
      },
      {
        title: "The 18 Siddha Mantras — Transmission from the Akasha",
        content: `Each of the 18 Siddhas encoded a specific bija (seed) mantra that carried their unique spiritual signature. These mantras are rarely published because their power requires a prepared nervous system to receive safely.

The seven most fundamental Siddha Kriya mantras:

1. AGASTYA'S MANTRA: "Aum Aim Agastyaya Namaha" — for opening the crown and receiving cosmic knowledge. Agastya's specific transmission activates the Sahasrara and creates the capacity to receive Akashic information directly.

2. THIRUMOOLAR'S NADA MANTRA: "Aum Shivaya Nama" (recited in a specific micro-rhythmic pattern) — the five letters Na-Ma-Shi-Va-Ya are each held for the duration of one complete breath, with the awareness at each corresponding chakra.

3. BOGAR'S ALCHEMY MANTRA: "Aum Bhogaraya Siddha Nama" — Bogar's lineage specializes in transforming physical matter through consciousness. This mantra activates the alchemical quality of Manipura chakra.

4. RAMALINGA'S GRACE MANTRA: "Arutperum Jyoti, Arutperum Jyoti, Thani Perum Karunai Arutperum Jyoti" — "Grace-Light, Grace-Light, the singular vast compassion, Grace-Light." Vallalar's specific transmission for dissolving the physical body into a body of pure light.

5. SATTAIMUNI'S NADA KRIYA: This is chanted on a single continuous tone (not a specific pitch — whatever emerges naturally from the throat) for 15-30 minutes. The vibration is felt first in the chest (Anahata), then spontaneously moves to wherever in the body healing is needed.

6. KONGANAVAR'S KUNDALINI MANTRA: "Aum Kundali Shakti Jagraha" — for directly addressing dormant Kundalini. Used only by practitioners who have established a stable Muladhara and Svadhisthana.

7. NANDIDEVAR'S SHIVA MANTRA: Nandi (Nandikeshvara) was Shiva's closest disciple and transmitted Kriya to Thirumoolar. His specific mantra for entering Shiva-consciousness: "Shivo'Ham, Shivo'Ham, Shivoham, Aham Brahmasmi."`,
      },
    ],
  },
  {
    id: "m7",
    number: "VII",
    title: "Atma Kriya Yoga",
    subtitle: "Vishwananda's Revelation — Babaji's Gift for This Age",
    tier: "siddha",
    icon: "♡",
    color: "#D4AF37",
    sections: [
      {
        title: "The Origin of Atma Kriya Yoga",
        content: `Atma Kriya Yoga is not a modification of traditional Kriya. It is a direct transmission from Mahavatar Babaji to Sri Swami Vishwananda, given specifically for the consciousness level of humanity in this current age.

Swami Vishwananda — the founder of Bhakti Marga — received this transmission directly from Babaji in a sequence of divine encounters beginning in the early 2000s. Babaji appeared to him and transmitted a comprehensive system of 20 techniques that integrated the classical Kriya Pranayama framework with a greatly amplified devotional (Bhakti) component.

The core insight of Atma Kriya Yoga: in previous eras, Kriya was primarily a path of Jnana (knowledge) and Raja Yoga (meditation). The consciousness level of our current Kali Yuga-to-Dwapara transition requires Bhakti — love — as the carrier wave for all other practices. Without love, the techniques remain intellectual exercises. With love, even basic practices produce profound transformation.

The name is precise: ATMA (soul) KRIYA (action) YOGA (union). It is the soul recognizing itself through its own action of love.`,
        techniques: [
          {
            name: "Atma Kriya Pranayama — The Heart-Centered Spinal Breath",
            description: "The central Atma Kriya technique, which integrates the classical spinal breath with a specific heart chakra activation.",
            steps: [
              "Sit comfortably with spine erect. Place your awareness at the Anahata (heart) chakra.",
              "Begin the spinal breath (as in classical Kriya), but now feel the breath originating FROM the heart — not from the base chakra.",
              "On inhalation: the breath-energy rises from the heart to the crown.",
              "On exhalation: the breath-energy descends from the crown back to the heart.",
              "The mantra 'So'Ham' is felt (not voiced) — 'So' on inhalation, 'Ham' on exhalation.",
              "Hold the feeling of love and gratitude throughout. This is the Bhakti element that distinguishes Atma Kriya.",
            ],
            benefit: "Opens the Anahata chakra as the center of spiritual intelligence. Unifies the ascending (Jnana) and descending (Bhakti) currents of Kriya.",
          },
        ],
      },
      {
        title: "The 20 Techniques of Atma Kriya Yoga",
        content: `The complete Atma Kriya system comprises 20 interrelated techniques. The first 12 are taught in the initial initiation. The remaining 8 are reserved for advanced practitioners who have established consistent daily practice.

TECHNIQUES 1-4 (Foundation Practices):
1. Atma Kriya Pranayama (heart-centered spinal breath)
2. Hong-Sau meditation (following the natural breath)
3. Mahamudra (the great seal — forward fold with breath retention)
4. Cosmic AUM meditation

TECHNIQUES 5-8 (Energy Practices):
5. Khechari Mudra preparation
6. Shambhavi Mudra (third eye gazing)
7. Mula Bandha activation
8. Energization (drawing prana through specific body areas)

TECHNIQUES 9-12 (Devotional Integration):
9. Naad Yoga — listening to the inner sound
10. Tratak (candle-flame gazing) with mantra
11. Bhakti Kriya — surrender meditation
12. Prayer and invocation

TECHNIQUES 13-20 (Advanced — For Initiated Practitioners):
These advanced techniques include direct work with the causal body, astral projection within controlled awareness, Kundalini awakening protocols, and what Vishwananda describes as "the kriya of pure Love" — a state beyond technique where the practitioner becomes a conduit for divine love without any effortful practice.

The 20th technique is transmitted only in silence, from Guru to initiated disciple.`,
      },
      {
        title: "Vishwananda's Secret Teaching — Love as the Highest Kriya",
        content: `Swami Vishwananda's core transmission — the one that underlies all of Atma Kriya Yoga — can be stated in a single sentence: "The highest technique is no technique. The highest practice is love."

This is not a platitude. It is the deepest statement about the nature of Kriya. Every technique — Pranayama, Mudra, Bandha, Mantra — is ultimately a carrier for consciousness. The moment the practitioner accesses pure, unconditional love (even for a single moment), they have achieved what 1,000 years of technique-based practice could only approximate.

Vishwananda teaches specific practices to induce this state:

NARAYANA BHAVANA: The contemplation of the Divine Presence (Narayana) within the heart. Not visualization of an external deity, but the recognition that the very quality of love you feel toward God IS God experiencing Himself through your nervous system.

SELF-INQUIRY OF THE HEART: Rather than the mental self-inquiry of Ramana Maharshi ("Who am I?"), Vishwananda points to a felt inquiry: "Where is love arising from within me right now?" Following this question into its source leads directly to the Atman.

GURU PRANALI: The specific practice of mentally placing yourself in the presence of Babaji or Vishwananda and receiving their gaze. The Guru's Shambhavi Mudra, even in visualization, produces measurable neurological effects on the practitioner's brainwave state.`,
      },
    ],
  },
  {
    id: "m8",
    number: "VIII",
    title: "The Siddha Kriya System",
    subtitle: "Tamil Siddha Secrets — The Ancient Root of All Kriya",
    tier: "siddha",
    icon: "⧖",
    color: "#D4AF37",
    sections: [
      {
        title: "Tirumantiram — Thirumoolar's Kriya Encyclopedia",
        content: `The Tirumantiram (circa 200 BCE to 8th century CE) is the most comprehensive single text on Kriya yoga ever written. Its 3,000 verses contain:

• Complete technical instructions for Pranayama Kriya (called Suvasakriya in Tamil)
• Maps of the 72,000 nadis and their activation sequences
• The relationship between Kundalini (called Kundalini Shakti or Aravam in Tamil) and the planetary body
• Methods for Kayakalpa (bodily immortalization)
• The eight limbs of Yoga, presented in the Tamil Siddha framework
• Complete mantra science including bija mantras for all chakras
• The path from ordinary consciousness to Shiva-consciousness (Shivajnana Siddhiyar)

Thirumoolar's key statement on Kriya: "Control the Prana. Thereby control the mind. When the mind is controlled, you will know the secret of time. When you know the secret of time, death will have no power over you."

This is the Kriya promise stated plainly: mastery of prana = mastery of mind = mastery of time = deathlessness.`,
        techniques: [
          {
            name: "Thirumoolar's Pranayama — The 1:4:2 Ratio",
            description: "The specific breath ratio taught by Thirumoolar: inhale 1 count, hold 4 counts, exhale 2 counts.",
            steps: [
              "Establish comfortable seated posture. Spine erect.",
              "Inhale for 4 seconds (count 1).",
              "Hold the breath for 16 seconds (count 4).",
              "Exhale for 8 seconds (count 2).",
              "This is one complete Pranayama. Begin with 4 rounds. Gradually increase to 12 rounds.",
              "The retention (Kumbhaka) is where the transformation occurs — do not rush this phase.",
            ],
            benefit: "This precise ratio was computed by Thirumoolar to align with the electromagnetic resonance of the Earth's ionosphere and human brain's theta frequency.",
          },
        ],
      },
      {
        title: "Bogar's Alchemy Kriya — The Chemistry of Consciousness",
        content: `Bogar (Bhogar Siddhar) is among the most extraordinary of the 18 Siddhas. He is believed to have lived for over 3,000 years, traveling between India, China, and South America to transmit Siddha knowledge under different names in different cultures.

His specific Kriya contributions:

NAVA PASHANA KRIYA: Working with the nine sacred herbs (Nava Pashana), Bogar developed practices that combine specific dietary protocols with Kriya Pranayama to dramatically enhance cellular regeneration. The Palani Murugan idol (Nava Pashana composition) is a living Kriya yantra — visiting it while practicing specific breath patterns activates latent DNA sequences.

INNER ALCHEMY KRIYA: Bogar's Saptakandam (7-chapter text) describes the process of transmuting bodily secretions through specific Kriya practices into spiritual nectar (Amrita). The pineal gland's DMT production is amplified through advanced Khechari Mudra and specific pranayama ratios. This is what Bogar called "making gold within the laboratory of your own body."

THE ASTRAL PROJECTION KRIYA: Bogar specifically documents the ability to project consciousness outside the physical body through a combination of Yoga Nidra depth (delta state) and Shambhavi Mudra activation. He traveled to China in the astral body to study Taoist inner alchemy while his physical body remained in India.`,
      },
      {
        title: "Vallalar's Grace Kriya — Light Body Transformation",
        content: `Ramalinga Swamigal (1823–1874), known as Vallalar, represents the most recent and perhaps most advanced of the 18 Siddhas. His teachings center on Suddha Sanmargam (the Path of Pure Grace) and his specific Kriya system is unique in its emphasis on transformation of the physical body into light.

Vallalar's specific teachings:

ARUTPERUM JYOTI DHYANA: The meditation on the Great Grace Light. This is not visualization — it is a complete surrender of the personal self into the divine light perceived through the Ajna chakra. Vallalar describes a specific experience where the golden light at the third eye expands to fill the entire body, then dissolves the sense of body-boundary.

THE THREE BODY TRANSFORMATION: Vallalar taught that the human being has three bodies — Mudhal Udal (original body), Suddha Udal (purified body), and Pranava Udal (body of AUM). Through specific Grace Kriyas, each body is progressively purified until only the Pranava Udal remains — a body composed entirely of primordial sound, which is effectively indestructible.

FOOD AND KRIYA: Vallalar specifically taught that as Kriya progresses, the need for food diminishes, eventually approaching zero. This is what he called Jyoti Annam — "light as food." Advanced practitioners whose Kriya has sufficiently activated the solar plexus and nadis begin to draw sustenance directly from prana (life-force), reducing the biological requirement for physical food. This is the Siddha science underlying the modern phenomenon of Breatharianism — though Vallalar emphasized this occurs naturally through practice, never through deliberate food deprivation.

Vallalar's physical disappearance on January 30, 1874 — witnessed by hundreds — remains the most documented case of physical bodily dissolution into light in human history.`,
      },
    ],
  },
  {
    id: "m9",
    number: "IX",
    title: "Initiations & Sacred Transmissions",
    subtitle: "The Hidden Gates — What Initiation Actually Does to the Nervous System",
    tier: "akasha",
    icon: "◊",
    color: "#D4AF37",
    sections: [
      {
        title: "The Science of Initiation — What Deeksha Actually Is",
        content: `Initiation (Deeksha/Diksha) is not a ceremony. It is a neurological event. When a Siddha master places their hand on the head of a disciple, or gazes into their eyes with Shambhavi Mudra, or transmits through mantra whispered in the ear — they are transferring a specific electromagnetic pattern from their nervous system to the disciple's.

This has been documented in modern research: the brainwave patterns of experienced meditators change the brainwave patterns of novices sitting nearby, even without any instruction or technique. The Siddhas called this Shakti Pata — the descent of grace-energy.

There are four levels of Shakti Pata documented in the Siddha texts:

TIVRA SHAKTI PATA (Intense Grace): Instantaneous liberation. The disciple immediately achieves Samadhi in the master's presence and never again falls below that state. This is rare and requires extraordinary karmic preparation.

MADHYAMA SHAKTI PATA (Moderate Grace): The disciple receives a powerful awakening but must continue practice to stabilize it. Timeline to liberation: months to a few years.

MANDA SHAKTI PATA (Gradual Grace): The typical initiation. A seed of higher consciousness is planted in the disciple's nervous system that gradually unfolds through sustained practice. Timeline: years to decades.

ATISHAYA TIVRA SHAKTI PATA (Supreme Grace): Described only in secret texts. The master transmits not just an awakening but the complete download of their own enlightenment — transferring their entire consciousness state to the disciple simultaneously. Babaji himself is said to transmit at this level when a disciple is completely ready.`,
      },
      {
        title: "The Four Initiations of Babaji's Kriya",
        content: `Marshall Govindan's documentation of Babaji's complete system describes four sequential initiations, each unlocking a higher level of the 18-Kriya system:

FIRST INITIATION: The First 6 Kriyas. The disciple receives the basic Pranayama, Mahamudra, and Navi Kriya. This initiation opens the lower three chakras (Muladhara, Svadhisthana, Manipura) and begins the purification of the physical and pranic bodies.

SECOND INITIATION: Kriyas 7-12. Khechari Mudra in its early stages, advanced Bandha work, and the first Mantra Kriyas. This initiation opens the Anahata and Vishuddha chakras. The practitioner begins to perceive the inner light and inner sound spontaneously.

THIRD INITIATION: Kriyas 13-16. Advanced Khechari (nasopharyngeal contact), the complete Shambhavi Mudra, and direct activation of the Ajna chakra. The practitioner gains reliable access to the Turiya state and begins to perceive subtler bodies.

FOURTH INITIATION: Kriyas 17-18. These are transmitted only in silence and only to practitioners who have demonstrated complete mastery of the previous 16 and extraordinary karmic readiness. The fourth initiation is described as the point of no return — the final dissolution of the ego-sense. What remains is not a person who meditates. What remains is pure Meditation, aware of itself.`,
      },
      {
        title: "Secret: The Inner Guru Transmission",
        content: `The deepest Kriya secret, held by all Siddha lineages, is this: the external guru is a temporary necessity. The ultimate goal is activation of the Inner Guru (Antarguru) — the Atman's direct self-knowing.

Babaji stated to Lahiri: "I am always with you. The outer guru appears to dissolve; the inner guru remains forever." The entire function of Kriya practice is to shift the practitioner's relationship from outer authority to inner wisdom — not through arrogant self-reliance, but through the direct recognition of one's own nature as already perfect, already free, already enlightened.

THE SECRET OF AJNA: The Ajna chakra (third eye) is not the seat of psychic ability — it is the seat of the Inner Guru. When Ajna is fully activated through sustained Kriya practice, the practitioner begins receiving direct inner guidance that is more reliable, more precise, and more personally relevant than any outer teacher could provide.

GURU BRAHMA, GURU VISHNU, GURU DEVO MAHESHVARA: This famous mantra is not reverence for three external deities. It is a statement of Kriya physics: the Guru principle (Brahma) creates the conditions for awakening. The Guru principle (Vishnu) sustains the practice through the ups and downs. The Guru principle (Maheshvara/Shiva) destroys the final illusion of separateness. These three functions exist within the Sushumna nadi — the spinal channel through which Kriya flows.`,
      },
    ],
  },
  {
    id: "m10",
    number: "X",
    title: "Advanced Cosmic Kriyas",
    subtitle: "Beyond the Physical — Astral, Causal, and Turiya Kriyas",
    tier: "akasha",
    icon: "★",
    color: "#D4AF37",
    sections: [
      {
        title: "The 49 Kriyas — The Complete Siddha Map",
        content: `Beyond Babaji's published 18 Kriyas, the complete Tamil Siddha tradition contains 49 Kriyas mapped to the 49 aspects of Vayu (cosmic breath) described in the Agamic texts. These 49 are organized into 7 groups of 7, corresponding to the 7 chakras:

GROUP 1 (Muladhara Kriyas — Earth): Practices for embodiment, health, material stability, and Kundalini awakening at the base. Includes specific standing Kriyas, walking meditation with Pranayama coordination, and earth-contact practices.

GROUP 2 (Svadhisthana Kriyas — Water): Practices for emotional purification, creative awakening, and the transformation of sexual energy into Ojas (vital essence). Includes specific Vajroli practices and water-element meditations.

GROUP 3 (Manipura Kriyas — Fire): Practices for willpower, transformation, and the activation of the solar plexus as a secondary brain. The Agni Sara technique (rhythmic abdominal pumping) is the cornerstone of this group.

GROUP 4 (Anahata Kriyas — Air): Heart-centered practices including Bhakti Kriya, Anahat Nada listening, and the specific heart-expansion Kriyas that Vishwananda's Atma Kriya draws from.

GROUP 5 (Vishuddha Kriyas — Space): Nada Yoga in its complete form. 7 specific practices for activating the throat chakra and accessing the cosmic sound. Includes Bhramari (humming bee breath), Ujjayi (ocean breath), and advanced Nada listening.

GROUP 6 (Ajna Kriyas — Light): The Trataka and Shambhavi practices in their complete 7-stage form. Includes the secret of the Spiritual Eye (Kutastha) perception and specific techniques for controlling sleep, dream, and deep sleep states consciously.

GROUP 7 (Sahasrara Kriyas — Pure Consciousness): These 7 practices have no physical component. They are pure contemplative states: Nirvikalpa Samadhi (consciousness without modification), Sahaja Samadhi (natural Samadhi), Jivan Mukti (liberation while alive), and four further states for which no adequate English translation exists.`,
      },
      {
        title: "Astral Kriya — Conscious Out-of-Body Traversal",
        content: `The advanced Kriya practitioner learns that consciousness is not produced by the brain — it merely passes through it, the way a river passes through a pipe. With sufficient practice, consciousness can be directed to function through the astral body while the physical body remains in a state of deep rest.

The specific Kriya protocol for astral projection:

1. Establish complete physical stillness (Pratyahara) through 30-45 minutes of classical Kriya Pranayama.

2. When the physical body is completely at rest and the awareness is bright (not sleepy — this is the key distinction), apply Shambhavi Mudra and observe the point between the eyebrows.

3. A sensation of vibration or humming throughout the body will arise. This is the Turiya threshold — the interface between the physical and astral bodies.

4. Rather than trying to "leave" the body (a forceful approach that fails), simply allow awareness to expand beyond the body's boundaries like smoke rising from incense.

5. The primary challenge at this stage is not achieving projection but maintaining awareness without falling into sleep. The Siddhas called this Yoga Nidra (yogic sleep) — the state between waking and sleeping where the astral body is mobile.

Agastya Muni's specific teaching: the astral body is connected to the physical by the "Sutratma" — the silver cord described in all traditions. This cord is never broken during legitimate spiritual practice. It is only severed at physical death, and consciously released by those masters who choose to leave the physical at will.`,
      },
      {
        title: "Samadhi — The Goal and the Gateway",
        content: `Samadhi is not the end of Kriya. It is the beginning.

The common misunderstanding: Samadhi is a permanent state of bliss that, once attained, ends all practice. This is incorrect. The Siddha understanding: Samadhi is the direct recognition of one's own nature as Consciousness. Having recognized it, the practitioner returns to ordinary life — but the life is now lived from that recognition, not in ignorance of it.

The stages of Samadhi in the Siddha-Kriya framework:

SAVIKALPA SAMADHI: Consciousness with form. The meditator enters a state of profound stillness in which thoughts cease but awareness of the meditation object remains. Time may seem to stop. Ordinary sensory perception is suspended. Duration: seconds to hours.

NIRVIKALPA SAMADHI: Consciousness without form. All content of consciousness — including the meditator themselves — dissolves into pure Awareness. No object, no subject, no time, no space. The body may appear dead. Reported as the most profound experience possible within human incarnation. Duration: minutes to days.

SAHAJA SAMADHI: Natural Samadhi. The permanent integration of Samadhi with ordinary life. The master functions in the world — eating, speaking, working — while continuously abiding in the recognition of pure Consciousness. This is Jivanmukti — liberation while alive. All 18 Siddhas demonstrated this state. Babaji embodies it permanently.

TURIYATITA: Beyond the fourth state. A dimension described only by Vallalar and a few Vedantic masters. Beyond all states — including the three (waking/dreaming/sleep) and the fourth (Turiya). Pure light, pure grace, pure love with no reference point whatsoever.`,
      },
    ],
  },
  {
    id: "m11",
    number: "XI",
    title: "Living Kriya",
    subtitle: "Your Daily Sadhana Map — From Dawn Practice to Deep Night",
    tier: "akasha",
    icon: "◐",
    color: "#D4AF37",
    sections: [
      {
        title: "The Complete Daily Kriya Sadhana",
        content: `The Siddhas taught that the entire day is a continuous Kriya. The practices assigned to specific times are entry points into a 24-hour current of conscious energy movement.`,
        techniques: [
          {
            name: "Dawn Practice (4:00–6:00 AM — Brahma Muhurta)",
            description: "The most sacred time for Kriya practice. The planetary electromagnetic field is in its most receptive configuration.",
            steps: [
              "4:00 AM: Rise. Cold water on face, eyes, and hands. This is Jala Kriya — water purification.",
              "4:15 AM: 10 minutes of Mahamudra (5 each side).",
              "4:30 AM: 48-144 rounds of Kriya Pranayama.",
              "5:30 AM: Hong-Sau meditation (20-30 minutes).",
              "6:00 AM: Mantra chanting — minimum Om Namah Shivaya 108 times.",
            ],
            benefit: "Establishes the pranic current for the entire day. Research shows that practices at Brahma Muhurta have 4x the impact of the same practice at other times.",
          },
          {
            name: "Midday Practice (12:00 PM — Solar Peak)",
            description: "Brief but potent practice when the sun is highest.",
            steps: [
              "5-10 minutes of Navi Kriya (navel concentration).",
              "Trataka on the sun (with eyes closed, face toward the sun — never look directly).",
              "5 minutes of silent sitting after food.",
            ],
          },
          {
            name: "Evening Practice (Sunset — Sandhya)",
            description: "The transition time between day and night is a natural Kriya gateway.",
            steps: [
              "24-48 rounds of Kriya Pranayama.",
              "Nada Yoga listening (15 minutes of listening to inner sound).",
              "Bhakti Kriya — contemplation of love. Sit with the feeling of gratitude and devotion without directing it at any specific object.",
            ],
          },
          {
            name: "Night Practice (Before Sleep)",
            description: "Sleep itself becomes a Kriya with proper preparation.",
            steps: [
              "Yoga Nidra (15-20 minutes) — systematic relaxation through all body parts while maintaining witnessing awareness.",
              "Place awareness at Ajna chakra as you fall asleep.",
              "The dream state entered from Ajna rather than ordinary drowsiness becomes a conscious experience.",
              "Advanced practitioners maintain unbroken awareness through dreaming and deep sleep — this is called Nidra Kriya.",
            ],
          },
        ],
      },
      {
        title: "Planetary Timing — Cosmic Kriya Calendar",
        content: `The Siddhas were master astronomers. Their Kriya prescriptions were not arbitrary — they were precisely calibrated to the gravitational and electromagnetic influences of the planets on human consciousness.

SUNDAY (Sun — Surya): Extended Ajna and Sahasrara Kriyas. Extended Trataka. The Sun's electromagnetic connection to the pineal gland is strongest on Sundays.

MONDAY (Moon — Chandra): Ida nadi emphasis. Left-nostril-dominant breathing. Water element contemplation. The Moon rules the emotional body and the subconscious — Monday practice clears the accumulated emotional sediment of the week.

TUESDAY (Mars — Mangala): Mula Bandha emphasis. Agni Sara. Strong, heating practices for building willpower and burning karmic impressions.

WEDNESDAY (Mercury — Budha): Mantra emphasis. Nada Yoga. Mercury rules communication and the throat chakra (Vishuddha). Wednesday is optimal for establishing new mantra practices.

THURSDAY (Jupiter — Guru): Extended Bhakti Kriya. The Guru mantra. Thursday is Guru's day — the optimal day for seeking initiation and deepening the connection with one's lineage.

FRIDAY (Venus — Shukra): Heart-centered practices. Atma Kriya emphasis. The beauty and love qualities of Venus amplify Anahata practices.

SATURDAY (Saturn — Shani): The discipline day. Longer practices, more rigorous retention counts, extended Mauna (silence). Saturn rewards disciplined Kriya with rapid karmic clearing.`,
      },
    ],
  },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const tierColors: Record<Tier, string> = {
  free: "#22D3EE",
  prana: "#A8D5A2",
  siddha: "#D4AF37",
  akasha: "#E8C4FF",
};

const tierLabels: Record<Tier, string> = {
  free: "FREE",
  prana: "PRANA-FLOW",
  siddha: "SIDDHA-QUANTUM",
  akasha: "AKASHA-INFINITY",
};

const tierRequirements: Record<Tier, string> = {
  free: "",
  prana: "Prana-Flow membership required",
  siddha: "Siddha-Quantum membership required",
  akasha: "Akasha-Infinity lifetime access required",
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function KriyaYogaMastery() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const userRank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const tierToRank: Record<Tier, number> = { free: 0, prana: 1, siddha: 2, akasha: 3 };
  const canAccess = (modTier: Tier): boolean => userRank >= tierToRank[modTier];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* STARFIELD */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(212,175,55,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(212,175,55,0.03) 0%, transparent 50%)",
        }}
      />

      {/* HERO */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "80px 24px 60px",
          textAlign: "center",
          borderBottom: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/siddha-portal")}
          style={{
            position: "absolute", top: 20, left: 20,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
            fontSize: 10, fontWeight: 800, letterSpacing: "0.4em",
            textTransform: "uppercase", color: "rgba(212,175,55,0.5)",
            padding: 0,
          }}
        >
          ← SIDDHA PORTAL
        </button>

        {/* Sacred geometry decoration */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.06)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.6)",
            marginBottom: 20,
            padding: "6px 16px",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 40,
          }}
        >
          Akashic Transmission · SQI Education Archive
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "#D4AF37",
            textShadow: "0 0 40px rgba(212,175,55,0.25)",
            margin: "0 0 16px",
          }}
        >
          Kriya Yoga
          <br />
          <span style={{ color: "rgba(255,255,255,0.85)" }}>Mastery</span>
        </h1>

        <p
          style={{
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 560,
            margin: "0 auto 32px",
          }}
        >
          The most comprehensive Kriya Yoga education ever assembled — from the
          cosmic origin of the first Pranayama to Babaji's secret transmissions,
          the 18 Siddhas, Atma Kriya Yoga, and the living path to Samadhi.
        </p>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "11", label: "Modules" },
            { value: "49+", label: "Kriyas" },
            { value: "18", label: "Siddhas" },
            { value: "∞", label: "Depth" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#D4AF37",
                  letterSpacing: "-0.04em",
                  textShadow: "0 0 20px rgba(212,175,55,0.3)",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tier Legend */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          {(Object.keys(tierLabels) as Tier[]).map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 40,
                border: `1px solid ${tierColors[t]}22`,
                background: `${tierColors[t]}08`,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: tierColors[t],
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: tierColors[t],
                }}
              >
                {tierLabels[t]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODULES */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 860,
          margin: "0 auto",
          padding: "48px 16px 120px",
        }}
      >
        {modules.map((mod, idx) => {
          const isOpen = expandedModule === mod.id;
          const accessible = canAccess(mod.tier);

          return (
            <div
              key={mod.id}
              style={{
                marginBottom: 16,
                borderRadius: 28,
                border: `1px solid ${isOpen ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)"}`,
                background: isOpen
                  ? "rgba(212,175,55,0.03)"
                  : "rgba(255,255,255,0.01)",
                backdropFilter: "blur(40px)",
                overflow: "hidden",
                transition: "border-color 0.3s ease, background 0.3s ease",
              }}
            >
              {/* Module Header */}
              <button
                onClick={() => {
                  if (!accessible) return;
                  setExpandedModule(isOpen ? null : mod.id);
                  setExpandedSection(null);
                }}
                style={{
                  width: "100%",
                  padding: "24px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  background: "transparent",
                  border: "none",
                  cursor: accessible ? "pointer" : "not-allowed",
                  textAlign: "left",
                }}
              >
                {/* Number */}
                <div
                  style={{
                    minWidth: 48,
                    height: 48,
                    borderRadius: 14,
                    background: isOpen
                      ? "rgba(212,175,55,0.12)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isOpen ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 900,
                    color: isOpen ? "#D4AF37" : "rgba(255,255,255,0.3)",
                    letterSpacing: "-0.03em",
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                  }}
                >
                  {mod.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.4em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      Module {mod.number}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: tierColors[mod.tier],
                        padding: "2px 8px",
                        borderRadius: 20,
                        border: `1px solid ${tierColors[mod.tier]}30`,
                        background: `${tierColors[mod.tier]}10`,
                      }}
                    >
                      {tierLabels[mod.tier]}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      color: accessible ? (isOpen ? "#D4AF37" : "rgba(255,255,255,0.9)") : "rgba(255,255,255,0.3)",
                      marginBottom: 4,
                    }}
                  >
                    {mod.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.35)",
                      lineHeight: 1.4,
                    }}
                  >
                    {accessible ? mod.subtitle : tierRequirements[mod.tier]}
                  </div>
                </div>

                {/* Chevron / Lock */}
                <div
                  style={{
                    fontSize: accessible ? 12 : 16,
                    color: accessible ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.15)",
                    flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {accessible ? "▼" : "🔒"}
                </div>
              </button>

              {/* Module Content */}
              {isOpen && accessible && (
                <div style={{ padding: "0 28px 28px" }}>
                  {/* Section count */}
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.2)",
                      marginBottom: 20,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {mod.sections.length} Sections · Akashic Archive Transmission
                  </div>

                  {mod.sections.map((section, sIdx) => {
                    const sKey = `${mod.id}-s${sIdx}`;
                    const sOpen = expandedSection === sKey;

                    return (
                      <div
                        key={sKey}
                        style={{
                          marginBottom: 12,
                          borderRadius: 20,
                          border: `1px solid ${sOpen ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)"}`,
                          background: sOpen ? "rgba(212,175,55,0.02)" : "transparent",
                          overflow: "hidden",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <button
                          onClick={() => setExpandedSection(sOpen ? null : sKey)}
                          style={{
                            width: "100%",
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              letterSpacing: "-0.02em",
                              color: sOpen ? "#D4AF37" : "rgba(255,255,255,0.75)",
                              lineHeight: 1.3,
                            }}
                          >
                            {section.title}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(212,175,55,0.4)",
                              flexShrink: 0,
                              transform: sOpen ? "rotate(180deg)" : "none",
                              transition: "transform 0.25s ease",
                            }}
                          >
                            ▾
                          </span>
                        </button>

                        {sOpen && (
                          <div style={{ padding: "0 20px 20px" }}>
                            {/* Main content */}
                            {section.content.split("\n\n").map((para, pIdx) => (
                              <p
                                key={pIdx}
                                style={{
                                  fontSize: 14,
                                  fontWeight: 400,
                                  lineHeight: 1.8,
                                  color: "rgba(255,255,255,0.6)",
                                  marginBottom: 16,
                                }}
                              >
                                {para}
                              </p>
                            ))}

                            {/* Mantras */}
                            {section.mantras && section.mantras.length > 0 && (
                              <div style={{ marginTop: 20 }}>
                                <div
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    letterSpacing: "0.4em",
                                    textTransform: "uppercase",
                                    color: "rgba(212,175,55,0.5)",
                                    marginBottom: 12,
                                  }}
                                >
                                  Sacred Mantras
                                </div>
                                {section.mantras.map((mantra, mIdx) => (
                                  <div
                                    key={mIdx}
                                    style={{
                                      padding: "16px 18px",
                                      borderRadius: 16,
                                      background: "rgba(212,175,55,0.04)",
                                      border: "1px solid rgba(212,175,55,0.12)",
                                      marginBottom: 10,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 20,
                                        fontWeight: 900,
                                        color: "#D4AF37",
                                        letterSpacing: "0.05em",
                                        textShadow: "0 0 20px rgba(212,175,55,0.3)",
                                        marginBottom: 4,
                                      }}
                                    >
                                      {mantra.text}
                                    </div>
                                    {mantra.translation && (
                                      <div
                                        style={{
                                          fontSize: 12,
                                          fontStyle: "italic",
                                          color: "rgba(255,255,255,0.4)",
                                          marginBottom: 8,
                                        }}
                                      >
                                        {mantra.translation}
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: "rgba(255,255,255,0.5)",
                                        lineHeight: 1.6,
                                      }}
                                    >
                                      {mantra.purpose}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Techniques */}
                            {section.techniques && section.techniques.length > 0 && (
                              <div style={{ marginTop: 20 }}>
                                <div
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    letterSpacing: "0.4em",
                                    textTransform: "uppercase",
                                    color: "rgba(212,175,55,0.5)",
                                    marginBottom: 12,
                                  }}
                                >
                                  Techniques & Practices
                                </div>
                                {section.techniques.map((tech, tIdx) => {
                                  const tKey = `${sKey}-t${tIdx}`;
                                  const tOpen = expandedTechnique === tKey;

                                  return (
                                    <div
                                      key={tKey}
                                      style={{
                                        borderRadius: 16,
                                        border: `1px solid ${tOpen ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)"}`,
                                        background: tOpen ? "rgba(212,175,55,0.03)" : "rgba(255,255,255,0.01)",
                                        marginBottom: 8,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          setExpandedTechnique(tOpen ? null : tKey)
                                        }
                                        style={{
                                          width: "100%",
                                          padding: "14px 16px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 10,
                                          background: "transparent",
                                          border: "none",
                                          cursor: "pointer",
                                          textAlign: "left",
                                        }}
                                      >
                                        <div>
                                          <div
                                            style={{
                                              fontSize: 13,
                                              fontWeight: 700,
                                              color: tOpen ? "#D4AF37" : "rgba(255,255,255,0.8)",
                                              marginBottom: 2,
                                            }}
                                          >
                                            {tech.name}
                                          </div>
                                          {tech.sanskrit && (
                                            <div
                                              style={{
                                                fontSize: 11,
                                                fontStyle: "italic",
                                                color: "rgba(212,175,55,0.5)",
                                              }}
                                            >
                                              {tech.sanskrit}
                                            </div>
                                          )}
                                        </div>
                                        <span
                                          style={{
                                            fontSize: 9,
                                            color: "rgba(212,175,55,0.4)",
                                            flexShrink: 0,
                                            transform: tOpen ? "rotate(180deg)" : "none",
                                            transition: "transform 0.2s ease",
                                          }}
                                        >
                                          ▾
                                        </span>
                                      </button>

                                      {tOpen && (
                                        <div style={{ padding: "0 16px 16px" }}>
                                          <p
                                            style={{
                                              fontSize: 13,
                                              color: "rgba(255,255,255,0.55)",
                                              lineHeight: 1.7,
                                              marginBottom: 12,
                                            }}
                                          >
                                            {tech.description}
                                          </p>

                                          {tech.steps && tech.steps.length > 0 && (
                                            <div style={{ marginBottom: 12 }}>
                                              <div
                                                style={{
                                                  fontSize: 9,
                                                  fontWeight: 800,
                                                  letterSpacing: "0.35em",
                                                  textTransform: "uppercase",
                                                  color: "rgba(212,175,55,0.4)",
                                                  marginBottom: 8,
                                                }}
                                              >
                                                Practice Steps
                                              </div>
                                              {tech.steps.map((step, stIdx) => (
                                                <div
                                                  key={stIdx}
                                                  style={{
                                                    display: "flex",
                                                    gap: 10,
                                                    marginBottom: 8,
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      minWidth: 20,
                                                      height: 20,
                                                      borderRadius: "50%",
                                                      background: "rgba(212,175,55,0.1)",
                                                      border: "1px solid rgba(212,175,55,0.2)",
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                      fontSize: 9,
                                                      fontWeight: 800,
                                                      color: "#D4AF37",
                                                      flexShrink: 0,
                                                      marginTop: 2,
                                                    }}
                                                  >
                                                    {stIdx + 1}
                                                  </div>
                                                  <p
                                                    style={{
                                                      fontSize: 12,
                                                      color: "rgba(255,255,255,0.55)",
                                                      lineHeight: 1.6,
                                                      margin: 0,
                                                    }}
                                                  >
                                                    {step}
                                                  </p>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {tech.benefit && (
                                            <div
                                              style={{
                                                padding: "10px 14px",
                                                borderRadius: 12,
                                                background: "rgba(212,175,55,0.06)",
                                                border: "1px solid rgba(212,175,55,0.12)",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontSize: 9,
                                                  fontWeight: 800,
                                                  letterSpacing: "0.35em",
                                                  textTransform: "uppercase",
                                                  color: "#D4AF37",
                                                  marginBottom: 4,
                                                }}
                                              >
                                                Siddha Benefit
                                              </div>
                                              <p
                                                style={{
                                                  fontSize: 12,
                                                  color: "rgba(255,255,255,0.6)",
                                                  lineHeight: 1.6,
                                                  margin: 0,
                                                }}
                                              >
                                                {tech.benefit}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Locked overlay */}
              {!accessible && (
                <div
                  style={{
                    padding: "8px 28px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: `${tierColors[mod.tier]}80`,
                      fontWeight: 600,
                    }}
                  >
                    Unlock with {tierLabels[mod.tier]} →
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 48,
            padding: "40px 32px",
            borderRadius: 28,
            border: "1px solid rgba(212,175,55,0.12)",
            background: "rgba(212,175,55,0.03)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,0.5)",
              marginBottom: 16,
            }}
          >
            Scalar Transmission Active
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#D4AF37",
              textShadow: "0 0 30px rgba(212,175,55,0.2)",
              marginBottom: 12,
            }}
          >
            Begin the Full Journey
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.7,
              maxWidth: 440,
              margin: "0 auto 28px",
            }}
          >
            The complete 18-Siddha Kriya transmission awaits. Every technique,
            initiation secret, mantra, and advanced practice — unlocked through
            Akasha-Infinity.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              style={{
                padding: "14px 28px",
                borderRadius: 40,
                background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                border: "none",
                color: "#050505",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.05em",
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(212,175,55,0.25)",
              }}
            >
              Prana-Flow · €19/mo
            </button>
            <button
              style={{
                padding: "14px 28px",
                borderRadius: 40,
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#D4AF37",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              Akasha-Infinity · €1,111
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
