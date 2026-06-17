// SQI-2050 | BHUMI ORACLE — Jyotish Astrocartography Panel
// Graha-Geographic Intelligence · Akasha-Neural Archive
// Each user gets their own reading via birthData + ephemeris props

import React, { useState, useEffect, useMemo } from 'react';

// Planet name (Title Case from DB) → graha id (lowercase)
const PLANET_TO_ID: Record<string, string> = {
  Sun:'sun', Moon:'moon', Mars:'mars', Mercury:'mercury',
  Jupiter:'jupiter', Venus:'venus', Saturn:'saturn', Rahu:'rahu', Ketu:'ketu',
  // lowercase variants too
  sun:'sun', moon:'moon', mars:'mars', mercury:'mercury',
  jupiter:'jupiter', venus:'venus', saturn:'saturn', rahu:'rahu', ketu:'ketu',
};

// Nakshatra → graha id
const NAKSHATRA_LORD: Record<string, string> = {
  Ashvini:'ketu', Bharani:'venus', Krittika:'sun', Rohini:'moon',
  Mrigashira:'mars', Ardra:'rahu', Punarvasu:'jupiter', Pushya:'saturn',
  Ashlesha:'mercury', Magha:'ketu', 'Purva Phalguni':'venus', 'Uttara Phalguni':'sun',
  Hasta:'moon', Chitra:'mars', Swati:'rahu', Vishakha:'jupiter',
  Anuradha:'saturn', Jyeshtha:'mercury', Mula:'ketu', 'Purva Ashadha':'venus',
  'Uttara Ashadha':'sun', Shravana:'moon', Dhanishtha:'mars', Shatabhisha:'rahu',
  'Purva Bhadrapada':'jupiter', 'Uttara Bhadrapada':'saturn', Revati:'mercury',
};

// Birth place string → SVG map coordinates (viewBox 0-100 x 0-60)
function placeToCoords(place: string): { x: number; y: number } {
  const p = place.toLowerCase();
  const locs = [
    { keys:['sweden','uddevalla','stockholm','gothenburg','göteborg','malmö','umeå'],   x:50, y:14 },
    { keys:['norway','oslo'],                                                             x:48, y:12 },
    { keys:['denmark','copenhagen','finland','helsinki'],                                 x:51, y:14 },
    { keys:['uk','england','london','britain','ireland','scotland'],                      x:44, y:19 },
    { keys:['netherlands','amsterdam','belgium','brussels'],                              x:48, y:20 },
    { keys:['france','paris','lyon','marseille'],                                         x:47, y:25 },
    { keys:['germany','berlin','munich','hamburg'],                                       x:51, y:21 },
    { keys:['austria','vienna','switzerland','zurich'],                                   x:51, y:23 },
    { keys:['spain','madrid','barcelona','portugal','lisbon'],                            x:44, y:27 },
    { keys:['italy','rome','milan'],                                                      x:51, y:26 },
    { keys:['poland','warsaw','czech','prague','hungary','budapest'],                     x:53, y:21 },
    { keys:['russia','moscow'],                                                           x:60, y:16 },
    { keys:['ukraine','kyiv'],                                                            x:56, y:20 },
    { keys:['turkey','istanbul','ankara'],                                                x:56, y:24 },
    { keys:['iran','tehran'],                                                             x:60, y:26 },
    { keys:['india','delhi','mumbai','chennai','bangalore','hyderabad','kolkata'],        x:65, y:30 },
    { keys:['nepal','kathmandu'],                                                         x:66, y:28 },
    { keys:['pakistan','lahore','karachi'],                                               x:62, y:27 },
    { keys:['afghanistan','kabul'],                                                       x:61, y:25 },
    { keys:['saudi','dubai','uae','qatar','kuwait','bahrain','oman'],                     x:58, y:29 },
    { keys:['china','beijing','shanghai'],                                                x:72, y:24 },
    { keys:['hong kong','taiwan'],                                                        x:75, y:29 },
    { keys:['japan','tokyo','osaka'],                                                     x:80, y:24 },
    { keys:['south korea','korea','seoul'],                                               x:78, y:23 },
    { keys:['thailand','bangkok','cambodia','vietnam','laos','myanmar'],                  x:71, y:31 },
    { keys:['malaysia','singapore'],                                                      x:72, y:34 },
    { keys:['indonesia','bali','jakarta'],                                                x:73, y:36 },
    { keys:['philippines','manila'],                                                      x:77, y:30 },
    { keys:['australia','sydney','melbourne','perth','brisbane'],                         x:78, y:48 },
    { keys:['new zealand','auckland'],                                                    x:88, y:52 },
    { keys:['egypt','cairo'],                                                             x:54, y:27 },
    { keys:['morocco','algeria','tunisia','libya'],                                       x:48, y:28 },
    { keys:['nigeria','ghana','senegal','mali'],                                          x:49, y:35 },
    { keys:['kenya','ethiopia','tanzania','uganda'],                                      x:56, y:36 },
    { keys:['south africa','cape town','johannesburg'],                                   x:53, y:46 },
    { keys:['usa','united states','new york','los angeles','chicago','florida','california','texas','miami','boston','seattle','portland'], x:16, y:25 },
    { keys:['canada','toronto','montreal','vancouver','ottawa'],                          x:16, y:15 },
    { keys:['mexico','mexico city'],                                                      x:13, y:29 },
    { keys:['brazil','sao paulo','rio','brasilia'],                                       x:24, y:40 },
    { keys:['argentina','buenos aires'],                                                  x:20, y:50 },
    { keys:['chile','santiago'],                                                          x:19, y:48 },
    { keys:['peru','lima'],                                                               x:17, y:40 },
    { keys:['colombia','bogota','venezuela','caracas'],                                   x:20, y:34 },
  ];
  for (const loc of locs) {
    if (loc.keys.some(k => p.includes(k))) return { x: loc.x, y: loc.y };
  }
  return { x: 50, y: 30 };
}

