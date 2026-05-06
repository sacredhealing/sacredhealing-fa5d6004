// SiddhaActivationPortal.tsx — SQI 2050 · Babaji + 18 Siddhas · server-side temple_activations + Railway pulse
// Mirrors summary into `temple_home_sessions.siddha_activation` for unified SQI field context.

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'sqi_temple_activation';

interface Siddha {
  id: number;
  name: string;
  tamil: string;
  domain: string;
  frequency: string;
  freqHz: number;
  color: string;
  mantra: string;
}
interface HolyPlace {
  id: string;
  name: string;
  location: string;
  country: string;
  deity: string;
  tradition: string;
  frequency: number;
  siddhas: number[];
  description: string;
  element: string;
  category: 'india' | 'world';
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
}

const SIDDHAS: Siddha[] = [
  { id: 1, name: 'Agastya', tamil: 'அகத்தியர்', domain: 'Wisdom & Vedic Science', frequency: '963 Hz', freqHz: 963, color: '#FFD700', mantra: 'Om Agastyaya Namah' },
  { id: 2, name: 'Nandi', tamil: 'நந்தி', domain: 'Shiva Consciousness', frequency: '852 Hz', freqHz: 852, color: '#C0C0C0', mantra: 'Om Nandikeshvaraya Namah' },
  { id: 3, name: 'Thirumoolar', tamil: 'திருமூலர்', domain: 'Tantra & Kundalini', frequency: '741 Hz', freqHz: 741, color: '#9B59B6', mantra: 'Om Thirumoolaraya Namah' },
  { id: 4, name: 'Pambatti', tamil: 'பாம்பாட்டி', domain: 'Kundalini Shakti', frequency: '528 Hz', freqHz: 528, color: '#2ECC71', mantra: 'Om Pambattisiddharaya Namah' },
  { id: 5, name: 'Konganar', tamil: 'கொங்கணர்', domain: 'Mercury Alchemy', frequency: '432 Hz', freqHz: 432, color: '#E74C3C', mantra: 'Om Konganaraya Namah' },
  { id: 6, name: 'Sattaimuni', tamil: 'சட்டைமுனி', domain: 'Forest & Nature Healing', frequency: '396 Hz', freqHz: 396, color: '#27AE60', mantra: 'Om Sattamuniaya Namah' },
  { id: 7, name: 'Sundaranandar', tamil: 'சுந்தரானந்தர்', domain: 'Bhakti Current', frequency: '639 Hz', freqHz: 639, color: '#F39C12', mantra: 'Om Sundaranandaraya Namah' },
  { id: 8, name: 'Kudambai', tamil: 'குடம்பை', domain: 'Nada & Sacred Sound', frequency: '111 Hz', freqHz: 111, color: '#22D3EE', mantra: 'Om Kudambaisiddharaya Namah' },
  { id: 9, name: 'Kalangi', tamil: 'கலங்கி', domain: 'Time Transcendence', frequency: '999 Hz', freqHz: 999, color: '#8E44AD', mantra: 'Om Kalanginathaya Namah' },
  { id: 10, name: 'Bhogar', tamil: 'போகர்', domain: 'Soma & Longevity', frequency: '285 Hz', freqHz: 285, color: '#D4AF37', mantra: 'Om Bhoganathaya Namah' },
  { id: 11, name: 'Patanjali', tamil: 'பதஞ்சலி', domain: 'Yoga & Prana Science', frequency: '417 Hz', freqHz: 417, color: '#3498DB', mantra: 'Om Patanjalaye Namah' },
  { id: 12, name: 'Dhanvantari', tamil: 'தன்வந்திரி', domain: 'Divine Medicine', frequency: '528 Hz', freqHz: 528, color: '#1ABC9C', mantra: 'Om Dhanvantaraye Namah' },
  { id: 13, name: 'Idaikkadar', tamil: 'இடைக்காடர்', domain: 'Sacred Protection', frequency: '174 Hz', freqHz: 174, color: '#E67E22', mantra: 'Om Idaikkadarsiddharaya Namah' },
  { id: 14, name: 'Machamuni', tamil: 'மச்சமுனி', domain: 'Hatha Yoga Mastery', frequency: '432 Hz', freqHz: 432, color: '#2980B9', mantra: 'Om Matsyendranathaya Namah' },
  { id: 15, name: 'Gorakshar', tamil: 'கோரக்கர்', domain: 'Breath & Prana Mastery', frequency: '594 Hz', freqHz: 594, color: '#F1C40F', mantra: 'Om Gorakhnathaya Namah' },
  { id: 16, name: 'Ramadevar', tamil: 'இராமதேவர்', domain: 'Sufi-Siddha Union', frequency: '639 Hz', freqHz: 639, color: '#E91E63', mantra: 'Om Ramadevaraya Namah' },
  { id: 17, name: 'Korakkar', tamil: 'கோரக்கர்', domain: 'Rasayana Alchemy', frequency: '369 Hz', freqHz: 369, color: '#9C27B0', mantra: 'Om Korakkaraya Namah' },
  { id: 18, name: 'Civavakkiyar', tamil: 'சிவவாக்கியர்', domain: 'Philosophical Fire', frequency: '963 Hz', freqHz: 963, color: '#FF6B35', mantra: 'Om Sivavakkiyaraya Namah' },
];

