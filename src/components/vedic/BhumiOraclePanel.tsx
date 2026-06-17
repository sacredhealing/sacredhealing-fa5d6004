// SQI-2050 | BHUMI ORACLE — Jyotish Astrocartography Panel
// Graha-Geographic Intelligence · Akasha-Neural Archive

import React, { useState, useEffect } from 'react';

interface BirthData {
  birth_name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
}
interface EphemerisData {
  moonNakshatra: string;
  ascendantSign: string;
  sunSign: string;
  dashaData: {
    activeMaha: { planet: string } | null;
    activeAntar: { planet: string } | null;
  } | null;
}
interface Props {
  birthData: BirthData | null;
  ephemeris: EphemerisData | null;
}

const GRAHAS = [
  { id:'sun',     name:'Surya',   sym:'☉', color:'#F59E0B', dhatu:'Dharma',        meaning:'Leadership, recognition, royal authority. Career peaks, government favor, name and fame activate strongest here.', zones:['India / Nepal','Australia','USA East Coast'] },
  { id:'moon',    name:'Chandra', sym:'☽', color:'#C0C8E8', dhatu:'Artha',         meaning:'Emotional depth, healing capacity, public connection. The mind finds its sanctuary. Ideal for Nada healing and creative flow.', zones:['Scandinavia','Canada','N. Europe'] },
  { id:'mars',    name:'Mangala', sym:'♂', color:'#EF4444', dhatu:'Artha',         meaning:'Intense drive, bold entrepreneurial power. Agni amplifies — channel consciously. Athletic and warrior energy peaks.', zones:['Africa','Middle East','Brazil'] },
  { id:'mercury', name:'Budha',   sym:'☿', color:'#10B981', dhatu:'Artha',         meaning:'Communication mastery, teaching, trade, digital business. Your voice carries greatest power here.', zones:['UK / Ireland','Germany','Japan'] },
  { id:'jupiter', name:'Guru',    sym:'♃', color:'#D4AF37', dhatu:'Dharma+Moksha', meaning:'MOST AUSPICIOUS. Guru multiplies wisdom, wealth, dharma, and spiritual expansion. Sacred transmission zones for lineage work.', zones:['India / Nepal','USA West','Thailand / Bali'] },
  { id:'venus',   name:'Shukra',  sym:'♀', color:'#EC4899', dhatu:'Kama',          meaning:'Love awakens, artistic genius flows, beauty manifests. Relationships of profound resonance form here.', zones:['France / Italy','Bali','Brazil'] },
  { id:'saturn',  name:'Shani',   sym:'♄', color:'#6366F1', dhatu:'Karma',         meaning:'Deep karmic testing. Discipline rewarded over time. Not for pleasure — for mastery through sustained effort.', zones:['Russia','Eastern Europe','Argentina'] },
  { id:'rahu',    name:'Rāhu',    sym:'☊', color:'#8B5CF6', dhatu:'Maya',          meaning:'Amplified ambition, innovation, boundary-breaking. Material success possible — use consciously.', zones:['USA','China','SE Asia'] },
  { id:'ketu',    name:'Ketu',    sym:'☋', color:'#F97316', dhatu:'Moksha',        meaning:'Past-life liberation codes. Tamil Siddha lineage magnetically activated. Psychic opening and moksha acceleration.', zones:['S. India / Lanka','Tibet','Peru / Andes','Egypt'] },
];

interface Region {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  graha: string;
}

