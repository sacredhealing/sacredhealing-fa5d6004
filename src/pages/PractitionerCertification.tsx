import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Lang = 'en' | 'sv' | 'no' | 'es';
const LANG_OPTS = [
  { code: 'en' as Lang, flag: '🇬🇧', label: 'English' },
  { code: 'sv' as Lang, flag: '🇸🇪', label: 'Svenska' },
  { code: 'no' as Lang, flag: '🇳🇴', label: 'Norsk' },
  { code: 'es' as Lang, flag: '🇪🇸', label: 'Español' },
];
const L = {
  monthLabel: { en:'MONTH', sv:'MÅNAD', no:'MÅNED', es:'MES' },
  init:       { en:'⚡ MONTHLY INITIATION', sv:'⚡ MÅNADSINITIERING', no:'⚡ MÅNEDLIG INNVIELSE', es:'⚡ INICIACIÓN MENSUAL' },
  teaching:   { en:'THE TEACHING', sv:'UNDERVISNINGEN', no:'UNDERVISNINGEN', es:'LA ENSEÑANZA' },
  weeks:      { en:'WEEK BY WEEK', sv:'VECKA FÖR VECKA', no:'UKE FOR UKE', es:'SEMANA A SEMANA' },
  med:        { en:'MEDITATION PRACTICE', sv:'MEDITATIONSÖVNING', no:'MEDITASJONSØVELSE', es:'MEDITACIÓN' },
  steps:      { en:'STEP-BY-STEP', sv:'STEG FÖR STEG', no:'TRINN FOR TRINN', es:'PASO A PASO' },
  mantra:     { en:'SACRED MANTRA', sv:'HELIG MANTRA', no:'HELLIG MANTRA', es:'MANTRA SAGRADO' },
  meaning:    { en:'MEANING', sv:'BETYDELSE', no:'BETYDNING', es:'SIGNIFICADO' },
  how:        { en:'HOW TO PRACTICE', sv:'HUR MAN PRAKTISERAR', no:'SLIK PRAKTISERER', es:'CÓMO PRACTICAR' },
  exercises:  { en:'PRACTICES & EXERCISES', sv:'ÖVNINGAR', no:'ØVELSER', es:'PRÁCTICAS' },
  reflect:    { en:'REFLECTION QUESTIONS', sv:'REFLEKTIONSFRÅGOR', no:'REFLEKSJONSSPØRSMÅL', es:'REFLEXIONES' },
  outcome:    { en:'MONTH OUTCOME', sv:'MÅNADSRESULTAT', no:'MÅNEDLIG RESULTAT', es:'RESULTADO DEL MES' },
  tabs:       { en:['CURRICULUM','INVEST','ABOUT'], sv:['KURSPLAN','INVESTERA','OM'], no:['PENSUM','INVESTER','OM'], es:['CURRÍCULO','INVERSIÓN','ACERCA'] },
  heroTitle:  { en:"The Siddha Healer's\nSovereign Path", sv:"Siddha-Helaren's\nSuveräna Väg", no:"Siddha-Heleren's\nSuverende Vei", es:"El Camino Soberano\ndel Sanador Siddha" },
  heroSub:    { en:'Complete 12-month healing education — full teachings, meditations, mantras and practices for every module', sv:'Komplett 12-månaders healingutbildning — fullständiga undervisningar, meditationer, mantran och övningar', no:'Komplett 12-måneders healingutdanning — fullstendige undervisninger, meditasjoner, mantras og øvelser', es:'Educación completa de sanación de 12 meses — enseñanzas, meditaciones, mantras y prácticas completas' },
  tags:       { en:['12 MONTHS','1 LIVE SESSION/MO','PERSONAL DIKSHA','CERTIFICATION'], sv:['12 MÅNADER','1 LIVESESSION/MÅN','PERSONLIG DIKSHA','CERTIFIERING'], no:['12 MÅNEDER','1 LIVØKT/MND','PERSONLIG DIKSHA','SERTIFISERING'], es:['12 MESES','1 SESIÓN EN VIVO/MES','DIKSHA PERSONAL','CERTIFICACIÓN'] },
  bestValue:  { en:'BEST VALUE', sv:'BÄST VÄRDE', no:'BEST VERDI', es:'MEJOR VALOR' },
  oneTime:    { en:'ONE-TIME PAYMENT', sv:'ENGÅNGSBETALNING', no:'ENGANGSBETALING', es:'PAGO ÚNICO' },
  fullYear:   { en:'Full year · Immediate access', sv:'Hela året · Omedelbar åtkomst', no:'Hele året · Umiddelbar tilgang', es:'Año completo · Acceso inmediato' },
  monthly:    { en:'MONTHLY PLAN', sv:'MÅNADSPLAN', no:'MÅNEDLIG PLAN', es:'PLAN MENSUAL' },
  perMonth:   { en:'per month · 12 months', sv:'per månad · 12 månader', no:'per måned · 12 måneder', es:'por mes · 12 meses' },
  enrollOnce: { en:'Enroll Now — €2,997', sv:'Anmäl dig — €2 997', no:'Meld deg på — €2 997', es:'Inscribirse — €2.997' },
  enrollM:    { en:'Start Monthly — €297/mo', sv:'Månadsvis — €297/mån', no:'Månedlig — €297/mnd', es:'Mensual — €297/mes' },
  processing: { en:'Processing...', sv:'Behandlar...', no:'Behandler...', es:'Procesando...' },
};
const t = (k: keyof typeof L, l: Lang) => (L[k] as Record<Lang,string>)[l] || (L[k] as Record<Lang,string>).en;
const ta = (k: 'tabs'|'tags', l: Lang) => (L[k] as Record<Lang,string[]>)[l] || (L[k] as Record<Lang,string[]>).en;


