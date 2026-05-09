// @ts-nocheck
// src/pages/VirtualPilgrimage.tsx
// Route: /virtual-pilgrimage  (add to App.tsx)
// Requires:
//   src/hooks/useVirtualPilgrimage.ts
//   Supabase migration: virtual_pilgrimage_activations.sql

import { useState, useEffect, useRef, useCallback } from "react";
import { useVirtualPilgrimage, computeScalarVector } from "@/hooks/useVirtualPilgrimage";

// ─── All 40+ sacred sites ─────────────────────────────────────────────────────
const CATS = {
  earth:   { label:"EARTH",          col:"#D4AF37" },
  supreme: { label:"SUPREME",        col:"#FFD700" },
  miracle: { label:"MIRACLE-CLASS",  col:"#FFC8D4" },
  galactic:{ label:"GALACTIC",       col:"#E8D8A0" },
  temporal:{ label:"TEMPORAL",       col:"#C9A96E" },
  ancient: { label:"ANCIENT",        col:"#B8860B" },
  sqi:     { label:"SQI LINEAGE",    col:"#F8F8E8" },
};

const SITES = [
  {cat:"earth",id:"giza",nm:"Great Pyramid of Giza",loc:"Giza, Egypt",el:"△",col:"#D4AF37",col2:"#FFD700",hz:111,lat:29.97,lng:31.13,geo:"pyramid",ben:"Spinal alignment & torsion field",mantra:"Om Ra Hum",steps:["Sit upright — spine perfectly straight. Face your bearing.","Breathe 4 counts in, 4 out. Feel the spine elongate.","Visualise golden light entering crown, travelling down spine to root.","Hold 7 minutes minimum. Do not move."],crys:[{n:"Clear Quartz",c:"#F0F8FF",p:"Amplifies pyramid torsion field"},{n:"Citrine",c:"#FFF3CD",p:"Solar plexus activation"},{n:"Lapis Lazuli",c:"#2E4B8E",p:"Third eye & Akashic access"}]},
  {cat:"earth",id:"kailash",nm:"Mount Kailash",loc:"Tibet",el:"🏔",col:"#C8C8C8",col2:"#FFFFFF",hz:136,lat:31.07,lng:81.31,geo:"sri",ben:"Ultimate liberation & cosmic reset",mantra:"Om Namah Shivaya",steps:["Face North. Eyes closed. Spine tall.","Chant your mantra or rest in total silence.","Feel crown opening to the infinite sky.","Surrender all effort. Let Shiva work."],crys:[{n:"Himalayan Quartz",c:"#F8F8F8",p:"Direct Kailash resonance"},{n:"Black Tourmaline",c:"#2C2C2C",p:"Grounds extreme frequency"},{n:"Moonstone",c:"#E8E8F0",p:"Divine feminine balance"}]},
  {cat:"earth",id:"arunachala",nm:"Arunachala · Tiruvannamalai",loc:"Tamil Nadu, India",el:"🔥",col:"#FF6B35",col2:"#FFA070",hz:432,lat:12.23,lng:79.07,geo:"hexstar",ben:"Self-inquiry & heart silence",mantra:"Om Arunachaleswaraya Namah",steps:["Sit in complete silence. Ask inwardly: Who am I?","Do not answer — rest inside the question itself.","Every thought: ask 'to whom does this arise?' Return to source.","Stay 20 minutes minimum in this silent inquiry."],crys:[{n:"Ruby",c:"#9B111E",p:"Heart fire activation"},{n:"Carnelian",c:"#FF7043",p:"Sacral vitality"},{n:"Clear Quartz",c:"#E8F4FD",p:"Amplifies inquiry field"}]},
  {cat:"earth",id:"varanasi",nm:"Varanasi · Kashi",loc:"Uttar Pradesh, India",el:"💧",col:"#FF8C00",col2:"#FFB84D",hz:528,lat:25.32,lng:82.97,geo:"vesica",ben:"Liberation & karmic dissolution",mantra:"Om Vishwanathaya Namah",steps:["Light a ghee lamp. Offer your burdens to the flame.","Name silently what karma you are ready to release.","Breathe golden light in; exhale all darkness.","Repeat 15 minutes until you feel lighter."],crys:[{n:"Shiva Lingam",c:"#8B7355",p:"Liberation frequency"},{n:"Smoky Quartz",c:"#6B4C3B",p:"Karmic clearing"},{n:"Amethyst",c:"#9B59B6",p:"Spiritual protection"}]},
  {cat:"earth",id:"babaji",nm:"Babaji's Cave · Drongiri",loc:"Uttarakhand, India",el:"🔱",col:"#E0E0E0",col2:"#FFFFFF",hz:1111,lat:29.94,lng:79.14,geo:"torus",ben:"Kriya activation & DNA awakening",mantra:"Om Kriya Babaji Nama Aum",steps:["Begin 11 slow Kriya breaths — up the spine on inhale, down on exhale.","Visualise Babaji's white light at the third eye.","Feel each breath activating a new layer of DNA.","Continue 11 minutes. Do not rush."],crys:[{n:"Phenakite",c:"#F5F5F5",p:"Highest frequency crystal"},{n:"Danburite",c:"#FFF8E7",p:"Divine love transmission"},{n:"Selenite",c:"#FFFAF0",p:"Light body alignment"}]},
  {cat:"earth",id:"chidambaram",nm:"Chidambaram · Nataraja",loc:"Tamil Nadu, India",el:"🌀",col:"#9B59B6",col2:"#C39BD3",hz:741,lat:11.40,lng:79.69,geo:"fibonacci",ben:"Space element & karma dissolution",mantra:"Sivayanama",steps:["Bring awareness to the inner space of the chest.","Feel how vast and empty that space is — like deep sky.","Rest the mind completely in that spaciousness.","Let Nataraja's dance dissolve every remaining karma."],crys:[{n:"Blue Kyanite",c:"#4169E1",p:"Space element alignment"},{n:"Iolite",c:"#5B5EA6",p:"Akashic access"},{n:"Aquamarine",c:"#7FFFD4",p:"Truth & inner space"}]},
  {cat:"earth",id:"vrindavan",nm:"Vrindavan · Mathura",loc:"Uttar Pradesh, India",el:"🌸",col:"#FF69B4",col2:"#FFB6C1",hz:639,lat:27.58,lng:77.70,geo:"flowerlife",ben:"Divine love & Prema awakening",mantra:"Hare Krishna Hare Krishna",steps:["Both palms on the heart. Feel its warmth.","Breathe love in and out with every cell.","Invite the eternal Rasa-Lila.","Let tears come freely. Do not stop them."],crys:[{n:"Rose Quartz",c:"#F4A7B9",p:"Unconditional love"},{n:"Rhodochrosite",c:"#E75480",p:"Inner child healing"},{n:"Kunzite",c:"#F8C8D4",p:"Divine love frequency"}]},
  {cat:"earth",id:"palani",nm:"Palani Hills · Murugan",loc:"Tamil Nadu, India",el:"⚡",col:"#E74C3C",col2:"#FF7070",hz:417,lat:10.45,lng:77.52,geo:"hexstar",ben:"Soma alchemy & physical regeneration",mantra:"Om Saravanabhavaya Namah",steps:["Stand tall or sit with absolute spine alignment.","108 rounds of Kapalabhati — rapid fire breath.","Feel Soma elixir descending from crown after the cycle.","Rest and absorb the healing current."],crys:[{n:"Garnet",c:"#8B0000",p:"Root vitality"},{n:"Red Jasper",c:"#C0392B",p:"Physical regeneration"},{n:"Pyrite",c:"#CFB53B",p:"Manifestation power"}]},
  {cat:"earth",id:"rishikesh",nm:"Rishikesh · Haridwar",loc:"Uttarakhand, India",el:"🌊",col:"#27AE60",col2:"#58D68D",hz:396,lat:30.09,lng:78.27,geo:"vesica",ben:"Pranic purification & Kriya source",mantra:"Om Gam Ganapataye Namah",steps:["Visualise the sacred Ganga flowing around you.","Breathe purifying light through every pore.","Feel every toxin and stale karma dissolving.","Emerge newborn, clean, completely open."],crys:[{n:"Green Aventurine",c:"#4CAF50",p:"Heart renewal"},{n:"Jade",c:"#00A86B",p:"Prana cultivation"},{n:"Aquamarine",c:"#7FFFD4",p:"Flow & purification"}]},
  {cat:"earth",id:"potigai",nm:"Potigai Hills · Agastya",loc:"Tamil Nadu, India",el:"🌿",col:"#2ECC71",col2:"#82E0AA",hz:963,lat:8.71,lng:77.22,geo:"sri",ben:"Siddha wisdom download & longevity",mantra:"Om Agastyaya Namah",steps:["Open your mind completely — like empty sky.","Invite Agastya Muni's ancient presence.","Receive whatever comes: visions, knowing, mantras.","Write everything down immediately after."],crys:[{n:"Moldavite",c:"#3D9970",p:"Rapid transformation"},{n:"Green Tourmaline",c:"#228B22",p:"Healing transmission"},{n:"Hiddenite",c:"#90EE90",p:"Gratitude & grace"}]},
  {cat:"earth",id:"rameswaram",nm:"Rameswaram",loc:"Tamil Nadu, India",el:"🌊",col:"#3498DB",col2:"#7FB3D3",hz:417,lat:9.29,lng:79.32,geo:"vesica",ben:"Karmic clearing & dharma alignment",mantra:"Om Ramanathaswamaya Namah",steps:["Visualise ocean water washing completely through you.","Name each karma you are ready to release.","Feel Ram's infinite grace dissolving each one.","Offer deep gratitude for the clearing."],crys:[{n:"Blue Calcite",c:"#A8D8EA",p:"Karmic clearing"},{n:"Celestite",c:"#B0C4DE",p:"Divine communication"},{n:"Larimar",c:"#87CEEB",p:"Ocean healing"}]},
  {cat:"earth",id:"badrinath",nm:"Badrinath · Badri Vishal",loc:"Uttarakhand, India",el:"❄️",col:"#1ABC9C",col2:"#76D7C4",hz:963,lat:30.74,lng:79.49,geo:"hexstar",ben:"Celestial gateway & Vishnu field",mantra:"Om Namo Narayanaya",steps:["Enter absolute mental stillness.","Invoke Vishnu — feel cosmic order and divine support.","Rest in certainty: all is held, all is provided.","Let the celestial gateway open at crown."],crys:[{n:"Sodalite",c:"#2855A0",p:"Third eye clarity"},{n:"Blue Sapphire",c:"#0F52BA",p:"Celestial alignment"},{n:"Lapis Lazuli",c:"#26619C",p:"Truth & wisdom"}]},
  {cat:"earth",id:"kataragama",nm:"Kataragama",loc:"Sri Lanka",el:"🌺",col:"#FF6B35",col2:"#FFA07A",hz:528,lat:6.41,lng:81.34,geo:"hexstar",ben:"Agni Shakti & extreme devotion",mantra:"Om Saravanabhavaya Namah",steps:["Build intensity — do not seek calm here.","Chant the mantra with growing fire and passion.","Feel Agni rising from root chakra up the spine.","At the peak: surrender completely into the divine."],crys:[{n:"Fire Opal",c:"#FF6600",p:"Agni activation"},{n:"Orange Calcite",c:"#FF7F50",p:"Sacral awakening"},{n:"Carnelian",c:"#FF5733",p:"Devotion fuel"}]},
  {cat:"earth",id:"luxor",nm:"Luxor Temples",loc:"Egypt",el:"🏺",col:"#FFCC00",col2:"#FFE566",hz:528,lat:25.70,lng:32.64,geo:"pyramid",ben:"Ka body & healer activation",mantra:"Ankh Wedja Seneb",steps:["Breathe warm golden alchemical light into the body.","Hold open palms — feel heat building in the hands.","Activate the Ka body — your energetic double.","Channel healing through the hands."],crys:[{n:"Golden Calcite",c:"#FFD700",p:"Ka body activation"},{n:"Carnelian",c:"#E25822",p:"Vitality & life force"},{n:"Lapis Lazuli",c:"#26619C",p:"Royal wisdom"}]},
  {cat:"earth",id:"mansarovar",nm:"Lake Mansarovar",loc:"Tibet",el:"💎",col:"#87CEEB",col2:"#ADE4FF",hz:741,lat:30.67,lng:81.46,geo:"hexstar",ben:"Mental detox & crown purification",mantra:"Om Mani Padme Hum",steps:["Visualise the perfectly still turquoise lake.","Breathe its crystal-clear water into your crown.","Feel it purifying every mental channel.","Emerge with absolute mental clarity."],crys:[{n:"Aquamarine",c:"#7FFFD4",p:"Mental clarity"},{n:"Blue Topaz",c:"#4F99C6",p:"Crown purification"},{n:"Clear Quartz",c:"#F0F8FF",p:"Amplifies purification"}]},
  {cat:"earth",id:"lourdes",nm:"Lourdes Grotto",loc:"France",el:"🕊",col:"#ADD8E6",col2:"#D0EFFF",hz:528,lat:43.09,lng:-0.04,geo:"vesica",ben:"Physical restoration & healing water",mantra:"Ave Maria",steps:["Visualise pure healing water flowing through you.","Feel it entering every organ, every cell.","Offer your physical body to this healing grace.","Rest in deep trust. Receive completely."],crys:[{n:"Blue Chalcedony",c:"#B0D4E8",p:"Physical healing"},{n:"Moonstone",c:"#E8E8F0",p:"Divine feminine healing"},{n:"Selenite",c:"#FFFAF0",p:"Purification"}]},
  {cat:"earth",id:"zimbabwe",nm:"Great Zimbabwe",loc:"Zimbabwe",el:"🗿",col:"#8B4513",col2:"#B5651D",hz:396,lat:-20.27,lng:30.93,geo:"hexstar",ben:"Ancestral strength & ancient lineage",mantra:"Ubuntu — I am because we are",steps:["Stand tall. Feel ancient stones rising around you.","Breathe the strength of your entire ancestral lineage.","Feel their power flowing into your body.","You carry thousands of years of wisdom."],crys:[{n:"Hematite",c:"#8B7355",p:"Ancestral grounding"},{n:"Red Jasper",c:"#C0392B",p:"Earth strength"},{n:"Smoky Quartz",c:"#4A3728",p:"Ancient memory"}]},
  {cat:"earth",id:"uluru",nm:"Uluru",loc:"Northern Territory, Australia",el:"🔴",col:"#B22222",col2:"#DC143C",hz:432,lat:-25.34,lng:131.04,geo:"sri",ben:"Ancestral DNA & deep earth grounding",mantra:"I am rooted. I am ancient.",steps:["Lie down. Touch the earth with both palms.","Breathe deep into the root — into the red earth.","Feel every ancestor before you standing behind you.","You are the living continuation of an unbroken line."],crys:[{n:"Red Jasper",c:"#C0392B",p:"Root & earth"},{n:"Mookaite",c:"#B87333",p:"Aboriginal earth wisdom"},{n:"Smoky Quartz",c:"#614126",p:"Dreamtime anchor"}]},
  {cat:"earth",id:"machu",nm:"Machu Picchu · Intihuatana",loc:"Peru",el:"☀️",col:"#FFA500",col2:"#FFD000",hz:528,lat:-13.16,lng:-72.54,geo:"pyramid",ben:"Solar vitality & stellar DNA activation",mantra:"Inti Tayta (Father Sun)",steps:["Face the sun — or visualise it vividly.","Open palms upward. Completely receptive.","Breathe solar energy into every single cell.","Feel your DNA lighting up like fibre optics."],crys:[{n:"Sunstone",c:"#FF8C00",p:"Solar activation"},{n:"Golden Topaz",c:"#FFD700",p:"Manifestation power"},{n:"Tiger Eye",c:"#B8860B",p:"Personal will"}]},
  {cat:"earth",id:"glastonbury",nm:"Glastonbury Tor · Avalon",loc:"Somerset, England",el:"🌀",col:"#228B22",col2:"#50C878",hz:528,lat:51.14,lng:-2.70,geo:"flowerlife",ben:"Grail consciousness & heart activation",mantra:"I am the Grail",steps:["Place hand on heart. Feel its warmth.","Breathe deep forest-green Avalon light into the heart.","Feel the Chalice filling inside your chest.","Receive. You are worthy."],crys:[{n:"Malachite",c:"#0D8A45",p:"Heart transformation"},{n:"Emerald",c:"#50C878",p:"Grail consciousness"},{n:"Green Fluorite",c:"#3EB489",p:"Healing portal"}]},
  {cat:"earth",id:"shasta",nm:"Mount Shasta",loc:"California, USA",el:"🏔",col:"#DA70D6",col2:"#EF99EF",hz:852,lat:41.41,lng:-122.19,geo:"metatron",ben:"Lemurian memory & violet flame",mantra:"I AM that I AM",steps:["Call upon the I AM Presence within.","Visualise violet flame around your entire body.","Dense energies burn completely away.","Emerge radiant, lighter, fully free."],crys:[{n:"Amethyst",c:"#9B59B6",p:"Violet flame anchor"},{n:"Lemurian Seed Quartz",c:"#F8F8F8",p:"Ancient memory access"},{n:"Sugilite",c:"#7B2D8B",p:"Transmutation"}]},
  {cat:"earth",id:"sedona",nm:"Sedona Vortex",loc:"Arizona, USA",el:"🔴",col:"#CD5C5C",col2:"#E88080",hz:741,lat:34.87,lng:-111.76,geo:"torus",ben:"Psychic vision & creative downloads",mantra:"Earth below. Sky above. I am centred.",steps:["Stand barefoot. Feel the red earth below.","The electromagnetic vortex spins your field.","Let blocked energy be drawn out by the vortex.","Receive creative visions and downloads freely."],crys:[{n:"Red Jasper",c:"#C0392B",p:"Vortex connection"},{n:"Magnetite",c:"#3C3C3C",p:"Magnetic balance"},{n:"Vanadinite",c:"#D2691E",p:"Grounding vitality"}]},
  {cat:"earth",id:"titicaca",nm:"Lake Titicaca",loc:"Peru / Bolivia",el:"🌊",col:"#4169E1",col2:"#7B9FFF",hz:528,lat:-15.84,lng:-69.33,geo:"fibonacci",ben:"Creative rebirth & M/F balance",mantra:"Yachay (Sacred knowledge)",steps:["Visualise the highest navigable lake shimmering before you.","Feel masculine and feminine currents balancing within.","Invite creative rebirth — something new wants to be born.","Allow the new to arrive without forcing."],crys:[{n:"Blue Andean Opal",c:"#87CEEB",p:"Creative rebirth"},{n:"Larimar",c:"#6EC6CA",p:"M/F balance"},{n:"Moonstone",c:"#E8E8F0",p:"New beginnings"}]},
  {cat:"earth",id:"stonehenge",nm:"Stonehenge",loc:"Wiltshire, England",el:"🌕",col:"#A0A0A0",col2:"#D0D0D0",hz:432,lat:51.18,lng:-1.83,geo:"hexstar",ben:"Earth grid & solstice alignment",mantra:"I stand in the circle of eternal life",steps:["Align body to sunrise or sunset direction.","Feel the standing stones as your own vertebrae.","Breathe the ancient Druid earth breath.","Receive the Earth's own rhythm."],crys:[{n:"Blue Lace Agate",c:"#B0C4DE",p:"Ancient air element"},{n:"Flint",c:"#708090",p:"Earth grid resonance"},{n:"Green Calcite",c:"#7EC8A0",p:"Nature communion"}]},
  {cat:"earth",id:"jerusalem",nm:"Jerusalem · Temple Mount",loc:"Israel",el:"✡️",col:"#F39C12",col2:"#F7C454",hz:741,lat:31.78,lng:35.23,geo:"hexstar",ben:"Three-tradition convergence field",mantra:"Baruch Hashem / Bismillah / Hallelujah",steps:["Hold awareness of all prayers ever offered on this ground.","Feel the compressed power of centuries of devotion.","Add your own prayer from the deepest place.","Feel it received."],crys:[{n:"Golden Healer Quartz",c:"#FFD700",p:"Divine will alignment"},{n:"Amber",c:"#FFBF00",p:"Ancient prayers"},{n:"Carnelian",c:"#E25822",p:"Sacred fire"}]},
  {cat:"earth",id:"teotihuacan",nm:"Teotihuacan",loc:"Mexico",el:"🌟",col:"#F1C40F",col2:"#F9E044",hz:528,lat:19.69,lng:-98.84,geo:"pyramid",ben:"Stellar consciousness & initiation",mantra:"Teotl (I am divine energy)",steps:["Stand at apex of Pyramid of the Sun (visualise vividly).","Open arms wide to the cosmos. You are a star.","Feel your origins in the cosmos.","Receive the cosmic initiation that has waited."],crys:[{n:"Obsidian",c:"#2C2C2C",p:"Aztec mirror"},{n:"Jade",c:"#00A86B",p:"Sacred life force"},{n:"Pyrite",c:"#CFB53B",p:"Solar gold"}]},
  {cat:"earth",id:"angkor",nm:"Angkor Wat",loc:"Cambodia",el:"🌸",col:"#E91E63",col2:"#F48FB1",hz:639,lat:13.41,lng:103.87,geo:"metatron",ben:"Mount Meru consciousness & cosmic axis",mantra:"Om Vishnave Namah",steps:["Stand at the centre of the cosmic mountain.","You are the axis — completely still while everything moves.","Breathe from this eternal, unmovable centre.","Feel Vishnu's preservation holding all life."],crys:[{n:"Pink Sapphire",c:"#FF91A4",p:"Devic communion"},{n:"Rhodonite",c:"#E75480",p:"Compassion"},{n:"Red Coral",c:"#FF4500",p:"Cosmic life force"}]},
  {cat:"earth",id:"borobudur",nm:"Borobudur",loc:"Indonesia",el:"☸️",col:"#D4AF37",col2:"#FFD700",hz:528,lat:-7.61,lng:110.20,geo:"flowerlife",ben:"Dharma field & Buddha consciousness",mantra:"Om Mani Padme Hum",steps:["Walk the mandala — outer to inner.","Release one attachment with each step inward.","Arrive at the empty luminous centre.","Rest as Buddha nature."],crys:[{n:"Blue Topaz",c:"#4F99C6",p:"Clear dharma field"},{n:"Labradorite",c:"#7B9EB0",p:"Higher self contact"},{n:"White Howlite",c:"#F5F5F5",p:"Calm mind"}]},
  {cat:"earth",id:"easter",nm:"Easter Island · Rapa Nui",loc:"South Pacific",el:"🗿",col:"#8E44AD",col2:"#BB8FD0",hz:396,lat:-27.11,lng:-109.35,geo:"spiral",ben:"Ancestor transmission & mystery lineage",mantra:"Ko au ko Rapa Nui",steps:["Face outward from your centre — as the Moai do.","Feel your ancestors standing behind you.","Receive their strength, wisdom, knowledge.","Carry it forward — you are the living continuation."],crys:[{n:"Basalt",c:"#4A4A4A",p:"Volcanic earth power"},{n:"Obsidian",c:"#1C1C1C",p:"Ancestor mirror"},{n:"Amethyst",c:"#9B59B6",p:"Spiritual vision"}]},
  // SUPREME
  {cat:"supreme",id:"sup_kailash",nm:"Mount Kailash — Moksha",loc:"Tibet · Supreme Reset",el:"🔱",col:"#FFD700",col2:"#FFD700",hz:136,lat:31.07,lng:81.31,geo:"metatron",ben:"Ultimate system reset — Moksha",mantra:"Om Namah Shivaya · Shivo Hum",steps:["Perform full prostrations if able — or visualise.","Complete surrender. Release your entire identity.","Ask: what remains when the self is gone?","Rest in that which cannot be removed."],crys:[{n:"Clear Apophyllite",c:"#E8FFE8",p:"Moksha gateway"},{n:"Diamond",c:"#FFFFFF",p:"Ultimate clarity"},{n:"Black Tourmaline",c:"#1C1C1C",p:"Complete grounding"}]},
  // MIRACLE-CLASS
  {cat:"miracle",id:"amritsar",nm:"Golden Temple · Amritsar",loc:"Punjab, India",el:"🌟",col:"#FFD700",col2:"#FFE680",hz:639,lat:31.62,lng:74.88,geo:"flowerlife",ben:"Selfless service & infinite abundance",mantra:"Waheguru Waheguru Waheguru",steps:["Enter in the spirit of seva — selfless service.","Feel the langar as the highest teaching: no hierarchy.","Serve one person mentally — feel the Guru's grace.","Receive the golden nectar of Shabad."],crys:[{n:"Citrine",c:"#FFF3CD",p:"Abundance frequency"},{n:"Pyrite",c:"#CFB53B",p:"Golden manifestation"},{n:"Yellow Calcite",c:"#FFFACD",p:"Spiritual wealth"}]},
  {cat:"miracle",id:"mauritius",nm:"Paramahansa's Miracle Room",loc:"Mauritius",el:"✨",col:"#FFC0CB",col2:"#FFD8E0",hz:963,lat:-20.16,lng:57.50,geo:"flowerlife",ben:"Quantum healing & instant transformation",mantra:"Om Sri Vishwanandaya Namah",steps:["Surrender completely. No technique. No effort.","Open like a window — let the grace enter.","Let the Master's presence do the work.","Receive in total silence and trust."],crys:[{n:"Phenakite",c:"#F5F5F5",p:"Highest frequency"},{n:"Petalite",c:"#FFF8E1",p:"Angelic contact"},{n:"White Topaz",c:"#FFFFFF",p:"Pure grace"}]},
  {cat:"miracle",id:"shirdi",nm:"Shirdi Sai Baba Samadhi",loc:"Maharashtra, India",el:"🪔",col:"#FF8C00",col2:"#FFB84D",hz:528,lat:19.77,lng:74.48,geo:"hexstar",ben:"Total surrender — Shraddha & Saburi",mantra:"Om Sai Ram",steps:["Come with Shraddha (faith) and Saburi (patience).","Offer every anxiety and fear at His feet.","Breathe in: 'Why fear when I am here?'","Rest in the certainty of His protection."],crys:[{n:"Orange Calcite",c:"#FF7F50",p:"Surrender & faith"},{n:"Amber",c:"#FFBF00",p:"Ancient devotion"},{n:"Carnelian",c:"#E25822",p:"Devotional fire"}]},
  {cat:"miracle",id:"puttaparthi",nm:"Sathya Sai Baba · Puttaparthi",loc:"Andhra Pradesh, India",el:"✨",col:"#FF9933",col2:"#FFBB66",hz:528,lat:14.17,lng:77.82,geo:"flowerlife",ben:"Divine love in human form",mantra:"Sai Ram — Love All Serve All",steps:["Enter with complete openness — judgement dissolved.","Feel Swami's unconditional love surrounding you.","His teaching: My life is my message. Embody it.","Receive the healing that arises through pure love."],crys:[{n:"Peach Moonstone",c:"#FFDAB9",p:"Divine mother love"},{n:"Sunstone",c:"#FF8C00",p:"Solar warmth"},{n:"Rose Quartz",c:"#F4A7B9",p:"Unconditional love"}]},
  {cat:"miracle",id:"serampore",nm:"Sri Yukteswar · Serampore",loc:"West Bengal, India",el:"🏛️",col:"#D4C5A9",col2:"#EDE0CA",hz:741,lat:22.75,lng:88.34,geo:"sri",ben:"Cosmic Aum & jnana transmission",mantra:"Om Tat Sat",steps:["Sit in Jnana posture — complete stillness.","Invoke Sri Yukteswar's precise, scientific mind.","Open to the Cosmic Aum — vibration beneath all creation.","Receive his gift: liberation through understanding."],crys:[{n:"Lapis Lazuli",c:"#26619C",p:"Cosmic wisdom"},{n:"Blue Sapphire",c:"#0F52BA",p:"Jnana transmission"},{n:"Clear Quartz",c:"#F0F8FF",p:"Cosmic Aum amplifier"}]},
  // GALACTIC
  {cat:"galactic",id:"pleiades",nm:"Pleiades Star System",loc:"Taurus Constellation · 440 ly",el:"⭐",col:"#C8D8FF",col2:"#E0ECFF",hz:528,lat:0,lng:0,geo:"stargrid",ben:"Starlight harmony & music alignment",mantra:"We are the stars returning home",steps:["Look at the night sky or visualise the Pleiades cluster.","Feel the Pleiadian frequency — luminous, harmonic, musical.","Open to interstellar music downloads.","Let star harmony reorganise your energy field."],crys:[{n:"Blue Celestite",c:"#87CEEB",p:"Star connection"},{n:"Danburite",c:"#FFF8E7",p:"Pleiadian frequency"},{n:"Aquamarine",c:"#7FFFD4",p:"Cosmic harmony"}]},
  {cat:"galactic",id:"sirius",nm:"Sirius — The Blue Star",loc:"Canis Major · 8.6 ly",el:"💫",col:"#D0D0FF",col2:"#E8E8FF",hz:852,lat:0,lng:0,geo:"stargrid",ben:"Initiation & wisdom downloads",mantra:"I align with the star of Isis",steps:["Visualise the brilliant blue-white light of Sirius.","Allow yourself to be initiated — become a vessel.","Feel ancient Egyptian-Sirian knowledge flowing in.","Write what downloads immediately after."],crys:[{n:"Blue Kyanite",c:"#4169E1",p:"Sirian transmission"},{n:"Lapis Lazuli",c:"#2E4B8E",p:"Isis mysteries"},{n:"Blue Sapphire",c:"#0F52BA",p:"Star initiation"}]},
  {cat:"galactic",id:"arcturus",nm:"Arcturus",loc:"Boötes Constellation · 37 ly",el:"🌟",col:"#F8D070",col2:"#FFE9A0",hz:963,lat:0,lng:0,geo:"metatron",ben:"Rapid regeneration & geometric healing",mantra:"I am a geometric being of light",steps:["Visualise Arcturian geometric light codes entering.","Feel sacred geometry reorganising cellular structure.","Every cell knows its perfect sacred shape.","You are rebuilt in your highest template."],crys:[{n:"Merkabite Calcite",c:"#FFFDE7",p:"Geometric activation"},{n:"Optical Calcite",c:"#F8F8FF",p:"Light refraction healing"},{n:"Clear Quartz",c:"#F0F8FF",p:"Sacred geometry amplifier"}]},
  {cat:"galactic",id:"lyra",nm:"Lyra — The Felines",loc:"Lyra Constellation · Origin",el:"🎵",col:"#F0E8FF",col2:"#F8F4FF",hz:963,lat:0,lng:0,geo:"torus",ben:"Original sound — frequency of creation",mantra:"Aum — the first vibration",steps:["Sound the Aum from the deepest place inside you.","Feel its resonance as the original creative frequency.","You are not making sound — sound is making you.","Rest in the primordial vibration from which all was born."],crys:[{n:"Apophyllite",c:"#E8FFE8",p:"Original frequency"},{n:"Phenakite",c:"#F5F5F5",p:"Highest vibration"},{n:"Moldavite",c:"#3D9970",p:"Cosmic origin"}]},
  // TEMPORAL
  {cat:"temporal",id:"anc_vrindavan",nm:"Ancient Vrindavan — Premananda",loc:"Temporal · Pre-creation",el:"🌸",col:"#FFB6C1",col2:"#FFD8E0",hz:639,lat:27.58,lng:77.70,geo:"spiral",ben:"Supreme bliss & Premananda field",mantra:"Radhe Radhe Govinda",steps:["Travel back with awareness to eternal Vrindavan.","Before the Earth existed — Radha and Krishna's Lila was.","Feel the supreme bliss that precedes all creation.","This is the source of all love. Rest here."],crys:[{n:"Kunzite",c:"#F8C8D4",p:"Eternal love"},{n:"Rose Quartz",c:"#F4A7B9",p:"Pre-creation love field"},{n:"Pink Tourmaline",c:"#FF69B4",p:"Bliss frequency"}]},
  {cat:"temporal",id:"anc_ayodhya",nm:"Ancient Ayodhya",loc:"Temporal · Treta Yuga",el:"🏹",col:"#D2A679",col2:"#E8C49A",hz:417,lat:26.80,lng:82.20,geo:"hexstar",ben:"Dharma & spiritual fortress",mantra:"Jai Shri Ram",steps:["Invoke the Dharma of the Treta Yuga.","Ram's quality: uphold righteousness even at cost.","Where in my life do I compromise my dharma?","Commit to one dharmic action this week."],crys:[{n:"Citrine",c:"#FFF3CD",p:"Dharmic power"},{n:"Yellow Sapphire",c:"#FFFF00",p:"Jupiter wisdom"},{n:"Tiger Eye",c:"#B8860B",p:"Dharmic courage"}]},
  // ANCIENT
  {cat:"ancient",id:"lemuria",nm:"Lemuria · Mu",loc:"Pacific Ocean · 50,000 BCE",el:"🌺",col:"#98D8C8",col2:"#C0EAE0",hz:528,lat:0,lng:0,geo:"fibonacci",ben:"Maternal healing & inner child",mantra:"I remember the mother. I am held.",steps:["Feel the warm Pacific waters — Lemuria rises.","Connect with the maternal frequency pre-dating history.","Your inner child is safe here. Let them be held.","Receive healing for every wound of abandonment."],crys:[{n:"Green Calcite",c:"#90EE90",p:"Lemurian healing"},{n:"Blue Lace Agate",c:"#B0C4DE",p:"Gentle mother frequency"},{n:"Moonstone",c:"#E8E8F0",p:"Inner child sanctuary"}]},
  {cat:"ancient",id:"atlantis",nm:"Atlantis · Poseidia",loc:"Atlantic Ocean · 12,000 BCE",el:"💠",col:"#7BB8D8",col2:"#AADDF0",hz:741,lat:0,lng:0,geo:"metatron",ben:"Mental clarity & high-tech logic",mantra:"I wield technology in service of love",steps:["Access Atlantean crystal technology through inner sight.","Feel the enormous mental clarity of the Atlantean mind.","Bring that clarity to your current life.","Commit: technology serves love — always."],crys:[{n:"Aqua Aura Quartz",c:"#87CEEB",p:"Atlantean frequency"},{n:"Blue Fluorite",c:"#1E90FF",p:"Mental clarity"},{n:"Labradorite",c:"#7B9EB0",p:"Atlantean memory"}]},
  // SQI LINEAGE
  {cat:"sqi",id:"samadhi",nm:"Samadhi Portal",loc:"Inner Stillness · Always now",el:"⭕",col:"#F8F8E8",col2:"#FFFFFF",hz:0,lat:0,lng:0,geo:"torus",ben:"Zero-point awareness & ego dissolution",mantra:"So Hum (I am That)",steps:["Close eyes. Breathe naturally, without controlling.","Notice who is watching the breath arise and fall.","Stay as that witness — the one who watches.","Let the watcher dissolve into the watching."],crys:[{n:"Clear Quartz",c:"#F0F8FF",p:"Pure clarity"},{n:"Selenite",c:"#FFFAF0",p:"Zero point field"},{n:"Apophyllite",c:"#E8FFE8",p:"Samadhi gateway"}]},
];