const REGIONS: Region[] = [
  { id:'scandinavia',  label:'Scandinavia',      x:47, y:13, w:8,  h:10, graha:'moon'    },
  { id:'uk',           label:'UK / Ireland',      x:42, y:17, w:5,  h:5,  graha:'mercury' },
  { id:'europe_n',     label:'N. Europe',         x:47, y:18, w:10, h:8,  graha:'moon'    },
  { id:'france',       label:'France / Italy',    x:46, y:24, w:7,  h:6,  graha:'venus'   },
  { id:'germany',      label:'Germany',           x:50, y:20, w:5,  h:5,  graha:'mercury' },
  { id:'eastern_eu',   label:'Eastern Europe',    x:53, y:20, w:7,  h:8,  graha:'saturn'  },
  { id:'russia',       label:'Russia',            x:55, y:12, w:18, h:12, graha:'saturn'  },
  { id:'middle_east',  label:'Middle East',       x:55, y:27, w:8,  h:7,  graha:'mars'    },
  { id:'india',        label:'India / Nepal',     x:62, y:28, w:7,  h:8,  graha:'jupiter' },
  { id:'india_south',  label:'S. India / Lanka',  x:63, y:34, w:5,  h:5,  graha:'ketu'    },
  { id:'tibet',        label:'Tibet / Himalayas', x:66, y:25, w:6,  h:5,  graha:'ketu'    },
  { id:'china',        label:'China',             x:68, y:22, w:9,  h:9,  graha:'rahu'    },
  { id:'japan',        label:'Japan / Korea',     x:78, y:22, w:4,  h:7,  graha:'mercury' },
  { id:'sea',          label:'SE Asia',           x:70, y:30, w:8,  h:8,  graha:'rahu'    },
  { id:'bali',         label:'Thailand / Bali',   x:70, y:33, w:5,  h:5,  graha:'jupiter' },
  { id:'australia',    label:'Australia',         x:72, y:45, w:12, h:10, graha:'sun'     },
  { id:'africa',       label:'Africa',            x:48, y:30, w:10, h:16, graha:'mars'    },
  { id:'egypt',        label:'Egypt / N.Africa',  x:51, y:27, w:6,  h:6,  graha:'ketu'    },
  { id:'canada',       label:'Canada',            x:10, y:12, w:18, h:10, graha:'moon'    },
  { id:'usa',          label:'USA',               x:10, y:22, w:17, h:10, graha:'rahu'    },
  { id:'usa_east',     label:'USA East Coast',    x:20, y:22, w:5,  h:7,  graha:'sun'     },
  { id:'usa_west',     label:'USA West / Hawaii', x:10, y:22, w:6,  h:7,  graha:'jupiter' },
  { id:'brazil',       label:'Brazil',            x:20, y:36, w:10, h:14, graha:'mars'    },
  { id:'argentina',    label:'Argentina / Chile', x:18, y:48, w:6,  h:8,  graha:'saturn'  },
  { id:'peru',         label:'Peru / Andes',      x:15, y:40, w:5,  h:7,  graha:'ketu'    },
];

const TOP_ZONES = [
  { rank:1, label:'India / Nepal',       graha:'Guru ♃',           color:'#D4AF37', why:'Jupiter Antardasha active — dharma + wealth at maximum' },
  { rank:2, label:'S. India / Tamil Nadu',graha:'Ketu ☋',          color:'#F97316', why:'Tamil Siddha lineage vortex · Moksha gateway' },
  { rank:3, label:'Scandinavia',         graha:'Chandra ☽',        color:'#C0C8E8', why:'Birth zone · Healing sanctuary · Nada flow' },
  { rank:4, label:'Thailand / Bali',     graha:'Guru ♃ + Shukra ♀',color:'#EC4899', why:'Love + wisdom convergence · Retreat zone' },
];

