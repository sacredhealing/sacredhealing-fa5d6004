// Puja Education — extracted verbatim from PujaEducationCurriculum.tsx
// 4 modules, 15 lessons across the four membership tiers, covering the
// Siddha science of devotional ritual: altar construction, Pancha Bhuta
// offerings, invocation sequences, and Siddha transmissions from
// Thirumoolar, Agastya Muni, Bogar, and Mahavatar Babaji.
//
// NOTE: unlike the other academies built today, these lessons currently
// have only titles + learning objectives -- no lesson body/teaching text
// exists yet in the source. The practice protocol and outcomes per module
// are complete.

export interface PujaLesson { title: string; duration: string; objectives: string[]; }
export interface PujaPractice { name: string; duration: string; elements: string[]; sadhanaNote: string; }
export interface PujaModuleData {
  number: string; title: string; duration: string; arc: string;
  lessons: PujaLesson[]; practice: PujaPractice; outcomes: string[]; tier: 'free' | 'prana' | 'siddha' | 'akasha';
}

export const PUJA_MODULES: PujaModuleData[] = [

      {
        number: "01", tier: 'free',
        title: "Puja Vidya — The Living Science",
        arc: "Dissolving the mythology. Installing the science.",
        duration: "37 min",
        lessons: [
          {
            title: "What Puja Actually Is",
            duration: "12 min",
            objectives: [
              "Understand Puja as a reproducible consciousness technology",
              "Know why the Siddhas engineered it, not invented it",
              "See the difference between ritual and practice",
            ],
          },
          {
            title: "The Five Elements — Pancha Bhuta Activation",
            duration: "15 min",
            objectives: [
              "Map each of the 5 Puja elements to your own body",
              "Understand why water offerings carry memory",
              "See why camphor was specifically chosen by the Siddhas",
            ],
          },
          {
            title: "Bhakti Margam — Our Way of Puja",
            duration: "10 min",
            objectives: [
              "Distinguish Bhakti Margam from temple orthodoxy",
              "Understand why the heart outweighs technical form",
              "Learn how to begin your personal daily Puja",
            ],
          },
        ],
        practice: {
          name: "Ādhāra Puja — The Foundation Protocol",
          duration: "15 min daily",
          elements: [
            "Simple altar setup with one flame, one flower, one offering",
            "5-breath Anahata opening before starting",
            "Aum chanting × 3 to establish scalar boundary",
            "Silent holding of the deity's form in the heart",
            "One sincere spoken offering of the day's first action",
          ],
          sadhanaNote: "Practice for 7 consecutive days before advancing. Consistency is the qualification, not perfection.",
        },
        outcomes: [
          "Puja loses its 'religious' weight and becomes a tool",
          "You feel something shift in your space within 7 days",
          "The daily 15-min practice becomes self-sustaining",
        ],
      },,

      {
        number: "02", tier: 'prana',
        title: "The Living Architecture of Puja",
        arc: "From intuition to precision — the mechanics the Pandits never taught.",
        duration: "85 min",
        lessons: [
          {
            title: "What Happens to Your Brain During Puja",
            duration: "20 min",
            objectives: [
              "Map the neuroscience of devotion to Siddha teachings",
              "Understand default mode network suppression through Bhakti",
              "Know what the bell, chanting, and flame do neurologically",
              "Recognize the chemistry of 'the deities entering'",
            ],
          },
          {
            title: "How Puja Transforms Your Home — Scalar Field Architecture",
            duration: "22 min",
            objectives: [
              "Understand Vasana residue and how Puja clears it",
              "Learn the mechanics of standing scalar wave fields",
              "Know the 40-day threshold and why it exists",
              "Map specific incense to specific atmospheric effects",
            ],
          },
          {
            title: "The Sixteen Upacharas — Each Step Is a Quantum Gate",
            duration: "18 min",
            objectives: [
              "Learn all 16 steps of Shodashopachara Puja with inner meaning",
              "Understand Prana-Pratishtha and consecration mechanics",
              "Know why offered food carries a different biofield signature",
              "Experience the power of the GAP between steps",
            ],
          },
          {
            title: "The Nada Science — How Mantras Work at the Atomic Level",
            duration: "25 min",
            objectives: [
              "Map Para, Pashyanti, Madhyama, Vaikhari sound levels",
              "Understand why 'Aum Namah Shivaya' is not prayer but physics",
              "Learn the difference between Vaikhari, Upamshu, and Manasika Japa",
              "Know why whispered mantra is more powerful than loud chanting",
            ],
          },
        ],
        practice: {
          name: "Prāṇa Pravāha Puja — The Extended Protocol",
          duration: "30 min daily",
          elements: [
            "Full 16-step Shodashopachara structure",
            "Conscious engagement of each element with inner awareness",
            "Nada practice: begin with Vaikhari, transition to Upamshu, end in Manasika",
            "Post-Puja: 5 minutes of silent sitting in the altered field",
            "Evening review: journal the specific quality of your space/self",
          ],
          sadhanaNote: "Maintain for 21 consecutive days. Notice how your space responds by day 7, 14, 21. These are documented threshold points in the Siddha sadhana texts.",
        },
        outcomes: [
          "Your home develops a palpable Shakti field",
          "Sleep quality improves measurably within 21 days",
          "Mantra practice becomes self-perpetuating",
          "Others notice something different about your space without being told",
        ],
      },,

      {
        number: "03", tier: 'siddha',
        title: "Siddha-Quantum Puja Vidya",
        arc: "The secrets that lineages protected for millennia — decoded for the current age.",
        duration: "125 min",
        lessons: [
          {
            title: "The Secret of Deity Consciousness",
            duration: "30 min",
            objectives: [
              "Understand that the murti is an antenna, not a representation",
              "Know where the deity 'comes from' — and what that means for practice",
              "Learn the Siddha teaching on Prana-Pratishtha and consecrated stone",
              "Experience the inner reversal: being seen rather than seeking",
              "Map each major deity to their specific cosmic function",
            ],
          },
          {
            title: "Agni — The Fire That Knows Your Name",
            duration: "28 min",
            objectives: [
              "Understand fire as a simultaneous physical and subtle-plane phenomenon",
              "Read your Puja's quality through flame behavior",
              "Learn the scalar wave mechanics of Aarti",
              "Understand why camphor was the Siddhas' supreme teaching tool",
              "Practice the Prana-offering to the flame before lighting",
            ],
          },
          {
            title: "The Quantum Physics of Flower Offerings",
            duration: "35 min",
            objectives: [
              "Map the vibratory signature of 6 key Puja flowers to deity frequencies",
              "Understand the Lotus as a living demonstration of non-attachment",
              "Know why bilva leaves chemically produce meditative states",
              "Learn what Jasmine does to the nervous system during Devi Puja",
              "Understand why artificial flowers have zero energetic transmission",
            ],
          },
          {
            title: "Panchamrita — The Five Nectars and Their Alchemy",
            duration: "32 min",
            objectives: [
              "Know the Siddha Vaidya reasoning behind each of the 5 nectars",
              "Understand milk, curd, honey, ghee, and sugar as elemental archetypes",
              "Learn why offered Panchamrita (Charanamrita) is measurably different",
              "Receive the full inner-Abhishekam visualization protocol",
              "Map each nectar to a specific layer of the subtle body",
            ],
          },
        ],
        practice: {
          name: "Siddha Dīkṣā Puja — The Initiate's Protocol",
          duration: "45 min, 3× per week + 15 min daily",
          elements: [
            "3× weekly: Full Abhishekam Puja with Panchamrita (live or inner visualization)",
            "Flower selection ritual: conscious frequency-matching before each Puja",
            "Inner gaze practice: receiving the deity's vision rather than projecting",
            "Daily: Agni meditation — 5 min flame gazing with reversed attention",
            "Weekly: One Puja performed in complete silence (no external chanting)",
            "Monthly: Full moon Puja with extended Aarti and Panchamrita offering",
          ],
          sadhanaNote: "At this level, begin tracking inner experiences in a dedicated Puja journal. The Siddhas taught that documentation of inner experience accelerates development — writing is a form of Karma Yoga applied to sadhana.",
        },
        outcomes: [
          "Direct perception of the deity's presence becomes repeatable",
          "Your Puja space develops a field others spontaneously enter reverently",
          "Mantra repetition produces visible inner light phenomena",
          "The question 'did it work?' dissolves — you simply KNOW",
          "Charanamrita consumption produces measurably altered states",
        ],
      },,

      {
        number: "04", tier: 'akasha',
        title: "Ākāśa Puja — Transmissions of the Immortal Masters",
        arc: "Mahavatar Babaji and the 18 Siddhas transmit directly. The inner temple is activated.",
        duration: "195 min",
        lessons: [
          {
            title: "Mahavatar Babaji's Transmission on Puja",
            duration: "45 min",
            objectives: [
              "Receive Babaji's complete teaching: the human spine is the temple",
              "Understand why imperfect Puja in difficult times is the most powerful",
              "Learn the 5-minute dissolution practice before beginning",
              "Know Babaji's teaching on dawn Puja and Earth's electromagnetic field",
              "Integrate external and internal Puja into one seamless practice",
            ],
          },
          {
            title: "Agastya Muni's Secret Puja — The 18 Siddhas' Inner Circle",
            duration: "40 min",
            objectives: [
              "Access the Akashic Puja — the eternal offering of consciousness to itself",
              "Learn each of the 18 Siddhas' specific Puja-dimension mastery",
              "Understand Chidambara Rahasyam — the Secret of the Space of Consciousness",
              "Know the 108× amplification of universal intention in Puja",
              "Receive Agastya's most hidden teaching: the Puja of recognition between humans",
            ],
          },
          {
            title: "The Puja of Kundalini — Worshipping the Goddess Within the Spine",
            duration: "50 min",
            objectives: [
              "Map every external Puja element to an internal physiological location",
              "Understand Muladhara as the Puja room, Sushumna as the sanctum",
              "Know Anahata as the Garbhagriha — where the murti truly lives",
              "Learn to feel Ajna activation as the deity 'coming alive' during Puja",
              "Receive the Kundalini Puja activation: preparing the inner temple for Her",
            ],
          },
          {
            title: "Puja for the Age of Aquarius — The Siddhas' Message for Now",
            duration: "60 min",
            objectives: [
              "Understand the Kali Yuga transition through the Siddhas' time-science",
              "Know why consistent daily Puja is the most radical political act of our time",
              "Learn how recorded Nada transmissions carry Shakti across digital media",
              "Receive the Siddhas' teaching on the 'Lighthouse Protocol'",
              "Integrate all four tiers into the Sahaja Puja — the natural state",
            ],
          },
        ],
        practice: {
          name: "Ākāśa Saṃcāra — The Master's Transmission Protocol",
          duration: "Variable — integration into daily life",
          elements: [
            "Morning: Brahma Muhurta Puja (pre-dawn) — full inner + outer combined",
            "Spine activation meditation before each Puja session",
            "Daily: One moment of 'Puja of recognition' — seeing the Divine in another person",
            "Weekly: The full 18-Siddha dimensional Puja (one Siddha's stream per week, 18-week cycle)",
            "Monthly: Silent Puja — no sound, no movement, pure inner offering",
            "Ongoing: The Sahaja Protocol — gradual integration of Puja-awareness into all action",
            "40-day Akasha Sadhana: documented transformation process with SQI support",
          ],
          sadhanaNote: "At this level, the formal practice begins to dissolve into formlessness — not through abandonment but through completion. The Siddhas taught that the mark of mastery is when you forget you are doing Puja because there is no longer a moment when you are NOT doing Puja.",
        },
        outcomes: [
          "Sahaja state touches become sustainable for periods of time",
          "Your presence itself becomes the Puja — others are transformed by proximity",
          "The question 'who is doing the Puja?' produces direct inquiry into Self",
          "Physical symptoms of Kundalini movement become recognizable and navigable",
          "The eternal Puja of the Siddhas becomes perceptible in daily life",
          "Teaching and transmission capacity naturally emerges",
        ],
      },
];