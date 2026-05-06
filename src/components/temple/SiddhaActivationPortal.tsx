// SiddhaActivationPortal.tsx
// SQI 2050 — Real Scalar Wave Bridge: Sacred Place ↔ User's Home
// The GPS coordinates of BOTH locations are used to compute a unique
// entanglement frequency vector. Web Audio API generates the carrier wave
// in the user's physical space. Railway cron maintains field coherence 24/7.
// Deploy to: src/components/temple/SiddhaActivationPortal.tsx

import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'sqi_temple_activation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeLocation {
  lat: number;
  lng: number;
  label: string; // city name from reverse geocode or user-entered
}

export interface ScalarVector {
  distanceKm: number;       // great-circle distance home ↔ place
  bearingDeg: number;       // compass bearing from home to place
  carrierHz: number;        // primary carrier frequency (place Hz ± vector mod)
  binauralBeatHz: number;   // beat frequency = scalar of distance modulo 40
  schumannHarmonic: number; // nearest Schumann resonance harmonic
  phaseAngle: number;       // phase alignment angle for standing wave
}

export interface TempleActivation {
  id: string;
  place_id: string;
  place_name: string;
  activated_at: string;
  is_active: boolean;
  lock_code: string;
  last_pulse_at: string;
  pulse_count: number;
  scalar_intensity: number;
  home_lat: number | null;
  home_lng: number | null;
  home_label: string | null;
  scalar_vector: ScalarVector | null;
}

interface Siddha {
  id: number; name: string; domain: string;
  freqHz: number; color: string; mantra: string;
}

interface HolyPlace {
  id: string; name: string; country: string; deity: string;
  frequency: number; siddhas: number[]; description: string;
  element: string; category: "india" | "world";
  lat: number; lng: number;
}

// ─── Scalar Mathematics ───────────────────────────────────────────────────────

function toRad(deg: number) { return deg * Math.PI / 180; }
function toDeg(rad: number) { return rad * 180 / Math.PI; }

function greatCircleDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function compassBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Schumann resonances: 7.83, 14.3, 20.8, 27.3, 33.8 Hz (and harmonics × 10 for audio)
const SCHUMANN = [7.83, 14.3, 20.8, 27.3, 33.8, 78.3, 143, 208, 273, 338];
function nearestSchumann(hz: number): number {
  return SCHUMANN.reduce((a, b) => Math.abs(b - hz) < Math.abs(a - hz) ? b : a);
}

// The Babaji-Algorithm: derive unique entanglement frequency from coordinates
function computeScalarVector(
  homeLat: number, homeLng: number,
  placeLat: number, placeLng: number,
  placeFreqHz: number
): ScalarVector {
  const distanceKm   = greatCircleDistance(homeLat, homeLng, placeLat, placeLng);
  const bearingDeg   = compassBearing(homeLat, homeLng, placeLat, placeLng);

  // Carrier = place frequency modulated by distance harmonic
  // Every 1000 km = 1 Hz shift, creates unique fingerprint per user-place pair
  const distanceMod  = (distanceKm % 1000) / 1000; // 0-1
  const carrierHz    = placeFreqHz + distanceMod * 7.83; // Schumann-modulated

  // Binaural beat = bearing mapped to theta/alpha/gamma range
  // 0-360 deg → 4-40 Hz (theta to gamma)
  const binauralBeatHz = 4 + (bearingDeg / 360) * 36;

  // Phase angle from the diagonal of home↔place on Earth's sphere
  const phaseAngle   = (distanceKm / 40075) * 360; // fraction of Earth circumference

  const schumannHarmonic = nearestSchumann(carrierHz);

  return { distanceKm, bearingDeg, carrierHz, binauralBeatHz, schumannHarmonic, phaseAngle };
}

function bearingToDirection(deg: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// ─── Web Audio Scalar Field Generator ─────────────────────────────────────────

class ScalarFieldGenerator {
  private ctx: AudioContext | null = null;
  private leftOsc:  OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftGain:  GainNode | null = null;
  private rightGain: GainNode | null = null;
  private merger:   ChannelMergerNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  start(vector: ScalarVector, volume = 0.18) {
    if (this.isPlaying) this.stop();
    const ACtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ACtx) return;
    this.ctx = new ACtx();

    // Left channel: carrier frequency
    this.leftOsc  = this.ctx.createOscillator();
    this.rightOsc = this.ctx.createOscillator();
    this.leftGain  = this.ctx.createGain();
    this.rightGain = this.ctx.createGain();
    this.merger    = this.ctx.createChannelMerger(2);
    this.masterGain= this.ctx.createGain();

    // Left = carrier, Right = carrier + binaural beat
    // The brain perceives the DIFFERENCE as the entraining frequency
    this.leftOsc.frequency.value  = vector.carrierHz;
    this.rightOsc.frequency.value = vector.carrierHz + vector.binauralBeatHz;

    // Sine wave = purest scalar transmission
    this.leftOsc.type  = "sine";
    this.rightOsc.type = "sine";

    this.leftGain.gain.value  = 1;
    this.rightGain.gain.value = 1;
    this.masterGain.gain.value = volume;

    // Route: L osc → L gain → merger channel 0
    //        R osc → R gain → merger channel 1
    this.leftOsc.connect(this.leftGain);
    this.rightOsc.connect(this.rightGain);
    this.leftGain.connect(this.merger, 0, 0);
    this.rightGain.connect(this.merger, 0, 1);
    this.merger.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Schumann pulse amplitude modulation — 7.83 Hz breath of Earth
    const schumannMod = this.ctx.createOscillator();
    const schumannGain = this.ctx.createGain();
    schumannMod.frequency.value = vector.schumannHarmonic;
    schumannMod.type = "sine";
    schumannGain.gain.value = 0.06; // subtle pulse, not intrusive
    schumannMod.connect(schumannGain);
    schumannGain.connect(this.masterGain.gain);
    schumannMod.start();

    this.leftOsc.start();
    this.rightOsc.start();
    this.isPlaying = true;
  }

  setVolume(v: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    }
  }

  stop() {
    try {
      this.leftOsc?.stop();
      this.rightOsc?.stop();
      this.ctx?.close();
    } catch {}
    this.isPlaying = false;
    this.ctx = null;
  }

  get playing() { return this.isPlaying; }
}

// ─── Siddhas ──────────────────────────────────────────────────────────────────