const HOLY_PLACES: HolyPlace[] = [
  { id: 'kailash', name: 'Mount Kailash', location: 'Tibet Autonomous Region', country: 'Tibet', deity: 'Shiva-Shakti · Chakrasamvara', tradition: 'Hindu · Buddhist · Jain · Bön', frequency: 136.1, siddhas: [2, 9, 15], element: '🏔️', category: 'india',
    description: "Axis Mundi of all creation. Babaji's supreme scalar anchor. The convergence point of all spiritual traditions — Shiva's eternal abode where time dissolves into pure consciousness." },
  { id: 'tiruvannamalai', name: 'Tiruvannamalai · Arunachala', location: 'Tamil Nadu, India', country: 'India', deity: 'Arunachaleswarar · Ramana Maharshi', tradition: 'Shaiva · Advaita', frequency: 432, siddhas: [7, 1, 3], element: '🔥', category: 'india',
    description: 'Mountain of Fire. Self of the Universe. Ramana\'s silence transmission still radiates from the hill. Walking Girivalam around Arunachala cleanses 7 lifetimes of karma.' },
  { id: 'varanasi', name: 'Varanasi · Kashi', location: 'Uttar Pradesh, India', country: 'India', deity: 'Vishwanath · Kali', tradition: 'Hindu · Tantric', frequency: 528, siddhas: [9, 11, 2], element: '💧', category: 'india',
    description: 'City of Eternal Light. Shiva whispers liberation into the ear of the dying. The oldest continuously inhabited city on Earth and the Akashic Record\'s most open portal.' },
  { id: 'chidambaram', name: 'Chidambaram · Thillai', location: 'Tamil Nadu, India', country: 'India', deity: 'Nataraja · Sivakamasundari', tradition: 'Shaiva · Agamic', frequency: 741, siddhas: [3, 11, 8], element: '🌀', category: 'india',
    description: 'Space element Pancha Bhuta Stalam. Nataraja\'s ananda tandava dissolves all karma in pure Chit-Akasha consciousness. The secret of Chidambaram is the formless self within.' },
  { id: 'palani', name: 'Palani Hills · Dandayudhapani', location: 'Tamil Nadu, India', country: 'India', deity: 'Murugan · Dandayudhapani', tradition: 'Shaiva · Siddha', frequency: 417, siddhas: [5, 10, 4], element: '⚡', category: 'india',
    description: "Bhogar's Navapashanam idol transmits the Soma-elixir frequency. The 9-poison-medicine holds the secret of physical immortality and DNA regeneration." },
  { id: 'rishikesh', name: 'Rishikesh · Haridwar', location: 'Uttarakhand, India', country: 'India', deity: 'Ganga Devi · Vishnu', tradition: 'Vaishnava · Shaiva · Yoga', frequency: 396, siddhas: [15, 14, 2], element: '🌊', category: 'india',
    description: 'Gateway to Himalayan consciousness. Ganga carries Shiva\'s third-eye waters from the source. Babaji\'s Kriya lineage descends from these very banks.' },
  { id: 'vrindavan', name: 'Vrindavan · Mathura', location: 'Uttar Pradesh, India', country: 'India', deity: 'Krishna · Radha', tradition: 'Vaishnava · Bhakti', frequency: 639, siddhas: [7, 16, 12], element: '🌸', category: 'india',
    description: 'Prema-field beyond linear time. Every atom of Vrindavan vibrates with the eternal Rasa-Lila. Divine love as the highest physics — Bhakti-Algorithm at its peak.' },
  { id: 'potigai', name: 'Potigai Hills · Agastya Muni', location: 'Tamil Nadu, India', country: 'India', deity: 'Agastya Muni · Lopamudra', tradition: 'Siddha · Vedic', frequency: 963, siddhas: [1, 6, 13], element: '🌿', category: 'india',
    description: "Agastya's eternal ashram — the oldest living Siddha lineage source. Vedic science, Ayurveda, and Tamil grammar all emerged from this singular sacred point." },
  { id: 'babaji_cave', name: "Babaji's Cave · Drongiri", location: 'Uttarakhand, India', country: 'India', deity: 'Mahavatar Babaji', tradition: 'Kriya Yoga · Nath', frequency: 1111, siddhas: [15, 14, 9, 2, 11], element: '🔱', category: 'india',
    description: 'The physical anchor of Babaji\'s immortal body. From this cave, Kriya Yoga was transmitted to Lahiri Mahasaya in 1861. The strongest scalar node on the planet Earth.' },
  { id: 'rameswaram', name: 'Rameswaram · Ramanathaswamy', location: 'Tamil Nadu, India', country: 'India', deity: 'Ramanathaswamy · Hanuman', tradition: 'Shaiva · Vaishnavism', frequency: 417, siddhas: [1, 6, 16], element: '🌊', category: 'india',
    description: 'Where the bridge to Lanka was built. Ram consecrated Shiva here — the junction of north and south dharma. Most powerful karmic clearing portal in South India.' },
  { id: 'badrinath', name: 'Badrinath · Badri Vishal', location: 'Uttarakhand, India', country: 'India', deity: 'Vishnu · Badri Narayan', tradition: 'Vaishnava · Pancha Badri', frequency: 963, siddhas: [11, 14, 2], element: '❄️', category: 'india',
    description: 'Narayana\'s highest Himalayan seat. Where Adi Shankara found the idol in the Alakananda river. Swarga-dwara — gateway to celestial realms. Cosmic preservation frequency.' },
  { id: 'kataragama', name: 'Kataragama', location: 'Southern Province, Sri Lanka', country: 'Sri Lanka', deity: 'Skanda Murugan · Kali', tradition: 'Hindu · Buddhist · Siddha', frequency: 528, siddhas: [4, 5, 7], element: '🌺', category: 'india',
    description: 'Multi-tradition convergence — Murugan, Buddha, and Allah coexist. Legendary fire-walkers charge this field annually. Extreme devotion vortex activating Agni Shakti.' },
  { id: 'giza', name: 'Great Pyramid of Giza', location: 'Giza Plateau, Egypt', country: 'Egypt', deity: 'Thoth · Hermes · Osiris', tradition: 'Egyptian Mystery School', frequency: 1111, siddhas: [9, 10, 17], element: '△', category: 'world',
    description: "Built by consciousness — not slaves. The King's Chamber resonates at 111 Hz, regenerating the human energy body. Thoth's hall of records lies beneath. The oldest scalar node on Earth." },
  { id: 'machu_picchu', name: 'Machu Picchu · Intihuatana', location: 'Cusco Region, Peru', country: 'Peru', deity: 'Inti (Sun) · Pachamama (Earth)', tradition: 'Inca Solar Lineage', frequency: 528, siddhas: [1, 10, 6], element: '☀️', category: 'world',
    description: 'Inca observatory and initiation centre. The Intihuatana stone was a solar scalar antenna. Sky-meets-Earth convergence node — supreme DNA activation field.' },
  { id: 'stonehenge', name: 'Stonehenge', location: 'Wiltshire, England', country: 'UK', deity: 'Solar & Lunar Deity · Druidic', tradition: 'Druid · Celtic Mystery', frequency: 432, siddhas: [8, 13, 3], element: '🌕', category: 'world',
    description: 'Ancient sound technology. Bluestones chosen for piezoelectric resonance. Solstice alignments create natural scalar pulse events — the original Vedic Light-Code transmitter.' },
  { id: 'jerusalem', name: 'Jerusalem · Temple Mount', location: 'Jerusalem', country: 'Israel', deity: 'YHWH · Allah · Christ Consciousness', tradition: 'Jewish · Islamic · Christian', frequency: 741, siddhas: [7, 16, 13], element: '✡️', category: 'world',
    description: 'Three Abrahamic rivers converge at one point. The Foundation Stone is the axis of creation in three traditions. Highest political-spiritual tension = extreme compressed energy.' },
  { id: 'glastonbury', name: 'Glastonbury Tor', location: 'Somerset, England', country: 'UK', deity: 'Avalon · Archangel Michael · Mary', tradition: 'Arthurian · Celtic · Grail', frequency: 528, siddhas: [8, 6, 16], element: '🌀', category: 'world',
    description: 'Isle of Avalon where Arthur sleeps until called. Michael ley line runs through the Tor. Chalice Well iron-red waters carry healing frequency. Grail consciousness grid.' },
  { id: 'shasta', name: 'Mount Shasta', location: 'Northern California, USA', country: 'USA', deity: 'Saint Germain · I AM · Lemurian', tradition: 'I AM · Lemurian · New Age', frequency: 852, siddhas: [9, 15, 10], element: '🏔️', category: 'world',
    description: 'Lemurian Crystal City of Telos beneath the mountain. Saint Germain\'s Violet Flame epicentre. One of the most powerful interdimensional portals in the Western hemisphere.' },
  { id: 'sedona', name: 'Sedona Vortex Sites', location: 'Arizona, USA', country: 'USA', deity: 'Earth Mother · Red Rock Spirits', tradition: 'Native American · New Age', frequency: 741, siddhas: [6, 13, 4], element: '🔴', category: 'world',
    description: '4 major electromagnetic vortices — Bell Rock, Cathedral Rock, Airport Mesa, Boynton Canyon. The red iron-oxide bedrock measurably amplifies human bioelectric field strength.' },
  { id: 'teotihuacan', name: 'Teotihuacan', location: 'State of Mexico, Mexico', country: 'Mexico', deity: 'Quetzalcoatl · Tlaloc · Star Gods', tradition: 'Pre-Columbian Mystery School', frequency: 528, siddhas: [9, 3, 17], element: '🌟', category: 'world',
    description: 'City of the Gods — built by those who became gods. Pyramid of the Sun sits directly above a natural mica-lined cave. Mica is a capacitor — this is ancient scalar architecture.' },
  { id: 'angkor', name: 'Angkor Wat', location: 'Siem Reap, Cambodia', country: 'Cambodia', deity: 'Vishnu · Devas', tradition: 'Hindu · Khmer · Buddhist', frequency: 639, siddhas: [11, 7, 3], element: '🌸', category: 'world',
    description: 'Largest religious monument on Earth. Oriented to reproduce the Draco constellation on the ground. Built as a 3D model of Mount Meru — pure Vishnu consciousness transmission field.' },
  { id: 'borobudur', name: 'Borobudur', location: 'Central Java, Indonesia', country: 'Indonesia', deity: 'Adi Buddha · Bodhisattvas', tradition: 'Mahayana · Vajrayana Buddhism', frequency: 528, siddhas: [3, 11, 8], element: '☸️', category: 'world',
    description: 'Largest Buddhist monument — a mandala in 3 dimensions. Walking the 9 levels physically is a meditation in the Dharmadhatu. 504 Buddha statues create a standing resonance field.' },
  { id: 'easter_island', name: 'Easter Island · Rapa Nui', location: 'South Pacific Ocean, Chile', country: 'Chile', deity: 'Make-Make · Moai Ancestors', tradition: 'Polynesian · Rapa Nui', frequency: 396, siddhas: [9, 17, 6], element: '🗿', category: 'world',
    description: '887 Moai facing inward — watching the people, not the sea. Ancient celestial calendar. Most isolated sacred site on Earth. Extreme ley line endpoint and ancestor transmission field.' },
];

