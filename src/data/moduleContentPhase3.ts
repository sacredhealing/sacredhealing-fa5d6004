// src/data/moduleContentPhase3.ts
// ⟡ Phase 3 — Vaidya Tantra: The Physician's Art (Modules 25–36) ⟡
// Siddha Quantum tier

import { ModuleContent } from './moduleContent';

export const MODULE_CONTENT_PHASE3: Record<number, ModuleContent> = {

  25: {
    moduleNumber: 25,
    agastyarOpening: "The examination of a patient is a sacred act. You are not collecting data — you are listening to a living intelligence communicate its distress. The eight-fold examination is how we hear that communication with precision. Nothing is missed. Everything is considered.",
    sections: [
      {
        type: 'teaching',
        title: 'Ashtavidha Pariksha — The 8-Fold Clinical Examination',
        body: `The complete Siddha-Ayurvedic clinical assessment uses eight examination methods (Ashtavidha Pariksha). Together they provide a 360° view of the patient's constitutional state, current imbalance, and organ health — without a single laboratory test.

This is not to replace modern diagnostics, but to provide a layer of personalized insight that blood panels cannot offer: the specific Dosha state, Agni quality, Dhatu health, Ama level, Srotas (channel) status, and psychological constitution.`,
      },
      {
        type: 'table',
        title: 'The 8 Examinations — Complete Reference',
        tableData: {
          headers: ['Examination', 'What Is Examined', 'Key Indicators', 'Dosha Revealed'],
          rows: [
            ['1. Nadi (Pulse)', 'Radial artery, 3 finger positions', 'Speed, rhythm, force, movement pattern', 'All three Doshas simultaneously'],
            ['2. Mutra (Urine)', 'Color, clarity, foam, oil drop test', 'Color chart, Siddha oil-drop pattern', 'Kapha (pale/cloudy), Pitta (yellow/burning), Vata (dark/scanty)'],
            ['3. Mala (Stool)', 'Consistency, color, frequency, odor', 'Hard/loose/formed, coating presence', 'Vata (dry/hard), Pitta (loose/yellow), Kapha (heavy/mucus)'],
            ['4. Jihva (Tongue)', 'Coating, color, moisture, texture', 'Full tongue map (Module 14)', 'White = Kapha, Yellow = Pitta, Gray = Vata'],
            ['5. Shabda (Sound)', 'Voice quality, breath sounds, bowel sounds', 'Hoarse = Vata, Sharp/clear = Pitta, Deep/slow = Kapha', 'Vata (dry cracking), Pitta (sharp/inflamed), Kapha (congested)'],
            ['6. Sparsha (Touch)', 'Skin temperature, texture, turgor, moisture', 'Cold/dry/rough = Vata, Hot/oily = Pitta, Cool/oily/smooth = Kapha', 'Immediate Dosha identification'],
            ['7. Drika (Eyes)', 'Sclera color, conjunctiva, pupil, gaze', 'Yellow = liver, Pale = anemia, Red = Pitta', 'Eye health + systemic Dosha'],
            ['8. Aakruti (Form)', 'Overall appearance, posture, gait, body type', 'Thin/light/irregular = Vata, Medium/strong = Pitta, Heavy/broad = Kapha', 'Prakriti confirmation'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'Shabda Pariksha — Reading the Voice',
        body: `Voice diagnosis is one of the most underutilized diagnostic tools. The voice carries the direct signature of the nervous system, respiratory system, and emotional state:

**Vata voice:** Dry, rough, cracking, variable pitch, speaks quickly, often trails off or forgets what they were saying. Voice may be thin or weak. Classical sign of Vata excess.

**Pitta voice:** Clear, sharp, penetrating, confident, opinionated. May be slightly impatient. Good projection. Precise language.

**Kapha voice:** Deep, slow, melodious, steady, may be monotone. Speaks deliberately. Strong voice but unhurried.

**Therapeutic application:** A hoarse, cracking voice with dry cough = Vata in Udana Vayu and respiratory tract → warm oil Nasya + licorice tea + Trikatu + Tulsi.`,
      },
      {
        type: 'teaching',
        title: 'The Clinical Intake — Creating the Full Picture',
        body: `A complete clinical intake combines the 8-fold examination with a structured case-taking interview. Key questions:`,
        items: [
          '**Chief complaint:** What brings you today? How long? What makes it better/worse?',
          '**Digestive fire:** Regular hunger? Gas/bloating? Evacuation pattern? (Agni assessment)',
          '**Sleep:** Duration, quality, dreams, position preference (Dosha indicator)',
          '**Energy:** Time of day energy peaks and crashes (maps to Dosha clock)',
          '**Emotions:** Predominant emotional pattern (anxiety = Vata, anger = Pitta, depression = Kapha)',
          '**Season:** Symptoms worse in which season? (Confirms dominant Dosha)',
          '**Appetite:** Always hungry, never hungry, or variable? (Agni type)',
          '**Thirst:** Excessive, absent, normal? (Dosha + Agni signal)',
          '**Elimination:** Stool character, frequency, consistency (see Module 7)',
          '**Women: Menstrual cycle:** Regular? Painful? Clotted? Color? (complete picture of reproductive Dosha)',
        ],
      },
      {
        type: 'practice',
        title: 'Clinical Self-Assessment Protocol — Complete in 20 Minutes',
        ritual: [
          { step: 'PREPARATION', instruction: 'Morning, before eating. Have a notebook. Take 3 deep breaths and set intention: "I am listening to my body with complete attention and non-judgment."' },
          { step: 'ASHTAVIDHA', instruction: 'Work through all 8 examinations systematically. Pulse (3 min), tongue (1 min), eyes (1 min), urine note from morning, stool note from morning, touch your skin (temperature, texture), listen to your voice (say "AUM" — notice quality), look at your overall form.' },
          { step: 'INTERVIEW YOURSELF', instruction: 'Answer the 10 key intake questions above. Write single-word or short-phrase answers.' },
          { step: 'PATTERN RECOGNITION', instruction: 'Review your answers. Count: Vata signs vs. Pitta signs vs. Kapha signs. The dominant count is your current Vikriti.' },
          { step: 'ACTION STEP', instruction: 'Based on dominant Vikriti, select ONE corrective action for today — a food choice, a herb, a practice. This converts assessment into medicine.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'A patient presents with: Vata pulse (snake-like), thin white tongue coating, dry skin, low and cracking voice, anxious gaze, thin body frame. Which Dosha is dominant?',
        quizOptions: ['Pitta — needs cooling', 'Kapha — needs stimulation', 'Vata — needs warming and grounding', 'Tridoshic — balanced'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "The 8-fold examination is not a checklist — it is a meditation. Each examination is a door into the patient's inner world. The Vaidya who can perform this examination with full presence — without rushing, without judgment, with genuine curiosity — has already begun the healing before a single herb is prescribed.",
    keyTakeaways: [
      'Ashtavidha Pariksha = 8 clinical examinations: Pulse, Urine, Stool, Tongue, Voice, Touch, Eyes, Form.',
      'Together the 8 examinations reveal: Dosha state, Agni quality, Dhatu health, Ama level, Prakriti confirmation.',
      'Voice = underutilized diagnostic tool. Hoarse/cracking = Vata. Sharp/clear = Pitta. Deep/slow = Kapha.',
      'Clinical intake: 10 key questions that complete the diagnostic picture.',
      'Pattern recognition: count Dosha signs to identify dominant Vikriti.',
      'Assessment → single corrective action converts diagnosis into medicine.',
    ],
    dailyPractice: 'Perform the complete 20-minute self-assessment once this week. Write down your findings. What is your current Vikriti? What is the ONE most important corrective action? Do that one action for 7 days.',
  },

  26: {
    moduleNumber: 26,
    agastyarOpening: "Now we enter the clinic. Everything you have learned becomes useful here. A person walks in with a complaint. You have the 8-fold examination. You have the Dosha framework. You have the 6-stage disease model. You have the herbs and the preparations. Now: how do you put it all together? I will show you.",
    sections: [
      {
        type: 'teaching',
        title: 'The 4 Pillars of Treatment (Chikitsa Chatushpada)',
        body: `Before the specifics of any condition, the ancient texts identify four indispensable components of successful treatment:

**1. VAIDYA (Physician):** Must possess: extensive theoretical knowledge (Shruta), practical experience (Drushta), dexterity (Daksha), and purity of character (Shucha). A Vaidya without genuine compassion cannot heal.

**2. DRAVYA (Medicine):** The remedy must have: many therapeutic properties (Bahukalpa), be effective for the condition, be available, and be pure.

**3. PARICHARKA (Attendant/Nurse):** The support person must be: knowledgeable, devoted to the patient, dexterous, and clean. Modern parallel: the quality of the care environment and support system.

**4. ROGI (Patient):** The patient must be: able to describe symptoms clearly, possess good memory, courageous (willing to follow treatment), and able to afford the treatment.

When all four pillars are present, treatment ALWAYS succeeds. When one is deficient, the outcome is compromised.`,
      },
      {
        type: 'teaching',
        title: 'Core Treatment Principles',
        items: [
          '**Nidana Parivarjana (Remove the cause):** The first and most important step. No treatment works if the cause continues. Eating the food that caused the allergy while taking anti-allergy herbs is Prajnaparadha.',
          '**Samanya Vishesha (Like increases like, opposite decreases):** A hot condition needs cooling treatment. A dry condition needs oiling. A heavy condition needs lightening. Simple but consistently overlooked.',
          '**Shodhana vs. Shamana:** Shodhana (purification — Panchakarma) removes the root. Shamana (palliation — herbs and diet) manages symptoms. Choose based on patient strength and disease stage.',
          '**Desha, Kala, Bala (Place, Time, Strength):** Treatment must be individualized for where the patient lives (climate), when they are being treated (season), and the strength of both patient and disease.',
        ],
      },
      {
        type: 'table',
        title: '40 Condition Protocols — Quick Reference',
        tableData: {
          headers: ['Condition', 'Dosha/Stage', 'Primary Herbs', 'Key Lifestyle', 'Avoid'],
          rows: [
            ['IBS/Irritable Bowel', 'Vata Stage 1-3', 'Triphala, Hingvastak churna, Aloe', 'Warm cooked food, routine meals, Basti', 'Raw food, cold drinks, stress'],
            ['Acid Reflux/GERD', 'Pitta Stage 2-4', 'Shatavari, Yashtimadhu, Amalaki, cool fennel', 'Small meals, no lying after eating, Virechana', 'Spicy, sour, alcohol, tomato, coffee'],
            ['Constipation', 'Vata Stage 1-2', 'Triphala, castor oil, Abhayarishta', 'Warm water AM, daily oil massage, Basti', 'Dry food, irregular meals, stress'],
            ['Hemorrhoids', 'Pitta-Vata Stage 3-4', 'Triphala, Arshkuthar Ras, Haritaki', 'High fiber diet, Sitz bath, Virechana', 'Spicy food, sitting too long, straining'],
            ['Asthma (Kapha)', 'Kapha Stage 3-4', 'Trikatu, Sitopaladi, Pippali, Vasa', 'Vamana therapy, dry diet, vigorous AM exercise', 'Dairy, cold foods, early morning cold air'],
            ['Sinusitis', 'Kapha-Pitta Stage 2-3', 'Trikatu, Neti, Nasya with Anu Taila', 'Nasal irrigation daily, steam', 'Dairy, cold drinks, A/C'],
            ['Psoriasis', 'Pitta-Kapha Stage 4-5', 'Manjistha, Neem, Guduchi, Nimba Arishtam', 'Virechana, Raktamokshana (leech), cooling diet', 'Red meat, spicy, alcohol, stress'],
            ['Eczema', 'Vata-Pitta Stage 3-4', 'Neem, Manjistha, Triphala, topical Nalpamaradi', 'Cooling and moistening diet, Panchakarma', 'Triggers (allergenic foods), stress'],
            ['Migraine', 'Pitta Stage 3-4', 'Brahmi, Shankhpushpi, Shatavari, Kama Dudha', 'Shirodhara, Nasya, sleep regulation', 'Sun exposure, skipped meals, screen overuse'],
            ['Insomnia', 'Vata Stage 1-3', 'Brahmi, Ashwagandha, Jatamansi, Tagara', 'No screens 1hr before bed, Abhyanga, Pada Abhyanga', 'Caffeine after noon, irregular schedule'],
            ['Anxiety', 'Vata Stage 2-3', 'Brahmi, Shankhpushpi, Ashwagandha, Bala', 'Grounding routine, Nasya, Abhyanga, nature', 'Travel overload, raw food, caffeine, screens'],
            ['Depression', 'Kapha-Vata Stage 3-4', 'Brahmi, Guggulu, Saffron, Ashwagandha', 'Vigorous AM exercise, sunlight, community', 'Isolation, oversleeping, heavy food'],
            ['PCOS', 'Kapha-Pitta Stage 4-5', 'Shatavari, Guduchi, Ashoka, Lodhra, Kanchanara', 'Weight reduction, Virechana, anti-inflammatory diet', 'Sugar, dairy, refined carbs'],
            ['Menstrual pain', 'Vata-Pitta Stage 2-3', 'Shatavari, Dashamoola, Ashokarishta', 'Warm castor oil abdominal pack, Basti, rest', 'Cold foods during period, overexertion'],
            ['Hypothyroid', 'Kapha Stage 3-5', 'Kanchanara Guggulu, Brahmi, Punarnava', 'Vigorous exercise, morning sunlight, Nasya', 'Raw cruciferous, soy, cold exposure'],
            ['Type 2 Diabetes', 'Kapha-Pitta Stage 4-5', 'Karela, Vijaysar, Gudmar, Fenugreek, Neem', 'Exercise, Virechana, grain reduction', 'Sugar, refined carbs, fruit juice, inactivity'],
            ['Hypertension', 'Pitta-Vata Stage 3-5', 'Arjuna, Brahmi, Sarpagandha, Ashwagandha', 'Shirodhara, Virechana, stress reduction', 'Salt, spicy food, caffeine, anger'],
            ['High cholesterol', 'Kapha Stage 3-4', 'Guggulu, Triphala, Garlic, Pippali', 'Exercise, reduction of fat and sweet', 'Fried food, red meat, sedentary lifestyle'],
            ['Arthritis (Vata)', 'Vata Stage 4-5', 'Dashamoola, Guggulu, Shallaki, Ashwagandha', 'Basti, Abhyanga with Mahanarayan Taila', 'Cold exposure, raw food, travel fatigue'],
            ['Arthritis (Pitta)', 'Pitta-Ama Stage 4-5', 'Guduchi, Neem, Triphala, Kaishore Guggulu', 'Anti-inflammatory diet, Virechana', 'Spicy food, alcohol, heat exposure'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'The Sambhrama System — Hierarchy of Treatment',
        body: `When a patient arrives, the sequence of treatment priorities:

1. **Remove the immediate cause** (Nidana Parivarjana) — the cause must stop
2. **Assess the strength of the patient** (Bala) — can they handle purification?
3. **Palliate if necessary** (Shamana) — manage acute symptoms with herbs
4. **Purify when ready** (Shodhana) — address the root with Panchakarma
5. **Rebuild** (Rasayana) — nourish depleted tissues after purification
6. **Maintain** (Dinacharya/Ritucharya) — prevent recurrence through lifestyle

This sequence applies to every condition — acute or chronic. Skip step 6 and the condition returns. Skip step 4 and you palliate forever without cure.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'For PCOS, which herbs are primarily indicated, and which dietary factors should be avoided?',
        quizOptions: [
          'Ashwagandha and Brahmi; avoid stress and caffeine',
          'Shatavari, Guduchi, Ashoka, Kanchanara; avoid sugar, dairy, refined carbs',
          'Triphala and Neem; avoid spicy food and alcohol',
          'Haritaki and Arjuna; avoid salt and red meat',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Treatment without removing the cause is watering a flower while leaving its roots in salt. Remove the cause first — always. Then the herbs will work, the Panchakarma will hold, and the Rasayana will build. This sequence is as important as any individual remedy.",
    keyTakeaways: [
      '4 pillars: Vaidya (physician), Dravya (medicine), Paricharka (support), Rogi (patient). All must be present.',
      'First principle: Nidana Parivarjana — remove the cause. Without this, nothing else works.',
      'Shodhana (purification) removes the root. Shamana (palliation) manages symptoms.',
      'Treatment sequence: Remove cause → Palliate → Purify → Rebuild → Maintain.',
      'All 40 conditions in the reference table follow the same Dosha logic — same system, different location.',
    ],
    dailyPractice: 'Choose ONE condition from your life (digestive, skin, sleep, mood). Find it in the reference table. Apply the lifestyle "avoid" column immediately. That removal — before any herb — is the most powerful first step.',
  },

  27: {
    moduleNumber: 27,
    agastyarOpening: "The Siddha system classified 4,448 diseases while Ayurveda classified 1,008. This is not competition — it is depth. Where Ayurveda sees one disease, Siddha sees four sub-types. Where Ayurveda sees Vata arthritis, Siddha distinguishes which of the 10 Vayus is involved, which Varma point is locked, which Nadi pattern reveals the karmic underpinning. This is precision medicine — 5,000 years ago.",
    sections: [
      {
        type: 'teaching',
        title: 'The 96 Tattvams — Siddha\'s Reality Architecture',
        body: `The Siddha philosophical framework describes reality as composed of **96 Tattvams** (principles of existence) — compared to Sankhya philosophy's 24 principles and Ayurveda's 25.

These 96 Tattvams include the five elements, the 10 sense organs, 10 types of Pranas, 10 Nadis, various sheaths of the body, the five koshas, the chakras, and increasingly subtle levels of consciousness — all the way to the Absolute (Shiva/Shakti).

**The medical significance:** By classifying 96 principles of existence rather than 25, Siddha medicine has 4x the conceptual resolution for disease understanding. Each Tattvam can be a site of imbalance — each has specific signs, and each has specific treatments.

This is why Siddha classified 4,448 diseases — because their resolution of the human body-mind-consciousness system was simply more fine-grained.`,
      },
      {
        type: 'teaching',
        title: 'The Siddha Disease Classification System',
        body: `Siddha medicine organizes its 4,448 diseases using several frameworks:`,
        items: [
          '**By Mukkuttram (Three Humors):** All diseases trace to Vatham, Pitham, or Kabam excess or deficiency — with sub-classification by which of the 10/5/5 subtypes is involved.',
          '**By the 5 Panchapootam (Elements):** Which elemental imbalance underlies the condition.',
          '**By Srotas (Channel systems):** Which of the 13 channel systems is the primary site.',
          '**By Pranavayus:** Which of the 10 Pranic sub-forces is dysregulated.',
          '**By Noi Kanidal (Diagnostic criteria):** Each disease has specific diagnostic criteria — pulse pattern, urine pattern, tongue sign, symptom constellation — creating a precise fingerprint.',
          '**By Karma (Past-action patterns):** Certain chronic conditions are classified as having karmic origins — requiring both physical treatment AND spiritual resolution.',
        ],
      },
      {
        type: 'table',
        title: 'Sample Siddha Disease Classification — Vatham Diseases',
        tableData: {
          headers: ['Vatham Type', 'Affected Vatham', 'Symptoms', 'Classical Siddha Treatment'],
          rows: [
            ['Vali Noigal (Wind diseases)', 'Multiple Vathams', 'Joint pain, stiffness, cracking', 'Thilam (sesame) Thokkanam + Vatham herbs'],
            ['Prana Vatham (Respiratory)', 'Pranan Vatham', 'Breathing difficulty, hiccups, heart flutter', 'Nasya + Trikatu + Agastyar Rasayana'],
            ['Abana Vatham disorders', 'Abanan Vatham', 'Constipation, urinary issues, reproductive', 'Castor oil + Basti + Asafoetida'],
            ['Udana Vatham (Voice/thyroid)', 'Utanan Vatham', 'Hoarse voice, thyroid, memory', 'Yashtimadhu + Brahmi + Nasya'],
            ['Samana Vatham (Digestive)', 'Samanan Vatham', 'Malabsorption, uneven digestion', 'Hingvastak + Trikatu + regular meals'],
          ],
        },
      },
      {
        type: 'secret',
        title: 'The Siddha Diagnosis of Karmic Disease',
        body: `The Siddha tradition recognizes a category of disease that Western medicine and even mainstream Ayurveda does not address: **karma janya vyadhi** — disease arising from past-action patterns across multiple lifetimes.

Recognizing karmic disease pattern:
- Condition does not respond to correct treatment
- Condition reappears despite complete apparent healing
- Condition carries a symbolic or thematic quality (a singer who loses their voice, a healer who develops a skin condition)
- Pulse reveals a pattern in the deep Majja (bone marrow) or Shukra (reproductive) Nadi that feels "ancient"
- The condition began near a significant karmic transition (marriage, death of a close one, major life change)

**Siddha treatment for karmic disease:**
1. Correct physical treatment simultaneously with
2. Agastyar or Siddhar mantra invocations specific to the karmic pattern
3. Ritual purification (fire ceremony — Havan)
4. Service (Seva) to dissolve karmic debt
5. Jyotish consultation for timing and planetary remediation

This is not superstition. The Siddhas understood that consciousness shapes matter. An unresolved consciousness pattern will continue generating physical symptoms until the pattern itself is dissolved.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'What is the Siddha term for diseases arising from past-action patterns that do not respond to conventional treatment?',
        quizOptions: ['Sahaja vyadhi', 'Karma janya vyadhi', 'Agantu vyadhi', 'Kosta roga'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "4,448 diseases. 96 principles of existence. The Siddha system is not larger than Ayurveda because it is more complicated — it is larger because it is more complete. The human being is more complex than any existing system can fully map. Approach each patient with humility — and with the readiness to see what no classification system has yet described.",
    keyTakeaways: [
      'Siddha classifies 4,448 diseases vs. Ayurveda\'s 1,008 — 4x the diagnostic resolution.',
      '96 Tattvams (principles of existence) vs. Sankhya\'s 24 — more complete reality map.',
      'Disease classified by: Mukkuttram subtype, Element, Channel system, Pranavayu, and Karma.',
      'Karmic disease: does not respond to treatment, reappears, carries symbolic quality.',
      'Karmic disease requires: physical treatment + mantra + ritual + service + Jyotish.',
    ],
    dailyPractice: 'Reflect on any chronic condition in your body that does not fully resolve. Ask: does it carry a symbolic quality? Does it reappear after healing? What recurring life theme might it be expressing? Write 1 page of reflection. This is the beginning of karmic disease self-diagnosis.',
  },

  28: {
    moduleNumber: 28,
    agastyarOpening: "A compound formula is like a symphony — each herb playing its role, the combination producing effects that no single instrument could achieve. The classical Siddha-Ayurvedic formulations are the result of thousands of years of clinical refinement. They are not guesses. They are the distilled intelligence of ten thousand observations.",
    sections: [
      {
        type: 'teaching',
        title: 'The Art of Compound Formulation (Yoga)',
        body: `**Yoga** (योग) in pharmacological context means "combination" — the art of creating compound formulas. A well-crafted Yoga achieves:

1. **Synergy:** Components amplify each other's effects beyond what each does alone
2. **Targeting:** The formula reaches specific tissues (Dhatus) or channels (Srotas)
3. **Balance:** Active components are balanced by harmonizing herbs to prevent side effects
4. **Bioavailability:** Anupana (carrier/adjuvant) delivers the formula optimally

**The 4 roles within a compound formula:**
- **Pradhana Dravya (King herb):** Primary therapeutic agent
- **Sahayaka (Adjuvant):** Supports and enhances the King
- **Anupana (Carrier):** Delivers the formula to the correct site
- **Prakshepa (Harmonizer):** Balances the overall formula, reduces side effects`,
      },
      {
        type: 'teaching',
        title: '25 Essential Classical Formulations',
        body: 'These are the core formulas of a Siddha-Ayurvedic practice:',
        items: [
          '**TRIKATU:** Ginger + Black Pepper + Long Pepper. The supreme Agni kindler. Reduces Ama, burns Kapha. Take before meals with honey.',
          '**TRIPHALA:** Amalaki + Haritaki + Bibhitaki. The most important compound. Daily cleanser, anti-aging, eye health. 1/2 tsp in warm water before sleep.',
          '**CHYAWANPRASH:** 50+ herbs with Amla base. The universal Rasayana. 1 tsp daily with warm milk. For ALL constitutions.',
          '**DASHAMOOLA:** 10 roots formula. Vata-pacifying, anti-inflammatory, post-partum tonic, respiratory. Decoction or classical DashamoolarisHta.',
          '**ASHWAGANDHA CHURNA + MILK:** Adaptogen formula for stress, sleep, testosterone, thyroid. 1/2 tsp Ashwagandha + 1/4 tsp Shatavari in warm milk with ghee.',
          '**BRAHMI GHRITA:** Brahmi herb processed in ghee. Brain, memory, neurological. 1 tsp in warm milk before sleep.',
          '**KAISHORE GUGGULU:** Purifying formula for Pitta, gout, skin, joint inflammation. Classical anti-inflammatory compound.',
          '**YOGARAJ GUGGULU:** Vata-type joint and neurological conditions. Ashwagandha + Guggulu base.',
          '**ARJUNA KSHEERAPAKA (ARJUNA MILK DECOCTION):** Arjuna bark boiled in milk. Cardiac tonic. For heart health, hypertension, sports recovery.',
          '**SARASWATARISHTA:** Fermented preparation for brain, memory, anxiety, speech. Contains Brahmi, Shatavari, Ashwagandha in a natural fermentation base.',
          '**ASHOKARISHTA:** Women\'s tonic. Ashoka bark based fermented preparation. Uterine health, menstrual regulation, PCOS, anemia.',
          '**DRAKSHARISHTA:** Grape-based tonic for strength, liver, appetite, convalescence.',
          '**HINGVASTAK CHURNA:** Asafoetida (Hing) + 7 herbs. The premier Vata digestive formula. Gas, bloating, lower abdominal pain.',
          '**AVIPATTIKAR CHURNA:** Pitta digestive formula. Acid, reflux, constipation with heat. Contains Trivrit (purgative) + cooling herbs.',
          '**SITOPALADI CHURNA:** Respiratory Kapha formula. Cough, congestion, bronchitis, fever. Candy sugar + Pippali + cardamom + cinnamon + bamboo manna.',
          '**MAHANARAYAN TAILA:** The premier external oil. Vata joint conditions, muscle pain, paralysis, anti-aging massage oil.',
          '**KSHIRABALA TAILA:** Milk-processed Bala (Sida cordifolia) in sesame oil. Neurological conditions, Vata, post-partum.',
          '**NALPAMARADI KERAM:** Kerala classical oil for skin diseases, hyperpigmentation, brightening. Contains 4 types of fig bark.',
          '**KUMKUMADI TAILAM:** The luxury skin oil. Saffron + 26 herbs in sesame oil. Brightening, anti-aging, Pitta skin.',
          '**BRAHMI AMLA HAIR OIL:** Brahmi + Amla + Bhringaraj in coconut oil. Hair loss, premature greying, scalp health.',
          '**AGASTYAR RASAYANA (My formula):** Haritaki processed with honey, ghee, sesame, ginger, long pepper. Longevity, digestion, intelligence, respiratory.',
          '**CHANDRAPRABHA VATI:** Compound tablet for urinary health, kidney, reproductive, diabetes support.',
          '**AROGYAVARDHINI VATI:** Liver, skin, metabolic health. Liver detox compound.',
          '**PUNARNAVA MANDURA:** Iron + Punarnava. Anemia, kidney, liver, fluid retention.',
          '**THANGA PARPAM:** Gold ash (Siddha). Cardiac tonic, anti-aging, brain. Microdose with honey and ghee.',
        ],
      },
      {
        type: 'practice',
        title: 'Basic Home Formulation — The Agastyar Daily Formula',
        ritual: [
          { step: 'INGREDIENTS', instruction: '1/2 tsp Ashwagandha, 1/4 tsp Brahmi, 1/4 tsp Shatavari, 1/4 tsp Amla powder, pinch of Trikatu (equal parts ginger+pepper+long pepper), 1 tsp ghee, 1 cup warm whole milk, 1 tsp raw honey (added after cooling).' },
          { step: 'PREPARATION', instruction: 'Warm milk. Add powders and ghee. Stir well. Cool to drinkable temperature. Add honey only when it won\'t burn your finger.' },
          { step: 'TIMING', instruction: 'Take 30 minutes before sleep on an empty stomach (at least 2 hrs after dinner).' },
          { step: 'DURATION', instruction: '90 days minimum for tissue-level change. This formula nourishes all 7 Dhatus, calms Vata, builds Ojas, and supports sleep quality.' },
          { step: 'STORAGE', instruction: 'Individual powders can be pre-mixed in bulk (Ashwagandha:Brahmi:Shatavari:Amla = 2:1:1:1). Store in airtight glass. Measure nightly dose fresh.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which of these is the classical compound formula for Kapha-type respiratory conditions including cough, congestion, and bronchitis?',
        quizOptions: ['Hingvastak Churna', 'Sitopaladi Churna', 'Triphala', 'Dashamoola'],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "The 25 formulas in this module are a complete pharmacy. A practitioner who knows these formulas well — their indications, contraindications, and preparation — can address 90% of the conditions they will encounter. The remaining 10% require custom formulation and Panchakarma — which is what Phase 4 prepares you for.",
    keyTakeaways: [
      'Compound formulas (Yoga) achieve synergy, targeting, balance, and bioavailability.',
      'Four roles: King herb, Adjuvant, Carrier (Anupana), Harmonizer.',
      'Trikatu = Agni kindler. Triphala = universal cleanser. Chyawanprash = universal Rasayana.',
      'Sitopaladi = Kapha respiratory. Hingvastak = Vata digestive. Avipattikar = Pitta digestive.',
      'The Agastyar Daily Formula (Ashwagandha+Brahmi+Shatavari+Amla in warm milk) = best daily home compound.',
    ],
    dailyPractice: 'Begin the Agastyar Daily Formula tonight. Or if already taking herbs, identify one compound from this module that matches your current chief complaint and add it to your practice.',
  },

  29: {
    moduleNumber: 29,
    agastyarOpening: "Clinical Panchakarma is not a spa treatment. It is medical intervention. When I prescribe Panchakarma, I am not asking the body to relax — I am asking it to release what it has been holding for years, decades, sometimes lifetimes. The therapist who performs these procedures is a medical practitioner. The knowledge required is deep, the responsibility profound.",
    sections: [
      {
        type: 'teaching',
        title: 'Full Clinical Panchakarma — Practitioner Standards',
        body: `Full clinical Panchakarma requires:
- Complete case assessment using Ashtavidha Pariksha
- Determination of patient Bala (strength) — strength must be adequate for purification
- Selection of the correct Karma based on Dosha dominance and disease stage
- Proper Poorvakarma preparation
- Execution of the main procedure with monitoring
- Paschatakarma (post-procedure) support
- Dietary and lifestyle prescription throughout

**Panchakarma is CONTRAINDICATED in:**
- Pregnancy (most procedures — some Basti protocols are modified for pregnancy use)
- Extreme weakness or emaciation
- Active infection with fever
- Immediately post-surgery
- Children under 7 years
- Very elderly (without modification)
- Certain cardiac conditions (Vamana is particularly contraindicated)`,
      },
      {
        type: 'teaching',
        title: 'Complete Shirodhara Protocol',
        body: `**Shirodhara** — a continuous stream of warm oil poured on the forehead — is the most iconic Ayurvedic therapy and one of the most profoundly effective neurological treatments available:

**Preparation:**
- Duration: 45-60 minutes including Abhyanga
- Oil: Brahmi Taila (for mental conditions), Kshirabala (for Vata), Chandanadi Taila (for Pitta), plain sesame (for general)
- Oil temperature: Body temperature — never hot
- Stream: From Shirodhara pot (or specialist equipment) — continuous, gentle, steady

**Procedure:**
1. Full body Abhyanga (20 min)
2. Patient lies supine, eyes covered
3. Oil warmed to body temperature
4. Stream begins at Ajna (third eye) and oscillates gently across the forehead
5. Duration: 30-45 minutes
6. Post-treatment: Wrapped warmly, rest for 30 min minimum

**Effects:** Profound nervous system reset, cortisol reduction, treatment for: insomnia, anxiety, PTSD, migraine, neurological conditions, hypertension, hair loss.

**The science:** Shirodhara appears to stimulate the hypothalamus through the neurological network of the forehead skin, activating the parasympathetic branch and resetting the HPA axis (stress response system).`,
      },
      {
        type: 'teaching',
        title: 'The 30-Day Basti Krama (Enema Course)',
        body: `The classical **Karma Basti** is a 30-day graduated enema course — the most powerful Vata-balancing and anti-aging protocol in Ayurveda:

**The 30-day sequence:**
Days 1, 3, 5, 7, 9, 11, 13, 15: Anuvasana Basti (oil enema — Ashwagandha or Dashamoola in sesame oil)
Days 2, 4, 6, 8, 10, 12, 14: Niruha Basti (herbal decoction enema — Dashamoola decoction)
Days 16-30: Rest and Rasayana phase

**Standard Basti contents:**
*Niruha Basti (decoction):* 
- 200ml Dashamoola decoction
- 50ml sesame oil
- 50ml honey (unheated)
- 10g rock salt
- Herbal paste specific to condition

*Anuvasana Basti (oil):*
- 60-80ml warm sesame oil or medicated oil
- Administered with patient on left side
- Retained 30-60 minutes minimum

**Results after 30-day Basti krama:**
Joint lubrication improves dramatically. Bowel regularity normalizes. Vata throughout the body stabilizes. Skin improves. Sleep deepens. The effect is equivalent to a full cellular Vata reset.`,
      },
      {
        type: 'table',
        title: 'Classical Ayurvedic Therapies — Indications Quick Reference',
        tableData: {
          headers: ['Therapy', 'Primary Dosha', 'Key Indications', 'Duration', 'Frequency'],
          rows: [
            ['Abhyanga', 'Vata', 'General health, aging, anxiety, dryness', '45-60 min', 'Daily or 3x/week'],
            ['Shirodhara', 'Vata-Pitta', 'Insomnia, anxiety, migraine, hypertension, PTSD', '30-45 min', '7-21 consecutive days'],
            ['Njavara Kizhi', 'Vata', 'Joint degeneration, neurological, paralysis', '60 min', '7-14 days course'],
            ['Kati Basti', 'Vata', 'Lower back pain, disc issues, sciatica', '30-45 min', '7-14 days'],
            ['Greeva Basti', 'Vata', 'Cervical spondylosis, neck pain, headaches', '30-45 min', '7-14 days'],
            ['Netra Tarpana', 'Pitta-Vata', 'Eye disorders, screen fatigue, glaucoma support', '20-30 min', '7 days course'],
            ['Karnapurana', 'Vata', 'Tinnitus, hearing, jaw pain, neck issues', '15-20 min', '7 days course'],
            ['Udwartana', 'Kapha', 'Weight reduction, lymphedema, skin health', '45 min', '14-21 days'],
          ],
        },
      },
      {
        type: 'quiz',
        quizQuestion: 'Shirodhara is most effective for which conditions, and what is the primary physiological mechanism?',
        quizOptions: [
          'Digestive disorders — activates digestive enzymes through head stimulation',
          'Insomnia, anxiety, migraine — resets HPA axis via hypothalamic stimulation through forehead nerves',
          'Skin conditions — delivers herbal medicine transdermally through the scalp',
          'Joint pain — lubricates joints through oil absorption',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "A practitioner who can correctly assess, prescribe, and oversee a complete Panchakarma course can change a patient's health trajectory in ways that pharmaceutical medicine simply cannot achieve. The precision of this system, applied with genuine skill and compassion, is the highest expression of the Vaidya's art.",
    keyTakeaways: [
      'Clinical Panchakarma requires complete assessment, correct procedure selection, and proper post-care.',
      'Contraindicated: pregnancy, extreme weakness, active fever, post-surgery.',
      'Shirodhara = continuous oil stream on forehead — resets HPA axis (stress system). Best for anxiety, insomnia, migraine.',
      '30-day Basti Krama = most powerful Vata and anti-aging protocol — joint lubrication, cellular Vata reset.',
      'Each specialized therapy (Kati Basti, Greeva Basti, etc.) treats specific anatomical regions.',
      'The sequence: Assessment → Selection → Poorvakarma → Pradhana Karma → Paschatkarma — never skip steps.',
    ],
    dailyPractice: 'Research one Panchakarma center near you (or online retreat). Look at their protocols and qualifications. Understanding what\'s available builds the network you need as a practitioner — both to refer to and eventually to offer.',
  },

  30: {
    moduleNumber: 30,
    agastyarOpening: "The 18 Siddhars moved differently through the world. They did not exercise — they transformed. Their bodies were not tools they used — they were temples they inhabited. Siddha Yoga is not about flexibility or fitness. It is about making the body a fit vessel for the highest consciousness. Every posture, every breath, every lock was designed with one purpose: to awaken.",
    sections: [
      {
        type: 'teaching',
        title: 'Siddha Yoga vs. Hatha Yoga — The Key Differences',
        body: `**Hatha Yoga** (as practiced in most modern contexts) focuses on physical postures (Asana) for health, flexibility, and strength.

**Siddha Yoga** uses postures as a secondary tool — the primary focus is:
1. **Vaasi** (breath control beyond pranayama — the subtle breath)
2. **Kundalini activation** (through the 6 Adharas / chakras)
3. **Kaya Kalpa** (body transformation protocols)
4. **Nada Yoga** (inner sound current)
5. **Trataka** (fixed gazing for consciousness activation)

The 18 Siddhars' practice was essentially a 24-hour integration of yoga into all life activities — not an hour on the mat but a continuous cultivation of Vaasi (life force) through every breath, posture, and moment of awareness.`,
      },
      {
        type: 'teaching',
        title: 'The 6 Adharas — Siddha Chakra System',
        body: `The Siddha system recognizes **6 Adharas** (chakra equivalents) — slightly different from the 7-chakra Tantric system:`,
        items: [
          '**1. Mooladhara (Root):** Base of spine. Earth element. Foundation, survival, elimination, immune ground. Kundalini Shakti rests here. Beeja: LAM. Color: Red.',
          '**2. Svadhisthana (Sacral):** Lower abdomen. Water. Creativity, sexuality, reproduction, emotional intelligence. Beeja: VAM. Color: Orange.',
          '**3. Manipura (Solar Plexus):** Navel. Fire. Personal power, digestion, metabolism, will. The seat of Samana Vayu and Jatharagni. Beeja: RAM. Color: Yellow.',
          '**4. Anahata (Heart):** Heart center. Air. Love, compassion, healing, connection. The meeting of upper and lower chakras. Beeja: YAM. Color: Green.',
          '**5. Vishuddha (Throat):** Throat. Ether. Expression, truth, creative sound, Udana Vayu. Beeja: HAM. Color: Blue.',
          '**6. Ajna (Third Eye):** Between eyebrows. Light/Mind. Intuition, clarity, perception beyond physical senses. Siddha Nadi Shastra reads this center deeply. Beeja: OM. Color: Indigo/White.',
          '**[Sahasrara (Crown):** In Siddha, the crown is not always enumerated as a separate Adhara but rather the dissolution point — where individual consciousness merges with the universal. Beeja: Silence.]',
        ],
      },
      {
        type: 'practice',
        title: 'The Siddha Morning Activation Sequence — 18 Minutes',
        ritual: [
          { step: 'VAASI AWARENESS (3 min)', instruction: 'Sit in stillness. Eyes closed. Observe the breath without controlling it — just witness. Feel the Vaasi (subtle breath) at the nostrils, then the throat, then the heart, then the navel. 3 minutes of pure witness awareness.' },
          { step: 'MOOLADHARA ACTIVATION (2 min)', instruction: 'Gentle Mula Bandha (root lock): contract the perineum muscle, hold for 3 counts, release. × 21 times. Activates the foundational Adhara and Apana Vayu.' },
          { step: 'NADI SHODHANA (5 min)', instruction: '9 rounds alternate nostril breathing — as taught in Module 12. This prepares the Nadis for Kundalini movement.' },
          { step: 'SIDDHA ASANA SEQUENCE (5 min)', instruction: 'Simple: 5 Surya Namaskar (Sun Salutations) performed slowly, with breath awareness at each transition. No rush. Each position held for 3 breaths.' },
          { step: 'KUNDALINI MEDITATION (3 min)', instruction: 'Sit in Sukhasana. Visualize golden light at the Mooladhara (base). With each inhale, feel it rise through the spine. With each exhale, let it overflow from Sahasrara downward. 3 minutes.' },
        ],
      },
      {
        type: 'teaching',
        title: 'Vaasi Yoga — Siddha Breathwork for Kundalini',
        body: `**Vaasi** (வாசி) is the Siddha term for the subtle life force as it moves through the Nadis — finer than Prana, closer to pure consciousness.

The Vaasi Yoga practice of the Siddhars uses the breath as a vehicle for conscious movement of prana through the 72,000 Nadis. Unlike standard pranayama (which works with the gross breath), Vaasi works with the subtle awareness behind the breath.

**Basic Vaasi practice:**
1. Slow the breath dramatically — 4-6 breaths per minute
2. Extend the exhale to 2x the inhale
3. At the top of each inhale, feel the prana held naturally (no force) for a moment
4. At the bottom of each exhale, feel the complete stillness before the next breath
5. In these pauses — between breaths — is where Vaasi awareness develops

**The Siddha principle:** Between the inbreath and outbreath is a space of complete stillness — Kumbha (the pot). In this Kumbha, the mind becomes momentarily thought-free. This is the doorway to higher consciousness. Extend this space gradually over months of practice.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'What is "Vaasi" in Siddha Yoga, and how does it differ from standard pranayama?',
        quizOptions: [
          'A type of Asana sequence focusing on strength',
          'The subtle life force behind the breath — awareness practice, finer than gross pranayama',
          'The Siddha term for Kundalini Shakti alone',
          'A specific type of Nadi Shodhana breathwork',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "The body that does not move becomes a prison. The body that moves with consciousness becomes a temple. Begin with the 18-minute morning sequence. Do it every day for 40 days. The Kundalini will not roar — it will whisper. That whisper is the beginning of everything.",
    keyTakeaways: [
      'Siddha Yoga = Vaasi (subtle breath) + Kundalini + Kaya Kalpa + Nada Yoga — not just Asana.',
      '6 Adharas (Siddha chakras): Mooladhara, Svadhisthana, Manipura, Anahata, Vishuddha, Ajna.',
      'Vaasi = the subtle breath between breaths — the doorway to higher consciousness.',
      'Mula Bandha (root lock) activates Mooladhara and Apana Vayu — practice 21x daily.',
      '18-minute morning activation: Vaasi witness → Mula Bandha → Nadi Shodhana → Asanas → Kundalini meditation.',
      'Between the inbreath and outbreath is the Kumbha — the space of thought-free consciousness.',
    ],
    dailyPractice: 'Tomorrow morning: the full 18-minute Siddha activation sequence. Every morning for 40 days. Set your alarm 20 minutes earlier to accommodate it. This is the foundation of the Siddha practitioner\'s body.',
  },

  31: {
    moduleNumber: 31,
    agastyarOpening: "You have reached a point where you understand what food does in the body — its elemental properties, its Dosha effects, its tissue-building potential. Now we go deeper: how you eat is as important as what you eat. And the specific foods you combine, the times you eat, the state you eat in — these are as medicinal as any herb.",
    sections: [
      {
        type: 'teaching',
        title: 'Ahara Vidhi — The 8 Laws of Eating',
        body: `Charaka's 8 rules for optimal eating (Ahara Vidhi Visheshayatana):`,
        items: [
          '**1. Prakrti (Nature of food):** Understand the qualities of what you eat. Heavy food (meat, dairy, beans) requires a stronger Agni — eat only when your Agni is strong.',
          '**2. Karana (Preparation):** Cooking transforms food. Fire changes the Gunas. Raw food has different properties than cooked — generally more difficult for most constitutions.',
          '**3. Samyoga (Combination):** Some combinations are Viruddha (incompatible). Incompatible combinations create Ama even from good ingredients.',
          '**4. Rashi (Quantity):** Eat 3/4 of stomach capacity. 1/4 food, 1/4 liquid, 1/4 empty for digestion. More important than the food itself.',
          '**5. Desha (Place):** Eat in a clean, calm, pleasant environment. Eating in a toxic environment (conflict, noise, stress) impairs digestion regardless of food quality.',
          '**6. Kala (Time):** Eat at the right time. Main meal at noon (Pitta peak). No eating within 3 hours of sleep. Never eat when truly not hungry.',
          '**7. Upayokta (Consumer):** Know yourself. The same food is medicine for one constitution and poison for another.',
          '**8. Upayoga Samstha (Rules of use):** Always eat warm/freshly prepared. Sit. Eat without distraction. Do not eat while standing, walking, or watching screens.',
        ],
      },
      {
        type: 'table',
        title: 'Viruddha Ahara — The 18 Types of Food Incompatibilities',
        tableData: {
          headers: ['Type', 'Example', 'Why Problematic', 'Consequence'],
          rows: [
            ['Desha Viruddha (Place)', 'Spicy food in hot climate', 'Doubles aggravating quality', 'Excessive Pitta'],
            ['Kala Viruddha (Timing)', 'Cold food in winter', 'Counter-seasonal', 'Kapha disease'],
            ['Agni Viruddha (Agni)', 'Heavy meal with weak Agni', 'Exceeds digestive capacity', 'Ama formation'],
            ['Matra Viruddha (Quantity)', 'Honey + ghee in EQUAL parts', 'Classic dangerous combination', 'Toxic Ama'],
            ['Satmya Viruddha (Incompatibility)', 'Milk + fish', 'Opposing Virya (potencies)', 'Skin diseases, toxins'],
            ['Dosha Viruddha (Dosha)', 'Vata person eating raw salad in winter', 'Same quality aggravation', 'Vata crisis'],
            ['Sanskara Viruddha (Processing)', 'Honey heated above 40°C', 'Heat changes honey to toxin', 'Honey becomes toxic when cooked'],
            ['Veerya Viruddha (Potency)', 'Milk + sour fruit (lemon)', 'Opposing hot/cold energies', 'Digestive confusion, eczema'],
            ['Koshtha Viruddha (Bowel)', 'Laxative foods for one with loose stool', 'Counter-therapeutic', 'Worsened condition'],
            ['Avastha Viruddha (State)', 'Heavy food after exhaustion', 'Exceeds depleted Agni', 'Severe Ama'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'Satmya — The Science of Dietary Adaptation',
        body: `**Satmya** (सात्म्य) means "wholesome by habituation" — the concept that foods which are compatible with your long-term experience and constitution create health, even if they theoretically conflict with Dosha guidelines.

**Example:** If you have consumed oat porridge with warm milk every morning for 30 years and your digestion responds beautifully to it — it has become Satmya for you even if Ayurveda might suggest it increases Kapha. Your body has adapted.

**The principle of gradual transition:** This is why abrupt dietary changes can be counterproductive. The body must be gradually transitioned toward an ideal diet. Sudden cold turkey elimination of habitual foods can be more disruptive than the foods themselves.

**Okasatmya (Habituation to unwholesome food):** Some people have habituated to unwholesome food — coffee, processed food, etc. — and their Agni has adapted. Suddenly removing these can cause significant disruption. Gradual reduction and replacement is the Ayurvedic approach.`,
      },
      {
        type: 'teaching',
        title: '7 Ayurvedic Fasting Types (Upavasa)',
        body: 'Fasting is not deprivation — it is Agni maintenance and Ama burning:',
        items: [
          '**Nirjala (No water):** Most intense. Used only for specific Panchakarma preparation. NOT for general practice.',
          '**Phalahara (Fruit only):** Mild fast. Fresh seasonal fruits only. Good for Pitta cleansing and spring.',
          '**Takrahar (Buttermilk only):** Digestive rest. Thin buttermilk with rock salt and cumin. Excellent for IBS, post-illness.',
          '**Ksheerapan (Milk only):** Sattvic fast. Warm milk with spices. Ojas-building fast. For Vata and Pitta.',
          '**Ekadashi (11th lunar day fast):** Traditional fortnightly fast. Light foods or liquid. Aligns with lunar Dosha cycles.',
          '**Laghu Bhojana (Light eating):** Not technically fasting — eating only half-quantity, simple foods. Most practical for regular use.',
          '**Langhana (General fasting):** Eating light, warming, digestive foods until Ama clears (tongue cleans, appetite returns naturally). The most commonly recommended Ayurvedic fasting protocol.',
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which food combination is explicitly contraindicated in Ayurveda due to opposing Virya (potencies) and is associated with skin diseases?',
        quizOptions: [
          'Ghee and honey in equal parts (not this — different problem)',
          'Milk and fish',
          'Rice and lentils',
          'Turmeric and black pepper',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "The most common mistake I see: people focus on WHAT to eat while ignoring HOW to eat. Eat the most perfectly Ayurvedic meal in front of a screen while arguing, and it will create more Ama than a meal of simple rice eaten in silence with gratitude. The consciousness of eating is as important as the food itself.",
    keyTakeaways: [
      '8 Laws of Eating: Nature, Preparation, Combination, Quantity, Place, Time, Consumer, Rules.',
      '3/4 stomach rule: 1/3 food + 1/3 liquid + 1/3 empty. Non-negotiable.',
      'Viruddha Ahara (incompatible foods): Milk+fish = skin disease. Honey heated = toxic. Equal honey+ghee = Ama.',
      'Satmya = habituation — your long-term experience with a food matters as much as its theoretical properties.',
      'The 7 fasting types: Langhana (light eating until Ama clears) is the most practical.',
      'The CONSCIOUSNESS of eating (calm, present, sitting, grateful) is as therapeutic as any food choice.',
    ],
    dailyPractice: 'This week: no screens during any meal. Sit down. No conversations about problems or conflict. Just eat with awareness. Observe how your digestion and post-meal energy change with this single modification.',
  },

  32: {
    moduleNumber: 32,
    agastyarOpening: "The female body is not a lesser version of the male body with complications. It is a different — and in many ways more sophisticated — system. The monthly cycle is not a problem to be managed. It is a built-in purification, renewal, and communication system. The Siddha understanding of the feminine body is the most profound I have encountered in any tradition.",
    sections: [
      {
        type: 'teaching',
        title: 'Artava — Menstrual Blood as Sacred Diagnostic',
        body: `In Ayurveda, **Artava** (आर्तव — menstrual blood) is classified as a sub-Dhatu of Rasa (plasma) — a regular cleansing that eliminates excess Pitta and Kapha from the Rasa Dhatu. It is not waste — it is a monthly diagnostic report.

**Healthy menstrual blood (Sama Artava):**
- Color: Bright red, like a lotus or lac
- Quantity: Appropriate (not excessive, not scanty)
- Consistency: Not too thick, not too thin, no clots
- Duration: 3-5 days
- Pain: None or minimal
- No unusual odor
- No foaming

**Dosha-specific patterns:**

**Vata Artava:** Dark, scanty, irregular cycle (varies 7+ days), pain, brown spotting before and after, dry consistency, constipation during menses, anxiety.

**Pitta Artava:** Bright red to orange, heavy flow, burning sensation, irritability, headaches, loose stools during menses, strong odor.

**Kapha Artava:** Pale pink, very heavy flow with clots, thick consistency, mucus, dull aching, fatigue, depression, water retention.`,
      },
      {
        type: 'teaching',
        title: 'Shakti Cycle Intelligence — 4 Phases Mapped to Doshas',
        body: `The menstrual cycle maps perfectly to the Dosha clock and the Panchabhutas:

**Phase 1 — MENSTRUATION (Days 1-5): VATA phase**
Dosha: Vata dominant. Element: Air + Space. Energy: Release and renewal.
Body: Endometrium sheds, blood flows downward (Apana Vayu).
Medicine: Rest, warmth, light food, castor oil pack on abdomen, Basti therapy if needed, Shatavari + Dashamoola.
DO NOT: Exercise intensely, eat cold food, work excessively.

**Phase 2 — FOLLICULAR (Days 6-14): KAPHA phase**
Dosha: Kapha building. Element: Earth + Water. Energy: Building, renewal, estrogen rising.
Body: New follicle developing, estrogen building, cervical fluid increasing.
Medicine: Gradual increase in activity, nourishing foods, Shatavari milk, creative projects.

**Phase 3 — OVULATION (Days 13-15): PITTA phase**
Dosha: Pitta peak. Element: Fire. Energy: Full power, peak fertility, leadership.
Body: LH surge, ovulation, highest energy, libido, communication ability peak.
Medicine: Enjoy the peak. Cooling foods if Pitta high. Channel this energy productively.

**Phase 4 — LUTEAL (Days 16-28): VATA-KAPHA phase**
Dosha: Vata rises through the phase (PMS is high Vata). Element: Air and Earth.
Body: Progesterone rises then falls. Symptoms amplify as hormones change.
Medicine: Increase self-care dramatically from Day 21. Ashwagandha, Shatavari, warm oil massage, reduce stimulation, more sleep. This is Vata territory — ground and warm.`,
      },
      {
        type: 'teaching',
        title: 'Garbhini Paricharya — Month-by-Month Pregnancy Care',
        body: `The Ayurvedic pregnancy care protocol prescribes specific foods, herbs, and lifestyle for each month:`,
        items: [
          '**Month 1:** Sweet, cooling, light foods. Shatavari + milk. Adequate rest. No heavy travel.',
          '**Month 2:** Milk with Brahmi, Shankhpushpi — for fetal brain development. Sweet tastes.',
          '**Month 3:** Honey + ghee + milk. Beginning of fetal movement awareness.',
          '**Month 4:** Butter, milk, rice — building the fetal heart (4th month). Cardiac health foods.',
          '**Month 5:** Sesame + ghee + milk — building muscular system. Protein support.',
          '**Month 6:** Ghee with sweet herbs — nervous system development month.',
          '**Month 7:** Ashwagandha milk — building strength and immunity. Most critical developmental month.',
          '**Month 8:** Light, easy-to-digest food only. Downward-moving Apana Vayu preparations. The fetus\'s Ojas transfers to the mother and back — do not fast this month.',
          '**Month 9:** Basti preparations (appropriate Anuvasana Basti) to prepare the birth canal. Walking increases.',
          '**Herbs CONTRAINDICATED in pregnancy:** Senna, castor oil in purgative doses, many detoxifying herbs. Always confirm with qualified practitioner.',
        ],
      },
      {
        type: 'teaching',
        title: 'Sutika Paricharya — The Sacred 42-Day Postpartum Window',
        body: `The **42 days** (6 weeks) after birth is the most important health window in a woman\'s life. What happens — or doesn\'t happen — in these 42 days determines her health for the next 42 years.

**The reason:** Birth is the most Vata-aggravating event in the human experience — extreme downward movement (Apana Vayu), pain, fluid loss, emotional upheaval. If this Vata is not immediately nourished and grounded, it spreads and settles in tissues, creating chronic conditions that appear years later (chronic pain, autoimmune, mental health challenges, hormonal imbalance).

**The Sutika Protocol:**
- **Food:** Warm, oily, easily digestible. Ghee extensively. Ajwain (carom) in all cooking — carminative, digestive, anti-bacterial, galactagogue.
- **Oil:** Full body warm sesame oil massage daily — mother AND baby.
- **Herbs:** Shatavari (milk production, hormone balance), Dashamoola (uterine support), Ashwagandha (strength rebuilding).
- **Rest:** Minimal visitors, minimal stimulation, maximal rest. The mother should not cook, clean, or carry anything heavy.
- **Warmth:** Keep the mother warm. Her Agni is depleted — protect it.
- **Basti:** Appropriate Anuvasana Basti (oil enema) in the second week post-birth is one of the most powerful postpartum therapies — grounds Vata, reduces pain, supports uterine involution.

This 42-day investment prevents decades of suffering. This is the postpartum care that traditional cultures across Asia have practiced for millennia — and that modern culture has largely abandoned, with predictable consequences.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'In the Shakti Cycle framework, which menstrual phase is associated with Pitta dominance and represents peak energy, leadership ability, and fertility?',
        quizOptions: ['Menstruation (Vata)', 'Follicular phase (Kapha)', 'Ovulation (Pitta)', 'Luteal phase (Vata-Kapha)'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "The female cycle is not a problem. It is the most sophisticated biological system on Earth — a monthly recapitulation of the entire Dosha cycle, a built-in purification and renewal system, and a profound diagnostic tool. The woman who learns to read her cycle through the Siddha-Ayurvedic lens becomes her own physician — and the physician of her children.",
    keyTakeaways: [
      'Artava (menstrual blood) = monthly diagnostic. Color, flow, consistency reveal Dosha state.',
      'Healthy Artava: bright red, 3-5 days, no pain, no clots, appropriate quantity.',
      'Four phases: Menstruation (Vata), Follicular (Kapha), Ovulation (Pitta), Luteal (Vata-Kapha).',
      'Shatavari = the primary female Rasayana. Essential in all phases.',
      'Month 8 of pregnancy: do not fast — Ojas transfers between mother and fetus.',
      '42-day postpartum window is the most important health period in a woman\'s life.',
      'Postpartum: warm food, ghee, Ajwain, daily oil massage, minimal visitors, Shatavari, REST.',
    ],
    dailyPractice: 'Women: begin tracking your cycle with Dosha awareness. Note which emotional and physical patterns appear in each phase. After 3 cycles, you will have a complete personal Dosha map of your cycle. Men: share this module with the women in your life.',
  },

  33: {
    moduleNumber: 33,
    agastyarOpening: "In Phase 2, we introduced the physics of mantra. In Phase 3, we enter the laboratory. Every mantra in this module is a clinical prescription — specific vibrations for specific conditions, combined with herbs and practices for maximum synergy. The Siddha physician was also a musician — because sound was understood as the most penetrating medicine available.",
    sections: [
      {
        type: 'teaching',
        title: 'The 51 Beeja Mantras — Complete Body Map',
        body: `The **Matrka** (mother matrix) of Sanskrit contains 51 letters — each a Beeja Mantra, each corresponding to a specific location in the body through the subtle nervous system. This is why Sanskrit was called **Devavani** — the language of the gods — because it was understood to be a language that directly activates biological structures.

The 51 Beeja Mantras are distributed through the body:
- **Mooladhara:** LAM, VAM, RAM, YAM (4 petals)
- **Svadhisthana:** BAM, BHAM, MAM, YAM, RAM, LAM (6 petals)  
- **Manipura:** DAM through PHAM (10 petals)
- **Anahata:** KAM through THAM (12 petals)
- **Vishuddha:** AM through AH (16 petals — all vowels)
- **Ajna:** HAM, KSHAM (2 petals)

**The healing application:** When a specific organ or system is distressed, reciting the corresponding Beeja Mantra in the body location of the associated chakra creates a direct vibrational intervention in that organ's energy field.`,
      },
      {
        type: 'mantra',
        title: 'Complete Dhanvantari Initiation — 108 Rounds',
        mantraText: 'OM NAMO BHAGAVATE\nVASUDEVAYA DHANVANTARAYE\nAMRITA KALASHA HASTAYA\nSARVA AMAYA VINASHANAYA\nTRI LOKA NATHAYA\nSRI MAHA VISHNAVE NAMAHA',
        mantraMeaning: 'Daily 108 rounds of the Dhanvantari Mantra — the physician of the gods. Traditionally recited at dawn after bath and before the first treatment or consultation of the day. Creates a field of healing consciousness around the practitioner that affects every patient contact.',
      },
      {
        type: 'mantra',
        title: 'Agastyar\'s Secret Healing Mantra (Agasthiyar Vazhipaadu)',
        mantraText: 'OM AGASTHIYARUKKU AROHARA\nSIDDHA GURU PADHAM SHARANAM\nNAVA GRAHA DOSHAM NIVARANA\nSARVA ROGA NIVARANA\nROGA MUKTHIYAAGA ASHIRVADAM',
        mantraMeaning: 'Salutations to Agastyar — I take refuge at the feet of the Siddha Guru. May the nine planetary doshas be cleared. May all diseases be healed. May liberation from suffering be granted. — Used specifically before Siddha healing sessions and for patients with complex, chronic, or karmic conditions.',
      },
      {
        type: 'teaching',
        title: 'Nada Bindu Upanishad — The Science of Inner Sound',
        body: `The **Nada Bindu Upanishad** teaches the science of Nada (inner sound) as the path from gross to subtle to transcendent consciousness.

**Nada** = the unstruck sound (Anahata Nada) — the cosmic vibration that exists without any two objects striking together. This is the hum of consciousness itself. The Siddhas trained to hear this sound, which they describe as: crickets → flute → bell → conch → drums → thundercloud → each progressively subtler.

**Practical Nada Yoga:**
1. Sit in complete silence with both ears plugged (Shanmukhi Mudra — covering all sense openings)
2. Listen inside. Initially you may hear tinnitus, heartbeat, breath
3. With practice, a subtle inner hum emerges — this is Nada
4. Follow the Nada inward — it deepens from gross to subtle
5. Sustained practice leads to the experience of the Pranava (AUM) arising spontaneously

**Why it heals:** The inner Nada resonates the entire nervous system at its natural frequency — creating a coherence between the individual consciousness and the universal vibration. From this coherence, healing is not difficult — it is inevitable.`,
      },
      {
        type: 'practice',
        title: 'Clinical Sound Medicine Protocol',
        ritual: [
          { step: 'ASSESSMENT', instruction: 'Identify the patient\'s dominant Dosha imbalance and the organ system primarily affected.' },
          { step: 'MANTRA SELECTION', instruction: 'Vata disorders → LAM, RAM, Maha Mrityunjaya. Pitta disorders → YAM, SHRIM, Dhanvantari. Kapha disorders → RAM, AIM, invigorating mantras.' },
          { step: 'HERB-MANTRA PAIRING', instruction: 'Prepare the herbal medicine while reciting the corresponding mantra 108x over the preparation. This is the Siddha practice of charging medicine with sound.' },
          { step: 'PATIENT PRESCRIPTION', instruction: 'Prescribe: the herb, the mantra, and a specific daily recitation time. Example: Brahmi for anxiety + LAM × 108 before sleep + Nadi Shodhana.' },
          { step: 'PRACTITIONER PRACTICE', instruction: 'Your own daily mantra practice — Dhanvantari + Agastyar + personal Ishta Devata — creates the field from which your healing work radiates. A practitioner who does not practice their own sound medicine cannot transmit it.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'According to the Nada Bindu Upanishad, what is "Anahata Nada" and how does it relate to healing?',
        quizOptions: [
          'External music therapy using instruments in clinical settings',
          'The unstruck inner sound — cosmic vibration that creates coherence between individual and universal consciousness, facilitating natural healing',
          'The sound of AUM chanted with a specific rhythm',
          'A specific type of Bhramari pranayama',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "Sound is the first medicine and the last medicine. Before the body, before the herbs, before the hands — there was sound. And in the deepest healing, when all other interventions have been exhausted, sound remains. The practitioner who has cultivated a genuine relationship with the Nada — the inner sound — carries a healing field that precedes and follows every intervention they make.",
    keyTakeaways: [
      '51 Beeja Mantras map to specific body locations through the chakra system.',
      'Dhanvantari Mantra × 108 daily creates a healing field around the practitioner.',
      'Agastyar\'s Healing Mantra: for complex, chronic, karmic conditions.',
      'Herb-mantra pairing: charge herbal preparations with mantra during preparation.',
      'Nada Yoga: following inner sound into deeper silence — coherence creates healing.',
      'Practitioner\'s own daily mantra practice is as important as any clinical skill.',
    ],
    dailyPractice: 'Practice Shanmukhi Mudra tonight for 5 minutes: sit quietly, close ears with thumbs, eyes with fingers, mouth gently closed. Listen inside. What do you hear? Record what you experience. This is the beginning of Nada Yoga.',
  },

  34: {
    moduleNumber: 34,
    agastyarOpening: "The skin is the largest organ of the body, the primary interface between self and world, and one of the most sensitive diagnostic surfaces available to the Vaidya. Every doshic imbalance eventually reaches the skin. And the skin, when read correctly, reveals the entire internal landscape.",
    sections: [
      {
        type: 'teaching',
        title: 'The 7 Layers of Skin in Ayurveda',
        body: `Ayurveda describes **Sapta Tvacha** — the seven layers of skin — each with specific properties and associated diseases. This system corresponds remarkably well to modern dermatology:`,
        items: [
          '**1. Avabhasini (Reflective):** The outermost layer — reflects complexion and health. Diseases: discoloration, blemishes.',
          '**2. Lohita (Blood):** Second layer — carries Rakta Dhatu. Diseases: erythema, rashes, bleeding skin conditions.',
          '**3. Shweta (White):** Third layer — appears white when healthy. Diseases: deep skin infections.',
          '**4. Tamra (Copper-red):** Fourth layer — source of skin luster. Diseases: chronic skin conditions.',
          '**5. Vedini (Sensation):** Fifth layer — contains nerves. Diseases: neuralgia, shingles, burning skin conditions.',
          '**6. Rohini (Healing):** Sixth layer — self-healing capacity. Diseases: failure to heal wounds, keloids.',
          '**7. Mamsadhara (Muscle support):** Seventh layer — base of skin. Diseases: deep skin tumors, fistulas.',
        ],
      },
      {
        type: 'table',
        title: 'Dosha Skin Types and Complete Care Protocols',
        tableData: {
          headers: ['Type', 'Characteristics', 'Common Conditions', 'Primary Herbs', 'External Care'],
          rows: [
            ['Vata Skin', 'Dry, thin, rough, cool, prone to cracking, fine-pored', 'Dry eczema, keratosis, cracking, premature aging', 'Ashwagandha, Shatavari, Bala', 'Warm sesame oil daily, Kshirabala Taila, avoid harsh cleansers'],
            ['Pitta Skin', 'Sensitive, warm, oily/combination, reddish, freckles', 'Acne, rosacea, psoriasis, eczema, sunburn sensitivity', 'Manjistha, Neem, Guduchi, Amla', 'Cooling rose water, Kumkumadi Tailam, avoid sun 10am-2pm, cooling masks'],
            ['Kapha Skin', 'Thick, oily, cool, large-pored, lustrous, prone to congestion', 'Cystic acne, blackheads, oily T-zone, fungal infections', 'Neem, Triphala, Trikatu, Haridra', 'Dry brushing before shower, clay masks, lighter oils, Nalpamaradi'],
          ],
        },
      },
      {
        type: 'teaching',
        title: '12 Classical Skin Formulations',
        body: 'External preparations for specific skin conditions:',
        items: [
          '**Kumkumadi Tailam:** Saffron + 26 herbs in sesame. Brightening, anti-aging, Pitta skin. Apply 2-3 drops nightly.',
          '**Nalpamaradi Keram:** 4 figs bark oil. Dark spots, hyperpigmentation, brightening.',
          '**Eladi Keram:** Cardamom base. General skin health, anti-inflammatory.',
          '**Neem oil:** Pure extracted. Anti-bacterial, anti-fungal. Acne, fungal conditions. Strong — dilute 1:10 with carrier.',
          '**Turmeric + Honey mask:** Equal parts fresh turmeric paste + raw honey. 20 minutes. Anti-inflammatory, brightening, acne.',
          '**Chandan (Sandalwood) paste:** Anti-Pitta, cooling, soothing for sensitive inflamed skin.',
          '**Triphala face wash:** 1 tsp Triphala in warm water. Splash face, leave 3 min, rinse. Gentle daily exfoliant and brightener.',
          '**Multani Mitti (Fuller\'s Earth):** Clay mask for Kapha skin. Deep cleansing, oil absorption.',
          '**Rose water + Shatavari gel:** Cooling Pitta toner. Rosewater + aloe vera + few drops Shatavari extract.',
          '**Coconut + Brahmi oil:** For dry hair and scalp. Anti-dandruff, cooling.',
          '**Bhringaraj + Amla hair oil:** Hair growth, grey prevention. Massage into scalp, leave overnight.',
          '**Sesame + Castor oil blend:** For dry, Vata hair — deeply nourishing before wash.',
        ],
      },
      {
        type: 'practice',
        title: 'Daily Ayurvedic Skin Care Ritual',
        ritual: [
          { step: 'IDENTIFY YOUR TYPE', instruction: 'Touch your face mid-afternoon (most accurate time). Is it dry and tight (Vata), oily and warm (Pitta), or thick and smooth/oily (Kapha)? This determines your care protocol.' },
          { step: 'CLEANSE', instruction: 'Vata: cream or oil cleanser, warm water. Pitta: gentle foam, cool water. Kapha: clay or foam cleanser, normal-warm water. NEVER hot water on skin (strips oils, disrupts barrier).' },
          { step: 'TONE', instruction: 'Vata: rose water + few drops aloe. Pitta: pure rose water, cool. Kapha: witch hazel or neem water.' },
          { step: 'MOISTURIZE/OIL', instruction: 'Vata: warm sesame or Kshirabala Taila. Pitta: Kumkumadi Tailam, rose hip, or coconut. Kapha: minimum oil — Jojoba or light sesame only.' },
          { step: 'WEEKLY MASK', instruction: 'Vata: honey + cream + rose. Pitta: sandalwood + rose water. Kapha: Multani Mitti + neem water. 20 minutes, rinse with cool water.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'Which classical Ayurvedic oil contains saffron and 26 additional herbs in sesame oil, and is used for skin brightening and anti-aging in Pitta skin types?',
        quizOptions: ['Mahanarayan Taila', 'Nalpamaradi Keram', 'Kumkumadi Tailam', 'Kshirabala Taila'],
        quizAnswer: 2,
      },
    ],
    agastyarClosing: "Skin care in the Siddha tradition is not vanity — it is Dinacharya. The oil massage, the cleansing, the protection — these are acts of respect for the body temple. Beautiful, healthy skin is the natural expression of a system that is internally nourished, purified, and at peace.",
    keyTakeaways: [
      'Sapta Tvacha: 7 skin layers, each with specific diseases — from surface to deep.',
      'Vata skin: dry, thin — needs warm sesame oil daily.',
      'Pitta skin: sensitive, warm — needs cooling (rose water, Kumkumadi Tailam, avoid sun).',
      'Kapha skin: thick, oily — needs dry brushing, clay masks, minimal oil.',
      'Kumkumadi Tailam: the premier Pitta skin oil — brightening, anti-aging.',
      'Triphala face wash: the most universally applicable Ayurvedic skin care.',
      'Internal skin medicine: Manjistha (blood purifier) for Pitta skin. Ashwagandha+ghee for Vata skin.',
    ],
    dailyPractice: 'Identify your skin type. Tomorrow morning: apply 2-3 drops of the correct oil for your type (sesame for Vata, Kumkumadi for Pitta, minimal jojoba for Kapha) as your morning moisturizer. One week of consistency will show clear difference.',
  },

  35: {
    moduleNumber: 35,
    agastyarOpening: "Western medicine and Siddha-Ayurvedic medicine are not enemies. They are colleagues who have not yet been properly introduced. Modern research is now confirming, with expensive instruments and controlled trials, what the Siddhars documented in palm manuscripts thousands of years ago. Understanding both systems makes you a better practitioner of each.",
    sections: [
      {
        type: 'teaching',
        title: 'The Microbiome as Agni — The Modern Parallel',
        body: `The most significant correspondence between modern science and Ayurveda:

**Microbiome → Agni and Ama:**
- Modern science: 70-80% of immune function resides in the gut microbiome. Dysbiosis (microbial imbalance) is linked to virtually every chronic disease.
- Ayurveda: Mandagni (dull digestive fire) creates Ama (toxic accumulation) that blocks channels and creates all disease.
- **The correspondence:** A healthy microbiome = strong Sama Agni. A dysbiotic microbiome = Mandagni + high Ama. The Ayurvedic practice of maintaining Agni (warm food, ginger, spices, no snacking) is now understood through microbiome science to support beneficial bacterial populations and short-chain fatty acid production.

**Epigenetics → Prakriti:**
- Modern science: Gene expression is modified by lifestyle, diet, emotion, and environment — creating different phenotypic expressions from the same genotype.
- Ayurveda: Prakriti (birth constitution) is fixed, but Vikriti (current expression) is continuously modified by food, lifestyle, season, and emotion.
- **The correspondence:** Prakriti is the genotype tendency. Vikriti is the epigenetic expression. Ayurvedic lifestyle interventions are, in modern terms, epigenetic modulators.

**HPA Axis → Vata/Pitta Stress Response:**
- Modern: HPA (hypothalamic-pituitary-adrenal) axis regulates cortisol and stress response. Chronic activation = disease.
- Ayurveda: Chronic Vata aggravation (which the stress response represents) depletes Ojas and creates systemic imbalance.
- **The correspondence:** Vata-balancing practices (Abhyanga, warm oil, routine, Ashwagandha) are now known to modulate the HPA axis and reduce cortisol.`,
      },
      {
        type: 'table',
        title: 'Key Research Summaries — Ayurvedic Herbs in Modern Science',
        tableData: {
          headers: ['Herb', 'Study Finding', 'Ayurvedic Correlation', 'Clinical Application'],
          rows: [
            ['Ashwagandha', 'Reduces cortisol 27-30%, improves thyroid function, increases testosterone and muscle mass', 'Adaptogen, Ojas builder, Vata reducer', 'Stress, fatigue, hypothyroid, athletic performance'],
            ['Brahmi (Bacopa)', 'Improves memory consolidation, reduces anxiety (comparable to lorazepam in some studies), neuroprotective', 'Medhya Rasayana, brain tonic', 'Anxiety, memory, ADHD, neurodegeneration'],
            ['Turmeric (Curcumin)', 'Inhibits 5 inflammatory pathways, comparable to ibuprofen in arthritis studies, anti-cancer, hepatoprotective', 'Bitter, blood purifier, Kapha reducer', 'Inflammation, arthritis, liver, cancer prevention'],
            ['Triphala', 'Broad-spectrum prebiotic, antimicrobial, anti-cancer, liver protective, eye health (used in some glaucoma studies)', 'Universal cleanser, Rasayana, all Doshas', 'Digestive health, anti-aging, microbiome'],
            ['Guduchi', 'Immunomodulatory (both upregulates and downregulates immune response as needed), anti-diabetic, liver protective', 'Amrita — immune intelligence', 'Autoimmune, diabetes, infections, liver'],
            ['Shatavari', 'Phytoestrogen activity, galactagogue (increases breast milk), reduces menopausal symptoms, anti-inflammatory', 'Queen of female herbs', 'Women\'s health, menopause, fertility'],
            ['Moringa', 'Complete protein (18 amino acids), vitamin C (7x orange), calcium (4x milk), iron (3x spinach), anti-inflammatory', 'Siddha superfood, all Doshas', 'Malnutrition, energy, anti-inflammatory'],
          ],
        },
      },
      {
        type: 'teaching',
        title: 'Integrative Practice — Working Alongside Modern Medicine',
        body: `The integrative approach — using Ayurveda and modern medicine in appropriate collaboration — is the highest form of clinical practice:

**When to refer to modern medicine immediately:**
- Any symptoms of cardiac emergency (chest pain, shortness of breath, irregular heartbeat)
- Neurological symptoms (weakness, numbness, sudden headache, loss of consciousness)
- Infection with high fever (>39°C) not responding to herbal care in 24-48 hours
- Any suspicion of cancer or serious pathology
- Acute trauma
- Psychiatric emergency

**Where Ayurveda excels over modern medicine:**
- Chronic disease prevention (catching Stages 1-4 before modern diagnosis is possible)
- Lifestyle-related chronic conditions (IBS, metabolic syndrome, hormonal imbalance, chronic fatigue)
- Psychological wellbeing and stress-related disease
- Post-treatment recovery and rebuilding
- Anti-aging and longevity optimization
- Conditions with no clear conventional diagnosis (functional disorders)

**Communication with MDs:**
- Use precise language: "This patient has elevated inflammatory markers" not "high Pitta"
- Request specific labs: CRP, homocysteine, cortisol, thyroid panel, vitamin D, B12, iron studies
- Coordinate, not compete. The best outcomes come from both approaches working together.`,
      },
      {
        type: 'quiz',
        quizQuestion: 'In modern scientific terms, what corresponds to the Ayurvedic concept of "Prakriti" (birth constitution)?',
        quizOptions: [
          'Blood type',
          'The genotype/genetic tendency (with Vikriti as epigenetic expression)',
          'The microbiome composition at birth',
          'HPA axis baseline sensitivity',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "The Siddhas were not anti-science — they were the scientists of their era. And had they access to modern instruments, they would have used them with delight. Integrate both wisdoms. Use modern diagnostics to confirm and track what Siddha diagnostic arts reveal. Use Ayurvedic treatment to address root causes that modern drugs can only suppress. This combination is the future of medicine.",
    keyTakeaways: [
      'Microbiome = Agni. Dysbiosis = Mandagni + Ama. Ayurvedic Agni practices support beneficial bacteria.',
      'Epigenetics = Prakriti-Vikriti dynamic. Ayurvedic lifestyle = epigenetic modulation.',
      'HPA axis = Vata stress response. Ashwagandha, Abhyanga, routine = HPA modulators.',
      'Key research: Ashwagandha reduces cortisol 27-30%. Brahmi comparable to anxiolytics. Turmeric = 5 anti-inflammatory pathways.',
      'Know when to refer: cardiac emergency, neurological symptoms, high fever, cancer suspicion.',
      'Ayurveda excels: chronic prevention, lifestyle disease, psychological health, recovery, anti-aging.',
    ],
    dailyPractice: 'Find ONE peer-reviewed research paper on a herb you use daily (PubMed.gov is free). Read the abstract. Notice how the mechanism described maps to the Ayurvedic understanding. This practice bridges the two languages of knowledge.',
  },

  36: {
    moduleNumber: 36,
    agastyarOpening: "The Vaidya who does not share their knowledge has failed the lineage. The knowledge of healing is not your property — it flows through you from an ancient source and must flow forward through you to the world. But to share it sustainably, you must build a practice that supports you. Wealth through service is the highest dharmic business model.",
    sections: [
      {
        type: 'teaching',
        title: 'The Vaidya\'s Oath — Sushruta\'s Code',
        body: `Before Hippocrates, before any Western medical ethics, Sushruta wrote a code of conduct for the Ayurvedic physician. The Vaidya must:

- Treat every patient as they would treat their own family
- Never abandon a patient due to financial inability (offer services to those who cannot pay)
- Never accept gifts that compromise clinical judgment
- Maintain confidentiality absolutely
- Continuously study and update knowledge
- Speak truth even when difficult
- Never use knowledge to cause harm
- Approach every patient with compassion before strategy

**The Siddha addition:** The Vaidya's healing capacity is directly proportional to their own spiritual practice. A Vaidya who does not practice what they prescribe cannot achieve optimal results. The healer's own health, equanimity, and consistent practice is the first condition of the healing relationship.`,
      },
      {
        type: 'teaching',
        title: 'Setting Up Your Practice — 5 Models',
        body: `Five sustainable practice models for the Siddha-Ayurvedic practitioner:`,
        items: [
          '**1. Wellness Coaching (Legal in most countries):** Offer personalized Ayurvedic health coaching — not medical diagnosis, but lifestyle, diet, and herb guidance. Price range: €60-150/session. Most accessible entry point.',
          '**2. Online Course Platform:** Create courses using this curriculum as your foundation. Price range: €49-1111/course. Scalable — teach once, earn repeatedly. The SQI model itself.',
          '**3. Retreat Facilitation:** 2-5 day Siddha Immersion retreats. Price range: €500-3000/person. High-impact, premium offering. Combines teaching + Panchakarma + yoga + mantra.',
          '**4. Herb and Product Business:** Create branded Ayurvedic products (oils, churnas, teas) aligned with your specialty. Requires product development and sourcing, but creates passive income.',
          '**5. Hybrid Practice:** Combine 1:1 consultations + group programs + digital products. The most sustainable model — multiple income streams, multiple impact channels.',
        ],
      },
      {
        type: 'teaching',
        title: 'The Siddha-Naval-Elon Wealth Framework',
        body: `The Siddhars were not poor. They were not anti-wealth. They understood that **Artha** (material prosperity) is one of the four Purusharthas (aims of life) — necessary for fulfilling one\'s Dharma.

**Naval Ravikant\'s principle applied to healing:**
- Create leverage: knowledge that scales. A consultation serves 1 person. A course serves 10,000. The same knowledge, applied through different vehicles.
- Build specific knowledge: the intersection of Siddha medicine + modern health consciousness + digital delivery is an un-copied position. Occupy it completely.
- Specific knowledge + leverage + time = wealth. 

**Elon Musk\'s principle applied to healing:**
- Solve a problem that needs solving. The problem: modern health is broken. The solution exists: Siddha-Ayurvedic wisdom. The bridge: technology.
- Think at scale. If you help 1 person, that is Seva. If you build a platform that helps 1 million, that is also Seva — at a different order of magnitude.

**The Siddha principle:**
- Service is the foundation. Offer genuine value.
- The wealth that comes from genuine service is clean — it carries the Prana of the service it was created through.
- Charge what reflects the genuine value you provide. Under-charging dishonors the lineage.`,
      },
      {
        type: 'practice',
        title: 'Your Practice Launch Protocol — 90 Days',
        ritual: [
          { step: 'DAYS 1-30: FOUNDATION', instruction: 'Complete your own 40-day Rasayana protocol. You cannot teach what you have not lived. Begin documenting your personal healing journey — this becomes your most authentic marketing material.' },
          { step: 'DAYS 31-60: CREATION', instruction: 'Create your first digital offering: a free 5-day Ayurveda email course, a free Dosha quiz with personalized recommendations, or a free webinar on one Ayurvedic topic. Build your audience with genuine value FIRST.' },
          { step: 'DAYS 61-90: LAUNCH', instruction: 'Launch your first paid offering to the audience you built. Price it appropriately — not too low (dishonors your knowledge) and not too high (not accessible enough to build trust).' },
          { step: 'ONGOING: SYSTEMS', instruction: 'Build intake forms, consultation notes template, client communication templates. Systems create the freedom to serve more people without burning out. The Vaidya who has no systems eventually has no practice.' },
          { step: 'ONGOING: COMMUNITY', instruction: 'Connect with other Ayurvedic practitioners. Attend trainings and conferences. Share knowledge freely. The rising tide lifts all boats in the healing community.' },
        ],
      },
      {
        type: 'quiz',
        quizQuestion: 'According to the Siddha-Naval wealth framework, what creates scalable impact as a health practitioner?',
        quizOptions: [
          'Working longer hours with more 1:1 clients',
          'Leveraging knowledge through courses and digital products that serve many simultaneously',
          'Charging the highest possible prices for consultations',
          'Specializing in only the rarest Siddha treatments',
        ],
        quizAnswer: 1,
      },
    ],
    agastyarClosing: "You have now completed the Practitioner level of Agastyar Academy. You carry within you the seeds of three phases of the most complete healing curriculum ever assembled in digital form. What happens next depends entirely on what you do with this knowledge. Knowledge unused is knowledge that dies with you. Knowledge shared becomes a lineage. Choose to be a lineage-maker.",
    keyTakeaways: [
      'The Vaidya\'s oath: treat patients as family, maintain confidentiality, continuous study, speak truth.',
      '5 practice models: Coaching, Online Courses, Retreats, Products, Hybrid.',
      'Siddha-Naval insight: leverage knowledge. A course serves 10,000 people vs. 1:1\'s 1 person.',
      'Charge appropriately — under-charging dishonors the lineage.',
      'Your personal practice IS your first marketing: live what you teach.',
      '90-day launch: Foundation (personal practice) → Creation (free value) → Launch (paid offering).',
    ],
    dailyPractice: 'Write a one-page document: "My Healing Practice Vision." What do you offer? Who do you serve? How do you deliver it? What do you charge? Read it every morning for 30 days. Clarity of vision is the first step toward manifestation.',
  },
};
