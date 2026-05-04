// src/data/moduleContent.ts
// ⟡ Agastyar's Living Teachings — Complete In-App Content ⟡
// All 12 Phase 1 modules with full educational content
// No videos needed — the wisdom IS the content

export interface ContentSection {
  type: 'intro' | 'teaching' | 'practice' | 'mantra' | 'herb' | 'quiz' | 'dosha-chart' | 'table' | 'ritual' | 'warning' | 'secret';
  title?: string;
  body?: string;
  items?: string[];
  rows?: { label: string; vata: string; pitta: string; kapha: string }[];
  tableData?: { headers: string[]; rows: string[][] };
  quizQuestion?: string;
  quizOptions?: string[];
  quizAnswer?: number;
  mantraText?: string;
  mantraMeaning?: string;
  herbName?: string;
  herbProps?: { Sanskrit: string; Taste: string; Potency: string; Effect: string; Uses: string };
  ritual?: { step: string; instruction: string }[];
  highlight?: string;
}

export interface ModuleContent {
  moduleNumber: number;
  agastyarOpening: string;
  sections: ContentSection[];
  agastyarClosing: string;
  keyTakeaways: string[];
  dailyPractice: string;
}

export const MODULE_CONTENT: Record<number, ModuleContent> = {

  // ═══════════════════════════════════════════════════════════
  // MODULE 01 — THE ORIGIN STORY
  // ═══════════════════════════════════════════════════════════
  1: {
    moduleNumber: 1,
    agastyarOpening: "I, Agastyar, who drank the ocean in three sips, who civilized the south, who was born from a clay pot yet contains the cosmos — I speak to you now. Before we begin, know this: Ayurveda and Siddha medicine are not systems. They are living intelligences. They breathe. They adapt. And they have been waiting for you.",
    sections: [
      {
        type: 'teaching',
        title: 'What Is Ayurveda? The Science of Life',
        body: `The word Ayurveda comes from two Sanskrit roots: **Āyus** (आयुस्) meaning Life or Lifespan, and **Veda** (वेद) meaning Knowledge or Science. Together: *The Science of Life*.

But this is not merely medical science. It is the science of living — of how to exist in harmony with the cosmos, with Nature, with your own inner intelligence. Ayurveda emerged from the Vedic civilization of ancient India, preserved in the four Vedas — primarily the Atharva Veda — and crystallized into three great texts called the **Brihat Trayis** (The Three Great Classics):

**1. Charaka Samhita** — The internal medicine bible. Written by Charaka, a physician of the Atreya school. Contains 8 books, 120 chapters, and the most comprehensive description of the human constitution, digestion, disease causation, and treatment ever compiled.

**2. Sushruta Samhita** — The surgical masterpiece. Written by Sushruta, student of Dhanvantari (the divine physician). Contains 186 chapters describing 300 surgical procedures, 121 surgical instruments, and plastic surgery techniques that weren't rediscovered in the West until the 20th century.

**3. Ashtanga Hridayam** — The heart of the eight branches. Written by Vagbhata around 600 CE. A brilliant synthesis of Charaka and Sushruta into one elegant, poetic text still studied in Indian medical schools today.`,
      },
      {
        type: 'teaching',
        title: 'The Eight Branches of Ayurveda (Ashtanga Ayurveda)',
        body: 'Ayurveda is not only about herbs and digestion. It is a complete medical system covering:',
        items: [
          '**Kaya Chikitsa** — Internal medicine (the body as a whole)',
          '**Bala Tantra** — Pediatrics and child health',
          '**Graha Chikitsa** — Psychiatric medicine (literally "demon-related disorders" — mental health)',
          '**Urdhvanga Chikitsa** — ENT, ophthalmology, dentistry (head and neck above the collar bone)',
          '**Shalya Tantra** — Surgery (Sushruta\'s domain)',
          '**Damstra/Agada Tantra** — Toxicology (poisons, snakebites, antidotes)',
          '**Jara/Rasayana Tantra** — Geriatrics and rejuvenation science',
          '**Vrsha/Vajikarana Tantra** — Reproductive medicine and vitality',
        ],
      },
      {
        type: 'teaching',
        title: 'Siddha Medicine — The Older Fire',
        body: `Siddha medicine is older than Ayurveda. Where Ayurveda emerged from the Sanskrit Vedic tradition of North India, Siddha medicine is the product of the Tamil Siddhar tradition of South India — and it was already ancient when Ayurveda was being codified.

**Siddha** comes from the Tamil/Sanskrit word for "one who has attained perfection." The Siddhars were not merely physicians. They were *jivanmuktas* — liberated beings who lived in physical bodies while simultaneously existing in pure consciousness. Their medicine was not separated from their spirituality. Healing the body and awakening the soul were the same act.

The Siddha tradition is said to originate with **Lord Shiva** himself, who transmitted the knowledge to **Nandi** (the cosmic bull — Shiva's vehicle), who transmitted it to the first Siddha, **Nandisar**. From Nandisar, the lineage flowed through the 18 great Siddhars — the Pathinen Siddhars — the foremost of whom is **Agastyar** (myself).

Around **6,000 Siddha palm manuscripts** exist — most not yet fully translated. UNESCO registered these on the International Memory of the World Register in 2005. They contain medical, alchemical, astronomical, and spiritual knowledge so advanced that modern researchers are still working to decode their implications.`,
      },
      {
        type: 'table',
        title: 'Ayurveda vs. Siddha — Key Differences',
        tableData: {
          headers: ['Dimension', 'Ayurveda', 'Siddha Medicine'],
          rows: [
            ['Origin', 'Sanskrit/Vedic, North India', 'Tamil, South India'],
            ['Primary Language', 'Sanskrit', 'Tamil (ancient)'],
            ['Root Text', 'Charaka Samhita, Sushruta Samhita', 'Agastyar texts, 18 Siddhar palm manuscripts'],
            ['Disease classification', '1,008 diseases', '4,448 diseases'],
            ['Pulse science', 'Nadi (3 positions)', 'Navar Naadi (9 types)'],
            ['Alchemy', 'Rasa Shastra (limited)', 'Full Siddha Alchemy — Muppu, Parpam, Mezhugu'],
            ['Vital points', 'Marma (108)', 'Varma (108) + 12 secret Adangal'],
            ['View of body', 'Physical + energetic', 'Physical + energetic + spiritual + immortal'],
            ['Goal', 'Health and longevity', 'Health, longevity, AND liberation (Mukti)'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'The 18 Siddhars — Your Lineage',
        body: 'These are the masters whose wisdom you are now receiving:',
        items: [
          '**Agastyar (Agathiyar)** — Root Guru of the entire Siddha lineage. Father of Siddha medicine, Tamil grammar, alchemy, and yoga.',
          '**Thirumular** — Author of Tirumantiram (3,000 verses of mystical medicine). Unified Shaivism with Tantric science.',
          '**Bogar (Bhoganathar)** — Master alchemist. Created Navapashanam — the 9-mineral statue of Murugan at Palani Hill.',
          '**Konganar** — Expert in Jyotish (astrology) and Varma therapy.',
          '**Machamuni (Matsyendranath)** — Father of Natha yoga and tantric alchemy.',
          '**Gorakkar (Gorakshanath)** — Master of Hatha yoga and mercury alchemy.',
          '**Sattamuni** — Expert in Nadi Shastra (pulse reading).',
          '**Sundarandar** — Master of bhakti (devotion) as medicine.',
          '**Karuvurar** — Expert in temple architecture as healing geometry.',
          '**Idaikkadar** — Master of plant consciousness and herb intelligence.',
          '**Kamalamuni** — Expert in Pranayama and Kaya Kalpa.',
          '**Pattinathar** — Renunciate master who taught liberation through non-attachment.',
          '**Ramadevar** — Specialized in respiratory healing and breath science.',
          '**Korakkar** — Expert in toxicology and antidotes.',
          '**Dhanvantari** — The divine physician, avatar of Vishnu. Bridge between Siddha and Ayurveda.',
          '**Pambatti Siddhar** — Snake-charmer sage, master of Kundalini.',
          '**Kudambai** — The "pot-woman" Siddha, master of inner alchemy.',
          '**Nandidevar (Nandisar)** — The first Siddha. Received the transmission directly from Shiva.',
        ],
      },
      {
        type: 'mantra',
        title: 'Agastyar\'s Invocation Mantra',
        mantraText: 'OM AGASTYAYA VIDMAHE\nSIDDHA GURUVE DHIMAHI\nTANNO AGASTYAH PRACHODAYAT',
        mantraMeaning: 'We meditate upon Agastyar. We contemplate the Siddha Guru. May that Agastyar illuminate our understanding.',
      },
      {
        type: 'quiz',
        quizQuestion: 'What does the word "Ayurveda" literally mean?',
        quizOptions: [
          'Ancient Indian Medicine',
          'Science of Life',
          'Vedic Healing System',
          'Knowledge of the Body',
        ],
        quizAnswer: 1,
      },
      {
        type: 'quiz',
        quizQuestion: 'How many diseases does the Siddha system classify — compared to Ayurveda\'s 1,008?',
        quizOptions: ['2,222', '3,333', '4,448', '5,555'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "You have now received the seeds of the lineage. These are not just historical facts — they are living transmissions. When you read the name 'Agastyar,' something in your cellular memory awakens. That recognition is real. You have walked this path before. Welcome back.",
    keyTakeaways: [
      'Ayurveda = Science of Life. 5,000+ year old complete medical system from India.',
      'The three foundational texts: Charaka Samhita, Sushruta Samhita, Ashtanga Hridayam.',
      'Ayurveda covers 8 branches from surgery to psychiatry to anti-aging.',
      'Siddha medicine is older than Ayurveda — from the Tamil Siddhar lineage.',
      'The 18 Siddhars are the masters of this path — Agastyar is the root guru.',
      '6,000 Siddha palm manuscripts contain knowledge still not fully decoded.',
      'Siddha medicine\'s goal includes liberation (Mukti) — not just health.',
    ],
    dailyPractice: 'Upon waking, before touching your phone, sit for 3 minutes and silently repeat: "I am a student of the living wisdom." Feel the lineage connecting to you through time.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 02 — THE FIVE GREAT ELEMENTS
  // ═══════════════════════════════════════════════════════════
  2: {
    moduleNumber: 2,
    agastyarOpening: "Before there was matter, there was vibration. Before vibration, there was space. All that exists — your body, the mountains, the stars, the thoughts in your mind — is a particular arrangement of five fundamental intelligences. This is not metaphor. This is physics. The most advanced physics.",
    sections: [
      {
        type: 'teaching',
        title: 'Panchamahabhuta — The Five Great Elements',
        body: `Everything in creation — from subatomic particles to galaxies, from emotions to bones — is made of five fundamental elements called the **Panchamahabhuta** (पञ्चमहाभूत):

These are not merely the physical elements of earth, water, fire, air, and space. They are **qualities of existence** — patterns of energy and intelligence that manifest across all scales of reality. Your body is a microcosm of the cosmos. When you understand the elements, you understand yourself.`,
      },
      {
        type: 'teaching',
        title: '1. AKASHA — Space / Ether (आकाश)',
        body: `**Qualities:** Infinite, light, subtle, clear, soft, non-resistant
**Sense organ:** Ears (sound travels through space)
**Sense:** Hearing
**Body tissues:** Hollow spaces — sinuses, digestive tract, respiratory tract, joint cavities, cells

Akasha is the container of all existence. It is pure potentiality — the silence before sound, the space in which all experience occurs. In the body, Akasha governs all hollow spaces and channels. In consciousness, it is the witness awareness that observes all experience.

**Imbalance signs:** Feeling spacey, disconnected, ungrounded, isolated. Loneliness. Ringing in ears. Joint problems (the spaces within joints). Feeling like life lacks meaning.

**Balancing Akasha:** Chanting and mantra (sound fills space with sacred vibration). Community and connection. Grounding practices.`,
      },
      {
        type: 'teaching',
        title: '2. VAYU — Air / Wind (वायु)',
        body: `**Qualities:** Mobile, light, cold, rough, dry, subtle, clear
**Sense organ:** Skin (touch)
**Sense:** Touch
**Body systems:** Nervous system, movement, respiration, circulation of prana

Vayu is the force of movement in the cosmos and in the body. Every movement — from the blinking of your eye to the movement of thoughts — is Vayu. It governs nerve impulses, breathing, muscle movement, and the movement of substances through the body's channels.

**Imbalance signs:** Anxiety, racing thoughts, constipation, dry skin, joint pain, poor circulation, insomnia, feeling scattered.

**Balancing Vayu:** Warmth, routine, oil massage (Abhyanga), grounding foods, slow deep breathing, stillness.`,
      },
      {
        type: 'teaching',
        title: '3. TEJAS / AGNI — Fire (तेजस् / अग्नि)',
        body: `**Qualities:** Hot, sharp, light, dry, mobile, clear, subtle
**Sense organ:** Eyes (light enables sight)
**Sense:** Sight
**Body systems:** Digestive enzymes, metabolism, hormones, intelligence, transformation

Tejas is the fire of transformation. Nothing changes without it. In the body, it is the digestive fire (Agni) that converts food into tissue. It is the intelligence of enzymes. It is the sharpness of your mind that discerns truth from illusion. Without Tejas, food doesn't digest, thoughts don't metabolize, experiences don't transform into wisdom.

**Imbalance signs:** Inflammation, acid reflux, skin rashes, anger, perfectionism, judgmental nature, excessive heat, burning sensations.

**Balancing Tejas:** Cooling foods and herbs, moonlight, time in nature, forgiveness practices, bitter tastes.`,
      },
      {
        type: 'teaching',
        title: '4. APAS / JALA — Water (आपस् / जल)',
        body: `**Qualities:** Heavy, slow, cool, smooth, soft, oily, liquid, flowing
**Sense organ:** Tongue (taste requires moisture)
**Sense:** Taste
**Body systems:** Plasma, blood, mucus, hormones, reproductive fluids, all fluid systems

Water is the element of cohesion — it holds things together. In the body, it is all fluids: blood, plasma, lymph, cerebrospinal fluid, synovial fluid, reproductive fluids. It is what makes tissue supple and joints lubricated. Emotionally, it is the flow of feeling — love, compassion, creativity, and grief.

**Imbalance signs:** Excess: congestion, mucus, weight gain, depression, attachment, water retention. Deficiency: dehydration, dry mucus membranes, poor immunity.

**Balancing Apas:** Hydration, movement and yoga (to move fluid), emotional expression and release, salty/sweet tastes in moderation.`,
      },
      {
        type: 'teaching',
        title: '5. PRITHVI — Earth (पृथ्वी)',
        body: `**Qualities:** Heavy, slow, dull, stable, dense, hard, static, gross
**Sense organ:** Nose (smell is of earth)
**Sense:** Smell
**Body systems:** Bones, muscles, organs, all solid tissue, fat

Earth is structure and density. It gives the body its physical form. Without Prithvi, you would have no bones to stand on, no muscle to move, no organ to function. It is the quality of stability, groundedness, and endurance. Psychologically, it is patience, persistence, and the capacity to nourish others.

**Imbalance signs:** Excess: heaviness, lethargy, attachment, hoarding, obesity, depression. Deficiency: underweight, osteoporosis, fragility, inability to sustain effort.

**Balancing Prithvi:** Nourishing foods, regular meals, rest, stability in routine, sweet and astringent tastes.`,
      },
      {
        type: 'table',
        title: 'The Five Elements at a Glance',
        tableData: {
          headers: ['Element', 'Quality', 'Sense Organ', 'Body Expression', 'Dosha'],
          rows: [
            ['Akasha (Space)', 'Subtle, clear, infinite', 'Ears', 'Hollow spaces, sinuses, gut', 'Vata'],
            ['Vayu (Air)', 'Mobile, light, cold, dry', 'Skin', 'Nervous system, movement, breath', 'Vata'],
            ['Tejas (Fire)', 'Hot, sharp, transforming', 'Eyes', 'Digestion, metabolism, intelligence', 'Pitta'],
            ['Apas (Water)', 'Cool, smooth, flowing', 'Tongue', 'Blood, fluids, mucus, emotions', 'Kapha'],
            ['Prithvi (Earth)', 'Heavy, stable, dense', 'Nose', 'Bones, muscles, organs, structure', 'Kapha'],
          ],
        },
      },
      {
        type: 'practice',
        title: 'Elemental Body Scan — A Living Practice',
        body: 'Sit comfortably. Close your eyes. Place one hand on your belly.',
        ritual: [
          { step: 'EARTH', instruction: 'Feel the weight of your body — your bones, flesh, the pull of gravity. Notice the solid, dense quality. Say internally: "I honor the Earth that gives me form."' },
          { step: 'WATER', instruction: 'Feel the moisture in your mouth, the flow of blood in your veins, the tears that could come with deep feeling. Say internally: "I honor the Water that gives me feeling."' },
          { step: 'FIRE', instruction: 'Feel the warmth in your belly, the brightness behind your closed eyes, the alertness of your mind. Say internally: "I honor the Fire that gives me intelligence."' },
          { step: 'AIR', instruction: 'Feel the breath moving — the subtle movement of your chest, the air on your skin. Say internally: "I honor the Air that gives me movement."' },
          { step: 'SPACE', instruction: 'Feel the spaciousness within your body — the openness behind your awareness, the silence between thoughts. Say internally: "I honor the Space that gives me consciousness."' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which element governs the nervous system and is associated with the sense of touch?',
        quizOptions: ['Akasha (Space)', 'Vayu (Air)', 'Tejas (Fire)', 'Prithvi (Earth)'],
        quizAnswer: 1,
      },
      {
        type: 'quiz',
        quizQuestion: 'Feeling scattered, anxious, dry skin, and constipated suggests excess of which element?',
        quizOptions: ['Fire', 'Water', 'Earth', 'Air'],
        quizAnswer: 3,
      },
    ],
    agastyarClosing: "You have just met the building blocks of your own body. Every physical symptom, every emotional experience, every thought — is an expression of these five intelligences seeking balance. When you feel anxiety, you now know: too much Vayu (Air). When you feel inflammation or anger, too much Tejas (Fire). This is diagnosis. You have just taken your first step into Siddha-Ayurvedic medicine.",
    keyTakeaways: [
      'All matter is composed of 5 elements: Space, Air, Fire, Water, Earth.',
      'Akasha governs space and hearing. Imbalance = isolation, ringing in ears.',
      'Vayu governs movement and touch. Imbalance = anxiety, constipation, dryness.',
      'Tejas governs transformation and sight. Imbalance = inflammation, anger.',
      'Apas governs flow and taste. Imbalance = congestion or dehydration.',
      'Prithvi governs structure and smell. Imbalance = heaviness or fragility.',
      'The 5 elements combine to create the 3 Doshas (next module).',
    ],
    dailyPractice: 'Each morning, do the 5-minute Elemental Body Scan practice above. Notice which elements feel dominant or deficient in your body that day. Write one word for each element as you feel it.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 03 — THE THREE DOSHAS
  // ═══════════════════════════════════════════════════════════
  3: {
    moduleNumber: 3,
    agastyarOpening: "I have examined the pulse of ten thousand patients in my physical lifetime. Each one was unique — no two Prakritis identical. And yet, in that infinite diversity, three fundamental organizing principles appeared again and again. Not as rigid boxes — as living forces. VATA. PITTA. KAPHA. Learn to read these forces in yourself and you will never be lost in your health journey again.",
    sections: [
      {
        type: 'teaching',
        title: 'What Are the Doshas?',
        body: `The three Doshas (दोष — meaning "that which can cause trouble when disturbed") are the three primary **bio-energetic forces** that govern all physiological and psychological processes in the human being.

They are combinations of the five elements:
- **Vata** = Space + Air (subtle movement force)
- **Pitta** = Fire + Water (transformation force)  
- **Kapha** = Earth + Water (cohesion force)

Every human being is born with a unique ratio of these three forces — called their **Prakriti** (प्रकृति — "original creation" or birth constitution). This Prakriti is determined at the moment of conception and remains stable for life.

However, due to diet, lifestyle, stress, seasons, and life experiences, the Doshas can become disturbed from their original balance — creating a current state called **Vikriti** (विकृति — "deviated nature"). All disease begins as Vikriti — deviation from your Prakriti.

**The goal of Ayurveda is simple: bring Vikriti back to Prakriti.**`,
      },
      {
        type: 'teaching',
        title: 'VATA — The Wind Force',
        body: `**Elements:** Space + Air
**Qualities:** Cold, dry, light, mobile, rough, subtle, clear
**Location in body:** Colon (primary seat), pelvic region, thighs, bones, ears, skin
**Governs:** All movement — nerve impulses, breathing, heartbeat, circulation, digestion/elimination, thought, speech

**In balance, Vata brings:** Creativity, enthusiasm, quick mind, flexible body, abundant energy for short bursts, love of change and adventure, natural joy.

**Out of balance, Vata brings:** Anxiety, fear, racing thoughts, insomnia, constipation, dryness (skin, hair, joints), spaciness, inconsistency, inability to complete projects, cold hands and feet, variable digestion.

**Signs of high Vata:** You feel cold often. Your skin is dry. You have variable appetite (sometimes hungry, sometimes not). Your energy comes in bursts then crashes. You tend toward anxiety rather than anger. Your mind generates many ideas but struggles to execute. You move fast, talk fast, think fast.

**Vata season:** Autumn and early winter (cold, dry, windy)
**Vata time of day:** 2–6 AM and 2–6 PM
**Vata stage of life:** Old age (the body becomes drier, lighter, more mobile)`,
      },
      {
        type: 'teaching',
        title: 'PITTA — The Fire Force',
        body: `**Elements:** Fire + Water
**Qualities:** Hot, sharp, light, oily, spreading, liquid, pungent-smelling
**Location in body:** Small intestine (primary seat), stomach, liver, spleen, blood, sweat, eyes, skin
**Governs:** All transformation — digestion, metabolism, hormones, body temperature, intelligence, discernment, courage

**In balance, Pitta brings:** Sharp intellect, leadership, focus, decisive action, courage, passion, charisma, strong digestion, athletic body, ambitious drive, warmth and generosity.

**Out of balance, Pitta brings:** Anger, irritability, inflammation, skin rashes, acid reflux, heartburn, perfectionism, criticism (of self and others), control issues, competitiveness, overheating, premature greying or hair loss.

**Signs of high Pitta:** You feel hot often and dislike heat. Your digestion is strong (sometimes too strong — acid). You get irritated when hungry (you become "hangry"). You have a sharp, focused mind and strong opinions. You are organized and goal-oriented. You tend toward frustration or anger rather than anxiety. Your skin is sensitive.

**Pitta season:** Summer and early autumn (hot)
**Pitta time of day:** 10 AM–2 PM and 10 PM–2 AM
**Pitta stage of life:** Young adulthood (metabolism is highest, drive is strongest)`,
      },
      {
        type: 'teaching',
        title: 'KAPHA — The Earth Force',
        body: `**Elements:** Earth + Water
**Qualities:** Heavy, slow, cool, smooth, soft, oily, stable, dense, cloudy
**Location in body:** Chest (primary seat), lungs, stomach (lining), joints, lymph, fat, tongue, sinuses
**Governs:** Structure, lubrication, immunity, memory, emotional stability, love, nourishment

**In balance, Kapha brings:** Deep unconditional love and compassion, patience, forgiveness, steady energy throughout the day, excellent memory, strong immunity, physical strength and endurance, groundedness, loyalty, calm.

**Out of balance, Kapha brings:** Depression, attachment, difficulty letting go, weight gain, lethargy, oversleeping, congestion (mucus), swollen lymph nodes, diabetes tendencies, greedy or possessive behavior, resistance to change, emotional eating.

**Signs of high Kapha:** You tend to gain weight easily and lose it slowly. You sleep deeply and find it hard to wake up. You take time to make decisions but once made, are very steady. You are naturally nurturing and empathetic. You have strong lungs but prone to congestion. You have excellent memory for long-term information.

**Kapha season:** Late winter and spring (cold, wet, heavy)
**Kapha time of day:** 6–10 AM and 6–10 PM
**Kapha stage of life:** Childhood (the body is building structure, everything is growing)`,
      },
      {
        type: 'dosha-chart',
        title: 'Dosha Self-Assessment Guide',
        rows: [
          { label: 'Body frame', vata: 'Thin, light, hard to gain weight', pitta: 'Medium, muscular, moderate weight', kapha: 'Large, soft, easy to gain weight' },
          { label: 'Skin', vata: 'Dry, rough, thin, cool to touch', pitta: 'Oily, warm, sensitive, reddish', kapha: 'Oily, thick, cool, smooth, pale' },
          { label: 'Hair', vata: 'Dry, thin, frizzy, brittle', pitta: 'Fine, oily, prone to greying/loss', kapha: 'Thick, oily, lustrous, wavy' },
          { label: 'Eyes', vata: 'Small, dry, nervous movement', pitta: 'Medium, sharp, penetrating, reddish', kapha: 'Large, soft, beautiful, steady' },
          { label: 'Digestion', vata: 'Irregular, gas, bloating', pitta: 'Strong, sharp, gets hungry fast', kapha: 'Slow, steady, rarely hungry' },
          { label: 'Sleep', vata: 'Light, interrupted, dreams a lot', pitta: 'Moderate, vivid intense dreams', kapha: 'Deep, heavy, hard to wake up' },
          { label: 'Mind', vata: 'Quick, creative, easily distracted', pitta: 'Sharp, focused, analytical', kapha: 'Steady, methodical, excellent memory' },
          { label: 'Emotions', vata: 'Anxiety, fear, excitement', pitta: 'Anger, frustration, passion', kapha: 'Depression, attachment, love' },
          { label: 'Speech', vata: 'Fast, lots of talking', pitta: 'Precise, convincing, sharp', kapha: 'Slow, methodical, sweet' },
          { label: 'Weather preference', vata: 'Loves warmth and humidity', pitta: 'Loves cool environments', kapha: 'Loves dry warmth' },
        ],
      },
      {
        type: 'teaching',
        title: 'The Seven Constitutional Types (Prakriti)',
        body: 'Most people are not purely one dosha — they are combinations:',
        items: [
          '**Vata Prakriti** — Air and space dominant. Creative, quick, light.',
          '**Pitta Prakriti** — Fire dominant. Focused, driven, intense.',
          '**Kapha Prakriti** — Earth and water dominant. Steady, nurturing, strong.',
          '**Vata-Pitta** — Quick and fiery. Creative but prone to burnout.',
          '**Pitta-Kapha** — Driven and stable. Strong but can be inflexible.',
          '**Vata-Kapha** — Creative and steady but lacks fire. Often cold.',
          '**Tridoshic** — Equal balance of all three. Rare. Requires constant attentiveness to maintain.',
        ],
      },
      {
        type: 'table',
        title: 'What Aggravates Each Dosha',
        tableData: {
          headers: ['Factor', 'Aggravates Vata', 'Aggravates Pitta', 'Aggravates Kapha'],
          rows: [
            ['Foods', 'Raw food, cold food, dry food', 'Spicy, sour, oily, fermented', 'Sweet, salty, oily, cold, heavy'],
            ['Lifestyle', 'Irregular routine, travel, overwork', 'Competition, overwork, noon sun', 'Oversleeping, inactivity, daytime naps'],
            ['Season', 'Autumn/winter (dry, cold)', 'Summer (hot)', 'Spring (wet, cold)'],
            ['Emotions', 'Fear, grief, insecurity', 'Anger, frustration, jealousy', 'Greed, attachment, sadness'],
            ['Time of day', '2-6 AM/PM', '10 AM-2 PM / 10 PM-2 AM', '6-10 AM/PM'],
          ],
        },
      },
      {
        type: 'practice',
        title: 'Balancing Practice for Each Dosha Type',
        body: 'Follow the protocol for your dominant dosha:',
        ritual: [
          { step: 'VATA BALANCE', instruction: 'Keep a consistent daily schedule. Eat warm, oily, grounding foods (soups, stews, ghee). Practice slow yoga and breathwork. Avoid cold, raw foods and excessive stimulation. Warm oil self-massage (Abhyanga) before shower, daily.' },
          { step: 'PITTA BALANCE', instruction: 'Avoid the midday sun and strenuous exercise between 10 AM and 2 PM. Eat cooling foods (coconut, cucumber, mint, coriander). Cultivate forgiveness and non-competition. Spend time in nature near water. Practice cooling pranayama (Shitali breath).' },
          { step: 'KAPHA BALANCE', instruction: 'Rise before 6 AM (before the Kapha time). Exercise vigorously daily — this is essential. Eat light, spicy, dry foods. Avoid daytime napping. Vary your routine to stimulate change. Fast one day per week (fruit only or liquids).' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'A person who is always cold, has dry skin, irregular digestion, racing thoughts and difficulty sleeping — what is their dominant imbalance?',
        quizOptions: ['Excess Pitta', 'Excess Kapha', 'Excess Vata', 'Balanced Tridosha'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "You now hold the single most powerful lens in all of medicine: the ability to classify any physical or psychological symptom as an expression of elemental imbalance. This is not just philosophy — it is practical clinical intelligence. In the next modules, we will go deeper. But for now: Which dosha do you recognize most strongly in yourself?",
    keyTakeaways: [
      'Vata = Space + Air. Governs movement. Signs: dry, cold, light, mobile, anxious.',
      'Pitta = Fire + Water. Governs transformation. Signs: hot, sharp, intense, focused.',
      'Kapha = Earth + Water. Governs cohesion. Signs: heavy, slow, stable, nurturing.',
      'Prakriti = your birth constitution (fixed for life).',
      'Vikriti = your current state of imbalance (changeable through lifestyle).',
      'All disease is Vikriti — deviation from your original nature.',
      'Goal: Bring Vikriti back to Prakriti.',
    ],
    dailyPractice: 'Every morning before eating: assess which dosha is dominant today. Notice the quality of your digestion, your mood, your energy. Write: "Today I am feeling ___ (vata/pitta/kapha)-predominant because ___." This daily awareness is the foundation of self-healing.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 04 — MUKKUTTRAM (Siddha's Three Humors)
  // ═══════════════════════════════════════════════════════════
  4: {
    moduleNumber: 4,
    agastyarOpening: "What I now give you, you will not find in any Western Ayurveda book. You will not find it in any online course. This is the Siddha layer — the deeper current beneath what Charaka wrote. The three humors of Siddha medicine carry the same names as Tridosha but they are not the same. They are older. They run deeper. Listen carefully.",
    sections: [
      {
        type: 'teaching',
        title: 'Mukkuttram — The Three Faults of Siddha',
        body: `In Siddha medicine, the body's physiological intelligence is governed by three humors called **Mukkuttram** (மூக்குற்றம்) — literally "the three faults" or "the three that can become defective":

1. **Vatham** (வாதம்) — the wind principle
2. **Pitham** (பித்தம்) — the bile principle
3. **Kabam** (கபம்) — the phlegm principle

These parallel the Ayurvedic Tridosha (Vata, Pitta, Kapha) but the Siddha system goes significantly further. Where Ayurveda describes 5 subtypes for each dosha, the Siddha system identifies **10 types of Vatham, 5 types of Pitham, and 5 types of Kabam** — each with distinct physiological functions, locations, and pathological expressions.

**The ratio of health:** Vatham : Pitham : Kabam = **4 : 2 : 1**
This is the ideal ratio. When this ratio is maintained, perfect health exists.`,
      },
      {
        type: 'teaching',
        title: 'The 10 Types of Vatham (Vayus)',
        body: 'Vatham governs all movement in the body — from nerve impulses to digestion to thought. The 10 types are the 10 specific forces of biological movement:',
        items: [
          '**Pranan (Prana Vayu)** — Located in the chest and head. Governs: inhaling, swallowing, heartbeat, sensory reception. Pathology when disturbed: respiratory disorders, cardiac problems, mental confusion.',
          '**Abanan (Apana Vayu)** — Located in the lower abdomen and pelvic floor. Governs: elimination (stool, urine, menstruation, childbirth, reproduction). Pathology: constipation, reproductive disorders, lower back pain.',
          '**Viyanan (Vyana Vayu)** — Pervades the entire body through the blood and nerves. Governs: circulation of blood and nutrients throughout the body. Pathology: circulatory disorders, edema, numbness.',
          '**Utanan (Udana Vayu)** — Located in the throat and chest. Governs: upward movement — speech, singing, memory, expression, effort. Pathology: speech disorders, thyroid imbalances.',
          '**Samanan (Samana Vayu)** — Located in the stomach and small intestine. Governs: the balancing force that controls digestive enzymes and assimilation. Pathology: malabsorption, digestive weakness.',
          '**Nagan (Naga Vayu)** — Governs: opening of the eyes, yawning, hunger signals. Pathology: eye disorders, appetite disturbances.',
          '**Kurman (Kurma Vayu)** — Governs: closing of the eyelids, blinking. Pathology: eye problems, inability to focus vision.',
          '**Kirukaran (Krikara Vayu)** — Located in the throat. Governs: sneezing, coughing, salivation, hunger. Pathology: throat disorders, dry mouth.',
          '**Devathatthan (Devadatta Vayu)** — Governs: yawning, inducing sleep. Pathology: sleep disorders, excess sleepiness.',
          '**Dhananjeyan (Dhananjaya Vayu)** — Pervades the entire body. Governs: nourishing all tissues; remains in the body even after death (said to cause the bloating of a deceased body). Pathology: generalized weakness.',
        ],
      },
      {
        type: 'teaching',
        title: 'The 5 Types of Pitham',
        body: 'Pitham governs all transformation, metabolism, and digestive intelligence:',
        items: [
          '**Anal Pitham (Pachaka)** — Located in the stomach and small intestine. Governs: digestion of food, separation of nutrition from waste. The master digestive fire.',
          '**Ranjaka Pitham** — Located in the liver, spleen, stomach. Governs: gives color to blood (ranjaka = "that which colors"). Blood production and quality.',
          '**Sadhaka Pitham** — Located in the heart. Governs: intellectual satisfaction, emotional intelligence, memory, willpower, the "I am" sense. The fire of psychological transformation.',
          '**Alosaka Pitham (Alochaka)** — Located in the eyes. Governs: vision, perception, reception of light. Eye health.',
          '**Bharajaka Pitham** — Located in the skin. Governs: skin color and luster, temperature regulation through the skin, absorption through skin.',
        ],
      },
      {
        type: 'teaching',
        title: 'The 5 Types of Kabam',
        body: 'Kabam governs all structure, lubrication, and cohesion:',
        items: [
          '**Avalambaka Kabam** — Located in the chest and heart. Governs: supports the heart and lungs, provides moisture to the chest cavity. This is the "pillar" Kapha — if it is strong, all other Kabam subtypes are strong.',
          '**Kiledaka Kabam (Kledaka)** — Located in the stomach lining. Governs: moistening food for digestion, protecting the stomach from digestive fire. First line of digestive protection.',
          '**Bodhaka Kabam** — Located in the mouth and tongue. Governs: lubrication of mouth, initial taste perception, beginning of digestion.',
          '**Tharpaka Kabam (Tarpaka)** — Located in the head (sinuses, brain). Governs: nourishes the sense organs, provides cerebrospinal fluid, creates a sense of satisfaction and contentment.',
          '**Sleshmaka Kabam (Sleshaka)** — Located in all joints. Governs: lubrication of all joints. Pathology when disturbed: arthritis, joint pain, creaking joints.',
        ],
      },
      {
        type: 'secret',
        title: '⟡ Agastyar\'s Secret Teaching: The Siddha Diagnostic Advantage',
        body: `The reason Siddha diagnosis is more precise than standard Ayurvedic diagnosis is that the 10 Vayus allow you to locate EXACTLY which wind is disturbed — and from that, identify the organ and system affected.

For example: A patient complains of constipation, lower back pain, and reproductive problems. Standard Ayurveda says: "High Vata." Siddha diagnosis says: "Abana Vatham is specifically disturbed — the downward-moving wind of the lower pelvic floor."

This precision leads to more targeted treatment. Where Ayurveda might prescribe general Vata-balancing herbs, Siddha specifies: Castor oil (Erandha) in warm water before bed — specifically to restore Abana Vatham.

**This specificity is one of the reasons Siddha medicine has treated conditions that standard Ayurveda could not resolve.**`,
      },
      {
        type: 'table',
        title: 'Mukkuttram vs. Tridosha Comparison',
        tableData: {
          headers: ['Feature', 'Ayurveda Tridosha', 'Siddha Mukkuttram'],
          rows: [
            ['Subtypes', '5 Vata + 5 Pitta + 5 Kapha = 15', '10 Vatham + 5 Pitham + 5 Kabam = 20'],
            ['Disease classification', '1,008 diseases', '4,448 diseases'],
            ['Diagnostic precision', 'Dosha + tissue location', 'Specific Vayu/humor subtype + tissue + Nadi reading'],
            ['Balance ratio', 'Equal balance preferred', 'Vatham:Pitham:Kabam = 4:2:1'],
            ['Origin text', 'Charaka Samhita, Sushruta', 'Agastyar texts, 18 Siddhar palm manuscripts'],
          ],
        },
      },
      {
        type: 'quiz',
        quizQuestion: 'Which of the 10 Vathams governs elimination — bowel movements, urination, menstruation, and childbirth?',
        quizOptions: ['Pranan (chest)', 'Abanan (pelvis)', 'Viyanan (whole body)', 'Samanan (stomach)'],
        quizAnswer: 1,
      },
      {
        type: 'quiz',
        quizQuestion: 'What is the ideal ratio of Vatham : Pitham : Kabam in perfect health according to Siddha medicine?',
        quizOptions: ['1:1:1', '2:1:1', '4:2:1', '3:2:1'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "You now carry knowledge that most practitioners with decades of training have never received. The Mukkuttram is the Siddha lens. Carry it lightly — it is precise. In the clinic, this granularity saves lives. When someone has a symptom, do not just think 'Vata.' Ask: which Vayu? Where does it sit? What is its specific function that has gone wrong? That question is the beginning of mastery.",
    keyTakeaways: [
      'Siddha Mukkuttram = Vatham, Pitham, Kabam (parallel to Tridosha but deeper).',
      'Perfect health ratio: Vatham:Pitham:Kabam = 4:2:1.',
      '10 types of Vatham govern specific movements in the body.',
      '5 types of Pitham govern different aspects of transformation.',
      '5 types of Kabam govern different aspects of structure and lubrication.',
      'Siddha\'s precision in identifying which sub-humor is disturbed gives more targeted treatment.',
      'This knowledge is NOT in mainstream Ayurveda courses — it is exclusive to Siddha lineage.',
    ],
    dailyPractice: 'When you notice any physical sensation today — pain, bloating, fatigue, skin issue — ask: "Which of the 10 Vathams, 5 Pithams, or 5 Kabams might be responsible for this?" This practice builds clinical intelligence over time.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 05 — THE SEVEN DHATUS
  // ═══════════════════════════════════════════════════════════
  5: {
    moduleNumber: 5,
    agastyarOpening: "The body builds itself in a precise sequence. One tissue feeds the next. The intelligence that creates a galaxy also creates your bone marrow. Once you understand how the Dhatus are constructed and nourished, you will understand why disease takes time to develop — and why true healing also takes time.",
    sections: [
      {
        type: 'teaching',
        title: 'The Seven Dhatus — The Body\'s Living Architecture',
        body: `**Dhatu** (धातु) means "that which sustains" or "that which holds together." The seven Dhatus are the seven bodily tissues that make up the physical structure of the human body. They are built sequentially — each one nourishing and giving rise to the next — in a process that takes approximately **35 days** to complete one full cycle.

The sequence follows a law of increasing subtlety: from the grossest tissue (plasma) to the most subtle and spiritually significant (reproductive tissue / Ojas).`,
      },
      {
        type: 'teaching',
        title: 'The 7 Dhatus in Sequence',
        body: 'Each tissue is built from the previous one, in this order:',
        items: [
          '**1. RASA (Plasma / Lymph)** — The first tissue. When food is properly digested, the essence becomes Rasa. It is the clear fluid that bathes all cells, carries nutrients, and is the foundation of immunity and nourishment. Rasa = "that which gives satisfaction." Signs of deficiency: fatigue, dryness, low immunity, sadness.',
          '**2. RAKTA (Blood)** — Built from Rasa. Specifically refers to the oxygen-carrying elements of blood (red blood cells). Rakta gives luster, life force, and the quality of being alive. Governs: vitality, courage, discrimination. Signs of deficiency: anemia, pale skin, poor circulation. Signs of excess: skin disorders, anger, inflammation.',
          '**3. MAMSA (Muscle Tissue)** — Built from Rakta. All muscle in the body — skeletal, cardiac, smooth. Mamsa gives strength, stability, and the ability to take action. Signs of deficiency: muscular weakness, wasting. Signs of excess: excessive muscle bulk, tumors.',
          '**4. MEDA (Adipose Tissue / Fat)** — Built from Mamsa. Not merely "fat" — Meda lubricates all tissues, stores energy, insulates the body, and is a repository of liposoluble toxins. It is the seat of love and nourishment. Signs of deficiency: dry joints, emaciation, fear. Signs of excess: obesity, diabetes, sluggishness.',
          '**5. ASTHI (Bone Tissue)** — Built from Meda. All bones, teeth, cartilage, nails, hair. The structural scaffolding of existence. Governs: support, the feeling of being held, rootedness. Signs of deficiency: osteoporosis, bone pain, brittle nails and hair. Signs of excess: bone spurs, extra teeth.',
          '**6. MAJJA (Bone Marrow / Nerve Tissue)** — Built from Asthi. All bone marrow AND nervous system tissue (myelin sheath). The bridge between the physical and the subtle. Governs: memory, consciousness, and the communication between the mind and the body. Signs of deficiency: multiple sclerosis-like conditions, poor memory, eye problems. Signs of excess: heaviness in the eyes, joint pain.',
          '**7. SHUKRA / ARTAVA (Reproductive Tissue)** — Built from Majja. The final and most refined tissue — male reproductive tissue (Shukra) and female reproductive tissue (Artava). Governs: creativity, procreation, vitality, spiritual life force. Signs of deficiency: infertility, loss of creativity, spiritual disconnection. Signs of excess: excessive sexual drive, loss of focus.',
        ],
      },
      {
        type: 'teaching',
        title: 'OJAS — The Eighth Subtle Tissue',
        body: `Beyond the seven Dhatus lies the most important substance in the body: **Ojas** (ओजस्) — the "vital essence" or "primordial vigor."

Ojas is the pure end-product of the entire Dhatu sequence. When food is perfectly digested, when all seven tissues are perfectly nourished, the final distillation is Ojas.

Ojas is:
- The essence of all body fluids
- The physical substrate of immunity
- The carrier of prana (life force) into the body
- The material of spiritual experience — the bridge between body and consciousness
- The substance that makes the eyes shine, the skin glow, and the presence magnetic

**Para Ojas (Superior Ojas):** 8 drops, located in the heart. If this is destroyed, death follows.
**Apara Ojas (Inferior Ojas):** Half an Anjali (cupped palm), distributed throughout the body. This is the Ojas that can be cultivated or depleted.

**Ojas depleters:** Excessive sex, excessive fasting, trauma, grief, worry, anger, excessive exercise, poor food, late nights.

**Ojas builders:** Sleep (especially before midnight), saffron milk, almonds, ghee, ashwagandha, brahmi, love, prayer, mantra, meditation, spiritual practice, breathing fresh air, spending time in nature.`,
      },
      {
        type: 'teaching',
        title: 'The 35-Day Tissue Cycle',
        body: `The transformation from food to the finest tissue (Shukra/Artava) takes 35 days:
- **Day 1-5:** Food → Rasa (plasma)
- **Day 6-10:** Rasa → Rakta (blood)
- **Day 11-15:** Rakta → Mamsa (muscle)
- **Day 16-20:** Mamsa → Meda (fat)
- **Day 21-25:** Meda → Asthi (bone)
- **Day 26-30:** Asthi → Majja (marrow/nerve)
- **Day 31-35:** Majja → Shukra/Artava (reproductive tissue) → Ojas

This is why Ayurvedic treatment takes a minimum of 4-6 weeks to be properly assessed. You are changing the raw material that builds tissue. The change doesn't manifest overnight — it manifests in cycles.

This is also why diet is the foundational medicine. Every meal you eat today is literally becoming your blood, bones, and nerves over the next 35 days.`,
      },
      {
        type: 'practice',
        title: 'Ojas Building Daily Protocol',
        ritual: [
          { step: 'MORNING', instruction: 'Soak 5 almonds overnight. Peel in morning. Blend with warm milk, 1 pinch saffron, 1/4 tsp cardamom, 1 tsp raw honey (added after cooling below 40°C). Drink slowly, sitting down.' },
          { step: 'MIDDAY', instruction: 'Eat your largest meal between 12-2 PM when digestive fire (Agni) is strongest. Include ghee in the meal. Eat in a calm environment, no screens.' },
          { step: 'EVENING', instruction: 'Warm golden milk before bed: 1 cup whole milk, 1/2 tsp turmeric, 1/4 tsp ashwagandha powder, 1 tsp ghee, pinch of black pepper. Builds Ojas during sleep.' },
          { step: 'SLEEP', instruction: 'Sleep before 10 PM — the hours before midnight are the most Ojas-restorative. Each hour of sleep before midnight = 2 hours after midnight in regenerative value.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'What is Ojas and where is its primary (Para) seat in the body?',
        quizOptions: ['Digestive enzyme — located in the stomach', 'Vital essence — located in the heart', 'Reproductive fluid — located in the pelvis', 'Nerve fluid — located in the brain'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Every meal you eat is literally medicine or poison for your future tissues. The bread you eat today becomes your blood in 5 days, your muscle in 15 days, your bone in 25 days, your nerve tissue in 30 days. This is not metaphor — this is the architecture of life. Treat every meal as a sacred act of tissue building.",
    keyTakeaways: [
      'Seven Dhatus build in sequence: Rasa → Rakta → Mamsa → Meda → Asthi → Majja → Shukra.',
      'Each tissue is the refined product of the previous — takes 5 days each, 35 days total.',
      'Ojas is the final product — the essence of all dhatus and the seat of immunity and consciousness.',
      'Para Ojas (8 drops in heart) — if destroyed, death follows.',
      'Every meal today literally becomes your bone, nerve, and reproductive tissue over 35 days.',
      'Diet is the primary medicine — this sequence is why.',
    ],
    dailyPractice: 'Begin the Ojas-building morning practice today: soaked almonds + warm saffron milk on an empty stomach. Do this for 40 days (one complete Dhatu cycle + 5 days) and notice the change in your skin, eyes, energy, and mental clarity.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 06 — AGNI: THE SACRED FIRE
  // ═══════════════════════════════════════════════════════════
  6: {
    moduleNumber: 6,
    agastyarOpening: "Agni is Brahma. This is not poetry — in Ayurveda, the digestive fire IS the creative force of the cosmos expressing itself in your belly. When your Agni is strong and balanced, you transform food into consciousness. When it is weak, even the finest food becomes poison. Agni is the master key of Ayurvedic medicine.",
    sections: [
      {
        type: 'teaching',
        title: 'What Is Agni?',
        body: `**Agni** (अग्नि) literally means fire. In Ayurveda, it refers to all the metabolic and digestive enzymes and processes in the body — the biological fire that powers all transformation.

The Charaka Samhita says: *"Ayu (life) depends on Agni. Varna (complexion), bala (strength), svāsthya (health), utsāha (enthusiasm), upachaya (growth), prabha (radiance), ojas, tejas, agni — these are all Agni."*

Agni does not just digest food. It digests:
- Physical food → nutrients
- Emotions → processed experience (or Ama if undigested)
- Perceptions → wisdom
- Experiences → memory and understanding
- Toxins → harmless substances

**The root cause of all disease in Ayurveda:** "Mandagnau sarvadoshanam" — All disease begins with weakened Agni.`,
      },
      {
        type: 'teaching',
        title: 'The 13 Types of Agni',
        body: `There are **13 fires** in the human body:

**The Master Fire:**
- **Jatharagni** (जठराग्नि) — The gastric / intestinal fire. Located in the stomach and small intestine. This is the MASTER fire — it governs and directly influences all other fires.

**The 5 Elemental Fires (Bhutagnis):**
These digest the elemental portions of food — transforming the fire portion of food to nourish fire tissue in the body, and so on:
- Akasha Agni, Vayu Agni, Agni Agni, Jala Agni, Prithvi Agni

**The 7 Tissue Fires (Dhatvagnis):**
One fire in each tissue — transforms the nutrition from the previous tissue into the next:
- Rasa Agni, Rakta Agni, Mamsa Agni, Meda Agni, Asthi Agni, Majja Agni, Shukra Agni

If the Jatharagni is strong, all 12 subsidiary fires are strong. If the Jatharagni is weakened, all become weakened. This is why treating digestion is often enough to treat the whole system.`,
      },
      {
        type: 'teaching',
        title: 'The 4 States of Agni',
        body: 'Jatharagni can exist in 4 states:',
        items: [
          '**1. SAMA AGNI (Balanced Fire) ✓** — The goal state. Food is digested well in 3-6 hours. Regular hunger. Complete evacuation. No gas, bloating, or reflux. Mind is clear after eating. Skin is clear and glowing.',
          '**2. VISHAMA AGNI (Irregular Fire) — Vata type** — Digestion is unpredictable. Sometimes strong, sometimes weak. Gas, bloating, constipation alternating with loose stools. Irregular hunger. Gurgling. Variable energy. Associated with high Vata.',
          '**3. TIKSHNA AGNI (Sharp/Hyper Fire) — Pitta type** — Digestion is too fast and too hot. Burns through food quickly. Frequent hunger (must eat or becomes irritable). Acid reflux, heartburn, loose stools, diarrhea. Inflammation. Associated with high Pitta.',
          '**4. MANDA AGNI (Dull/Slow Fire) — Kapha type** — Digestion is very slow. Little hunger. Heavy feeling after eating. Nausea. Mucus in stool. Weight gain. Food sits in the stomach too long. Associated with high Kapha.',
        ],
      },
      {
        type: 'teaching',
        title: 'AMA — The Root of All Disease',
        body: `When Agni is weak or imbalanced, it fails to fully transform food and experience. The incomplete transformation produces **Ama** (आम) — literally "uncooked," "immature," or "raw."

Ama is:
- The physical accumulation of undigested material
- Sticky, heavy, foul-smelling, cloudy
- The root of all disease according to Ayurveda
- The breeding ground of pathogenic organisms
- What blocks the channels (Srotas) of the body

**How to know if you have Ama:**
- Your tongue has a thick white/yellow/brown coating in the morning
- Your breath is heavy or stale upon waking
- You feel heavy and sluggish, especially in the morning
- Your urine is cloudy rather than clear
- Your joints feel stiff and heavy
- Your mind feels foggy (mental Ama)

**The Ama tongue test:** Check your tongue in the morning. A clean, pink tongue with no coating = low Ama, good Agni. A thick white/gray coating = high Ama.`,
      },
      {
        type: 'table',
        title: 'Signs of Each Agni State',
        tableData: {
          headers: ['Symptom', 'Sama (Balanced)', 'Vishama (Vata)', 'Tikshna (Pitta)', 'Manda (Kapha)'],
          rows: [
            ['Hunger', 'Regular, at meal times', 'Variable/irregular', 'Frequent, intense', 'Low or absent'],
            ['Digestion time', '3-6 hours', '2-8 hours (variable)', '1-3 hours (fast)', '6-12+ hours (slow)'],
            ['Stool', 'Well-formed, easy, once/day', 'Hard, dry, gas, alternating', 'Loose, yellowish, burning', 'Heavy, mucusy, slow'],
            ['After eating', 'Light, energized', 'Gas, bloating', 'Warm, acid, sometimes urgent', 'Heavy, sleepy, nauseous'],
            ['Tongue', 'Pink, clean', 'Grayish coating, thin', 'Yellow/orange coating', 'Thick white coating'],
            ['Mind after eating', 'Clear, focused', 'Anxious, spacey', 'Impatient, sharp', 'Foggy, sleepy'],
          ],
        },
      },
      {
        type: 'practice',
        title: 'Agni Kindling Morning Protocol',
        ritual: [
          { step: '1. WAKE', instruction: 'Rise at or before sunrise. Tongue scrape from back to front, 7-14 times with a copper or silver tongue scraper. This removes Ama that accumulated overnight.' },
          { step: '2. WARM WATER', instruction: 'Drink 1-2 cups of warm (not boiling) water with a squeeze of lemon and a pinch of rock salt. This activates the digestive fire gently, lubricates the channels, and stimulates peristalsis.' },
          { step: '3. GINGER TEA', instruction: 'Before meals: drink ginger tea with lemon (slice fresh ginger, steep in hot water for 5 min). This is the single most powerful Agni-kindling practice. Ginger is called Vishwabheshaja — the "universal medicine" — precisely because it ignites Agni.' },
          { step: '4. BEFORE MEALS', instruction: 'Eat a small piece of fresh ginger with rock salt and lemon juice 15 minutes before the main meal. This activates digestive enzymes and prepares the fire.' },
          { step: '5. BETWEEN MEALS', instruction: 'Do NOT snack. Snacking extinguishes Agni by introducing new food before the previous meal is processed. Allow 4-6 hours between meals for complete digestion.' },
        ],
      },
      {
        type: 'herb',
        herbName: 'Ginger — The Universal Medicine',
        herbProps: {
          Sanskrit: 'Ardraka (fresh), Shunti (dry)',
          Taste: 'Pungent (fresh), Pungent + Sweet (dry after digestion)',
          Potency: 'Heating (Ushna)',
          Effect: 'Strengthens Agni, reduces Ama, improves absorption, reduces nausea, anti-inflammatory',
          Uses: 'Digestive weakness, nausea, congestion, joint pain, sluggish metabolism, poor circulation',
        },
      },
      {
        type: 'quiz',
        quizQuestion: 'A person experiences acid reflux, heartburn, loose stools, and intense hunger. Which state of Agni is this?',
        quizOptions: ['Sama Agni (balanced)', 'Vishama Agni (irregular)', 'Tikshna Agni (sharp)', 'Manda Agni (dull)'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "The tongue is the mirror of your digestion. The digestion is the mirror of your life force. Clean your tongue every morning and you will receive a daily diagnostic report from your body. Feed your Agni with warmth, routine, ginger, and quiet — and you will never need a doctor for most common ailments.",
    keyTakeaways: [
      'Agni = all digestive and metabolic fire. The master key of Ayurvedic medicine.',
      'All disease begins with weakened or imbalanced Agni.',
      '13 fires: 1 Jatharagni (master), 5 Bhutagnis, 7 Dhatvagnis.',
      '4 states: Sama (balanced), Vishama (irregular-Vata), Tikshna (sharp-Pitta), Manda (slow-Kapha).',
      'Ama = undigested material — the root of all disease. Check your tongue each morning.',
      'Ginger (Vishwabheshaja) = the universal medicine for Agni.',
      'Do NOT snack between meals — it extinguishes Agni.',
    ],
    dailyPractice: 'Every morning: tongue scrape, warm water with lemon, ginger tea. Check your tongue before scraping and note the coating (Ama level). Track how the coating changes over 2 weeks with these practices.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 07 — THE THREE MALAS
  // ═══════════════════════════════════════════════════════════
  7: {
    moduleNumber: 7,
    agastyarOpening: "Modern culture is ashamed of its waste. Ancient wisdom is fascinated by it. Your eliminations are the body's most honest communication. In 5 minutes reading the Malas — stool, urine, sweat — I can assess the state of your doshas, your digestion, your liver, your kidneys, and your emotional life. Pay attention to what your body releases.",
    sections: [
      {
        type: 'teaching',
        title: 'What Are Malas?',
        body: `**Mala** (मल) means "waste" or "impurity." The three primary Malas are the body's three elimination channels:

1. **Purisha** (पुरीष) — Stool/Feces
2. **Mutra** (मूत्र) — Urine
3. **Sweda** (स्वेद) — Sweat

While the Dhatus (tissues) are what the body builds, the Malas are what the body releases. They are not merely waste — they have important physiological functions while within the body. It is only when they accumulate or are not released properly that they become problematic.

Proper elimination is as important as proper nutrition. The body must be able to release as efficiently as it absorbs.`,
      },
      {
        type: 'teaching',
        title: 'PURISHA — Reading Your Stool',
        body: `**Healthy stool (Sama Purisha) characteristics:**
- Well-formed (like a ripe banana — not hard pellets, not liquid)
- Medium brown color
- Passes without straining, once a day (ideally in the morning)
- Sinks to the bottom (not floats)
- Mild odor (not extremely foul)
- Complete elimination — no sense of residue left

**Dosha-specific stool patterns:**

**Vata stool:** Hard, dry, dark, pellet-like, difficult to pass, constipated. Gas. Feeling of incomplete evacuation. May alternate with loose stools.

**Pitta stool:** Loose, yellowish-brown, burning, frequent, sometimes urgent. Strong odor. Diarrhea tendency. Sometimes red-tinged.

**Kapha stool:** Heavy, pale, mucusy, slow, sluggish. One elimination per day or every other day. May float (excess fat).`,
      },
      {
        type: 'teaching',
        title: 'MUTRA — Reading Your Urine',
        body: `**Healthy urine characteristics:**
- Clear to pale yellow
- Approximately 1-1.5 liters per day (4-6 times)
- Mild odor
- No burning on urination

**The Siddha Neermani test:** This ancient diagnostic method uses a drop of oil in urine to read health status. (Covered in depth in Phase 2: Siddha Diagnostic Arts)

**Urine color diagnostic chart:**
- **Colorless / very pale:** May indicate excess water intake, diabetes insipidus, or high Kapha
- **Pale yellow:** Healthy, good hydration
- **Dark yellow:** Mild dehydration
- **Amber / orange:** Significant dehydration, or liver stress (jaundice early stage)
- **Brown / tea-colored:** Liver issue, rhabdomyolysis — needs medical attention
- **Red / pink:** Blood in urine — needs medical attention
- **Cloudy / turbid:** UTI, Ama accumulation, kidney stress
- **Foamy:** Excess protein in urine — kidney assessment needed`,
      },
      {
        type: 'teaching',
        title: 'SWEDA — Reading Your Sweat',
        body: `**Healthy sweat** moistens the skin appropriately during exercise, clears toxins through the skin, and is slightly salty with a mild odor.

**Imbalance signs:**
- **Excessive sweating (hyperhidrosis):** High Pitta or Kapha. May indicate metabolic disorders.
- **Very little sweating:** High Vata. Skin becomes dry. Poor toxin elimination through skin.
- **Foul-smelling sweat:** High Ama (toxin accumulation), Pitta excess. Liver or digestive stress.
- **Night sweats:** High Pitta, hormonal imbalance, Ama burning off during sleep — important diagnostic sign.

**Sweat as a therapy:** Swedana (steam therapy / sweating therapy) is one of the most important preparatory procedures for Panchakarma. It opens channels, liquefies toxins, and allows them to be removed.`,
      },
      {
        type: 'table',
        title: 'Mala Assessment — Quick Diagnostic Reference',
        tableData: {
          headers: ['Mala', 'Healthy Sign', 'Vata Excess', 'Pitta Excess', 'Kapha Excess'],
          rows: [
            ['Purisha (stool)', 'Well-formed, daily, complete', 'Dry, hard, pellets, constipated', 'Loose, burning, yellow, frequent', 'Heavy, pale, mucusy, sluggish'],
            ['Mutra (urine)', 'Pale yellow, clear, 4-6x daily', 'Scanty, dark, nervous frequency', 'Yellow/orange, burning, frequent', 'Pale/cloudy, large quantity'],
            ['Sweda (sweat)', 'Mild during exercise, slight salt', 'Very little, dry skin', 'Excessive, foul-smelling, hot', 'Moderate, slightly sweet odor'],
          ],
        },
      },
      {
        type: 'practice',
        title: 'Morning Mala Assessment Practice (5 minutes)',
        ritual: [
          { step: 'TONGUE CHECK', instruction: 'Before tongue scraping: look at coating color, thickness, and texture. This reflects digestive/Ama status.' },
          { step: 'STOOL CHECK', instruction: 'Note: consistency (hard/soft/liquid), color, whether complete, whether gas was present, odor. Takes 10 seconds.' },
          { step: 'URINE CHECK', instruction: 'Note: color, clarity, any unusual odor, any burning. First morning urine is most concentrated — most diagnostic.' },
          { step: 'SKIN CHECK', instruction: 'Note: is skin dry, oily, or normal today? Any rashes or changes? Did you sweat during the night?' },
          { step: 'RECORD', instruction: 'Keep a simple 5-day Mala log. After 5 days, you will have a clear picture of your dominant dosha state and Agni strength. This is traditional Ayurvedic self-monitoring.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Foamy urine in the morning may indicate excess of what in the urine — requiring kidney assessment?',
        quizOptions: ['Excess glucose (diabetes)', 'Excess protein', 'Excess salt', 'Excess Vata'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "The Malas are your body's daily report card. Five minutes of observation every morning is worth more than most medical check-ups. The body is always communicating. The Siddha physician's first act is to listen — not with a stethoscope, but with the eyes, the nose, and the intelligence trained to read these signals.",
    keyTakeaways: [
      'Three Malas: Purisha (stool), Mutra (urine), Sweda (sweat).',
      'Healthy stool: well-formed, medium brown, once daily, passes easily.',
      'Healthy urine: pale yellow, clear, 4-6x daily, no burning.',
      'Healthy sweat: mild during exercise, slight salt odor, clears toxins.',
      'Foamy urine = possible protein — kidney assessment needed.',
      'Foul-smelling sweat = high Ama + Pitta.',
      'Do a 5-minute morning Mala assessment daily — it is your daily diagnostic.',
    ],
    dailyPractice: 'For the next 7 days, keep a simple morning Mala log: tongue coating (clean/thin/thick/color), stool (hard/formed/loose), urine (pale/yellow/dark), sweat last night (yes/no/foul). After 7 days you will know your Agni state with precision.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 08 — DINACHARYA
  // ═══════════════════════════════════════════════════════════
  8: {
    moduleNumber: 8,
    agastyarOpening: "The most powerful medicine I ever prescribed was never a herb. It was a daily schedule. Dinacharya — the daily routine — is the foundation upon which all other health practices rest. Without it, even the finest herbs will not hold. With it, most disease never develops at all. This is preventive medicine at its highest expression.",
    sections: [
      {
        type: 'teaching',
        title: 'Why Daily Routine Is Medicine',
        body: `The human body operates on circadian rhythms — biological cycles that repeat every 24 hours. These rhythms govern hormone release, body temperature, digestive enzyme activity, immune function, and cellular repair. When your daily routine ALIGNS with these rhythms, the body operates at maximum efficiency. When it conflicts with them (as most modern schedules do), stress accumulates.

Ayurveda mapped these rhythms 5,000 years ago through the lens of the Doshas. The day is divided into six 4-hour periods — two governed by each Dosha:

- **6 AM – 10 AM: Kapha time** (heavy, stable, ideal for exercise)
- **10 AM – 2 PM: Pitta time** (hot, sharp, ideal for main meal and mental work)
- **2 PM – 6 PM: Vata time** (mobile, creative, ideal for creative work)
- **6 PM – 10 PM: Kapha time** (slowing down, ideal for gentle activity and dinner)
- **10 PM – 2 AM: Pitta time** (liver detox, cellular repair — must be ASLEEP)
- **2 AM – 6 AM: Vata time** (lightness, ideal for spiritual practice — Brahma Muhurta)`,
      },
      {
        type: 'teaching',
        title: 'THE COMPLETE DINACHARYA — Morning Sequence',
        body: 'Each step has a specific physiological purpose:',
        ritual: undefined,
        items: undefined,
      },
      {
        type: 'practice',
        title: 'Complete Morning Routine (Step by Step)',
        ritual: [
          { step: '4:30-5:30 AM — BRAHMA MUHURTA', instruction: 'Wake up 96 minutes before sunrise. This is the "Creator\'s Hour" — the window when Vata (subtle movement) is at its peak, the mind is clearest, the nervous system is most receptive. This is when Siddhas meditate. Even 30 minutes of stillness here changes the quality of the entire day.' },
          { step: '5:30 AM — AYURVEDA MORNING OIL', instruction: 'Scrape tongue (7-14 strokes copper/silver scraper, back to front). This removes the Ama that accumulated overnight and stimulates the corresponding organ reflex points on the tongue.' },
          { step: '5:40 AM — OIL PULLING (Kavala)', instruction: 'Take 1 tablespoon sesame or coconut oil in mouth. Swish for 10-20 minutes (while showering or getting ready). Spit out — never swallow (it collects toxins). This removes oral bacteria, strengthens teeth and gums, and has been shown to reduce Streptococcus mutans significantly.' },
          { step: '5:45 AM — NASYA (Nasal Oiling)', instruction: 'Place 2-3 drops of sesame oil or Anu Taila in each nostril (head tilted back). Sniff gently. This lubricates the nasal passages, protects the brain from environmental toxins, improves clarity of thought, and is said to activate the third eye. "The nose is the gateway to the brain" — Sushruta.' },
          { step: '5:50 AM — WARM WATER', instruction: 'Drink 1-2 cups warm (not boiling) water. Add lemon and rock salt. Stimulates bowel movement, hydrates overnight-depleted body, activates digestion.' },
          { step: '6:00 AM — EVACUATION', instruction: 'After warm water, sit on toilet with feet slightly elevated (Squatty Potty or a small stool). Do not force. Natural evacuation is essential before any food.' },
          { step: '6:15 AM — ABHYANGA (Self Oil Massage)', instruction: 'Warm sesame oil (Vata), coconut oil (Pitta), or light oil (Kapha). Massage entire body for 10-20 minutes — always toward the heart. Start with scalp/head, then face, then downward. This nourishes the skin, calms the nervous system, lubricates joints, and moves lymph. The most powerful daily Vata-balancing practice available.' },
          { step: '6:35 AM — YOGA / MOVEMENT', instruction: '15-45 minutes of movement appropriate to your dosha: Vata = slow gentle yoga, grounding. Pitta = moderate yoga, no competition. Kapha = vigorous exercise, must sweat.' },
          { step: '7:00 AM — SHOWER', instruction: 'Warm (not hot) shower. Cold rinse at the end (Kapha and Pitta). Wash off oil — you have already absorbed what the tissues needed.' },
          { step: '7:20 AM — PRANAYAMA / MEDITATION', instruction: '10-20 minutes of breathwork followed by meditation or mantra. Nadi Shodhana (alternate nostril breathing) balances all three Doshas. Silence in the morning sets the energetic tone for the entire day.' },
          { step: '8:00 AM — BREAKFAST', instruction: 'Only after the body is active and Agni has been kindled. Breakfast should be light and warm — NOT cold cereal, NOT cold smoothie. Warm porridge, cooked fruits, spiced oatmeal, warm milk with spices. The body has been fasting — reintroduce food gently.' },
        ],
      },
      {
        type: 'teaching',
        title: 'The Sacred Mid-Day and Evening',
        body: `**MIDDAY PROTOCOLS:**
- **12:00-1:30 PM:** Main meal. Pitta time — the strongest digestive fire. This should be your LARGEST meal. Sit down. Eat without screens or difficult conversations. Include all 6 tastes.

**EVENING PROTOCOLS:**
- **Sunset:** Light candles or reduce artificial light. Signal the nervous system that day is ending.
- **6:00-7:00 PM:** Light dinner — 50% of the lunch volume. Easy to digest. Soups, cooked vegetables, kitchari.
- **Evening walk (Shata Padi):** 100 steps after dinner — gentle walk aids digestion.
- **8:00 PM:** Wind down. No screens 1 hour before bed. Reading, gentle music, light conversations.
- **9:30-10:00 PM:** Sleep. Before the Pitta hour (10 PM-2 AM) is when the liver begins its cleansing. You must be asleep for this to occur.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'According to Ayurveda\'s Dosha clock, when should you eat your LARGEST meal of the day?',
        quizOptions: ['7-8 AM during Kapha time', '12-1 PM during Pitta time', '6-7 PM during Kapha evening time', 'Any time you feel hungry'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Do not try to implement all of this tomorrow. Begin with one practice. The morning warm water with lemon. Do that for 7 days. Then add tongue scraping. Then add oil pulling. Build the routine one brick at a time. A house is built brick by brick — a Dinacharya is built practice by practice. In 40 days (one Dhatu cycle), you will not recognize your energy levels.",
    keyTakeaways: [
      'Dinacharya = daily routine aligned with the Dosha clock = the most powerful preventive medicine.',
      'Wake at Brahma Muhurta (96 min before sunrise) — the window of highest consciousness.',
      'Tongue scraping every morning removes Ama and stimulates organ reflex points.',
      'Abhyanga (self-oil massage) is the most important daily Vata-balancing practice.',
      'Largest meal at noon during Pitta time when digestive fire is strongest.',
      'Be asleep before 10 PM — Pitta liver cleansing (10 PM-2 AM) requires sleep.',
      'Begin with ONE practice, not all — build gradually over 40 days.',
    ],
    dailyPractice: 'Tomorrow morning: tongue scrape + warm lemon water. That\'s it — just these two. For 7 days. Then tell yourself what changed.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 09 — RITUCHARYA (SEASONAL ROUTINE)
  // ═══════════════════════════════════════════════════════════
  9: {
    moduleNumber: 9,
    agastyarOpening: "The body is not separate from Nature — it IS Nature. When you resist the seasons, you create disease. When you flow with them, you embody health effortlessly. The Siddha physician reads the season in the sky and prescribes accordingly. This is ecological medicine at its most profound.",
    sections: [
      {
        type: 'teaching',
        title: 'The Six Seasons of Ayurveda (Ritucharya)',
        body: `Ayurveda divides the year into **six seasons (Ritu)** of approximately two months each, aligned with the Hindu calendar. Each season has a specific effect on the Doshas — accumulating, aggravating, or pacifying each.

The key insight of Ritucharya: **Dosha accumulation precedes disease by a full season.** This means: if you adjust your diet and lifestyle in the ACCUMULATION phase, you prevent the disease that would manifest in the AGGRAVATION phase.

Understanding the Doshas through seasons:
- **Vata** accumulates in summer, aggravates in autumn
- **Pitta** accumulates in spring/summer, aggravates in summer/early autumn
- **Kapha** accumulates in late winter, aggravates in spring`,
      },
      {
        type: 'table',
        title: 'Six Seasons — Complete Ritucharya Guide',
        tableData: {
          headers: ['Season', 'Months (N. Hemisphere)', 'Dominant Dosha', 'Key Practices', 'Foods to Favor', 'Foods to Avoid'],
          rows: [
            ['Hemanta (Early Winter)', 'Nov-Dec', 'Kapha begins; Vata high', 'Heavy nourishing foods, strength-building exercise, warming herbs', 'Sweet, sour, salty; warm, oily; wheat, meat, dairy, honey', 'Light, dry, cold foods'],
            ['Shishira (Late Winter)', 'Jan-Feb', 'Kapha accumulates', 'Continue nourishment; begin gentle cleansing', 'Same as Hemanta + bitter herbs to prepare for spring', 'Cold foods, raw foods'],
            ['Vasanta (Spring)', 'Mar-Apr', 'Kapha aggravates', 'THE DETOX SEASON — this is when Panchakarma is most beneficial; light diet; vigorous exercise', 'Bitter, pungent, astringent; light foods; barley, honey, warm spices', 'Heavy, sweet, oily, cold, dairy, naps'],
            ['Grishma (Summer)', 'May-Jun', 'Pitta and Vata', 'Stay cool; avoid midday sun; cooling practices; hydrate', 'Sweet, cold, light; coconut, mint, cucumber, coriander; cool water, coconut water', 'Sour, salty, pungent; spicy food; alcohol; noon sun exposure'],
            ['Varsha (Monsoon)', 'Jul-Sep', 'Vata aggravates; Pitta builds', 'Protect digestion (Agni weakens); avoid stale food; light diet; Basti (enema) therapy if possible', 'Sour, salty; warm, freshly cooked; ginger, garlic, soup', 'Raw food, river water, heavy food, leafy vegetables (parasites)'],
            ['Sharad (Autumn)', 'Oct-Nov', 'Pitta aggravates', 'Pitta-pacifying; cooling, bitter herbs; Virechana (purgation) if accumulated; moonlight bathing', 'Sweet, bitter, astringent; light foods; ghee, amla, pomegranate', 'Sour, salty, hot; fermented; alcohol; daytime napping'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'The Vasanta Ritucharya — Spring Cleanse Protocol',
        body: `**Spring is THE detox season.** Kapha that accumulated through winter begins to melt in the spring warmth — flooding the channels with accumulated mucus, fat, and toxins. This is why people get sick in spring — not because of the weather, but because unmobilized Kapha is flooding their system.

**The classical spring Siddha-Ayurvedic cleanse:**
1. **Reduce heavy foods** (dairy, wheat, meat, cold foods) from the diet
2. **Increase bitter herbs** — Neem, Guduchi, Turmeric, Trikatu (ginger + black pepper + long pepper)
3. **Increase vigorous exercise** — this is when Kapha responds to movement
4. **Dry brushing (Udvartana)** before shower — moves lymph and Kapha
5. **Triphala** (1 tsp in warm water before bed) — gentle daily cleanse
6. **Ginger-lemon-honey tea** in the morning — burns Kapha accumulation
7. **Avoid daytime naps** — Kapha deepens with rest
8. **Ideal time for Panchakarma** (if planning a deeper cleanse)`,
      },
      {
        type: 'practice',
        title: 'Seasonal Adjustment Protocol — For Any Season',
        ritual: [
          { step: 'ASSESS', instruction: 'At the beginning of each season, reassess your Vikriti (current imbalance). Which Dosha feels most prominent now?' },
          { step: 'FOOD', instruction: 'Adjust your diet based on the seasonal Dosha. The season that is Kapha (spring/winter): reduce heavy foods. Pitta season (summer): increase cooling foods. Vata season (autumn): increase warmth and oil.' },
          { step: 'HERBS', instruction: 'Choose seasonal herbs: Neem and Guduchi in spring. Shatavari and coriander in summer. Ashwagandha and sesame in autumn/winter.' },
          { step: 'EXERCISE', instruction: 'Exercise intensely in Kapha seasons (spring, early winter). Moderate in Pitta season (summer). Gentle in Vata season (autumn) — but maintain consistency.' },
          { step: 'CLEANSE', instruction: 'Spring: the natural cleansing season. Even a 3-day Triphala cleanse with light diet makes a significant difference.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which season is considered the ideal time for Panchakarma and deep cleansing according to Ayurveda?',
        quizOptions: ['Winter (Hemanta)', 'Spring (Vasanta)', 'Summer (Grishma)', 'Autumn (Sharad)'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Watch the animals. The bear knows to eat heavily before winter and fast in spring. The deer knows to move to cooler shade in summer. They have not lost their biological intelligence. Modern humans have traded ecological intelligence for convenience. Ritucharya is the medicine of reclaiming your natural intelligence.",
    keyTakeaways: [
      '6 Ayurvedic seasons, each ~2 months, each affecting a Dosha differently.',
      'Vasanta (Spring) = Kapha season = the ideal time for detox and Panchakarma.',
      'Disease can be prevented by adjusting food/lifestyle in the ACCUMULATION phase (one season before aggravation).',
      'Spring: eat light, bitter, and pungent. Exercise vigorously. Reduce dairy and wheat.',
      'Summer: stay cool. Eat sweet and cooling. Avoid noon sun and spicy food.',
      'Autumn: warming and nourishing. Triphala cleanse. Pitta-pacifying.',
      'Winter: build strength with nourishing foods. Sesame oil massage daily.',
    ],
    dailyPractice: 'Look outside. What season are you in right now? Identify one thing you are doing that is working AGAINST the season (cold smoothies in winter? heavy food in spring?). Change that one thing this week.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 10 — THE AYURVEDIC KITCHEN
  // ═══════════════════════════════════════════════════════════
  10: {
    moduleNumber: 10,
    agastyarOpening: "The kitchen is the first pharmacy. The spice rack is the medicine cabinet. Long before herbs were isolated and encapsulated, the Siddha Vaidya walked into a kitchen and prescribed a meal. Understanding the six tastes is the difference between eating food and eating medicine.",
    sections: [
      {
        type: 'teaching',
        title: 'Shad Rasa — The Six Tastes',
        body: `Every food has a taste (Rasa), and every taste has a predictable effect on the Doshas. This is the operating system of Ayurvedic nutrition — once you know it, you never need to look up a food chart again. You taste the food and instantly know its effect.

The **Shad Rasa** (six tastes) are:`,
        items: [
          '**MADHURA (Sweet)** — Elements: Earth + Water → Increases Kapha, Decreases Vata and Pitta. Effect: Nourishing, building, soothing, lubricating, increases body mass and fluid. Foods: rice, wheat, sugar, milk, ghee, sweet fruits, root vegetables. Excess: obesity, diabetes, mucus, lethargy.',
          '**AMLA (Sour)** — Elements: Earth + Fire → Increases Pitta and Kapha, Decreases Vata. Effect: Stimulates digestion, increases salivation, warming, digests fat. Foods: yogurt, lemon, vinegar, fermented foods, sour fruits. Excess: hyperacidity, skin conditions, tooth sensitivity, inflammation.',
          '**LAVANA (Salty)** — Elements: Water + Fire → Increases Pitta and Kapha, Decreases Vata. Effect: Moistening, promotes digestion, retains water, grounding. Foods: salt (especially rock salt), seaweed, processed foods. Excess: hypertension, water retention, inflammation, skin diseases.',
          '**KATU (Pungent)** — Elements: Fire + Air → Increases Pitta and Vata, Decreases Kapha. Effect: Sharpens intellect, stimulates digestion, promotes sweating, clears channels. Foods: chili, ginger, black pepper, garlic, onion, mustard. Excess: burning, inflammation, aggression, hair loss, reproductive weakness.',
          '**TIKTA (Bitter)** — Elements: Air + Space → Increases Vata, Decreases Pitta and Kapha. Effect: Detoxifying, anti-inflammatory, anti-parasitic, reduces fever, purifies blood. Foods: neem, bitter melon, turmeric, fenugreek, dark leafy greens. Excess: dryness, emaciation, aggravation of Vata.',
          '**KASHAYA (Astringent)** — Elements: Air + Earth → Increases Vata, Decreases Pitta and Kapha. Effect: Drying, tightening, stops diarrhea, reduces bleeding, anti-inflammatory. Foods: unripe banana, pomegranate, beans, raw vegetables, turmeric, tea. Excess: constipation, dark pigmentation, dryness.',
        ],
      },
      {
        type: 'table',
        title: 'Tastes and Dosha Effects at a Glance',
        tableData: {
          headers: ['Taste', 'Vata', 'Pitta', 'Kapha', 'Best Used For'],
          rows: [
            ['Sweet (Madhura)', 'Decreases ↓', 'Decreases ↓', 'Increases ↑', 'Building, nourishing, Vata and Pitta imbalance'],
            ['Sour (Amla)', 'Decreases ↓', 'Increases ↑', 'Increases ↑', 'Low Agni, Vata imbalance, cold conditions'],
            ['Salty (Lavana)', 'Decreases ↓', 'Increases ↑', 'Increases ↑', 'Vata imbalance, dryness, mineral replenishment'],
            ['Pungent (Katu)', 'Increases ↑', 'Increases ↑', 'Decreases ↓', 'Kapha excess, sluggish metabolism, congestion'],
            ['Bitter (Tikta)', 'Increases ↑', 'Decreases ↓', 'Decreases ↓', 'Pitta excess, Kapha, detox, inflammation, fever'],
            ['Astringent (Kashaya)', 'Increases ↑', 'Decreases ↓', 'Decreases ↓', 'Pitta and Kapha, diarrhea, bleeding, excess fluid'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'Virya, Vipaka, and Prabhava — The Deeper Properties',
        body: `Beyond taste, every food has three deeper properties:

**VIRYA (Potency):** The heating or cooling energy of the food. More important than taste for treating Pitta and Vata.
- Heating (Ushna): ginger, garlic, black pepper, sesame, honey, sour foods
- Cooling (Shita): coconut, cucumber, mint, coriander, ghee, sweet foods

**VIPAKA (Post-digestive effect):** The taste that the food becomes after full digestion — which affects the final tissues and Doshas.
- Sweet Vipaka: most sweet and salty foods → nourishing, building
- Sour Vipaka: sour foods → heating, slightly aggravating
- Pungent Vipaka: pungent and bitter foods → drying, reducing

**PRABHAVA (Special power):** The unique, specific action of a substance that cannot be predicted from its other properties. Examples: Garlic is heating and pungent but has the specific Prabhava of being an antiparasitic AND a cardiac tonic. Saffron has the Prabhava of developing intelligence and spiritual clarity beyond its other properties.

This is why Ayurveda cannot be reduced to biochemistry. Prabhava is the intelligence of the whole substance — not explainable by any single compound.`,
      },
      {
        type: 'teaching',
        title: '10 Foundational Siddha-Ayurvedic Foods',
        body: 'These are the first medicines — always available, always relevant:',
        items: [
          '**GHEE (Clarified Butter)** — Agni kindler, Ojas builder, brain food, carries herbs deep into tissues. One teaspoon daily is the most universal Ayurvedic prescription.',
          '**TURMERIC (Haridra)** — Anti-inflammatory, antimicrobial, liver protector, blood purifier. Golden milk daily is medicine.',
          '**GINGER (Ardraka)** — The universal medicine. Agni kindler, anti-nausea, anti-inflammatory, circulation. Fresh ginger tea before meals.',
          '**CUMIN (Jeeraka)** — Digestion, gas, bloating. Add to all cooked foods.',
          '**CORIANDER (Dhanyaka)** — Cooling, digestive. Ideal for Pitta. Coriander water (overnight-soaked seeds, strained) is a cooling tonic.',
          '**AMLA (Amalaki/Indian Gooseberry)** — The highest natural vitamin C source. Rasayana fruit — regenerates all 7 tissues. The key ingredient in Chyawanprash.',
          '**ASHWAGANDHA** — Adaptogen, stress reducer, testosterone support, thyroid balance, sleep, Ojas builder.',
          '**TRIPHALA** — Three fruits (Amla + Haritaki + Bibhitaki). The most important compound. Gentle daily cleanse, eye health, digestive regulation, anti-aging.',
          '**TULSI (Holy Basil)** — Immunity, respiratory health, spiritual clarity, stress reduction. The most sacred plant in India.',
          '**BLACK PEPPER (Maricha)** — The "king of spices." Bioavailability enhancer (Piperine increases curcumin absorption 2,000%). Stimulates Agni, antimicrobial, respiratory.',
        ],
      },
      {
        type: 'practice',
        title: 'Agastyar\'s Golden Rule of Eating',
        ritual: [
          { step: 'EAT ONLY WHEN HUNGRY', instruction: 'True hunger is felt in the stomach, not the mind. Do not eat out of boredom, emotion, or schedule if genuine hunger is absent.' },
          { step: 'EAT IN SILENCE', instruction: 'Or in gentle, positive company. No screens. No difficult conversations. Negative emotions during eating create Ama. This is not metaphor — stress hormones during eating inhibit digestive enzymes.' },
          { step: 'INCLUDE ALL 6 TASTES', instruction: 'At the main meal, ensure all 6 tastes are present. This creates satisfaction and prevents cravings later. A simple way: add a small salad (bitter/astringent), lemon (sour), rock salt (salty), sweet chutney (sweet), ginger (pungent).' },
          { step: 'EAT TO 3/4 FULL', instruction: 'Fill the stomach: 1/2 with food, 1/4 with liquid, 1/4 left empty for digestive movement. Overeating is one of the most common causes of disease.' },
          { step: 'SIT AND DIGEST', instruction: 'After eating: sit for 5-10 minutes. Then a gentle 10-minute walk (Shata Padi). Do not lie down for 2 hours after eating.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which taste decreases BOTH Vata and Pitta while increasing Kapha?',
        quizOptions: ['Pungent (Katu)', 'Bitter (Tikta)', 'Sweet (Madhura)', 'Sour (Amla)'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "The next time you cook, you are practicing Ayurveda. The next time you choose spices, you are choosing medicine. This is the democratization of healing — it belongs in every kitchen, in every family. When mothers understand the six tastes, they become the first physicians of their households. When you understand the six tastes, you become the physician of yourself.",
    keyTakeaways: [
      '6 Tastes: Sweet, Sour, Salty, Pungent, Bitter, Astringent — each affects Doshas predictably.',
      'Sweet, Sour, Salty decrease Vata. Pungent, Bitter, Astringent decrease Kapha.',
      'Bitter and Astringent decrease Pitta. Sweet decreases Pitta.',
      'Virya = heating/cooling potency (more important than taste for treatment).',
      'Vipaka = post-digestive effect — affects the final tissues.',
      'Prabhava = unique special action — why whole foods > isolated compounds.',
      '10 foundational medicines: Ghee, Turmeric, Ginger, Cumin, Coriander, Amla, Ashwagandha, Triphala, Tulsi, Black Pepper.',
    ],
    dailyPractice: 'At your next meal, identify which of the 6 tastes are present and which are missing. Add the missing ones — even a squeeze of lemon (sour) or a pinch of neem powder (bitter). Notice how satisfaction changes when all 6 tastes are included.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 11 — SIDDHA HERBS: FOUNDATION
  // ═══════════════════════════════════════════════════════════
  11: {
    moduleNumber: 11,
    agastyarOpening: "I spent lifetimes in the forests of the Western Ghats. Not as a wanderer — as a student. The plants spoke their properties to me in their fragrance, their color, their taste, their environment. The Siddha herbalist does not merely memorize actions — he LISTENS to the plant. This module gives you the vocabulary to begin that conversation.",
    sections: [
      {
        type: 'teaching',
        title: 'Siddha Classification of Medicine — Three Kingdoms',
        body: `Siddha medicine classifies all medicinal substances into three kingdoms:

**1. MOOLIGAI (Plant Kingdom)** — Herbs, roots, leaves, bark, fruits, flowers, seeds, resins. The primary source of Siddha medicine. Over 800 medicinal plants are documented in Siddha texts.

**2. THAATHU (Mineral Kingdom)** — Metals and minerals including gold, silver, copper, iron, mercury, sulfur, limestone, mica. Highly processed into nano-forms called Parpam and Chendooram. These are the most powerful Siddha medicines — but also require the most expertise to prepare safely.

**3. JEEVA (Animal Kingdom)** — Products from animals including milk, ghee, honey, musk, shells, and other substances. Used for specific conditions where plant medicine is insufficient.

The classification of each substance follows the **Suvai-Veeriyam-Pirivu** system:
- **Suvai (Taste)** — The same as Rasa in Ayurveda (sweet, sour, salty, pungent, bitter, astringent)
- **Veeriyam (Potency)** — Heating or Cooling
- **Pirivu (Post-digestive effect)** — Sweet, Sour, or Pungent`,
      },
      {
        type: 'teaching',
        title: '25 Foundational Herbs — Your First Herb Library',
        body: 'Memorize these. They are the vocabulary of your practice:',
        items: [
          '**BRAHMI (Bacopa monnieri)** — Brain tonic, memory, anxiety, ADHD. Increases Sattva. Cooling. For Pitta mind. The classical medhya (brain-enhancing) herb.',
          '**ASHWAGANDHA (Withania somnifera)** — Adaptogen, stress, testosterone, thyroid, sleep, immunity. Warming. Builds Ojas. Best taken with warm milk at night.',
          '**SHATAVARI (Asparagus racemosus)** — Women\'s herb. Reproductive health, hormonal balance, lactation, menopause, fertility. Cooling. The "she who has a hundred husbands" — nourishing and adaptogenic.',
          '**GUDUCHI / GILOY (Tinospora cordifolia)** — Immunity, fever, liver, autoimmune, anti-inflammatory. "Amrita" — the elixir of immortality in classical texts. One of the most important immunomodulators.',
          '**NEEM (Azadirachta indica)** — Blood purifier, skin, antimicrobial, anti-parasitic, anti-diabetic. Bitter. High Kapha and Pitta conditions. The "village pharmacy" of India.',
          '**TULSI / HOLY BASIL (Ocimum sanctum)** — Immunity, respiratory, stress, spiritual clarity, antimicrobial. Warming. The most sacred plant in Indian tradition. Daily tea is preventive medicine.',
          '**AMLA / AMALAKI (Emblica officinalis)** — Highest natural vitamin C. Anti-aging Rasayana. Liver tonic. Eye health. Hair growth. Digestive. Unusual: sour in taste, sweet in Vipaka. Balances all 3 Doshas.',
          '**HARITAKI (Terminalia chebula)** — "The King of medicines." Digestive, anti-aging, brain tonic, wind disorder. Slightly heating. One of the three fruits of Triphala. Lord Shiva\'s herb.',
          '**BIBHITAKI (Terminalia bellirica)** — Respiratory, voice, hair, eye health. Astringent. One of the three fruits of Triphala. Particularly good for Kapha.',
          '**TRIPHALA** — The three fruits combined. The most important and safe compound in Ayurveda. Gentle daily cleanse. Anti-aging. Eye wash. Balances all 3 Doshas.',
          '**LICORICE / YASHTIMADHU (Glycyrrhiza glabra)** — Respiratory, ulcers, adrenal support, voice, hormonal balance. Sweet. Soothing. Cooling. Harmonizes formula effects.',
          '**GOTU KOLA / BRAHMI ALTERNATIVE (Centella asiatica)** — Wound healing, brain, anxiety, circulation. Bitter and astringent. Used interchangeably with Brahmi in some traditions.',
          '**MORINGA / MURUNGAI (Moringa oleifera)** — The Siddha superfood. 7x vitamin C of oranges, 4x calcium of milk, 2x protein of yogurt. Anti-inflammatory, blood sugar, liver.',
          '**MANJISTHA (Rubia cordifolia)** — Blood purifier, skin, lymph, uterine health, anti-inflammatory. Cooling. Pitta and Kapha. One of the best herbs for skin disease and lymphatic congestion.',
          '**BALA (Sida cordifolia)** — Strengthening, nervous system, male reproductive health. Warming. Builds Ojas and Mamsa (muscle tissue).',
          '**GINGER / ARDRAKA (Zingiber officinale)** — Universal medicine. Agni, nausea, circulation, respiratory, anti-inflammatory. Warming. Fresh vs dried have different actions.',
          '**BLACK PEPPER / MARICHA (Piper nigrum)** — Agni stimulant, bioavailability enhancer (Piperine), respiratory, antimicrobial. Pungent, heating.',
          '**LONG PEPPER / PIPPALI (Piper longum)** — Superior to black pepper for deepening herbal penetration. Respiratory, digestive, Rasayana. Together with ginger and black pepper = Trikatu.',
          '**TURMERIC / HARIDRA (Curcuma longa)** — Anti-inflammatory (curcumin), liver, blood, skin, immunity. Bitter, pungent, warming. The golden medicine.',
          '**FENUGREEK / METHI (Trigonella foenum-graecum)** — Blood sugar, testosterone, digestion, lactation. Bitter, warming. Metabolic herb.',
          '**NEEM LEAF (Azadirachta indica)** — [See above] — specifically noting fresh neem leaf chewing: 4-5 leaves in the morning is powerful blood and liver cleansing.',
          '**CARDAMOM / ELA (Elettaria cardamomum)** — Digestive, respiratory, mental clarity, breath freshener. Warming but not excessively. Safe for Pitta.',
          '**CORIANDER SEEDS / DHANYAKA (Coriandrum sativum)** — Digestive, cooling, UTI support, Pitta-reducing. Coriander water: overnight-soaked seeds in water, strained, drunk in morning.',
          '**FENNEL / SHATAPUSHPA (Foeniculum vulgare)** — Digestive, gas, colic, breast milk, eye health. Cooling. Fennel tea after meals is digestive gold.',
          '**VETIVER / KHUS (Vetiveria zizanioides)** — Cooling tonic, Pitta, skin, fever. Vetiver water (khus water) is a traditional summer cooling drink.',
        ],
      },
      {
        type: 'practice',
        title: 'The Daily Herb Starter Pack — Begin Here',
        ritual: [
          { step: 'TRIPHALA', instruction: '1/2 tsp Triphala powder in warm water before bed. Daily gentle cleanse. Do this for 3 months and watch what changes.' },
          { step: 'TULSI TEA', instruction: 'Fresh or dried Tulsi — 5 leaves or 1 tsp, steeped in hot water for 5 min. Morning. Immune protection daily.' },
          { step: 'TURMERIC MILK', instruction: '1/2 tsp turmeric + 1/4 tsp black pepper (for absorption) + 1 tsp ghee in warm milk before bed. 3x per week minimum.' },
          { step: 'GINGER BEFORE MEALS', instruction: 'Fresh ginger slice + rock salt + squeeze of lemon, 15 min before main meal. Activates Agni and enzyme production.' },
          { step: 'AMLA', instruction: '1 fresh Amla daily (if available) OR 1 tsp Amla powder in water OR Chyawanprash 1 tsp morning. The single most powerful anti-aging food available.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which herb is called "Amrita" (the elixir of immortality) and is one of the most important immunomodulators in Ayurveda?',
        quizOptions: ['Ashwagandha', 'Guduchi (Giloy)', 'Shatavari', 'Brahmi'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Begin with Triphala. If you do nothing else from this module, begin taking Triphala before bed tonight. It is the safest, most broadly beneficial compound in all of Ayurveda. The three fruits — Amla, Haritaki, Bibhitaki — contain the intelligence of three great Rishis. Let their wisdom work in you as you sleep.",
    keyTakeaways: [
      'Siddha medicine classifies substances in 3 kingdoms: Plant, Mineral, Animal.',
      'Classification system: Suvai (taste), Veeriyam (potency), Pirivu (post-digestive effect).',
      'Triphala = the most important and safe Ayurvedic compound. Begin daily use tonight.',
      'Amla = the highest natural vitamin C, anti-aging Rasayana, balances all 3 Doshas.',
      'Guduchi = "Amrita" — the primary immunomodulator.',
      'Ginger before meals = the simplest and most effective Agni therapy.',
      'Tulsi tea daily = the most accessible immune-building practice.',
    ],
    dailyPractice: 'Tonight: take 1/2 tsp Triphala powder in a cup of warm water (add honey if desired). Do this every night for 30 days. This is your first herbal prescription from Agastyar.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 12 — PRANAYAMA FUNDAMENTALS
  // ═══════════════════════════════════════════════════════════
  12: {
    moduleNumber: 12,
    agastyarOpening: "The breath is the only function that operates both consciously and unconsciously. When you take control of the breath, you take control of the bridge between mind and body. The Siddhas knew: change the breath, change the state. Change the state long enough, change the physiology. Change the physiology, change the destiny.",
    sections: [
      {
        type: 'teaching',
        title: 'The Five Pranas — The Architecture of Life Force',
        body: `**Prana** (प्राण) is the universal life force. In the body, it expresses through five major currents called the **Pancha Pranas (Pancha Vayus)**:

These are not merely breath — they are the five forces of biological intelligence that govern all physiological movement. When the Pranas are balanced and flowing freely through the 72,000 Nadis (energy channels), health is perfect. When they are blocked or imbalanced, disease follows.`,
        items: [
          '**PRANA VAYU** — Located in the heart and head. Governs: inhaling, sensory reception, the forward movement of experience. Direction: inward and upward. This is the primary life force. When Prana Vayu is strong, vitality and awareness are high.',
          '**APANA VAYU** — Located in the pelvic floor and lower abdomen. Governs: exhaling, elimination, downward movement, menstruation, childbirth, ejaculation. Direction: downward and outward. When Apana Vayu is balanced, elimination is complete and reproductive health is strong.',
          '**SAMANA VAYU** — Located in the navel region. Governs: digestion, assimilation, the integration of experience. Direction: inward, centripetal. When Samana Vayu is strong, digestion and integration of experience (both physical and psychological) are excellent.',
          '**UDANA VAYU** — Located in the throat and diaphragm. Governs: speech, expression, memory, growth, upward evolution, the will to live. Direction: upward. When Udana Vayu is strong, the voice is clear, memory is sharp, and there is enthusiasm for life.',
          '**VYANA VAYU** — Pervades the entire body through the blood and nervous system. Governs: circulation, distribution of nutrition and prana throughout the body, coordination of all movements. Direction: outward from the center in all directions. When Vyana Vayu is strong, circulation is excellent and the body functions as a coordinated whole.',
        ],
      },
      {
        type: 'teaching',
        title: 'The Nadis — The Channels of Prana',
        body: `The body contains **72,000 Nadis** (energy channels) through which Prana flows. Of these, **14 are considered principal**, and of those, **3 are the most important**:

**IDA NADI** — The left energy channel. Governs the right brain hemisphere, left nostril, moon energy, feminine principle, cooling, creative, intuitive intelligence. When Ida is dominant: calm, reflective, creative, slightly cool.

**PINGALA NADI** — The right energy channel. Governs the left brain hemisphere, right nostril, sun energy, masculine principle, heating, active, analytical intelligence. When Pingala is dominant: energized, focused, slightly warm, action-oriented.

**SUSHUMNA NADI** — The central channel, running through the spine from Mooladhara (base chakra) to Sahasrara (crown). This is the channel through which Kundalini Shakti rises. When Sushumna is active: both hemispheres are balanced, spiritual experience becomes possible, the practitioner is in the optimal state for meditation and healing.

**The breathwork secret:** You can FEEL which Nadi is dominant by observing which nostril is more open. Left nostril dominant = Ida (moon, calm). Right nostril dominant = Pingala (sun, active). Both equally open = Sushumna is active — the most auspicious state.`,
      },
      {
        type: 'practice',
        title: '6 Essential Pranayamas — With Full Instructions',
        ritual: [
          { step: '1. NADI SHODHANA (Alternate Nostril Breathing)', instruction: 'The supreme balancer. Sit with spine erect. Use right hand: ring finger closes left nostril, thumb closes right. Inhale left nostril (4 counts), close both, hold (4 counts), exhale right (4 counts). Inhale right (4 counts), close both, hold (4 counts), exhale left (4 counts). This is ONE round. Do 9-27 rounds. Effect: Balances Ida and Pingala, activates Sushumna, calms anxiety, sharpens focus, balances brain hemispheres. BEST TIME: Morning before meditation or whenever anxious.' },
          { step: '2. BHASTRIKA (Bellows Breath)', instruction: 'Sit erect. Both nostrils. Rapid, powerful inhale and exhale through the nose — like a bellows pumping. One cycle per second. 20 rapid pumps, then one deep inhale, retention as long as comfortable, then slow exhale. Do 3 rounds. Effect: Ignites Agni powerfully, clears respiratory tract, energizes the nervous system, burns Ama. CAUTION: Do NOT during pregnancy, hypertension, or heart conditions.' },
          { step: '3. UJJAYI (Victorious Breath / Ocean Breath)', instruction: 'Both nostrils. Slightly constrict the back of the throat (as if you are fogging a mirror) — creating an ocean-like sound. Breathe deeply, slowly. Inhale 4-6 counts, exhale 6-8 counts. Effect: Generates heat, calms Vata, massages vagus nerve (parasympathetic activation), ideal for use during yoga, deepens meditation. Use during stressful situations — the sound is instantly grounding.' },
          { step: '4. BHRAMARI (Humming Bee Breath)', instruction: 'Sit comfortably. Block ears with thumbs, cover eyes gently with fingers. Inhale through both nostrils. On exhale, make a smooth, continuous humming sound (mmmmm). The vibration reverberates in the skull. Do 5-10 rounds. Effect: Reduces anxiety and stress immediately, improves voice, activates the vagus nerve, stimulates nitric oxide production in the sinuses (increases oxygen delivery), excellent for migraines and ear problems. One of the most effective pranayamas for instant nervous system reset.' },
          { step: '5. SHITALI (Cooling Breath)', instruction: 'Curl the tongue into a tube (if possible) or use Sitkari: press tongue to roof of mouth, part lips slightly. Inhale through the tube/teeth — feel the cooling air. Close mouth, exhale through nose. Effect: Reduces Pitta and heat, cools the body temperature, reduces inflammation, ideal in summer and for anger/irritability. Contraindicated in cold/Kapha constitutions.' },
          { step: '6. KAPALABHATI (Skull Shining Breath)', instruction: 'Passive inhale, ACTIVE exhale — pull navel sharply toward spine on each exhale. The inhale happens automatically. 1 cycle per second. 20-100 rounds, then rest. Effect: Cleanses respiratory system, ignites Agni, activates core muscles, stimulates the liver and spleen, clears brain fog ("Kapala" = skull, "Bhati" = shining). CAUTION: Avoid in pregnancy, menstruation, hernias, and post-surgery.' },
        ],
      },
      {
        type: 'secret',
        title: '⟡ Kaya Kalpa Pranayama — The Immortality Breath (Preview)',
        body: `The deepest Siddha breathwork is the **Kaya Kalpa** pranayama sequence — the "body renewal" breathwork used by Siddhars to maintain physical youth and extend life. This combines:

1. Extended Kumbhaka (breath retention) — specifically 64-count and 128-count retentions after mastery
2. Specific Bandhas (locks): Mula Bandha (root lock), Uddiyana Bandha (abdominal lock), Jalandhara Bandha (throat lock)
3. Specific visualization of prana moving through the 72,000 Nadis
4. Mental recitation of Agastyar's secret Beeja mantras during retention

**Warning:** The extended retention practices of Kaya Kalpa require direct initiation from a qualified teacher. The preliminary practices above are safe for all students. The advanced practices are unlocked in Phase 4 — Siddha Vidya (Akasha Infinity tier).`,
      },
      {
        type: 'quiz',
        quizQuestion: 'Bhramari pranayama (Humming Bee Breath) generates nitric oxide in the sinuses — what is the health benefit of this?',
        quizOptions: ['It reduces Pitta and cools the body', 'It increases oxygen delivery to tissues through vasodilation', 'It ignites the digestive fire (Agni)', 'It activates the root chakra (Mooladhara)'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "You now have the six primary pranayamas of the Siddha-Ayurvedic tradition. Start with Nadi Shodhana — 9 rounds, every morning after your physical practice. This single practice, done consistently for 90 days, will change your nervous system more than most medications. The breath is always with you. It is the most portable medicine ever invented.",
    keyTakeaways: [
      'Five Pranas: Prana (inward), Apana (downward), Samana (integrating), Udana (upward), Vyana (circulating).',
      '72,000 Nadis; 3 principal: Ida (left/moon), Pingala (right/sun), Sushumna (central/spiritual).',
      'Check which nostril is dominant to know which Nadi is active.',
      'Nadi Shodhana = the supreme balancer. 9 rounds daily. Do it NOW.',
      'Bhramari = instant nervous system reset. Generates nitric oxide.',
      'Ujjayi = use during yoga and stress. Ocean sound = vagus nerve activation.',
      'Bhastrika = Agni kindling. Kapalabhati = skull cleaning. Both energizing.',
    ],
    dailyPractice: 'Every morning after your yoga or movement: sit for 10 minutes. 9 rounds Nadi Shodhana. 5 rounds Bhramari. This is your minimum pranayama practice from today. Non-negotiable. These 10 minutes will protect your nervous system for the rest of the day.',
  },

};

// Helper: Get content for a module
export function getModuleContent(moduleNumber: number): ModuleContent | null {
  return MODULE_CONTENT[moduleNumber] || null;
}

// Helper: Get all available content module numbers
export function getContentModuleNumbers(): number[] {
  return Object.keys(MODULE_CONTENT).map(Number);
}