const MONTHS = [
{n:1,glyph:'☽',color:'#D4AF37',theme:['FOUNDATION','INITIATION'],
title:{en:'Prarabdha Awakening',sv:'Prarabdha-uppvaknande',no:'Prarabdha-oppvåkning',es:'Despertar de Prarabdha'},
sub:{en:'The Foundation — Entering the Field',sv:'Grunden — Att träda in i fältet',no:'Fundamentet — Å tre inn i feltet',es:'La Fundación — Entrando en el Campo'},
initiation:'Personal Diksha Transmission — Shaktipat via Siddha Nada. Kritagya transmits directly into your pranic field via sound, awakening your Sushumna Nadi and anchoring the Siddha lineage field into your energy body. You will feel warmth, tingling, or deep stillness during this transmission.',
teaching:`You are not beginning a course. You are entering a lineage. The 18 Siddhas — Agastya Muni, Babaji, Thirumoolar and the great masters — have been transmitting healing intelligence for thousands of years. In this first month, you are formally received into this field.

The human being is not a physical body with a spirit inside. You are a luminous field of prana — life force — temporarily condensed into form. This field has five layers called the Pancha Koshas: the physical body (Annamaya), the pranic body (Pranamaya), the mental-emotional body (Manomaya), the wisdom body (Vijnanamaya), and the bliss body (Anandamaya). Healing operates across all five layers simultaneously.

Your pranic body is organized through 72,000 Nadis — energy channels — and seven primary Chakras (energy vortices). The three most important Nadis are Ida (lunar, left channel), Pingala (solar, right channel), and Sushumna (the central channel). Before you can heal others, you must understand and sense your own pranic architecture. This month builds that foundation.`,
weeks:[
{title:'The Siddha Lineage & Your Pranic Architecture',content:'Study the 18 Siddhas and their transmissions. Begin daily aura sensing: sit quietly, extend hands 30cm from your body, slowly draw them inward feeling the boundary of your energy field. Journal what you notice. Begin OM NAMAH SHIVAYA 108x each morning before sunrise.'},
{title:'The Five Koshas — Mapping Your Energy Body',content:'Spend 10 minutes with each Kosha daily — feel the physical density, then pranic aliveness, then the emotional weather, then witnessing awareness, then the bliss underneath. Draw your five-body map in your journal. Notice which Kosha holds most tension in your life currently.'},
{title:'Pranic Anatomy — Nadis, Chakras, Vayus',content:'Study the 5 Vayus (Prana, Apana, Samana, Udana, Vyana). Practice identifying which Vayu is active or blocked today. Begin Nadi Shodhana (alternate nostril breathing) 15 minutes daily to balance Ida and Pingala.'},
{title:'Personal Energy Hygiene — Your Daily Protocol',content:'Build your complete daily practice: morning grounding (Bhumi Dharana), midday Nadi clearing, evening aura clearing and sealing. Practice with a partner — scan each other\'s field and share observations without judgment.'},
],
meditation:{name:'Bhumi Dharana — Earth Anchoring',duration:'21 minutes daily for minimum 21 days',steps:['Sit or stand barefoot on the earth, or visualize yourself on bare soil if indoors.','Close your eyes. Take 3 deep breaths, releasing tension on each exhale.','Visualize roots growing from the base of your spine downward through the earth — through the crust, mantle, reaching the iron core.','Feel the Earth\'s field pulsing up through your roots — red-orange light, dense, nourishing.','On each inhale, draw this Earth energy up through your roots, up your spine, filling your entire body.','On each exhale, release chaotic energy back down into the Earth to be neutralized.','After 15 minutes, seal: visualize a golden sphere of light surrounding your body, 60cm in all directions.','Say aloud 3 times: "I am grounded. I am anchored. I am here."','Open your eyes slowly. Stamp your feet. Drink water.']},
mantra:{text:'OM NAMAH SHIVAYA',pronunciation:'AUM (like "home") NA-MAH (bow the head) SHI-VA-YA (each syllable clear, equal weight)',meaning:'I bow to the supreme consciousness within all. The five syllables Na-Ma-Shi-Va-Ya correspond to the five elements (Earth, Water, Fire, Air, Ether) and the five Koshas.',practice:'Begin before sunrise facing East. Light a candle. Using a mala (108 beads), chant one repetition per bead. Keep mind on the meaning and vibration. One round minimum, three rounds optimal. You will physically feel the protective pranic field it creates after 21 days of consistent practice.',benefits:'Activates all five elements. Opens Sushumna Nadi. Creates a protective pranic field. Aligns personal consciousness with Shiva-consciousness — pure awareness. Foundation for all healing transmissions to follow.'},
exercises:['PRANIC SENSING: Hold palms 5cm apart and slowly separate to 50cm, then bring back together. Feel the resistance, heat, magnetic pull — this is your prana. Journal what you notice each day for 21 days.','AURA CLEARING: Visualize white light entering through your crown on each inhale filling every cell. On each exhale release grey smoke from hands and feet. 5 minutes daily.','PARTNER SCAN: One person sits quietly, the other stands 1 meter away and slowly walks toward them with palms facing outward. Note where you feel temperature changes, pressure, tingling. Share observations. Switch roles.','ENERGY JOURNAL: Every evening: What did my energy feel like today? Where did I notice energy moving or blocked? What affected my energy — people, places, food, thoughts?'],
reflections:['When in your life have you felt most energetically alive? What conditions created that?','What drains your energy most consistently? What replenishes it?','Can you sense the boundary of your own energy field? Where does "you" end and "space" begin?','What does it mean to you to be a healer? What are you called to heal?'],
outcome:'You can sense and describe your own auric field, identify which Kosha holds tension, perform a full daily pranic hygiene protocol, and have begun building a consistent mantra practice. Your Sushumna Nadi has been activated through the Diksha transmission.'},

{n:2,glyph:'△',color:'#22D3EE',theme:['ELEMENTS','PURIFICATION'],
title:{en:'Pancha Bhuta Mastery',sv:'Pancha Bhuta-behärskning',no:'Pancha Bhuta-beherskelse',es:'Maestría del Pancha Bhuta'},
sub:{en:'Command of the Five Sacred Elements',sv:'Kommando av de fem heliga elementen',no:'Kommando over de fem hellige elementene',es:'Dominio de los Cinco Elementos Sagrados'},
initiation:'Element Attunement — Nada Transmission activating your resonance with all 5 elements simultaneously. After this initiation, your hands carry elemental intelligence — you will feel which element is needed in each healing.',
teaching:`Everything that exists — every body, every emotion, every disease, every healing — is a configuration of five fundamental intelligences: Earth (Prithvi), Water (Jala), Fire (Agni), Air (Vayu), and Ether (Akasha). The Siddhas understood disease as elemental imbalance and healing as elemental restoration.

Earth governs bones, muscles, skin, smell, groundedness and stability. Water governs blood, lymph, reproductive fluids, taste, flow and feeling. Fire governs digestion, metabolism, temperature, sight, transformation and will. Air governs breath, nervous system, movement, touch, expansion and thought. Ether governs sound, space, hearing, and consciousness itself.

Each element can be in excess (creating specific symptoms) or deficiency (creating different symptoms). The healer's art begins with reading the body as elemental code: which elements are abundant, which are depleted, and what the restoration path looks like for this specific person.`,
weeks:[
{title:'Earth & Water — Grounding and Flow',content:'Three days with Earth: walk barefoot daily, eat root vegetables, use red/brown colors, chant LAM (Muladhara bija) 108x. Then three days with Water: bathe consciously, drink charged water, use blue colors, chant VAM. Notice how your mood, energy, and body change with each element. Journal the shifts.'},
{title:'Fire & Air — Transformation and Movement',content:'Three days Fire: practice Agni Pranayama (rapid rhythmic nasal breathing 3 minutes), spend time near fire, eat warming spices, chant RAM. Three days Air: extended exhales (inhale 4, exhale 8), time in wind, chant YAM. Observe the elemental shifts in body and consciousness.'},
{title:'Ether — The Great Container',content:'Three days Ether: spend time in silence and open space, gaze at the night sky, practice Trataka (10 min open-eye candle gazing), chant HAM then OM. Then practice the full Bhuta Shuddhi sequence — purifying all five elements in one 40-minute sitting.'},
{title:'Elemental Diagnosis — Reading the Body as Code',content:'Practice elemental assessment with willing partners. Look at skin quality (Earth), emotional fluidity (Water), digestive fire and eye brightness (Fire), breath and nervous system (Air), ability to create space (Ether). Write elemental profiles for 5 people.'},
],
meditation:{name:'Bhuta Shuddhi — Five-Element Purification',duration:'40 minutes, 5x per week during this month',steps:['Sit in a comfortable cross-legged position. Ground with 5 deep breaths.','EARTH: Visualize yellow-golden light filling your legs, feet, lower body. Feel density and stability. Chant LAM 9 times. Release all fear, anxiety, heaviness into golden light.','WATER: Visualize white-silver light filling your abdomen, hips, blood. Feel the flow. Chant VAM 9 times. Release emotional stagnation into the ocean of consciousness.','FIRE: Visualize red-gold flame at your solar plexus spreading through digestive system. Chant RAM 9 times. Release anger, resentment, toxic will into the flame — they become light.','AIR: Visualize green-blue light filling heart, lungs, and nervous system. Feel expansion. Chant YAM 9 times. Release all anxiety, scattered thoughts, unprocessed grief.','ETHER: Visualize violet-white light filling your throat and entire energetic field. Chant HAM 9 times, then OM 9 times. Release all limitations on consciousness and connection.','INTEGRATION: Visualize all five elements in perfect balance — a rainbow of light throughout your body. Sit in silence for 5 minutes receiving.','SEALING: Right hand on heart. Say: "I am purified. I am balanced. I am a clear channel." Three times.']},
mantra:{text:'PANCHABHUTATMAKAM SHIVAM',pronunciation:'PAN-CHA-BHOO-TAT-MA-KAM SHI-VAM. Each syllable equal weight, resonant, from the chest.',meaning:'Shiva — the supreme consciousness — is the soul (Atma) of the five elements. The absolute is not separate from the elements; it expresses itself through them.',practice:'Chant 108x daily during elemental practices. Use as a short mantra during healing sessions when working with elemental imbalances. After the mantra, pause and feel which element rises in you — this gives information about what your client needs.',benefits:'Aligns the healer\'s field with all five elemental intelligences. Creates elemental mastery so you can transmit specific elemental frequencies through your hands and voice. Purifies all five bodies simultaneously.'},
exercises:['ELEMENTAL DIET: For one week, eat intuitively based on which element you need. Heavy oily warm = Earth/Water. Spicy warming = Fire. Light raw airy = Air/Ether. Journal your elemental hunger — your body is always communicating.','ELEMENTAL HANDS: Hold your palms over each of the five elements physically (soil, water, candle flame, open air, empty space). Feel how your hands respond differently. Which element do you most naturally carry in your hands?','BODY READING: With a partner (clothed, no touch), scan their body and make guesses about elemental balance. Then ask them if it matches their experience. This builds diagnostic sensitivity.','WATER CHARGING: Hold a glass of water between your palms for 5 minutes visualizing healing white light flowing into it while chanting VAM. Drink intentionally. Notice any difference in sensation throughout your day.'],
reflections:['Which element do you feel most in harmony with? Which feels most challenging?','How does your elemental balance shift through stress or the seasons?','When you think of someone who needs healing, which elements come to mind immediately?','What elemental teaching does your own body have for you right now?'],
outcome:'You can diagnose elemental imbalances in yourself and others, perform the full Bhuta Shuddhi purification sequence, and use elemental intelligence in your healing approach. Your hands carry elemental transmission capacity from the Diksha.'},

{n:3,glyph:'◎',color:'#a855f7',theme:['CHAKRAS','ACTIVATION'],
title:{en:'Chakra Sovereignty',sv:'Chakra-suveränitet',no:'Chakra-suverenitet',es:'Soberanía de los Chakras'},
sub:{en:'Seven Vortices as Quantum Transmission Nodes',sv:'Sju virvelrörelser som kvantöverföringsnoder',no:'Syv hvirvler som kvantetransmisjonsnoder',es:'Siete Vórtices como Nodos de Transmisión'},
initiation:'Chakra-by-Chakra Attunement — Kritagya transmits sequentially into each vortex from Muladhara to Sahasrara, activating your full channel capacity. You will feel each chakra respond distinctly to the transmission.',
teaching:`The seven major Chakras are spinning vortices of pranic energy along the Sushumna Nadi. Each Chakra is simultaneously a nerve plexus, an endocrine gland, an elemental frequency, a psychological domain, and a portal between dimensions.

Muladhara (Root) — Earth, survival, tribe, body. Trauma: abandonment, poverty, abuse. Svadhisthana (Sacral) — Water, creativity, sexuality, pleasure. Trauma: sexual violation, emotional suppression. Manipura (Solar Plexus) — Fire, will, confidence, digestion. Trauma: powerlessness, humiliation. Anahata (Heart) — Air, love, compassion, healing. Trauma: heartbreak, conditional love, betrayal.

Vishuddha (Throat) — Ether, expression, truth, voice. Trauma: silencing, not being heard. Ajna (Third Eye) — Light/Mind, intuition, vision. Trauma: being told not to trust your knowing. Sahasrara (Crown) — Consciousness, divine connection, meaning. Trauma: spiritual wounding, disconnection from source.

The Anahata is your healing headquarters. Siddha science teaches that the heart generates a field 5,000x stronger than the brain. Your heart IS a healing transmission device — everything flows from it.`,
weeks:[
{title:'Muladhara & Svadhisthana — Earth & Water Vortices',content:'Three days each. For each chakra: chant its bija mantra 108x (LAM for Root, VAM for Sacral), meditate with its color filling that specific area, journal its psychological domain in your life. Begin the Chakra Nadi Sweep (see meditation) with these two foundations.'},
{title:'Manipura & Anahata — Fire & Air Vortices',content:'RAM 108x daily for Manipura (golden-yellow visualization at solar plexus). Practice Agni Pranayama 3 minutes before the mantra to activate fire. Then YAM 108x for Anahata (green light at heart). The Anahata is your healing headquarters — spend extra time here. 20 minutes daily breathing into the heart space.'},
{title:'Vishuddha, Ajna & Sahasrara — Upper Vortices',content:'HAM 108x for Throat (blue-turquoise light). Practice speaking truth daily. OM 108x for Third Eye (indigo light). Practice Trataka 10 minutes daily to develop Ajna sensitivity. For Sahasrara: 20 minutes in silence with attention at the crown. Allow downloads. Journal every insight immediately.'},
{title:'Integration & Diagnosis Practice',content:'Practice reading chakra states in 5 people — observe posture (collapsed chest = Anahata wound), voice quality (thin = Vishuddha block), eye contact (avoidance = Muladhara fear). Write chakra profiles. Practice the full Chakra Nadi Sweep daily feeling each vortex as a distinct intelligence.'},
],
meditation:{name:'Chakra Nadi Sweep — Full Ascending Activation',duration:'40 minutes daily',steps:['Sit with spine tall. Eyes closed. 3 grounding breaths.','MULADHARA: Awareness to base of spine. Visualize deep red spinning wheel. Chant LAM silently 9 times. Ask: "Am I safe? Do I belong?" Listen deeply.','SVADHISTHANA: 4 fingers below navel. Orange light, fluid, moving. VAM 9 times. Feel flow. Ask: "Do I allow myself to feel? Am I creative?" Listen.','MANIPURA: 4 fingers above navel. Golden-yellow fire spinning. RAM 9 times. Feel warmth and power. Ask: "Do I trust my own power? Am I digesting my life?" Listen.','ANAHATA: Center of chest. Emerald green light, tender, vast. YAM 9 times. Feel the heart expand in all directions. Ask: "Can I love myself fully? What grief am I still holding?" Listen.','VISHUDDHA: Throat. Bright blue-turquoise light. HAM 9 times. Feel space opening. Ask: "Am I speaking my truth? What is unsaid?" Listen.','AJNA: Between and above eyebrows. Indigo light. OM 9 times. Feel the third eye open. Ask: "What do I know but am not yet acknowledging?" Listen.','SAHASRARA: Crown. White-gold light pouring in from above. Silence. Allow the crown to open like a thousand-petalled lotus. Rest 10 minutes. Receive.','INTEGRATION: Visualize a pillar of light from Muladhara through Sahasrara, all chakras spinning in alignment. 5 minutes in this wholeness.','SEALING: Hands to heart. Bow. "All is well within me."']},
mantra:{text:'OM AIM HREEM KLEEM',pronunciation:'AUM (resonant held). A-EEM (sharp bright). HREEM (breathy H then REEM from chest). KLEEM (K sharp LEEM held).',meaning:'OM = universal consciousness. AIM = Saraswati, goddess of healing wisdom and sacred sound. HREEM = Mahamaya, transforms illusion into truth. KLEEM = magnetic divine attraction — draws healing toward those who need it.',practice:'Chant 108x each morning. This mantra activates all three main Shakti channels. For healers specifically: chant 9 times with hands held over a client\'s field or your own body to activate the diagnostic and transmission functions of Ajna.',benefits:'Opens the Third Eye for diagnostic clarity. Activates Anahata as a transmission center. Draws healing intelligence from the Siddha lineage field. Clears confusion and sharpens spiritual perception.'},
exercises:['CHAKRA JOURNAL: Each morning before rising, notice which chakra you feel first — tightness in solar plexus, expansion in heart, tightness in throat? This is your body\'s daily report. Log it for the full month.','COLOR HEALING: Consciously wear the color of whichever chakra needs attention. Eat foods of that color. Notice the physiological and psychological shift over 3 days.','PARTNER CHAKRA SCAN: One person sits eyes closed. The other holds open palms 20cm from the body and slowly moves up the chakra column. Notice temperature changes (heat = active/inflamed, cold = depleted/blocked), magnetic sensations. Share observations.','TONING PRACTICE: Stand feet hip-width apart. Tone each seed syllable in ascending pitch: LAM (low) — VAM — RAM — YAM — HAM — OM (high) — silence. Feel the physical vibration in each body area. Three full ascending rounds. One of the most powerful chakra balancing tools available.'],
reflections:['Which chakra feels most alive in you right now? What life circumstances created this openness?','Which chakra feels most challenged? What story lives there?','Where in your body do you hold other people\'s emotions? Which chakra is your main "absorber"?','What would it feel like to have all seven chakras fully open and in communication?'],
outcome:'You can sense, describe, and assess all seven chakras in yourself and others. You can perform the full Chakra Nadi Sweep as a complete healing session. You know which chakra holds your deepest wound and have begun healing it.'},

{n:4,glyph:'⬡',color:'#ef4444',theme:['PROTECTION','SHIELDING'],
title:{en:'Psychic Protection Architecture',sv:'Psykisk skyddsarkitektur',no:'Psykisk beskyttelsesarkitektur',es:'Arquitectura de Protección Psíquica'},
sub:{en:'Sovereign Shielding — The Siddha Kavach System',sv:'Suverän sköldning — Siddha Kavach-systemet',no:'Suveren skjerming — Siddha Kavach-systemet',es:'Escudo Soberano — Sistema Siddha Kavach'},
initiation:'Kavach Initiation — Kritagya installs a personal Siddha Kavach (armor) into your energy field through specific pranic transmission. This creates a semi-permanent protective layer that you learn to maintain and strengthen.',
teaching:`As your pranic sensitivity grows, so does your receptivity to other fields — both uplifting and depleting. Without energetic self-protection, healers absorb clients' energies and eventually burn out, become ill, or develop emotional instability.

Understanding psychic drain is not about fear — it is about discernment. Some interactions uplift you, some leave you neutral, and some drain you. Healers are naturally more open, which means they require more conscious shielding.

The Siddha Kavach creates a field that allows love and healing to pass freely while deflecting discordant energies. You remain open — but sovereign. Unlike fear-based shields that wall you off from connection, Siddha Kavach maintains your full healing capacity.

Psychic cords are energetic connections — some healthy (bonds of love), some depleting (attachment, manipulation, unresolved dynamics). Learning to identify and when appropriate release these cords is essential for healer health and longevity.`,
weeks:[
{title:'Understanding Your Energy Boundaries',content:'Practice daily "energy accounting": after each major interaction, check — do you feel more or less energized? Identify your top 5 energy donors and top 5 extractors. This is not judgment — it is data. Begin the Pranic Egg practice immediately and maintain it throughout this month and beyond.'},
{title:'The Siddha Kavach System — Building Your Armor',content:'Learn all three layers of the Kavach: (1) Agni Wall — fire boundary at skin level, (2) Mirror Shield — reflective sphere at 30cm, (3) Sacred Geometry Armor — golden octahedron at 1 meter. Practice building all three before sleep and re-establishing each morning using OM KSHAM NAMAH.'},
{title:'Cord Identification and Compassionate Release',content:'In meditation, bring to mind each major relationship. Visualize the cord of light connecting you. Assess its quality: golden and flowing (healthy), grey and draining (unhealthy), rigid and controlling. For unhealthy cords, practice the Cord Cutting sequence (see exercises) — always with love and prayer for both parties. Never cut healthy golden cords.'},
{title:'Space Clearing — Healing Environments',content:'Learn to clear and protect your healing spaces. Techniques: sound clearing (singing bowl, clapping in corners), smoke clearing (incense), salt clearing (black salt in corners), prayer fields (spoken intention anchored into walls), geometric activation (star tetrahedron visualization filling the room). Practice on your home this week.'},
],
meditation:{name:'Agni Kavach — Fire-Wall Visualization',duration:'21 minutes every morning and evening',steps:['Sit upright. Ground with 5 deep breaths. Feel your connection to Earth.','Bring awareness to your solar plexus (Manipura). Feel or visualize fire there — your internal Agni.','On each inhale, feed this fire. On each exhale, allow it to expand outward.','Visualize fire spreading from your solar plexus outward, creating a thin layer of golden-white flame at the surface of your skin — a first skin-level layer of protection.','Next: visualize a sphere of mirror-like light surrounding you at 30cm in all directions. Perfectly reflective on the outside — discordant energies bounce away. Perfectly transparent to love.','Now: visualize a larger golden octahedron at 1 meter in all directions. Anchor it into Earth below and cosmos above.','State clearly: "No energy that is not of love and light may enter my field. I am sovereign. I am protected. I am open to all that serves the highest good."','Chant OM KSHAM NAMAH 9 times. Feel the Kavach strengthen with each repetition.','Sit in your protected field for 5 minutes. Notice the sense of safety and sovereignty.','Seal: tap your thymus (upper chest) 7 times with fingertips. This activates the immune field.']},
mantra:{text:'OM KSHAM NAMAH',pronunciation:'AUM (full resonance). KSHAM (K-SH together sharp then AHM soft). NA-MAH (bow).',meaning:'OM = universal consciousness. KSHAM = the bija of forgiveness and protection, associated with Ajna and the capacity to hold sovereignty without enmity. NAMAH = I bow, I offer.',practice:'Chant 108x when building your Kavach. Use 9 repetitions before any healing session. Use 3 repetitions when entering a potentially draining space or encountering a difficult energetic situation. Can be written and placed at the entrance of your healing space.',benefits:'Creates instant protective field. Activates Ajna as a sovereign watching center — you observe without absorbing. Invokes the Siddha protection transmission. Works synergistically with all visualization protection practices.'},
exercises:['PRANIC EGG: Visualize a perfect golden-white egg of light surrounding your entire body, extending 60cm in all directions. Make it solid, luminous, and self-regenerating. Maintain this egg throughout your day — check in hourly to restore it. This becomes your baseline protection practice.','CORD CUTTING: Call to mind someone with whom you feel an unhealthy energetic connection. Visualize the cord between you. Surround the cord in violet light. Call on a Siddha master to assist. See the cord lovingly dissolved. Visualize healing light pouring into both you and the other person. Send them love. NEVER cut healthy golden cords of love.','SPACE CLEARING: Clap your hands sharply once in each corner of a room. Walk the perimeter counter-clockwise three times with incense or singing bowl stating: "This space is cleared. This space is sacred. Only love lives here." Walk clockwise three times to seal. Feel the room atmosphere shift.','ENERGY CHECK AFTER SESSIONS: Immediately after any healing or emotionally intense conversation: wash hands with cold water to elbows, shake hands downward vigorously, breathe fresh air, re-establish your Kavach. If not feeling clear, perform the Agni Kavach meditation immediately.'],
reflections:['Who or what most regularly depletes your energy? What would maintaining sovereignty in those relationships look like?','Do you have any tendency to take on other people\'s pain as your own? Where did you learn that was your role?','What is the difference between compassion (feeling WITH someone) and absorption (feeling AS them)?','How do you currently "come down" from intense healing work? Is this working for you?'],
outcome:'You maintain the three-layer Kavach field daily. You can identify and release unhealthy psychic cords. You have a complete space-clearing ritual. You no longer absorb clients\' energies during healing sessions.'},

{n:5,glyph:'∞',color:'#f97316',theme:['KARMA','LINEAGE'],
title:{en:'Karmic & Ancestral Alchemy',sv:'Karmisk & förfäders alkemi',no:'Karmisk & forfedres alkymi',es:'Alquimia Kármica y Ancestral'},
sub:{en:'Healing the Timeline — Prarabdha Code Rewrite',sv:'Att hela tidslinjen — Prarabdha-kodomskrivning',no:'Å hele tidslinjen — Prarabdha-kodeomskriving',es:'Sanando la Línea de Tiempo — Prarabdha'},
initiation:'Ancestral Healing Transmission — Kritagya channels from the 18 Siddhas to clear ancestral and karmic patterns carried in your lineage for generations. Many students report visible emotional releases and physical sensations during this transmission.',
teaching:`Karma is not punishment. It is the intelligence of unresolved energy patterns that continue generating experiences until they are fully met, understood, and integrated. In Siddha understanding, karma operates across three horizons: Sanchita (accumulated), Prarabdha (currently playing out), and Agami (being created now).

You cannot heal what you cannot see, and you cannot see what you are still unconsciously identified with. Your personal karmic and ancestral healing is not separate from your professional development — it IS your professional development.

The ancestral field is understood by both Siddha science and Western epigenetics: the traumas, beliefs, and wounds of your ancestors are encoded in your biology and energy field. Healing yourself heals your lineage — backward through generations and forward through your descendants.

Past-life residue appears as inexplicable physical symptoms, irrational fears, deep talents that arrive fully formed, and relationship patterns that repeat despite all efforts to change. The healer's work with this residue is about releasing the somatic charge that keeps the pattern active.`,
weeks:[
{title:'Reading Your Karmic Blueprint',content:'Create your personal karmic map. List: (1) What recurring themes appear in your life regardless of circumstances? (2) What patterns showed up identically in your parents? (3) What are you most afraid of without rational cause? (4) What are you inexplicably talented at? (5) What situations trigger disproportionate reactions? These are your karma fingerprints — a treasure map, not a sentence.'},
{title:'Ancestral Field Work',content:'Create your ancestral map going back as far as you can. For each ancestor: their dominant wound, their dominant gift. You will see the fractal — the same patterns in different forms across generations. The alcoholism of a grandfather becomes the workaholism of a father becomes your anxiety — same wound, different expression. Identify the ROOT wound in your lineage.'},
{title:'Pitru Tarpana — Ancestral Offering Practice',content:'Perform the full Pitru Tarpana three times this week. After each practice, journal what came up — images, feelings, insights, unexpected releases. Many students cry without knowing why. The tears are not only yours — they belong to a lineage being liberated.'},
{title:'Timeline Healing — Sending Love Across Time',content:'The quantum field has no distinction between past and present — all is now. You can send healing to your past self, your ancestors, and your future descendants. Practice the Timeline Healing exercise this week focusing on three time points: a childhood moment still carrying pain, a pivotal ancestral moment you sense, and your own future healed self.'},
],
meditation:{name:'Pitru Tarpana — Ancestral Offering with Light Codes',duration:'30-40 minutes. Practice on new moon and full moon minimum.',steps:['Prepare: Light a candle or oil lamp. Place photos of ancestors if available. Have water nearby.','Ground yourself. Establish your Kavach protection from Month 4.','Call on the Siddha lineage: "I invoke the presence of Agastya Muni, Babaji, and the 18 Siddhas as witness and support for this healing."','Visualize your mother and father before you in golden light. Behind them, their parents. Keep extending backward — generations of ancestors in a great column of light.','Bow to your lineage. Feel gratitude for the gift of life that passed through all these beings to reach you.','Send a pulse of golden healing light backward through the column. See it flowing through every generation. As the light touches each ancestor, see their pain softening, their wounds healing.','Speak aloud: "To all my ancestors — known and unknown — I offer this light. I release you from any burdens I have been carrying on your behalf. We are free. We are healed. We are love."','Pour a small offering of water onto the earth while chanting the mantra 9 times.','Turn attention forward: visualize your future descendants bathed in the healed light of a liberated lineage.','Sit in silence for 10 minutes. Receive any messages, feelings, or insights. Journal immediately.']},
mantra:{text:'OM SHREEM HREEM KLEEM GLAUM',pronunciation:'AUM. SHREEM (sh-REEM bright). HREEM (breathy H then REEM). KLEEM (K-LEEM sharp). GLAUM (GL-OWM from the belly).',meaning:'SHREEM = Lakshmi\'s grace, liberation from lack. HREEM = transforms illusion. KLEEM = attraction of divine will. GLAUM = Ganesha, remover of obstacles, opener of blocked karmic pathways.',practice:'Chant 108x during karmic healing work or ancestral practices. Effective chanted over water then offered to the earth — a powerful form of Tarpana. Use during Full Moon practices specifically for maximum amplification.',benefits:'Dissolves karmic knots that have resisted other approaches. Invokes Ganesha to remove ancestral obstacles. Activates Lakshmi grace — the experience that you deserve liberation. Works on the Sanchita karma level.'},
exercises:['FAMILY CONSTELLATION MAP: Draw a large circle representing your family system. Place each member as a dot with lines showing relationships. Note alongside each person: their main wound, their main gift, any known traumas. Look for the pattern — the same wound appearing in different people, the same gift trying to express across generations.','SOMATIC PAST-LIFE RELEASE: Lie down. Place awareness on any area of chronic physical discomfort. Breathe into it without trying to fix it. Ask: "If this sensation had a story, what would it be? If this pain had a time period, when would it be?" Allow images or feelings to arise. Stay 10 minutes. Then visualize violet healing light dissolving the pattern.','TIMELINE HEALING: Identify a childhood memory still carrying emotional charge. Visualize your adult self entering that memory — not to change the event, but to be present to the child you were. Hold that child. Tell them: "You are safe. This is not your fault. You are loved. You will be okay." Feel the healing ripple through time.','FORGIVENESS LETTER: Write a letter (not to be sent) to someone who hurt you. Hold nothing back. Then write a second letter from the perspective of your fully healed self. Read both aloud. Burn both with intention — releasing them as prayer into the cosmos.'],
reflections:['What is the deepest unhealed wound in your family lineage? What would it mean for it to be fully healed — for you and everyone who comes after you?','What karma do you feel you specifically came into this lifetime to resolve? What clues has your life been giving you?','Is there an ancestor you sense is still calling for healing? What do they need from you?','How would your life change if you felt truly free from all inherited limitations?'],
outcome:'You have a clear map of your key karmic patterns and ancestral wounds. You have performed Pitru Tarpana at least three times. You have completed at least one timeline healing. You have written and released a forgiveness letter.'},

{n:6,glyph:'〜',color:'#D4AF37',theme:['SOUND','FREQUENCY'],
title:{en:'Nada Brahman — Sound as Healer',sv:'Nada Brahman — Ljud som helare',no:'Nada Brahman — Lyd som healer',es:'Nada Brahman — El Sonido Sana'},
sub:{en:'Siddha Nada Technology & Mantra Science',sv:'Siddha Nada-teknik & mantravetenskap',no:'Siddha Nada-teknologi & mantravitenskap',es:'Tecnología Siddha Nada y Ciencia del Mantra'},
initiation:'Nada Diksha — Sound Body Activation. Kritagya transmits through sacred toning directly into your auditory field and pranic body, awakening your capacity to receive and transmit healing through sound. Many students report hearing inner sounds (Nada) for the first time after this initiation.',
teaching:`"Nada Brahman" — "Sound is God." The universe emerged from sound (the quantum field is vibrational at its foundation), and consciousness is a self-resonating field that can be entrained by sound frequencies.

Your nervous system is a biological receiver of vibrational information. Before you developed language, you were governed by frequency — the sound of your mother\'s heartbeat organized your nervous system. We never outgrow this. Sound bypasses the cognitive mind and enters the body-field directly, which is why mantra and toning are among the most powerful healing technologies available.

Sanskrit is not a religion — it is a phonetic technology. Each Sanskrit phoneme has a specific vibrational signature that resonates with particular pranic structures in the body. This is why bija mantras like LAM, VAM, RAM work on specific chakras — the sound literally vibrates the corresponding energy center.

The healer\'s voice is their most powerful instrument. Your voice carries your entire field — your coherence, your love, your intention — into the cells of anyone who hears it. Silence — Mouna — is the foundation of all Nada yoga. Before you can know sound, you must know silence.`,
weeks:[
{title:'The Physics of Sound Healing',content:'Study and experience: entrainment (tuning forks), binaural beats (40Hz gamma for focus, 8Hz theta for healing states), Solfeggio frequencies (528Hz — love/DNA repair — play during meditation and sleep). Practice: 30 minutes daily of intentional sound listening — silence or nature sounds only. Journal what you hear in the subtle layers.'},
{title:'Healing with Your Voice',content:'Begin with simple toning — sustained single notes. Find the note that resonates most in your chest (your natural healing tone). Hold it for 2 minutes. Feel where it vibrates. Then explore overtone toning: open mouth wide, form "AH" and slowly close to "OU" to "EE" — listen for harmonics appearing above your fundamental tone. Practice toning over different parts of your body.'},
{title:'Mantra Science — Deep Practice',content:'This week: 2 hours of mantra total. Work with SO\'HAM (I am That) — the mantra of the breath itself. Inhale: SO. Exhale: HAM. This mantra is already happening in your breathing 21,600 times per day. Making it conscious dramatically amplifies its effect. Practice 30 minutes of conscious SO\'HAM breathing daily.'},
{title:'Creating Personalized Healing Mantras',content:'Learn to assess which mantra a client needs: (1) Sense the dominant element in imbalance. (2) Sense the chakra most affected. (3) Sense the quality of frequency needed (soft, penetrating, warming, cooling, expansive). (4) Select or compose the mantra from this. Practice with 5 people — assess, compose a simple mantra for them, teach them to chant it, follow up.'},
],
meditation:{name:'Nada Yoga Sadhana — Internal Sound Listening',duration:'40 minutes daily for 40 consecutive days',steps:['Sit in a completely quiet environment. Use earplugs if needed to block external sound.','Ground with 5 breaths. Establish Kavach protection.','Begin conscious SO\'HAM breathing: inhale SO (listening to the in-breath), exhale HAM (listening to the out-breath). Continue 10 minutes.','Place thumbs gently over the openings of both ears. Rest fingers lightly over closed eyes and forehead.','Listen into the internal soundscape. At first: rushing blood, heartbeat, perhaps ringing. This is normal. Simply listen.','After several minutes, listen past the surface sounds for the Anahata Nada — the unstruck sound — which may appear as: a high-frequency tone, rushing water, bells, flutes, or a deep cosmic hum.','Whatever you hear, listen without grasping or analyzing. Be a receiver. This is pure Nada yoga.','After 20 minutes: release your ears and eyes. Begin to tone softly — whatever sound wants to emerge.','End with 3 repetitions of OM, making it as full and resonant as possible — feel it beginning in the belly and expanding outward.','Sit in complete silence for 5 minutes. Journal what you heard and what arose.']},
mantra:{text:"SO'HAM",pronunciation:'Inhale: SO (subtle internal). Exhale: HAM (soft like a sigh). Not spoken aloud — mentally synchronized with breath.',meaning:'SO = That (the infinite). HAM = I am. Together: "I am That" — the direct recognition of individual consciousness as identical with universal consciousness. The ultimate Siddha teaching encoded in the breath itself.',practice:'SO\'HAM is already happening 21,600 times per day — you are already chanting it, unconsciously. Make 30 minutes of it conscious. Sit quietly, close eyes, breathe naturally, and simply listen to SO on the inhale and HAM on the exhale. As concentration deepens, the mantra begins to chant itself — called ajapa-japa (unrepeated repetition). This is a sign of deep practice.',benefits:'The most direct path to Samadhi through mantra. Regularizes breath, calms the nervous system, develops pratyahara (withdrawal of senses). Builds the foundation for all advanced transmission work — you cannot transmit what you are not.'},
exercises:['TONING DIAGNOSIS: Ask a willing partner to sit comfortably eyes closed. Tone (sustain a single note) over each area of their body — head, throat, heart, solar plexus, belly, base. Notice which tones feel discordant over certain areas — the vibration will feel resistant or muted. These are areas calling for healing. Share observations without judgment.','BINAURAL HEALING SESSION: Create a healing playlist: 396Hz (releasing fear) followed by 528Hz (love, DNA healing) then 741Hz (clearing) then 963Hz (crown awakening). Give yourself or another a one-hour healing session with this soundtrack playing softly. Simply lie in the field and receive.','MOUNA (SILENCE) PRACTICE: Choose one half-day for complete outer silence — no speaking, no music, no phone. Simply exist in silence. Notice how your inner landscape changes. Notice what arises when you stop filling space with sound. This dramatically amplifies mantra sensitivity.','WATER AND SOUND: Chant any mantra while holding a glass of water between your palms. Chant directly into the water for 5 minutes. Then drink slowly and intentionally. Water stores vibrational information — this is the ancient technology of Siddha-blessed water.'],
reflections:['What is the quality of your inner soundscape? Is it mostly mental chatter, or does silence live underneath?','When you tone or chant, where do you feel it most in your body? What does this tell you about your natural healing frequency?','Has there been a time when someone\'s voice healed you — even without the words? What was the quality of that voice?','What would it mean to trust your voice fully as a healing instrument?'],
outcome:'You have completed 20+ days of Nada Yoga Sadhana. You can tone healing frequencies over another person\'s body. You have a developed SO\'HAM practice. You can create simple personalized mantras for clients.'},

{n:7,glyph:'✦',color:'#22D3EE',theme:['TRANSMISSION','TOUCH'],
title:{en:'Pranic Surgery & Direct Transmission',sv:'Pranisk kirurgi & transmission',no:'Pranisk kirurgi & transmisjon',es:'Cirugía Pránica y Transmisión Directa'},
sub:{en:'Hands-On & Distance Healing Protocols',sv:'Handspåläggnings- & distanshealingprotokoll',no:'Håndspåleggings- & fjernhealingsprotokoller',es:'Protocolos Presenciales y a Distancia'},
initiation:'Hands-On Healing Activation — Kritagya transmits a channel upgrade specifically for the hands and heart. Your palms will become more sensitive to pranic information and your capacity to transmit healing through touch will be significantly amplified.',
teaching:`You have built the foundation — elemental intelligence, chakra mastery, protection, karmic clarity, and sound transmission. This month you bring all of it into direct healing sessions — both hands-on and at distance.

Pranic healing through touch works because the human body field extends beyond the physical skin. Your hands are extraordinarily sensitive pranic instruments — they can both diagnose (by sensing the field) and treat (by directing prana). The palms contain secondary chakras connected to the heart through the arms.

Distance healing works because consciousness is non-local. The quantum field has no spatial limitation — your intention directed with precision reaches its target regardless of physical distance. Multiple controlled studies confirm this. For the Siddhas, this was simply understood: consciousness is not inside the brain.

A complete healing session has five phases: Opening (establishing contact and intention), Scanning (diagnostic assessment), Treatment (directed pranic transmission), Closing (sealing and integrating), and Integration guidance (what the client does in the 24-48 hours following).`,
weeks:[
{title:'Pranic Scanning and Extraction',content:'Practice with a partner (clothed): hold palms 10-20cm above their body and slowly sweep from head to feet. Notice: heat (inflammation/excess), cold (depletion/block), tingling (stagnant energy), pulling sensation (deficiency). After scanning, practice pranic extraction on areas of excess — pull congested energy out with slightly curved fingers, then flick it off with a sharp wrist movement. Cleanse hands in salt water after.'},
{title:'Pranic Energizing and Transmission',content:'After extraction: practice pranic energizing — direct healing prana into depleted areas. Methods: cupped palms projecting prana (like flashlight beams), toning directly at the area, visualization of color-specific light entering. Practice Sparsha Diksha (sacred touch): place palms very lightly on specific energy points (crown, third eye, heart, solar plexus, base) and transmit through intention and breath. Each point 3-5 minutes.'},
{title:'Distance Healing Architecture',content:'Build a complete distance healing session. Agree a time with the client. Both sit quietly at the agreed time. You: enter coherent heart state (feel genuine gratitude/love for 2 minutes), establish connection with client\'s higher self by stating their full name and intention, work as if physically present — scan, extract, energize, seal. Client reports their experience. Compare and refine.'},
{title:'Complete Session Design & Ethics',content:'Build your healing session template: (1) Intake — 15 minutes. (2) Intention setting — joint prayer. (3) Full session — 45-60 minutes. (4) Integration — 15 minutes (what came up, homework for the week). (5) Follow-up protocol. Study healing ethics: informed consent, scope of practice, when to refer out, confidentiality, power dynamics.'},
],
meditation:{name:'Anahata Transmission — Healing Through the Heart Field',duration:'30 minutes before every healing session',steps:['Sit quietly for 5 minutes. Release all preoccupation with your own concerns.','Place both palms on your heart. Feel the physical heartbeat. Synchronize your breathing with it.','Recall the most intense experience of unconditional love you have ever felt. Let that feeling fully occupy your chest. Amplify it.','Feel this love expanding outward from your heart in all directions — a torus field of loving energy.','Direct this field toward your client (present or at distance). Hold their name or image in your heart — not in your mind, in your heart.','State your healing intention: "I am a clear channel for the healing intelligence of the Siddha lineage. May this person receive exactly what they need for their highest good. I am not the healer — I am the vessel."','Place your hands on or above the body. Let them be guided — do not think about where to go. Trust the prana to lead.','Breathe: inhale — draw healing light from the cosmos through your crown into your heart. Exhale — transmit from your heart through your palms into the client\'s field.','Continue for as long as feels complete — typically 20-40 minutes.','Close: give thanks. Shake your hands. Establish Kavach. The session is sealed.']},
mantra:{text:'OM TARE TUTTARE TURE SOHA',pronunciation:'AUM. TAH-REH. TOO-TAH-REH. TOO-REH. SO-HA. Each syllable clear and equal. Flow is gentle not staccato.',meaning:'The mantra of Green Tara — swift-acting goddess of healing and compassion. TARE = liberation from suffering. TUTTARE = liberation from all fears. TURE = healing of all illness. SOHA = may it be so, it is complete.',practice:'Chant 21 times before each healing session. Can be whispered directly into the client\'s field or toned over affected body areas. For distance healing: write the client\'s name, hold the paper over your heart, chant 108 times while visualizing Tara\'s green healing light entering their field. Particularly effective for physical illness and depression.',benefits:'Invokes the Tara healing field — a non-personal healing intelligence operating beyond the healer\'s own limitations. Protects both healer and client during the session. Creates a container of compassion allowing deeper healing to occur safely.'},
exercises:['HANDS ACTIVATION: Rub palms together briskly for 30 seconds. Separate them slowly and bring close — feel the energy sphere between them. Practice growing and shrinking it. Then alternate which hand feels energy flowing FROM and which feels it flowing INTO. This identifies your dominant transmission hand (usually the non-dominant hand).','HEALING CRISIS PROTOCOL (memorize this): A healing crisis (temporary worsening of symptoms as the body releases) is normal and healthy. Signs: increased emotional sensitivity, fatigue, brief intensification of original symptom, dream changes. Response: reassure client this is healing movement, increase water intake, gentle movement, avoid additional sessions for 48 hours, check in daily. Never diagnose — always refer to medical professionals for physical symptoms.','FULL PRACTICE SESSION: Give three complete 60-minute sessions to willing friends or family this month. Before each: complete the Anahata Transmission meditation. After each: write detailed session notes (what you sensed, what you did, client\'s response). Your patterns of sensitivity and transmission will become visible across three sessions.','DISTANCE HEALING LOG: Conduct three distance healing sessions. Both you and the client write what you experienced during the agreed time window WITHOUT comparing notes first. Then compare. The level of correlation will be your direct evidence for non-local healing.'],
reflections:['When you place your hands near someone\'s body, what do you feel? How does information arrive — as sensation, knowing, images, words?','What is the relationship between your own state of being and the quality of healing you transmit?','How do you know when a healing session is complete? What signals this to you?','What does it mean to be "not the healer but the vessel"? Can you fully embody non-attachment to outcome?'],
outcome:'You have given 3+ complete hands-on and 3+ distance healing sessions with documented client responses. You have a complete session template. You know the healing crisis protocol. Your hands are activated as pranic instruments.'},

{n:8,glyph:'✧',color:'#a855f7',theme:['ASTRAL','DIMENSIONS'],
title:{en:'Astral Architecture & Higher Planes',sv:'Astral arkitektur & högre plan',no:'Astral arkitektur & høyere plan',es:'Arquitectura Astral y Planos Superiores'},
sub:{en:'Healing Across Dimensions — Loka Navigation',sv:'Healing över dimensioner — Loka-navigation',no:'Healing på tvers av dimensjoner — Loka-navigasjon',es:'Sanación a través de Dimensiones — Loka'},
initiation:'Inter-dimensional Activation — Kritagya facilitates direct access to the Siddha Loka and transmits your capacity to receive healing intelligence and transmit healing across dimensional planes.',
teaching:`The Siddha cosmology describes a multi-dimensional universe organized into Lokas — planes of existence. The seven ascending Lokas: Bhu-Loka (physical), Bhuvar-Loka (pranic/astral), Svar-Loka (mental/celestial), Mahar-Loka (great sages), Jana-Loka (spiritual seekers), Tapa-Loka (intense austerity), and Satya-Loka (truth/supreme reality). The Siddhas operate from Mahar-Loka and above — they are accessible through intention and practice.

Your five-body system extends across multiple Lokas simultaneously. Healing that addresses only the physical level is surface healing. True healing addresses the root cause, which is often located at the pranic, mental-emotional, or causal level.

Sleep healing is one of the most underutilized healing technologies. During delta-wave sleep, both healer and client are in their least defended state — the Pranamaya Kosha is most receptive and mental defenses are completely relaxed.

Soul-level healing addresses the Vijnanamaya and Anandamaya Koshas. At this level, "illness" is often a misalignment between the soul\'s dharmic path and the life being lived.`,
weeks:[
{title:'Mapping the Subtle Planes',content:'Study the Loka system through direct experience. Before sleep for 7 nights: set an intention to consciously enter the Bhuvar-Loka and remember what you encounter. Keep a dream journal at your bedside — write immediately upon waking before memories dissolve. Notice which Lokas you naturally access most easily.'},
{title:'Meeting Healing Guides',content:'In deep meditation, intentionally open to contact with healing guides — Siddha masters, ancestral healers, or guides specific to your lineage. Protocol for discernment: ask any appearing entity, "Are you of the light? Do you serve the highest good of all beings?" If hesitation or aggression — release and re-establish Kavach. If affirmation — ask what teaching or healing they offer. Journal all encounters.'},
{title:'Astral Temple Building',content:'Build your personal healing sanctuary in the astral plane. In deep meditation: visualize yourself stepping through a doorway into a sacred space you create with intention. Design it: a golden healing table at center, walls of light, sacred symbols, presence of the Siddha masters. Meet clients in this space — invite their higher self to receive healing here.'},
{title:'Sleep Healing Transmission',content:'Conduct three sleep healing sessions this month. Protocol: agree with client on a time window (e.g., 11pm-2am). Prepare as usual (Kavach, Anahata coherence). Send healing with intention that it be received most fully in the client\'s sleep state. Check in with client on their dreams and morning state. Many report the most profound experiences from sleep transmissions.'},
],
meditation:{name:'Siddha Loka Darshan — Ascending Through the Planes',duration:'45 minutes. Use in a reclined position in a safe quiet space.',steps:['Lie down. Cover yourself if needed. Ensure you will not be disturbed.','Ground completely: feel your body heavy against the earth. Every cell relaxed.','Breathe: 4 counts in, 7 counts hold, 8 counts out. Repeat 4 times. This opens alpha-theta brain states.','Visualize your consciousness at Bhu-Loka — the physical plane. See the Earth below you — green and brown, dense, heavy.','Begin to rise: up through the atmosphere into the astral plane — Bhuvar-Loka. Colors more vivid, forms fluid.','Continue rising into Svar-Loka — the celestial plane. Beings of light, music without a source, crystalline landscapes.','In Mahar-Loka: sense the Siddha masters — vast presences of love and intelligence. Bow internally. Remain in receptive silence. Allow transmission.','You may ask one clear question: "What does my healing practice need?" Listen without expecting a specific form of answer.','After 20 minutes: consciously descend — Svar-Loka, Bhuvar-Loka, Bhu-Loka. Feel yourself returning fully to your body. Wiggle fingers and toes.','State: "I am fully in my body. I am grounded. I am here." Open eyes slowly. Drink water. Journal immediately.']},
mantra:{text:'OM AIM HREEM',pronunciation:'AUM (full chest resonance). A-EEM (bright sharp forward in mouth). HREEM (soft H then REEM from the heart).',meaning:'OM = universal consciousness. AIM = Saraswati — wisdom, healing science, and sacred transmission. The bija of all learning and higher knowing. HREEM = transforms darkness into light, illusion into truth.',practice:'Chant 108x before any astral or inter-dimensional work. Also use to open the Third Eye before diagnostic work. Three repetitions while touching Ajna (third eye point) with middle finger activates immediate clarity. Use at the beginning of the Siddha Loka Darshan meditation.',benefits:'Opens Ajna for astral vision and higher perception. Invokes Saraswati\'s transmission of healing knowledge. Creates clarity in the subtle planes. Activates the Vijnanamaya Kosha for soul-level healing.'},
exercises:['DREAM INCUBATION: Before sleep each night, hold a healing question in your mind. Write it in your journal. State: "I invite the Siddha lineage to provide guidance in my dreams." Upon waking, write whatever you remember — even fragments. Over 30 nights, patterns emerge that provide genuine healing guidance.','ASTRAL DIAGNOSIS: For a client who has given permission, sit quietly and enter a light meditative state. Hold their name in your heart. Without knowing anything about their situation, observe what images, feelings, or words arise. This is astral diagnosis — your consciousness touching their field. Compare impressions with their actual situation afterward.','HIGHER SELF CONTACT: In meditation, ask to meet your own higher self. Ask: "What is my primary healing gift?" "Who am I here to serve?" "What do I most need to learn in this lifetime?" Receive in silence. This is direct soul communication, not imagination.','ENTITY DISCERNMENT PROTOCOL: If you encounter something heavy, manipulative, or frightening during meditation: immediately chant OM KSHAM NAMAH 9 times, visualize brilliant white light filling all space, state firmly: "In the name of the Siddha lineage — only beings of love and light may be present here." Then re-establish your Kavach fully.'],
reflections:['Have you ever received guidance from a dream, vision, or sudden knowing that proved accurate? What was the quality of that experience?','Do you sense access to guidance from beyond your personal consciousness? How does this guidance arrive for you?','What is the relationship between your own spiritual development and your capacity to access higher planes of healing?','What would it mean for your practice to operate consciously from multiple dimensional levels simultaneously?'],
outcome:'You have established your astral healing sanctuary. You have conducted 3 sleep healings with documented client responses. You have made at least one clear contact with a healing guide in meditation. You have a reliable method for astral-level diagnosis.'},

{n:9,glyph:'⚕',color:'#22c55e',theme:['DIAGNOSIS','DOSHA'],
title:{en:'Ayurvedic & Elemental Diagnostics',sv:'Ayurvedisk & elementär diagnostik',no:'Ayurvedisk & elementær diagnostikk',es:'Diagnóstico Ayurvédico y Elemental'},
sub:{en:'Reading the Body as Sacred Text',sv:'Att läsa kroppen som helig text',no:'Å lese kroppen som hellig tekst',es:'Leyendo el Cuerpo como Texto Sagrado'},
initiation:'Nadi Pariksha Transmission — Kritagya activates diagnostic sensitivity specifically in your fingertips and through your Ajna for pulse reading and multi-dimensional body assessment.',
teaching:`Ayurveda — "the science of life" — is the world\'s oldest complete system of medicine. At its foundation: every human being has a unique constitutional blueprint (Prakriti) composed of specific ratios of the three Doshas — Vata (air+ether), Pitta (fire+water), and Kapha (earth+water).

VATA (Air + Ether): Creative, intuitive, spacious. In balance: inspiration, adaptability. Out of balance: anxiety, insomnia, scattered thinking, constipation, dryness, fear.

PITTA (Fire + Water): Focused, passionate, organized. In balance: leadership, transformation, clarity. Out of balance: anger, inflammation, perfectionism, skin issues, burnout.

KAPHA (Earth + Water): Stable, nurturing, patient, loving. In balance: endurance, groundedness, compassion. Out of balance: depression, weight gain, attachment, lethargy, over-giving.

Nadi Pariksha (pulse diagnosis) is the most advanced diagnostic tool in the Ayurvedic-Siddha system. A practiced pulse reader can assess constitutional balance, organ function, emotional state, karmic patterns, and pranic coherence within minutes.`,
weeks:[
{title:'Constitutional Assessment — Prakriti Reading',content:'Learn to assess Prakriti through observation: Body frame (Kapha: large/solid, Vata: thin/irregular, Pitta: medium/athletic). Skin quality (Kapha: oily/smooth, Vata: dry/thin, Pitta: warm/sensitive). Eyes (Kapha: large/liquid, Vata: small/active, Pitta: sharp/penetrating). Speech (Kapha: slow/melodic, Vata: rapid/variable, Pitta: sharp/decisive). Assess 10 people this week.'},
{title:'Vikriti Reading — Current Imbalance Diagnosis',content:'Distinguish between Prakriti (what someone IS) and Vikriti (what has gone out of balance). A Kapha person with Vata imbalance looks anxious and dry — but underneath, their ground is still Kapha. The healing plan addresses the Vata excess while supporting the Kapha constitution. Practice Vikriti assessments with 5 people.'},
{title:'Nadi Pariksha — Beginning Pulse Reading',content:'Place index, middle, and ring fingers on the radial artery (inside wrist, below thumb). Light pressure with index finger for Vata, medium for Pitta, firm for Kapha. Vata pulse: light, irregular, like a snake (cobra). Pitta: moderate, sharp, like a frog jumping. Kapha: slow, heavy, rolling, like a swan swimming. Practice daily — it takes time to develop this sensitivity.'},
{title:'Integrated Siddha-Ayurvedic Healing Plans',content:'Build complete healing prescriptions integrating Ayurvedic diagnosis with all tools from previous months. Example: anxiety, insomnia, dry skin, scattered mind = Vata excess. Plan: Earth and Water element work, Muladhara and Anahata focus, Bhumi Dharana daily, warming grounding foods, sesame oil self-massage (Abhyanga), grounding mantra. Write 5 complete integrated healing plans.'},
],
meditation:{name:'Dhanvantari Dhyana — Healing God Visualization',duration:'30 minutes before diagnostic and healing sessions',steps:['Sit upright. Establish grounding and Kavach.','Visualize before you: Lord Dhanvantari — the divine physician of golden-blue light, holding a pot of amrita (nectar of immortality) and medicinal herbs. His presence radiates precise healing intelligence.','Bow internally. Ask to receive his transmission of diagnostic wisdom.','Visualize a golden beam of light flowing from his hands into your hands — specifically into your fingertips and palms. Feel the activation of diagnostic sensitivity.','Feel the light flowing into your Ajna. Ask Dhanvantari: "Activate my capacity to see what is truly happening in those I serve — beyond what they can tell me themselves."','Bring to mind a client or situation. In this Dhanvantari field ask: "What does this person need most deeply?" Allow the answer to arise as feeling, knowing, image, or sound.','Receive in silence for 15 minutes.','Close with gratitude: "I thank the intelligence of Dhanvantari, of Agastya, of the Siddha lineage for this transmission. May I be a clear and accurate vessel for healing wisdom."','Open your eyes. Record immediately any information received.']},
mantra:{text:'OM DHANVANTRE NAMAHA',pronunciation:'AUM. DHAN-VAN-TREY NA-MA-HA. Dhan as in "done," Van as in "van," Trey rhymes with "pray."',meaning:'I bow to Dhanvantari — the divine physician who arose from the cosmic ocean carrying the nectar of immortality and the science of healing. Invoking him opens access to the akashic record of all healing knowledge.',practice:'Chant 108x before clinical work. Use 9 repetitions to open any diagnostic session. Can be chanted over medicinal herbs, food, or water to consecrate them with Dhanvantari\'s healing intelligence. On full moon days, chant 1008x for significant amplification.',benefits:'Opens access to Ayurvedic and Siddha healing intelligence. Sharpens diagnostic capacity — practitioners report increased accuracy in pulse reading and body assessment after 30 days of practice. Activates the healer as an instrument of divine medicine.'},
exercises:['TONGUE DIAGNOSIS: Look at your own tongue daily for one week. Note: color (pale = blood deficiency, red = heat/Pitta, purple = stagnation), coating (white = Kapha/toxins, yellow = Pitta heat), shape (scalloped edges = Vata, broad and thick = Kapha), moisture (dry = Vata, very wet = Kapha). With each notation, check: do you feel the corresponding imbalance in your body?','EYE READING: Practice reading eyes: sclera (whites) — yellow tinge = liver heat (Pitta), grey tinge = accumulation (Kapha). Iris: assess density and clarity. Pupils: slow to respond = Kapha, rapid = Vata, sensitive to light = Pitta. Inner corner: dark = kidney deficiency. Cross-reference with known health patterns.','FULL DOSHA ASSESSMENT: Give 3 people a complete Dosha assessment using: physical observation, conversation about natural tendencies, tongue and eye reading, pulse reading. Write a complete constitutional report and share it. Ask them to confirm or correct your assessment.','HERBAL INTELLIGENCE: Learn the Siddha-Ayurvedic approach to 5 core herbs: Ashwagandha (Vata balancing, strength), Brahmi (brain tonic, mental clarity), Triphala (tridoshic, cleansing), Tulsi (Pitta and Kapha balancing), Shatavari (Vata-Pitta, female hormones). Study their taste (Rasa), post-digestive effect (Vipaka), and energetic action (Virya).'],
reflections:['What is your own Prakriti? Does understanding it change how you see your tendencies and challenges?','Where in your body do you most clearly feel your current Vikriti? What lifestyle pattern created it?','When you read other people\'s constitutions, what comes most naturally — sensing Vata, Pitta, or Kapha? What does this tell you about your own dominant Dosha?','How does Ayurvedic understanding change how you would approach a client who has been given a medical diagnosis?'],
outcome:'You can assess Prakriti and Vikriti in yourself and others through observation and basic pulse reading. You can create integrated Siddha-Ayurvedic healing plans. You have foundational knowledge of 5 key Ayurvedic herbs.'},

{n:10,glyph:'✡',color:'#f59e0b',theme:['GEOMETRY','YANTRA'],
title:{en:'Sacred Geometry & Yantra Technology',sv:'Helig geometri & Yantra',no:'Hellig geometri & Yantra',es:'Geometría Sagrada y Tecnología Yantra'},
sub:{en:'The Architecture of Healing Space',sv:'Arkitekturen för helande rum',no:'Arkitekturen for helingsrom',es:'La Arquitectura del Espacio de Sanación'},
initiation:'Sri Yantra Activation — Kritagya consecrates and transmits directly through the Sri Yantra, activating your capacity to work with geometric forms as healing instruments and to design healing environments with quantum precision.',
teaching:`Sacred geometry is the study of the mathematical patterns underlying all of creation. These patterns are not invented — they are discovered. They exist a priori in the fabric of consciousness, and working with them creates direct resonance with the organizing intelligence of the universe.

The fundamental patterns you will work with: the Vesica Piscis (two overlapping circles — geometry of creation), the Flower of Life (64-petal pattern containing all geometric forms), Metatron\'s Cube (encoding all five Platonic solids), the Sri Yantra (the most complex and powerful single geometric form — encoding the entire universe in one image), and the Torus (the donut-shaped field that is the primary structure of all energy systems).

Yantras are geometric instruments for healing and consciousness. The Sri Yantra, when properly consecrated, generates a specific scalar field that measurably reorganizes the energy in its vicinity. Multiple scientific studies have documented the physiological effects of sitting before a consecrated Sri Yantra.

Crystal grids apply sacred geometry to crystalline structures. Crystals are piezoelectric — they generate and receive electromagnetic fields when under pressure (including the subtle pressure of intention). A properly designed crystal grid creates a coherent scalar field supporting healing.`,
weeks:[
{title:'Living with Sacred Geometry',content:'Spend this week studying and experiencing sacred geometry directly. Print or draw: Flower of Life, Sri Yantra, Merkaba, Golden Spiral. Meditate with each for 15 minutes — sit before the image with soft focus and notice what arises in your body and consciousness. This is Yantra yoga — geometric meditation. Journal the specific states each form induces.'},
{title:'Yantra Creation and Consecration',content:'Create your own healing Yantra. Choose a healing intention. Draw or paint a geometric form expressing that intention. Consecrate it: place on your altar, anoint with sacred oil (sandalwood, rose), chant your core mantra over it 108 times, state your intention clearly and anchor it into the form. A properly consecrated Yantra becomes a living instrument.'},
{title:'Vastu Shastra — Sacred Space Design',content:'Vastu Shastra is the Vedic science of architectural design for maximum pranic coherence. Key principles: healing space faces East, healer\'s head faces North or East during sessions, table in center or South-East, plants in North-East, water element in North-East, fire (candles) in South-East, crystals in North or East. Apply these principles to your healing space this week.'},
{title:'Crystal Grids and Scalar Field Creation',content:'Build 3 crystal grids: (1) Protection grid (black tourmaline at corners, clear quartz in center), (2) Healing amplification grid for a specific client (rose quartz points directed inward toward a central piece), (3) Manifestation grid for your healing practice (citrine, pyrite, clear quartz in Star of David pattern). Cleanse all crystals first, set intentions consciously, anchor with mantra.'},
],
meditation:{name:'Sri Yantra Trataka — Geometric Absorption',duration:'20 minutes. Practice with eyes open then closed.',steps:['Place a Sri Yantra image at eye level approximately 50-60cm from your face.','Sit with a soft unfocused gaze — not staring hard, but allowing your eyes to rest gently on the central bindu (point) of the Yantra.','Begin chanting OM SHREEM HREEM KLEEM internally synchronized with your breath.','After 5 minutes: close your eyes. The Yantra should appear as a visual impression on the inside of your eyelids.','With eyes closed, follow the geometric form in your inner vision as it pulses, rotates, or transforms. Do not force or control — simply observe.','Now: feel the geometry translating into your energy field. The nine interlocking triangles of the Sri Yantra correspond to nine layers of consciousness — feel yourself expanding through each layer.','At the center bindu: rest. The bindu is the point before creation — pure potentiality. Rest in this zero-point field for as long as possible.','When thoughts arise: return to the geometry. Thoughts are the periphery — the bindu is the center.','After 15 minutes: open eyes slowly. Gaze softly at the Yantra for 2 more minutes.','Journal: what colors, sensations, or insights arose during the practice?']},
mantra:{text:'OM SHREEM HREEM SHREEM KAMALE KAMALALAYE PRASEED',pronunciation:'Each syllable distinct. SHREEM (SH-REEM). HREEM (H-REEM). KAMALE (ka-MA-leh). KAMALALAYE (ka-MA-la-LA-yeh). PRASEED (pra-SEED).',meaning:'Invocation of Kamala (Lotus Goddess / Lakshmi): SHREEM = grace and abundance. HREEM = transformation. KAMALE = she who is like a lotus (pure, arising from muddy water into light). KAMALALAYE = she who dwells in the lotus (the heart). PRASEED = please bestow your grace.',practice:'Chant 108x during the Yantra meditation or while working with crystal grids. Use it to bless your healing room at the beginning of each day. Particularly powerful during waxing moon phases.',benefits:'Activates the healing space at the quantum level. Invokes Lakshmi\'s field of abundance and grace — creating an environment where healing naturally flourishes. Works synergistically with Sri Yantra to create a high-coherence scalar field.'},
exercises:['FLOWER OF LIFE DRAWING: Draw the Flower of Life freehand — start with the center circle, add six surrounding circles perfectly equidistant, then another layer. The process of drawing it is the practice — it trains your nervous system in the consciousness of perfect geometric proportion. Many students enter deep meditative states while drawing.','SPACE DOWSING: Use a pendulum (or your body — sway technique) to identify energy centers in a room. Move through slowly. Note where the pendulum swings in circles (energy vortex), in a straight line (energy line), or stops (energy void). Place crystals or sacred objects at vortex points to amplify natural energy.','GEOMETRIC MANDALA HEALING: Create a healing mandala for a client — using their dominant element colors, primary chakra, and a geometric form expressing their healing intention. Gift it to them. The process of creating it with healing intention is a complete healing session in geometric form.','CRYSTAL ACTIVATION: Hold a crystal (clear quartz or rose quartz) between your palms. Breathe your healing intention into it 9 times. Chant your core mantra 27 times while holding it. You will feel it change — become warmer, heavier, or more electrically alive. This is the activation. Place it in your healing space or give it to a client.'],
reflections:['When you sit before sacred geometric forms, what do you feel that you don\'t feel in ordinary environments?','Is there a geometric form you\'ve always been drawn to — a spiral, a star, a circle? What might this attraction tell you about your healing signature?','How does the space you heal in affect the quality of healing? Have you noticed sessions dramatically different because of the environment?','What would it mean to treat your healing space as a living entity that you tend and commune with?'],
outcome:'You have a consecrated healing space designed according to Vastu principles. You have created 3 crystal grids with specific intentions. You have a regular Sri Yantra Trataka practice. You can create healing Yantras for clients.'},

{n:11,glyph:'♡',color:'#ec4899',theme:['EMOTION','TRAUMA'],
title:{en:'Emotional Alchemy & Trauma Healing',sv:'Emotionell alkemi & trauma',no:'Emosjonell alkymi & trauma',es:'Alquimia Emocional y Sanación del Trauma'},
sub:{en:'The Heart as Transformation Crucible',sv:'Hjärtat som transformationsdegel',no:'Hjertet som transformasjonsdigel',es:'El Corazón como Crisol de Transformación'},
initiation:'Anahata Purna — Full heart opening co-transmission by Kritagya and Laila. This is the most intimate and often most transformative initiation in the programme — direct transmission into the heart center from two experienced healers simultaneously.',
teaching:`Trauma is not what happened to you. Trauma is what happened inside you when what happened to you was more than you could process at the time. It is frozen energy — prana that was activated (the survival response) but never completed its circuit. It remains as a somatic pattern: a holding in the body, a loop in the nervous system, a recurring emotional weather.

The Manomaya Kosha (mental-emotional body) is where most of the healing work that brings clients to healers is actually located. Physical symptoms are often the final expression of emotional patterns ignored for years.

In Siddha healing, emotions are not problems to be fixed — they are messengers. Grief says: "Something precious was lost, and that matters." Anger says: "A boundary was crossed." Fear says: "There is a perceived threat." When we receive the message, the emotion can complete its arc and dissolve.

Truly holding space means being present with the fullness of another\'s experience without needing it to be different — witnessing with equanimity, without being swept away. This requires you to have done your own emotional work: you can only hold space to the degree that you have space within yourself.`,
weeks:[
{title:'The Emotional Body — Your Inner Weather System',content:'Complete daily emotion logging: five times per day, pause and ask "What am I feeling right now?" Name it precisely — not just "stressed" but "anxious about X with a tight feeling in my stomach." Give each emotion a color, texture, temperature. Where does it live in your body? This builds Manomaya Kosha literacy — the prerequisite for helping others with theirs.'},
{title:'Trauma Physiology — Understanding the Body\'s Response',content:'Study the trauma response: fight-flight-freeze-fawn. Notice which is your default pattern. Somatic indicators: fight (jaw tension, fists), flight (scattered attention, shallow fast breath), freeze (blank feeling, heaviness), fawn (compulsive agreeableness, inability to say no). When you notice these activating, pause, name it, and apply the somatic grounding sequence (see exercises).'},
{title:'Grief, Anger, Fear — Siddha Release Techniques',content:'Spend one day each with the three most commonly suppressed emotions. GRIEF: Allow 20 minutes of intentional grief — music that moves you, photos of what has been lost, conscious permission to cry. ANGER: 20 minutes of conscious anger release — physical movement (hitting pillows, stomping), sound (roar, scream into a pillow). FEAR: 20 minutes in the felt experience of your deepest fear — breathe through it without escaping.'},
{title:'Holding Space — Advanced Presence Practice',content:'Practice holding space in your daily life this week: when someone shares something difficult, resist every impulse to fix, advise, or comfort prematurely. Simply say: "I\'m here. I\'m listening. Tell me more." Notice the discomfort this creates — the urge to make it better, the fear of inadequacy. This discomfort IS your development edge.'},
],
meditation:{name:'Prema Hridaya — Heart-Field Expansion',duration:'40 minutes daily for 40 days',steps:['Sit with spine erect. Both palms on your heart. Feel your heartbeat.','Breathe into the heart: inhale expanding the chest in all directions, exhale releasing any contraction. 5 minutes.','Bring to awareness any emotion currently present in your heart field. Whatever is there — welcome it. "I see you. You are welcome here."','Recall a moment of the most uncomplicated love you have ever felt. Let that feeling fully bloom in your chest.','With this love activated: extend it first to yourself. "May I be well. May I be free from suffering. May I know love." Stay with this — self-compassion is often the hardest practice.','Extend it to someone you love deeply: "May you be well. May you be free from suffering. May you know love."','Extend it to someone you feel neutral toward. Then to someone you find difficult.','Extend it outward in all directions — to your community, to all beings everywhere.','Rest in the field of boundless love for 10 minutes. Simply being in this field heals. Simply creating it heals you.','Close: "The love I have touched today is real. It belongs to no one and flows through everyone. I am made of this."']},
mantra:{text:'OM KLEEM KRISHNAYA NAMAHA',pronunciation:'AUM. KLEEM (K-LEEM sharp and magnetic). KRISH-NA-YA (each syllable clear). NA-MA-HA (soft bow).',meaning:'KLEEM = the bija mantra of divine attraction and the force of love that draws all beings toward their highest. KRISHNAYA = to Krishna — the embodiment of divine love, joy, and the healing power of complete presence. NAMAHA = I bow, I offer.',practice:'Chant 108x during the Prema Hridaya meditation or before any session involving emotional healing or grief work. The mantra creates a field of unconditioned love. Particularly effective for clients struggling with self-love, relationship pain, or grief. Can be whispered directly at the level of the client\'s heart during hands-on work.',benefits:'Opens the heart beyond personal love into cosmic love. Activates Prema — divine love that has no object and no opposite. Directly addresses Anahata blockages. Creates instant field coherence that allows emotional release to happen safely.'},
exercises:['SOMATIC GROUNDING SEQUENCE (memorize for working with triggered clients): (1) Five deep belly breaths — count them. (2) Name 5 things you can see. (3) Feel 4 points of contact between your body and the surface you\'re on. (4) Listen for 3 distinct sounds. (5) Two more deep breaths. (6) Ask: "What does my body need right now?" This activates the prefrontal cortex and deactivates the amygdala.','INNER CHILD MEETING: Sit quietly. Visualize yourself as a child. Approach that child with patience and love. Ask: "What do you need that you never received?" Listen. Then give it — give the comfort, the recognition, the safety, the truth that child needed. Feel both giver and receiver simultaneously. One of the most powerful self-healing practices available.','EMOTION MAPPING SESSION: With a willing partner, help them map an emotion. Ask: "Where in your body do you feel this?" "What color or texture does it have?" "How old does this feeling feel?" "When is the first time you remember feeling this?" Simply witness and reflect. Stay out of interpretation and analysis. Let them discover their own emotional landscape.','WITNESSING PRACTICE: Spend one day practicing total equanimity with your own emotional experience. Whatever arises, practice saying internally: "There is an arising of [emotion]" rather than "I am [emotion]." This creates the crucial distinction between awareness and its contents. You are the sky — emotions are weather. You contain them; they do not contain you.'],
reflections:['Which emotion are you most comfortable being with in yourself? Which in others is most challenging to witness without intervening?','What is your personal relationship with grief? Have you allowed yourself to fully grieve your significant losses?','Where did you learn your current patterns around emotional expression? What would "regulated" emotional expression look and feel like for you?','What is the difference between empathy, compassion, and merger? Where do you tend to land?'],
outcome:'You have completed 30+ days of Prema Hridaya practice. You have worked with grief, anger, and fear in your own system. You can hold space for another\'s emotional experience for 60+ minutes without needing to fix or direct. You have facilitated 3 emotional healing sessions.'},

{n:12,glyph:'☀',color:'#D4AF37',theme:['MASTERY','MISSION'],
title:{en:"Healer's Mastery & Sovereign Practice",sv:'Healermästerskap & certifiering',no:'Healerens mesterskap & sertifisering',es:'Maestría del Sanador y Práctica Soberana'},
sub:{en:'Integration, Ceremony & Lineage Blessing',sv:'Integration, ceremoni & linjens välsignelse',no:'Integrasjon, seremoni & linjens velsignelse',es:'Integración, Ceremonia y Certificación Siddha'},
initiation:'Final Initiation Ceremony — Live group ceremony conducted by Kritagya and Laila. You receive your Siddha Healer blessing and lineage transmission in a full ceremonial context. This formally anchors your place in the Siddha healing lineage.',
teaching:`You have traveled a complete circle. From your first breath in Month 1 — entering the field, learning to sense prana — to this moment: a healer with 11 months of practice, transmission, and lived experience behind you.

You carry in your hands the capacity to sense, diagnose, extract, and transmit pranic healing. You carry in your voice the power of mantra — sounds used for thousands of years to reorganize consciousness and biology. You carry in your heart the open field of Prema — unconditional love that heals by its very presence. You carry the diagnostic precision of elemental, chakral, and Ayurvedic assessment. You carry the protection of the Siddha Kavach, the wisdom of karmic understanding, the geometric intelligence of sacred space, the courage to meet emotion without flinching, and the openness to receive guidance from dimensions beyond the visible.

The healer\'s self-care is the ethical foundation of the practice. You cannot give what you do not have. When you maintain your practice, your channel deepens. When you neglect it, your transmission weakens. This is not metaphorical — it is physiological, energetic, and spiritual fact.

Your dharmic healing mission is not just a job — it is a soul agreement. At some level, before you entered this life, you chose this work. The people who come to you are not accidents. They are students of the same school of consciousness — you are simply a few steps further along the path.`,
weeks:[
{title:'Integration — Weaving 11 Months Together',content:'Spend this week in review. Go back through your journal from Month 1. What has changed? What is unrecognizable from where you were? Write a comprehensive self-assessment: which tools are strongest, which need more development, what patterns in your healing work have emerged. Create a personal "Healer\'s Map" — a visual representation of all your tools, your healing signature, and your continued growth areas.'},
{title:'Building Your Healing Practice',content:'Design your actual practice: What will you charge? What will sessions look like? Where will you work — home, clinic, online? How will people find you? What is your area of particular gift and focus? Write a complete Practice Design document this week. Consider your time, your training, the value of healing, and what your community can afford — all are relevant.'},
{title:'The Healer\'s Sustainable Sadhana',content:'Design your minimum viable daily sadhana — the practice you can and will maintain even in busy periods. Recommended: 20 min morning (mantra + grounding), 5 min pre-session (Anahata coherence + Kavach), 5 min post-session (clearing + re-establishing Kavach), 15 min evening (reflection + elemental balance check). This is 45 minutes total — non-negotiable.'},
{title:'Ceremony Preparation & Dharmic Mission Statement',content:'Write your Dharmic Mission Statement: "I am here to heal [what]. I serve [whom]. My particular gift is [what]. My healing is needed because [why]. I commit to [what standards and practices]." This is not a marketing tool — it is a vow. Read it aloud each morning for the month following certification. In ceremony, you will anchor this vow in the presence of the lineage.'},
],
meditation:{name:'Purna Abhisheka — Full Siddha Anointing Visualization',duration:'45 minutes. Practice in the week before ceremony.',steps:['Sit in your most sacred space. Light candles and incense. Have fresh flowers if possible.','Ground completely. Establish your full Kavach.','Visualize before you: the 18 Siddhas in a semicircle — Agastya Muni, Babaji, Thirumoolar, Nandhinatha, Patanjali, and all the others. Their presence is vast and loving.','Bow deeply — in your inner vision, prostrate fully before the lineage.','Agastya Muni steps forward. He carries a vessel of amrita — nectar of divine healing intelligence.','He pours this amrita over your crown. Feel it flowing down through every chakra, every Nadi, every cell of your being. It is golden-white, warm, alive.','As the amrita flows: your Muladhara stabilizes. Your Svadhisthana opens. Your Manipura ignites with purposeful fire. Your Anahata expands into limitless compassion. Your Vishuddha rings clear. Your Ajna sees without obstruction. Your Sahasrara opens into the infinite.','The Siddha speaks: "You are received into this lineage. Your healing is not yours alone — it flows through ten thousand healers before you and will flow through ten thousand after you. Be humble. Be precise. Be love. The work is not yours; you are the instrument."','Bow again. Receive the lineage blessing as tangible golden light entering your heart and hands.','Sit in this field for 20 minutes. Receive completely. Close: "I accept this responsibility with humility and joy. May I serve with precision, with love, and with the wisdom of the lineage that lives through me."']},
mantra:{text:'AHAM BRAHMASMI',pronunciation:'AH-HUM BRAH-MAS-MI. Slow, deliberate, from the deepest center. Not a prayer outward — a recognition inward.',meaning:'I AM the Absolute. Not "I believe in God" — but the direct statement of recognition: the individual consciousness (Aham) and the universal consciousness (Brahma) are identical in nature. The Mahavakya — the great saying — of the Vedic tradition and the culmination of all Siddha practice.',practice:'This mantra is used very differently from all others — not counted repetitions, but pure recognition. Sit in silence. Feel your own awareness. Now feel the space in which awareness arises. Now recognize: the awareness and the space are not two things. In that recognition, say: "AHAM BRAHMASMI." Once is enough. The understanding behind it is the practice.',benefits:'The ultimate Siddha attainment: Jnana (direct knowing). When this recognition is stable, healing flows naturally — not as something you DO but as something you ARE. You become a walking transmission. The final destination of all healing practice.'},
exercises:['COMPLETE CASE STUDY: Conduct one complete healing journey with a willing client — from first intake through 6+ sessions using all the tools from all 12 months. Document every session: intake assessment, elemental/chakral/Ayurvedic diagnosis, treatment given, client response, evolution over time. Write a complete case report (minimum 2,000 words). This is your graduation project.','SUPERVISION SESSION: Schedule a one-on-one session with Kritagya or Laila to review your case study, your healing development, and your areas for continued growth. This is not an examination — it is a transmission. Come with your most honest self-assessment, including what you find most challenging.','HEALER\'S VOW CEREMONY: Perform your own private ceremony before the group certification event. Prepare your altar. Light 12 candles — one for each month. As you light each one, speak aloud what you received in that month. When all 12 are lit, stand in the light of all 12 flames and make your vow as a healer. Write it beforehand so it is precise. Then burn the paper in one of the flames — releasing it as prayer.','TEACHING PREPARATION: Identify one teaching from the programme that you feel most called to transmit to others. Write a 20-minute teaching on that theme as if presenting it to beginning healers. This is the beginning of your teaching practice. The lineage propagates through transmission: what was given to you, you are now called to give.'],
reflections:['Looking back over 12 months: what surprised you most about the healing path? What was harder than expected? What was more beautiful than you imagined?','What is your single greatest gift as a healer? And what remains as your deepest growing edge?','Who do you feel specifically called to heal? What population, what wound, what dimension of suffering is yours to address?','What does it mean to you to be a vessel — the instrument through which healing intelligence moves rather than the source of healing yourself?'],
outcome:'CERTIFICATION: You have completed all 12 months of material, given documented healing sessions across multiple modalities, written your complete case study, participated in the final initiation ceremony, and made your Dharmic Mission vow. You are a certified Siddha Healer. The lineage lives through you.'},
];

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════
const PractitionerCertification = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<'onetime' | 'monthly' | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState<'curriculum' | 'invest' | 'about'>('curriculum');
  const [openMonth, setOpenMonth] = useState<number | null>(null);
  const [openSec, setOpenSec] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sqi_lang') as Lang | null;
    if (saved && ['en','sv','no','es'].includes(saved)) setLang(saved);
  }, []);

  const switchLang = (l: Lang) => { setLang(l); localStorage.setItem('sqi_lang', l); setLangOpen(false); };
  const toggleSec = (k: string) => setOpenSec(prev => prev === k ? null : k);

  const handleEnroll = async (paymentType: 'onetime' | 'monthly') => {
    if (!isAuthenticated) { toast.error('Please sign in to enroll'); return; }
    setIsLoading(paymentType);
    try {
      const { data, error } = await supabase.functions.invoke('create-certification-checkout', { body: { paymentType } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout');
    } finally { setIsLoading(null); }
  };

  const cl = LANG_OPTS.find(l => l.code === lang)!;
  const tabs = ta('tabs', lang);

  return (
    <div style={{ background:'#050505', minHeight:'100vh', fontFamily:"'Plus Jakarta Sans',sans-serif", color:'rgba(255,255,255,0.85)', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=Cinzel:wght@600&display=swap');
        *{box-sizing:border-box;} p{margin:0;}
        .gl{background:rgba(255,255,255,0.02);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.05);border-radius:36px;}
        .gs{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:16px;}
        .lb{font-size:9px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.35);}
        .gw{color:#D4AF37;text-shadow:0 0 20px rgba(212,175,55,.4);}
        .fd{animation:fadeUp .4s ease forwards;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .mc{cursor:pointer;transition:all .25s;} .mc:hover{transform:translateY(-2px);}
        .tb{cursor:pointer;border:none;background:none;font-family:inherit;transition:all .25s;}
        .ab{cursor:pointer;background:none;border:none;width:100%;text-align:left;font-family:inherit;display:flex;align-items:center;justify-content:space-between;padding:11px 0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050505}::-webkit-scrollbar-thumb{background:rgba(212,175,55,.3);border-radius:2px}
        @keyframes rimG{0%,100%{box-shadow:0 0 12px rgba(212,175,55,.06)}50%{box-shadow:0 0 36px rgba(212,175,55,.2)}}
      `}</style>

      {/* STICKY HEADER */}
      <div style={{ position:'sticky',top:0,zIndex:100,background:'rgba(5,5,5,.93)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.04)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none',border:'none',color:'rgba(255,255,255,.4)',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:800,letterSpacing:'.3em' }}>← BACK</button>
        <div style={{ position:'relative' }}>
          <button className="gs" onClick={() => setLangOpen(o=>!o)} style={{ padding:'6px 14px',cursor:'pointer',border:'none',background:'transparent',borderRadius:100,display:'flex',alignItems:'center',gap:6,fontFamily:'inherit' }}>
            <span style={{ fontSize:14 }}>{cl.flag}</span>
            <span className="lb">{lang.toUpperCase()}</span>
            <span style={{ color:'rgba(255,255,255,.3)',fontSize:10 }}>▾</span>
          </button>
          {langOpen && (
            <div style={{ position:'absolute',right:0,top:'calc(100% + 8px)',background:'#0d0d0d',border:'1px solid rgba(255,255,255,.08)',borderRadius:14,overflow:'hidden',zIndex:200,minWidth:140 }}>
              {LANG_OPTS.map(lo => (
                <button key={lo.code} onClick={() => switchLang(lo.code)} style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 16px',background:lang===lo.code?'rgba(212,175,55,.08)':'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>
                  <span style={{ fontSize:16 }}>{lo.flag}</span>
                  <span style={{ fontSize:11,fontWeight:600,color:lang===lo.code?'#D4AF37':'rgba(255,255,255,.6)' }}>{lo.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HERO */}
      <div style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.08) 0%,transparent 60%)',padding:'56px 20px 44px',textAlign:'center' }}>
        <div className="lb" style={{ marginBottom:14 }}>SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING</div>
        <div style={{ fontSize:52,marginBottom:12,filter:'drop-shadow(0 0 18px rgba(212,175,55,.4))' }}>☽✦☀</div>
        <h1 className="gw" style={{ fontSize:'clamp(26px,5vw,54px)',fontWeight:900,letterSpacing:'-.04em',lineHeight:1.08,marginBottom:12,whiteSpace:'pre-line' }}>{t('heroTitle',lang)}</h1>
        <p style={{ fontSize:14,color:'rgba(255,255,255,.45)',fontWeight:300,maxWidth:580,margin:'0 auto 24px',lineHeight:1.7 }}>{t('heroSub',lang)}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
          {ta('tags',lang).map(tag => <span key={tag} className="gs" style={{ padding:'6px 14px',fontSize:9,fontWeight:800,letterSpacing:'.35em',color:'#D4AF37' }}>{tag}</span>)}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex',justifyContent:'center',gap:8,padding:'0 20px 30px' }}>
        {(['curriculum','invest','about'] as const).map((id,i) => (
          <button key={id} className="tb" onClick={() => setTab(id)}
            style={{ padding:'9px 18px',fontSize:9,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase',borderRadius:100,
              color:tab===id?'#D4AF37':'rgba(255,255,255,.3)',
              border:`1px solid ${tab===id?'rgba(212,175,55,.3)':'rgba(255,255,255,.06)'}`,
              background:tab===id?'rgba(212,175,55,.06)':'none' }}>{tabs[i]}</button>
        ))}
      </div>

      <div style={{ maxWidth:820,margin:'0 auto',padding:'0 16px 120px' }}>

        {/* ── CURRICULUM ── */}
        {tab==='curriculum' && (
          <div className="fd">
            {MONTHS.map((mod,i) => {
              const title = (mod.title as Record<Lang,string>)[lang] || mod.title.en;
              const sub = (mod.sub as Record<Lang,string>)[lang] || mod.sub.en;
              const isOpen = openMonth === i;
              return (
                <div key={i} style={{ marginBottom:10 }}>
                  <div className="mc gl" onClick={() => setOpenMonth(isOpen?null:i)}
                    style={{ padding:'22px 22px 18px',borderRadius:26,border:`1px solid ${isOpen?'rgba(212,175,55,.28)':'rgba(255,255,255,.05)'}`,background:isOpen?'rgba(212,175,55,.04)':'rgba(255,255,255,.02)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                      <div>
                        <div className="lb" style={{ marginBottom:5 }}>{t('monthLabel',lang)} {mod.n}</div>
                        <div style={{ fontSize:26,color:mod.color,filter:`drop-shadow(0 0 6px ${mod.color}60)`,marginBottom:4 }}>{mod.glyph}</div>
                      </div>
                      <div className="lb" style={{ textAlign:'right',lineHeight:2.2 }}>{mod.theme.map((th,j)=><div key={j}>{th}</div>)}</div>
                    </div>
                    <h3 style={{ fontWeight:900,fontSize:16,letterSpacing:'-.02em',color:'#fff',marginBottom:3 }}>{title}</h3>
                    <p style={{ fontSize:12,color:'rgba(255,255,255,.38)',fontWeight:300,lineHeight:1.5 }}>{sub}</p>
                    <div style={{ marginTop:10,display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ height:1,flex:1,background:`linear-gradient(90deg,${mod.color}40,transparent)` }}/>
                      <span style={{ fontSize:9,fontWeight:800,letterSpacing:'.3em',color:mod.color }}>{isOpen?'CLOSE ↑':'OPEN ↓'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="fd" style={{ marginTop:6,display:'flex',flexDirection:'column',gap:8 }}>

                      {/* INITIATION */}
                      <div style={{ padding:'16px 18px',background:'rgba(212,175,55,.05)',borderRadius:14,borderLeft:`3px solid #D4AF37` }}>
                        <div className="lb" style={{ color:'#D4AF37',marginBottom:8 }}>{t('init',lang)}</div>
                        <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.75)' }}>{mod.initiation}</p>
                      </div>

                      {/* TEACHING */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`t${i}`)}>
                          <span className="lb" style={{ color:mod.color }}>{t('teaching',lang)}</span>
                          <span style={{ color:mod.color }}>{openSec===`t${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`t${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            {mod.teaching.split('\n\n').map((p,pi) => (
                              <p key={pi} style={{ fontSize:13,lineHeight:1.82,color:'rgba(255,255,255,.68)',marginBottom:pi<mod.teaching.split('\n\n').length-1?14:0 }}>{p}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* WEEKS */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`w${i}`)}>
                          <span className="lb" style={{ color:mod.color }}>{t('weeks',lang)}</span>
                          <span style={{ color:mod.color }}>{openSec===`w${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`w${i}` && (
                          <div style={{ padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:10 }}>
                            {mod.weeks.map((w,wi) => (
                              <div key={wi} style={{ padding:'14px 14px',background:'rgba(255,255,255,.02)',borderRadius:12,borderLeft:`2px solid ${mod.color}60` }}>
                                <div className="lb" style={{ color:mod.color,marginBottom:4 }}>WEEK {wi+1}</div>
                                <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,.8)',marginBottom:6 }}>{w.title}</div>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.62)' }}>{w.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* MEDITATION */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`m${i}`)}>
                          <span className="lb" style={{ color:'#22D3EE' }}>{t('med',lang)}</span>
                          <span style={{ color:'#22D3EE' }}>{openSec===`m${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`m${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            <div style={{ fontSize:14,fontWeight:800,color:'#fff',marginBottom:4 }}>{mod.meditation.name}</div>
                            <div className="lb" style={{ color:'rgba(255,255,255,.38)',marginBottom:14 }}>{mod.meditation.duration}</div>
                            <div className="lb" style={{ color:'#22D3EE',marginBottom:10 }}>{t('steps',lang)}</div>
                            {mod.meditation.steps.map((s,si) => (
                              <div key={si} style={{ display:'flex',gap:10,marginBottom:10,alignItems:'flex-start' }}>
                                <div style={{ flexShrink:0,width:20,height:20,borderRadius:'50%',background:'rgba(34,211,238,.12)',border:'1px solid rgba(34,211,238,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#22D3EE',marginTop:2 }}>{si+1}</div>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.65)' }}>{s}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* MANTRA */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`mn${i}`)}>
                          <span className="lb" style={{ color:'#D4AF37' }}>{t('mantra',lang)}</span>
                          <span style={{ color:'#D4AF37' }}>{openSec===`mn${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`mn${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            <div style={{ textAlign:'center',padding:'16px',background:'rgba(212,175,55,.05)',borderRadius:12,marginBottom:14,border:'1px solid rgba(212,175,55,.15)' }}>
                              <div style={{ fontSize:'clamp(16px,3.5vw,24px)',fontWeight:900,color:'#D4AF37',letterSpacing:'0.04em',marginBottom:6,textShadow:'0 0 20px rgba(212,175,55,.4)' }}>{mod.mantra.text}</div>
                              <div style={{ fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'0.12em' }}>PRONUNCIATION: {mod.mantra.pronunciation}</div>
                            </div>
                            {[{l:t('meaning',lang),v:mod.mantra.meaning},{l:t('how',lang),v:mod.mantra.practice},{l:'BENEFITS',v:mod.mantra.benefits}].map(row => (
                              <div key={row.l} style={{ marginBottom:12 }}>
                                <div className="lb" style={{ color:'#D4AF37',marginBottom:5 }}>{row.l}</div>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.65)' }}>{row.v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* EXERCISES */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`e${i}`)}>
                          <span className="lb" style={{ color:mod.color }}>{t('exercises',lang)}</span>
                          <span style={{ color:mod.color }}>{openSec===`e${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`e${i}` && (
                          <div style={{ padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:10 }}>
                            {mod.exercises.map((ex,ei) => {
                              const colon = ex.indexOf(':');
                              const ttl = colon>-1 ? ex.substring(0,colon) : `PRACTICE ${ei+1}`;
                              const body = colon>-1 ? ex.substring(colon+1).trim() : ex;
                              return (
                                <div key={ei} style={{ padding:'12px 14px',background:'rgba(255,255,255,.02)',borderRadius:12 }}>
                                  <div style={{ fontSize:10,fontWeight:800,letterSpacing:'0.2em',color:mod.color,marginBottom:6 }}>{ttl}</div>
                                  <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.62)' }}>{body}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* REFLECTIONS */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`r${i}`)}>
                          <span className="lb" style={{ color:'rgba(255,255,255,.5)' }}>{t('reflect',lang)}</span>
                          <span style={{ color:'rgba(255,255,255,.4)' }}>{openSec===`r${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`r${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            {mod.reflections.map((q,qi) => (
                              <div key={qi} style={{ display:'flex',gap:10,marginBottom:10,alignItems:'flex-start' }}>
                                <span style={{ color:mod.color,flexShrink:0,fontSize:14,marginTop:2 }}>?</span>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.62)',fontStyle:'italic' }}>{q}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* OUTCOME */}
                      <div style={{ padding:'14px 16px',background:`rgba(212,175,55,.05)`,borderRadius:14,border:`1px solid rgba(212,175,55,.15)` }}>
                        <div className="lb" style={{ color:mod.color,marginBottom:6 }}>{t('outcome',lang)}</div>
                        <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.72)' }}>{mod.outcome}</p>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── INVEST ── */}
        {tab==='invest' && (
          <div className="fd">
            <h2 style={{ fontWeight:900,fontSize:28,letterSpacing:'-.03em',color:'#fff',marginBottom:6,textAlign:'center' }}>
              {lang==='sv'?'Investering i din healingresa':lang==='no'?'Investering i din helingsreise':lang==='es'?'Inversión en tu Camino':'Investment in Your Healing Path'}
            </h2>
            <p style={{ textAlign:'center',color:'rgba(255,255,255,.35)',fontSize:13,marginBottom:36 }}>
              {lang==='sv'?'Välj det betalningsalternativ som resonerar':lang==='no'?'Velg betalingsalternativet som resonerer':lang==='es'?'Elige la opción que resuene':'Choose the payment option that resonates'}
            </p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:16,maxWidth:660,margin:'0 auto' }}>
              <div className="gl" style={{ padding:'32px 26px',borderRadius:34,border:'1px solid rgba(212,175,55,.35)',background:'rgba(212,175,55,.04)',position:'relative',overflow:'hidden',animation:'rimG 4s ease-in-out infinite' }}>
                <div style={{ position:'absolute',top:16,right:16,padding:'4px 12px',borderRadius:100,background:'#D4AF37',fontSize:9,fontWeight:800,letterSpacing:'.3em',color:'#050505' }}>{t('bestValue',lang)}</div>
                <div style={{ textAlign:'center',marginBottom:22 }}>
                  <div className="lb" style={{ marginBottom:8 }}>{t('oneTime',lang)}</div>
                  <div className="gw" style={{ fontSize:46,fontWeight:900,letterSpacing:'-.03em',marginBottom:4 }}>€2,997</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>{t('fullYear',lang)}</div>
                </div>
                {[
                  lang==='sv'?'Spara €567 jämfört med månadsplan':lang==='no'?'Spar €567 vs månedlig':lang==='es'?'Ahorra €567 vs plan mensual':'Save €567 vs monthly plan',
                  lang==='sv'?'Omedelbar full tillgång till alla 12 månader':lang==='no'?'Umiddelbar full tilgang':lang==='es'?'Acceso inmediato a los 12 meses':'Immediate access to all 12 months',
                  lang==='sv'?'Alla bonusar och gemenskapsåtkomst':lang==='no'?'Alle bonuser og fellesskaptilgang':lang==='es'?'Todos los bonos y comunidad':'All bonuses and community included',
                  lang==='sv'?'Personlig diksha varje månad':lang==='no'?'Personlig diksha hver måned':lang==='es'?'Diksha personal cada mes':'Personal diksha every month',
                ].map((b,ii) => (
                  <div key={ii} style={{ display:'flex',gap:10,marginBottom:9,alignItems:'flex-start' }}>
                    <span style={{ color:'#D4AF37',fontSize:12,flexShrink:0,marginTop:2 }}>◆</span>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.5 }}>{b}</p>
                  </div>
                ))}
                <button onClick={() => handleEnroll('onetime')} disabled={isLoading!==null}
                  style={{ width:'100%',marginTop:22,padding:'14px 20px',borderRadius:100,background:'#D4AF37',border:'none',color:'#050505',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,letterSpacing:'.3em',cursor:isLoading?'not-allowed':'pointer',opacity:isLoading?0.7:1 }}>
                  {isLoading==='onetime'?t('processing',lang):t('enrollOnce',lang)}
                </button>
              </div>
              <div className="gl" style={{ padding:'32px 26px',borderRadius:34 }}>
                <div style={{ textAlign:'center',marginBottom:22 }}>
                  <div className="lb" style={{ marginBottom:8 }}>{t('monthly',lang)}</div>
                  <div style={{ fontSize:46,fontWeight:900,letterSpacing:'-.03em',color:'#fff',marginBottom:4 }}>€297</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>{t('perMonth',lang)}</div>
                </div>
                {[
                  lang==='sv'?'Flexibel betalningsplan':lang==='no'?'Fleksibel betalingsplan':lang==='es'?'Plan de pago flexible':'Flexible payment plan',
                  lang==='sv'?'Månadsvis innehållsåtkomst':lang==='no'?'Månedlige innholdslåsninger':lang==='es'?'Contenido mensual desbloqueado':'Monthly content unlocks',
                  lang==='sv'?'Alla bonusar ingår':lang==='no'?'Alle bonuser inkludert':lang==='es'?'Todos los bonos incluidos':'All bonuses included',
                  lang==='sv'?'Personlig diksha varje månad':lang==='no'?'Personlig diksha hver måned':lang==='es'?'Diksha personal cada mes':'Personal diksha every month',
                ].map((b,ii) => (
                  <div key={ii} style={{ display:'flex',gap:10,marginBottom:9,alignItems:'flex-start' }}>
                    <span style={{ color:'rgba(255,255,255,.4)',fontSize:12,flexShrink:0,marginTop:2 }}>◆</span>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,.55)',lineHeight:1.5 }}>{b}</p>
                  </div>
                ))}
                <button onClick={() => handleEnroll('monthly')} disabled={isLoading!==null}
                  style={{ width:'100%',marginTop:22,padding:'14px 20px',borderRadius:100,background:'none',border:'1px solid rgba(212,175,55,.4)',color:'#D4AF37',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,letterSpacing:'.3em',cursor:isLoading?'not-allowed':'pointer',opacity:isLoading?0.7:1 }}>
                  {isLoading==='monthly'?t('processing',lang):t('enrollMonthly',lang)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {tab==='about' && (
          <div className="fd">
            <div className="gl" style={{ padding:'34px 30px',borderRadius:36,marginBottom:14 }}>
              <div className="lb" style={{ color:'#D4AF37',marginBottom:14 }}>
                {lang==='sv'?'HEALERNS LÖFTE':lang==='no'?'HELERERENS LØFTE':lang==='es'?'LA PROMESA DEL SANADOR':"THE HEALER'S PROMISE"}
              </div>
              <p style={{ fontSize:15,lineHeight:1.85,color:'rgba(255,255,255,.65)',fontWeight:300,marginBottom:14 }}>
                This is not a certification course. This is a <span style={{ color:'#D4AF37',fontWeight:600 }}>living transmission</span> — a 12-month initiation into the Siddha healing lineage through the direct field of Kritagya Das (Shiva Siddhananda) and Laila Amrouche.
              </p>
              <p style={{ fontSize:15,lineHeight:1.85,color:'rgba(255,255,255,.65)',fontWeight:300,marginBottom:14 }}>
                Each module contains <span style={{ color:'#D4AF37',fontWeight:600 }}>complete written teachings</span>, a week-by-week breakdown, step-by-step meditation instructions, full mantra guidance (meaning, pronunciation, how to practice, benefits), detailed exercises and partner practices, deep reflection questions, and a clear monthly outcome.
              </p>
              <p style={{ fontSize:15,lineHeight:1.85,color:'rgba(255,255,255,.65)',fontWeight:300 }}>
                Students who complete all 12 months receive the <span style={{ color:'#D4AF37',fontWeight:600 }}>Siddha Healer Certification</span> and lineage blessing in a live ceremony with Kritagya and Laila.
              </p>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {[
                { icon:'◎', label:'LIVE SESSION', desc:'1× monthly group session with Kritagya & Laila — teaching, transmission, Q&A' },
                { icon:'✦', label:'PERSONAL DIKSHA', desc:'Monthly initiation and personal transmission for each student, every month' },
                { icon:'〜', label:'FULL TEACHINGS', desc:'Complete written lesson content — not bullet points but full Siddha teachings' },
                { icon:'◈', label:'MEDITATION GUIDES', desc:'Step-by-step instructions for every meditation practice in every module' },
                { icon:'✡', label:'EXERCISES & PRACTICES', desc:'Detailed partner exercises, solo practices, weekly assignments each month' },
                { icon:'⬡', label:'CERTIFICATION', desc:'Siddha Healer Certificate and lineage blessing at month 12 live ceremony' },
              ].map((p,pi) => (
                <div key={pi} className="gs" style={{ padding:'20px 16px',textAlign:'center' }}>
                  <div style={{ fontSize:24,marginBottom:10,color:'#D4AF37',filter:'drop-shadow(0 0 8px rgba(212,175,55,.4))' }}>{p.icon}</div>
                  <div className="lb" style={{ color:'#D4AF37',marginBottom:6 }}>{p.label}</div>
                  <p style={{ fontSize:12,color:'rgba(255,255,255,.45)',lineHeight:1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign:'center',padding:'26px 20px',borderTop:'1px solid rgba(255,255,255,.04)' }}>
        <div style={{ fontSize:20,marginBottom:8,color:'#D4AF37',filter:'drop-shadow(0 0 8px rgba(212,175,55,.4))' }}>☽ OM ☀</div>
        <div className="lb">KRITAGYA DAS · LAILA AMROUCHE · SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING</div>
      </div>
    </div>
  );
};

export default PractitionerCertification;