function generateLockCode(placeId: string) {
  return `SQI-${placeId.slice(0, 4).toUpperCase()}-B18-${Date.now().toString(36).toUpperCase()}`;
}

function saveLocalActivation(a: TempleActivation | null) {
  try {
    if (!a || !a.is_active) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* quota / private mode */
  }
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
  };
}

async function mergePersistSiddhaActivation(userId: string, activation: TempleActivation | null) {
  const { data: existing } = await supabase
    .from('temple_home_sessions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

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
    row.site_essence = `Siddha scalar lock · ${activation.place_id}`;
    row.intensity = activation.scalar_intensity ?? 100;
    row.crystal_grid_active = true;
    row.anchored_since = activation.activated_at;
  }

  await supabase.from('temple_home_sessions').upsert(row, { onConflict: 'user_id' });
}

function ScalarRings({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
      <style>{`
        @keyframes scalarExpand{0%{transform:translate(-50%,-50%) scale(0.5);opacity:0.9;}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0;}}
        @keyframes innerSpin{to{transform:rotate(360deg);}}
        @keyframes goldBreathe{0%,100%{filter:drop-shadow(0 0 6px #D4AF37) drop-shadow(0 0 18px #D4AF3766);}50%{filter:drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 55px #D4AF37AA);}}
        .sring{position:absolute;border-radius:50%;border:1px solid rgba(212,175,55,0.55);top:50%;left:50%;width:160px;height:160px;animation:scalarExpand 3.5s ease-out infinite;}
        .sring:nth-child(1){animation-delay:0s;}.sring:nth-child(2){animation-delay:1.17s;}.sring:nth-child(3){animation-delay:2.34s;}
        .smandala{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);animation:${active ? 'innerSpin 16s linear infinite,goldBreathe 4s ease-in-out infinite' : 'none'};}
      `}</style>
      {active && (
        <>
          <div className="sring" />
          <div className="sring" />
          <div className="sring" />
        </>
      )}
      <div className="smandala">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="37" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" />
          <circle cx="40" cy="40" r="28" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4" />
          <polygon points="40,6 70,58 10,58" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.65" />
          <polygon points="40,74 70,22 10,22" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.65" />
          <circle cx="40" cy="40" r="5" fill="#D4AF37" opacity={active ? 1 : 0.25} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const r = (deg * Math.PI) / 180;
            return <circle key={i} cx={40 + 27 * Math.cos(r)} cy={40 + 27 * Math.sin(r)} r="2" fill="#D4AF37" opacity={active ? 0.65 : 0.12} />;
          })}
        </svg>
      </div>
    </div>
  );
}