const GRAHAS = [
  { id:'sun',     name:'Surya',   sym:'☉', color:'#F59E0B', dhatu:'Dharma',        meaning:'Leadership, recognition, royal authority. Career peaks, government favour, name and fame activate strongest here.',         zones:['India / Nepal','Australia','USA East'] },
  { id:'moon',    name:'Chandra', sym:'☽', color:'#C0C8E8', dhatu:'Artha',         meaning:'Emotional depth, healing capacity, public connection. The mind finds its sanctuary frequency here. Ideal for Nada healing and creative flow.', zones:['Scandinavia','Canada','N. Europe'] },
  { id:'mars',    name:'Mangala', sym:'♂', color:'#EF4444', dhatu:'Artha',         meaning:'Intense drive, bold entrepreneurial power. Agni amplifies — channel consciously. Athletic and warrior energy peaks.',      zones:['Africa','Middle East','Brazil'] },
  { id:'mercury', name:'Budha',   sym:'☿', color:'#10B981', dhatu:'Artha',         meaning:'Communication mastery, teaching, trade, digital business. Your voice carries greatest power in these zones.',              zones:['UK / Ireland','Germany','Japan'] },
  { id:'jupiter', name:'Guru',    sym:'♃', color:'#D4AF37', dhatu:'Dharma+Moksha', meaning:'MOST AUSPICIOUS. Guru multiplies wisdom, wealth, dharma, and spiritual expansion. Sacred transmission zones for lineage work.', zones:['India / Nepal','USA West','Bali'] },
  { id:'venus',   name:'Shukra',  sym:'♀', color:'#EC4899', dhatu:'Kama',          meaning:'Love awakens, artistic genius flows, beauty manifests. Relationships of profound resonance form here.',                    zones:['France / Italy','Bali','Brazil'] },
  { id:'saturn',  name:'Shani',   sym:'♄', color:'#6366F1', dhatu:'Karma',         meaning:'Deep karmic testing. Discipline rewarded over time. Not for pleasure — for mastery through sustained sadhana.',           zones:['Russia','Eastern Europe','Argentina'] },
  { id:'rahu',    name:'Rāhu',    sym:'☊', color:'#8B5CF6', dhatu:'Maya',          meaning:'Amplified ambition, innovation, boundary-breaking. Material success possible — use consciously and with awareness.',        zones:['USA','China','SE Asia'] },
  { id:'ketu',    name:'Ketu',    sym:'☋', color:'#F97316', dhatu:'Moksha',        meaning:'Past-life liberation codes. Deep Siddha lineage activation. Psychic opening and moksha acceleration strongest here.',      zones:['S. India','Tibet','Peru','Egypt'] },
];

