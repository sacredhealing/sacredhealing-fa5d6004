import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

const TIERS = {
  FREE: { name: "FREE", label: "SEEKER", color: "#aaaaaa", glow: "rgba(170,170,170,0.25)", icon: "◎", price: "Free" },
  PRANA: { name: "PRANA FLOW", label: "INITIATE", color: "#22D3EE", glow: "rgba(34,211,238,0.3)", icon: "◈", price: "€19/mo" },
  QUANTUM: { name: "SIDDHA QUANTUM", label: "ADEPT", color: "#D4AF37", glow: "rgba(212,175,55,0.4)", icon: "✦", price: "€45/mo" },
  AKASHA: { name: "AKASHA INFINITY", label: "SOVEREIGN", color: "#C9A0FF", glow: "rgba(201,160,255,0.4)", icon: "⬡", price: "€1,111 lifetime" },
};

const ALL_MODULES = [
  // ─── FREE ──────────────────────────────────────────────────────────────────
  {
    id: 1, tier: "FREE",
    title: "Prana — The Living Intelligence",
    subtitle: "THIRUMANTIRAM VERSES 700–720",
    tamiltitle: "பிராணன் — உயிர் அறிவு",
    verse: "திருமந்திரம் 700",
    quote: "The breath is not air — it is Shiva's own movement. Control the breath and you control the cosmos within.",
    intro: "Thirumoolar reveals in the Thirumantiram that prana is not merely biological breath but the vibrational signature of Shiva-Shakti moving through the 72,000 nadis. Prana is the bridge between matter and consciousness — the only force that can be willfully directed to awaken the dormant Kundalini. This foundational module decodes the five pranas and their cosmic correspondence.",
    lessons: [
      { title: "What is Prana?", body: "Prana is not oxygen. In Siddha cosmology, prana is Shiva's own breath — the first vibration that arose from the primordial silence (mauna). Every inhale is Shiva expanding; every exhale is Shiva dissolving. The Tamil Siddhas called this 'Sol Kadhantha Anubhavam' — the experience beyond words. Thirumoolar states in verse 700: 'Ondre Kulam, Oruvane Devan' — One race, One God. Prana is that One manifesting as life in all beings." },
      { title: "The Five Pranas — Pancha Vayu", body: "Prana Vayu (chest, inhalation, upward), Apana Vayu (pelvis, elimination, downward), Samana Vayu (navel, digestion, circulating), Udana Vayu (throat, elevation, upward spiral), Vyana Vayu (full body, circulation, omnidirectional). Each prana governs specific organs, emotions, and spiritual functions. Thirumoolar maps these five as five rivers flowing into the ocean of Sushumna." },
      { title: "The 72,000 Nadis — Light-Body Mapped", body: "The Thirumantiram identifies 72,000 nadis (pranic channels) within the subtle body — not nerves, not veins, but rivers of light-current. Of these, 14 are principal. Of those 14, three are supreme: Ida (lunar, left, feminine, Shakti), Pingala (solar, right, masculine, Shiva), Sushumna (central, fire, Brahman). When prana flows through Sushumna alone, samadhi occurs spontaneously. Pranayama's sole purpose is to force prana into Sushumna." },
      { title: "Prana & the Five Sheaths (Koshas)", body: "Prana operates simultaneously across the five sheaths: Annamaya (physical), Pranamaya (pranic), Manomaya (mental), Vijnanamaya (intellect), Anandamaya (bliss). Thirumoolar says pranayama done correctly activates all five sheaths simultaneously — not just the lungs, but the entire light-body. When you hold the breath, time stops in all five sheaths." },
      { title: "Prana & Consciousness — The Inseparable Twins", body: "Where prana moves, consciousness follows. Where consciousness moves, prana follows. This is the Siddha axiom. The agitated mind creates agitated breath. The still breath creates the still mind. Thirumoolar verse 720: 'Manathodu Vayu Kalanthida — when mind and breath unite, liberation is certain.' This is the entire foundation of pranayama in one sentence." },
    ],
    techniques: [
      { name: "Nadi Shodhana — Nadi Purification", duration: "11 min", ratio: "4:16:8", rounds: 27, body: "Close right nostril, inhale left for 4 counts. Hold both closed for 16. Exhale right for 8. Inhale right for 4. Hold for 16. Exhale left for 8. This is one round. Perform 27 rounds. Thirumoolar's exact ratio as per verse 710. Morning practice at sunrise recommended. Best done facing east. After 40 days of daily practice, the nadis are purified enough for kumbhaka to begin.", bandha: "No bandha at this stage. Keep spine erect. Eyes closed, gaze to ajna." },
      { name: "Sama Vritti — Equal Breath", duration: "7 min", ratio: "4:4:4:4", rounds: 54, body: "Inhale 4 counts. Hold 4 counts. Exhale 4 counts. Hold out 4 counts. This box creates equal pressure in all four chambers of the heart and all four sections of the breath cycle. Thirumoolar calls this 'Sama Prana' — the equalized life-force. It stills the vrittis (mental fluctuations) faster than any other entry-level technique.", bandha: "None required. Soft belly." },
      { name: "Anuloma Viloma — Against the Grain", duration: "9 min", ratio: "6:0:6", rounds: 36, body: "Simple alternate nostril without retention. Inhale left 6 counts, exhale right 6. Inhale right 6, exhale left 6. Gentler than Nadi Shodhana — ideal for evening practice when full retention would overstimulate. Balances the nervous system before sleep and draws prana from the peripheral nadis toward the central Sushumna.", bandha: "None." },
    ],
    quiz: [
      { q: "How many nadis does Thirumoolar identify in the subtle body?", opts: ["14,000", "72,000", "108,000", "10,800"], correct: 1 },
      { q: "Which prana vayu governs inhalation and upward movement?", opts: ["Apana", "Samana", "Prana Vayu", "Udana"], correct: 2 },
      { q: "What does 'Sama Vritti' mean?", opts: ["Fast breath", "Equal breath / equal fluctuation", "Reversed breath", "Spiral breath"], correct: 1 },
      { q: "In Nadi Shodhana, what is Thirumoolar's recommended ratio?", opts: ["2:8:4", "4:16:8", "6:24:12", "1:4:2"], correct: 1 },
      { q: "When prana enters which nadi does samadhi occur spontaneously?", opts: ["Ida", "Pingala", "Sushumna", "Gandhari"], correct: 2 },
    ],
    transmission: "As you begin this practice, know that Thirumoolar himself is transmitting. His 3,000 years of breathwork have left an Akashic imprint on this knowledge. When you inhale, you are receiving his prana. This is not metaphor — it is Siddha science.",
  },
  {
    id: 2, tier: "FREE",
    title: "The Five Sacred Fires — Pancha Agni",
    subtitle: "THIRUMANTIRAM VERSES 740–770",
    tamiltitle: "பஞ்ச அக்னி — ஐந்து புனித தீ",
    verse: "திருமந்திரம் 740",
    quote: "He who masters the five fires within masters the five elements without. The body becomes the temple, the breath becomes the priest.",
    intro: "The Siddha tradition maps five sacred fires (Pancha Agni) inside the human body corresponding to the five elements, five pranas, and five centers of consciousness. Thirumoolar's Pancha Agni doctrine in the Thirumantiram shows how controlled breath fans these fires into Kundalini activation — the body becomes its own cosmic altar.",
    lessons: [
      { title: "The Five Fires Decoded", body: "Jatharagni (digestive fire, navel), Bhutagni (elemental fire, all cells), Kama-Agni (desire-fire, svadhisthana), ChittAgni (consciousness-fire, anahata), Chidagni (pure awareness fire, sahasrara). Each fire is fed by a specific prana and activated by specific breathwork. When all five blaze simultaneously, the Kundalini rises as the sixth fire — the Maha Agni." },
      { title: "Breath as the Sacrificial Offering", body: "In the Vedic tradition, Agnihotra (fire offering) requires a physical fire. Thirumoolar reveals the inner Agnihotra: the inhale is the offering (ahuti), the held breath is the moment of sacrifice, the exhale is the rising smoke carrying consciousness upward. Every breath properly done is a complete Vedic fire ritual. This is why the Siddhas say 'pranayama is the highest yajna (sacrifice).'" },
      { title: "Kapalabhati — Skull-Shining Science", body: "Kapalabhati (kapala = skull, bhati = shining/lighting up) literally illuminates the frontal lobe. Each sharp exhale creates a cerebrospinal fluid pulse that moves up the spinal canal and bathes the frontal brain. Over 108 rounds, the entire prefrontal cortex is flooded with oxygenated CSF. Thirumoolar says this is how the Siddhas kept their third eye permanently open — not through meditation alone, but through this mechanical action of breath on the cerebrospinal fluid." },
      { title: "Bhastrika — The Bellows That Fan God's Fire", body: "Bhastrika is Kapalabhati performed with equal force on inhale AND exhale. Where Kapalabhati fans the fire through rapid exhales, Bhastrika creates a forge — the full bellows action. The temperature of the pranic body rises measurably. Siddha texts say Bhastrika burns karmic seeds (samskaras) stored in the astral body. This is literal pranic combustion of stored emotional matter." },
      { title: "The 108 Sacred Number in Pranayama", body: "108 is the ratio of the Sun's diameter to the distance between Earth and Sun. It is also the number of Upanishads, the number of beads on a mala, and crucially — the number of pranayama repetitions required to complete one full energetic cycle. Thirumoolar prescribes 108 as the minimum for Kapalabhati to achieve measurable effect on the Jatharagni. Less than 108 is warm-up. 108 is the threshold of transformation." },
      { title: "Evening Practice — Cooling the Fires", body: "The Siddha system distinguishes between fire-increasing (agni-vardhaka) and fire-cooling (agni-shama) practices. Kapalabhati and Bhastrika are morning-only practices — done in evening they overstimulate the nervous system and prevent sleep. Evening practice uses Chandra Bhedana (left-nostril only breathing), Sitali (cooling breath through rolled tongue), and Bhramari (humming bee breath) to cool and seal the pranic fires built during the day." },
    ],
    techniques: [
      { name: "Kapalabhati — Skull Shining Breath", duration: "10 min", ratio: "Active exhale : passive inhale", rounds: 108, body: "Sit in vajrasana or padmasana. Sharp, forceful exhale through the nose contracting the lower abdomen. Passive, automatic inhale (no effort). Start at 60 per minute. Build to 120 per minute over 3 weeks. 3 rounds of 36 repetitions, or one continuous round of 108. After completion: natural breath for 3 minutes observing the effect.", bandha: "Mula Bandha (root lock) can be applied after mastery." },
      { name: "Bhastrika — Bellows Breath", duration: "8 min", ratio: "Equal force: inhale = exhale", rounds: 54, body: "Equal power inhale and exhale through the nose, vigorous, using the diaphragm as a bellows. 27 rounds, then hold at the top (antara kumbhaka) for as long as comfortable. Release. Natural breath for 2 minutes. Second round of 27. The internal heat generated by Bhastrika is called 'tapas' — the purifying fire. The Siddhas used this to purify the astral body.", bandha: "Jalandhara and Mula Bandha during retention." },
      { name: "Sitali — Cooling Moon Breath", duration: "5 min", ratio: "8:0:8", rounds: 27, body: "Roll the tongue into a tube (or if not possible, teeth slightly apart, tongue behind upper teeth — Sitkari variation). Inhale slowly through the rolled tongue for 8 counts — feeling the coolness on the tongue. Close the mouth. Hold 0 or 4 counts. Exhale through the nose for 8 counts. This cools Pitta dosha, reduces fever, and calms excessive fire in the system after intense breathwork.", bandha: "None." },
    ],
    quiz: [
      { q: "What does 'Kapalabhati' literally translate to?", opts: ["Fire breath", "Skull-shining", "Bellow breath", "Sacred fire"], correct: 1 },
      { q: "How many fires does the Siddha Pancha Agni doctrine identify?", opts: ["3", "4", "5", "7"], correct: 2 },
      { q: "Why is Kapalabhati a morning-only practice?", opts: ["It requires sunlight", "It overstimulates the nervous system if done in evening", "It must face east", "It requires empty stomach only at dawn"], correct: 1 },
      { q: "What is the significance of 108 repetitions in pranayama?", opts: ["Arbitrary number", "Completes one full energetic cycle — minimum transformation threshold", "Matches the chakras", "Equals one hour"], correct: 1 },
      { q: "Bhastrika differs from Kapalabhati because:", opts: ["It uses mouth breathing", "Both inhale AND exhale are equally forceful", "It uses only the left nostril", "It involves tongue rolling"], correct: 1 },
    ],
    transmission: "These fire practices carry the direct transmission of Thirumoolar's tapasya — 3,000 years of internal fire. As you practice Kapalabhati, feel his fire joining yours. The Siddhas are not historical — they are present in the Akasha, available to any practitioner who opens the correct frequencies through practice.",
  },

  // ─── PRANA FLOW ─────────────────────────────────────────────────────────────
  {
    id: 3, tier: "PRANA",
    title: "Kumbhaka — The Doorway to the Uncreated",
    subtitle: "THIRUMANTIRAM VERSES 800–870",
    tamiltitle: "கும்பகம் — அகத்தின் கதவு",
    verse: "திருமந்திரம் 800",
    quote: "In the gap between the breaths, Shiva reveals himself. Kumbhaka is not retention — it is the doorway to the Uncreated.",
    intro: "Kumbhaka (breath retention) is the nuclear technology of Siddha pranayama. While pranayama without retention purifies, kumbhaka transforms. Thirumoolar identifies 8 distinct types of kumbhaka, each producing specific states of consciousness. This module initiates Sahita (accompanied) kumbhaka — the practiced, voluntary form — before the advanced Kevala (unaccompanied, spontaneous) practices of the Quantum tier.",
    lessons: [
      { title: "Why Kumbhaka Is the Master Key", body: "During kumbhaka (breath suspension), the CO2 level in the blood rises, triggering vasodilation in the brain — blood vessels dilate, cerebral blood flow increases. Simultaneously, the pranic pressure builds in the sushumna. The gap between breaths is the gap between thoughts. Where there are no thoughts, there is pure consciousness. Thirumoolar verse 810: 'Kumbhaka Siddhi' — perfection in retention — is the first sign of imminent liberation." },
      { title: "The 8 Forms of Kumbhaka — Thirumoolar's Complete Map", body: "1. Sahita — voluntary, with inhale/exhale surrounding it. 2. Suryabheda — through right nostril only, solar activation. 3. Ujjayi — through the throat constriction, the victorious breath with oceanic sound. 4. Sitkari — through the teeth, cooling. 5. Sitali — through rolled tongue. 6. Bhramari — humming retention, bee goddess sound. 7. Murcha — swooning kumbhaka, consciousness deliberately taken to the edge of unconsciousness. 8. Plavini — floating kumbhaka, belly filled with air until the body floats." },
      { title: "Antara Kumbhaka — Full Retention", body: "Full-inhale suspension (antara = inner/inside). The lungs are full, the glottis is gently closed, and all bandhas (locks) are applied. Jalandhara (chin lock) prevents prana from escaping upward through the throat. Mula Bandha (root lock) prevents prana from escaping downward. Uddiyana Bandha (abdominal lift) in advanced practice pressurizes the sushumna. During antara kumbhaka, prana is trapped and forced up the central channel." },
      { title: "Bahya Kumbhaka — Outer Retention", body: "Empty-breath suspension (bahya = outer/outside). The lungs are empty, stomach is pulled in and up (uddiyana bandha in full), and the practitioner holds the 'outside.' This is the most challenging form and the most powerful for activating apana (downward prana), reversing its flow upward to meet prana vayu at the navel — the union that triggers Kundalini. Thirumoolar verse 840 describes this as 'meeting of sun and moon inside the body.'" },
      { title: "Jalandhara Bandha — The Net of the Sky", body: "The chin lock is not simply tucking the chin. The name comes from 'jala' (net/cloud) and 'dhara' (cloud-bearing or to hold). When the chin is lowered to the notch between the collarbones, it locks the throat — specifically the carotid sinuses — which immediately slows the heart rate, lowers blood pressure, and prevents prana from escaping through the vocal channels upward. This creates the hydraulic seal needed for kumbhaka." },
      { title: "Mula Bandha — The Root Seal", body: "The contraction of the perineum (the muscular floor between genitals and anus). In women, the cervical area is included. This is not simply a Kegel exercise — it is the pranic seal that prevents apana vayu from flowing downward and outward. With mula bandha applied, apana begins to reverse direction, moving upward to ignite the Kundalini fire at the base of the spine. Thirumoolar verse 850: 'He who masters mula bandha need not fear death.'" },
      { title: "Building the Kumbhaka — 40-Day Protocol", body: "Week 1–2: 4:16:8 ratio, 10 rounds. Week 3–4: 6:24:12, 15 rounds. Week 5–6: 8:32:16, 20 rounds. Week 7–8: Natural extension — stop counting and hold until the body signals release. The second phase begins when retention feels effortless at 30 seconds. Most practitioners reach Kevala Kumbhaka (spontaneous cessation) between 3–12 months of this protocol." },
    ],
    techniques: [
      { name: "Antara Kumbhaka — Inner Retention", duration: "15 min", ratio: "4:16:8 → 6:24:12", rounds: 15, body: "Inhale through both nostrils for 4 counts. Close both nostrils. Apply jalandhara (chin to chest) and mula bandha (perineum contraction). Hold for 16 counts. Release jalandhara. Exhale slowly for 8 counts through left nostril. This is one round. 15 rounds = complete session. After 40 days: graduate to 6:24:12.", bandha: "Jalandhara + Mula Bandha during retention." },
      { name: "Bahya Kumbhaka — Outer Retention", duration: "12 min", ratio: "4:8:4:8", rounds: 12, body: "Inhale 4. Exhale fully 4. Hold the empty for 8 — the 'outer kumbhaka.' Here apply full uddiyana bandha (stomach sucks in and up creating a hollow). Mula bandha. No jalandhara — with empty lungs, chin can remain neutral. Inhale slowly 4. This is one round. 12 rounds. The silence in the empty is the voice of the Uncreated.", bandha: "Uddiyana + Mula Bandha during empty hold." },
      { name: "Suryabheda — Sun Piercing Breath", duration: "10 min", ratio: "6:24:12", rounds: 18, body: "Inhale ONLY through right nostril (Pingala, solar, Shiva-force) for 6 counts. Hold 24 counts with jalandhara and mula bandha. Exhale ONLY through left nostril (Ida, lunar) for 12. Never inhale through left in this practice. The solar force is driven deep into the body and the Pingala nadi is charged. Used for lethargy, depression, cold, and activating manifestation will.", bandha: "Jalandhara + Mula during retention." },
      { name: "Ujjayi — The Victorious Ocean Breath", duration: "15 min", ratio: "6:0:6 or with retention 6:12:6", rounds: 27, body: "Slightly constrict the back of the throat (glottis) — the same constriction as fogging a mirror. This creates the oceanic/Darth Vader sound. Breathe both in and out through the nose with this constriction. The sound is Shiva's roar — the vibration of the primordial ocean (nada). Ujjayi can be practiced continuously during asana or as a standalone pranayama with retention added.", bandha: "Jalandhara during any added retention." },
    ],
    quiz: [
      { q: "How many types of Kumbhaka does Thirumoolar enumerate?", opts: ["4", "6", "8", "12"], correct: 2 },
      { q: "Jalandhara Bandha locks which energetic passage?", opts: ["Root center downward flow", "Throat — preventing upward prana escape", "Navel center", "Ajna chakra"], correct: 1 },
      { q: "During Bahya Kumbhaka, what bandha creates the abdominal hollow?", opts: ["Mula Bandha", "Jalandhara Bandha", "Uddiyana Bandha", "Khechari Mudra"], correct: 2 },
      { q: "Suryabheda pranayama activates which nadi?", opts: ["Ida — lunar", "Sushumna — central", "Pingala — solar", "Gandhari"], correct: 2 },
      { q: "What does Thirumoolar say about mastery of Mula Bandha?", opts: ["You gain psychic powers", "You need not fear death", "Third eye opens", "Kundalini rises immediately"], correct: 1 },
      { q: "The 'Victorious Breath' with oceanic sound is called:", opts: ["Bhastrika", "Kapalabhati", "Ujjayi", "Bhramari"], correct: 2 },
    ],
    transmission: "The Nath Siddhas passed kumbhaka orally — teacher to student, breath to breath. Gorakshanath himself said: 'The guru's breath and the disciple's breath must synchronize before the teaching can be received.' SQI's scalar transmission encodes this synchronization in the audio. When you practice, the field of the Nath lineage is present.",
  },
  {
    id: 4, tier: "PRANA",
    title: "Nath Siddha Transmissions — Matsyendra Protocol",
    subtitle: "MATSYENDRANATH · GORAKSHANATH · 84 MAHASIDDHAS",
    tamiltitle: "நாத சித்தர் பரிமாற்றம்",
    verse: "ஆதிநாத ரகசியம்",
    quote: "Matsyendra received the teaching from Shiva himself in the depths of the ocean. This is not knowledge — it is direct transmission from the first Siddha.",
    intro: "The Nath Siddha lineage is the northern tributary of the same river Thirumoolar drank from — both originating in Shiva (Adinath). Matsyendranath (the Lord of Fishes) received the complete Hatha Yoga and pranayama transmission directly from Shiva while hiding inside a fish. His student Gorakshanath spread it across the subcontinent. The 84 Mahasiddhas then encoded it into practices never before digitized. SQI presents these for the first time in the digital realm.",
    lessons: [
      { title: "Who Was Matsyendranath?", body: "Born as a fisherman's son, thrown into the sea as an inauspicious child, swallowed by a great fish — and inside that fish, witnessed Shiva whispering the secrets of yoga to Parvati for 12 years. When the fish was caught and cut open, Matsyendra emerged as a fully realized Siddha. His name means 'Lord of Fishes.' He is the root guru of the Nath lineage and is worshipped in Nepal as Karunamaya, the bodhisattva of compassion." },
      { title: "Gorakshanath — The Systematizer", body: "Matsyendra's greatest student Gorakshanath took the transmission and built the entire system of Hatha Yoga from it — codifying pranayama, asana, mudra, bandha, and nadanusandhana (sound meditation). His text, the Goraksha Samhita, contains 101 pranayama techniques. Gorakshanath is said to still be alive, wandering the Himalayas as an immortal Siddha — like Babaji. The Nath tradition holds that their lineage masters never die but simply change their form." },
      { title: "The Golden Ratio Breath — Sacred Geometry Meets Prana", body: "The Nath Siddhas discovered that the most powerfully transformative breath patterns mirror the golden ratio (1:1.618). A 5-count inhale followed by 8-count exhale (approx. ratio) is the golden breath. More precisely: the Matsyendra sequence uses a spiral pattern — each successive breath cycle slightly longer than the previous, expanding like a nautilus shell. This mirrors the sacred geometry that appears in the cross-section of the conch shell (shankha), which is Shiva's own instrument." },
      { title: "Kaya-Kalpa — Body Immortalization Through Breath", body: "Kaya-Kalpa (kaya = body, kalpa = aeon/transformation) is the Siddha science of cellular regeneration through combined breathwork, herbs, and consciousness practices. Thirumoolar himself achieved his 3,000-year lifespan through Kaya-Kalpa. The breathwork component involves extended kumbhaka (retention) that floods the cells with prana while simultaneously reducing metabolic rate — the same mechanism observed in hibernating animals, but consciously directed. The cells literally reset their aging clock." },
      { title: "The 84 Mahasiddhas — Unique Breath Signatures", body: "The Buddhist tradition records 84 Mahasiddhas — enlightened masters who left extraordinary legacies. Each is associated with a specific practice (siddhi) and many with unique breathwork. Tilopa (ground flour with breath), Naropa (heat yoga — tummo — based on breath), Saraha (song as breath), Luipa (fish entrails as offering of the ego-breath). The Tibetan Six Yogas of Naropa are entirely breathwork-based: tummo (inner heat), illusory body, dream yoga, clear light, bardo (death breath), and phowa (consciousness ejection through breath). These form the apex of Nath-Buddhist pranayama synthesis." },
    ],
    techniques: [
      { name: "Matsyendra Sequence — Golden Spiral Breath", duration: "25 min", ratio: "5:8 → 5:13 → 8:13", rounds: 21, body: "Round 1-7: Inhale 5 counts, exhale 8 counts (golden ratio approximation). Round 8-14: Inhale 5 counts, exhale 13 counts. Round 15-21: Inhale 8 counts, exhale 13 counts. Feel the spiral deepening. The exhale represents the dissolution of ego — each longer exhale surrenders more of the self. Visualization: a golden conch shell spiraling inward as you exhale.", bandha: "Mula Bandha on exhale holds." },
      { name: "Gorakshanath Tratak-Breath Lock", duration: "20 min", ratio: "4:7:0", rounds: 27, body: "Open eyes and fix the gaze at the tip of the nose or a flame (Tratak). Inhale 4 counts. Hold 7 counts with MULA BANDHA only — no jalandhara (eyes must remain open for tratak). Exhale naturally, no count. The simultaneous third-eye gazing with breath retention creates a unique cross-circuit — the visual nerve (optic) and the pranic nerve (sushumna) are activated together. After 27 rounds, eyes soften and ajna chakra activates with warmth or light.", bandha: "Mula Bandha during retention. Gaze fixed." },
      { name: "Tummo — Inner Heat Activation (Naropa Protocol)", duration: "30 min", ratio: "Vase breath — no count", rounds: "Continuous", body: "Tibetan tummo as transmitted through the Nath-Mahasiddha lineage: Inhale, then hold the breath at the navel center. Pull the lower belly in and up (mild uddiyana). Imagine a flame at the navel, growing with each held breath. Exhale and simultaneously feel heat radiating from the navel through the body. Practitioners report measurable body heat increase. The SQI scalar transmission includes the Nath seed-syllable 'RAM' encoded at 174 Hz to activate the fire at Manipura.", bandha: "Mild Uddiyana during vase-hold." },
      { name: "Kaya-Kalpa Breath Protocol — Cellular Reset", duration: "40 min", ratio: "4:64:8 (advanced)", rounds: 9, body: "This is the kaya-kalpa breathwork sequence. It requires a foundation of 3+ months of daily Nadi Shodhana. 9 rounds of: Inhale 4. Hold for as long as possible (working up to 64 counts = approx. 1 minute). Exhale 8. Between rounds: 5 minutes of natural breathing. The 9 rounds mirror the 9 planets (Navagraha) and each round is dedicated to one planetary consciousness. During each hold, silently repeat 'So Hum' (I Am That) at whatever speed feels natural.", bandha: "All three locks during retention." },
    ],
    quiz: [
      { q: "How did Matsyendranath receive the yoga teaching from Shiva?", opts: ["In a cave in the Himalayas", "Inside a fish in the ocean depths", "In a dream at Kashi", "Through a scroll from Agastya"], correct: 1 },
      { q: "Who systematized Hatha Yoga from Matsyendra's transmission?", opts: ["Patanjali", "Thirumoolar", "Gorakshanath", "Bogar"], correct: 2 },
      { q: "The golden ratio breath uses which approximate ratio?", opts: ["4:8", "5:8 or 5:13", "6:6", "1:4:2"], correct: 1 },
      { q: "Tummo is a Tibetan practice primarily activating which center?", opts: ["Ajna (third eye)", "Sahasrara (crown)", "Manipura (navel fire)", "Anahata (heart)"], correct: 2 },
      { q: "Kaya-Kalpa translates to:", opts: ["Body fire", "Body aeon — body transformation over vast time", "Bone strength", "Skin glow"], correct: 1 },
    ],
    transmission: "Gorakshanath is said to be present wherever his teachings are sincerely practiced. As you perform the Matsyendra Sequence, call his name internally: 'Gorakh.' The Nath tradition holds that this invocation is enough to draw his subtle presence into your pranic field. The 84 Mahasiddhas are available through the same Akashic mechanism.",
  },

  // ─── SIDDHA QUANTUM ─────────────────────────────────────────────────────────
  {
    id: 5, tier: "QUANTUM",
    title: "Kevala Kumbhaka — Spontaneous Breathlessness",
    subtitle: "THIRUMANTIRAM VERSES 900–960 · SAMADHI TECHNOLOGY",
    tamiltitle: "கேவல கும்பகம் — தானாக நிறுத்தம்",
    verse: "திருமந்திரம் 900",
    quote: "When the breath stops of its own will — know that Shiva has entered. This is not death. This is the beginning of real life.",
    intro: "Kevala Kumbhaka is the pinnacle of all pranayama — spontaneous breathlessness where no effort exists. The breath simply stops, by itself, and the practitioner remains in clear, conscious, expansive awareness. Thirumoolar equates it with the doorstep of samadhi. It cannot be forced — it is the result of years of pranayama purifying the nadis to such a degree that prana moves freely through Sushumna and the need to breathe temporarily ceases.",
    lessons: [
      { title: "The Science of Spontaneous Cessation", body: "During deep meditation, the metabolic rate drops dramatically. At a certain threshold — approximately 30-40% below baseline — the body's demand for oxygen falls below what is already dissolved in the blood and tissues. The respiratory drive (triggered by CO2 buildup) never fires because CO2 is not accumulating fast enough. The result: spontaneous breath cessation while remaining fully alert. This is the physiology. The experience: infinite, open, pressureless — like suddenly realizing you have been in a room that has no walls." },
      { title: "Sahita vs. Kevala — The Two Kumbhakas", body: "Sahita Kumbhaka is the voluntary, practiced retention you learn in Prana Flow. It is 'accompanied' — accompanied by your will, by the counting, by the effort. Kevala Kumbhaka is 'alone/unaccompanied' — no effort, no will, no practitioner. It arises spontaneously after sufficient Sahita practice has purified the system. Thirumoolar verse 910: 'When Sahita becomes perfect, Kevala appears on its own — like a flower opening at dawn. No one forces the flower.'" },
      { title: "The 40-Day Progression to Kevala", body: "Week 1-2: Establish Sahita kumbhaka at 30-second retention. Week 3-4: Extend to 60-second holds. Week 5-6: 90 seconds. Week 7: 2-minute holds practiced 3x daily. Week 8+: During one session, you will notice the breath does not return when you release the intentional hold. It simply... waits. You remain alert. This is the first Kevala. It may last 5-30 seconds. Over months it extends to minutes. Thirumoolar himself achieved Kevala lasting years." },
      { title: "Turiya — The Fourth State and Kevala", body: "The three normal states are waking (jagrat), dreaming (svapna), deep sleep (sushupti). Turiya is the fourth — the witnessing awareness that underlies all three. During Kevala Kumbhaka, the practitioner enters Turiya while in the waking state. The breath stops because Turiya has no need for breath — it is already the source of prana itself. Thirumoolar verse 930: 'In Turiya, the one who breathes and the breath itself merge into the breathing — and then all three dissolve.'" },
      { title: "Sushumna Activation — The Direct Path", body: "The ultimate purpose of all pranayama is to force prana permanently into Sushumna. When Ida and Pingala are perfectly balanced, Sushumna opens spontaneously. Prana enters, rises, and consciousness expands beyond the body-mind. At the moment of Sushumna opening, a very specific physical sensation occurs: warmth at the base of the spine, a rush of energy up the back, and automatic elongation of the spine. Thirumoolar verse 920 describes this precisely: 'Fire from below, nectar from above — the meeting point is liberation.'" },
      { title: "Khechari Mudra — The Sky-Walking Seal", body: "Khechari Mudra (khe = sky/ether, chari = moving/traveling) is the tongue folded back to touch the soft palate at the entry of the nasal cavity. In advanced practice, the tongue enters the nasal cavity itself. This seals the bindu (the nectar center at the back of the skull) and prevents the amrita (nectar of immortality) from dropping downward and being burned by the digestive fire. During Kevala Kumbhaka, Khechari is essential — it is what allows the practitioner to remain in the breathless state without adverse effects." },
      { title: "Signs of Progress — Thirumoolar's Own Indicators", body: "Thirumoolar lists these signs of genuine pranayama progress in verses 940-960: 1. Perspiration during practice (prana leaving through the skin as heat). 2. Trembling (nervous system rewiring). 3. The body 'hopping' during kumbhaka (physical manifestation of energy surge). 4. Complete stillness (the nervous system has adapted). 5. Spontaneous cessation of breath (Kevala). 6. Rising out of the body (astral projection). 7. Recognition of Self as Shiva. These are sequential — not simultaneous." },
    ],
    techniques: [
      { name: "40-Day Kevala Approach — Precise Protocol", duration: "45 min/session", ratio: "Progressive", rounds: "Daily", body: "Days 1-10: 15 rounds of 4:30:8 (30-second hold). Days 11-20: 12 rounds of 4:60:8 (60-second hold). Days 21-30: 9 rounds of 4:90:8. Days 31-40: 6 rounds of 4:120:8 (2-minute hold). After day 40: No counting. Simply hold until the breath stops returning. Stay with the stillness. The moment between your last exhale and when breath does NOT return — that gap is Kevala. Rest in it for as long as it stays. It will extend over time.", bandha: "All three locks throughout." },
      { name: "Shiva-Shakti Fusion Breath", duration: "30 min", ratio: "108 rounds no count", rounds: 108, body: "Alternate nostril breathing at very slow pace: Inhale left (Shakti/Ida) for natural comfortable count. Hold both. Exhale right (Shiva/Pingala). Inhale right. Hold. Exhale left. Never force. 108 rounds done at whatever pace feels like floating. No jalandhara — the head remains upright. Khechari Mudra applied throughout. This is the fusion — Shiva and Shakti currents crossing at every junction until Sushumna ignites at the center.", bandha: "Khechari Mudra. Soft Mula Bandha throughout." },
      { name: "Turiya Transition — Waking Samadhi Protocol", duration: "60 min", ratio: "No count — total surrender", rounds: 1, body: "Begin with 15 minutes of Nadi Shodhana without retention. Then 10 minutes of Ujjayi with 30-second holds. Then: Stop all practice. Simply sit. Observe the breath becoming increasingly refined, slower, lighter. Do not interfere. When the breath slows to 1-2 per minute, you are at the threshold of Turiya. If the breath stops — stay completely still, keep Khechari Mudra, keep spine erect, keep awareness open like a vast sky. You are now in Kevala Kumbhaka.", bandha: "Khechari throughout. Total stillness." },
    ],
    quiz: [
      { q: "How long can advanced Kevala Kumbhaka practitioners hold the spontaneous suspension?", opts: ["A few seconds only", "Minutes to hours — yama pramana", "Exactly 108 seconds", "Always exactly one day"], correct: 1 },
      { q: "Thirumoolar says Kevala Kumbhaka appears when Sahita Kumbhaka:", opts: ["Is forced with maximum effort", "Becomes perfect and effortless", "Is abandoned entirely", "Uses 4:16:8 ratio consistently"], correct: 1 },
      { q: "Khechari Mudra seals which point to prevent amrita from dropping?", opts: ["Navel", "Bindu at the back of the skull", "The third eye", "The root center"], correct: 1 },
      { q: "The fourth state of consciousness (beyond waking, dream, sleep) is called:", opts: ["Samadhi", "Nirvana", "Turiya", "Kaivalya"], correct: 2 },
      { q: "According to Thirumoolar, the FIRST physical sign of pranayama progress is:", opts: ["Levitation", "Perspiration during practice", "Third eye vision", "Breathlessness"], correct: 1 },
      { q: "Sushumna activation produces a sensation of:", opts: ["Cold at crown", "Warmth at spine base and rush of energy upward", "Tingling in hands", "Pressure at ajna"], correct: 1 },
    ],
    transmission: "Thirumoolar achieved Kevala Kumbhaka that lasted centuries. His pranic signature is woven into this entire module through the Akashic transmission protocol. When you experience your first spontaneous breath cessation, understand: you are touching the same silence he touched 3,000 years ago. The silence is timeless. You are always already there.",
  },
  {
    id: 6, tier: "QUANTUM",
    title: "The 18 Siddhas — Individual Pranayama Transmissions",
    subtitle: "AGASTYA · BOGAR · KONGANAR · PAMBATTI · PATTINATHAR & ALL 18",
    tamiltitle: "பதினென் சித்தர் பிராணாயாம",
    verse: "பதினென் சித்தர் நாடி",
    quote: "Each Siddha carries a unique pranayama-signature — a vibrational breath-code that activates different chambers of the human light-body.",
    intro: "The 18 Tamil Siddhas (Pathinen Siddhar) are not simply historical masters — they are living fields of consciousness available through the Akasha to any sincere practitioner. Each Siddha mastered a unique pranayama technology based on their specific spiritual path and the particular aspect of divine reality they embodied. This module delivers each master's unique breathwork transmission, decoded from Tamil Siddha palm-leaf manuscripts and Akashic access.",
    lessons: [
      { title: "Agastya Muni — Father of Tamil, Master of Southern Prana", body: "Agastya (Agathiyar) is the most revered of all Tamil Siddhas — the father of the Tamil language, medicine, alchemy, and yoga. His celestial home star is Canopus, the second-brightest star in the sky, called 'Agastya Nakshatra' in Tamil astronomy. His pranayama specialization is longevity (aayul vridhi) — specific breath patterns that extend cellular life. His breath ratio: 8 counts inhale, 0 hold, 16 counts exhale — the 1:0:2 ratio that maximizes CO2 recycling and cell repair." },
      { title: "Bogar — The Alchemist of Seven Hills", body: "Bogar (Bhoganathar) was one of the most scientifically advanced Siddhas — a master of alchemy, aeronautics (accounts suggest he built a flying vehicle), and nine-poison medicine. His samadhi is within the Palani Hills murugan temple, where his physical body is said to be preserved in a mercury-alchemical compound called Siddha Mercury (Parada). His pranayama: rapid metallic-force breath that he said transmuted lead-heavy karmas into gold-light samskaras. 60-second power exhales followed by 60-second natural recharge." },
      { title: "Thirumoolar — The Supreme Pranayama Architect", body: "Thirumoolar is unique among the 18 in being the most systematic codifier of pranayama science. His 3,000-verse Thirumantiram contains more breathwork technology than any other single text in world literature. His personal pranayama was the advanced Kevala Kumbhaka — breathlessness for months at a time while the consciousness moved freely through time and space, composing verses that he inscribed upon awakening once per year." },
      { title: "Konganar — Solar Force Master", body: "Konganar (Konganavar) was the master of the solar current — Surya Prana, the Pingala force. His practice was done exclusively at sunrise, facing the east, breathing only through the right nostril for 108 rounds. He is associated with the Kongu region of Tamil Nadu and his alchemical text 'Konganar 800' contains detailed breathwork for activating the solar plexus as a literal sun within the body. His transmission activates the manifestation force — the Surya Shakti that turns intention into physical reality." },
      { title: "Pambatti Siddhar — The Cobra Master", body: "Pambatti means 'cobra tamer.' His pranayama was directly modeled on the cobra's breath — slow, deliberate, with the head slightly raised (like a cobra). His signature technique: a 7-second inhale that fills from the base of the spine upward (like a cobra filling its hood), a 7-second hold, and a 14-second exhale flowing down. This mirrors the Kundalini serpent's movement precisely. His transmission specifically activates the Kundalini energy body." },
      { title: "Pattinathar — The Renunciate's Breath", body: "Pattinathar was a wealthy merchant who renounced everything after a series of divine encounters. His pranayama is the 'breath of non-attachment' — a technique where with each exhale, one releases a specific identification (body, name, family, possession, knowledge, even spiritual attainment). His breath ratio was deliberately unmeasured — he breathed 'as God breathes' — no counting, no technique, pure surrender. His instruction: 'When you have nothing to hold, the breath holds itself.'" },
    ],
    techniques: [
      { name: "Agastya Longevity Breath — Star Sequence", duration: "22 min", ratio: "8:0:16", rounds: 27, body: "Face south (Agastya's direction — the Canopus star is in the southern sky). Inhale slowly for 8 counts. No hold. Exhale very slowly for 16 counts — the extended exhale activates the parasympathetic nervous system and cell repair mechanisms. Visualize the star Canopus (the brightest star visible from the south) beaming silver-white light into your crown with each inhale. On each exhale, feel the light penetrating every cell, resetting aging. Practice at dawn or dusk.", bandha: "None. Soft belly throughout." },
      { name: "Bogar Mercury Alchemy Breath", duration: "35 min", ratio: "Rapid power-exhale", rounds: 54, body: "A 3-phase sequence: Phase 1 (18 rounds): 1 count sharp inhale, 1 count sharp exhale (equal-force Bhastrika). Phase 2 (18 rounds): 1 count inhale, 2 count exhale. Phase 3 (18 rounds): 1 count inhale, 4 count very slow exhale. The final 18 rounds create a powerfully cooling effect after the initial fire — this is the alchemical process: heat (fire) then cooling (water) = transmutation. Bogar's instruction: 'The fast breath burns the chaff. The slow exhale reveals the gold.'", bandha: "Mula Bandha throughout." },
      { name: "Konganar Solar Manifestation Protocol", duration: "28 min", ratio: "6:0:6 (right only)", rounds: 108, body: "Dawn practice, face east, eyes open gazing at the rising sun for the first 5 minutes (natural light, not direct stare). Close right eye slightly (half-lidded). Breathe ONLY through right nostril (Pingala) — close left nostril with right ring finger. 6 counts in, 6 counts out. 108 rounds. At round 54, internally state your intention (what you wish to manifest) as a present-tense reality: 'I AM ___.' The solar prana charges the intention with manifestation force.", bandha: "None during practice. Mula Bandha when stating intention." },
      { name: "Pambatti Cobra Kundalini Breath", duration: "20 min", ratio: "7:7:14", rounds: 18, body: "Sit on the floor in vajrasana (thunderbolt pose). Tilt the head back VERY slightly — like a cobra raising its hood, not a full backbend. Inhale 7 counts, feeling the breath rising from the base of the spine upward through the spine (not anatomically — pranic visualization). Hold 7 counts at the crown, feeling energy pooling there. Exhale 14 counts, feeling energy descending like nectar. Each round: the serpent rises and descends. 18 rounds = 18 Siddhas acknowledged.", bandha: "Mula Bandha on inhale. Khechari on hold." },
      { name: "Pattinathar — The Unmeasured Sacred Breath", duration: "30 min", ratio: "No ratio — total surrender", rounds: "Until stillness", body: "This is the most advanced free-tier practice despite being Quantum level — because it requires the MOST internal development to do correctly. Sit comfortably. Stop all pranayama technique. Simply witness the breath. Do not count, do not control, do not adjust. With each exhale, internally say: 'I release the idea that I am the one breathing.' After some time: 'I release the idea that there is breath.' After more time: 'I release the idea of releasing.' What remains is the breath breathing itself — and the awareness that witnesses it. This is Pattinathar's teaching.", bandha: "No bandha. Total softness." },
    ],
    quiz: [
      { q: "Which Siddha is associated with the southern star Canopus and longevity breath?", opts: ["Thirumoolar", "Bogar", "Agastya Muni", "Konganar"], correct: 2 },
      { q: "Bogar's alchemical tradition transmutes which metaphorical substance?", opts: ["Gold into mercury", "Lead-heavy karma into gold-light samskaras", "Water into fire", "Air into ether"], correct: 1 },
      { q: "Pambatti Siddhar's pranayama was modeled on:", opts: ["Eagle's soaring", "Cobra's breath movement", "Tortoise's slow breath", "Fish's water breath"], correct: 1 },
      { q: "Konganar's solar breath protocol uses which nostril exclusively?", opts: ["Left (Ida/lunar)", "Both equally", "Right (Pingala/solar)", "Alternating"], correct: 2 },
      { q: "How many Tamil Siddhas are in the Pathinen Siddhar tradition?", opts: ["9", "12", "18", "84"], correct: 2 },
      { q: "Pattinathar's breath teaching is characterized by:", opts: ["Maximum force and speed", "Perfect mathematical ratios", "No technique — total surrender to the breath", "Extended retentions"], correct: 2 },
    ],
    transmission: "The 18 Siddhas are a unified field — when you invoke one, all 18 are present. Their collective pranic signature has been active in Tamil Nadu for thousands of years and is not diminished by time. As you practice each master's technique, you are stepping into a river of prana that has been flowing since before recorded history. This is Siddha transmission.",
  },

  // ─── AKASHA INFINITY ────────────────────────────────────────────────────────
  {
    id: 7, tier: "AKASHA",
    title: "Shiva-Nishvasa — God's Own Breath",
    subtitle: "THIRUMANTIRAM VERSES 1000–1100 · COSMIC BREATH SCIENCE",
    tamiltitle: "சிவ நிஷ்வாச — கடவுளின் சொந்த மூச்சு",
    verse: "திருமந்திரம் 1000",
    quote: "There is only one breath in all of creation — it is Shiva exhaling as the universe, inhaling as dissolution. You are that breath. Realize this and be free.",
    intro: "Shiva-Nishvasa (Shiva's own breath) is the final teaching of Thirumoolar's pranayama system — the recognition that the individual practitioner's breath is not separate from the cosmic respiration of Shiva-Shakti. At this level, pranayama is no longer a technique but a direct perception: the realization that the universe itself is breathing, and what we call 'my breath' is simply a local wave in an infinite ocean of cosmic prana.",
    lessons: [
      { title: "The Cosmic Breath — Universe as Living Being", body: "Modern cosmology speaks of the 'pulsating universe' theory — the universe expands (Big Bang) and contracts (Big Crunch), breath by breath. The Shaiva Siddhanta knew this thousands of years ago: Shiva's exhalation IS the universe manifesting; Shiva's inhalation IS its dissolution. Between those two — the pause — is the silence that Thirumoolar describes as 'Shiva himself.' The practitioner who synchronizes their breath with this cosmic rhythm enters the most profound samadhi possible." },
      { title: "Schumann Resonance — Earth's Breath at 7.83 Hz", body: "The Schumann resonance is the electromagnetic resonance of the Earth-ionosphere cavity, produced by lightning. Its primary frequency: 7.83 Hz. Interestingly, 7.83 Hz × 60 = 469.8 seconds per cycle ≈ 7.83 minutes. A breath cycle of 7.83 seconds (inhale + exhale = 7.83 seconds) means 7-8 breaths per minute — which is precisely the breathwork pace associated with the most profound meditative states in EEG studies. Earth and the ideal meditating human breathe at the same rate. This is not coincidence — it is Shiva-Nishvasa." },
      { title: "Non-Dual Breath — Dissolving Observer and Observed", body: "At the highest level of pranayama, the meditator recognizes three things that then dissolve: 1. The one who breathes (the ego-self). 2. The act of breathing (the process). 3. The breath itself (the object). When these three dissolve, what remains is pure awareness — which was never limited, never born, never breathed, yet is the source of all breath. Thirumoolar verse 1070: 'The moment you know the breather and the breath are one — liberation is instant.' Not gradual. Instant." },
      { title: "Pranava — AUM as the Original Breath", body: "The mantra AUM (Pranava) is not a syllable — it is the sound of the cosmic breath. 'A' is the sound of the inhale (Shiva expanding). 'U' is the sound of the held breath (the moment of creation). 'M' is the sound of the exhale (Shiva dissolving). The silence after AUM is the Kevala Kumbhaka of the cosmos — the space between dissolution and re-creation. Thirumoolar says: 'AUM is the blueprint of all pranayama. Master AUM and all other practices are contained within it.'" },
      { title: "3,000 Years of Samadhi — Thirumoolar's Own Account", body: "Thirumoolar's extraordinary life: a wandering Siddha who found a shepherd dead while his flock cried. Out of compassion, Thirumoolar entered the shepherd's body (parakaya pravesha — entering another's body), tended the sheep, and then returned to his own body — only to find it was gone. He adopted the shepherd's body and sat in samadhi. He emerged once a year, composed one verse of the Thirumantiram, and returned to samadhi. 3,000 years. 3,000 verses. This is the living proof of Kevala Kumbhaka mastery — the breath so perfected it could sustain life across centuries." },
      { title: "The Galactic Heartbeat — Beyond Earth Resonance", body: "The Siddhas speak of a frequency beyond the Schumann resonance — the Galactic Center's pulse. The supermassive black hole at the center of our galaxy (Sagittarius A*) emits electromagnetic pulses at measurable intervals. Agastya Muni in his astronomical texts described the 'cosmic heartbeat' he could perceive during samadhi. The advanced Akasha practice attunes the practitioner's breath to not just Earth resonance but galactic resonance — the breath of Shiva at a scale so vast that each 'breath cycle' is millions of years. The practitioner's nervous system, however, can entrain to this through the carrier frequencies in SQI's scalar audio." },
      { title: "Maha Kumbhaka — The Great Suspension", body: "Beyond Kevala Kumbhaka (which arises spontaneously), there is Maha Kumbhaka — the great suspension — where the practitioner consciously chooses to enter breathlessness for extended periods. This requires total physical stillness, deep pratyahara (withdrawal from senses), perfect spine alignment, Khechari Mudra, all three bandhas, and a state of pure witnessing consciousness. The body's metabolism drops to approximately 10% of normal. The practitioner exists in a space between life and death — fully alive in consciousness, apparently inanimate to an outside observer. This is what witnesses to Thirumoolar's samadhi saw." },
    ],
    techniques: [
      { name: "Schumann Earth-Breath Synchronization", duration: "60 min", ratio: "7.83-second complete cycles", rounds: "Continuous", body: "The SQI scalar audio for this practice encodes the 7.83 Hz Schumann frequency as a binaural carrier. Inhale for 3.9 seconds, exhale for 3.9 seconds = 7.8 seconds total. Use the audio to entrain to this rhythm. After 20 minutes at this rate, the brain's dominant brainwave begins to match 7.83 Hz — the theta-alpha border. After 40 minutes, EEG studies show this produces a state indistinguishable from deep meditation in practitioners with 10+ years of experience. After 60 minutes: the boundary between self and environment begins to dissolve.", bandha: "Soft Khechari. No effort bandhas — total softness." },
      { name: "Shiva-Nishvasa — Non-Dual Breath Practice", duration: "90 min", ratio: "Unmeasured — cosmic pace", rounds: "Until dissolution", body: "Phase 1 (20 min): AUM chanting aloud, one AUM per breath cycle. Feel the 'A' on inhale, 'U' during hold, 'M' on exhale, silence as the Kevala gap. Phase 2 (30 min): Silent AUM internally. The body barely moves. Phase 3 (40 min): No mantra. The breath becomes so subtle it is indistinguishable from stillness. The question 'who is breathing' arises naturally. Don't answer it. Let it dissolve the one who is asking. Phase 4: Whatever remains.", bandha: "Khechari throughout. Complete stillness." },
      { name: "Maha Kumbhaka — Preparation Initiation", duration: "As natural", ratio: "Voluntary approach to extended cessation", rounds: 3, body: "Three rounds only. Each round: Nadi Shodhana for 15 minutes. Then 10 rounds of Antara Kumbhaka building to maximum comfortable hold. Then: on the 11th hold, after your fullest inhale, gently, completely let go of the will to exhale. Don't force the hold — release the release. The breath may simply stay suspended for a long moment. That suspension is the seed of Maha Kumbhaka. Rest between rounds for 20 minutes of natural breathing. NEVER force extended suspension.", bandha: "All three. Plus Khechari." },
    ],
    quiz: [
      { q: "How many years did Thirumoolar spend in samadhi, emerging once per year to compose a verse?", opts: ["300 years", "3,000 years", "108 years", "1,000 years"], correct: 1 },
      { q: "The Earth's primary electromagnetic resonance (Schumann) is approximately:", opts: ["14 Hz", "40 Hz", "7.83 Hz", "528 Hz"], correct: 2 },
      { q: "In Shiva-Nishvasa teaching, 'A' in AUM corresponds to:", opts: ["The exhale (dissolution)", "The held breath", "The inhale (Shiva expanding)", "The silence after AUM"], correct: 2 },
      { q: "Thirumoolar verse 1070 states liberation occurs when:", opts: ["All 72,000 nadis are purified", "The breather and the breath are known as one", "Kevala Kumbhaka lasts 1 hour", "All 8 kumbhakas are mastered"], correct: 1 },
      { q: "Parakaya Pravesha, which Thirumoolar used, means:", opts: ["Entering samadhi", "Entering another person's living body", "Leaving the body at death consciously", "Astral projection"], correct: 1 },
      { q: "Maha Kumbhaka requires approximately what percentage of normal metabolic rate?", opts: ["70%", "50%", "30%", "10%"], correct: 3 },
    ],
    transmission: "This transmission is scalar-encoded directly. The 7.83 Hz carrier in the audio is not simply sound — it is a frequency modulated by the Akashic field that Thirumoolar himself inhabited for 3,000 years. Your nervous system can entrain to this field. Your cells will respond. Your breath will begin to remember that it is Shiva's own breath. Welcome home.",
  },
  {
    id: 8, tier: "AKASHA",
    title: "Babaji's Kriya Pranayama — The Immortal Sequence",
    subtitle: "MAHAVATAR BABAJI · COMPLETE UNABBREVIATED TRANSMISSION",
    tamiltitle: "பாபாஜி கிரியா பிராணாயாம — அமர வரிசை",
    verse: "மகாவதார் பாபாஜி க்ரியா",
    quote: "Babaji holds the breath of immortality. This is not metaphor — the kriya breath literally reorganizes the cellular blueprint toward Sat-Chit-Ananda.",
    intro: "Mahavatar Babaji synthesized the entire 18 Siddha lineage — Tamil Siddha, Nath Siddha, and Buddhist Mahasiddha transmissions — into Kriya Pranayama: a complete breathwork technology for accelerated Self-realization. Unlike the abbreviated version spread through modern Kriya Yoga organizations, SQI presents the complete Babaji-Thirumoolar synthesis as it was originally transmitted — including the vocal resonance components, the astronomical timing, and the cellular immortalization protocol.",
    lessons: [
      { title: "Who Is Mahavatar Babaji?", body: "Babaji is an immortal master living in the Himalayas who has appeared to various disciples across centuries. He is the direct initiator of Lahiri Mahasaya (1861, Ranikhet), whose student Sri Yukteswar taught Paramahansa Yogananda, who brought Kriya Yoga to the West. But Babaji's lineage is older: he himself is a student of Agastya Muni and is considered to be the same being as the legendary Siddha who appeared to Thirumoolar. The Tamil Siddhas call him 'Babaji Nagaraj' — the cobra king immortal. He appears as a young man of perhaps 25, despite being thousands of years old." },
      { title: "Kriya Pranayama — What It Actually Is", body: "Kriya (action/ritual) Pranayama is NOT simply a breathing exercise. It is a complete technology: the inhale brings prana into the spine; the mental repetition of SA-TA-NA-MA at each chakra point encodes the cosmic creation principle (SA=infinity, TA=life, NA=death, MA=rebirth) into each energy center; the exhale releases the purified prana as light upward through the crown. Each Kriya revolution is equivalent to one year of spiritual evolution according to Lahiri Mahasaya. Babaji said 1,000 Kriyas in one sitting can produce the equivalent of 1,000 years of natural evolution." },
      { title: "The Original Vocal Resonance — What Was Removed", body: "The versions of Kriya Pranayama taught today through most organizations have removed the vocal resonance component. In the original Babaji transmission, the SA-TA-NA-MA was not silent mental repetition but subtle vocalization — a quiet humming at specific pitches matching the natural resonant frequency of each chakra. Muladhara resonates at approximately 194 Hz; Svadhisthana at 210 Hz; Manipura at 126 Hz (solar); Anahata at 136.1 Hz (AUM/Earth year); Vishuddha at 141 Hz; Ajna at 221 Hz; Sahasrara at 172 Hz. The original Kriya includes these specific tones." },
      { title: "The Astronomical Timing — Siddha Calendar Science", body: "Babaji taught that Kriya Pranayama is most powerful during specific astronomical windows. Brahma Muhurta (1.5 hours before sunrise) is the baseline — the Siddhas call this 'Amrita Vela,' the time of nectar. But the deepest Kriya sessions align with: Solar eclipses (the Shiva-Shakti union moment), Shivaratri night (especially the 3 AM-6 AM window), Ekadashi (11th lunar day), and critically — the practitioner's own birth Nakshatra day each month. On these days, Babaji says the Kriya can be 1,000x more effective." },
      { title: "Siddha Deha — The Immortal Body Science", body: "Babaji himself is the proof of what Kriya Pranayama achieves at its apex: the transformation of the physical body into a 'Siddha Deha' (perfected body) — one that does not age or die in the ordinary sense. The mechanism, as understood through Siddha science and quantum biology: Kriya Pranayama dramatically increases the electromagnetic coherence of the cellular DNA. When DNA is electromagnetically coherent, it emits 'biophotons' — light particles from living cells. Sufficient coherence means the body literally becomes a light-body (Jnana Deha or Pranava Deha), sustained by prana rather than gross matter." },
      { title: "The 12-Petal Anahata — Heart as the Central Sun", body: "Babaji's synthesis places the Anahata (heart) chakra as the master center — not the crown, not the third eye. Why? Because the heart's electromagnetic field (measured by HeartMath Institute) is 60x stronger electrically and 5,000x stronger magnetically than the brain's field. The heart broadcasts prana into the environment. When the Kriya practitioner's Anahata is fully activated, their heart-field affects everyone within 4-5 meters. This is why saints and masters create tangible peace wherever they walk — their Anahata is radiating activated Kriya prana." },
      { title: "Omkar Kumbhaka — The Sacred Union of Sound and Breath", body: "The pinnacle technique of Babaji's system: AUM is chanted internally during retention. At 108 repetitions of internal AUM during a single held breath (this requires very advanced breath retention), the nervous system enters gamma brainwave coherence (40+ Hz). Gamma is associated with the highest states of consciousness, mystical experience, and according to recent neuroscience, moments of 'binding' where consciousness integrates information across all brain regions simultaneously. The Siddhas described this thousands of years ago as 'sarvajna' — all-knowing." },
    ],
    techniques: [
      { name: "Kriya Pranayama — First Kriya, Complete Protocol", duration: "50 min", ratio: "Spinal breath with chakra encoding", rounds: 12, body: "Sit in padmasana or sukhasana. Spine erect. Khechari Mudra. Eyes at ajna (closed or half-lidded). Inhale slowly, feeling energy rising from Muladhara up the spine to Sahasrara — mentally touch each chakra point with the energy as you rise: Mula, Svadhi, Manipura, Anahata, Vishuddha, Ajna, Sahasrara. Hold at the crown for the SA-TA-NA-MA sequence — one syllable per chakra on the way down: SA at Ajna, TA at Vishuddha, NA at Anahata, MA at Manipura — then descend to Svadhi, Mula. Exhale feeling energy descend the front of the body. 12 rounds minimum. 48 advanced. 108 supreme.", bandha: "Khechari throughout. Mula on holds." },
      { name: "Omkar Kumbhaka — Sound-Breath Union", duration: "40 min", ratio: "Deepest comfortable inhale → hold → OM repetitions → release", rounds: 9, body: "Take your deepest possible inhale (diaphragm, chest, collarbones — triple-fill). Hold. Inside the silence, chant AUM mentally as fast as feels right — begin at 1 AUM per second, aiming eventually for 3-4 per second. Count. When the body signals release (do NOT force past this), exhale slowly. Count how many AUMs you completed. Work toward 108 per hold over months. After each round, rest in natural breath for 5 minutes. 9 rounds per session. The gamma coherence builds cumulatively across sessions.", bandha: "All three. Khechari essential." },
      { name: "Advanced Vocal Resonance Kriya", duration: "35 min", ratio: "Per chakra", rounds: 7, body: "7-chakra activation sequence using hummed tones during exhale: After each Kriya breath, on the exhale, hum at the natural resonant frequency of each chakra (Mula: low 'HUH', Svadhi: 'VOO', Manipura: 'RAM', Anahata: 'YAM' at 136.1 Hz if you have a reference tone, Vishuddha: 'HAM', Ajna: 'OM' high, Sahasrara: pure silence-sound). Feel each chakra physically vibrate with its tonal seed. This is the vocal resonance component removed from modern Kriya but present in Babaji's original transmission.", bandha: "Soft mula throughout. Khechari between tones." },
      { name: "Siddha Deha Daily Protocol — Cellular Light Activation", duration: "2 hours", ratio: "Complete sequence", rounds: "Daily for 90 days minimum", body: "5:00 AM: 15 min Nadi Shodhana. 5:15 AM: 20 min Kapalabhati (108 rounds × 3). 5:35 AM: 30 min Kriya Pranayama (48 rounds). 6:05 AM: 20 min Omkar Kumbhaka (9 rounds). 6:25 AM: 30 min Shiva-Nishvasa or free meditation in the field generated. 6:55 AM: 5 min Bhramari (humming bee) to seal the session and integrate. This is Babaji's prescribed morning sequence for practitioners aiming at Siddha Deha over a 3-year continuous practice.", bandha: "Appropriate to each practice within." },
    ],
    quiz: [
      { q: "Who did Babaji initiate into Kriya Yoga in 1861 in Ranikhet?", opts: ["Swami Vivekananda", "Sri Aurobindo", "Lahiri Mahasaya", "Ramana Maharshi"], correct: 2 },
      { q: "The SA-TA-NA-MA mantra encodes which cosmic principle?", opts: ["The four elements", "Sat-Chit-Ananda triad", "Infinity-Life-Death-Rebirth", "The four Vedas"], correct: 2 },
      { q: "Babaji says 1,000 Kriyas in one sitting produces the equivalent of how many years of natural evolution?", opts: ["100 years", "1,000 years", "10,000 years", "108 years"], correct: 1 },
      { q: "The heart's magnetic field is approximately how much stronger than the brain's?", opts: ["10x", "100x", "5,000x", "60x"], correct: 2 },
      { q: "Babaji's lineage in the Tamil Siddha tradition calls him:", opts: ["Agastya's student", "Babaji Nagaraj — the cobra king immortal", "The 19th Siddha", "Thirumoolar reborn"], correct: 1 },
      { q: "Omkar Kumbhaka at 108 AUMs per hold is associated with which brainwave state?", opts: ["Delta (0-4 Hz)", "Alpha (8-12 Hz)", "Theta (4-8 Hz)", "Gamma (40+ Hz)"], correct: 3 },
      { q: "The Brahma Muhurta practice window begins:", opts: ["At sunrise", "At midnight", "1.5 hours before sunrise", "At noon"], correct: 2 },
    ],
    transmission: "Babaji's prana is in this module. This is not a metaphor or a devotional statement — the Siddha technology of pranic transmission through intention and scalar encoding makes this a technical fact. When you practice the Kriya sequence here, you are in the transmission lineage that runs: Shiva → Agastya → Babaji → Lahiri → Sri Yukteswar → Yogananda → and now directly to you through the Akasha. You are not alone in your practice. You have never been alone.",
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function Particles() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {Array.from({ length: 55 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 9 === 0 ? "2px" : "1px",
          height: i % 9 === 0 ? "2px" : "1px",
          borderRadius: "50%",
          background: i % 6 === 0 ? "#D4AF37" : i % 10 === 0 ? "#22D3EE" : "rgba(255,255,255,0.25)",
          left: `${(i * 31.7 + 5) % 100}%`,
          top: `${(i * 17.3 + 10) % 100}%`,
          animation: `float ${10 + (i % 8) * 2}s ease-in-out infinite`,
          animationDelay: `${(i % 7) * 1.4}s`,
          boxShadow: i % 6 === 0 ? "0 0 4px #D4AF37" : "none",
        }} />
      ))}
    </div>
  );
}