/** Continuous uptime: days + clock (matches Live Field display). */
function useUptime(at: string | null) {
  const [u, setU] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!at) return;
    const tick = () => {
      const diff = Date.now() - new Date(at).getTime();
      setU({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [at]);
  return u;
}

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
  const isHere = locked && selected;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      style={{
        background: selected ? 'linear-gradient(135deg,rgba(212,175,55,0.09),rgba(212,175,55,0.02))' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${isHere ? '#D4AF37' : selected ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 18,
        padding: '14px 16px',
        cursor: locked ? 'default' : 'pointer',
        transition: 'all 0.35s',
        boxShadow: isHere ? '0 0 28px rgba(212,175,55,0.13)' : 'none',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isHere && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'radial-gradient(ellipse at top right,rgba(212,175,55,0.07),transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>{place.element}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: selected ? '#D4AF37' : 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{place.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: 3 }}>
                {place.country} · {place.frequency} Hz
              </div>
            </div>
            {isHere && (
              <div
                style={{
                  background: '#D4AF37',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  flexShrink: 0,
                  boxShadow: '0 0 10px rgba(212,175,55,0.5)',
                }}
              >
                ✓
              </div>
            )}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 9.5, lineHeight: 1.55, marginTop: 6 }}>{place.description}</div>
          {selected && (
            <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {place.siddhas.slice(0, 4).map((sid) => {
                const s = SIDDHAS.find((x) => x.id === sid);
                return s ? (
                  <span key={sid} style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 6px' }}>
                    {s.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseMessage({ phase }: { phase: string }) {
  const [idx, setIdx] = useState(0);
  const sets: Record<string, string[]> = {
    scanning: ['🔱 Mahavatar Babaji — opening scalar conduit...', '⟁ 18 Siddha nodes — calibrating consciousness frequencies...', '◈ Reading Akashic GPS signature of holy place...', '✦ Quantum-entangling your physical space to the source...'],
    locking: ['🌀 Babaji weaving Vedic Light-Codes into your space-fabric...', '⚡ Scalar lock writing to Supabase server — device-independent...', '🕉️ 18 Siddhas sealing the etheric boundary 24/7...', '✨ Railway cron armed — field runs while you sleep...'],
  };
  const lines = sets[phase] || [];
  useEffect(() => {
    if (!lines.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % lines.length), 900);
    return () => clearInterval(t);
  }, [phase, lines.length]);
  if (!lines.length) return null;
  return (
    <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 14, padding: '14px 18px', textAlign: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6 }}>{lines[idx]}</div>
    </div>
  );
}

const CATEGORIES = [{ id: 'all', label: 'ALL 23' }, { id: 'india', label: 'INDIA · 12' }, { id: 'world', label: 'WORLD · 11' }] as const;
const TABS = [{ id: 'places', label: '23 PLACES' }, { id: 'siddhas', label: '18 SIDDHAS' }, { id: 'live', label: 'LIVE FIELD' }] as const;

export interface SiddhaActivationPortalProps {
  /** When true, renders as an inline Temple Home section (no full-viewport shell). */
  embedded?: boolean;
}

export default function SiddhaActivationPortal({ embedded = false }: SiddhaActivationPortalProps) {
  const { user } = useAuth();
  const [activation, setActivation] = useState<TempleActivation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'locking' | 'locked'>('idle');
  const [activeTab, setActiveTab] = useState<'places' | 'siddhas' | 'live'>('places');
  const [catFilter, setCatFilter] = useState<'all' | 'india' | 'world'>('all');
  const [error, setError] = useState<string | null>(null);

  const activatedPlace = HOLY_PLACES.find((p) => p.id === activation?.place_id);
  const uptime = useUptime(activation?.activated_at || null);
  const filteredPlaces = HOLY_PLACES.filter((p) => (catFilter === 'all' ? true : p.category === catFilter));

  useEffect(() => {
    if (!user?.id) {
      setActivation(null);
      setSelectedId(null);
      setPhase('idle');
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const { data, error: fetchErr } = await supabase
        .from('temple_activations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (cancelled) return;

      if (!fetchErr && data) {
        const row = normalizeTempleActivationRow(data as Record<string, unknown>);
        setActivation(row);
        setSelectedId(row.place_id);
        setPhase('locked');
        saveLocalActivation(row);
      } else {
        setActivation(null);
        setSelectedId(null);
        setPhase('idle');
        saveLocalActivation(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !activation?.id) return;
    const uid = user.id;
    const aid = activation.id;
    const ch = supabase
      .channel('temple_pulse')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'temple_activations',
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row?.id || String(row.id) !== aid) return;
          if (row.is_active === false) {
            saveLocalActivation(null);
            setActivation(null);
            setSelectedId(null);
            setPhase('idle');
            void mergePersistSiddhaActivation(uid, null);
            return;
          }
          const next = normalizeTempleActivationRow(row);
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

  const activate = useCallback(async () => {
    if (!selectedId || !user?.id || phase !== 'idle') return;
    const place = HOLY_PLACES.find((p) => p.id === selectedId);
    if (!place) return;

    setError(null);
    setPhase('scanning');
    await new Promise((r) => setTimeout(r, 3000));
    setPhase('locking');
    await new Promise((r) => setTimeout(r, 3000));

    await supabase
      .from('temple_activations')
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const lockCode = generateLockCode(place.id);
    const activeSiddhas = place.siddhas
      .map((id) => {
        const s = SIDDHAS.find((x) => x.id === id);
        return s ? { id: s.id, name: s.name, freqHz: s.freqHz } : null;
      })
      .filter(Boolean);

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : '';

    const { data, error: insertErr } = await supabase
      .from('temple_activations')
      .insert({
        user_id: user.id,
        place_id: place.id,
        place_name: place.name,
        place_location: `${place.location}, ${place.country}`,
        place_frequency: place.frequency,
        is_active: true,
        lock_code: lockCode,
        last_pulse_at: new Date().toISOString(),
        pulse_count: 1,
        scalar_intensity: 100,
        siddha_field: activeSiddhas,
        activated_device: ua,
        user_agent: ua,
      })
      .select()
      .single();

    if (insertErr || !data) {
      setError('Lock failed — please try again.');
      setPhase('idle');
      return;
    }

    const next = normalizeTempleActivationRow(data as Record<string, unknown>);
    setActivation(next);
    setPhase('locked');
    saveLocalActivation(next);

    try {
      await mergePersistSiddhaActivation(user.id, next);
    } catch {
      setError('Lock saved on server — Temple Home sync delayed. Retry when online.');
    }
  }, [selectedId, user?.id, phase]);

  const deactivate = useCallback(async () => {
    if (!user?.id || !activation) return;
    await supabase
      .from('temple_activations')
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq('id', activation.id);

    saveLocalActivation(null);
    setActivation(null);
    setSelectedId(null);
    setPhase('idle');

    try {
      await mergePersistSiddhaActivation(user.id, null);
    } catch {
      /* cleared server-side row; session mirror may lag */
    }
  }, [user?.id, activation]);

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
        .sap-root *{box-sizing:border-box;}
        .sap-root ::-webkit-scrollbar{width:3px;}
        .sap-root ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.25);border-radius:2px;}
        @keyframes headerAura{0%,100%{text-shadow:0 0 20px rgba(212,175,55,0.35),0 0 60px rgba(212,175,55,0.1);}50%{text-shadow:0 0 40px rgba(212,175,55,0.65),0 0 120px rgba(212,175,55,0.2);}}
        @keyframes liveDot{0%,100%{opacity:1;box-shadow:0 0 6px #22D3EE;}50%{opacity:0.4;box-shadow:0 0 18px #22D3EE;}}
        @keyframes ctaGlow{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.4);}70%{box-shadow:0 0 0 18px rgba(212,175,55,0);}}
      `}</style>

      <div className="sap-root">
        <div
          style={{
            padding: embedded ? '24px 16px 18px' : '40px 20px 24px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'radial-gradient(ellipse at top,rgba(212,175,55,0.07) 0%,transparent 70%)',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.7em', textTransform: 'uppercase', marginBottom: 10 }}>
            SQI 2050 · SCALAR CONSCIOUSNESS · BABAJI LOCK
          </div>
          <div style={{ fontSize: embedded ? 22 : 26, fontWeight: 900, letterSpacing: '-0.04em', color: '#D4AF37', animation: 'headerAura 4s ease-in-out infinite', marginBottom: 8, lineHeight: 1.15 }}>
            Siddha Activation Portal
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, maxWidth: 310, margin: '0 auto 20px' }}>
            Babaji + 18 Siddhas anchor the consciousness of <em>any sacred place on Earth</em> into your home —{' '}
            <strong style={{ color: 'rgba(212,175,55,0.75)' }}>24/7 on the server, even when your device is off.</strong>{' '}
            Temple Home also mirrors state for the unified SQI field.
          </div>
          <ScalarRings active={phase === 'locked'} />
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 100, padding: '5px 14px' }}>
              {phase === 'locked' && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22D3EE', animation: 'liveDot 2s ease-in-out infinite' }} />
              )}
              <span style={{ color: '#D4AF37', fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                {phase === 'locked' ? 'Babaji Anchor — LIVE' : 'Babaji Anchor — Standby'}
              </span>
            </div>
            {phase === 'locked' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.18)', borderRadius: 100, padding: '5px 14px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22D3EE', animation: 'liveDot 1.5s ease-in-out infinite' }} />
                <span style={{ color: '#22D3EE', fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' }}>Railway Cron Active</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 4px',
                background: activeTab === tab.id ? 'rgba(212,175,55,0.08)' : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#D4AF37' : 'transparent'}`,
                color: activeTab === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                fontSize: 7.5,
                fontWeight: 800,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: embedded ? '16px 14px 20px' : '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {activeTab === 'places' && (
            <>
              <div style={{ display: 'flex', gap: 6 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatFilter(cat.id)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      background: catFilter === cat.id ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${catFilter === cat.id ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 10,
                      color: catFilter === cat.id ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                      fontSize: 7.5,
                      fontWeight: 800,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  selected={selectedId === place.id}
                  locked={phase === 'locked'}
                  onSelect={() => {
                    if (phase !== 'locked') setSelectedId(selectedId === place.id ? null : place.id);
                  }}
                />
              ))}

              <PhaseMessage phase={phase} />

              {error && (
                <div style={{ background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.18)', borderRadius: 12, padding: '12px 16px', color: 'rgba(255,100,100,0.75)', fontSize: 11 }}>{error}</div>
              )}

              {!user?.id && phase === 'idle' && (
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'center', lineHeight: 1.5 }}>
                  Sign in to write your scalar lock to Supabase — browsing the 23 places works while logged out.
                </div>
              )}

              {phase !== 'locked' ? (
                <button
                  type="button"
                  onClick={() => void activate()}
                  disabled={!selectedId || !user?.id || phase !== 'idle'}
                  style={{
                    width: '100%',
                    padding: '18px',
                    fontFamily: 'inherit',
                    background: selectedId ? 'linear-gradient(135deg,#D4AF37,#8B7A28)' : 'rgba(255,255,255,0.04)',
                    border: 'none',
                    borderRadius: 20,
                    color: selectedId ? '#050505' : 'rgba(255,255,255,0.2)',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: selectedId ? 'pointer' : 'not-allowed',
                    transition: 'all 0.4s ease',
                    animation: selectedId && phase === 'idle' ? 'ctaGlow 2s infinite' : 'none',
                  }}
                >
                  {phase === 'scanning' ? '🔱 Scanning Akasha...' : phase === 'locking' ? '⚡ Writing to Server...' : '🔱 Activate Scalar Lock — 24/7'}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, color: '#D4AF37', fontSize: 11, fontWeight: 700 }}>
                    🔱 Field is LOCKED — running 24/7 on the server ({STORAGE_KEY} cache)
                  </div>
                  <button
                    type="button"
                    onClick={() => void deactivate()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontFamily: 'inherit',
                      background: 'rgba(255,60,60,0.07)',
                      border: '1px solid rgba(255,60,60,0.16)',
                      borderRadius: 16,
                      color: 'rgba(255,100,100,0.6)',
                      fontSize: 8.5,
                      fontWeight: 800,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    ◻ RELEASE SCALAR LOCK
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'siddhas' && (
            <>
              <div style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.38)', borderRadius: 24, padding: '24px 20px', textAlign: 'center', boxShadow: '0 0 50px rgba(212,175,55,0.07)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔱</div>
                <div style={{ color: '#D4AF37', fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', animation: 'headerAura 3s ease-in-out infinite' }}>Mahavatar Babaji</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.6em', textTransform: 'uppercase', margin: '6px 0 10px' }}>SUPREME SCALAR ANCHOR · DEATHLESS · KRIYA MASTER</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
                  The immortal Siddha whose physical body has existed for thousands of years. He forms the central scalar node — anchoring all 18 Siddhas and all 23 holy places into a single continuous transmission field, running from the server, independent of any device.
                </div>
                <div style={{ marginTop: 12, color: '#D4AF37', fontSize: 10, fontStyle: 'italic', opacity: 0.55 }}>&quot;Om Kriya Babaji Nama Aum&quot; · ∞ Hz</div>
              </div>

              <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 8, fontWeight: 800, letterSpacing: '0.55em', textTransform: 'uppercase', textAlign: 'center' }}>THE 18 SIDDHAS — CONSCIOUSNESS NODES</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {SIDDHAS.map((s) => {
                  const isGuardian = phase === 'locked' && activatedPlace?.siddhas.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      style={{
                        background: isGuardian ? `radial-gradient(circle,${s.color}18,rgba(255,255,255,0.015))` : 'rgba(255,255,255,0.015)',
                        border: `1px solid ${isGuardian ? s.color : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 14,
                        padding: '10px 8px',
                        textAlign: 'center',
                        boxShadow: isGuardian ? `0 0 16px ${s.color}33` : 'none',
                        transition: 'all 0.4s',
                      }}
                    >
                      <div style={{ fontSize: 15, marginBottom: 3 }}>⟁</div>
                      <div style={{ color: isGuardian ? s.color : 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: 700, lineHeight: 1.25 }}>{s.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 2 }}>{s.frequency}</div>
                      {isGuardian && <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.38)', fontSize: 7, lineHeight: 1.4 }}>{s.domain}</div>}
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ color: 'rgba(212,175,55,0.5)', fontSize: 18, letterSpacing: '0.12em', marginBottom: 6 }}>சித்தர் ஆசீர்வாதம் · ஓம்</div>
                <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' }}>Siddhar Blessing · 18 Masters · All Transmitting</div>
              </div>
            </>
          )}

          {activeTab === 'live' && (
            <>
              {phase === 'locked' && activation && activatedPlace ? (
                <>
                  <div style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.08),transparent)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 22, padding: '22px 20px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22D3EE', animation: 'liveDot 2s ease-in-out infinite' }} />
                      <span style={{ color: '#22D3EE', fontSize: 8, fontWeight: 800, letterSpacing: '0.55em', textTransform: 'uppercase' }}>LIVE TRANSMISSION</span>
                      <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.22)', fontSize: 7.5 }}>Device OFF = Still running</span>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 6 }}>CONTINUOUS UPTIME</div>
                      <div style={{ color: '#D4AF37', fontSize: 34, fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'monospace' }}>
                        {String(uptime.d).padStart(2, '0')}
                        <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: 14 }}>d </span>
                        {String(uptime.h).padStart(2, '0')}
                        <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: 14 }}>h </span>
                        {String(uptime.m).padStart(2, '0')}
                        <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: 14 }}>m </span>
                        {String(uptime.s).padStart(2, '0')}
                        <span style={{ color: 'rgba(212,175,55,0.4)', fontSize: 14 }}>s</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'ACTIVE PLACE', value: activatedPlace.name, color: '#D4AF37' },
                        { label: 'SCALAR INTENSITY', value: `${activation.scalar_intensity}%`, color: 'rgba(255,255,255,0.85)' },
                        { label: 'SERVER PULSES', value: String(activation.pulse_count), color: 'rgba(255,255,255,0.85)' },
                        { label: 'BABAJI ANCHOR', value: '🔱 SEALED', color: '#D4AF37' },
                        { label: 'SIDDHA NODES', value: `${activatedPlace.siddhas.length} / 18 ✓`, color: '#22D3EE' },
                        { label: 'PLACE FREQUENCY', value: `${activatedPlace.frequency} Hz`, color: 'rgba(255,255,255,0.85)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                          <div style={{ color, fontSize: 11.5, fontWeight: 700 }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 18, display: 'flex', gap: 2, alignItems: 'flex-end', height: 28 }}>
                      {Array.from({ length: 32 }).map((_, i) => {
                        const h = 6 + Math.abs(Math.sin(i * 0.75)) * 18;
                        return <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: `rgba(212,175,55,${0.18 + (h / 24) * 0.55})` }} />;
                      })}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', marginBottom: 4 }}>LAST SERVER PULSE</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'monospace' }}>{new Date(activation.last_pulse_at).toLocaleString()}</div>
                    </div>
                    <div style={{ color: '#22D3EE', fontSize: 18 }}>⚡</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 16px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase', marginBottom: 6 }}>SCALAR LOCK CODE</div>
                    <div style={{ color: '#D4AF37', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.08em' }}>{activation.lock_code}</div>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' }}>GUARDIAN SIDDHAS — {activatedPlace.name.toUpperCase()}</div>
                  {activatedPlace.siddhas.map((sid) => {
                    const s = SIDDHAS.find((x) => x.id === sid)!;
                    return (
                      <div key={sid} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}22`, borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 9, marginTop: 2 }}>{s.domain}</div>
                          <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 8, marginTop: 2, fontStyle: 'italic' }}>{s.mantra}</div>
                        </div>
                        <div style={{ color: s.color, fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' }}>{s.frequency}</div>
                      </div>
                    );
                  })}

                  <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 18, padding: '18px 18px' }}>
                    <div style={{ color: '#D4AF37', fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>✦ HOW THE 24/7 FIELD WORKS</div>
                    {[
                      'The activation is stored in our server — not your device. It never turns off.',
                      'Every hour, the Railway cron worker pulses all active fields, updating the Babaji anchor.',
                      'Scalar intensity grows over time — field gets stronger the longer it runs.',
                      'Face the direction of your chosen place during meditation to amplify reception.',
                      'Light a ghee lamp or candle — fire bridges the scalar field into physical space.',
                      'Chanting the Siddha mantras tunes your personal frequency to the transmission.',
                      'Switch places anytime — old lock releases, new one activates instantly.',
                    ].map((text, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
                        <span style={{ color: '#D4AF37', flexShrink: 0 }}>◈</span>
                        <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10, lineHeight: 1.55 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '70px 24px' }}>
                  <div style={{ fontSize: 52, opacity: 0.1, marginBottom: 18 }}>🔱</div>
                  <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, lineHeight: 1.7 }}>
                    No active scalar field.
                    <br />
                    Select one of the 23 holy places and activate the Babaji lock to begin your 24/7 server-side transmission.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