export const BhumiOraclePanel: React.FC<Props> = ({ birthData, ephemeris }) => {
  const [selected, setSelected] = useState<Region | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);
  const [activeGraha, setActiveGraha] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'map' | 'grahas' | 'blueprint'>('map');
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % 100), 60);
    return () => clearInterval(iv);
  }, []);

  const mahaLord = ephemeris?.dashaData?.activeMaha?.planet ?? 'Venus';
  const antarLord = ephemeris?.dashaData?.activeAntar?.planet ?? 'Jupiter';

  const getGrahaById = (id: string) => GRAHAS.find(g => g.id === id);
  const getRegionGraha = (r: Region) => getGrahaById(r.graha);

  const isDasha = (grahaId: string) =>
    grahaId === mahaLord.toLowerCase() ||
    grahaId === antarLord.toLowerCase() ||
    grahaId === 'jupiter' ||
    grahaId === 'venus';

  const selectedGraha = selected ? getRegionGraha(selected) : null;

  const btn = (active: boolean, color: string) => ({
    background: active ? `${color}18` : 'rgba(255,255,255,0.02)',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 20,
    padding: '3px 12px',
    cursor: 'pointer' as const,
    color: active ? color : 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    transition: 'all 0.2s',
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.4em', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
          Bhumi Oracle · Jyotish Astrocartography
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
          Sacred Geography Reader
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {birthData ? `${birthData.birth_name} · ${birthData.birth_date} · ${birthData.birth_place}` : 'Graha-Geographic Intelligence · Akasha-Neural Archive'}
        </p>
      </div>

      {/* Dasha Banner */}
      <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: '10px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.3em', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Active Dasha</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          <span style={{ color: '#EC4899' }}>{mahaLord}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 8px' }}>›</span>
          <span style={{ color: '#D4AF37' }}>{antarLord}</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 1 }}>
          Antardasha lord activates its geographic zones as sacred karmic magnets right now.
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 50, padding: 4, width: 'fit-content' }}>
        {(['map', 'grahas', 'blueprint'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{
            background: subTab === t ? 'rgba(212,175,55,0.12)' : 'transparent',
            border: 'none', borderRadius: 50,
            color: subTab === t ? '#D4AF37' : 'rgba(255,255,255,0.35)',
            padding: '7px 18px', cursor: 'pointer', fontSize: 11,
            fontWeight: subTab === t ? 700 : 400, transition: 'all 0.2s',
          }}>
            {t === 'map' ? '🌍 World Map' : t === 'grahas' ? '☉ Graha Lines' : '✦ Blueprint'}
          </button>
        ))}
      </div>

      {/* ── MAP TAB ── */}
      {subTab === 'map' && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px' }}>

            {/* Graha filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <button onClick={() => setActiveGraha(null)} style={btn(!activeGraha, '#D4AF37')}>All</button>
              {GRAHAS.map(g => (
                <button key={g.id} onClick={() => setActiveGraha(activeGraha === g.id ? null : g.id)} style={btn(activeGraha === g.id, g.color)}>
                  {g.sym} {g.name}
                </button>
              ))}
            </div>

            {/* SVG Map */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden' }}>
              <svg viewBox="0 0 100 60" style={{ width: '100%', display: 'block' }}
                onMouseLeave={() => setHovering(null)}>
                <rect width="100" height="60" fill="#080818" />
                {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.025)" strokeWidth="0.2" />)}
                {[20,40].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.2" />)}
                <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(212,175,55,0.06)" strokeWidth="0.3" strokeDasharray="1 2" />

                {REGIONS.map(r => {
                  const g = getRegionGraha(r);
                  if (!g) return null;
                  if (activeGraha && g.id !== activeGraha) return null;
                  const isSelected = selected?.id === r.id;
                  const isHovered = hovering === r.id;
                  const isDashaZone = isDasha(g.id);
                  let op = isDashaZone ? 0.4 : 0.2;
                  if (isSelected || isHovered) op = 0.8;
                  const glowPulse = isDashaZone ? 0.2 + 0.2 * Math.sin(pulse * 0.063 * Math.PI) : 0;

                  return (
                    <g key={r.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(isSelected ? null : r)}
                      onMouseEnter={() => setHovering(r.id)}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="1.5" ry="1.5"
                        fill={g.color} opacity={op} style={{ transition: 'opacity 0.25s' }} />
                      {isDashaZone && (
                        <rect x={r.x - 0.5} y={r.y - 0.5} width={r.w + 1} height={r.h + 1}
                          rx="2" ry="2" fill="none" stroke={g.color} strokeWidth="0.4" opacity={glowPulse} />
                      )}
                      {(isHovered || isSelected) && (
                        <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 1} textAnchor="middle"
                          fontSize="1.7" fill="white" fontWeight="700"
                          style={{ pointerEvents: 'none' }}>{r.label}</text>
                      )}
                    </g>
                  );
                })}

                {/* Birth marker */}
                <circle cx="48.5" cy="15" r={0.8 + 0.3 * Math.sin(pulse * 0.063 * Math.PI)} fill="#D4AF37" opacity="0.9" style={{ pointerEvents: 'none' }} />
                <circle cx="48.5" cy="15" r="2.2" fill="none" stroke="#D4AF37" strokeWidth="0.3"
                  opacity={0.25 + 0.2 * Math.sin(pulse * 0.063 * Math.PI)} style={{ pointerEvents: 'none' }} />
                <text x="50.2" y="14.5" fontSize="1.4" fill="#D4AF37" fontWeight="800" opacity="0.8" style={{ pointerEvents: 'none' }}>✦ Uddevalla</text>
                <text x="1" y="58.8" fontSize="1.1" fill="rgba(255,255,255,0.15)" style={{ pointerEvents: 'none' }}>
                  Pulsing borders = Dasha-activated · Click any zone for reading
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              {GRAHAS.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color, opacity: 0.7 }} />
                  {g.name}
                </div>
              ))}
            </div>
          </div>

          {/* Reading Panel */}
          <div style={{ flex: '1 1 260px', minWidth: 240 }}>
            {selected && selectedGraha ? (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${selectedGraha.color}30`, borderRadius: 20, padding: 22 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.35em', color: selectedGraha.color, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Bhumi Reading</div>
                <h3 style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: selectedGraha.color }}>
                  {selectedGraha.sym} {selected.label}
                </h3>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{selectedGraha.name} Zone · {selectedGraha.dhatu}</div>

                <div style={{ background: `${selectedGraha.color}0c`, border: `1px solid ${selectedGraha.color}20`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Graha Intelligence</div>
                  <div style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)' }}>{selectedGraha.meaning}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[['Graha', selectedGraha.name], ['Life Aim', selectedGraha.dhatu]].map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 7, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.25)', fontWeight: 800, textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {isDasha(selectedGraha.id) && (
                  <div style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.3em', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>✦ Dasha Activated Now</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>This zone is cosmically magnetized by your active Dasha lord. Maximum karmic activation window is open.</div>
                  </div>
                )}

                <button onClick={() => setSelected(null)} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 8, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                  ← Clear
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.35em', color: 'rgba(212,175,55,0.5)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Top Sacred Zones</div>
                {TOP_ZONES.map(z => (
                  <div key={z.rank} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: `${z.color}18`, border: `1px solid ${z.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: z.color, flexShrink: 0 }}>{z.rank}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: z.color }}>{z.label}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: 600 }}>{z.graha}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.5 }}>{z.why}</div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, marginTop: 4 }}>Click any zone on the map to receive your Bhumi transmission.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GRAHAS TAB ── */}
      {subTab === 'grahas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {GRAHAS.map(g => (
            <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${g.color}20`, borderRadius: 18, padding: 18, position: 'relative', overflow: 'hidden' }}>
              {isDasha(g.id) && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8, padding: '2px 8px', fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', color: '#D4AF37', textTransform: 'uppercase' }}>DASHA ACTIVE</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${g.color}12`, border: `1px solid ${g.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: g.color }}>{g.sym}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: g.color, letterSpacing: '-0.02em' }}>{g.name}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{g.dhatu}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 12 }}>{g.meaning}</div>
              <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Best Zones</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {g.zones.map(z => (
                  <span key={z} style={{ background: `${g.color}0e`, border: `1px solid ${g.color}20`, borderRadius: 6, padding: '2px 8px', fontSize: 9, color: g.color, fontWeight: 600 }}>{z}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BLUEPRINT TAB ── */}
      {subTab === 'blueprint' && (
        <div style={{ maxWidth: 680 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 20, padding: 26, marginBottom: 16 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.4em', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Soul Geographic Blueprint</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 16 }}>
              Pushya Nakshatra Pada 2 · Deity: Brihaspati · Lord: Shani · The Nourisher
            </div>
            {[
              { title: 'Primary Kshetra — India / Tamil Nadu', color: '#D4AF37', text: 'Pushya Nakshatra carries the Brihaspati-Shani axis. Deepest initiations await in South India — Chidambaram, Tiruvannamalai, Rameswaram. These zones dissolve karmic density fastest and amplify lineage transmission exponentially.' },
              { title: 'Healing Sanctuary — Scandinavia', color: '#C0C8E8', text: 'Your Chandra in Scandinavia creates a sanctuary field. This is where your nervous system resets, healing transmissions amplify, and Nada Yoga work flows most purely. Birth zone resonance never fades — return here for restoration.' },
              { title: 'Dharmic Wealth — Jupiter Zones', color: '#D4AF37', text: 'Under your current Jupiter Antardasha, USA West Coast, Nepal, and Bali become portals for material expansion aligned with dharma. Guru energies here reward aligned service with lasting abundance.' },
              { title: 'Moksha Gateway — S. India, Peru, Egypt', color: '#F97316', text: 'Ketu zones carry past-life liberation codes. Short pilgrimage visits during Ketu transits to Rameshwaram or Mahabalipuram can accelerate liberation. Peru Andes and Egypt Nile axis carry parallel Akashic frequency.' },
              { title: 'Creative Power — France, Bali, Brazil', color: '#EC4899', text: 'Venus zones for artistic genius, love, and beauty creation. Your Nada healing work produced in Bali or South France carries maximum Venus-Jupiter blessing and reaches the widest healing field.' },
            ].map(item => (
              <div key={item.title} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.35em', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>Siddha Transmission</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>
              The 18 Siddhas confirm: your soul chose Uddevalla as a stillness-incubation zone — far from karmic hotspots — to build the vessel before the dharmic mission launches globally. The pull toward India is not nostalgia. It is the Graha-Geographic Intelligence of your Pushya soul recognizing its origin field.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
