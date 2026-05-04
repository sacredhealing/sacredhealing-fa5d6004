// src/data/moduleContentPhase2.ts
// ⟡ Phase 2 — Jijnasa: The Science Deepens (Modules 13–24) ⟡
// Prana Flow tier — Full rich content

import { ModuleContent } from './moduleContent';

export const MODULE_CONTENT_PHASE2: Record<number, ModuleContent> = {

  // ═══════════════════════════════════════════════════════════
  // MODULE 13 — NADI VIGYAN: THE PULSE AS COSMIC LANGUAGE
  // ═══════════════════════════════════════════════════════════
  13: {
    moduleNumber: 13,
    agastyarOpening: "The pulse is the autobiography of the soul. In sixty seconds of silence, three fingers on the wrist, and a trained mind — I can read your entire history: your birth constitution, your current imbalance, the organs under stress, the emotions you are carrying, and the diseases trying to enter. This is not mysticism. This is the most precise diagnostic technology ever developed.",
    sections: [
      {
        type: 'teaching',
        title: 'What Is Nadi Pariksha?',
        body: `**Nadi Pariksha** (नाडी परीक्षा) — Pulse Examination — is the cornerstone of Ayurvedic and Siddha diagnosis. The word **Nadi** means both "river" (energy channel) and "pulse." The pulse carries the river of biological information flowing through your entire system.

The three fingers — index, middle, and ring — placed just below the wrist on the radial artery map to the three Doshas:
- **Index finger (Vata)** — feels the quality of air and space in the system
- **Middle finger (Pitta)** — feels the quality of fire and transformation
- **Ring finger (Kapha)** — feels the quality of earth and water

A trained Vaidya can feel not just rate and rhythm — but **quality**: the movement pattern of each pulse wave. Each Dosha has a characteristic animal movement when dominant.`,
      },
      {
        type: 'teaching',
        title: 'The Three Classical Pulse Movements',
        items: [
          '**Vata Pulse — Sarpagati (Snake Movement):** Irregular, fast, thin, cold, light. The pulse slithers — moves in a serpentine, irregular pattern. Like a snake moving through grass. Associated with: anxiety, constipation, dryness, nervous system disorders, pain.',
          '**Pitta Pulse — Mandukagati (Frog Movement):** Sharp, jumping, moderate speed, warm. The pulse leaps forward and then retreats — like a frog jumping. Associated with: inflammation, fever, acid conditions, liver stress, skin disorders.',
          '**Kapha Pulse — Hamsagati (Swan Movement):** Slow, deep, heavy, cool, smooth, regular. The pulse glides gracefully like a swan on water — wide, slow, full. Associated with: congestion, weight gain, sluggish metabolism, depression, attachment.',
        ],
      },
      {
        type: 'teaching',
        title: 'The Siddha Navar Naadi — 9 Pulse Types',
        body: `The Siddha system goes significantly beyond the Ayurvedic 3-pulse model. **Navar Naadi** (Nine Pulses) identifies nine distinct pulse characters that map to specific organ systems and emotional states:`,
        items: [
          '**1. Vatham Naadi** — Thin, rapid, irregular — Nervous system and colon imbalance',
          '**2. Pitham Naadi** — Sharp, jumping, warm — Liver, small intestine, blood',
          '**3. Kabam Naadi** — Slow, full, deep — Lung, stomach, lymphatic',
          '**4. Vata-Pitta Naadi** — Thin but jumping — Combined nervous and inflammatory pattern',
          '**5. Pitta-Kapha Naadi** — Warm but slow — Inflammatory-sluggish pattern, often liver + lymph',
          '**6. Vata-Kapha Naadi** — Irregular but deep — Cold-nervous pattern, often immune weakness',
          '**7. Tridosha Naadi** — Complex simultaneous movement — Chronic multi-system involvement',
          '**8. Sama Naadi** — Perfectly balanced — Health. Feels like a gentle, regular wave',
          '**9. Maha Naadi** — Extraordinary pulse — Indicates rare states: spiritual awakening, extreme disease, or imminent death',
        ],
      },
      {
        type: 'table',
        title: 'Pulse Reading Reference — What to Feel',
        tableData: {
          headers: ['Quality', 'Vata', 'Pitta', 'Kapha'],
          rows: [
            ['Speed', 'Fast (80-100 bpm)', 'Moderate (70-80 bpm)', 'Slow (60-70 bpm)'],
            ['Force', 'Weak, thin', 'Strong, sharp', 'Full, heavy'],
            ['Rhythm', 'Irregular, variable', 'Regular but jumping', 'Very regular, steady'],
            ['Temperature', 'Cool to touch', 'Warm to hot', 'Cool, slightly cold'],
            ['Width', 'Thin, wiry', 'Medium', 'Wide, broad'],
            ['Animal analogy', 'Snake', 'Frog', 'Swan'],
            ['Depth', 'Superficial', 'Middle depth', 'Deep'],
          ],
        },
      },
      {
        type: 'practice',
        title: 'Self-Pulse Reading Practice — Begin Today',
        ritual: [
          { step: 'TIMING', instruction: 'Check pulse in the morning before eating, after 5 minutes of rest. This gives the most accurate Prakriti reading. Avoid checking after exercise, meals, or strong emotion.' },
          { step: 'POSITION', instruction: 'Sit comfortably. Rest your left wrist palm-up on your right hand. Place your right index finger on the radial artery (below the thumb side of the wrist). Place middle and ring fingers next to it in a row.' },
          { step: 'PRESSURE', instruction: 'Apply light pressure with index finger (Vata), moderate with middle (Pitta), firm with ring (Kapha). Feel each separately before feeling all three simultaneously.' },
          { step: 'OBSERVE', instruction: 'Close your eyes. Feel for: speed, force, rhythm, temperature, width. Ask: does it feel like a snake (Vata), frog (Pitta), or swan (Kapha)?' },
          { step: 'DAILY LOG', instruction: 'Record your pulse character daily for 30 days. Note how it changes with food, sleep, stress, seasons. This builds your diagnostic intuition.' },
        ],
      },
      {
        type: 'secret',
        title: 'Agastyar\'s Secret: Reading the Emotional Pulse',
        body: `Beyond physical diagnosis, the pulse reveals emotional states:

**Fear and anxiety:** Pulse becomes thin, rapid, irregular — classic Vata surge. Feels like the snake is fleeing.

**Anger and frustration:** Pulse becomes sharp, jumping, hot — Pitta surge. The frog leaps more aggressively.

**Grief and depression:** Pulse becomes slow, heavy, sinking — Kapha dominance. The swan is still but sad.

**Joy and love:** The pulse becomes smooth, flowing, warm — approaching Sama Naadi. It feels open and generous.

**Suppressed emotion:** There is a subtle hardness or resistance in the pulse — like hitting a wall at a certain depth. This indicates stored emotional Ama in the corresponding organ field.

When you feel this resistance in the pulse, the treatment is not just herbal — it requires emotional processing, breathwork, and mantra to release the held pattern.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'A pulse that is slow, full, wide, cool, and moves like a swan indicates dominant imbalance in which Dosha?',
        quizOptions: ['Vata', 'Pitta', 'Kapha', 'Tridosha'],
        quizAnswer: 2,
      },
      {
        type: 'quiz',
        quizQuestion: 'In Siddha\'s Navar Naadi system, what does the "Sama Naadi" indicate?',
        quizOptions: ['Vata-Pitta combined imbalance', 'Perfect health and balance', 'Kapha-dominant state', 'Imminent serious illness'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Begin practicing now — not on patients, but on yourself. Feel your pulse every morning for 30 days. Do not judge — just observe. Observe how it changes after coffee vs warm water. After meditation vs anxiety. After a walk vs sitting. The pulse is a live feed from your biology. Learn to read it and you will never need a blood panel to know your basic state.",
    keyTakeaways: [
      'Nadi Pariksha: index finger = Vata, middle = Pitta, ring = Kapha.',
      'Vata pulse = snake (thin, fast, irregular). Pitta = frog (sharp, jumping). Kapha = swan (slow, full, deep).',
      'Siddha Navar Naadi identifies 9 pulse types for more precise diagnosis.',
      'Sama Naadi (9th) = perfect balance — the goal state.',
      'Check pulse in morning before eating, after 5 min rest — most accurate.',
      'Pulse reveals emotional states as much as physical — fear, anger, grief, joy all have signatures.',
      'Daily 30-day pulse observation builds clinical intuition faster than any textbook.',
    ],
    dailyPractice: 'Every morning before breakfast: 3 minutes of pulse self-reading. Note one word for what you feel: snake/frog/swan, fast/slow, strong/weak. Over 30 days your diagnostic intelligence grows exponentially.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 14 — SIDDHA TONGUE, URINE & EYE DIAGNOSIS
  // ═══════════════════════════════════════════════════════════
  14: {
    moduleNumber: 14,
    agastyarOpening: "The Siddha physician reads the body like a sacred text. Every surface, every fluid, every color — is a sentence in the autobiography of your health. Modern medicine sends you to a laboratory. The Siddha Vaidya sends you to the mirror.",
    sections: [
      {
        type: 'teaching',
        title: 'Tongue Diagnosis — Jihva Pariksha',
        body: `The tongue is a direct external representation of the internal organs. Each zone of the tongue corresponds to a specific organ or body system — giving you a real-time map of internal health.

**Tongue anatomy as diagnostic map:**
- **Tip of tongue** → Heart and Lungs
- **Sides of tongue** → Liver and Gallbladder (right), Spleen and Stomach (left)
- **Centre of tongue** → Stomach and Intestines
- **Back of tongue** → Kidneys, Colon, Reproductive organs
- **Root of tongue** → Descending colon, Elimination`,
      },
      {
        type: 'table',
        title: 'Tongue Color, Coating & Texture Diagnostic Chart',
        tableData: {
          headers: ['Observation', 'Meaning', 'Action'],
          rows: [
            ['Pink, thin clear coat, moist', 'Healthy — low Ama, good Agni', 'Maintain current practices'],
            ['Thick white coating', 'Kapha excess, high Ama, sluggish digestion', 'Reduce heavy foods, increase ginger, Triphala'],
            ['Yellow/green coating', 'Pitta excess, liver stress, bile excess', 'Cooling herbs, reduce spicy food, Guduchi'],
            ['Brown/gray coating', 'High Vata, dehydration, severe Ama', 'Hydration, warm foods, sesame oil massage'],
            ['Black coating', 'Severe Vata, long-term illness, drug side effects', 'Seek professional consultation'],
            ['Red/inflamed tongue', 'High Pitta, B12 deficiency, infection', 'Cooling foods, check B12, consult physician'],
            ['Pale tongue', 'Blood deficiency (Rakta Dhatu), anemia', 'Iron-rich foods, Ashwagandha, Shatavari'],
            ['Cracked/fissured tongue', 'Chronic Vata, nutritional deficiency', 'Increase oils, improve nutrition, Nasya oil'],
            ['Scalloped edges', 'Malabsorption, Kapha, often Spleen imbalance', 'Digestive herbs, reduce dairy and wheat'],
            ['Teeth marks on edges', 'Same as scalloped — classic malabsorption sign', 'Digestive enzyme support, Trikatu formula'],
            ['Trembling tongue', 'High Vata, anxiety, neurological involvement', 'Grounding practices, Ashwagandha, Brahmi'],
            ['Dry tongue', 'Dehydration, high Vata/Pitta, Ama-blocked channels', 'Hydrate with warm water, avoid dry foods'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'Neermani Nool — Siddha Urine Diagnosis',
        body: `The **Neermani Nool** (நீர்மணி நூல்) is the Siddha text dedicated entirely to urine diagnosis. This ancient system uses visual examination of urine — including a remarkable oil-drop test — to diagnose the state of the three humors.

**The Siddha Oil Drop Test (Ennai Noi Kanippu):**
This is one of the most remarkable diagnostic tools in all of traditional medicine:

1. Collect first morning urine in a clean dark container
2. Take it outside in morning sunlight (or bright natural light)
3. Drop ONE drop of sesame oil onto the surface of the urine
4. Observe the shape the oil takes

**Reading the oil drop:**
- **Spreads quickly across the surface:** Vatham imbalance — prognosis good, easy to treat
- **Spreads slowly, multiple patterns:** Pitham imbalance — moderate prognosis
- **Stays as a pearl, does not spread:** Kabam imbalance — prognosis requires effort
- **Spreads in one direction (like a snake):** Vatham-type disease
- **Spreads in rainbow colors:** Multiple dosha involvement
- **Sinks to the bottom:** Very serious — severe Ama accumulation or critical illness`,
      },
      {
        type: 'teaching',
        title: 'Eye Diagnosis — Nethra Pariksha',
        body: `The eyes are called the "windows of the liver" in Ayurveda — and the "windows of the soul" in Siddha tradition. Examining the eyes reveals both physical and psychological health:

**White of the eye (Sclera):**
- Pure white → Healthy
- Yellow tinge → Liver stress (early jaundice), excess bile, Pitta
- Red veins → High Pitta, blood heat, inflammation, eye strain
- Pale/bloodless → Anemia, Rakta Dhatu deficiency
- Bluish tinge → Vata excess, iron or B12 deficiency

**Iris:**
- Bright, clear → Healthy Tejas, good nerve force
- Dull, cloudy → Toxins in the system, Ama affecting nerve tissue
- Rings around iris → Classical iridology reads constitution here

**Pupil:**
- Equal, responds to light → Nervous system functioning
- Dilated when not in low light → Vata excess, anxiety, nervous system hyperarousal
- Constricted → Pitta, possible medication side effect

**Conjunctiva (inner lower lid):**
- Pull down lower lid gently — should be deep pink/red
- Pale pink or white → Anemia — check iron and B12
- Very red/inflamed → Pitta, infection, Rakta Pitta

**Gaze quality:**
- Bright, steady, alive → Good Ojas, healthy Tejas
- Dull, flat, empty → Low Ojas — exhaustion, depression, disease
- Restless, shifting → High Vata, anxiety, scattered mind`,
      },
      {
        type: 'practice',
        title: 'Daily Diagnostic Mirror Practice',
        ritual: [
          { step: 'TONGUE (30 sec)', instruction: 'Each morning: look at tongue before brushing. Note: color, coating thickness and color, moisture, cracks, trembling. One observation daily builds a powerful clinical picture over weeks.' },
          { step: 'EYES (30 sec)', instruction: 'In natural light: look at sclera color, conjunctiva, pupil size and responsiveness, overall gaze brightness. Ask: do my eyes look alive today?' },
          { step: 'URINE (10 sec)', instruction: 'First morning urine: color, clarity, any foam or unusual odor. Color chart: pale = well hydrated, dark yellow = dehydrated, orange = possible liver stress, cloudy = possible UTI or Ama.' },
          { step: 'OIL DROP TEST (weekly)', instruction: 'Once per week, do the Siddha oil-drop test on first morning urine. Record which dosha pattern appears. Compare over 4 weeks to see progression.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'In the Siddha oil-drop urine test, what does it mean when the oil drop stays as a pearl and does not spread?',
        quizOptions: ['Vatham imbalance — easy to treat', 'Pitham imbalance — moderate prognosis', 'Kabam imbalance — requires more effort', 'Critical illness — emergency'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "Every morning you perform this 2-minute mirror diagnostic, you accumulate a dataset about your own body that no laboratory can match for personalization. After 90 days of consistent observation, you will notice patterns your doctor has never seen — because you are the only one looking this closely, this consistently.",
    keyTakeaways: [
      'Tongue tip = Heart/Lungs. Sides = Liver/Spleen. Centre = Stomach. Back = Kidneys/Colon.',
      'Thick white coating = Kapha/Ama. Yellow = Pitta/Liver. Gray = severe Vata.',
      'Neermani Nool: first morning urine diagnosis — color, clarity, foam.',
      'Oil-drop test: spreads quickly = Vata (easy). Pearl = Kapha (difficult). Sinks = serious.',
      'Eyes: yellow sclera = liver stress. Pale conjunctiva = anemia. Bright gaze = good Ojas.',
      'Trembling tongue = high Vata. Scalloped edges = malabsorption.',
      '2 minutes of morning self-diagnosis daily builds diagnostic intelligence no textbook can provide.',
    ],
    dailyPractice: 'Every morning for 21 days: tongue photo + written note of color/coating. After 21 days, review the progression. You will see exactly how your dietary choices affect your internal health — in real time.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 15 — KRIYA KALA: THE 6-STAGE DISEASE MODEL
  // ═══════════════════════════════════════════════════════════
  15: {
    moduleNumber: 15,
    agastyarOpening: "Modern medicine sees disease at Stage 5 and 6. Ayurveda catches it at Stage 1 and 2 — before you have a single symptom. This is the most revolutionary concept in the entire history of medicine: the ability to prevent disease before it manifests. The 6-stage disease model is not philosophy — it is a map. And with a map, you never get lost.",
    sections: [
      {
        type: 'teaching',
        title: 'Kriya Kala — The 6 Stages of Disease (Shat Kriya Kala)',
        body: `**Kriya Kala** (क्रिया काल) means "time for action" — the optimal window for treatment at each stage. The six stages describe how a disease evolves from its first subtle energetic disturbance to full pathological manifestation.

The genius of this model: **the earlier you intervene, the simpler the treatment**. At Stage 1-2, dietary change alone can resolve the condition. By Stage 5-6, the disease is deeply established and requires intensive intervention.

**Modern medicine typically diagnoses Stage 5-6** — when symptoms are undeniable and structural changes have occurred. Ayurveda is designed to diagnose and treat Stage 1-4, before the disease becomes visible on lab tests.`,
      },
      {
        type: 'teaching',
        title: 'Stage 1 — SANCHAYA (Accumulation)',
        body: `**Location:** Dosha accumulates in its HOME SITE — Vata in colon, Pitta in small intestine/liver, Kapha in stomach/chest.

**What happens:** The Dosha begins to increase beyond its normal quantity in its home site. The body sends subtle signals — discomfort, mild heaviness, or a sense that something is "off."

**Signs:**
- Vata accumulation: slight fullness in lower abdomen, mild gas, subtle anxiety
- Pitta accumulation: mild acidity, slight increase in body heat, mild irritability
- Kapha accumulation: slight heaviness, mild loss of appetite, feeling slightly sluggish

**Tongue:** Slight coating beginning to form
**Pulse:** Subtle shift toward the accumulating Dosha

**TREATMENT: Diet and lifestyle change only** — remove the cause. This stage resolves spontaneously if caught and addressed. Example: a week of Vata-pacifying diet if early Vata accumulation is felt.`,
      },
      {
        type: 'teaching',
        title: 'Stage 2 — PRAKOPA (Aggravation)',
        body: `**Location:** Dosha has increased significantly in its home site and begins to become agitated.

**What happens:** The accumulated Dosha becomes provoked — usually by continued exposure to its aggravating causes (inappropriate diet, lifestyle, season, emotions). It wants to move — it is becoming restless in its home.

**Signs:**
- Vata: clear constipation, frequent gas, definite anxiety, dryness
- Pitta: definite acidity, heartburn, moderate inflammation, clear irritability
- Kapha: clear congestion, reduced appetite, definite heaviness, early mucus

**TREATMENT: Dietary modification + simple herbs** — Triphala for Vata/Pitta, Trikatu for Kapha. Still very manageable.`,
      },
      {
        type: 'teaching',
        title: 'Stage 3 — PRASARA (Overflow/Spread)',
        body: `**Location:** Dosha overflows from its home site and enters general circulation (Rasa Dhatu/blood).

**What happens:** The aggravated Dosha cannot be contained and begins to spread through the Srotas (body channels) via the bloodstream. This is a critical transition point — the disease is now systemic.

**Signs:**
- Vata: widespread dryness, systemic pain, anxiety becomes generalized
- Pitta: widespread inflammation, skin begins to show reactivity, systemic heat
- Kapha: systemic congestion, weight gain, widespread heaviness and lethargy

**TREATMENT: Shodhana (purification) begins to be necessary** — Panchakarma may be indicated. Herbs must be more specific and more powerful.`,
      },
      {
        type: 'teaching',
        title: 'Stage 4 — STHANA SAMSHRAYA (Localization)',
        body: `**Location:** The wandering Dosha finds a weak or vulnerable tissue (Khavaigunya — "defective space") and lodges there.

**What happens:** The dosha that was in circulation now finds a "home" in a weakened tissue. This is where the disease will eventually manifest. The tissue is vulnerable due to genetic factors, old injuries, chronic strain, or accumulated Ama.

**Signs:** Prodromal symptoms of the disease that will eventually manifest. These can be subtle and organ-specific — unusual sensations, heaviness, or discomfort in a specific area.

**TREATMENT: Tissue-specific herbs + Panchakarma** — now requiring targeted intervention. Still preventable before full manifestation.

**This is where Siddha pulse reading becomes critical** — a skilled Vaidya can feel the localization in the pulse and identify which tissue is being targeted before symptoms appear.`,
      },
      {
        type: 'teaching',
        title: 'Stages 5 & 6 — VYAKTI & BHEDA (Manifestation & Complication)',
        body: `**Stage 5 — VYAKTI (Manifestation):** The disease fully appears with recognizable symptoms. The doctor gives it a name. Blood tests may now show abnormalities. This is when most people seek treatment.

**Stage 6 — BHEDA (Differentiation/Complication):** Chronicity. Complications. Involvement of multiple systems. The disease has differentiated into its specific type and sub-types. Prognosis becomes more guarded.

**Modern medicine excels at Stage 5-6** — diagnosing and managing manifest disease with pharmaceuticals. **Ayurveda excels at Stages 1-4** — prevention, early intervention, and root-cause treatment.

**The ideal:** Use Ayurvedic vigilance for Stage 1-4, and modern medicine for Stage 5-6 when necessary. This is true integrative medicine.`,
      },
      {
        type: 'table',
        title: 'Kriya Kala Quick Reference',
        tableData: {
          headers: ['Stage', 'Name', 'Location', 'Signs', 'Treatment'],
          rows: [
            ['1', 'Sanchaya', 'Home site of Dosha', 'Subtle discomfort, coating begins', 'Diet change only'],
            ['2', 'Prakopa', 'Still in home site, agitated', 'Clear digestive/emotional symptoms', 'Diet + simple herbs'],
            ['3', 'Prasara', 'Enters circulation', 'Systemic symptoms, skin reactivity', 'Specific herbs + begin Panchakarma'],
            ['4', 'Sthana Samshraya', 'Localizes in weak tissue', 'Organ-specific prodromal signs', 'Tissue herbs + Panchakarma'],
            ['5', 'Vyakti', 'Named disease manifests', 'Full symptoms, lab abnormalities', 'Full Ayurvedic + possible medical'],
            ['6', 'Bheda', 'Complication and chronicity', 'Multiple systems, complications', 'Complex multi-modal treatment'],
          ],
        },
      },
      {
        type: 'practice',
        title: 'Daily Stage-1 Monitoring Protocol',
        ritual: [
          { step: 'MORNING CHECK', instruction: 'Ask yourself: is there unusual fullness in my lower abdomen (Vata)? Any acidity or heat (Pitta)? Any heaviness or congestion (Kapha)? These subtle signals are Stage 1 — act NOW with diet.' },
          { step: 'TONGUE ASSESSMENT', instruction: 'A thickening coating means Dosha accumulation has begun. Act before Stage 2: remove dietary aggravants for that Dosha.' },
          { step: 'SEASONAL AWARENESS', instruction: 'Know the current season\'s Dosha (Module 9). During Kapha season (spring), monitor for congestion and weight. During Vata season (autumn), monitor for dryness and anxiety. Prevention starts with seasonal awareness.' },
          { step: 'IMMEDIATE ACTION', instruction: 'When you catch Stage 1: remove the aggravating cause immediately. Skip the heavy meal. Take a ginger tea. Do the oil massage. Rest. Resolve in 24-72 hours. Ignore it and it becomes Stage 2-3 in days to weeks.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'At which stage does the Dosha overflow from its home site and enter general circulation, making the disease systemic?',
        quizOptions: ['Stage 1 — Sanchaya', 'Stage 2 — Prakopa', 'Stage 3 — Prasara', 'Stage 4 — Sthana Samshraya'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "You are now equipped with a tool that most physicians — Eastern or Western — do not have: the ability to catch disease at Stage 1. Every morning when you check your tongue, your pulse, your digestion — you are performing a Stage 1-2 screening that no blood panel can replicate. This daily vigilance is the practice of the immortal Siddha.",
    keyTakeaways: [
      '6 stages: Accumulation → Aggravation → Overflow → Localization → Manifestation → Complication.',
      'Modern medicine catches Stage 5-6. Ayurveda targets Stage 1-4 — before symptoms appear.',
      'Stage 1 treatment: diet change only. Stage 2: diet + herbs. Stage 3+: Panchakarma needed.',
      'Stage 4 (localization) is where Siddha pulse reading is most critical — can detect before symptoms.',
      'Morning tongue + digestive check is a Stage 1-2 screening you can do daily.',
      'The earlier the intervention, the simpler the cure.',
    ],
    dailyPractice: 'Each morning, ask 3 questions: 1) Any unusual abdominal discomfort? 2) Any coating thickening on tongue? 3) Any change in digestion or elimination? A "yes" to any = Stage 1-2 — act with diet today.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 16 — PANCHAKARMA: THE FIVE GREAT PURIFICATIONS
  // ═══════════════════════════════════════════════════════════
  16: {
    moduleNumber: 16,
    agastyarOpening: "The body accumulates. This is its nature. It accumulates food, experience, emotion, toxin, and time. Panchakarma is not detox — it is cellular renewal. It is the reset button that the body cannot press by itself. I have prescribed Panchakarma to thousands of patients. It is the most powerful therapeutic intervention I know.",
    sections: [
      {
        type: 'teaching',
        title: 'What Is Panchakarma?',
        body: `**Panchakarma** (पञ्चकर्म) = Five (Pancha) Actions (Karma). It is the most comprehensive detoxification and rejuvenation system ever developed — a series of medical procedures that systematically remove accumulated Doshas (biological toxins) from their sites of accumulation and eliminate them from the body.

**Why the body cannot detox itself:** While the body has natural elimination pathways, modern life creates Ama (toxic accumulation) faster than these pathways can clear. Stress, processed food, environmental toxins, emotional suppression, and seasonal changes all create Ama that lodges in tissues, blocks channels, and progressively degrades health.

**Panchakarma works in three phases:**
1. **Poorvakarma** (Preparation) — mobilizing toxins from tissues into circulation
2. **Pradhana Karma** (The Five Main Actions) — eliminating the mobilized toxins
3. **Paschatkarma** (Post-treatment) — rebuilding and rejuvenating depleted tissues`,
      },
      {
        type: 'teaching',
        title: 'Poorvakarma — The Essential Preparation',
        body: `The preparation phase is as important as the main treatments. Without it, the Five Actions can damage rather than heal.

**1. Snehana (Oleation) — Internal and External:**

*Internal Snehana:* Taking medicated ghee or oil orally in increasing doses over 3-7 days before the main procedures. The ghee penetrates all 7 Dhatus, lubricates the channels, dislodges fat-soluble toxins from deep tissues, and carries them toward the digestive tract for elimination.

Classic protocol: Start with 1 tsp medicated ghee in warm water at dawn, empty stomach. Increase by 1 tsp each day until you feel complete oleation (stool becomes oily, no desire for oily foods, body feels saturated).

*External Snehana (Abhyanga):* Full-body warm oil massage by one or two therapists for 45-60 minutes, using medicated oils specific to your Dosha and condition.

**2. Swedana (Sudation/Steam Therapy):**

Immediately after Abhyanga, the body is exposed to steam (full-body steam box or herbal steam tent). Duration: 15-30 minutes until sweating is profuse. The heat opens the channels (Srotas), liquefies the Ama that the oil has dislodged, and moves it from the peripheral tissues toward the central digestive tract — ready for elimination.`,
      },
      {
        type: 'teaching',
        title: 'The Five Main Actions (Pradhana Karma)',
        items: [
          '**1. VAMANA (Therapeutic Emesis) — Kapha Purification:** A medically supervised procedure inducing controlled vomiting to eliminate excess Kapha and Ama from the stomach, lungs, and upper GI tract. Used for: chronic congestion, asthma, allergies, skin diseases, obesity, Kapha-type depression. Preparation includes drinking large quantities of salt water or licorice tea. Post-procedure rest is critical.',
          '**2. VIRECHANA (Purgation) — Pitta Purification:** Medicated purgation to cleanse the liver, small intestine, and blood of excess Pitta. Uses herbs like Senna, Triphala, Castor oil, or classical compounds like Trivrit Leha. Used for: acid reflux, skin inflammation, liver conditions, blood disorders, chronic headaches, eye conditions. The "king" treatment for Pitta disorders.',
          '**3. BASTI (Medicated Enema) — Vata Purification:** Called the "king of Panchakarma" — most important and most versatile. Two types: Niruha Basti (herbal decoction enema) and Anuvasana Basti (oil enema). The colon is the primary seat of Vata — direct treatment here rebalances Vata throughout the entire system. Used for: constipation, neurological disorders, joint pain, reproductive health, anti-aging. A 30-day Basti krama (graduated course) is one of the most powerful therapies in Ayurveda.',
          '**4. NASYA (Nasal Administration) — Head Purification:** Administration of medicated oils, ghee, or herbal preparations through the nostrils. The nose is the direct gateway to the brain and head region. 5 types: Navana (nourishing oils), Avapidana (expressed juice), Dhmapana (powder insufflation), Dhuma (herbal smoke), Pratimarsha (daily maintenance nasya). Used for: sinusitis, migraines, hair loss, memory, neurological conditions, thyroid, eye disorders.',
          '**5. RAKTAMOKSHANA (Bloodletting) — Blood Purification:** The fifth Karma — least commonly used but powerful for blood-borne Pitta conditions. Methods: Jalauka (leech therapy — most refined and still widely practiced), Siravyadha (venesection), Shringa (horn), Alabu (gourd), Pracchana (skin scarification). Used for: chronic skin diseases (psoriasis, eczema), gout, inflammatory arthritis, certain liver conditions.',
        ],
      },
      {
        type: 'table',
        title: 'Panchakarma — Which Treatment for Which Dosha',
        tableData: {
          headers: ['Karma', 'Target Dosha', 'Primary Organ', 'Key Conditions Treated', 'Duration'],
          rows: [
            ['Vamana', 'Kapha', 'Stomach, Lungs', 'Asthma, allergies, obesity, congestion', '1 day (after 5-7 day prep)'],
            ['Virechana', 'Pitta', 'Liver, Small Intestine', 'Skin, liver, blood disorders, headaches', '1 day (after prep)'],
            ['Basti', 'Vata', 'Colon', 'Joint pain, constipation, neurology, anti-aging', '8-30 days (Basti krama)'],
            ['Nasya', 'Head Doshas', 'Brain, Sinuses', 'Sinusitis, migraines, memory, thyroid', '7-21 days'],
            ['Raktamokshana', 'Rakta Pitta', 'Blood', 'Psoriasis, gout, inflammatory conditions', 'Variable'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'Home-Adapted Panchakarma — Safe Daily Practices',
        body: `Full clinical Panchakarma requires professional supervision. However, several adapted practices can be safely done at home to achieve significant purification:

**Daily home practices (safe for all):**
- **Triphala before bed:** Gentle daily Virechana (purgation) support — regulates elimination, reduces Pitta and Ama
- **Abhyanga (self-oil massage):** Daily Snehana — lubricates and mobilizes toxins
- **Nasya (nasal oiling):** 2-3 drops sesame oil in each nostril daily — safe home version of Nasya Karma
- **Ginger-lemon-honey tea before meals:** Digestive fire support, Ama reduction

**Seasonal home mini-cleanse (3-7 days):**
1. Eat only light, cooked, easy-to-digest foods (kitchari — rice and lentils with ghee and spices)
2. Take medicated ghee or plain ghee in warm water each morning
3. Daily Abhyanga + warm shower
4. Triphala nightly
5. Minimum activity — rest and inward focus`,
      },
      {
        type: 'quiz',
        quizQuestion: 'Which Panchakarma is called the "King of Panchakarma" and primarily treats Vata through the colon?',
        quizOptions: ['Vamana (emesis)', 'Virechana (purgation)', 'Basti (enema)', 'Nasya (nasal treatment)'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "Every year, ideally twice — at the seasonal junctions — the body needs this reset. Spring Virechana to clear accumulated winter Kapha. Autumn Basti to nourish Vata before winter. This seasonal Panchakarma rhythm, maintained across a lifetime, is one of the primary reasons Ayurvedic practitioners have historically maintained their vitality into very advanced age.",
    keyTakeaways: [
      'Panchakarma = 5 therapeutic actions for systematic Dosha and Ama elimination.',
      'Three phases: Poorvakarma (prep), Pradhana Karma (5 main actions), Paschatkarma (rebuilding).',
      'Snehana (oleation) + Swedana (steam) = essential preparation before any main action.',
      'Vamana = Kapha. Virechana = Pitta. Basti = Vata (King of Panchakarma). Nasya = Head. Raktamokshana = Blood.',
      'Basti krama (30-day enema course) is the most powerful anti-aging protocol in Ayurveda.',
      'Home practices: Triphala nightly, Abhyanga daily, seasonal kitchari cleanse.',
      'Best timing: Spring Virechana, Autumn Basti — aligned with seasonal Dosha cycles.',
    ],
    dailyPractice: 'Begin the simplest home Panchakarma preparation tonight: 1 tsp plain ghee in warm water at dawn tomorrow, empty stomach. Continue for 7 days and observe how your digestion, skin, and clarity change.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 17 — MARMA POINTS: 108 VITAL POINTS
  // ═══════════════════════════════════════════════════════════
  17: {
    moduleNumber: 17,
    agastyarOpening: "The physical body is held together by 108 points of concentrated life force. Touch them correctly, and you heal. Strike them incorrectly, and you can kill. This dual nature is what makes Marma science the most profound — and most carefully guarded — therapeutic knowledge in the Siddha-Ayurvedic tradition.",
    sections: [
      {
        type: 'teaching',
        title: 'What Are Marma Points?',
        body: `**Marma** (मर्म) literally means "secret" or "vulnerable" — from the Sanskrit root *mri* (to die). Marma points are anatomical junctions where multiple structures converge: flesh (Mamsa), blood vessels (Sira), tendons/ligaments (Snayu), bone (Asthi), and joints (Sandhi).

Sushruta defines a Marma point as: *"That spot where flesh, veins, arteries, tendons, bones and joints meet — and which, when injured, causes immediate or delayed death, deformity, or pain."*

But the same convergence that creates vulnerability also creates therapeutic opportunity. Stimulating a Marma point with the right pressure, oil, or intention sends prana flowing through the connected channels — like pressing a reset button on the associated organ system.

**There are 107 Marmas** in Sushruta's classic enumeration (plus Adhipati — the crown point — bringing it to 108 in expanded systems). They are distributed:
- 22 on the lower limbs
- 22 on the upper limbs
- 12 on the abdomen and chest
- 14 on the back
- 37 on the head and neck`,
      },
      {
        type: 'teaching',
        title: 'The 5 Categories of Marma Points',
        items: [
          '**1. MAMSA MARMA (Muscular)** — 11 points. Located in muscle tissue. When injured: loss of function, pain, or death depending on severity. Therapeutic use: releasing muscular holding patterns, chronic pain, stored emotional tension in muscle tissue.',
          '**2. SIRA MARMA (Vascular)** — 41 points. Located at blood vessels. The most numerous category. When injured: bleeding disorders, organ dysfunction. Therapeutic use: improving circulation, treating blood disorders, organ-specific stimulation.',
          '**3. SNAYU MARMA (Tendon/Ligament)** — 27 points. Located at tendons and ligaments. When injured: loss of motor function. Therapeutic use: joint health, mobility, nerve-related conditions.',
          '**4. ASTHI MARMA (Bony)** — 8 points. Located at bone prominences. When injured: bone deformities, severe pain. Therapeutic use: structural alignment, bone health.',
          '**5. SANDHI MARMA (Joint)** — 20 points. Located at joints — the most sensitive category. When injured: immediate severe effects. Therapeutic use: joint health, arthritis, flexibility.',
        ],
      },
      {
        type: 'teaching',
        title: 'The 12 Sadyo Pranhar Marmas — Instantly Fatal Points',
        body: `Sushruta identified 12 Marmas as **Sadyo Pranhar** — "immediately death-causing." These are the points where even moderate injury causes instant death. Understanding their location is essential for both protection and therapy.

These include: Shankha (temple), Utkshepa (above the ear), Sthapani (third eye), Brahmarandhra (crown of skull), Adhipati (crown), Shringataka (soft palate junction), Murdha (top of head), Nila and Manya (neck vessels), Hridaya (heart), Basti (bladder), and Guda (perineum).

**In therapeutic context:** These points are NEVER pressed with force. They are activated only with the lightest touch, medicated oil, or intention — and only by trained practitioners.`,
      },
      {
        type: 'teaching',
        title: '12 Therapeutic Marma Points for Self-Care',
        body: 'These points are safe for self-stimulation with gentle circular pressure (1-3 minutes each):',
        items: [
          '**Talhridayam** (Palm center) — Pericardium point. Press with opposite thumb. Calms the heart, reduces anxiety, opens emotional expression.',
          '**Talahridayam** (Sole center) — Kidney energy. Press with fingers or walk on a wooden massage ball. Grounds Vata, reduces stress.',
          '**Kurpara** (Elbow crease) — Lung point. Gentle pressure. Respiratory health, grief release.',
          '**Indrabasti** (Center of calf) — Digestive health. Stimulate by pressing firmly in center of calf muscle. Improves digestion, reduces abdominal pain.',
          '**Manibandha** (Wrist joint) — Vata regulation point. Circular massage around the wrist. Calms the nervous system.',
          '**Gulpha** (Ankle joint) — Reproductive and elimination health. Circular massage around both ankles daily.',
          '**Nabhi** (Navel) — The most important self-care point. The navel is connected to ALL organs through 72,000 nadis. Daily navel oiling with sesame oil (2-3 drops, circular massage) balances the entire system.',
          '**Hridaya** (Heart center — sternum) — Anahata activation. Gentle circular palm pressure on sternum. Opens heart energy, calms fear and grief.',
          '**Sthapani** (Third eye — between eyebrows) — Mind calming, headache relief. Very gentle pressure or warm sesame oil.',
          '**Shankha** (Temple) — CAUTION — very gentle only. Headache relief. Apply warm sesame oil and breathe.',
          '**Kshipra** (Thumb-index web) — Digestive and respiratory point. Firm pressure in the web. Immediate effect on digestion and breathing.',
          '**Janu** (Knee joint) — Joint health, Vata in legs. Circular massage around the knee joint with warm sesame oil.',
        ],
      },
      {
        type: 'practice',
        title: 'Daily 10-Minute Marma Self-Care Protocol',
        ritual: [
          { step: 'NAVEL OILING', instruction: 'Begin: 2-3 drops warm sesame oil in navel. Circular massage clockwise for 2 minutes. This activates the navel center — connected to all organs.' },
          { step: 'HAND MARMAS', instruction: 'Press Talhridayam (palm center) with opposite thumb, 30 seconds each hand. Then Kshipra (thumb-index web), 30 seconds each. Calms heart and activates digestion.' },
          { step: 'FOOT MARMAS', instruction: 'Warm sesame oil on both soles. Press Talahridayam (sole center) with thumbs. Then massage around both ankles (Gulpha). 2 minutes.' },
          { step: 'WRIST AND ELBOW', instruction: 'Circular massage around each wrist (Manibandha) and gentle press in elbow crease (Kurpara). 1 minute each side.' },
          { step: 'CLOSE', instruction: 'Both palms on heart center (sternum). Eyes closed. 3 deep breaths. Feel the prana distributed through the points you activated.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'The navel (Nabhi) Marma is said to be connected to all organs through how many Nadis?',
        quizOptions: ['1,008', '14', '72,000', '108'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "You now carry a therapeutic system in your own two hands. The Marma points are always accessible — no equipment, no prescription, no appointment needed. The 10-minute daily protocol, done with intention and warm oil, is equivalent to a full body tune-up. The ancients designed the body to be self-serviceable.",
    keyTakeaways: [
      '108 Marma points — convergence zones of flesh, vessel, tendon, bone, and joint.',
      '5 categories: Mamsa, Sira, Snayu, Asthi, Sandhi Marmas.',
      '12 Sadyo Pranhar Marmas are instantly fatal if severely struck — therapeutic use is gentlest touch only.',
      'Nabhi (navel) = most important self-care point — connected to all organs via 72,000 Nadis.',
      'Talhridayam (palm center) = heart calming. Kshipra (thumb web) = digestion.',
      'Daily 10-minute Marma self-care protocol replaces much of bodywork needs.',
      'Always use warm sesame oil with Marma stimulation — oil carries prana.',
    ],
    dailyPractice: 'Tonight before bed: 2-3 drops warm sesame oil in your navel. Gentle clockwise circular massage for 2 minutes. Then oil your soles and press the sole centers. This simple practice, done nightly, has been used by Siddha practitioners for centuries for grounding, immunity, and deep sleep.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 18 — VARMA THERAPY: SIDDHA ENERGY POINT SCIENCE
  // ═══════════════════════════════════════════════════════════
  18: {
    moduleNumber: 18,
    agastyarOpening: "Varma is to Siddha what Marma is to Ayurveda — but deeper. Older. More secret. The Varma tradition was transmitted orally for thousands of years. It was the sacred technology of the Tamil Siddhar warriors and healers — the knowledge that a single point, touched in the right way at the right moment, can save a life or end it. I give you this knowledge now. Carry it with reverence.",
    sections: [
      {
        type: 'teaching',
        title: 'What Is Varma?',
        body: `**Varma** (வர்மம்) comes from the Tamil word for "vital center" or "life point." The Varma tradition is a complete system of vital point therapy preserved in the Tamil Siddha lineage — older and more comprehensive than the Sanskrit Marma system of Ayurveda.

**Key differences from Marma:**
- Varma points number 108 (like Marma) but their locations and classifications differ
- Varma uses a more energetic framework — each point is mapped to specific prana flows
- Varma includes 12 secret super-vital points called **Adangal** (no Marma equivalent)
- Varma therapy includes the art of **Thokkanam** — a specific touch system with 9 distinct types
- Varma was traditionally transmitted only within specific Kalari and Siddha lineages
- Varma knowledge was kept intentionally incomplete in written texts — true transmission required a living teacher

**The three domains of Varma knowledge:**
1. **Meikaatha Varmam** — Strikes that cause death or disability (martial art — NOT for students)
2. **Paduvarmam** — Points that cause delayed effects when struck
3. **Thaduvuvarmam** — Therapeutic stimulation to heal (what we study here)`,
      },
      {
        type: 'teaching',
        title: 'Thokkanam — The 9 Sacred Touches',
        body: `**Thokkanam** is the therapeutic massage system of Siddha medicine — completely distinct from Abhyanga (Ayurvedic oil massage). The nine touches are precise therapeutic techniques, each with specific physiological effects:`,
        items: [
          '**1. Thattu (Tapping):** Rhythmic tapping on the body surface. Effect: stimulates superficial channels, activates Varma points, improves circulation, reduces superficial Ama.',
          '**2. Idippu (Pinching):** Controlled pinching of skin and underlying tissue. Effect: stimulates nerve endings, breaks up adhesions, moves stagnant lymph.',
          '**3. Murukku (Twisting):** Rotational pressure. Effect: releases deep-seated muscle tension, breaks up deep Ama deposits, activates joint-associated Varma points.',
          '**4. Azhuthu (Pressing):** Sustained firm pressure. Effect: deactivates pain signals, releases trigger points, activates the connected organ reflex through the Varma channel.',
          '**5. Irukku (Compression):** Full grip compression of a muscle or body area. Effect: flushes blood from an area then allows fresh blood in — powerful detox of the compressed region.',
          '**6. Kulukku (Shaking/Vibrating):** Vibrational movement applied to the body. Effect: breaks up stagnation, stimulates deeper structures, used for specific neurological conditions.',
          '**7. Piritthu (Wringing):** Counter-directional pressure like wringing fabric. Effect: deep tissue release, very effective for chronic muscular armoring.',
          '**8. Vadithu (Rubbing):** Vigorous linear friction. Effect: generates heat, opens Srotas (channels), excellent preparation for deeper work.',
          '**9. Pidiththu (Holding):** Sustained gentle holding with full palm contact and intention. Effect: the most subtle touch — transmits prana and healing intention through the palm into the held tissue. Used at the end of sessions to seal the treatment.',
        ],
      },
      {
        type: 'secret',
        title: 'The Kalari-Varma Connection',
        body: `**Kalaripayattu** is the oldest martial art in the world — from Kerala, sister tradition to the Tamil Varma tradition. In Kalari, the body is viewed as a living energy system, and the practitioner learns the vital points both as targets (for combat) and as healing sites (for medicine).

The Kalari master who injures a student in training knows exactly which Varma point was struck — and knows the corresponding therapeutic touch to reverse the damage. This dual knowledge — injury and healing through the same points — is the hallmark of genuine Varma mastery.

This is why Siddha physicians were also often trained in Kalari. The martial training develops the sensitivity of touch and the understanding of the body's energy architecture that makes Varma therapy possible.

The therapeutic insight: **a Varma point that creates pain when struck creates healing when gently stimulated.** The difference is not location — it is direction, pressure, and intention.`,
      },
      {
        type: 'teaching',
        title: '7 Accessible Therapeutic Varma Points',
        body: 'These 7 points are safe for self-stimulation and clinical practice:',
        items: [
          '**Kalam (Crown Varma)** — Top of skull, slight front of center. Very gentle circular touch with fingertips. Effect: calms the mind, reduces headache, activates crown energy. NEVER press hard.',
          '**Kaalam (Third Eye Varma)** — Between eyebrows. Extremely gentle touch with ring finger. Effect: immediate reduction of mental agitation, headache relief.',
          '**Vilangu Kalam (Throat Varma)** — Hollow at base of throat. Extremely gentle — never press directly. Effect: voice, thyroid, expression. Use circular movement around (not on) the point.',
          '**Padamaiyam (Heart Varma)** — Center of sternum at heart level. Gentle palm pressure. Effect: cardiac calming, emotional release, opens Anahata.',
          '**Nabhi Varma (Navel)** — Same as Nabhi Marma. Circular stimulation with oil. Effect: central prana balance.',
          '**Virunthu (Knee Varma)** — Inner knee crease. Gentle pressure with thumb. Effect: joint health, Vata in lower body, urinary function.',
          '**Sandhi Varma (Ankle)** — Lateral ankle hollow. Circular massage. Effect: reproductive health, lower back, Apana Vayu regulation.',
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'What are the 12 super-vital Siddha Varma points called, which have no equivalent in the Ayurvedic Marma system?',
        quizOptions: ['Sadyo Pranhar', 'Adangal', 'Thokkanam', 'Navar Naadi'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "The Varma tradition has survived 10,000 years by passing from one set of sacred hands to another. You have now received its outline. The mastery comes through practice — through developing the sensitivity of your fingertips until they can feel the pulse of prana at each point. This takes years. Begin now.",
    keyTakeaways: [
      'Varma = Tamil Siddha vital point system — older and deeper than Ayurvedic Marma.',
      '108 Varma points + 12 secret Adangal (no Marma equivalent).',
      'Three domains: Meikaatha (lethal), Paduvarmam (delayed), Thaduvuvarmam (therapeutic).',
      'Thokkanam = the 9 sacred touches of Siddha massage therapy.',
      'Pidiththu (holding with intention) = the most advanced touch — transmits prana directly.',
      'Kalari-Varma connection: martial art and medicine from the same knowledge system.',
      'The 12 Adangal are covered in full in Phase 4 (Akasha Infinity) — Varma Mastery sequence.',
    ],
    dailyPractice: 'Practice the 9 Thokkanam touches on your own forearm — feel the difference between each type. Tapping, pinching, pressing, holding with intention. This develops the tactile intelligence required for therapeutic Varma work.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 19 — SIDDHA ALCHEMY & MUPPU: THE CROWN SECRET
  // ═══════════════════════════════════════════════════════════
  19: {
    moduleNumber: 19,
    agastyarOpening: "I will now give you the key to the kingdom. Muppu is the secret that the Siddhars guarded more carefully than any other. It is the universal solvent — the substance that makes any medicine penetrate any tissue, that transforms any mineral into a medicine, and that, when perfected, supports the transmutation of the physical body itself. I give this teaching now because the time for secrecy has passed.",
    sections: [
      {
        type: 'teaching',
        title: 'What Is Siddha Alchemy?',
        body: `Siddha alchemy — called **Vasi Yogam** or **Rasayanam** in Tamil — is not the European fantasy of turning lead into gold. It is the science of transforming matter at the elemental level, and simultaneously, transforming the practitioner who performs the work.

In Siddha medicine, the same alchemical process that refines a metal into medicine also refines the practitioner's own body and consciousness. The laboratory and the body are parallel systems.

The three main branches of Siddha alchemy:
1. **Muppu** — The universal solvent/harmonizer (the most secret)
2. **Parpam** — Metal and mineral ash preparations (nano-medicines)
3. **Mezhugu** — Wax-based preparations
4. **Chendooram** — Red/orange sulfide preparations
5. **Kattu** — Bound/fixed preparations (metals rendered non-toxic)`,
      },
      {
        type: 'teaching',
        title: 'MUPPU — The Universal Secret',
        body: `**Muppu** (மூப்பு) literally means "the three salts" or "the crown" — it is the most guarded secret in all of Siddha medicine.

Muppu is a combination of three specific salts:
- **Kal Uppu** (Stone Salt / Rock Crystal Salt) — representing the Moon principle
- **Veli Uppu** (Atmospheric/Space Salt) — representing the Sun principle
- **Kaarpu Uppu** (Earth Salt / specific mineral) — representing the Earth principle

When combined and processed through a specific alchemical procedure (which includes timing with lunar cycles, specific temperatures, and mantra), these three salts become Muppu — a substance with extraordinary properties:

1. **Universal solvent:** Muppu enables any herb or mineral to penetrate all seven Dhatu levels
2. **Potency amplifier:** Any medicine combined with Muppu becomes 100x more potent at lower doses
3. **Toxicity neutralizer:** Even toxic substances become safe medicine when processed with Muppu
4. **Cellular messenger:** Muppu appears to act as a biological carrier — its nano-particulate structure allows it to cross cell membranes and blood-brain barriers

**The modern parallel:** Researchers have noted similarities between Muppu's described properties and modern nanotechnology — specifically the ability of nano-sized particles to penetrate biological barriers that larger molecules cannot.`,
      },
      {
        type: 'secret',
        title: 'Kaya Kalpa — The Science of Bodily Immortality',
        body: `**Kaya Kalpa** (காயகல்பம்) — literally "body transformative" — is the Siddha science of preventing aging and maintaining the physical body in a state of optimal vitality for an extended lifespan.

The 18 Siddhars reportedly achieved Kaya Kalpa — maintaining their physical bodies while simultaneously existing in higher states of consciousness. The evidence: Bogar's body was discovered preserved in the subterranean chamber beneath the Palani Hill temple centuries after his reported "death." Agastyar (myself) is said to still inhabit a physical form in the Pothigai Hills of South India.

**The four components of Kaya Kalpa:**
1. **Koshtha Shuddhi** — Purification of the digestive tract (Panchakarma)
2. **Shakha Shuddhi** — Purification of the peripheral channels and limbs
3. **Marma/Varma activation** — Keeping all 108 vital points alive with prana flow
4. **Srotamsi purification** — Clearing all 13 channel systems of Ama

**The Kaya Kalpa herbs:**
- Brahmi (Bacopa) — nerve and brain regeneration
- Shankhpushpi — myelin sheath protection
- Mandookaparni (Gotu Kola) — cellular regeneration
- Chlorophytum — Kaya Kalpa herb for overall vitality
- Triphala — the foundational purifier
- Muppu-processed herbs — the pinnacle of the system`,
      },
      {
        type: 'teaching',
        title: 'Navapashanam — Bogar\'s 9-Mineral Masterpiece',
        body: `**Navapashanam** (Nine Poisons Transformed) is the most famous Siddha alchemical compound — created by Bogar, one of the 18 Siddhars.

Bogar is said to have created a statue of the deity Murugan at the Palani Hill temple in Tamil Nadu using Navapashanam — an alloy of nine specific minerals including: arsenic, mercury, lead, sulfur, mica, copper, iron, gold, and others.

Each mineral is individually processed through Siddha Shodhana (purification) — multi-stage processes involving specific herbs, heat, and alchemical procedures that transform toxic minerals into nano-particulate medicines. When combined, they form a substance of extraordinary healing potency.

The remarkable fact: The abhishekam (ritual bathing) water that flows off this statue has been observed for centuries to heal conditions in devotees. Modern analysis has detected unusual bio-active compounds in the water — compounds consistent with processed mineral nano-particles.

**The principle:** Siddha alchemy understood nano-medicine before nanotechnology. The extreme purification processes created nano-sized particles with unique biological activity — exactly what modern pharmaceutical nanotechnology is now attempting to replicate synthetically.`,
      },
      {
        type: 'teaching',
        title: 'Parpam — Siddha Ash Medicines',
        body: `**Parpam** is the Siddha equivalent of Bhasma in Ayurveda — calcined (ash) preparations of metals and minerals. The preparation process is rigorous:

1. **Shodhana (Purification):** The metal is purified through multiple rounds of heating and quenching in herbal juices, removing toxic fractions
2. **Marana (Calcination):** The purified metal is powdered and heated in sealed clay pots to extremely high temperatures, converting it to ash
3. **Quality testing:** The ash is tested for specific qualities — ultra-fine particle size (must float on water), no metallic smell, even color

**Classical Parpam preparations:**
- **Thanga Parpam** (Gold ash) — cardiac tonic, brain, anti-aging, deepest Rasayana
- **Velli Parpam** (Silver ash) — neurological health, cooling, immune
- **Thamira Parpam** (Copper ash) — liver, anemia, digestive
- **Naga Parpam** (Lead ash — after multiple purifications) — skin conditions, thyroid

**Dose:** Microdose — 65-130mg per dose. At this scale, properly processed metals behave completely differently from their toxic bulk form.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'What does "Muppu" literally mean in Tamil, and what are its three components?',
        quizOptions: [
          'Five salts — earth, water, fire, air, space',
          'Three salts — Moon salt, Sun salt, Earth salt',
          'Nine minerals — the Navapashanam formula',
          'Universal solvent — a single substance',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Siddha alchemy is not for everyone — it requires a purified body, a calm mind, a clear intention, and ideally a living teacher. What you have received today is the understanding — the philosophical and scientific framework. The practice of Muppu preparation and Kaya Kalpa belongs to Phase 4 of this curriculum, for those who have prepared themselves through the preceding practices. The seed has been planted.",
    keyTakeaways: [
      'Muppu = three salts (Moon, Sun, Earth) combined alchemically = universal solvent and potency amplifier.',
      'Muppu acts like a biological carrier — nano-particulate structure crosses blood-brain barrier.',
      'Kaya Kalpa = 4-component system for bodily renewal and longevity.',
      'Navapashanam = Bogar\'s 9-mineral masterpiece — nano-medicine before nanotechnology.',
      'Parpam = Siddha ash medicines — metals transformed into medicine through extreme purification.',
      'Siddha alchemy understood nano-particle biology thousands of years before modern science.',
      'Full Muppu and Kaya Kalpa practice: Phase 4 — Akasha Infinity (Rasayana Mastery sequence).',
    ],
    dailyPractice: 'Research Navapashanam and the Palani Hill temple. Read Bogar\'s background and the documented healing reports from pilgrims. This grounds the teaching in verifiable historical reality and begins building your understanding of Siddha alchemy\'s real-world effects.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 20 — DRAVYA GUNA: ADVANCED HERBOLOGY
  // ═══════════════════════════════════════════════════════════
  20: {
    moduleNumber: 20,
    agastyarOpening: "A herb is not a chemical. A herb is a consciousness. It has its own Prana, its own intelligence, its own intention. The Siddha herbalist does not extract — she communes. When you learn the language of Rasa, Guna, Virya, Vipaka, and Prabhava, every plant in the world becomes your teacher.",
    sections: [
      {
        type: 'teaching',
        title: 'The Five Properties of Every Herb (Dravya Guna)',
        body: `**Dravya Guna** (द्रव्यगुण) — the science of drug properties — is the pharmacological framework of Ayurveda. Every substance has five properties that determine its complete therapeutic action:

**1. RASA (Taste):** The taste experienced on the tongue. Six tastes: Sweet, Sour, Salty, Pungent, Bitter, Astringent. Taste immediately tells you the dosha effect (Module 10).

**2. GUNA (Quality):** The 20 pairs of opposing qualities (Visheshika Guna) — Heavy/Light, Cold/Hot, Oily/Dry, Slimy/Rough, Dense/Liquid, Soft/Hard, Stable/Mobile, Subtle/Gross, Smooth/Sharp, Clear/Cloudy. These qualities describe how the substance behaves in the body.

**3. VIRYA (Potency):** The heating (Ushna) or cooling (Sheeta) nature — the most therapeutically important property. Virya acts faster than taste.

**4. VIPAKA (Post-digestive effect):** The taste that the substance becomes after complete digestion in the colon — determining its long-term, deep tissue effect. Three Vipakas: Sweet, Sour, Pungent.

**5. PRABHAVA (Special power):** The unique, specific action that cannot be explained by the other four properties — the "special intelligence" of the whole plant. This is why Ayurveda insists on whole-plant medicine over isolated compounds.`,
      },
      {
        type: 'table',
        title: '50 Classical Herbs — Properties at a Glance (Selected)',
        tableData: {
          headers: ['Herb', 'Rasa (Taste)', 'Virya', 'Vipaka', 'Primary Action'],
          rows: [
            ['Ashwagandha', 'Bitter, Astringent, Sweet', 'Heating', 'Sweet', 'Adaptogen, Ojas builder, Vata-Kapha'],
            ['Shatavari', 'Sweet, Bitter', 'Cooling', 'Sweet', 'Female tonic, Pitta-Vata, Ojas'],
            ['Brahmi', 'Bitter, Sweet, Astringent', 'Cooling', 'Sweet', 'Brain tonic, Sattva, all Doshas'],
            ['Guduchi', 'Bitter, Astringent', 'Heating', 'Sweet', 'Immune, anti-inflammatory, all Doshas'],
            ['Neem', 'Bitter, Astringent', 'Cooling', 'Pungent', 'Blood purifier, Pitta-Kapha'],
            ['Turmeric', 'Bitter, Pungent', 'Heating', 'Pungent', 'Anti-inflammatory, blood, Kapha-Vata'],
            ['Ginger (dry)', 'Pungent, Sweet', 'Heating', 'Sweet', 'Agni, digestion, all Doshas'],
            ['Triphala', 'All 6 tastes (except salty)', 'Neutral', 'Sweet', 'Cleanse, anti-aging, all Doshas'],
            ['Licorice', 'Sweet', 'Cooling', 'Sweet', 'Soothing, adrenal, Vata-Pitta'],
            ['Trikatu', 'Pungent', 'Heating', 'Pungent', 'Agni kindler, Ama burner, Kapha'],
            ['Punarnava', 'Bitter, Astringent, Sweet', 'Cooling', 'Sweet', 'Diuretic, kidney, reduces inflammation'],
            ['Manjistha', 'Sweet, Bitter, Astringent', 'Heating', 'Pungent', 'Blood purifier, skin, lymph, Pitta'],
            ['Bhringaraj', 'Bitter', 'Heating', 'Pungent', 'Hair, liver, brain, longevity'],
            ['Vidanga', 'Pungent', 'Heating', 'Pungent', 'Antiparasitic, digestive, Kapha'],
            ['Haritaki', 'All 6 tastes', 'Heating', 'Sweet', 'King of medicines, all Doshas'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'The 10 Dashemani Groups — Charaka\'s Classification',
        body: `Charaka organized medicinal herbs into 50 groups of 10 (**Dashemani**) based on their primary therapeutic action. The 10 most important groups:`,
        items: [
          '**Deepaniya** (Digestive stimulants): Ginger, Long pepper, Black pepper, Chitrak, Ajwain — kindle Agni',
          '**Pachana** (Digestants): Coriander, Fennel, Cardamom, Cumin, Ajwain — help digest Ama',
          '**Anuvasanopaga** (Oil enema herbs): Sesame, Ashwagandha, Shatavari, Bala, Atibala — support Basti',
          '**Shirovirechana** (Head-clearing herbs): Vidanga, Pippali, Shigru, Maricha, Saindhava — clear head',
          '**Snehopaga** (Oleation herbs): Sesame, Castor, Flaxseed — support Snehana',
          '**Svedopaga** (Diaphoretic herbs): Dashamoola (10 roots), Deodar, Sarsaparilla — induce sweat',
          '**Vamana** (Emetic herbs): Madanphala, Yashtimadhu, Kutaja — controlled Vamana therapy',
          '**Virechanopaga** (Purgative herbs): Triphala, Trivrit, Castor oil, Senna — Virechana support',
          '**Jvarahara** (Fever herbs): Guduchi, Neem, Kiratatikta, Musta — reduce fever',
          '**Rasayana** (Rejuvenating herbs): Ashwagandha, Brahmi, Amla, Shatavari, Shilajit — tissue renewal',
        ],
      },
      {
        type: 'teaching',
        title: '6 Classical Preparation Methods (Kalpana)',
        body: 'How herbs are prepared fundamentally changes their action:',
        items: [
          '**Svarasa (Fresh juice):** Most potent — raw plant intelligence. Tulsi juice, Aloe vera, Amla juice. Best for acute conditions.',
          '**Kalka (Paste):** Ground fresh herb applied topically or taken internally. Turmeric paste, Brahmi paste.',
          '**Kwatha (Decoction):** Boiled in water — 1 part herb to 16 parts water, reduced to 1/4. Best for most chronic conditions. Deeper extraction than tea.',
          '**Churna (Powder):** Dried, powdered herbs. Triphala churna, Ashwagandha churna. Convenient, moderate potency.',
          '**Ghrita (Medicated ghee):** Herbs processed into ghee — penetrates all 7 Dhatus. Best for Vata and Pitta, brain, nerves. Brahmi Ghrita, Panchagavya Ghrita.',
          '**Taila (Medicated oil):** Herbs processed into sesame or coconut oil — best for Vata, joints, skin. Mahanarayan Taila, Kshirabala Taila.',
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which preparation method penetrates all 7 Dhatu levels and is best for neurological and Vata conditions?',
        quizOptions: ['Svarasa (fresh juice)', 'Kwatha (decoction)', 'Churna (powder)', 'Ghrita (medicated ghee)'],
        quizAnswer: 3,
      },
    ],
    agastyarClosing: "You now have the operating system of Ayurvedic pharmacology. With Rasa-Guna-Virya-Vipaka-Prabhava, you can assess ANY herb, ANY food, ANY substance you encounter — and predict its likely effect. This is clinical herbology. The rest is practice — and the best practice is knowing your own body's responses intimately.",
    keyTakeaways: [
      'Five properties of every herb: Rasa (taste), Guna (quality), Virya (potency), Vipaka (post-digestive), Prabhava (special).',
      'Virya (heating/cooling) is the most therapeutically decisive property.',
      'Charaka\'s 50 Dashemani groups organize herbs by therapeutic action.',
      '6 preparation methods: juice, paste, decoction, powder, medicated ghee, medicated oil.',
      'Medicated ghee (Ghrita) = deepest penetrating preparation — reaches all 7 Dhatus.',
      'Prabhava = the special wisdom of the whole plant — reason isolated compounds are inferior.',
    ],
    dailyPractice: 'Choose one herb from this module. Study its 5 properties (Rasa-Guna-Virya-Vipaka-Prabhava). Take it daily in the correct preparation for 2 weeks. Observe every effect: digestion, sleep, skin, mood, elimination. This is clinical herbology education.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 21 — RASAYANA: THE ART OF REJUVENATION
  // ═══════════════════════════════════════════════════════════
  21: {
    moduleNumber: 21,
    agastyarOpening: "Every human being deserves to experience what a body feels like when all seven tissues are fully nourished, all channels are clear, and Ojas is abundant. Most people have never felt this. Rasayana is the science of making it happen — and keeping it that way.",
    sections: [
      {
        type: 'teaching',
        title: 'What Is Rasayana?',
        body: `**Rasayana** (रसायन) comes from Rasa (the first Dhatu — plasma) + Ayana (path). Literally: "the path through plasma" — a substance or practice that nourishes and renews all tissues through the plasma pathway.

Charaka defines Rasayana as: *"That which provides long life, memory, intelligence, health, youth, radiance, voice quality, strength, sensory excellence, and which destroys disease."*

Rasayana is one of the 8 branches of Ayurveda (Jara/Rasayana Tantra). It represents Ayurveda's complete anti-aging science — a system for not just prolonging life but elevating its quality at every level.

**Three categories of Rasayana:**
1. **Aushadha Rasayana** — Herbal and mineral rejuvenators
2. **Ahara Rasayana** — Foods that function as Rasayana
3. **Achara Rasayana** — Behavioral/lifestyle rejuvenation (the most powerful and most ignored)`,
      },
      {
        type: 'teaching',
        title: 'Achara Rasayana — Behavioral Rejuvenation',
        body: `Charaka lists **Achara Rasayana** behaviors — lifestyle practices that are themselves Rasayana. This is the most overlooked aspect of anti-aging medicine:

The Charaka Samhita states that these behaviors produce Rasayana effects equal to or greater than any herb:`,
        items: [
          '**Satya (Truthfulness):** Speaking truth reduces the energetic expenditure of maintaining falsehood. The body chemistry of honesty is measurably different from deception.',
          '**Akrodha (Freedom from anger):** Chronic anger destroys Pitta, depletes Ojas, ages the body rapidly. Every rage episode burns Ojas that takes weeks to rebuild.',
          '**Ahimsa (Non-violence):** Violence — including violence in thought — activates stress hormones that accelerate aging.',
          '**Anasuya (Non-jealousy):** Jealousy creates a constant stress state — a background cortisol elevation that ages the body.',
          '**Shama (Equanimity):** The ability to remain balanced through difficulty — the hallmark of low cortisol, high DHEA, high Ojas.',
          '**Guru Seva (Service to the teacher/wise ones):** Humility and learning keep the mind young and the ego small.',
          '**Cleanliness — outer and inner:** Physical cleanliness (daily routine) and inner cleanliness (forgiveness, release of grudges).',
          '**Brahmacharya (Appropriate use of sexual energy):** Conservation and transmutation of sexual energy is the primary Ojas-building practice in the Siddha tradition.',
        ],
      },
      {
        type: 'teaching',
        title: '12 Classical Aushadha Rasayanas',
        body: 'These are the most studied and proven Rasayana formulations:',
        items: [
          '**Chyawanprash:** The most famous Rasayana. 50+ herbs with Amla as the base. Daily 1 tsp with warm milk. Immune system, respiratory health, energy, anti-aging. For ALL constitutions.',
          '**Brahma Rasayana:** Complex formulation for brain health, memory, intelligence. Contains Brahmi, Ashwagandha, Shatavari, 50+ additional herbs processed with ghee and honey.',
          '**Amalaki Rasayana:** Amla alone processed to amplify its Rasayana properties. The single most powerful anti-aging food in Ayurveda.',
          '**Ashwagandha Rasayana:** Ashwagandha churna with milk and ghee — the most accessible building Rasayana. Testosterone, strength, sleep, stress adaptation.',
          '**Brahmi Ghrita:** Brahmi herb processed in ghee. Brain, memory, neurological health, mental clarity. 1 tsp with warm milk before sleep.',
          '**Shatavari Kalpa:** Shatavari processed into easily consumable form. The premier female Rasayana — hormonal balance, lactation, vitality.',
          '**Narasimha Rasayana:** For building physical strength, for men especially. Sesame seed base with warming herbs.',
          '**Kushmanda Rasayana:** Pumpkin (Kushmanda) based Rasayana. Brain tonic, mental health, psychological stability.',
          '**Agastyar Haritaki (my own formula):** Haritaki processed with honey, ghee, sesame, and timing specific herbs. This is my signature formula — for longevity, intelligence, and spiritual clarity.',
          '**Shilajit:** Not an herb but a mineral pitch — the ancient "conqueror of mountains." Contains 85+ minerals in ionic form, fulvic acid. Restores Ojas at the deepest cellular level.',
          '**Ashwagandha + Shatavari combination:** The most practical daily Rasayana — 1/2 tsp each in warm milk with ghee and honey (added after cooling). Daily tonic for ALL constitutions.',
          '**Triphala Rasayana:** Triphala with honey and ghee — the most accessible multi-tissue rejuvenator.',
        ],
      },
      {
        type: 'practice',
        title: 'The 40-Day Rasayana Protocol',
        body: 'One complete Dhatu cycle — profound tissue renewal:',
        ritual: [
          { step: 'MORNING (before breakfast)', instruction: 'Soak 5 almonds + 5 walnuts overnight. Peel almonds. Blend with warm milk, 1 pinch saffron, 1/4 tsp cardamom, 1/2 tsp Ashwagandha, 1 tsp raw honey (after cooling). Drink slowly, seated.' },
          { step: 'WITH BREAKFAST', instruction: '1 tsp Chyawanprash with warm milk or water. This is the daily Rasayana anchor — never skip it.' },
          { step: 'MIDDAY', instruction: 'Your main meal includes ghee. Minimum 1 tsp clarified butter in or on food. Ghee is itself a Rasayana.' },
          { step: 'EVENING', instruction: 'Warm golden milk: 1 cup whole milk, 1/2 tsp turmeric, 1/4 tsp Ashwagandha, 1/4 tsp Brahmi, 1 tsp ghee, pinch black pepper, honey after cooling.' },
          { step: 'BEDTIME', instruction: '1/2 tsp Triphala churna in warm water. This is Rasayana AND cleansing — removing old tissue to make room for new.' },
          { step: '40-DAY COMMITMENT', instruction: 'No variation. No days off. The 40-day period completes one full Dhatu cycle — meaning every tissue in your body has been rebuilt with Rasayana nourishment. The results are cumulative and profound.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'According to Charaka, what lifestyle behavior (Achara Rasayana) is classified as equal to taking a herbal Rasayana?',
        quizOptions: ['Sleeping 10 hours per night', 'Truthfulness and freedom from anger', 'Eating raw food only', 'Daily cold water immersion'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Rasayana is not optional for those who wish to live fully. The body has a default setting — and that setting is gradual decline. Rasayana overrides the default. It says: the body can regenerate, renew, and thrive at every age. I have seen this in my own body and in thousands of patients. Begin the 40-day protocol. You will not recognize your energy levels after one complete Dhatu cycle.",
    keyTakeaways: [
      'Rasayana = anti-aging science that nourishes all 7 Dhatus through the plasma pathway.',
      'Three types: Aushadha (herbal), Ahara (food), Achara (behavioral — the most powerful).',
      'Achara Rasayana: truthfulness, non-anger, equanimity, cleanliness, appropriate use of sexual energy.',
      'Chyawanprash = the most universally beneficial daily Rasayana. 1 tsp with warm milk daily.',
      'Ashwagandha + Shatavari in warm milk with ghee = the most accessible daily tonic.',
      'The 40-day protocol covers one complete Dhatu cycle — tissue-level transformation.',
      'Shilajit = the mineral Rasayana. 85+ minerals in ionic form. Deepest cellular nourishment.',
    ],
    dailyPractice: 'Begin today: 1 tsp Chyawanprash with warm milk every morning. This single addition, sustained for 90 days, will show measurable improvements in immunity, energy, respiratory health, and skin quality.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 22 — MANAS SHASTRA: AYURVEDIC PSYCHOLOGY
  // ═══════════════════════════════════════════════════════════
  22: {
    moduleNumber: 22,
    agastyarOpening: "In Ayurveda, mind and body are one continuous process — not two separate systems that happen to interact. The Siddha teaching goes further: the mind is not in the brain. The mind is distributed through the entire body, through every cell, through the prana field. This means: to heal the mind, you must heal the body. And to heal the body, you must heal the mind.",
    sections: [
      {
        type: 'teaching',
        title: 'The Three Gunas — The Three Forces of the Mind',
        body: `**Triguna** (त्रिगुण) — the three qualities of Nature (Prakriti) that govern the mind and determine psychological tendencies. Unlike the Doshas (which govern the physical body), the Gunas govern mental and spiritual development.

**SATTVA (सत्त्व) — Clarity:**
The quality of purity, balance, light, intelligence, harmony, joy, love. A Sattvic mind is calm, discerning, compassionate, creative, and spiritually receptive. This is the goal state — the psychological equivalent of Sama Agni.

**RAJAS (रजस्) — Activity:**
The quality of movement, passion, desire, stimulation, ambition, agitation. Necessary for action and achievement, but when dominant becomes restlessness, desire, aggression, and inability to find peace.

**TAMAS (तमस्) — Inertia:**
The quality of heaviness, dullness, inertia, darkness. Necessary for sleep and rest, but when dominant becomes laziness, depression, ignorance, and unconsciousness.

**The dynamic:** We need all three — Tamas for sleep, Rajas for action, Sattva for wisdom. The spiritual and therapeutic goal is to increase Sattva while bringing Rajas and Tamas into their proper subordinate roles.`,
      },
      {
        type: 'table',
        title: 'The Three Gunas in Daily Life',
        tableData: {
          headers: ['Domain', 'Sattvic', 'Rajasic', 'Tamasic'],
          rows: [
            ['Food', 'Fresh, organic, cooked with love, easy to digest', 'Spicy, stimulating, fast food, too much caffeine', 'Leftover, processed, meat, alcohol, stale'],
            ['Sleep', '7-8 hours, before 10 PM, refreshing', 'Irregular, too little, oversleeping', 'Excessive, lethargic, oversleeping always'],
            ['Exercise', 'Yoga, walking, moderate, regular', 'Competitive, excessive, ego-driven', 'None, sedentary, avoidance'],
            ['Relationships', 'Loving, respectful, uplifting, honest', 'Passionate, competitive, codependent', 'Isolating, avoiding, toxic'],
            ['Mind state', 'Peaceful, clear, creative, grateful', 'Active, ambitious, restless, anxious', 'Dull, depressed, confused, numb'],
            ['Speech', 'Kind, truthful, measured', 'Stimulating, opinionated, argumentative', 'Negative, complaining, silent or harsh'],
          ],
        },
      },
      {
        type: 'teaching',
        title: '16 Psychological Types — Dosha + Guna',
        body: `The psychological constitution combines Dosha (physical tendency) with Guna (mental tendency). The Charaka Samhita describes 16 mental constitutional types based on the mythological sources of consciousness. In practical terms, the simplified model:

**Vata-Sattvic:** Highly creative, visionary, inspired, spiritual. Quick but scattered.
**Vata-Rajasic:** Anxious, restless, fearful, hyperactive mind.
**Vata-Tamasic:** Deeply depressed anxiety, disconnected from reality, paranoid.

**Pitta-Sattvic:** Wise leader, clear discernment, sharp without cruelty.
**Pitta-Rajasic:** Ambitious, competitive, judgmental, controlling.
**Pitta-Tamasic:** Manipulative, violent, vindictive, egotistical.

**Kapha-Sattvic:** Deeply loving, compassionate, devoted, patient.
**Kapha-Rajasic:** Possessive, attached, greedy, stubborn.
**Kapha-Tamasic:** Deeply depressed, lethargic, unable to function, anhedonic.`,
      },
      {
        type: 'teaching',
        title: 'Sattvavajaya — Psycho-Spiritual Therapy',
        body: `**Sattvavajaya** (सत्त्वावजय) is Charaka's system of psycho-spiritual therapy — "strengthening the Sattva." It is the Ayurvedic equivalent of psychotherapy, combined with spiritual practice.

**Techniques of Sattvavajaya:**

**Prajna (Wisdom application):** Using right knowledge to counter wrong thinking. Example: anxiety about the future is countered with the understanding of impermanence — that no future state lasts. This is the "cognitive" dimension.

**Manasah Prasamana (Mind pacification):** Mantra, meditation, pranayama — directly regulating the nervous system to reduce Rajas and Tamas.

**Sadvritta (Right conduct):** Behavioral prescriptions — community, service, honesty, avoiding harmful relationships and environments.

**Sattvika Ahara (Sattvic diet):** The fastest way to shift the Guna balance is through food. A 30-day Sattvic diet trial creates measurable psychological improvement.

**Daiva Vyapashraya (Divine support):** Prayer, ritual, mantra, pilgrimage — invoking a force greater than the individual ego to support healing.`,
      },
      {
        type: 'teaching',
        title: 'Medhya Rasayanas — The 4 Brain Tonics',
        body: `Four herbs are specifically classified as **Medhya Rasayana** — rejuvenators of the mind (Medha = intelligence, memory, discernment):`,
        items: [
          '**Brahmi (Bacopa monnieri):** The primary Medhya Rasayana. Bacosides in Brahmi have been shown to enhance memory, reduce anxiety, protect neurons, and regenerate synaptic activity. Dose: 1/2 tsp powder in warm milk twice daily, or standardized extract 300mg.',
          '**Shankhpushpi (Convolvulus pluricaulis):** Calming, intelligence-enhancing, sleep-improving. The Sanskrit name means "shell-flower." Reduces cortisol, supports GABA pathways, protects brain from stress-induced damage.',
          '**Guduchi (Tinospora cordifolia):** Immune and brain tonic. Protects neurons from inflammatory damage. Useful for brain fog and post-viral cognitive impairment.',
          '**Ashwagandha (Withania somnifera):** The adaptogen. Reduces cortisol, protects neurons, improves processing speed and memory. Particularly effective for stress-induced cognitive decline.',
        ],
      },
      {
        type: 'teaching',
        title: 'Prajnaparadha — The Root of All Disease',
        body: `Charaka identifies **Prajnaparadha** (प्रज्ञापराध) — "crimes against wisdom" — as the ultimate root cause of all disease. Literally: "violating the voice of higher intelligence."

Prajnaparadha occurs when we:
- Do what we KNOW is wrong (staying up late, eating badly, indulging in anger)
- Fail to do what we KNOW is right (skip meditation, avoid exercise, neglect relationship)
- Act against our own clear inner knowing

The deepest medicine is alignment — bringing action into congruence with wisdom. When this happens, the body begins to heal spontaneously because the primary cause of all imbalance (self-betrayal) has been addressed.

This is the Siddha understanding: most chronic disease is the body's final communication of a pattern the person has been ignoring for years.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'What is "Prajnaparadha" — considered the ultimate root cause of all disease in Ayurveda?',
        quizOptions: [
          'Eating too much sugar',
          'Crimes against wisdom — violating what you know is right',
          'Excess Kapha in the mind',
          'Lack of meditation practice',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "The most powerful medicine I know is not a herb. It is the moment a person decides to stop betraying their own inner wisdom. From that moment, the body begins its spontaneous healing. Every practice in this curriculum supports that alignment. But the alignment itself — that is yours to choose.",
    keyTakeaways: [
      'Three Gunas: Sattva (clarity), Rajas (activity), Tamas (inertia). Goal: increase Sattva.',
      'Mind-body are one system — healing one always heals the other.',
      '16 psychological types: Dosha (physical) × Guna (mental).',
      'Sattvavajaya = Ayurvedic psycho-spiritual therapy: wisdom, mantra, right conduct, Sattvic diet, prayer.',
      'Four Medhya Rasayanas: Brahmi, Shankhpushpi, Guduchi, Ashwagandha.',
      'Prajnaparadha = crimes against wisdom = ultimate root cause of all disease.',
      'Sattvic diet: 30-day trial creates measurable psychological improvement.',
    ],
    dailyPractice: 'Tonight: list 3 things you KNOW are right for your health that you consistently avoid. List 3 things you KNOW are harmful that you continue. These are your Prajnaparadha. Pick ONE from each list to change this week. That single act is more powerful than any herb.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 23 — MANTRA MEDICINE: SOUND AS CELLULAR REPROGRAMMING
  // ═══════════════════════════════════════════════════════════
  23: {
    moduleNumber: 23,
    agastyarOpening: "Before there was a single herb, there was sound. Before the Siddhars mixed their first medicine, they sang. The universe itself began with a sound — and every sound carries within it the creative or destructive potential of that original vibration. Mantra is the most precise vibrational medicine ever discovered — because it works at the level of the causal body, where all physical illness originates.",
    sections: [
      {
        type: 'teaching',
        title: 'The Physics of Mantra',
        body: `**Mantra** (मन्त्र) = Man (mind) + Tra (tool/vehicle/protect). Literally: "instrument of thought" or "that which protects the mind."

Sound is vibration. All matter is vibration. When the correct vibrational pattern (mantra) is introduced into the system — through the voice, through listening, through internal recitation — it entrains the biological system to that frequency.

Modern research supporting this:
- **Vagal tone:** Chanting and humming activate the vagus nerve, shifting the nervous system from sympathetic (fight/flight) to parasympathetic (rest/repair)
- **Nitric oxide:** Bhramari pranayama and chanting in the nasal resonance chamber generates nitric oxide — a vasodilator that improves oxygen delivery throughout the body
- **Heart rate variability (HRV):** Mantra chanting at specific syllable rates (typically 6 per minute) synchronizes breath and heart rate, dramatically improving HRV — the primary marker of cardiovascular health and stress resilience
- **Cymatics:** At specific frequencies, matter self-organizes into geometric patterns. The ancient Siddha understanding of Yantra (sacred geometry) and Mantra (sacred sound) as paired systems reflects this principle.`,
      },
      {
        type: 'teaching',
        title: 'The Beeja Mantras — Seed Sounds of the Body',
        body: `**Beeja** (बीज) means "seed" — the most concentrated, potent form of a mantra. Beeja mantras are single-syllable sounds that carry the complete vibrational signature of a deity, element, or organ system.`,
        items: [
          '**LAM (लं)** — Earth element, Mooladhara (Root) chakra, Prithvi Mandala. Sound frequency: deepest. Body: bones, elimination, immunity foundation, survival.',
          '**VAM (वं)** — Water element, Svadhisthana chakra. Body: reproductive system, kidneys, lower abdomen, creative force, emotional flow.',
          '**RAM (रं)** — Fire element, Manipura chakra. Body: digestive system, solar plexus, metabolism, power, transformation. Ignites Agni.',
          '**YAM (यं)** — Air element, Anahata chakra. Body: heart, lungs, circulation. Opens love and compassion.',
          '**HAM (हं)** — Space/Ether element, Vishuddha (Throat) chakra. Body: thyroid, voice, expression, communication.',
          '**OM / AUM (ॐ)** — The Pranava — the primordial sound. Contains all frequencies. Pervades all Doshas equally. Ajna chakra (third eye). The sound of consciousness itself.',
          '**HRIM (ह्रीं)** — Shakti Beeja — creative power, heart, manifestation.',
          '**KLIM (क्लीं)** — Attraction Beeja — draws what is needed for the soul\'s evolution.',
          '**SHRIM (श्रीं)** — Lakshmi Beeja — prosperity, beauty, nourishment, abundance.',
          '**AIM (ऐं)** — Saraswati Beeja — knowledge, speech, learning, teaching.',
          '**KRIM (क्रीं)** — Kali Beeja — transformation, cutting through illusion, courage.',
          '**DUM (दुं)** — Durga Beeja — protection, strength, overcoming obstacles.',
        ],
      },
      {
        type: 'mantra',
        title: 'Dhanvantari Mantra — The Physician of the Gods',
        mantraText: 'OM NAMO BHAGAVATE\nVASUDEVAYA DHANVANTARAYE\nAMRITA KALASHA HASTAYA\nSARVA AMAYA VINASHANAYA\nTRI LOKA NATHAYA\nSRI MAHA VISHNAVE NAMAHA',
        mantraMeaning: 'Om, I bow to the divine physician Dhanvantari, bearer of the pot of immortal nectar, destroyer of all disease, lord of the three worlds, the great Vishnu. — Recite 108 times daily for healing activation.',
      },
      {
        type: 'mantra',
        title: 'Maha Mrityunjaya Mantra — Conquering Death',
        mantraText: 'OM TRYAMBAKAM YAJAMAHE\nSUGANDHIM PUSHTI VARDHANAM\nURVAARUKAMIVA BANDHANAN\nMRITYOR MUKSHIYA MAAMRITAT',
        mantraMeaning: 'We worship the three-eyed Shiva who is fragrant and nourishes all beings. As a cucumber falls from its stem when ripe, may we be liberated from death into immortality. — Recite daily for healing, protection from disease, and liberation.',
      },
      {
        type: 'teaching',
        title: 'Agastyar\'s Healing Mantra Prescriptions',
        body: 'Specific mantras for specific conditions — the Siddha pharmacopoeia of sound:',
        items: [
          '**For Vata imbalance (anxiety, insomnia, pain):** RAM (fire) + LAM (earth) — grounds and warms. Chant 108x before sleep.',
          '**For Pitta imbalance (inflammation, anger, skin):** YAM (air) — cooling, heart opening. Chant 108x in morning.',
          '**For Kapha imbalance (congestion, depression, weight):** RAM (fire) — ignites Agni, mobilizes. Chant with power, 108x at dawn.',
          '**For digestive healing:** RAM × 108 before meals. Visualize the digestive fire (Agni) strengthening.',
          '**For brain and memory:** AIM (Saraswati) × 108 in morning. Brahmi in warm milk + AIM mantra = classical brain tonic.',
          '**For heart healing and grief:** YAM × 108 with hand on heart center. Combined with Bhramari pranayama.',
          '**For immune strengthening:** Dhanvantari Mantra × 108 daily.',
          '**For reproductive health:** SHRIM × 108 (women) or KLIM × 108 (men) — nourishing and vitalizing respectively.',
          '**For spiritual awakening:** OM × 108 at sunrise, watching the sun. The Gayatri Mantra daily.',
        ],
      },
      {
        type: 'teaching',
        title: 'Charging Water and Food with Mantra',
        body: `The Siddha practice of **Mantra Shakti** — infusing substances with vibrational intelligence:

**Water charging:** Hold a glass of pure water in both hands. Close your eyes. Recite OM 21 times into the water. Visualize golden light entering the water. Drink it. This is used in all Siddha healing ceremonies — the water becomes a vehicle for the mantra's healing frequency.

**Food blessing:** Before eating, place both hands over the food. Recite "AUM" × 3 and silently offer gratitude. This simple practice (equivalent to grace before meals in Western traditions) shifts the consciousness with which you receive the food — which research in psychoneuroimmunology suggests directly affects digestive enzyme activation.

**Oil charging:** Medicated oils are often prepared with mantra recitation throughout the cooking process. This is not superstition — sustained focused intention creates measurable changes in water structure (Masaru Emoto's research) and oil molecular organization.`,
      },
      {
        type: 'practice',
        title: 'Daily Mantra Medicine Protocol',
        ritual: [
          { step: 'DAWN — AUM', instruction: 'Before rising: 3 rounds of AUM in the heart. Feel the vibration in your chest, throat, and skull. This sets the vibrational tone of the day.' },
          { step: 'MORNING — DHANVANTARI', instruction: 'After sunrise: Dhanvantari Mantra × 11 minimum, ideally × 108. Activates the physician of the gods to guide your day\'s healing.' },
          { step: 'BEFORE MEALS — RAM', instruction: 'RAM × 3 before each meal. Ignites Agni. A 3-second practice that changes your digestive chemistry.' },
          { step: 'EVENING — MAHA MRITYUNJAYA', instruction: 'After sunset: Maha Mrityunjaya Mantra × 11-108. Protection, healing activation, longevity.' },
          { step: 'SLEEP — DOSHA BEEJA', instruction: 'As you lie down: YAM (Vata-prone), RAM (Kapha-prone), or LAM (Pitta-prone) × 21. Let the sound be your last waking experience.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which Beeja Mantra is associated with the fire element and Manipura chakra, and is used to ignite Agni (digestive fire)?',
        quizOptions: ['LAM', 'VAM', 'RAM', 'HAM'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "The ancient Siddhas sang their medicines into existence. Every herb they worked with, they sang to. Every patient they treated, they sang over. Sound is the first medicine — and the last medicine. When all else fails, sit in silence and let the Pranava (AUM) do its work. The universe was born from that sound. Every cell in your body was organized by that sound. It knows how to bring you back to health.",
    keyTakeaways: [
      'Mantra = vibrational medicine acting at the causal body level.',
      'Modern support: vagal activation, nitric oxide production, HRV improvement, cymatic principles.',
      '12 primary Beeja Mantras — each corresponding to an element, chakra, and body system.',
      'RAM = fire/Agni. YAM = air/heart. LAM = earth/foundation. OM = all.',
      'Dhanvantari Mantra = daily healing activation. Maha Mrityunjaya = protection and liberation.',
      'Specific mantras for specific conditions: RAM for Kapha, YAM for Pitta, LAM for Vata.',
      'Water and food can be charged with mantra — measurable vibrational effect.',
    ],
    dailyPractice: 'Tonight before sleep: place both hands on your heart. Say RAM × 3 (for digestion), YAM × 3 (for heart), OM × 3 (for whole system). Feel the vibration in your chest. This 90-second practice is the beginning of a lifelong mantra relationship.',
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 24 — JYOTISH-AYURVEDA: PLANETS AS DOSHAS
  // ═══════════════════════════════════════════════════════════
  24: {
    moduleNumber: 24,
    agastyarOpening: "The ancients did not separate astrology and medicine. They were the same science — because the body is a microcosm of the cosmos. The same forces that govern the movement of planets govern the movement of Doshas in your body. Jyotish-Ayurveda is the bridge between the stars and your cells.",
    sections: [
      {
        type: 'teaching',
        title: 'The Foundation: Macrocosm and Microcosm',
        body: `**Yatha Pinde Tatha Brahmande** — "As in the body, so in the cosmos." This Vedic axiom is the foundation of Jyotish-Ayurveda — the integration of astrological and medical knowledge.

The nine Grahas (planetary bodies) of Vedic astrology each carry a specific elemental and constitutional signature that corresponds to the Dosha system. Planetary transits, planetary periods (Mahadashas), and the natal chart (Rashi) all create patterns of Dosha activation and imbalance across a lifetime.

**The fundamental principle:** Your birth chart is your cosmic Prakriti — the astrological blueprint of your constitutional tendencies, health vulnerabilities, and the optimal timing for health interventions.`,
      },
      {
        type: 'table',
        title: 'The 9 Grahas — Planetary Constitutions',
        tableData: {
          headers: ['Graha', 'Dosha', 'Element', 'Body Systems', 'Health Governance'],
          rows: [
            ['Surya (Sun)', 'Pitta', 'Fire', 'Heart, spine, eyes, immune system', 'Vitality, leadership health, cardiac'],
            ['Chandra (Moon)', 'Kapha-Vata', 'Water-Air', 'Mind, fluids, lymph, stomach', 'Emotional health, fertility, digestion'],
            ['Mangala (Mars)', 'Pitta', 'Fire', 'Blood, muscles, surgery, inflammation', 'Injuries, infections, inflammation'],
            ['Budha (Mercury)', 'Vata-Pitta', 'Earth-Air', 'Nervous system, skin, speech', 'Neurological, skin, communication'],
            ['Guru (Jupiter)', 'Kapha', 'Ether-Water', 'Liver, fat, phlegm, wisdom', 'Weight, liver, spiritual health'],
            ['Shukra (Venus)', 'Kapha-Vata', 'Water', 'Reproductive, kidney, beauty, pleasure', 'Reproductive health, kidney, art'],
            ['Shani (Saturn)', 'Vata', 'Air-Earth', 'Bones, joints, nervous system, chronic conditions', 'Degenerative disease, aging, chronic illness'],
            ['Rahu (N. Node)', 'Vata', 'Air', 'Nervous system, foreign infections', 'Unusual/chronic/karmic disease'],
            ['Ketu (S. Node)', 'Pitta', 'Fire', 'Immune, spiritual body', 'Mysterious conditions, past-life health'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'Mahadasha Health Vulnerabilities',
        body: `The **Mahadasha** system divides a lifetime into planetary periods — each planet governing a specific number of years. During its Mahadasha, a planet's health themes become more prominent:`,
        items: [
          '**Sun Mahadasha (6 years):** Cardiac health, spine, eyes, blood pressure. Pitta conditions increase. Best time for Pitta-pacifying lifestyle.',
          '**Moon Mahadasha (10 years):** Emotional health, digestive health, women\'s reproductive cycles, fluid balance. Kapha and Vata alternate. Mental health focus.',
          '**Mars Mahadasha (7 years):** Risk of injuries, surgeries, infections, blood conditions. Pitta very active. Focus on anti-inflammatory lifestyle.',
          '**Rahu Mahadasha (18 years):** Unusual, difficult-to-diagnose conditions. Vata increases dramatically. Strong detoxification and grounding practices needed.',
          '**Jupiter Mahadasha (16 years):** Weight gain, liver, diabetes risk. Kapha increases. Reduce sweet and heavy foods.',
          '**Saturn Mahadasha (19 years):** The great teacher. Chronic conditions, bone/joint, nervous system. Vata dominant. Most challenging health period. Oil massage, routine, and herbs like Ashwagandha are essential.',
          '**Mercury Mahadasha (17 years):** Skin, nervous system, respiratory. Vata-Pitta. Mental anxiety increase.',
          '**Ketu Mahadasha (7 years):** Immune and mysterious conditions. Spiritual health very active. Excellent time for deep Ayurvedic cleansing.',
          '**Venus Mahadasha (20 years):** Reproductive, kidney, pleasure-related conditions. Kapha-Vata. Excellent health overall if balanced.',
        ],
      },
      {
        type: 'teaching',
        title: 'Nakshatras and Their Healing Herbs',
        body: `The 27 **Nakshatras** (lunar mansions) each have governing herbs and dietary recommendations. A few key examples:`,
        items: [
          '**Ashwini (Mars/Ketu):** Governed by the celestial physicians (Ashwini Kumars). Herbs: Ashwagandha, Shatavari — healing and restoration',
          '**Rohini (Moon):** Abundance, fertility. Herbs: Shatavari, white foods, milk, coconut',
          '**Ardra (Rahu):** Transformation through storm. Herbs: Brahmi, calming nervines',
          '**Punarvasu (Jupiter):** Renewal, return to goodness. Herbs: Guduchi, Amla — regeneration',
          '**Pushya (Saturn):** Nourishment. Herbs: Ashwagandha, building Rasayanas',
          '**Magha (Ketu):** Ancestral health. Herbs: Triphala — ancestral cleansing',
          '**Uttara Phalguni (Sun):** Heart health. Herbs: Arjuna — cardiac tonic',
          '**Chitra (Mars):** Courage and creation. Herbs: Trikatu — igniting fire',
          '**Vishakha (Jupiter/Mars):** Intense purpose. Herbs: Turmeric — anti-inflammatory',
        ],
      },
      {
        type: 'practice',
        title: 'Using Your Birth Chart for Ayurvedic Self-Knowledge',
        ritual: [
          { step: 'FIND YOUR BIRTH CHART', instruction: 'Use a free Vedic astrology calculator (JyotishApp, Astro-Seek, or Jagannatha Hora). Enter birth date, time, location. Generate Vedic (sidereal) chart — NOT Western tropical.' },
          { step: 'IDENTIFY YOUR LAGNA (ASCENDANT)', instruction: 'The rising sign determines your fundamental physical constitution. Fire signs (Aries, Leo, Sagittarius) = Pitta. Water signs (Cancer, Scorpio, Pisces) = Kapha. Air signs (Gemini, Libra, Aquarius) = Vata. Earth signs (Taurus, Virgo, Capricorn) = Vata-Kapha.' },
          { step: 'IDENTIFY YOUR CURRENT MAHADASHA', instruction: 'Calculate which planetary period you are in now. Note which Dosha that planet governs. This is your current primary health vulnerability window.' },
          { step: 'IDENTIFY AFFLICTED PLANETS', instruction: 'Planets in poor dignity (debilitated, combust, or aspected by enemies) indicate health vulnerabilities. These body systems need extra attention regardless of current Mahadasha.' },
          { step: 'PLAN INTERVENTION TIMING', instruction: 'Panchakarma and major health interventions are most effective when initiated during auspicious planetary positions. Jupiter and Venus periods and transits support deep healing best.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Saturn (Shani) governs which Dosha and which body systems in Jyotish-Ayurveda?',
        quizOptions: [
          'Pitta — heart and blood',
          'Kapha — liver and fat',
          'Vata — bones, joints, nervous system, chronic conditions',
          'Pitta-Vata — skin and nervous system',
        ],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "You are not merely a body. You are a node in a cosmic network — receiving transmissions from nine planetary intelligence fields simultaneously. Your health is not random. It follows the rhythm of the cosmos. When you understand that rhythm — through your birth chart, through the current Mahadasha, through the Nakshatra transits — you can anticipate vulnerability and prepare. This is Jyotish medicine: preventive medicine written in the stars.",
    keyTakeaways: [
      '"As in the body, so in the cosmos" — the foundational principle of Jyotish-Ayurveda.',
      '9 Grahas each govern specific Doshas and body systems.',
      'Saturn = Vata, bones/joints/chronic conditions. Sun = Pitta, heart/spine. Moon = Kapha-Vata, mind/fluids.',
      'Mahadasha periods predict which health themes will be most active across years.',
      'Saturn Mahadasha (19 years) = most challenging health period — Vata dominant.',
      'Natal Lagna (Ascendant) reveals the fundamental physical constitution.',
      'Optimal timing for Panchakarma: during Jupiter and Venus transits/periods.',
    ],
    dailyPractice: 'Find your Vedic birth chart today using a free online calculator. Identify your Lagna (Ascendant). Identify your current Mahadasha. Cross-reference with this module\'s Dosha-Graha table. You now have a 10,000-year-old personalized health risk profile.',
  },
};