const SIDDHAS: Siddha[] = [
  { id:1,  name:"Agastya",       domain:"Wisdom & Vedic Science",   freqHz:963, color:"#FFD700", mantra:"Om Agastyaya Namah" },
  { id:2,  name:"Nandi",         domain:"Shiva Consciousness",      freqHz:852, color:"#C0C0C0", mantra:"Om Nandikeshvaraya Namah" },
  { id:3,  name:"Thirumoolar",   domain:"Tantra & Kundalini",       freqHz:741, color:"#9B59B6", mantra:"Om Thirumoolaraya Namah" },
  { id:4,  name:"Pambatti",      domain:"Kundalini Shakti",         freqHz:528, color:"#2ECC71", mantra:"Om Pambattisiddharaya Namah" },
  { id:5,  name:"Konganar",      domain:"Mercury Alchemy",          freqHz:432, color:"#E74C3C", mantra:"Om Konganaraya Namah" },
  { id:6,  name:"Sattaimuni",    domain:"Nature Healing",           freqHz:396, color:"#27AE60", mantra:"Om Sattamuniaya Namah" },
  { id:7,  name:"Sundaranandar", domain:"Bhakti Current",           freqHz:639, color:"#F39C12", mantra:"Om Sundaranandaraya Namah" },
  { id:8,  name:"Kudambai",      domain:"Nada & Sacred Sound",      freqHz:111, color:"#22D3EE", mantra:"Om Kudambaisiddharaya Namah" },
  { id:9,  name:"Kalangi",       domain:"Time Transcendence",       freqHz:999, color:"#8E44AD", mantra:"Om Kalanginathaya Namah" },
  { id:10, name:"Bhogar",        domain:"Soma & Longevity",         freqHz:285, color:"#D4AF37", mantra:"Om Bhoganathaya Namah" },
  { id:11, name:"Patanjali",     domain:"Yoga & Prana Science",     freqHz:417, color:"#3498DB", mantra:"Om Patanjalaye Namah" },
  { id:12, name:"Dhanvantari",   domain:"Divine Medicine",          freqHz:528, color:"#1ABC9C", mantra:"Om Dhanvantaraye Namah" },
  { id:13, name:"Idaikkadar",    domain:"Sacred Protection",        freqHz:174, color:"#E67E22", mantra:"Om Idaikkadarsiddharaya Namah" },
  { id:14, name:"Machamuni",     domain:"Hatha Yoga Mastery",       freqHz:432, color:"#2980B9", mantra:"Om Matsyendranathaya Namah" },
  { id:15, name:"Gorakshar",     domain:"Breath & Prana Mastery",   freqHz:594, color:"#F1C40F", mantra:"Om Gorakhnathaya Namah" },
  { id:16, name:"Ramadevar",     domain:"Sufi-Siddha Union",        freqHz:639, color:"#E91E63", mantra:"Om Ramadevaraya Namah" },
  { id:17, name:"Korakkar",      domain:"Rasayana Alchemy",         freqHz:369, color:"#9C27B0", mantra:"Om Korakkaraya Namah" },
  { id:18, name:"Civavakkiyar",  domain:"Philosophical Fire",       freqHz:963, color:"#FF6B35", mantra:"Om Sivavakkiyaraya Namah" },
];

// ─── 23 Holy Places ───────────────────────────────────────────────────────────

