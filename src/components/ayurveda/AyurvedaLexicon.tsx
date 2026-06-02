// src/components/ayurveda/AyurvedaLexicon.tsx
// SQI 2050 — Sanskrit Ayurvedic Lexicon Modal

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface LexiconEntry {
  term: string;
  transliteration?: string;
  translation: string;
  description: string;
}

interface LexiconCategory {
  id: string;
  label: string;
  glyph: string;
  entries: LexiconEntry[];
}

const LEXICON_DATA: LexiconCategory[] = [
  {
    id: 'doshas',
    label: 'The Three Doshas',
    glyph: '△',
    entries: [
      { term: 'Vata', transliteration: 'vā-ta', translation: 'Wind / Movement', description: 'The force of movement, breath, and nervous system activity. Governs all motion in the body — circulation, elimination, impulse transmission. Seat: colon and sacral region. Season: late autumn–winter.' },
      { term: 'Prana Vata', transliteration: 'prā-ṇa vā-ta', translation: 'Inward-moving Wind', description: 'The subtype of Vata governing the head, brain, and chest. Controls sensory intake, swallowing, and the inhalation of prana. Imbalance: anxiety, brain fog, insomnia.' },
      { term: 'Udana Vata', transliteration: 'udā-na vā-ta', translation: 'Upward-moving Wind', description: 'Governs the throat, speech, memory, and exhalation. The force that moves prana upward. Imbalance: speech disorders, poor memory, fatigue of the upper body.' },
      { term: 'Samana Vata', transliteration: 'sa-māna vā-ta', translation: 'Balancing Wind', description: 'Governs the navel region and digestive fire. Balances and separates nutrients from waste. Imbalance: irregular digestion, malabsorption, bloating.' },
      { term: 'Apana Vata', transliteration: 'apā-na vā-ta', translation: 'Downward-moving Wind', description: 'The most foundational Vata subtype. Governs the colon, pelvis, elimination, menstruation, and birth. Seat of all downward-moving forces. When disturbed, affects every other Vata subtype.' },
      { term: 'Vyana Vata', transliteration: 'vyā-na vā-ta', translation: 'Pervading Wind', description: 'Governs the heart and peripheral circulation — moves prana outward to every cell. Governs sweating, the movement of nutrients through the body, and reflexive movement.' },
      { term: 'Pitta', transliteration: 'pit-ta', translation: 'Fire / Transformation', description: 'The force of metabolism, digestion, intelligence, and transformation. Governs heat, enzymatic function, and perception. Seat: small intestine. Season: summer.' },
      { term: 'Sadhaka Pitta', transliteration: 'sā-dha-ka pit-ta', translation: 'Accomplishing Fire', description: 'The Pitta of the heart and mind. Governs motivation, emotional processing, and the ability to fulfill one\'s dharma. Imbalance: perfectionism, anger, heart inflammation.' },
      { term: 'Alochaka Pitta', transliteration: 'ā-lo-cha-ka pit-ta', translation: 'Illuminating Fire', description: 'Governs the eyes and visual perception — both physical and intuitive sight. Imbalance: eye strain, inflammation, impaired discernment.' },
      { term: 'Bhrajaka Pitta', transliteration: 'bhrā-ja-ka pit-ta', translation: 'Radiant Fire', description: 'The fire of the skin — governs complexion, temperature regulation, and the assimilation of sunlight. Imbalance: skin inflammation, rashes, fever.' },
      { term: 'Pachaka Pitta', transliteration: 'pā-cha-ka pit-ta', translation: 'Digestive Fire', description: 'The primary digestive fire residing in the small intestine. Governs enzymatic digestion and the separation of nutrients from waste. The seat of Agni.' },
      { term: 'Ranjaka Pitta', transliteration: 'ran-ja-ka pit-ta', translation: 'Coloring Fire', description: 'The Pitta of the liver and spleen. Colors the Rasa Dhatu into Rakta (blood). Governs hemoglobin, bile production, and emotional coloring of experience.' },
      { term: 'Kapha', transliteration: 'ka-pha', translation: 'Water + Earth / Structure', description: 'The force of cohesion, lubrication, and structure. Governs all fluids, immunity, and the building of tissue. Seat: stomach and chest. Season: spring.' },
      { term: 'Tarpaka Kapha', transliteration: 'tar-pa-ka ka-pha', translation: 'Nourishing Water', description: 'The Kapha of the brain, sinuses, and cerebrospinal fluid. Governs memory, sense organ lubrication, and emotional contentment. Imbalance: sinus congestion, memory loss, depression.' },
      { term: 'Avalambaka Kapha', transliteration: 'a-va-lam-ba-ka ka-pha', translation: 'Supporting Water', description: 'The Kapha of the chest and heart. Supports cardiac function and protects the other Kapha subtypes. Imbalance: heart congestion, respiratory heaviness.' },
      { term: 'Kledaka Kapha', transliteration: 'kle-da-ka ka-pha', translation: 'Moistening Water', description: 'The stomach fluid that protects gastric mucosa and initiates digestion. Imbalance: nausea, mucus in digestion, loss of appetite.' },
      { term: 'Bodhaka Kapha', transliteration: 'bo-dha-ka ka-pha', translation: 'Perceiving Water', description: 'The saliva and taste perception fluid of the tongue. Initiates digestion through enzymatic action. Governs the first layer of taste experience.' },
      { term: 'Shleshaka Kapha', transliteration: 'śle-ṣa-ka ka-pha', translation: 'Lubricating Water', description: 'The synovial fluid of the joints. Governs all joint lubrication and bone articulation. Imbalance: joint pain, dryness, cracking sounds.' },
    ],
  },
  {
    id: 'dhatus',
    label: 'Sapta Dhatus — 7 Tissues',
    glyph: '◈',
    entries: [
      { term: 'Rasa Dhatu', transliteration: 'ra-sa dhā-tu', translation: 'Plasma / Lymph Tissue', description: 'The first tissue — formed from the essence of digested food. Nourishes every other Dhatu in sequence. Governs: circulation of nutrients, immune response initiation, emotional fluidity. When depleted: dryness, heartache, poor immunity.' },
      { term: 'Rakta Dhatu', transliteration: 'rak-ta dhā-tu', translation: 'Blood Tissue', description: 'Formed from Rasa Dhatu by Ranjaka Pitta in the liver. Governs: oxygenation, vitality, courage, and the red force of life. When vitiated: inflammation, bleeding disorders, anger, skin eruptions.' },
      { term: 'Mamsa Dhatu', transliteration: 'māṃ-sa dhā-tu', translation: 'Muscle Tissue', description: 'Governs physical strength, form-holding, and the protective covering of vital organs. By-products include skin openings (ears, nostrils). When deficient: weakness, emaciation, loss of physical will.' },
      { term: 'Meda Dhatu', transliteration: 'me-da dhā-tu', translation: 'Fat / Adipose Tissue', description: 'Governs: lubrication of all tissues, insulation, joint health, and the storage of deep energy. By-product: sweat. Excess blocks the channels feeding Asthi and deeper Dhatus. Imbalance: obesity OR extreme dryness.' },
      { term: 'Asthi Dhatu', transliteration: 'as-thi dhā-tu', translation: 'Bone Tissue', description: 'The structural foundation — governs bones, cartilage, teeth, nails. By-product: body hair. When depleted: bone loss, joint degeneration, brittle nails, hair loss, fear (the emotion stored in bone).' },
      { term: 'Majja Dhatu', transliteration: 'maj-ja dhā-tu', translation: 'Marrow / Nerve Tissue', description: 'Governs bone marrow, spinal cord, brain tissue, and ALL nerve tissue. The Ojas reservoir second only to the heart. When depleted: nerve disorders, deep fatigue, disconnection from intuition, severe Vata in the nervous system.' },
      { term: 'Shukra / Artava Dhatu', transliteration: 'śuk-ra / ar-ta-va dhā-tu', translation: 'Reproductive Essence', description: 'The seventh and most refined tissue — the distillation of all seven Dhatus. Takes 30 days to form from all previous tissues combined. The deepest Ojas reservoir. Governs: fertility, creative power, spiritual radiance, and longevity. Depletion here affects all Dhatus above it.' },
    ],
  },
  {
    id: 'srotamsi',
    label: 'Srotamsi — 14 Body Channels',
    glyph: '⟁',
    entries: [
      { term: 'Pranavaha Srotas', transliteration: 'prā-ṇa-va-ha sro-taḥ', translation: 'Breath / Prana Channel', description: 'Channels of respiration and prana movement. Origin: heart and Rasavaha Srotas. When blocked: breathlessness, sighing, irregular breathing, prana depletion.' },
      { term: 'Annavaha Srotas', transliteration: 'an-na-va-ha sro-taḥ', translation: 'Food / Digestive Channel', description: 'The gastrointestinal tract from mouth to small intestine. Origin: stomach and left side. When blocked: appetite loss, vomiting, digestive disorders at every level.' },
      { term: 'Udakavaha Srotas', transliteration: 'u-da-ka-va-ha sro-taḥ', translation: 'Water Metabolism Channel', description: 'Governs water absorption and fluid balance. Origin: palate and choroid plexus. When blocked: excessive thirst, dehydration, or water retention.' },
      { term: 'Rasavaha Srotas', transliteration: 'ra-sa-va-ha sro-taḥ', translation: 'Plasma Circulation Channel', description: 'Carries the essence of digested food to all tissues. Origin: heart and vessels. Ama accumulates here first — making it the earliest signal channel for systemic imbalance.' },
      { term: 'Raktavaha Srotas', transliteration: 'rak-ta-va-ha sro-taḥ', translation: 'Blood Channel', description: 'Carries oxygenated blood. Origin: liver and spleen. When vitiated: inflammation, skin disorders, bleeding, anger without cause.' },
      { term: 'Mamsavaha Srotas', transliteration: 'māṃ-sa-va-ha sro-taḥ', translation: 'Muscle Channel', description: 'Nourishes and repairs muscle tissue. When obstructed: heaviness, physical weakness, fibromyalgia-type patterns.' },
      { term: 'Medavaha Srotas', transliteration: 'me-da-va-ha sro-taḥ', translation: 'Fat / Lymph Channel', description: 'Critical channel — when this becomes obstructed by excess Kapha, all Dhatus deeper than Meda (Asthi, Majja, Shukra) become undernourished even in a well-fed body.' },
      { term: 'Asthivaha Srotas', transliteration: 'as-thi-va-ha sro-taḥ', translation: 'Bone Channel', description: 'Nourishes bone and cartilage. Origin: pelvic region and adipose tissue. Vata aggravation here creates bone degeneration, crackling joints, and existential fear.' },
      { term: 'Majjavaha Srotas', transliteration: 'maj-ja-va-ha sro-taḥ', translation: 'Marrow / Nerve Channel', description: 'The deepest internal channel — carries nourishment to bone marrow, brain, and all nerve tissue. Ama here is the most difficult to clear — it indicates years of accumulated imbalance.' },
      { term: 'Shukravaha Srotas', transliteration: 'śuk-ra-va-ha sro-taḥ', translation: 'Reproductive Channel', description: 'Governs formation and movement of reproductive essence. When blocked: infertility, loss of creative power, spiritual disconnection, premature aging.' },
      { term: 'Purishavaha Srotas', transliteration: 'pu-rī-ṣa-va-ha sro-taḥ', translation: 'Colon / Elimination Channel', description: 'Origin: colon and rectum. The seat of Apana Vata. Elimination patterns are the first visible diagnostic signal. Irregular elimination = Vata origin of most imbalances.' },
      { term: 'Mutravaha Srotas', transliteration: 'mu-tra-va-ha sro-taḥ', translation: 'Urinary Channel', description: 'Governs kidney filtration and urinary function. Reflects the state of fluid balance and Pitta heat in the body.' },
      { term: 'Swedavaha Srotas', transliteration: 'sve-da-va-ha sro-taḥ', translation: 'Sweat Channel', description: 'Governs perspiration and body temperature regulation. Connected to Meda Dhatu and the skin (Bhrajaka Pitta). Excess = Pitta. Absence = Vata or Kapha obstruction.' },
      { term: 'Manovaha Srotas', transliteration: 'ma-no-va-ha sro-taḥ', translation: 'Mind-Body Channel', description: 'The channel through which mental states become physical reality. There is no body symptom without a Manovaha Srotas component. Origin: heart and sense organs. This is where unprocessed emotion becomes Ama in the tissue.' },
    ],
  },
  {
    id: 'agni_ama',
    label: 'Agni & Ama',
    glyph: '🔥',
    entries: [
      { term: 'Agni', transliteration: 'ag-ni', translation: 'Digestive / Metabolic Fire', description: 'The central intelligence of metabolism at every level — from gastric digestion to cellular intelligence. There are 13 types of Agni in the body: Jatharagni (master digestive fire), 7 Dhatvagnis (one per tissue), and 5 Bhutagnis (elemental fires). The health of all 13 depends on Jatharagni.' },
      { term: 'Sama Agni', transliteration: 'sa-ma ag-ni', translation: 'Balanced Fire', description: 'The ideal state: regular appetite, complete digestion, no gas or heaviness, clear mind after eating, consistent elimination. This is the target of all Agastya\'s prescriptions.' },
      { term: 'Vishama Agni', transliteration: 'vi-ṣa-ma ag-ni', translation: 'Irregular Fire', description: 'Vata-origin digestive fire — unpredictable. Some days strong, some days absent. Bloating, gas, variable appetite, alternating constipation and loose bowels. The most common pattern in modern life.' },
      { term: 'Tikshna Agni', transliteration: 'tīk-ṣṇa ag-ni', translation: 'Sharp / Over-active Fire', description: 'Pitta-origin digestive fire — burns too fast. Intense hunger, acid reflux, loose stools, inflammation, the sensation that the body "eats itself" between meals.' },
      { term: 'Manda Agni', transliteration: 'man-da ag-ni', translation: 'Slow / Dull Fire', description: 'Kapha-origin digestive fire — sluggish. Heavy feeling after meals, slow metabolism, weight gain, mucus in digestion, post-meal lethargy, high Ama accumulation.' },
      { term: 'Ama', transliteration: 'ā-ma', translation: 'Undigested Residue / Toxin', description: 'The product of incomplete digestion — at any level (food, emotion, experience, sensory input). White coating on tongue = fresh Ama (days to weeks). Grey = months old. Brown-black = years. Ama circulates until it settles in a weak Dhatu and creates disease. The first work of Ayurveda is always Ama Pachana — burning the Ama — before any tonification can work.' },
      { term: 'Ama Pachana', transliteration: 'ā-ma pā-cha-na', translation: 'Ama Digestion / Burning Toxins', description: 'The therapeutic process of using sharp, light, dry, and hot qualities to digest accumulated Ama. Trikatu (three-pepper formula), fasting, ginger tea, light Kapha-reducing diet. Must precede any Rasayana (tonification) therapy.' },
    ],
  },
  {
    id: 'vital',
    label: 'Ojas · Tejas · Prana',
    glyph: '✦',
    entries: [
      { term: 'Ojas', transliteration: 'o-jas', translation: 'Vital Essence / Immune-Spiritual Fluid', description: 'The finest product of complete digestion — the distillate of all 7 Dhatus fully nourished. The foundation of immunity, vitality, and spiritual radiance. Seat: Hridaya (heart). Two types: Para Ojas (8 drops in the heart — if depleted, death follows) and Apara Ojas (½ Anjali distributed through the body). Depleted by: excessive sex, fasting, grief, trauma, excessive speech, insomnia, overwork.' },
      { term: 'Tejas', transliteration: 'te-jas', translation: 'Cellular Intelligence / Metabolic Fire Essence', description: 'The refined essence of Pitta — the fire-intelligence within every cell that governs cellular metabolism, immune discernment, and the capacity to transform experience into wisdom. Too low: dullness, Ama, inability to digest experience. Too high: inflammation, burnout, the "brilliant mind destroying itself."' },
      { term: 'Prana', transliteration: 'prā-ṇa', translation: 'Life Force / Vital Breath', description: 'The refined essence of Vata — the organizing intelligence of the Nadi matrix. Governs the 72,000 Nadis (energy channels) and their coherence. The seat of consciousness in the body. Prana and mind move together: when Prana is disturbed, thought is disturbed. When thought is purified, Prana becomes coherent.' },
    ],
  },
  {
    id: 'marma',
    label: 'Marma Points',
    glyph: '⊕',
    entries: [
      { term: 'Bhrumadhya', transliteration: 'bhrū-mad-hya', translation: 'Third Eye Point', description: 'Located between the eyebrows. Junction of Ida, Pingala, and Sushumna Nadis. Activates Ajna Chakra, clears Tarpaka Kapha from sinuses, reduces Prana Vata anxiety. Gentle clockwise pressure with Brahmi oil for 90 seconds.' },
      { term: 'Hridaya Marma', transliteration: 'hṛd-a-ya', translation: 'Heart Marma', description: 'The primary seat of Ojas, Prana, and consciousness. Located at the sternum center. Stimulation opens Anahata Chakra, releases stored grief from Rasa Dhatu, stabilizes Sadhaka Pitta. Never apply pressure directly — use light circular touch or warm sesame oil.' },
      { term: 'Nabhi', transliteration: 'nā-bhi', translation: 'Navel — Cosmic Center', description: 'The body\'s energetic origin point and the seat of Samana Vata. Governs all digestive fire, Nadi coherence (all 72,000 Nadis originate here), and the body\'s connection to cosmic time. Navel oiling (Nabhi Chikitsa) with warm castor or sesame oil is the most powerful grounding treatment in Agastya\'s pharmacopeia.' },
      { term: 'Basti Marma', transliteration: 'bas-ti', translation: 'Pelvic Basin Marma', description: 'The seat of Apana Vata — the most foundational Vata subtype. Located in the lower abdomen. Governs all downward-moving functions: elimination, menstruation, sexual function, and the downward release of fear. When Apana Vata is disturbed, all other Vata subtypes destabilize.' },
      { term: 'Adhipati', transliteration: 'a-dhi-pa-ti', translation: 'Crown Marma / Lord of All', description: 'Located at the crown of the skull — the Brahmarandhra opening. Governs the highest Prana flow and the interface between individual consciousness and cosmic Prana. Warm Brahmi or coconut oil here during Shirodhara or self-massage opens Sahasrara and calms all Vata in the nervous system.' },
      { term: 'Tala Hridaya', transliteration: 'tā-la hṛd-a-ya', translation: 'Heart of the Palm / Sole', description: 'Located at the center of the palm and the center of the sole. Powerful Prana emission and reception point. In Siddha healing transmission, Agastya delivers Scalar Wave Entanglement through this Marma. Stimulation: firm circular pressure, 2–3 minutes, sesame oil. Opens Vyana Vata and peripheral circulation.' },
      { term: 'Kshipra', transliteration: 'kṣi-pra', translation: 'Swift Point', description: 'Located in the web between thumb and index finger (hand) and big toe and second toe (foot). The fastest-acting Marma — immediate Vata calming, pain relief, headache reduction. Named "swift" because the therapeutic effect is immediate. Firm pinching pressure for 60 seconds.' },
    ],
  },
  {
    id: 'herbs',
    label: 'Key Aushadhi — Herbs',
    glyph: '🌿',
    entries: [
      { term: 'Ashwagandha', transliteration: 'aś-va-gan-dhā', translation: 'Horse Smell / Withania somnifera', description: 'The supreme Vata-balancing Rasayana. Rebuilds Majja Dhatu (nerve tissue), Shukra Dhatu, and Ojas. Dose: 1 tsp powder in warm whole milk with ghee and raw honey, before sleep. Duration: 90 days minimum for deep tissue effect. Do not use in acute Pitta/Ama states.' },
      { term: 'Shatavari', transliteration: 'śa-tā-va-rī', translation: 'She who has 100 husbands / Asparagus racemosus', description: 'Supreme Pitta-balancing Rasayana and the primary herb for Rasa and Rakta Dhatu nourishment. Cools, lubricates, and builds Ojas. The feminine counterpart to Ashwagandha. Essential for Artava Dhatu, Ranjaka Pitta, and dry/inflamed Srotamsi. Dose: 1 tsp in warm milk, morning and evening.' },
      { term: 'Brahmi', transliteration: 'brāh-mī', translation: 'Expansion of Consciousness / Bacopa monnieri', description: 'The supreme Majja Dhatu herb — nourishes all nerve tissue and brain. Clears Tarpaka Kapha from the sinuses while tonifying the nervous system. Reduces Prana Vata disturbance in the Bhrumadhya region. External: Brahmi oil for scalp and third-eye application. Internal: 500mg with ghee after meals.' },
      { term: 'Triphala', transliteration: 'tri-pha-lā', translation: 'Three Fruits (Amalaki + Bibhitaki + Haritaki)', description: 'The most versatile Ayurvedic formula. Not primarily a laxative — it is a tridoshic Rasayana that gently cleanses all Srotamsi, restores Agni, and nourishes all 7 Dhatus simultaneously. The only substance that reduces Ama without depleting Ojas. Dose: ½ tsp in warm water before sleep.' },
      { term: 'Trikatu', transliteration: 'tri-ka-ṭu', translation: 'Three Pungents (Ginger + Black Pepper + Long Pepper)', description: 'The primary Ama-burning formula. Sharp, hot, penetrating — lights digestive fire and burns Ama from the channels. Essential for Manda and Vishama Agni. Dose: ¼ tsp in warm water or honey before meals. Contraindicated in Tikshna Agni and acute Pitta excess.' },
      { term: 'Guduchi', transliteration: 'gu-dū-chī', translation: 'Tinospora cordifolia / Amrita (Nectar of Immortality)', description: 'The supreme immune-modulating herb in Agastya\'s pharmacopeia. Neither heating nor cooling — it reads the body\'s need. Reduces Ama, rebuilds Ojas, balances all three Doshas. Particularly powerful for Raktavaha Srotas inflammation, chronic fever, and auto-immune patterns. Called Amrita — the nectar that conquered death.' },
      { term: 'Amalaki', transliteration: 'ā-ma-la-kī', translation: 'Emblic Myrobalan / Phyllanthus emblica', description: 'The highest natural Vitamin C source and the single best Pitta-reducing Rasayana. Rebuilds Rakta Dhatu, Rasa Dhatu, and Ojas. Rejuvenates Bhrajaka Pitta (skin), Alochaka Pitta (eyes), and Ranjaka Pitta (liver). One of the three fruits in Triphala. The fruit Agastya used for longevity.' },
      { term: 'Haritaki', transliteration: 'ha-rī-ta-kī', translation: 'Terminalia chebula / Remover of Disease', description: 'The king of herbs for Vata. The primary colon-restoring herb — rekindles Apana Vata and clears Purishavaha Srotas. Agastya says: "Haritaki is the mother — it nurtures and clears simultaneously." Unrivaled for nerve tissue support, longevity, and the elimination of deep Ama from Majja Dhatu.' },
      { term: 'Bala', transliteration: 'ba-lā', translation: 'Strength / Sida cordifolia', description: 'The supreme Mamsa and Majja Dhatu builder. Rebuilds strength after depletion, chronic illness, or Vata-wasting conditions. The primary herb for Vyana Vata weakness (poor circulation, peripheral numbness). Combined with Ashwagandha for the deepest tissue-building protocol.' },
    ],
  },
  {
    id: 'rasa_guna',
    label: 'Rasa & Guna — Taste & Quality',
    glyph: '⬡',
    entries: [
      { term: 'Madhura', transliteration: 'mad-hu-ra', translation: 'Sweet Taste', description: 'Reduces Vata and Pitta. Increases Kapha. The taste of nourishment, love, and tissue building. Foods: ghee, milk, rice, wheat, sweet fruit, licorice, Shatavari. The dominant taste of all Rasayanas — the reason they build Ojas.' },
      { term: 'Amla', transliteration: 'am-la', translation: 'Sour Taste', description: 'Reduces Vata. Increases Pitta and Kapha. Stimulates Agni and salivation. The taste of digestion and absorption. Foods: lemon, fermented foods, tamarind, most citrus. Sour foods carry substances into the bloodstream more effectively — they open Srotamsi.' },
      { term: 'Lavana', transliteration: 'la-va-ṇa', translation: 'Salty Taste', description: 'Reduces Vata. Increases Pitta and Kapha. Draws water into the tissues, lubricates, and stimulates digestion. The taste of mineral intelligence — the body needs trace mineral salts for Nadi conductivity. Rock salt (Saindhava) is the most sattvic salt in Agastya\'s pharmacopeia.' },
      { term: 'Katu', transliteration: 'ka-ṭu', translation: 'Pungent / Spicy Taste', description: 'Reduces Kapha. Increases Vata and Pitta. The taste of fire — stimulates Agni, burns Ama, opens channels, promotes circulation. Foods: ginger, pepper, chili, garlic, mustard. Trikatu formula is three pungent tastes combined. Essential for Manda Agni but depletes Ojas with overuse.' },
      { term: 'Tikta', transliteration: 'tik-ta', translation: 'Bitter Taste', description: 'Reduces Pitta and Kapha. Increases Vata. The taste of purification — clears heat, reduces inflammation, burns Ama from Raktavaha Srotas. The most Ama-clearing taste for heat-based conditions. Foods: turmeric, neem, bitter melon, dandelion. Critical for liver (Ranjaka Pitta) detoxification.' },
      { term: 'Kashaya', transliteration: 'ka-ṣā-ya', translation: 'Astringent Taste', description: 'Reduces Pitta and Kapha. Increases Vata. Tightens, dries, stops bleeding, consolidates tissue. The taste of completion and containment. Foods: pomegranate, unripe banana, beans, most legumes. Triphala\'s therapeutic action is primarily astringent — it tones all channels without drying the body.' },
      { term: 'Guru', transliteration: 'gu-ru', translation: 'Heavy Quality', description: 'One of the 20 primary qualities (Gunas) in Ayurvedic pharmacology. Guru (heavy) reduces Vata and Pitta. Builds tissue. Foods: wheat, cheese, meat, oil. The opposite quality is Laghu (light). All prescription decisions are based on matching or opposing these 20 qualities.' },
      { term: 'Sattvic / Rajasic / Tamasic', transliteration: 'sat-tva / ra-jas / ta-mas', translation: 'The Three Mental Qualities (Trigunas)', description: 'Sattva: clarity, harmony, intelligence — the quality Agastya cultivates through all prescriptions. Rajas: activity, passion, agitation — food, lifestyle, and emotions that increase it create mental Ama. Tamas: inertia, heaviness, unconsciousness — excess leads to depression, dullness, and disconnection from Prana.' },
    ],
  },
  {
    id: 'practices',
    label: 'Dinacharya & Practices',
    glyph: '☀',
    entries: [
      { term: 'Dinacharya', transliteration: 'di-nā-cā-ryā', translation: 'Daily Rhythm / Daily Discipline', description: 'The Ayurvedic framework for living in alignment with the sun\'s movement. The single most powerful health intervention — more powerful than any herb. When Dinacharya is established, most chronic Vata imbalances resolve without medication. Core: wake before sunrise, evacuate, oil the body, practice, eat with the sun.' },
      { term: 'Brahma Muhurta', transliteration: 'brah-ma mu-hūr-ta', translation: 'Hour of Brahma / 90 min before sunrise', description: 'The most Sattvic period of the 24-hour cycle — approximately 4:30–6:00 AM. The Nadi matrix is most receptive during this time. Prana Vata is ascending. Any practice (meditation, pranayama, mantra, asana) performed during Brahma Muhurta is 4× more effective than the same practice at any other time.' },
      { term: 'Abhyanga', transliteration: 'ab-hy-an-ga', translation: 'Oil Self-Massage', description: 'Daily warm oil application to the entire body. The foundational Vata-balancing practice. Sesame oil for Vata and Kapha constitutions. Coconut oil for Pitta. Performs the following simultaneously: lubricates all Srotamsi from the outside, stimulates Marma points, nourishes Mamsa and Meda Dhatu through the skin, calms the nervous system. 15 minutes minimum, before bathing.' },
      { term: 'Shirodhara', transliteration: 'śi-ro-dhā-rā', translation: 'Head Oil Stream', description: 'The continuous dripping of warm oil (usually sesame or Brahmi oil) onto the Bhrumadhya and forehead. The most powerful treatment for Prana Vata disorders: anxiety, insomnia, traumatic stress, seizure conditions, and the "disconnected mind." Directly nourishes Tarpaka Kapha and calms the entire nervous system.' },
      { term: 'Nasya', transliteration: 'nas-ya', translation: 'Nasal Oil Application', description: 'Application of medicated oil into the nostrils. The nose is the direct route to the brain in Siddha medicine — Nasya delivers medicine directly to Tarpaka Kapha, Prana Vata (head), and the Bhrumadhya Marma. 2–5 drops of Brahmi or Anu Taila oil each nostril, morning on empty stomach. Clears sinus Kapha, sharpens sense perception, improves memory.' },
      { term: 'Pranayama', transliteration: 'prā-ṇā-yā-ma', translation: 'Breath Control / Prana Extension', description: 'The direct technology of Nadi purification. Nadi Shodhana (alternate nostril breathing): the primary practice for Vata-calming and Nadi coherence. Kapalabhati: Agni-kindling breath for Kapha excess and Ama burning. Bhramari: the humming bee breath — Agastya\'s first prescription for Manovaha Srotas blockage.' },
      { term: 'Rasayana', transliteration: 'ra-sā-ya-na', translation: 'Rejuvenation Therapy / Path of Rasa', description: 'The highest branch of Ayurveda — the science of prolonging life and restoring youthful vitality through the deepest tissue nourishment. Named after Rasa Dhatu because true Rasayana nourishes all 7 Dhatus sequentially. Must be preceded by Ama Pachana — tonifying a body full of Ama makes the problem worse.' },
    ],
  },
];