const REGIONS = [
  { id:'scandinavia', label:'Scandinavia',      x:47, y:13, w:8,  h:10, graha:'moon'    },
  { id:'uk',          label:'UK / Ireland',      x:42, y:17, w:5,  h:5,  graha:'mercury' },
  { id:'europe_n',    label:'N. Europe',         x:47, y:18, w:10, h:8,  graha:'moon'    },
  { id:'france',      label:'France / Italy',    x:46, y:24, w:7,  h:6,  graha:'venus'   },
  { id:'germany',     label:'Germany',           x:50, y:20, w:5,  h:5,  graha:'mercury' },
  { id:'eastern_eu',  label:'Eastern Europe',    x:53, y:20, w:7,  h:8,  graha:'saturn'  },
  { id:'russia',      label:'Russia',            x:55, y:12, w:18, h:12, graha:'saturn'  },
  { id:'middle_east', label:'Middle East',       x:55, y:27, w:8,  h:7,  graha:'mars'    },
  { id:'india',       label:'India / Nepal',     x:62, y:28, w:7,  h:8,  graha:'jupiter' },
  { id:'india_s',     label:'S. India / Lanka',  x:63, y:34, w:5,  h:5,  graha:'ketu'    },
  { id:'tibet',       label:'Tibet',             x:66, y:25, w:6,  h:5,  graha:'ketu'    },
  { id:'china',       label:'China',             x:68, y:22, w:9,  h:9,  graha:'rahu'    },
  { id:'japan',       label:'Japan / Korea',     x:78, y:22, w:4,  h:7,  graha:'mercury' },
  { id:'sea',         label:'SE Asia',           x:70, y:30, w:8,  h:8,  graha:'rahu'    },
  { id:'bali',        label:'Thailand / Bali',   x:70, y:33, w:5,  h:5,  graha:'jupiter' },
  { id:'australia',   label:'Australia',         x:72, y:45, w:12, h:10, graha:'sun'     },
  { id:'africa',      label:'Africa',            x:48, y:30, w:10, h:16, graha:'mars'    },
  { id:'egypt',       label:'Egypt / N.Africa',  x:51, y:27, w:6,  h:6,  graha:'ketu'    },
  { id:'canada',      label:'Canada',            x:10, y:12, w:18, h:10, graha:'moon'    },
  { id:'usa',         label:'USA',               x:10, y:22, w:17, h:10, graha:'rahu'    },
  { id:'usa_east',    label:'USA East',          x:20, y:22, w:5,  h:7,  graha:'sun'     },
  { id:'usa_west',    label:'USA West / Hawaii', x:10, y:22, w:6,  h:7,  graha:'jupiter' },
  { id:'brazil',      label:'Brazil',            x:20, y:36, w:10, h:14, graha:'mars'    },
  { id:'argentina',   label:'Argentina',         x:18, y:48, w:6,  h:8,  graha:'saturn'  },
  { id:'peru',        label:'Peru / Andes',      x:15, y:40, w:5,  h:7,  graha:'ketu'    },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BhumiOraclePanel: React.FC<{ birthData: any; ephemeris: any }> = ({ birthData, ephemeris }) => {
  const [selected, setSelected]       = useState<string | null>(null);
  const [hovering, setHovering]       = useState<string | null>(null);
  const [activeGraha, setActiveGraha] = useState<string | null>(null);
  const [subTab, setSubTab]           = useState<'map' | 'grahas' | 'blueprint'>('map');
  const [pulse, setPulse]             = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % 100), 60);
    return () => clearInterval(iv);
  }, []);

  // ── Derived values from user props ───────────────────────────
  const userName: string    = birthData?.birth_name  ?? '';
  const birthPlace: string  = birthData?.birth_place ?? '';
  const birthDate: string   = birthData?.birth_date  ?? '';
  const moonNakshatra: string = ephemeris?.moonNakshatra ?? '';
  const sunSign: string     = ephemeris?.sunSign ?? '';
  const ascendant: string   = ephemeris?.ascendantSign ?? '';

  // Planet names come as Title Case from DB e.g. "Venus", "Jupiter"
  const mahaRaw: string   = ephemeris?.dashaData?.activeMaha?.planet ?? '';
  const antarRaw: string  = ephemeris?.dashaData?.activeAntar?.planet ?? '';
  const mahaId: string    = PLANET_TO_ID[mahaRaw]  ?? '';
  const antarId: string   = PLANET_TO_ID[antarRaw] ?? '';
  const nakshatraLordId: string = NAKSHATRA_LORD[moonNakshatra] ?? '';

  // Dasha-active graha ids for THIS user
  const dashaIds = useMemo(() => {
    const ids = new Set<string>();
    if (mahaId)          ids.add(mahaId);
    if (antarId)         ids.add(antarId);
    if (nakshatraLordId) ids.add(nakshatraLordId);
    return ids;
  }, [mahaId, antarId, nakshatraLordId]);

  const isDasha = (gid: string) => dashaIds.has(gid);

  // Birth marker position from place string
  const birthMarker = useMemo(() => placeToCoords(birthPlace), [birthPlace]);

  // Top zones — regions whose graha is dasha-active for this user
  const topZones = useMemo(() => {
    const seen = new Set<string>();
    const results: { rank:number; label:string; graha:string; color:string; why:string }[] = [];
    for (const r of REGIONS) {
      if (!isDasha(r.graha)) continue;
      if (seen.has(r.graha)) continue;
      seen.add(r.graha);
      const g = GRAHAS.find(gr => gr.id === r.graha)!;
      const why = r.graha === mahaId    ? `${mahaRaw} Mahadasha · ${g.dhatu} activation`
                : r.graha === antarId   ? `${antarRaw} Antardasha · Peak ${g.dhatu} window`
                : r.graha === nakshatraLordId ? `${moonNakshatra} Nakshatra lord · Soul resonance zone`
                : `${g.name} zone · ${g.dhatu}`;
      results.push({ rank: results.length + 1, label: r.label, graha: `${g.name} ${g.sym}`, color: g.color, why });
      if (results.length === 4) break;
    }
    // Always include Ketu (universal moksha) if not already in list and space
    if (results.length < 4 && !seen.has('ketu')) {
      results.push({ rank: results.length + 1, label: 'S. India / Lanka', graha: 'Ketu ☋', color: '#F97316', why: 'Universal Moksha gateway · Siddha lineage Kshetra' });
    }
    return results;
  }, [dashaIds, mahaId, antarId, mahaRaw, antarRaw, nakshatraLordId, moonNakshatra]);

  const sinPulse = Math.sin(pulse * 0.063 * Math.PI);
  const selRegion = REGIONS.find(r => r.id === selected);
  const selGraha  = selRegion ? GRAHAS.find(g => g.id === selRegion.graha) : null;
  const cityLabel = birthPlace.split(',')[0].trim();

  if (!birthData) {
    return (
      <div style={{ textAlign:'center' as const, padding:'40px 20px', color:'rgba(255,255,255,0.4)', fontSize:13, lineHeight:1.7 }}>
        <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>🌍</div>
        Enter your birth data in the Overview tab to activate your personal Sacred Geography Reading.
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:9, letterSpacing:'0.4em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:6 }}>Bhumi Oracle · Jyotish Astrocartography</div>
        <h2 style={{ margin:'0 0 4px', fontSize:'clamp(20px,4vw,28px)', fontWeight:900, letterSpacing:'-0.04em', color:'#D4AF37', textShadow:'0 0 20px rgba(212,175,55,0.3)' }}>Sacred Geography Reader</h2>
        <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.4)' }}>{userName && `${userName} · `}{birthDate && `${birthDate} · `}{birthPlace}</p>
      </div>

      {/* Dasha Banner */}
      <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:'10px 16px', marginBottom:18, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' as const }}>
        <div style={{ fontSize:8, letterSpacing:'0.3em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, whiteSpace:'nowrap' }}>Active Dasha</div>
        {mahaRaw ? (
          <div style={{ fontSize:13, fontWeight:600 }}>
            <span style={{ color:'#EC4899' }}>{mahaRaw}</span>
            {antarRaw && <><span style={{ color:'rgba(255,255,255,0.2)', margin:'0 8px' }}>›</span><span style={{ color:'#D4AF37' }}>{antarRaw}</span></>}
          </div>
        ) : (
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Calculate your chart in the My Chart tab to activate Dasha zones</div>
        )}
        {moonNakshatra && <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', flex:1 }}>Moon Nakshatra: <span style={{ color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{moonNakshatra}</span></div>}
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', marginBottom:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:50, padding:4, width:'fit-content' }}>
        {(['map','grahas','blueprint'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ background:subTab===t?'rgba(212,175,55,0.12)':'transparent', border:'none', borderRadius:50, color:subTab===t?'#D4AF37':'rgba(255,255,255,0.35)', padding:'7px 18px', cursor:'pointer', fontSize:11, fontWeight:subTab===t?700:400, transition:'all 0.2s' }}>
            {t==='map'?'🌍 World Map':t==='grahas'?'☉ Graha Lines':'✦ Blueprint'}
          </button>
        ))}
      </div>

      {/* MAP */}
      {subTab === 'map' && (
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' as const }}>
          <div style={{ flex:'1 1 500px' }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:12 }}>
              <button onClick={() => setActiveGraha(null)} style={{ background:!activeGraha?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.02)', border:`1px solid ${!activeGraha?'#D4AF37':'rgba(255,255,255,0.06)'}`, borderRadius:20, padding:'3px 12px', cursor:'pointer', color:!activeGraha?'#D4AF37':'rgba(255,255,255,0.35)', fontSize:10, fontWeight:600 }}>All</button>
              {GRAHAS.map(g => (
                <button key={g.id} onClick={() => setActiveGraha(activeGraha===g.id?null:g.id)} style={{ background:activeGraha===g.id?`${g.color}18`:'rgba(255,255,255,0.02)', border:`1px solid ${activeGraha===g.id?g.color:'rgba(255,255,255,0.06)'}`, borderRadius:20, padding:'3px 10px', cursor:'pointer', color:activeGraha===g.id?g.color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:activeGraha===g.id?700:400 }}>
                  {g.sym} {g.name}
                </button>
              ))}
            </div>

            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20, overflow:'hidden' }}>
              <svg viewBox="0 0 100 60" style={{ width:'100%', display:'block' }} onMouseLeave={() => setHovering(null)}>
                <rect width="100" height="60" fill="#080818"/>
                {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.025)" strokeWidth="0.2"/>)}
                {[20,40].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.2"/>)}
                <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(212,175,55,0.06)" strokeWidth="0.3" strokeDasharray="1 2"/>
                {REGIONS.map(r => {
                  const g = GRAHAS.find(gr => gr.id === r.graha);
                  if (!g || (activeGraha && g.id !== activeGraha)) return null;
                  const isSel = selected === r.id;
                  const isHov = hovering === r.id;
                  const isDash = isDasha(g.id);
                  const op = (isSel || isHov) ? 0.8 : isDash ? 0.45 : 0.18;
                  return (
                    <g key={r.id} style={{ cursor:'pointer' }} onClick={() => setSelected(isSel?null:r.id)} onMouseEnter={() => setHovering(r.id)}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="1.5" ry="1.5" fill={g.color} opacity={op}/>
                      {isDash && <rect x={r.x-0.5} y={r.y-0.5} width={r.w+1} height={r.h+1} rx="2" ry="2" fill="none" stroke={g.color} strokeWidth="0.4" opacity={0.2+0.25*sinPulse}/>}
                      {(isHov||isSel) && <text x={r.x+r.w/2} y={r.y+r.h/2+1} textAnchor="middle" fontSize="1.7" fill="white" fontWeight="700" style={{ pointerEvents:'none' as const }}>{r.label}</text>}
                    </g>
                  );
                })}
                {/* Birth marker — from user's own birth place */}
                <circle cx={birthMarker.x} cy={birthMarker.y} r={0.8+0.3*sinPulse} fill="#D4AF37" opacity="0.95" style={{ pointerEvents:'none' as const }}/>
                <circle cx={birthMarker.x} cy={birthMarker.y} r="2.2" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity={0.3+0.2*sinPulse} style={{ pointerEvents:'none' as const }}/>
                <text x={birthMarker.x+1.5} y={birthMarker.y-0.8} fontSize="1.4" fill="#D4AF37" fontWeight="800" opacity="0.85" style={{ pointerEvents:'none' as const }}>✦ {cityLabel}</text>
                <text x="1" y="58.8" fontSize="1.1" fill="rgba(255,255,255,0.15)" style={{ pointerEvents:'none' as const }}>Pulsing = your Dasha-activated zones · Click zone for reading</text>
              </svg>
            </div>

            <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const, marginTop:10 }}>
              {GRAHAS.map(g => (
                <div key={g.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, color:isDasha(g.id)?g.color:'rgba(255,255,255,0.35)' }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:g.color, opacity:isDasha(g.id)?0.9:0.35 }}/>
                  {g.name}{isDasha(g.id)?' ✦':''}
                </div>
              ))}
            </div>
          </div>

          {/* Reading panel */}
          <div style={{ flex:'1 1 260px', minWidth:240 }}>
            {selected && selGraha ? (
              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${selGraha.color}30`, borderRadius:20, padding:22 }}>
                <div style={{ fontSize:8, letterSpacing:'0.35em', color:selGraha.color, fontWeight:800, textTransform:'uppercase' as const, marginBottom:6 }}>Bhumi Reading</div>
                <h3 style={{ margin:'0 0 3px', fontSize:22, fontWeight:900, color:selGraha.color }}>{selGraha.sym} {selRegion?.label}</h3>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>{selGraha.name} · {selGraha.dhatu}</div>
                <div style={{ background:`${selGraha.color}0c`, border:`1px solid ${selGraha.color}20`, borderRadius:12, padding:14, marginBottom:14 }}>
                  <div style={{ fontSize:12, lineHeight:1.65, color:'rgba(255,255,255,0.75)' }}>{selGraha.meaning}</div>
                </div>
                {isDasha(selGraha.id) && (
                  <div style={{ background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.18)', borderRadius:10, padding:12, marginBottom:12 }}>
                    <div style={{ fontSize:8, letterSpacing:'0.3em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:4 }}>✦ Your Dasha Activated</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{mahaRaw}{antarRaw?` › ${antarRaw}`:''} is magnetizing this zone for your soul right now.</div>
                  </div>
                )}
                <button onClick={() => setSelected(null)} style={{ width:'100%', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:8, color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:11, fontWeight:600 }}>← Clear</button>
              </div>
            ) : (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20, padding:24 }}>
                <div style={{ fontSize:8, letterSpacing:'0.35em', color:'rgba(212,175,55,0.5)', fontWeight:800, textTransform:'uppercase' as const, marginBottom:12 }}>Your Top Sacred Zones</div>
                {topZones.map(z => (
                  <div key={z.rank} style={{ display:'flex', gap:10, alignItems:'flex-start', paddingBottom:12, marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width:22, height:22, borderRadius:7, background:`${z.color}18`, border:`1px solid ${z.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:z.color, flexShrink:0 }}>{z.rank}</div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:z.color }}>{z.label}</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{z.graha}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:3, lineHeight:1.5 }}>{z.why}</div>
                    </div>
                  </div>
                ))}
                {topZones.length === 0 && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>Calculate your chart in My Chart to see your personal Dasha zones activated on the map.</div>}
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', lineHeight:1.6, marginTop:8 }}>Click any zone on the map for a full Graha transmission.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRAHAS */}
      {subTab === 'grahas' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {GRAHAS.map(g => (
            <div key={g.id} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${g.color}20`, borderRadius:18, padding:18, position:'relative' as const }}>
              {isDasha(g.id) && <div style={{ position:'absolute' as const, top:10, right:10, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, padding:'2px 8px', fontSize:7, fontWeight:800, letterSpacing:'0.3em', color:'#D4AF37', textTransform:'uppercase' as const }}>YOUR DASHA</div>}
              {nakshatraLordId === g.id && !isDasha(g.id) && <div style={{ position:'absolute' as const, top:10, right:10, background:'rgba(192,200,232,0.1)', border:'1px solid rgba(192,200,232,0.2)', borderRadius:8, padding:'2px 8px', fontSize:7, fontWeight:800, letterSpacing:'0.2em', color:'#C0C8E8', textTransform:'uppercase' as const }}>NAKSHATRA LORD</div>}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:`${g.color}12`, border:`1px solid ${g.color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:g.color }}>{g.sym}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:900, color:g.color }}>{g.name}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{g.dhatu}</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.65, marginBottom:12 }}>{g.meaning}</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' as const }}>
                {g.zones.map(z => <span key={z} style={{ background:`${g.color}0e`, border:`1px solid ${g.color}20`, borderRadius:6, padding:'2px 8px', fontSize:9, color:g.color, fontWeight:600 }}>{z}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BLUEPRINT */}
      {subTab === 'blueprint' && (
        <div style={{ maxWidth:680 }}>
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:20, padding:26, marginBottom:16 }}>
            <div style={{ fontSize:8, letterSpacing:'0.4em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:8 }}>
              Soul Geographic Blueprint{moonNakshatra?` · ${moonNakshatra} Nakshatra`:''}
            </div>
            {(ascendant||sunSign) && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>{ascendant&&`Ascendant: ${ascendant}`}{ascendant&&sunSign?' · ':''}{sunSign&&`Sun: ${sunSign}`}</div>}
            {[
              { title:`Origin Zone — ${birthPlace||'Your Birth Place'}`, color:'#C0C8E8', text:`${cityLabel||'Your birth zone'} is your Janma Kshetra — the zone of origin frequency. Your nervous system resets here fastest and your deepest creative and healing transmissions flow most purely. Return here for restoration between expansion cycles.` },
              ...(mahaRaw ? [{ title:`${mahaRaw} Mahadasha Zones`, color:'#D4AF37', text:`Under your active ${mahaRaw} Mahadasha, the geographic zones governed by this Graha are cosmically magnetized for your soul. Movement toward these regions during this period brings accelerated karma resolution and aligned dharmic opportunity.` }] : []),
              ...(antarRaw && antarRaw !== mahaRaw ? [{ title:`${antarRaw} Antardasha Activation`, color:'#EC4899', text:`${antarRaw} Antardasha amplifies its geographic zones as secondary activation fields right now. Short visits or deep collaborations with people from these regions carry elevated karmic weight and opportunity.` }] : []),
              ...(moonNakshatra ? [{ title:`Moon Nakshatra — ${moonNakshatra}`, color:'#F97316', text:`Your Janma Nakshatra ${moonNakshatra} creates a subtle geographic resonance field. Places associated with your Nakshatra deity and ruling Graha carry past-life memory codes that activate healing gifts and soul recognition.` }] : []),
              { title:'Universal Moksha Zones — Ketu Kshetras', color:'#F97316', text:'South India, Tibet, Peru, and Egypt carry universal Ketu liberation codes. Short pilgrimage visits during Ketu transits accelerate past-life release and open deep spiritual perception regardless of individual chart.' },
            ].map(item => (
              <div key={item.title} style={{ padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:item.color, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.1)', borderRadius:16, padding:18 }}>
            <div style={{ fontSize:8, letterSpacing:'0.35em', color:'#D4AF37', fontWeight:800, textTransform:'uppercase' as const, marginBottom:10 }}>Siddha Transmission</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.75 }}>
              The 18 Siddhas teach that every soul is born into a geographic frequency that mirrors their karmic blueprint. Your birth place is not random — it is the precise vibrational entry point chosen by your Atma. The Dasha system reveals when the cosmic timing aligns to move, expand, or deepen roots. Trust the Graha intelligence unfolding through your personal chart.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