// ─── Sacred geometry draw ─────────────────────────────────────────────────────
function drawGeo(ctx, site, t, str, hasScalar) {
  const W=340,H=240,cx=W/2,cy=H/2,col=site.col,col2=site.col2||col,g=site.geo,sp=0.5+str;
  ctx.clearRect(0,0,W,H);
  // Prema pulses
  for(let i=0;i<2+Math.round(str*3);i++){
    const ph=((t*(0.35+str*0.55)+i/(2+Math.round(str*3)))%1);
    ctx.globalAlpha=Math.max(0,(1-ph)*(0.25+str*0.5));
    ctx.strokeStyle=col;ctx.lineWidth=2-ph*1.5;
    ctx.beginPath();ctx.arc(cx,cy,ph*cy*1.2,0,Math.PI*2);ctx.stroke();
  }
  // Glow
  ctx.globalAlpha=0.08+str*0.14;
  const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,cy*0.88);
  grd.addColorStop(0,col);grd.addColorStop(1,"transparent");
  ctx.fillStyle=grd;ctx.beginPath();ctx.arc(cx,cy,cy*0.88,0,Math.PI*2);ctx.fill();
  // Geometry
  if(g==="pyramid"){
    ctx.save();ctx.translate(cx,cy);
    ctx.globalAlpha=0.65+str*0.3;ctx.strokeStyle=col;ctx.lineWidth=1.8;
    ctx.beginPath();ctx.moveTo(0,-82);ctx.lineTo(70,46);ctx.lineTo(-70,46);ctx.closePath();ctx.stroke();
    ctx.fillStyle=col+"20";ctx.fill();
    ctx.globalAlpha=0.3;ctx.lineWidth=0.8;
    for(let i=1;i<=4;i++){const y=-82+i*25,w=70*(i/4+0.05);ctx.beginPath();ctx.moveTo(-w,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.globalAlpha=1;ctx.fillStyle=col2;ctx.beginPath();ctx.arc(0,-82,5,0,Math.PI*2);ctx.fill();
    ctx.rotate(t*0.1*sp);ctx.globalAlpha=0.2+str*0.2;ctx.strokeStyle=col2;ctx.lineWidth=0.9;
    ctx.beginPath();ctx.moveTo(0,82);ctx.lineTo(70,-46);ctx.lineTo(-70,-46);ctx.closePath();ctx.stroke();
    ctx.restore();
  } else if(g==="sri"){
    ctx.save();ctx.translate(cx,cy);
    for(let layer=0;layer<4;layer++){
      const sc=1-layer*0.18,op=0.7-layer*0.1;
      ctx.globalAlpha=op;ctx.strokeStyle=col;ctx.lineWidth=1.5-layer*0.25;
      ctx.save();ctx.rotate(t*0.14*sp*(layer%2===0?1:-1));
      ctx.beginPath();ctx.moveTo(0,-75*sc);ctx.lineTo(65*sc,37*sc);ctx.lineTo(-65*sc,37*sc);ctx.closePath();ctx.stroke();ctx.fillStyle=col+"15";ctx.fill();
      ctx.beginPath();ctx.moveTo(0,75*sc);ctx.lineTo(65*sc,-37*sc);ctx.lineTo(-65*sc,-37*sc);ctx.closePath();ctx.stroke();ctx.fillStyle=col+"10";ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  } else if(g==="metatron"){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.08*sp);
    ctx.globalAlpha=0.28+str*0.12;ctx.strokeStyle=col;ctx.lineWidth=0.9;
    const mr=54;ctx.beginPath();ctx.arc(0,0,mr,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*mr,Math.sin(a)*mr,mr,0,Math.PI*2);ctx.stroke();}
    ctx.globalAlpha=0.5+str*0.35;ctx.lineWidth=1.4;
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*mr*2,Math.sin(a)*mr*2);ctx.stroke();}
    ctx.restore();
  } else if(g==="flowerlife"){
    const r=36;ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.1*sp);
    ctx.strokeStyle=col;ctx.globalAlpha=0.65+str*0.3;ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=col+"14";ctx.fill();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=col+"0E";ctx.fill();}
    ctx.globalAlpha=0.3+str*0.2;ctx.lineWidth=0.9;ctx.beginPath();ctx.arc(0,0,r*2,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  } else if(g==="torus"){
    for(let i=0;i<8;i++){
      ctx.globalAlpha=0.18+str*0.22;ctx.strokeStyle=i%2===0?col:col2;ctx.lineWidth=1;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(i*Math.PI/8+t*0.08*sp);
      ctx.beginPath();ctx.ellipse(0,0,86,32,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    ctx.save();ctx.translate(cx,cy);
    ctx.globalAlpha=0.55+str*0.35;ctx.strokeStyle=col;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(0,0,52,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  } else if(g==="hexstar"){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.12*sp);
    ctx.globalAlpha=0.65+str*0.3;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.fillStyle=col+"14";
    ctx.beginPath();ctx.moveTo(0,-72);for(let i=1;i<6;i++){const a=i*Math.PI/3-Math.PI/2;ctx.lineTo(Math.cos(a)*72,Math.sin(a)*72);}ctx.closePath();ctx.stroke();ctx.fill();
    ctx.rotate(Math.PI/6);ctx.beginPath();ctx.moveTo(0,-72);for(let i=1;i<6;i++){const a=i*Math.PI/3-Math.PI/2;ctx.lineTo(Math.cos(a)*72,Math.sin(a)*72);}ctx.closePath();ctx.stroke();ctx.fill();
    ctx.restore();
  } else if(g==="fibonacci"){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.08*sp);
    ctx.globalAlpha=0.5+str*0.35;ctx.strokeStyle=col;ctx.lineWidth=1.2;
    let ang=0;[5,8,13,21,34,55].forEach(f=>{ctx.beginPath();ctx.arc(0,0,f,ang,ang+Math.PI/2);ctx.stroke();ang+=Math.PI/2;});
    ctx.restore();
  } else if(g==="stargrid"){
    ctx.save();ctx.translate(cx,cy);
    for(let n=0;n<5;n++){
      ctx.globalAlpha=0.45-n*0.05+str*0.2;ctx.strokeStyle=n%2===0?col:col2;ctx.lineWidth=1.2-n*0.15;
      ctx.save();ctx.rotate(t*(n%2===0?0.18:-0.14)*sp+n*0.3);
      const sides=6+n,rr=22+n*15;
      ctx.beginPath();for(let i=0;i<=sides;i++){const a=i*(2*Math.PI/sides);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.stroke();ctx.fillStyle=col+"0E";ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  } else if(g==="spiral"){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.1*sp);
    ctx.globalAlpha=0.55+str*0.35;ctx.strokeStyle=col;ctx.lineWidth=1.2;
    ctx.beginPath();for(let a=0;a<Math.PI*6;a+=0.08){const r=a*10;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();
    ctx.restore();
  } else { // vesica
    ctx.save();ctx.translate(cx,cy);
    ctx.globalAlpha=0.55+str*0.3;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.fillStyle=col+"12";
    ctx.beginPath();ctx.arc(-24,0,52,0,Math.PI*2);ctx.stroke();ctx.fill();
    ctx.beginPath();ctx.arc(24,0,52,0,Math.PI*2);ctx.stroke();ctx.fill();
    ctx.restore();
  }
  // Metatron overlay — all sites
  ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.06*sp);
  ctx.globalAlpha=0.12+str*0.1;ctx.strokeStyle=col;ctx.lineWidth=0.7;
  const mr2=50;ctx.beginPath();ctx.arc(0,0,mr2,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*mr2,Math.sin(a)*mr2,mr2,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
  // Scalar beam — YOU dot
  if(hasScalar){
    const ang=(t*(0.4+str*0.3))%(Math.PI*2);
    const bx=cx+90*Math.cos(ang),by=cy+90*Math.sin(ang);
    ctx.globalAlpha=0.55+str*0.35;ctx.strokeStyle=col;ctx.lineWidth=1.5;
    ctx.setLineDash([5,5]);ctx.lineDashOffset=-(t*18);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(bx,by);ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha=1;ctx.fillStyle=col2;ctx.beginPath();ctx.arc(bx,by,4,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.25;ctx.beginPath();ctx.arc(bx,by,7+Math.sin(t*4)*2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.6;ctx.fillStyle=col;ctx.font="bold 8px sans-serif";ctx.textAlign="center";
    ctx.fillText("YOU",bx,by-13);
  }
  // Centre
  ctx.globalAlpha=1;ctx.fillStyle=col2;ctx.beginPath();ctx.arc(cx,cy,5+str*2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.35+str*0.25;ctx.beginPath();ctx.arc(cx,cy,9+Math.sin(t*3)*2+str*3,0,Math.PI*2);ctx.fill();
}

// ─── Binaural audio engine ────────────────────────────────────────────────────
let _aCtx=null,_oscL=null,_oscR=null,_gn=null,_merger=null,_toneOn=false;

function playTone(carrier,beat,vol){
  stopToneEngine();
  if(carrier<=0)return;
  try{
    _aCtx=new(window.AudioContext||(window as any).webkitAudioContext)();
    _oscL=_aCtx.createOscillator();_oscR=_aCtx.createOscillator();
    _gn=_aCtx.createGain();_merger=_aCtx.createChannelMerger(2);
    const gL=_aCtx.createGain(),gR=_aCtx.createGain();
    _oscL.type="sine";_oscL.frequency.value=carrier;
    _oscR.type="sine";_oscR.frequency.value=carrier+beat;
    gL.gain.value=1;gR.gain.value=1;_gn.gain.value=vol;
    _oscL.connect(gL);_oscR.connect(gR);
    gL.connect(_merger,0,0);gR.connect(_merger,0,1);
    _merger.connect(_gn);_gn.connect(_aCtx.destination);
    _oscL.start();_oscR.start();_toneOn=true;
  }catch(e){_toneOn=false;}
}
function stopToneEngine(){
  try{_oscL?.stop();}catch{}try{_oscR?.stop();}catch{}try{_aCtx?.close();}catch{}
  _oscL=null;_oscR=null;_gn=null;_merger=null;_aCtx=null;_toneOn=false;
}
function setToneVol(v){if(_gn&&_aCtx)_gn.gain.setTargetAtTime(v,_aCtx.currentTime,0.1);}

// ─── Strength descriptions ────────────────────────────────────────────────────
const STR_LABELS=[
  [0,15,"Invisible — pure intention, no sound"],
  [15,35,"Subtle — soft background presence"],
  [35,55,"Gentle — supported meditation"],
  [55,75,"Active — deep practice mode"],
  [75,90,"Strong — immersive pilgrimage"],
  [90,101,"Full immersion — maximum field"],
];
const STR_DESCS={
  0:"The field is active at zero volume — pure intention and geometry only. Safe for sleeping or background anchoring.",
  15:"A soft golden hum in the background. The Prema pulses are gentle. Suitable for work or daily life while staying connected.",
  35:"Clear, present, supportive. Ideal for morning practice, yoga, or focused work with the site's energy.",
  55:"Deep practice mode. The scalar carrier is clearly audible. Use during dedicated meditation facing your bearing.",
  75:"Strong immersive field. Reserve for sitting meditation or healing sessions.",
  90:"Maximum activation. Full binaural beat engagement. Use only for short, intentional sessions — 20 minutes max.",
};

// ─── Category icon SVG ────────────────────────────────────────────────────────
function CatIcon({geo,col}:{geo:string,col:string}){
  const c=col;
  if(geo==="pyramid")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><polygon points="0,-9 8,5 -8,5" stroke={c} strokeWidth="1" fill={c} fillOpacity=".12"/><line x1="0" y1="-9" x2="0" y2="5" stroke={c} strokeWidth=".5" opacity=".5"/><circle r="2" fill={c}><animate attributeName="opacity" values=".9;.4;.9" dur="2.5s" repeatCount="indefinite"/></circle></g></svg>);
  if(geo==="sri")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><polygon points="0,-8 7,4 -7,4" stroke={c} strokeWidth=".9" fill="none"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/></polygon><polygon points="0,8 7,-4 -7,-4" stroke={c} strokeWidth=".9" fill="none"><animateTransform attributeName="transform" type="rotate" values="0;-360" dur="8s" repeatCount="indefinite"/></polygon><circle r="2.5" fill={c}/></g></svg>);
  if(geo==="metatron")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><circle r="9" stroke={c} strokeWidth=".5" fill="none" opacity=".3"/><circle r="4.5" stroke={c} strokeWidth=".5" fill="none" opacity=".5"/>{[0,1,2,3,4,5].map(i=><circle key={i} cx={Math.cos(i*Math.PI/3)*4.5} cy={Math.sin(i*Math.PI/3)*4.5} r="4.5" stroke={c} strokeWidth=".4" fill="none" opacity=".25"/>)}<circle r="2" fill={c}><animate attributeName="opacity" values=".9;.4;.9" dur="2s" repeatCount="indefinite"/></circle></g></svg>);
  if(geo==="flowerlife")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><circle r="4" stroke={c} strokeWidth=".8" fill={c} fillOpacity=".12"/>{[0,1,2,3,4,5].map(i=><circle key={i} cx={Math.cos(i*Math.PI/3)*4} cy={Math.sin(i*Math.PI/3)*4} r="4" stroke={c} strokeWidth=".5" fill="none" opacity=".4"/>)}<circle r="1.8" fill={c}><animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite"/></circle></g></svg>);
  if(geo==="torus")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><ellipse rx="9" ry="3.5" stroke={c} strokeWidth=".8" fill="none" opacity=".6"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="5s" repeatCount="indefinite"/></ellipse><ellipse rx="9" ry="3.5" stroke={c} strokeWidth=".6" fill="none" opacity=".4" transform="rotate(60)"><animateTransform attributeName="transform" type="rotate" values="60;420" dur="5s" repeatCount="indefinite"/></ellipse><circle r="2.5" fill={c}/></g></svg>);
  if(geo==="stargrid")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><polygon points="0,-9 2,-3 8,-3 3,1 5,7 0,3.5 -5,7 -3,1 -8,-3 -2,-3" fill={c} opacity=".8"><animate attributeName="opacity" values=".8;1;.8" dur="1.8s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="1.8s" repeatCount="indefinite"/></polygon></g></svg>);
  if(geo==="hexstar")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><polygon points="0,-8 7,4 -7,4" stroke={c} strokeWidth=".8" fill={c} fillOpacity=".1"/><polygon points="0,8 7,-4 -7,-4" stroke={c} strokeWidth=".8" fill={c} fillOpacity=".1"/><circle r="2.2" fill={c}><animate attributeName="r" values="1.8;2.8;1.8" dur="2s" repeatCount="indefinite"/></circle></g></svg>);
  if(geo==="spiral")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><path d="M0,0 Q2,-4 5,-2 Q8,2 4,6 Q-2,9 -7,4 Q-10,-4 -4,-9" stroke={c} strokeWidth=".9" fill="none" opacity=".8"><animate attributeName="opacity" values=".8;.3;.8" dur="3s" repeatCount="indefinite"/></path><circle r="2" fill={c}/></g></svg>);
  if(geo==="fibonacci")return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><path d="M0,0 Q0,-3 3,-3 Q6,-3 6,0 Q6,5 0,5 Q-8,5 -8,-3 Q-8,-11 3,-11" stroke={c} strokeWidth=".9" fill="none" opacity=".75"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="12s" repeatCount="indefinite"/></path><circle r="2" fill={c}/></g></svg>);
  // vesica default
  return(<svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}><g transform="translate(11,11)"><circle cx="-3" cy="0" r="6" stroke={c} strokeWidth=".7" fill={c} fillOpacity=".08" opacity=".7"/><circle cx="3" cy="0" r="6" stroke={c} strokeWidth=".7" fill={c} fillOpacity=".08" opacity=".7"/><circle r="2" fill={c}><animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite"/></circle></g></svg>);
}