interface AyurvedaLexiconProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AyurvedaLexicon: React.FC<AyurvedaLexiconProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('doshas');
  const [search, setSearch] = useState('');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const activeEntries = useMemo(() => {
    const cat = LEXICON_DATA.find(c => c.id === activeCategory);
    if (!cat) return [];
    if (!search.trim()) return cat.entries;
    const q = search.toLowerCase();
    return cat.entries.filter(e =>
      e.term.toLowerCase().includes(q) ||
      e.translation.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  }, [activeCategory, search]);

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483647,
            display: 'flex', alignItems: 'stretch', justifyContent: 'center',
            padding: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(5,5,5,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            style={{
              position: 'relative', width: 'min(100%, 620px)',
              height: 'calc(100dvh - 28px)',
              display: 'flex', flexDirection: 'column',
              background: 'linear-gradient(180deg, hsl(29 73% 7%) 0%, hsl(24 62% 3%) 100%)',
              border: '1px solid rgba(212,175,55,0.18)',
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: '0 30px 90px rgba(212,175,55,0.08)',
            }}
          >
            {/* Gold top bar */}
            <div style={{ height: 2, flexShrink: 0, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)', opacity: 0.8 }} />

            {/* Header */}
            <div style={{
              padding: '16px 18px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid rgba(212,175,55,0.16)',
              background: 'linear-gradient(180deg, rgba(212,175,55,0.05), transparent)',
              flexShrink: 0,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(212,175,55,0.38)',
                background: 'radial-gradient(circle at 35% 35%, rgba(212,175,55,0.18), rgba(212,175,55,0.04))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#D4AF37', fontSize: 18, flexShrink: 0,
              }}>
                📜
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#D4AF37', fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700 }}>
                  Sanskrit Lexicon
                </div>
                <div style={{ marginTop: 2, color: 'rgba(212,175,55,0.6)', fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                  AYURVEDIC TERMS · AGASTYA'S VOCABULARY
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid rgba(212,175,55,0.18)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 18, flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '10px 18px', flexShrink: 0 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search terms, translations, descriptions..."
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 12, color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'inherit', fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Category tabs */}
            <div style={{
              display: 'flex', gap: 6, padding: '0 18px 10px',
              overflowX: 'auto', flexShrink: 0,
              scrollbarWidth: 'none',
            }}>
              {LEXICON_DATA.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setActiveCategory(cat.id); setSearch(''); setExpandedTerm(null); }}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: `1px solid ${activeCategory === cat.id ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.15)'}`,
                    background: activeCategory === cat.id ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: activeCategory === cat.id ? '#D4AF37' : 'rgba(212,175,55,0.5)',
                    fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span>{cat.glyph}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Entries list */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '4px 18px 18px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(212,175,55,0.15) transparent',
            }}>
              {activeEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(212,175,55,0.4)', fontSize: 13 }}>
                  No terms found for "{search}"
                </div>
              ) : (
                activeEntries.map((entry) => {
                  const isExpanded = expandedTerm === entry.term;
                  return (
                    <div
                      key={entry.term}
                      style={{
                        marginBottom: 8,
                        background: isExpanded ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isExpanded ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 16,
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedTerm(isExpanded ? null : entry.term)}
                        style={{
                          width: '100%', padding: '12px 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ color: '#D4AF37', fontSize: 15, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>
                              {entry.term}
                            </span>
                            {entry.transliteration && (
                              <span style={{ color: 'rgba(212,175,55,0.45)', fontSize: 10, fontStyle: 'italic' }}>
                                {entry.transliteration}
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
                            {entry.translation}
                          </div>
                        </div>
                        <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: 16, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
                          ▾
                        </span>
                      </button>
                      {isExpanded && (
                        <div style={{
                          padding: '0 16px 14px',
                          color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7,
                          borderTop: '1px solid rgba(212,175,55,0.1)',
                          paddingTop: 12,
                        }}>
                          {entry.description}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
};