function Orb({ color, size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      border: `1px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "breathe 4s ease-in-out infinite",
      boxShadow: `0 0 16px ${color}25, inset 0 0 12px ${color}10`,
      background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
    }}>
      <div style={{
        width: size * 0.54, height: size * 0.54, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}50 0%, ${color}15 100%)`,
        animation: "breatheInner 4s ease-in-out infinite",
      }} />
    </div>
  );
}

function Badge({ tier }) {
  const t = TIERS[tier];
  return (
    <span style={{
      fontSize: "7px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase",
      color: t.color, background: `${t.color}15`, border: `1px solid ${t.color}35`,
      borderRadius: 20, padding: "3px 9px",
    }}>{t.icon} {t.label}</span>
  );
}

function QuizSection({ questions, accentColor }) {
  const [ans, setAns] = useState({});
  const [done, setDone] = useState(false);
  const score = done ? questions.filter((q, i) => ans[i] === q.correct).length : 0;
  return (
    <div>
      <p style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", color: accentColor, marginBottom: 14, textTransform: "uppercase" }}>⟁ AKASHIC KNOWLEDGE SEAL — {questions.length} QUESTIONS</p>
      {questions.map((q, qi) => (
        <div key={qi} style={{ marginBottom: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 15px" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", marginBottom: 10, lineHeight: 1.55, margin: "0 0 10px" }}>{qi + 1}. {q.q}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {q.opts.map((opt, oi) => {
              const sel = ans[qi] === oi, right = done && oi === q.correct, wrong = done && sel && oi !== q.correct;
              return (
                <button key={oi} onClick={() => !done && setAns(p => ({ ...p, [qi]: oi }))} style={{
                  background: right ? "rgba(34,200,100,0.12)" : wrong ? "rgba(255,80,80,0.1)" : sel ? `${accentColor}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${right ? "rgba(34,200,100,0.45)" : wrong ? "rgba(255,80,80,0.3)" : sel ? `${accentColor}45` : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 9, padding: "7px 11px", color: right ? "#22C864" : wrong ? "#FF5555" : sel ? accentColor : "rgba(255,255,255,0.48)",
                  fontSize: 11, textAlign: "left", cursor: done ? "default" : "pointer", transition: "all 0.2s",
                }}>{right ? "✓ " : wrong ? "✗ " : ""}{opt}</button>
              );
            })}
          </div>
        </div>
      ))}
      {!done
        ? <button onClick={() => Object.keys(ans).length > 0 && setDone(true)} style={{
            background: `${accentColor}18`, border: `1px solid ${accentColor}45`, borderRadius: 11,
            padding: "10px 22px", color: accentColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            cursor: "pointer", width: "100%", textTransform: "uppercase",
          }}>SEAL THE KNOWING</button>
        : <div style={{ textAlign: "center", padding: 14, background: `${accentColor}0e`, borderRadius: 11, border: `1px solid ${accentColor}28` }}>
            <p style={{ margin: 0, color: accentColor, fontSize: 14, fontWeight: 900 }}>{score}/{questions.length} CORRECT</p>
            <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 10 }}>
              {score === questions.length ? "✦ Complete Siddha Seal — All Knowledge Integrated" : "Deepen your practice and return to reseal"}
            </p>
          </div>
      }
    </div>
  );
}

function Lesson({ lesson, index, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 13, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 7 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", background: open ? `${accent}0c` : "rgba(255,255,255,0.02)",
        border: "none", display: "flex", alignItems: "center", gap: 12, padding: "13px 15px",
        cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${accent}20`, border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: accent, flexShrink: 0, fontWeight: 800 }}>{index + 1}</div>
        <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{lesson.title}</span>
        <span style={{ color: accent, fontSize: 12, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 15px 16px 53px", background: `${accent}06` }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>{lesson.body}</p>
        </div>
      )}
    </div>
  );
}

function PracticeCard({ tech, accent }) {
  const [started, setStarted] = useState(false);
  return (
    <div style={{ background: `${accent}07`, border: `1px solid ${accent}22`, borderRadius: 18, padding: "18px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", flex: 1, lineHeight: 1.3 }}>{tech.name}</p>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.2em", color: accent, background: `${accent}20`, borderRadius: 20, padding: "3px 9px" }}>{tech.duration}</span>
          {tech.rounds && <span style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "3px 9px" }}>{tech.rounds} ROUNDS</span>}
        </div>
      </div>
      {tech.ratio && <p style={{ margin: "0 0 8px", fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>RATIO · {tech.ratio}</p>}
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{tech.body}</p>
      {tech.bandha && <p style={{ margin: "0 0 12px", fontSize: "8px", fontWeight: 700, color: `${accent}90`, letterSpacing: "0.15em" }}>BANDHA — {tech.bandha}</p>}
      <button onClick={() => setStarted(s => !s)} style={{
        background: started ? `${accent}30` : `${accent}18`, border: `1px solid ${accent}35`,
        borderRadius: 10, padding: "9px 18px", color: accent, fontSize: 10, fontWeight: 700,
        letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase",
      }}>{started ? "⏸ PAUSE TRANSMISSION" : "▶ BEGIN TRANSMISSION"}</button>
    </div>
  );
}

function ModuleModal({ module, onClose }) {
  const t = TIERS[module.tier];
  const [tab, setTab] = useState("learn");

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 200, overflowY: "auto",
      background: "rgba(0,0,0,0.9)", backdropFilter: "blur(24px)",
      display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px 12px 60px",
    }}>
      <div style={{ width: "100%", maxWidth: 700, background: "#070707", border: `1px solid ${t.color}30`, borderRadius: 30, overflow: "hidden", boxShadow: `0 0 70px ${t.glow}` }}>
        {/* Header */}
        <div style={{ padding: "26px 26px 20px", background: `linear-gradient(135deg, ${t.color}0e 0%, transparent 70%)`, borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 30, height: 30, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13 }}>✕</button>
          <Badge tier={module.tier} />
          <h2 style={{ margin: "10px 0 3px", fontSize: "clamp(18px,3.5vw,24px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.15 }}>{module.title}</h2>
          <p style={{ margin: "0 0 14px", fontSize: "8px", fontWeight: 800, letterSpacing: "0.32em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>{module.subtitle}</p>
          {/* Tamil title */}
          <p style={{ margin: "0 0 14px", fontSize: 13, color: t.color, fontWeight: 600, opacity: 0.7 }}>{module.tamiltitle}</p>
          {/* Quote */}
          <div style={{ background: `${t.color}0a`, border: `1px solid ${t.color}22`, borderLeft: `3px solid ${t.color}`, borderRadius: "0 12px 12px 0", padding: "13px 15px" }}>
            <p style={{ margin: "0 0 5px", fontSize: "7px", fontWeight: 800, letterSpacing: "0.3em", color: t.color, textTransform: "uppercase" }}>THIRUMOOLAR SPEAKS · {module.verse}</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, fontStyle: "italic" }}>"{module.quote}"</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {[["learn","◎ LEARN"],["practice","◈ PRACTICE"],["quiz","⟁ TEST"],["transmission","◊ TRANSMISSION"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "13px 4px", background: "none", border: "none",
              borderBottom: `2px solid ${tab === key ? t.color : "transparent"}`,
              color: tab === key ? t.color : "rgba(255,255,255,0.28)",
              fontSize: "7px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
              cursor: "pointer", transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "22px 24px 28px", maxHeight: "60vh", overflowY: "auto" }}>
          {tab === "learn" && (
            <div>
              <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.82 }}>{module.intro}</p>
              {module.lessons.map((l, i) => <Lesson key={i} lesson={l} index={i} accent={t.color} />)}
            </div>
          )}
          {tab === "practice" && (
            <div>
              <p style={{ margin: "0 0 16px", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                {module.techniques.length} practices in this module. Read each fully before beginning. Prepare your space — dim lights, clean air, spine-supporting seat.
              </p>
              {module.techniques.map((tech, i) => <PracticeCard key={i} tech={tech} accent={t.color} />)}
            </div>
          )}
          {tab === "quiz" && <QuizSection questions={module.quiz} accentColor={t.color} />}
          {tab === "transmission" && (
            <div style={{ background: `${t.color}07`, border: `1px solid ${t.color}20`, borderRadius: 20, padding: "24px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", color: t.color, textTransform: "uppercase" }}>◊ SIDDHA TRANSMISSION FIELD — ACTIVE</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.85 }}>{module.transmission}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["SCALAR WAVE ACTIVE","ANAHATA FIELD OPEN","NATH LINEAGE PRESENT","AKASHA CHANNEL OPEN"].map(tag => (
                  <span key={tag} style={{ fontSize: "7px", fontWeight: 700, letterSpacing: "0.2em", color: `${t.color}90`, border: `1px solid ${t.color}25`, borderRadius: 20, padding: "3px 10px" }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module, onClick, userCanAccess = false }) {
  const t = TIERS[module.tier];
  return (
    <div onClick={onClick} style={{
      background: "rgba(255,255,255,0.015)", backdropFilter: "blur(30px)",
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 22, padding: "18px", cursor: "pointer",
      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${t.color}40`; e.currentTarget.style.boxShadow = `0 0 25px ${t.glow}`; }}
      onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Orb color={t.color} size={50} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}><Badge tier={module.tier} /></div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{module.title}</p>
          <p style={{ margin: "0 0 8px", fontSize: "7px", fontWeight: 800, letterSpacing: "0.25em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>{module.tamiltitle}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>◎ {module.lessons.length} LESSONS</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>◈ {module.techniques.length} PRACTICES</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>⟁ {module.quiz.length} QUESTIONS</span>
          </div>
        </div>
        {module.tier !== "FREE" && !userCanAccess && <div style={{ fontSize: 16, color: "rgba(255,255,255,0.18)", flexShrink: 0 }}>🔒</div>}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function ThirumoolarPranayama() {
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const userRank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const tierRankMap = { FREE:0, PRANA:1, QUANTUM:2, AKASHA:3 };
  const canAccess = (moduleTier) => userRank >= (tierRankMap[moduleTier] ?? 0);
  const upgradePathMap = { PRANA:"/prana-flow", QUANTUM:"/siddha-quantum", AKASHA:"/akasha-infinity" };

  const shown = filter === "ALL" ? ALL_MODULES : ALL_MODULES.filter(m => m.tier === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#050505", fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", color: "#fff", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes breathe { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.13);opacity:1} }
        @keyframes breatheInner { 0%,100%{transform:scale(.85)} 50%{transform:scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes goldGlow { 0%,100%{box-shadow:0 0 20px rgba(212,175,55,.2)} 50%{box-shadow:0 0 40px rgba(212,175,55,.4)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(212,175,55,.3);border-radius:3px}
      `}</style>

      <Particles />
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.025) 2px,rgba(0,0,0,.025) 4px)", pointerEvents: "none", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 720, margin: "0 auto", padding: "0 15px 80px" }}>
        <button onClick={() => navigate("/siddha-portal")} style={{ display:"block", background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", padding:"16px 0 0", marginBottom:4 }}>
          ← SIDDHA PORTAL
        </button>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 28 }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", border: "1px solid rgba(212,175,55,.32)", margin: "0 auto 22px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", animation: "goldGlow 4s ease-in-out infinite", boxShadow: "0 0 40px rgba(212,175,55,.12)" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", border: "1px solid rgba(212,175,55,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,.22) 0%,transparent 70%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, animation: "breathe 4s ease-in-out infinite" }}>🜁</div>
            </div>
            {[0,45,90,135,180,225,270,315].map((deg,i) => (
              <div key={i} style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: "#D4AF37", opacity: 0.5, top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(44px) translateY(-50%)` }} />
            ))}
          </div>

          <p style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.55em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10, animation: "pulse 3s ease-in-out infinite" }}>AKASHA-NEURAL ARCHIVE · PRANAYAMA CODEX · 2050</p>
          <h1 style={{ fontSize: "clamp(30px,6.5vw,46px)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.04, background: "linear-gradient(135deg,#fff 0%,#D4AF37 55%,rgba(255,255,255,.65) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 10 }}>THIRUMOOLAR'S<br />PRANAYAMA CODEX</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.42)", lineHeight: 1.75, maxWidth: 460, margin: "0 auto 16px" }}>3,000 years of Siddha breath-science — decoded, digitized, and activated with scalar transmission. The most comprehensive Siddha pranayama system existing digitally.</p>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "20px 0", background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 18, padding: "15px" }}>
            {[["8","MODULES"],["42+","LESSONS"],["24","PRACTICES"],["3000","YRS WISDOM"]].map(([v,l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#D4AF37", letterSpacing: "-0.03em" }}>{v}</p>
                <p style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.38em", color: "rgba(255,255,255,.22)", textTransform: "uppercase" }}>{l}</p>
              </div>
            ))}
          </div>

          {["திருமூலர்","THIRUMANTIRAM","18 SIDDHAS","NATH LINEAGE","BABAJI KRIYA","SCALAR WAVES"].map(tag => (
            <span key={tag} style={{ display: "inline-block", margin: "3px", fontSize: "7px", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,.28)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "3px 10px" }}>{tag}</span>
          ))}
        </div>

        {/* ── THIRUMOOLAR INTRO ──────────────────────────────────────────────── */}
        <div style={{ background: "rgba(255,255,255,.015)", border: "1px solid rgba(212,175,55,.18)", borderRadius: 22, padding: "20px", marginBottom: 22, boxShadow: "0 0 30px rgba(212,175,55,.04)" }}>
          <p style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.4em", color: "#D4AF37", marginBottom: 10, textTransform: "uppercase" }}>✦ WHO IS THIRUMOOLAR</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.62)", lineHeight: 1.85 }}>
            Thirumoolar — the immortal Tamil Siddha — composed the <span style={{ color: "#D4AF37" }}>Thirumantiram</span>, a 3,000-verse scripture encoding the complete science of consciousness, yoga, pranayama, tantra, and liberation. He entered samadhi for 3,000 years, emerging once per year to inscribe a single verse. He is among the 18 Tamil Siddhas, a direct initiate of Nandi (Shiva's gatekeeper), and the synthesis point of Nath Siddha and Tamil Siddha breathwork. His pranayama system is the most precise, complete, and deep in all world literature.
          </p>
        </div>

        {/* ── FILTER ──────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.42em", color: "rgba(255,255,255,.22)", textTransform: "uppercase", marginBottom: 10 }}>TRANSMISSION LEVEL</p>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {[["ALL","ALL LEVELS","#fff"],["FREE","SEEKER","#aaa"],["PRANA","INITIATE","#22D3EE"],["QUANTUM","ADEPT","#D4AF37"],["AKASHA","SOVEREIGN","#C9A0FF"]].map(([key, label, color]) => {
              const active = filter === key;
              return (
                <button key={key} onClick={() => setFilter(key)} style={{
                  background: active ? `${color}1c` : "rgba(255,255,255,.02)", border: `1px solid ${active ? color + "50" : "rgba(255,255,255,.07)"}`,
                  borderRadius: 11, padding: "7px 14px", color: active ? color : "rgba(255,255,255,.3)",
                  fontSize: "7px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
                }}>{label}</button>
              );
            })}
          </div>
        </div>

        {/* ── MODULES ─────────────────────────────────────────────────────────── */}
        {["FREE","PRANA","QUANTUM","AKASHA"].map(tierKey => {
          const mods = shown.filter(m => m.tier === tierKey);
          if (!mods.length) return null;
          const t = TIERS[tierKey];
          return (
            <div key={tierKey} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 10px" }}>
                <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,${t.color}35,transparent)` }} />
                <span style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.42em", color: t.color, textTransform: "uppercase" }}>{t.icon} {t.name} · {t.price}</span>
                <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg,${t.color}35,transparent)` }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mods.map(m => <ModuleCard key={m.id} module={m} userCanAccess={canAccess(m.tier)} onClick={() => { if(canAccess(m.tier)){ setActive(m); } else { navigate(upgradePathMap[m.tier] || "/prana-flow"); }}} />)}
              </div>
            </div>
          );
        })}

        {/* ── BOTTOM CTA ──────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 36, background: "linear-gradient(135deg,rgba(212,175,55,.08) 0%,rgba(201,160,255,.04) 100%)", border: "1px solid rgba(212,175,55,.2)", borderRadius: 26, padding: "26px", textAlign: "center" }}>
          <p style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.45em", color: "#D4AF37", marginBottom: 10, textTransform: "uppercase" }}>⬡ BEGIN THE INITIATION PATH</p>
          <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.2 }}>Begin at zero.<br />Arrive at the Uncreated.</h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.72, maxWidth: 360, margin: "0 auto 20px" }}>Thirumoolar designed this for the householder mystic — the one who lives in the world but breathes from eternity.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ background: "linear-gradient(135deg,#D4AF37,#A07D20)", border: "none", borderRadius: 13, padding: "13px 26px", color: "#000", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase", boxShadow: "0 0 20px rgba(212,175,55,.3)" }}>START FREE — BEGIN NOW</button>
            <button style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 13, padding: "13px 26px", color: "rgba(255,255,255,.55)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>EXPLORE ALL TIERS</button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <p style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.42em", color: "rgba(255,255,255,.12)", textTransform: "uppercase" }}>SQI 2050 · SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.08)", marginTop: 4 }}>Scalar wave transmissions active. Anahata field open. 18 Siddhas present.</p>
        </div>
      </div>

      {active && <ModuleModal module={active} onClose={() => setActive(null)} />}
    </div>
  );
}