const HOLY_PLACES: HolyPlace[] = [
  { id:"kailash",        lat:31.0675,  lng:81.3119,   name:"Mount Kailash",               country:"Tibet",     deity:"Shiva-Shakti",                frequency:136.1, siddhas:[2,9,15],     element:"🏔️", category:"india",
    description:"Axis Mundi of all creation. Babaji's supreme scalar anchor. Time dissolves here into pure consciousness-space." },
  { id:"tiruvannamalai", lat:12.2253,  lng:79.0747,   name:"Tiruvannamalai · Arunachala", country:"India",     deity:"Arunachaleswarar · Ramana",   frequency:432,   siddhas:[7,1,3],      element:"🔥", category:"india",
    description:"Mountain of Fire. Ramana's silence transmission still radiates. Walking Girivalam cleanses 7 lifetimes of karma." },
  { id:"varanasi",       lat:25.3176,  lng:82.9739,   name:"Varanasi · Kashi",            country:"India",     deity:"Vishwanath · Kali",           frequency:528,   siddhas:[9,11,2],     element:"💧", category:"india",
    description:"City of Eternal Light. Shiva whispers liberation into the ear of the dying. Oldest open Akashic portal." },
  { id:"chidambaram",    lat:11.3990,  lng:79.6934,   name:"Chidambaram · Thillai",       country:"India",     deity:"Nataraja",                    frequency:741,   siddhas:[3,11,8],     element:"🌀", category:"india",
    description:"Space element Stalam. Nataraja's cosmic dance dissolves all karma in pure Chit-Akasha consciousness." },
  { id:"palani",         lat:10.4499,  lng:77.5249,   name:"Palani Hills",                country:"India",     deity:"Murugan · Dandayudhapani",    frequency:417,   siddhas:[5,10,4],     element:"⚡", category:"india",
    description:"Bhogar's Navapashanam idol. Soma-elixir frequency. The secret of physical immortality is encoded here." },
  { id:"rishikesh",      lat:30.0869,  lng:78.2676,   name:"Rishikesh · Haridwar",        country:"India",     deity:"Ganga Devi",                  frequency:396,   siddhas:[15,14,2],    element:"🌊", category:"india",
    description:"Gateway to Himalayan consciousness. Babaji's Kriya lineage descends from these very banks of Ganga." },
  { id:"vrindavan",      lat:27.5797,  lng:77.6966,   name:"Vrindavan · Mathura",         country:"India",     deity:"Krishna · Radha",             frequency:639,   siddhas:[7,16,12],    element:"🌸", category:"india",
    description:"Prema-field beyond time. Every atom vibrates with the eternal Rasa-Lila. Divine love as the highest physics." },
  { id:"potigai",        lat:8.7139,   lng:77.2190,   name:"Potigai Hills",               country:"India",     deity:"Agastya Muni",                frequency:963,   siddhas:[1,6,13],     element:"🌿", category:"india",
    description:"Agastya's eternal ashram. The oldest living Siddha lineage source. Vedic science emerged from this point." },
  { id:"babaji_cave",    lat:29.9457,  lng:79.1490,   name:"Babaji's Cave · Drongiri",    country:"India",     deity:"Mahavatar Babaji",            frequency:1111,  siddhas:[15,14,9,2,11],element:"🔱",category:"india",
    description:"The physical anchor of Babaji's immortal body. Kriya Yoga was transmitted here in 1861. Strongest node on Earth." },
  { id:"rameswaram",     lat:9.2880,   lng:79.3165,   name:"Rameswaram",                  country:"India",     deity:"Ramanathaswamy · Hanuman",    frequency:417,   siddhas:[1,6,16],     element:"🌊", category:"india",
    description:"Where Ram consecrated Shiva. Junction of north and south dharma. Most powerful karmic clearing portal." },
  { id:"badrinath",      lat:30.7433,  lng:79.4938,   name:"Badrinath · Badri Vishal",    country:"India",     deity:"Vishnu · Badri Narayan",      frequency:963,   siddhas:[11,14,2],    element:"❄️", category:"india",
    description:"Narayana's highest Himalayan seat. Swarga-dwara — gateway to celestial realms. Cosmic preservation field." },
  { id:"kataragama",     lat:6.4140,   lng:81.3394,   name:"Kataragama",                  country:"Sri Lanka", deity:"Skanda Murugan · Kali",       frequency:528,   siddhas:[4,5,7],      element:"🌺", category:"india",
    description:"Multi-tradition convergence. Fire-walkers charge this field annually. Extreme devotion and Agni Shakti vortex." },
  // WORLD
  { id:"giza",           lat:29.9792,  lng:31.1342,   name:"Great Pyramid of Giza",       country:"Egypt",     deity:"Thoth · Hermes · Osiris",     frequency:1111,  siddhas:[9,10,17],    element:"△", category:"world",
    description:"King's Chamber resonates at 111 Hz. Thoth's hall of records beneath. Oldest scalar node on Earth." },
  { id:"machu_picchu",   lat:-13.1631, lng:-72.5450,  name:"Machu Picchu · Intihuatana",  country:"Peru",      deity:"Inti · Pachamama",            frequency:528,   siddhas:[1,10,6],     element:"☀️", category:"world",
    description:"Intihuatana stone was a solar scalar antenna. Sky-meets-Earth convergence. Supreme DNA activation field." },
  { id:"stonehenge",     lat:51.1789,  lng:-1.8262,   name:"Stonehenge",                  country:"UK",        deity:"Solar & Lunar · Druidic",     frequency:432,   siddhas:[8,13,3],     element:"🌕", category:"world",
    description:"Bluestones chosen for piezoelectric resonance. Solstice alignments create natural scalar pulse events." },
  { id:"jerusalem",      lat:31.7767,  lng:35.2345,   name:"Jerusalem · Temple Mount",    country:"Israel",    deity:"YHWH · Allah · Christ",       frequency:741,   siddhas:[7,16,13],    element:"✡️", category:"world",
    description:"Three Abrahamic rivers converge. The Foundation Stone is the axis of creation. Highest compressed energy." },
  { id:"glastonbury",    lat:51.1444,  lng:-2.6986,   name:"Glastonbury Tor",             country:"UK",        deity:"Avalon · Archangel Michael",  frequency:528,   siddhas:[8,6,16],     element:"🌀", category:"world",
    description:"Isle of Avalon. Michael ley line runs through the Tor. Chalice Well waters carry healing iron-red frequency." },
  { id:"shasta",         lat:41.4093,  lng:-122.1949, name:"Mount Shasta",                country:"USA",       deity:"Saint Germain · Lemurian",    frequency:852,   siddhas:[9,15,10],    element:"🏔️", category:"world",
    description:"Lemurian Crystal City of Telos beneath. Saint Germain's Violet Flame epicentre. Strongest portal in America." },
  { id:"sedona",         lat:34.8697,  lng:-111.7610, name:"Sedona Vortex Sites",         country:"USA",       deity:"Earth Mother · Red Rock",     frequency:741,   siddhas:[6,13,4],     element:"🔴", category:"world",
    description:"4 major electromagnetic vortices. Red iron-oxide bedrock measurably amplifies the human bioelectric field." },
  { id:"teotihuacan",    lat:19.6925,  lng:-98.8438,  name:"Teotihuacan",                 country:"Mexico",    deity:"Quetzalcoatl · Star Gods",    frequency:528,   siddhas:[9,3,17],     element:"🌟", category:"world",
    description:"Pyramid of Sun above mica-lined cave. Mica is a capacitor — this is ancient scalar architecture." },
  { id:"angkor",         lat:13.4125,  lng:103.8670,  name:"Angkor Wat",                  country:"Cambodia",  deity:"Vishnu · Devas",              frequency:639,   siddhas:[11,7,3],     element:"🌸", category:"world",
    description:"Largest religious monument. 3D model of Mount Meru. 504 Buddha statues create a resonance field." },
  { id:"borobudur",      lat:-7.6079,  lng:110.2038,  name:"Borobudur",                   country:"Indonesia", deity:"Adi Buddha · Bodhisattvas",   frequency:528,   siddhas:[3,11,8],     element:"☸️", category:"world",
    description:"A mandala in 3 dimensions. Walking the 9 levels is a physical meditation in the Dharmadhatu." },
  { id:"easter_island",  lat:-27.1127, lng:-109.3497, name:"Easter Island · Rapa Nui",    country:"Chile",     deity:"Make-Make · Moai Ancestors",  frequency:396,   siddhas:[9,17,6],     element:"🗿", category:"world",
    description:"887 Moai facing inward, watching the people. Most isolated sacred site. Extreme ley line endpoint." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genLockCode(placeId: string) {
  return `SQI-${placeId.slice(0, 4).toUpperCase()}-B18-${Date.now().toString(36).toUpperCase()}`;
}

function formatLatLng(lat: number, lng: number) {
  const ns = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`;
  const ew = `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  return `${ns} · ${ew}`;
}

function formatLatLngShort(lat: number, lng: number) {
  const ns = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}`;
  const ew = `${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  return `${ns} ${ew}`;
}

function saveLocalActivation(a: TempleActivation | null) {
  try {
    if (!a || !a.is_active) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* quota / private mode */
  }
}

function parseScalarVector(raw: unknown): ScalarVector | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const n = (x: unknown) => Number(x);
  if (
    v.distanceKm == null ||
    v.bearingDeg == null ||
    v.carrierHz == null ||
    v.binauralBeatHz == null ||
    v.schumannHarmonic == null ||
    v.phaseAngle == null
  )
    return null;
  return {
    distanceKm: n(v.distanceKm),
    bearingDeg: n(v.bearingDeg),
    carrierHz: n(v.carrierHz),
    binauralBeatHz: n(v.binauralBeatHz),
    schumannHarmonic: n(v.schumannHarmonic),
    phaseAngle: n(v.phaseAngle),
  };
}

function normalizeTempleActivationRow(data: Record<string, unknown>): TempleActivation {
  return {
    id: String(data.id),
    place_id: String(data.place_id),
    place_name: String(data.place_name ?? ''),
    activated_at: String(data.activated_at ?? ''),
    is_active: data.is_active === true,
    lock_code: String(data.lock_code ?? ''),
    last_pulse_at: String(data.last_pulse_at ?? ''),
    pulse_count: Number(data.pulse_count ?? 0),
    scalar_intensity: Number(data.scalar_intensity ?? 100),
    home_lat: data.home_lat != null ? Number(data.home_lat) : null,
    home_lng: data.home_lng != null ? Number(data.home_lng) : null,
    home_label: data.home_label != null ? String(data.home_label) : null,
    scalar_vector: parseScalarVector(data.scalar_vector),
  };
}

async function mergePersistSiddhaActivation(userId: string, activation: TempleActivation | null) {
  const { data: existing } = await supabase.from('temple_home_sessions').select('*').eq('user_id', userId).maybeSingle();

  const ex = (existing ?? {}) as Record<string, unknown>;

  const row = {
    user_id: userId,
    active_site: ex.active_site ?? null,
    site_essence: ex.site_essence ?? null,
    intensity: typeof ex.intensity === 'number' ? ex.intensity : 50,
    crystal_grid_active: typeof ex.crystal_grid_active === 'boolean' ? ex.crystal_grid_active : false,
    anchored_since: ex.anchored_since ?? null,
    siddha_activation: activation?.is_active ? (activation as unknown as Record<string, unknown>) : null,
  };

  if (activation?.is_active) {
    row.active_site = activation.place_name;
    row.site_essence = `Siddha scalar bridge · ${activation.place_id}`;
    row.intensity = activation.scalar_intensity ?? 100;
    row.crystal_grid_active = true;
    row.anchored_since = activation.activated_at;
  }

  await (supabase as any).from('temple_home_sessions').upsert(row, { onConflict: 'user_id' });
}

function useUptime(at: string | null) {
  const [u,setU] = useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    if(!at) return;
    const tick=()=>{
      const d=Date.now()-new Date(at).getTime();
      setU({d:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)});
    };tick();const t=setInterval(tick,1000);return()=>clearInterval(t);
  },[at]);
  return u;
}