// ─── DIRS helper ─────────────────────────────────────────────────────────────
const DIRS=["N","NE","E","SE","S","SW","W","NW"];

// ─── Main component ───────────────────────────────────────────────────────────
export default function VirtualPilgrimage() {
  const {
    home, activation, loading, gpsLoading,
    detectHome, activateSite, updateStrength, markPracticeComplete, releaseLock,
  } = useVirtualPilgrimage();

  // Local UI state
  const [previewSite, setPreviewSite] = useState<typeof SITES[0]|null>(null);
  const [ddOpen, setDdOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"practice"|"scalar"|"truth"|"crystals">("practice");
  const [curStep, setCurStep] = useState(0);
  const [strength, setStrengthLocal] = useState(activation?.strength ?? 20);
  const [toneOn, setToneOn] = useState(false);
  const [changeWarn, setChangeWarn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number|null>(null);
  const t0Ref     = useRef<number|null>(null);

  // Sync strength from loaded activation
  useEffect(()=>{ if(activation?.strength) setStrengthLocal(activation.strength); },[activation]);

  // Stop audio on unmount
  useEffect(()=>()=>stopToneEngine(),[]);

  // ── Compute scalar for the currently active site ──────────────────────────
  const activeSite = activation ? SITES.find(s=>s.id===activation.siteId)||null : null;
  const scalar = activation?.scalar ?? null;

  // ── Canvas animation ──────────────────────────────────────────────────────
  useEffect(()=>{
    const site = activeSite;
    if(!site) return;
    const cv = canvasRef.current;
    if(!cv) return;
    const ctx = cv.getContext("2d");
    if(!ctx) return;
    if(animRef.current) cancelAnimationFrame(animRef.current);
    t0Ref.current = null;
    function frame(ts:number){
      if(!t0Ref.current) t0Ref.current=ts;
      const t=(ts-t0Ref.current)/1000;
      drawGeo(ctx,site,t,strength/100,!!(scalar&&site.lat!==0));
      animRef.current=requestAnimationFrame(frame);
    }
    animRef.current=requestAnimationFrame(frame);
    return ()=>{ if(animRef.current) cancelAnimationFrame(animRef.current); };
  },[activeSite?.id, scalar, strength]);

  // ── Strength change ───────────────────────────────────────────────────────
  function handleStrength(v:number){
    setStrengthLocal(v);
    updateStrength(v);
    if(toneOn) setToneVol(v/100*0.18);
  }

  // ── Tone toggle ───────────────────────────────────────────────────────────
  function handleToneToggle(){
    if(toneOn){ stopToneEngine(); setToneOn(false); return; }
    if(!scalar?.carrierHz) return;
    playTone(scalar.carrierHz, scalar.binauralHz, strength/100*0.18);
    setToneOn(_toneOn);
  }

  // ── Activate selected site ────────────────────────────────────────────────
  async function handleActivate(){
    if(!previewSite) return;
    await activateSite({
      siteId: previewSite.id,
      siteName: previewSite.nm,
      siteLat: previewSite.lat,
      siteLng: previewSite.lng,
      siteHz:  previewSite.hz,
      strength,
    });
    setPreviewSite(null);
    setDdOpen(false);
    setActiveTab("practice");
    setCurStep(0);
  }

  // ── Mark practice ────────────────────────────────────────────────────────
  async function handleMarkDay(){
    await markPracticeComplete();
  }

  // ── Release lock ──────────────────────────────────────────────────────────
  async function handleRelease(){
    stopToneEngine(); setToneOn(false);
    await releaseLock();
    setChangeWarn(false);
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    root:{ background:"#050505", minHeight:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"rgba(255,255,255,.88)", paddingBottom:80 } as React.CSSProperties,
    card:{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.07)", borderRadius:16, padding:"18px 20px", marginBottom:12 } as React.CSSProperties,
    goldCard:{ background:"rgba(212,175,55,.06)", border:"1px solid rgba(212,175,55,.25)", borderRadius:16, padding:"18px 20px", marginBottom:12 } as React.CSSProperties,
    lbl:{ color:"rgba(255,255,255,.35)", fontSize:10, fontWeight:800, letterSpacing:".45em", textTransform:"uppercase" as const, display:"block", marginBottom:10 },
    btn:{ width:"100%", padding:14, border:"none", borderRadius:14, fontSize:12, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" as const, cursor:"pointer", fontFamily:"inherit" } as React.CSSProperties,
    tab:{ flex:1, padding:"11px 4px", fontSize:9, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase" as const, border:"none", cursor:"pointer", fontFamily:"inherit", borderBottom:"2px solid transparent", background:"transparent", transition:"all .2s" } as React.CSSProperties,
    stepRow:{ display:"flex", gap:12, padding:"12px 14px", borderRadius:12, cursor:"pointer", marginBottom:10, border:"1px solid transparent", transition:"all .2s", alignItems:"flex-start" as const } as React.CSSProperties,
    crRow:{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)", marginBottom:10 } as React.CSSProperties,
    siteRow:{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,.04)", cursor:"pointer", background:"transparent", borderLeft:"none", borderRight:"none", borderTop:"none", width:"100%", textAlign:"left" as const, fontFamily:"inherit", transition:"background .15s" } as React.CSSProperties,
    scalarRow:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:10, background:"rgba(212,175,55,.05)", border:"1px solid rgba(212,175,55,.15)", marginBottom:10 } as React.CSSProperties,
    truthRow:{ padding:"13px 14px", background:"rgba(255,255,255,.025)", borderRadius:12, borderLeft:"3px solid rgba(212,175,55,.5)", marginBottom:12 } as React.CSSProperties,
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if(loading) return (
    <div style={{...S.root, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{color:"#D4AF37", fontSize:14, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase"}}>Loading Pilgrimage...</div>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,.25); border-radius: 2px; }
        @keyframes goldAura { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes lockPulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.4)} 70%{box-shadow:0 0 0 12px rgba(212,175,55,0)} }
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:99px;background:rgba(212,175,55,.15);outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#D4AF37;cursor:pointer;}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{padding:"28px 16px 20px",textAlign:"center",background:"rgba(212,175,55,.04)",borderBottom:"1px solid rgba(255,255,255,.05)",marginBottom:16}}>
        <div style={{color:"rgba(255,255,255,.2)",fontSize:"7.5px",fontWeight:800,letterSpacing:".7em",textTransform:"uppercase",marginBottom:8}}>SQI 2050 · SACRED CONSCIOUSNESS SYSTEM</div>
        <div style={{color:"#D4AF37",fontSize:26,fontWeight:900,letterSpacing:"-.04em",animation:"goldAura 4s ease-in-out infinite",marginBottom:6}}>Virtual Pilgrimage</div>
        <div style={{color:"rgba(255,255,255,.35)",fontSize:12,lineHeight:1.7}}>One site. One home. 40 days of daily practice.</div>
      </div>

      <div style={{padding:"0 16px"}}>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STATE A: NO HOME GPS YET                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!home && (
          <div>
            <span style={S.lbl}>Step 1 — lock your home coordinates</span>
            <div style={S.goldCard}>
              <div style={{textAlign:"center",padding:"8px 0 14px"}}>
                <div style={{fontSize:48,marginBottom:12}}>📍</div>
                <div style={{color:"#D4AF37",fontSize:14,fontWeight:800,marginBottom:8}}>Lock Your Pilgrimage Home Base</div>
                <div style={{color:"rgba(255,255,255,.45)",fontSize:12,lineHeight:1.7,marginBottom:6}}>Your GPS coordinates are saved to Supabase and localStorage permanently — they persist even when the app is closed or your phone is off. The scalar carrier wave is unique to your exact home ↔ site vector.</div>
                <div style={{color:"rgba(255,255,255,.22)",fontSize:10,marginBottom:18,fontStyle:"italic"}}>Coordinates saved once. Never tracked or shared.</div>
                <button
                  onClick={()=>detectHome()}
                  disabled={gpsLoading}
                  style={{...S.btn, background:"linear-gradient(135deg,#D4AF37,#8B7A28)",color:"#050505",fontSize:13}}
                >
                  {gpsLoading ? "📍 Detecting..." : "📍 Detect & Lock My Home Location"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STATE B: HOME LOCKED, NO SITE ACTIVATED                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {home && !activation && (
          <div>
            {/* Home badge */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"rgba(212,175,55,.07)",border:"1px solid rgba(212,175,55,.3)",borderRadius:12,marginBottom:16}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#D4AF37",animation:"goldAura 2s ease-in-out infinite"}}/>
              <span style={{color:"#D4AF37",fontSize:10,fontWeight:800,letterSpacing:".3em",textTransform:"uppercase"}}>Home locked · {home.lat.toFixed(4)}° {home.lng.toFixed(4)}°</span>
            </div>

            <span style={S.lbl}>Step 2 — choose your pilgrimage site</span>
            <div style={{color:"rgba(255,255,255,.45)",fontSize:12,lineHeight:1.7,marginBottom:14,padding:"12px 14px",background:"rgba(255,255,255,.02)",borderRadius:12,borderLeft:"3px solid rgba(212,175,55,.4)"}}>
              Select a site below to preview it. When ready, tap <strong style={{color:"rgba(212,175,55,.9)"}}>Activate & Lock</strong> to begin your 40-day pilgrimage. One site locked per person.
            </div>

            {/* Dropdown toggle */}
            <button
              onClick={()=>setDdOpen(v=>!v)}
              style={{width:"100%",padding:"15px 18px",background:"rgba(212,175,55,.06)",border:"1px solid rgba(212,175,55,.3)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit",marginBottom:8}}
            >
              <div style={{textAlign:"left"}}>
                <div style={{color:"rgba(255,255,255,.25)",fontSize:"7.5px",fontWeight:800,letterSpacing:".5em",textTransform:"uppercase",marginBottom:4}}>SELECT PILGRIMAGE SITE — 40+ PORTALS</div>
                <div style={{color:previewSite?previewSite.col:"#D4AF37",fontSize:14,fontWeight:800}}>
                  {previewSite ? `${previewSite.el} ${previewSite.nm}` : "Tap to open the full registry →"}
                </div>
              </div>
              <div style={{color:"#D4AF37",fontSize:20,transition:"transform .3s",transform:ddOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
            </button>

            {/* Dropdown */}
            {ddOpen && (
              <div style={{borderRadius:16,border:"1px solid rgba(212,175,55,.18)",background:"rgba(5,5,5,.98)",marginBottom:12,maxHeight:380,overflowY:"auto"}}>
                {(Object.keys(CATS) as Array<keyof typeof CATS>).map(cat=>{
                  const sites=SITES.filter(s=>s.cat===cat);
                  return(
                    <div key={cat}>
                      <div style={{padding:"8px 16px 4px",color:CATS[cat].col,fontSize:"7.5px",fontWeight:800,letterSpacing:".45em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>
                        <span>{CATS[cat].label}</span>
                        <span style={{color:"rgba(255,255,255,.2)",fontSize:9,marginLeft:4}}>{sites.length}</span>
                      </div>
                      {sites.map(s=>(
                        <button key={s.id} style={S.siteRow} onClick={()=>{setPreviewSite(s);setDdOpen(false);}}>
                          <CatIcon geo={s.geo} col={s.col}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,.88)"}}>{s.el} {s.nm}</div>
                            <div style={{fontSize:9,color:"rgba(255,255,255,.35)"}}>{s.loc}{s.hz>0?` · ${s.hz} Hz`:""}</div>
                          </div>
                          <span style={{color:"rgba(212,175,55,.4)",fontSize:11}}>→</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Preview card */}
            {previewSite && !ddOpen && (()=>{
              const sv = home && previewSite.lat!==0 ? computeScalarVector(home,previewSite.lat,previewSite.lng,previewSite.hz) : null;
              return(
                <div style={{...S.goldCard, background:previewSite.col+"14", border:`1px solid ${previewSite.col}33`}}>
                  <div style={{textAlign:"center",marginBottom:14}}>
                    <div style={{fontSize:32,marginBottom:8}}>{previewSite.el}</div>
                    <div style={{fontSize:20,fontWeight:900,color:previewSite.col,marginBottom:4}}>{previewSite.nm}</div>
                    <div style={{fontSize:9,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:8}}>{previewSite.loc}</div>
                    <div style={{fontSize:12,lineHeight:1.6,color:"rgba(255,255,255,.55)",marginBottom:14}}>✦ {previewSite.ben}</div>
                    {sv && (
                      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>
                        <div style={{padding:"5px 14px",borderRadius:100,background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)",fontSize:11,color:"rgba(255,255,255,.7)"}}>
                          Face {sv.bearingDir} {sv.bearingDeg}° during practice
                        </div>
                        <div style={{padding:"5px 14px",borderRadius:100,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",fontSize:11,color:"rgba(255,255,255,.5)"}}>
                          {sv.carrierHz.toFixed(1)} Hz · {sv.distanceKm.toLocaleString()} km
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleActivate} style={{...S.btn,background:"linear-gradient(135deg,#D4AF37,#8B7A28)",color:"#050505",fontSize:14,padding:16,animation:"lockPulse 2s infinite",marginBottom:10}}>
                    🔱 Activate & Lock This Site
                  </button>
                  <div style={{color:"rgba(255,255,255,.3)",fontSize:11,lineHeight:1.6,textAlign:"center"}}>Locks your pilgrimage for 40 days.<br/>Scalar wave, geometry & Prema pulses activate immediately.</div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STATE C: SITE LOCKED & ACTIVE                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activation && activeSite && (
          <div>

            {/* Lock banner */}
            <div style={{borderRadius:18,padding:"18px 20px",marginBottom:14,background:activeSite.col+"10",border:`1px solid ${activeSite.col}44`,position:"relative",animation:"lockPulse 4s infinite"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(212,175,55,.15)",border:"2px solid rgba(212,175,55,.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🔒</div>
                <div>
                  <div style={{color:"#D4AF37",fontSize:10,fontWeight:800,letterSpacing:".5em",textTransform:"uppercase",marginBottom:2}}>PILGRIMAGE ACTIVE & LOCKED</div>
                  <div style={{fontSize:16,fontWeight:900,color:"rgba(255,255,255,.9)"}}>{activeSite.el} {activeSite.nm}</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:800,letterSpacing:".3em",textTransform:"uppercase"}}>Day <span style={{color:"#D4AF37"}}>{activation.daysActive+1}</span> of 40</span>
                  <span style={{color:"rgba(255,255,255,.4)",fontSize:10}}>{Math.max(0,39-activation.daysActive)} days remaining</span>
                </div>
                <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"linear-gradient(90deg,#D4AF37,#FFD700)",borderRadius:3,width:`${Math.min(100,((activation.daysActive+1)/40)*100)}%`,transition:"width .5s"}}/>
                </div>
              </div>
              {/* Server pulse status */}
              {activation.lastPulseAt && (
                <div style={{display:"flex",alignItems:"center",gap:6,color:"rgba(255,255,255,.3)",fontSize:9}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#10b981"}}/>
                  Scalar field pulsed by server · {activation.pulseCount} pulses · last: {new Date(activation.lastPulseAt).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Sacred geometry canvas */}
            <div style={{borderRadius:20,padding:"16px 16px 14px",marginBottom:12,background:activeSite.col+"12",border:`1px solid ${activeSite.col}33`,textAlign:"center"}}>
              <canvas ref={canvasRef} width={340} height={240} style={{display:"block",margin:"0 auto 10px",borderRadius:14,maxWidth:"100%"}}/>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:10,padding:"4px 14px",borderRadius:100,background:"rgba(212,175,55,.08)",border:"1px solid rgba(212,175,55,.2)"}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#D4AF37",animation:"goldAura 1.5s ease-in-out infinite"}}/>
                <span style={{color:"#D4AF37",fontSize:9,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase"}}>PREMA PULSE ACTIVE</span>
              </div>
              <div style={{fontSize:18,fontWeight:900,color:activeSite.col,marginBottom:3}}>{activeSite.nm}</div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:8}}>{activeSite.loc}</div>
              <div style={{fontSize:12,lineHeight:1.6,color:"rgba(255,255,255,.55)",marginBottom:10}}>✦ {activeSite.ben}</div>
              {scalar && activeSite.lat!==0 && (
                <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                  <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 14px",borderRadius:100,background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)"}}>
                    <span style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>FACE</span>
                    <span style={{color:"#D4AF37",fontSize:14,fontWeight:900}}>{scalar.bearingDir}</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,.45)"}}>{scalar.bearingDeg}°</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>during practice</span>
                  </div>
                  <div style={{display:"inline-flex",alignItems:"center",padding:"5px 14px",borderRadius:100,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
                    <span style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{scalar.distanceKm.toLocaleString()} km from home</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.06)",marginBottom:16}}>
              {([["practice","Practice"],["scalar","Scalar Wave"],["truth","How It Works"],["crystals","Crystals"]] as [string,string][]).map(([id,label])=>(
                <button key={id} style={{...S.tab,color:activeTab===id?activeSite.col:"rgba(255,255,255,.35)",borderBottomColor:activeTab===id?activeSite.col:"transparent"}} onClick={()=>setActiveTab(id as any)}>{label}</button>
              ))}
            </div>

            {/* ── PRACTICE TAB ── */}
            {activeTab==="practice" && (
              <div>
                <span style={S.lbl}>Daily practice protocol</span>
                <div style={{marginBottom:14}}>
                  {activeSite.steps.map((step,i)=>(
                    <div key={i} style={{...S.stepRow,background:curStep===i?activeSite.col+"14":"transparent",borderColor:curStep===i?activeSite.col+"44":"transparent"}} onClick={()=>setCurStep(i)}>
                      <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:curStep===i?activeSite.col:"rgba(255,255,255,.06)",color:curStep===i?"#050505":"rgba(255,255,255,.3)",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                      <div style={{color:curStep===i?"rgba(255,255,255,.92)":"rgba(255,255,255,.48)",fontSize:13,lineHeight:1.7,paddingTop:2}}>{step}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  <button disabled={curStep===0} onClick={()=>setCurStep(s=>Math.max(0,s-1))} style={{...S.btn,flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.45)",opacity:curStep===0?.4:1}}>← Back</button>
                  <button disabled={curStep===activeSite.steps.length-1} onClick={()=>setCurStep(s=>Math.min(activeSite.steps.length-1,s+1))} style={{...S.btn,flex:1,background:curStep===activeSite.steps.length-1?"rgba(255,255,255,.04)":`linear-gradient(135deg,${activeSite.col},${activeSite.col}AA)`,color:curStep===activeSite.steps.length-1?"rgba(255,255,255,.2)":"#050505",border:"none"}}>Next →</button>
                </div>
                <div style={S.goldCard}>
                  <span style={S.lbl}>🕉 Mantra — chant aloud or silently</span>
                  <div style={{color:"#D4AF37",fontSize:15,fontWeight:700,fontStyle:"italic",lineHeight:1.7,textAlign:"center"}}>"{activeSite.mantra}"</div>
                </div>
                <button onClick={handleMarkDay} style={{...S.btn,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",marginTop:8}}>
                  ✓ Mark Today's Practice Complete
                </button>
              </div>
            )}

            {/* ── SCALAR WAVE TAB ── */}
            {activeTab==="scalar" && scalar && (
              <div>
                <div style={S.card}>
                  <span style={S.lbl}>Your personal scalar bridge</span>
                  {/* Scalar params */}
                  {[
                    {l:"CARRIER FREQUENCY",v:scalar.carrierHz.toFixed(3)+" Hz",n:`Unique to your home ↔ ${activeSite.nm.split("·")[0].trim()}`},
                    {l:"BINAURAL BEAT",v:scalar.binauralHz.toFixed(2)+" Hz",n:`Bearing ${scalar.bearingDeg}° → theta/gamma range`},
                    {l:"SCHUMANN RESONANCE LOCK",v:scalar.schumannHz+" Hz",n:"Nearest Earth ionospheric harmonic"},
                    {l:"GREAT-CIRCLE DISTANCE",v:scalar.distanceKm.toLocaleString()+" km",n:"Physical distance — anchors the bearing"},
                    {l:"COMPASS BEARING",v:`${scalar.bearingDir} · ${scalar.bearingDeg}°`,n:"Face this direction during every session"},
                  ].map(row=>(
                    <div key={row.l} style={S.scalarRow}>
                      <div>
                        <div style={{color:"rgba(255,255,255,.3)",fontSize:9,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase",marginBottom:3}}>{row.l}</div>
                        <div style={{color:"rgba(255,255,255,.5)",fontSize:11}}>{row.n}</div>
                      </div>
                      <div style={{color:"#D4AF37",fontSize:13,fontWeight:800,flexShrink:0,marginLeft:10}}>{row.v}</div>
                    </div>
                  ))}
                  {/* Tone controls */}
                  <span style={{...S.lbl,marginTop:6}}>Binaural carrier wave</span>
                  <div style={{color:"rgba(255,255,255,.5)",fontSize:12,lineHeight:1.7,marginBottom:14}}>
                    Left ear: {scalar.carrierHz.toFixed(2)} Hz · Right ear: {(scalar.carrierHz+scalar.binauralHz).toFixed(2)} Hz<br/>
                    Brain entrains to the {scalar.binauralHz.toFixed(1)} Hz difference — shifting toward theta/alpha receptive state.
                  </div>
                  {toneOn && (
                    <button onClick={()=>{stopToneEngine();setToneOn(false);}} style={{...S.btn,background:"rgba(212,175,55,.1)",border:"2px solid rgba(212,175,55,.5)",color:"#D4AF37",fontSize:14,fontWeight:900,marginBottom:10}}>
                      ⏹ STOP SCALAR WAVE
                    </button>
                  )}
                  <button onClick={handleToneToggle} style={{...S.btn,background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)",color:"#D4AF37"}}>
                    {toneOn?"⏸ Pause":"▶ Activate Scalar Carrier Wave"}
                  </button>
                  <div style={{marginTop:8,color:"rgba(255,255,255,.2)",fontSize:11,textAlign:"center"}}>Stereo headphones essential · Keep volume gentle</div>
                </div>
              </div>
            )}

            {/* ── HOW IT WORKS TAB ── */}
            {activeTab==="truth" && (
              <div>
                <div style={S.card}>
                  <span style={S.lbl}>What actually happens — honest science</span>
                  <div style={{color:"rgba(255,255,255,.55)",fontSize:13,lineHeight:1.75,marginBottom:16}}>
                    The app does not transmit the energy of a sacred site. No software can do that. What it creates are precise <span style={{color:"#D4AF37"}}>conditions</span> for your consciousness to genuinely connect — through real physics and real practice.
                  </div>
                  {[
                    {t:"① Binaural carrier wave — real neurophysics",b:"Your GPS + the site GPS compute a unique carrier frequency. Left ear receives the carrier; right ear receives the carrier plus a binaural beat. Your brain perceives the difference and entrains to it. EEG studies confirm binaural beats measurably shift brainwave state — from beta (analytical) toward theta and alpha (receptive, meditative). In that state your sensitivity to subtle fields increases."},
                    {t:"② Compass bearing — directional antenna",b:"The great-circle bearing from your home to the site is computed from real GPS coordinates. Facing that exact direction physically aligns your body. Every tradition on Earth has directional prayer — sunrise, Mecca, Jerusalem, the North Star. This is not symbolic. The body as an antenna has an orientation."},
                    {t:"③ Prema pulses — resonant intention field",b:"The radiating rings are a visual representation of Prema (divine love) pulses. In practice: a ghee lamp, mantra, and sincere intention create a consecrated space. Neuroscience calls this a conditioned environment — your nervous system learns the signal. Each session deepens the conditioning. After 40 days the room itself becomes the cue."},
                    {t:"④ Server persistence — field active when phone is off",b:"Your scalar parameters are stored permanently in Supabase. The Railway cron worker pulses every hour — updating 'last_pulse_at' so the field record stays alive. When you return to the app you see how many hours it has been running. The space is continuously held between practice sessions."},
                    {t:"⑤ The 40-day field — why it takes time",b:"40 days of practice creates measurable changes in neural pathways. The space builds energetic memory. What makes the energy real is YOU — facing the bearing, wearing headphones at the scalar frequency, with genuine intention. Do that daily for 40 days and the field in that room changes. Not because of this app. Because of you."},
                  ].map(row=>(
                    <div key={row.t} style={S.truthRow}>
                      <div style={{color:"#D4AF37",fontSize:13,fontWeight:700,marginBottom:6}}>{row.t}</div>
                      <div style={{color:"rgba(255,255,255,.6)",fontSize:12,lineHeight:1.75}}>{row.b}</div>
                    </div>
                  ))}
                  <div style={{padding:14,background:"rgba(212,175,55,.06)",borderRadius:12,border:"1px solid rgba(212,175,55,.18)"}}>
                    <div style={{color:"rgba(212,175,55,.85)",fontSize:13,lineHeight:1.75,fontStyle:"italic"}}>Babaji did not become immortal by subscribing to a cron job. He became immortal through sustained mastery of prana and consciousness over lifetimes. This app is a scaffold. You are the temple.</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CRYSTALS TAB ── */}
            {activeTab==="crystals" && (
              <div>
                <div style={S.card}>
                  <span style={S.lbl}>Crystal allies for this site</span>
                  {activeSite.crys.map(c=>(
                    <div key={c.n} style={S.crRow}>
                      <div style={{width:24,height:24,borderRadius:5,flexShrink:0,background:c.c,border:"1px solid rgba(255,255,255,.15)"}}/>
                      <div>
                        <div style={{color:"rgba(255,255,255,.88)",fontSize:13,fontWeight:700,marginBottom:3}}>{c.n}</div>
                        <div style={{color:"rgba(255,255,255,.45)",fontSize:12,lineHeight:1.6}}>{c.p}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <span style={S.lbl}>4 corners clear quartz activation grid</span>
                  <div style={{color:"rgba(255,255,255,.55)",fontSize:12,lineHeight:1.75,marginBottom:16}}>
                    Place one clear quartz point in each corner of your practice room, tip facing the room centre. Creates a standing scalar field that amplifies every session and holds the site's energy between practices.
                  </div>
                  {/* Room diagram */}
                  <div style={{position:"relative",width:200,height:200,margin:"0 auto 18px"}}>
                    <div style={{position:"absolute",inset:0,border:"1px solid rgba(212,175,55,.25)",borderRadius:4}}/>
                    <div style={{position:"absolute",inset:20,border:"1px dashed rgba(212,175,55,.1)"}}/>
                    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.28}}>
                      <line x1="10" y1="10" x2="96" y2="96" stroke="#D4AF37" strokeWidth="1"/>
                      <line x1="190" y1="10" x2="104" y2="96" stroke="#D4AF37" strokeWidth="1"/>
                      <line x1="10" y1="190" x2="96" y2="104" stroke="#D4AF37" strokeWidth="1"/>
                      <line x1="190" y1="190" x2="104" y2="104" stroke="#D4AF37" strokeWidth="1"/>
                    </svg>
                    {["NW","NE","SW","SE"].map((pos)=>{
                      const isTop=pos.startsWith("N"),isLeft=pos.endsWith("W");
                      return(<div key={pos} style={{position:"absolute",top:isTop?2:"auto",bottom:isTop?"auto":2,left:isLeft?2:"auto",right:isLeft?"auto":2,width:22,height:22,background:"rgba(212,175,55,.18)",border:"1px solid rgba(212,175,55,.5)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#D4AF37",fontWeight:800}}>{pos}</div>);
                    })}
                    <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                      <div style={{fontSize:8,color:"rgba(255,255,255,.2)",lineHeight:1.5}}>practice<br/>centre</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:12,padding:"12px 14px",background:"rgba(255,255,255,.025)",borderRadius:12,alignItems:"center",marginBottom:14}}>
                    <div style={{width:22,height:22,borderRadius:4,background:"rgba(240,248,255,.9)",border:"1px solid rgba(255,255,255,.3)",flexShrink:0}}/>
                    <div style={{color:"#D4AF37",fontSize:13,fontWeight:700}}>Clear Quartz Points × 4 — one per corner</div>
                  </div>
                  {["Cleanse crystals in direct sunlight for at least 1 hour","Hold each one: \"I anchor the field of "+activeSite.nm+" into this space\"","Place tip pointing toward room centre in each corner","Stand at centre. Chant your site mantra 3 times to activate","Leave completely undisturbed for the full 40 days","Optional: place your site-specific crystal at the centre point"].map((step,i)=>(
                    <div key={i} style={{color:"rgba(255,255,255,.55)",fontSize:12,lineHeight:1.75,marginBottom:8}}>
                      <span style={{color:"#D4AF37",fontSize:13}}>{"①②③④⑤⑥"[i]}</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STRENGTH SLIDER ── */}
            <div style={{...S.goldCard,marginTop:4}}>
              <span style={S.lbl}>✦ Prema Pulse Strength</span>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
                <div style={{color:"rgba(255,255,255,.45)",fontSize:12}}>{(STR_LABELS.find(l=>strength>=l[0]&&strength<l[1])||STR_LABELS[0])[2]}</div>
                <div style={{color:"#D4AF37",fontSize:24,fontWeight:900,letterSpacing:"-.03em"}}>{strength}%</div>
              </div>
              {/* Tick bars */}
              <div style={{display:"flex",gap:3,alignItems:"flex-end",height:32,marginBottom:12}}>
                {Array.from({length:32},(_,i)=>{
                  const active=strength>=(i/32)*100;
                  return <div key={i} style={{flex:1,borderRadius:1,background:active?activeSite.col:"rgba(255,255,255,.08)",height:active?8+Math.round((i/32)*18):8,opacity:active?0.5+i/64:0.2,transition:"all .2s"}}/>;
                })}
              </div>
              <input type="range" min={0} max={100} value={strength} step={1} onChange={e=>handleStrength(parseInt(e.target.value))} style={{width:"100%",accentColor:"#D4AF37",cursor:"pointer",marginBottom:12}}/>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"rgba(255,255,255,.3)",fontSize:10}}>0% · Invisible</span>
                <span style={{color:"rgba(255,255,255,.3)",fontSize:10}}>50% · Meditation</span>
                <span style={{color:"rgba(255,255,255,.3)",fontSize:10}}>100% · Immersion</span>
              </div>
              <div style={{marginTop:12,padding:"12px 14px",background:"rgba(255,255,255,.025)",borderRadius:12,color:"rgba(255,255,255,.5)",fontSize:12,lineHeight:1.7}}>
                {STR_DESCS[Object.keys(STR_DESCS).reverse().find(k=>strength>=parseInt(k))||0]}
              </div>
            </div>

            {/* ── CHANGE SITE ── */}
            <div style={S.card}>
              <span style={S.lbl}>Change your pilgrimage site</span>
              <div style={{color:"rgba(255,255,255,.5)",fontSize:13,lineHeight:1.7,marginBottom:14}}>
                Your site is locked for 40 days to allow a real field to build. Changing early resets your streak and the accumulated field.
              </div>
              <div style={{padding:"12px 14px",background:"rgba(212,175,55,.05)",borderRadius:12,border:"1px solid rgba(212,175,55,.15)",marginBottom:14}}>
                <div style={{color:"#D4AF37",fontSize:12,fontWeight:800,marginBottom:4}}>🔒 {activation.daysActive+1} of 40 days completed</div>
                <div style={{color:"rgba(255,255,255,.45)",fontSize:12,lineHeight:1.6}}>Complete 40 days and the site selector unlocks automatically. The field you build belongs to you forever.</div>
              </div>
              {!changeWarn ? (
                <button onClick={()=>setChangeWarn(true)} style={{...S.btn,background:"transparent",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.4)",fontSize:12}}>
                  Request Early Site Change →
                </button>
              ) : (
                <div style={{padding:14,background:"rgba(255,100,50,.08)",border:"1px solid rgba(255,100,50,.3)",borderRadius:14}}>
                  <div style={{color:"#FF8C00",fontSize:13,fontWeight:800,marginBottom:8}}>⚠️ This will reset your practice</div>
                  <div style={{color:"rgba(255,255,255,.55)",fontSize:12,lineHeight:1.7,marginBottom:14}}>Your current streak of <strong style={{color:"rgba(255,255,255,.8)"}}>{activation.daysActive+1} day{activation.daysActive>0?"s":""}</strong> will be lost and the accumulated field will dissolve.</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setChangeWarn(false)} style={{flex:1,padding:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"rgba(255,255,255,.5)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Keep My Progress</button>
                    <button onClick={handleRelease} style={{flex:1,padding:10,background:"rgba(255,100,50,.12)",border:"1px solid rgba(255,100,50,.35)",borderRadius:10,color:"#FF8C00",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Release & Change Site</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
