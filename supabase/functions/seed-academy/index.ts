import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const modules = [
  {
    "module_number": 1,
    "phase": 1,
    "title": "The Origin Story: What Is Ayurveda & Siddha Medicine?",
    "subtitle": "Lineage of the 18 Siddhars",
    "description": "Ayurveda etymology; Charaka, Sushruta, Ashtanga Hridayam; 18 Siddhars and Agastyar lineage.",
    "tier_required": "free",
    "duration_minutes": 45,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 2,
    "phase": 1,
    "title": "The Five Great Elements (Panchamahabhuta)",
    "subtitle": "Akasha to Prithvi",
    "description": "Akasha, Vayu, Tejas, Apas, Prithvi \u2014 how they compose matter and disease.",
    "tier_required": "free",
    "duration_minutes": 60,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 3,
    "phase": 1,
    "title": "The Three Doshas: Your Cosmic Blueprint",
    "subtitle": "Vata, Pitta, Kapha",
    "description": "Prakriti vs Vikriti; seven Prakriti types; dosha quiz.",
    "tier_required": "free",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 4,
    "phase": 1,
    "title": "The Three Humors of Siddha: Mukkuttram",
    "subtitle": "Vatham, Pitham, Kabam",
    "description": "Ten Vatha types; Siddha nuance beyond Tridosha.",
    "tier_required": "free",
    "duration_minutes": 90,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 5,
    "phase": 1,
    "title": "The Seven Dhatus: Your Body's Fabric",
    "subtitle": "Rasa to Shukra",
    "description": "Rasa through Shukra/Artava; Ojas as eighth subtle dhatu.",
    "tier_required": "free",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 6,
    "phase": 1,
    "title": "Agni: The Sacred Digestive Fire",
    "subtitle": "Jatharagni & 13 Agnis",
    "description": "Jatharagni; four states and thirteen Agnis; Ama; daily practices.",
    "tier_required": "free",
    "duration_minutes": 60,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 7,
    "phase": 1,
    "title": "The Three Malas: Waste Intelligence",
    "subtitle": "Purisha, Mutra, Sweda",
    "description": "Mala as diagnostic tool in Siddha pulse reading.",
    "tier_required": "free",
    "duration_minutes": 45,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 8,
    "phase": 1,
    "title": "Ayurvedic Daily Routine (Dinacharya)",
    "subtitle": "Brahma Muhurta to Ratricharya",
    "description": "Tongue, nasya, abhyanga; morning to night Siddha protocol.",
    "tier_required": "free",
    "duration_minutes": 120,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 9,
    "phase": 1,
    "title": "Seasonal Routine (Ritucharya)",
    "subtitle": "Six Sacred Seasons",
    "description": "Six ritus; foods and routines for each season.",
    "tier_required": "free",
    "duration_minutes": 60,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 10,
    "phase": 1,
    "title": "The Ayurvedic Kitchen: Food as First Medicine",
    "subtitle": "Shad Rasa",
    "description": "Shad rasa; Virya, Vipaka, Prabhava; foundational foods by dosha.",
    "tier_required": "free",
    "duration_minutes": 120,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 11,
    "phase": 1,
    "title": "Introduction to Siddha Herbs (Padardha Guna)",
    "subtitle": "25 Foundational Herbs",
    "description": "Classification; 25 foundational herbs; taste-potency-effect.",
    "tier_required": "free",
    "duration_minutes": 90,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 12,
    "phase": 1,
    "title": "The Breath of Life: Pranayama Fundamentals",
    "subtitle": "Five Pranas",
    "description": "Five pranas; Nadi Shodhana, Bhastrika, Ujjayi, Bhramari.",
    "tier_required": "free",
    "duration_minutes": 120,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 13,
    "phase": 1,
    "title": "Srotas: The 13 Channel Systems",
    "subtitle": "Body's River Network",
    "description": "Macro and micro channel mapping; blockage patterns by dosha.",
    "tier_required": "free",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 14,
    "phase": 1,
    "title": "The Mind in Ayurveda: Manas, Buddhi, Ahamkara",
    "subtitle": "Three Layers of Mind",
    "description": "Three gunas of mind; sattvic, rajasic, tamasic constitutions.",
    "tier_required": "free",
    "duration_minutes": 60,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 15,
    "phase": 1,
    "title": "Ojas, Tejas, Prana: The Three Vital Essences",
    "subtitle": "Subtle Body Fuels",
    "description": "Building Ojas; depleting habits; Rasayana herbs.",
    "tier_required": "free",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 16,
    "phase": 1,
    "title": "Nadi: The 72,000 Energy Channels",
    "subtitle": "Ida, Pingala, Sushumna",
    "description": "Three main nadis; 14 principal channels; Siddha nadi reading intro.",
    "tier_required": "free",
    "duration_minutes": 60,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 17,
    "phase": 1,
    "title": "Marma Points: The 107 Vital Points",
    "subtitle": "Sacred Body Map",
    "description": "Classification; 10 master marmans; self-care touch protocols.",
    "tier_required": "free",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 18,
    "phase": 1,
    "title": "Pulse Diagnosis Fundamentals (Nadi Pariksha)",
    "subtitle": "Reading the River of Life",
    "description": "Three-finger technique; Vata/Pitta/Kapha pulses.",
    "tier_required": "free",
    "duration_minutes": 120,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 19,
    "phase": 1,
    "title": "Tongue, Eyes, Nails: Siddha Diagnostic Triad",
    "subtitle": "Visual Diagnosis",
    "description": "Ashtavidha Pariksha; colour, coating, and shape mapping.",
    "tier_required": "free",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 20,
    "phase": 1,
    "title": "Chakras & Doshas: The Energy-Body Map",
    "subtitle": "Seven Centres Decoded",
    "description": "Dosha-chakra correspondence; blockage symptoms; activation.",
    "tier_required": "free",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 21,
    "phase": 1,
    "title": "Emotional Ama: Storing Trauma in the Body",
    "subtitle": "Psychosomatic Ayurveda",
    "description": "Unprocessed emotion as toxin; grief in lungs, fear in kidneys.",
    "tier_required": "free",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 22,
    "phase": 1,
    "title": "Phase 1 Integration: Your Prakriti Blueprint",
    "subtitle": "Living Your Constitution",
    "description": "Synthesising all Phase 1 knowledge into a personal daily plan.",
    "tier_required": "free",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 23,
    "phase": 2,
    "title": "What Is Panchakarma? The Five Sacred Purifications",
    "subtitle": "Ancient Detox Science",
    "description": "Vamana, Virechana, Basti, Nasya, Raktamokshana \u2014 theory and safety.",
    "tier_required": "prana-flow",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 24,
    "phase": 2,
    "title": "Purvakarma: Preparing the Body for Cleansing",
    "subtitle": "Snehana & Swedana",
    "description": "Oil therapy and herbal steam; home-safe Purvakarma protocols.",
    "tier_required": "prana-flow",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 25,
    "phase": 2,
    "title": "Vamana: Therapeutic Emesis",
    "subtitle": "Releasing Kapha Toxins",
    "description": "Indications, contraindications, preparation, post-care.",
    "tier_required": "prana-flow",
    "duration_minutes": 60,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 26,
    "phase": 2,
    "title": "Virechana: The Sacred Purgation",
    "subtitle": "Pitta Deep Cleanse",
    "description": "Castor oil, Triphala, Senna protocols; safe home practice.",
    "tier_required": "prana-flow",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 27,
    "phase": 2,
    "title": "Basti: Medicated Enema Therapy",
    "subtitle": "Colon Intelligence",
    "description": "Anuvasana and Niruha basti; Vata regulation; oil vs decoction.",
    "tier_required": "prana-flow",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 28,
    "phase": 2,
    "title": "Nasya: Nasal Pathway to the Brain",
    "subtitle": "Gateway to Prana",
    "description": "Pratimarsha nasya for daily use; Marsha nasya; oils by dosha.",
    "tier_required": "prana-flow",
    "duration_minutes": 60,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 29,
    "phase": 2,
    "title": "Raktamokshana: Blood Purification",
    "subtitle": "Leech & Herb Therapy",
    "description": "Jalaukavacharana; blood-purifying herbs: Manjistha, Neem, Sariva.",
    "tier_required": "prana-flow",
    "duration_minutes": 60,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 30,
    "phase": 2,
    "title": "Abhyanga: The Art of Siddha Oil Massage",
    "subtitle": "Daily Oil Practice",
    "description": "Self-abhyanga step-by-step; oils by dosha; Kaya Kalpa protocol.",
    "tier_required": "prana-flow",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 31,
    "phase": 2,
    "title": "Shirodhara: The Third Eye Oil Stream",
    "subtitle": "Nervous System Reset",
    "description": "Home shirodhara setup; oils; duration; contraindications.",
    "tier_required": "prana-flow",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 32,
    "phase": 2,
    "title": "Svedana: Herbal Steam Therapy",
    "subtitle": "Sweat Out Ama",
    "description": "Bashpa sveda; pinda sveda; home steam box protocol.",
    "tier_required": "prana-flow",
    "duration_minutes": 60,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 33,
    "phase": 2,
    "title": "Kati Basti & Janu Basti: Localised Oil Pooling",
    "subtitle": "Spine & Joint Healing",
    "description": "Lower back, knee, neck oil retention; DIY dough ring.",
    "tier_required": "prana-flow",
    "duration_minutes": 75,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 34,
    "phase": 2,
    "title": "Dinacharya Advanced: Oil Pulling & Gandusha",
    "subtitle": "Oral Microbiome",
    "description": "Kavala vs Gandusha; sesame oil pulling; tongue scraping advanced.",
    "tier_required": "prana-flow",
    "duration_minutes": 45,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 35,
    "phase": 2,
    "title": "Agastyar's 18 Master Herbs: Deep Study",
    "subtitle": "The Sacred Pharmacopeia",
    "description": "Ashwagandha, Brahmi, Shatavari, Triphala, Trikatu and 13 more.",
    "tier_required": "prana-flow",
    "duration_minutes": 120,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 36,
    "phase": 2,
    "title": "Rasayana: The Art of Rejuvenation",
    "subtitle": "Anti-Ageing Alchemy",
    "description": "Chyawanprash; Amalaki Rasayana; Shilajit; lunar timing.",
    "tier_required": "prana-flow",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 37,
    "phase": 2,
    "title": "Vajikarana: Sacred Sexual Vitality",
    "subtitle": "Ojas Cultivation",
    "description": "Shukra dhatu; Brahmacharya principles; Ojas-building practices.",
    "tier_required": "prana-flow",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 38,
    "phase": 2,
    "title": "Ayurvedic Psychology: Sattvavajaya",
    "subtitle": "Mind Medicine",
    "description": "Mantra therapy; Daiva Vyapashraya; Yuktivyapashraya.",
    "tier_required": "prana-flow",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 39,
    "phase": 2,
    "title": "Siddha Varma Therapy: Pressure Point Healing",
    "subtitle": "Tamil Martial Medicine",
    "description": "12 key Varma points; activation and deactivation.",
    "tier_required": "prana-flow",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 40,
    "phase": 2,
    "title": "Agastyar Kuzhambu: Classical Siddha Formulas",
    "subtitle": "Ancient Preparations",
    "description": "Mezhugu, Chendooram, Kudineer, Chooranam \u2014 five types.",
    "tier_required": "prana-flow",
    "duration_minutes": 75,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 41,
    "phase": 2,
    "title": "Lepa: Herbal Pastes & External Applications",
    "subtitle": "Skin as the Third Lung",
    "description": "Dosha-specific face and body pastes; Kumkumadi tailam.",
    "tier_required": "prana-flow",
    "duration_minutes": 60,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 42,
    "phase": 2,
    "title": "Fasting & Langhana: Lightening Therapy",
    "subtitle": "Strategic Starvation",
    "description": "Complete fast vs partial fast; juice fasting; Ekadashi.",
    "tier_required": "prana-flow",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 43,
    "phase": 2,
    "title": "Water as Medicine: Ushapan & Copper Water",
    "subtitle": "Jala Chikitsa",
    "description": "Morning water ritual; copper vessel science; charged water.",
    "tier_required": "prana-flow",
    "duration_minutes": 45,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 44,
    "phase": 2,
    "title": "Phase 2 Integration: Your Cleansing Protocol",
    "subtitle": "Designing Your Panchakarma",
    "description": "Creating a personalised seasonal cleanse; 21-day template.",
    "tier_required": "prana-flow",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 45,
    "phase": 3,
    "title": "Advanced Nadi Pariksha: Reading Disease Before Symptoms",
    "subtitle": "Predictive Pulse Science",
    "description": "Seven-layer pulse; gati, vega, bala, tala analysis.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 120,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 46,
    "phase": 3,
    "title": "Siddha Ennai Murai: Advanced Oil Formulation",
    "subtitle": "Classical Oil Science",
    "description": "Tailam preparation; Kshirapaka; medicated ghee; lunar timing.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 47,
    "phase": 3,
    "title": "Marma Chikitsa: Full Therapeutic Protocol",
    "subtitle": "107 Points in Practice",
    "description": "Clinical sequences for pain, digestion, immunity, mental health.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 48,
    "phase": 3,
    "title": "Agastyar's Pulse Reading of the 18 Diseases",
    "subtitle": "Tamil Nadi Diagnosis",
    "description": "Eighteen Siddha disease categories mapped to pulse signatures.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 49,
    "phase": 3,
    "title": "Panchendriya Pariksha: Five Sense Diagnosis",
    "subtitle": "Sensory Clinical Assessment",
    "description": "Hearing, vision, smell, taste, touch as diagnostic instruments.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 75,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 50,
    "phase": 3,
    "title": "Kriya Yoga & Ayurveda: The Siddha Path of Action",
    "subtitle": "Tapas, Svadhyaya, Ishvarapranidhana",
    "description": "Purification through discipline; self-study; surrender.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 51,
    "phase": 3,
    "title": "Kaya Kalpa: The 7-Year Cell Renewal Protocol",
    "subtitle": "Physical Immortality Science",
    "description": "Agastyar Kaya Kalpa; Thirumoolar's method; longevity science.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 120,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 52,
    "phase": 3,
    "title": "Agni Karma: Therapeutic Cauterisation",
    "subtitle": "Fire Healing",
    "description": "Indications; metallic probes; modern equivalent heat therapies.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 60,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 53,
    "phase": 3,
    "title": "Ksharasutra: Alkaline Thread Therapy",
    "subtitle": "Ancient Surgical Healing",
    "description": "Fistula and fissure treatment; medicated thread preparation.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 60,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 54,
    "phase": 3,
    "title": "Asthi & Sandhi Chikitsa: Bone & Joint Medicine",
    "subtitle": "Skeletal Restoration",
    "description": "Guggulu formulas; Dashamoola; joint-specific marma sequences.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 55,
    "phase": 3,
    "title": "Hridaya Roga: Cardiovascular Ayurveda",
    "subtitle": "Heart as Sacred Seat",
    "description": "Arjuna, Pushkarmool, Brahmi for heart; dosha patterns.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 56,
    "phase": 3,
    "title": "Prameha & Madhumeha: Diabetes in Siddha",
    "subtitle": "Twenty Types of Prameha",
    "description": "Bitter melon, Gymnema, Fenugreek; lifestyle protocols.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 57,
    "phase": 3,
    "title": "Sthaulya & Karshya: Weight Intelligence",
    "subtitle": "Excess & Deficiency",
    "description": "Obesity from Kapha vs Vata wasting; Medodhatu protocols.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 58,
    "phase": 3,
    "title": "Striroga: Women's Ayurvedic Medicine",
    "subtitle": "Shakti Health Science",
    "description": "Menstrual protocols; Shatavari; fertility; menopause.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 120,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 59,
    "phase": 3,
    "title": "Balroga: Children's Ayurveda",
    "subtitle": "Kaumarabhritya",
    "description": "Childhood Prakriti; Graha Roga; feeding practices.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 75,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 60,
    "phase": 3,
    "title": "Geriatric Ayurveda: Jara Chikitsa",
    "subtitle": "Ageing with Grace",
    "description": "Vata in ageing; Chyawanprash; Bhallataka; longevity diet.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 61,
    "phase": 3,
    "title": "Manas Roga: Mental Disease Classification",
    "subtitle": "Ayurvedic Psychiatry",
    "description": "Unmada, Apasmara, Atatvabhinivesha \u2014 three mental disorder types.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 62,
    "phase": 3,
    "title": "Siddha Astrology & Medicine: Jyotish Body Map",
    "subtitle": "Planetary Body Correlation",
    "description": "Nine planets mapped to organs; Graha Shanti herbs.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 63,
    "phase": 3,
    "title": "Vikriti Assessment: Reading Current Imbalance",
    "subtitle": "Dynamic Diagnosis",
    "description": "Seasonal Vikriti; emotional Vikriti; shifting back to Prakriti.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 64,
    "phase": 3,
    "title": "Sacred Sound Healing in Siddha",
    "subtitle": "Nada Chikitsa",
    "description": "Beeja mantras as medicine; 432 Hz and 528 Hz science.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 65,
    "phase": 3,
    "title": "Agastyar's Cosmology: Disease as Sacred Message",
    "subtitle": "Roga as Dharma",
    "description": "Karma theory of disease; the healing crisis; acceptance as medicine.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 66,
    "phase": 3,
    "title": "Phase 3 Integration: Clinical Case Studies",
    "subtitle": "Real Siddha Cases",
    "description": "Five classical Siddha cases; diagnosis-to-treatment mapping.",
    "tier_required": "siddha-quantum",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 67,
    "phase": 4,
    "title": "Rasa Shastra: The Science of Mercury Alchemy",
    "subtitle": "Parada \u2014 Sacred Mercury",
    "description": "Shodana; Marana; Bhasma preparation.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 120,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 68,
    "phase": 4,
    "title": "Navaratna Chikitsa: Nine Gem Therapy",
    "subtitle": "Jewels as Medicine",
    "description": "Planetary gem correspondences; gem elixirs; Mani Mantra therapy.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 69,
    "phase": 4,
    "title": "Agastyar's Muppu: The Three Mineral Trinity",
    "subtitle": "The Philosopher's Stone of Siddha",
    "description": "Kalluppu, Pottukkallu, Nattu uppu \u2014 Siddha's ultimate formula.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 120,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 70,
    "phase": 4,
    "title": "Jyotish & Ayurveda Integration",
    "subtitle": "Timing Healing with Stars",
    "description": "Muhurta for treatment; planetary herbs; nakshatra medicine.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 71,
    "phase": 4,
    "title": "Dravyaguna Shastra: Advanced Materia Medica",
    "subtitle": "200 Siddha Plants",
    "description": "Rasa, Guna, Virya, Vipaka, Prabhava of 200 classical plants.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 120,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 72,
    "phase": 4,
    "title": "Shodhana of Heavy Metals: Classical Purification",
    "subtitle": "Gold, Silver, Iron, Copper",
    "description": "Classical processing; Swarna Bhasma and Lauha Bhasma.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 73,
    "phase": 4,
    "title": "The Siddha Siddhis: Supernatural Healing Powers",
    "subtitle": "Eight Classical Powers",
    "description": "Ashta Siddhis in the context of healing; Thirumoolar.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 74,
    "phase": 4,
    "title": "Agastyar's 216 Pathologies: Complete Classification",
    "subtitle": "Disease Codex",
    "description": "The 216 diseases of the Agastyar Samhita mapped to modern conditions.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 120,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 75,
    "phase": 4,
    "title": "Pancha Bootham Chikitsa: Elemental Therapy",
    "subtitle": "Treating with Elements",
    "description": "Earth, water, fire, air, ether as direct therapeutic agents.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 76,
    "phase": 4,
    "title": "Thirumanthiram & Medicine: Mystical Physiology",
    "subtitle": "Yogic Body Science",
    "description": "Kundalini and disease; Thirumoolar on prana and longevity.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 77,
    "phase": 4,
    "title": "Mantra Chikitsa: Sound as Medicine",
    "subtitle": "Vibrational Pharmacy",
    "description": "Disease-specific mantras; Dhanvantari mantra; daily healing chant.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 78,
    "phase": 4,
    "title": "Yantra Vidya: Sacred Geometry Healing",
    "subtitle": "Living Diagrams",
    "description": "Sri Yantra; Dhanvantari Yantra; wearing vs worshipping.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 65,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 79,
    "phase": 4,
    "title": "Tantra & Ayurveda: The Hidden Layer",
    "subtitle": "Shakti Medicine",
    "description": "Tantric use of herbs; Shakti activation protocols.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 80,
    "phase": 4,
    "title": "Tribal & Forest Medicine: The Living Pharmacopeia",
    "subtitle": "Jungle Healers of Tamil Nadu",
    "description": "Kani tribe medicine; Toda healing practices.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 81,
    "phase": 4,
    "title": "Agastyar's Longevity Diet: The Immortality Protocol",
    "subtitle": "Kaya Kalpa Nutrition",
    "description": "Specific foods eaten by Agastyar; anti-ageing food combining.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 82,
    "phase": 4,
    "title": "Shamanic Ayurveda: Plant Spirits & Devatas",
    "subtitle": "Living Intelligence of Plants",
    "description": "Connecting with the devata of Tulsi, Ashwagandha, Brahmi.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 83,
    "phase": 4,
    "title": "Siddha and the Subtle Body: Pranamaya Kosha",
    "subtitle": "Pranic Healing",
    "description": "Five koshas; healing at the pranic level.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 84,
    "phase": 4,
    "title": "Bhrigu Nadi & Medical Astrology",
    "subtitle": "Reading Karmic Disease",
    "description": "Bhrigu Samhita medical entries; past-life cause of disease.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 85,
    "phase": 4,
    "title": "Agastyar on Death & Regeneration",
    "subtitle": "Alchemy of Dying",
    "description": "Marana Kala rituals; smooth passage; Siddha blessings for the dying.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 86,
    "phase": 4,
    "title": "The Siddha Guru-Shishya Transmission",
    "subtitle": "Lineage as Medicine",
    "description": "Shakti transmission in healing; initiation; the role of the Guru.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 60,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 87,
    "phase": 4,
    "title": "Phase 4 Integration: Mastery Assessment",
    "subtitle": "The Vaidya Examination",
    "description": "Case study exam; 50 classical questions; self-evaluation.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 88,
    "phase": 5,
    "title": "The Akasha Records & Healing",
    "subtitle": "Reading Cosmic Memory",
    "description": "Accessing Akashic blueprints for health.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 89,
    "phase": 5,
    "title": "Agastyar's Direct Transmission: Module 1",
    "subtitle": "Akasha Darshan",
    "description": "Channelled teaching from Agastyar on current collective disease.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 90,
    "phase": 5,
    "title": "Agastyar's Direct Transmission: Module 2",
    "subtitle": "The Water of Life",
    "description": "Teaching on Amrit \u2014 the nectar of immortality.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 91,
    "phase": 5,
    "title": "Scalar Wave Medicine: Science of the Future",
    "subtitle": "Beyond Electromagnetic",
    "description": "Scalar healing theory; Rife frequencies; Solfeggio in clinical use.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 92,
    "phase": 5,
    "title": "Quantum Biology & Ayurveda",
    "subtitle": "The Physics of Prana",
    "description": "Quantum coherence in biology; biophotons; structured water.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 93,
    "phase": 5,
    "title": "Morphic Fields & Herbal Memory",
    "subtitle": "Rupert Sheldrake Meets Siddha",
    "description": "Field resonance; why plants know what you need.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 94,
    "phase": 5,
    "title": "The SQI 2050 Healing Protocol",
    "subtitle": "AI + Ancient Wisdom",
    "description": "How SQI Bhakti-Algorithm synthesises Prakriti data.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 95,
    "phase": 5,
    "title": "Building a Siddha Medicine Practice",
    "subtitle": "The Vaidya's Path",
    "description": "Ethics; consultation structure; documentation.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 96,
    "phase": 5,
    "title": "Teaching Ayurveda: Becoming a Guide",
    "subtitle": "The Shishya Becomes Guru",
    "description": "Curriculum design; holding space; lineage responsibility.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 97,
    "phase": 5,
    "title": "Agastyar's Blessing Transmission",
    "subtitle": "Deeksha & Initiation",
    "description": "Sacred initiation audio; Agastyar mantra; anahata opening.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 60,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 98,
    "phase": 5,
    "title": "The Living Pharmacopeia: Growing Your Medicine Garden",
    "subtitle": "Sacred Plant Sanctuary",
    "description": "18 essential Siddha plants; growing, harvesting, preserving.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "video",
    "is_published": true
  },
  {
    "module_number": 99,
    "phase": 5,
    "title": "Siddha & Homeopathy: Vibrational Parallels",
    "subtitle": "Like Cures Like",
    "description": "Miasm theory vs Dosha; flower essences vs gem elixirs.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 100,
    "phase": 5,
    "title": "The 18 Siddhas as Healing Archetypes",
    "subtitle": "Each Master's Gift",
    "description": "Thirumoolar, Bogar, Patanjali, Konganar \u2014 each one's unique gift.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 101,
    "phase": 5,
    "title": "Advanced Bhasma Preparation",
    "subtitle": "Sacred Mineral Medicine",
    "description": "Seven-fold Shodhana; Marana; potency testing.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "pdf",
    "is_published": true
  },
  {
    "module_number": 102,
    "phase": 5,
    "title": "The Final Frontier: Death, Rebirth & Ayurveda",
    "subtitle": "Consciousness at Threshold",
    "description": "Consciousness during dying; Bardo of the healer.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 75,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 103,
    "phase": 5,
    "title": "Agastyar's Cosmological Medicine",
    "subtitle": "Universe as Patient",
    "description": "Treating the collective; planetary healing.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 104,
    "phase": 5,
    "title": "Nada Brahma: Sound as the Fabric of Existence",
    "subtitle": "The Final Transmission",
    "description": "OM as first medicine; silence as highest healing.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 90,
    "content_type": "audio",
    "is_published": true
  },
  {
    "module_number": 105,
    "phase": 5,
    "title": "Integrating All Five Phases: The Synthesis",
    "subtitle": "Siddha Ayurveda Mastery",
    "description": "Full synthesis; creating your life's Ayurvedic practice.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 106,
    "phase": 5,
    "title": "Your Sovereign Healing Blueprint",
    "subtitle": "Personal Prescription",
    "description": "AI-assisted personal protocol from all assessment data.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 120,
    "content_type": "interactive",
    "is_published": true
  },
  {
    "module_number": 107,
    "phase": 5,
    "title": "Agastyar Academy Certification Ceremony",
    "subtitle": "Initiation Complete",
    "description": "Certification; digital certificate; lineage acknowledgement.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 60,
    "content_type": "live",
    "is_published": true
  },
  {
    "module_number": 108,
    "phase": 5,
    "title": "The 108th Gate: Eternal Medicine",
    "subtitle": "Beyond the Academy",
    "description": "There is no end to healing. Agastyar's final blessing transmission.",
    "tier_required": "akasha-infinity",
    "duration_minutes": 108,
    "content_type": "audio",
    "is_published": true
  }
]

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Upsert in batches of 20
    const batchSize = 20
    const results = []
    for (let i = 0; i < modules.length; i += batchSize) {
      const batch = modules.slice(i, i + batchSize)
      const { error, count } = await supabase
        .from('ayurveda_courses')
        .upsert(batch, { onConflict: 'module_number' })
      if (error) {
        return new Response(JSON.stringify({ error: error.message, batch: i }), { status: 500 })
      }
      results.push({ batch: i, count: batch.length })
    }

    // Verify
    const { data: verify, count } = await supabase
      .from('ayurveda_courses')
      .select('module_number, phase, tier_required', { count: 'exact' })
      .order('module_number')

    const tiers: Record<string, number> = {}
    const phases: Record<string, number> = {}
    verify?.forEach(r => {
      tiers[r.tier_required] = (tiers[r.tier_required] || 0) + 1
      phases[`phase_${r.phase}`] = (phases[`phase_${r.phase}`] || 0) + 1
    })

    return new Response(JSON.stringify({
      success: true,
      total: count,
      tiers,
      phases,
      batches: results
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