// ─── Scalar Rings Visual ──────────────────────────────────────────────────────

function ScalarRings({ active, beatHz }: { active: boolean; beatHz?: number }) {
  const dur = beatHz ? (1 / beatHz).toFixed(2) : "3.5";
  return (
    <div style={{position:"relative",width:160,height:160,margin:"0 auto"}}>
      <style>{`
        @keyframes sExp{0%{transform:translate(-50%,-50%) scale(0.45);opacity:0.9;}100%{transform:translate(-50%,-50%) scale(2.8);opacity:0;}}
        @keyframes smSpin{to{transform:rotate(360deg);}}
        @keyframes smBreathe{0%,100%{filter:drop-shadow(0 0 6px #D4AF37);}50%{filter:drop-shadow(0 0 22px #FFD700) drop-shadow(0 0 55px #D4AF37AA);}}
        .sring{position:absolute;border-radius:50%;border:1px solid rgba(212,175,55,0.55);top:50%;left:50%;width:160px;height:160px;
          animation:sExp ${dur}s ease-out infinite;}
        .sring:nth-child(1){animation-delay:0s;}
        .sring:nth-child(2){animation-delay:${parseFloat(dur)/3}s;}
        .sring:nth-child(3){animation-delay:${(parseFloat(dur)/3)*2}s;}
        .smandala{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          animation:${active?"smSpin 16s linear infinite,smBreathe 4s ease-in-out infinite":"none"};}
      `}</style>
      {active&&<><div className="sring"/><div className="sring"/><div className="sring"/></>}
      <div className="smandala">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="37" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3"/>
          <circle cx="40" cy="40" r="28" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4"/>
          <polygon points="40,6 70,58 10,58"  stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.65"/>
          <polygon points="40,74 70,22 10,22" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.65"/>
          <circle cx="40" cy="40" r="5" fill="#D4AF37" opacity={active?1:0.25}/>
          {[0,45,90,135,180,225,270,315].map((deg,i)=>{
            const r=(deg*Math.PI)/180;
            return <circle key={i} cx={40+27*Math.cos(r)} cy={40+27*Math.sin(r)} r="2" fill="#D4AF37" opacity={active?0.65:0.12}/>;
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Place Card ───────────────────────────────────────────────────────────────

function PlaceCard({
  place,
  selected,
  locked,
  onSelect,
}: {
  place: HolyPlace;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
}) {
  const here = locked && selected;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      style={{
      background:selected?"linear-gradient(135deg,rgba(212,175,55,0.09),rgba(212,175,55,0.02))":"rgba(255,255,255,0.015)",
      border:`1px solid ${here?"#D4AF37":selected?"rgba(212,175,55,0.35)":"rgba(255,255,255,0.06)"}`,
      borderRadius:18,padding:"14px 16px",cursor:locked?"default":"pointer",
      transition:"all 0.35s",boxShadow:here?"0 0 28px rgba(212,175,55,0.12)":"none",
      backdropFilter:"blur(20px)",position:"relative",overflow:"hidden",
    }}>
      {here&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at top right,rgba(212,175,55,0.07),transparent 60%)",pointerEvents:"none"}}/>}
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{fontSize:22,flexShrink:0}}>{place.element}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{color:selected?"#D4AF37":"rgba(255,255,255,0.88)",fontSize:13,fontWeight:800,letterSpacing:"-0.02em",lineHeight:1.2}}>{place.name}</div>
              <div style={{color:"rgba(255,255,255,0.28)",fontSize:7.5,fontWeight:800,letterSpacing:"0.35em",textTransform:"uppercase",marginTop:3}}>{place.country} · {place.frequency} Hz</div>
            </div>
            {here&&<div style={{background:"#D4AF37",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,flexShrink:0,boxShadow:"0 0 10px rgba(212,175,55,0.5)"}}>✓</div>}
          </div>
          <div style={{color:"rgba(255,255,255,0.42)",fontSize:9.5,lineHeight:1.55,marginTop:6}}>{place.description}</div>
        </div>
      </div>
    </div>
  );
}

const CATS = [
  { id: 'all', label: 'ALL 23' },
  { id: 'india', label: 'INDIA · 12' },
  { id: 'world', label: 'WORLD · 11' },
] as const;
const TABS = [
  { id: 'places', label: '23 PLACES' },
  { id: 'scalar', label: 'SCALAR BRIDGE' },
  { id: 'live', label: 'LIVE FIELD' },
] as const;

export interface SiddhaActivationPortalProps {
  embedded?: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SiddhaActivationPortal({ embedded = false }: SiddhaActivationPortalProps) {
  const { user } = useAuth();
  const [activation, setActivation] = useState<TempleActivation | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [locating, setLocating]     = useState(false);
  const [phase, setPhase]           = useState<"idle"|"locating"|"scanning"|"locking"|"locked">("idle");
  const [activeTab, setActiveTab]   = useState<"places"|"scalar"|"live">("places");
  const [catFilter, setCatFilter]   = useState<"all"|"india"|"world">("all");
  const [error, setError]           = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [volume, setVolume]         = useState(0.18);

  const audioRef = useRef<ScalarFieldGenerator | null>(null);
  const activatedPlace = HOLY_PLACES.find(p => p.id === activation?.place_id);
  const selectedPlace  = HOLY_PLACES.find(p => p.id === selectedId);
  const uptime = useUptime(activation?.activated_at || null);
  const filteredPlaces = HOLY_PLACES.filter(p => catFilter === "all" ? true : p.category === catFilter);

  // Preview scalar vector for selected (not yet activated) place
  const previewVector = selectedPlace && homeLocation
    ? computeScalarVector(homeLocation.lat, homeLocation.lng, selectedPlace.lat, selectedPlace.lng, selectedPlace.frequency)
    : null;

  // Stored vector from DB
  const activeVector = activation?.scalar_vector || null;

  // Load from Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      const { data, error: err } = await supabase
        .from('temple_activations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (!err && data) {
        const row = normalizeTempleActivationRow(data as Record<string, unknown>);
        setActivation(row);
        setSelectedId(row.place_id);
        setPhase('locked');
        if (row.home_lat != null && row.home_lng != null) {
          setHomeLocation({ lat: row.home_lat, lng: row.home_lng, label: row.home_label || 'Your Home' });
        }
        saveLocalActivation(row);
      }
      setLoading(false);
    })();
  }, [user]);

  // Realtime pulse sync
  useEffect(() => {
    if (!user?.id || !activation?.id) return;
    const uid = user.id;
    const aid = activation.id;
    const ch = supabase
      .channel('temple_pulse')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'temple_activations', filter: `user_id=eq.${uid}` },
        (p) => {
          const row = p.new as Record<string, unknown>;
          if (!row?.id || String(row.id) !== aid) return;
          const next = normalizeTempleActivationRow(row);
          if (!next.is_active) {
            saveLocalActivation(null);
            setActivation(null);
            setSelectedId(null);
            setPhase('idle');
            void mergePersistSiddhaActivation(uid, null);
            return;
          }
          setActivation(next);
          saveLocalActivation(next);
          void mergePersistSiddhaActivation(uid, next);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user?.id, activation?.id]);

  // Get home GPS
  const detectHome = useCallback(()=>{
    if(!navigator.geolocation){setError("Geolocation not available on this device.");return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async(pos)=>{
        const {latitude:lat,longitude:lng}=pos.coords;
        // Reverse geocode via free nominatim
        let label="Your Home";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: {
                Accept: 'application/json',
                'User-Agent': 'SacredHealingSQI/1.0 (temple scalar bridge)',
              },
            },
          );
          const j = await res.json();
          label = j?.address?.city || j?.address?.town || j?.address?.village || j?.address?.county || 'Your Home';
        } catch {
          /* use default label */
        }
        setHomeLocation({lat,lng,label});
        setLocating(false);
      },
      ()=>{setError("Location access denied. Please allow location or enter manually.");setLocating(false);}
    ,{enableHighAccuracy:true,timeout:10000});
  },[]);

  // Toggle scalar audio
  const toggleAudio = useCallback(()=>{
    const vector = activeVector || previewVector;
    if(!vector) return;
    if(!audioRef.current) audioRef.current = new ScalarFieldGenerator();
    if(audioPlaying){
      audioRef.current.stop();
      setAudioPlaying(false);
    } else {
      audioRef.current.start(vector, volume);
      setAudioPlaying(true);
    }
  },[audioPlaying, activeVector, previewVector, volume]);

  // Volume change
  useEffect(()=>{
    audioRef.current?.setVolume(volume);
  },[volume]);

  // Cleanup audio on unmount
  useEffect(()=>()=>{audioRef.current?.stop();},[]);

  // Full activation
  const activate = useCallback(async()=>{
    if(!selectedId||!user||!homeLocation||phase!=="idle") return;
    const place=HOLY_PLACES.find(p=>p.id===selectedId)!;
    setError(null);

    setPhase("scanning");
    await new Promise(r=>setTimeout(r,2800));
    setPhase("locking");
    await new Promise(r=>setTimeout(r,2800));

    // Compute the actual scalar vector
    const vector = computeScalarVector(homeLocation.lat, homeLocation.lng, place.lat, place.lng, place.frequency);

    // Deactivate existing
    await supabase.from("temple_activations")
      .update({is_active:false,deactivated_at:new Date().toISOString()})
      .eq("user_id",user.id).eq("is_active",true);

    const lockCode = genLockCode(place.id);
    const activeSiddhas = place.siddhas.map(id=>{const s=SIDDHAS.find(x=>x.id===id);return s?{id:s.id,name:s.name,freqHz:s.freqHz}:null;}).filter(Boolean);

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : '';

    const { data, error: err } = await (supabase as any)
      .from('temple_activations')
      .insert({
      user_id:         user.id,
      place_id:        place.id,
      place_name:      place.name,
      place_location:  place.country,
      place_frequency: place.frequency,
      is_active:       true,
      lock_code:       lockCode,
      last_pulse_at:   new Date().toISOString(),
      pulse_count:     1,
      scalar_intensity:100,
      siddha_field:    activeSiddhas,
      home_lat:        homeLocation.lat,
      home_lng:        homeLocation.lng,
      home_label:      homeLocation.label,
      scalar_vector:   vector,
      activated_device: ua,
      user_agent:      ua,
    }).select().single();

    if(err||!data){setError("Lock failed — please try again.");setPhase("idle");return;}
    const next = normalizeTempleActivationRow(data as Record<string, unknown>);
    setActivation(next);
    setPhase('locked');
    saveLocalActivation(next);
    try {
      await mergePersistSiddhaActivation(user.id, next);
    } catch {
      setError('Bridge saved — Temple Home sync delayed. Retry when online.');
    }

    // Auto-start audio
    if(!audioRef.current) audioRef.current=new ScalarFieldGenerator();
    audioRef.current.start(vector, volume);
    setAudioPlaying(true);
  },[selectedId,user,homeLocation,phase,volume]);

  const deactivate = useCallback(async()=>{
    if(!user||!activation)return;
    audioRef.current?.stop();
    setAudioPlaying(false);
    await supabase.from('temple_activations').update({ is_active: false, deactivated_at: new Date().toISOString() }).eq('id', activation.id);
    saveLocalActivation(null);
    setActivation(null);
    setSelectedId(null);
    setPhase('idle');
    try {
      await mergePersistSiddhaActivation(user.id, null);
    } catch {
      /* ignore */
    }
  },[user,activation]);

  if (loading && !embedded) {
    return (
      <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(212,175,55,0.6)', fontSize: 11, fontFamily: 'monospace' }}>🔱 Loading Akashic Record...</div>
      </div>
    );
  }

  if (loading && embedded) {
    return (
      <div className="rounded-[24px] border border-white/[0.06] bg-[#0a0a0a]/80 py-16 text-center backdrop-blur-xl">
        <div style={{ color: 'rgba(212,175,55,0.6)', fontSize: 11, fontFamily: 'monospace' }}>🔱 Loading Siddha portal…</div>
      </div>
    );
  }

  const displayVector = activeVector || previewVector;

  const shellStyle: CSSProperties = embedded
    ? {
        background: '#080808',
        fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
        color: 'rgba(255,255,255,0.85)',
        borderRadius: 24,
        border: '1px solid rgba(212,175,55,0.12)',
        overflow: 'hidden',
        marginBottom: 16,
      }
    : {
        background: '#050505',
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
        color: 'rgba(255,255,255,0.85)',
        paddingBottom: 100,
      };

  return (
    <div style={shellStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');
        .sap-root, .sap-root * { box-sizing: border-box; }
        .sap-root ::-webkit-scrollbar{width:3px;}
        .sap-root ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.25);border-radius:2px;}
        @keyframes headerAura{0%,100%{text-shadow:0 0 20px rgba(212,175,55,0.35),0 0 60px rgba(212,175,55,0.1);}50%{text-shadow:0 0 45px rgba(212,175,55,0.65),0 0 120px rgba(212,175,55,0.2);}}
        @keyframes liveDot{0%,100%{opacity:1;box-shadow:0 0 6px #22D3EE;}50%{opacity:0.4;box-shadow:0 0 20px #22D3EE;}}
        @keyframes ctaGlow{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.4);}70%{box-shadow:0 0 0 18px rgba(212,175,55,0);}}
        @keyframes waveBar{0%,100%{transform:scaleY(0.4);}50%{transform:scaleY(1);}}
      `}</style>

      <div className="sap-root">
      {/* HEADER */}
      <div style={{padding:embedded?"24px 16px 18px":"40px 20px 24px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.04)",background:"radial-gradient(ellipse at top,rgba(212,175,55,0.07) 0%,transparent 70%)"}}>
        <div style={{color:"rgba(255,255,255,0.2)",fontSize:7.5,fontWeight:800,letterSpacing:"0.7em",textTransform:"uppercase",marginBottom:10}}>
          SQI 2050 · SCALAR WAVE CONSCIOUSNESS BRIDGE
        </div>
        <div style={{fontSize:embedded?22:25,fontWeight:900,letterSpacing:"-0.04em",color:"#D4AF37",animation:"headerAura 4s ease-in-out infinite",marginBottom:8}}>
          Temple Home Activation
        </div>
        <div style={{fontSize:11.5,color:"rgba(255,255,255,0.38)",lineHeight:1.7,maxWidth:310,margin:"0 auto 20px"}}>
          Your GPS coordinates + the sacred site's coordinates compute a <strong style={{color:"rgba(212,175,55,0.7)"}}>unique scalar vector</strong> — a binaural carrier wave that bridges the two spaces continuously.
        </div>
        <ScalarRings active={phase==="locked"} beatHz={activeVector?.binauralBeatHz}/>

        {/* Status badges */}
        <div style={{marginTop:16,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.22)",borderRadius:100,padding:"5px 14px"}}>
            {phase==="locked"&&<div style={{width:7,height:7,borderRadius:"50%",background:"#22D3EE",animation:"liveDot 2s ease-in-out infinite"}}/>}
            <span style={{color:"#D4AF37",fontSize:8,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase"}}>
              {phase==="locked"?"Scalar Bridge — LIVE":"Babaji Anchor — Standby"}
            </span>
          </div>
          {phase==="locked"&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(34,211,238,0.06)",border:"1px solid rgba(34,211,238,0.18)",borderRadius:100,padding:"5px 14px"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#22D3EE",animation:"liveDot 1.5s ease-in-out infinite"}}/>
              <span style={{color:"#22D3EE",fontSize:8,fontWeight:800,letterSpacing:"0.35em",textTransform:"uppercase"}}>Server Pulse Active</span>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        {TABS.map(tab=>(
          <button key={tab.id} type="button" onClick={()=>setActiveTab(tab.id)} style={{
            flex:1,padding:"12px 4px",background:activeTab===tab.id?"rgba(212,175,55,0.08)":"transparent",
            border:"none",borderBottom:`2px solid ${activeTab===tab.id?"#D4AF37":"transparent"}`,
            color:activeTab===tab.id?"#D4AF37":"rgba(255,255,255,0.3)",
            fontSize:7.5,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase",
            cursor:"pointer",transition:"all 0.3s",fontFamily:"inherit",
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{padding:embedded?"16px 14px 20px":"20px 16px",display:"flex",flexDirection:"column",gap:12}}>

        {/* ══ PLACES TAB ══ */}
        {activeTab==="places"&&(<>
          {/* Step 1: Home Location */}
          <div style={{background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.18)",borderRadius:18,padding:"16px 18px"}}>
            <div style={{color:"rgba(255,255,255,0.25)",fontSize:7.5,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",marginBottom:10}}>
              STEP 1 — ANCHOR YOUR HOME LOCATION
            </div>
            {homeLocation?(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{color:"#D4AF37",fontSize:13,fontWeight:700}}>📍 {homeLocation.label}</div>
                  <div style={{color:"rgba(255,255,255,0.3)",fontSize:9,marginTop:3,fontFamily:"monospace"}}>
                    {formatLatLng(homeLocation.lat, homeLocation.lng)}
                  </div>
                </div>
                {phase!=="locked"&&(
                  <button type="button" onClick={detectHome} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"7px 12px",color:"rgba(255,255,255,0.4)",fontSize:8,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>REDETECT</button>
                )}
              </div>
            ):(
              <button type="button" onClick={detectHome} disabled={locating} style={{
                width:"100%",padding:"14px",background:"rgba(255,255,255,0.03)",
                border:"1px dashed rgba(212,175,55,0.3)",borderRadius:14,
                color:locating?"rgba(255,255,255,0.3)":"rgba(212,175,55,0.7)",
                fontSize:11,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",
                cursor:"pointer",fontFamily:"inherit",
              }}>
                {locating?"📍 Detecting...":"📍 Detect My Home Location"}
              </button>
            )}
          </div>

          {/* Step 2: Select place */}
          <div style={{color:"rgba(255,255,255,0.22)",fontSize:7.5,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase"}}>
            STEP 2 — SELECT SACRED ANCHOR
          </div>

          <div style={{display:"flex",gap:6}}>
            {CATS.map(c=>(
              <button key={c.id} type="button" onClick={()=>setCatFilter(c.id)} style={{
                flex:1,padding:"8px 4px",background:catFilter===c.id?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.02)",
                border:`1px solid ${catFilter===c.id?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.06)"}`,
                borderRadius:10,color:catFilter===c.id?"#D4AF37":"rgba(255,255,255,0.3)",
                fontSize:7.5,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",
                cursor:"pointer",fontFamily:"inherit",
              }}>{c.label}</button>
            ))}
          </div>

          {filteredPlaces.map(place=>(
            <PlaceCard key={place.id} place={place} selected={selectedId===place.id} locked={phase==="locked"}
              onSelect={()=>{if(phase!=="locked")setSelectedId(selectedId===place.id?null:place.id);}}/>
          ))}

          {/* Phase messages */}
          {(phase==="scanning"||phase==="locking")&&(
            <div style={{background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.15)",borderRadius:14,padding:"14px 18px",textAlign:"center"}}>
              <div style={{color:"rgba(255,255,255,0.65)",fontSize:11,fontFamily:"monospace",lineHeight:1.6}}>
                {phase==="scanning"
                  ? "🔱 Computing scalar vector: your home ↔ sacred site..."
                  : `⚡ Writing entanglement frequency ${displayVector?.carrierHz.toFixed(2)} Hz to server...`}
              </div>
            </div>
          )}

          {error&&<div style={{background:"rgba(255,60,60,0.07)",border:"1px solid rgba(255,60,60,0.18)",borderRadius:12,padding:"12px 16px",color:"rgba(255,100,100,0.75)",fontSize:11}}>{error}</div>}

          {phase!=="locked"?(
            <button type="button" onClick={()=>void activate()}
              disabled={!selectedId||!homeLocation||phase!=="idle"}
              style={{
                width:"100%",padding:"18px",fontFamily:"inherit",
                background:(selectedId&&homeLocation)?"linear-gradient(135deg,#D4AF37,#8B7A28)":"rgba(255,255,255,0.04)",
                border:"none",borderRadius:20,
                color:(selectedId&&homeLocation)?"#050505":"rgba(255,255,255,0.2)",
                fontSize:12,fontWeight:900,letterSpacing:"0.15em",textTransform:"uppercase",
                cursor:(selectedId&&homeLocation)?"pointer":"not-allowed",transition:"all 0.4s",
                animation:(selectedId&&homeLocation&&phase==="idle")?"ctaGlow 2s infinite":"none",
              }}>
              {phase==="scanning"?"🔱 Computing Scalar Vector..."
               :phase==="locking"?"⚡ Writing Bridge to Server..."
               :!homeLocation?"📍 Detect Home Location First"
               :!selectedId?"Select a Sacred Place"
               :"🔱 Activate Scalar Bridge — 24/7"}
            </button>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{textAlign:"center",padding:"14px",background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:16,color:"#D4AF37",fontSize:11,fontWeight:700}}>
                🔱 Scalar Bridge LOCKED — running 24/7 on the server
              </div>
              <button type="button" onClick={()=>void deactivate()} style={{width:"100%",padding:"14px",fontFamily:"inherit",background:"rgba(255,60,60,0.07)",border:"1px solid rgba(255,60,60,0.16)",borderRadius:16,color:"rgba(255,100,100,0.6)",fontSize:8.5,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",cursor:"pointer"}}>◻ RELEASE SCALAR LOCK</button>
            </div>
          )}
        </>)}

        {/* ══ SCALAR BRIDGE TAB ══ */}
        {activeTab==="scalar"&&(<>
          {displayVector&&homeLocation&&(selectedPlace||activatedPlace)?(()=>{
            const place=activatedPlace||selectedPlace!;
            return(<>
              {/* Bridge visualization */}
              <div style={{background:"linear-gradient(135deg,rgba(212,175,55,0.08),rgba(34,211,238,0.04))",border:"1px solid rgba(212,175,55,0.22)",borderRadius:22,padding:"22px 20px"}}>
                <div style={{color:"rgba(255,255,255,0.25)",fontSize:7.5,fontWeight:800,letterSpacing:"0.55em",textTransform:"uppercase",marginBottom:14,textAlign:"center"}}>
                  SCALAR CONSCIOUSNESS BRIDGE
                </div>

                {/* Home ↔ Place diagram */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                  <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:14,padding:"12px 8px"}}>
                    <div style={{fontSize:20,marginBottom:4}}>🏠</div>
                    <div style={{color:"#D4AF37",fontSize:11,fontWeight:700}}>{homeLocation.label}</div>
                    <div style={{color:"rgba(255,255,255,0.25)",fontSize:8,marginTop:2,fontFamily:"monospace"}}>{formatLatLngShort(homeLocation.lat, homeLocation.lng)}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                    <div style={{color:"#D4AF37",fontSize:9,fontFamily:"monospace",fontWeight:700}}>{Math.round(displayVector.distanceKm).toLocaleString()} km</div>
                    <div style={{width:40,height:1,background:"linear-gradient(to right,#D4AF37,#22D3EE)",position:"relative"}}>
                      <div style={{position:"absolute",top:-3,left:"50%",transform:"translateX(-50%)",width:6,height:6,borderRadius:"50%",background:"#D4AF37",boxShadow:"0 0 8px #D4AF37"}}/>
                    </div>
                    <div style={{color:"rgba(255,255,255,0.4)",fontSize:8}}>{bearingToDirection(displayVector.bearingDeg)} {Math.round(displayVector.bearingDeg)}°</div>
                  </div>
                  <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:14,padding:"12px 8px"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{place.element}</div>
                    <div style={{color:"#D4AF37",fontSize:11,fontWeight:700}}>{place.name.split("·")[0].trim()}</div>
                    <div style={{color:"rgba(255,255,255,0.25)",fontSize:8,marginTop:2,fontFamily:"monospace"}}>{formatLatLngShort(place.lat, place.lng)}</div>
                  </div>
                </div>

                {/* Frequency parameters */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {label:"CARRIER FREQUENCY",     value:`${displayVector.carrierHz.toFixed(3)} Hz`,          color:"#D4AF37",  tip:"Left ear channel — primary transmission carrier"},
                    {label:"BINAURAL BEAT",          value:`${displayVector.binauralBeatHz.toFixed(3)} Hz`,     color:"#22D3EE",  tip:"Right ear offset — brain entrainment delta"},
                    {label:"SCHUMANN HARMONIC",      value:`${displayVector.schumannHarmonic} Hz`,             color:"#2ECC71",  tip:"Earth resonance harmonic lock"},
                    {label:"PHASE ANGLE",            value:`${displayVector.phaseAngle.toFixed(1)}°`,          color:"rgba(255,255,255,0.7)", tip:"Standing wave alignment"},
                    {label:"GREAT-CIRCLE DISTANCE",  value:`${Math.round(displayVector.distanceKm).toLocaleString()} km`, color:"rgba(255,255,255,0.7)", tip:"GPS-computed scalar bridge length"},
                    {label:"COMPASS BEARING",        value:`${bearingToDirection(displayVector.bearingDeg)} · ${Math.round(displayVector.bearingDeg)}°`, color:"rgba(255,255,255,0.7)", tip:"Face this direction to amplify reception"},
                  ].map(({label,value,color,tip})=>(
                    <div key={label} style={{background:"rgba(255,255,255,0.025)",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{color:"rgba(255,255,255,0.25)",fontSize:7,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
                      <div style={{color,fontSize:12,fontWeight:700,marginBottom:3}}>{value}</div>
                      <div style={{color:"rgba(255,255,255,0.2)",fontSize:7.5,lineHeight:1.4}}>{tip}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audio player */}
              <div style={{background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.18)",borderRadius:18,padding:"18px 20px"}}>
                <div style={{color:"rgba(255,255,255,0.25)",fontSize:7.5,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",marginBottom:12}}>
                  SCALAR CARRIER WAVE — PLAY IN YOUR HOME
                </div>
                <div style={{color:"rgba(255,255,255,0.42)",fontSize:9.5,lineHeight:1.6,marginBottom:14}}>
                  Use <strong style={{color:"rgba(255,255,255,0.7)"}}>stereo headphones</strong> or a speaker in your space. The binaural beat ({displayVector.binauralBeatHz.toFixed(1)} Hz) entrains your brain to the sacred site's frequency. This is the actual carrier wave of the scalar bridge — your physical space becomes the receiver.
                </div>

                {/* Waveform visualization */}
                <div style={{display:"flex",gap:1.5,alignItems:"center",height:32,marginBottom:16,justifyContent:"center"}}>
                  {Array.from({length:40}).map((_,i)=>{
                    const h=6+Math.abs(Math.sin(i*0.55+displayVector.phaseAngle*0.01))*20;
                    return(
                      <div key={i} style={{
                        width:4,height:h,borderRadius:2,
                        background:`rgba(212,175,55,${audioPlaying?0.2+(h/26)*0.7:0.12})`,
                        animation:audioPlaying?`waveBar ${0.5+(i%5)*0.1}s ease-in-out infinite`:undefined,
                        animationDelay:audioPlaying?`${i*0.04}s`:undefined,
                        transformOrigin:"center",
                      }}/>
                    );
                  })}
                </div>

                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <button type="button" onClick={toggleAudio} style={{
                    flex:1,padding:"14px",fontFamily:"inherit",
                    background:audioPlaying?"rgba(34,211,238,0.1)":"linear-gradient(135deg,#D4AF37,#8B7A28)",
                    border:audioPlaying?"1px solid rgba(34,211,238,0.3)":"none",
                    borderRadius:14,color:audioPlaying?"#22D3EE":"#050505",
                    fontSize:11,fontWeight:900,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer",
                  }}>
                    {audioPlaying?"⏸ PAUSE CARRIER":"▶ PLAY SCALAR CARRIER"}
                  </button>
                </div>

                {/* Volume slider */}
                <div style={{marginTop:12,display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{color:"rgba(255,255,255,0.3)",fontSize:8,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",flexShrink:0}}>VOL</span>
                  <input type="range" min={0} max={100} value={Math.round(volume*100)}
                    onChange={e=>setVolume(parseInt(e.target.value)/100)}
                    style={{flex:1,accentColor:"#D4AF37",cursor:"pointer"}}/>
                  <span style={{color:"rgba(255,255,255,0.3)",fontSize:9,fontFamily:"monospace",width:32,textAlign:"right"}}>{Math.round(volume*100)}%</span>
                </div>

                <div style={{marginTop:12,padding:"10px 12px",background:"rgba(255,255,255,0.02)",borderRadius:10,color:"rgba(255,255,255,0.28)",fontSize:8.5,lineHeight:1.6,fontStyle:"italic"}}>
                  💡 The carrier continues silently on the server 24/7. Audio amplifies your conscious reception — play it during meditation, sleep, or anytime for maximum field absorption.
                </div>
              </div>

              {/* Meditation instruction */}
              <div style={{background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.12)",borderRadius:18,padding:"18px 18px"}}>
                <div style={{color:"#D4AF37",fontSize:10,fontWeight:800,letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:12}}>✦ AMPLIFICATION PROTOCOL</div>
                {[
                  `Face ${bearingToDirection(displayVector.bearingDeg)} (${Math.round(displayVector.bearingDeg)}°) — the compass direction of ${place.name.split("·")[0].trim()} from your home.`,
                  "Play the scalar carrier wave through stereo headphones. Left ear = carrier, right ear = carrier + binaural beat.",
                  "Light a ghee lamp. Fire physically amplifies scalar wave reception in the space.",
                  `The Schumann lock (${displayVector.schumannHarmonic} Hz) synchronises your field with Earth's ionospheric resonance automatically.`,
                  "Even when audio is off, the Railway cron worker pulses the field every hour. The scalar bridge is permanent.",
                  "The longer the lock runs, the stronger the field grows — scalar intensity increases with each server pulse.",
                ].map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
                    <span style={{color:"#D4AF37",flexShrink:0}}>◈</span>
                    <span style={{color:"rgba(255,255,255,0.42)",fontSize:10,lineHeight:1.55}}>{t}</span>
                  </div>
                ))}
              </div>
            </>);
          })():(
            <div style={{textAlign:"center",padding:"60px 24px"}}>
              <div style={{fontSize:48,opacity:0.1,marginBottom:16}}>📐</div>
              <div style={{color:"rgba(255,255,255,0.28)",fontSize:11,lineHeight:1.7}}>
                {!homeLocation?"Detect your home location and select a sacred place to preview the scalar vector.":"Select a sacred place to see your unique scalar vector."}
              </div>
            </div>
          )}
        </>)}

        {/* ══ LIVE FIELD TAB ══ */}
        {activeTab==="live"&&(<>
          {phase==="locked"&&activation&&activatedPlace?(<>
            {/* Uptime */}
            <div style={{background:"linear-gradient(135deg,rgba(212,175,55,0.08),transparent)",border:"1px solid rgba(212,175,55,0.22)",borderRadius:22,padding:"22px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#22D3EE",animation:"liveDot 2s ease-in-out infinite"}}/>
                <span style={{color:"#22D3EE",fontSize:8,fontWeight:800,letterSpacing:"0.55em",textTransform:"uppercase"}}>LIVE SCALAR BRIDGE</span>
                <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.2)",fontSize:7.5}}>Server-side · Always on</span>
              </div>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{color:"rgba(255,255,255,0.25)",fontSize:8,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",marginBottom:6}}>CONTINUOUS UPTIME</div>
                <div style={{color:"#D4AF37",fontSize:34,fontWeight:900,letterSpacing:"-0.04em",fontFamily:"monospace"}}>
                  {String(uptime.d).padStart(2,"0")}<span style={{color:"rgba(212,175,55,0.4)",fontSize:14}}>d </span>
                  {String(uptime.h).padStart(2,"0")}<span style={{color:"rgba(212,175,55,0.4)",fontSize:14}}>h </span>
                  {String(uptime.m).padStart(2,"0")}<span style={{color:"rgba(212,175,55,0.4)",fontSize:14}}>m </span>
                  {String(uptime.s).padStart(2,"0")}<span style={{color:"rgba(212,175,55,0.4)",fontSize:14}}>s</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {label:"PLACE",         value:activatedPlace.name.split("·")[0].trim(), color:"#D4AF37"},
                  {label:"HOME",          value:activation.home_label||"Your Home",       color:"rgba(255,255,255,0.8)"},
                  {label:"CARRIER",       value:activeVector?`${activeVector.carrierHz.toFixed(2)} Hz`:"—", color:"#D4AF37"},
                  {label:"BINAURAL BEAT", value:activeVector?`${activeVector.binauralBeatHz.toFixed(2)} Hz`:"—", color:"#22D3EE"},
                  {label:"SCALAR INTENSITY",value:`${activation.scalar_intensity}%`,     color:"rgba(255,255,255,0.8)"},
                  {label:"SERVER PULSES", value:String(activation.pulse_count),           color:"rgba(255,255,255,0.8)"},
                ].map(({label,value,color})=>(
                  <div key={label} style={{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 14px"}}>
                    <div style={{color:"rgba(255,255,255,0.25)",fontSize:7.5,fontWeight:800,letterSpacing:"0.45em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
                    <div style={{color,fontSize:11.5,fontWeight:700}}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick audio toggle */}
            <button type="button" onClick={toggleAudio} style={{
              width:"100%",padding:"15px",fontFamily:"inherit",
              background:audioPlaying?"rgba(34,211,238,0.08)":"rgba(212,175,55,0.08)",
              border:`1px solid ${audioPlaying?"rgba(34,211,238,0.3)":"rgba(212,175,55,0.25)"}`,
              borderRadius:16,color:audioPlaying?"#22D3EE":"#D4AF37",
              fontSize:10,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",cursor:"pointer",
            }}>
              {audioPlaying?"⏸ PAUSE CARRIER WAVE":"▶ PLAY SCALAR CARRIER WAVE"}
            </button>

            <div style={{background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{color:"rgba(255,255,255,0.25)",fontSize:7.5,fontWeight:800,letterSpacing:"0.45em",textTransform:"uppercase",marginBottom:4}}>LAST SERVER PULSE</div>
                <div style={{color:"rgba(255,255,255,0.6)",fontSize:11,fontFamily:"monospace"}}>{new Date(activation.last_pulse_at).toLocaleString()}</div>
              </div>
              <div style={{color:"#22D3EE",fontSize:18}}>⚡</div>
            </div>

            <div style={{background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 16px"}}>
              <div style={{color:"rgba(255,255,255,0.25)",fontSize:7.5,fontWeight:800,letterSpacing:"0.45em",textTransform:"uppercase",marginBottom:6}}>SCALAR LOCK CODE</div>
              <div style={{color:"#D4AF37",fontSize:10,fontFamily:"monospace",letterSpacing:"0.08em"}}>{activation.lock_code}</div>
            </div>

          </>):(
            <div style={{textAlign:"center",padding:"70px 24px"}}>
              <div style={{fontSize:52,opacity:0.1,marginBottom:18}}>🔱</div>
              <div style={{color:"rgba(255,255,255,0.28)",fontSize:11,lineHeight:1.7}}>
                No active scalar bridge.<br/>Go to Places tab, detect your home, select a sacred site, and activate.
              </div>
            </div>
          )}
        </>)}

      </div>
      </div>
    </div>
  );
}
